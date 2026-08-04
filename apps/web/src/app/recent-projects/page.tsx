import { RecentProjectsPage } from "@/modules/recent-projects";

export const metadata = {
  title: "Recent Projects — Ramesh Art Designer Pro",
};

export default function RecentProjectsPageRoute() {
  return (
    <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "#020617", color: "#f8fafc" }}>
      <RecentProjectsPage />
    </main>
  );
}
