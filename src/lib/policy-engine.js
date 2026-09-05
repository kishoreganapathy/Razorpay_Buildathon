/**
 * Deterministic merchant policy engine.
 * The LLM never calls this with a "proposed price to honour".
 * Every offer and every payment amount is validated here first.
 */
export class PolicyEngine {
  constructor(policy) {
    this.policy = policy;
  }

  validateCustomerOffer(offerPaise, round) {
    const p = this.policy;

    if (!Number.isInteger(offerPaise) || offerPaise <= 0) {
      return {
        allowed: false,
        code: "INVALID_AMOUNT",
        reason: "Offer must be a positive integer amount in paise.",
      };
    }

    if (round > p.maxRounds) {
      return {
        allowed: false,
        code: "MAX_ROUNDS_EXCEEDED",
        reason: `Maximum negotiation rounds (${p.maxRounds}) exceeded.`,
      };
    }

    if (p.inventory <= 0) {
      return {
        allowed: false,
        code: "OUT_OF_STOCK",
        reason: "Product is out of stock.",
      };
    }

    if (offerPaise > p.mrp) {
      return {
        allowed: false,
        code: "ABOVE_MRP",
        reason: `Offer exceeds MRP of ₹${rupees(p.mrp)}.`,
      };
    }

    if (offerPaise < p.minimumPrice) {
      return {
        allowed: false,
        code: "BELOW_MINIMUM",
        reason: `Offer ₹${rupees(offerPaise)} is below minimum acceptable ₹${rupees(p.minimumPrice)}.`,
        metadata: { offer: offerPaise, minimum: p.minimumPrice },
      };
    }

    const discountFromSelling = p.sellingPrice - offerPaise;
    if (discountFromSelling > p.maxDiscount) {
      return {
        allowed: false,
        code: "MAX_DISCOUNT_EXCEEDED",
        reason: `Discount of ₹${rupees(discountFromSelling)} exceeds max allowed ₹${rupees(p.maxDiscount)}.`,
        metadata: { discountFromSelling, maxDiscount: p.maxDiscount },
      };
    }

    if (p.costPrice > 0) {
      const profit = offerPaise - p.costPrice;
      const margin = profit / offerPaise;
      if (margin < p.minProfitMargin) {
        return {
          allowed: false,
          code: "MIN_MARGIN_VIOLATED",
          reason: `Profit margin ${(margin * 100).toFixed(1)}% is below minimum ${(p.minProfitMargin * 100).toFixed(1)}%.`,
          metadata: { margin, minMargin: p.minProfitMargin },
        };
      }
    }

    return {
      allowed: true,
      code: "OFFER_ACCEPTABLE",
      reason: `Offer ₹${rupees(offerPaise)} meets minimum ₹${rupees(p.minimumPrice)}.`,
    };
  }

  validatePaymentAmount(amountPaise, agreedPrice) {
    if (amountPaise !== agreedPrice) {
      return {
        allowed: false,
        code: "AMOUNT_MISMATCH",
        reason: `Payment amount ₹${rupees(amountPaise)} does not match agreed ₹${rupees(agreedPrice)}.`,
      };
    }
    return this.validateCustomerOffer(amountPaise, 1);
  }

  validateInventory() {
    if (this.policy.inventory <= 0) {
      return {
        allowed: false,
        code: "OUT_OF_STOCK",
        reason: "No inventory available at payment time.",
      };
    }
    return {
      allowed: true,
      code: "INVENTORY_OK",
      reason: `${this.policy.inventory} unit(s) available.`,
    };
  }

  validateOfferFreshness(expiresAt) {
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return {
        allowed: false,
        code: "OFFER_EXPIRED",
        reason: "The negotiated offer has expired. Start a new negotiation.",
      };
    }
    return { allowed: true, code: "OFFER_FRESH", reason: "Offer is still valid." };
  }
}

export function policyFromProduct(product) {
  return {
    productId: product.id,
    mrp: product.mrp,
    sellingPrice: product.sellingPrice,
    minimumPrice: product.minimumPrice,
    maxDiscount: product.maxDiscount,
    minProfitMargin: product.minProfitMargin,
    costPrice: product.costPrice,
    inventory: product.inventory,
    maxRounds: product.maxRounds,
    offerValidityMinutes: product.offerValidityMinutes,
    concessionMode: product.concessionMode,
    concessionSchedule: product.concessionSchedule,
  };
}

export function rupees(paise) {
  return (paise / 100).toLocaleString("en-IN");
}
