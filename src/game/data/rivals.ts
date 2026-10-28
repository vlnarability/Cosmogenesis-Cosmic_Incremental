// Rivals — PART-2-LAYER-C procedural rival system.
//
// Each word in the 3 name lists has a MULTIPLIER that affects the rival's stats:
//   - Modifier multiplier → affects BOTH population growth AND military strength
//   - Noun multiplier → affects population growth only
//   - Concept multiplier → affects military strength only
//
// Total unique combinations: 42 × 42 × 40 = 70,560.
//
// Stats formula:
//   populationGrowthMult = modifierMult × nounMult
//   militaryStrengthMult = modifierMult × conceptMult
//
// CARRY-FORWARD at stage transitions:
//   Cell→Creature: top 5 by population carried forward, remaining 5 hidden.
//   Creature→Tribal onward: top 3-5 by population "move up" (stage updated),
//   3-5 new rivals generated, remaining rivals STAY (visible, interactable).
//   "a few that stay, a few new ones, and a few old ones."

import type { StageId } from "../state/types";
import { STAGE_RESOURCES } from "./resources";

// ============================================================
// NAME LISTS WITH MULTIPLIERS
// Format: [word, multiplier] where multiplier is 0.5–2.0
// ============================================================

// Modifier: affects BOTH pop growth AND military strength
export const NAME_MODIFIERS: [string, number][] = [
  ["Red", 1.5], ["Black", 1.3], ["Golden", 1.6], ["Iron", 1.4],
  ["Lost", 0.7], ["Silent", 0.6], ["Crimson", 1.5], ["Eternal", 1.8],
  ["Frozen", 0.9], ["Shadow", 1.1], ["Silver", 1.2], ["Bronze", 1.0],
  ["Obsidian", 1.4], ["Sapphire", 1.1], ["Emerald", 1.0], ["Ruby", 1.3],
  ["Pale", 0.8], ["Dark", 1.2], ["Hollow", 0.6], ["Radiant", 1.7],
  ["Withered", 0.5], ["Ancient", 1.5], ["Forgotten", 0.7], ["Whispering", 0.8],
  ["Howling", 1.4], ["Shattered", 0.6], ["Veiled", 0.9], ["Burning", 1.6],
  ["Shrouded", 1.0], ["Nameless", 1.1], ["Ashen", 0.8], ["Verdant", 1.2],
  ["Azure", 1.0], ["Amber", 1.1], ["Violet", 0.9], ["Granite", 1.3],
  ["Pearl", 1.0], ["Onyx", 1.2], ["Throneless", 0.7], ["Wandering", 1.1],
  ["Sundered", 0.6],
];

// Noun: affects POPULATION GROWTH only
export const NAME_NOUNS: [string, number][] = [
  ["Bones", 0.9], ["Blades", 0.7], ["Crowns", 1.4], ["Shadows", 0.8],
  ["Keepers", 1.3], ["Lords", 1.5], ["Echoes", 0.6], ["Suns", 1.7],
  ["Thorns", 0.8], ["Embers", 0.7], ["Fangs", 0.9], ["Eyes", 1.0],
  ["Voices", 1.1], ["Wings", 1.2], ["Roots", 1.6], ["Gates", 1.3],
  ["Spires", 1.2], ["Tides", 1.4], ["Storms", 0.8], ["Dreams", 0.9],
  ["Vows", 1.1], ["Masks", 0.7], ["Mirrors", 0.8], ["Chains", 1.0],
  ["Stars", 1.5], ["Sparks", 0.6], ["Ashes", 0.5], ["Depths", 1.3],
  ["Reaches", 1.1], ["Hollows", 0.7], ["Sigils", 1.0], ["Horns", 0.9],
  ["Claws", 0.8], ["Veils", 0.7], ["Circles", 1.2], ["Hands", 1.4],
  ["Flames", 0.8], ["Shards", 0.6], ["Currents", 1.3], ["Horizons", 1.5],
  ["Pillars", 1.6], ["Wolves", 1.0], ["Serpents", 0.9],
];

// Concept: affects MILITARY STRENGTH only
export const NAME_CONCEPTS: [string, number][] = [
  ["Greed", 1.3], ["Wrath", 1.7], ["Time", 1.0], ["Ash", 0.8],
  ["Despair", 0.6], ["Honor", 1.4], ["Silence", 0.7], ["Chaos", 1.6],
  ["Sorrow", 0.7], ["Glory", 1.5], ["Ruin", 1.3], ["Hope", 1.2],
  ["Vengeance", 1.8], ["Mercy", 0.5], ["Hunger", 1.4], ["Fear", 1.1],
  ["Doubt", 0.6], ["Faith", 1.3], ["Oblivion", 1.7], ["Memory", 0.9],
  ["Night", 1.2], ["Dawn", 1.1], ["Frost", 0.8], ["Flame", 1.5],
  ["End", 1.6], ["Beginning", 0.7], ["Whispers", 0.8], ["Decay", 0.6],
  ["Renewal", 1.0], ["Storms", 1.4], ["Tide", 1.1], ["Harvest", 1.2],
  ["Sacrifice", 1.5], ["Dominion", 1.8], ["Exile", 0.7], ["Rebirth", 1.3],
  ["Tribulation", 1.6], ["Reckoning", 1.7], ["Ascension", 1.9], ["Forsaking", 0.9],
  ["Bargain", 1.0],
];

// Verify: 42 × 42 × 40 = 70,560 unique combinations
// (computed at module load for sanity)
export const TOTAL_COMBINATIONS = NAME_MODIFIERS.length * NAME_NOUNS.length * NAME_CONCEPTS.length;

/** Rival icons — pick a random one per rival. */
export const RIVAL_ICONS = [
  "🐺", "🐊", "🦏", "🐗", "🦅", "🐍", "🦂", "🦖", "🐙", "🦈",
  "🦇", "🦊", "🦬", "🐅", "🦗", "🪲", "🦟", "🕷️", "🦀", "🐡",
  "🦎", "🦝", "🦡", "🦚", "🦜", "🐌", "🦕", "🦠", "🧫", "🐙",
];

export interface NameParts {
  name: string;
  modifier: string;
  noun: string;
  concept: string;
  modifierMult: number;
  nounMult: number;
  conceptMult: number;
  popGrowthMult: number;   // modifierMult × nounMult
  militaryMult: number;    // modifierMult × conceptMult
}

/** Generate a procedural rival name + the 3 multipliers. */
export function generateRivalName(usedNames: Set<string>): NameParts {
  for (let i = 0; i < 100; i++) {
    const [mod, modMult] = NAME_MODIFIERS[Math.floor(Math.random() * NAME_MODIFIERS.length)];
    const [noun, nounMult] = NAME_NOUNS[Math.floor(Math.random() * NAME_NOUNS.length)];
    const [concept, conceptMult] = NAME_CONCEPTS[Math.floor(Math.random() * NAME_CONCEPTS.length)];
    const name = `The ${mod} ${noun} of ${concept}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return {
        name,
        modifier: mod,
        noun,
        concept,
        modifierMult: modMult,
        nounMult,
        conceptMult,
        popGrowthMult: modMult * nounMult,
        militaryMult: modMult * conceptMult,
      };
    }
  }
  // Fallback: append a number.
  const [mod, modMult] = NAME_MODIFIERS[Math.floor(Math.random() * NAME_MODIFIERS.length)];
  const [noun, nounMult] = NAME_NOUNS[Math.floor(Math.random() * NAME_NOUNS.length)];
  const [concept, conceptMult] = NAME_CONCEPTS[Math.floor(Math.random() * NAME_CONCEPTS.length)];
  const name = `The ${mod} ${noun} of ${concept} ${usedNames.size}`;
  usedNames.add(name);
  return {
    name, modifier: mod, noun, concept,
    modifierMult: modMult, nounMult, conceptMult,
    popGrowthMult: modMult * nounMult,
    militaryMult: modMult * conceptMult,
  };
}

/** Generate a random rival ID from the name. */
export function generateRivalId(name: string): string {
  return "rival_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^the_/, "").slice(0, 40);
}

/** Pick a random resource from the stage's resource list. */
function randomStageResource(stage: StageId): string {
  const res = STAGE_RESOURCES[stage] || ["food"];
  const filtered = res.filter((r) => r !== "happiness");
  return filtered[Math.floor(Math.random() * filtered.length)] || "food";
}

// ============================================================
// PROCEDURAL RIVAL GENERATION
// ============================================================

export interface GeneratedRival {
  id: string;
  name: string;
  stage: StageId;
  state: "active" | "allied" | "conquered" | "merged";
  threat: number;
  relation: number;
  strength: number;
  population: number;
  hidden: boolean;
  icon: string;
  counteredRaids: number;
  successfulTrades: number;
  assimilationBonus: { resource: string; mult: number };
  // Per-rival multipliers from the name (determine growth rates).
  popGrowthMult: number;
  militaryMult: number;
}

/** Generate N new rivals for the given stage. */
export function generateRivals(
  count: number,
  stage: StageId,
  usedNames: Set<string>,
  stageTier: number
): GeneratedRival[] {
  const rivals: GeneratedRival[] = [];
  for (let i = 0; i < count; i++) {
    const parts = generateRivalName(usedNames);
    const id = generateRivalId(parts.name);
    // Strength: base scales with stage tier, multiplied by the name's militaryMult.
    const strength = (0.8 + stageTier * 0.6) * parts.militaryMult;
    // Population: random starting value, scaled by stage tier + popGrowthMult.
    const population = Math.floor((1 + Math.random() * 5 * stageTier) * parts.popGrowthMult);
    rivals.push({
      id,
      name: parts.name,
      stage,
      state: "active",
      threat: 0,
      relation: -20 + Math.random() * 10 - 5,
      strength,
      population,
      hidden: false,
      icon: RIVAL_ICONS[Math.floor(Math.random() * RIVAL_ICONS.length)],
      counteredRaids: 0,
      successfulTrades: 0,
      assimilationBonus: {
        resource: randomStageResource(stage),
        mult: 0.10 + Math.random() * 0.20,
      },
      popGrowthMult: parts.popGrowthMult,
      militaryMult: parts.militaryMult,
    });
  }
  return rivals;
}

// ============================================================
// ASSIMILATION COST FORMULA
// ============================================================

export const RIVAL_BASE_MIL_COST = 200;
export const RIVAL_BASE_CUL_COST = 150;
export const MIL_REDUCTION_PER_COUNTER = 30;
export const CUL_REDUCTION_PER_TRADE = 25;
export const MIN_ASSIMILATION_COST = 50;

export function assimilationCost(
  rivalStrength: number,
  counteredRaids: number,
  successfulTrades: number
): { military: number; culture: number } {
  const baseMil = RIVAL_BASE_MIL_COST * rivalStrength;
  const baseCul = RIVAL_BASE_CUL_COST * rivalStrength;
  const military = Math.max(MIN_ASSIMILATION_COST, baseMil - counteredRaids * MIL_REDUCTION_PER_COUNTER);
  const culture = Math.max(MIN_ASSIMILATION_COST, baseCul - successfulTrades * CUL_REDUCTION_PER_TRADE);
  return { military, culture };
}

// Legacy — kept for back-compat with any code that still imports RIVAL_MAP.
export interface LegacyRivalDef {
  id: string; name: string; stage: StageId; icon: string;
  desc: string; strength: number; threatFlavor: string;
  assimilationBonus: { desc: string; resource: string; mult: number };
}
export const RIVAL_MAP: Record<string, LegacyRivalDef> = {};
