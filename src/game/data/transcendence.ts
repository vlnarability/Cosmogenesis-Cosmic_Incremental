// ===========================================================================
// LAYER 3 — TRANSCENDENCE (REDESIGNED)
// ===========================================================================
// The ascended god manipulates the Divine Engine directly. No more
// Offerings, Rituals, Scripts, or Blood Pacts — those were Cell-stage
// holdovers that didn't connect to the engine.
//
// New systems:
//   • World Forge — spend Divinity to create new background worlds
//   • Convergence Catalysts — permanent Divine Engine upgrades
//   • World Templates — choose how simulations run (mode selection)
//   • Genesis Seeds — plant permanent Divinity generators (4 tiers, unlock L4)
//   • Eternal Flame — dump infinite Divinity for a growing multiplier
//   • Astral Resonance — align all worlds to a constellation category
//   • World Fusion — merge worlds into higher tiers (see worldFusion.ts)
//   • Investment Portfolios — allocate worlds for risk/reward dividends (kept)
// ===========================================================================

// ----- Convergence Catalysts -----
// Permanent Divine Engine upgrades purchased with Divinity. Each is one-time.
export interface Catalyst {
  id: string;
  name: string;
  desc: string;
  icon: string;
  cost: number; // Divinity cost
  effect: {
    divinityMult?: number; // +X to all Divinity/s
    peakMult?: number; // × peak production rate
    worldTickMult?: number; // × world tick speed (production multiplier)
    worldCountMult?: number; // each world counts as X for Divinity
    crashImmune?: boolean; // worlds never crash
  };
}

export const CONVERGENCE_CATALYSTS: Catalyst[] = [
  {
    id: "harmonic_resonance",
    name: "Harmonic Resonance",
    desc: "Permanent: +10% Divinity/s from all worlds.",
    icon: "🎵",
    cost: 100,
    effect: { divinityMult: 0.10 },
  },
  {
    id: "stellar_furnace",
    name: "Stellar Furnace",
    desc: "Permanent: ×2 peak production rate.",
    icon: "🔥",
    cost: 500,
    effect: { peakMult: 2 },
  },
  {
    id: "temporal_dilation",
    name: "Temporal Dilation",
    desc: "Permanent: worlds produce 2× Divinity per tick.",
    icon: "⏳",
    cost: 1000,
    effect: { worldTickMult: 2 },
  },
  {
    id: "divine_multiplication",
    name: "Divine Multiplication",
    desc: "Permanent: each world counts as 1.5 for Divinity purposes.",
    icon: "✦",
    cost: 2000,
    effect: { worldCountMult: 1.5 },
  },
  {
    id: "eternal_engine",
    name: "Eternal Engine",
    desc: "Permanent: worlds never lose value (crash-immune).",
    icon: "♾️",
    cost: 5000,
    effect: { crashImmune: true },
  },
];

export const CATALYST_MAP: Record<string, Catalyst> = Object.fromEntries(
  CONVERGENCE_CATALYSTS.map((c) => [c.id, c])
);

/** Aggregate catalyst effects. */
export function catalystBonus(
  purchased: Record<string, boolean>
): {
  divinityMult: number;
  peakMult: number;
  worldTickMult: number;
  worldCountMult: number;
  crashImmune: boolean;
} {
  let divinityMult = 0;
  let peakMult = 1;
  let worldTickMult = 1;
  let worldCountMult = 1;
  let crashImmune = false;
  for (const c of CONVERGENCE_CATALYSTS) {
    if (purchased[c.id]) {
      if (c.effect.divinityMult) divinityMult += c.effect.divinityMult;
      if (c.effect.peakMult) peakMult *= c.effect.peakMult;
      if (c.effect.worldTickMult) worldTickMult *= c.effect.worldTickMult;
      if (c.effect.worldCountMult) worldCountMult *= c.effect.worldCountMult;
      if (c.effect.crashImmune) crashImmune = true;
    }
  }
  return { divinityMult, peakMult, worldTickMult, worldCountMult, crashImmune };
}

// ----- World Templates -----
// Choose the "mode" of all background worlds. Only one active at a time.
export interface WorldTemplate {
  id: string;
  name: string;
  desc: string;
  icon: string;
  divinityMult: number; // × multiplier on Divinity/s from worlds
  faithPerSec?: number; // passive Faith generation (positive) or cost (negative)
  crashChance?: number; // chance per tick a world collapses
  voidShardPerSec?: number; // passive Void Shard generation
  peakGrowthPerMin?: number; // peak production rate grows by X% per minute
}

export const WORLD_TEMPLATES: WorldTemplate[] = [
  {
    id: "harmony",
    name: "Harmony",
    desc: "+20% Divinity/s, no risk.",
    icon: "🌿",
    divinityMult: 1.20,
  },
  {
    id: "crucible",
    name: "Crucible",
    desc: "+100% Divinity/s, but 5% chance per tick a world collapses (lost permanently).",
    icon: "🌋",
    divinityMult: 2.0,
    crashChance: 0.05,
  },
  {
    id: "monastery",
    name: "Monastery",
    desc: "+10% Divinity/s AND +0.1 Faith/s.",
    icon: "📿",
    divinityMult: 1.10,
    faithPerSec: 0.1,
  },
  {
    id: "ascendant",
    name: "Ascendant",
    desc: "+50% Divinity/s AND peak production rate grows +0.5%/min.",
    icon: "🕊️",
    divinityMult: 1.50,
    peakGrowthPerMin: 0.005,
  },
  {
    id: "void",
    name: "Void",
    desc: "-50% Divinity/s but each world generates +0.01 Void Shards/s.",
    icon: "🌑",
    divinityMult: 0.50,
    voidShardPerSec: 0.01,
  },
];

export const TEMPLATE_MAP: Record<string, WorldTemplate> = Object.fromEntries(
  WORLD_TEMPLATES.map((t) => [t.id, t])
);

export function templateBonus(templateId: string | null): WorldTemplate | null {
  if (!templateId) return null;
  return TEMPLATE_MAP[templateId] || null;
}

// ----- Genesis Seeds -----
// Plant seeds that grow into permanent Divinity generators. 4 tiers.
// All 4 must be planted (not necessarily mature) to unlock L4 (Genesis).
export interface GenesisSeed {
  id: string;
  name: string;
  desc: string;
  icon: string;
  cost: number; // Divinity to plant
  maturitySec: number; // seconds to mature
  divinityPerSec: number; // permanent Divinity/s when mature
}

export const GENESIS_SEEDS: GenesisSeed[] = [
  {
    id: "sprout",
    name: "Sprout",
    desc: "Matures in 60s. Produces +0.5 Div/s permanently when mature.",
    icon: "🌱",
    cost: 25,
    maturitySec: 60,
    divinityPerSec: 0.5,
  },
  {
    id: "sapling",
    name: "Sapling",
    desc: "Matures in 300s. Produces +2 Div/s permanently when mature.",
    icon: "🌳",
    cost: 100,
    maturitySec: 300,
    divinityPerSec: 2,
  },
  {
    id: "elder_tree",
    name: "Elder Tree",
    desc: "Matures in 600s. Produces +10 Div/s permanently when mature.",
    icon: "🌲",
    cost: 500,
    maturitySec: 600,
    divinityPerSec: 10,
  },
  {
    id: "world_tree",
    name: "World Tree",
    desc: "Matures in 1800s. Produces +50 Div/s permanently when mature.",
    icon: "🌴",
    cost: 2000,
    maturitySec: 1800,
    divinityPerSec: 50,
  },
];

export const SEED_MAP: Record<string, GenesisSeed> = Object.fromEntries(
  GENESIS_SEEDS.map((s) => [s.id, s])
);

/** Check if all 4 seeds are planted (L4 unlock condition). */
export function allSeedsPlanted(plantedSeeds: Record<string, { planted: boolean; plantedAtTime: number }>): boolean {
  return GENESIS_SEEDS.every((s) => plantedSeeds[s.id]?.planted);
}

/** Check if a seed is mature (gameTime - plantedAt >= maturitySec). */
export function isSeedMature(seedId: string, plantedSeeds: Record<string, { planted: boolean; plantedAtTime: number }>, gameTime: number): boolean {
  const entry = plantedSeeds[seedId];
  if (!entry?.planted) return false;
  const seed = SEED_MAP[seedId];
  if (!seed) return false;
  return gameTime - entry.plantedAtTime >= seed.maturitySec;
}

/** Total Divinity/s from all mature seeds. */
export function matureSeedDivinityPerSec(plantedSeeds: Record<string, { planted: boolean; plantedAtTime: number }>, gameTime: number): number {
  let total = 0;
  for (const seed of GENESIS_SEEDS) {
    if (isSeedMature(seed.id, plantedSeeds, gameTime)) {
      total += seed.divinityPerSec;
    }
  }
  return total;
}

// ----- Astral Resonance -----
// Align ALL worlds to a constellation category. One active at a time.
export interface ResonanceAlignment {
  id: string;
  name: string;
  desc: string;
  icon: string;
  divinityMult: number; // × multiplier on Divinity/s from worlds
  faithCostPerTick?: number; // Faith drain per tick to maintain
  crashChance?: number; // chance per tick a world collapses
}

export const RESONANCE_ALIGNMENTS: ResonanceAlignment[] = [
  {
    id: "zodiac",
    name: "Zodiac Alignment",
    desc: "+10% Divinity/s. No downside.",
    icon: "♈",
    divinityMult: 1.10,
  },
  {
    id: "northern",
    name: "Northern Alignment",
    desc: "+15% Divinity/s from worlds. Penalty: -10% peak production rate (the engine runs cooler but each world produces more efficiently).",
    icon: "🐻",
    divinityMult: 1.15,
  },
  {
    id: "equatorial",
    name: "Equatorial Alignment",
    desc: "+20% Divinity/s, costs 1 Faith/tick to maintain.",
    icon: "🌍",
    divinityMult: 1.20,
    faithCostPerTick: 1,
  },
  {
    id: "southern",
    name: "Southern Alignment",
    desc: "+25% Divinity/s, but 2% chance/tick a world collapses.",
    icon: "⛵",
    divinityMult: 1.25,
    crashChance: 0.02,
  },
];

export const RESONANCE_MAP: Record<string, ResonanceAlignment> = Object.fromEntries(
  RESONANCE_ALIGNMENTS.map((a) => [a.id, a])
);

export function resonanceBonus(alignmentId: string | null): ResonanceAlignment | null {
  if (!alignmentId) return null;
  return RESONANCE_MAP[alignmentId] || null;
}

// ----- World Forge -----
// Cost formula: base × 1.5^worldsForged
export const WORLD_FORGE_BASE_COST = 50;
export const WORLD_FORGE_GROWTH = 1.5;

export function worldForgeCost(worldsForged: number): number {
  return Math.ceil(WORLD_FORGE_BASE_COST * Math.pow(WORLD_FORGE_GROWTH, worldsForged));
}

// ----- Eternal Flame -----
// Player dumps infinite Divinity. Multiplier = 1 + log10(invested + 1) × 0.5
// Re-exported from worldFusion.ts for convenience.
export { eternalFlameMultiplier } from "./worldFusion";

// ----- Legacy stubs (kept for save-compat, no longer used in UI) -----
// These are kept so old saves with offeringsUsed / purchasedRituals /
// activeScripts / bloodPactsUsed don't break on load. The tick logic
// for these has been removed — they're inert.
export const LEGACY_OFFERINGS_COUNT = 6;
export const LEGACY_RITUALS_COUNT = 7;
export const LEGACY_SCRIPTS_COUNT = 5;
export const LEGACY_BLOOD_PACTS_COUNT = 4;

// ===== ALIASES for the subagent's expected export names =====
// The store.ts was written by a subagent that used different naming
// conventions. These aliases ensure compatibility.
export const CONVERGENCE_CATALYST_MAP = CATALYST_MAP;
export const WORLD_TEMPLATE_MAP = TEMPLATE_MAP;
export const GENESIS_SEED_MAP = SEED_MAP;
export const ASTRAL_CATEGORIES = RESONANCE_ALIGNMENTS;
export const ASTRAL_CATEGORY_MAP = RESONANCE_MAP;

export function allGenesisSeedsPlanted(
  plantedSeeds: Record<string, { planted: boolean; plantedAtTime: number }>
): boolean {
  return allSeedsPlanted(plantedSeeds);
}

export function plantedSeedsDivinityPerSec(
  plantedSeeds: Record<string, { planted: boolean; plantedAtTime: number }>,
  gameTime: number
): number {
  return matureSeedDivinityPerSec(plantedSeeds, gameTime);
}

// ===== LEGACY EXPORTS (kept for save-compat, store still imports them) =====
// These are no-ops / empty arrays — the old Offerings/Rituals/Scripts/BloodPacts
// systems have been removed from the UI. The store still imports them for
// legacy tick logic that references them (harmless no-ops).
export const OFFERINGS: any[] = [];
export const OFFERING_MAP: Record<string, any> = {};
export const RITUALS: any[] = [];
export const RITUAL_MAP: Record<string, any> = {};
export const SCRIPTS: any[] = [];
export const SCRIPT_MAP: Record<string, any> = {};
export const BLOOD_PACTS: any[] = [];
export const BLOOD_PACT_MAP: Record<string, any> = {};

export function offeringDivinityAtRepeat(..._args: any[]): number { return 0; }
export function activeRitualProductionBonus(..._args: any[]): number { return 0; }
export function activeRitualCapBonus(..._args: any[]): number { return 0; }
export function activeRitualEpBonus(..._args: any[]): number { return 0; }
export function activeRitualPopBonus(..._args: any[]): number { return 0; }
export function transcendenceDivinityPerSecond(..._args: any[]): number { return 0; }
export function allBloodPactsUsed(..._args: any[]): boolean { return false; }
export function activeRitualDivinityPerSecBonus(..._args: any[]): number { return 0; }
