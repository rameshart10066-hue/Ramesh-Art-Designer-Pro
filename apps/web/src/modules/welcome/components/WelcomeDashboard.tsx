"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { useAppSettingsStore } from "@/stores/appSettingsStore";
import { useRecentProjectsStore } from "@/stores/recentProjectsStore";
import { type RecentProject } from "@/services/recentProjectsCore";
import { openProjectFromData, openProjectFromFile, recordRecentProject } from "@/services/projectIo";
import { COLORS } from "../theme";
import { WelcomeHeader } from "./WelcomeHeader";
import { ActionCard } from "./ActionCard";
import { RecentProjectsPanel } from "./RecentProjectsPanel";
import { QuickTipsPanel } from "./QuickTipsPanel";

/**
 * Welcome Dashboard — the professional landing page shown before the Design
 * Studio. Entry points for every main workflow:
 *
 *   📸 Upload Customer Photo   → Design Studio (Vision tab, photo→CAD)
 *   🏛 Create New Decoration   → New Project Wizard → Studio
 *   📚 Open Catalog            → catalog page
 *   📂 Open Existing Project   → .radp/.json file → Studio
 *   ⭐ Recent Projects         → reopen last 10 saved projects
 *   ⚙ Settings                 → settings page
 */
export function WelcomeDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showQuickTips = useAppSettingsStore((s) => s.showQuickTips);
  const showRecentProjects = useAppSettingsStore((s) => s.showRecentProjects);
  const updateSettings = useAppSettingsStore((s) => s.updateSettings);
  const touchProject = useRecentProjectsStore((s) => s.touchProject);

  const [notice, setNotice] = useState<{ message: string; isError: boolean } | null>(null);

  const showNotice = useCallback((message: string, isError = false) => {
    setNotice({ message, isError });
    window.setTimeout(() => setNotice(null), 3200);
  }, []);

  // ── Main actions ─────────────────────────────────────────────

  const handleUploadPhoto = useCallback(() => {
    router.push("/upload-photo");
  }, [router]);

  const handleOpenCatalog = useCallback(() => {
    router.push("/catalog");
  }, [router]);

  const handleOpenSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  /** Open the full Recent Projects manager. */
  const handleOpenRecentPage = useCallback(() => {
    router.push("/recent-projects");
  }, [router]);

  /** New Project Wizard → Design Studio. */
  const handleNewProject = useCallback(() => {
    router.push("/new-project");
  }, [router]);

  /** Blank canvas → Studio. */
  const handleBlankProject = useCallback(() => {
    useEditorStoreV2.getState().loadObjects([]);
    recordRecentProject({ name: "Untitled Design", objects: [] });
    router.push("/design-studio");
  }, [router]);

  /** Open an .radp/.json file, load it, then go to the Studio. */
  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChosen = useCallback(
    async (file: File) => {
      const ok = await openProjectFromFile(file);
      if (ok) {
        showNotice(`Opened “${file.name}”.`);
        router.push("/design-studio");
      } else {
        showNotice(`Could not open “${file.name}” — not a valid .radp project file.`, true);
      }
    },
    [router, showNotice],
  );

  const handleOpenRecent = useCallback(
    (project: RecentProject) => {
      if (!project.data) {
        showNotice(`“${project.name}” is too large to reopen from this device — use File → Open in the Design Studio.`, true);
        return;
      }
      const ok = openProjectFromData(project.data, `${project.name}.radp`);
      if (ok) {
        touchProject(project.id);
        router.push("/design-studio");
      } else {
        showNotice(`Could not reopen “${project.name}”.`, true);
      }
    },
    [router, showNotice, touchProject],
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", background: COLORS.bg, color: COLORS.text }}>
      <WelcomeHeader />

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 56px" }}>
        {/* ── Main action cards ─────────────────────────────── */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          <ActionCard
            icon="📸"
            title="Upload Customer Photo"
            description="AI converts the customer image into an editable CAD design."
            accent={COLORS.accent}
            onClick={handleUploadPhoto}
          />

          <ActionCard
            icon="🏛"
            title="Create New Decoration"
            description="Start with a guided wizard — pick a type, size and material."
            accent="#8b5cf6"
            onClick={handleNewProject}
            footer={
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBlankProject();
                }}
                style={secondaryActionStyle}
              >
                Blank project →
              </button>
            }
          />

          <ActionCard
            icon="📚"
            title="Open Catalog"
            description="Browse saved Ganpati designs and decorations."
            accent="#f59e0b"
            onClick={handleOpenCatalog}
          />

          <ActionCard
            icon="📂"
            title="Open Existing Project"
            description="Open a .radp project file from disk."
            accent="#10b981"
            onClick={handlePickFile}
          />

          <ActionCard
            icon="⭐"
            title="Recent Projects"
            description={`Browse, search and manage your last 10 projects.`}
            accent="#ec4899"
            onClick={handleOpenRecentPage}
          />

          <ActionCard
            icon="⚙"
            title="Settings"
            description="Workspace preferences, canvas defaults and autosave."
            accent="#64748b"
            onClick={handleOpenSettings}
          />
        </section>

        {/* ── Recent projects + quick tips ─────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 20,
            marginTop: 28,
          }}
        >
          {showRecentProjects && <RecentProjectsPanel onOpen={handleOpenRecent} />}
          {showQuickTips && <QuickTipsPanel onDismiss={() => updateSettings({ showQuickTips: false })} />}
        </div>

        <footer style={{ marginTop: 32, textAlign: "center", fontSize: 12, color: COLORS.textDim }}>
          Ramesh Art Designer Pro · Professional Ganpati CAD & Manufacturing
        </footer>
      </div>

      {/* Hidden file picker for .radp / .json */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".radp,.json"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFileChosen(file);
        }}
      />

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

const secondaryActionStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  border: "1px solid rgba(139, 92, 246, 0.4)",
  background: "rgba(139, 92, 246, 0.1)",
  color: "#c4b5fd",
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 8,
  padding: "7px 12px",
  cursor: "pointer",
};
