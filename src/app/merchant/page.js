"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MerchantForm } from "@/components/MerchantForm";

function rupees(paise) {
  return (paise / 100).toLocaleString("en-IN");
}

export default function MerchantPage() {
  const [user, setUser] = useState(undefined);
  const [products, setProducts] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const me = await fetch("/api/auth/me").then((r) => r.json());
    setUser(me.user || null);
    if (me.user?.role === "MERCHANT") {
      const data = await fetch("/api/products").then((r) => r.json());
      setProducts(data.products || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function bumpInventory(p, inventory) {
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventory }),
    });
    load();
  }

  async function failInventory(p) {
    const res = await fetch("/api/demo/fail-inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: p.id }),
    });
    const data = await res.json();
    setMsg(data.ok ? "Inventory set to 0. Checkout will fail gracefully." : data.error);
    load();
  }

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-6 w-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium">Loading Razorpay Merchant Console…</span>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "MERCHANT") {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-800 bg-[#06152B]/90 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0066FF]/20 text-[#38BDF8] border border-[#0066FF]/40 mb-4">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Merchant Portal Access Required</h1>
        <p className="mt-2 text-sm text-slate-300">
          Sign in with a merchant account to manage catalog inventory, pricing guardrails, and negotiation concession rules.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-[#0052CC] transition-all"
        >
          <span>Go to Merchant Sign In</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0066FF]/30 bg-[#0066FF]/10 px-3 py-1 text-xs font-semibold text-[#38BDF8] mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Merchant Console • Verified Store</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {user.merchantName || user.name} Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Define pricing rules and concession policies. Razorpay enforces strict bounds on every customer offer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-mono text-slate-300 flex items-center gap-2">
            <span className="text-slate-500">ID:</span>
            <span className="text-[#38BDF8]">{user.id.slice(0, 8)}</span>
          </div>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="text-amber-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalog Size</span>
            <svg className="w-5 h-5 text-[#0066FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{products.length} Items</div>
          <span className="mt-1 inline-block text-[11px] text-emerald-400 font-mono">Active in AI Engine</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Guardrail Policy</span>
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">Strict Floor</div>
          <span className="mt-1 inline-block text-[11px] text-slate-400 font-mono">Zero Below Minimum Price</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Settlement Gateway</span>
            <svg className="w-5 h-5 text-[#00C2FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#38BDF8]">Razorpay UPI</div>
          <span className="mt-1 inline-block text-[11px] text-slate-400 font-mono">Instant 1-Click Capture</span>
        </div>
      </div>

      {/* Catalog Products Table */}
      <section className="rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#06152B]/90 to-[#02042B]/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white">Merchant Catalog & Policy Floor</h2>
            <p className="text-xs text-slate-400">Configured bounds, prices, and stock counters</p>
          </div>
          <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-mono text-slate-300">
            {products.length} Products
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-xs font-mono uppercase text-slate-400 bg-slate-900/50">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Product Name</th>
                <th className="py-3 px-3">MRP</th>
                <th className="py-3 px-3">Selling Price</th>
                <th className="py-3 px-3">Min Floor Price</th>
                <th className="py-3 px-3">Stock</th>
                <th className="py-3 px-3">Max Rounds</th>
                <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No products added yet. Add your first product below to start negotiating.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div className="font-semibold text-slate-100">{p.name}</div>
                      <div className="text-xs text-[#38BDF8] font-mono">{p.category}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 line-through">₹{rupees(p.mrp)}</td>
                    <td className="py-3.5 px-3 font-semibold text-white">₹{rupees(p.sellingPrice)}</td>
                    <td className="py-3.5 px-3 font-bold text-emerald-400">₹{rupees(p.minimumPrice)}</td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono font-semibold ${
                        p.inventory > 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                      }`}>
                        {p.inventory > 0 ? `${p.inventory} in stock` : "Out of stock"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300 font-mono">{p.maxRounds} rounds</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-[#38BDF8] hover:border-[#0066FF] hover:bg-[#0066FF]/20 hover:text-white transition-all"
                        onClick={() => bumpInventory(p, p.inventory + 1)}
                      >
                        + Add Stock
                      </button>
                      <button
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
                        onClick={() => failInventory(p)}
                      >
                        Set 0 Stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Product Section */}
      <section className="rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#06152B]/90 to-[#02042B]/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white">Add Product & Define Guardrail Policy</h2>
          <p className="text-xs text-slate-400">
            Set MRP, Selling Price, Cost Price, Minimum Floor Price, and Concession Mode for the AI Agent.
          </p>
        </div>
        <MerchantForm onCreated={() => load()} />
      </section>
    </div>
  );
}

