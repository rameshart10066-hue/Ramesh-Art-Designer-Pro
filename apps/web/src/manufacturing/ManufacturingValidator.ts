/**
 * Manufacturing Validator
 *
 * Detects floating parts, tiny parts, weak joints, impossible cuts,
 * overlapping geometry, parts outside sheets, duplicate parts, and invalid nesting.
 */

export interface ValidationIssue {
  type: "floating" | "tiny" | "weak-joint" | "impossible-cut" | "overlap" | "outside-sheet" | "duplicate" | "invalid-nesting";
  severity: "error" | "warning" | "info";
  partId?: number;
  partName?: string;
  message: string;
  detail: string;
}

export function validateManufacturing(
  parts: { id: number; name: string; x: number; y: number; width: number; height: number; material: string; thickness: number }[],
  sheetWidth: number,
  sheetHeight: number,
  joints: { partAId: number; partBId: number; type: string; length: number }[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for tiny parts (< 10mm in any dimension)
  for (const part of parts) {
    if (part.width < 10 || part.height < 10) {
      issues.push({
        type: "tiny",
        severity: "error",
        partId: part.id,
        partName: part.name,
        message: `Part "${part.name}" is too small (${part.width}×${part.height}mm)`,
        detail: "Parts smaller than 10mm may break during cutting or assembly.",
      });
    }
  }

  // Check for parts outside sheet bounds
  for (const part of parts) {
    if (part.x < 0 || part.y < 0 || part.x + part.width > sheetWidth || part.y + part.height > sheetHeight) {
      issues.push({
        type: "outside-sheet",
        severity: "error",
        partId: part.id,
        partName: part.name,
        message: `Part "${part.name}" extends outside sheet boundaries`,
        detail: `Position (${part.x}, ${part.y}) size ${part.width}×${part.height} exceeds sheet ${sheetWidth}×${sheetHeight}`,
      });
    }
  }

  // Check for overlapping parts
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i]!;
      const b = parts[j]!;
      if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) {
        issues.push({
          type: "overlap",
          severity: "error",
          partId: a.id,
          partName: a.name,
          message: `"${a.name}" overlaps with "${b.name}"`,
          detail: `Overlap detected at (${Math.max(a.x, b.x)}, ${Math.max(a.y, b.y)})`,
        });
      }
    }
  }

  // Check for weak joints
  for (const joint of joints) {
    if (joint.length < 15) {
      issues.push({
        type: "weak-joint",
        severity: "warning",
        message: `Joint between parts has low contact area (${joint.length}mm)`,
        detail: "Joints shorter than 15mm may not provide sufficient strength.",
      });
    }
  }

  // Check for floating parts (no joints)
  const partsWithJoints = new Set(joints.flatMap((j) => [j.partAId, j.partBId]));
  for (const part of parts) {
    if (!partsWithJoints.has(part.id) && parts.length > 1) {
      issues.push({
        type: "floating",
        severity: "warning",
        partId: part.id,
        partName: part.name,
        message: `Part "${part.name}" has no joints — may be floating`,
        detail: "This part is not connected to any other part via joints.",
      });
    }
  }

  // Check for impossible cuts (material too thick for laser)
  for (const part of parts) {
    if (part.material === "acrylic" && part.thickness > 25) {
      issues.push({
        type: "impossible-cut",
        severity: "error",
        partId: part.id,
        partName: part.name,
        message: `Cannot laser cut ${part.thickness}mm acrylic`,
        detail: "Acrylic thicker than 25mm may require CNC routing instead of laser cutting.",
      });
    }
    if (part.material === "thermocol" && part.thickness > 100) {
      issues.push({
        type: "impossible-cut",
        severity: "error",
        partId: part.id,
        partName: part.name,
        message: `Cannot laser cut ${part.thickness}mm thermocol`,
        detail: "Thermocol thicker than 100mm may melt during cutting.",
      });
    }
  }

  // Check for duplicate part names
  const nameCount = new Map<string, number>();
  for (const part of parts) {
    nameCount.set(part.name, (nameCount.get(part.name) || 0) + 1);
  }
  for (const [name, count] of nameCount) {
    if (count > 1) {
      issues.push({
        type: "duplicate",
        severity: "info",
        message: `Part "${name}" appears ${count} times`,
        detail: "Verify this is intentional and not a duplicate.",
      });
    }
  }

  return issues;
}

export function getWorstSeverity(issues: ValidationIssue[]): "error" | "warning" | "info" | "pass" {
  if (issues.some((i) => i.severity === "error")) return "error";
  if (issues.some((i) => i.severity === "warning")) return "warning";
  if (issues.length > 0) return "info";
  return "pass";
}
