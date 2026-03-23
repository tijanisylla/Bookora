import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { firestoreDb } from "@/lib/firebase";
import { syncListingToWordPress, uploadImagesToWordPress } from "@/services/wpSyncService";

export function RentOutPage() {
  const { user, ready } = useAuth();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    title: "",
    location: "",
    propertyType: "Apartment",
    price: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    garage: "",
    description: "",
    features: "",
    phone: "",
  });
  const [imageFiles, setImageFiles] = useState<Array<File | null>>([null, null, null]);
  const filledCore =
    form.title.trim() &&
    form.location.trim() &&
    form.price.trim() &&
    form.bedrooms.trim() &&
    form.bathrooms.trim() &&
    form.area.trim();
  const photosSelected = imageFiles.some((f) => f instanceof File);
  const progressCount = Number(Boolean(filledCore)) + Number(photosSelected) + Number(Boolean(publishedSlug));
  const canGoNext = form.title.trim() !== "" && form.location.trim() !== "" && form.price.trim() !== "";

  useEffect(() => {
    if (user) {
      setForm((prev) => ({ ...prev, phone: prev.phone || "" }));
    }
  }, [user]);

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
            <h1 className="text-2xl font-bold text-slate-900">Rent out your property</h1>
            <p className="mt-2 text-sm text-slate-500">
              Please log in first to publish your rental listing.
            </p>
            <Link
              to="/login?redirect=/rent-out"
              className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
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
            <Link to="/sell" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-brand hover:text-brand">
              Selling page
            </Link>
            <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              Renting page
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Post rental listing</h1>
          <p className="mt-1 text-sm text-slate-500">
            Built for landlords: set monthly rent, upload photos, and publish.
          </p>
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">
              Next steps progress ({progressCount}/3)
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${(progressCount / 3) * 100}%` }}
              />
            </div>
            <ul className="mt-3 space-y-1 text-xs text-emerald-900">
              <li>{filledCore ? "✓" : "•"} Fill rental details</li>
              <li>{photosSelected ? "✓" : "•"} Add at least one photo</li>
              <li>{publishedSlug ? "✓" : "•"} Publish rental</li>
            </ul>
            {publishedSlug && (
              <div className="mt-3 flex flex-wrap gap-3">
                <Link to={`/property/${publishedSlug}`} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                  View live listing
                </Link>
                <Link to="/my-listings" className="text-xs font-semibold text-slate-700 hover:text-slate-900">
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
                const selectedFiles = imageFiles.filter((f): f is File => f instanceof File);
                let uploadedImages: Array<{ id: number; url: string }> = [];
                if (selectedFiles.length > 0) uploadedImages = await uploadImagesToWordPress(selectedFiles);

                const title = form.title.trim();
                const location = form.location.trim();
                const description = form.description.trim();
                const features = form.features.split(",").map((f) => f.trim()).filter(Boolean);
                const images = uploadedImages.map((img) => img.url).slice(0, 3);
                const imageIds = uploadedImages.map((img) => img.id).slice(0, 3);
                const price = Number(form.price);
                const bedrooms = Number(form.bedrooms);
                const bathrooms = Number(form.bathrooms);
                const area = Number(form.area);
                const garage = Number(form.garage);
                const id = Date.now();
                const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);

                const newRef = await addDoc(collection(firestoreDb, "user_properties"), {
                  id,
                  slug: `${slugBase || "listing"}-${id}`,
                  ownerId: user.id,
                  ownerName: user.name,
                  ownerEmail: user.email ?? "",
                  ownerPhotoUrl: user.photoUrl ?? "",
                  title,
                  location,
                  listingStatus: "for_rent",
                  propertyType: form.propertyType,
                  price: Number.isFinite(price) ? price : 0,
                  bedrooms: Number.isFinite(bedrooms) ? bedrooms : 0,
                  bathrooms: Number.isFinite(bathrooms) ? bathrooms : 0,
                  area: Number.isFinite(area) ? area : 0,
                  garage: Number.isFinite(garage) ? garage : 0,
                  images,
                  description: description || "User listed this rental property on Bookora.",
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
                    description: description || "User listed this rental property on Bookora.",
                    location,
                    listingStatus: "for_rent",
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
                  if (wpPostId && Number.isFinite(wpPostId)) await updateDoc(newRef, { wpPostId });
                  showToast("Rental listing published and synced to WordPress");
                } catch {
                  showToast("Rental listing published. WordPress sync failed.", "error");
                }
              } catch {
                showToast("Could not publish rental listing", "error");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {step === 1 ? (
              <>
                <Field label="Listing title" value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} required />
                <Field label="Location" value={form.location} onChange={(v) => setForm((p) => ({ ...p, location: v }))} required />
                <Field label="Monthly rent" value={form.price} onChange={(v) => setForm((p) => ({ ...p, price: v }))} required type="number" />
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!canGoNext}
                    className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <FileField label="Photo 1" fileName={imageFiles[0]?.name ?? ""} onFileChange={(file) => setImageFiles((prev) => [file, prev[1], prev[2]])} />
                <FileField label="Photo 2" fileName={imageFiles[1]?.name ?? ""} onFileChange={(file) => setImageFiles((prev) => [prev[0], file, prev[2]])} />
                <FileField label="Photo 3" fileName={imageFiles[2]?.name ?? ""} onFileChange={(file) => setImageFiles((prev) => [prev[0], prev[1], file])} />
                <SelectField
                  label="Property type"
                  value={form.propertyType}
                  onChange={(v) => setForm((p) => ({ ...p, propertyType: v }))}
                  options={["Apartment", "Condo", "Townhome", "House", "Studio"]}
                />
                <Field label="Bedrooms" value={form.bedrooms} onChange={(v) => setForm((p) => ({ ...p, bedrooms: v }))} required type="number" />
                <Field label="Bathrooms" value={form.bathrooms} onChange={(v) => setForm((p) => ({ ...p, bathrooms: v }))} required type="number" />
                <Field label="Area (sqft)" value={form.area} onChange={(v) => setForm((p) => ({ ...p, area: v }))} required type="number" />
                <Field label="Garage spaces" value={form.garage} onChange={(v) => setForm((p) => ({ ...p, garage: v }))} type="number" />
                <Field label="Contact phone" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
                <Field label="Features (comma separated)" value={form.features} onChange={(v) => setForm((p) => ({ ...p, features: v }))} placeholder="Pet Friendly, Gym, Parking" />
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Rental description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
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
                    className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Publishing..." : "Publish rental"}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
      />
    </div>
  );
}

function FileField({
  label,
  fileName,
  onFileChange,
}: {
  label: string;
  fileName: string;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-brand file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 focus:ring-2"
      />
      {fileName ? <p className="mt-1 text-xs text-slate-500">{fileName}</p> : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
