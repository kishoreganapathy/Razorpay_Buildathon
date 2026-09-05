import { NextResponse } from "next/server";
import { getAuditTrail } from "@/lib/audit";
import { prisma } from "@/lib/db";

export async function GET(_req, { params }) {
  const session = await prisma.negotiationSession.findUnique({
    where: { id: params.sessionId },
    include: { product: true, orders: true },
  });
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const events = await getAuditTrail(params.sessionId);
  return NextResponse.json({ session, events });
}
