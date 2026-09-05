import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/** Demo helper: set inventory to 0 so checkout fails gracefully. */
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MERCHANT") {
    return NextResponse.json({ error: "Merchant login required" }, { status: 401 });
  }
  const { productId, sessionId } = await req.json();
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.merchantId !== user.merchantId) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await prisma.product.update({
    where: { id: productId },
    data: { inventory: 0 },
  });

  if (sessionId) {
    await logAudit(
      sessionId,
      "INVENTORY_CHECK_FAIL",
      "SYSTEM",
      { productId, inventory: 0 },
      "Demo: merchant set inventory to 0 before payment"
    );
  }

  return NextResponse.json({ ok: true, inventory: 0 });
}
