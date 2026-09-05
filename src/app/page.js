import { Chat } from "@/components/Chat";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#06152B]/90 to-[#02042B]/90 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-[#0066FF]/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0066FF]/40 bg-[#0066FF]/10 px-3.5 py-1 text-xs font-semibold text-[#38BDF8] shadow-sm mb-4">
            <span className="flex h-2 w-2 rounded-full bg-[#00C2FF] animate-ping" />
            <span>Razorpay Smart Autonomous Commerce</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Conversational Commerce Powered by{" "}
            <span className="bg-gradient-to-r from-[#0066FF] via-[#00C2FF] to-sky-300 bg-clip-text text-transparent">
              Razorpay AI
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Tell the AI agent what you want to buy. Merchants define the policy guardrails, and Razorpay guarantees instant, secure payment capture at the negotiated price.
          </p>

          {/* Value Props Bar */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-slate-300 border-t border-slate-800/80 pt-6">
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5">
              <svg className="w-4 h-4 text-[#00C2FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Deterministic Guardrails</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5">
              <svg className="w-4 h-4 text-[#0066FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Instant 1-Click Razorpay UPI</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Immutable Audit Trail</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bargaining Desk Workspace */}
      <Chat />
    </div>
  );
}

