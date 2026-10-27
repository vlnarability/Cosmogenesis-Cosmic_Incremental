// Rivals — PART-2-LAYER-C foundation.
//
// NPC rival civilizations per stage. Each rival has a `state` that
// progresses: "active" → (counter-raid or trade or ally) → "conquered"
// or "merged" or "allied". Once resolved, the rival no longer threatens
// the player and the evolve gate (requiresRivalsResolved) is satisfied.
//
// ASSIMILATION MECHANICS (per user spec):
//   - Assimilation requires large amounts of military_power AND culture.
//   - Each countered raid decreases the military requirement.
//   - Each successful trade decreases the culture requirement.
//   Cost formula:
//     militaryCost = max(0, baseMilCost - counteredRaids * MIL_REDUCTION_PER_COUNTER)
//     cultureCost  = max(0, baseCulCost  - successfulTrades * CUL_REDUCTION_PER_TRADE)
//   Both must be met (player has enough of both resources) to assimilate.
//
// Rivals scale with the player's progress (strength field). Higher stages
// = stronger rivals = bigger base costs but also bigger rewards.

import type { StageId } from "../state/types";

export interface RivalDef {
  id: string;
  name: string;
  stage: StageId;
  icon: string;
  desc: string;
  /** Base strength — scales the assimilation cost + the raid severity.
   * Typically 1.0 at creature, scaling up to ~5.0 at galactic. */
  strength: number;
  /** Initial threat (0-100). Most rivals start at 0; some start higher
   * to pose an immediate threat. */
  initialThreat?: number;
  /** Initial relation (-100 to +100). Hostile rivals start negative. */
  initialRelation?: number;
  /** Flavor line shown on the Rivals tab when the rival is active. */
  threatFlavor: string;
  /** Bonus the player gets when the rival is assimilated. */
  assimilationBonus: {
    desc: string;
    /** Production multiplier applied to a specific resource. */
    resource: string;
    mult: number;
  };
}

export const RIVALS: RivalDef[] = [
  // ===== CREATURE — rival creature packs (Creature→Tribal gate) =====
  {
    id: "bone_fang_pack",
    name: "Bone-Fang Pack",
    stage: "creature",
    icon: "🐺",
    desc: "A rival predator pack that hunts the same grounds. They grow bolder with each moonless night.",
    strength: 1.0,
    threatFlavor: "Their scent-markers creep closer to your hunting grounds each day.",
    assimilationBonus: {
      desc: "+15% food production (absorbed hunting techniques)",
      resource: "food",
      mult: 0.15,
    },
  },
  {
    id: "tide_clan",
    name: "Tide Clan",
    stage: "creature",
    icon: "🐊",
    desc: "River-dwelling pack that claims the water's edge. Their songs carry threat at dusk.",
    strength: 1.1,
    threatFlavor: "Their fishing canoes block the river mouth at dawn.",
    assimilationBonus: {
      desc: "+15% water production (absorbed fishing techniques)",
      resource: "water",
      mult: 0.15,
    },
  },
  {
    id: "stone_pelt_tribe",
    name: "Stone-Pelt Tribe",
    stage: "creature",
    icon: "🦏",
    desc: "A thick-hided pack that prizes territory above all. They never retreat.",
    strength: 1.2,
    threatFlavor: "They mark stones at the boundary of your sleeping grounds.",
    assimilationBonus: {
      desc: "+10% materials production (absorbed gathering techniques)",
      resource: "materials",
      mult: 0.10,
    },
  },

  // ===== TRIBAL — rival tribes (still threaten during tribal stage) =====
  {
    id: "ash_raiders",
    name: "Ash Raiders",
    stage: "tribal",
    icon: "🔥",
    desc: "A nomadic war-band that burns what it cannot carry. They strike at harvest.",
    strength: 1.8,
    threatFlavor: "Smoke on the horizon — they're testing your perimeter.",
    assimilationBonus: {
      desc: "+20% military_power (absorbed warriors join your ranks)",
      resource: "military_power",
      mult: 0.20,
    },
  },
  {
    id: "iron_hill_folk",
    name: "Iron Hill Folk",
    stage: "tribal",
    icon: "⛏️",
    desc: "A mining tribe that hoards the best ore. They trade only at swordpoint.",
    strength: 2.0,
    threatFlavor: "Their scouts watch your forges from the ridgeline.",
    assimilationBonus: {
      desc: "+15% gold production (absorbed mining operations)",
      resource: "gold",
      mult: 0.15,
    },
  },

  // ===== CIVILIZATION — rival city-states =====
  {
    id: "crimson_legion",
    name: "Crimson Legion",
    stage: "civilization",
    icon: "🗡️",
    desc: "A militaristic city-state that fields standing armies. They demand tribute.",
    strength: 2.8,
    threatFlavor: "Their legions drill within sight of your walls.",
    assimilationBonus: {
      desc: "+25% military_power (absorbed legions + command structure)",
      resource: "military_power",
      mult: 0.25,
    },
  },
  {
    id: "azure_senate",
    name: "Azure Senate",
    stage: "civilization",
    icon: "🏛️",
    desc: "A republic of schemers. They prefer subversion to siege, but siege is not beneath them.",
    strength: 3.0,
    threatFlavor: "Their diplomats whisper in your senators' ears.",
    assimilationBonus: {
      desc: "+20% influence production (absorbed diplomatic corps)",
      resource: "influence",
      mult: 0.20,
    },
  },

  // ===== EMPIRE — rival empires (Empire→Solar gate) =====
  {
    id: "obsidian_dominion",
    name: "Obsidian Dominion",
    stage: "empire",
    icon: "🖤",
    desc: "A vast slave-empire whose roads are paved with conquest. They eye your borders.",
    strength: 3.8,
    threatFlavor: "Their border forts bristle with siege engines.",
    assimilationBonus: {
      desc: "+25% production (absorbed industrial capacity)",
      resource: "production",
      mult: 0.25,
    },
  },
  {
    id: "solar_pact",
    name: "Solar Pact",
    stage: "empire",
    icon: "☀️",
    desc: "A theocratic empire that worships the sun. Their inquisitors precede their armies.",
    strength: 4.0,
    threatFlavor: "Their missionaries preach revolt in your provinces.",
    assimilationBonus: {
      desc: "+20% science production (absorbed observatories)",
      resource: "science",
      mult: 0.20,
    },
  },

  // ===== SOLAR — rival stellar nations =====
  {
    id: "void_pirates",
    name: "Void Pirates",
    stage: "solar",
    icon: "🏴‍☠️",
    desc: "A decentralized fleet of raiders that strike from asteroid bases.",
    strength: 4.5,
    threatFlavor: "Their raiders harry your cargo ships at the system's edge.",
    assimilationBonus: {
      desc: "+20% alloys production (absorbed asteroid mining ops)",
      resource: "alloys",
      mult: 0.20,
    },
  },
  {
    id: "crystal_imperium",
    name: "Crystal Imperium",
    stage: "solar",
    icon: "💎",
    desc: "An austere stellar empire that claims all inner worlds by right of age.",
    strength: 4.8,
    threatFlavor: "Their blockade fleet orbits your homeworld's moon.",
    assimilationBonus: {
      desc: "+25% energy production (absorbed stellar collectors)",
      resource: "energy",
      mult: 0.25,
    },
  },

  // ===== GALACTIC — rival galactic councils =====
  {
    id: "eternal_conclave",
    name: "Eternal Conclave",
    stage: "galactic",
    icon: "👁️",
    desc: "A council of ancient star-nations that views all newcomers as upstarts.",
    strength: 5.0,
    threatFlavor: "Their edicts circulate through your outer worlds, demanding submission.",
    assimilationBonus: {
      desc: "+25% data production (absorbed archives of the Conclave)",
      resource: "data",
      mult: 0.25,
    },
  },
  {
    id: "swarm_sovereignty",
    name: "Swarm Sovereignty",
    stage: "galactic",
    icon: "🐝",
    desc: "A hive-civilization that consumes entire systems. It cannot be reasoned with, only survived.",
    strength: 5.2,
    threatFlavor: "Their fleet-mass bends light at the edge of your sensors.",
    assimilationBonus: {
      desc: "+30% population growth (absorbed swarm-breeding techniques)",
      resource: "military_power", // pop growth is not a resource; use military as a proxy
      mult: 0.30,
    },
  },
];

export const RIVAL_MAP: Record<string, RivalDef> = Object.fromEntries(
  RIVALS.map((r) => [r.id, r])
);

export function rivalsForStage(stage: StageId): RivalDef[] {
  return RIVALS.filter((r) => r.stage === stage);
}

// ASSIMILATION-COST formula constants (per user spec).
// baseMilCost = RIVAL_BASE_MIL_COST * strength
// baseCulCost = RIVAL_BASE_CUL_COST * strength
// milCost = max(MIN_ASSIMILATION_COST, baseMilCost - counteredRaids * MIL_REDUCTION_PER_COUNTER)
// culCost = max(MIN_ASSIMILATION_COST, baseCulCost - successfulTrades * CUL_REDUCTION_PER_TRADE)
// Both must be met (player has enough military_power AND culture) to assimilate.
export const RIVAL_BASE_MIL_COST = 200;       // base military_power cost at strength 1.0
export const RIVAL_BASE_CUL_COST = 150;        // base culture cost at strength 1.0
export const MIL_REDUCTION_PER_COUNTER = 30;   // each countered raid reduces mil cost by 30
export const CUL_REDUCTION_PER_TRADE = 25;     // each successful trade reduces cul cost by 25
export const MIN_ASSIMILATION_COST = 50;       // cost floor — never goes below this

/** Compute the current assimilation cost for a rival, factoring in the
 * player's countered raids + successful trades. Returns the military_power
 * + culture costs the player must spend to assimilate. */
export function assimilationCost(
  rivalId: string,
  counteredRaids: number,
  successfulTrades: number
): { military: number; culture: number } {
  const rival = RIVAL_MAP[rivalId];
  if (!rival) return { military: 0, culture: 0 };
  const baseMil = RIVAL_BASE_MIL_COST * rival.strength;
  const baseCul = RIVAL_BASE_CUL_COST * rival.strength;
  const military = Math.max(MIN_ASSIMILATION_COST, baseMil - counteredRaids * MIL_REDUCTION_PER_COUNTER);
  const culture = Math.max(MIN_ASSIMILATION_COST, baseCul - successfulTrades * CUL_REDUCTION_PER_TRADE);
  return { military, culture };
}
