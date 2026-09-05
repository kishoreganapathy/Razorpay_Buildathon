"use client";

import { useState } from "react";

function rupees(paise) {
  return (paise / 100).toLocaleString("en-IN");
}

export function ApprovalCard({ sessionId, amountPaise, productName, onPaid, onFailed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setLoading(true);
    setError("");
    await fetch("/api/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });

    const orderRes = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const orderData = await orderRes.json();
    if (!orderData.success) {
      setError(orderData.error || "Payment could not be started");
      setLoading(false);
      onFailed?.(orderData);
      return;
    }

    const openCheckout = () => {
      const rzp = new window.Razorpay({
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "Razorpay",
        description: productName,
        order_id: orderData.razorpayOrderId,
        handler: async (response) => {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, ...response }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) onPaid?.();
          else {
            setError(verifyData.error || "Verification failed");
            onFailed?.(verifyData);
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setError("Payment cancelled. Order is PAYMENT_PENDING — you can retry.");
            setLoading(false);
            onFailed?.({ code: "CANCELLED" });
          },
        },
      });
      rzp.on("payment.failed", (resp) => {
        setError(resp.error?.description || "Payment failed");
        setLoading(false);
        onFailed?.(resp.error);
      });
      rzp.open();
    };

    if (window.Razorpay) {
      openCheckout();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = openCheckout;
    script.onerror = () => {
      setError("Could not load Razorpay checkout");
      setLoading(false);
    };
    document.body.appendChild(script);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-[#061B2E]/90 to-[#02042B]/95 p-5 shadow-2xl backdrop-blur-xl">
      {/* Top Header Row */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Deal Locked & Validated
            </span>
            <p className="text-[11px] text-slate-400">Razorpay Policy Verification Passed</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-[#0066FF]/20 border border-[#0066FF]/40 px-2.5 py-0.5 text-[11px] font-semibold text-[#38BDF8]">
          <svg className="w-3 h-3 text-[#00C2FF]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Razorpay Verified
        </span>
      </div>

      {/* Main Pricing Row */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{productName}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Final Negotiated Amount (Guaranteed by Policy Engine)
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            ₹{rupees(amountPaise)}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">INCL. ALL TAXES</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4 flex flex-col gap-2">
        <button
          onClick={pay}
          disabled={loading}
          className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0066FF] via-[#0077FF] to-[#00C2FF] py-3.5 px-6 font-bold text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Opening Razorpay Gateway…
            </span>
          ) : (
            <>
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Approve & Pay ₹{rupees(amountPaise)} via Razorpay</span>
            </>
          )}
        </button>

        {/* Payment Modes Pill Ticker */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mt-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300 font-semibold text-[10px]">UPI</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300 font-semibold text-[10px]">Cards</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300 font-semibold text-[10px]">NetBanking</span>
          </div>
          <span className="flex items-center gap-1 text-slate-400">
            <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            256-Bit SSL Encrypted
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

