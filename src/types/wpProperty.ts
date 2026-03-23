/**
 * WordPress REST shape you’ll receive from a custom `properties` post type
 * with ACF fields exposed to the API. Field names vary by ACF configuration —
 * rename keys in `mapWpPropertyToProperty` to match your setup.
 *
 * Endpoint (planned): GET http://bookora.local/wp-json/wp/v2/properties
 */
export interface WpPropertyEmbedded {
  "wp:featuredmedia"?: Array<{
    source_url?: string;
    alt_text?: string;
  }>;
}

/** Minimal WP post + typical ACF payload (adjust to your schema). */
export interface WpPropertyRestResponse {
  id: number;
  slug: string;
  title: { rendered: string };
  content?: { rendered: string };
  acf?: {
    price?: number;
    location?: string;
    bedrooms?: number;
    bathrooms?: number;
    /** Square feet — maps to our `Property.area` */
    area?: number;
    /** Image URLs or attachment IDs depending on ACF return format */
    images?: string[] | number[];
    /** ACF Free: separate Image fields (attachment IDs or direct URLs) */
    image_1?: number | string;
    image_2?: number | string;
    image_3?: number | string;
    description?: string;
    property_type?: string;
    /** Value (`for_rent`) or label (`For rent`) depending on ACF return format */
    listing_status?: string;
    /** Repeater, string[], or comma/newline string — see `normalizeFeaturesFromAcf` */
    features?: unknown;
    /** Common alternate names for the same idea */
    amenities?: unknown;
    property_features?: unknown;
    /** One feature per line (ACF textarea) — alternative to `features` */
    features_text?: string;
    amenities_list?: string;
    garage?: number | string;
    /** e.g. `12 months` for rentals */
    lease_term?: string;
    lease_length?: string;
    rental_term?: string;
    security_deposit?: number | string;
    pet_policy?: string;
    hoa_fee?: number | string;
    property_tax?: number | string;
    lot_size?: string;
    year_built?: number;
    agent_name?: string;
    agent_title?: string;
    agent_photo?: string;
    agent_rating?: number;
    agent_phone?: string;
    /** Repeater or object — see `buildDetailsFromAcf` */
    details?: unknown;
    property_details?: unknown;
    details_table?: unknown;
  };
  _embedded?: WpPropertyEmbedded;
}
