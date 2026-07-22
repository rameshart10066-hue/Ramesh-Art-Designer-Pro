"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProjectStore } from "@/stores/projectStore";

const ROUTE_ORDER = ["/dashboard", "/catalog", "/design-studio", "/manufacturing", "/svg-generator", "/nesting", "/part-numbering", "/assembly-guide"];

function getStepFromPath(pathname: string) {
  const index = ROUTE_ORDER.indexOf(pathname);
  return index >= 0 ? ROUTE_ORDER[index] : pathname;
}

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

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#f8fafc" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20, padding: 12, background: "rgba(2, 6, 23, 0.9)", borderBottom: "1px solid rgba(148, 163, 184, 0.16)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em" }}>{breadcrumb.join(" / ")}</div>
            <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 700 }}>{project.projectName}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ROUTE_ORDER.map((route) => (
              <button key={route} type="button" onClick={() => goToRoute(route)} style={{ border: "1px solid rgba(148, 163, 184, 0.16)", borderRadius: 999, padding: "8px 10px", background: pathname === route ? "rgba(79, 70, 229, 0.28)" : "rgba(15, 23, 42, 0.8)", color: "#f8fafc", cursor: "pointer" }}>
                {route.replace("/", "").replace(/-/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </div>
      {notice ? <div style={{ padding: "10px 16px", background: "rgba(34, 197, 82, 0.16)", color: "#bbf7d0", borderBottom: "1px solid rgba(34,197,82,0.2)" }}>{notice}</div> : null}
      {children}
    </div>
  );
}
