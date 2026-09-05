"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("CUSTOMER");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    merchantName: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    if (e) e.preventDefault();
    setError("");
    setSubmitting(true);
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          role: mode === "register" ? role : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed");
        setSubmitting(false);
        return;
      }
      router.push(data.user?.role === "MERCHANT" ? "/merchant" : "/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  function fillDemo(email, password) {
    setMode("login");
    setForm((f) => ({ ...f, email, password }));
  }

  return (
    <div className="mx-auto max-w-md my-8">
      <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#06152B]/95 via-[#040E20]/95 to-[#02042B]/95 p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <svg
              className="h-9 w-auto text-[#0066FF]"
              viewBox="0 0 120 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18.8 4L4 28H10.5L25.3 4H18.8Z" fill="#0066FF" />
              <path d="M13.2 4L0 25.2H6.5L19.7 4H13.2Z" fill="#00C2FF" opacity="0.85" />
              <text x="32" y="22" fill="#FFFFFF" fontSize="20" fontWeight="800" fontFamily="system-ui, sans-serif">
                Razorpay
              </text>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {mode === "login" ? "Sign in to Razorpay" : "Create Razorpay Account"}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {mode === "login" ? "Access your customer or merchant dashboard" : "Register a new customer or merchant profile"}
          </p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 text-center">
            ⚡ Quick Demo Sign In
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo("customer@demo.com", "customer123")}
              className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#0066FF] hover:text-[#38BDF8] transition-all flex flex-col items-center gap-0.5"
            >
              <span>Customer Demo</span>
              <span className="text-[10px] text-slate-400 font-mono">customer@demo.com</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo("merchant@demo.com", "merchant123")}
              className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#00C2FF] hover:text-[#00C2FF] transition-all flex flex-col items-center gap-0.5"
            >
              <span>Merchant Demo</span>
              <span className="text-[10px] text-slate-400 font-mono">merchant@demo.com</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 mb-5">
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === "login"
                ? "bg-[#0066FF] text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === "register"
                ? "bg-[#0066FF] text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  placeholder="e.g. Alex Johnson"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all placeholder:text-slate-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Account Type
                </label>
                <select
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="CUSTOMER">Customer (Shopper & Bargainer)</option>
                  <option value="MERCHANT">Merchant (Store & Policy Owner)</option>
                </select>
              </div>

              {role === "MERCHANT" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Store / Merchant Name
                  </label>
                  <input
                    placeholder="e.g. TechMart India"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all placeholder:text-slate-500"
                    value={form.merchantName}
                    onChange={(e) => setForm({ ...form, merchantName: e.target.value })}
                    required
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all placeholder:text-slate-500"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all placeholder:text-slate-500"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <button
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-[#0066FF] via-[#0077FF] to-[#00C2FF] py-3.5 px-6 font-bold text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {submitting ? "Processing…" : mode === "login" ? "Sign In with Razorpay" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          Secured by Razorpay Identity Gateway • 256-Bit SSL
        </p>
      </div>
    </div>
  );
}

