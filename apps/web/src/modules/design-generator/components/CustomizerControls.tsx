import type { ChangeEvent } from "react";

interface CustomizerControlsProps {
  size: string;
  pillarStyle: string;
  halo: string;
  border: string;
  base: string;
  onSizeChange: (value: string) => void;
  onPillarChange: (value: string) => void;
  onHaloChange: (value: string) => void;
  onBorderChange: (value: string) => void;
  onBaseChange: (value: string) => void;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <select
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        style={{ border: "1px solid rgba(148, 163, 184, 0.16)", borderRadius: 12, padding: "10px 12px", background: "rgba(15, 23, 42, 0.82)", color: "#f8fafc" }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CustomizerControls({
  size,
  pillarStyle,
  halo,
  border,
  base,
  onSizeChange,
  onPillarChange,
  onHaloChange,
  onBorderChange,
  onBaseChange,
}: CustomizerControlsProps) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SelectField label="Size" value={size} options={["4x4", "5x5", "6x6", "Custom"]} onChange={onSizeChange} />
      <SelectField label="Pillar Style" value={pillarStyle} options={["Royal", "Modern", "Temple", "Classic"]} onChange={onPillarChange} />
      <SelectField label="Halo" value={halo} options={["Round", "Temple", "Sun", "Lotus"]} onChange={onHaloChange} />
      <SelectField label="Border" value={border} options={["Lotus", "Peacock", "Royal", "Simple"]} onChange={onBorderChange} />
      <SelectField label="Base" value={base} options={["Platform A", "Platform B", "Platform C"]} onChange={onBaseChange} />
    </div>
  );
}
