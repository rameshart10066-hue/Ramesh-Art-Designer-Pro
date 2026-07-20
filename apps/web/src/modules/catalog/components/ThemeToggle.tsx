"use client";

import { useCatalogTheme } from "../theme/CatalogThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useCatalogTheme();

  return (
    <button type="button" onClick={toggleTheme} aria-label="Toggle catalog theme">
      {theme === "light" ? "🌙 Dark mode" : "☀️ Light mode"}
    </button>
  );
}
