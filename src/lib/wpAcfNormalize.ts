import type { PropertyListingStatus } from "@/types/property";
import type { WpPropertyRestResponse } from "@/types/wpProperty";


export function parseOptionalAcfNumber(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function normalizeListingStatus(
  raw: unknown
): PropertyListingStatus | undefined {
  if (raw == null || raw === "") return undefined;
  const s = String(raw).toLowerCase().replace(/\s+/g, "_");
  if (s === "for_sale" || s === "forsale") return "for_sale";
  if (s === "for_rent" || s === "forrent") return "for_rent";
  return undefined;
}

function firstFeaturesRaw(acf: NonNullable<WpPropertyRestResponse["acf"]>) {
  const candidates = [acf.features, acf.amenities, acf.property_features];
  for (const c of candidates) {
    if (c === false) continue;
    if (c != null && c !== "") return c;
  }
  return null;
}

/** ACF repeater, string array, newline textarea, or comma-separated string */
export function normalizeFeaturesFromAcf(
  acf: WpPropertyRestResponse["acf"] | undefined
): string[] | undefined {
  if (!acf) return undefined;
  const raw = firstFeaturesRaw(acf);
  const fromTextFields = [acf.features_text, acf.amenities_list].filter(
    (s): s is string => typeof s === "string" && s.trim() !== ""
  );
  const fromText = fromTextFields.length
    ? fromTextFields
        .flatMap((t) => t.split(/\r?\n/))
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  if (raw == null || raw === "") {
    return fromText?.length ? fromText : undefined;
  }

  if (Array.isArray(raw)) {
    if (raw.length === 0) return fromText?.length ? fromText : undefined;
    if (typeof raw[0] === "string") {
      const list = (raw as string[]).map((s) => s.trim()).filter(Boolean);
      return list.length ? list : fromText;
    }
    const list = raw
      .map((row) => {
        if (typeof row === "string") return row.trim();
        if (row && typeof row === "object") {
          const o = row as Record<string, unknown>;
          const v =
            o.feature ??
            o.feature_text ??
            o.name ??
            o.title ??
            o.text ??
            o.label ??
            o.item ??
            o.line ??
            o.value;
          if (typeof v === "string") return v.trim();
        }
        return "";
      })
      .filter(Boolean);
    return list.length ? list : fromText;
  }

  if (typeof raw === "string") {
    const list = raw
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    return list.length ? list : fromText;
  }

  return fromText;
}

function normalizeDetailsRaw(raw: unknown): Record<string, string> | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(o)) {
      if (v != null && typeof v !== "object") out[k] = String(v);
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (const row of raw) {
      if (row && typeof row === "object") {
        const o = row as Record<string, unknown>;
        const label = o.label ?? o.detail_label ?? o.key ?? o.name;
        const value = o.value ?? o.detail_value ?? o.content;
        if (typeof label === "string" && value != null) {
          out[label] = String(value);
        }
      }
    }
    return Object.keys(out).length ? out : undefined;
  }
  return undefined;
}

/**
 * Merge ACF `details` (any shape) with synthesized rows from `property_type`,
 * `listing_status`, and `lease_term`.
 */
export function buildDetailsFromAcf(
  acf: WpPropertyRestResponse["acf"] | undefined
): Record<string, string> | undefined {
  if (!acf) return undefined;
  const merged: Record<string, string> = {};
  for (const key of ["details", "property_details", "details_table"] as const) {
    const parsed = normalizeDetailsRaw(acf[key]);
    if (parsed) Object.assign(merged, parsed);
  }

  if (acf.property_type && merged["Property Type"] == null) {
    merged["Property Type"] = String(acf.property_type);
  }

  const st = normalizeListingStatus(acf.listing_status);
  if (st && merged["Status"] == null) {
    merged["Status"] = st === "for_rent" ? "For Rent" : "For Sale";
  }

  if (st === "for_rent") {
    const leaseRaw =
      [acf.lease_term, acf.lease_length, acf.rental_term].find(
        (x) => x != null && String(x).trim() !== ""
      ) ?? null;
    if (leaseRaw != null && merged["Lease Term"] == null) {
      merged["Lease Term"] = String(leaseRaw);
    }
    if (acf.security_deposit != null && merged["Security Deposit"] == null) {
      merged["Security Deposit"] = String(acf.security_deposit);
    }
    if (acf.pet_policy != null && merged["Pet Policy"] == null) {
      merged["Pet Policy"] = String(acf.pet_policy);
    }
  }

  if (st === "for_sale") {
    if (acf.hoa_fee != null && merged["HOA Fee"] == null) {
      merged["HOA Fee"] = String(acf.hoa_fee);
    }
    if (acf.property_tax != null && merged["Property Tax"] == null) {
      merged["Property Tax"] = String(acf.property_tax);
    }
    if (acf.lot_size != null && merged["Lot Size"] == null) {
      merged["Lot Size"] = String(acf.lot_size);
    }
  }

  return Object.keys(merged).length ? merged : undefined;
}
