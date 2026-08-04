"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { BaseObjectData } from "@/types/objects";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { useProjectStore } from "@/stores/projectStore";
import { recordRecentProject } from "@/services/projectIo";
import { getMaterial } from "@/product-model/MaterialSystem";
import { TemplateGallery } from "@/components/TemplateGallery";
import { APP_NAME } from "@/version";
import {
  DECORATION_TYPES,
  PROJECT_SIZES,
  WIZARD_MATERIAL_IDS,
  type DecorationTypeId,
  type ProjectSizeId,
  type WizardMaterialId,
  buildWizardProject,
  resolveSizeMm,
} from "../newProjectService";

const C = {
  bg: "#020617",
  surface: "#0f172a",
  surface2: "#1e293b",
  border: "#1e293b",
  borderStrong: "#334155",
  text: "#f8fafc",
  muted: "#94a3b8",
  dim: "#64748b",
  accent: "#3b82f6",
  accentLight: "#60a5fa",
  success: "#22c55e",
};

const STEPS = [
  { index: 1, label: "Decoration" },
  { index: 2, label: "Size" },
  { index: 3, label: "Material" },
  { index: 4, label: "Generate" },
];

type CustomSize = { widthFt: number; heightFt: number };

/**
 * New Project Wizard — Sprint 11.2.
 * Guides the user through decoration type → size → material, then generates
 * the project through the existing parametric engine and opens the Design
 * Studio. "Custom" reuses the existing Template Gallery for template picking.
 */
export function NewProjectWizard() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [typeId, setTypeId] = useState<DecorationTypeId | null>(null);
  const [sizeId, setSizeId] = useState<ProjectSizeId | null>(null);
  const [customSize, setCustomSize] = useState<CustomSize>({ widthFt: 4, heightFt: 4 });
  const [materialId, setMaterialId] = useState<WizardMaterialId | null>(null);
  const [customObjects, setCustomObjects] = useState<BaseObjectData[]>([]);
  const [customDesignName, setCustomDesignName] = useState("Custom Design");
  const [showGallery, setShowGallery] = useState(false);
  const [notice, setNotice] = useState<{ message: string; isError: boolean } | null>(null);

  const showNotice = useCallback((message: string, isError = false) => {
    setNotice({ message, isError });
    window.setTimeout(() => setNotice(null), 3200);
  }, []);

  const isCustomSizeValid =
    Number.isFinite(customSize.widthFt) &&
    customSize.widthFt > 0 &&
    Number.isFinite(customSize.heightFt) &&
    customSize.heightFt > 0;

  const allSelectionsComplete =
    typeId !== null &&
    sizeId !== null &&
    materialId !== null &&
    (sizeId !== "custom" || isCustomSizeValid);

  const canNext =
    (step === 1 && typeId !== null) ||
    (step === 2 && sizeId !== null && (sizeId !== "custom" || isCustomSizeValid)) ||
    (step === 3 && materialId !== null) ||
    (step === 4 && allSelectionsComplete);

  // ── Step 1: decoration type ──────────────────────────────────
  const selectType = (id: DecorationTypeId) => {
    setTypeId(id);
    if (id === "custom") {
      // Reuse the existing template gallery for free-form template picking.
      setShowGallery(true);
    }
  };

  const handleGalleryInstantiate = useCallback((objects: BaseObjectData[], templateName?: string) => {
    setCustomObjects(objects);
    setCustomDesignName(templateName ?? "Custom Design");
  }, []);

  // ── Step 4: generate ─────────────────────────────────────────
  const handleGenerate = useCallback(() => {
    if (!typeId || !sizeId || !materialId) return;
    try {
      const generated = buildWizardProject({
        typeId,
        sizeId,
        materialId,
        customDesignName,
        ...(sizeId === "custom" && { customSize }),
        ...(typeId === "custom" && { customObjects }),
      });

      useEditorStoreV2.getState().loadObjects(generated.objects);

      // Persisted one-shot handoff — survives navigation so the Design Studio
      // can restore the design even if the in-memory editor store is reset.
      useProjectStore.getState().setProject({
        projectName: generated.name,
        designId: generated.designId,
        designName: generated.designName,
        width: `${generated.widthMm} mm`,
        height: `${generated.heightMm} mm`,
        material: generated.materialLabel,
        thickness: `${generated.thicknessMm} mm`,
        designTheme: generated.theme,
        draftObjects: generated.objects,
        draftName: generated.name,
      });

      recordRecentProject({
        name: generated.name,
        objects: generated.objects,
        meta: {
          size: `${generated.widthMm} × ${generated.heightMm} mm`,
          theme: generated.theme,
          material: generated.materialLabel,
        },
      });

      router.push("/design-studio");
    } catch (err) {
      showNotice(err instanceof Error ? err.message : "Could not generate the project.", true);
    }
  }, [typeId, sizeId, materialId, customSize, customObjects, customDesignName, router, showNotice]);

  const next = () => {
    if (step < 4) setStep(step + 1);
    else handleGenerate();
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
    else router.push("/");
  };

  const selectedTypeLabel = typeId ? DECORATION_TYPES.find((t) => t.id === typeId)?.label : null;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.bg, color: C.text }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px 56px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>New Project</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.muted }}>
            Create a professional Ganpati decoration with {APP_NAME}
          </p>
        </div>

        {/* Progress */}
        <StepProgress current={step} />

        {/* Step content */}
        <div
          style={{
            marginTop: 20,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "24px",
            minHeight: 320,
          }}
        >
          {step === 1 && (
            <StepDecoration selected={typeId} onSelect={selectType} />
          )}
          {step === 2 && (
            <StepSize selected={sizeId} customSize={customSize} onSelect={setSizeId} onChangeCustom={setCustomSize} />
          )}
          {step === 3 && (
            <StepMaterial selected={materialId} onSelect={setMaterialId} />
          )}
          {step === 4 && (
            <StepReview
              typeLabel={selectedTypeLabel ?? "—"}
              sizeId={sizeId}
              materialId={materialId}
              {...(sizeId === "custom" ? { customSize } : {})}
            />
          )}
        </div>

        {/* Footer nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
          <button type="button" onClick={back} style={navButton(false)}>
            {step === 1 ? "← Back to Home" : "← Back"}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!canNext}
            style={{
              ...navButton(true),
              background: step === 4 ? C.success : C.accent,
              opacity: canNext ? 1 : 0.4,
              cursor: canNext ? "pointer" : "not-allowed",
            }}
          >
            {step < 4 ? "Continue →" : "Generate & Open Studio"}
          </button>
        </div>
      </div>

      {/* Custom template picker (reuses the Design Studio gallery) */}
      {showGallery && (
        <TemplateGallery
          open={showGallery}
          onClose={() => {
            setShowGallery(false);
            // Don't keep "custom" if the user closed without picking anything.
            if (customObjects.length === 0) setTypeId(null);
          }}
          onInstantiate={(objects, template) => {
            handleGalleryInstantiate(objects, template?.name);
            setShowGallery(false);
            setStep(2);
          }}
        />
      )}

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

// ── Progress indicator ─────────────────────────────────────────────

function StepProgress({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
      {STEPS.map((s, i) => (
        <div key={s.index} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                background: current >= s.index ? C.accent : C.surface2,
                color: current >= s.index ? "#fff" : C.dim,
              }}
            >
              {current > s.index ? "✓" : s.index}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: current === s.index ? C.text : C.dim }}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              style={{
                width: 44,
                height: 2,
                margin: "0 10px",
                background: current > s.index ? C.accent : C.surface2,
                borderRadius: 1,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: decoration type ────────────────────────────────────────

function StepDecoration({
  selected,
  onSelect,
}: {
  selected: DecorationTypeId | null;
  onSelect: (id: DecorationTypeId) => void;
}) {
  return (
    <div>
      <StepTitle
        title="Choose decoration type"
        subtitle="Each type is a fully parametric design generated for your chosen size and material."
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        {DECORATION_TYPES.map((type) => {
          const active = selected === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 16,
                borderRadius: 12,
                border: `1px solid ${active ? C.accent : C.border}`,
                background: active ? "rgba(59,130,246,0.08)" : C.surface2,
                color: C.text,
                cursor: "pointer",
                textAlign: "left",
                transition: "border-color 0.12s ease, transform 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.accent;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = active ? C.accent : C.border;
                e.currentTarget.style.transform = "";
              }}
            >
              <div style={{ fontSize: 26 }}>{type.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{type.label}</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.45 }}>{type.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2: size ───────────────────────────────────────────────────

function StepSize({
  selected,
  customSize,
  onSelect,
  onChangeCustom,
}: {
  selected: ProjectSizeId | null;
  customSize: CustomSize;
  onSelect: (id: ProjectSizeId) => void;
  onChangeCustom: (size: CustomSize) => void;
}) {
  return (
    <div>
      <StepTitle title="Choose size" subtitle="The design is scaled to fit the work area while keeping proportions." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        {PROJECT_SIZES.map((size) => {
          const active = selected === size.id;
          return (
            <button
              key={size.id}
              type="button"
              onClick={() => onSelect(size.id)}
              style={{
                padding: "16px 14px",
                borderRadius: 12,
                border: `1px solid ${active ? C.accent : C.border}`,
                background: active ? "rgba(59,130,246,0.08)" : C.surface2,
                color: C.text,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800 }}>{size.label}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{size.widthMm} × {size.heightMm} mm</div>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onSelect("custom")}
          style={{
            padding: "16px 14px",
            borderRadius: 12,
            border: `1px solid ${selected === "custom" ? C.accent : C.border}`,
            background: selected === "custom" ? "rgba(59,130,246,0.08)" : C.surface2,
            color: C.text,
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800 }}>Custom</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Enter your own</div>
        </button>
      </div>

      {selected === "custom" && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 12,
            background: C.surface2,
            border: `1px solid ${C.border}`,
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
          }}
        >
          <CustomDimension
            label="Width"
            value={customSize.widthFt}
            onChange={(v) => onChangeCustom({ ...customSize, widthFt: v })}
          />
          <CustomDimension
            label="Height"
            value={customSize.heightFt}
            onChange={(v) => onChangeCustom({ ...customSize, heightFt: v })}
          />
          <div style={{ fontSize: 12, color: C.muted, marginLeft: "auto" }}>
            {resolveSizeMm("custom", customSize).widthMm} × {resolveSizeMm("custom", customSize).heightMm} mm
          </div>
        </div>
      )}
    </div>
  );
}

function CustomDimension({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: C.muted }}>
      {label} (ft)
      <input
        type="number"
        min="0.5"
        step="0.5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: 110,
          padding: "8px 10px",
          borderRadius: 8,
          border: `1px solid ${C.borderStrong}`,
          background: C.bg,
          color: C.text,
          fontSize: 14,
          fontFamily: "monospace",
          outline: "none",
        }}
      />
    </label>
  );
}

// ── Step 3: material ───────────────────────────────────────────────

function StepMaterial({
  selected,
  onSelect,
}: {
  selected: WizardMaterialId | null;
  onSelect: (id: WizardMaterialId) => void;
}) {
  return (
    <div>
      <StepTitle title="Choose material" subtitle="Material drives thickness, cost and manufacturing properties." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        {WIZARD_MATERIAL_IDS.map((id) => {
          const material = getMaterial(id);
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 16,
                borderRadius: 12,
                border: `1px solid ${active ? C.accent : C.border}`,
                background: active ? "rgba(59,130,246,0.08)" : C.surface2,
                color: C.text,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: material.color,
                  border: `1px solid ${C.borderStrong}`,
                }}
              />
              <div style={{ fontSize: 14, fontWeight: 700 }}>{material.label}</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                {material.defaultThickness} mm thick
                <br />₹{material.costPerSqM.toLocaleString("en-IN")}/m²
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 4: review + generate ──────────────────────────────────────

function StepReview({
  typeLabel,
  sizeId,
  customSize,
  materialId,
}: {
  typeLabel: string;
  sizeId: ProjectSizeId | null;
  customSize?: CustomSize;
  materialId: WizardMaterialId | null;
}) {
  const size = sizeId ? resolveSizeMm(sizeId, customSize) : null;
  const material = materialId ? getMaterial(materialId) : null;

  return (
    <div>
      <StepTitle
        title="Ready to generate"
        subtitle="Review your selections. The Design Studio will open automatically with the generated project."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginTop: 8,
        }}
      >
        <ReviewTile label="Decoration" value={typeLabel} icon="🏛" />
        <ReviewTile
          label="Size"
          value={size ? `${size.widthMm} × ${size.heightMm} mm` : "—"}
          icon="📐"
        />
        <ReviewTile
          label="Material"
          value={material ? `${material.label} · ${material.defaultThickness} mm` : "—"}
          icon="🧱"
        />
      </div>
    </div>
  );
}

function ReviewTile({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: C.surface2,
        border: `1px solid ${C.border}`,
      }}
    >
      <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8, color: C.text }}>{value}</div>
    </div>
  );
}

// ── Shared bits ────────────────────────────────────────────────────

function StepTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: C.muted }}>{subtitle}</p>
    </div>
  );
}

function navButton(primary: boolean): React.CSSProperties {
  return {
    padding: "10px 18px",
    borderRadius: 10,
    border: primary ? "none" : `1px solid ${C.borderStrong}`,
    background: primary ? C.accent : C.surface2,
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
}
