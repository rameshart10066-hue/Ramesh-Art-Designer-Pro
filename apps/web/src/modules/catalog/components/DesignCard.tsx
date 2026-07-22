import { useRouter } from "next/navigation";
import type { Product } from "@ramesh/api-contracts";
import { useProjectStore } from "@/stores/projectStore";

interface DesignCardProps {
  product: Product;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const difficultyColors: Record<string, string> = {
  Easy: "rgba(34, 197, 82, 0.16)",
  Medium: "rgba(245, 158, 11, 0.16)",
  Hard: "rgba(239, 68, 68, 0.16)",
};

const difficultyTextColors: Record<string, string> = {
  Easy: "#4ade80",
  Medium: "#fbbf24",
  Hard: "#f87171",
};

export function DesignCard({ product }: DesignCardProps) {
  const router = useRouter();
  const setProject = useProjectStore((state) => state.setProject);
  const difficulty = product.categoryId === "premium" || product.categoryId === "luxury" ? "Hard" : "Medium";

  const handleSelect = () => {
    setProject({
      id: product.id,
      projectName: product.name,
      designId: product.id,
      designName: product.name,
      customerName: "Aarav Decor",
      material: "Thermocol",
      width: "1200 mm",
      height: "800 mm",
      thickness: "12 mm",
      estimatedSheets: product.categoryId === "premium" || product.categoryId === "luxury" ? 4 : 3,
      estimatedCost: product.price,
      estimatedCuttingTime: 180,
      currentStep: "Catalog",
    });
    router.push("/design-studio");
  };

  return (
    <article
      data-testid={`product-card-${product.id}`}
      style={{
        border: "1px solid rgba(148, 163, 184, 0.18)",
        borderRadius: 24,
        padding: 18,
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(15, 23, 42, 0.92))",
        boxShadow: "0 24px 60px rgba(2, 8, 23, 0.28)",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        cursor: "pointer",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-4px)";
        event.currentTarget.style.boxShadow = "0 30px 70px rgba(79, 70, 229, 0.22)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "0 24px 60px rgba(2, 8, 23, 0.28)";
      }}
    >
      <div
        style={{
          borderRadius: 18,
          minHeight: 170,
          marginBottom: 14,
          background: "linear-gradient(135deg, rgba(79, 70, 229, 0.24), rgba(59, 130, 246, 0.16))",
          border: "1px solid rgba(148, 163, 184, 0.16)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#cbd5e1",
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        {product.name}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div>
          <p style={{ margin: 0, color: "#f8fafc", fontSize: 16, fontWeight: 700 }}>{product.name}</p>
          <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 12 }}>{product.description}</p>
        </div>
        <span
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            color: difficultyTextColors[difficulty],
            background: difficultyColors[difficulty],
          }}
        >
          {difficulty}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 14 }}>
        <div style={{ padding: 10, borderRadius: 14, background: "rgba(15, 23, 42, 0.82)" }}>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Material</p>
          <p style={{ margin: "4px 0 0", color: "#f8fafc", fontWeight: 700 }}>Acrylic</p>
        </div>
        <div style={{ padding: 10, borderRadius: 14, background: "rgba(15, 23, 42, 0.82)" }}>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Sheets</p>
          <p style={{ margin: "4px 0 0", color: "#f8fafc", fontWeight: 700 }}>4–6</p>
        </div>
        <div style={{ padding: 10, borderRadius: 14, background: "rgba(15, 23, 42, 0.82)" }}>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Time</p>
          <p style={{ margin: "4px 0 0", color: "#f8fafc", fontWeight: 700 }}>3–5 hrs</p>
        </div>
        <div style={{ padding: 10, borderRadius: 14, background: "rgba(15, 23, 42, 0.82)" }}>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Price</p>
          <p style={{ margin: "4px 0 0", color: "#f8fafc", fontWeight: 700 }}>{currencyFormatter.format(product.price)}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button type="button" onClick={handleSelect} style={{ flex: 1, border: 0, borderRadius: 999, padding: "10px 12px", background: "rgba(79, 70, 229, 0.95)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          Select Design
        </button>
        <button type="button" style={{ flex: 1, border: "1px solid rgba(148, 163, 184, 0.18)", borderRadius: 999, padding: "10px 12px", background: "rgba(15, 23, 42, 0.8)", color: "#f8fafc", fontWeight: 700, cursor: "pointer" }}>
          Customize
        </button>
      </div>
    </article>
  );
}
