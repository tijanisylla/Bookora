import type { Property } from "@/types/property";

const heroImage =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80";
const img1 =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";
const img2 =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80";
const img3 =
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80";
const img4 =
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80";
const img5 =
  "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80";
const agentPhoto =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80";

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 101,
    slug: "stunning-modern-family-home-silver-lake",
    title: "Stunning Modern Family Home",
    price: 845000,
    location: "Silver Lake, Los Angeles, CA",
    bedrooms: 4,
    bathrooms: 3,
    area: 2400,
    garage: 2,
    images: [img1, img2, img3, img4],
    description:
      "This thoughtfully designed residence offers open living spaces, floor-to-ceiling windows, and premium finishes throughout. The main level flows from a chef's kitchen into a bright great room ideal for entertaining. Upstairs, generous bedrooms provide quiet retreats with ample storage.\n\nThe outdoor area features a private patio and low-maintenance landscaping—perfect for California indoor-outdoor living. Located minutes from dining, parks, and transit with strong neighborhood character.",
    propertyType: "Single Family",
    listingStatus: "for_sale",
    features: [
      "Central Air Conditioning",
      "Swimming Pool",
      "Hardwood Floors",
      "Smart Home Ready",
      "Two-Car Garage",
      "Solar Panels",
    ],
    details: {
      "Property Type": "Single Family",
      Status: "For Sale",
      "Year Built": "2022",
      Lot: "6,200 sqft",
      HOA: "$125/mo",
      Garage: "2 spaces",
    },
    yearBuilt: 2022,
    agent: {
      name: "Michael Johnson",
      title: "Senior Real Estate Advisor",
      photoUrl: agentPhoto,
      rating: 5,
      phone: "(555) 234-8901",
    },
  },
  {
    id: 102,
    slug: "downtown-loft-with-city-views",
    title: "Downtown Loft with City Views",
    price: 620000,
    location: "Downtown Los Angeles, CA",
    bedrooms: 2,
    bathrooms: 2,
    area: 1280,
    images: [img2, heroImage, img5],
    description:
      "Industrial-chic loft in a full-service building with 24-hour concierge, fitness center, and rooftop lounge. Soaring ceilings and oversized windows frame skyline views. Walk to restaurants, galleries, and Metro.",
    propertyType: "Condo",
    listingStatus: "for_sale",
    features: [
      "In-Unit Laundry",
      "Concierge",
      "Rooftop Deck",
      "Fitness Center",
    ],
    details: {
      "Property Type": "Condo",
      Status: "For Sale",
      "HOA Fee": "$680/mo",
    },
    agent: {
      name: "Michael Johnson",
      title: "Senior Real Estate Advisor",
      photoUrl: agentPhoto,
      rating: 4.9,
      phone: "(555) 234-8901",
    },
  },
  {
    id: 103,
    slug: "bright-craftsman-near-parks",
    title: "Bright Craftsman Near Parks",
    price: 4250,
    location: "Pasadena, CA",
    bedrooms: 3,
    bathrooms: 2,
    area: 1850,
    garage: 2,
    images: [img3, img1, img4],
    description:
      "Charming craftsman with original details and modern updates. Large porch, formal dining, and a fenced yard. Excellent schools and walkable neighborhood.",
    propertyType: "House",
    listingStatus: "for_rent",
    features: ["Pet Friendly", "Fenced Yard", "Updated Kitchen"],
    details: {
      "Property Type": "House",
      Status: "For Rent",
      "Lease Term": "12 months",
      "Year Built": "1925",
      Lot: "7,500 sqft",
      Garage: "2 spaces",
      Deposit: "$2,500",
      "Pet Policy": "Allowed",
    },
    yearBuilt: 1925,
    agent: {
      name: "Michael Johnson",
      title: "Senior Real Estate Advisor",
      photoUrl: agentPhoto,
      rating: 4.9,
      phone: "(555) 234-8901",
    },
  },
  {
    id: 104,
    slug: "minimalist-townhome-westside",
    title: "Minimalist Townhome — Westside",
    price: 1125000,
    location: "Santa Monica, CA",
    bedrooms: 3,
    bathrooms: 3,
    area: 2100,
    images: [img5, img2, img3],
    description:
      "End-unit townhome with private roof deck, EV charging, and designer fixtures. Quiet street with quick access to beaches and tech corridors.",
    propertyType: "Townhome",
    listingStatus: "for_sale",
    features: [
      "EV Charging",
      "Roof Deck",
      "Wine Fridge",
      "Walk-in Closets",
    ],
    details: {
      "Property Type": "Townhome",
      Status: "For Sale",
      "HOA Fee": "$420/mo",
      Garage: "2 spaces",
    },
    agent: {
      name: "Michael Johnson",
      title: "Senior Real Estate Advisor",
      photoUrl: agentPhoto,
      rating: 4.9,
      phone: "(555) 234-8901",
    },
  },
];

export const HERO_BACKGROUND_IMAGE = heroImage;
