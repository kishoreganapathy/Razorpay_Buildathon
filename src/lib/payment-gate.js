import { prisma } from "./db";
import { PolicyEngine, policyFromProduct } from "./policy-engine";
import { logAudit } from "./audit";
import { createRazorpayOrder } from "./razorpay";

/**
 * Money firewall. LLM never calls Razorpay.
 * Payment is created only after:
 *  - explicit customer approval
 *  - agreed price exists
 *  - offer not expired
 *  - inventory re-check
 *  - policy re-validation of amount
 */
export async function initiatePayment(sessionId, customerId) {
  const session = await prisma.negotiationSession.findUnique({
    where: { id: sessionId },
    include: { product: true },
  });

  if (!session) {
    return fail("Session not found", "NOT_FOUND");
  }

  if (customerId && session.customerId && session.customerId !== customerId) {
    await logAudit(sessionId, "LLM_ACTION_REJECTED", "PAYMENT_GATE", {}, "Wrong customer");
    return fail("This session belongs to another customer", "FORBIDDEN");
  }

  if (!session.customerApproved) {
    await logAudit(
      sessionId,
      "LLM_ACTION_REJECTED",
      "PAYMENT_GATE",
      {},
      "Payment blocked: no customer approval"
    );
    return fail("Customer approval required before payment", "NO_APPROVAL");
  }

  if (!session.agreedPrice) {
    return fail("No agreed price", "NO_PRICE");
  }

  if (session.status === "COMPLETED") {
    return fail("Order already paid", "ALREADY_PAID");
  }

  const policy = policyFromProduct(session.product);
  const engine = new PolicyEngine(policy);

  const freshness = engine.validateOfferFreshness(session.offerExpiresAt);
  if (!freshness.allowed) {
    await prisma.negotiationSession.update({
      where: { id: sessionId },
      data: { status: "EXPIRED", failureReason: freshness.reason },
    });
    await logAudit(sessionId, "PAYMENT_FAILURE", "PAYMENT_GATE", {}, freshness.reason);
    return fail(freshness.reason, freshness.code);
  }

  const invCheck = engine.validateInventory();
  if (!invCheck.allowed) {
    await prisma.negotiationSession.update({
      where: { id: sessionId },
      data: { status: "FAILED", failureReason: invCheck.reason },
    });
    await logAudit(
      sessionId,
      "INVENTORY_CHECK_FAIL",
      "PAYMENT_GATE",
      { inventory: session.product.inventory },
      invCheck.reason
    );
    return fail(invCheck.reason, invCheck.code);
  }

  const amountCheck = engine.validatePaymentAmount(session.agreedPrice, session.agreedPrice);
  if (!amountCheck.allowed) {
    await logAudit(
      sessionId,
      "LLM_ACTION_REJECTED",
      "PAYMENT_GATE",
      { amount: session.agreedPrice },
      amountCheck.reason
    );
    return fail(amountCheck.reason, amountCheck.code);
  }

  try {
    const rzpOrder = await createRazorpayOrder(session.agreedPrice, sessionId, {
      sessionId,
      productId: session.productId,
    });

    await prisma.negotiationSession.update({
      where: { id: sessionId },
      data: {
        status: "PAYMENT_PENDING",
        razorpayOrderId: rzpOrder.id,
        paymentStatus: "created",
        failureReason: null,
      },
    });

    const existing = await prisma.order.findFirst({
      where: { sessionId, status: "PENDING" },
    });

    const order = existing
      ? await prisma.order.update({
          where: { id: existing.id },
          data: { razorpayOrderId: rzpOrder.id, amount: session.agreedPrice },
        })
      : await prisma.order.create({
          data: {
            sessionId,
            amount: session.agreedPrice,
            status: "PENDING",
            razorpayOrderId: rzpOrder.id,
          },
        });

    await logAudit(sessionId, "PAYMENT_ORDER_CREATED", "PAYMENT_GATE", {
      razorpayOrderId: rzpOrder.id,
      amount: session.agreedPrice,
      orderId: order.id,
    });

    return {
      success: true,
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amount: session.agreedPrice,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Razorpay error";
    await prisma.negotiationSession.update({
      where: { id: sessionId },
      data: { status: "PAYMENT_PENDING", paymentStatus: "failed", failureReason: msg },
    });
    await logAudit(sessionId, "PAYMENT_FAILURE", "RAZORPAY", { error: msg }, msg);
    return fail(msg, "RAZORPAY_ERROR");
  }
}

function fail(error, code) {
  return { success: false, error, code };
}
