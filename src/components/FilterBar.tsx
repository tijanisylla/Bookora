import { useEffect, useId, useRef } from "react";
import type {
  ListingFilter,
  MinRooms,
  MoreFilters,
  PriceFilter,
  SortOption,
} from "@/lib/propertyFilters";
import { priceOptionsForListing } from "@/lib/propertyFilters";

export type { ListingFilter, SortOption, MinRooms, PriceFilter, MoreFilters };

const selectPillClass =
  "appearance-none cursor-pointer rounded-full border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-700 shadow-sm outline-none ring-brand transition hover:bg-slate-50 focus:ring-2";

const wrapClass = "relative inline-block";

function SelectChevron() {
  return (
    <span
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
      aria-hidden
    >
      <ChevronDownIcon />
    </span>
  );
}

export interface FilterBarProps {
  listingFilter: ListingFilter;
  onListingFilterChange: (v: ListingFilter) => void;
  propertyTypeOptions: string[];
  propertyType: string;
  onPropertyTypeChange: (v: string) => void;
  priceFilter: PriceFilter;
  onPriceFilterChange: (v: PriceFilter) => void;
  bedroomsMin: MinRooms;
  onBedroomsMinChange: (v: MinRooms) => void;
  bathroomsMin: MinRooms;
  onBathroomsMinChange: (v: MinRooms) => void;
  more: MoreFilters;
  onMoreChange: (v: MoreFilters) => void;
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
  onResetSearch: () => void;
  canResetSearch: boolean;
}

const ROOM_OPTIONS: { value: MinRooms; label: string }[] = [
  { value: 0, label: "Any" },
  { value: 1, label: "1+" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
];

const AREA_OPTIONS: { value: MoreFilters["minArea"]; label: string }[] = [
  { value: 0, label: "Any size" },
  { value: 1200, label: "1,200+ sqft" },
  { value: 1800, label: "1,800+ sqft" },
  { value: 2500, label: "2,500+ sqft" },
];

export function FilterBar({
  listingFilter,
  onListingFilterChange,
  propertyTypeOptions,
  propertyType,
  onPropertyTypeChange,
  priceFilter,
  onPriceFilterChange,
  bedroomsMin,
  onBedroomsMinChange,
  bathroomsMin,
  onBathroomsMinChange,
  more,
  onMoreChange,
  sort,
  onSortChange,
  onResetSearch,
  canResetSearch,
}: FilterBarProps) {
  const pills: { id: ListingFilter; label: string }[] = [
    { id: "all", label: "All Listings" },
    { id: "for_sale", label: "For Sale" },
    { id: "for_rent", label: "For Rent" },
  ];

  const priceOptions = priceOptionsForListing(listingFilter);
  const morePanelId = useId();
  const moreDetailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const allowed = priceOptionsForListing(listingFilter);
    if (!allowed.some((o) => o.value === priceFilter)) {
      onPriceFilterChange("any");
    }
  }, [listingFilter, priceFilter, onPriceFilterChange]);

  return (
    <div className="border-b border-slate-100 bg-slate-50/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {pills.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onListingFilterChange(p.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                listingFilter === p.id
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {p.label}
            </button>
          ))}
          <span className="hidden text-slate-300 sm:inline" aria-hidden>
            |
          </span>

          <div className={wrapClass}>
            <label className="sr-only" htmlFor="filter-property-type">
              Property type
            </label>
            <select
              id="filter-property-type"
              value={propertyType}
              onChange={(e) => onPropertyTypeChange(e.target.value)}
              className={selectPillClass}
            >
              <option value="any">Any type</option>
              {propertyTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>

          <div className={wrapClass}>
            <label className="sr-only" htmlFor="filter-price">
              Price range
            </label>
            <select
              id="filter-price"
              value={priceFilter}
              onChange={(e) =>
                onPriceFilterChange(e.target.value as PriceFilter)
              }
              className={`${selectPillClass} max-w-[220px] sm:max-w-none`}
            >
              {priceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>

          <div className={wrapClass}>
            <label className="sr-only" htmlFor="filter-bedrooms">
              Bedrooms
            </label>
            <select
              id="filter-bedrooms"
              value={bedroomsMin}
              onChange={(e) =>
                onBedroomsMinChange(Number(e.target.value) as MinRooms)
              }
              className={selectPillClass}
            >
              {ROOM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value === 0 ? "Beds: Any" : `Beds: ${o.label}`}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>

          <div className={wrapClass}>
            <label className="sr-only" htmlFor="filter-bathrooms">
              Bathrooms
            </label>
            <select
              id="filter-bathrooms"
              value={bathroomsMin}
              onChange={(e) =>
                onBathroomsMinChange(Number(e.target.value) as MinRooms)
              }
              className={selectPillClass}
            >
              {ROOM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value === 0 ? "Baths: Any" : `Baths: ${o.label}`}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>

          <details ref={moreDetailsRef} className="group relative">
            <summary
              className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 marker:hidden hover:bg-slate-50 [&::-webkit-details-marker]:hidden"
              aria-expanded={undefined}
            >
              More
              <ChevronDownIcon />
            </summary>
            <div
              id={morePanelId}
              className="absolute left-0 top-full z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
              role="group"
              aria-label="More filters"
            >
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="filter-min-area"
                    className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Min square feet
                  </label>
                  <select
                    id="filter-min-area"
                    value={more.minArea}
                    onChange={(e) =>
                      onMoreChange({
                        ...more,
                        minArea: Number(e.target.value) as MoreFilters["minArea"],
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
                  >
                    {AREA_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={more.poolOnly}
                    onChange={(e) =>
                      onMoreChange({ ...more, poolOnly: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  Pool only
                </label>
              </div>
            </div>
          </details>

          {canResetSearch && (
            <button
              type="button"
              onClick={onResetSearch}
              className="rounded-full px-3 py-2 text-sm font-medium text-slate-500 underline-offset-2 hover:text-brand hover:underline"
            >
              Reset search
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-medium">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none ring-brand focus:ring-2"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
