import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MERCHANT" || !user.merchantId) {
    return NextResponse.json({ error: "Merchant login required" }, { status: 401 });
  }

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || product.merchantId !== user.merchantId) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const body = await req.json();
  const data = {};
  const rupeeFields = ["mrp", "sellingPrice", "minimumPrice", "maxDiscount", "costPrice"];
  for (const key of [
    "name",
    "category",
    "description",
    "inventory",
    "maxRounds",
    "offerValidityMinutes",
    "minProfitMargin",
    "warrantyMonths",
    "deliveryDays",
    "active",
    "concessionMode",
  ]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  for (const key of rupeeFields) {
    if (body[key] !== undefined) data[key] = Math.round(Number(body[key]) * 100);
  }
  if (body.attributes) data.attributes = JSON.stringify(body.attributes);
  if (body.concessionScheduleRupees) {
    data.concessionSchedule = JSON.stringify(
      body.concessionScheduleRupees.map((r) => Math.round(r * 100))
    );
  }

  const updated = await prisma.product.update({ where: { id: params.id }, data });
  return NextResponse.json({ product: updated });
}
