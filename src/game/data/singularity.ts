// ===========================================================================
// LAYER 6 — SINGULARITY
// ===========================================================================
// All paths converge. Singularity is the layer of rift defense on the
// Universal Map (50 galaxies). The OLD Relic Loadout system was REMOVED in
// CLEANUP-LEGACY — the canonical L6 mechanics are now:
//   • closeRift() — spend Singularity Cores to seal Old-God rifts
//   • placeRealityAnchor() — immunize galaxies from rift corruption
//   • attackUniversalGalaxy() — conquer new neutral galaxies (Faith cost)
// Singularity Cores are gained via prestige + the close-rift action.
// Logic Cores are LEGACY no-op stubs (Universal Map redesign removed them).
//
// Rifts/anchors data + helpers live in `universalMap.ts`.
// ===========================================================================

// ----- Logic Cores (LEGACY no-ops — kept for save-shape compat) -----
// These were toggleable automation bonuses. The Universal Map redesign
// removed the active effects but kept the data shape + helper for callers
// that still import them. They always return zero bonus now.
export interface LogicCore {
  id: string;
  name: string;
  icon: string;
  desc: string;
  intervalSec: number;
  productionMult?: number;
}

export const LOGIC_CORES: LogicCore[] = [
  {
    id: "core_eternal",
    name: "Eternal Engine",
    icon: "♾️",
    desc: "LEGACY — Logic Cores removed in Universal Map redesign. (No-op.)",
    intervalSec: 0,
  },
  {
    id: "core_bulwark",
    name: "Bulwark Core",
    icon: "🛡️",
    desc: "LEGACY — Logic Cores removed in Universal Map redesign. (No-op.)",
    intervalSec: 0,
  },
  {
    id: "core_chronicler",
    name: "Chronicler Core",
    icon: "📜",
    desc: "LEGACY — Logic Cores removed in Universal Map redesign. (No-op.)",
    intervalSec: 60,
  },
  {
    id: "core_architect",
    name: "Architect Core",
    icon: "🏗️",
    desc: "LEGACY — Logic Cores removed in Universal Map redesign. (No-op.)",
    intervalSec: 10,
  },
  {
    id: "core_sage",
    name: "Sage Core",
    icon: "🎓",
    desc: "LEGACY — Logic Cores removed in Universal Map redesign. (No-op.)",
    intervalSec: 15,
  },
  {
    id: "core_ascendant",
    name: "Ascendant Core",
    icon: "🔺",
    desc: "LEGACY — Logic Cores removed in Universal Map redesign. (No-op.)",
    intervalSec: 0,
  },
];

export const LOGIC_CORE_MAP: Record<string, LogicCore> = Object.fromEntries(
  LOGIC_CORES.map((c) => [c.id, c])
);

// ----- Helpers -----

/**
 * Aggregated bonus from all active Logic Cores. Always returns zeros — Logic
 * Cores were deprecated in the Universal Map redesign; this function is kept
 * for save-compat callers (store.ts still references it inside the EP bonus
 * calculation).
 */
export function logicCoreBonus(
  _active: Record<string, boolean>
): {
  productionMult: number;
  epMult: number;
  capMult: number;
} {
  return { productionMult: 0, epMult: 0, capMult: 0 };
}
