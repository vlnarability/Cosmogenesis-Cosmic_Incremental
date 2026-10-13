// ===========================================================================
// LAYER 10 — ETERNITY (GENESIS ENGINE) — legacy compatibility shim
// ===========================================================================
// The original Layer 10 had: 8 universe-creation slots, pantheon kept-gods,
// testament clauses, canonizations, permanence weaves, paradox counter.
//
// In the L10-GENESIS-ENGINE redesign, ALL of that has been replaced by the
// Genesis Engine (crucible + divine relics + 100 archetypes) — see
// `./genesisEngine.ts`. This file remains as a thin compatibility shim so that
// legacy imports (PrestigeTab, upgrades, store, etc.) don't break the build.
// ===========================================================================

// ----- Legacy: Universe Creation Slots (8) — kept as empty array for any
// code that references `UNIVERSE_SLOTS.length`. New L10 uses 10 Universe Rules
// instead (see genesisEngine.ts UNIVERSE_RULES).
export type UniverseSlotId =
  | "physics"
  | "biology"
  | "magic"
  | "time"
  | "space"
  | "consciousness"
  | "death"
  | "rebirth";

export interface UniverseSlot {
  id: UniverseSlotId;
  name: string;
  icon: string;
  desc: string;
  options: any[];
}

// Empty — the new Genesis Engine does not use these slots.
export const UNIVERSE_SLOTS: UniverseSlot[] = [];
export const UNIVERSE_SLOT_MAP: Record<UniverseSlotId, UniverseSlot> = {} as Record<UniverseSlotId, UniverseSlot>;

// ----- Legacy: Ending Choices (kept for the ending-screen flow) -----
// In the new design, the ending screen appears after discovering all 100
// archetypes. The two buttons ("Continue in this realm" / "Explore another
// Dimension") map to these endings.
export type EndingChoiceId = "preserve" | "reset";

export interface EndingChoice {
  id: EndingChoiceId;
  name: string;
  icon: string;
  desc: string;
}

export const ENDING_CHOICES: EndingChoice[] = [
  {
    id: "preserve",
    name: "Continue in this Realm",
    icon: "🌠",
    desc: "Remain in your current cosmos. Continue playing with all bonuses intact and chase further goals.",
  },
  {
    id: "reset",
    name: "Explore another Dimension",
    icon: "🔄",
    desc: "Reset the universe and begin a fresh cycle. Gain a permanent Cosmic Boon (+10% all production) that stacks with each reset.",
  },
];

export const ENDING_CHOICE_MAP: Record<EndingChoiceId, EndingChoice> = Object.fromEntries(
  ENDING_CHOICES.map((e) => [e.id, e])
) as Record<EndingChoiceId, EndingChoice>;

// ----- Legacy compatibility shims (no-op bonuses) -----
// The original Layer 10 had Testament Clauses, Canonizations, Permanence
// Weaves. These are preserved as empty arrays / no-op helpers so that any
// references in older code don't break the build.
export const TESTAMENT_CLAUSES: any[] = [];
export const TESTAMENT_CLAUSE_MAP: Record<string, any> = {};
export const CANONIZATIONS: any[] = [];
export const CANONIZATION_MAP: Record<string, any> = {};
export const PERMANENCE_WEAVES: any[] = [];
export const PERMANENCE_WEAVE_MAP: Record<string, any> = {};

export function testamentClauseBonus(_purchased: Record<string, boolean>): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  testamentMult: number;
} {
  return { productionMult: 0, capMult: 0, epMult: 0, popGrowthMult: 0, testamentMult: 0 };
}

export function canonizationBonus(_active: Record<string, boolean>): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
} {
  return { productionMult: 0, capMult: 0, epMult: 0, popGrowthMult: 0 };
}

export function permanenceWeaveBonus(_active: Record<string, boolean>): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
} {
  return { productionMult: 0, capMult: 0, epMult: 0, popGrowthMult: 0 };
}

// ----- Legacy: Universe Slot bonus / Kept Gods bonus (no-op) -----
// In the new Genesis Engine, universe rules are computed via the crucible,
// not via 8 picked slots. Kept gods have been removed entirely (the new
// ending-screen "Explore another Dimension" replaces the pantheon flow).
export function universeSlotBonus(
  _rules: Array<string | null>
): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  testamentMult: number;
  filledCount: number;
} {
  return {
    productionMult: 0,
    capMult: 0,
    epMult: 0,
    popGrowthMult: 0,
    testamentMult: 0,
    filledCount: 0,
  };
}

export function keptGodsBonus(_keptGodIds: string[]): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
} {
  return { productionMult: 0, capMult: 0, epMult: 0, popGrowthMult: 0 };
}

// ----- Cosmic Boon (still used by ending-screen "Explore another Dimension") -----
/**
 * Cosmic Boon: +10% all production per "Explore another Dimension" reset.
 */
export function cosmicBoonBonus(stacks: number): number {
  return stacks * 0.10;
}

// ----- Eternity completion check (new: based on discovered archetypes) -----
/**
 * Layer 10 is complete when the player has discovered ALL 100 archetypes.
 * This now imports from genesisEngine to check `discoveredArchetypes`.
 */
export function isEternityComplete(
  chosenEnding: string | null | undefined,
  _universeRules?: Array<string | null>,
  discoveredArchetypes?: Record<string, boolean>
): boolean {
  // Preserve ending choice is still respected for legacy callers.
  if (chosenEnding === "preserve") return true;
  // New criterion: all 100 archetypes discovered.
  if (discoveredArchetypes) {
    const count = Object.values(discoveredArchetypes).filter(Boolean).length;
    if (count >= 100) return true;
  }
  return false;
}
