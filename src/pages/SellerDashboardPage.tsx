import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { firestoreDb } from "@/lib/firebase";

export function SellerDashboardPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [listingsCount, setListingsCount] = useState(0);
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    if (ready && !user) {
      navigate("/login?redirect=/seller-dashboard", { replace: true });
    }
  }, [ready, user, navigate]);

  useEffect(() => {
    if (!user) {
      setListingsCount(0);
      setInboxCount(0);
      return;
    }
    const listingsQ = query(
      collection(firestoreDb, "user_properties"),
      where("ownerId", "==", user.id)
    );
    const threadsQ = query(
      collection(firestoreDb, "listing_threads"),
      where("ownerId", "==", user.id)
    );
    const offListings = onSnapshot(listingsQ, (snap) => setListingsCount(snap.size));
    const offThreads = onSnapshot(threadsQ, (snap) => setInboxCount(snap.size));
    return () => {
      offListings();
      offThreads();
    };
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
          <h1 className="text-2xl font-bold text-slate-900">Seller Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your listings and buyer conversations.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard title="Active listings" value={String(listingsCount)} />
            <StatCard title="Message threads" value={String(inboxCount)} />
            <StatCard title="Next step" value={listingsCount === 0 ? "Add first listing" : "Reply to buyers"} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <QuickLink to="/sell" title="Create sale listing" subtitle="Post a property for sale" />
            <QuickLink to="/rent-out" title="Create rental listing" subtitle="Post a property for rent" />
            <QuickLink to="/my-listings" title="Manage listings" subtitle="Edit and delete your listings" />
            <QuickLink to="/messages" title="Open inbox" subtitle="Read and reply to buyer messages" />
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
