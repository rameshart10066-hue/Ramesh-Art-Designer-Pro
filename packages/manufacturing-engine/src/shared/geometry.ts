export interface Point {
  x: number;
  y: number;
}

/** A closed or open polyline representing one cuttable path. */
export interface CutPath {
  points: Point[];
  /** Defaults to true — most laser-cut parts are closed outlines. */
  closed?: boolean;
}
