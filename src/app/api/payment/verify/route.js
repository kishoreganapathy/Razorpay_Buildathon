import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req) {
  const { sessionId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    await req.json();

  const valid = verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!valid) {
    await logAudit(sessionId, "PAYMENT_FAILURE", "RAZORPAY", { reason: "Invalid signature" });
    await prisma.negotiationSession.update({
      where: { id: sessionId },
      data: {
        status: "PAYMENT_PENDING",
        paymentStatus: "failed",
        failureReason: "Invalid payment signature",
      },
    });
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  const session = await prisma.negotiationSession.findUnique({ where: { id: sessionId } });
  if (!session?.agreedPrice) {
    return NextResponse.json({ success: false, error: "Invalid session" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { sessionId, razorpayOrderId: razorpay_order_id },
  });
  if (!order || order.amount !== session.agreedPrice) {
    await logAudit(sessionId, "PAYMENT_FAILURE", "PAYMENT_GATE", { tamper: true });
    return NextResponse.json({ success: false, error: "Amount mismatch" }, { status: 400 });
  }

  if (session.status === "COMPLETED") {
    return NextResponse.json({ success: true, alreadyPaid: true });
  }

  await prisma.$transaction([
    prisma.negotiationSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        paymentStatus: "captured",
        razorpayPaymentId: razorpay_payment_id,
        failureReason: null,
      },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", razorpayPaymentId: razorpay_payment_id },
    }),
    prisma.product.update({
      where: { id: session.productId },
      data: { inventory: { decrement: 1 } },
    }),
  ]);

  await logAudit(sessionId, "PAYMENT_SUCCESS", "RAZORPAY", {
    razorpay_payment_id,
    amount: session.agreedPrice,
  });

  return NextResponse.json({ success: true });
}
