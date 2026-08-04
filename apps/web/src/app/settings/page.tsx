import { SettingsPanel } from "@/modules/settings";

export const metadata = {
  title: "Settings — Ramesh Art Designer Pro",
};

export default function SettingsPage() {
  return (
    <main style={{ flex: 1, minHeight: 0, background: "#020617", color: "#f8fafc", overflowY: "auto" }}>
      <SettingsPanel />
    </main>
  );
}
