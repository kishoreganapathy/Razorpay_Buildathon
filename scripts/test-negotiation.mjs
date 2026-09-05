/**
 * Standalone expected-behaviour checks for PolicyEngine and NegotiationEngine.
 * Engine source of truth: src/lib/negotiation-engine.js & src/lib/policy-engine.js
 */
import { PolicyEngine } from "../src/lib/policy-engine.js";
import { NegotiationEngine } from "../src/lib/negotiation-engine.js";

const policy = {
  mrp: 5_000_000,          // ₹50,000
  sellingPrice: 4_800_000,  // ₹48,000
  minimumPrice: 4_400_000,  // ₹44,000
  maxDiscount: 1_000_000,   // ₹10,000
  minProfitMargin: 0.05,    // 5%
  costPrice: 4_000_000,     // ₹40,000
  inventory: 10,
  maxRounds: 3,
};

const pe = new PolicyEngine(policy);
const v1 = pe.validateCustomerOffer(4_000_000, 1);
const v3 = pe.validateCustomerOffer(4_450_000, 3);

if (v1.code !== "BELOW_MINIMUM") {
  console.error("❌ expected BELOW_MINIMUM for 40000, got:", v1);
  process.exit(1);
}
if (v3.code !== "OFFER_ACCEPTABLE") {
  console.error("❌ expected OFFER_ACCEPTABLE for 44500, got:", v3);
  process.exit(1);
}

// Test NegotiationEngine with Schedule Mode
const schedulePolicy = {
  ...policy,
  concessionMode: "SCHEDULE",
  concessionSchedule: JSON.stringify([4_700_000, 4_550_000, 4_400_000]),
};

const engine = new NegotiationEngine(schedulePolicy);
const round1 = engine.processOffer({ customerOfferPaise: 4_000_000, round: 1, previousMerchantOffer: 4_800_000 });
if (round1.action !== "COUNTER" || round1.pricePaise !== 4_700_000) {
  console.error("❌ expected round 1 COUNTER of 4700000, got:", round1);
  process.exit(1);
}

const round2 = engine.processOffer({ customerOfferPaise: 4_200_000, round: 2, previousMerchantOffer: 4_700_000 });
if (round2.action !== "COUNTER" || round2.pricePaise !== 4_550_000) {
  console.error("❌ expected round 2 COUNTER of 4550000, got:", round2);
  process.exit(1);
}

const round3 = engine.processOffer({ customerOfferPaise: 4_450_000, round: 3, previousMerchantOffer: 4_550_000 });
if (round3.action !== "ACCEPT" || round3.pricePaise !== 4_450_000) {
  console.error("❌ expected round 3 ACCEPT of 4450000, got:", round3);
  process.exit(1);
}

console.log("✅ Negotiation engine & schedule checks passed successfully.");
