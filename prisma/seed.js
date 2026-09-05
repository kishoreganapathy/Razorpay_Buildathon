const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const merchantPassword = await bcrypt.hash("merchant123", 10);
  const customerPassword = await bcrypt.hash("customer123", 10);

  const merchantUser = await prisma.user.upsert({
    where: { email: "merchant@demo.com" },
    update: {},
    create: {
      email: "merchant@demo.com",
      name: "Apex Electronics",
      role: "MERCHANT",
      passwordHash: merchantPassword,
    },
  });

  const merchant = await prisma.merchant.upsert({
    where: { email: "merchant@demo.com" },
    update: { name: "Apex Electronics" },
    create: {
      userId: merchantUser.id,
      name: "Apex Electronics",
      email: "merchant@demo.com",
    },
  });

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

  const existingTv = await prisma.product.findFirst({
    where: { merchantId: merchant.id, name: "Apex 55-inch 4K LED TV" },
  });

  if (!existingTv) {
    await prisma.product.create({
      data: {
        merchantId: merchant.id,
        name: "Apex 55-inch 4K LED TV",
        category: "TV",
        description:
          "55-inch 4K Ultra HD smart TV with 2-year warranty and 2-day delivery. Built for the NegotiatePay demo.",
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

  const existingLaptop = await prisma.product.findFirst({
    where: { merchantId: merchant.id, name: "Apex 15-inch Laptop" },
  });
  if (!existingLaptop) {
    await prisma.product.create({
      data: {
        merchantId: merchant.id,
        name: "Apex 15-inch Laptop",
        category: "Laptop",
        description: "15-inch laptop for work and study. LINEAR concession policy.",
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

  console.log("Seeded merchant@demo.com / merchant123 and customer@demo.com / customer123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
