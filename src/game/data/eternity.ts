// ===========================================================================
// LAYER 10 — ETERNITY (ASCENSION)
// ===========================================================================
// After defeating the Old Gods, the player god becomes one. Choose which minor
// gods to keep as allies (they become your pantheon), and which to absorb
// (their followers bring peace to the universe). Create new universes — the
// "Reset" ending. The Testament Forge becomes "Universe Creation" — define the
// rules of your new universe across 8 creation slots: Physics, Biology, Magic,
// Time, Space, Consciousness, Death, Rebirth. Choosing any ending completes
// the layer.
// ===========================================================================

// ----- Universe Creation Slots (8) -----
// Each slot defines a rule of the new universe. Filling all 8 unlocks the
// "Reset" ending option.
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
  options: UniverseSlotOption[];
}

export interface UniverseSlotOption {
  id: string;
  label: string;
  desc: string;
  bonus: {
    productionMult?: number;
    capMult?: number;
    epMult?: number;
    popGrowthMult?: number;
    testamentMult?: number;
  };
  // FEATURE 10 — Forbidden Words: extremely powerful options that add +1 Paradox when chosen
  forbidden?: boolean;
}

export const UNIVERSE_SLOTS: UniverseSlot[] = [
  {
    id: "physics",
    name: "Physics",
    icon: "⚛️",
    desc: "The laws of matter and energy.",
    options: [
      { id: "phys_slow", label: "Slow Constants", desc: "+20% cap — heavy atoms, slow light.", bonus: { capMult: 0.20 } },
      { id: "phys_fast", label: "Fast Constants", desc: "+25% production — eager reactions.", bonus: { productionMult: 0.25 } },
      // FEATURE 10 — Forbidden Word
      { id: "phys_paradox", label: "Paradox Constants", desc: "+80% production & +40% cap — reality bends but reality resists. FORBIDDEN: +1 Paradox.", bonus: { productionMult: 0.80, capMult: 0.40 }, forbidden: true },
    ],
  },
  {
    id: "biology",
    name: "Biology",
    icon: "🧬",
    desc: "The rules of life.",
    options: [
      { id: "bio_fertile", label: "Fertile Genesis", desc: "+30% pop growth — life blooms readily.", bonus: { popGrowthMult: 0.30 } },
      { id: "bio_complex", label: "Complex Forms", desc: "+30% EP — fewer but mightier species.", bonus: { epMult: 0.30 } },
    ],
  },
  {
    id: "magic",
    name: "Magic",
    icon: "✨",
    desc: "Whether magic flows in the new world.",
    options: [
      { id: "magic_high", label: "High Magic", desc: "+35% production — magic is everywhere.", bonus: { productionMult: 0.35 } },
      { id: "magic_low", label: "Subtle Magic", desc: "+10% to all four — magic is rare but potent.", bonus: { productionMult: 0.10, capMult: 0.10, epMult: 0.10, popGrowthMult: 0.10 } },
      // FEATURE 10 — Forbidden Word
      { id: "magic_paradox", label: "Paradox Magic", desc: "+100% production & +50% EP — magic overwhelms reality. FORBIDDEN: +1 Paradox.", bonus: { productionMult: 1.00, epMult: 0.50 }, forbidden: true },
    ],
  },
  {
    id: "time",
    name: "Time",
    icon: "⏳",
    desc: "The shape of time.",
    options: [
      { id: "time_loop", label: "Cyclical Time", desc: "+30% Testament gain — echoes return.", bonus: { testamentMult: 0.30 } },
      { id: "time_linear", label: "Linear Time", desc: "+25% production — once-burned, no return.", bonus: { productionMult: 0.25 } },
      // FEATURE 10 — Forbidden Word
      { id: "time_paradox", label: "Paradox Time", desc: "+90% production & +60% EP — past & future collapse into now. FORBIDDEN: +1 Paradox.", bonus: { productionMult: 0.90, epMult: 0.60 }, forbidden: true },
    ],
  },
  {
    id: "space",
    name: "Space",
    icon: "🌌",
    desc: "The size and shape of space.",
    options: [
      { id: "space_vast", label: "Vast Cosmos", desc: "+40% cap — endless room.", bonus: { capMult: 0.40 } },
      { id: "space_dense", label: "Dense Cosmos", desc: "+20% production — worlds close together.", bonus: { productionMult: 0.20 } },
    ],
  },
  {
    id: "consciousness",
    name: "Consciousness",
    icon: "💭",
    desc: "Whether minds awaken in the new cosmos.",
    options: [
      { id: "cons_awake", label: "Awakened Minds", desc: "+30% EP — every soul a star.", bonus: { epMult: 0.30 } },
      { id: "cons_dream", label: "Dreaming Minds", desc: "+15% production — minds wander.", bonus: { productionMult: 0.15 } },
    ],
  },
  {
    id: "death",
    name: "Death",
    icon: "💀",
    desc: "The role of death in the new world.",
    options: [
      { id: "death_release", label: "Release at Death", desc: "+20% EP — the dead return their gifts.", bonus: { epMult: 0.20 } },
      { id: "death_persist", label: "Persistence", desc: "+25% cap — nothing is lost.", bonus: { capMult: 0.25 } },
    ],
  },
  {
    id: "rebirth",
    name: "Rebirth",
    icon: "🔄",
    desc: "Whether souls return.",
    options: [
      { id: "rebirth_yes", label: "Cycle of Rebirth", desc: "+30% Testament gain — past lives echo.", bonus: { testamentMult: 0.30 } },
      { id: "rebirth_no", label: "Single Life", desc: "+30% pop growth — each life is precious.", bonus: { popGrowthMult: 0.30 } },
    ],
  },
];

export const UNIVERSE_SLOT_MAP: Record<UniverseSlotId, UniverseSlot> = Object.fromEntries(
  UNIVERSE_SLOTS.map((s) => [s.id, s])
) as Record<UniverseSlotId, UniverseSlot>;

// ----- Ending Choices (2) -----
// Once chosen, the layer is complete. Preserve = gallery mode (continue
// indefinitely with bonus). Reset = fresh start with stacking Cosmic Boon.
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
    name: "Preserve Universe",
    icon: "🌠",
    desc: "Enter gallery mode — watch your universe flourish indefinitely with all bonuses intact.",
  },
  {
    id: "reset",
    name: "Reset Universe",
    icon: "🔄",
    desc: "Begin a fresh universe from the first cell. Gain a permanent Cosmic Boon (+10% all production) that stacks with each reset. Requires all 8 universe slots filled.",
  },
];

export const ENDING_CHOICE_MAP: Record<EndingChoiceId, EndingChoice> = Object.fromEntries(
  ENDING_CHOICES.map((e) => [e.id, e])
) as Record<EndingChoiceId, EndingChoice>;

// ----- Helpers -----

/**
 * Aggregated bonus from all filled universe slots.
 * Each slot grants its chosen option's bonus (or 0 if unfilled).
 */
export function universeSlotBonus(
  rules: Array<string | null>
): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  testamentMult: number;
  filledCount: number;
} {
  let productionMult = 0;
  let capMult = 0;
  let epMult = 0;
  let popGrowthMult = 0;
  let testamentMult = 0;
  let filledCount = 0;
  for (let i = 0; i < UNIVERSE_SLOTS.length; i++) {
    const slot = UNIVERSE_SLOTS[i];
    const chosenId = rules[i];
    if (!chosenId) continue;
    const opt = slot.options.find((o) => o.id === chosenId);
    if (!opt) continue;
    filledCount += 1;
    productionMult += opt.bonus.productionMult || 0;
    capMult += opt.bonus.capMult || 0;
    epMult += opt.bonus.epMult || 0;
    popGrowthMult += opt.bonus.popGrowthMult || 0;
    testamentMult += opt.bonus.testamentMult || 0;
  }
  return { productionMult, capMult, epMult, popGrowthMult, testamentMult, filledCount };
}

/**
 * Bonus from kept gods (they become your pantheon). Each kept god grants
 * a small permanent bonus.
 */
export function keptGodsBonus(keptGodIds: string[]): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
} {
  const count = keptGodIds.length;
  return {
    productionMult: count * 0.05,
    capMult: count * 0.03,
    epMult: count * 0.04,
    popGrowthMult: count * 0.05,
  };
}

/**
 * Cosmic Boon: +10% all production per "Reset Universe" stack.
 */
export function cosmicBoonBonus(stacks: number): number {
  return stacks * 0.10;
}

/**
 * Layer completion: an Ending has been chosen (preserve or reset).
 * Reset requires all 8 universe slots to be filled.
 */
export function isEternityComplete(
  chosenEnding: string | null | undefined,
  universeRules: Array<string | null>
): boolean {
  if (chosenEnding === "preserve") return true;
  if (chosenEnding === "reset") {
    const { filledCount } = universeSlotBonus(universeRules);
    return filledCount >= UNIVERSE_SLOTS.length;
  }
  return false;
}

// ----- Legacy compatibility shims -----
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
