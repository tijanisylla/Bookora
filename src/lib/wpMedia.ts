/**
 * Resolve WordPress media attachment IDs to `source_url` via REST.
 * `apiBase` should be like `http://site.local/wp-json/wp/v2`
 */
export async function fetchMediaSourceUrls(
  ids: number[],
  apiBase: string
): Promise<string[]> {
  const base = apiBase.replace(/\/$/, "");
  const results = await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(`${base}/media/${id}`);
      if (!res.ok) return null;
      const json: { source_url?: string } = await res.json();
      return json.source_url ?? null;
    })
  );
  return results.filter((u): u is string => Boolean(u));
}
