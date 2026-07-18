import type { Category, Product } from "@ramesh/api-contracts";

/**
 * Static placeholder catalog data — no product/category tables exist in
 * packages/database yet. Swap for real Prisma queries once that lands;
 * getCatalog() and getCategories() are the only two functions that touch
 * this data, so that's the only place a future change is needed.
 */
export const CATEGORIES: Category[] = [
  { id: "cat-nameplates", name: "Nameplates", slug: "nameplates" },
  { id: "cat-boxes", name: "Boxes", slug: "boxes" },
  { id: "cat-coasters", name: "Coasters", slug: "coasters" },
  { id: "cat-decor", name: "Decor", slug: "decor" },
];

export const PRODUCTS: Product[] = [
  {
    id: "prod-1",
    sku: "NP-001",
    name: "Classic Desk Nameplate",
    description: "Engraved acrylic nameplate for desks and office doors.",
    price: 499,
    categoryId: "cat-nameplates",
  },
  {
    id: "prod-2",
    sku: "NP-002",
    name: "LED Backlit Nameplate",
    description: "Nameplate with built-in LED edge lighting.",
    price: 899,
    categoryId: "cat-nameplates",
  },
  {
    id: "prod-3",
    sku: "BX-001",
    name: "Finger-Joint Storage Box",
    description: "Laser-cut acrylic box with interlocking finger joints.",
    price: 649,
    categoryId: "cat-boxes",
  },
  {
    id: "prod-4",
    sku: "BX-002",
    name: "Jewelry Display Box",
    description: "Compartmentalized acrylic box for jewelry display.",
    price: 799,
    categoryId: "cat-boxes",
  },
  {
    id: "prod-5",
    sku: "CS-001",
    name: "Geometric Coaster Set",
    description: "Set of 4 hexagonal acrylic coasters.",
    price: 349,
    categoryId: "cat-coasters",
  },
  {
    id: "prod-6",
    sku: "DC-001",
    name: "Layered Photo Frame",
    description: "Multi-layer acrylic photo frame with nesting cutouts.",
    price: 599,
    categoryId: "cat-decor",
  },
];
