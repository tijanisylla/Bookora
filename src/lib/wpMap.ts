import {
  buildDetailsFromAcf,
  normalizeFeaturesFromAcf,
  normalizeListingStatus,
  parseOptionalAcfNumber,
} from "@/lib/wpAcfNormalize";
import { fetchMediaSourceUrls } from "@/lib/wpMedia";
import type { Property, PropertyAgent } from "@/types/property";
import type { WpPropertyRestResponse } from "@/types/wpProperty";

export { normalizeListingStatus } from "@/lib/wpAcfNormalize";

function decodeEntities(text: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function hasTriImageIds(acf: NonNullable<WpPropertyRestResponse["acf"]>): boolean {
  return [acf.image_1, acf.image_2, acf.image_3].some(
    (x) => typeof x === "number" && x > 0
  );
}

function triImageUrlsFromAcf(acf: NonNullable<WpPropertyRestResponse["acf"]>): string[] {
  return [acf.image_1, acf.image_2, acf.image_3]
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
}

function imagesFromWp(post: WpPropertyRestResponse): string[] {
  const acf = post.acf ?? {};
  if (hasTriImageIds(acf)) {
    return [];
  }
  const fromAcf = acf.images;
  if (Array.isArray(fromAcf) && fromAcf.length > 0) {
    if (typeof fromAcf[0] === "string") {
      return fromAcf as string[];
    }
    return [];
  }
  const triUrls = triImageUrlsFromAcf(acf);
  if (triUrls.length > 0) return triUrls;
  const featured = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  return featured ? [featured] : [];
}

function agentFromAcf(acf: WpPropertyRestResponse["acf"]): PropertyAgent | undefined {
  if (!acf?.agent_name) return undefined;
  return {
    name: acf.agent_name,
    title: acf.agent_title ?? "Real Estate Agent",
    photoUrl: acf.agent_photo ?? "",
    rating: acf.agent_rating ?? 5,
    phone: acf.agent_phone,
  };
}

/**
 * Map WordPress REST + ACF payload → app `Property`.
 * Adjust `acf` keys to match your ACF field names.
 */
export function mapWpPropertyToProperty(post: WpPropertyRestResponse): Property {
  const acf = post.acf ?? {};
  const title = stripHtml(post.title.rendered);
  const description =
    typeof acf.description === "string" && acf.description.trim()
      ? acf.description
      : post.content?.rendered
        ? stripHtml(post.content.rendered)
        : "";

  const images = imagesFromWp(post);
  if (import.meta.env.DEV && images.length === 0 && !hasTriImageIds(acf)) {
    console.warn(`[Bookora] Property ${post.slug} has no resolvable images.`);
  }

  return {
    id: post.id,
    slug: post.slug,
    title,
    price: Number(acf.price ?? 0),
    location: String(acf.location ?? ""),
    bedrooms: Number(acf.bedrooms ?? 0),
    bathrooms: Number(acf.bathrooms ?? 0),
    area: Number(acf.area ?? 0),
    garage: parseOptionalAcfNumber(acf.garage),
    images,
    description,
    propertyType: acf.property_type,
    listingStatus: normalizeListingStatus(acf.listing_status),
    features: normalizeFeaturesFromAcf(acf),
    yearBuilt: parseOptionalAcfNumber(acf.year_built),
    details: buildDetailsFromAcf(acf),
    agent: agentFromAcf(acf),
  };
}

/**
 * After `mapWpPropertyToProperty`, resolve `image_1`–`image_3` attachment IDs and
 * fall back to featured media when needed.
 */
export async function finalizeWpProperty(
  raw: WpPropertyRestResponse,
  apiBase: string,
  mediaUrlById?: Map<number, string>
): Promise<Property> {
  const property = mapWpPropertyToProperty(raw);
  const ids = [raw.acf?.image_1, raw.acf?.image_2, raw.acf?.image_3].filter(
    (x): x is number => typeof x === "number" && x > 0
  );
  if (ids.length > 0) {
    const urlsFromMap =
      mediaUrlById && mediaUrlById.size > 0
        ? ids.map((id) => mediaUrlById.get(id) ?? "").filter(Boolean)
        : [];
    const urls =
      urlsFromMap.length > 0
        ? urlsFromMap
        : await fetchMediaSourceUrls(ids, apiBase);
    if (urls.length > 0) {
      return { ...property, images: urls };
    }
  }
  if (property.images.length === 0) {
    const featured = raw._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    if (featured) {
      return { ...property, images: [featured] };
    }
  }
  return property;
}
