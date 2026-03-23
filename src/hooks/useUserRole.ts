import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestoreDb } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export type UserRole = "user" | "buyer" | "seller" | "admin";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>("user");
  const [loadingRole, setLoadingRole] = useState(false);

  useEffect(() => {
    if (!user) {
      setRole("user");
      setLoadingRole(false);
      return;
    }
    setLoadingRole(true);
    const ref = doc(firestoreDb, "user_roles", user.id);
    const off = onSnapshot(
      ref,
      (snap) => {
        const rawRole = String(snap.data()?.role ?? "user");
        if (
          rawRole === "admin" ||
          rawRole === "seller" ||
          rawRole === "buyer" ||
          rawRole === "user"
        ) {
          setRole(rawRole);
        } else {
          setRole("user");
        }
        setLoadingRole(false);
      },
      () => {
        setRole("user");
        setLoadingRole(false);
      }
    );
    return () => off();
  }, [user]);

  return { role, loadingRole, isAdmin: role === "admin" };
}
