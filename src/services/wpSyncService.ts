import type { PropertyListingStatus } from "@/types/property";

type SyncListingInput = {
  title: string;
  description: string;
  location: string;
  listingStatus: PropertyListingStatus;
  propertyType: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  garage: number;
  images: string[];
  imageIds?: number[];
  features: string[];
  listerName?: string;
  listerPhone?: string;
  listerPhotoUrl?: string;
};

export type UploadedWpImage = {
  id: number;
  url: string;
};

function getWpBaseV2(): string {
  const api = import.meta.env.VITE_WP_API_BASE ?? "http://bookora.local/wp-json/wp/v2";
  return api.replace(/\/+$/, "");
}

function getAuthHeader(): string | null {
  const username = import.meta.env.VITE_WP_SYNC_USERNAME;
  const appPassword = import.meta.env.VITE_WP_SYNC_APP_PASSWORD;
  if (!username || !appPassword) return null;
  return `Basic ${btoa(`${username}:${appPassword}`)}`;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadImagesToWordPress(files: File[]): Promise<UploadedWpImage[]> {
  const auth = getAuthHeader();
  if (!auth) {
    throw new Error("WordPress sync credentials are missing.");
  }

  const endpoint = `${getWpBaseV2()}/media`;
  const uploads = await Promise.all(
    files.map(async (file) => {
      const safeName = sanitizeFilename(file.name || `upload-${Date.now()}.jpg`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": file.type || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${safeName}"`,
        },
        body: file,
      });
      if (!res.ok) {
        throw new Error(`WordPress media upload failed: ${res.status}`);
      }
      const data: unknown = await res.json();
      if (typeof data !== "object" || data == null) {
        throw new Error("Unexpected media upload response.");
      }
      const id = Number((data as { id?: unknown }).id);
      const url = String((data as { source_url?: unknown }).source_url ?? "");
      if (!Number.isFinite(id) || !url) {
        throw new Error("WordPress media upload missing id/url.");
      }
      return { id, url };
    })
  );

  return uploads.slice(0, 3);
}

export async function syncListingToWordPress(input: SyncListingInput): Promise<number | null> {
  const auth = getAuthHeader();
  if (!auth) return null;

  const endpoint = `${getWpBaseV2()}/properties`;
  const body = {
    title: input.title,
    status: "publish",
    content: input.description,
    acf: {
      price: input.price,
      location: input.location,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      area: input.area,
      garage: input.garage,
      property_type: input.propertyType,
      listing_status: input.listingStatus,
      images: input.images,
      image_1: input.imageIds?.[0] ?? input.images[0] ?? "",
      image_2: input.imageIds?.[1] ?? input.images[1] ?? "",
      image_3: input.imageIds?.[2] ?? input.images[2] ?? "",
      description: input.description,
      features: input.features,
      agent_name: input.listerName ?? "Bookora Lister",
      agent_title: "Property lister",
      agent_phone: input.listerPhone ?? "",
      agent_photo: input.listerPhotoUrl ?? "",
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`WordPress sync failed: ${res.status}`);
  }

  const data: unknown = await res.json();
  if (typeof data === "object" && data != null && "id" in data) {
    const id = Number((data as { id?: unknown }).id);
    return Number.isFinite(id) ? id : null;
  }
  return null;
}

export async function updateListingInWordPress(
  postId: number,
  input: SyncListingInput
): Promise<void> {
  const auth = getAuthHeader();
  if (!auth || !Number.isFinite(postId) || postId <= 0) return;

  const endpoint = `${getWpBaseV2()}/properties/${postId}`;
  const body = {
    title: input.title,
    status: "publish",
    content: input.description,
    acf: {
      price: input.price,
      location: input.location,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      area: input.area,
      garage: input.garage,
      property_type: input.propertyType,
      listing_status: input.listingStatus,
      images: input.images,
      image_1: input.imageIds?.[0] ?? input.images[0] ?? "",
      image_2: input.imageIds?.[1] ?? input.images[1] ?? "",
      image_3: input.imageIds?.[2] ?? input.images[2] ?? "",
      description: input.description,
      features: input.features,
      agent_name: input.listerName ?? "Bookora Lister",
      agent_title: "Property lister",
      agent_phone: input.listerPhone ?? "",
      agent_photo: input.listerPhotoUrl ?? "",
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`WordPress update failed: ${res.status}`);
}

export async function deleteListingInWordPress(postId: number): Promise<void> {
  const auth = getAuthHeader();
  if (!auth || !Number.isFinite(postId) || postId <= 0) return;
  const endpoint = `${getWpBaseV2()}/properties/${postId}?force=true`;
  const res = await fetch(endpoint, {
    method: "DELETE",
    headers: { Authorization: auth },
  });
  if (!res.ok) throw new Error(`WordPress delete failed: ${res.status}`);
}

export async function deleteListingInWordPressBySlug(slug: string): Promise<void> {
  const auth = getAuthHeader();
  if (!auth || !slug.trim()) return;

  const base = getWpBaseV2();
  const lookupRes = await fetch(
    `${base}/properties?slug=${encodeURIComponent(slug)}&_fields=id`
  );
  if (!lookupRes.ok) {
    throw new Error(`WordPress lookup failed: ${lookupRes.status}`);
  }
  const list: unknown = await lookupRes.json();
  if (!Array.isArray(list) || list.length === 0) return;

  for (const item of list) {
    const id = Number((item as { id?: unknown }).id);
    if (!Number.isFinite(id) || id <= 0) continue;
    const res = await fetch(`${base}/properties/${id}?force=true`, {
      method: "DELETE",
      headers: { Authorization: auth },
    });
    if (!res.ok) throw new Error(`WordPress delete by slug failed: ${res.status}`);
  }
}
