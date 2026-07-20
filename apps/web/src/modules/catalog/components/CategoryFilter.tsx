import type { Category } from "@ramesh/api-contracts";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | undefined;
  onChange: (categoryId: string | undefined) => void;
}

/** Presentation-only category dropdown. undefined selection means "all categories". */
export function CategoryFilter({ categories, selectedCategoryId, onChange }: CategoryFilterProps) {
  return (
    <select
      value={selectedCategoryId ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
      aria-label="Filter by category"
    >
      <option value="">All categories</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
