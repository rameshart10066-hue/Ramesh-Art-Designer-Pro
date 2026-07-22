"use client";

import { useEffect, useMemo, useState } from "react";
import type { CatalogResponse, Category, Product } from "@ramesh/api-contracts";
import { getCatalog, getCategories } from "@/services/catalogService";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { SearchBar } from "./SearchBar";
import { CategoryFilter } from "./CategoryFilter";
import { Pagination } from "./Pagination";
import { ThemeToggle } from "./ThemeToggle";
import { DesignCard } from "./DesignCard";

const PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 300;

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CatalogResponse };

const SAMPLE_PRODUCTS: Product[] = [
  { id: "RA-001", sku: "RA-001", name: "Royal Palace", description: "Grand palace inspired setup", price: 185000, categoryId: "royal" },
  { id: "RA-002", sku: "RA-002", name: "Modern Arch", description: "Contemporary geometric arch", price: 145000, categoryId: "modern" },
  { id: "RA-003", sku: "RA-003", name: "Lotus Theme", description: "Minimal lotus celebration", price: 132000, categoryId: "lotus" },
  { id: "RA-004", sku: "RA-004", name: "Peacock Theme", description: "Luxury peacock centerpiece", price: 168000, categoryId: "peacock" },
  { id: "RA-005", sku: "RA-005", name: "Shivaji Fort", description: "Historic fort-inspired layout", price: 190000, categoryId: "heritage" },
  { id: "RA-006", sku: "RA-006", name: "Temple Theme", description: "Traditional temple facade", price: 155000, categoryId: "temple" },
  { id: "RA-007", sku: "RA-007", name: "Premium Mandap", description: "High-end mandap experience", price: 220000, categoryId: "premium" },
  { id: "RA-008", sku: "RA-008", name: "Floral Theme", description: "Soft floral scenic composition", price: 126000, categoryId: "floral" },
  { id: "RA-009", sku: "RA-009", name: "Traditional Theme", description: "Classic festive decor", price: 138000, categoryId: "traditional" },
  { id: "RA-010", sku: "RA-010", name: "Luxury Stage", description: "Statement stage for premium events", price: 245000, categoryId: "luxury" },
];

/**
 * Top-level catalog container. Owns all interactive state (search text,
 * selected category, current page) and data fetching; delegates rendering
 * of individual pieces to the presentation components so those stay
 * reusable and independently testable.
 */
export function CatalogOverview() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("popular");
  const [sizeFilter, setSizeFilter] = useState("all");

  const [categories, setCategories] = useState<Category[]>([]);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, sortBy, sizeFilter]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    getCatalog({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(categoryId ? { categoryId } : {}),
      page,
      pageSize: PAGE_SIZE,
    })
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Failed to load catalog.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, categoryId, page]);

  const filteredProducts = useMemo(() => {
    let items = [...SAMPLE_PRODUCTS];

    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      items = items.filter((product) => product.name.toLowerCase().includes(search));
    }

    if (categoryId) {
      items = items.filter((product) => product.categoryId === categoryId);
    }

    if (sizeFilter !== "all") {
      items = items.filter((product) => product.name.toLowerCase().includes(sizeFilter));
    }

    switch (sortBy) {
      case "price":
        items.sort((a, b) => a.price - b.price);
        break;
      case "newest":
        items.sort((a, b) => b.price - a.price);
        break;
      default:
        items.sort((a, b) => a.price - b.price);
    }

    return items;
  }, [categoryId, debouncedSearch, sizeFilter, sortBy]);

  return (
    <div style={{ padding: 20, background: "#020617", color: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ border: "1px solid rgba(148, 163, 184, 0.16)", borderRadius: 24, padding: 24, background: "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.92))", boxShadow: "0 24px 60px rgba(2, 8, 23, 0.28)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, color: "#38bdf8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em" }}>Ganpati Design Catalog</p>
            <h1 style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 800 }}>Premium decoration marketplace</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ padding: "8px 12px", borderRadius: 999, background: "rgba(34, 197, 82, 0.16)", color: "#bbf7d0", fontWeight: 700, fontSize: 13 }}>
              Active project: Royal Ganpati Arch
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "minmax(260px, 1.5fr) repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20 }}>
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search Ganpati designs" />
          <CategoryFilter categories={categories} selectedCategoryId={categoryId} onChange={setCategoryId} />
          <select
            aria-label="Sort designs"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            style={{ border: "1px solid rgba(148, 163, 184, 0.16)", borderRadius: 999, padding: "10px 14px", background: "rgba(15, 23, 42, 0.8)", color: "#f8fafc" }}
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="price">Price</option>
            <option value="difficulty">Difficulty</option>
          </select>
          <select
            aria-label="Filter by size"
            value={sizeFilter}
            onChange={(event) => setSizeFilter(event.target.value)}
            style={{ border: "1px solid rgba(148, 163, 184, 0.16)", borderRadius: 999, padding: "10px 14px", background: "rgba(15, 23, 42, 0.8)", color: "#f8fafc" }}
          >
            <option value="all">All Sizes</option>
            <option value="4x4">4x4</option>
            <option value="5x5">5x5</option>
            <option value="6x6">6x6</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {state.status === "loading" && <p style={{ color: "#94a3b8" }}>Loading catalog…</p>}
        {state.status === "error" && <p role="alert" style={{ color: "#fda4af" }}>{state.message}</p>}

        {state.status === "ready" && (
          <>
            <section aria-label="Products" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
              {filteredProducts.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>No designs match your search.</p>
              ) : (
                filteredProducts.map((product) => <DesignCard key={product.id} product={product} />)
              )}
            </section>

            <Pagination page={state.data.page} totalPages={state.data.totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
