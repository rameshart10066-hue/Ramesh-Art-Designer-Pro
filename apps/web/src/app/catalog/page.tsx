import { CatalogBrowser } from "@/modules/design-catalog";

export const metadata = {
  title: "Design Catalog — Ramesh Art Designer Pro",
};

export default function CatalogPage() {
  return (
    <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "#020617", color: "#f8fafc" }}>
      <CatalogBrowser />
    </main>
  );
}
