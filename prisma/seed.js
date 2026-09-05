const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const merchantPassword = await bcrypt.hash("merchant123", 10);
  const customerPassword = await bcrypt.hash("customer123", 10);

  // 1. Merchant 1: Apex Electronics
  const m1User = await prisma.user.upsert({
    where: { email: "merchant@demo.com" },
    update: {},
    create: {
      email: "merchant@demo.com",
      name: "Apex Electronics",
      role: "MERCHANT",
      passwordHash: merchantPassword,
    },
  });

  const m1 = await prisma.merchant.upsert({
    where: { email: "merchant@demo.com" },
    update: { name: "Apex Electronics" },
    create: {
      userId: m1User.id,
      name: "Apex Electronics",
      email: "merchant@demo.com",
    },
  });

  // 2. Merchant 2: Nexus Digital Store
  const m2User = await prisma.user.upsert({
    where: { email: "nexus@demo.com" },
    update: {},
    create: {
      email: "nexus@demo.com",
      name: "Nexus Digital Store",
      role: "MERCHANT",
      passwordHash: merchantPassword,
    },
  });

  const m2 = await prisma.merchant.upsert({
    where: { email: "nexus@demo.com" },
    update: { name: "Nexus Digital Store" },
    create: {
      userId: m2User.id,
      name: "Nexus Digital Store",
      email: "nexus@demo.com",
    },
  });

  // 3. Merchant 3: CyberTech Electronics
  const m3User = await prisma.user.upsert({
    where: { email: "cybertech@demo.com" },
    update: {},
    create: {
      email: "cybertech@demo.com",
      name: "CyberTech Electronics",
      role: "MERCHANT",
      passwordHash: merchantPassword,
    },
  });

  const m3 = await prisma.merchant.upsert({
    where: { email: "cybertech@demo.com" },
    update: { name: "CyberTech Electronics" },
    create: {
      userId: m3User.id,
      name: "CyberTech Electronics",
      email: "cybertech@demo.com",
    },
  });

  // Customer Account
  await prisma.user.upsert({
    where: { email: "customer@demo.com" },
    update: {},
    create: {
      email: "customer@demo.com",
      name: "Demo Customer",
      role: "CUSTOMER",
      passwordHash: customerPassword,
    },
  });

  // --- Seed TVs for Multi-Agent Bidding ---
  
  // Apex 55" TV
  const existingTv1 = await prisma.product.findFirst({
    where: { merchantId: m1.id, name: "Apex 55-inch 4K LED TV" },
  });
  if (!existingTv1) {
    await prisma.product.create({
      data: {
        merchantId: m1.id,
        name: "Apex 55-inch 4K LED TV",
        category: "TV",
        description: "55-inch 4K Ultra HD smart TV with 2-year warranty and 2-day express delivery.",
        attributes: JSON.stringify({ size: "55 inch", resolution: "4K" }),
        mrp: 5_000_000,
        sellingPrice: 4_800_000,
        minimumPrice: 4_400_000,
        maxDiscount: 400_000,
        minProfitMargin: 0.08,
        costPrice: 4_000_000,
        inventory: 10,
        maxRounds: 3,
        offerValidityMinutes: 10,
        concessionMode: "SCHEDULE",
        concessionSchedule: JSON.stringify([4_700_000, 4_550_000, 4_400_000]),
        warrantyMonths: 24,
        deliveryDays: 2,
        reliabilityScore: 0.9,
      },
    });
  }

  // Nexus 55" TV
  const existingTv2 = await prisma.product.findFirst({
    where: { merchantId: m2.id, name: "Nexus 55-inch Ultra HD Smart TV" },
  });
  if (!existingTv2) {
    await prisma.product.create({
      data: {
        merchantId: m2.id,
        name: "Nexus 55-inch Ultra HD Smart TV",
        category: "TV",
        description: "Premium 55-inch 4K HDR TV with Dolby Audio and 3-year warranty.",
        attributes: JSON.stringify({ size: "55 inch", resolution: "4K" }),
        mrp: 5_200_000,
        sellingPrice: 4_750_000,
        minimumPrice: 4_350_000,
        maxDiscount: 450_000,
        minProfitMargin: 0.07,
        costPrice: 3_900_000,
        inventory: 8,
        maxRounds: 3,
        offerValidityMinutes: 10,
        concessionMode: "LINEAR",
        warrantyMonths: 36,
        deliveryDays: 3,
        reliabilityScore: 0.92,
      },
    });
  }

  // CyberTech 55" TV
  const existingTv3 = await prisma.product.findFirst({
    where: { merchantId: m3.id, name: "CyberTech 55-inch QLED 4K TV" },
  });
  if (!existingTv3) {
    await prisma.product.create({
      data: {
        merchantId: m3.id,
        name: "CyberTech 55-inch QLED 4K TV",
        category: "TV",
        description: "Next-gen QLED 55-inch 4K TV with 120Hz refresh rate and game mode.",
        attributes: JSON.stringify({ size: "55 inch", resolution: "4K" }),
        mrp: 5_500_000,
        sellingPrice: 4_900_000,
        minimumPrice: 4_450_000,
        maxDiscount: 450_000,
        minProfitMargin: 0.1,
        costPrice: 4_100_000,
        inventory: 6,
        maxRounds: 3,
        offerValidityMinutes: 10,
        concessionMode: "LINEAR",
        warrantyMonths: 24,
        deliveryDays: 1,
        reliabilityScore: 0.88,
      },
    });
  }

  // --- Seed Laptops for Multi-Agent Bidding ---
  const existingLaptop1 = await prisma.product.findFirst({
    where: { merchantId: m1.id, name: "Apex 15-inch Laptop" },
  });
  if (!existingLaptop1) {
    await prisma.product.create({
      data: {
        merchantId: m1.id,
        name: "Apex 15-inch Laptop",
        category: "Laptop",
        description: "15-inch laptop for work and study.",
        attributes: JSON.stringify({ size: "15 inch" }),
        mrp: 6_000_000,
        sellingPrice: 5_500_000,
        minimumPrice: 5_200_000,
        maxDiscount: 300_000,
        minProfitMargin: 0.1,
        costPrice: 4_600_000,
        inventory: 5,
        maxRounds: 3,
        offerValidityMinutes: 10,
        concessionMode: "LINEAR",
        warrantyMonths: 12,
        deliveryDays: 4,
        reliabilityScore: 0.8,
      },
    });
  }

  const existingLaptop2 = await prisma.product.findFirst({
    where: { merchantId: m2.id, name: "Nexus Pro 15-inch Laptop" },
  });
  if (!existingLaptop2) {
    await prisma.product.create({
      data: {
        merchantId: m2.id,
        name: "Nexus Pro 15-inch Laptop",
        category: "Laptop",
        description: "High-performance 15-inch laptop with SSD storage.",
        attributes: JSON.stringify({ size: "15 inch" }),
        mrp: 5_800_000,
        sellingPrice: 5_350_000,
        minimumPrice: 5_050_000,
        maxDiscount: 300_000,
        minProfitMargin: 0.08,
        costPrice: 4_500_000,
        inventory: 7,
        maxRounds: 3,
        offerValidityMinutes: 10,
        concessionMode: "LINEAR",
        warrantyMonths: 24,
        deliveryDays: 2,
        reliabilityScore: 0.9,
      },
    });
  }

  console.log("Multi-Merchant AI Agents & Products seeded successfully!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
