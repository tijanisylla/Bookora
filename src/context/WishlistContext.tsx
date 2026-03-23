import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type WishlistContextValue = {
  ids: Set<number>;
  count: number;
  savedAtById: Map<number, number>;
  ready: boolean;
  toggleWishlist: (propertyId: number) => Promise<void>;
  isWishlisted: (propertyId: number) => boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [savedAtById, setSavedAtById] = useState<Map<number, number>>(new Map());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      setSavedAtById(new Map());
      setReady(true);
      return;
    }
    setReady(false);
    const colRef = collection(firestoreDb, "wishlists", user.id, "items");
    const off = onSnapshot(colRef, (snap) => {
      const next = new Set<number>();
      const savedAt = new Map<number, number>();
      snap.forEach((d) => {
        const n = Number(d.id);
        if (Number.isFinite(n)) {
          next.add(n);
          const ts = d.data().createdAt;
          if (ts && typeof ts === "object" && "toMillis" in ts) {
            const ms = Number((ts as { toMillis: () => number }).toMillis());
            if (Number.isFinite(ms)) savedAt.set(n, ms);
          }
        }
      });
      setIds(next);
      setSavedAtById(savedAt);
      setReady(true);
    });
    return () => off();
  }, [user]);

  const toggleWishlist = useCallback(
    async (propertyId: number) => {
      if (!user) throw new Error("You must be logged in.");
      const id = String(propertyId);
      const ref = doc(firestoreDb, "wishlists", user.id, "items", id);
      if (ids.has(propertyId)) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, { propertyId, createdAt: serverTimestamp() });
      }
    },
    [user, ids]
  );

  const isWishlisted = useCallback((propertyId: number) => ids.has(propertyId), [ids]);

  const value = useMemo(
    () => ({
      ids,
      count: ids.size,
      savedAtById,
      ready,
      toggleWishlist,
      isWishlisted,
    }),
    [ids, savedAtById, ready, toggleWishlist, isWishlisted]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
