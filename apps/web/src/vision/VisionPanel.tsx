"use client";

/**
 * Vision Panel — Photo to Editable CAD
 *
 * Upload → Detect → Review → Generate CAD → Generate Manufacturing
 */

import { useState, useCallback } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { analyzeImage, loadImageData, estimateScalePxToMm } from "./ImageAnalyzer";
import { analyzePerspective, normalizeLighting } from "./PerspectiveCorrector";
import { segmentImage } from "./SegmentationEngine";
import { detectComponents } from "./ComponentDetector";
import { extractFeatures } from "./FeatureExtractor";
import { matchToLibrary } from "./SimilarityMatcher";
import { matchAgainstLibrary, replaceComponent } from "./LibraryMatcher";
import { extractDNA } from "./DNAExtractor";
import { rebuildDesign } from "./PhotoRebuilder";
import { generateConfidenceReport, confidenceColor } from "./ConfidenceEngine";
import { estimateDimensions } from "./DimensionEstimator";
import { planManufacturing } from "@/ai-designer/ManufacturingPlanner";
import { visionHistory } from "./VisionHistory";
import type { DetectedComponent } from "./ComponentDetector";
import type { LibraryMatch } from "./LibraryMatcher";

type VisionStep = "upload" | "detect" | "review" | "cad" | "manufacturing";

export function VisionPanel() {
  const [step, setStep] = useState<VisionStep>("upload");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [detected, setDetected] = useState<DetectedComponent[]>([]);
  const [matches, setMatches] = useState<LibraryMatch[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState("Upload a Ganpati decoration photo to begin");
  const [analysis, setAnalysis] = useState<any>(null);
  const [dimensions, setDimensions] = useState<any>(null);
  const [confReport, setConfReport] = useState<any>(null);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const addObject = useEditorStoreV2((s) => s.addObject);

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { setStatus("Please upload an image file"); return; }
    setStatus("Analyzing image...");
    setStep("detect");

    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // Run analysis on next tick
    setTimeout(async () => {
      try {
        const imageData = await loadImageData(file);
        setImageWidth(imageData.width);
        setImageHeight(imageData.height);

        const analysis_ = analyzeImage(imageData);
        setAnalysis(analysis_);

        const correction = analyzePerspective(imageData);
        setStatus(`Analyzed: ${imageData.width}×${imageData.height}, ${analysis_.dominantColors.length} colors, symmetry ${analysis_.symmetryScore}`);

        // Segment
        const segments = segmentImage(imageData);
        setStatus(`Detected ${segments.length} regions...`);

        // Detect components
        const detected_ = detectComponents(segments, analysis_);
        setDetected(detected_);
        setStatus(`Detected ${detected_.length} components`);

        // Match against library
        const matches_ = matchAgainstLibrary(detected_, imageData.width, imageData.height);
        setMatches(matches_);

        // Dimensions
        const pxScale = estimateScalePxToMm(imageData.width, imageData.height, analysis_);
        const dims = estimateDimensions(imageData.width, imageData.height, pxScale, analysis_.edgeDensity);
        setDimensions(dims);

        // Confidence report
        const conf = generateConfidenceReport(detected_, matches_);
        setConfReport(conf);

        // Check warnings
        const allWarnings = [...conf.warnings];
        if (correction.corrected) allWarnings.push(`Perspective corrected: ${correction.rotationAngle}°`);
        setWarnings(allWarnings);

        visionHistory.add({
          imageName: file.name, detectedCount: detected_.length, matchedCount: matches_.length,
          overallConfidence: conf.overall, dna: {}, componentTypes: detected_.map((d) => d.type), successful: true,
        });

        setStep("review");
        setStatus(`Detection complete: ${detected_.length} components found`);
      } catch (err: any) {
        setStatus(`Error: ${err.message}`);
        setStep("upload");
      }
    }, 100);
  }, []);

  const handleReplace = useCallback((index: number, newType: string) => {
    setMatches((prev) => {
      const updated = [...prev];
      updated[index] = replaceComponent(updated[index]!, newType);
      return updated;
    });
  }, []);

  const handleGenerateCAD = useCallback(() => {
    if (!analysis || !dimensions) return;
    setStep("cad");
    setStatus("Generating parametric CAD...");

    const dna = extractDNA(detected, analysis, dimensions);
    const rebuild = rebuildDesign(dna, matches, imageWidth, imageHeight);

    // Add objects to canvas
    for (const comp of rebuild.components) {
      addObject({
        type: comp.type as any,
        name: comp.name,
        x: comp.x, y: comp.y,
        width: comp.width, height: comp.height,
        fill: comp.params.fill || "#3b82f6",
        stroke: comp.params.stroke || "#1e40af",
        strokeWidth: 2,
        metadata: comp.params,
      } as any);
    }

    setWarnings(rebuild.warnings);
    setStatus(`Generated ${rebuild.components.length} parametric components from photo`);
  }, [analysis, dimensions, detected, matches, imageWidth, imageHeight, addObject]);

  const handleManufacturing = useCallback(() => {
    setStep("manufacturing");
    setStatus("Generating manufacturing data...");
    // Manufacturing is handled by the existing ManufacturingPanel
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontSize: 13, overflow: "hidden" }}>
      {/* Status */}
      <div style={{ padding: "8px 12px", fontSize: 12, borderBottom: "1px solid #1e293b", background: status.includes("Error") ? "rgba(239,68,68,0.1)" : "transparent", color: status.includes("Error") ? "#fca5a5" : "#94a3b8" }}>
        {status}
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 0, padding: "6px 12px", borderBottom: "1px solid #1e293b", fontSize: 10 }}>
        {["upload", "detect", "review", "cad", "mfg"].map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: "center", padding: "2px", color: step === s ? "#60a5fa" : "#475569", fontWeight: step === s ? 600 : 400 }}>
            {i + 1}. {s === "mfg" ? "mfg" : s}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {/* Upload */}
        {step === "upload" && (
          <div style={{ border: "2px dashed #334155", borderRadius: 12, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <p style={{ color: "#94a3b8", marginBottom: 16, fontSize: 14 }}>Upload a photo of a Ganpati decoration</p>
            <label style={{ padding: "10px 20px", background: "#3b82f6", color: "white", borderRadius: 6, cursor: "pointer", display: "inline-block", fontSize: 13, fontWeight: 600 }}>
              Choose Photo
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} style={{ display: "none" }} />
            </label>
            <p style={{ color: "#475569", fontSize: 11, marginTop: 12 }}>Supports JPG, PNG, JPEG, WhatsApp images</p>
          </div>
        )}

        {/* Image preview + detected components */}
        {imageUrl && (step === "detect" || step === "review") && (
          <div style={{ marginBottom: 12 }}>
            <img src={imageUrl} alt="Uploaded" style={{ width: "100%", borderRadius: 8, maxHeight: 200, objectFit: "cover" }} />
          </div>
        )}

        {/* Detection results */}
        {detected.length > 0 && step === "review" && (
          <div>
            {/* Confidence overview */}
            {confReport && (
              <div style={{ marginBottom: 12, padding: "10px 12px", background: "#1e293b", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Detection Confidence</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {confReport.components.map((c: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, background: "#0f172a", padding: "4px 8px", borderRadius: 4 }}>
                      <span style={{ color: "#e2e8f0" }}>{c.type}</span>
                      <span style={{ color: confidenceColor(c.confidence), fontWeight: 600 }}>{Math.round(c.confidence * 100)}%</span>
                      {c.needsReview && <span style={{ color: "#fbbf24", fontSize: 10 }}>⚠</span>}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
                  Overall: <span style={{ fontWeight: 600, color: confidenceColor(confReport.overall) }}>{Math.round(confReport.overall * 100)}%</span>
                </div>
              </div>
            )}

            {/* Component list with replace options */}
            <h4 style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 8px" }}>Detected Components ({matches.length})</h4>
            {matches.map((match, i) => (
              <div key={i} style={{ padding: "8px 10px", background: "#1e293b", borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#e2e8f0" }}>{match.matchedType}</span>
                  <span style={{ color: confidenceColor(match.confidence), fontWeight: 600 }}>
                    {Math.round(match.confidence * 100)}%
                    {match.autoAccept ? " ✓" : " ⚠"}
                  </span>
                </div>
                {match.alternatives.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                    {[match.matchedType, ...match.alternatives.slice(0, 3).map((a) => a.type)].map((type) => (
                      <button key={type} onClick={() => handleReplace(i, type)}
                        style={{ padding: "2px 6px", fontSize: 10, borderRadius: 4, border: "1px solid #334155", background: "#0f172a", color: "#94a3b8", cursor: "pointer" }}>
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {warnings.map((w, i) => (
                  <div key={i} style={{ padding: "6px 10px", background: "rgba(251,191,36,0.1)", borderRadius: 4, marginBottom: 4, fontSize: 11, color: "#fcd34d" }}>⚠ {w}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CAD Generated */}
        {step === "cad" && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ color: "#22c55e", fontSize: 14, fontWeight: 600 }}>Parametric CAD Generated</p>
            <p style={{ color: "#94a3b8", fontSize: 12 }}>The design has been added to your canvas as editable parametric components.</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ padding: "8px 12px", borderTop: "1px solid #1e293b", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {step === "review" && (
          <>
            <button onClick={handleGenerateCAD} style={btnPrimary}>Generate CAD</button>
            <button onClick={handleManufacturing} style={btnSecondary}>Manufacturing</button>
          </>
        )}
        {step === "upload" && (
          <p style={{ fontSize: 11, color: "#475569" }}>Upload an image to begin</p>
        )}
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { flex: 1, padding: "10px 16px", borderRadius: 6, border: "none", background: "#3b82f6", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnSecondary: React.CSSProperties = { flex: 1, padding: "10px 16px", borderRadius: 6, border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontSize: 13, cursor: "pointer" };
