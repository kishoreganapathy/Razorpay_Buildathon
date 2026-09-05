"use client";

import { useState } from "react";

const empty = {
  name: "",
  category: "TV",
  description: "",
  size: "55 inch",
  resolution: "4K",
  mrp: 50000,
  sellingPrice: 48000,
  minimumPrice: 44000,
  maxDiscount: 4000,
  minProfitMargin: 0.08,
  costPrice: 40000,
  inventory: 10,
  maxRounds: 3,
  offerValidityMinutes: 10,
  concessionMode: "LINEAR",
  warrantyMonths: 24,
  deliveryDays: 2,
};

export function MerchantForm({ onCreated }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        attributes: { size: form.size, resolution: form.resolution },
        mrp: Number(form.mrp),
        sellingPrice: Number(form.sellingPrice),
        minimumPrice: Number(form.minimumPrice),
        maxDiscount: Number(form.maxDiscount),
        minProfitMargin: Number(form.minProfitMargin),
        costPrice: Number(form.costPrice),
        inventory: Number(form.inventory),
        maxRounds: Number(form.maxRounds),
        offerValidityMinutes: Number(form.offerValidityMinutes),
        warrantyMonths: Number(form.warrantyMonths),
        deliveryDays: Number(form.deliveryDays),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save product");
      return;
    }
    setForm(empty);
    onCreated?.(data.product);
  }

  const field = (label, key, type = "text") => (
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
      <span className="mb-1.5 inline-block">{label}</span>
      <input
        type={type}
        step={type === "number" ? "any" : undefined}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all"
        required
      />
    </label>
  );

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      {field("Product Name", "name")}
      {field("Category", "category")}

      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 sm:col-span-2">
        <span className="mb-1.5 inline-block">Product Description</span>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows="2"
          className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all"
          required
        />
      </label>

      {field("Display Size", "size")}
      {field("Resolution", "resolution")}

      {/* Pricing Guardrail Group */}
      <div className="sm:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3 text-xs font-bold uppercase tracking-wider text-[#38BDF8] border-b border-slate-800/60 pb-2">
          Pricing Bounds & Guardrail Config
        </div>
        {field("MRP (₹)", "mrp", "number")}
        {field("Selling Price (₹)", "sellingPrice", "number")}
        {field("Minimum Floor Price (₹)", "minimumPrice", "number")}
        {field("Max Discount (₹)", "maxDiscount", "number")}
        {field("Cost Price (₹)", "costPrice", "number")}
        {field("Min Profit Margin (0-1)", "minProfitMargin", "number")}
      </div>

      {/* Negotiation Parameters Group */}
      <div className="sm:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3 text-xs font-bold uppercase tracking-wider text-[#00C2FF] border-b border-slate-800/60 pb-2">
          Inventory & Negotiation Parameters
        </div>
        {field("Available Inventory", "inventory", "number")}
        {field("Max Negotiation Rounds", "maxRounds", "number")}
        {field("Offer Validity (mins)", "offerValidityMinutes", "number")}
        {field("Warranty (Months)", "warrantyMonths", "number")}
        {field("Delivery Time (Days)", "deliveryDays", "number")}
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          <span className="mb-1.5 inline-block">Concession Mode</span>
          <select
            value={form.concessionMode}
            onChange={(e) => set("concessionMode", e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all"
          >
            <option value="LINEAR">LINEAR (Equal Concessions)</option>
            <option value="SCHEDULE">SCHEDULE (Custom Step Policy)</option>
          </select>
        </label>
      </div>

      {error && (
        <div className="sm:col-span-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      <button
        disabled={saving}
        className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0066FF] via-[#0077FF] to-[#00C2FF] py-3.5 px-6 font-bold text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving Guardrail Policy…
          </span>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Product & Deploy Policy Guardrails</span>
          </>
        )}
      </button>
    </form>
  );
}

