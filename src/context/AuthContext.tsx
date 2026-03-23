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
  FacebookAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  firebaseAuth,
} from "@/lib/firebase";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  photoUrl?: string;
  emailVerified?: boolean;
}

type AuthState = {
  user: AuthUser | null;
  ready: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ autoLoggedIn: boolean }>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  updateProfileSettings: (input: {
    name: string;
    photoUrl: string;
  }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  busy: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(input: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}): AuthUser {
  return {
    id: input.uid,
    name: input.displayName || input.email || "Bookora User",
    email: input.email ?? undefined,
    photoUrl: input.photoURL ?? undefined,
    emailVerified: input.emailVerified,
  };
}

function toReadableAuthError(e: unknown): string {
  if (e && typeof e === "object" && "code" in e) {
    const code = String((e as { code?: unknown }).code ?? "");
    switch (code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password.";
      case "auth/email-already-in-use":
        return "That email is already in use.";
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with a different sign-in method.";
      case "auth/unauthorized-domain":
        return "This domain is not authorized in Firebase Auth settings.";
      default:
        if (code.startsWith("auth/")) return code.replace("auth/", "");
    }
  }
  return e instanceof Error ? e.message : "Authentication failed.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const logout = useCallback(() => {
    void signOut(firebaseAuth);
    setUser(null);
  }, []);

  useEffect(() => {
    const off = onAuthStateChanged(firebaseAuth, (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setReady(true);
        return;
      }
      setUser(
        toAuthUser({
          uid: nextUser.uid,
          displayName: nextUser.displayName,
          email: nextUser.email,
          photoURL: nextUser.photoURL,
          emailVerified: nextUser.emailVerified,
        })
      );
      setReady(true);
    });
    return () => {
      off();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(
        firebaseAuth,
        email.trim(),
        password
      );
      const usesPassword = cred.user.providerData.some(
        (p) => p.providerId === "password"
      );
      if (usesPassword && !cred.user.emailVerified) {
        await sendEmailVerification(cred.user);
        throw new Error(
          "Please verify your email. A new verification email was sent."
        );
      }
    } catch (e) {
      const msg = toReadableAuthError(e);
      setError(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuth, provider);
    } catch (e) {
      const msg = toReadableAuthError(e);
      setError(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  const loginWithFacebook = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const provider = new FacebookAuthProvider();
      await signInWithPopup(firebaseAuth, provider);
    } catch (e) {
      const msg = toReadableAuthError(e);
      setError(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      setError(null);
      setBusy(true);
      try {
        const cred = await createUserWithEmailAndPassword(
          firebaseAuth,
          input.email.trim(),
          input.password
        );
        if (input.name.trim()) {
          await updateProfile(cred.user, { displayName: input.name.trim() });
          setUser(
            toAuthUser({
              uid: cred.user.uid,
              displayName: input.name.trim(),
              email: cred.user.email,
              photoURL: cred.user.photoURL,
              emailVerified: cred.user.emailVerified,
            })
          );
        }
        await sendEmailVerification(cred.user);
        await signOut(firebaseAuth);
        return { autoLoggedIn: false };
      } catch (e) {
        const msg = toReadableAuthError(e);
        setError(msg);
        throw e;
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    setBusy(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
    } catch (e) {
      const msg = toReadableAuthError(e);
      setError(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const current = firebaseAuth.currentUser;
      if (!current) throw new Error("You must be logged in.");
      await sendEmailVerification(current);
    } catch (e) {
      const msg = toReadableAuthError(e);
      setError(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  const updateProfileSettings = useCallback(
    async (input: { name: string; photoUrl: string }) => {
      setError(null);
      setBusy(true);
      try {
        const current = firebaseAuth.currentUser;
        if (!current) {
          throw new Error("You must be logged in.");
        }
        await updateProfile(current, {
          displayName: input.name.trim(),
          photoURL: input.photoUrl.trim() || null,
        });
        setUser(
          toAuthUser({
            uid: current.uid,
            displayName: input.name.trim() || current.displayName,
            email: current.email,
            photoURL: input.photoUrl.trim() || null,
            emailVerified: current.emailVerified,
          })
        );
      } catch (e) {
        const msg = toReadableAuthError(e);
        setError(msg);
        throw e;
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      login,
      logout,
      register,
      loginWithGoogle,
      loginWithFacebook,
      updateProfileSettings,
      resetPassword,
      resendVerificationEmail,
      error,
      clearError,
      busy,
    }),
    [
      user,
      ready,
      login,
      logout,
      register,
      loginWithGoogle,
      loginWithFacebook,
      updateProfileSettings,
      resetPassword,
      resendVerificationEmail,
      error,
      clearError,
      busy,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
