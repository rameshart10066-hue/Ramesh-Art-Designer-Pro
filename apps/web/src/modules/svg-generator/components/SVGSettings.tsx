export type SVGSettingsState = {
  addPartNumbers: boolean;
  addSlotNumbers: boolean;
  addAlignmentMarks: boolean;
  addSheetNumbers: boolean;
  showCutOrder: boolean;
  kerfCompensation: string;
  cutDirection: string;
  optimize: boolean;
};

type SVGSettingsProps = {
  value: SVGSettingsState;
  onToggle: (key: keyof SVGSettingsState) => void;
  onChange: (key: keyof Pick<SVGSettingsState, "kerfCompensation" | "cutDirection">, value: string) => void;
};

const checkboxRows: Array<{ key: keyof Pick<SVGSettingsState, "addPartNumbers" | "addSlotNumbers" | "addAlignmentMarks" | "addSheetNumbers" | "showCutOrder">; label: string }> = [
  { key: "addPartNumbers", label: "Add Part Numbers" },
  { key: "addSlotNumbers", label: "Add Slot Numbers" },
  { key: "addAlignmentMarks", label: "Add Alignment Marks" },
  { key: "addSheetNumbers", label: "Add Sheet Numbers" },
  { key: "showCutOrder", label: "Show Cut Order" },
];

export function SVGSettings({ value, onToggle, onChange }: SVGSettingsProps) {
  return (
    <section
      style={{
        border: "1px solid rgba(148, 163, 184, 0.16)",
        borderRadius: 22,
        padding: 18,
        background: "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.96))",
        boxShadow: "0 16px 40px rgba(2, 8, 23, 0.24)",
      }}
    >
      <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>Generation Settings</h2>

      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {checkboxRows.map((row) => (
          <label key={row.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderRadius: 14, background: "rgba(15, 23, 42, 0.72)", cursor: "pointer" }}>
            <span style={{ color: "#f8fafc", fontWeight: 600 }}>{row.label}</span>
            <input type="checkbox" checked={Boolean(value[row.key])} onChange={() => onToggle(row.key)} style={{ accentColor: "#38bdf8", width: 16, height: 16 }} />
          </label>
        ))}
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#94a3b8", fontSize: 12 }}>Kerf Compensation</span>
          <select value={value.kerfCompensation} onChange={(event) => onChange("kerfCompensation", event.target.value)} style={{ borderRadius: 12, border: "1px solid rgba(148, 163, 184, 0.2)", background: "#020617", color: "#f8fafc", padding: "10px 12px" }}>
            <option value="0.10">0.10</option>
            <option value="0.15">0.15</option>
            <option value="0.20">0.20</option>
            <option value="0.25">0.25</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#94a3b8", fontSize: 12 }}>Cut Direction</span>
          <select value={value.cutDirection} onChange={(event) => onChange("cutDirection", event.target.value)} style={{ borderRadius: 12, border: "1px solid rgba(148, 163, 184, 0.2)", background: "#020617", color: "#f8fafc", padding: "10px 12px" }}>
            <option value="Clockwise">Clockwise</option>
            <option value="Counter Clockwise">Counter Clockwise</option>
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderRadius: 14, background: "rgba(15, 23, 42, 0.72)" }}>
          <span style={{ color: "#f8fafc", fontWeight: 600 }}>Optimize</span>
          <input type="checkbox" checked={value.optimize} onChange={() => onToggle("optimize")} style={{ accentColor: "#38bdf8", width: 16, height: 16 }} />
        </label>
      </div>
    </section>
  );
}
