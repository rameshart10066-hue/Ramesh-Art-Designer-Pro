"use client";

import { useEffect, useRef } from "react";
import type { RecentProject, ManufacturingStatus } from "@/services/recentProjectsCore";

const C = {
  border: "#1e293b",
  borderStrong: "#334155",
  surface: "#0f172a",
  surface2: "#1e293b",
  text: "#f8fafc",
  muted: "#94a3b8",
  dim: "#64748b",
  accent: "#3b82f6",
  gold: "#fbbf24",
  danger: "#ef4444",
};

const STATUS: Record<ManufacturingStatus, { label: string; fg: string; bg: string }> = {
  none: { label: "Not manufactured", fg: "#64748b", bg: "rgba(100,116,139,0.14)" },
  ready: { label: "Manufacturing ready", fg: "#60a5fa", bg: "rgba(59,130,246,0.14)" },
  complete: { label: "Manufacturing complete", fg: "#4ade80", bg: "rgba(34,197,94,0.14)" },
};

function formatModified(iso: string): string {
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

interface ProjectCardProps {
  project: RecentProject;
  isRenaming: boolean;
  onOpen: (project: RecentProject) => void;
  onTogglePin: (project: RecentProject) => void;
  onStartRename: (project: RecentProject) => void;
  onCommitRename: (project: RecentProject, name: string) => void;
  onCancelRename: () => void;
  onDuplicate: (project: RecentProject) => void;
  onDelete: (project: RecentProject) => void;
}

export function ProjectCard(props: ProjectCardProps) {
  const { project, isRenaming } = props;
  const status = STATUS[project.manufacturingStatus ?? "none"]!;
  const metaCount = [project.size, project.theme, project.material].filter(Boolean).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 14,
        border: `1px solid ${C.border}`,
        background: C.surface,
        overflow: "hidden",
        transition: "border-color 0.12s ease, box-shadow 0.12s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.borderStrong;
        e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", height: 150, background: "#0b1120", flexShrink: 0 }}>
        {project.thumbnail ? (
          <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: project.thumbnail }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🏛</div>
        )}
        <button
          type="button"
          onClick={() => props.onTogglePin(project)}
          title={project.pinned ? "Unpin" : "Pin to top"}
          aria-label={project.pinned ? "Unpin" : "Pin to top"}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: `1px solid ${project.pinned ? C.gold : C.borderStrong}`,
            background: project.pinned ? "rgba(251,191,36,0.18)" : "rgba(15,23,42,0.7)",
            color: project.pinned ? C.gold : C.dim,
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          📌
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
        {isRenaming ? (
          <RenameInput project={project} onCommit={(name) => props.onCommitRename(project, name)} onCancel={props.onCancelRename} />
        ) : (
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={project.name}>
            {project.name}
          </div>
        )}

        <div style={{ fontSize: 11, color: C.dim }}>
          Modified {formatModified(project.modifiedAt)}
          <span title={new Date(project.modifiedAt).toLocaleString()}> · {project.objectsCount} object{project.objectsCount === 1 ? "" : "s"}</span>
        </div>

        {metaCount > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {project.size && <Badge tone="blue">{project.size}</Badge>}
            {project.theme && <Badge tone="violet">{project.theme}</Badge>}
            {project.material && <Badge>{project.material}</Badge>}
          </div>
        )}

        <span
          style={{
            alignSelf: "flex-start",
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 999,
            color: status.fg,
            background: status.bg,
          }}
        >
          {status.label}
        </span>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
          <button type="button" onClick={() => props.onOpen(project)} style={{ ...actionBtn, flex: 1, background: C.accent, borderColor: C.accent, color: "#fff" }}>
            Open
          </button>
          <IconBtn title="Pin" onClick={() => props.onTogglePin(project)} active={project.pinned}>📌</IconBtn>
          <IconBtn title="Rename" onClick={() => props.onStartRename(project)}>✏️</IconBtn>
          <IconBtn title="Duplicate" onClick={() => props.onDuplicate(project)}>⧉</IconBtn>
          <IconBtn title="Delete" onClick={() => props.onDelete(project)} danger>🗑</IconBtn>
        </div>
      </div>
    </div>
  );
}

function RenameInput({ project, onCommit, onCancel }: { project: RecentProject; onCommit: (name: string) => void; onCancel: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = () => {
    const value = inputRef.current?.value.trim();
    if (value) onCommit(value);
    else onCancel();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={project.name}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") onCancel();
      }}
      onBlur={commit}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "6px 8px",
        borderRadius: 8,
        border: `1px solid ${C.accent}`,
        background: "#0b1120",
        color: C.text,
        fontSize: 14,
        fontWeight: 600,
        outline: "none",
      }}
    />
  );
}

function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "blue" | "violet" }) {
  const colors: Record<string, { fg: string; bg: string }> = {
    default: { fg: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
    blue: { fg: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
    violet: { fg: "#a78bfa", bg: "rgba(139,92,246,0.12)" },
  };
  const c = colors[tone]!;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, color: c.fg, background: c.bg, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function IconBtn({ children, onClick, title, danger, active }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: `1px solid ${active ? C.gold : C.borderStrong}`,
        background: C.surface2,
        color: danger ? C.danger : active ? C.gold : C.muted,
        cursor: "pointer",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

const actionBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${C.borderStrong}`,
  background: C.surface2,
  color: C.text,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
