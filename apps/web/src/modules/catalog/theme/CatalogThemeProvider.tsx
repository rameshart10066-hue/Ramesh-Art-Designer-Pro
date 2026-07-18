"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import styles from "./catalog-theme.module.css";

type Theme = "light" | "dark";

const STORAGE_KEY = "catalog-theme";

interface CatalogThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const CatalogThemeContext = createContext<CatalogThemeContextValue | null>(null);

/**
 * Scoped to the catalog module only — sets data-theme on a wrapper div
 * rather than document.documentElement, so it doesn't affect the rest of
 * the app. Persists the choice to localStorage under a catalog-specific
 * key so it doesn't collide with any future app-wide theme setting.
 */
export function CatalogThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    }
  }, []);

  function toggleTheme() {
    setTheme((current) => {
      const next: Theme = current === "light" ? "dark" : "light";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <CatalogThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={styles.root} data-theme={theme}>
        {children}
      </div>
    </CatalogThemeContext.Provider>
  );
}

export function useCatalogTheme(): CatalogThemeContextValue {
  const context = useContext(CatalogThemeContext);
  if (!context) {
    throw new Error("useCatalogTheme must be used within a CatalogThemeProvider.");
  }
  return context;
}
