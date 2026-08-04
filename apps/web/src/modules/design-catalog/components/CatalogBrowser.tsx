"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { useProjectStore } from "@/stores/projectStore";
import { recordRecentProject } from "@/services/projectIo";
import { DESIGN_TEMPLATES } from "@/services/templateEngine";
import { APP_NAME } from "@/version";
import { useCatalogStore } from "../catalogStore";
import {
  type CatalogItem,
  type CatalogSize,
  type CatalogTheme,
  SIZE_LABELS,
  THEME_LABELS,
  buildDuplicateItem,
  buildSeedItems,
  queryCatalogItems,
  resolveItemObjects,
} from "../catalogService";
import { CatalogToolbar } from "./CatalogToolbar";
import { CatalogCard } from "./CatalogCard";
import { VirtualCatalogGrid } from "./VirtualCatalogGrid";
import { Preview3DModal } from "./Preview3DModal";

const CARD_HEIGHT = 300;

/**
 * Design Catalog — a dedicated browser over the user's saved Ganpati designs.
 * Supports search, category/size/theme filters, favorites, lazy SVG previews,
 * a 3D preview, and per-design actions (open / duplicate / manufacture /
 * delete). The grid is virtualized so it scales to 100+ designs.
 */
export function CatalogBrowser() {
  const router = useRouter();

  const items = useCatalogStore((s) => s.items);
  const seeded = useCatalogStore((s) => s.seeded);
  const seedCatalog = useCatalogStore((s) => s.seedCatalog);
  const toggleFavorite = useCatalogStore((s) => s.toggleFavorite);
  const deleteItem = useCatalogStore((s) => s.deleteItem);
  const addItem = useCatalogStore((s) => s.addItem);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [size, setSize] = useState<CatalogSize | null>(null);
  const [theme, setTheme] = useState<CatalogTheme | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [previewItem, setPreviewItem] = useState<CatalogItem | null>(null);
  const [notice, setNotice] = useState<{ message: string; isError: boolean } | null>(null);

  const showNotice = useCallback((message: string, isError = false) => {
    setNotice({ message, isError });
    window.setTimeout(() => setNotice(null), 3000);
  }, []);

  // Seed the library from the parametric template catalog on first visit.
  useEffect(() => {
    if (!seeded) seedCatalog(buildSeedItems(DESIGN_TEMPLATES));
  }, [seeded, seedCatalog]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items],
  );

  const filtered = useMemo(
    () => queryCatalogItems(items, { search, category, size, theme, favoritesOnly }),
    [items, search, category, size, theme, favoritesOnly],
  );

  const hasActiveFilters = search.trim() !== "" || category !== null || size !== null || theme !== null || favoritesOnly;

  const clearFilters = useCallback(() => {
    setSearch("");
    setCategory(null);
    setSize(null);
    setTheme(null);
    setFavoritesOnly(false);
  }, []);

  const loadIntoStudio = useCallback((item: CatalogItem) => {
    const objects = resolveItemObjects(item);
    useEditorStoreV2.getState().loadObjects(objects);
    useProjectStore.getState().setProject({
      projectName: item.name,
      designId: item.id,
      designName: item.name,
      designTheme: THEME_LABELS[item.theme] ?? item.theme,
    });
    return objects;
  }, []);

  const handleOpen = useCallback(
    (item: CatalogItem) => {
      const objects = loadIntoStudio(item);
      recordRecentProject({
        name: item.name,
        objects,
        meta: {
          size: SIZE_LABELS[item.size],
          theme: THEME_LABELS[item.theme] ?? item.theme,
          ...(item.material !== undefined && { material: item.material }),
        },
      });
      router.push("/design-studio");
    },
    [loadIntoStudio, router],
  );

  const handleManufacture = useCallback(
    (item: CatalogItem) => {
      loadIntoStudio(item);
      router.push("/design-studio?tab=manufacturing");
    },
    [loadIntoStudio, router],
  );

  const handleDuplicate = useCallback(
    (item: CatalogItem) => {
      const objects = resolveItemObjects(item);
      const copy = buildDuplicateItem(item, objects);
      addItem(copy);
      showNotice(`Duplicated “${item.name}”.`);
    },
    [addItem, showNotice],
  );

  const handleDelete = useCallback(
    (item: CatalogItem) => {
      if (window.confirm(`Delete “${item.name}” from the catalog?`)) {
        deleteItem(item.id);
        showNotice(`Deleted “${item.name}”.`);
      }
    },
    [deleteItem, showNotice],
  );

  const favoriteCount = useMemo(() => items.filter((i) => i.favorite).length, [items]);

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "#020617", color: "#f8fafc" }}>
      {/* Header */}
      <div style={{ padding: "22px 24px 0", maxWidth: 1240, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Design Catalog</h1>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94a3b8" }}>
              Browse saved Ganpati designs in {APP_NAME} · {items.length} design{items.length === 1 ? "" : "s"}
              {favoriteCount > 0 ? ` · ${favoriteCount} favorite${favoriteCount === 1 ? "" : "s"}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ maxWidth: 1240, margin: "0 auto", width: "100%", padding: "16px 24px 0" }}>
        <CatalogToolbar
          search={search}
          onSearchChange={setSearch}
          categories={categories}
          category={category}
          onCategoryChange={setCategory}
          size={size}
          onSizeChange={setSize}
          theme={theme}
          onThemeChange={setTheme}
          favoritesOnly={favoritesOnly}
          onFavoritesToggle={() => setFavoritesOnly((v) => !v)}
          filteredCount={filtered.length}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          onNewDesign={() => router.push("/new-project")}
        />
      </div>

      {/* Grid */}
      <div style={{ flex: 1, minHeight: 0, maxWidth: 1240, margin: "0 auto", width: "100%", padding: "16px 24px 24px", display: "flex", flexDirection: "column" }}>
        {items.length === 0 ? (
          <EmptyState title="Your catalog is empty" body="Saving or creating a design will add it here." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No designs match your filters" body="Try clearing some filters or changing your search." actionLabel="Clear filters" onAction={clearFilters} />
        ) : (
          <VirtualCatalogGrid
            items={filtered}
            cardHeight={CARD_HEIGHT}
            getItemKey={(item) => item.id}
            renderCard={(item) => (
              <CatalogCard
                item={item}
                onOpen={handleOpen}
                onPreview3D={setPreviewItem}
                onDuplicate={handleDuplicate}
                onManufacture={handleManufacture}
                onDelete={handleDelete}
                onToggleFavorite={(i) => toggleFavorite(i.id)}
              />
            )}
          />
        )}
      </div>

      {/* 3D preview */}
      {previewItem && <Preview3DModal item={previewItem} onClose={() => setPreviewItem(null)} />}

      {/* Toast */}
      {notice && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
            maxWidth: "calc(100vw - 48px)",
            padding: "10px 18px",
            borderRadius: 10,
            background: notice.isError ? "rgba(239, 68, 68, 0.16)" : "rgba(34, 197, 94, 0.16)",
            border: `1px solid ${notice.isError ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)"}`,
            color: notice.isError ? "#fca5a5" : "#bbf7d0",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        >
          {notice.message}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 40,
        textAlign: "center",
        color: "#64748b",
        border: "1px dashed #1e293b",
        borderRadius: 14,
      }}
    >
      <div style={{ fontSize: 36 }}>📚</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8" }}>{title}</div>
      <div style={{ fontSize: 13, maxWidth: 360, lineHeight: 1.5 }}>{body}</div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{ marginTop: 8, padding: "9px 16px", borderRadius: 9, border: "none", background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
