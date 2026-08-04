/**
 * Context Builder
 *
 * Automatically collects canvas state, selection, layers,
 * materials, manufacturing settings, and project metadata.
 */

import type { AIContext } from "@/types/ai";
import type { BaseObjectData } from "@/types/objects";

export function buildContext(
  objects: BaseObjectData[],
  selectedIds: number[],
  zoom: number,
  activeTool: string,
  projectName: string,
  designName: string,
  material: string = "Thermocol",
  thickness: number = 12,
  canvasWidth: number = 3000,
  canvasHeight: number = 3000,
): AIContext {
  return {
    canvas: { width: canvasWidth, height: canvasHeight, zoom },
    selection: {
      count: selectedIds.length,
      objects: selectedIds.map((id) => {
        const obj = objects.find((o) => o.id === id);
        return obj
          ? { id: obj.id, type: obj.type, name: obj.name, x: obj.x, y: obj.y, width: obj.width, height: obj.height }
          : { id, type: "unknown", name: "Unknown", x: 0, y: 0, width: 0, height: 0 };
      }),
    },
    document: {
      objectCount: objects.length,
      layerCount: new Set(objects.map((o) => o.zIndex)).size,
      material,
      thickness,
    },
    tool: activeTool,
    project: { name: projectName, designName },
  };
}
