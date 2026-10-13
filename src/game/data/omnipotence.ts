// ===========================================================================
// LAYER 7 — OMNIPOTENCE (BIO-ENGINEERING)
// ===========================================================================
// The god now CREATES life rather than guiding it. The DNA Splicer becomes a
// "Creation Lab" where you design custom creatures to fight the Old Gods.
// Each creature has a body type, diet, habitat, and special ability. Combine
// up to 5 creatures into a Legion — an army that fights Old God forces in
// Layer 9. Instability becomes genetic instability: at 100, creatures mutate
// or go rogue. Peak instability ≥ 80 unlocks Layer 8 (Divinity).
// ===========================================================================

// ----- Creature Body Types (6) -----
// Each body type determines base attack/defense/speed and a habitat affinity.
export type CreatureBodyTypeId =
  | "predator"
  | "grazer"
  | "flyer"
  | "swimmer"
  | "burrower"
  | "psionic";

export interface CreatureBodyType {
  id: CreatureBodyTypeId;
  name: string;
  icon: string;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  habitat: string; // preferred habitat
  desc: string;
}

export const CREATURE_BODY_TYPES: CreatureBodyType[] = [
  { id: "predator", name: "Predator", icon: "🐅", baseAttack: 30, baseDefense: 15, baseSpeed: 20, habitat: "land", desc: "Clawed hunter. High attack, balanced defense." },
  { id: "grazer", name: "Grazer", icon: "🦌", baseAttack: 8, baseDefense: 35, baseSpeed: 12, habitat: "land", desc: "Armored herd beast. High defense, low attack." },
  { id: "flyer", name: "Flyer", icon: "🦅", baseAttack: 18, baseDefense: 8, baseSpeed: 40, habitat: "air", desc: "Winged scout. Very high speed, fragile." },
  { id: "swimmer", name: "Swimmer", icon: "🐙", baseAttack: 22, baseDefense: 18, baseSpeed: 25, habitat: "water", desc: "Amphibious tentacled form. Balanced in water." },
  { id: "burrower", name: "Burrower", icon: "🦂", baseAttack: 15, baseDefense: 25, baseSpeed: 10, habitat: "underground", desc: "Subterranean lurker. High defense, slow." },
  { id: "psionic", name: "Psionic", icon: "🧠", baseAttack: 35, baseDefense: 5, baseSpeed: 18, habitat: "void", desc: "Mind-reacher. Devastating attack, paper-thin defense." },
];

export const CREATURE_BODY_TYPE_MAP: Record<CreatureBodyTypeId, CreatureBodyType> = Object.fromEntries(
  CREATURE_BODY_TYPES.map((t) => [t.id, t])
) as Record<CreatureBodyTypeId, CreatureBodyType>;

// ----- Creature Diets (4) -----
export type CreatureDietId = "carnivore" | "herbivore" | "omnivore" | "void_eater";

export interface CreatureDiet {
  id: CreatureDietId;
  name: string;
  icon: string;
  attackBonus: number;
  instabilityBonus: number; // extra instability per second while equipped
  desc: string;
}

export const CREATURE_DIETS: CreatureDiet[] = [
  { id: "carnivore", name: "Carnivore", icon: "🥩", attackBonus: 8, instabilityBonus: 0.01, desc: "+8 attack. Meat-hunter." },
  { id: "herbivore", name: "Herbivore", icon: "🌿", attackBonus: 0, instabilityBonus: 0, desc: "+0 attack, +0 instability. Calm and reliable." },
  { id: "omnivore", name: "Omnivore", icon: "🍃", attackBonus: 4, instabilityBonus: 0.02, desc: "+4 attack. Adaptable eater." },
  { id: "void_eater", name: "Void Eater", icon: "🌑", attackBonus: 18, instabilityBonus: 0.06, desc: "+18 attack. Devours reality itself — unstable." },
];

export const CREATURE_DIET_MAP: Record<CreatureDietId, CreatureDiet> = Object.fromEntries(
  CREATURE_DIETS.map((d) => [d.id, d])
) as Record<CreatureDietId, CreatureDiet>;

// ----- Creature Special Abilities (6) -----
export type CreatureSpecialId =
  | "regen"
  | "berserk"
  | "shield"
  | "swarm"
  | "venom"
  | "phase";

export interface CreatureSpecial {
  id: CreatureSpecialId;
  name: string;
  icon: string;
  desc: string;
  defenseBonus: number;
  speedBonus: number;
  attackMult: number; // multiplies base attack
}

export const CREATURE_SPECIALS: CreatureSpecial[] = [
  { id: "regen", name: "Regeneration", icon: "💚", desc: "Heals 1 HP/sec in battle.", defenseBonus: 6, speedBonus: 0, attackMult: 1 },
  { id: "berserk", name: "Berserk", icon: "🔥", desc: "+50% attack in battle.", defenseBonus: 0, speedBonus: 0, attackMult: 1.5 },
  { id: "shield", name: "Carapace Shield", icon: "🛡️", desc: "+12 defense in battle.", defenseBonus: 12, speedBonus: 0, attackMult: 1 },
  { id: "swarm", name: "Swarm Tactics", icon: "🐝", desc: "+15 speed; coordinated strikes.", defenseBonus: 0, speedBonus: 15, attackMult: 1.1 },
  { id: "venom", name: "Venom Glands", icon: "🧪", desc: "Damages over time; +20% attack.", defenseBonus: 0, speedBonus: 0, attackMult: 1.2 },
  { id: "phase", name: "Phase Shift", icon: "🌀", desc: "Doubles speed; elusive.", defenseBonus: 0, speedBonus: 30, attackMult: 1 },
];

export const CREATURE_SPECIAL_MAP: Record<CreatureSpecialId, CreatureSpecial> = Object.fromEntries(
  CREATURE_SPECIALS.map((s) => [s.id, s])
) as Record<CreatureSpecialId, CreatureSpecial>;

// ----- Creature instance -----
export interface Creature {
  id: string;          // unique instance id
  name: string;
  bodyType: CreatureBodyTypeId;
  diet: CreatureDietId;
  special: CreatureSpecialId;
  attack: number;
  defense: number;
  speed: number;
  createdAt: number;  // game-time of creation
  // FEATURE 7 — Mutations: 10% chance on creation; mutated creatures are 50% stronger (+50% to all stats) and add +20% instability
  mutated?: boolean;
  mutatedStat?: "attack" | "defense" | "speed";
}

// ----- Legion (army of creatures) -----
// Up to 5 creatures per legion. A legion's power = sum of attack + defense + speed.
export interface Legion {
  id: string;
  name: string;
  creatureIds: string[]; // up to 5
  deployed: boolean;     // true when sent to a battle in Layer 9
}

export const LEGION_MAX_CREATURES = 5;

// ----- Stances (3) — preserved for instability scaling -----
// Each stance multiplies the genetic instability rate (and bonus magnitude).
export type OmnipotenceStanceId = "contained" | "balanced" | "embraced";

export interface OmnipotenceStance {
  id: OmnipotenceStanceId;
  name: string;
  icon: string;
  desc: string;
  instabilityMult: number;
  bonusMult: number;
}

export const OMNIPOTENCE_STANCES: OmnipotenceStance[] = [
  { id: "contained", name: "Contained", icon: "🛡️", desc: "Gene-lock the strains. 0.5× instability, 0.5× bonuses.", instabilityMult: 0.5, bonusMult: 0.5 },
  { id: "balanced", name: "Balanced", icon: "⚖️", desc: "Stable hybridization. Normal instability, normal bonuses.", instabilityMult: 1.0, bonusMult: 1.0 },
  { id: "embraced", name: "Embraced", icon: "🔥", desc: "Let the strands mutate. 1.5× instability, 2× bonuses.", instabilityMult: 1.5, bonusMult: 2.0 },
];

export const OMNIPOTENCE_STANCE_MAP: Record<OmnipotenceStanceId, OmnipotenceStance> = Object.fromEntries(
  OMNIPOTENCE_STANCES.map((s) => [s.id, s])
) as Record<OmnipotenceStanceId, OmnipotenceStance>;

// ----- Instability -----
// Genetic instability accrues from equipped creatures. At 100, creatures go
// rogue and raid the player's galaxies (lose a random claimed system + reset
// instability to 50). Base rate 0.3/s before creature/stance multipliers.
// L7 → L8 unlock: repel OUTPOST_RAID_COUNT_FOR_L8 outpost raids.
export const BASE_INSTABILITY_RATE = 0.3;
export const OMNIPOTENCE_COMPLETE_PEAK = 80;
export const INSTABILITY_ROGUE_THRESHOLD = 100;
export const INSTABILITY_AFTER_ROGUE = 50;

// ----- Skirmish Arena (L7 Outpost Raids) -----
// 5 minor Old-God outposts harass the player's galaxies. Repelling 10 raids
// completes L7 and unlocks L8 (Divine Alliance). Each victory grants 1 Divine
// Fragment and 20 XP per deployed creature.
export const OUTPOST_RAID_COUNT_FOR_L8 = 10;
export const CREATURE_XP_PER_LEVEL = 100;   // each level needs 100 XP
export const CREATURE_XP_PER_RAID = 20;     // each raid gives 20 XP per deployed creature
export const OUTPOST_RAID_SPAWN_INTERVAL_SEC = 120;
export const MAX_ACTIVE_OUTPOST_RAIDS = 3;

export type OutpostRaidStatus = "active" | "won" | "lost";

export interface OutpostRaidDef {
  id: string;
  name: string;
  icon: string;
  hp: number;
  attack: number;
  defense: number;
  reward: { fragments: number };
  desc: string;
}

export const OUTPOST_RAIDS: OutpostRaidDef[] = [
  { id: "outpost_voidscout", name: "Void Scout",   icon: "👁️", hp: 80,  attack: 12, defense: 4,  reward: { fragments: 1 }, desc: "A lone eye of the Old Gods probing your frontier systems." },
  { id: "outpost_huskpack",  name: "Husk Pack",    icon: "🦴", hp: 110, attack: 16, defense: 8,  reward: { fragments: 1 }, desc: "Shambling husks of dead stars, drawn to your worlds." },
  { id: "outpost_tendril",  name: "Tendril Brood", icon: "🪼", hp: 140, attack: 20, defense: 6,  reward: { fragments: 1 }, desc: "A pseudopod of the Old God, tasting your galaxies." },
  { id: "outpost_whisper",  name: "Whisper Vanguard", icon: "🜂", hp: 170, attack: 24, defense: 10, reward: { fragments: 1 }, desc: "Ahead of the main host — turns faithful against each other." },
  { id: "outpost_eclipse",  name: "Eclipse Harbinger", icon: "🌑", hp: 220, attack: 30, defense: 14, reward: { fragments: 1 }, desc: "A herald that snuffs suns; tougher than the others." },
];

export const OUTPOST_RAID_MAP: Record<string, OutpostRaidDef> = Object.fromEntries(
  OUTPOST_RAIDS.map((r) => [r.id, r])
);

/** Runtime state for one outpost raid (active or completed). */
export interface OutpostRaid {
  id: string;            // unique raid instance id
  outpostDef: string;   // id into OUTPOST_RAID_MAP
  status: OutpostRaidStatus;
  bossHp: number;
  bossMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  turn: number;
  log: string[];
  deployedLegionIds: string[];
}

/**
 * Returns the level of a creature given the persisted levels map. Level 1 baseline.
 */
export function creatureLevel(
  creatureId: string,
  levels: Record<string, number> | null | undefined
): number {
  if (!levels) return 1;
  const lvl = levels[creatureId];
  return lvl && lvl > 0 ? lvl : 1;
}

/**
 * Per-level stat multiplier: +10% attack/defense/speed per level above 1.
 * `creatureLevelBonus(1)` returns 1× on everything.
 */
export function creatureLevelBonus(level: number): {
  attackMult: number;
  defenseMult: number;
  speedMult: number;
} {
  const m = 1 + Math.max(0, level - 1) * 0.1;
  return { attackMult: m, defenseMult: m, speedMult: m };
}

/**
 * Returns the player's total raid power for an outpost raid (with level bonus).
 */
export function raidDeployedPower(
  raid: OutpostRaid,
  legions: Array<Legion>,
  creatures: Array<Creature>,
  levels: Record<string, number> | null | undefined
): { attack: number; defense: number; speed: number; count: number } {
  const deployed = new Set<string>();
  for (const lid of raid.deployedLegionIds) {
    const legion = legions.find((l) => l.id === lid);
    if (!legion) continue;
    for (const cid of legion.creatureIds) deployed.add(cid);
  }
  let attack = 0;
  let defense = 0;
  let speed = 0;
  let count = 0;
  for (const c of creatures) {
    if (!deployed.has(c.id)) continue;
    const lvl = creatureLevel(c.id, levels);
    const bonus = creatureLevelBonus(lvl);
    attack += c.attack * bonus.attackMult;
    defense += c.defense * bonus.defenseMult;
    speed += c.speed * bonus.speedMult;
    count += 1;
  }
  return { attack, defense, speed, count };
}

// ----- Helpers -----

/**
 * Compute the stats for a newly-designed creature from its body/diet/special.
 */
export function computeCreatureStats(
  bodyType: CreatureBodyTypeId,
  diet: CreatureDietId,
  special: CreatureSpecialId
): { attack: number; defense: number; speed: number } {
  const body = CREATURE_BODY_TYPE_MAP[bodyType];
  const dietDef = CREATURE_DIET_MAP[diet];
  const specialDef = CREATURE_SPECIAL_MAP[special];
  const attack = Math.round((body.baseAttack + dietDef.attackBonus) * specialDef.attackMult);
  const defense = body.baseDefense + specialDef.defenseBonus;
  const speed = body.baseSpeed + specialDef.speedBonus;
  return { attack, defense, speed };
}

/**
 * Returns the per-second instability contribution of a single creature.
 */
export function creatureInstabilityPerSec(creature: Creature): number {
  const dietDef = CREATURE_DIET_MAP[creature.diet];
  // Psionic + void_eater combinations are most unstable
  const bodyMult = creature.bodyType === "psionic" ? 1.5 : 1;
  // FEATURE 7 — Mutated creatures add +20% to instability
  const mutationMult = creature.mutated ? 1.2 : 1;
  return (0.02 + dietDef.instabilityBonus) * bodyMult * mutationMult;
}

/**
 * Aggregated instability/sec from all creatures across all legions.
 * (A creature is "active" if it belongs to any legion.)
 */
export function legionInstabilityPerSec(
  creatures: Array<Creature>,
  legions: Array<Legion>
): number {
  const activeIds = new Set<string>();
  for (const l of legions) {
    for (const id of l.creatureIds) activeIds.add(id);
  }
  let total = 0;
  for (const c of creatures) {
    if (activeIds.has(c.id)) total += creatureInstabilityPerSec(c);
  }
  return total;
}

/**
 * Aggregated production/etc. bonus from the active legion.
 * Each active creature grants: +1% production, +0.5% cap, +0.3% EP, +0.5% pop.
 * Stance multiplies these bonuses.
 */
export function legionBonus(
  creatures: Array<Creature>,
  legions: Array<Legion>,
  stanceId: OmnipotenceStanceId | string | null | undefined
): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  instabilityPerSec: number;
} {
  const stance =
    stanceId && OMNIPOTENCE_STANCE_MAP[stanceId as OmnipotenceStanceId]
      ? OMNIPOTENCE_STANCE_MAP[stanceId as OmnipotenceStanceId]
      : OMNIPOTENCE_STANCE_MAP.balanced;
  const activeIds = new Set<string>();
  for (const l of legions) {
    for (const id of l.creatureIds) activeIds.add(id);
  }
  let activeCount = 0;
  let instabilityPerSec = 0;
  for (const c of creatures) {
    if (!activeIds.has(c.id)) continue;
    activeCount += 1;
    instabilityPerSec += creatureInstabilityPerSec(c);
  }
  return {
    productionMult: activeCount * 0.01 * stance.bonusMult,
    capMult: activeCount * 0.005 * stance.bonusMult,
    epMult: activeCount * 0.003 * stance.bonusMult,
    popGrowthMult: activeCount * 0.005 * stance.bonusMult,
    instabilityPerSec,
  };
}

/**
 * Multiplier applied to the base instability rate given the active stance.
 */
export function instabilityRateMult(
  stanceId: OmnipotenceStanceId | string | null | undefined
): number {
  if (!stanceId) return 1;
  const stance = OMNIPOTENCE_STANCE_MAP[stanceId as OmnipotenceStanceId];
  return stance ? stance.instabilityMult : 1;
}

/**
 * Returns the effective instability gain rate (per second) for the current
 * creatures + legions + stance. Includes the base rate.
 */
export function effectiveInstabilityRate(
  creatures: Array<Creature>,
  legions: Array<Legion>,
  stanceId: OmnipotenceStanceId | string | null | undefined
): number {
  const { instabilityPerSec } = legionBonus(creatures, legions, stanceId);
  return (BASE_INSTABILITY_RATE + instabilityPerSec) * instabilityRateMult(stanceId);
}

/**
 * Layer 8 (Divinity) unlock: repel OUTPOST_RAID_COUNT_FOR_L8 outpost raids
 * (with 0 losses). Replaces the old peak-instability gate.
 */
export function isOmnipotenceComplete(raidsRepelled: number): boolean {
  return raidsRepelled >= OUTPOST_RAID_COUNT_FOR_L8;
}

/**
 * Returns the total power of a legion (used by Layer 9 battles).
 */
export function legionPower(
  legion: Legion,
  creatures: Array<Creature>
): { attack: number; defense: number; speed: number; count: number } {
  const ids = new Set(legion.creatureIds);
  let attack = 0;
  let defense = 0;
  let speed = 0;
  let count = 0;
  for (const c of creatures) {
    if (!ids.has(c.id)) continue;
    attack += c.attack;
    defense += c.defense;
    speed += c.speed;
    count += 1;
  }
  return { attack, defense, speed, count };
}
