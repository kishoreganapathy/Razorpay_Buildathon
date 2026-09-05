import { z } from "zod";
import { generateJson, generateText } from "./client";

const IntentSchema = z.object({
  product_category: z.string().optional(),
  size: z.string().optional(),
  budget: z.number().optional(),
  preferred_delivery: z.string().optional(),
  warranty_preference: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  offer_amount_rupees: z.number().optional(),
  is_approval: z.boolean().optional(),
  message_type: z.enum(["search", "offer", "approval", "general"]).default("general"),
});

export async function parseCustomerMessage(message, context = {}) {
  const fallback = fallbackParse(message, context);

  try {
    const raw = await generateJson(
      `Extract structured shopping intent from the customer message.
DO NOT invent prices or make purchase decisions.
If the customer mentions a price they want to pay, put it in offer_amount_rupees as a number (rupees, not paise).
If they confirm/approve a deal, set is_approval=true and message_type=approval.
Return JSON with keys: product_category, size, budget, preferred_delivery, warranty_preference, keywords, offer_amount_rupees, is_approval, message_type.
message_type must be one of search, offer, approval, general.
Context: ${JSON.stringify(context)}`,
      message
    );
    if (!raw) return { parsed: fallback, source: "fallback" };
    const parsed = IntentSchema.parse(raw);
    return { parsed: { ...fallback, ...parsed }, source: "gemini" };
  } catch {
    return { parsed: fallback, source: "fallback" };
  }
}

export async function generateCustomerResponse(systemFacts, userMessage) {
  const text = await generateText(
    `You are a shopping assistant for NegotiatePay.
ONLY explain facts given to you. NEVER invent prices, discounts, or payment actions.
Never claim a payment succeeded. Facts from backend:\n${systemFacts}`,
    userMessage
  );
  return text || systemFacts;
}

function fallbackParse(message, context) {
  const text = message.toLowerCase();
  const parsed = {
    keywords: [],
    message_type: "general",
    is_approval: false,
  };

  const approval =
    /^(yes|ok|okay|approve|confirm|deal|i agree|go ahead|pay)\b/.test(text) ||
    text.includes("i approve") ||
    text.includes("let's buy") ||
    text.includes("lets buy");
  if (approval && (context.sessionStatus === "AWAITING_APPROVAL" || context.sessionStatus === "NEGOTIATING")) {
    parsed.is_approval = true;
    parsed.message_type = "approval";
  }

  const offerMatch =
    text.match(/(?:offer|pay|for|at|₹|rs\.?)\s*([0-9]{2,7}(?:,[0-9]{3})*)/) ||
    text.match(/\b([0-9]{4,7})\b/);
  if (offerMatch && !parsed.is_approval) {
    const amount = Number(String(offerMatch[1]).replace(/,/g, ""));
    if (amount >= 1000) {
      parsed.offer_amount_rupees = amount;
      parsed.message_type = "offer";
    }
  }

  if (text.includes("tv") || text.includes("television")) {
    parsed.product_category = "TV";
    parsed.keywords.push("tv");
    parsed.message_type = parsed.message_type === "offer" ? "offer" : "search";
  }
  if (text.includes("laptop")) {
    parsed.product_category = "Laptop";
    parsed.keywords.push("laptop");
    parsed.message_type = parsed.message_type === "offer" ? "offer" : "search";
  }

  const size = text.match(/(\d{2})\s*-?\s*inch/);
  if (size) parsed.size = `${size[1]} inch`;

  const budget = text.match(/under\s*₹?\s*([0-9]{4,7}(?:,[0-9]{3})*)/);
  if (budget) parsed.budget = Number(String(budget[1]).replace(/,/g, ""));

  if (text.includes("fast delivery") || text.includes("quick delivery")) {
    parsed.preferred_delivery = "fast";
  }
  if (text.includes("warranty")) parsed.warranty_preference = "high";

  if (text.includes("4k")) parsed.keywords.push("4k");

  return parsed;
}
