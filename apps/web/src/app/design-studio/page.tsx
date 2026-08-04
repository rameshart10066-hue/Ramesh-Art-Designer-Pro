import { DesignGeneratorStudio } from "@/modules/design-generator";

export default function DesignStudioPage() {
  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "#020617" }}>
      <DesignGeneratorStudio />
    </main>
  );
}
