import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { firestoreDb } from "@/lib/firebase";
import { useUserRole } from "@/hooks/useUserRole";

type FlagItem = {
  id: string;
  status: string;
  reason: string;
  listingSlug: string;
  reporterId: string;
  createdAtMs: number;
};

type UserFlagItem = {
  id: string;
  status: string;
  reason: string;
  targetUserId: string;
  reporterId: string;
  createdAtMs: number;
};

type AuditItem = {
  id: string;
  listingId: string;
  listingSlug: string;
  result: "pass" | "warning" | "fail";
  note: string;
  updatedAtMs: number;
  updatedBy: string;
};

export function AdminPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const { isAdmin, loadingRole } = useUserRole();
  const [listingFlags, setListingFlags] = useState<FlagItem[]>([]);
  const [userFlags, setUserFlags] = useState<UserFlagItem[]>([]);
  const [audits, setAudits] = useState<AuditItem[]>([]);

  useEffect(() => {
    if (ready && !user) {
      navigate("/login?redirect=/admin", { replace: true });
    }
  }, [ready, user, navigate]);

  useEffect(() => {
    if (!ready || loadingRole) return;
    if (user && !isAdmin) {
      navigate("/account", { replace: true });
    }
  }, [ready, loadingRole, user, isAdmin, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const offListingFlags = onSnapshot(collection(firestoreDb, "listing_flags"), (snap) => {
      const rows = snap.docs
        .map((d) => {
          const data = d.data() as Record<string, unknown>;
          const raw = data.createdAt;
          const createdAtMs =
            raw && typeof raw === "object" && "toMillis" in raw
              ? Number((raw as { toMillis: () => number }).toMillis())
              : 0;
          return {
            id: d.id,
            status: String(data.status ?? "open"),
            reason: String(data.reason ?? "No reason provided"),
            listingSlug: String(data.listingSlug ?? ""),
            reporterId: String(data.reporterId ?? ""),
            createdAtMs,
          } satisfies FlagItem;
        })
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      setListingFlags(rows);
    });

    const offUserFlags = onSnapshot(collection(firestoreDb, "user_flags"), (snap) => {
      const rows = snap.docs
        .map((d) => {
          const data = d.data() as Record<string, unknown>;
          const raw = data.createdAt;
          const createdAtMs =
            raw && typeof raw === "object" && "toMillis" in raw
              ? Number((raw as { toMillis: () => number }).toMillis())
              : 0;
          return {
            id: d.id,
            status: String(data.status ?? "open"),
            reason: String(data.reason ?? "No reason provided"),
            targetUserId: String(data.targetUserId ?? ""),
            reporterId: String(data.reporterId ?? ""),
            createdAtMs,
          } satisfies UserFlagItem;
        })
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      setUserFlags(rows);
    });

    const offAudits = onSnapshot(collection(firestoreDb, "listing_audits"), (snap) => {
      const rows = snap.docs
        .map((d) => {
          const data = d.data() as Record<string, unknown>;
          const raw = data.updatedAt;
          const updatedAtMs =
            raw && typeof raw === "object" && "toMillis" in raw
              ? Number((raw as { toMillis: () => number }).toMillis())
              : 0;
          const result = String(data.result ?? "warning");
          return {
            id: d.id,
            listingId: String(data.listingId ?? d.id),
            listingSlug: String(data.listingSlug ?? ""),
            result:
              result === "pass" || result === "warning" || result === "fail"
                ? result
                : "warning",
            note: String(data.note ?? ""),
            updatedAtMs,
            updatedBy: String(data.updatedBy ?? ""),
          } satisfies AuditItem;
        })
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      setAudits(rows);
    });

    return () => {
      offListingFlags();
      offUserFlags();
      offAudits();
    };
  }, [user, isAdmin]);

  const openListingFlags = useMemo(
    () => listingFlags.filter((f) => f.status !== "resolved").length,
    [listingFlags]
  );
  const openUserFlags = useMemo(
    () => userFlags.filter((f) => f.status !== "resolved").length,
    [userFlags]
  );

  async function markListingFlagResolved(item: FlagItem) {
    if (!user) return;
    await setDoc(
      doc(firestoreDb, "listing_flags", item.id),
      {
        status: "resolved",
        resolvedAt: serverTimestamp(),
        resolvedBy: user.id,
      },
      { merge: true }
    );
  }

  async function markUserFlagResolved(item: UserFlagItem) {
    if (!user) return;
    await setDoc(
      doc(firestoreDb, "user_flags", item.id),
      {
        status: "resolved",
        resolvedAt: serverTimestamp(),
        resolvedBy: user.id,
      },
      { merge: true }
    );
  }

  async function quickAudit(
    listingSlug: string,
    listingId: string,
    result: "pass" | "warning" | "fail"
  ) {
    if (!user) return;
    await setDoc(
      doc(firestoreDb, "listing_audits", listingId),
      {
        listingId,
        listingSlug,
        result,
        note:
          result === "pass"
            ? "Looks good."
            : result === "warning"
              ? "Needs additional review."
              : "Contains severe moderation issues.",
        updatedAt: serverTimestamp(),
        updatedBy: user.id,
      },
      { merge: true }
    );
  }

  if (!ready || loadingRole) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin panel</h1>
        <p className="mt-1 text-sm text-slate-500">
          Moderation, listing audits, support workflows, and user safety flags.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <StatCard label="Open listing flags" value={openListingFlags} />
          <StatCard label="Open user flags" value={openUserFlags} />
          <StatCard label="Audits logged" value={audits.length} />
        </div>

        <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-sm font-bold text-slate-900">Listing moderation</h2>
          <div className="mt-3 space-y-2">
            {listingFlags.length === 0 ? (
              <p className="text-sm text-slate-500">No listing flags yet.</p>
            ) : (
              listingFlags.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.reason}
                    </p>
                    <p className="text-xs text-slate-500">
                      Listing: {item.listingSlug || "unknown"} · Reporter: {item.reporterId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={item.listingSlug ? `/property/${item.listingSlug}` : "/"}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand hover:text-brand"
                    >
                      Open listing
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        quickAudit(item.listingSlug, item.listingSlug || item.id, "warning")
                      }
                      className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                    >
                      Audit warning
                    </button>
                    <button
                      type="button"
                      onClick={() => markListingFlagResolved(item)}
                      className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-sm font-bold text-slate-900">User flags</h2>
          <div className="mt-3 space-y-2">
            {userFlags.length === 0 ? (
              <p className="text-sm text-slate-500">No user flags yet.</p>
            ) : (
              userFlags.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.reason}
                    </p>
                    <p className="text-xs text-slate-500">
                      Target: {item.targetUserId || "unknown"} · Reporter: {item.reporterId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => markUserFlagResolved(item)}
                    className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    Resolve
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-sm font-bold text-slate-900">Listing audit log</h2>
          <div className="mt-3 space-y-2">
            {audits.length === 0 ? (
              <p className="text-sm text-slate-500">No audits yet.</p>
            ) : (
              audits.slice(0, 12).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 p-3 text-sm"
                >
                  <p className="font-semibold text-slate-900">
                    {item.listingSlug || item.listingId}
                  </p>
                  <p className="text-xs text-slate-500">
                    Result: {item.result} · Updated by: {item.updatedBy}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{item.note}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
