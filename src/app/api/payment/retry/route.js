import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { initiatePayment } from "@/lib/payment-gate";

export const runtime = "nodejs";

export async function POST(req) {
  const user = await getCurrentUser();
  const { sessionId } = await req.json();
  const result = await initiatePayment(sessionId, user?.id);
  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
