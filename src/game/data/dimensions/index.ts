// ===========================================================================
// DIMENSION INDEX — auto-discovers all dimensions from this folder.
// ===========================================================================
// To add a new dimension: create a new file (e.g. norse.ts), export a
// `dimension: DimensionDef`, and it will automatically appear here.
// The dimension picker in the L10 ending screen reads from this array.
// ===========================================================================

import type { DimensionDef } from "./DimensionDef";
import { mundaneDimension } from "./DimensionDef";
import { fantasyDimension } from "./fantasy";
import { cyberpunkDimension } from "./cyberpunk";

export type { DimensionDef } from "./DimensionDef";

export { mundaneDimension } from "./DimensionDef";
export { fantasyDimension } from "./fantasy";
export { cyberpunkDimension } from "./cyberpunk";

export const DIMENSIONS: DimensionDef[] = [
  mundaneDimension,
  fantasyDimension,
  cyberpunkDimension,
];

export const DIMENSION_MAP: Record<string, DimensionDef> = Object.fromEntries(
  DIMENSIONS.map((d) => [d.id, d])
);

export function getDimension(id: string | null | undefined): DimensionDef {
  if (id && DIMENSION_MAP[id]) return DIMENSION_MAP[id];
  return mundaneDimension; // default
}
