import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Property } from "@/types/property";
import { formatPriceUsd } from "@/lib/format";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const favorited = isWishlisted(property.id);
  const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80";
  const image = property.images[0] ?? FALLBACK_IMAGE;
  const isRent = property.listingStatus === "for_rent";
  const priceLabel = formatPriceUsd(
    property.price,
    isRent
  );

  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100 transition hover:shadow-lg">
      <Link to={`/property/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={image}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span
            className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white ${
              isRent ? "bg-emerald-600" : "bg-brand"
            }`}
          >
            {isRent ? "For Rent" : "For Sale"}
          </span>
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              if (!user) {
                navigate(
                  `/login?redirect=${encodeURIComponent(
                    `${location.pathname}${location.search}`
                  )}`
                );
                return;
              }
              try {
                await toggleWishlist(property.id);
                showToast(favorited ? "Removed from wishlist" : "Saved to wishlist");
              } catch {
                showToast("Could not update wishlist", "error");
              }
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm backdrop-blur transition hover:text-red-500"
            aria-label={
              user
                ? favorited
                  ? "Remove from wishlist"
                  : "Add to wishlist"
                : "Log in to save this listing"
            }
          >
            <HeartIcon filled={favorited} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-2xl font-bold text-brand">{priceLabel}</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            {property.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{property.location}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1.5">
              <BedIcon />
              {property.bedrooms} Beds
            </span>
            <span className="flex items-center gap-1.5">
              <BathIcon />
              {property.bathrooms} Baths
            </span>
            <span className="flex items-center gap-1.5">
              <AreaIcon />
              {property.area.toLocaleString()} sqft
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12v3a1 1 0 001 1h1m10-5h4a1 1 0 011 1v3M3 12h16M3 12l2-7h14l2 7"
      />
    </svg>
  );
}

function BathIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M5 10V7a2 2 0 012-2h10a2 2 0 012 2v3"
      />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
      />
    </svg>
  );
}
