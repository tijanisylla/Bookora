import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

export function SignupPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, loginWithFacebook, error, clearError, busy, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-12 sm:px-6">
        <div className="w-full overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
          <div className="grid md:grid-cols-2">
            <div className="hidden flex-col justify-between bg-gradient-to-br from-brand to-blue-700 p-10 text-white md:flex">
              <span className="text-2xl font-bold">Bookora</span>
              <div>
                <h1 className="text-3xl font-bold">Welcome to Bookora</h1>
                <ul className="mt-6 space-y-3 text-sm text-blue-100">
                  <li className="flex gap-2">
                    <CheckBullet />
                    View exclusive listings before they hit the market
                  </li>
                  <li className="flex gap-2">
                    <CheckBullet />
                    Save searches and get instant alerts
                  </li>
                  <li className="flex gap-2">
                    <CheckBullet />
                    Connect with top-rated local agents
                  </li>
                </ul>
              </div>
              <p className="text-xs text-blue-200">
                Your data is protected. We never sell your information.
              </p>
            </div>
            <div className="p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-slate-900">
                Create Account
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Join thousands of happy homeowners.
              </p>
              {error && (
                <p
                  className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <form
                className="mt-8 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const { autoLoggedIn } = await register({
                      name,
                      email,
                      password,
                    });
                    if (!autoLoggedIn) {
                      navigate("/login?registered=1", { replace: true });
                    }
                  } catch {
                    /* error surfaced via context */
                  }
                }}
              >
                <Field
                  icon={<UserIcon />}
                  type="text"
                  name="name"
                  placeholder="Full name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Field
                  icon={<MailIcon />}
                  type="email"
                  name="email"
                  placeholder="Email address"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400">
                    <LockIcon />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-slate-200 py-3 pl-11 pr-12 text-sm outline-none ring-brand focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="terms"
                    required
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  <span>
                    I agree to the{" "}
                    <a
                      href="#"
                      className="font-medium text-brand hover:text-brand-dark"
                    >
                      Terms & Conditions
                    </a>
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "Creating account…" : "Sign Up"}
                </button>
              </form>
              <div className="mt-6">
                <p className="text-center text-xs text-slate-400">
                  Or continue with
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void loginWithGoogle()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <GoogleMark />
                    Google
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void loginWithFacebook()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <FacebookMark />
                    Facebook
                  </button>
                </div>
              </div>
              <p className="mt-8 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-brand hover:text-brand-dark"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function CheckBullet() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
      <svg
        className="h-3 w-3 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
        />
      </svg>
    );
  }
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function Field({
  icon,
  ...props
}: ComponentProps<"input"> & { icon: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </span>
      <input
        {...props}
        className="w-full rounded-lg border border-slate-200 py-3 pl-11 pr-3 text-sm outline-none ring-brand focus:ring-2"
      />
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg
      className="h-5 w-5 text-[#1877F2]"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

