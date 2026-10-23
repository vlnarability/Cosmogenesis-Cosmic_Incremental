// ===========================================================================
// LAYER 2 — LEGACY FORESIGHT SHIMS
// ===========================================================================
// The old foresight node system was replaced by the 88-constellation map
// (see constellations.ts). This file is kept as a thin shim for callers that
// still import from "foresight" — all functions return zero-bonus or delegate
// to the new constellation system.
// ===========================================================================

import { constellationBonus, type ConstellationState, type ConstellationAggregateBonus } from "./constellations";

// Legacy types (kept for imports)
export type ForesightRouteId = string;
export interface ForesightRoute { id: string; name: string; icon?: string; blurb?: string; bonus: Record<string, number>; }
export type ForesightCategory = "growth" | "knowledge" | "power";
export interface ForesightNodeBonus { productionMult: number; capMult: number; epMult: number; }
export interface ForesightNode { id: string; name: string; }

// Legacy exports (empty — no longer used)
export const FORESIGHT_ROUTES: ForesightRoute[] = [];
export const FORESIGHT_ROUTE_MAP: Record<string, ForesightRoute> = {};
export const FORESIGHT_NODES: ForesightNode[] = [];
export const FORESIGHT_NODE_MAP: Record<string, ForesightNode> = {};
export const FORESIGHT_NODES_REQUIRED_FOR_LAYER_3 = 10;

/**
 * Returns zero bonus for the legacy `foresightNodes` shape (always empty now).
 * If passed the new ConstellationState shape, delegates to constellationBonus().
 */
export function foresightBonus(
  purchased: Record<string, boolean> | ConstellationState
): ConstellationAggregateBonus {
  if (purchased && typeof (purchased as ConstellationState).constellationStars !== "undefined") {
    return constellationBonus(purchased as ConstellationState);
  }
  return {
    productionMult: 0, capMult: 0, epMult: 0, popGrowthMult: 0, costMult: 0, divinityMult: 0,
  };
}

/** Returns zero bonus (routes removed). */
export function routeBonus(_activeRoute: string | null | undefined) {
  return { productionMult: 0, capMult: 0, epMult: 0, popGrowthMult: 0 };
}

/** Returns false (use constellation completion check instead). */
export function canAdvanceToTranscendence(_purchased: Record<string, boolean>): boolean {
  return false;
}

/** Returns 0 (legacy nodes no longer exist). */
export function countForesightNodes(_purchased: Record<string, boolean>): number {
  return 0;
}
