import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { firestoreDb } from "@/lib/firebase";

export function BuyerDashboardPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const [threadsCount, setThreadsCount] = useState(0);

  useEffect(() => {
    if (ready && !user) {
      navigate("/login?redirect=/buyer-dashboard", { replace: true });
    }
  }, [ready, user, navigate]);

  useEffect(() => {
    if (!user) {
      setThreadsCount(0);
      return;
    }
    const threadsQ = query(
      collection(firestoreDb, "listing_threads"),
      where("customerId", "==", user.id)
    );
    const off = onSnapshot(threadsQ, (snap) => setThreadsCount(snap.size));
    return () => off();
  }, [user]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Buyer Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track saved properties and conversations with sellers.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard title="Saved listings" value={String(wishlistCount)} />
            <StatCard title="Message threads" value={String(threadsCount)} />
            <StatCard title="Next step" value={wishlistCount === 0 ? "Save listings" : "Message owners"} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <QuickLink to="/" title="Browse homes" subtitle="Search sale and rental listings" />
            <QuickLink to="/wishlist" title="Open wishlist" subtitle="Review your saved properties" />
            <QuickLink to="/messages" title="Open inbox" subtitle="Continue your conversations" />
            <QuickLink to="/profile" title="Profile settings" subtitle="Update your account information" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function QuickLink({
  to,
  title,
  subtitle,
}: {
  to: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link to={to} className="rounded-xl border border-slate-200 p-4 hover:border-brand">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </Link>
  );
}
