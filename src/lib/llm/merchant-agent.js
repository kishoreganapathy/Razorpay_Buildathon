import { generateText } from "./client";
import { rupees } from "../policy-engine";

export async function generateMerchantResponse(decision, productName, round, maxRounds) {
  const facts = `
Product: ${productName}
Round: ${round}/${maxRounds}
Engine action: ${decision.action}
Price: ${decision.pricePaise ? `₹${rupees(decision.pricePaise)}` : "N/A"}
Explanation: ${decision.explanation}
Validation: ${decision.validation?.reason || ""}
`;

  const text = await generateText(
    `You are a merchant sales agent. Convert the negotiation engine decision into a short, friendly message.
NEVER change the price or action. NEVER offer a different number than the engine price.
If action is ACCEPT, congratulate and ask the customer to explicitly approve checkout.
If action is COUNTER, state the exact counter price in rupees.
If action is REJECT_FINAL, politely end negotiation and mention the reason.`,
    facts
  );

  if (text) return text;
  return fallbackMerchantCopy(decision, productName, round, maxRounds);
}

function fallbackMerchantCopy(decision, productName, round, maxRounds) {
  if (decision.action === "ACCEPT") {
    return `I can accept ₹${rupees(decision.pricePaise)} for the ${productName}. Please explicitly approve this final offer to continue to Razorpay checkout.`;
  }
  if (decision.action === "COUNTER") {
    return `₹${rupees(decision.pricePaise ? decision.pricePaise : 0)} is the best I can offer on round ${round}/${maxRounds} for the ${productName}. ${decision.explanation}`;
  }
  return `I cannot complete this deal. ${decision.explanation}`;
}
