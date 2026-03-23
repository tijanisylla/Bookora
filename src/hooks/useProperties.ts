import { useEffect, useState } from "react";
import type { Property } from "@/types/property";
import { getProperties } from "@/services/propertyService";

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProperties()
      .then((data) => {
        if (!cancelled) {
          setProperties(data);
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
  }, []);

  return { properties, loading, error };
}
