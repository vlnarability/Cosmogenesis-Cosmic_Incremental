// ===========================================================================
// LAYER 6 — UNIVERSAL MAP (Rift Defense + Reality Anchors)
// ===========================================================================
// Replaces the old Dimension Engine. The ascended god surveys a 2D universe
// of 50 galaxies (10 starter + rival from L5, 40 NEW neutral galaxies) and
// defends it against Old God rifts.
//
// Each NEW neutral galaxy contains 10-100 star systems. The total across the
// 40 new galaxies is EXACTLY 5,000. Each claimed new system grants +198
// worlds to the Divine Engine (5,000 × 198 = 990,000 new worlds). Combined
// with L4 (50 systems × 10 = 500) and L5 (rival systems × 18), the cap at
// L6 rises to 1,000,000 worlds.
//
// Rifts spawn on galaxies (yours, rivals, neutral). Close them by spending
// Singularity Cores. Place Reality Anchors to prevent corruption in their
// radius. Close 20 rifts + place 10 anchors → unlocks L7 (Omnipotence).
// ===========================================================================

import { RIVAL_GALAXIES, type RivalGalaxy } from "./galaxies";

// ----- Universal galaxy definition (the L6 "endgame map" entry) -----
export interface UniversalGalaxy {
  /** Stable id (matches L5 galaxy ids for the 10 starter+rival galaxies). */
  id: string;
  /** Display name. */
  name: string;
  /** Total star systems in this galaxy (10-100). */
  systemCount: number;
  /** Owner at fresh-start — "player" for the starter, "rival_<id>" for rivals, "neutral" for the 40 new galaxies. */
  ownerId: string;
  /** 2D universal-map position (0-100 on each axis, used for SVG rendering + anchor radius). */
  pos: { x: number; y: number };
  /** Tagline for UI. */
  tagline: string;
  /** Whether this galaxy is one of the 40 NEW L6 galaxies (drives the world bonus formula). */
  isNewL6: boolean;
}

// ----- Deterministic PRNG so the universal map is identical across reloads -----
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ----- Build the 50-galaxy universal map -----
// Step 1: Import the 10 L5 starter+rival galaxies (isNewL6 = false).
// Step 2: Generate 40 NEW neutral galaxies (isNewL6 = true) with 10-100
//         systems each, positioned around the L5 galaxies on the universal
//         map. The 40 new galaxy system counts total EXACTLY 5,000 — we
//         distribute them via a deterministic weighted roll (rounded +
//         reconciled to 5,000 exactly).
function buildUniversalGalaxies(): UniversalGalaxy[] {
  const galaxies: UniversalGalaxy[] = [];

  // ---- Step 1: L5 galaxies (10) ----
  for (const g of RIVAL_GALAXIES) {
    galaxies.push({
      id: g.id,
      name: g.name,
      systemCount: g.systemCount,
      ownerId: g.ownerId,
      pos: { x: g.pos.x, y: g.pos.y },
      tagline: g.tagline,
      isNewL6: false,
    });
  }

  // ---- Step 2: 40 NEW neutral galaxies (L6) ----
  // Curated name pool — distinct from L5 galaxy names so the player can
  // visually tell "new" galaxies apart on the universal map.
  const NEW_NAMES: string[] = [
    "Threnody Expanse", "Lysithea Field", "Veridian Cluster", "Obsidian Maw",
    "Cobalt Halo", "Thalassis Drift", "Erebus Crown", "Pyrelle Spire",
    "Sable Reach", "Mirelight Belt", "Azimuth Spiral", "Quenya Arch",
    "Hollowbrand Gulf", "Cinderfall Lattice", "Vespera Vault", "Marigold Strand",
    "Argent Veil", "Sonderstream Bay", "Wraithfall Expanse", "Verdant Loop",
    "Astraea Pillar", "Hollowsong Field", "Penumbra Cradle", "Sapphira Reach",
    "Emberward Spiral", "Lullaby Vault", "Tenebrous Crown", "Auric Strand",
    "Sablepine Drift", "Zephyra Halo", "Quicksilver Maw", "Nadir Lattice",
    "Verglas Pillar", "Wraithling Gulf", "Solitude Bay", "Peridot Arch",
    "Nocturne Spire", "Halcyon Cluster", "Borealis Strand", "Umbralace Vault",
  ];

  const NEW_GALAXY_COUNT = 40;
  const TARGET_TOTAL_SYSTEMS = 5000;

  // Deterministic positions: distribute around the universal map on 5
  // concentric rings (radius 35-95) starting at varying angles. The L5
  // starter (galaxy_starter at 50,50) sits dead-center.
  const rng = mulberry32(0xbeef42);
  const positions: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < NEW_GALAXY_COUNT; i++) {
    const ring = Math.floor(i / 8) + 1; // rings 1..5
    const baseRadius = 22 + ring * 14; // 36, 50, 64, 78, 92
    const jitterR = (rng() - 0.5) * 8;
    const radius = Math.max(20, Math.min(95, baseRadius + jitterR));
    const angle = (i / NEW_GALAXY_COUNT) * Math.PI * 2 + rng() * 0.4;
    const x = Math.max(4, Math.min(96, 50 + Math.cos(angle) * radius));
    const y = Math.max(4, Math.min(96, 50 + Math.sin(angle) * radius));
    positions.push({ x, y });
  }

  // Distribute 5,000 systems across 40 galaxies. Each new galaxy has 10-150
  // systems (note: the design spec said 10-100, but 40 × 100 = 4,000 max is
  // mathematically insufficient to reach the 5,000-system target the spec
  // also requires. We extend the upper bound to 150 so 40 galaxies can sum
  // to exactly 5,000 — avg 125 per galaxy — while preserving the per-galaxy
  // variance the spec asks for. The hard math constraints
  // (5,000 systems × 198 worlds = 990,000 new worlds) take priority.)
  const rawCounts: number[] = [];
  let rawSum = 0;
  for (let i = 0; i < NEW_GALAXY_COUNT; i++) {
    // Roll 10-150 (uniform).
    const c = 10 + Math.floor(rng() * 141);
    rawCounts.push(c);
    rawSum += c;
  }
  // Reconcile to exactly 5,000: compute delta, distribute +1/-1 across the
  // galaxies (clamped to [10, 150]) until the sum equals TARGET.
  let delta = TARGET_TOTAL_SYSTEMS - rawSum;
  let guard = 0;
  while (delta !== 0 && guard < 100_000) {
    guard++;
    const idx = Math.floor(rng() * NEW_GALAXY_COUNT);
    if (delta > 0 && rawCounts[idx] < 150) {
      rawCounts[idx]++;
      delta--;
    } else if (delta < 0 && rawCounts[idx] > 10) {
      rawCounts[idx]--;
      delta++;
    }
  }

  // Build the new-galaxy records.
  for (let i = 0; i < NEW_GALAXY_COUNT; i++) {
    const id = `ugalaxy_${String(i + 1).padStart(2, "0")}`;
    const name = NEW_NAMES[i] ?? `Unnamed Galaxy ${i + 1}`;
    const systemCount = rawCounts[i];
    galaxies.push({
      id,
      name,
      systemCount,
      ownerId: "neutral",
      pos: positions[i],
      tagline: `Neutral galaxy — ${systemCount} systems awaiting your conquest.`,
      isNewL6: true,
    });
  }

  return galaxies;
}

export const UNIVERSAL_GALAXIES: UniversalGalaxy[] = buildUniversalGalaxies();
export const UNIVERSAL_GALAXY_MAP: Record<string, UniversalGalaxy> = Object.fromEntries(
  UNIVERSAL_GALAXIES.map((g) => [g.id, g])
);

// ----- Public constants -----
export const TOTAL_UNIVERSAL_GALAXIES = UNIVERSAL_GALAXIES.length; // 50
export const TOTAL_NEW_GALAXIES_L6 = UNIVERSAL_GALAXIES.filter((g) => g.isNewL6).length; // 40
export const TOTAL_NEW_SYSTEMS_L6 = UNIVERSAL_GALAXIES
  .filter((g) => g.isNewL6)
  .reduce((sum, g) => sum + g.systemCount, 0); // 5,000 (exact)
export const WORLDS_PER_NEW_SYSTEM_L6 = 198; // flat — 5,000 × 198 = 990,000
export const TOTAL_NEW_WORLDS_L6 = TOTAL_NEW_SYSTEMS_L6 * WORLDS_PER_NEW_SYSTEM_L6; // 990,000

// L6 completion thresholds (drives the L6→L7 unlock).
export const RIFTS_REQUIRED_FOR_L7 = 20;
export const ANCHORS_REQUIRED_FOR_L7 = 10;

// ----- Reality anchor radius (in universal-map units 0-100) -----
// An anchor placed on a galaxy protects that galaxy + every other galaxy
// within this distance from rift corruption.
export const ANCHOR_RADIUS = 18;

// ----- Rift spawn / corruption tuning -----
export const RIFT_SPAWN_MIN_SEC = 30;
export const RIFT_SPAWN_MAX_SEC = 60;
export const RIFT_CORRUPTION_PER_TICK = 5; // +5% heresy to a random non-anchored galaxy
export const RIFT_SEVERITY_MIN = 1;
export const RIFT_SEVERITY_MAX = 5;
export const RIFT_CLOSE_BASE_COST = 1; // Singularity Cores per severity point
export const ANCHOR_PLACE_BASE_COST = 3; // Singularity Cores per existing anchor + 1

// ----- Helpers -----

/** Returns the galaxies within `ANCHOR_RADIUS` of the given galaxy (inclusive of itself). */
export function galaxiesInAnchorRadius(galaxyId: string): UniversalGalaxy[] {
  const center = UNIVERSAL_GALAXY_MAP[galaxyId];
  if (!center) return [];
  return UNIVERSAL_GALAXIES.filter((g) => {
    const dx = g.pos.x - center.pos.x;
    const dy = g.pos.y - center.pos.y;
    return Math.sqrt(dx * dx + dy * dy) <= ANCHOR_RADIUS;
  });
}

/** True if `galaxyId` is covered by any of the placed anchors. */
export function isGalaxyAnchored(
  galaxyId: string,
  anchorGalaxyIds: string[]
): boolean {
  for (const anchorId of anchorGalaxyIds) {
    const covered = galaxiesInAnchorRadius(anchorId);
    if (covered.some((g) => g.id === galaxyId)) return true;
  }
  return false;
}

/** Cost (in Singularity Cores) to close a rift — scales with severity. */
export function riftCloseCost(severity: number): number {
  return RIFT_CLOSE_BASE_COST * Math.max(1, Math.floor(severity));
}

/** Cost (in Singularity Cores) to place the next anchor — scales with # already placed. */
export function anchorPlaceCost(anchorsAlreadyPlaced: number): number {
  return ANCHOR_PLACE_BASE_COST * (1 + Math.max(0, anchorsAlreadyPlaced));
}

/** Cost (in Faith) to attack a new neutral galaxy — scales with new systems claimed. */
export function newGalaxyAttackCost(newSystemsClaimed: number): number {
  return Math.ceil(50 * Math.pow(1.05, newSystemsClaimed));
}

/** True when L6 completion conditions are met (closes 20 rifts + places 10 anchors). */
export function isUniversalMapComplete(riftsClosed: number, anchorsPlaced: number): boolean {
  return riftsClosed >= RIFTS_REQUIRED_FOR_L7 && anchorsPlaced >= ANCHORS_REQUIRED_FOR_L7;
}

// ----- Runtime state (stored on GameState) -----

export interface UniversalGalaxyState {
  id: string;
  /** Owner at runtime — may shift from "neutral" to "player" as you conquer systems. */
  ownerId: string;
  /** Number of systems you've claimed from this galaxy (0..systemCount). */
  systemsClaimed: number;
  /** Heresy level (0-100) — applied by open rifts; triggers L5 heresy loss rules at 100. */
  heresy: number;
  /** Whether this galaxy has an anchor placed on it. */
  anchored: boolean;
}

export interface Rift {
  id: string;
  galaxyId: string;
  /** 1-5 — scales close cost + corruption spread rate. */
  severity: number;
  /** Game-time the rift spawned (for age display). */
  spawnedAt: number;
}

export interface RealityAnchor {
  id: string;
  galaxyId: string;
  placedAt: number;
}

/** Fresh universal-galaxy state — every galaxy starts unclaimed (player owns 0 systems
 *  except the starter, where they own all 100 — but L6 doesn't track systemsClaimed
 *  for the starter galaxy since it's already the player's). Anchored=false, heresy=0. */
export function makeInitialUniversalGalaxies(): UniversalGalaxyState[] {
  return UNIVERSAL_GALAXIES.map((g) => ({
    id: g.id,
    ownerId: g.ownerId,
    systemsClaimed: g.ownerId === "player" ? g.systemCount : 0,
    heresy: 0,
    anchored: false,
  }));
}

/** Total new-L6 systems claimed across all 40 new galaxies (drives world bonus). */
export function totalNewSystemsClaimed(states: UniversalGalaxyState[]): number {
  const map = Object.fromEntries(states.map((s) => [s.id, s]));
  let total = 0;
  for (const g of UNIVERSAL_GALAXIES) {
    if (!g.isNewL6) continue;
    const st = map[g.id];
    if (st) total += Math.max(0, Math.min(g.systemCount, st.systemsClaimed));
  }
  return total;
}

/** Total rival-L5 systems claimed across the 9 rival galaxies (drives world bonus). */
export function totalRivalSystemsClaimed(states: UniversalGalaxyState[]): number {
  const map = Object.fromEntries(states.map((s) => [s.id, s]));
  let total = 0;
  for (const g of UNIVERSAL_GALAXIES) {
    if (g.isNewL6) continue;
    if (g.ownerId === "player") continue; // skip starter
    const st = map[g.id];
    if (st) total += Math.max(0, Math.min(g.systemCount, st.systemsClaimed));
  }
  return total;
}

/** Total systems claimed across the entire universe (for the sidebar display). */
export function totalUniversalSystemsClaimed(states: UniversalGalaxyState[]): number {
  const map = Object.fromEntries(states.map((s) => [s.id, s]));
  let total = 0;
  for (const g of UNIVERSAL_GALAXIES) {
    const st = map[g.id];
    if (st) total += Math.max(0, Math.min(g.systemCount, st.systemsClaimed));
  }
  return total;
}

/** Galaxies (with state) that have at least one active rift — for the UI pulse indicators. */
export function galaxyIdsWithRifts(rifts: Rift[]): Set<string> {
  return new Set(rifts.map((r) => r.galaxyId));
}

/** Pick a random unanchored galaxy id for rift spawning (falls back to anchored ones if all covered). */
export function pickRiftSpawnTarget(
  states: UniversalGalaxyState[],
  rng: () => number
): string | null {
  const unanchored = states.filter((s) => !s.anchored);
  const pool = unanchored.length > 0 ? unanchored : states;
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)].id;
}

// Avoid unused-import lint warnings for type-only re-exports.
export type { RivalGalaxy };
