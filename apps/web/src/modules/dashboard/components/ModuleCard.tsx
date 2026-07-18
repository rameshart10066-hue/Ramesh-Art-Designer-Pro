import type { ModuleLink } from "@ramesh/api-contracts";

interface ModuleCardProps {
  module: ModuleLink;
}

const STATUS_LABEL: Record<ModuleLink["status"], string> = {
  available: "Available",
  "in-progress": "In progress",
  planned: "Planned",
};

/** Presentation-only nav card for a single business module. */
export function ModuleCard({ module }: ModuleCardProps) {
  const isClickable = module.status === "available" || module.status === "in-progress";

  const content = (
    <>
      <p>{module.label}</p>
      <p>{module.description}</p>
      <span>{STATUS_LABEL[module.status]}</span>
    </>
  );

  if (!isClickable) {
    return <div data-testid={`module-card-${module.key}`}>{content}</div>;
  }

  return (
    <a href={module.href} data-testid={`module-card-${module.key}`}>
      {content}
    </a>
  );
}
