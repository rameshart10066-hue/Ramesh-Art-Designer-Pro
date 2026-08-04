"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProjectStore } from "@/stores/projectStore";

// The connected navigation set — the professional flow opened from the Welcome
// Dashboard. Manufacturing is reached inside the Design Studio (its tab), so it
// has no separate nav entry here.
const ROUTE_ORDER = ["/new-project", "/catalog", "/recent-projects", "/settings", "/upload-photo", "/design-studio"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const project = useProjectStore((state) => state.project);
  const setCurrentStep = useProjectStore((state) => state.setCurrentStep);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStep(pathname);
  }, [pathname, setCurrentStep]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const breadcrumb = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (!segments.length) return ["Home"];
    return segments.map((segment) => segment.replace(/-/g, " "));
  }, [pathname]);

  const goToRoute = (route: string) => {
    router.push(route);
  };

  // The Welcome Dashboard is a full-bleed landing page with its own header —
  // render it without the app chrome so it reads as a professional entry point.
  if (pathname === "/") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#020617", color: "#f8fafc" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>{children}</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#020617", color: "#f8fafc" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20, padding: 12, background: "rgba(2, 6, 23, 0.9)", borderBottom: "1px solid rgba(148, 163, 184, 0.16)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em" }}>{breadcrumb.join(" / ")}</div>
            <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 700 }}>{project.projectName}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              onClick={() => goToRoute("/")}
              title="Back to the Welcome Dashboard"
              style={{ border: "1px solid rgba(148, 163, 184, 0.16)", borderRadius: 999, padding: "8px 10px", background: "rgba(15, 23, 42, 0.8)", color: "#f8fafc", cursor: "pointer" }}
            >
              🏠 Home
            </button>
            {ROUTE_ORDER.map((route) => (
              <button key={route} type="button" onClick={() => goToRoute(route)} style={{ border: "1px solid rgba(148, 163, 184, 0.16)", borderRadius: 999, padding: "8px 10px", background: pathname === route ? "rgba(79, 70, 229, 0.28)" : "rgba(15, 23, 42, 0.8)", color: "#f8fafc", cursor: "pointer" }}>
                {route.replace("/", "").replace(/-/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </div>
      {notice ? <div style={{ padding: "10px 16px", background: "rgba(34, 197, 82, 0.16)", color: "#bbf7d0", borderBottom: "1px solid rgba(34,197,82,0.2)" }}>{notice}</div> : null}
      {/* flex-fill children so full-height pages (e.g. the design studio) fit within
          the viewport below the header instead of overflowing below the fold */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>{children}</div>
    </div>
  );
}
