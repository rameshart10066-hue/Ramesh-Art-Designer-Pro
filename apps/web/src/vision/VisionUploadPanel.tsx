"use client";

/**
 * Vision Upload Panel — Sprint 10.1
 *
 * Upload → Preprocess → Save pipeline for the design studio:
 *  - Upload JPG / PNG / WebP (click or drag & drop), with WhatsApp/mobile
 *    photo auto-normalization.
 *  - Processing steps: auto-straighten (perspective), remove background,
 *    improve contrast, detect edges.
 *  - Scale estimation from a user-supplied reference width (mm).
 *  - Save the processed image into the active project (persisted store).
 *
 * Component detection is intentionally NOT implemented yet.
 *
 * All heavy pixel work is delegated to the pure modules in ./ and runs in
 * the browser; nothing here depends on a DOM during server render (the
 * processing functions are only called from event handlers).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import type { PixelImage } from "./types";
import { loadImageFromFile, isSupportedFile, type LoadedImage } from "./ImageLoader";
import { improveImage } from "./ImageNormalizer";
import { straightenImage } from "./PerspectiveCorrection";
import { removeBackground } from "./BackgroundRemoval";
import { detectEdges } from "./EdgeDetector";
import { estimateImageScale, type ScaleEstimate } from "./ScaleEstimator";
import { detectComponentsFromImage, type DetectedComponent } from "./ComponentDetector";
import type { ComponentType } from "./ObjectClassifier";
import { matchComponents, replaceMatch, type ComponentMatch } from "./ComponentMatcher";
import { reconstructFromMatches, type ReconstructionResult } from "./CADReconstructor";
import { autoGenerateManufacturing, type ManufacturingBundle } from "@/manufacturing/autoGenerate";

const HISTORY_LIMIT = 6;

interface HistoryEntry {
  pixel: PixelImage;
  dataUrl: string;
}

export function VisionUploadPanel() {
  const setProcessedImage = useProjectStore((s) => s.setProcessedImage);

  const [source, setSource] = useState<LoadedImage | null>(null);
  const [stack, setStack] = useState<HistoryEntry[]>([]);
  const [stackIndex, setStackIndex] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refWidthInput, setRefWidthInput] = useState("");
  const [scale, setScale] = useState<ScaleEstimate | null>(null);
  const [detections, setDetections] = useState<DetectedComponent[]>([]);
  const [matches, setMatches] = useState<ComponentMatch[]>([]);
  const [reconstruction, setReconstruction] = useState<ReconstructionResult | null>(null);
  const [manufacturing, setManufacturing] = useState<ManufacturingBundle | null>(null);
  const [manufacturingBusy, setManufacturingBusy] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const canvasObjectCount = useEditorStoreV2((s) => s.objects.length);
  const [status, setStatus] = useState("Upload an image (JPG, PNG, WebP) to begin");
  const [isError, setIsError] = useState(false);

  const current = stack[stackIndex] ?? null;

  // ── Pixel → data URL (browser-only) ────────────────────────────

  const pixelToDataUrl = useCallback((pixel: PixelImage): string => {
    const canvas = document.createElement("canvas");
    canvas.width = pixel.width;
    canvas.height = pixel.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.putImageData(toImageData(pixel), 0, 0);
    return canvas.toDataURL("image/png");
  }, []);

  /** Append a processed pixel to the history stack (truncating the redo tail). */
  const pushState = useCallback(
    (pixel: PixelImage) => {
      const dataUrl = pixelToDataUrl(pixel);
      setStack((prev) => {
        const next = [...prev.slice(0, stackIndex + 1), { pixel, dataUrl }];
        if (next.length > HISTORY_LIMIT) next.shift();
        return next;
      });
      setStackIndex((prev) => Math.min(prev + 1, HISTORY_LIMIT - 1));
      setScale(null);
    },
    [stackIndex, pixelToDataUrl],
  );

  // ── File handling ──────────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const file = Array.from(files).find((f) => isSupportedFile(f));
      if (!file) {
        setStatus("No supported image found — use JPG, PNG, or WebP");
        setIsError(true);
        return;
      }
      setBusy(true);
      setStatus(`Loading "${file.name}"…`);
      setIsError(false);
      try {
        const loaded = await loadImageFromFile(file);
        setSource(loaded);
        setRefWidthInput("");
        setScale(null);

        const first: HistoryEntry = { pixel: loaded.pixel, dataUrl: loaded.dataUrl };
        if (loaded.isWhatsApp) {
          // WhatsApp / mobile photos are often compressed and low-contrast —
          // auto-normalize once so the user starts from a usable image.
          const improved = improveImage(loaded.pixel);
          const improvedEntry: HistoryEntry = {
            pixel: improved,
            dataUrl: pixelToDataUrl(improved),
          };
          setStack([first, improvedEntry]);
          setStackIndex(1);
          setStatus(
            `WhatsApp image detected (${loaded.width}×${loaded.height}) — contrast auto-improved.`,
          );
        } else {
          setStack([first]);
          setStackIndex(0);
          setStatus(`Loaded ${loaded.width}×${loaded.height} (${loaded.fileName}).`);
        }
      } catch (err: unknown) {
        setStatus(err instanceof Error ? err.message : "Failed to load image");
        setIsError(true);
      } finally {
        setBusy(false);
      }
    },
    [pixelToDataUrl],
  );

  // ── One-shot handoff from the Upload Customer Photo page ─────────
  // The upload page stores the prepared image on the project; consume it here
  // and clear it so it isn't reloaded again on later tab switches.
  const handoffLoadedRef = useRef(false);

  useEffect(() => {
    if (handoffLoadedRef.current) return;
    handoffLoadedRef.current = true;
    const dataUrl = useProjectStore.getState().project.processedImage;
    if (!dataUrl) return;
    void (async () => {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "uploaded-photo.png", { type: blob.type || "image/png" });
        await handleFiles([file]);
      } catch {
        // Handoff failed — the user can still upload manually in this panel.
      } finally {
        useProjectStore.getState().setProcessedImage(null);
      }
    })();
  }, [handleFiles]);

  // ── Processing actions ─────────────────────────────────────────

  const run = useCallback(
    (label: string, fn: (pixel: PixelImage) => PixelImage) => {
      if (!current) return;
      setBusy(true);
      setStatus(`${label}…`);
      setIsError(false);
      // Defer so the status paints before the potentially heavy work.
      requestAnimationFrame(() => {
        try {
          pushState(fn(current.pixel));
          setStatus(`${label} complete.`);
        } catch (err: unknown) {
          setStatus(err instanceof Error ? `${label} failed: ${err.message}` : `${label} failed`);
          setIsError(true);
        } finally {
          setBusy(false);
        }
      });
    },
    [current, pushState],
  );

  const handleStraighten = useCallback(
    () => run("Straightening", (p) => straightenImage(p).image),
    [run],
  );
  const handleRemoveBackground = useCallback(
    () => run("Removing background", (p) => removeBackground(p).image),
    [run],
  );
  const handleImproveContrast = useCallback(
    () => run("Improving contrast", (p) => improveImage(p)),
    [run],
  );
  const handleDetectEdges = useCallback(
    () => run("Detecting edges", (p) => detectEdges(p).binary),
    [run],
  );

  const handleDetect = useCallback(() => {
    if (!current) return;
    setDetecting(true);
    setStatus("Detecting components…");
    setIsError(false);
    requestAnimationFrame(() => {
      try {
        const result = detectComponentsFromImage(current.pixel);
        setDetections(result);
        const matched = matchComponents(result);
        setMatches(matched);
        setStatus(
          `Detected ${Math.max(0, result.length - 1)} component(s) · ${matched.filter((m) => m.autoAccept).length} auto-matched, ${matched.filter((m) => m.isDraft).length} draft(s).`,
        );
      } catch (err: unknown) {
        setStatus(err instanceof Error ? `Detection failed: ${err.message}` : "Detection failed");
        setIsError(true);
      } finally {
        setDetecting(false);
      }
    });
  }, [current]);

  const handleClearDetections = useCallback(() => {
    setDetections([]);
    setMatches([]);
    setStatus("Detections cleared.");
    setIsError(false);
  }, []);

  const handleReplaceMatch = useCallback((match: ComponentMatch, chosenLabel: string) => {
    const replacement = match.alternatives.find((a) => a.label === chosenLabel);
    if (!replacement) return;
    setMatches((prev) =>
      prev.map((m) =>
        m.detected.segmentId === match.detected.segmentId ? replaceMatch(m, replacement) : m,
      ),
    );
    setStatus(`Replaced "${match.primary.label}" with "${replacement.label}".`);
    setIsError(false);
  }, []);

  const handleOpenOnCanvas = useCallback(() => {
    if (!current || matches.length === 0) return;
    try {
      const result = reconstructFromMatches(matches, current.pixel.width, current.pixel.height);
      useEditorStoreV2.getState().loadObjects(result.objects);
      setReconstruction(result);
      setStatus(
        `Opened on canvas: ${result.objects.length} object(s) · ${result.dna.style} style · ${result.symmetryAxisCount} symmetry axis(es). Everything is editable.`,
      );
      setIsError(false);
    } catch (err: unknown) {
      setStatus(err instanceof Error ? `Reconstruction failed: ${err.message}` : "Reconstruction failed");
      setIsError(true);
    }
  }, [current, matches]);

  const handleAutoManufacturing = useCallback(() => {
    const objects = useEditorStoreV2.getState().objects;
    if (objects.length === 0) {
      setStatus("No objects on the canvas to manufacture — open a reconstruction first.");
      setIsError(true);
      return;
    }
    setManufacturingBusy(true);
    setStatus("Generating manufacturing package…");
    setIsError(false);
    requestAnimationFrame(() => {
      try {
        const bundle = autoGenerateManufacturing(objects);
        setManufacturing(bundle);
        setStatus(
          `Manufacturing ready: ${bundle.summary.totalSheets} × 39×19" sheet(s) · ${bundle.summary.totalParts} parts · ₹${bundle.summary.totalCost.toLocaleString("en-IN")}.`,
        );
      } catch (err: unknown) {
        setStatus(err instanceof Error ? `Manufacturing failed: ${err.message}` : "Manufacturing failed");
        setIsError(true);
      } finally {
        setManufacturingBusy(false);
      }
    });
  }, []);

  const handleDownload = useCallback((content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadPackage = useCallback(() => {
    if (!manufacturing) return;
    const b = manufacturing;
    b.dxf.forEach((dxf, i) => handleDownload(dxf, `sheet-${i + 1}.dxf`, "application/dxf"));
    b.svg.forEach((svg, i) => handleDownload(svg, `sheet-${i + 1}.svg`, "image/svg+xml"));
    b.cutReady.forEach((svg, i) => handleDownload(svg, `cut-ready-${i + 1}.svg`, "image/svg+xml"));

    const csv = [
      ["Part#", "Name", "Material", "W(mm)", "H(mm)", "Qty", "Area", "CutLen"],
      ...b.parts.map((p) => [p.partNumber, p.name, p.material, Math.round(p.width), Math.round(p.height), 1, Math.round(p.area), Math.round(p.cutLength)]),
    ].map((r) => r.join(",")).join("\n");
    handleDownload(csv, "bom.csv", "text/csv");

    const guide = [
      b.assemblyGuide.title,
      ...b.assemblyGuide.steps.map((s) => `Step ${s.stepNumber}: ${s.title} — ${s.description} (${s.partsInvolved.join(", ")})`),
    ].join("\n\n");
    handleDownload(guide, "assembly-guide.txt", "text/plain");

    const costLines = Object.entries(b.cost.formatted).map(([k, v]) => `${k}: ${v}`);
    handleDownload(`Ramesh Art Designer Pro — Cost Estimate\n\n${costLines.join("\n")}`, "cost-estimate.txt", "text/plain");

    const project = JSON.stringify(
      { version: "1.0.0", summary: b.summary, sheets: b.sheets, parts: b.parts, joints: b.joints, registrationMarks: b.registrationMarks, glueTabs: b.glueTabs, cost: b.cost },
      null,
      2,
    );
    handleDownload(project, "cut-ready-project.json", "application/json");

    setStatus("Manufacturing package downloaded (DXF, SVG, cut-ready, BOM, guide, cost, project).");
    setIsError(false);
  }, [manufacturing, handleDownload]);

  // Boxes and matches are tied to the current processed image — drop them if the image changes.
  useEffect(() => {
    setDetections([]);
    setMatches([]);
    setReconstruction(null);
  }, [current]);

  const handleUndo = useCallback(() => {
    setStackIndex((i) => Math.max(0, i - 1));
    setScale(null);
  }, []);
  const handleRedo = useCallback(() => {
    setStackIndex((i) => Math.min(stack.length - 1, i + 1));
    setScale(null);
  }, [stack.length]);
  const handleReset = useCallback(() => {
    setStackIndex(0);
    setScale(null);
    setStatus("Reset to original.");
    setIsError(false);
  }, []);

  const handleEstimateScale = useCallback(() => {
    if (!current) return;
    const mm = Number(refWidthInput);
    if (!Number.isFinite(mm) || mm <= 0) {
      setStatus("Enter a valid reference width in mm.");
      setIsError(true);
      return;
    }
    try {
      const result = estimateImageScale(current.pixel, mm);
      setScale(result);
      setStatus(
        `Scale: ${result.mmPerPixel.toFixed(3)} mm/px → ~${result.estimatedWidthMm}×${result.estimatedHeightMm} mm`,
      );
      setIsError(false);
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : "Could not estimate scale");
      setIsError(true);
    }
  }, [current, refWidthInput]);

  const handleSave = useCallback(() => {
    if (!current) return;
    try {
      // PNG preserves transparency from background removal; JPEG keeps the
      // persisted project small for opaque results.
      const hasAlpha = hasTransparency(current.pixel);
      const format: "image/png" | "image/jpeg" = hasAlpha ? "image/png" : "image/jpeg";
      const canvas = document.createElement("canvas");
      canvas.width = current.pixel.width;
      canvas.height = current.pixel.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.putImageData(toImageData(current.pixel), 0, 0);
      const dataUrl = canvas.toDataURL(format, 0.85);
      setProcessedImage(dataUrl);
      setStatus(`Saved to project (${Math.round(dataUrl.length / 1024)} KB, ${format}).`);
      setIsError(false);
    } catch (err: unknown) {
      setStatus(err instanceof Error ? `Save failed: ${err.message}` : "Save failed");
      setIsError(true);
    }
  }, [current, setProcessedImage]);

  const canUndo = stackIndex > 0;
  const canRedo = stackIndex < stack.length - 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontSize: 13, overflow: "hidden" }}>
      {/* Status */}
      <div
        style={{
          padding: "8px 12px",
          fontSize: 12,
          borderBottom: "1px solid #1e293b",
          background: isError ? "rgba(239,68,68,0.1)" : "transparent",
          color: isError ? "#fca5a5" : "#94a3b8",
        }}
      >
        {status}
      </div>

      {!source ? (
        <UploadZone
          dragOver={dragOver}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files);
          }}
          onFile={(file) => void handleFiles([file])}
        />
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
          {/* Preview */}
          <div style={{ padding: 12, borderBottom: "1px solid #1e293b" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
              Processed image · {current?.pixel.width}×{current?.pixel.height}px
              {source.isWhatsApp ? " · WhatsApp" : ""}
              {detections.length > 0 ? ` · ${detections.length - 1} component(s)` : ""}
            </div>
            {current?.dataUrl ? (
              <div style={{ position: "relative", width: "100%" }}>
                <img
                  src={current.dataUrl}
                  alt="Processed preview"
                  style={{ width: "100%", height: "auto", display: "block", borderRadius: 8, border: "1px solid #334155", background: "#0f172a" }}
                />
                {detections.map((d) => (
                  <DetectionOverlay
                    key={d.segmentId}
                    detection={d}
                    imageWidth={current.pixel.width}
                    imageHeight={current.pixel.height}
                  />
                ))}
              </div>
            ) : (
              <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>
                No preview
              </div>
            )}
            {detections.length > 0 && <DetectionLegend detections={detections} />}
          </div>

          {/* Component matches */}
          {matches.length > 0 && (
            <div style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Component Matches</div>
              <div style={{ display: "grid", gap: 8 }}>
                {matches.map((m) => (
                  <MatchCard
                    key={`match-${m.detected.segmentId}`}
                    match={m}
                    onReplace={(label) => handleReplaceMatch(m, label)}
                  />
                ))}
              </div>

              {/* Open reconstruction on the design canvas */}
              <button
                onClick={handleOpenOnCanvas}
                disabled={matches.length === 0 || busy}
                style={{ ...primaryBtn, marginTop: 8, opacity: matches.length === 0 || busy ? 0.5 : 1 }}
                title="Convert matches into editable parametric components on the canvas (replaces current canvas)"
              >
                🎨 Open on Canvas
              </button>
              {reconstruction && (
                <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8", background: "#1e293b", borderRadius: 6, padding: "6px 8px" }}>
                  {reconstruction.objects.length} editable object(s) · {reconstruction.dna.style} DNA · {reconstruction.symmetryAxisCount} symmetry axis(es)
                </div>
              )}
            </div>
          )}

          {/* Manufacturing automation */}
          {(reconstruction || manufacturing) && (
            <div style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Manufacturing</div>
              <button
                onClick={handleAutoManufacturing}
                disabled={canvasObjectCount === 0 || manufacturingBusy}
                style={{ ...primaryBtn, opacity: canvasObjectCount === 0 || manufacturingBusy ? 0.5 : 1 }}
                title='Auto-generate 39×19" sheets, joints, marks, tabs, numbers, guide, BOM, cost, DXF, SVG, cut-ready'
              >
                {manufacturingBusy ? "Generating…" : "⚙️ Auto Manufacturing"}
              </button>
              {manufacturing && (
                <>
                  <div style={{ marginTop: 6, fontSize: 11, color: "#cbd5e1", background: "#1e293b", borderRadius: 6, padding: "6px 8px" }}>
                    {manufacturing.summary.totalSheets} × 39×19" sheet(s) · {manufacturing.summary.totalParts} parts · {manufacturing.summary.totalJoints} joints · {manufacturing.summary.wastePercent}% waste
                    <br />
                    ₹{manufacturing.summary.totalCost.toLocaleString("en-IN")} · {manufacturing.summary.machineTimeMinutes} min
                  </div>
                  <button
                    onClick={handleDownloadPackage}
                    style={{ ...secondaryBtn, width: "100%", marginTop: 6 }}
                  >
                    ⬇ Download Package (DXF · SVG · Cut-Ready · BOM · Guide · Cost · JSON)
                  </button>
                </>
              )}
            </div>
          )}

          {/* Processing actions */}
          <div style={{ padding: 12, display: "grid", gap: 8 }}>
            <ActionButton label="↻ Auto Straighten" onClick={handleStraighten} disabled={busy} title="Correct small rotation / perspective tilt" />
            <ActionButton label="🪄 Remove Background" onClick={handleRemoveBackground} disabled={busy} title="Make the uniform background transparent" />
            <ActionButton label="☀ Improve Contrast" onClick={handleImproveContrast} disabled={busy} title="Auto-contrast + brightness balance" />
            <ActionButton label="⌖ Detect Edges" onClick={handleDetectEdges} disabled={busy} title="Detect edges (Sobel) → binary edge map" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 4 }}>
              <button
                onClick={handleDetect}
                disabled={busy || detecting}
                style={{ ...primaryBtn, opacity: busy || detecting ? 0.5 : 1 }}
                title="Detect frame, arch, pillar, lotus, bell, peacock, prabhavali, border, stage, om"
              >
                {detecting ? "Detecting…" : "🔍 Detect Components"}
              </button>
              <button
                onClick={handleClearDetections}
                disabled={detections.length === 0 || busy || detecting}
                style={{ ...secondaryBtn, width: "100%" }}
              >
                ✕ Clear
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 4 }}>
              <button onClick={handleUndo} disabled={!canUndo || busy} style={stepBtn}>↶ Undo</button>
              <button onClick={handleRedo} disabled={!canRedo || busy} style={stepBtn}>↷ Redo</button>
              <button onClick={handleReset} disabled={stackIndex === 0 || busy} style={stepBtn}>↺ Reset</button>
            </div>
          </div>

          {/* Scale estimation */}
          <div style={{ padding: "0 12px 12px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Scale estimation (full image width)</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="number"
                min="1"
                placeholder="Width in mm"
                value={refWidthInput}
                onChange={(e) => setRefWidthInput(e.target.value)}
                disabled={busy}
                style={inputStyle}
              />
              <button onClick={handleEstimateScale} disabled={busy} style={secondaryBtn}>Estimate</button>
            </div>
            {scale && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#cbd5e1", background: "#1e293b", borderRadius: 8, padding: "8px 10px" }}>
                <div>Scale: <span style={{ color: "#60a5fa", fontWeight: 600 }}>{scale.mmPerPixel.toFixed(3)} mm/px</span></div>
                <div>Estimated size: <span style={{ color: "#f8fafc", fontWeight: 600 }}>{scale.estimatedWidthMm} × {scale.estimatedHeightMm} mm</span></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save */}
      <div style={{ padding: "8px 12px", borderTop: "1px solid #1e293b", display: "flex", gap: 6 }}>
        <button
          onClick={handleSave}
          disabled={!current || busy}
          style={{ ...primaryBtn, opacity: !current || busy ? 0.5 : 1 }}
        >
          💾 Save to Project
        </button>
        {source && (
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = () => {
                const f = input.files?.[0];
                if (f) void handleFiles([f]);
              };
              input.click();
            }}
            disabled={busy}
            style={secondaryBtn}
          >
            New Image
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sub-components & styles ──────────────────────────────────────

function UploadZone({
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFile,
}: {
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFile: (file: File) => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        margin: 12,
        border: `2px dashed ${dragOver ? "#3b82f6" : "#334155"}`,
        borderRadius: 12,
        background: dragOver ? "rgba(59,130,246,0.08)" : "transparent",
        transition: "border-color 0.15s, background 0.15s",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 44 }}>📷</div>
      <div style={{ color: "#94a3b8", fontSize: 14 }}>Drag & drop an image here</div>
      <div style={{ color: "#475569", fontSize: 11 }}>JPG · PNG · JPEG · WebP · WhatsApp photos</div>
      <label style={{ padding: "10px 20px", background: "#3b82f6", color: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
        Choose Image
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
      </label>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  title,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{ ...primaryBtn, opacity: disabled ? 0.5 : 1 }}
    >
      {label}
    </button>
  );
}

/**
 * Build a browser `ImageData` from a `PixelImage`. The ImageData constructor
 * requires an `ArrayBuffer`-backed buffer, while our pixel buffers are typed
 * as `Uint8ClampedArray<ArrayBufferLike>`; the buffer is always a plain
 * ArrayBuffer at runtime, so this is a safe narrowing cast.
 */
function toImageData(pixel: PixelImage): ImageData {
  return new ImageData(
    pixel.data as Uint8ClampedArray<ArrayBuffer>,
    pixel.width,
    pixel.height,
  );
}

// ── Detection highlight overlay ─────────────────────────────────

const TYPE_COLORS: Record<ComponentType, string> = {
  frame: "#f59e0b",
  arch: "#3b82f6",
  pillar: "#8b5cf6",
  lotus: "#ec4899",
  bell: "#f97316",
  peacock: "#10b981",
  prabhavali: "#06b6d4",
  border: "#eab308",
  stage: "#14b8a6",
  om: "#ef4444",
  background: "#64748b",
};

/**
 * Renders a detection's bounding box, center marker, and type label on top of
 * the preview image. The preview img is displayed at natural aspect ratio, so
 * percentage coordinates map 1:1 to pixel coordinates.
 */
function DetectionOverlay({
  detection,
  imageWidth,
  imageHeight,
}: {
  detection: DetectedComponent;
  imageWidth: number;
  imageHeight: number;
}) {
  const box = detection.boundingBox ?? {
    x: detection.x,
    y: detection.y,
    width: detection.width,
    height: detection.height,
  };
  const center = detection.center ?? {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
  const color = TYPE_COLORS[detection.type] ?? "#3b82f6";

  const left = (box.x / imageWidth) * 100;
  const top = (box.y / imageHeight) * 100;
  const width = (box.width / imageWidth) * 100;
  const height = (box.height / imageHeight) * 100;
  const centerLeft = (center.x / imageWidth) * 100;
  const centerTop = (center.y / imageHeight) * 100;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: `${left}%`,
          top: `${top}%`,
          width: `${width}%`,
          height: `${height}%`,
          border: `2px solid ${color}`,
          borderRadius: 4,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${centerLeft}%`,
          top: `${centerTop}%`,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color,
          border: "1px solid #fff",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${left}%`,
          top: `${top}%`,
          transform: "translateY(-100%)",
          marginTop: -2,
          fontSize: 10,
          lineHeight: 1.4,
          color: "#fff",
          background: color,
          borderRadius: 3,
          padding: "0 5px",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {detection.type} {Math.round(detection.confidence * 100)}%
      </div>
    </>
  );
}

/** A single detected component's registry match with manual replacement. */
function MatchCard({
  match,
  onReplace,
}: {
  match: ComponentMatch;
  onReplace: (label: string) => void;
}) {
  const accent = match.autoAccept ? "#22c55e" : "#f59e0b";
  return (
    <div style={{ background: "#1e293b", borderRadius: 8, padding: 8, fontSize: 12 }}>
      {/* Detected → primary */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 6 }}>
        <span style={{ color: "#94a3b8" }}>
          Detected: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{match.detected.type}</span>
          <span style={{ color: "#475569" }}> · {Math.round(match.detected.confidence * 100)}%</span>
        </span>
        <span
          style={{
            fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
            background: match.autoAccept ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
            color: accent,
          }}
        >
          {match.autoAccept ? "✓ Auto" : "🚧 Draft"}
        </span>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ color: "#64748b", fontSize: 10, marginBottom: 2 }}>Primary match</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>{match.primary.icon}</span>
          <span style={{ color: "#f8fafc", fontWeight: 600 }}>{match.primary.label}</span>
          <span style={{ color: accent, fontWeight: 600, marginLeft: "auto" }}>
            {Math.round(match.confidence * 100)}%
          </span>
        </div>
      </div>

      {match.draft && (
        <div style={{ background: "rgba(245,158,11,0.08)", borderRadius: 6, padding: "6px 8px", marginBottom: 6, fontSize: 11, color: "#fcd34d" }}>
          Draft component created: <b>{match.draft.label}</b> ({match.draft.suggested.width}×{match.draft.suggested.height}px)
          {match.draft.primaryHint ? ` · based on "${match.draft.primaryHint.label}"` : ""}
        </div>
      )}

      {match.alternatives.length > 0 && (
        <div>
          <div style={{ color: "#64748b", fontSize: 10, marginBottom: 4 }}>Replace with:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {match.alternatives.map((alt) => (
              <button
                key={alt.label}
                onClick={() => onReplace(alt.label)}
                style={{
                  padding: "3px 8px", fontSize: 10, borderRadius: 4,
                  border: "1px solid #334155", background: "#0f172a",
                  color: "#94a3b8", cursor: "pointer",
                }}
              >
                {alt.icon} {alt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Compact legend of the detected types. */
function DetectionLegend({ detections }: { detections: DetectedComponent[] }) {
  const types = [...new Set(detections.map((d) => d.type))];
  return (
    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
      {types.map((t) => (
        <span
          key={t}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            color: "#cbd5e1",
            background: "#1e293b",
            borderRadius: 4,
            padding: "2px 6px",
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLORS[t] ?? "#3b82f6" }} />
          {t}
        </span>
      ))}
    </div>
  );
}

function hasTransparency(pixel: PixelImage): boolean {
  const { data } = pixel;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i]! < 250) return true;
  }
  return false;
}

const primaryBtn: React.CSSProperties = {
  padding: "9px 14px", borderRadius: 6, border: "none",
  background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 600,
  cursor: "pointer", width: "100%",
};
const secondaryBtn: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 6, border: "1px solid #334155",
  background: "#1e293b", color: "#e2e8f0", fontSize: 13, cursor: "pointer",
};
const stepBtn: React.CSSProperties = {
  padding: "8px 10px", borderRadius: 6, border: "1px solid #334155",
  background: "#0f172a", color: "#94a3b8", fontSize: 12, cursor: "pointer",
};
const inputStyle: React.CSSProperties = {
  flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 6,
  border: "1px solid #334155", background: "#0f172a", color: "#f8fafc",
  fontSize: 13, outline: "none",
};
