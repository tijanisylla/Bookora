import { Link, useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { firestoreDb } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";

export function MyAccountPage() {
  const navigate = useNavigate();
  const { user, ready, logout } = useAuth();
  const { count } = useWishlist();
  const { isAdmin } = useUserRole();
  const [listingsCount, setListingsCount] = useState(0);

  useEffect(() => {
    if (ready && !user) {
      navigate("/login?redirect=/account", { replace: true });
    }
  }, [ready, user, navigate]);

  useEffect(() => {
    if (!user) {
      setListingsCount(0);
      return;
    }
    const q = query(
      collection(firestoreDb, "user_properties"),
      where("ownerId", "==", user.id)
    );
    const off = onSnapshot(q, (snap) => setListingsCount(snap.size));
    return () => off();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your profile, wishlist, and account access.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/profile"
              className="rounded-xl border border-slate-200 p-4 hover:border-brand"
            >
              <p className="text-sm font-semibold text-slate-900">Profile settings</p>
              <p className="mt-1 text-xs text-slate-500">Update name and profile image</p>
            </Link>
            <Link
              to="/wishlist"
              className="rounded-xl border border-slate-200 p-4 hover:border-brand"
            >
              <p className="text-sm font-semibold text-slate-900">
                Wishlist ({count})
              </p>
              <p className="mt-1 text-xs text-slate-500">View saved properties</p>
            </Link>
            <Link
              to="/my-listings"
              className="rounded-xl border border-slate-200 p-4 hover:border-brand"
            >
              <p className="text-sm font-semibold text-slate-900">
                My listings ({listingsCount})
              </p>
              <p className="mt-1 text-xs text-slate-500">View your posted properties</p>
            </Link>
            <Link
              to="/messages"
              className="rounded-xl border border-slate-200 p-4 hover:border-brand"
            >
              <p className="text-sm font-semibold text-slate-900">Messages</p>
              <p className="mt-1 text-xs text-slate-500">Chat with buyers and listers</p>
            </Link>
            <Link
              to="/buyer-dashboard"
              className="rounded-xl border border-slate-200 p-4 hover:border-brand"
            >
              <p className="text-sm font-semibold text-slate-900">Buyer dashboard</p>
              <p className="mt-1 text-xs text-slate-500">Saved homes and conversations</p>
            </Link>
            <Link
              to="/seller-dashboard"
              className="rounded-xl border border-slate-200 p-4 hover:border-brand"
            >
              <p className="text-sm font-semibold text-slate-900">Seller dashboard</p>
              <p className="mt-1 text-xs text-slate-500">Listings and incoming leads</p>
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="rounded-xl border border-brand/30 bg-brand-light/40 p-4 hover:border-brand"
              >
                <p className="text-sm font-semibold text-slate-900">Admin panel</p>
                <p className="mt-1 text-xs text-slate-500">Moderation, flags, and audits</p>
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            Log out
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
