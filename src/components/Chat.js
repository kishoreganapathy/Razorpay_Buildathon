"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ApprovalCard } from "./ApprovalCard";
import { AuditTimeline } from "./AuditTimeline";

function rupees(paise) {
  return (paise / 100).toLocaleString("en-IN");
}

const SUGGESTIONS = [
  "I want a 55-inch 4K TV under ₹45,000 with fast delivery",
  "I'll take it for ₹40,000",
  "Can you offer ₹42,000?",
  "₹44,500 final offer",
  "I approve this price",
];

export function Chat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Welcome to Razorpay AI Bargaining. Describe what you're looking to buy, or make a price counter offer. Our agent negotiates inside verified merchant guardrails.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [product, setProduct] = useState(null);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [agreedPrice, setAgreedPrice] = useState(null);
  const [paid, setPaid] = useState(false);
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState(false);
  const bottom = useRef(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, awaitingApproval]);

  async function refreshAudit(id) {
    if (!id) return;
    const res = await fetch(`/api/audit/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setEvents(data.events || []);
  }

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: content }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, sessionId }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = { error: "Server returned invalid response." };
      }
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.product) setProduct(data.product);
      if (data.awaitingApproval || data.readyForPayment) {
        setAwaitingApproval(true);
        setAgreedPrice(data.agreedPrice || data.decision?.price);
      }
      setMessages((m) => [...m, { role: "assistant", text: data.reply || data.error || "Something went wrong." }]);
      await refreshAudit(data.sessionId || sessionId);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Network error. Try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      {/* Left Chat Window */}
      <section className="flex min-h-[680px] flex-col rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#06152B]/90 via-[#040E20]/90 to-[#02042B]/95 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#02042B]/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00C2FF] text-white shadow-md shadow-blue-600/30">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#02042B]"></span>
              </span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Razorpay Negotiator AI
                <span className="rounded bg-[#0066FF]/20 border border-[#0066FF]/40 px-2 py-0.5 text-[10px] font-mono text-[#38BDF8]">
                  BOUNDED
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Intelligent Price Bargaining & Real-time Verification</p>
            </div>
          </div>

          {sessionId && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] font-mono text-slate-400">
              <span>Session:</span>
              <span className="text-[#38BDF8] font-semibold">{sessionId.slice(0, 8)}…</span>
            </div>
          )}
        </div>

        {/* Message Stream */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0066FF]/20 border border-[#0066FF]/40 text-[#38BDF8] mt-1">
                  <span className="text-xs font-bold">RZP</span>
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-[#0066FF] to-[#0077FF] text-white shadow-md shadow-blue-600/20 font-medium rounded-tr-none"
                    : "bg-[#0A192F]/90 border border-slate-800 text-slate-100 shadow-sm rounded-tl-none"
                }`}
              >
                {m.text}
              </div>
              {m.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300 mt-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          ))}

          {/* Active Product Card */}
          {product && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="inline-block rounded bg-[#0066FF]/15 text-[#38BDF8] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 mb-1">
                    {product.category || "Matched Product"}
                  </span>
                  <h3 className="text-base font-bold text-white">{product.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 line-through">MRP ₹{rupees(product.mrp)}</span>
                  <div className="text-lg font-extrabold text-[#38BDF8]">
                    Listed: ₹{rupees(product.sellingPrice)}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-slate-400">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {product.warrantyMonths} Mo Warranty
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <svg className="w-4 h-4 text-[#00C2FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {product.deliveryDays} Day Express Delivery
                  </span>
                </div>
                <span className="rounded bg-slate-800 px-2 py-1 text-[11px] font-mono text-slate-300">
                  Stock: {product.inventory} units
                </span>
              </div>
            </div>
          )}

          {/* Deal Locked / Approval Card */}
          {awaitingApproval && agreedPrice && !paid && (
            <div className="my-2">
              <ApprovalCard
                sessionId={sessionId}
                amountPaise={agreedPrice}
                productName={product?.name || "Product"}
                onPaid={() => {
                  setPaid(true);
                  setMessages((m) => [
                    ...m,
                    { role: "assistant", text: "Payment captured successfully via Razorpay! Your order is confirmed." },
                  ]);
                  refreshAudit(sessionId);
                }}
                onFailed={() => refreshAudit(sessionId)}
              />
            </div>
          )}

          {/* Success Banner */}
          {paid && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-white">Payment Captured via Razorpay</p>
                  <p className="text-xs text-emerald-300/80">Inventory updated & immutable audit log sealed.</p>
                </div>
              </div>

              <Link
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-all"
                href={`/audit/${sessionId}`}
              >
                <span>View Audit</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          )}

          <div ref={bottom} />
        </div>

        {/* Input Form & Suggestions */}
        <div className="border-t border-slate-800/80 bg-[#02042B]/80 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 hover:border-[#0066FF] hover:bg-[#0066FF]/10 hover:text-white transition-all"
              >
                {s.length > 45 ? s.slice(0, 45) + "…" : s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what product you want, or propose a price offer…"
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all placeholder:text-slate-500"
            />
            <button
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-[#0052CC] hover:shadow-blue-600/50 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {busy ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <span>Send</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Right Column: Live Audit Console */}
      <aside className="flex flex-col rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#06152B]/90 via-[#040E20]/90 to-[#02042B]/95 p-5 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Live Policy Audit</span>
              <span className="flex h-2 w-2 rounded-full bg-[#00C2FF]" />
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-time Policy Evaluation Stream</p>
          </div>

          {sessionId && (
            <Link
              href={`/audit/${sessionId}`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs text-[#38BDF8] hover:border-[#0066FF] hover:text-white transition-all"
            >
              <span>Full Log</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <AuditTimeline events={events} />
        </div>
      </aside>
    </div>
  );
}

