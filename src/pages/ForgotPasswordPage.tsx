import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const { resetPassword, busy, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const prefill = searchParams.get("email");
    if (prefill) setEmail(prefill);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center px-4 py-12 sm:px-6">
        <div className="w-full rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200 sm:p-10">
          <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your account email and we will send a reset link.
          </p>
          {sent && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-100">
              Reset email sent. Open your inbox to create a new password.
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">
              {error}
            </p>
          )}
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setSent(false);
              clearError();
              try {
                await resetPassword(email);
                setSent(true);
              } catch {
                setSent(false);
              }
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email address"
              className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none ring-brand focus:ring-2"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Sending..." : "Send reset link"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            <Link to="/login" className="font-semibold text-brand hover:text-brand-dark">
              Back to login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
