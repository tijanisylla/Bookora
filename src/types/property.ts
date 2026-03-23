/**
 * Core property shape aligned with future WordPress + ACF REST payload.
 * WP will expose: title, price, location, bedrooms, bathrooms, area, images[], description
 * plus WP-native id, slug, and optional extras you can map from ACF.
 */
export type PropertyListingStatus = "for_sale" | "for_rent";

export interface Property {
  /** WordPress post ID */
  id: number;
  slug: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  /** Square feet — maps to ACF `area` */
  area: number;
  /** Garage spaces — optional ACF field; falls back to `details` when absent */
  garage?: number;
  images: string[];
  description: string;
  /** UI / extended ACF fields (optional on API) */
  propertyType?: string;
  /** Maps to ACF e.g. `year_built` */
  yearBuilt?: number;
  listingStatus?: PropertyListingStatus;
  features?: string[];
  details?: Record<string, string>;
  agent?: PropertyAgent;
  /** Owner for user-submitted listings (used for messaging). */
  ownerId?: string;
  /** Firestore document id for user-submitted listings. */
  sourceDocId?: string;
}

export interface PropertyAgent {
  name: string;
  title: string;
  photoUrl: string;
  rating: number;
  phone?: string;
}

/** Normalized view model — use after mapping WP REST → Property */
export type PropertySummary = Pick<
  Property,
  | "id"
  | "slug"
  | "title"
  | "price"
  | "location"
  | "bedrooms"
  | "bathrooms"
  | "area"
  | "garage"
  | "images"
  | "listingStatus"
  | "propertyType"
>;
