import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { firestoreDb } from "@/lib/firebase";
import {
  syncListingToWordPress,
  uploadImagesToWordPress,
} from "@/services/wpSyncService";
export function SellPage() {
  const { user, ready } = useAuth();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    title: "",
    location: "",
    propertyType: "House",
    price: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    garage: "",
    description: "",
    features: "",
    phone: "",
  });
  const [imageFiles, setImageFiles] = useState<Array<File | null>>([
    null,
    null,
    null,
  ]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        phone: prev.phone || "",
      }));
    }
  }, [user]);

  const statusLabel = useMemo(() => "For Sale", []);
  const filledCore = useMemo(
    () => [form.title, form.location, form.price, form.bedrooms, form.bathrooms, form.area]
      .every((v) => String(v).trim() !== ""),
    [form]
  );
  const photosSelected = useMemo(
    () => imageFiles.some((f) => f instanceof File),
    [imageFiles]
  );
  const progressCount = Number(filledCore) + Number(photosSelected) + Number(Boolean(publishedSlug));
  const canGoNext = form.title.trim() !== "" && form.location.trim() !== "" && form.price.trim() !== "";

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-10 sm:px-6">
          <div className="w-full rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">List your property</h1>
            <p className="mt-2 text-sm text-slate-500">
              Please log in first to publish your own listing.
            </p>
            <Link
              to="/login?redirect=/sell"
              className="mt-6 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Log in to continue
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="mb-5 flex items-center gap-2">
            <span className="rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand">
              Selling page
            </span>
            <Link
              to="/rent-out"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
            >
              Renting page
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Post your listing</h1>
          <p className="mt-1 text-sm text-slate-500">
            Built for sellers: set price, upload photos, and publish.
          </p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              Next steps progress ({progressCount}/3)
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${(progressCount / 3) * 100}%` }}
              />
            </div>
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              <li>{filledCore ? "✓" : "•"} Fill listing details</li>
              <li>{photosSelected ? "✓" : "•"} Add at least one photo</li>
              <li>{publishedSlug ? "✓" : "•"} Publish listing</li>
            </ul>
            {publishedSlug && (
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  to={`/property/${publishedSlug}`}
                  className="text-xs font-semibold text-brand hover:text-brand-dark"
                >
                  View live listing
                </Link>
                <Link
                  to="/my-listings"
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                  Manage my listings
                </Link>
              </div>
            )}
          </div>

          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (step === 1) return;
              setSubmitting(true);
              try {
                const selectedFiles = imageFiles.filter(
                  (f): f is File => f instanceof File
                );
                let uploadedImages: Array<{ id: number; url: string }> = [];
                if (selectedFiles.length > 0) {
                  uploadedImages = await uploadImagesToWordPress(selectedFiles);
                }
                const title = form.title.trim();
                const location = form.location.trim();
                const description = form.description.trim();
                const features = form.features
                  .split(",")
                  .map((f) => f.trim())
                  .filter(Boolean);
                const images = uploadedImages.map((img) => img.url).slice(0, 3);
                const imageIds = uploadedImages.map((img) => img.id).slice(0, 3);
                const price = Number(form.price);
                const bedrooms = Number(form.bedrooms);
                const bathrooms = Number(form.bathrooms);
                const area = Number(form.area);
                const garage = Number(form.garage);
                const id = Date.now();
                const slugBase = title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "")
                  .slice(0, 70);

                const newRef = await addDoc(collection(firestoreDb, "user_properties"), {
                  id,
                  slug: `${slugBase || "listing"}-${id}`,
                  ownerId: user.id,
                  ownerName: user.name,
                  ownerEmail: user.email ?? "",
                  ownerPhotoUrl: user.photoUrl ?? "",
                  title,
                  location,
                  listingStatus: "for_sale",
                  propertyType: form.propertyType,
                  price: Number.isFinite(price) ? price : 0,
                  bedrooms: Number.isFinite(bedrooms) ? bedrooms : 0,
                  bathrooms: Number.isFinite(bathrooms) ? bathrooms : 0,
                  area: Number.isFinite(area) ? area : 0,
                  garage: Number.isFinite(garage) ? garage : 0,
                  images,
                  description:
                    description || `User listed this property on Bookora (${statusLabel}).`,
                  features,
                  phone: form.phone.trim(),
                  status: "active",
                  wpPostId: 0,
                  createdAt: serverTimestamp(),
                });
                setPublishedSlug(`${slugBase || "listing"}-${id}`);
                try {
                  const wpPostId = await syncListingToWordPress({
                    title,
                    description:
                      description || `User listed this property on Bookora (${statusLabel}).`,
                    location,
                    listingStatus: "for_sale",
                    propertyType: form.propertyType,
                    price: Number.isFinite(price) ? price : 0,
                    bedrooms: Number.isFinite(bedrooms) ? bedrooms : 0,
                    bathrooms: Number.isFinite(bathrooms) ? bathrooms : 0,
                    area: Number.isFinite(area) ? area : 0,
                    garage: Number.isFinite(garage) ? garage : 0,
                    images,
                    imageIds,
                    features,
                    listerName: user.name,
                    listerPhone: form.phone.trim(),
                    listerPhotoUrl: user.photoUrl ?? "",
                  });
                  if (wpPostId && Number.isFinite(wpPostId)) {
                    await updateDoc(newRef, { wpPostId });
                  }
                  showToast("Listing published and synced to WordPress");
                } catch {
                  showToast("Listing published. WordPress sync failed.", "error");
                }
              } catch {
                showToast("Could not publish listing", "error");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {step === 1 ? (
              <>
                <Field
                  label="Listing title"
                  value={form.title}
                  onChange={(v) => setForm((p) => ({ ...p, title: v }))}
                  required
                />
                <Field
                  label="Location"
                  value={form.location}
                  onChange={(v) => setForm((p) => ({ ...p, location: v }))}
                  required
                />
                <Field
                  label="Price"
                  value={form.price}
                  onChange={(v) => setForm((p) => ({ ...p, price: v }))}
                  required
                  type="number"
                />
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!canGoNext}
                    className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <Field
                  label="Photo 1"
                  type="file"
                  fileName={imageFiles[0]?.name ?? ""}
                  onFileChange={(file) =>
                    setImageFiles((prev) => [file, prev[1], prev[2]])
                  }
                />
                <Field
                  label="Photo 2"
                  type="file"
                  fileName={imageFiles[1]?.name ?? ""}
                  onFileChange={(file) =>
                    setImageFiles((prev) => [prev[0], file, prev[2]])
                  }
                />
                <Field
                  label="Photo 3"
                  type="file"
                  fileName={imageFiles[2]?.name ?? ""}
                  onFileChange={(file) =>
                    setImageFiles((prev) => [prev[0], prev[1], file])
                  }
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Property type
                  </label>
                  <select
                    value={form.propertyType}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, propertyType: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
                  >
                    <option>House</option>
                    <option>Condo</option>
                    <option>Townhome</option>
                    <option>Apartment</option>
                    <option>Land</option>
                  </select>
                </div>
                <Field
                  label="Bedrooms"
                  value={form.bedrooms}
                  onChange={(v) => setForm((p) => ({ ...p, bedrooms: v }))}
                  required
                  type="number"
                />
                <div>
                  <Field
                    label="Bathrooms"
                    value={form.bathrooms}
                    onChange={(v) => setForm((p) => ({ ...p, bathrooms: v }))}
                    required
                    type="number"
                  />
                </div>
                <Field
                  label="Area (sqft)"
                  value={form.area}
                  onChange={(v) => setForm((p) => ({ ...p, area: v }))}
                  required
                  type="number"
                />
                <Field
                  label="Garage spaces"
                  value={form.garage}
                  onChange={(v) => setForm((p) => ({ ...p, garage: v }))}
                  type="number"
                />
                <Field
                  label="Contact phone"
                  value={form.phone}
                  onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                />
                <Field
                  label="Features (comma separated)"
                  value={form.features}
                  onChange={(v) => setForm((p) => ({ ...p, features: v }))}
                  placeholder="Pool, Pet Friendly, Garage"
                />
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Message
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
                    placeholder={`Describe your ${statusLabel.toLowerCase()} listing.`}
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Publishing..." : "Publish listing"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  fileName,
  onFileChange,
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  fileName?: string;
  onFileChange?: (file: File | null) => void;
}) {
  if (type === "file") {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange?.(e.target.files?.[0] ?? null)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-brand file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 focus:ring-2"
        />
        {fileName ? <p className="mt-1 text-xs text-slate-500">{fileName}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
      />
    </div>
  );
}
