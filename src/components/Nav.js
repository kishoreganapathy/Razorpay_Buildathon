"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Nav() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#02042B]/90 backdrop-blur-xl shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Razorpay Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center gap-2">
            <svg
              className="h-8 w-auto text-[#0066FF] transition-transform group-hover:scale-105"
              viewBox="0 0 120 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Razorpay emblem icon */}
              <path
                d="M18.8 4L4 28H10.5L25.3 4H18.8Z"
                fill="#0066FF"
              />
              <path
                d="M13.2 4L0 25.2H6.5L19.7 4H13.2Z"
                fill="#00C2FF"
                opacity="0.85"
              />
              {/* Razorpay typography */}
              <text
                x="32"
                y="22"
                fill="#FFFFFF"
                fontSize="20"
                fontWeight="800"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="-0.5px"
              >
                Razorpay
              </text>
            </svg>
            <span className="hidden sm:inline-block rounded-full bg-[#0066FF]/15 border border-[#0066FF]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#38BDF8]">
              AI Commerce
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link
            href="/"
            className="flex items-center gap-1.5 hover:text-white transition-colors py-1"
          >
            <svg className="w-4 h-4 text-[#0066FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Bargain & Shop</span>
          </Link>

          <Link
            href="/merchant"
            className="flex items-center gap-1.5 hover:text-white transition-colors py-1"
          >
            <svg className="w-4 h-4 text-[#00C2FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Merchant Console</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-white">{user.name}</span>
                <span className="text-[10px] text-[#38BDF8] uppercase tracking-wider font-mono">{user.role}</span>
              </div>
              <button
                onClick={logout}
                className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-[#0052CC] hover:shadow-blue-600/50 transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Sign In</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

