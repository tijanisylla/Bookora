import { Link, useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PropertyGallery } from "@/components/PropertyGallery";
import { PropertyInfo } from "@/components/PropertyInfo";
import { PropertyStats } from "@/components/PropertyStats";
import { ContactCard } from "@/components/ContactCard";
import { useProperty } from "@/hooks/useProperty";
import type { PropertyAgent } from "@/types/property";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

const DEFAULT_AGENT: PropertyAgent = {
  name: "Bookora Team",
  title: "Listing contact",
  photoUrl:
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
  rating: 5,
  phone: "(555) 000-0000",
};

/** e.g. "Silver Lake, Los Angeles, CA" → ["Los Angeles", "Silver Lake"] */
function breadcrumbsFromLocation(location: string): string[] {
  const parts = location.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 3) return [parts[1], parts[0]];
  if (parts.length === 2) return [parts[0]];
  return parts;
}

export function PropertyDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { property, loading, error } = useProperty(slug);
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <p className="text-slate-500">Loading property…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <p className="text-lg text-slate-700">
            {error ?? "We could not find that listing."}
          </p>
          <Link
            to="/"
            className="font-semibold text-brand hover:text-brand-dark"
          >
            Back to listings
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const crumbs = breadcrumbsFromLocation(property.location);
  const agent = property.agent ?? DEFAULT_AGENT;
  const descriptionParagraphs = property.description
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const mapQuery = encodeURIComponent(property.location);
  const mapSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500"
            aria-label="Breadcrumb"
          >
            <Link to="/" className="hover:text-brand">
              Home
            </Link>
            {crumbs.map((part, i) => (
              <span key={`${part}-${i}`} className="flex items-center gap-2">
                <span aria-hidden className="text-slate-300">
                  {">"}
                </span>
                {i === crumbs.length - 1 ? (
                  <span className="font-medium text-slate-800">{part}</span>
                ) : (
                  <span className="text-slate-500">{part}</span>
                )}
              </span>
            ))}
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    if (!property) return;
                    if (!user) {
                      navigate(`/login?redirect=/property/${property.slug}`);
                      return;
                    }
                    try {
                      await toggleWishlist(property.id);
                      showToast(
                        isWishlisted(property.id)
                          ? "Removed from wishlist"
                          : "Saved to wishlist"
                      );
                    } catch {
                      showToast("Could not update wishlist", "error");
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand"
                >
                  <HeartIcon filled={!!property && isWishlisted(property.id)} />
                  {property && isWishlisted(property.id) ? "Saved" : "Save"}
                </button>
              </div>
              <PropertyGallery
                images={property.images}
                title={property.title}
              />
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
                <PropertyInfo property={property} />
                <div className="mt-8">
                  <PropertyStats property={property} />
                </div>
                <section className="mt-10">
                  <h2 className="text-lg font-bold text-slate-900">
                    Description
                  </h2>
                  <div className="mt-3 space-y-4 text-sm leading-relaxed text-slate-600">
                    {descriptionParagraphs.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </section>
                {property.features && property.features.length > 0 && (
                  <section className="mt-10">
                    <h2 className="text-lg font-bold text-slate-900">
                      Features &amp; amenities
                    </h2>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {property.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <CheckIcon />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {property.details && Object.keys(property.details).length > 0 && (
                  <section className="mt-10">
                    <h2 className="text-lg font-bold text-slate-900">
                      Property details
                    </h2>
                    <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50">
                      {Object.entries(property.details).map(([k, v]) => (
                        <div
                          key={k}
                          className="grid grid-cols-2 gap-2 px-4 py-3 text-sm"
                        >
                          <dt className="font-medium text-slate-500">{k}</dt>
                          <dd className="text-right font-semibold text-slate-800">
                            {v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}
                <section className="mt-10">
                  <h2 className="text-lg font-bold text-slate-900">Location map</h2>
                  <p className="mt-1 text-sm text-slate-500">{property.location}</p>
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <iframe
                      title={`Map of ${property.location}`}
                      src={mapSrc}
                      className="h-[320px] w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
                  >
                    Open in Google Maps
                  </a>
                </section>
              </div>
            </div>
            <div className="lg:col-span-1">
              <ContactCard agent={agent} property={property} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-emerald-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-4 w-4"
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
