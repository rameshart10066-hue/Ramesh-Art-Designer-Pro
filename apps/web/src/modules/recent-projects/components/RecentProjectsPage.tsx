"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecentProjectsStore } from "@/stores/recentProjectsStore";
import { type RecentProject, type RecentSortKey, SORT_OPTIONS, queryRecentProjects } from "@/services/recentProjectsCore";
import { loadProjectData } from "@/services/projectIo";
import { ProjectCard } from "./ProjectCard";

const C = {
  bg: "#020617",
  border: "#1e293b",
  borderStrong: "#334155",
  surface: "#0f172a",
  surface2: "#1e293b",
  text: "#f8fafc",
  muted: "#94a3b8",
  dim: "#64748b",
  accent: "#3b82f6",
};

/**
 * Recent Projects — full manager (Sprint 11.4). Search, sort, pin, and the
 * open / rename / duplicate / delete actions over the persisted project list.
 */
export function RecentProjectsPage() {
  const router = useRouter();

  const projects = useRecentProjectsStore((s) => s.projects);
  const touchProject = useRecentProjectsStore((s) => s.touchProject);
  const togglePin = useRecentProjectsStore((s) => s.togglePin);
  const renameProject = useRecentProjectsStore((s) => s.renameProject);
  const duplicateProject = useRecentProjectsStore((s) => s.duplicateProject);
  const removeProject = useRecentProjectsStore((s) => s.removeProject);
  const clearProjects = useRecentProjectsStore((s) => s.clearProjects);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<RecentSortKey>("modified-desc");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; isError: boolean } | null>(null);

  const showNotice = useCallback((message: string, isError = false) => {
    setNotice({ message, isError });
    window.setTimeout(() => setNotice(null), 3000);
  }, []);

  const visible = useMemo(() => queryRecentProjects(projects, { search, sort }), [projects, search, sort]);
  const pinnedCount = useMemo(() => projects.filter((p) => p.pinned).length, [projects]);

  const handleOpen = useCallback(
    (project: RecentProject) => {
      if (!project.data) {
        showNotice(`“${project.name}” is too large to reopen from this device — use File → Open in the Design Studio.`, true);
        return;
      }
      if (loadProjectData(project.data)) {
        touchProject(project.id);
        router.push("/design-studio");
      } else {
        showNotice(`Could not open “${project.name}”.`, true);
      }
    },
    [router, showNotice, touchProject],
  );

  const handleDelete = useCallback(
    (project: RecentProject) => {
      if (window.confirm(`Delete “${project.name}” from recent projects?`)) {
        removeProject(project.id);
        setRenamingId(null);
        showNotice(`Deleted “${project.name}”.`);
      }
    },
    [removeProject, showNotice],
  );

  const handleCommitRename = useCallback(
    (project: RecentProject, name: string) => {
      if (name.trim() && name.trim() !== project.name) renameProject(project.id, name.trim());
      setRenamingId(null);
    },
    [renameProject],
  );

  const hasActiveQuery = search.trim() !== "";

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: C.bg, color: C.text }}>
      {/* Header */}
      <div style={{ maxWidth: 1160, margin: "0 auto", width: "100%", padding: "22px 24px 0" }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Recent Projects</h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: C.muted }}>
          {projects.length} saved project{projects.length === 1 ? "" : "s"} · {pinnedCount} pinned
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ maxWidth: 1160, margin: "0 auto", width: "100%", padding: "16px 24px 0" }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 12,
          }}
        >
          <input
            type="search"
            placeholder="Search projects, materials, themes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 220,
              padding: "9px 12px",
              borderRadius: 9,
              border: `1px solid ${C.borderStrong}`,
              background: "#0b1120",
              color: C.text,
              fontSize: 13,
              outline: "none",
            }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.dim }}>
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as RecentSortKey)}
              style={{
                padding: "8px 10px",
                borderRadius: 9,
                border: `1px solid ${C.borderStrong}`,
                background: C.surface2,
                color: C.text,
                fontSize: 12,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {projects.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Clear all recent projects?")) clearProjects();
              }}
              style={{ border: "none", background: "transparent", color: C.dim, fontSize: 12, cursor: "pointer", padding: "6px 8px", borderRadius: 8 }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, minHeight: 0, maxWidth: 1160, margin: "0 auto", width: "100%", padding: "16px 24px 24px", overflowY: "auto" }}>
        {projects.length === 0 ? (
          <EmptyState
            title="No recent projects yet"
            body="Save a design from the Design Studio (File → Save) or open a .radp file and it will appear here."
            actionLabel="Back to Home"
            onAction={() => router.push("/")}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No projects match your search"
            body="Try a different search or sort."
            {...(hasActiveQuery ? { actionLabel: "Clear search", onAction: () => setSearch("") } : {})}
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {visible.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isRenaming={renamingId === project.id}
                onOpen={handleOpen}
                onTogglePin={(p) => togglePin(p.id)}
                onStartRename={(p) => setRenamingId(p.id)}
                onCommitRename={handleCommitRename}
                onCancelRename={() => setRenamingId(null)}
                onDuplicate={(p) => {
                  duplicateProject(p.id);
                  showNotice(`Duplicated “${p.name}”.`);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

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
        color: C.dim,
        border: "1px dashed #1e293b",
        borderRadius: 14,
      }}
    >
      <div style={{ fontSize: 36 }}>🗂️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.muted }}>{title}</div>
      <div style={{ fontSize: 13, maxWidth: 360, lineHeight: 1.5 }}>{body}</div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{ marginTop: 8, padding: "9px 16px", borderRadius: 9, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
