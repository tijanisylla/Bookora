import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { firestoreDb } from "@/lib/firebase";
import { formatPriceUsd } from "@/lib/format";
import {
  deleteListingInWordPress,
  deleteListingInWordPressBySlug,
} from "@/services/wpSyncService";
import type { PropertyListingStatus } from "@/types/property";

type SellerListing = {
  docId: string;
  id: number;
  slug: string;
  title: string;
  location: string;
  listingStatus: PropertyListingStatus;
  price: number;
  wpPostId: number;
  createdAtMs: number;
};

export function MyListingsPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SellerListing[]>([]);

  useEffect(() => {
    if (ready && !user) {
      navigate("/login?redirect=/my-listings", { replace: true });
      return;
    }
    if (!user) return;

    const q = query(
      collection(firestoreDb, "user_properties"),
      where("ownerId", "==", user.id)
    );
    const off = onSnapshot(q, (snap) => {
      const next: SellerListing[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        const listingStatus =
          d.listingStatus === "for_rent" || d.listingStatus === "for_sale"
            ? d.listingStatus
            : "for_sale";
        const createdRaw = d.createdAt;
        let createdAtMs = 0;
        if (createdRaw && typeof createdRaw === "object" && "toMillis" in createdRaw) {
          const ms = Number((createdRaw as { toMillis: () => number }).toMillis());
          if (Number.isFinite(ms)) createdAtMs = ms;
        }
        next.push({
          docId: docSnap.id,
          id: Number(d.id) || Date.now(),
          slug: String(d.slug ?? ""),
          title: String(d.title ?? "Untitled listing"),
          location: String(d.location ?? ""),
          listingStatus,
          price: Number(d.price) || 0,
          wpPostId: Number(d.wpPostId) || 0,
          createdAtMs,
        });
      });
      next.sort((a, b) => b.createdAtMs - a.createdAtMs);
      setItems(next);
      setLoading(false);
    });

    return () => off();
  }, [ready, user, navigate]);

  const publishedCount = useMemo(() => items.length, [items]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
              <p className="mt-1 text-sm text-slate-500">
                You have {publishedCount} published listing{publishedCount === 1 ? "" : "s"}.
              </p>
            </div>
            <Link
              to="/sell"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Add new listing
            </Link>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Loading your listings...</p>
          ) : items.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-600">No listings yet.</p>
              <Link to="/sell" className="mt-3 inline-block text-sm font-semibold text-brand">
                Create your first listing
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              {items.map((item) => {
                const isRent = item.listingStatus === "for_rent";
                return (
                  <div
                    key={`${item.id}-${item.slug}`}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.location}</p>
                      </div>
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${
                          isRent
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {isRent ? "For Rent" : "For Sale"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-brand">
                        {formatPriceUsd(item.price, isRent)}
                      </p>
                      <Link
                        to={`/property/${item.slug}`}
                        className="text-sm font-semibold text-brand hover:text-brand-dark"
                      >
                        View listing
                      </Link>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <Link
                        to={`/my-listings/${item.docId}/edit`}
                        className="font-semibold text-slate-700 hover:text-brand"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="font-semibold text-red-600 hover:text-red-700"
                        onClick={async () => {
                          if (!confirm("Delete this listing?")) return;
                          try {
                            try {
                              if (item.wpPostId > 0) {
                                await deleteListingInWordPress(item.wpPostId);
                              } else {
                                await deleteListingInWordPressBySlug(item.slug);
                              }
                            } catch {
                              try {
                                await deleteListingInWordPressBySlug(item.slug);
                              } catch {
                                showToast(
                                  "Could not delete in WordPress. Try again.",
                                  "error"
                                );
                              }
                            }
                            await deleteDoc(doc(firestoreDb, "user_properties", item.docId));
                            showToast("Listing deleted");
                          } catch {
                            showToast("Could not delete listing", "error");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
