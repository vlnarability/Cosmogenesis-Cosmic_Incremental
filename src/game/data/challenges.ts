import type { StageId } from "../state/types";

// ===========================================================================
// LAYER 1 — CHALLENGES
// ===========================================================================
// Trials the player can undertake for permanent mastery bonuses. Each challenge
// applies a debuff during the run; completing it grants a small permanent
// bonus. Challenges can be repeated for stronger debuffs AND stronger rewards.
// ===========================================================================

export const BASE_MAX_REPEATS = 5;
export const MAX_REPEATS_WITH_MASTERY = 10;

// Debuff scales 20% stronger per repeat level (repeat 0 = base, repeat 1 = 1.2x, ...).
export const DEBUFF_SCALE_PER_REPEAT = 0.20;
// Mastery scales 50% bigger per repeat level (repeat 0 = base, repeat 1 = 1.5x, ...).
export const MASTERY_SCALE_PER_REPEAT = 0.50;

export type ChallengeCompleteWhen =
  | { type: "reachPopulation"; value: number }
  | { type: "reachStage"; stage: StageId }
  | { type: "clearStage"; stage: StageId }
  | { type: "reachGalactic" }
  | { type: "stockpileResource"; resource: string; value: number };

export interface ChallengeEffects {
  productionMult?: number;  // 0.5 = half production
  costMult?: number;        // 1.5 = +50% system/tech costs
  popGrowthMult?: number;   // 0.5 = half pop growth
  capMult?: number;         // 0.7 = -30% capacities
  epMult?: number;          // 1.25 = +25% EP earned
  disableTech?: boolean;
  disableMilitary?: boolean;
  disableEvents?: boolean;
  disablePause?: boolean;
  startPop?: number;        // override starting population
  maxSystems?: number;      // hard cap on total systems owned
}

export interface Challenge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: "production" | "combat" | "growth" | "economy" | "structure";
  debuff: { label: string; effects: ChallengeEffects };
  mastery: { label: string; bonus: ChallengeEffects };
  completeWhen: ChallengeCompleteWhen;
}

export const CHALLENGES: Challenge[] = [
  {
    id: "pacifist_run",
    name: "Pacifist Run",
    desc: "Reach the Galactic stage without building any military systems or researching any war tech.",
    icon: "🕊️",
    category: "combat",
    debuff: {
      label: "No military systems or techs may be built/researched.",
      effects: { disableMilitary: true },
    },
    mastery: {
      label: "+5% population growth, permanently.",
      bonus: { popGrowthMult: 0.05 },
    },
    completeWhen: { type: "reachGalactic" },
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    desc: "Reach the Civilization stage as fast as you can. Population growth is stunted.",
    icon: "⚡",
    category: "growth",
    debuff: {
      label: "Population growth reduced 40%.",
      effects: { popGrowthMult: 0.6 },
    },
    mastery: {
      label: "+5% all production, permanently.",
      bonus: { productionMult: 0.05 },
    },
    completeWhen: { type: "reachStage", stage: "civilization" },
  },
  {
    id: "hermit",
    name: "Hermit",
    desc: "Grow a population of 100 with no random events and reduced starting pop.",
    icon: "🧙",
    category: "growth",
    debuff: {
      label: "No events; start with 3 population.",
      effects: { disableEvents: true, startPop: 3 },
    },
    mastery: {
      label: "+10% EP earned from prestige.",
      bonus: { epMult: 0.10 },
    },
    completeWhen: { type: "reachPopulation", value: 100 },
  },
  {
    id: "hoarder",
    name: "Hoarder",
    desc: "Stockpile 1000 of a single resource while your capacities are halved.",
    icon: "💰",
    category: "economy",
    debuff: {
      label: "All resource capacities -50%.",
      effects: { capMult: 0.5 },
    },
    mastery: {
      label: "+10% all capacities, permanently.",
      bonus: { capMult: 0.10 },
    },
    completeWhen: { type: "stockpileResource", resource: "gold", value: 1000 },
  },
  {
    id: "technophobe",
    name: "Technophobe",
    desc: "Grow a population of 50 with no research whatsoever.",
    icon: "🚫",
    category: "structure",
    debuff: {
      label: "All tech research is forbidden.",
      effects: { disableTech: true },
    },
    mastery: {
      label: "+8% all production, permanently.",
      bonus: { productionMult: 0.08 },
    },
    completeWhen: { type: "reachPopulation", value: 50 },
  },
  {
    id: "minimalist",
    name: "Minimalist",
    desc: "Clear the Tribal stage with no more than 6 systems total.",
    icon: "🪶",
    category: "structure",
    debuff: {
      label: "Hard cap: max 6 systems owned at any time.",
      effects: { maxSystems: 6 },
    },
    mastery: {
      label: "+6% all production, -5% all costs.",
      bonus: { productionMult: 0.06, costMult: -0.05 },
    },
    completeWhen: { type: "clearStage", stage: "tribal" },
  },
  {
    id: "warmonger",
    name: "Warmonger",
    desc: "Clear the Empire stage while happiness steadily drains.",
    icon: "⚔️",
    category: "combat",
    debuff: {
      label: "All production -25%; happiness drains -0.5/s.",
      effects: { productionMult: 0.75 },
    },
    mastery: {
      label: "+10% military production, +5% all production.",
      bonus: { productionMult: 0.05 },
    },
    completeWhen: { type: "clearStage", stage: "empire" },
  },
  {
    id: "time_trial",
    name: "Time Trial",
    desc: "Reach the Galactic stage with population growth cut to a trickle.",
    icon: "⏳",
    category: "growth",
    debuff: {
      label: "Population growth reduced 70%.",
      effects: { popGrowthMult: 0.3 },
    },
    mastery: {
      label: "+10% population growth, permanently.",
      bonus: { popGrowthMult: 0.10 },
    },
    completeWhen: { type: "reachGalactic" },
  },
  {
    id: "catalyst",
    name: "Catalyst",
    desc: "Grow a population of 200 with all production halved.",
    icon: "🔥",
    category: "production",
    debuff: {
      label: "All production -50%.",
      effects: { productionMult: 0.5 },
    },
    mastery: {
      label: "+12% all production, permanently.",
      bonus: { productionMult: 0.12 },
    },
    completeWhen: { type: "reachPopulation", value: 200 },
  },
  {
    id: "endurance",
    name: "Endurance",
    desc: "Clear the Galactic stage while everything costs 80% more.",
    icon: "🏔️",
    category: "economy",
    debuff: {
      label: "All system/tech costs +80%.",
      effects: { costMult: 1.8 },
    },
    mastery: {
      label: "-10% all costs, +5% all production, permanently.",
      bonus: { costMult: -0.10, productionMult: 0.05 },
    },
    completeWhen: { type: "clearStage", stage: "galactic" },
  },
];

export const CHALLENGE_MAP: Record<string, Challenge> = Object.fromEntries(
  CHALLENGES.map((c) => [c.id, c])
);

// --------------------------------------------------------------------------
// Repeat helpers
// --------------------------------------------------------------------------

/**
 * Returns the max number of repeats allowed for any challenge.
 * challenge_mastery upgrade raises the cap from 5 to 10.
 */
export function getMaxRepeats(hasMasteryUpgrade: boolean): number {
  return hasMasteryUpgrade ? MAX_REPEATS_WITH_MASTERY : BASE_MAX_REPEATS;
}

/**
 * Returns the active repeat number the player is on (0 = first attempt, 1 = second, ...).
 * Default to 0 if not started.
 */
export function currentRepeat(
  repeatCounts: Record<string, number>,
  challengeId: string
): number {
  return repeatCounts[challengeId] || 0;
}

/**
 * Returns the scaled debuff effects for a challenge at the given repeat level.
 * Each repeat makes the debuff 20% stronger (linear scaling on each numeric effect).
 */
export function getChallengeDebuffAtRepeat(
  challenge: Challenge,
  repeat: number
): ChallengeEffects {
  const scale = 1 + DEBUFF_SCALE_PER_REPEAT * repeat;
  const base = challenge.debuff.effects;
  return scaleEffects(base, scale, /* additiveFlagsStayBinary */ true);
}

/**
 * Returns the scaled mastery bonus for a challenge at the given repeat level.
 * Each repeat makes the reward 50% bigger.
 */
export function getChallengeMasteryAtRepeat(
  challenge: Challenge,
  repeat: number
): ChallengeEffects {
  const scale = 1 + MASTERY_SCALE_PER_REPEAT * repeat;
  const base = challenge.mastery.bonus;
  return scaleEffects(base, scale, /* additiveFlagsStayBinary */ true);
}

/**
 * Aggregate mastery bonus from all completed challenge repeats.
 * Returns a single ChallengeEffects object representing the total permanent bonus.
 *
 * For each challenge, we sum the mastery bonus of every completed repeat:
 * repeat 0 = base, repeat 1 = base * 1.5, repeat 2 = base * 2.0, ... so
 * sum_{r=0..N-1} base * (1 + 0.5 * r) = base * (N + 0.5 * N*(N-1)/2).
 *
 * As a simple production multiplier (used by techMultiplier in the store):
 * +2% production per completed challenge repeat across all challenges.
 */
export function challengeMasteryBonusFromRepeats(
  completed: Record<string, number>
): { productionMult: number; epMult: number; popGrowthMult: number; costMult: number; capMult: number } {
  let totalRepeats = 0;
  let productionMult = 0;
  let epMult = 0;
  let popGrowthMult = 0;
  let costMult = 0;
  let capMult = 0;

  for (const ch of CHALLENGES) {
    const count = completed[ch.id] || 0;
    if (count <= 0) continue;
    totalRepeats += count;
    // Sum mastery bonus across all completed repeats of this challenge.
    for (let r = 0; r < count; r++) {
      const eff = getChallengeMasteryAtRepeat(ch, r);
      productionMult += eff.productionMult || 0;
      epMult += eff.epMult || 0;
      popGrowthMult += eff.popGrowthMult || 0;
      costMult += eff.costMult || 0;
      capMult += eff.capMult || 0;
    }
  }

  // Add a flat +2% production per total repeat (the "trial grit" bonus).
  productionMult += totalRepeats * 0.02;

  return { productionMult, epMult, popGrowthMult, costMult, capMult };
}

/**
 * The base "trial grit" production multiplier from the raw count of completed repeats.
 * Convenience for techMultiplier integration.
 */
export function challengeMasteryProductionMult(
  completed: Record<string, number>
): number {
  const agg = challengeMasteryBonusFromRepeats(completed);
  return 1 + agg.productionMult;
}

// --------------------------------------------------------------------------
// Internal helpers
// --------------------------------------------------------------------------

function scaleEffects(
  base: ChallengeEffects,
  scale: number,
  additiveFlagsStayBinary: boolean
): ChallengeEffects {
  const out: ChallengeEffects = {};
  if (base.productionMult !== undefined) out.productionMult = base.productionMult * scale;
  if (base.costMult !== undefined) out.costMult = base.costMult * scale;
  if (base.popGrowthMult !== undefined) out.popGrowthMult = base.popGrowthMult * scale;
  if (base.capMult !== undefined) out.capMult = base.capMult * scale;
  if (base.epMult !== undefined) out.epMult = base.epMult * scale;
  // Booleans stay binary (a flag is either on or off; scaling doesn't make sense).
  if (base.disableTech) out.disableTech = true;
  if (base.disableMilitary) out.disableMilitary = true;
  if (base.disableEvents) out.disableEvents = true;
  if (base.disablePause) out.disablePause = true;
  // startPop / maxSystems — keep the base value (these are thresholds, not scalable rates).
  if (base.startPop !== undefined) out.startPop = base.startPop;
  if (base.maxSystems !== undefined) out.maxSystems = base.maxSystems;
  // additiveFlagsStayBinary is just for readability; flags are always binary above.
  void additiveFlagsStayBinary;
  return out;
}
