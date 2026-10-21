// Archetype / lineage system
// 13 archetypes (9 basic + 4 rare). Affinity drifts during a run based on
// systems/tech purchased. Locked at Creature→Tribal evolution. Provides a
// passive bonus for the rest of the run.
//
// ARCHETYPES-REWORK — each archetype now has exactly 3 buffs + 1 debuff,
// stored in `bonus.buffs` (string[]) and `bonus.debuff` (string). The legacy
// single-string `bonus.label` + `bonus.desc` fields are kept for backwards
// compatibility with the radar's locked-archetype badge.
//
// Visibility: archetypes start as "???" on the radar and only reveal their
// name + glyph once the player has locked them in at least once (tracked in
// `revealedLineageArchetypes` on GameState, persists across prestiges).
//
// ARCHETYPES-REWORK design note: The task spec lists 13 archetype bonuses,
// but two of those entries ("Necroid Rare" and "Lithoid Rare") describe
// separate rare-tier variants of archetypes that don't currently exist as
// distinct IDs in the data file. To preserve all existing event/system/tech
// affinity references (which point at `avian`, `aquatic`, etc.), we keep the
// original 13 archetype IDs intact and apply the matching task-spec bonuses
// to each. Avian + Aquatic have no task-spec entry — we apply sensible
// 3-buff + 1-debuff sets that match their existing theme.

export interface ArchetypeBonus {
  // ---- Legacy display fields (kept for backwards compat) ----
  label: string;       // short summary (legacy badge)
  desc: string;        // flavor text (legacy)

  // ---- New: structured 3-buff + 1-debuff display ----
  buffs: string[];     // exactly 3 short buff descriptions
  debuff: string;      // exactly 1 short debuff description

  // ---- Applied effects (consumed in tick / triggerPrestige / buySystem) ----
  // All multipliers below are ADDITIVE (e.g. 0.10 = +10%, -0.15 = -15%).
  productionMult?: Partial<Record<string, number>>;       // resource → additive bonus
  allProductionMult?: number;                              // additive bonus to all resources
  populationGrowthMult?: number;                           // additive (negative = debuff)
  capMult?: number;                                        // additive (capacity multiplier)
  // System cost adjustment (additive). +0.10 = +10% system costs (debuff),
  // -0.15 = -15% system costs (buff).
  systemCostMult?: number;
  // EP from prestige multiplier (additive). 0.50 = +50% EP on prestige.
  epFromPrestigeMult?: number;
  // Happiness delta per tick (per second, additive). Negative = debuff.
  happinessPerTick?: number;
  // Event category immunities. Values: "cold", "plague", "disaster", "all".
  immuneToEvents?: string[];
  // Population never decreases from any source (events, debuffs).
  populationImmortal?: boolean;
  // Population grows even without food (photosynthesis).
  popGrowsWithoutFood?: boolean;
  // Additive production multiplier applied only in Tribal+ stages (warm stages).
  productionInWarmStagesMult?: number;
  // Additive production multiplier when avg resource fill < 20% (extremophile buff).
  productionWhenLowResourcesMult?: number;
  // Additive production multiplier when avg resource fill > 80% (extremophile debuff, negative).
  productionWhenPlentifulMult?: number;
  // Fraction of normal production from disabled systems (necroid). 0.20 = 20%.
  productionFromDisabledSystemsMult?: number;
  // Additive all-production bonus PER owned system (fungoid network). 0.10 = +10% per system.
  productionPerSystemAllMult?: number;
  // Additive military_power production multiplier. 0.15 = +15%.
  militaryPowerMult?: number;
  // Additive trade-value multiplier (future market bonus). 0.10 = +10%.
  tradeValueMult?: number;
  // Additive bonus to production from stone/alloys-producing systems (lithoid). 0.30 = +30%.
  productionFromMineralSystemsMult?: number;
}

export interface ArchetypeDef {
  id: string;
  name: string;
  rarity: "basic" | "rare";
  unlock: "default" | "first_win";
  color: string;
  glyph: string; // a single-character sigil
  blurb: string;
  bonus: ArchetypeBonus;
}

export const ARCHETYPES: ArchetypeDef[] = [
  // ============================================================
  // BASIC ARCHETYPES (9) — always selectable, drift-grantable
  // ============================================================

  // 1. Humanoid — adaptable generalist
  {
    id: "humanoid",
    name: "Humanoid",
    rarity: "basic",
    unlock: "default",
    color: "#c4b5a0",
    glyph: "☻",
    blurb: "Adaptable, social, tool-building. The generalist's path.",
    bonus: {
      label: "Adaptable: +10% all prod, +15% pop growth, +5% cap",
      desc: "Balanced growth across every domain — at a cost.",
      buffs: [
        "+10% all production",
        "+15% population growth",
        "+5% resource capacity",
      ],
      debuff: "+10% system costs (humanoids are demanding)",
      allProductionMult: 0.10,
      populationGrowthMult: 0.15,
      capMult: 0.05,
      systemCostMult: 0.10,
    },
  },

  // 2. Mammalian — warm-blooded nurturers
  {
    id: "mammalian",
    name: "Mammalian",
    rarity: "basic",
    unlock: "default",
    color: "#d4956b",
    glyph: "denti",
    blurb: "Warm-blooded, nurturing, social-bonded. Population thrives.",
    bonus: {
      label: "Warm-blooded: +20% food, +10% pop, immune to cold",
      desc: "Kinship feeds the herd — but warm blood costs energy.",
      buffs: [
        "+20% food production",
        "+10% population growth",
        "Immune to cold events",
      ],
      debuff: "-15% energy production (warm blood costs energy)",
      productionMult: { food: 0.20, energy: -0.15 },
      populationGrowthMult: 0.10,
      immuneToEvents: ["cold"],
    },
  },

  // 3. Reptilian — cold-blooded predators
  {
    id: "reptilian",
    name: "Reptilian",
    rarity: "basic",
    unlock: "default",
    color: "#7fae5e",
    glyph: "∿",
    blurb: "Cold, patient, predatory. Discipline in scale and tooth.",
    bonus: {
      label: "Cold-blooded: +15% military, -20% food use, +10% Tribal+ prod",
      desc: "The patient predator always wins — slowly.",
      buffs: [
        "+15% military power",
        "-20% food consumption (modeled as +20% food production)",
        "+10% production in warm stages (Tribal+)",
      ],
      debuff: "-20% population growth (slow reproducers)",
      militaryPowerMult: 0.15,
      populationGrowthMult: -0.20,
      productionInWarmStagesMult: 0.10,
      // -20% food consumption is implemented as +20% food production
      // (simplification — net effect on food surplus is similar).
      productionMult: { food: 0.20 },
    },
  },

  // 4. Avian — light-boned, far-sighted (no task-spec entry; sensible defaults)
  {
    id: "avian",
    name: "Avian",
    rarity: "basic",
    unlock: "default",
    color: "#d4b94a",
    glyph: "⋋",
    blurb: "Light-boned, far-sighted, quick. Knowledge travels far.",
    bonus: {
      label: "Far-sighted: +20% science, +15% knowledge, +5% all prod",
      desc: "The horizon is a library — but fragile bones.",
      buffs: [
        "+20% science production",
        "+15% knowledge production",
        "+5% all production (far-sighted vision)",
      ],
      debuff: "-10% military power (light-boned, fragile in combat)",
      productionMult: { science: 0.20, knowledge: 0.15, military_power: -0.10 },
      allProductionMult: 0.05,
    },
  },

  // 5. Arthropoid — industrious hive
  {
    id: "arthropoid",
    name: "Arthropoid",
    rarity: "basic",
    unlock: "default",
    color: "#c66b8a",
    glyph: "✶",
    blurb: "Many-limbed, industrious, hive-minded. Labor multiplies.",
    bonus: {
      label: "Industrious: +25% prod, -15% system costs, +10% cap",
      desc: "A thousand hands make light work — but small bodies.",
      buffs: [
        "+25% production",
        "-15% system costs",
        "+10% resource capacity",
      ],
      debuff: "-20% population growth (exoskeletons limit size)",
      allProductionMult: 0.25,
      systemCostMult: -0.15,
      capMult: 0.10,
      populationGrowthMult: -0.20,
    },
  },

  // 6. Molluscoid — soft, ancient, patient
  {
    id: "molluscoid",
    name: "Molluscoid",
    rarity: "basic",
    unlock: "default",
    color: "#a07fcc",
    glyph: "◯",
    blurb: "Soft, ancient, patient. Culture and science run deep.",
    bonus: {
      label: "Adaptable: +15% science, +20% cap, +10% trade",
      desc: "Intelligence does not require a spine — or muscle.",
      buffs: [
        "+15% science production",
        "+20% resource capacity",
        "+10% trade value (future market bonus)",
      ],
      debuff: "-10% military power (soft bodies)",
      productionMult: { science: 0.15, military_power: -0.10 },
      capMult: 0.20,
      tradeValueMult: 0.10,
    },
  },

  // 7. Fungoid — decomposing network
  {
    id: "fungoid",
    name: "Fungoid",
    rarity: "basic",
    unlock: "default",
    color: "#a8b85a",
    glyph: "☂",
    blurb: "Networked, decomposing, immortal. Waste becomes food.",
    bonus: {
      label: "Decomposing: +25% organic, +10%/system, immune to plague",
      desc: "Nothing is wasted in the mycelium — but moods dim.",
      buffs: [
        "+25% organic matter production",
        "+10% all production per owned system (network effect)",
        "Immune to plague events",
      ],
      debuff: "-15% happiness (spores affect mood)",
      productionMult: { organic_matter: 0.25 },
      productionPerSystemAllMult: 0.10,
      immuneToEvents: ["plague"],
      happinessPerTick: -0.05, // slow drift downward (capped by happiness floor logic)
    },
  },

  // 8. Plantoid — photosynthetic
  {
    id: "plantoid",
    name: "Plantoid",
    rarity: "basic",
    unlock: "default",
    color: "#5abf6e",
    glyph: "✿",
    blurb: "Rooted, photosynthetic, enduring. Sunlight is enough.",
    bonus: {
      label: "Photosynthetic: +30% energy, +15% food, pop grows w/o food",
      desc: "Stillness is its own power — but not its strength.",
      buffs: [
        "+30% energy production",
        "+15% food production",
        "Population grows even without food (photosynthesis)",
      ],
      debuff: "-20% military power (passive nature)",
      productionMult: { energy: 0.30, food: 0.15, military_power: -0.20 },
      popGrowsWithoutFood: true,
    },
  },

  // 9. Aquatic — fluid, pressure-deep (no task-spec entry; sensible defaults)
  {
    id: "aquatic",
    name: "Aquatic",
    rarity: "basic",
    unlock: "default",
    color: "#3fb8d4",
    glyph: "≈",
    blurb: "Fluid, pressure-deep, memory-holding. The sea remembers.",
    bonus: {
      label: "Pressure-deep: +20% water, +15% science, +10% culture",
      desc: "All life began here, and may again — but slow on land.",
      buffs: [
        "+20% water production",
        "+15% science production (memory-holding)",
        "+10% culture production",
      ],
      debuff: "-10% all production on land (specialized to water)",
      productionMult: { water: 0.20, science: 0.15, culture: 0.10 },
      allProductionMult: -0.10,
    },
  },

  // ============================================================
  // RARE ARCHETYPES (4) — unlock after first Galactic win
  // ============================================================

  // 10. Necroid — undying (rare)
  {
    id: "necroid",
    name: "Necroid",
    rarity: "rare",
    unlock: "first_win",
    color: "#8a7a98",
    glyph: "☥",
    blurb: "Death-touched, ritual-bound. The past never leaves.",
    bonus: {
      label: "Undying: +20% dead-system prod, +50% Divinity, pop never falls",
      desc: "What is dead may never die — but rarely breeds.",
      buffs: [
        "+20% production from disabled systems",
        "Population never decreases from events",
        "+50% Divinity from prestige",
      ],
      debuff: "-25% population growth (the dead don't breed)",
      populationGrowthMult: -0.25,
      epFromPrestigeMult: 0.50,
      productionFromDisabledSystemsMult: 0.20,
      // Population never decreases from EVENTS specifically (not all sources).
      // We use populationImmortal=true which guards against event-driven
      // decreases (see resolveEvent in store.ts).
      populationImmortal: true,
    },
  },

  // 11. Lithoid — crystalline (rare)
  {
    id: "lithoid",
    name: "Lithoid",
    rarity: "rare",
    unlock: "first_win",
    color: "#9c8f7d",
    glyph: "◆",
    blurb: "Stone-born, crystalline, slow. What endures, endures.",
    bonus: {
      label: "Crystalline: +30% stone-system prod, +50% cap, immune to disasters",
      desc: "Patience carved in geological time.",
      buffs: [
        "+30% production from stone/mineral systems",
        "+50% resource capacity",
        "Immune to disasters",
      ],
      debuff: "-50% population growth (crystals grow slowly)",
      capMult: 0.50,
      populationGrowthMult: -0.50,
      productionFromMineralSystemsMult: 0.30,
      immuneToEvents: ["disaster"],
    },
  },

  // 12. Toxoid — venomous (rare)
  {
    id: "toxoid",
    name: "Toxoid",
    rarity: "rare",
    unlock: "first_win",
    color: "#9fce44",
    glyph: "☣",
    blurb: "Venomous, adaptive, hazardous. Thrives where others can't.",
    bonus: {
      label: "Venomous: +25% pop, +15% military, immune to plague",
      desc: "Poison is just a dose of opportunity — for everyone.",
      buffs: [
        "+25% population growth",
        "+15% military power (toxic attacks)",
        "Immune to plague events",
      ],
      debuff: "-10% happiness (toxic atmosphere)",
      populationGrowthMult: 0.25,
      militaryPowerMult: 0.15,
      immuneToEvents: ["plague"],
      happinessPerTick: -0.03,
    },
  },

  // 13. Extremophile — rare, resilient
  {
    id: "extremophile",
    name: "Extremophile",
    rarity: "rare",
    unlock: "first_win",
    color: "#d96b4f",
    glyph: "☢",
    blurb: "Lives where nothing should. The universe is not picky.",
    bonus: {
      label: "Resilient: immune to all events, +20% low-res prod, +30% cap",
      desc: "Life finds a way. Always — but bored when comfortable.",
      buffs: [
        "Immune to ALL negative events",
        "+20% production in extreme conditions (low resources)",
        "+30% resource capacity",
      ],
      debuff: "-15% all production when resources are plentiful (bored)",
      capMult: 0.30,
      productionWhenLowResourcesMult: 0.20,
      productionWhenPlentifulMult: -0.15,
      immuneToEvents: ["all"],
    },
  },
];

export const ARCHETYPE_MAP: Record<string, ArchetypeDef> = Object.fromEntries(
  ARCHETYPES.map((a) => [a.id, a])
);

export function isArchetypeUnlocked(id: string, galacticWins: number): boolean {
  const a = ARCHETYPE_MAP[id];
  if (!a) return false;
  if (a.unlock === "default") return true;
  return galacticWins >= 1;
}

// Compute dominant archetype from affinity map
export function dominantArchetype(affinity: Record<string, number>): string | null {
  let best: string | null = null;
  let bestVal = 0;
  for (const [id, v] of Object.entries(affinity)) {
    if (v > bestVal) {
      bestVal = v;
      best = id;
    }
  }
  return bestVal > 0 ? best : null;
}

// ============================================================
// Event-category helpers — used by the tick + resolveEvent to apply
// archetype immunities ("cold", "plague", "disaster", "all").
// ============================================================

const COLD_EVENT_IDS = new Set(["harsh_winter"]);
const PLAGUE_EVENT_IDS = new Set(["plague_rumor"]);
const DISASTER_EVENT_IDS = new Set(["resource_drought", "solar_flare"]);

/**
 * Returns true if the locked archetype's bonuses make it immune to the
 * given event id. Immunities come from `bonus.immuneToEvents` categories.
 */
export function isArchetypeImmuneToEvent(
  lockedArchetype: string | null,
  eventId: string
): boolean {
  if (!lockedArchetype) return false;
  const arch = ARCHETYPE_MAP[lockedArchetype];
  if (!arch || !arch.bonus.immuneToEvents || arch.bonus.immuneToEvents.length === 0) {
    return false;
  }
  const cats = arch.bonus.immuneToEvents;
  if (cats.includes("all")) return true;
  if (cats.includes("cold") && COLD_EVENT_IDS.has(eventId)) return true;
  if (cats.includes("plague") && PLAGUE_EVENT_IDS.has(eventId)) return true;
  if (cats.includes("disaster") && DISASTER_EVENT_IDS.has(eventId)) return true;
  return false;
}
