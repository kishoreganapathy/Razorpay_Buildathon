import { prisma } from "./db";

/**
 * Deterministic catalog search. Never send the full catalog to the LLM.
 */
export async function searchProducts(intent, merchantId) {
  const budgetPaise = intent.budget ? Math.round(Number(intent.budget) * 100) : undefined;

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(merchantId ? { merchantId } : {}),
      ...(intent.product_category
        ? { category: { contains: intent.product_category } }
        : {}),
      ...(budgetPaise ? { minimumPrice: { lte: budgetPaise } } : {}),
    },
    include: { merchant: true },
  });

  return products.filter((p) => matchesAttributes(p, intent));
}

function matchesAttributes(product, intent) {
  let attrs = {};
  try {
    attrs = JSON.parse(product.attributes || "{}");
  } catch {
    attrs = {};
  }

  if (intent.size && attrs.size) {
    const wanted = String(intent.size).toLowerCase().replace(/\s+/g, "");
    const have = String(attrs.size).toLowerCase().replace(/\s+/g, "");
    if (!have.includes(wanted) && !wanted.includes(have)) {
      return false;
    }
  }

  if (intent.keywords?.length) {
    const haystack = `${product.name} ${product.description} ${product.category} ${JSON.stringify(attrs)}`.toLowerCase();
    const hit = intent.keywords.some((k) => haystack.includes(String(k).toLowerCase()));
    if (!hit) return false;
  }

  return true;
}

export function rankOffers(offers, budgetPaise) {
  const budget = budgetPaise || Math.max(...offers.map((o) => o.pricePaise), 1);
  return offers
    .map((o) => {
      const priceScore = Math.max(0, 1 - o.pricePaise / budget);
      const deliveryScore = Math.max(0, 1 - o.deliveryDays / 14);
      const warrantyScore = Math.min(1, o.warrantyMonths / 36);
      const reliability = o.reliabilityScore ?? 0.8;
      const score =
        priceScore * 0.4 +
        deliveryScore * 0.25 +
        warrantyScore * 0.2 +
        reliability * 0.15;
      return {
        ...o,
        score,
        breakdown: {
          price: 0.4,
          delivery: 0.25,
          warranty: 0.2,
          reliability: 0.15,
          priceScore,
          deliveryScore,
          warrantyScore,
          reliability,
        },
      };
    })
    .sort((a, b) => b.score - a.score);
}
