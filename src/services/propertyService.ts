import { MOCK_PROPERTIES } from "@/data/properties";
import { collection, getDocs } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";
import {
  finalizeWpProperty,
  mapWpPropertyToProperty as mapWp,
} from "@/lib/wpMap";
import type { Property } from "@/types/property";
import type { WpPropertyRestResponse } from "@/types/wpProperty";

export const PROPERTIES_REST_PATH = "/properties";

const API_BASE =
  import.meta.env.VITE_WP_API_BASE ?? "http://bookora.local/wp-json/wp/v2";

export function mapWpPropertyToProperty(raw: unknown): Property {
  return mapWp(raw as WpPropertyRestResponse);
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

async function fetchUserProperties(): Promise<Property[]> {
  const snap = await getDocs(collection(firestoreDb, "user_properties"));
  const out: Property[] = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const id = Number(d.id);
    const title = String(d.title ?? "").trim();
    const location = String(d.location ?? "").trim();
    const listingStatus =
      d.listingStatus === "for_sale" || d.listingStatus === "for_rent"
        ? d.listingStatus
        : "for_sale";
    if (!Number.isFinite(id) || !title || !location) return;
    out.push({
      id,
      sourceDocId: docSnap.id,
      ownerId: String(d.ownerId ?? ""),
      slug: String(d.slug ?? "") || `${toSlug(title)}-${id}`,
      title,
      price: Number(d.price) || 0,
      location,
      bedrooms: Number(d.bedrooms) || 0,
      bathrooms: Number(d.bathrooms) || 0,
      area: Number(d.area) || 0,
      garage: Number.isFinite(Number(d.garage)) ? Number(d.garage) : undefined,
      images:
        Array.isArray(d.images) && d.images.length > 0
          ? d.images.map((v: unknown) => String(v)).filter(Boolean)
          : ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"],
      description:
        String(d.description ?? "").trim() ||
        "User-submitted listing on Bookora.",
      propertyType: String(d.propertyType ?? "House"),
      listingStatus,
      features:
        Array.isArray(d.features) && d.features.length > 0
          ? d.features.map((v: unknown) => String(v)).filter(Boolean)
          : undefined,
      details: {
        "Property Type": String(d.propertyType ?? "House"),
        Status: listingStatus === "for_rent" ? "For Rent" : "For Sale",
      },
      agent: {
        name: String(d.ownerName ?? "Bookora Member"),
        title: "Property owner",
        photoUrl: String(d.ownerPhotoUrl ?? "").trim(),
        rating: 4.8,
        phone: String(d.phone ?? ""),
      },
    });
  });
  return out;
}

async function fetchPropertiesFromApi(): Promise<Property[]> {
  const res = await fetch(
    `${API_BASE}${PROPERTIES_REST_PATH}?per_page=100&_embed=1&orderby=date&order=desc`
  );
  if (!res.ok) throw new Error(`Failed to load properties: ${res.status}`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];
  return Promise.all(
    data.map((raw) =>
      finalizeWpProperty(raw as WpPropertyRestResponse, API_BASE)
    )
  );
}

/** Swap implementation: return MOCK_PROPERTIES now, fetch later */
export async function getProperties(): Promise<Property[]> {
  if (import.meta.env.VITE_USE_MOCK_DATA !== "false") {
    const userProps = await fetchUserProperties().catch(() => []);
    return [...userProps, ...MOCK_PROPERTIES];
  }
  const [wpProps, userProps] = await Promise.all([
    fetchPropertiesFromApi(),
    fetchUserProperties().catch(() => []),
  ]);
  return [...userProps, ...wpProps];
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  if (import.meta.env.VITE_USE_MOCK_DATA !== "false") {
    const userProps = await fetchUserProperties().catch(() => []);
    return (
      userProps.find((p) => p.slug === slug) ??
      MOCK_PROPERTIES.find((p) => p.slug === slug) ??
      null
    );
  }
  const userProps = await fetchUserProperties().catch(() => []);
  const userMatch = userProps.find((p) => p.slug === slug);
  if (userMatch) return userMatch;
  const res = await fetch(
    `${API_BASE}${PROPERTIES_REST_PATH}?slug=${encodeURIComponent(slug)}&_embed=1`
  );
  if (!res.ok) return null;
  const data: unknown = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return finalizeWpProperty(data[0] as WpPropertyRestResponse, API_BASE);
}

export function getPropertyBySlugSync(slug: string): Property | null {
  return MOCK_PROPERTIES.find((p) => p.slug === slug) ?? null;
}
