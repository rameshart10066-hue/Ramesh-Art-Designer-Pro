/**
 * Puzzle Joint Generator
 *
 * Automatically generates joints between adjacent parts.
 * Supports 6 joint types selected based on material, thickness, load, and orientation.
 */

export type JointType = "finger" | "puzzle-lock" | "dovetail" | "slot" | "straight" | "snap-lock";

export interface Joint {
  id: string;
  partAId: number;
  partBId: number;
  type: JointType;
  position: { x: number; y: number };
  length: number;
  depth: number;
  count: number;
  orientation: "horizontal" | "vertical";
  material: string;
  thickness: number;
}

export interface JointConfig {
  fingerWidth: number;     // mm
  fingerDepth: number;     // mm
  dovetailAngle: number;   // degrees
  slotWidth: number;       // mm
  snapTolerance: number;   // mm
  minJointLength: number;  // mm
  maxJointSpacing: number; // mm
}

const DEFAULT_CONFIG: JointConfig = {
  fingerWidth: 12,
  fingerDepth: 8,
  dovetailAngle: 15,
  slotWidth: 6,
  snapTolerance: 0.5,
  minJointLength: 20,
  maxJointSpacing: 80,
};

export function selectJointType(
  material: string,
  thickness: number,
  load: "light" | "medium" | "heavy",
): JointType {
  if (material === "acrylic" && thickness >= 3) return "slot";
  if (material === "plywood" || material === "mdf") {
    if (load === "heavy") return "dovetail";
    if (load === "medium") return "finger";
    return "straight";
  }
  if (material === "thermocol" || material === "sunboard" || material === "foamBoard") {
    if (load === "heavy") return "puzzle-lock";
    return "finger";
  }
  if (thickness <= 3) return "snap-lock";
  return "finger";
}

export function generateJoints(
  parts: { id: number; name: string; x: number; y: number; width: number; height: number; material: string; thickness: number }[],
  config: JointConfig = DEFAULT_CONFIG,
): Joint[] {
  const joints: Joint[] = [];
  let jointId = 1;

  // Check each pair of parts for adjacency
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i]!;
      const b = parts[j]!;

      // Check horizontal adjacency
      if (Math.abs(a.x - (b.x + b.width)) < 2 || Math.abs(b.x - (a.x + a.width)) < 2) {
        const overlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
        if (overlap > config.minJointLength) {
          const edgeX = a.x < b.x ? a.x + a.width : b.x + b.width;
          const topY = Math.max(a.y, b.y);
          const load = overlap > 100 ? "heavy" as const : overlap > 50 ? "medium" as const : "light" as const;
          const jt = selectJointType(a.material, a.thickness, load);
          const fingerCount = Math.max(1, Math.floor(overlap / config.maxJointSpacing));

          joints.push({
            id: `joint-${jointId++}`,
            partAId: a.id,
            partBId: b.id,
            type: jt,
            position: { x: edgeX, y: topY + overlap / 2 },
            length: overlap,
            depth: Math.min(config.fingerDepth, a.thickness * 2),
            count: fingerCount,
            orientation: "vertical",
            material: a.material,
            thickness: a.thickness,
          });
        }
      }

      // Check vertical adjacency
      if (Math.abs(a.y - (b.y + b.height)) < 2 || Math.abs(b.y - (a.y + a.height)) < 2) {
        const overlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
        if (overlap > config.minJointLength) {
          const edgeY = a.y < b.y ? a.y + a.height : b.y + b.height;
          const load = overlap > 100 ? "heavy" as const : overlap > 50 ? "medium" as const : "light" as const;
          const jt = selectJointType(a.material, a.thickness, load);
          const fingerCount = Math.max(1, Math.floor(overlap / config.maxJointSpacing));

          joints.push({
            id: `joint-${jointId++}`,
            partAId: a.id,
            partBId: b.id,
            type: jt,
            position: { x: overlap / 2, y: edgeY },
            length: overlap,
            depth: Math.min(config.fingerDepth, a.thickness * 2),
            count: fingerCount,
            orientation: "horizontal",
            material: a.material,
            thickness: a.thickness,
          });
        }
      }
    }
  }

  return joints;
}

export function getJointDescription(type: JointType): string {
  const descriptions: Record<JointType, string> = {
    "finger": "Interlocking finger joint — strong, self-aligning",
    "puzzle-lock": "Puzzle lock joint — permanent, no glue needed",
    "dovetail": "Dovetail joint — maximum strength, decorative",
    "slot": "Slot joint — precise alignment, easy assembly",
    "straight": "Straight butt joint — simple, requires glue",
    "snap-lock": "Snap lock joint — tool-free assembly",
  };
  return descriptions[type];
}
