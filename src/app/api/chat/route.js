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
          bestOffer: {
            pricePaise: session.agreedPrice,
            merchantName: session.product.merchant.name,
            productName: session.product.name,
            mrp: session.product.mrp,
            status: "ACCEPTED",
          },
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
          bestOffer: {
            pricePaise: agreed,
            merchantName: session.product.merchant.name,
            productName: session.product.name,
            mrp: session.product.mrp,
            status: "ACCEPTED",
          },
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

  // Construct multi-agent response text
  let agentBidsText = "🤖 **Multiple AI Merchant Agents Evaluated Your Query:**\n\n";
  ranked.forEach((r, idx) => {
    const p = r.product;
    const isLead = idx === 0;
    agentBidsText += `• **${p.merchant.name} AI Agent**: "${p.name} at ₹${rupees(p.sellingPrice)} (MRP ₹${rupees(p.mrp)}, ${p.warrantyMonths} Mo Warranty, ${p.deliveryDays}-Day Express Delivery)" ${isLead ? "⭐ *LEADING BID*" : ""}\n`;
  });

  agentBidsText += `\n🏆 **CURRENT BEST BID:** **${product.merchant.name}** offering **₹${rupees(product.sellingPrice)}**!`;
  agentBidsText += `\n\n*Make a counter-offer (e.g., ₹44,500) to force all merchant AI agents to submit lower bids!*`;

  return NextResponse.json({
    reply: agentBidsText,
    sessionId: session.id,
    parsed,
    product,
    bestOffer: {
      pricePaise: product.sellingPrice,
      merchantName: product.merchant.name,
      productName: product.name,
      mrp: product.mrp,
      warrantyMonths: product.warrantyMonths,
      deliveryDays: product.deliveryDays,
      inventory: product.inventory,
      currentRound: 1,
      maxRounds: product.maxRounds,
    },
    ranking: ranked.map((r) => ({
      productId: r.productId,
      name: r.product.name,
      merchant: r.product.merchant.name,
      sellingPrice: r.pricePaise,
      score: r.score,
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

  // Find all competing products in the same category or scope
  const competingProducts = await prisma.product.findMany({
    where: {
      active: true,
      category: session.product.category,
    },
    include: { merchant: true },
  });

  const allProducts = competingProducts.length > 0 ? competingProducts : [session.product];

  await logAudit(session.id, "CUSTOMER_OFFER", "CUSTOMER", {
    offerPaise,
    round,
    customerId: user?.id || null,
  });

  // Evaluate offer against ALL merchant AI agents
  const merchantResults = [];

  for (const prod of allProducts) {
    const policy = policyFromProduct(prod);
    const engine = new NegotiationEngine(policy);
    const decision = engine.processOffer({
      customerOfferPaise: offerPaise,
      round,
      previousMerchantOffer: prod.id === session.productId ? (session.lastMerchantOffer ?? prod.sellingPrice) : prod.sellingPrice,
    });

    const replyText = await generateMerchantResponse(decision, prod.name, round, prod.maxRounds);

    merchantResults.push({
      product: prod,
      decision,
      replyText,
    });
  }

  // Find the winning bid among merchant AI agents
  // Priority: ACCEPT > lowest COUNTER price > highest reliability
  const acceptedBids = merchantResults.filter((r) => r.decision.action === "ACCEPT");
  const counterBids = merchantResults.filter((r) => r.decision.action === "COUNTER");

  let winningResult = null;

  if (acceptedBids.length > 0) {
    winningResult = acceptedBids.sort((a, b) => a.product.sellingPrice - b.product.sellingPrice)[0];
  } else if (counterBids.length > 0) {
    winningResult = counterBids.sort((a, b) => a.decision.pricePaise - b.decision.pricePaise)[0];
  } else {
    winningResult = merchantResults[0];
  }

  const { product: winProduct, decision: winDecision } = winningResult;

  await logAudit(session.id, "NEGOTIATION_ROUND", "NEGOTIATION_ENGINE", winDecision, winDecision.explanation);

  let updatedStatus = "NEGOTIATING";
  let agreedPricePaise = null;

  if (winDecision.action === "ACCEPT") {
    updatedStatus = "AWAITING_APPROVAL";
    agreedPricePaise = offerPaise;

    await prisma.negotiationSession.update({
      where: { id: session.id },
      data: {
        productId: winProduct.id,
        currentRound: round,
        lastCustomerOffer: offerPaise,
        agreedPrice: offerPaise,
        status: "AWAITING_APPROVAL",
        customerApproved: false,
        offerExpiresAt: new Date(Date.now() + winProduct.offerValidityMinutes * 60_000),
      },
    });
    await logAudit(session.id, "OFFER_ACCEPTED", "NEGOTIATION_ENGINE", { price: offerPaise, merchant: winProduct.merchant.name });
  } else if (winDecision.action === "COUNTER") {
    updatedStatus = "NEGOTIATING";

    await prisma.negotiationSession.update({
      where: { id: session.id },
      data: {
        productId: winProduct.id,
        currentRound: round,
        lastCustomerOffer: offerPaise,
        lastMerchantOffer: winDecision.pricePaise,
        status: "NEGOTIATING",
      },
    });
    await logAudit(session.id, "COUNTER_OFFER", "NEGOTIATION_ENGINE", { price: winDecision.pricePaise, merchant: winProduct.merchant.name }, winDecision.explanation);
  } else {
    updatedStatus = "FAILED";
    await prisma.negotiationSession.update({
      where: { id: session.id },
      data: { currentRound: round, lastCustomerOffer: offerPaise, status: "FAILED", failureReason: winDecision.explanation },
    });
  }

  // Format multi-agent responses for the customer chat
  let multiAgentReply = `🤖 **Multi-Agent Merchant Bidding Results (Round ${round}/${winProduct.maxRounds}):**\n\n`;

  merchantResults.forEach((res) => {
    const isWinner = res.product.id === winProduct.id;
    const badge = isWinner ? "🏆 *BEST BID*" : "";
    multiAgentReply += `• **${res.product.merchant.name} AI Agent**: ${res.replyText} ${badge}\n\n`;
  });

  if (winDecision.action === "ACCEPT") {
    multiAgentReply += `🎉 **WINNING OFFER LOCKED:** **${winProduct.merchant.name}** accepted your price of **₹${rupees(offerPaise)}**! Click **Approve & Pay** to capture this deal via Razorpay.`;
  } else if (winDecision.action === "COUNTER") {
    multiAgentReply += `⭐ **CURRENT BEST BID:** **${winProduct.merchant.name}** counter-offers **₹${rupees(winDecision.pricePaise)}**!`;
  }

  return NextResponse.json({
    reply: multiAgentReply,
    sessionId: session.id,
    decision: {
      action: winDecision.action,
      price: winDecision.pricePaise,
      explanation: winDecision.explanation,
    },
    bestOffer: {
      pricePaise: winDecision.action === "ACCEPT" ? offerPaise : winDecision.pricePaise,
      merchantName: winProduct.merchant.name,
      productName: winProduct.name,
      mrp: winProduct.mrp,
      warrantyMonths: winProduct.warrantyMonths,
      deliveryDays: winProduct.deliveryDays,
      inventory: winProduct.inventory,
      currentRound: round,
      maxRounds: winProduct.maxRounds,
      status: winDecision.action,
    },
    awaitingApproval: winDecision.action === "ACCEPT",
    agreedPrice: winDecision.action === "ACCEPT" ? offerPaise : null,
    product: winProduct,
  });
}
