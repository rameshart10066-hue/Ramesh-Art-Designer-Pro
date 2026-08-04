/**
 * Glue Tab Generator
 *
 * Automatically generates glue tabs, alignment tabs, hidden tabs, and registration tabs
 * along part edges. User-configurable size and spacing.
 */

export interface GlueTab {
  id: string;
  partId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "glue" | "alignment" | "hidden" | "registration";
  edge: "top" | "bottom" | "left" | "right";
  position: number; // 0-1 along edge
}

export interface GlueTabConfig {
  tabWidth: number;     // mm
  tabHeight: number;    // mm
  tabSpacing: number;   // mm
  alignmentTabs: boolean;
  hiddenTabs: boolean;
  registrationTabs: boolean;
}

const DEFAULT_CONFIG: GlueTabConfig = {
  tabWidth: 15,
  tabHeight: 8,
  tabSpacing: 60,
  alignmentTabs: true,
  hiddenTabs: false,
  registrationTabs: true,
};

export function generateGlueTabs(
  partId: number,
  width: number,
  height: number,
  config: GlueTabConfig = DEFAULT_CONFIG,
): GlueTab[] {
  const tabs: GlueTab[] = [];
  let tabId = 1;

  // Top edge
  for (let x = config.tabSpacing; x < width - config.tabSpacing; x += config.tabSpacing) {
    tabs.push({ id: `glue-${partId}-${tabId++}`, partId, x, y: -config.tabHeight, width: config.tabWidth, height: config.tabHeight, type: "glue", edge: "top", position: x / width });
  }

  // Bottom edge
  for (let x = config.tabSpacing; x < width - config.tabSpacing; x += config.tabSpacing) {
    tabs.push({ id: `glue-${partId}-${tabId++}`, partId, x, y: height, width: config.tabWidth, height: config.tabHeight, type: "glue", edge: "bottom", position: x / width });
  }

  // Left edge
  for (let y = config.tabSpacing; y < height - config.tabSpacing; y += config.tabSpacing) {
    tabs.push({ id: `glue-${partId}-${tabId++}`, partId, x: -config.tabHeight, y, width: config.tabHeight, height: config.tabWidth, type: "glue", edge: "left", position: y / height });
  }

  // Right edge
  for (let y = config.tabSpacing; y < height - config.tabSpacing; y += config.tabSpacing) {
    tabs.push({ id: `glue-${partId}-${tabId++}`, partId, x: width, y, width: config.tabHeight, height: config.tabWidth, type: "glue", edge: "right", position: y / height });
  }

  // Alignment tabs (every 3rd tab, shorter)
  if (config.alignmentTabs) {
    const alignmentTabs = tabs.filter((_, i) => i % 3 === 0).map((t, i) => ({
      ...t,
      id: `align-${partId}-${i}`,
      type: "alignment" as const,
      height: t.height * 1.5,
    }));
    tabs.push(...alignmentTabs);
  }

  // Registration tabs (at corners)
  if (config.registrationTabs) {
    tabs.push(
      { id: `reg-${partId}-tl`, partId, x: -3, y: -3, width: 6, height: 6, type: "registration", edge: "top", position: 0 },
      { id: `reg-${partId}-tr`, partId, x: width - 3, y: -3, width: 6, height: 6, type: "registration", edge: "top", position: 1 },
    );
  }

  return tabs;
}
