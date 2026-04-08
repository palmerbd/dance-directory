"use client";
import { useState } from "react";

interface Props { studioTitle: string; studioSlug: string; }

export default function LeadCaptureForm({ studioTitle: studioName }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  if (submitted) {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
        <div className="text-2xl mb-2">✅</div>
        <p className="font-semibold text-green-800">Request sent!</p>
        <p className="text-sm text-green-600 mt-1">{studioName} will be in touch soon.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
      className="space-y-3"
    >
      <input
        required type="text" placeholder="Your name"
        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400 text-sm"
      />
      <input
        required type="email" placeholder="Email address"
        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400 text-sm"
      />
      <input
        type="tel" placeholder="Phone (optional)"
        value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400 text-sm"
      />
      <textarea
        rows={3} placeholder="What would you like to know?"
        value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400 text-sm resize-none"
      />
      <button
        type="submit"
        className="w-full py-3 rounded-lg font-bold text-gray-900 transition-all hover:brightness-110"
        style={{ background: "linear-gradient(135deg,#b8922a,#e8c560)" }}
      >
        Request Info
      </button>
    </form>
  );
}
