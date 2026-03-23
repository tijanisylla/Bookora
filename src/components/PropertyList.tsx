import type { Property } from "@/types/property";
import { PropertyCard } from "@/components/PropertyCard";
import { Link } from "react-router-dom";

export interface PropertyListProps {
  properties: Property[];
  loading?: boolean;
  error?: string | null;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function PropertyList({
  properties,
  loading,
  error,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: PropertyListProps) {
  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 h-8 w-56 animate-pulse rounded bg-slate-200" />
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
              <div className="aspect-[4/3] animate-pulse bg-slate-200" />
              <div className="space-y-3 p-5">
                <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-slate-500">No properties match your filters.</p>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Featured Properties
        </h2>
        <Link
          to="/"
          className="text-sm font-semibold text-brand hover:text-brand-dark"
        >
          View all
        </Link>
      </div>
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => (
          <li key={p.id}>
            <PropertyCard property={p} />
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <nav
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
          aria-label="Listings pagination"
        >
          <button
            type="button"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange?.(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={
                page === currentPage
                  ? "rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white"
                  : "rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
              }
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
