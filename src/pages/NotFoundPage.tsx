import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">Error 404</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Page not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            The page you are looking for does not exist or has moved.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Go back home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
