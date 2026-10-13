// ===========================================================================
// LAYER 5 — GALACTIC CONQUEST (Galaxies)
// ===========================================================================
// Defines the L5 galaxy roster: 1 starter (the player's L4 home galaxy — 50
// systems from galaxyMap.ts) + 9 rival galaxies totaling EXACTLY 500 rival
// star systems (each galaxy has 10-100 systems). The player attacks rival
// galaxies by spending Faith to claim their systems one-by-one. Each claimed
// rival system grants +18 worlds to the Divine Engine (500 × 18 = 9,000 new
// worlds; combined with L4's 1,000 cap → 10,000 at L5).
//
// Conquering (fully claiming all systems in) 3 rival galaxies unlocks L6.
//
// This module is consumed by:
//   - L5 store/actions (attackGalaxy, convertFollower per-galaxy, etc.)
//   - L6 universalMap.ts (RIVAL_GALAXIES + RivalGalaxy type for the 10 L5
//     galaxies that anchor the L6 universal map)
//   - L5 ApotheosisModal.tsx (cosmic map UI)
//
// The public API is shared with the L6 universalMap module which expects:
//   - `RIVAL_GALAXIES` array (starter + rivals)
//   - `RivalGalaxy` type with fields: id, name, systemCount, ownerId, pos, tagline
// ===========================================================================

export type GalaxyOwnerId =
  | "player"
  | "rival_aetheris"
  | "rival_voidborn"
  | "rival_solkan"
  | "rival_nyxium"
  | "rival_helion"
  | "rival_umbra"
  | "rival_orion"
  | "rival_pulsar"
  | "rival_cinder"
  | "neutral";

export interface RivalGalaxy {
  /** Stable id, e.g. "galaxy_starter", "galaxy_aetheris". */
  id: string;
  /** Display name. */
  name: string;
  /** 0-100 relationship/hostility meter (0 = friendly, 100 = at war). Display-only flavor. */
  hostility: number;
  /** Total star systems in this galaxy. Starter = 50; rivals = 10-100 (summing to 500). */
  systemCount: number;
  /** Owner at fresh-start. */
  ownerId: GalaxyOwnerId;
  /** 2D position on the universal map (0-100 in each axis). */
  pos: { x: number; y: number };
  /** Short tagline for the UI. */
  tagline: string;
  /** Defense strength — scales Faith cost per attack. ~1.0 at 10 systems, ~2.4 at 100. */
  defenseStrength: number;
  /** Rival god name (display). */
  rivalGodName?: string;
}

// ----- Per-system runtime state (stored on GameState.galaxyRivalSystems) -----
export interface RivalSystemState {
  /** Stable id, e.g. "rsys_galaxy_aetheris_001". */
  id: string;
  /** Whether the player has claimed this system. */
  claimed: boolean;
  /** Whether this system has been scanned (revealed). */
  explored: boolean;
}

// ----- 10 starter + rival galaxies (the L5 roster) -----
// The player starts owning `galaxy_starter` (their home galaxy — the L4 50-hex
// spiral from galaxyMap.ts). The other 9 are rival gods each with their own
// galaxy. The L5 player attacks rival galaxies to claim their systems.
//
// Distribution of 500 rival systems across 9 rival galaxies, each within
// [10, 100]: 60+80+90+45+70+55+35+95+70 = 600. Hmm that's too high. Let me
// recalculate so it sums to exactly 500.
//   aetheris   50
//   voidborn   80
//   solkan     90
//   nyxium     45
//   helion     70
//   umbra      55
//   orion      35
//   pulsar     95
//   cinder     70  (wait, cinder is "neutral" in the original stub but here
//                   it's a rival we can conquer; treat it as a rival for L5)
//   ─────────────
//   total    590   ← still too high
//
// Recompute targeting exactly 500:
//   aetheris   50
//   voidborn   80
//   solkan     85
//   nyxium     40
//   helion     65
//   umbra      50
//   orion      35
//   pulsar     80
//   cinder     15  ← but cinder needs ≥ 10. Make it 15.
//   ─────────────
//   total    500  ✓
export const STARTER_GALAXY_ID = "galaxy_starter";

export const RIVAL_GALAXIES: RivalGalaxy[] = [
  {
    id: "galaxy_starter",
    name: "Aurora Galaxy",
    hostility: 0,
    systemCount: 50, // L4's 50-hex spiral — owned from the start
    ownerId: "player",
    pos: { x: 50, y: 50 },
    tagline: "Your home galaxy — 50 systems under your dominion.",
    defenseStrength: 0,
  },
  {
    id: "galaxy_aetheris",
    name: "Aetheris Veil",
    hostility: 35,
    systemCount: 50,
    ownerId: "rival_aetheris",
    pos: { x: 22, y: 30 },
    tagline: "A spectral empire that worships the spaces between stars.",
    defenseStrength: 1.0 + (50 - 10) / 45, // ≈ 1.89
    rivalGodName: "Azrael, the Iron Crown",
  },
  {
    id: "galaxy_voidborn",
    name: "Voidborn Expanse",
    hostility: 70,
    systemCount: 80,
    ownerId: "rival_voidborn",
    pos: { x: 78, y: 28 },
    tagline: "Born of the void — its fleets consume starlight itself.",
    defenseStrength: 1.0 + (80 - 10) / 45, // ≈ 2.56
    rivalGodName: "Vorlath, the Silent Void",
  },
  {
    id: "galaxy_solkan",
    name: "Solkan Dominion",
    hostility: 50,
    systemCount: 85,
    ownerId: "rival_solkan",
    pos: { x: 80, y: 72 },
    tagline: "A militant sun-cult that burns heretics in stellar furnaces.",
    defenseStrength: 1.0 + (85 - 10) / 45, // ≈ 2.67
    rivalGodName: "Mordrath, the Endless Hunger",
  },
  {
    id: "galaxy_nyxium",
    name: "Nyxium Cluster",
    hostility: 25,
    systemCount: 40,
    ownerId: "rival_nyxium",
    pos: { x: 30, y: 78 },
    tagline: "Quiet watchers — they trade more than they fight.",
    defenseStrength: 1.0 + (40 - 10) / 45, // ≈ 1.67
    rivalGodName: "Selket, Queen of Sands",
  },
  {
    id: "galaxy_helion",
    name: "Helion Forge",
    hostility: 60,
    systemCount: 65,
    ownerId: "rival_helion",
    pos: { x: 65, y: 18 },
    tagline: "Master shipwrights; their navy is the equal of any three rivals.",
    defenseStrength: 1.0 + (65 - 10) / 45, // ≈ 2.22
    rivalGodName: "Tarnel, the Forge Lord",
  },
  {
    id: "galaxy_umbra",
    name: "Umbra Reach",
    hostility: 45,
    systemCount: 50,
    ownerId: "rival_umbra",
    pos: { x: 15, y: 55 },
    tagline: "Shadowed worlds where faith is measured in whispers.",
    defenseStrength: 1.0 + (50 - 10) / 45, // ≈ 1.89
    rivalGodName: "Nyxos, the Veiled Watcher",
  },
  {
    id: "galaxy_orion",
    name: "Orion Spur",
    hostility: 15,
    systemCount: 35,
    ownerId: "rival_orion",
    pos: { x: 50, y: 88 },
    tagline: "A small young cluster — eager to ally, weak alone.",
    defenseStrength: 1.0 + (35 - 10) / 45, // ≈ 1.56
    rivalGodName: "Caelis, the Stormweaver",
  },
  {
    id: "galaxy_pulsar",
    name: "Pulsar Crown",
    hostility: 80,
    systemCount: 80,
    ownerId: "rival_pulsar",
    pos: { x: 88, y: 50 },
    tagline: "Rhythmic lighthouse of doom — its pulses silence whole systems.",
    defenseStrength: 1.0 + (80 - 10) / 45, // ≈ 2.56
    rivalGodName: "Pyrrha, the Ashen Mother",
  },
  {
    id: "galaxy_cinder",
    name: "Cinder Wastes",
    hostility: 55,
    systemCount: 15,
    ownerId: "rival_cinder",
    pos: { x: 38, y: 18 },
    tagline: "A dying rival galaxy — ripe for the taking.",
    defenseStrength: 1.0 + (15 - 10) / 45, // ≈ 1.11
    rivalGodName: "Eryx, the Glutton Sun",
  },
];

export const RIVAL_GALAXY_MAP: Record<string, RivalGalaxy> = Object.fromEntries(
  RIVAL_GALAXIES.map((g) => [g.id, g])
);

// Aliases kept for any caller expecting these names.
export const GALAXY_MAP: Record<string, RivalGalaxy> = RIVAL_GALAXY_MAP;
export const GALAXY_MAP_BY_ID: Record<string, RivalGalaxy> = RIVAL_GALAXY_MAP;

// ----- Public constants -----
export const TOTAL_L5_GALAXIES = RIVAL_GALAXIES.length; // 10

/** Total systems across the 9 rival galaxies (excluding the player's starter). */
export const TOTAL_RIVAL_SYSTEMS = RIVAL_GALAXIES
  .filter((g) => g.ownerId !== "player")
  .reduce((sum, g) => sum + g.systemCount, 0); // 50+80+85+40+65+50+35+80+15 = 500

/** Worlds added per rival-galaxy system claimed (used in the background sim formula). */
export const WORLDS_PER_RIVAL_SYSTEM = 18;
// Alias for callers expecting the L5-suffixed name.
export const WORLDS_PER_RIVAL_SYSTEM_L5 = WORLDS_PER_RIVAL_SYSTEM;

/** Total new worlds at L5 if the player claims every rival system. */
export const TOTAL_NEW_WORLDS_L5 = TOTAL_RIVAL_SYSTEMS * WORLDS_PER_RIVAL_SYSTEM; // 500 × 18 = 9000

/** Number of rival galaxies the player must fully conquer to unlock L6. */
export const GALAXIES_REQUIRED_FOR_L6 = 3;

// ----- Helpers -----

/** Build the per-system runtime state for a single rival galaxy (all unclaimed, unexplored). */
export function makeInitialRivalSystems(galaxyId: string): RivalSystemState[] {
  const g = RIVAL_GALAXY_MAP[galaxyId];
  const count = g?.systemCount ?? 50;
  const out: RivalSystemState[] = [];
  for (let i = 1; i <= count; i++) {
    out.push({
      id: `rsys_${galaxyId}_${String(i).padStart(3, "0")}`,
      claimed: false,
      explored: false,
    });
  }
  return out;
}

/**
 * Faith cost to launch one attack on a rival galaxy — claims the next
 * unclaimed system. Scales with the number of systems the player has already
 * claimed in this galaxy AND the galaxy's defenseStrength.
 *
 *   cost(claimed, defense) = ceil(BASE × (1 + claimed × STEP) × defense)
 *
 * where BASE = 50, STEP = 0.20. So:
 *   - Beachhead (0 claimed, defense 1.0) = 50 Faith
 *   - 10th system (9 claimed, defense 1.0) = 50 × 2.8 = 140 Faith
 *   - 100th system (99 claimed, defense 2.4) = 50 × 20.8 × 2.4 ≈ 2500 Faith
 *
 * For backwards compat with the L6 stub signature, calling with a single
 * number argument uses defenseStrength = 1.0.
 */
export function galaxyAttackCost(
  systemsClaimedInGalaxy: number,
  defenseStrength: number = 1.0,
): number {
  const BASE = 50;
  const STEP = 0.20;
  return Math.ceil(BASE * (1 + systemsClaimedInGalaxy * STEP) * Math.max(1, defenseStrength));
}

// Alias kept for any caller using the L5-suffixed attack-cost helper.
export const rivalAttackCost = galaxyAttackCost;

/** True if every system in the given galaxy has been claimed. */
export function isGalaxyConquered(
  galaxyId: string,
  galaxyRivalSystems: Record<string, RivalSystemState[]>,
): boolean {
  const g = RIVAL_GALAXY_MAP[galaxyId];
  if (!g) return false;
  if (g.ownerId === "player") return true; // starter galaxy is always "owned"
  const list = galaxyRivalSystems[galaxyId];
  if (!list || list.length !== g.systemCount) return false;
  return list.every((s) => s.claimed);
}

/** Count how many rival galaxies the player has fully conquered. */
export function countConqueredGalaxies(
  galaxyRivalSystems: Record<string, RivalSystemState[]>,
): number {
  let n = 0;
  for (const g of RIVAL_GALAXIES) {
    if (g.ownerId === "player") continue;
    if (isGalaxyConquered(g.id, galaxyRivalSystems)) n += 1;
  }
  return n;
}

/** Total claimed rival systems across all rival galaxies. */
export function countClaimedRivalSystems(
  galaxyRivalSystems: Record<string, RivalSystemState[]>,
): number {
  let n = 0;
  for (const g of RIVAL_GALAXIES) {
    if (g.ownerId === "player") continue;
    const list = galaxyRivalSystems[g.id] || [];
    for (const s of list) if (s.claimed) n += 1;
  }
  return n;
}

/** Worlds added to the Divine Engine per N claimed rival systems. */
export function rivalSystemWorlds(
  galaxyRivalSystems: Record<string, RivalSystemState[]>,
): number {
  return countClaimedRivalSystems(galaxyRivalSystems) * WORLDS_PER_RIVAL_SYSTEM;
}

// ----- Heresy severity -----

export type HeresySeverity = "calm" | "yellow" | "orange" | "red";

/** Returns the heresy severity tier for a heresy level 0-100. */
export function heresySeverity(heresy: number): HeresySeverity {
  if (heresy >= 75) return "red";
  if (heresy >= 50) return "orange";
  if (heresy >= 25) return "yellow";
  return "calm";
}

/** Number of systems a galaxy loses when its heresy reaches 100 (severity-based). */
export function heresyLossCount(heresy: number): number {
  const s = heresySeverity(heresy);
  if (s === "red") return 3;
  if (s === "orange") return 2;
  if (s === "yellow") return 1;
  return 0;
}

/** Average heresy across the player's owned galaxies (for the global display). */
export function averageHeresy(
  galaxyHeresy: Record<string, number>,
  ownedGalaxyIds: string[],
): number {
  if (ownedGalaxyIds.length === 0) return 0;
  let sum = 0;
  for (const gid of ownedGalaxyIds) sum += galaxyHeresy[gid] || 0;
  return sum / ownedGalaxyIds.length;
}

/** Galaxy ids the player "owns" — the starter + any rival galaxy with ≥1 claimed system. */
export function ownedGalaxyIds(
  galaxyRivalSystems: Record<string, RivalSystemState[]>,
): string[] {
  const out: string[] = [STARTER_GALAXY_ID];
  for (const g of RIVAL_GALAXIES) {
    if (g.ownerId === "player") continue;
    const list = galaxyRivalSystems[g.id] || [];
    if (list.some((s) => s.claimed)) out.push(g.id);
  }
  return out;
}

/** True if the player has claimed at least one system from a rival galaxy (legacy helper). */
export function hasClaimedRivalGalaxy(
  rivalSystemsClaimed: Record<string, number>,
): boolean {
  return Object.values(rivalSystemsClaimed || {}).some((n) => (n || 0) > 0);
}

// Sanity check: ensure the distribution produced exactly 500 rival systems.
// This runs at module load time (cheap — 9 galaxies).
if (TOTAL_RIVAL_SYSTEMS !== 500) {
  // eslint-disable-next-line no-console
  console.warn(
    `[galaxies.ts] Total rival systems = ${TOTAL_RIVAL_SYSTEMS}, expected 500. ` +
      `Distribution: ${RIVAL_GALAXIES.filter((g) => g.ownerId !== "player").map((g) => `${g.name}=${g.systemCount}`).join(", ")}`,
  );
}
