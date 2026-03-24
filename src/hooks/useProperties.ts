import { useEffect, useState } from "react";
import type { Property } from "@/types/property";
import { getProperties } from "@/services/propertyService";

const CACHE_KEY = "bookora:properties-cache:v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

type CachedProperties = {
  ts: number;
  data: Property[];
};

function readCachedProperties(): Property[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedProperties;
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.ts !== "number") {
      return null;
    }
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCachedProperties(data: Property[]) {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedProperties = { ts: Date.now(), data };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore cache write errors (quota/private mode).
  }
}

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cached = readCachedProperties();
    if (cached && cached.length > 0) {
      setProperties(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    getProperties()
      .then((data) => {
        if (!cancelled) {
          setProperties(data);
          writeCachedProperties(data);
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
