import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  description: z.string().min(4),
  attributes: z.record(z.any()).optional(),
  mrp: z.number().positive(),
  sellingPrice: z.number().positive(),
  minimumPrice: z.number().positive(),
  maxDiscount: z.number().nonnegative(),
  minProfitMargin: z.number().min(0).max(1),
  costPrice: z.number().positive(),
  inventory: z.number().int().min(0),
  maxRounds: z.number().int().min(1).max(10).optional(),
  offerValidityMinutes: z.number().int().min(1).optional(),
  concessionMode: z.enum(["LINEAR", "SCHEDULE"]).optional(),
  concessionScheduleRupees: z.array(z.number()).optional(),
  warrantyMonths: z.number().int().optional(),
  deliveryDays: z.number().int().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "MERCHANT" || !user.merchantId) {
    return NextResponse.json({ error: "Merchant login required" }, { status: 401 });
  }
  const products = await prisma.product.findMany({
    where: { merchantId: user.merchantId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MERCHANT" || !user.merchantId) {
    return NextResponse.json({ error: "Merchant login required" }, { status: 401 });
  }

  try {
    const body = CreateSchema.parse(await req.json());
    if (body.minimumPrice > body.sellingPrice || body.sellingPrice > body.mrp) {
      return NextResponse.json(
        { error: "Require minimumPrice ≤ sellingPrice ≤ MRP" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        merchantId: user.merchantId,
        name: body.name,
        category: body.category,
        description: body.description,
        attributes: JSON.stringify(body.attributes || {}),
        mrp: Math.round(body.mrp * 100),
        sellingPrice: Math.round(body.sellingPrice * 100),
        minimumPrice: Math.round(body.minimumPrice * 100),
        maxDiscount: Math.round(body.maxDiscount * 100),
        minProfitMargin: body.minProfitMargin,
        costPrice: Math.round(body.costPrice * 100),
        inventory: body.inventory,
        maxRounds: body.maxRounds ?? 3,
        offerValidityMinutes: body.offerValidityMinutes ?? 10,
        concessionMode: body.concessionMode ?? "LINEAR",
        concessionSchedule: body.concessionScheduleRupees
          ? JSON.stringify(body.concessionScheduleRupees.map((r) => Math.round(r * 100)))
          : null,
        warrantyMonths: body.warrantyMonths ?? 12,
        deliveryDays: body.deliveryDays ?? 3,
      },
    });
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Invalid product" }, { status: 400 });
  }
}
