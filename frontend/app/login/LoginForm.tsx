"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Incorrect passphrase.");
        setLoading(false);
        return;
      }
      const next = searchParams.get("next") || "/admin/students";
      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="passphrase" className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Passphrase
        </label>
        <input
          id="passphrase"
          type="password"
          autoFocus
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="border border-slate-700 bg-slate-800 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
          placeholder="Enter the archive passphrase"
        />
      </div>
      {error && <p className="text-sm text-red-300 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit"
        disabled={loading || !passphrase}
        className="mt-1 bg-indigo-600 text-white font-semibold text-sm rounded-lg py-2.5 disabled:opacity-50 transition-opacity hover:opacity-90"
      >
        {loading ? "Signing in…" : "Enter the archive"}
      </button>
    </form>
  );
}
