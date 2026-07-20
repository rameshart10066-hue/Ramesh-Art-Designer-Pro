import type { Product } from "@ramesh/api-contracts";

interface ProductCardProps {
  product: Product;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article data-testid={`product-card-${product.id}`}>
      <p>{product.name}</p>
      <p>{product.description}</p>
      <p>{currencyFormatter.format(product.price)}</p>
    </article>
  );
}
