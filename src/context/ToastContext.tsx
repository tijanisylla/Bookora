import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Toast = {
  message: string;
  kind?: "success" | "error";
};

type ToastContextValue = {
  showToast: (message: string, kind?: "success" | "error") => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, kind: "success" | "error" = "success") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-[70] -translate-x-1/2">
          <div
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg ${
              toast.kind === "error" ? "bg-red-600" : "bg-slate-900"
            }`}
            role="status"
          >
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
