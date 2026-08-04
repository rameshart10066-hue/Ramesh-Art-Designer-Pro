"use client";

import { useRouter } from "next/navigation";
import { type RecentProject } from "@/services/recentProjectsCore";
import { queryRecentProjects } from "@/services/recentProjectsCore";
import { useRecentProjectsStore } from "@/stores/recentProjectsStore";
import { COLORS } from "../theme";

const ACCENT_CYCLE = [COLORS.accent, "#8b5cf6", "#f59e0b", "#10b981", "#ec4899"];

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

interface RecentProjectsPanelProps {
  /** Called when a project is chosen from the list. */
  onOpen: (project: RecentProject) => void;
}

/**
 * Compact recent-projects glance for the Welcome Dashboard (pinned first).
 * Links out to the full manager at `/recent-projects`.
 */
export function RecentProjectsPanel({ onOpen }: RecentProjectsPanelProps) {
  const router = useRouter();
  const projects = useRecentProjectsStore((s) => s.projects);
  const removeProject = useRecentProjectsStore((s) => s.removeProject);
  const clearProjects = useRecentProjectsStore((s) => s.clearProjects);

  const sorted = queryRecentProjects(projects, {});

  return (
    <section
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 280,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 18px",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>⭐</span>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: COLORS.text }}>Recent Projects</h2>
          {projects.length > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: COLORS.textMuted,
                background: COLORS.surface2,
                borderRadius: 999,
                padding: "2px 8px",
              }}
            >
              {projects.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => router.push("/recent-projects")}
          style={{
            border: "none",
            background: "transparent",
            color: COLORS.accentLight,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            padding: "4px 6px",
            borderRadius: 6,
          }}
        >
          View all →
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {sorted.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 32,
              textAlign: "center",
              color: COLORS.textDim,
            }}
          >
            <div style={{ fontSize: 30 }}>🗂️</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: 600 }}>No recent projects yet</div>
            <div style={{ fontSize: 12, maxWidth: 320, lineHeight: 1.5 }}>
              Save a design from the Design Studio (File → Save) or open a .radp file and it will appear here for quick access.
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {sorted.map((project, index) => (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(project)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(project);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 18px",
                  borderBottom: `1px solid ${COLORS.border}`,
                  cursor: "pointer",
                  background: "transparent",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = COLORS.surface2;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 9,
                    flexShrink: 0,
                    overflow: "hidden",
                    background: "#0b1120",
                    border: `1px solid ${COLORS.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {project.thumbnail ? (
                    <div style={{ width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: project.thumbnail }} />
                  ) : (
                    <span style={{ fontSize: 18 }}>{ACCENT_CYCLE[index % ACCENT_CYCLE.length] === COLORS.accent ? "🏛" : "🖼"}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                    {project.pinned && <span style={{ fontSize: 11 }}>📌</span>}
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{project.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>
                    {project.material ? `${project.material} · ` : ""}
                    {formatRelativeTime(project.modifiedAt)}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${project.name} from recent projects`}
                  title="Remove from recent"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeProject(project.id);
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: COLORS.textDim,
                    cursor: "pointer",
                    fontSize: 14,
                    padding: "4px 6px",
                    borderRadius: 6,
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {sorted.length > 0 && (
        <div style={{ padding: "8px 18px", borderTop: `1px solid ${COLORS.border}` }}>
          <button
            type="button"
            onClick={clearProjects}
            style={{
              border: "none",
              background: "transparent",
              color: COLORS.textDim,
              fontSize: 12,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Clear all
          </button>
        </div>
      )}
    </section>
  );
}
