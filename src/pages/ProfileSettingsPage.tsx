import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

export function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { user, ready, busy, error, clearError, updateProfileSettings } = useAuth();
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (ready && !user) {
      navigate("/login?redirect=/profile", { replace: true });
    }
  }, [ready, user, navigate]);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhotoUrl(user.photoUrl ?? "");
    }
  }, [user]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Header />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Profile settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Update your profile name and photo used in Bookora.
          </p>
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            {photoUrl.trim() ? (
              <img
                src={photoUrl.trim()}
                alt={name || "Profile"}
                className="h-14 w-14 rounded-full object-cover ring-1 ring-slate-200"
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-base font-semibold text-slate-700 ring-1 ring-slate-300">
                {getInitials(name)}
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {name || "Your profile"}
              </p>
              <p className="text-xs text-slate-500">
                {photoUrl.trim()
                  ? "Profile photo preview"
                  : "No photo set - initials are shown"}
              </p>
            </div>
          </div>

          {saved && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-100">
              Profile updated.
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
              setSaved(false);
              try {
                await updateProfileSettings({ name, photoUrl });
                setSaved(true);
              } catch {
                /* surfaced by context */
              }
            }}
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Display name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Profile image URL
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Saving..." : "Save profile"}
              </button>
              <Link
                to="/"
                className="text-sm font-medium text-slate-600 hover:text-brand"
              >
                Back to home
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
