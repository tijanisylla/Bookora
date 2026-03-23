import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { firestoreDb } from "@/lib/firebase";
import type { Property, PropertyAgent } from "@/types/property";

export interface ContactCardProps {
  agent: PropertyAgent;
  property: Property;
}

export function ContactCard({ agent, property }: ContactCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [imgError, setImgError] = useState(false);
  const hasPhoto = Boolean(agent.photoUrl?.trim()) && !imgError;
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const canMessageOwner = useMemo(
    () => Boolean(property.ownerId && property.ownerId.trim()),
    [property.ownerId]
  );

  return (
    <aside className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-100 lg:sticky lg:top-24">
      <div className="flex flex-col items-center text-center">
        {hasPhoto ? (
          <img
            src={agent.photoUrl}
            alt={agent.name}
            onError={() => setImgError(true)}
            className="h-20 w-20 rounded-full object-cover ring-4 ring-brand-light"
          />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700 ring-4 ring-brand-light">
            {getInitials(agent.name)}
          </span>
        )}
        <h3 className="mt-4 text-lg font-bold text-slate-900">{agent.name}</h3>
        <p className="text-sm text-slate-500">{agent.title}</p>
        <div
          className="mt-2 flex items-center gap-1 text-amber-500"
          aria-label={`Rating ${agent.rating} out of 5`}
        >
          <StarIcon />
          <span className="text-sm font-semibold text-slate-800">
            {agent.rating}
          </span>
        </div>
      </div>

      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!user) {
            navigate(`/login?redirect=/property/${property.slug}`);
            return;
          }
          if (!canMessageOwner) {
            showToast("Messaging is not available for this listing.", "error");
            return;
          }
          if (!form.message.trim()) {
            showToast("Please enter a message.", "error");
            return;
          }
          setSending(true);
          try {
            const threadRef = await addDoc(collection(firestoreDb, "listing_threads"), {
              propertySlug: property.slug,
              propertyTitle: property.title,
              ownerId: property.ownerId,
              ownerName: agent.name,
              ownerPhotoUrl: agent.photoUrl ?? "",
              customerId: user.id,
              customerName: form.name.trim() || user.name,
              customerEmail: form.email.trim() || user.email || "",
              customerPhone: form.phone.trim(),
              customerPhotoUrl: user.photoUrl ?? "",
              lastMessageText: form.message.trim(),
              lastMessageAt: serverTimestamp(),
              unreadForOwner: 1,
              unreadForCustomer: 0,
              createdAt: serverTimestamp(),
            });
            await addDoc(collection(firestoreDb, "listing_threads", threadRef.id, "messages"), {
              senderId: user.id,
              senderName: user.name,
              senderPhotoUrl: user.photoUrl ?? "",
              senderRole: "customer",
              text: form.message.trim(),
              createdAt: serverTimestamp(),
            });
            setForm({ name: "", email: "", phone: "", message: "" });
            showToast("Message sent");
            navigate("/messages");
          } catch {
            showToast("Could not send message", "error");
          } finally {
            setSending(false);
          }
        }}
      >
        <input
          type="text"
          name="name"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
          autoComplete="name"
        />
        <input
          type="email"
          name="email"
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
          autoComplete="email"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
          autoComplete="tel"
        />
        <textarea
          name="message"
          placeholder="Message"
          aria-label="Message"
          rows={4}
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
        />
        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          {sending ? "Sending..." : "Send message"}
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {agent.phone && (
          <a
            href={`tel:${agent.phone.replace(/\D/g, "")}`}
            className="w-full rounded-lg border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Call Now
          </a>
        )}
        <button
          type="button"
          className="w-full rounded-lg border border-brand py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"
        >
          Schedule Tour
        </button>
      </div>
    </aside>
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

function StarIcon() {
  return (
    <svg
      className="h-5 w-5 fill-current"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
