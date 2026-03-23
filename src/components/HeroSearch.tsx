import { HERO_BACKGROUND_IMAGE } from "@/data/properties";
import type { MinRooms } from "@/lib/propertyFilters";

export interface HeroSearchProps {
  locationDraft: string;
  onLocationDraftChange: (value: string) => void;
  propertyTypeOptions: string[];
  propertyType: string;
  onPropertyTypeChange: (value: string) => void;
  bedroomsMin: MinRooms;
  onBedroomsMinChange: (value: MinRooms) => void;
  onSearch: () => void;
  canResetSearch: boolean;
  onResetSearch: () => void;
}

const BEDROOM_VALUES: { value: MinRooms; label: string }[] = [
  { value: 0, label: "Any" },
  { value: 1, label: "1+" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
];

export function HeroSearch({
  locationDraft,
  onLocationDraftChange,
  propertyTypeOptions,
  propertyType,
  onPropertyTypeChange,
  bedroomsMin,
  onBedroomsMinChange,
  onSearch,
  canResetSearch,
  onResetSearch,
}: HeroSearchProps) {
  return (
    <section
      id="hero-search"
      className="relative min-h-[520px] overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_BACKGROUND_IMAGE})` }}
        role="img"
        aria-label="Modern home exterior"
      />
      <div className="absolute inset-0 bg-slate-900/55" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-24 pt-20 text-center sm:px-6 lg:px-8 lg:pb-32 lg:pt-28">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Find Your Perfect Home
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-200">
          Discover a wide range of properties from luxurious villas to cozy
          apartments.
        </p>

        <form
          className="mt-10 w-full max-w-4xl rounded-2xl bg-white p-4 shadow-xl sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-4">
            <label className="block text-left lg:col-span-4">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Location
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <MapPinIcon />
                </span>
                <input
                  type="search"
                  placeholder="City, neighborhood, ZIP"
                  className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none ring-brand focus:border-transparent focus:ring-2"
                  name="location"
                  autoComplete="street-address"
                  value={locationDraft}
                  onChange={(e) => onLocationDraftChange(e.target.value)}
                />
              </div>
            </label>
            <label className="block text-left lg:col-span-3">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Property type
              </span>
              <select
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-3 pl-3 pr-10 text-sm outline-none ring-brand focus:border-transparent focus:ring-2"
                aria-label="Property type"
                value={propertyType}
                onChange={(e) => onPropertyTypeChange(e.target.value)}
              >
                <option value="any">Any type</option>
                {propertyTypeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-left lg:col-span-3">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Bedrooms
              </span>
              <select
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-3 pl-3 pr-10 text-sm outline-none ring-brand focus:border-transparent focus:ring-2"
                aria-label="Bedrooms"
                value={bedroomsMin}
                onChange={(e) =>
                  onBedroomsMinChange(Number(e.target.value) as MinRooms)
                }
              >
                {BEDROOM_VALUES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row lg:col-span-2">
              <button
                type="submit"
                className="flex w-full flex-1 items-center justify-center rounded-lg bg-brand py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
              >
                Search
              </button>
              {canResetSearch && (
                <button
                  type="button"
                  onClick={onResetSearch}
                  className="flex w-full flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Reset search
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </section>
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
