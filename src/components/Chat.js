"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ApprovalCard } from "./ApprovalCard";

function rupees(paise) {
  if (!paise && paise !== 0) return "0";
  return (paise / 100).toLocaleString("en-IN");
}

const SUGGESTIONS = [
  "I want a 55-inch 4K TV under ₹45,000 with fast delivery",
  "I need a 15-inch laptop for work",
  "Show 4K Smart TVs under ₹50,000",
];

export function Chat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Welcome to Razorpay AI Commerce. Search for any product to view live offers from competing Merchant AI Agents, select an offer, and negotiate your best price!",
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [product, setProduct] = useState(null);
  const [offerListing, setOfferListing] = useState([]);
  const [activeBids, setActiveBids] = useState([]);
  const [bestOffer, setBestOffer] = useState(null);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [agreedPrice, setAgreedPrice] = useState(null);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const bottom = useRef(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, awaitingApproval, offerListing, activeBids, bestOffer]);

  async function send(text, selectedId = null) {
    const content = (text ?? input).trim();
    if (!content && !selectedId) return;
    if (busy) return;

    if (content) {
      setInput("");
      setMessages((m) => [...m, { role: "user", text: content }]);
    }
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content || undefined,
          sessionId,
          selectedProductId: selectedId || undefined,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = { error: "Server returned invalid response." };
      }

      if (data.sessionId) setSessionId(data.sessionId);
      if (data.product) setProduct(data.product);
      if (data.offerListing) setOfferListing(data.offerListing);
      if (data.bids) setActiveBids(data.bids);
      if (data.bestOffer) setBestOffer(data.bestOffer);
      if (data.awaitingApproval || data.readyForPayment) {
        setAwaitingApproval(true);
        setAgreedPrice(data.agreedPrice || data.decision?.price);
      }

      setMessages((m) => [...m, { role: "assistant", text: data.reply || data.error || "Something went wrong." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Network error. Try again." }]);
    } finally {
      setBusy(false);
    }
  }

  function handleSelectOffer(offer) {
    setOfferListing([]);
    setActiveBids([]);
    setMessages((m) => [
      ...m,
      {
        role: "user",
        text: `Selected ${offer.productName} from ${offer.merchantName} at ₹${rupees(offer.sellingPrice)}`,
      },
    ]);
    send(null, offer.id);
  }

  const activeBestPrice = bestOffer?.pricePaise || (agreedPrice ? agreedPrice : product?.sellingPrice);
  const activeMerchantName = bestOffer?.merchantName || product?.merchant?.name || "Lead AI Merchant";
  const activeProductName = bestOffer?.productName || product?.name;
  const activeMrp = bestOffer?.mrp || product?.mrp;
  const savingsPaise = activeMrp && activeBestPrice ? Math.max(0, activeMrp - activeBestPrice) : 0;
  const discountPercent = activeMrp && activeMrp > 0 ? Math.round((savingsPaise / activeMrp) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col space-y-6">
      {/* 🌟 PROMINENT CURRENT TARGET OFFER HERO CARD */}
      {activeProductName && activeBestPrice && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-r from-[#0F1B38] via-[#09152B] to-[#040E20] p-6 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 border-b border-slate-800/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300 mb-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                <span>⭐ ACTIVE TARGET OFFER</span>
                {bestOffer?.currentRound && (
                  <span className="text-[10px] font-mono opacity-80 border-l border-amber-400/30 pl-2">
                    Round {bestOffer.currentRound}/{bestOffer.maxRounds || 3}
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {activeProductName}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Merchant AI Agent: <strong className="text-[#38BDF8]">{activeMerchantName}</strong>
              </p>
            </div>

            <div className="sm:text-right bg-slate-900/80 border border-slate-800 rounded-2xl px-5 py-3 shadow-inner">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Offer Price</div>
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                ₹{rupees(activeBestPrice)}
              </div>
              {activeMrp && savingsPaise > 0 && (
                <div className="text-xs text-amber-400 font-medium mt-0.5">
                  <span className="line-through text-slate-500 mr-1.5">MRP ₹{rupees(activeMrp)}</span>
                  <span>Save ₹{rupees(savingsPaise)} ({discountPercent}% OFF)</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Counter Offer Preset Buttons */}
          {!awaitingApproval && !paid && activeBestPrice && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <span>Quick Counter-Bids:</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => send(`I offer ₹${(Math.round((activeBestPrice * 0.93) / 100000) * 1000).toLocaleString("en-IN")}`)}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-sm"
                >
                  💬 Bid ₹{(Math.round((activeBestPrice * 0.93) / 100000) * 1000).toLocaleString("en-IN")} (-7%)
                </button>
                <button
                  onClick={() => send(`I offer ₹${(Math.round((activeBestPrice * 0.90) / 100000) * 1000).toLocaleString("en-IN")}`)}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-all shadow-sm"
                >
                  💬 Bid ₹{(Math.round((activeBestPrice * 0.90) / 100000) * 1000).toLocaleString("en-IN")} (-10%)
                </button>
                <button
                  onClick={() => send(`I offer ₹${(Math.round((activeBestPrice * 0.85) / 100000) * 1000).toLocaleString("en-IN")}`)}
                  className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-sm"
                >
                  💬 Bid ₹{(Math.round((activeBestPrice * 0.85) / 100000) * 1000).toLocaleString("en-IN")} (-15%)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Chat & Interactive Offers Desk */}
      <section className="flex min-h-[620px] flex-col rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#06152B]/90 via-[#040E20]/90 to-[#02042B]/95 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#02042B]/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00C2FF] text-white shadow-md shadow-blue-600/30">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Razorpay Smart Commerce
                <span className="rounded bg-[#0066FF]/20 border border-[#0066FF]/40 px-2 py-0.5 text-[10px] font-mono text-[#38BDF8]">
                  VISUAL BIDDING
                </span>
              </h2>
              <p className="text-xs text-slate-400">Select Competing Merchant Offers & Negotiate Instant Deals</p>
            </div>
          </div>

          {sessionId && (
            <Link
              href={`/audit/${sessionId}`}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-[#38BDF8] hover:border-[#0066FF] hover:text-white transition-all font-mono"
            >
              <span>View Audit Log</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          )}
        </div>

        {/* Message Stream & Visual Offers Grid */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6 scrollbar-thin">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0066FF]/20 border border-[#0066FF]/40 text-[#38BDF8] mt-1 shadow-sm">
                  <span className="text-xs font-bold">AI</span>
                </div>
              )}
              <div
                className={`max-w-[88%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-[#0066FF] to-[#0077FF] text-white shadow-md shadow-blue-600/20 font-medium rounded-tr-none"
                    : "bg-[#0A192F]/90 border border-slate-800 text-slate-100 shadow-sm rounded-tl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* 🛍️ VISUAL INITIAL MERCHANT OFFER LISTING GRID */}
          {offerListing && offerListing.length > 0 && (
            <div className="my-4 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>Available Merchant Offers ({offerListing.length}):</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {offerListing.map((item, idx) => (
                  <div
                    key={item.id}
                    className="relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-gradient-to-b from-[#09172E] to-[#040E20] p-4 shadow-xl hover:border-[#0066FF]/60 transition-all duration-300 group"
                  >
                    {idx === 0 && (
                      <span className="absolute top-2 right-2 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold px-2 py-0.5">
                        ⭐ BEST MATCH
                      </span>
                    )}

                    <div>
                      <span className="text-[11px] font-bold text-[#38BDF8] block mb-1">
                        {item.merchantName} AI Agent
                      </span>
                      <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                        {item.productName}
                      </h4>

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-emerald-400">
                          ₹{rupees(item.sellingPrice)}
                        </span>
                        {item.mrp && item.mrp > item.sellingPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{rupees(item.mrp)}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-1 text-[11px] text-slate-300 border-t border-slate-800/80 pt-2.5">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{item.warrantyMonths} Mo Warranty</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-[#00C2FF] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>{item.deliveryDays}-Day Express Delivery</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectOffer(item)}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00C2FF] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 group-hover:from-blue-600 group-hover:to-cyan-400 transition-all active:scale-[0.98]"
                    >
                      <span>⚡ Select & Negotiate</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🏷️ VISUAL COMPETING MERCHANT BIDS STREAM */}
          {activeBids && activeBids.length > 0 && (
            <div className="my-4 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>Live Competing Merchant Agent Bids ({activeBids.length}):</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeBids.map((b) => (
                  <div
                    key={b.productId}
                    className={`relative flex flex-col justify-between rounded-2xl border p-4 shadow-xl transition-all ${
                      b.isWinner
                        ? "border-emerald-500/60 bg-gradient-to-b from-[#062419] to-[#040E20]"
                        : "border-slate-800 bg-gradient-to-b from-[#09172E] to-[#040E20]"
                    }`}
                  >
                    {b.isWinner && (
                      <span className="absolute top-2 right-2 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                        🏆 BEST BID
                      </span>
                    )}

                    <div>
                      <span className="text-[11px] font-bold text-[#38BDF8] block mb-1">
                        {b.merchantName} AI Agent
                      </span>
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {b.productName}
                      </h4>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                        <span className="text-xs font-semibold text-slate-400">Response:</span>
                        <span
                          className={`text-xs font-bold rounded px-2 py-0.5 ${
                            b.action === "ACCEPT"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          }`}
                        >
                          {b.action === "ACCEPT" ? "🎉 ACCEPTED" : `COUNTER ₹${rupees(b.pricePaise)}`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectOffer({ id: b.productId, merchantName: b.merchantName, productName: b.productName, sellingPrice: b.pricePaise })}
                      className={`mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                        b.isWinner
                          ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md"
                          : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      }`}
                    >
                      <span>{b.action === "ACCEPT" ? "Lock & Pay This Deal" : "Negotiate With This Agent"}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deal Locked / Approval Card */}
          {awaitingApproval && agreedPrice && !paid && (
            <div className="my-4">
              <ApprovalCard
                sessionId={sessionId}
                amountPaise={agreedPrice}
                productName={activeProductName || product?.name || "Winning Deal"}
                onPaid={() => {
                  setPaid(true);
                  setMessages((m) => [
                    ...m,
                    { role: "assistant", text: "🎉 Payment captured successfully via Razorpay! Your order is locked & confirmed." },
                  ]);
                }}
                onFailed={() => {}}
              />
            </div>
          )}

          {/* Success Banner */}
          {paid && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-sm text-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-white text-base">Payment Captured via Razorpay</p>
                  <p className="text-xs text-emerald-300/80">Inventory updated & audit log sealed for order.</p>
                </div>
              </div>

              <Link
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all shadow-md"
                href={`/audit/${sessionId}`}
              >
                <span>View Full Audit</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          )}

          <div ref={bottom} />
        </div>

        {/* Input Form & Suggestions */}
        <div className="border-t border-slate-800/80 bg-[#02042B]/80 p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-xs text-slate-300 hover:border-[#0066FF] hover:bg-[#0066FF]/10 hover:text-white transition-all shadow-sm"
              >
                {s}
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
              placeholder="Search for a product, or propose a price counter offer…"
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-sm text-slate-100 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all placeholder:text-slate-500 shadow-inner"
            />
            <button
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-[#0052CC] hover:shadow-blue-600/50 transition-all disabled:opacity-50 active:scale-[0.98]"
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
    </div>
  );
}
