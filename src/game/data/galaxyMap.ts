// ===========================================================================
// LAYER 4 — GENESIS (Galaxy Claim redesign)
// ===========================================================================
// Replaces the old 5x4 Sacred Grid. The ascended god surveys a spiral galaxy
// of 50 star systems (axial hex coordinates) and claims them with Genesis
// Seeds. Each claimed system grants:
//   • its per-system bonus (production / capacity / EP / pop),
//   • +10 worlds to the Divine Engine (toward the 1,000 cap at L4),
//   • adjacency synergy (+50% bonus value if 2+ neighbors are also claimed),
//   • and a rare resource (alloys or data) if the system hosts one.
//
// ~1 in 3 systems starts UNEXPLORED — players must scan them (small Genesis
// Seed cost) to reveal their bonus + rare resource before claiming.
//
// Filling the entire galaxy (all 50 systems claimed) completes L4 and
// unlocks Layer 5 (Apotheosis).
// ===========================================================================

export type GalaxyBonusType = "production" | "capacity" | "ep" | "pop";
export type GalaxyRareResource = "alloys" | "data" | null;

export interface GalaxyBonus {
  type: GalaxyBonusType;
  value: number;
}

export interface GalaxySystem {
  /** Stable id, "sys_01" … "sys_50". */
  id: string;
  /** Star name (curated list of 50 real-ish star names). */
  name: string;
  /** Axial hex coordinates for the spiral layout. */
  hex: { q: number; r: number };
  /** Random per-system bonus applied when claimed. */
  bonus: GalaxyBonus;
  /** Optional rare resource the system hosts. */
  rareResource: GalaxyRareResource;
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
  "Errai", "Sadr", "Albireo", "Etamin", "Rasalhague",
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

// ----- Axial hex directions (pointy-top, Red Blob Games convention) -----
// 0:East +1:NorthEast 2:NorthWest 3:West 4:SouthWest 5:SouthEast
const HEX_DIRECTIONS: ReadonlyArray<{ q: number; r: number }> = [
  { q: +1, r: 0 },   // East
  { q: +1, r: -1 },  // NorthEast
  { q: 0,  r: -1 },  // NorthWest
  { q: -1, r: 0 },   // West
  { q: -1, r: +1 },  // SouthWest
  { q: 0,  r: +1 },  // SouthEast
];

// The 6 neighbor offsets of any axial hex (q, r).
export const HEX_NEIGHBOR_OFFSETS: ReadonlyArray<{ q: number; r: number }> = HEX_DIRECTIONS;

// ----- Spiral generator: produces N hex positions starting at origin -----
// Algorithm: walk outward ring by ring. To enter ring k, move one step
// SouthWest from the last hex of ring (k-1); then for each of the 6 sides,
// take k steps in the corresponding direction.
function generateHexSpiral(numCells: number): Array<{ q: number; r: number }> {
  if (numCells <= 0) return [];
  const results: Array<{ q: number; r: number }> = [{ q: 0, r: 0 }];
  let current = { q: 0, r: 0 };
  for (let ring = 1; results.length < numCells; ring++) {
    current = { q: current.q + HEX_DIRECTIONS[4].q, r: current.r + HEX_DIRECTIONS[4].r };
    for (let side = 0; side < 6 && results.length < numCells; side++) {
      for (let step = 0; step < ring && results.length < numCells; step++) {
        results.push({ q: current.q, r: current.r });
        current = {
          q: current.q + HEX_DIRECTIONS[side].q,
          r: current.r + HEX_DIRECTIONS[side].r,
        };
      }
    }
  }
  return results;
}

// ----- Bonus value pools (small enough that 50 systems combined stay sane) -----
const BONUS_VALUES: Record<GalaxyBonusType, number[]> = {
  production: [0.05, 0.10, 0.15, 0.20],
  capacity:   [0.05, 0.10, 0.15],
  ep:         [0.10, 0.25, 0.50],
  pop:        [0.10, 0.25, 0.50],
};

function buildGalaxySystems(): GalaxySystem[] {
  const rng = mulberry32(0xc0ffee);
  const hexes = generateHexSpiral(50);
  const systems: GalaxySystem[] = [];
  for (let i = 0; i < hexes.length; i++) {
    const hex = hexes[i];
    // Bonus type roll: production 40% / capacity 30% / EP 20% / pop 10%.
    const typeRoll = rng();
    let type: GalaxyBonusType;
    if (typeRoll < 0.40) type = "production";
    else if (typeRoll < 0.70) type = "capacity";
    else if (typeRoll < 0.90) type = "ep";
    else type = "pop";
    const values = BONUS_VALUES[type];
    const value = values[Math.floor(rng() * values.length)];
    // Rare resource: ~1 in 5 systems hosts one, split evenly between alloys & data.
    // Always consume the same number of rng draws per iteration so the
    // sequence is stable even if the distribution tweaks later.
    const rareRoll = rng();
    const rareTypeRoll = rng();
    let rareResource: GalaxyRareResource = null;
    if (rareRoll < 0.20) {
      rareResource = rareTypeRoll < 0.5 ? "alloys" : "data";
    }
    // ~1 in 3 systems start unexplored.
    const explored = rng() >= 1 / 3;
    systems.push({
      id: `sys_${String(i + 1).padStart(2, "0")}`,
      name: STAR_NAMES[i] ?? `System ${i + 1}`,
      hex,
      bonus: { type, value },
      rareResource,
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

/** Returns the galaxy systems adjacent to `systemId` on the hex grid. */
export function getGalaxySystemNeighbors(systemId: string): GalaxySystem[] {
  const sys = GALAXY_SYSTEM_MAP[systemId];
  if (!sys) return [];
  const neighbors: GalaxySystem[] = [];
  for (const off of HEX_NEIGHBOR_OFFSETS) {
    const nq = sys.hex.q + off.q;
    const nr = sys.hex.r + off.r;
    const found = GALAXY_SYSTEMS.find((s) => s.hex.q === nq && s.hex.r === nr);
    if (found) neighbors.push(found);
  }
  return neighbors;
}

/** Convert axial hex coords to pixel position for SVG rendering (pointy-top). */
export function hexToPixel(q: number, r: number, size: number): { x: number; y: number } {
  return {
    x: size * Math.sqrt(3) * (q + r / 2),
    y: size * (3 / 2) * r,
  };
}

/** Returns the 6 vertex offsets (relative to center) for a pointy-top hex. */
export function hexPolygonPoints(size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 30; // 30, 90, 150, 210, 270, 330
    const angleRad = (Math.PI / 180) * angleDeg;
    const x = size * Math.cos(angleRad);
    const y = size * Math.sin(angleRad);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

// ----- Bonus aggregation helpers (used by the tick) -----

export interface GalaxyBonusSummary {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  /** Number of claimed systems (for display + unlock check). */
  claimedCount: number;
  /** Number of systems that earned the +50% adjacency synergy. */
  synergyCount: number;
  /** Counts of rare resources among claimed systems. */
  alloysCount: number;
  dataCount: number;
}

/**
 * Aggregates all bonuses from claimed galaxy systems, applying the adjacency
 * synergy bonus: a system adjacent to 2+ other claimed systems gains +50%
 * to its bonus value.
 *
 * @param galaxySystems - the live per-system state from GameState (claimed/explored flags)
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
    epMult: 0,
    popGrowthMult: 0,
    claimedCount: claimedSet.size,
    synergyCount: 0,
    alloysCount: 0,
    dataCount: 0,
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
      case "ep":         summary.epMult += v; break;
      case "pop":        summary.popGrowthMult += v; break;
    }
    if (sys.rareResource === "alloys") summary.alloysCount += 1;
    else if (sys.rareResource === "data") summary.dataCount += 1;
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

/** Cost (in Genesis Seeds) to claim the next system — scales 1.15× per claim. */
export function galaxyClaimCost(claimedCount: number): number {
  return Math.ceil(10 * Math.pow(1.15, claimedCount));
}

/** Cost (in Genesis Seeds) to scan an unexplored system. */
export const GALAXY_SCAN_COST = 5;
