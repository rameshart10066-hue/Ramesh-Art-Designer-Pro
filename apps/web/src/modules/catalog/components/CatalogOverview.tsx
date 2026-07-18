"use client";

import { useEffect, useState } from "react";
import type { CatalogResponse, Category } from "@ramesh/api-contracts";
import { getCatalog, getCategories } from "@/services/catalogService";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { SearchBar } from "./SearchBar";
import { CategoryFilter } from "./CategoryFilter";
import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";
import { ThemeToggle } from "./ThemeToggle";

const PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 300;

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CatalogResponse };

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

  const [categories, setCategories] = useState<Category[]>([]);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  // Changing search or category should reset to page 1 — otherwise the
  // user can land on an empty page if the new filter has fewer results.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId]);

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

  return (
    <div>
      <div>
        <SearchBar value={searchInput} onChange={setSearchInput} />
        <CategoryFilter
          categories={categories}
          selectedCategoryId={categoryId}
          onChange={setCategoryId}
        />
        <ThemeToggle />
      </div>

      {state.status === "loading" && <p>Loading catalog…</p>}
      {state.status === "error" && <p role="alert">{state.message}</p>}

      {state.status === "ready" && (
        <>
          <section aria-label="Products">
            {state.data.items.length === 0 ? (
              <p>No products match your search.</p>
            ) : (
              state.data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </section>

          <Pagination
            page={state.data.page}
            totalPages={state.data.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
