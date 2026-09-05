"use client";

import { useEffect, useState, useCallback } from "react";

import { AuditTimeline } from "@/components/AuditTimeline";
import { ApprovalCard } from "@/components/ApprovalCard";

function rupees(paise) {
  return (paise / 100).toLocaleString("en-IN");
}

export default function AuditPage({ params }) {
  const [data, setData] = useState(null);
  const [paid, setPaid] = useState(false);

  const load = useCallback(async () => {
    if (!params.sessionId) return;
    const res = await fetch(`/api/audit/${params.sessionId}`);
    setData(await res.json());
  }, [params.sessionId]);

  useEffect(() => {
    load();
  }, [load]);



  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-6 w-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium">Fetching Razorpay Audit Log…</span>
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-center text-red-300">
        <p className="font-bold text-lg">Audit Record Not Found</p>
        <p className="text-sm mt-1">{data.error}</p>
      </div>
    );
  }

  const { session, events } = data;
  const showPay =
    session.agreedPrice &&
    session.status !== "COMPLETED" &&
    (session.customerApproved || session.status === "AWAITING_APPROVAL" || session.status === "PAYMENT_PENDING");

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/15 border-emerald-500/40 text-emerald-400";
      case "AWAITING_APPROVAL":
      case "PAYMENT_PENDING":
        return "bg-[#0066FF]/15 border-[#0066FF]/40 text-[#38BDF8]";
      case "FAILED":
      case "EXPIRED":
        return "bg-red-500/15 border-red-500/40 text-red-400";
      default:
        return "bg-slate-800 border-slate-700 text-slate-300";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Session Overview Banner */}
      <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#06152B]/90 via-[#040E20]/90 to-[#02042B]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400">Session ID:</span>
              <span className="text-xs font-mono font-bold text-[#38BDF8]">{session.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {session.product?.name || "Negotiation Session"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono font-bold ${getStatusBadge(session.status)}`}>
              <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
              {session.status}
            </span>
          </div>
        </div>

        {/* Metadata Details Row */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-slate-500 font-mono block mb-0.5">AGREED PRICE</span>
            <span className="text-base font-bold text-emerald-400">
              {session.agreedPrice ? `₹${rupees(session.agreedPrice)}` : "Pending"}
            </span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-slate-500 font-mono block mb-0.5">LISTED MRP</span>
            <span className="text-base font-semibold text-slate-300">
              {session.product?.mrp ? `₹${rupees(session.product.mrp)}` : "—"}
            </span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-slate-500 font-mono block mb-0.5">ROUND COUNTER</span>
            <span className="text-base font-semibold text-slate-300">
              Round {session.currentRound || 1}
            </span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-slate-500 font-mono block mb-0.5">VERIFICATION</span>
            <span className="text-base font-semibold text-[#38BDF8]">
              Razorpay Engine
            </span>
          </div>
        </div>

        {session.failureReason && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{session.failureReason}</span>
          </div>
        )}
      </div>

      {/* Approval Card Trigger if Pending */}
      {showPay && !paid && session.status !== "FAILED" && session.status !== "EXPIRED" && (
        <ApprovalCard
          sessionId={session.id}
          amountPaise={session.agreedPrice}
          productName={session.product?.name || "Product"}
          onPaid={() => {
            setPaid(true);
            load();
          }}
          onFailed={() => load()}
        />
      )}

      {session.status === "COMPLETED" && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-white">Payment Captured & Verified</p>
            <p className="text-xs text-emerald-300/80">Funds settled via Razorpay API. Transaction locked in database.</p>
          </div>
        </div>
      )}

      {/* Timeline Stream */}
      <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#06152B]/90 via-[#040E20]/90 to-[#02042B]/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white">Immutable Decision & Audit Trail</h2>
            <p className="text-xs text-slate-400">Cryptographic step-by-step log of policy evaluations</p>
          </div>
          <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-mono text-[#38BDF8]">
            {events.length} Events Logged
          </span>
        </div>

        <AuditTimeline events={events} />
      </div>
    </div>
  );
}

