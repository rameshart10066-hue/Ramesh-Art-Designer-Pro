"use client";

import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import type { BaseObjectData } from "@/types/objects";

export default function PropertiesPanelV2() {
  const objects = useEditorStoreV2((state) => state.objects);
  const selectedIds = useEditorStoreV2((state) => state.selectedIds);
  const updateObject = useEditorStoreV2((state) => state.updateObject);
  const startBatch = useEditorStoreV2((state) => state.startBatch);
  const endBatch = useEditorStoreV2((state) => state.endBatch);

  // Get the first selected item
  const selectedItem = selectedIds.length > 0
    ? objects.find((item) => item.id === selectedIds[0])
    : null;

  if (!selectedItem) {
    return (
      <div
        style={{
          width: 320,
          background: "#111827",
          color: "white",
          borderLeft: "1px solid #374151",
          display: "flex",
          flexDirection: "column",
          padding: 20,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, marginBottom: 10 }}>Properties</h2>
        <p style={{ color: "#9CA3AF", fontSize: 14 }}>
          Select an object to edit its properties
        </p>
      </div>
    );
  }

  function handleChange(property: keyof BaseObjectData, value: any) {
    if (!selectedItem) return;
    startBatch();
    updateObject(selectedItem.id, { [property]: value } as any);
    endBatch("Property change");
  }

  function handleShadowChange(shadowProperty: string, value: any) {
    if (!selectedItem) return;
    startBatch();
    const shadow = selectedItem.shadow || { blur: 0, offsetX: 0, offsetY: 0, color: "#000000" };
    updateObject(selectedItem.id, {
      shadow: { ...shadow, [shadowProperty]: value },
    } as any);
    endBatch("Shadow change");
  }

  const isText = selectedItem.type === "text";
  const isImage = selectedItem.type === "image";

  return (
    <div
      style={{
        width: 320,
        background: "#111827",
        color: "white",
        borderLeft: "1px solid #374151",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div style={{ padding: 20, borderBottom: "1px solid #374151" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Properties</h2>
        <p style={{ color: "#9CA3AF", fontSize: 13, marginTop: 5, marginBottom: 0 }}>
          {selectedItem.name}
        </p>
      </div>

      {/* Properties */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* Position */}
        <Section title="Position">
          <InputRow
            label="X"
            value={selectedItem.x}
            onChange={(v) => handleChange("x", Number(v))}
            type="number"
            suffix="px"
          />
          <InputRow
            label="Y"
            value={selectedItem.y}
            onChange={(v) => handleChange("y", Number(v))}
            type="number"
            suffix="px"
          />
        </Section>

        {/* Size */}
        <Section title="Size">
          <InputRow
            label="W"
            value={selectedItem.width}
            onChange={(v) => handleChange("width", Math.max(10, Number(v)))}
            type="number"
            suffix="px"
          />
          <InputRow
            label="H"
            value={selectedItem.height}
            onChange={(v) => handleChange("height", Math.max(10, Number(v)))}
            type="number"
            suffix="px"
          />
        </Section>

        {/* Transform */}
        <Section title="Transform">
          <InputRow
            label="Rotation"
            value={Math.round(selectedItem.rotation)}
            onChange={(v) => handleChange("rotation", Number(v))}
            type="number"
            suffix="°"
            min={-180}
            max={180}
          />
          <InputRow
            label="Opacity"
            value={Math.round(selectedItem.opacity * 100)}
            onChange={(v) => handleChange("opacity", Number(v) / 100)}
            type="number"
            suffix="%"
            min={0}
            max={100}
          />
        </Section>

        {/* Fill */}
        <Section title="Fill">
          <ColorInput
            label="Color"
            value={selectedItem.fill}
            onChange={(v) => handleChange("fill", v)}
          />
        </Section>

        {/* Stroke */}
        <Section title="Stroke">
          <ColorInput
            label="Color"
            value={selectedItem.stroke}
            onChange={(v) => handleChange("stroke", v)}
          />
          <InputRow
            label="Width"
            value={selectedItem.strokeWidth}
            onChange={(v) => handleChange("strokeWidth", Number(v))}
            type="number"
            suffix="px"
            min={0}
            max={50}
          />
        </Section>

        {/* Corner Radius */}
        <Section title="Corner Radius">
          <InputRow
            label="Radius"
            value={selectedItem.cornerRadius || 0}
            onChange={(v) => handleChange("cornerRadius", Number(v))}
            type="number"
            suffix="px"
            min={0}
            max={100}
          />
        </Section>

        {/* Shadow */}
        <Section title="Shadow">
          <InputRow
            label="Blur"
            value={selectedItem.shadow?.blur || 0}
            onChange={(v) => handleShadowChange("blur", Number(v))}
            type="number"
            suffix="px"
            min={0}
            max={100}
          />
          <InputRow
            label="Offset X"
            value={selectedItem.shadow?.offsetX || 0}
            onChange={(v) => handleShadowChange("offsetX", Number(v))}
            type="number"
            suffix="px"
          />
          <InputRow
            label="Offset Y"
            value={selectedItem.shadow?.offsetY || 0}
            onChange={(v) => handleShadowChange("offsetY", Number(v))}
            type="number"
            suffix="px"
          />
          <ColorInput
            label="Color"
            value={selectedItem.shadow?.color || "#000000"}
            onChange={(v) => handleShadowChange("color", v)}
          />
        </Section>

        {/* Text Properties */}
        {isText && (
          <Section title="Text">
            <InputRow
              label="Size"
              value={selectedItem.fontSize || 16}
              onChange={(v) => handleChange("fontSize", Number(v))}
              type="number"
              suffix="px"
              min={8}
              max={200}
            />
            <SelectInput
              label="Font"
              value={selectedItem.fontFamily || "Arial"}
              onChange={(v) => handleChange("fontFamily", v)}
              options={["Arial", "Helvetica", "Times New Roman", "Courier", "Verdana", "Georgia"]}
            />
            <SelectInput
              label="Weight"
              value={selectedItem.fontWeight || "normal"}
              onChange={(v) => handleChange("fontWeight", v)}
              options={["normal", "bold", "lighter", "bolder"]}
            />
            <SelectInput
              label="Align"
              value={selectedItem.textAlign || "left"}
              onChange={(v) => handleChange("textAlign", v)}
              options={["left", "center", "right", "justify"]}
            />
            <InputRow
              label="Line Height"
              value={selectedItem.lineHeight || 1.2}
              onChange={(v) => handleChange("lineHeight", Number(v))}
              type="number"
              step={0.1}
              min={0.5}
              max={3}
            />
          </Section>
        )}

        {/* Image Filters */}
        {isImage && (
          <Section title="Filters">
            <InputRow
              label="Brightness"
              value={selectedItem.brightness || 100}
              onChange={(v) => handleChange("brightness", Number(v))}
              type="number"
              suffix="%"
              min={0}
              max={200}
            />
            <InputRow
              label="Contrast"
              value={selectedItem.contrast || 100}
              onChange={(v) => handleChange("contrast", Number(v))}
              type="number"
              suffix="%"
              min={0}
              max={200}
            />
            <InputRow
              label="Saturation"
              value={selectedItem.saturation || 100}
              onChange={(v) => handleChange("saturation", Number(v))}
              type="number"
              suffix="%"
              min={0}
              max={200}
            />
            <InputRow
              label="Blur"
              value={selectedItem.blur || 0}
              onChange={(v) => handleChange("blur", Number(v))}
              type="number"
              suffix="px"
              min={0}
              max={20}
            />
          </Section>
        )}
      </div>
    </div>
  );
}

// Section Component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ 
        margin: 0, 
        marginBottom: 12, 
        fontSize: 13, 
        fontWeight: 700,
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}>
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

// Input Row Component
function InputRow({
  label,
  value,
  onChange,
  type = "text",
  suffix,
  min,
  max,
  step,
}: {
  label: string;
  value: number | string;
  onChange: (value: string) => void;
  type?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <label style={{ 
        flex: "0 0 80px", 
        fontSize: 14, 
        color: "#e5e7eb" 
      }}>
        {label}
      </label>
      <div style={{ flex: 1, position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          style={{
            width: "100%",
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: 6,
            padding: "8px 10px",
            paddingRight: suffix ? "35px" : "10px",
            color: "white",
            fontSize: 14,
            outline: "none",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#3b82f6";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#374151";
          }}
        />
        {suffix && (
          <span style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9CA3AF",
            fontSize: 13,
            pointerEvents: "none",
          }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// Color Input Component
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <label style={{ 
        flex: "0 0 80px", 
        fontSize: 14, 
        color: "#e5e7eb" 
      }}>
        {label}
      </label>
      <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 40,
            height: 40,
            border: "2px solid #374151",
            borderRadius: 6,
            cursor: "pointer",
            background: "transparent",
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: 6,
            padding: "8px 10px",
            color: "white",
            fontSize: 14,
            outline: "none",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#3b82f6";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#374151";
          }}
        />
      </div>
    </div>
  );
}

// Select Input Component
function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <label style={{ 
        flex: "0 0 80px", 
        fontSize: 14, 
        color: "#e5e7eb" 
      }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          background: "#1f2937",
          border: "1px solid #374151",
          borderRadius: 6,
          padding: "8px 10px",
          color: "white",
          fontSize: 14,
          outline: "none",
          cursor: "pointer",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#3b82f6";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#374151";
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
