/**
 * Registration Marks
 *
 * Automatically adds alignment crosses, reference holes, laser engraving labels,
 * and hidden assembly marks to every part.
 */

export interface RegistrationMark {
  id: string;
  partId: number;
  type: "cross" | "hole" | "label" | "hidden-mark";
  x: number;
  y: number;
  size: number;
  text?: string;
}

export interface RegistrationConfig {
  crossSize: number;        // mm
  holeDiameter: number;     // mm
  labelFontSize: number;    // mm
  showCrosses: boolean;
  showHoles: boolean;
  showLabels: boolean;
  showHiddenMarks: boolean;
}

const DEFAULT_CONFIG: RegistrationConfig = {
  crossSize: 5,
  holeDiameter: 3,
  labelFontSize: 4,
  showCrosses: true,
  showHoles: true,
  showLabels: true,
  showHiddenMarks: true,
};

export function generateRegistrationMarks(
  partId: number,
  pn: string,
  width: number,
  height: number,
  name: string,
  config: RegistrationConfig = DEFAULT_CONFIG,
): RegistrationMark[] {
  const marks: RegistrationMark[] = [];
  const margin = 10;

  // Alignment crosses at corners
  if (config.showCrosses) {
    marks.push(
      { id: `cross-${partId}-tl`, partId, type: "cross", x: margin, y: margin, size: config.crossSize },
      { id: `cross-${partId}-tr`, partId, type: "cross", x: width - margin, y: margin, size: config.crossSize },
      { id: `cross-${partId}-bl`, partId, type: "cross", x: margin, y: height - margin, size: config.crossSize },
      { id: `cross-${partId}-br`, partId, type: "cross", x: width - margin, y: height - margin, size: config.crossSize },
    );
  }

  // Reference holes
  if (config.showHoles) {
    marks.push(
      { id: `hole-${partId}-1`, partId, type: "hole", x: Math.round(width / 2), y: Math.round(height / 2), size: config.holeDiameter },
    );
  }

  // Laser engraving labels
  if (config.showLabels) {
    marks.push({
      id: `label-${partId}`,
      partId,
      type: "label",
      x: Math.round(width / 2),
      y: margin + 6,
      size: config.labelFontSize,
      text: `${pn} - ${name}`,
    });
    marks.push({
      id: `mat-${partId}`,
      partId,
      type: "label",
      x: Math.round(width / 2),
      y: height - margin - 2,
      size: config.labelFontSize,
      text: "Ramesh Art Designer Pro",
    });
  }

  // Hidden assembly marks (engraved on back side)
  if (config.showHiddenMarks) {
    marks.push({
      id: `hidden-${partId}`,
      partId,
      type: "hidden-mark",
      x: Math.round(width / 2),
      y: Math.round(height / 2) + 10,
      size: 3,
      text: `Ref: ${pn}`,
    });
  }

  return marks;
}
