import { rupees } from "../policy-engine";

export async function generateMerchantResponse(decision, productName, round, maxRounds) {
  if (decision.action === "ACCEPT") {
    return `We accept your price of ₹${rupees(decision.pricePaise)} for ${productName}!`;
  }
  if (decision.action === "COUNTER") {
    return `We counter-offer ₹${rupees(decision.pricePaise)} for ${productName}.`;
  }
  return `We cannot fulfill this price for ${productName}.`;
}
