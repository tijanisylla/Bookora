import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PropertyList } from "@/components/PropertyList";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { useProperties } from "@/hooks/useProperties";
import { useEffect, useMemo } from "react";

export function WishlistPage() {
  const navigate = useNavigate();
  const { user, ready: authReady } = useAuth();
  const { ids, savedAtById, ready: wishlistReady } = useWishlist();
  const { properties, loading, error } = useProperties();

  useEffect(() => {
    if (authReady && !user) {
      navigate("/login?redirect=/wishlist", { replace: true });
    }
  }, [authReady, user, navigate]);

  const wished = useMemo(
    () =>
      properties
        .filter((p) => ids.has(p.id))
        .sort((a, b) => (savedAtById.get(b.id) ?? 0) - (savedAtById.get(a.id) ?? 0)),
    [properties, ids, savedAtById]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-900">My Wishlist</h1>
            <Link to="/" className="text-sm font-semibold text-brand hover:text-brand-dark">
              Browse listings
            </Link>
          </div>
          {!wishlistReady ? (
            <p className="py-8 text-sm text-slate-500">Loading wishlist...</p>
          ) : wished.length === 0 && !loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <HeartIcon />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">No saved homes yet</h2>
              <p className="mt-1 text-sm text-slate-500">
                Tap the heart on any listing to add it here.
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Browse listings
              </Link>
            </div>
          ) : (
            <PropertyList properties={wished} loading={loading} error={error} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function HeartIcon() {
  return (
    <svg
      className="h-6 w-6 text-brand"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}
