import type { Property } from "@/types/property";
import { searchPropertyIndex, type PropertySearchIndex } from "@/lib/searchIndex";

export type ListingFilter = "all" | "for_sale" | "for_rent";
export type SortOption = "newest" | "price_asc" | "price_desc";

/** `0` = any */
export type MinRooms = 0 | 1 | 2 | 3 | 4;

export type PriceFilter =
  | "any"
  | "sale_under_700k"
  | "sale_700k_1m"
  | "sale_1m_plus"
  | "rent_under_5k"
  | "rent_5k_plus";

export interface MoreFilters {
  minArea: 0 | 1200 | 1800 | 2500;
  poolOnly: boolean;
}

export const DEFAULT_MORE_FILTERS: MoreFilters = {
  minArea: 0,
  poolOnly: false,
};

export function priceOptionsForListing(
  listing: ListingFilter
): { value: PriceFilter; label: string }[] {
  const sale = [
    { value: "sale_under_700k" as const, label: "Under $700k" },
    { value: "sale_700k_1m" as const, label: "$700k – $1M" },
    { value: "sale_1m_plus" as const, label: "$1M+" },
  ];
  const rent = [
    { value: "rent_under_5k" as const, label: "Under $5k / mo" },
    { value: "rent_5k_plus" as const, label: "$5k+ / mo" },
  ];
  if (listing === "for_sale") {
    return [{ value: "any", label: "Any price" }, ...sale];
  }
  if (listing === "for_rent") {
    return [{ value: "any", label: "Any price" }, ...rent];
  }
  return [
    { value: "any", label: "Any price" },
    ...sale.map((o) => ({ ...o, label: `Sale: ${o.label}` })),
    ...rent.map((o) => ({ ...o, label: `Rent: ${o.label}` })),
  ];
}

function matchesListing(p: Property, listing: ListingFilter): boolean {
  if (listing === "all") return true;
  if (listing === "for_sale") {
    return (p.listingStatus ?? "for_sale") === "for_sale";
  }
  return p.listingStatus === "for_rent";
}

function matchesPrice(p: Property, price: PriceFilter): boolean {
  if (price === "any") return true;
  const isRent = p.listingStatus === "for_rent";
  switch (price) {
    case "sale_under_700k":
      return !isRent && p.price < 700_000;
    case "sale_700k_1m":
      return !isRent && p.price >= 700_000 && p.price < 1_000_000;
    case "sale_1m_plus":
      return !isRent && p.price >= 1_000_000;
    case "rent_under_5k":
      return isRent && p.price < 5000;
    case "rent_5k_plus":
      return isRent && p.price >= 5000;
    default:
      return true;
  }
}

function matchesPropertyType(p: Property, propertyType: string): boolean {
  if (propertyType === "any") return true;
  const t = p.propertyType?.trim().toLowerCase() ?? "";
  return t === propertyType.trim().toLowerCase();
}

function matchesMinRooms(
  count: number,
  min: MinRooms
): boolean {
  if (min === 0) return true;
  return count >= min;
}

function matchesLocation(p: Property, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return p.location.toLowerCase().includes(q);
}

function matchesMore(p: Property, more: MoreFilters): boolean {
  if (more.minArea > 0 && p.area < more.minArea) return false;
  if (more.poolOnly) {
    const hasPool =
      p.features?.some((f) => /pool/i.test(f)) ?? false;
    if (!hasPool) return false;
  }
  return true;
}

export interface FilterCriteria {
  listing: ListingFilter;
  /** Applied from hero search — substring match on `location` */
  locationQuery: string;
  searchIndex?: PropertySearchIndex;
  propertyType: string;
  price: PriceFilter;
  bedroomsMin: MinRooms;
  bathroomsMin: MinRooms;
  more: MoreFilters;
  sort: SortOption;
}

export function filterAndSortProperties(
  items: Property[],
  criteria: FilterCriteria
): Property[] {
  const matchedSlugs = criteria.searchIndex
    ? searchPropertyIndex(criteria.searchIndex, criteria.locationQuery)
    : null;
  let list = items.filter(
    (p) =>
      matchesListing(p, criteria.listing) &&
      (matchedSlugs ? matchedSlugs.has(p.slug) : matchesLocation(p, criteria.locationQuery)) &&
      matchesPrice(p, criteria.price) &&
      matchesPropertyType(p, criteria.propertyType) &&
      matchesMinRooms(p.bedrooms, criteria.bedroomsMin) &&
      matchesMinRooms(p.bathrooms, criteria.bathroomsMin) &&
      matchesMore(p, criteria.more)
  );

  list = [...list].sort((a, b) => {
    if (criteria.sort === "price_asc") return a.price - b.price;
    if (criteria.sort === "price_desc") return b.price - a.price;
    return b.id - a.id;
  });

  return list;
}

export function collectPropertyTypes(properties: Property[]): string[] {
  const set = new Set<string>();
  for (const p of properties) {
    if (p.propertyType?.trim()) set.add(p.propertyType.trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
