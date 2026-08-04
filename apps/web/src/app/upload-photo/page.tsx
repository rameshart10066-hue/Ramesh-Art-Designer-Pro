import { UploadPhotoPage } from "@/modules/photo-upload";

export const metadata = {
  title: "Upload Customer Photo — Ramesh Art Designer Pro",
};

export default function UploadPhotoPageRoute() {
  return (
    <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "#020617", color: "#f8fafc" }}>
      <UploadPhotoPage />
    </main>
  );
}
