import { useState } from "react";

export interface PropertyGalleryProps {
  images: string[];
  title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80";
  const safe = images.length ? images : [FALLBACK_IMAGE];
  const [active, setActive] = useState(0);
  const main = safe[active] ?? safe[0];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-100">
        <img
          src={main}
          alt={`${title} — photo ${active + 1}`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="aspect-[16/10] w-full object-cover"
        />
      </div>
      {safe.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {safe.slice(0, 4).map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`overflow-hidden rounded-lg ring-2 transition ${
                active === i ? "ring-brand" : "ring-transparent hover:ring-slate-200"
              }`}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
                className="aspect-[4/3] w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
