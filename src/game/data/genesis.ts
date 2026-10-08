// ===========================================================================
// LAYER 4 — GENESIS
// ===========================================================================
// The ascended god learns to author new universes. Genesis is the layer of
// world-crafting: pick a Cradle World, a Prime Condition, a Sacred Geography,
// a Dormant Seed, and a Difficulty Tier — and author a WorldConfig that
// grants permanent multipliers (production, capacity, EP) to all future runs.
// Authoring at least one world config unlocks Layer 5 (Apotheosis).
// ===========================================================================

// ----- Cradle Worlds (8) -----
// The base kind of cosmos being authored.
export interface CradleWorld {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  productionMult: number; // base bonus granted
}

export const CRADLE_WORLDS: CradleWorld[] = [
  { id: "cw_terranean", name: "Terranean", icon: "🌍", blurb: "A balanced cradle of earth and sea.", productionMult: 0.20 },
  { id: "cw_oceanic", name: "Oceanic", icon: "🌊", blurb: "A world drowned in possibility.", productionMult: 0.25 },
  { id: "cw_volcanic", name: "Volcanic", icon: "🌋", blurb: "Forged in fire, strong in bone.", productionMult: 0.30 },
  { id: "cw_aerial", name: "Aerial", icon: "☁️", blurb: "A world that floats above its own past.", productionMult: 0.18 },
  { id: "cw_crystal", name: "Crystal", icon: "💎", blurb: "A lattice world — slow, precise, vast.", productionMult: 0.22 },
  { id: "cw_fungal", name: "Fungal", icon: "🍄", blurb: "A world that grows by decay.", productionMult: 0.28 },
  { id: "cw_ashen", name: "Ashen", icon: "🌫️", blurb: "A world that remembers being burned.", productionMult: 0.35 },
  { id: "cw_luminous", name: "Luminous", icon: "🌟", blurb: "A world that shines before life arrives.", productionMult: 0.24 },
];

// ----- Prime Conditions (6) -----
// The first law of the new universe.
export interface PrimeCondition {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  capMult: number;
}

export const PRIME_CONDITIONS: PrimeCondition[] = [
  { id: "pc_abundance", name: "Abundance", icon: "🌾", blurb: "Capacity is the first law.", capMult: 0.30 },
  { id: "pc_scarcity", name: "Scarcity", icon: "🌵", blurb: "Less to hold, more to want.", capMult: -0.15 },
  { id: "pc_equilibrium", name: "Equilibrium", icon: "⚖️", blurb: "All vessels fill at the same pace.", capMult: 0.20 },
  { id: "pc_renewal", name: "Renewal", icon: "♻️", blurb: "What pours out returns.", capMult: 0.15 },
  { id: "pc_overflow", name: "Overflow", icon: "🌊", blurb: "The vessel cannot be emptied.", capMult: 0.40 },
  { id: "pc_threshold", name: "Threshold", icon: "🚪", blurb: "Capacity bends at the edge.", capMult: 0.10 },
];

// ----- Sacred Geographies (4) -----
export interface SacredGeography {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  epMult: number; // EP multiplier granted
}

export const SACRED_GEOGRAPHIES: SacredGeography[] = [
  { id: "sg_spire", name: "The Spire", icon: "🗼", blurb: "A needle of meaning through the world's heart.", epMult: 0.50 },
  { id: "sg_labyrinth", name: "The Labyrinth", icon: "🔱", blurb: "Tests become the path itself.", epMult: 0.75 },
  { id: "sg_garden", name: "The Garden", icon: "🌺", blurb: "All paths lead to fruit.", epMult: 0.40 },
  { id: "sg_desert", name: "The Desert", icon: "🏜️", blurb: "The trial of patience yields the most.", epMult: 1.00 },
];

// ----- Dormant Seeds (4) -----
export interface DormantSeed {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  popGrowthMult: number;
}

export const DORMANT_SEEDS: DormantSeed[] = [
  { id: "ds_ember", name: "Ember Seed", icon: "🔥", blurb: "Population burns hot and fast.", popGrowthMult: 0.50 },
  { id: "ds_tide", name: "Tide Seed", icon: "🌊", blurb: "Population flows steadily onward.", popGrowthMult: 0.25 },
  { id: "ds_root", name: "Root Seed", icon: "🌱", blurb: "Population grows slow and deep.", popGrowthMult: 0.15 },
  { id: "ds_void", name: "Void Seed", icon: "⚫", blurb: "Population grows, but barely.", popGrowthMult: 0.05 },
];

// ----- Difficulty Tiers (4) -----
export interface DifficultyTier {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  productionMult: number; // higher difficulty = bigger production bonus
  epMult: number;
}

export const DIFFICULTY_TIERS: DifficultyTier[] = [
  { id: "dt_gentle", name: "Gentle", icon: "🍃", blurb: "A soft universe. Modest bonuses.", productionMult: 0.10, epMult: 0.10 },
  { id: "dt_tempered", name: "Tempered", icon: "⚔️", blurb: "A balanced trial.", productionMult: 0.25, epMult: 0.25 },
  { id: "dt_severe", name: "Severe", icon: "🏔️", blurb: "A harsh universe. Strong bonuses.", productionMult: 0.50, epMult: 0.50 },
  { id: "dt_impossible", name: "Impossible", icon: "💀", blurb: "A universe that does not forgive. Massive bonuses.", productionMult: 1.00, epMult: 1.00 },
];

// ----- Authored World Config -----
export interface WorldConfig {
  id: string;
  cradleWorldId: string;
  primeConditionId: string;
  sacredGeographyId: string;
  dormantSeedId: string;
  difficultyTierId: string;
  createdAt: number;
}

// ----- Maps for convenience -----
export const CRADLE_WORLD_MAP: Record<string, CradleWorld> = Object.fromEntries(
  CRADLE_WORLDS.map((c) => [c.id, c])
);
export const PRIME_CONDITION_MAP: Record<string, PrimeCondition> = Object.fromEntries(
  PRIME_CONDITIONS.map((c) => [c.id, c])
);
export const SACRED_GEOGRAPHY_MAP: Record<string, SacredGeography> = Object.fromEntries(
  SACRED_GEOGRAPHIES.map((g) => [g.id, g])
);
export const DORMANT_SEED_MAP: Record<string, DormantSeed> = Object.fromEntries(
  DORMANT_SEEDS.map((s) => [s.id, s])
);
export const DIFFICULTY_TIER_MAP: Record<string, DifficultyTier> = Object.fromEntries(
  DIFFICULTY_TIERS.map((t) => [t.id, t])
);

// ----- Helpers -----

/**
 * Sum of production multipliers from all authored worlds.
 */
export function worldProductionMult(worlds: WorldConfig[]): number {
  let mult = 0;
  for (const w of worlds) {
    const cradle = CRADLE_WORLD_MAP[w.cradleWorldId];
    const tier = DIFFICULTY_TIER_MAP[w.difficultyTierId];
    if (cradle) mult += cradle.productionMult;
    if (tier) mult += tier.productionMult;
  }
  return mult;
}

/**
 * Sum of capacity multipliers from all authored worlds.
 */
export function worldCapMult(worlds: WorldConfig[]): number {
  let mult = 0;
  for (const w of worlds) {
    const pc = PRIME_CONDITION_MAP[w.primeConditionId];
    if (pc) mult += pc.capMult;
  }
  return mult;
}

/**
 * Sum of EP multipliers from all authored worlds.
 */
export function worldEpMultiplier(worlds: WorldConfig[]): number {
  let mult = 0;
  for (const w of worlds) {
    const sg = SACRED_GEOGRAPHY_MAP[w.sacredGeographyId];
    const tier = DIFFICULTY_TIER_MAP[w.difficultyTierId];
    if (sg) mult += sg.epMult;
    if (tier) mult += tier.epMult;
  }
  return mult;
}

/**
 * Sum of population-growth multipliers from all authored worlds.
 */
export function worldPopGrowthMult(worlds: WorldConfig[]): number {
  let mult = 0;
  for (const w of worlds) {
    const seed = DORMANT_SEED_MAP[w.dormantSeedId];
    if (seed) mult += seed.popGrowthMult;
  }
  return mult;
}

/**
 * Authoring at least 1 world config unlocks Layer 5 (Apotheosis).
 */
export function hasAuthoredWorld(worlds: WorldConfig[]): boolean {
  return worlds.length > 0;
}
