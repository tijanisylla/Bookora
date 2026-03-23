import { useEffect, useState } from "react";
import type { Property } from "@/types/property";
import { getPropertyBySlug } from "@/services/propertyService";

export function useProperty(slug: string | undefined) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setProperty(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getPropertyBySlug(slug)
      .then((p) => {
        if (!cancelled) {
          setProperty(p);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { property, loading, error };
}
