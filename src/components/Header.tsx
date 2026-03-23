import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { firestoreDb } from "@/lib/firebase";
import { useUserRole } from "@/hooks/useUserRole";

const navInactive =
  "border-b-2 border-transparent px-1 py-1 text-sm font-medium text-slate-600 transition-colors hover:text-brand";
const navActive =
  "border-b-2 border-brand px-1 py-1 text-sm font-semibold text-brand";

export function Header() {
  const { user, ready, logout, resendVerificationEmail } = useAuth();
  const { isAdmin } = useUserRole();
  const { count: wishlistCount } = useWishlist();
  const [listingsCount, setListingsCount] = useState(0);
  const [inboxCount, setInboxCount] = useState(0);
  const [messageMenuOpen, setMessageMenuOpen] = useState(false);
  const [threadsPreview, setThreadsPreview] = useState<
    Array<{
      id: string;
      propertyTitle: string;
      customerName: string;
      lastMessageAtMs: number;
      unreadForMe: number;
    }>
  >([]);
  const { search, pathname } = useLocation();
  const listing = new URLSearchParams(search).get("listing");
  const [menuOpen, setMenuOpen] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const messageMenuRef = useRef<HTMLDivElement | null>(null);
  const previousUnreadCountRef = useRef(0);

  useEffect(() => {
    if (!user) {
      setListingsCount(0);
      return;
    }
    const q = query(
      collection(firestoreDb, "user_properties"),
      where("ownerId", "==", user.id)
    );
    const off = onSnapshot(q, (snap) => {
      setListingsCount(snap.size);
    });
    return () => off();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setInboxCount(0);
      setThreadsPreview([]);
      previousUnreadCountRef.current = 0;
      return;
    }
    const ownQ = query(
      collection(firestoreDb, "listing_threads"),
      where("ownerId", "==", user.id)
    );
    const custQ = query(
      collection(firestoreDb, "listing_threads"),
      where("customerId", "==", user.id)
    );

    let own: Array<{
      id: string;
      propertyTitle: string;
      customerName: string;
      lastMessageAtMs: number;
      unreadForMe: number;
    }> = [];
    let cust: Array<{
      id: string;
      propertyTitle: string;
      customerName: string;
      lastMessageAtMs: number;
      unreadForMe: number;
    }> = [];

    const merge = () => {
      const map = new Map<
        string,
        {
          id: string;
          propertyTitle: string;
          customerName: string;
          lastMessageAtMs: number;
          unreadForMe: number;
        }
      >();
      [...own, ...cust].forEach((t) => map.set(t.id, t));
      const next = Array.from(map.values()).sort((a, b) => b.lastMessageAtMs - a.lastMessageAtMs);
      setThreadsPreview(next.slice(0, 5));
      const totalUnread = next.reduce((sum, t) => sum + t.unreadForMe, 0);
      setInboxCount(totalUnread);

      if (totalUnread > previousUnreadCountRef.current) {
        playIncomingSound();
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          typeof document !== "undefined" &&
          document.visibilityState !== "visible"
        ) {
          const n = totalUnread - previousUnreadCountRef.current;
          new Notification("New message", {
            body:
              n === 1
                ? "You have 1 unread message."
                : `You have ${n} new messages (${totalUnread} unread total).`,
          });
        }
      }
      previousUnreadCountRef.current = totalUnread;
    };

    const offOwn = onSnapshot(ownQ, (snap) => {
      own = snap.docs.map((d) => {
        const data = d.data();
        const raw = data.createdAt;
        const ms =
          raw && typeof raw === "object" && "toMillis" in raw
            ? Number((raw as { toMillis: () => number }).toMillis())
            : 0;
        const rawLast = data.lastMessageAt;
        const lastMs =
          rawLast && typeof rawLast === "object" && "toMillis" in rawLast
            ? Number((rawLast as { toMillis: () => number }).toMillis())
            : ms;
        const unreadForMe = Number(data.unreadForOwner ?? 0);
        return {
          id: d.id,
          propertyTitle: String(data.propertyTitle ?? "Listing"),
          customerName: String(data.customerName ?? "Customer"),
          lastMessageAtMs: Number.isFinite(lastMs) ? lastMs : 0,
          unreadForMe: Number.isFinite(unreadForMe) ? unreadForMe : 0,
        };
      });
      merge();
    });
    const offCust = onSnapshot(custQ, (snap) => {
      cust = snap.docs.map((d) => {
        const data = d.data();
        const raw = data.createdAt;
        const ms =
          raw && typeof raw === "object" && "toMillis" in raw
            ? Number((raw as { toMillis: () => number }).toMillis())
            : 0;
        const rawLast = data.lastMessageAt;
        const lastMs =
          rawLast && typeof rawLast === "object" && "toMillis" in rawLast
            ? Number((rawLast as { toMillis: () => number }).toMillis())
            : ms;
        const unreadForMe = Number(data.unreadForCustomer ?? 0);
        return {
          id: d.id,
          propertyTitle: String(data.propertyTitle ?? "Listing"),
          customerName: String(data.customerName ?? "Customer"),
          lastMessageAtMs: Number.isFinite(lastMs) ? lastMs : 0,
          unreadForMe: Number.isFinite(unreadForMe) ? unreadForMe : 0,
        };
      });
      merge();
    });
    return () => {
      offOwn();
      offCust();
    };
  }, [user]);

  useEffect(() => {
    if (!menuOpen && !messageMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (messageMenuRef.current && !messageMenuRef.current.contains(e.target as Node)) {
        setMessageMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMessageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen, messageMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur">
      {user && user.emailVerified === false && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <span>
              Verify your email to secure your account.
            </span>
            <button
              type="button"
              onClick={async () => {
                try {
                  await resendVerificationEmail();
                  setVerificationNotice("Verification email sent.");
                } catch {
                  setVerificationNotice("Could not send verification email.");
                }
              }}
              className="font-semibold text-amber-900 underline underline-offset-2"
            >
              Resend
            </button>
          </div>
          {verificationNotice && (
            <p className="mx-auto mt-1 max-w-7xl text-xs text-amber-800">
              {verificationNotice}
            </p>
          )}
        </div>
      )}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-brand"
          aria-label="Bookora home"
        >
          Bookora
        </Link>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
          <Link
            to="/?listing=for_sale"
            className={
              pathname === "/" && listing === "for_sale" ? navActive : navInactive
            }
          >
            Buy
          </Link>
          <Link
            to="/?listing=for_rent"
            className={
              pathname === "/" && listing === "for_rent" ? navActive : navInactive
            }
          >
            Rent
          </Link>
          <Link
            to="/sell"
            className={pathname === "/sell" ? navActive : navInactive}
          >
            Sell
          </Link>
          <Link
            to="/rent-out"
            className={pathname === "/rent-out" ? navActive : navInactive}
          >
            Rent Out
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/#hero-search"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-brand"
            aria-label="Search properties"
          >
            <SearchIcon />
          </Link>
          {user && (
            <div className="relative" ref={messageMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setMessageMenuOpen((v) => !v);
                  setMenuOpen(false);
                }}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-brand"
                aria-label="Open messages"
                aria-expanded={messageMenuOpen}
                aria-haspopup="menu"
              >
                <MessageIcon />
                {inboxCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {inboxCount > 99 ? "99+" : inboxCount}
                  </span>
                )}
              </button>
              {messageMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl"
                >
                  <div className="flex items-center justify-between px-4 pb-1 pt-1">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <MessageIcon className="h-4 w-4 text-slate-400" />
                      Messages
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (typeof window === "undefined" || !("Notification" in window)) return;
                        await Notification.requestPermission();
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-brand"
                    >
                      Enable notifications
                    </button>
                  </div>
                  {threadsPreview.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-slate-500">No messages yet.</p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {threadsPreview.map((t) => (
                        <Link
                          key={t.id}
                          to="/messages"
                          onClick={() => setMessageMenuOpen(false)}
                          className="block px-4 py-2 hover:bg-slate-50"
                        >
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {t.propertyTitle}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {t.unreadForMe > 0 ? (
                              <span className="font-semibold text-brand">{t.unreadForMe} new · </span>
                            ) : null}
                            {t.customerName} · {formatMenuTime(t.lastMessageAtMs)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                  <Link
                    to="/messages"
                    onClick={() => {
                      setMessageMenuOpen(false);
                    }}
                    className="mt-1 block border-t border-slate-100 px-4 py-2 text-sm font-semibold text-brand hover:bg-slate-50"
                  >
                    Open inbox
                  </Link>
                </div>
              )}
            </div>
          )}
          {!ready ? (
            <span className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen((v) => !v);
                  setMessageMenuOpen(false);
                }}
                className="flex items-center gap-2 rounded-full px-2 py-1.5 transition hover:bg-slate-100"
                aria-label="Open profile menu"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                {user.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {getInitials(user.name)}
                  </span>
                )}
                <span className="hidden max-w-[140px] truncate text-sm font-medium text-slate-800 sm:inline">
                  {user.name}
                </span>
                <ChevronDownIcon />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl"
                >
                  <p className="px-4 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Account
                  </p>
                  <Link
                    to="/account"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand"
                  >
                    My account
                  </Link>
                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand"
                  >
                    Profile settings
                  </Link>
                  <Link
                    to="/wishlist"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand"
                  >
                    <span>Wishlist</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {wishlistCount}
                    </span>
                  </Link>
                  <Link
                    to="/my-listings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand"
                  >
                    <span>My listings</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {listingsCount}
                    </span>
                  </Link>
                  <Link
                    to="/messages"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand"
                  >
                    <MessageIcon className="h-5 w-5 shrink-0 text-slate-500" />
                    Messages
                  </Link>
                  <Link
                    to="/buyer-dashboard"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand"
                  >
                    Buyer dashboard
                  </Link>
                  <Link
                    to="/seller-dashboard"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand"
                  >
                    Seller dashboard
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm font-semibold text-brand hover:bg-slate-50"
                    >
                      Admin panel
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-brand"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
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
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-500"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.12l3.71-3.9a.75.75 0 111.08 1.04l-4.25 4.47a.75.75 0 01-1.08 0L5.21 8.26a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MessageIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden
    >
      <path
        d="M4 5.5C4 4.67 4.67 4 5.5 4H18.5C19.33 4 20 4.67 20 5.5V13.5C20 14.33 19.33 15 18.5 15H9.5L5 19V15H5.5C4.67 15 4 14.33 4 13.5V5.5Z"
        strokeLinejoin="round"
      />
      <line x1="7" y1="8" x2="17" y2="8" strokeLinecap="round" />
      <line x1="7" y1="11" x2="14" y2="11" strokeLinecap="round" />
    </svg>
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

function formatMenuTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "now";
  return new Date(ms).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function playIncomingSound() {
  if (typeof window === "undefined") return;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const tone = (freq: number, startOffset: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.045;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + startOffset);
    osc.stop(ctx.currentTime + startOffset + 0.07);
  };
  tone(880, 0);
  tone(660, 0.08);
  window.setTimeout(() => {
    void ctx.close();
  }, 260);
}

