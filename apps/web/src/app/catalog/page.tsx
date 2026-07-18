import { CatalogOverview, CatalogThemeProvider } from "@/modules/catalog";

export default function CatalogPage() {
  return (
    <CatalogThemeProvider>
      <main>
        <h1>Catalog</h1>
        <CatalogOverview />
      </main>
    </CatalogThemeProvider>
  );
}
