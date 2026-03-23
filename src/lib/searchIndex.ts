import type { Property } from "@/types/property";

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type PropertySearchIndex = Map<string, string>;

export function buildPropertySearchIndex(items: Property[]): PropertySearchIndex {
  const index: PropertySearchIndex = new Map();
  for (const p of items) {
    const text = normalize(
      [
        p.title,
        p.location,
        p.description,
        p.propertyType ?? "",
        p.listingStatus ?? "",
        (p.features ?? []).join(" "),
      ].join(" ")
    );
    index.set(p.slug, text);
  }
  return index;
}

export function searchPropertyIndex(
  index: PropertySearchIndex,
  query: string
): Set<string> {
  const normalized = normalize(query);
  if (!normalized) return new Set(index.keys());
  const tokens = normalized.split(" ").filter(Boolean);
  const out = new Set<string>();
  for (const [slug, haystack] of index.entries()) {
    if (tokens.every((token) => haystack.includes(token))) {
      out.add(slug);
    }
  }
  return out;
}
