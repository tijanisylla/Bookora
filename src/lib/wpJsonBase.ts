/**
 * Derives `https://site/wp-json` from `VITE_WP_API_BASE` (`…/wp-json/wp/v2`).
 */
export function getWpJsonBase(): string {
  const api =
    import.meta.env.VITE_WP_API_BASE ??
    "http://bookora.local/wp-json/wp/v2";
  const trimmed = api.replace(/\/+$/, "");
  return trimmed.replace(/\/wp\/v2$/i, "");
}
