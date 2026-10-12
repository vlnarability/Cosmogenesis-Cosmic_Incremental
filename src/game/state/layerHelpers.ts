"use client";

import { useGameStore } from "./store";

// Priority list of layer IDs from HIGHEST (L10) to LOWEST (L1).
// The first entry in this list that is present in `unlockedLayers` is the
// player's "active layer" — the highest prestige layer they've reached.
export const LAYER_PRIORITY: string[] = [
  "eternity",      // L10
  "infinity",      // L9
  "divinity",      // L8
  "omnipotence",   // L7
  "singularity",   // L6
  "apotheosis",    // L5
  "genesis",       // L4
  "transcendence", // L3
  "enlightenment", // L2
  "evolution",     // L1 (base game; unlocked by default)
];

// Numeric rank per layer (1 = L1 Evolution, 10 = L10 Eternity).
// Used for `>=` style comparisons (e.g. `layerRank("enlightenment") >= 2`).
export const LAYER_RANK: Record<string, number> = Object.fromEntries(
  LAYER_PRIORITY.slice().reverse().map((id, idx) => [id, idx + 1])
); // { evolution: 1, enlightenment: 2, ..., eternity: 10 }

// Human-readable layer names for badges / UI labels.
export const LAYER_NAMES: Record<string, string> = {
  evolution: "Evolution",
  enlightenment: "Enlightenment",
  transcendence: "Transcendence",
  genesis: "Genesis",
  apotheosis: "Apotheosis",
  singularity: "Singularity",
  omnipotence: "Omnipotence",
  divinity: "Divinity",
  infinity: "Infinity",
  eternity: "Eternity",
};

// Returns the highest unlocked layer id from the priority list.
// Falls back to "evolution" (L1) if nothing else is unlocked — the player is
// always at least on L1 once the game starts (unlockedLayers.evolution = true).
export function highestUnlockedLayerId(
  unlockedLayers: Record<string, boolean> | undefined | null
): string {
  if (!unlockedLayers) return "evolution";
  for (const id of LAYER_PRIORITY) {
    if (unlockedLayers[id]) return id;
  }
  return "evolution";
}

// Returns the numeric rank (1-10) of a given layer id. 0 if unknown.
export function layerRank(layerId: string | undefined | null): number {
  if (!layerId) return 0;
  return LAYER_RANK[layerId] ?? 0;
}

// Returns true if the player's active layer is at least `targetLayerId` (inclusive).
// Example: `isLayerAtLeast("enlightenment", unlockedLayers)` — has the player reached L2+?
export function isLayerAtLeast(
  targetLayerId: string,
  unlockedLayers: Record<string, boolean> | undefined | null
): boolean {
  const activeId = highestUnlockedLayerId(unlockedLayers);
  return layerRank(activeId) >= layerRank(targetLayerId);
}

// Returns the layer id one rank BELOW the given layer (its predecessor).
// E.g. `previousLayerId("enlightenment")` → "evolution". Null for L1.
export function previousLayerId(layerId: string): string | null {
  const rank = layerRank(layerId);
  if (rank <= 1) return null;
  // LAYER_PRIORITY is sorted high → low, so reverse to get low → high.
  const ascending = LAYER_PRIORITY.slice().reverse();
  return ascending[rank - 2] || null;
}

// Returns the layer id one rank ABOVE the given layer (its successor).
// E.g. `nextLayerId("enlightenment")` → "transcendence". Null for L10.
export function nextLayerId(layerId: string): string | null {
  const rank = layerRank(layerId);
  if (rank <= 0 || rank >= 10) return null;
  const ascending = LAYER_PRIORITY.slice().reverse();
  return ascending[rank] || null;
}

// Returns a human-readable name for a layer id (e.g. "enlightenment" → "Enlightenment").
export function layerName(layerId: string | undefined | null): string {
  if (!layerId) return "Unknown";
  return LAYER_NAMES[layerId] || layerId;
}

// Convenience hook: subscribe to the player's active layer from the store.
// Returns { activeLayerId, activeLayerRank, isAtLeast, activeLayerName }.
export function useActiveLayer(): {
  activeLayerId: string;
  activeLayerRank: number;
  activeLayerName: string;
  isAtLeast: (targetLayerId: string) => boolean;
} {
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const activeLayerId = highestUnlockedLayerId(unlockedLayers);
  const activeLayerRank = layerRank(activeLayerId);
  const activeLayerName = layerName(activeLayerId);
  return {
    activeLayerId,
    activeLayerRank,
    activeLayerName,
    isAtLeast: (targetLayerId: string) => activeLayerRank >= layerRank(targetLayerId),
  };
}

// Hook for layer modals: returns true if the player's active layer is HIGHER than
// the given layer id. Used to show a "🔄 Running in background" badge in lower-layer
// modals when the player has progressed beyond them (mechanics still tick in the
// background per the existing game loop — this just communicates it visually).
export function useIsBackgroundLayer(layerId: string): boolean {
  const { activeLayerRank } = useActiveLayer();
  const modalRank = layerRank(layerId);
  return activeLayerRank > modalRank;
}
