import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { HeroSearch } from "@/components/HeroSearch";
import { FilterBar } from "@/components/FilterBar";
import { PropertyList } from "@/components/PropertyList";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { useProperties } from "@/hooks/useProperties";
import {
  collectPropertyTypes,
  DEFAULT_MORE_FILTERS,
  filterAndSortProperties,
  type ListingFilter,
  type MinRooms,
  type MoreFilters,
  type PriceFilter,
  type SortOption,
} from "@/lib/propertyFilters";
import { buildPropertySearchIndex } from "@/lib/searchIndex";

export function HomePage() {
  const PAGE_SIZE = 6;
  const { properties, loading, error } = useProperties();
  const [searchParams, setSearchParams] = useSearchParams();

  const listingFilter = useMemo((): ListingFilter => {
    const v = searchParams.get("listing");
    if (v === "for_sale" || v === "for_rent") return v;
    return "all";
  }, [searchParams]);

  const setListingFilter = useCallback(
    (v: ListingFilter) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (v === "all") next.delete("listing");
          else next.set("listing", v);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const [locationDraft, setLocationDraft] = useState("");
  const [appliedLocationQuery, setAppliedLocationQuery] = useState("");
  const [propertyType, setPropertyType] = useState("any");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("any");
  const [bedroomsMin, setBedroomsMin] = useState<MinRooms>(0);
  const [bathroomsMin, setBathroomsMin] = useState<MinRooms>(0);
  const [more, setMore] = useState<MoreFilters>(DEFAULT_MORE_FILTERS);
  const [sort, setSort] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const propertyTypeOptions = useMemo(
    () => collectPropertyTypes(properties),
    [properties]
  );
  const searchIndex = useMemo(
    () => buildPropertySearchIndex(properties),
    [properties]
  );

  const canResetSearch = useMemo(
    () =>
      listingFilter !== "all" ||
      sort !== "newest" ||
      propertyType !== "any" ||
      priceFilter !== "any" ||
      bedroomsMin !== 0 ||
      bathroomsMin !== 0 ||
      more.minArea !== 0 ||
      more.poolOnly ||
      appliedLocationQuery !== "" ||
      locationDraft !== "",
    [
      appliedLocationQuery,
      bathroomsMin,
      bedroomsMin,
      listingFilter,
      locationDraft,
      more.minArea,
      more.poolOnly,
      priceFilter,
      propertyType,
      sort,
    ]
  );

  const resetSearch = useCallback(() => {
    setListingFilter("all");
    setSort("newest");
    setPropertyType("any");
    setPriceFilter("any");
    setBedroomsMin(0);
    setBathroomsMin(0);
    setMore(DEFAULT_MORE_FILTERS);
    setLocationDraft("");
    setAppliedLocationQuery("");
    setCurrentPage(1);
  }, [setListingFilter]);

  const handleHeroSearch = useCallback(() => {
    setAppliedLocationQuery(locationDraft.trim());
    setCurrentPage(1);
  }, [locationDraft]);

  const filtered = useMemo(
    () =>
      filterAndSortProperties(properties, {
        listing: listingFilter,
        locationQuery: appliedLocationQuery,
        searchIndex,
        propertyType,
        price: priceFilter,
        bedroomsMin,
        bathroomsMin,
        more,
        sort,
      }),
    [
      appliedLocationQuery,
      bathroomsMin,
      bedroomsMin,
      listingFilter,
      more,
      priceFilter,
      properties,
      searchIndex,
      propertyType,
      sort,
    ]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    listingFilter,
    appliedLocationQuery,
    propertyType,
    priceFilter,
    bedroomsMin,
    bathroomsMin,
    more,
    sort,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedProperties = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage, PAGE_SIZE]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSearch
          locationDraft={locationDraft}
          onLocationDraftChange={setLocationDraft}
          propertyTypeOptions={propertyTypeOptions}
          propertyType={propertyType}
          onPropertyTypeChange={setPropertyType}
          bedroomsMin={bedroomsMin}
          onBedroomsMinChange={setBedroomsMin}
          onSearch={handleHeroSearch}
          canResetSearch={canResetSearch}
          onResetSearch={resetSearch}
        />
        <FilterBar
          listingFilter={listingFilter}
          onListingFilterChange={setListingFilter}
          propertyTypeOptions={propertyTypeOptions}
          propertyType={propertyType}
          onPropertyTypeChange={setPropertyType}
          priceFilter={priceFilter}
          onPriceFilterChange={setPriceFilter}
          bedroomsMin={bedroomsMin}
          onBedroomsMinChange={setBedroomsMin}
          bathroomsMin={bathroomsMin}
          onBathroomsMinChange={setBathroomsMin}
          more={more}
          onMoreChange={setMore}
          sort={sort}
          onSortChange={setSort}
          onResetSearch={resetSearch}
          canResetSearch={canResetSearch}
        />
        <PropertyList
          properties={pagedProperties}
          loading={loading}
          error={error}
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
