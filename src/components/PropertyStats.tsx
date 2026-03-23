import type { Property } from "@/types/property";
import { formatSqft } from "@/lib/format";

export interface PropertyStatsProps {
  property: Property;
}

export function PropertyStats({ property }: PropertyStatsProps) {
  const garage =
    property.garage != null
      ? String(property.garage)
      : (property.details?.["Garage"] ??
        property.details?.["Parking"] ??
        "—");

  const items = [
    { label: "Bedrooms", value: String(property.bedrooms), icon: <BedIcon /> },
    {
      label: "Bathrooms",
      value: String(property.bathrooms),
      icon: <BathIcon />,
    },
    {
      label: "Square feet",
      value: formatSqft(property.area),
      icon: <RulerIcon />,
    },
    { label: "Garage", value: garage, icon: <CarIcon /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center rounded-xl bg-brand-light px-3 py-4 text-center ring-1 ring-blue-100"
        >
          <span className="text-brand">{item.icon}</span>
          <span className="mt-2 text-lg font-bold text-slate-900">
            {item.value}
          </span>
          <span className="text-xs font-medium text-slate-600">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function BedIcon() {
  return (
    <svg
      className="h-6 w-6"
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
      className="h-6 w-6"
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

function RulerIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 8h16M4 16h16M8 4v16M16 4v16"
      />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 17h8m-8 0a2 2 0 01-2-2V9h12v6a2 2 0 01-2 2m-8 0H6a2 2 0 01-2-2V9a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2h-2"
      />
    </svg>
  );
}
