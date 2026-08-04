import { NewProjectWizard } from "@/modules/new-project";

export const metadata = {
  title: "New Project — Ramesh Art Designer Pro",
};

export default function NewProjectPage() {
  return (
    <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "#020617", color: "#f8fafc" }}>
      <NewProjectWizard />
    </main>
  );
}
