import Razorpay from "razorpay";
import crypto from "crypto";

function getClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are not configured");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function createRazorpayOrder(amountPaise, receipt, notes = {}) {
  const razorpay = getClient();
  return razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: receipt.slice(0, 40),
    notes,
  });
}

export function verifyPaymentSignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expected === signature;
}

export function verifyWebhookSignature(rawBody, signature) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}
