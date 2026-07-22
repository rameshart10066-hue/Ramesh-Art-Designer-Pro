"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { DesignGeneratorRequest } from "@ramesh/api-contracts";
import { useProjectStore } from "@/stores/projectStore";
import { generateDesign } from "@/services/designGeneratorService";
import { NameplateForm } from "./NameplateForm";
import { FingerJointBoxForm } from "./FingerJointBoxForm";
import { NestingForm } from "./NestingForm";
import { SvgPreview } from "./SvgPreview";
import { StudioActionButton, StudioPanel } from "./StudioPanel";
import { CustomizerControls } from "./CustomizerControls";

type GeneratorType = DesignGeneratorRequest["type"];

const GENERATOR_LABELS: Record<GeneratorType, string> = {
  nameplate: "Nameplate",
  "finger-joint-box": "Finger-Joint Box",
  nesting: "Nesting",
};

/**
 * Top-level design generator container. Owns which generator tab is
 * active and the request/response cycle; each generator's field state
 * lives inside its own form component so switching tabs doesn't need to
 * merge unrelated field sets into one big state object.
 */
export function DesignGeneratorStudio() {
  const router = useRouter();
  const project = useProjectStore((state) => state.project);
  const updateProject = useProjectStore((state) => state.updateProject);
  const [activeType, setActiveType] = useState<GeneratorType>("nameplate");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [size, setSize] = useState("5x5");
  const [pillarStyle, setPillarStyle] = useState("Royal");
  const [halo, setHalo] = useState("Round");
  const [border, setBorder] = useState("Lotus");
  const [base, setBase] = useState("Platform A");

  async function handleGenerate(request: DesignGeneratorRequest) {
    updateProject({
      designName: project.designName,
      currentStep: "Design Studio",
      pillarStyle: pillarStyle,
      haloStyle: halo,
      borderStyle: border,
      platformStyle: base,
      colorTheme: "Midnight Indigo",
      estimatedCost: estimate.price,
      estimatedSheets: estimate.sheets,
      estimatedCuttingTime: estimate.cuttingTime,
    });
    setError(null);
    setIsGenerating(true);
    try {
      const result = await generateDesign(request);
      if (result.success) {
        setSvg(result.svg);
      } else {
        setSvg(null);
        setError(result.error);
      }
    } catch {
      setSvg(null);
      setError("Something went wrong generating the design.");
    } finally {
      setIsGenerating(false);
    }
  }

  function switchTab(type: GeneratorType) {
    setActiveType(type);
    setSvg(null);
    setError(null);
  }

  const estimate = useMemo(() => {
    const sizeMultiplier = size === "4x4" ? 0.9 : size === "5x5" ? 1 : size === "6x6" ? 1.2 : 1.1;
    const pillarMultiplier = pillarStyle === "Royal" ? 1.22 : pillarStyle === "Modern" ? 1.08 : pillarStyle === "Temple" ? 1.16 : 1.05;
    const haloMultiplier = halo === "Round" ? 1.02 : halo === "Temple" ? 1.08 : halo === "Sun" ? 1.12 : 1.06;
    const borderMultiplier = border === "Lotus" ? 1.07 : border === "Peacock" ? 1.11 : border === "Royal" ? 1.1 : 1.03;
    const baseMultiplier = base === "Platform A" ? 1.0 : base === "Platform B" ? 1.04 : 1.08;

    const price = Math.round(145000 * sizeMultiplier * pillarMultiplier * haloMultiplier * borderMultiplier * baseMultiplier);
    const sheets = Math.max(4, Math.round(4 * sizeMultiplier));
    const cuttingTime = Math.round(180 * sizeMultiplier * pillarMultiplier * haloMultiplier * borderMultiplier * baseMultiplier);

    return { price, sheets, cuttingTime };
  }, [base, border, halo, pillarStyle, size]);

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#f8fafc", padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0, 1fr) 320px", gap: 18 }}>
        <aside style={{ display: "grid", gap: 18 }}>
          <StudioPanel title="Project Explorer" subtitle="Live design assets">
            <div style={{ display: "grid", gap: 10 }}>
              {[
                ["Main Layout", "active"],
                ["Laser Marks", "ready"],
                ["Nesting Sheet", "ready"],
              ].map(([label, state]) => (
                <div key={label} style={{ padding: "10px 12px", borderRadius: 14, background: "rgba(15, 23, 42, 0.8)", color: state === "active" ? "#f8fafc" : "#94a3b8" }}>
                  <div style={{ fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>{state}</div>
                </div>
              ))}
            </div>
          </StudioPanel>

          <StudioPanel title="Layers" subtitle="Editable layer stack">
            <div style={{ display: "grid", gap: 10 }}>
              {[
                ["Cut Lines", "#4f46e5"],
                ["Engrave", "#3b82f6"],
                ["Text", "#22c55e"],
              ].map(([label, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 14, background: "rgba(15, 23, 42, 0.74)" }}>
                  <span style={{ color: "#f8fafc", fontWeight: 700 }}>{label}</span>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                </div>
              ))}
            </div>
          </StudioPanel>

          <StudioPanel title="Templates" subtitle="Industrial presets">
            <div style={{ display: "grid", gap: 10 }}>
              {[
                ["Nameplate", "Standard"],
                ["Box", "Finger Joint"],
                ["Nesting", "Sheet Layout"],
              ].map(([label, detail]) => (
                <div key={label} style={{ padding: "10px 12px", borderRadius: 14, background: "rgba(15, 23, 42, 0.8)" }}>
                  <div style={{ fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{detail}</div>
                </div>
              ))}
            </div>
          </StudioPanel>
        </aside>

        <main style={{ display: "grid", gap: 18 }}>
          <StudioPanel title="Design Workspace" subtitle="Precision-driven editor">
            <div style={{ borderRadius: 18, border: "1px solid rgba(148, 163, 184, 0.16)", padding: 14, background: "rgba(2, 6, 23, 0.92)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(Object.keys(GENERATOR_LABELS) as GeneratorType[]).map((type) => (
                    <StudioActionButton
                      key={type}
                      label={GENERATOR_LABELS[type]}
                      icon={type === "nameplate" ? "✦" : type === "finger-joint-box" ? "▣" : "⬢"}
                      active={activeType === type}
                      onClick={() => switchTab(type)}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {([
                    ["New Project", "✚"],
                    ["Save", "⤴"],
                    ["Undo", "↺"],
                    ["Redo", "↻"],
                  ] as const).map(([label, icon]) => (
                    <StudioActionButton key={label} label={label} icon={icon} />
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                {[
                  ["Zoom", "−/＋"],
                  ["Fit to Screen", "◱"],
                  ["Grid", "▦"],
                ].map(([label, icon]) => (
                  <button key={label} type="button" style={{ border: "1px solid rgba(148, 163, 184, 0.16)", borderRadius: 999, padding: "8px 10px", background: "rgba(15, 23, 42, 0.8)", color: "#e2e8f0", cursor: "pointer" }}>
                    {icon} {label}
                  </button>
                ))}
              </div>

              <div style={{ borderRadius: 18, background: "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.92))", border: "1px solid rgba(148, 163, 184, 0.16)", minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div style={{ width: "100%", height: "100%", minHeight: 360, borderRadius: 18, border: "1px dashed rgba(148, 163, 184, 0.26)", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at top, rgba(79,70,229,0.16), transparent 70%)" }}>
                  <div style={{ textAlign: "center", color: "#94a3b8" }}>
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f8fafc" }}>Premium design canvas</p>
                    <p style={{ margin: "8px 0 0" }}>Customize the structure and preview manufacturing-ready estimates instantly.</p>
                  </div>
                </div>
              </div>
            </div>
          </StudioPanel>

          <StudioPanel title="Tool Controls" subtitle="Generate and inspect your design">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <StudioActionButton label="Import SVG" icon="⬆" />
              <StudioActionButton label="Export SVG" icon="⇩" />
              <StudioActionButton label="Export DXF" icon="⬇" />
              <StudioActionButton label="Generate Nesting" icon="⧉" />
            </div>

            {activeType === "nameplate" && (
              <NameplateForm onGenerate={handleGenerate} isGenerating={isGenerating} />
            )}
            {activeType === "finger-joint-box" && (
              <FingerJointBoxForm onGenerate={handleGenerate} isGenerating={isGenerating} />
            )}
            {activeType === "nesting" && (
              <NestingForm onGenerate={handleGenerate} isGenerating={isGenerating} />
            )}

            {error ? <p role="alert" style={{ color: "#fda4af", marginTop: 14 }}>{error}</p> : null}
            <div style={{ marginTop: 12 }}>
              <SvgPreview svg={svg} />
            </div>
          </StudioPanel>
        </main>

        <aside style={{ display: "grid", gap: 18 }}>
          <StudioPanel title="Properties" subtitle="Selected element attributes">
            <div style={{ display: "grid", gap: 12 }}>
              {[
                ["Design Name", "Royal Ganpati Arch"],
                ["Design Code", "RA-205"],
                ["Width", "1200 mm"],
                ["Height", "800 mm"],
                ["Thickness", "3 mm"],
                ["Material", "Acrylic"],
                ["Estimated Sheets", `${estimate.sheets}`],
                ["Estimated Cost", `₹${estimate.price.toLocaleString("en-IN")}`],
                ["Estimated Cutting Time", `${estimate.cuttingTime} min`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 14, background: "rgba(15, 23, 42, 0.74)" }}>
                  <span style={{ color: "#94a3b8" }}>{label}</span>
                  <span style={{ color: "#f8fafc", fontWeight: 700, textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>
          </StudioPanel>

          <StudioPanel title="Customization" subtitle="Instantly explore variants">
            <CustomizerControls
              size={size}
              pillarStyle={pillarStyle}
              halo={halo}
              border={border}
              base={base}
              onSizeChange={setSize}
              onPillarChange={setPillarStyle}
              onHaloChange={setHalo}
              onBorderChange={setBorder}
              onBaseChange={setBase}
            />
          </StudioPanel>

          <StudioPanel title="Assembly Information" subtitle="Manufacturing summary">
            <div style={{ display: "grid", gap: 10 }}>
              {[
                ["Number of Parts", "18"],
                ["Material Required", "3.2 kg"],
                ["Estimated Glue Usage", "120 ml"],
                ["Difficulty", "Medium"],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: "10px 12px", borderRadius: 14, background: "rgba(15, 23, 42, 0.8)" }}>
                  <div style={{ fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>
          </StudioPanel>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <StudioActionButton label="Save Design" icon="✓" onClick={() => { updateProject({ currentStep: "Design Studio" }); router.push("/manufacturing"); }} />
            <StudioActionButton label="Generate SVG" icon="⬢" onClick={() => router.push("/svg-generator")} />
            <StudioActionButton label="Generate PNG" icon="🖼" onClick={() => router.push("/manufacturing")} />
            <StudioActionButton label="Generate Assembly Guide" icon="🧩" onClick={() => router.push("/assembly-guide")} />
          </div>
        </aside>
      </div>
    </div>
  );
}
