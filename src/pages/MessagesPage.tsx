import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { firestoreDb } from "@/lib/firebase";

type Thread = {
  id: string;
  propertySlug: string;
  propertyTitle: string;
  ownerId: string;
  ownerName: string;
  ownerPhotoUrl: string;
  customerId: string;
  customerName: string;
  customerPhotoUrl: string;
  createdAtMs: number;
  lastMessageAtMs: number;
  unreadForOwner: number;
  unreadForCustomer: number;
};

type Msg = {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl: string;
  text: string;
  createdAtMs: number;
};

export function MessagesPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const { showToast } = useToast();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [browserNotifyEnabled, setBrowserNotifyEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted"
  );
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingClearTimerRef = useRef<number | null>(null);
  const lastIncomingMessageIdRef = useRef<string>("");
  const lastTypingSoundAtRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ready && !user) navigate("/login?redirect=/messages", { replace: true });
  }, [ready, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const ownQ = query(collection(firestoreDb, "listing_threads"), where("ownerId", "==", user.id));
    const custQ = query(collection(firestoreDb, "listing_threads"), where("customerId", "==", user.id));

    let own: Thread[] = [];
    let cust: Thread[] = [];

    const mergeAndSet = () => {
      const map = new Map<string, Thread>();
      [...own, ...cust].forEach((t) => map.set(t.id, t));
      const next = Array.from(map.values()).sort((a, b) => b.lastMessageAtMs - a.lastMessageAtMs);
      setThreads(next);
      if (!selectedThreadId && next.length > 0) setSelectedThreadId(next[0].id);
    };

    const unsubOwn = onSnapshot(ownQ, (snap) => {
      own = snap.docs.map((d) => toThread(d.id, d.data() as Record<string, unknown>));
      mergeAndSet();
    });
    const unsubCust = onSnapshot(custQ, (snap) => {
      cust = snap.docs.map((d) => toThread(d.id, d.data() as Record<string, unknown>));
      mergeAndSet();
    });
    return () => {
      unsubOwn();
      unsubCust();
    };
  }, [user, selectedThreadId]);

  useEffect(() => {
    if (!user || !selectedThreadId) return;
    const thread = threads.find((t) => t.id === selectedThreadId);
    if (!thread) return;
    const field = thread.ownerId === user.id ? "unreadForOwner" : "unreadForCustomer";
    const current = field === "unreadForOwner" ? thread.unreadForOwner : thread.unreadForCustomer;
    if (current <= 0) return;
    void updateDoc(doc(firestoreDb, "listing_threads", selectedThreadId), { [field]: 0 }).catch(
      () => undefined
    );
  }, [user, selectedThreadId, threads]);

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(firestoreDb, "listing_threads", selectedThreadId, "messages"),
      orderBy("createdAt", "asc")
    );
    const off = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => {
          const data = d.data();
          const raw = data.createdAt;
          const ms =
            raw && typeof raw === "object" && "toMillis" in raw
              ? Number((raw as { toMillis: () => number }).toMillis())
              : 0;
          return {
            id: d.id,
            senderId: String(data.senderId ?? ""),
            senderName: String(data.senderName ?? "User"),
            senderPhotoUrl: String(data.senderPhotoUrl ?? ""),
            text: String(data.text ?? ""),
            createdAtMs: Number.isFinite(ms) ? ms : 0,
          };
        })
      );
    });
    return () => off();
  }, [selectedThreadId]);

  useEffect(() => {
    if (!selectedThreadId || !user) {
      setIsOtherTyping(false);
      return;
    }
    const q = collection(firestoreDb, "listing_threads", selectedThreadId, "typing");
    const off = onSnapshot(q, (snap) => {
      let otherTyping = false;
      snap.forEach((d) => {
        if (d.id === user.id) return;
        const data = d.data();
        if (Boolean(data.isTyping)) otherTyping = true;
      });
      setIsOtherTyping(otherTyping);
    });
    return () => off();
  }, [selectedThreadId, user]);

  useEffect(() => {
    return () => {
      if (!user || !selectedThreadId) return;
      void setDoc(
        doc(firestoreDb, "listing_threads", selectedThreadId, "typing", user.id),
        { isTyping: false, updatedAt: serverTimestamp() },
        { merge: true }
      );
      void deleteDoc(
        doc(firestoreDb, "listing_threads", selectedThreadId, "typing", user.id)
      );
    };
  }, [user, selectedThreadId]);

  useEffect(() => {
    if (!user || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (lastIncomingMessageIdRef.current === last.id) return;
    lastIncomingMessageIdRef.current = last.id;
    if (last.senderId === user.id) return;

    playIncomingSound();
    if (
      browserNotifyEnabled &&
      typeof document !== "undefined" &&
      document.visibilityState !== "visible" &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(last.senderName, {
        body: `${last.text.slice(0, 100)}${last.text.length > 100 ? "..." : ""}`,
      });
    }
  }, [messages, user, browserNotifyEnabled]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? null,
    [threads, selectedThreadId]
  );
  const otherParty = useMemo(() => {
    if (!activeThread || !user) return null;
    const iAmOwner = activeThread.ownerId === user.id;
    return {
      name: iAmOwner ? activeThread.customerName : activeThread.ownerName,
      photoUrl: iAmOwner
        ? activeThread.customerPhotoUrl
        : activeThread.ownerPhotoUrl,
    };
  }, [activeThread, user]);

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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <h1 className="text-lg font-bold text-slate-900">Messages</h1>
            <p className="mt-1 text-xs text-slate-500">Conversations with customers and listers.</p>
            <div className="mt-2">
              <button
                type="button"
                onClick={async () => {
                  if (typeof window === "undefined" || !("Notification" in window)) {
                    showToast("Browser notifications are not supported.", "error");
                    return;
                  }
                  const permission = await Notification.requestPermission();
                  const ok = permission === "granted";
                  setBrowserNotifyEnabled(ok);
                  showToast(ok ? "Notifications enabled" : "Notifications blocked", ok ? "success" : "error");
                }}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-brand hover:text-brand"
              >
                {browserNotifyEnabled ? "Notifications on" : "Enable notifications"}
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {threads.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                  No messages yet.
                </p>
              ) : (
                threads.map((t) => {
                  const myUnread =
                    user && t.ownerId === user.id ? t.unreadForOwner : t.unreadForCustomer;
                  return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedThreadId(t.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left ${
                      t.id === selectedThreadId
                        ? "border-brand bg-brand-light/40 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {t.customerPhotoUrl ? (
                        <img
                          src={t.customerPhotoUrl}
                          alt={t.customerName}
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                          {getInitials(t.customerName)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {t.propertyTitle}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {t.customerName} • {formatTime(t.lastMessageAtMs)}
                        </p>
                      </div>
                      {myUnread > 0 && (
                        <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">
                          {myUnread > 99 ? "99+" : myUnread}
                        </span>
                      )}
                    </div>
                  </button>
                );
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {!activeThread ? (
              <p className="p-4 text-sm text-slate-500">Select a conversation.</p>
            ) : (
              <>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 pb-3 pt-4">
                  <div className="flex items-center gap-2">
                    {otherParty?.photoUrl ? (
                      <img
                        src={otherParty.photoUrl}
                        alt={otherParty.name}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                        {getInitials(otherParty?.name ?? activeThread.customerName)}
                      </span>
                    )}
                    <div>
                    <h2 className="text-sm font-bold text-slate-900">{activeThread.propertyTitle}</h2>
                    <p className="text-xs text-slate-500">{otherParty?.name ?? activeThread.customerName}</p>
                    </div>
                  </div>
                  <Link
                    to={`/property/${activeThread.propertySlug}`}
                    className="text-xs font-semibold text-brand hover:text-brand-dark"
                  >
                    Open listing
                  </Link>
                </div>

                <div className="h-[470px] space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white px-4 py-4">
                  {messages.map((m) => {
                    const mine = user && m.senderId === user.id;
                    return (
                      <div
                        key={m.id}
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                          mine
                            ? "ml-auto bg-brand text-white"
                            : "bg-white text-slate-800 ring-1 ring-slate-200"
                        }`}
                      >
                        {!mine && (
                          <div className="mb-1 flex items-center gap-1.5">
                            {m.senderPhotoUrl ? (
                              <img
                                src={m.senderPhotoUrl}
                                alt={m.senderName}
                                className="h-5 w-5 rounded-full object-cover"
                              />
                            ) : (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
                                {getInitials(m.senderName)}
                              </span>
                            )}
                            <p className="text-xs font-semibold">{m.senderName}</p>
                          </div>
                        )}
                        <p>{m.text}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            mine ? "text-blue-100" : "text-slate-500"
                          }`}
                        >
                          {formatTime(m.createdAtMs)}
                        </p>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                {isOtherTyping && (
                  <p className="px-4 pb-1 pt-2 text-xs text-slate-500">Typing...</p>
                )}

                <form
                  className="border-t border-slate-100 bg-white px-4 py-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!user || !activeThread || !reply.trim()) return;
                    setSending(true);
                    try {
                      const senderRole = user.id === activeThread.ownerId ? "owner" : "customer";
                      await addDoc(
                        collection(firestoreDb, "listing_threads", activeThread.id, "messages"),
                        {
                          senderId: user.id,
                          senderName: user.name,
                          senderPhotoUrl: user.photoUrl ?? "",
                          senderRole,
                          text: reply.trim(),
                          createdAt: serverTimestamp(),
                        }
                      );
                      try {
                        await updateDoc(doc(firestoreDb, "listing_threads", activeThread.id), {
                          lastMessageText: reply.trim(),
                          lastMessageAt: serverTimestamp(),
                          ...(senderRole === "owner"
                            ? { unreadForCustomer: increment(1) }
                            : { unreadForOwner: increment(1) }),
                        });
                      } catch {
                        // Message was stored; thread preview/unread metadata may be out of sync.
                      }
                      setReply("");
                      await setDoc(
                        doc(firestoreDb, "listing_threads", activeThread.id, "typing", user.id),
                        { isTyping: false, updatedAt: serverTimestamp() },
                        { merge: true }
                      );
                    } catch {
                      showToast("Could not send reply", "error");
                    } finally {
                      setSending(false);
                    }
                  }}
                >
                  <div className="flex gap-2">
                    <input
                      value={reply}
                      onChange={async (e) => {
                        const next = e.target.value;
                        setReply(next);
                        if (!user || !activeThread) return;
                        await setDoc(
                          doc(firestoreDb, "listing_threads", activeThread.id, "typing", user.id),
                          { isTyping: next.trim().length > 0, updatedAt: serverTimestamp() },
                          { merge: true }
                        );
                        if (typingClearTimerRef.current) {
                          window.clearTimeout(typingClearTimerRef.current);
                        }
                        typingClearTimerRef.current = window.setTimeout(async () => {
                          await setDoc(
                            doc(firestoreDb, "listing_threads", activeThread.id, "typing", user.id),
                            { isTyping: false, updatedAt: serverTimestamp() },
                            { merge: true }
                          );
                        }, 1200);
                      }}
                      onKeyDown={() => {
                        const now = Date.now();
                        if (now - lastTypingSoundAtRef.current < 120) return;
                        lastTypingSoundAtRef.current = now;
                        playTypingSound();
                      }}
                      placeholder="Write a reply..."
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-brand focus:ring-2"
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function toThread(id: string, d: Record<string, unknown>): Thread {
  const raw = d.createdAt;
  const ms =
    raw && typeof raw === "object" && "toMillis" in raw
      ? Number((raw as { toMillis: () => number }).toMillis())
      : 0;
  const rawLast = d.lastMessageAt;
  const lastMs =
    rawLast && typeof rawLast === "object" && "toMillis" in rawLast
      ? Number((rawLast as { toMillis: () => number }).toMillis())
      : ms;
  return {
    id,
    propertySlug: String(d.propertySlug ?? ""),
    propertyTitle: String(d.propertyTitle ?? "Listing"),
    ownerId: String(d.ownerId ?? ""),
    ownerName: String(d.ownerName ?? "Lister"),
    ownerPhotoUrl: String(d.ownerPhotoUrl ?? ""),
    customerId: String(d.customerId ?? ""),
    customerName: String(d.customerName ?? "Customer"),
    customerPhotoUrl: String(d.customerPhotoUrl ?? ""),
    createdAtMs: Number.isFinite(ms) ? ms : 0,
    lastMessageAtMs: Number.isFinite(lastMs) ? lastMs : 0,
    unreadForOwner: typeof d.unreadForOwner === "number" ? d.unreadForOwner : 0,
    unreadForCustomer: typeof d.unreadForCustomer === "number" ? d.unreadForCustomer : 0,
  };
}

function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "now";
  return new Date(ms).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

function playIncomingSound() {
  playTone(880, 0.06, 0.05);
  window.setTimeout(() => playTone(660, 0.06, 0.04), 70);
}

function playTypingSound() {
  playTone(520, 0.02, 0.015);
}

function playTone(freq: number, duration: number, volume: number) {
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
  osc.onended = () => {
    void ctx.close();
  };
}
