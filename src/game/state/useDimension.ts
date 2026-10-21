"use client";

import { useGameStore } from "@/game/state/store";
import { getDimension, type DimensionDef } from "@/game/data/dimensions";

// Hook that returns the active dimension + helper functions for name overrides.
// Used by UI components to display dimension-specific names instead of base game names.
export function useActiveDimension() {
  const activeDimension = useGameStore((s) => s.activeDimension || "mundane");
  const dim: DimensionDef = getDimension(activeDimension);

  return {
    dimension: dim,
    // Helper: get a resource's display name (dimension override or default)
    resourceName: (id: string): string => dim.resources[id] || id,
    resourceIcon: (id: string): string => dim.resourceIcons[id] || "",
    // Helper: get a stage's display name
    stageName: (id: string): string => dim.stages[id]?.name || id,
    stageTagline: (id: string): string => dim.stages[id]?.tagline || "",
    // Helper: get a system's display name
    systemName: (id: string, fallback: string): string => dim.systemNames[id] || fallback,
    systemIcon: (id: string, fallback: string): string => dim.systemIcons[id] || fallback,
    // Helper: get a tech's display name
    techName: (id: string, fallback: string): string => dim.techNames[id] || fallback,
    // Helper: get a branch's display name
    branchName: (name: string): string => dim.branchNames[name] || name,
    // Helper: get an archetype's display name
    archetypeName: (id: string, fallback: string): string => dim.archetypeNames[id] || fallback,
    archetypeGlyph: (id: string, fallback: string): string => dim.archetypeGlyphs[id] || fallback,
    // Helper: get a layer's display name + tagline
    layerName: (id: string, fallback: string): string => dim.layerNames[id]?.name || fallback,
    layerTagline: (id: string, fallback: string): string => dim.layerNames[id]?.tagline || fallback,
  };
}
