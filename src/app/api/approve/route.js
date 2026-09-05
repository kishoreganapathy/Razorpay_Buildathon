import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req) {
  const user = await getCurrentUser();
  const { sessionId } = await req.json();
  const session = await prisma.negotiationSession.findUnique({ where: { id: sessionId } });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.status !== "AWAITING_APPROVAL" && session.status !== "PAYMENT_PENDING") {
    return NextResponse.json({ error: "No offer awaiting approval" }, { status: 400 });
  }
  if (!session.agreedPrice) {
    return NextResponse.json({ error: "No agreed price" }, { status: 400 });
  }

  await prisma.negotiationSession.update({
    where: { id: sessionId },
    data: {
      customerApproved: true,
      approvedAt: new Date(),
      customerId: user?.id || session.customerId,
    },
  });
  await logAudit(sessionId, "CUSTOMER_APPROVAL", "CUSTOMER", {
    agreedPrice: session.agreedPrice,
    customerId: user?.id || null,
  });

  return NextResponse.json({ ok: true, agreedPrice: session.agreedPrice });
}
