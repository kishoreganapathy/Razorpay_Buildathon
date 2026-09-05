import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseCustomerMessage, generateCustomerResponse } from "@/lib/llm/customer-agent";
import { generateMerchantResponse } from "@/lib/llm/merchant-agent";
import { searchProducts, rankOffers } from "@/lib/product-search";
import { NegotiationEngine } from "@/lib/negotiation-engine";
import { policyFromProduct, rupees } from "@/lib/policy-engine";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    const { message, sessionId } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    let session = sessionId
      ? await prisma.negotiationSession.findUnique({
          where: { id: sessionId },
          include: { product: { include: { merchant: true } } },
        })
      : null;

    const { parsed, source } = await parseCustomerMessage(message, {
      sessionStatus: session?.status,
      lastMerchantOffer: session?.lastMerchantOffer ?? undefined,
    });

    if (session) {
      await logAudit(session.id, "INTENT_EXTRACTED", "CUSTOMER_AI", { parsed, source, message });
    }

    if (parsed.is_approval || parsed.message_type === "approval") {
      if (!session) {
        return NextResponse.json({
          reply: "There is no active negotiation session. Search for a product first.",
          sessionId: null,
        });
      }

      if (session.status === "AWAITING_APPROVAL") {
        await prisma.negotiationSession.update({
          where: { id: session.id },
          data: { customerApproved: true, approvedAt: new Date() },
        });
        await logAudit(session.id, "CUSTOMER_APPROVAL", "CUSTOMER", {
          agreedPrice: session.agreedPrice,
          customerId: user?.id || null,
        });

        return NextResponse.json({
          reply: `Approved ₹${rupees(session.agreedPrice)}. Proceed to checkout — Razorpay will charge only this amount after a final backend check.`,
          sessionId: session.id,
          readyForPayment: true,
          awaitingApproval: true,
          agreedPrice: session.agreedPrice,
          product: session.product,
        });
      }

      if (session.status === "NEGOTIATING" && session.lastMerchantOffer) {
        const agreed = session.lastMerchantOffer;
        await prisma.negotiationSession.update({
          where: { id: session.id },
          data: {
            agreedPrice: agreed,
            status: "AWAITING_APPROVAL",
            customerApproved: true,
            approvedAt: new Date(),
          },
        });
        await logAudit(session.id, "OFFER_ACCEPTED", "CUSTOMER", { price: agreed });
        await logAudit(session.id, "CUSTOMER_APPROVAL", "CUSTOMER", {
          agreedPrice: agreed,
          customerId: user?.id || null,
        });

        return NextResponse.json({
          reply: `Accepted merchant offer of ₹${rupees(agreed)}. Proceed to checkout below.`,
          sessionId: session.id,
          readyForPayment: true,
          awaitingApproval: true,
          agreedPrice: agreed,
          product: session.product,
        });
      }

      return NextResponse.json({
        reply: "There is no active offer to approve. Search for a product or make an offer.",
        sessionId: session.id,
      });
    }

    const hasSearchSignal =
      parsed.message_type === "search" ||
      parsed.product_category ||
      (parsed.keywords && parsed.keywords.length > 0);

    if (!session && hasSearchSignal) {
      return await startSearch(message, parsed, source, user);
    }

    if (session && parsed.offer_amount_rupees) {
      return await handleOffer(session, parsed, user);
    }

    if (!session) {
      const reply = await generateCustomerResponse(
        "Ask the customer what they want to buy (category, size, budget).",
        message
      );
      return NextResponse.json({ reply, parsed, sessionId: null });
    }

    const facts = `Current session ${session.status}. Product ${session.product.name}. Selling ₹${rupees(session.product.sellingPrice)}. Last merchant offer ${session.lastMerchantOffer ? "₹" + rupees(session.lastMerchantOffer) : "none"}.`;
    const reply = await generateCustomerResponse(facts, message);
    return NextResponse.json({
      reply,
      sessionId: session.id,
      parsed,
      product: session.product,
      status: session.status,
    });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json(
      { error: "Server processing error: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}

async function startSearch(message, parsed, source, user) {
  const products = await searchProducts(parsed);
  if (!products.length) {
    const reply = await generateCustomerResponse(
      "No products matched the filters. Suggest they try TV or Laptop, or a higher budget.",
      message
    );
    return NextResponse.json({ reply, products: [], parsed });
  }

  const ranked = rankOffers(
    products.map((p) => ({
      merchantId: p.merchantId,
      productId: p.id,
      pricePaise: p.sellingPrice,
      deliveryDays: p.deliveryDays,
      warrantyMonths: p.warrantyMonths,
      reliabilityScore: p.reliabilityScore,
      product: p,
    })),
    parsed.budget ? parsed.budget * 100 : undefined
  );

  const winner = ranked[0];
  const product = winner.product;

  const session = await prisma.negotiationSession.create({
    data: {
      productId: product.id,
      customerId: user?.id || null,
      status: "NEGOTIATING",
      customerIntent: JSON.stringify(parsed),
      maxRounds: product.maxRounds,
      lastMerchantOffer: product.sellingPrice,
      offerExpiresAt: new Date(Date.now() + product.offerValidityMinutes * 60_000),
    },
    include: { product: { include: { merchant: true } } },
  });

  await logAudit(session.id, "CUSTOMER_REQUEST", "CUSTOMER", { message, parsed, source });
  await logAudit(session.id, "INTENT_EXTRACTED", "CUSTOMER_AI", { parsed, source });
  await logAudit(session.id, "PRODUCT_SELECTED", "SYSTEM", {
    productId: product.id,
    name: product.name,
    ranking: ranked.map((r) => ({
      productId: r.productId,
      score: r.score,
      breakdown: r.breakdown,
    })),
  });
  await logAudit(session.id, "POLICY_LOADED", "POLICY_ENGINE", {
    minimumPrice: product.minimumPrice,
    sellingPrice: product.sellingPrice,
    maxRounds: product.maxRounds,
    maxDiscount: product.maxDiscount,
    concessionMode: product.concessionMode,
  });

  const facts =
    `Selected ${product.name} from ${product.merchant.name}. ` +
    `Selling price ₹${rupees(product.sellingPrice)}, MRP ₹${rupees(product.mrp)}. ` +
    `Delivery ${product.deliveryDays} days, warranty ${product.warrantyMonths} months. ` +
    (ranked.length > 1
      ? `Transparent ranking picked this over ${ranked.length - 1} other candidate(s). Score ${winner.score.toFixed(3)} (price 40%, delivery 25%, warranty 20%, reliability 15%). `
      : "") +
    `Invite the customer to make an offer. Do not reveal the merchant minimum price.`;

  const reply = await generateCustomerResponse(facts, message);

  return NextResponse.json({
    reply,
    sessionId: session.id,
    parsed,
    product,
    ranking: ranked.map((r) => ({
      productId: r.productId,
      name: r.product.name,
      merchant: r.product.merchant.name,
      sellingPrice: r.pricePaise,
      score: r.score,
      breakdown: r.breakdown,
    })),
  });
}

async function handleOffer(session, parsed, user) {
  if (["COMPLETED", "FAILED", "EXPIRED"].includes(session.status)) {
    return NextResponse.json({
      reply: `This negotiation is ${session.status.toLowerCase()}. Start a new search.`,
      sessionId: session.id,
    });
  }

  const offerPaise = Math.round(Number(parsed.offer_amount_rupees) * 100);
  const round = session.currentRound + 1;
  const product = session.product;

  await logAudit(session.id, "CUSTOMER_OFFER", "CUSTOMER", {
    offerPaise,
    round,
    customerId: user?.id || null,
  });

  const policy = policyFromProduct(product);
  const engine = new NegotiationEngine(policy);
  const decision = engine.processOffer({
    customerOfferPaise: offerPaise,
    round,
    previousMerchantOffer: session.lastMerchantOffer ?? product.sellingPrice,
  });

  await logAudit(session.id, "NEGOTIATION_ROUND", "NEGOTIATION_ENGINE", decision, decision.explanation);

  if (!decision.validation.allowed && decision.action !== "COUNTER") {
    await logAudit(session.id, "POLICY_REJECT", "POLICY_ENGINE", decision.validation, decision.validation.reason);
  }

  if (decision.action === "ACCEPT") {
    await prisma.negotiationSession.update({
      where: { id: session.id },
      data: {
        currentRound: round,
        lastCustomerOffer: offerPaise,
        agreedPrice: offerPaise,
        status: "AWAITING_APPROVAL",
        customerApproved: false,
        offerExpiresAt: new Date(Date.now() + product.offerValidityMinutes * 60_000),
      },
    });
    await logAudit(session.id, "OFFER_ACCEPTED", "NEGOTIATION_ENGINE", { price: offerPaise });
  } else if (decision.action === "COUNTER") {
    await prisma.negotiationSession.update({
      where: { id: session.id },
      data: {
        currentRound: round,
        lastCustomerOffer: offerPaise,
        lastMerchantOffer: decision.pricePaise,
        status: "NEGOTIATING",
      },
    });
    await logAudit(session.id, "COUNTER_OFFER", "NEGOTIATION_ENGINE", { price: decision.pricePaise }, decision.explanation);
  } else {
    await prisma.negotiationSession.update({
      where: { id: session.id },
      data: { currentRound: round, lastCustomerOffer: offerPaise, status: "FAILED", failureReason: decision.explanation },
    });
  }

  const merchantReply = await generateMerchantResponse(
    decision,
    product.name,
    round,
    session.maxRounds
  );

  return NextResponse.json({
    reply: merchantReply,
    sessionId: session.id,
    decision: {
      action: decision.action,
      price: decision.pricePaise,
      explanation: decision.explanation,
    },
    awaitingApproval: decision.action === "ACCEPT",
    agreedPrice: decision.action === "ACCEPT" ? offerPaise : null,
    product,
  });
}
