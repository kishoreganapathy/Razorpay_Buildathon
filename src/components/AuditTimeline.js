"use client";

export function AuditTimeline({ events }) {
  if (!events?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
        <svg className="w-8 h-8 text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-medium text-slate-400">No audit events recorded yet.</p>
        <p className="text-xs text-slate-400 mt-1">Start a conversation to see live policy evaluation logs.</p>
      </div>
    );
  }

  const getEventBadge = (type) => {
    if (type?.includes("COMPLETED") || type?.includes("APPROVED") || type?.includes("PAYMENT")) {
      return "bg-emerald-500/15 border-emerald-500/40 text-emerald-400";
    }
    if (type?.includes("FAIL") || type?.includes("REJECT")) {
      return "bg-red-500/15 border-red-500/40 text-red-400";
    }
    if (type?.includes("OFFER") || type?.includes("PROPOSE")) {
      return "bg-[#0066FF]/15 border-[#0066FF]/40 text-[#38BDF8]";
    }
    return "bg-slate-800 border-slate-700 text-slate-300";
  };

  return (
    <div className="relative pl-3 space-y-4">
      {/* Vertical Timeline Line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-slate-800" />

      {events.map((e) => (
        <div key={e.id} className="relative flex items-start gap-3 group">
          {/* Node Icon */}
          <div className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-[#06152B] border-2 border-[#0066FF] shadow-sm mt-1 shrink-0">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00C2FF]" />
          </div>

          {/* Event Card */}
          <div className="flex-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 shadow-sm transition-all group-hover:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
              <span className={`rounded-md border px-2 py-0.5 text-[11px] font-mono font-semibold ${getEventBadge(e.eventType)}`}>
                {e.eventType}
              </span>

              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                  {e.actor}
                </span>
                <time>{new Date(e.createdAt).toLocaleTimeString()}</time>
              </div>
            </div>

            {e.explanation && (
              <p className="mt-2 text-xs leading-relaxed text-slate-300 font-sans">
                {e.explanation}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

