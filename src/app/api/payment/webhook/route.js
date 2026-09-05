import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const payment = event.payload?.payment?.entity;
  const sessionId = payment?.notes?.sessionId || payment?.receipt;

  if (event.event === "payment.failed" && sessionId) {
    await prisma.negotiationSession.update({
      where: { id: sessionId },
      data: {
        status: "PAYMENT_PENDING",
        paymentStatus: "failed",
        failureReason: payment.error_description || "Payment failed",
      },
    });
    await prisma.order.updateMany({
      where: { sessionId, razorpayOrderId: payment.order_id },
      data: { status: "FAILED" },
    });
    await logAudit(sessionId, "PAYMENT_FAILURE", "RAZORPAY", payment, payment.error_description);
  }

  if (event.event === "payment.captured" && sessionId) {
    await logAudit(sessionId, "PAYMENT_ATTEMPT", "RAZORPAY", { event: event.event, id: payment.id });
  }

  return NextResponse.json({ received: true });
}
