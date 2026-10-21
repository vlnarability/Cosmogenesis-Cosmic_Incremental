// ===========================================================================
// LAYER 4 — GENESIS (Galaxy Claim — random star placement)
// ===========================================================================
// 50 star systems randomly placed on a starfield. The ascended god surveys
// and claims them with Divinity. Each claimed system grants:
//   • its per-system bonus (production / capacity / divinity),
//   • +10 worlds to the Divine Engine,
//   • proximity synergy (+50% bonus if 2+ nearby systems are also claimed),
//   • Void Shards (rare resource, ~1 in 5 systems).
//
// ~1 in 3 systems starts UNEXPLORED — players must scan them (small Divinity
// cost) to reveal their bonus before claiming.
//
// Filling the entire galaxy (all 50 systems claimed) completes L4 and
// unlocks Layer 5 (Apotheosis).
// ===========================================================================

export type GalaxyBonusType = "production" | "capacity" | "divinity";

export interface GalaxyBonus {
  type: GalaxyBonusType;
  value: number;
}

export interface GalaxySystem {
  /** Stable id, "sys_01" … "sys_50". */
  id: string;
  /** Star name (curated list of 50 real-ish star names). */
  name: string;
  /** Normalized position on the star map (0-100 × 0-100). */
  pos: { x: number; y: number };
  /** Random per-system bonus applied when claimed. */
  bonus: GalaxyBonus;
  /** Whether this system has Void Shards (rare resource, ~1 in 5). */
  hasVoidShards: boolean;
  /** Whether the system starts explored (≈ 2/3 of systems). */
  explored: boolean;
  /** Always false at fresh galaxy initialization. */
  claimed: boolean;
}

/** Runtime per-system state stored on the GameState. */
export interface GalaxySystemState {
  id: string;
  claimed: boolean;
  explored: boolean;
}

// ----- 50 curated star names -----
const STAR_NAMES: string[] = [
  "Alpha Centauri", "Vega", "Sirius", "Procyon", "Altair",
  "Rigel", "Betelgeuse", "Antares", "Arcturus", "Polaris",
  "Capella", "Aldebaran", "Spica", "Deneb", "Fomalhaut",
  "Regulus", "Bellatrix", "Canopus", "Castor", "Pollux",
  "Mira", "Algol", "Mizar", "Alkaid", "Phecda",
  "Dubhe", "Merak", "Thuban", "Kochab", "Yildun",
  "Errai", "Sadr", "Albireo", "Etamin", "Rasalhogue",
  "Sabik", "Markab", "Nunki", "Peacock", "Ankaa",
  "Avior", "Miaplacidus", "Atria", "Menkent", "Hadar",
  "Toliman", "Agena", "Mimosa", "Acamar", "Zaurak",
];

// ----- Deterministic PRNG so the galaxy layout is identical across reloads -----
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ----- Bonus value pools -----
const BONUS_VALUES: Record<GalaxyBonusType, number[]> = {
  production: [0.05, 0.10, 0.15, 0.20],
  capacity:   [0.05, 0.10, 0.15],
  divinity:   [0.10, 0.25, 0.50],
};

// ----- Proximity threshold for adjacency synergy (in normalized 0-100 space) -----
// Two systems within this distance are "nearby" for synergy purposes.
const PROXIMITY_THRESHOLD = 18;

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ----- Generate 50 random star positions (deterministic via seeded PRNG) -----
function buildGalaxySystems(): GalaxySystem[] {
  const rng = mulberry32(0xc0ffee);
  const systems: GalaxySystem[] = [];

  // Generate 50 random positions, ensuring minimum spacing
  const positions: { x: number; y: number }[] = [];
  const MIN_DIST = 8; // minimum distance between any two stars
  for (let i = 0; i < 50; i++) {
    let pos: { x: number; y: number };
    let attempts = 0;
    do {
      pos = {
        x: 5 + rng() * 90,  // 5-95 range (padding from edges)
        y: 5 + rng() * 90,
      };
      attempts++;
    } while (
      attempts < 100 &&
      positions.some((p) => distance(p, pos) < MIN_DIST)
    );
    positions.push(pos);
  }

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    // Bonus type: production 45% / capacity 30% / divinity 25%
    const typeRoll = rng();
    let type: GalaxyBonusType;
    if (typeRoll < 0.45) type = "production";
    else if (typeRoll < 0.75) type = "capacity";
    else type = "divinity";
    const values = BONUS_VALUES[type];
    const value = values[Math.floor(rng() * values.length)];
    // Void Shards: ~1 in 5 systems has them
    const hasVoidShards = rng() < 0.20;
    // ~1 in 3 systems start unexplored
    const explored = rng() >= 1 / 3;
    systems.push({
      id: `sys_${String(i + 1).padStart(2, "0")}`,
      name: STAR_NAMES[i] ?? `System ${i + 1}`,
      pos,
      bonus: { type, value },
      hasVoidShards,
      explored,
      claimed: false,
    });
  }
  return systems;
}

export const GALAXY_SYSTEMS: GalaxySystem[] = buildGalaxySystems();
export const GALAXY_TOTAL_SYSTEMS = GALAXY_SYSTEMS.length; // 50

export const GALAXY_SYSTEM_MAP: Record<string, GalaxySystem> = Object.fromEntries(
  GALAXY_SYSTEMS.map((s) => [s.id, s])
);

// ----- Lookup helpers -----

/** Returns galaxy systems nearby to `systemId` (within PROXIMITY_THRESHOLD). */
export function getGalaxySystemNeighbors(systemId: string): GalaxySystem[] {
  const sys = GALAXY_SYSTEM_MAP[systemId];
  if (!sys) return [];
  return GALAXY_SYSTEMS.filter((s) => {
    if (s.id === sys.id) return false;
    return distance(sys.pos, s.pos) <= PROXIMITY_THRESHOLD;
  });
}

// ----- Bonus aggregation helpers (used by the tick) -----

export interface GalaxyBonusSummary {
  productionMult: number;
  capMult: number;
  divinityMult: number;
  /** Number of claimed systems (for display + unlock check). */
  claimedCount: number;
  /** Number of systems that earned the +50% proximity synergy. */
  synergyCount: number;
  /** Number of claimed systems with Void Shards. */
  voidShardsCount: number;
}

/**
 * Aggregates all bonuses from claimed galaxy systems, applying the proximity
 * synergy bonus: a system with 2+ nearby claimed systems gains +50%
 * to its bonus value.
 */
export function summarizeGalaxyBonuses(
  galaxySystems: GalaxySystemState[]
): GalaxyBonusSummary {
  const claimedSet = new Set(
    galaxySystems.filter((s) => s.claimed).map((s) => s.id)
  );
  const summary: GalaxyBonusSummary = {
    productionMult: 0,
    capMult: 0,
    divinityMult: 0,
    claimedCount: claimedSet.size,
    synergyCount: 0,
    voidShardsCount: 0,
  };
  if (claimedSet.size === 0) return summary;
  for (const sys of GALAXY_SYSTEMS) {
    if (!claimedSet.has(sys.id)) continue;
    const neighbors = getGalaxySystemNeighbors(sys.id);
    const claimedNeighborCount = neighbors.filter((n) => claimedSet.has(n.id)).length;
    const synergy = claimedNeighborCount >= 2 ? 1.5 : 1.0;
    if (synergy > 1) summary.synergyCount += 1;
    const v = sys.bonus.value * synergy;
    switch (sys.bonus.type) {
      case "production": summary.productionMult += v; break;
      case "capacity":   summary.capMult += v; break;
      case "divinity":   summary.divinityMult += v; break;
    }
    if (sys.hasVoidShards) summary.voidShardsCount += 1;
  }
  return summary;
}

/** Builds the fresh per-system runtime state from the galaxy data (all unclaimed). */
export function makeInitialGalaxySystems(): GalaxySystemState[] {
  return GALAXY_SYSTEMS.map((s) => ({
    id: s.id,
    claimed: false,
    explored: s.explored,
  }));
}

/** True when all 50 systems are claimed (L4 → L5 unlock condition). */
export function isGalaxyComplete(galaxySystems: GalaxySystemState[]): boolean {
  if (!galaxySystems || galaxySystems.length === 0) return false;
  return galaxySystems.every((s) => s.claimed);
}

/** Cost (in Divinity) to claim the next system — scales 1.15× per claim. */
export function galaxyClaimCost(claimedCount: number): number {
  return Math.ceil(10 * Math.pow(1.15, claimedCount));
}

/** Cost (in Divinity) to scan an unexplored system. */
export const GALAXY_SCAN_COST = 5;
