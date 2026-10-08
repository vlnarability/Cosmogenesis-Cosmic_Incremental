// ===========================================================================
// LAYER 8 — DIVINITY (DIVINE ALLIANCE)
// ===========================================================================
// The god returns to the main universe to gather allies. Other minor gods
// exist as NPCs — each with a personality, power level, demands, and rewards.
// Form alliances (mutual defense pacts), trade resources, share technology.
// The Prayer Router becomes a "Diplomacy Network" — route messages and gifts
// to other gods. Completing 2+ alliances unlocks Layer 9 (Infinity).
// ===========================================================================

// ----- Minor God NPCs (6) -----
export interface MinorGod {
  id: string;
  name: string;
  title: string;
  icon: string;
  personality: "warm" | "cunning" | "mystic" | "warlike" | "patient" | "chaotic";
  powerLevel: number;     // 1-100, used for alliance power bonus
  demand: { resource: string; amount: number }; // trade cost to gain relationship
  reward: { resource: string; amount: number };  // what they give back
  desc: string;
  startingRelationship: number; // 0-100
}

export const MINOR_GODS: MinorGod[] = [
  {
    id: "god_aurelia",
    name: "Aurelia",
    title: "Lady of the Dawn",
    icon: "🌅",
    personality: "warm",
    powerLevel: 55,
    demand: { resource: "divinity", amount: 20 },
    reward: { resource: "faith", amount: 15 },
    desc: "Radiant and kind. Grants faith in exchange for divinity.",
    startingRelationship: 30,
  },
  {
    id: "god_nyxar",
    name: "Nyxar",
    title: "Whisper of the Deep",
    icon: "🌌",
    personality: "cunning",
    powerLevel: 70,
    demand: { resource: "divinity", amount: 30 },
    reward: { resource: "prayer", amount: 25 },
    desc: "Ancient and sly. Trades divinity for prayer secrets.",
    startingRelationship: 15,
  },
  {
    id: "god_thane",
    name: "Thane",
    title: "Hammer of Storms",
    icon: "⛈️",
    personality: "warlike",
    powerLevel: 80,
    demand: { resource: "faith", amount: 25 },
    reward: { resource: "divinity", amount: 30 },
    desc: "Battle-hardened. Demands faith; returns divinity.",
    startingRelationship: 10,
  },
  {
    id: "god_sylph",
    name: "Sylph",
    title: "Wind Between Stars",
    icon: "🍃",
    personality: "mystic",
    powerLevel: 50,
    demand: { resource: "prayer", amount: 15 },
    reward: { resource: "divinity", amount: 18 },
    desc: "Ethereal and quiet. Trades prayer for divinity.",
    startingRelationship: 25,
  },
  {
    id: "god_karnak",
    name: "Karnak",
    title: "Stone Eternal",
    icon: "🗿",
    personality: "patient",
    powerLevel: 65,
    demand: { resource: "divinity", amount: 25 },
    reward: { resource: "faith", amount: 20 },
    desc: "Slow to act, slow to anger. Reliable once allied.",
    startingRelationship: 20,
  },
  {
    id: "god_veska",
    name: "Veska",
    title: "Laughing Chaos",
    icon: "🎲",
    personality: "chaotic",
    powerLevel: 90,
    demand: { resource: "prayer", amount: 30 },
    reward: { resource: "faith", amount: 35 },
    desc: "Unpredictable and powerful. Demands prayer; rewards faith.",
    startingRelationship: 5,
  },
];

export const MINOR_GOD_MAP: Record<string, MinorGod> = Object.fromEntries(
  MINOR_GODS.map((g) => [g.id, g])
);

// ----- Diplomacy Actions -----
// Each action affects the relationship meter. Negotiate = +5, Trade = +3
// (and exchanges resources), Form Alliance = requires relationship ≥ 60.
export const RELATIONSHIP_NEGOTIATE_GAIN = 5;
export const RELATIONSHIP_TRADE_GAIN = 3;
export const RELATIONSHIP_ALLIANCE_THRESHOLD = 60;
export const RELATIONSHIP_MAX = 100;

// ----- Helpers -----

/**
 * Aggregated production/etc. bonus from all alliances.
 * Each alliance grants: +5% production, +3% cap, +2% EP, +4% pop growth.
 * Alliance power scales the bonus (high-power allies give more).
 */
export function allianceBonus(
  alliances: Record<string, boolean>,
  minorGods: Array<MinorGod>
): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  allianceCount: number;
} {
  let productionMult = 0;
  let capMult = 0;
  let epMult = 0;
  let popGrowthMult = 0;
  let allianceCount = 0;
  for (const g of minorGods) {
    if (!alliances[g.id]) continue;
    allianceCount += 1;
    // Bonus scales with power level (50 power = 1.0×, 100 power = 2.0×)
    const powerMult = g.powerLevel / 50;
    productionMult += 0.05 * powerMult;
    capMult += 0.03 * powerMult;
    epMult += 0.02 * powerMult;
    popGrowthMult += 0.04 * powerMult;
  }
  return { productionMult, capMult, epMult, popGrowthMult, allianceCount };
}

/**
 * Returns true if the player can form an alliance with a minor god
 * (relationship ≥ threshold, no existing alliance).
 */
export function canFormAlliance(
  relationships: Record<string, number>,
  alliances: Record<string, boolean>,
  godId: string
): boolean {
  if (alliances[godId]) return false;
  return (relationships[godId] || 0) >= RELATIONSHIP_ALLIANCE_THRESHOLD;
}

/**
 * Layer 9 (Infinity) unlock: 2+ alliances formed.
 */
export function isDivinityComplete(alliances: Record<string, boolean>): boolean {
  const count = Object.values(alliances || {}).filter(Boolean).length;
  return count >= 2;
}

/**
 * Bonus from the active Worship Polarity — preserved for backwards compat.
 * (Legacy field; the new Divinity layer uses alliance bonuses.)
 */
export function worshipPolarityBonus(
  activePolarity: string | null | undefined
): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  prayerMult: number;
} {
  void activePolarity;
  return { productionMult: 0, capMult: 0, epMult: 0, popGrowthMult: 0, prayerMult: 0 };
}

/**
 * Aggregated prayer-channel bonus — preserved for backwards compat.
 * Returns zero bonuses (the new Divinity layer doesn't use channels).
 */
export function prayerChannelBonus(
  levels: Record<string, number>
): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  prayerMult: number;
  totalLevels: number;
} {
  void levels;
  return { productionMult: 0, capMult: 0, epMult: 0, popGrowthMult: 0, prayerMult: 0, totalLevels: 0 };
}

/**
 * Divine mask bonus — preserved for backwards compat. Returns zero.
 */
export function divineMaskBonus(
  activeMask: string | null | undefined
): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  prayerMult: number;
} {
  void activeMask;
  return { productionMult: 0, capMult: 0, epMult: 0, popGrowthMult: 0, prayerMult: 0 };
}

/**
 * Compute Prayer/sec generated. Base = population × 0.001/s.
 * (Preserved for legacy code that still reads prayer.)
 */
export function prayerRate(
  population: number,
  channelLevels: Record<string, number>,
  activeMask: string | null | undefined,
  activePolarity: string | null | undefined
): number {
  void channelLevels;
  void activeMask;
  void activePolarity;
  return population * 0.001;
}
