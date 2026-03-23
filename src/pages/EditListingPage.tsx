import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { firestoreDb } from "@/lib/firebase";
import {
  syncListingToWordPress,
  updateListingInWordPress,
  uploadImagesToWordPress,
} from "@/services/wpSyncService";
import type { PropertyListingStatus } from "@/types/property";

export function EditListingPage() {
  const navigate = useNavigate();
  const { listingId } = useParams<{ listingId: string }>();
  const { user, ready } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wpPostId, setWpPostId] = useState(0);
  const [form, setForm] = useState({
    title: "",
    location: "",
    listingStatus: "for_sale" as PropertyListingStatus,
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
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<Array<File | null>>([null, null, null]);

  useEffect(() => {
    if (ready && !user) {
      navigate("/login?redirect=/my-listings", { replace: true });
      return;
    }
    if (!user || !listingId) return;
    const ref = doc(firestoreDb, "user_properties", listingId);
    getDoc(ref)
      .then((snap) => {
        if (!snap.exists()) throw new Error("Listing not found");
        const d = snap.data();
        if (d.ownerId !== user.id) throw new Error("Not allowed");
        const listStatus =
          d.listingStatus === "for_rent" || d.listingStatus === "for_sale"
            ? d.listingStatus
            : "for_sale";
        setForm({
          title: String(d.title ?? ""),
          location: String(d.location ?? ""),
          listingStatus: listStatus,
          propertyType: String(d.propertyType ?? "House"),
          price: String(d.price ?? ""),
          bedrooms: String(d.bedrooms ?? ""),
          bathrooms: String(d.bathrooms ?? ""),
          area: String(d.area ?? ""),
          garage: String(d.garage ?? ""),
          description: String(d.description ?? ""),
          features: Array.isArray(d.features) ? d.features.join(", ") : "",
          phone: String(d.phone ?? ""),
        });
        setImages(Array.isArray(d.images) ? d.images.map((x) => String(x)) : []);
        setWpPostId(Number(d.wpPostId) || 0);
      })
      .catch(() => {
        showToast("Could not load listing", "error");
        navigate("/my-listings", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [ready, user, listingId, navigate, showToast]);

  const statusLabel = useMemo(
    () => (form.listingStatus === "for_rent" ? "For Rent" : "For Sale"),
    [form.listingStatus]
  );

  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Edit listing</h1>
          <p className="mt-1 text-sm text-slate-500">
            Update your listing details and keep it in sync.
          </p>
          {images.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Existing photos are kept unless you upload new ones.
            </p>
          )}

          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!listingId || !user) return;
              setSaving(true);
              try {
                const selectedFiles = imageFiles.filter((f): f is File => f instanceof File);
                let uploadedImages: Array<{ id: number; url: string }> = [];
                if (selectedFiles.length > 0) {
                  uploadedImages = await uploadImagesToWordPress(selectedFiles);
                }

                const features = form.features
                  .split(",")
                  .map((f) => f.trim())
                  .filter(Boolean);
                const price = Number(form.price);
                const bedrooms = Number(form.bedrooms);
                const bathrooms = Number(form.bathrooms);
                const area = Number(form.area);
                const garage = Number(form.garage);
                const nextImages =
                  uploadedImages.length > 0
                    ? uploadedImages.map((x) => x.url).slice(0, 3)
                    : images;
                const nextImageIds =
                  uploadedImages.length > 0
                    ? uploadedImages.map((x) => x.id).slice(0, 3)
                    : undefined;
                const payload = {
                  title: form.title.trim(),
                  description:
                    form.description.trim() ||
                    `User listed this property on Bookora (${statusLabel}).`,
                  location: form.location.trim(),
                  listingStatus: form.listingStatus,
                  propertyType: form.propertyType,
                  price: Number.isFinite(price) ? price : 0,
                  bedrooms: Number.isFinite(bedrooms) ? bedrooms : 0,
                  bathrooms: Number.isFinite(bathrooms) ? bathrooms : 0,
                  area: Number.isFinite(area) ? area : 0,
                  garage: Number.isFinite(garage) ? garage : 0,
                  images: nextImages,
                  imageIds: nextImageIds,
                  features,
                  listerName: user.name,
                  listerPhone: form.phone.trim(),
                  listerPhotoUrl: user.photoUrl ?? "",
                };

                const ref = doc(firestoreDb, "user_properties", listingId);
                await updateDoc(ref, {
                  title: payload.title,
                  location: payload.location,
                  listingStatus: payload.listingStatus,
                  propertyType: payload.propertyType,
                  price: payload.price,
                  bedrooms: payload.bedrooms,
                  bathrooms: payload.bathrooms,
                  area: payload.area,
                  garage: payload.garage,
                  images: payload.images,
                  description: payload.description,
                  features: payload.features,
                  phone: form.phone.trim(),
                  ownerPhotoUrl: user.photoUrl ?? "",
                  updatedAt: serverTimestamp(),
                });
                setImages(payload.images);

                try {
                  if (wpPostId > 0) {
                    await updateListingInWordPress(wpPostId, payload);
                  } else {
                    const createdWpId = await syncListingToWordPress(payload);
                    if (createdWpId && Number.isFinite(createdWpId)) {
                      await updateDoc(ref, { wpPostId: createdWpId });
                      setWpPostId(createdWpId);
                    }
                  }
                } catch {
                  showToast("Saved locally. WordPress sync update failed.", "error");
                  setSaving(false);
                  return;
                }

                showToast("Listing updated");
                navigate("/my-listings");
              } catch {
                showToast("Could not update listing", "error");
              } finally {
                setSaving(false);
              }
            }}
          >
            <Field label="Listing title" value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} required />
            <Field label="Location" value={form.location} onChange={(v) => setForm((p) => ({ ...p, location: v }))} required />
            <Field label="Price" value={form.price} onChange={(v) => setForm((p) => ({ ...p, price: v }))} required type="number" />
            <FileField label="Replace photo 1" fileName={imageFiles[0]?.name ?? ""} onFileChange={(file) => setImageFiles((prev) => [file, prev[1], prev[2]])} />
            <FileField label="Replace photo 2" fileName={imageFiles[1]?.name ?? ""} onFileChange={(file) => setImageFiles((prev) => [prev[0], file, prev[2]])} />
            <FileField label="Replace photo 3" fileName={imageFiles[2]?.name ?? ""} onFileChange={(file) => setImageFiles((prev) => [prev[0], prev[1], file])} />
            <SelectField
              label="Listing type"
              value={form.listingStatus}
              onChange={(v) => setForm((p) => ({ ...p, listingStatus: v as PropertyListingStatus }))}
              options={[
                { value: "for_sale", label: "For Sale" },
                { value: "for_rent", label: "For Rent" },
              ]}
            />
            <SelectField
              label="Property type"
              value={form.propertyType}
              onChange={(v) => setForm((p) => ({ ...p, propertyType: v }))}
              options={[
                { value: "House", label: "House" },
                { value: "Condo", label: "Condo" },
                { value: "Townhome", label: "Townhome" },
                { value: "Apartment", label: "Apartment" },
                { value: "Land", label: "Land" },
              ]}
            />
            <Field label="Bedrooms" value={form.bedrooms} onChange={(v) => setForm((p) => ({ ...p, bedrooms: v }))} required type="number" />
            <Field label="Bathrooms" value={form.bathrooms} onChange={(v) => setForm((p) => ({ ...p, bathrooms: v }))} required type="number" />
            <Field label="Area (sqft)" value={form.area} onChange={(v) => setForm((p) => ({ ...p, area: v }))} required type="number" />
            <Field label="Garage spaces" value={form.garage} onChange={(v) => setForm((p) => ({ ...p, garage: v }))} type="number" />
            <Field label="Contact phone" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
            <Field label="Features (comma separated)" value={form.features} onChange={(v) => setForm((p) => ({ ...p, features: v }))} placeholder="Pool, Pet Friendly, Garage" />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Update listing"}
              </button>
              <Link to="/my-listings" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                Cancel
              </Link>
            </div>
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
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
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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
