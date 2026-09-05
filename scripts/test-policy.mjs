/**
 * Comprehensive policy engine test suite.
 * Run with: node scripts/test-policy.mjs
 */
import { PolicyEngine } from "../src/lib/policy-engine.js";

const samplePolicy = {
  mrp: 5_000_000,           // ₹50,000
  sellingPrice: 4_800_000,   // ₹48,000
  minimumPrice: 4_400_000,   // ₹44,000
  maxDiscount: 500_000,      // ₹5,000 max discount from selling price
  minProfitMargin: 0.05,     // 5% min margin
  costPrice: 4_000_000,      // ₹40,000
  inventory: 10,
  maxRounds: 3,
};

const pe = new PolicyEngine(samplePolicy);
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAILED: ${message}`);
  }
}

// 1. Invalid amount test
const r1 = pe.validateCustomerOffer(-500, 1);
assert(r1.code === "INVALID_AMOUNT", `Expected INVALID_AMOUNT, got ${r1.code}`);

// 2. Above MRP test
const r2 = pe.validateCustomerOffer(6_000_000, 1);
assert(r2.code === "ABOVE_MRP", `Expected ABOVE_MRP, got ${r2.code}`);

// 3. Max rounds exceeded test
const r3 = pe.validateCustomerOffer(4_500_000, 4);
assert(r3.code === "MAX_ROUNDS_EXCEEDED", `Expected MAX_ROUNDS_EXCEEDED, got ${r3.code}`);

// 4. Out of stock test
const outOfStockEngine = new PolicyEngine({ ...samplePolicy, inventory: 0 });
const r4 = outOfStockEngine.validateCustomerOffer(4_500_000, 1);
assert(r4.code === "OUT_OF_STOCK", `Expected OUT_OF_STOCK, got ${r4.code}`);

// 5. Below minimum price test
const r5 = pe.validateCustomerOffer(4_300_000, 1);
assert(r5.code === "BELOW_MINIMUM", `Expected BELOW_MINIMUM, got ${r5.code}`);

// 6. Max discount exceeded test
const highDiscountPolicy = new PolicyEngine({ ...samplePolicy, maxDiscount: 200_000 }); // ₹2,000 max discount
const r6 = highDiscountPolicy.validateCustomerOffer(4_500_000, 1); // ₹3,000 discount requested
assert(r6.code === "MAX_DISCOUNT_EXCEEDED", `Expected MAX_DISCOUNT_EXCEEDED, got ${r6.code}`);

// 7. Min margin violated test
const lowMarginPolicy = new PolicyEngine({ ...samplePolicy, minProfitMargin: 0.20, costPrice: 3_800_000 });
const r7 = lowMarginPolicy.validateCustomerOffer(4_400_000, 1); // Margin = (4.4 - 3.8)/4.4 = 13.6% < 20%
assert(r7.code === "MIN_MARGIN_VIOLATED", `Expected MIN_MARGIN_VIOLATED, got ${r7.code}`);

// 8. Acceptable offer test
const r8 = pe.validateCustomerOffer(4_500_000, 1);
assert(r8.allowed === true && r8.code === "OFFER_ACCEPTABLE", `Expected OFFER_ACCEPTABLE, got ${r8.code}`);

// 9. Payment validation match test
const r9 = pe.validatePaymentAmount(4_500_000, 4_500_000);
assert(r9.allowed === true, `Expected allowed payment validation, got ${r9.code}`);

// 10. Payment validation mismatch test
const r10 = pe.validatePaymentAmount(4_400_000, 4_500_000);
assert(r10.code === "AMOUNT_MISMATCH", `Expected AMOUNT_MISMATCH, got ${r10.code}`);

// 11. Freshness test
const r11 = pe.validateOfferFreshness(new Date(Date.now() + 60000));
assert(r11.code === "OFFER_FRESH", `Expected OFFER_FRESH, got ${r11.code}`);
const r12 = pe.validateOfferFreshness(new Date(Date.now() - 60000));
assert(r12.code === "OFFER_EXPIRED", `Expected OFFER_EXPIRED, got ${r12.code}`);

console.log(`\nPolicyEngine Unit Tests: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
