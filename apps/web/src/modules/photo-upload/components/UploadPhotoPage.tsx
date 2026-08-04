"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/stores/projectStore";
import { loadImageFromFile, type LoadedImage } from "@/vision/ImageLoader";
import {
  type PreparedImage,
  convertHeicToJpeg,
  formatBytes,
  imageTypeLabel,
  isHeicFile,
  isSupportedImage,
  prepareCustomerImage,
} from "../photoUploadService";
import { DropZone } from "./DropZone";

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
  success: "#22c55e",
  warning: "#f59e0b",
};

type Stage = "idle" | "preview" | "preparing" | "prepared";

/**
 * Upload Customer Photo — the entry point into the AI Vision pipeline.
 *
 * Supports drag & drop, browse, paste, WhatsApp/mobile photos, and HEIC/HEIF
 * (converted to JPEG on the fly). After upload the page shows a preview,
 * "prepares" the image through the existing vision preprocessing modules, and
 * hands the result to the Design Studio's Vision tab. No AI runs here — this
 * only connects the workflow.
 */
export function UploadPhotoPage() {
  const router = useRouter();
  const setProcessedImage = useProjectStore((s) => s.setProcessedImage);

  const [stage, setStage] = useState<Stage>("idle");
  const [source, setSource] = useState<LoadedImage | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [wasHeic, setWasHeic] = useState(false);
  const [prepared, setPrepared] = useState<PreparedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState<{ message: string; isError: boolean } | null>(null);

  const showNotice = useCallback((message: string, isError = false) => {
    setNotice({ message, isError });
    window.setTimeout(() => setNotice(null), 3200);
  }, []);

  // ── File intake (drop / browse / paste, HEIC conversion) ─────────

  const handleFile = useCallback(
    async (file: File) => {
      if (busy) return;
      if (!isSupportedImage(file)) {
        showNotice(`Unsupported file "${file.name}". Use PNG, JPG, JPEG, WebP or HEIC.`, true);
        return;
      }

      setBusy(true);
      try {
        let target = file;
        const heic = isHeicFile(file);
        setWasHeic(heic);
        if (heic) {
          setStatus("Converting HEIC → JPG…");
          target = await convertHeicToJpeg(file);
        }

        setStatus("Loading image…");
        const loaded = await loadImageFromFile(target);
        setSource(loaded);
        setSourceFile(target);
        setPrepared(null);
        setStage("preview");
        setStatus(
          `Loaded ${loaded.width}×${loaded.height}px · ${imageTypeLabel(target)}` +
            (loaded.isWhatsApp ? " · WhatsApp image" : "") +
            (heic ? " · converted from HEIC" : ""),
        );
      } catch (err) {
        showNotice(err instanceof Error ? err.message : "Could not load that image.", true);
      } finally {
        setBusy(false);
      }
    },
    [busy, showNotice],
  );

  // ── Paste image (Ctrl+V anywhere on the page) ────────────────────

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            void handleFile(file);
            return;
          }
        }
      }
    },
    [handleFile],
  );

  // ── Prepare ──────────────────────────────────────────────────────

  const handlePrepare = useCallback(() => {
    if (!source || busy) return;
    setStage("preparing");
    setBusy(true);
    setStatus("Preparing image…");
    requestAnimationFrame(() => {
      try {
        const result = prepareCustomerImage(source);
        setPrepared(result);
        setStage("prepared");
        setStatus(
          `Prepared · ${result.steps.length > 0 ? result.steps.join(" · ") : "kept original"}`,
        );
      } catch (err) {
        showNotice(err instanceof Error ? err.message : "Preparation failed.", true);
        setStage("preview");
      } finally {
        setBusy(false);
      }
    });
  }, [source, busy, showNotice]);

  // ── Hand off to the Vision pipeline ─────────────────────────────

  const handleOpenVision = useCallback(() => {
    if (!prepared) return;
    // Store the prepared image once — the Vision tab consumes and clears it.
    setProcessedImage(prepared.dataUrl);
    router.push("/design-studio?tab=vision");
  }, [prepared, setProcessedImage, router]);

  const handleReset = useCallback(() => {
    setSource(null);
    setSourceFile(null);
    setPrepared(null);
    setWasHeic(false);
    setStage("idle");
  }, []);

  return (
    <div
      onPaste={handlePaste}
      style={{ flex: 1, overflowY: "auto", background: C.bg, color: C.text, minHeight: 0 }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px 56px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>Upload Customer Photo</h1>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: C.muted, maxWidth: 560, marginInline: "auto", lineHeight: 1.5 }}>
            Send a customer photo through the AI Vision pipeline — the design is prepared here, then
            opened in the Design Studio for component detection and CAD reconstruction.
          </p>
        </div>

        {stage === "idle" && <DropZone onFile={(f) => void handleFile(f)} busy={busy} />}

        {(stage === "preview" || stage === "preparing" || stage === "prepared") && source && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Status */}
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: C.surface,
                border: `1px solid ${C.border}`,
                fontSize: 12,
                color: C.muted,
              }}
            >
              {status}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              {/* Original */}
              <div style={panelStyle}>
                <PanelHeader title="Original" badge={imageTypeLabel({ type: source.mimeType, name: source.fileName })} />
                <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                  <img src={source.dataUrl} alt="Original upload" style={{ width: "100%", height: "auto", display: "block", background: "#0b1120" }} />
                </div>
                <MetaRow
                  items={[
                    `${source.width}×${source.height}px`,
                    sourceFile ? formatBytes(sourceFile.size) : "",
                    source.isWhatsApp ? "WhatsApp" : "",
                  ]}
                />
              </div>

              {/* Prepared */}
              <div style={panelStyle}>
                <PanelHeader title="Prepared" badge={prepared ? `✓ ${prepared.steps.length} step${prepared.steps.length === 1 ? "" : "s"}` : "pending"} />
                {prepared ? (
                  <>
                    <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                      <img src={prepared.dataUrl} alt="Prepared image" style={{ width: "100%", height: "auto", display: "block", background: "#0b1120" }} />
                    </div>
                    {prepared.steps.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {prepared.steps.map((step) => (
                          <span key={step} style={{ fontSize: 10, fontWeight: 700, color: "#86efac", background: "rgba(34,197,94,0.12)", borderRadius: 999, padding: "2px 8px" }}>
                            {step}
                          </span>
                        ))}
                      </div>
                    )}
                    <MetaRow items={[`${prepared.width}×${prepared.height}px`, wasHeic ? "HEIC converted" : ""]} />
                  </>
                ) : (
                  <div
                    style={{
                      height: 200,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: C.dim,
                      fontSize: 13,
                      borderRadius: 10,
                      border: `1px dashed ${C.borderStrong}`,
                    }}
                  >
                    {stage === "preparing" ? "Preparing…" : "Not prepared yet"}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <button
                type="button"
                onClick={handleReset}
                disabled={busy}
                style={{ ...secondaryBtn, opacity: busy ? 0.5 : 1 }}
              >
                ← Change image
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                {stage !== "prepared" && (
                  <button
                    type="button"
                    onClick={handlePrepare}
                    disabled={busy}
                    style={{ ...primaryBtn, opacity: busy ? 0.5 : 1 }}
                  >
                    {stage === "preparing" ? "Preparing…" : "🪄 Prepare Image"}
                  </button>
                )}
                {stage === "prepared" && prepared && (
                  <>
                    <button type="button" onClick={handlePrepare} disabled={busy} style={secondaryBtn}>
                      ↻ Re-prepare
                    </button>
                    <button type="button" onClick={handleOpenVision} style={{ ...primaryBtn, background: C.success, opacity: 1 }}>
                      Open in AI Vision Pipeline →
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <p style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: C.dim }}>
          The Vision pipeline (component detection, CAD reconstruction) opens in the Design Studio. No
          AI processing happens on this page.
        </p>
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

// ── Small building blocks ─────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

function PanelHeader({ title, badge }: { title: string; badge: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, background: C.surface2, borderRadius: 999, padding: "2px 8px" }}>{badge}</span>
    </div>
  );
}

function MetaRow({ items }: { items: string[] }) {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {visible.map((item) => (
        <span key={item} style={{ fontSize: 10, fontWeight: 600, color: C.dim, background: C.surface2, borderRadius: 6, padding: "2px 6px" }}>
          {item}
        </span>
      ))}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: "11px 18px",
  borderRadius: 9,
  border: "none",
  background: C.accent,
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  padding: "11px 18px",
  borderRadius: 9,
  border: `1px solid ${C.borderStrong}`,
  background: C.surface2,
  color: C.text,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
