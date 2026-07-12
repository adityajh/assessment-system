import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign in — Assessment System Archive",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-xs tracking-[0.3em] uppercase text-indigo-400 font-semibold mb-2">
            Let&rsquo;s Enterprise
          </div>
          <h1 className="text-3xl font-bold text-white">Assessment System</h1>
          <p className="text-sm text-slate-400 mt-1">Historical archive — cohort 2025 · frozen</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-sm">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="text-center text-[11px] text-slate-500 mt-6">
          Read-only historical record. If you don&rsquo;t have the passphrase, ask Adi.
        </p>
      </div>
    </div>
  );
}
