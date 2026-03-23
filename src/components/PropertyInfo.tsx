import type { Property } from "@/types/property";
import { formatPriceUsd } from "@/lib/format";

export interface PropertyInfoProps {
  property: Property;
}

export function PropertyInfo({ property }: PropertyInfoProps) {
  const isRent = property.listingStatus === "for_rent";
  const price = formatPriceUsd(property.price, isRent);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {property.title}
      </h1>
      <p className="mt-4 flex items-start gap-2 text-slate-600">
        <span className="mt-0.5 shrink-0 text-brand">
          <MapPinIcon />
        </span>
        {property.location}
      </p>
      <p className="mt-4 text-3xl font-bold text-brand sm:text-4xl">{price}</p>
    </div>
  );
}

function MapPinIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
