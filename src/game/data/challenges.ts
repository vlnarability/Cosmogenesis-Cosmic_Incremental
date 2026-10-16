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
  // ===========================================================================
  // THE TEN TRIALS — cosmic gauntlets that bend the rules of the run.
  // Each trial constrains a different dimension of play (population, cost,
  // production, military, tech, capacity, structure, luck, etc.) and grants a
  // permanent mastery bonus upon completion. Repeats intensify the debuff
  // (existing helpers handle linear scaling on productionMult / costMult /
  // popGrowthMult / capMult / epMult; trial-specific flags pass through).
  // ===========================================================================
  {
    id: "trial_of_discontent",
    name: "Trial of Discontent",
    desc: "A growing wave of discontent sweeps your civilization. Keep happiness above unhappiness — if it eclipses happiness, the trial ends in failure. Manage with festivals, entertainment, and temples. Higher levels: unhappiness grows faster.",
    icon: "🎭",
    category: "growth",
    debuff: {
      label: "Unhappiness grows steadily; if it exceeds happiness, you lose. Manage with festivals / entertainment / temples. Scales faster per level.",
      effects: { productionMult: 0.85 },
    },
    mastery: {
      label: "+5% all production, permanently.",
      bonus: { productionMult: 0.05 },
    },
    completeWhen: { type: "reachStage", stage: "galactic" },
  },
  {
    id: "trial_of_the_plague",
    name: "Trial of the Plague",
    desc: "Start with 5000 population (1.0× production multiplier) and CANNOT grow it. Plagues periodically slash your numbers — at 2500 pop you produce 0.5×, at 1250 pop only 0.25×. Medical techs and systems block plagues. No population requirement to evolve. Reach Solar to win. Higher levels: plagues strike more frequently.",
    icon: "🦠",
    category: "growth",
    debuff: {
      label: "Start pop locked at 5000 (no growth). Plagues halve output as pop falls. Med-techs block plagues. No pop requirement to evolve.",
      effects: { startPop: 5000, popGrowthMult: 0, productionMult: 0.5 },
    },
    mastery: {
      label: "+10% population growth, permanently.",
      bonus: { popGrowthMult: 0.10 },
    },
    completeWhen: { type: "reachStage", stage: "solar" },
  },
  {
    id: "trial_of_the_rival",
    name: "Trial of the Rival",
    desc: "A rival civilization attacks periodically. Lose a raid and they destroy systems and pillage resources. At L3+, small skirmishes erupt between the big raids. Reach Galactic to triumph. Higher levels: stronger and more frequent raids.",
    icon: "⚔️",
    category: "combat",
    debuff: {
      label: "Rival attacks periodically; losses destroy systems + pillage resources. L3+: small skirmishes between big raids.",
      effects: { productionMult: 0.9 },
    },
    mastery: {
      label: "+5% all production, +5% military production, permanently.",
      bonus: { productionMult: 0.05 },
    },
    completeWhen: { type: "reachStage", stage: "galactic" },
  },
  {
    id: "trial_of_mutation",
    name: "Trial of Mutation",
    desc: "Five rolling mutations cycle — every 60s a new one spawns, the oldest expires after 5 minutes. Each mutation doubles OR halves a random system's output. At L5+, mutations stop resetting and all become permanent. Reach Galactic. Higher levels: faster mutation frequency.",
    icon: "🧬",
    category: "production",
    debuff: {
      label: "Rolling 5 mutations (new every 60s, oldest expires in 5 min). Each doubles or halves a random system. L5+: all permanent.",
      effects: {},
    },
    mastery: {
      label: "+10% EP earned from prestige.",
      bonus: { epMult: 0.10 },
    },
    completeWhen: { type: "reachStage", stage: "galactic" },
  },
  {
    id: "trial_of_gold_rush",
    name: "Trial of the Gold Rush",
    desc: "All production converts to gold at a 10:1 ratio. All costs are paid in gold. The production ratio stays 10:1 at every level, but costs climb higher per level. Reach Galactic.",
    icon: "💰",
    category: "economy",
    debuff: {
      label: "Production → gold at 10:1; all costs paid in gold (effectively 10× harder on the gold standard). Costs scale per level.",
      effects: { costMult: 10 },
    },
    mastery: {
      label: "+10% all capacities, permanently.",
      bonus: { capMult: 0.10 },
    },
    completeWhen: { type: "reachStage", stage: "galactic" },
  },
  {
    id: "trial_of_the_taxman",
    name: "Trial of the Taxman",
    desc: "Every 60 seconds, lose X% of ALL resources. L5 = 50% per minute, L10 = 100% per minute. Linear scaling from L1 to L10. Reach Galactic to escape the collector.",
    icon: "🏛️",
    category: "economy",
    debuff: {
      label: "Every 60s lose X% of all resources (linear L1→L10). L5=50%/min, L10=100%/min. Production is heavily drained.",
      effects: { productionMult: 0.7 },
    },
    mastery: {
      label: "+10% all capacities, permanently.",
      bonus: { capMult: 0.10 },
    },
    completeWhen: { type: "reachStage", stage: "galactic" },
  },
  {
    id: "trial_of_the_minimalist",
    name: "Trial of the Minimalist",
    desc: "You may build only one of each system type. L1 = 10 systems max; each level drops the cap by 1; L10 = 1 system max. Reach Galactic with the absolute minimum. The purest test of focus.",
    icon: "1️⃣",
    category: "structure",
    debuff: {
      label: "Only 1 of each system type. L1: 10 systems max; cap drops by 1 per level; L10: 1 system max.",
      effects: { maxSystems: 10 },
    },
    mastery: {
      label: "-10% all costs, permanently.",
      bonus: { costMult: -0.10 },
    },
    completeWhen: { type: "reachStage", stage: "galactic" },
  },
  {
    id: "trial_of_the_black_market",
    name: "Trial of the Black Market",
    desc: "Systems cost 2× but produce 3×. At L1, techs are free but random. At L2+, techs cost resources — the amount scales per level. Reach Galactic through the underground.",
    icon: "🃏",
    category: "economy",
    debuff: {
      label: "Systems cost 2× but produce 3×. L1: techs free + random. L2+: techs cost resources (scales per level).",
      effects: { costMult: 2 },
    },
    mastery: {
      label: "+5% all production, permanently.",
      bonus: { productionMult: 0.05 },
    },
    completeWhen: { type: "reachStage", stage: "galactic" },
  },
  {
    id: "trial_of_the_gambler",
    name: "Trial of the Gambler",
    desc: "Each system has a 50% chance to produce 2× output, and a 50% chance to produce 0. Techs reduce variance. L1 = 50/50; L5 = 30/70; L10 = 10/90. Reach Galactic on a coin-flip.",
    icon: "🎲",
    category: "production",
    debuff: {
      label: "Each system: 50% chance 2× output, 50% chance 0. Techs reduce variance. L1=50/50, L5=30/70, L10=10/90.",
      effects: {},
    },
    mastery: {
      label: "+10% EP earned from prestige.",
      bonus: { epMult: 0.10 },
    },
    completeWhen: { type: "reachStage", stage: "galactic" },
  },
  {
    id: "trial_of_the_philosopher",
    name: "Trial of the Philosopher",
    desc: "Your main focus is techs and manual actions. L1: systems produce 50%. L5: systems produce 0%. L6: techs cost 20% more. L10: techs cost 100% more than original. Reach Galactic through wisdom alone.",
    icon: "♻️",
    category: "structure",
    debuff: {
      label: "Focus on techs + manual actions. L1: systems produce 50%. L5: 0%. L6+: techs cost +20% per level.",
      effects: { productionMult: 0.5 },
    },
    mastery: {
      label: "+15% EP earned from prestige, permanently.",
      bonus: { epMult: 0.15 },
    },
    completeWhen: { type: "reachStage", stage: "galactic" },
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
