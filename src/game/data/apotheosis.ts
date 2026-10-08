// ===========================================================================
// LAYER 5 — APOTHEOSIS
// ===========================================================================
// The ascended god becomes the god of gods. Apotheosis is the layer of divine
// rule: enact Divine Laws (permanent bonuses), choose a Worship Mode (passive
// faith generation), perform Miracles (one-shot powerful effects), and respond
// to Heresy (0-100 — at 100 the run ends). Enacting 3+ divine laws unlocks
// Layer 6 (Singularity).
// ===========================================================================

// ----- Divine Laws (8) -----
// Permanent, passive bonuses once enacted.
export interface DivineLaw {
  id: string;
  name: string;
  desc: string;
  icon: string;
  faithCost: number; // Faith to enact
  bonus: {
    productionMult?: number;
    capMult?: number;
    epMult?: number;
    popGrowthMult?: number;
    heresyRateMult?: number; // < 1 reduces heresy gain, > 1 increases it (some laws are dangerous)
  };
}

export const DIVINE_LAWS: DivineLaw[] = [
  {
    id: "law_bounty",
    name: "Law of Bounty",
    desc: "+25% all production.",
    icon: "🌾",
    faithCost: 200,
    bonus: { productionMult: 0.25 },
  },
  {
    id: "law_vastness",
    name: "Law of Vastness",
    desc: "+30% all capacities.",
    icon: "🌌",
    faithCost: 250,
    bonus: { capMult: 0.30 },
  },
  {
    id: "law_multiplication",
    name: "Law of Multiplication",
    desc: "+30% population growth.",
    icon: "👥",
    faithCost: 200,
    bonus: { popGrowthMult: 0.30 },
  },
  {
    id: "law_remembrance",
    name: "Law of Remembrance",
    desc: "+50% EP per prestige.",
    icon: "📜",
    faithCost: 400,
    bonus: { epMult: 0.50 },
  },
  {
    id: "law_quiet",
    name: "Law of Quiet Days",
    desc: "-25% heresy gain.",
    icon: "🤫",
    faithCost: 300,
    bonus: { heresyRateMult: 0.75 },
  },
  {
    id: "law_fire",
    name: "Law of Cleansing Fire",
    desc: "+40% production, +25% heresy gain. A dangerous bargain.",
    icon: "🔥",
    faithCost: 350,
    bonus: { productionMult: 0.40, heresyRateMult: 1.25 },
  },
  {
    id: "law_eternal",
    name: "Law of the Eternal Throne",
    desc: "+15% production, +15% cap, +15% EP, +15% pop. The balanced summit.",
    icon: "👑",
    faithCost: 800,
    bonus: { productionMult: 0.15, capMult: 0.15, epMult: 0.15, popGrowthMult: 0.15 },
  },
  {
    id: "law_paradox",
    name: "Law of the Final Paradox",
    desc: "+100% production, +100% heresy gain. The god dares everything.",
    icon: "🌀",
    faithCost: 1000,
    bonus: { productionMult: 1.0, heresyRateMult: 2.0 },
  },
];

export const DIVINE_LAW_MAP: Record<string, DivineLaw> = Object.fromEntries(
  DIVINE_LAWS.map((l) => [l.id, l])
);

// ----- Worship Modes (6) -----
// Choose one at a time. Generates Faith/sec and applies a passive effect.
export interface WorshipMode {
  id: string;
  name: string;
  desc: string;
  icon: string;
  faithPerSec: number;
  productionMult: number; // bonus while this mode is active
  heresyPerSec: number; // heresy gain while active (can be 0)
}

export const WORSHIP_MODES: WorshipMode[] = [
  {
    id: "wm_silent",
    name: "Silent Adoration",
    desc: "+0.5 Faith/sec. The god listens; the world is still.",
    icon: "🤫",
    faithPerSec: 0.5,
    productionMult: 0,
    heresyPerSec: 0,
  },
  {
    id: "wm_chanting",
    name: "Chanting Choirs",
    desc: "+1 Faith/sec, +10% production.",
    icon: "🎵",
    faithPerSec: 1,
    productionMult: 0.10,
    heresyPerSec: 0.01,
  },
  {
    id: "wm_proselytizing",
    name: "Proselytizing Tide",
    desc: "+2 Faith/sec, +20% production, +0.05 heresy/sec.",
    icon: "📣",
    faithPerSec: 2,
    productionMult: 0.20,
    heresyPerSec: 0.05,
  },
  {
    id: "wm_crusade",
    name: "Crusade",
    desc: "+3 Faith/sec, +30% production, +0.15 heresy/sec.",
    icon: "⚔️",
    faithPerSec: 3,
    productionMult: 0.30,
    heresyPerSec: 0.15,
  },
  {
    id: "wm_ecstasy",
    name: "Sacred Ecstasy",
    desc: "+5 Faith/sec, +50% production, +0.30 heresy/sec.",
    icon: "💫",
    faithPerSec: 5,
    productionMult: 0.50,
    heresyPerSec: 0.30,
  },
  {
    id: "wm_void",
    name: "Devotion to the Void",
    desc: "+0 Faith/sec, +100% production, +0.50 heresy/sec. The dangerous edge.",
    icon: "🕳️",
    faithPerSec: 0,
    productionMult: 1.0,
    heresyPerSec: 0.50,
  },
];

export const WORSHIP_MODE_MAP: Record<string, WorshipMode> = Object.fromEntries(
  WORSHIP_MODES.map((m) => [m.id, m])
);

// ----- Miracles (5) -----
// One-shot effects costing Faith.
export interface Miracle {
  id: string;
  name: string;
  desc: string;
  icon: string;
  faithCost: number;
  effect: "instantFaith" | "instantPop" | "instantResources" | "reduceHeresy" | "doubleProduction";
  magnitude: number;
}

export const MIRACLES: Miracle[] = [
  {
    id: "mir_blessing",
    name: "Blessing of the Throne",
    desc: "Instantly gain 50 Faith.",
    icon: "✨",
    faithCost: 0,
    effect: "instantFaith",
    magnitude: 50,
  },
  {
    id: "mir_fecundity",
    name: "Miracle of Fecundity",
    desc: "Instantly gain 100 population.",
    icon: "👶",
    faithCost: 150,
    effect: "instantPop",
    magnitude: 100,
  },
  {
    id: "mir_manna",
    name: "Raining Manna",
    desc: "Instantly fill every resource to 50% of its capacity.",
    icon: "🍯",
    faithCost: 300,
    effect: "instantResources",
    magnitude: 0.50,
  },
  {
    id: "mir_absolution",
    name: "Absolution",
    desc: "Reduce heresy by 25.",
    icon: "🕊️",
    faithCost: 500,
    effect: "reduceHeresy",
    magnitude: 25,
  },
  {
    id: "mir_genesis",
    name: "Miracle of Genesis",
    desc: "Doubles production for 300 seconds (one-shot per run).",
    icon: "🌟",
    faithCost: 1000,
    effect: "doubleProduction",
    magnitude: 300,
  },
];

export const MIRACLE_MAP: Record<string, Miracle> = Object.fromEntries(
  MIRACLES.map((m) => [m.id, m])
);

// ----- Heresy Responses (4) -----
// When heresy rises, the god may respond. Each response is a policy that
// affects heresy rate and applies a trade-off bonus.
export interface HeresyResponse {
  id: string;
  name: string;
  desc: string;
  icon: string;
  heresyRateMult: number; // multiplies heresy gain rate
  productionMult: number; // trade-off bonus while this response is active
}

export const HERESY_RESPONSES: HeresyResponse[] = [
  {
    id: "hr_ignore",
    name: "Ignore",
    desc: "Heresy grows at base rate. +0% production.",
    icon: "🤐",
    heresyRateMult: 1.0,
    productionMult: 0,
  },
  {
    id: "hr_tolerance",
    name: "Tolerance",
    desc: "Heresy -20% rate. +5% production.",
    icon: "🤝",
    heresyRateMult: 0.80,
    productionMult: 0.05,
  },
  {
    id: "hr_inquisition",
    name: "Inquisition",
    desc: "Heresy -50% rate. -10% production (a stern hand).",
    icon: "🔥",
    heresyRateMult: 0.50,
    productionMult: -0.10,
  },
  {
    id: "hr_purge",
    name: "The Great Purge",
    desc: "Heresy -90% rate. -25% production. The god will not be questioned.",
    icon: "💀",
    heresyRateMult: 0.10,
    productionMult: -0.25,
  },
];

export const HERESY_RESPONSE_MAP: Record<string, HeresyResponse> = Object.fromEntries(
  HERESY_RESPONSES.map((h) => [h.id, h])
);

// ----- Helpers -----

/**
 * Aggregated bonus from all enacted divine laws.
 */
export function divineLawBonus(
  enacted: Record<string, boolean>
): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  heresyRateMult: number; // multiplicative (e.g. 0.75 = -25%)
} {
  let productionMult = 0;
  let capMult = 0;
  let epMult = 0;
  let popGrowthMult = 0;
  let heresyRateMult = 1;
  for (const law of DIVINE_LAWS) {
    if (!enacted[law.id]) continue;
    productionMult += law.bonus.productionMult || 0;
    capMult += law.bonus.capMult || 0;
    epMult += law.bonus.epMult || 0;
    popGrowthMult += law.bonus.popGrowthMult || 0;
    if (law.bonus.heresyRateMult !== undefined) {
      heresyRateMult *= law.bonus.heresyRateMult;
    }
  }
  return { productionMult, capMult, epMult, popGrowthMult, heresyRateMult };
}

/**
 * Bonus from the currently active Worship Mode.
 */
export function worshipModeBonus(
  activeMode: string | null | undefined
): {
  faithPerSec: number;
  productionMult: number;
  heresyPerSec: number;
} {
  if (!activeMode) return { faithPerSec: 0, productionMult: 0, heresyPerSec: 0 };
  const mode = WORSHIP_MODE_MAP[activeMode];
  if (!mode) return { faithPerSec: 0, productionMult: 0, heresyPerSec: 0 };
  return {
    faithPerSec: mode.faithPerSec,
    productionMult: mode.productionMult,
    heresyPerSec: mode.heresyPerSec,
  };
}

/**
 * Heresy-rate multiplier from the active Heresy Response (1 = base rate).
 */
export function heresyRateMult(
  activeResponse: string | null | undefined
): number {
  if (!activeResponse) return 1;
  const resp = HERESY_RESPONSE_MAP[activeResponse];
  return resp ? resp.heresyRateMult : 1;
}

/**
 * Production bonus from the active Heresy Response.
 */
export function heresyResponseProductionMult(
  activeResponse: string | null | undefined
): number {
  if (!activeResponse) return 0;
  const resp = HERESY_RESPONSE_MAP[activeResponse];
  return resp ? resp.productionMult : 0;
}

/**
 * Returns true when 3 or more divine laws have been enacted (Layer 6 unlock).
 */
export function hasEnactedThreeLaws(enacted: Record<string, boolean>): boolean {
  return DIVINE_LAWS.filter((l) => enacted[l.id]).length >= 3;
}
