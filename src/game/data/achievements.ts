// Achievement system — persistent goals across all runs.
// Each achievement grants a small permanent bonus (0.5-3% per achievement).
// Total at full completion: ~15-20% production, ~7% capacity, ~10% EP, ~5% pop.
//
// 4 categories: stages / layers / milestones / fun
//   - stages    (35) : 7 stages × 5 (reach / first system / first tech /
//                      completionist / builder)
//   - layers    (50) : 10 layers × 5 (enter / first action / progress /
//                      complete / master)
//   - milestones(~95): 36 user-specified + tiered progression counters
//   - fun       (~30): UI/easter-egg + retained legacy curiosities
//
// REMOVED per user request: OOM Survivor, Cosmic Visionary (light all 497
// stars). ADDED per user request: True Masochistic Perfection.
//
// Bonus types:
//   - production : additive bonus to all resource production
//   - capacity   : additive bonus to resource capacities
//   - ep         : additive bonus to Evolution Points gained on prestige
//   - pop        : additive bonus to population growth rate

import type { StageId } from "../state/types";

// ---------------------------------------------------------------------------
// Per-stage tech + system counts (from data files — see techs.ts / systems.ts)
// Used by the stage completionist + builder achievements.
// ---------------------------------------------------------------------------
export const STAGE_TECH_COUNTS: Record<StageId, number> = {
  cell: 30,
  creature: 30,
  tribal: 65,
  civilization: 75,
  empire: 93,
  solar: 63,
  galactic: 50,
};

export const STAGE_SYSTEM_COUNTS: Record<StageId, number> = {
  cell: 49,
  creature: 62,
  tribal: 80,
  civilization: 72,
  empire: 74,
  solar: 50,
  galactic: 50,
};

// ---------------------------------------------------------------------------
// Categories — 4 main groupings for the AchievementsTab filter.
// ---------------------------------------------------------------------------
export type AchievementCategory =
  | "stages"
  | "layers"
  | "milestones"
  | "fun";

export type AchievementBonusType =
  | "production"
  | "capacity"
  | "ep"
  | "pop";

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  category: AchievementCategory;
  icon: string;
  // Check if achievement is earned given the meta state
  check: (meta: AchievementCheckCtx) => boolean;
  bonus: { type: AchievementBonusType; value: number };
  // For display: tiers/progress (optional, not implemented yet)
  tier?: number;
}

export interface AchievementCheckCtx {
  // ---- Existing fields (kept for backwards compat) ----
  galacticWins: number;
  totalRuns: number;
  stageClearCounts: Record<StageId, number>;
  archivedArchetypes: string[];
  storyUnlockedCount: number;
  systemsDiscoveredCount: number;
  techResearchedCount: number;
  upgradesOwnedCount: number;
  maxPopulation?: number;
  maxScore?: number;
  totalResources?: number;
  fastestCellClear?: number; // seconds
  eventsResolved?: number; // events resolved this run (meta)
  totalEventsResolved?: number; // across all runs

  // ---- New fields for 200+ achievements (all optional — callers may
  //      build a partial ctx; check functions use `|| 0` / `|| false`
  //      defaults so the achievement simply stays locked if a field is
  //      missing on a given save). ----

  // Stage + meta progression
  stageIndex?: number;
  totalPlayTime?: number; // seconds across all runs
  totalActions?: number; // manual actions clicked across all runs
  totalSystemsBuilt?: number; // systems built across all runs
  totalTechResearched?: number; // techs researched across all runs

  // Layer unlock state (unlockedLayers record)
  unlockedLayers?: Record<string, boolean>;
  unlockedLayerCount?: number;

  // L1 — Challenges / Trials
  challengesCompletedCount?: number; // total distinct challenges completed
  challengesTotalRepeats?: number; // sum of completed repeat counts
  challengesAtMaxLevel?: number; // # of challenges at max repeat (10)
  trialsAbandoned?: number;
  fastestTrialClearSec?: number;
  fastestGalacticClearSec?: number;

  // L2 — Constellations
  constellationStarsLit?: number; // 0..497
  constellationsCompleted?: number; // 0..88

  // L3 — Transcendence / Divine Market
  marketTradesTotal?: number;
  portfolioDividendsEarned?: number;

  // L4 — Genesis / Galaxy Claim
  galaxySystemsClaimed?: number; // current run (0..50)
  galaxySystemsClaimedTotal?: number; // across all runs

  // L5 — Apotheosis / Heresy
  galaxiesConquered?: number;
  heresySurvivor?: boolean;

  // L6 — Singularity / Universal Map
  riftsClosed?: number;
  anchorsPlaced?: number;

  // L7 — Omnipotence / Bio-engineering
  mutationsTriggered?: number;
  raidsRepelled?: number;

  // L8 — Divinity / Divine Alliance
  alliancesFormed?: number;

  // L9 — Infinity / Divine War
  oldGodBattlesWon?: number; // 0..3

  // L10 — Eternity / Genesis Engine
  bigBangsTriggered?: number;
  stableUniversesCreated?: number;
  discoveredProceduralArchetypes?: number; // 0..100
  cosmicBoonStacks?: number;
  chosenEnding?: string | null;

  // Per-stage breakdown for stage achievements
  techsByStage?: Record<StageId, number>;
  systemsByStage?: Record<StageId, number>;

  // Shop + government + divine engine
  shopUpgradesAllOwned?: boolean;
  governmentAssigned?: boolean;
  divineEngineWorlds?: number;

  // Fun / hidden UI-driven flags (populated from `achievementMeta`)
  titleClickCount?: number;
  versionClickCount?: number;
  aiThemeActive?: boolean;
  viewedCredits?: boolean;
  offlineProgressUsed?: boolean;
  idleDurationSec?: number;
  pauseDurationSec?: number;
}

// ===========================================================================
// ACHIEVEMENTS — 215 entries (35 stage + 50 layer + 100 milestone + 30 fun)
// ===========================================================================
export const ACHIEVEMENTS: AchievementDef[] = [

  // ========================================================================
  // CATEGORY 1 — STAGE ACHIEVEMENTS (7 stages × 5 = 35)
  // For each of the 7 stages (Cell, Creature, Tribal, Civilization, Empire,
  // Solar, Galactic):
  //   1. First [Stage]      — reach this stage for the first time
  //   2. First [Stage] Sys  — build your first system in this stage
  //   3. First [Stage] Tech — research your first tech in this stage
  //   4. [Stage] Complete   — research ALL techs in this stage
  //   5. [Stage] Builder   — build at least 1 of every system type in this
  //                            stage
  // ========================================================================

  // ----- CELL -----
  {
    id: "first_cell_system",
    name: "First Organelle",
    desc: "Build your first system in the Cell stage.",
    category: "stages",
    icon: "🦠",
    check: (c) => (c.systemsByStage?.cell || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_cell_tech",
    name: "First Adaptation",
    desc: "Research your first Cell-stage technology.",
    category: "stages",
    icon: "🔬",
    check: (c) => (c.techsByStage?.cell || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "cell_completionist",
    name: "Cell Scholar",
    desc: `Research all ${STAGE_TECH_COUNTS.cell} Cell-stage technologies.`,
    category: "stages",
    icon: "🎓",
    check: (c) => (c.techsByStage?.cell || 0) >= STAGE_TECH_COUNTS.cell,
    bonus: { type: "ep", value: 0.01 },
  },
  {
    id: "cell_builder",
    name: "Cell Architect",
    desc: `Build at least one of every Cell-stage system type (${STAGE_SYSTEM_COUNTS.cell} types).`,
    category: "stages",
    icon: "🏰",
    check: (c) => (c.systemsByStage?.cell || 0) >= STAGE_SYSTEM_COUNTS.cell,
    bonus: { type: "capacity", value: 0.005 },
  },

  // ----- CREATURE -----
  {
    id: "first_creature",
    name: "First Body",
    desc: "Evolve past the Cell stage for the first time.",
    category: "stages",
    icon: "🧬",
    check: (c) => (c.stageClearCounts.cell || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_creature_system",
    name: "First Limb",
    desc: "Build your first system in the Creature stage.",
    category: "stages",
    icon: "🐾",
    check: (c) => (c.systemsByStage?.creature || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_creature_tech",
    name: "First Instinct",
    desc: "Research your first Creature-stage technology.",
    category: "stages",
    icon: "🧠",
    check: (c) => (c.techsByStage?.creature || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "creature_completionist",
    name: "Creature Scholar",
    desc: `Research all ${STAGE_TECH_COUNTS.creature} Creature-stage technologies.`,
    category: "stages",
    icon: "🎓",
    check: (c) => (c.techsByStage?.creature || 0) >= STAGE_TECH_COUNTS.creature,
    bonus: { type: "ep", value: 0.01 },
  },
  {
    id: "creature_builder",
    name: "Creature Architect",
    desc: `Build at least one of every Creature-stage system type (${STAGE_SYSTEM_COUNTS.creature} types).`,
    category: "stages",
    icon: "🏗️",
    check: (c) => (c.systemsByStage?.creature || 0) >= STAGE_SYSTEM_COUNTS.creature,
    bonus: { type: "capacity", value: 0.005 },
  },

  // ----- TRIBAL -----
  {
    id: "first_tribal",
    name: "Fire-Keeper",
    desc: "Evolve past the Creature stage for the first time.",
    category: "stages",
    icon: "🔥",
    check: (c) => (c.stageClearCounts.creature || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_tribal_system",
    name: "First Hearth",
    desc: "Build your first system in the Tribal stage.",
    category: "stages",
    icon: "🪵",
    check: (c) => (c.systemsByStage?.tribal || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_tribal_tech",
    name: "First Tradition",
    desc: "Research your first Tribal-stage technology.",
    category: "stages",
    icon: "📜",
    check: (c) => (c.techsByStage?.tribal || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "tribal_completionist",
    name: "Tribal Scholar",
    desc: `Research all ${STAGE_TECH_COUNTS.tribal} Tribal-stage technologies.`,
    category: "stages",
    icon: "🎓",
    check: (c) => (c.techsByStage?.tribal || 0) >= STAGE_TECH_COUNTS.tribal,
    bonus: { type: "ep", value: 0.015 },
  },
  {
    id: "tribal_builder",
    name: "Tribal Architect",
    desc: `Build at least one of every Tribal-stage system type (${STAGE_SYSTEM_COUNTS.tribal} types).`,
    category: "stages",
    icon: "🏕️",
    check: (c) => (c.systemsByStage?.tribal || 0) >= STAGE_SYSTEM_COUNTS.tribal,
    bonus: { type: "capacity", value: 0.01 },
  },

  // ----- CIVILIZATION -----
  {
    id: "first_civilization",
    name: "City-Builder",
    desc: "Evolve past the Tribal stage for the first time.",
    category: "stages",
    icon: "🏛️",
    check: (c) => (c.stageClearCounts.tribal || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_civilization_system",
    name: "First Street",
    desc: "Build your first system in the Civilization stage.",
    category: "stages",
    icon: "🛣️",
    check: (c) => (c.systemsByStage?.civilization || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_civilization_tech",
    name: "First Law",
    desc: "Research your first Civilization-stage technology.",
    category: "stages",
    icon: "⚖️",
    check: (c) => (c.techsByStage?.civilization || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "civilization_completionist",
    name: "Civilization Scholar",
    desc: `Research all ${STAGE_TECH_COUNTS.civilization} Civilization-stage technologies.`,
    category: "stages",
    icon: "🎓",
    check: (c) => (c.techsByStage?.civilization || 0) >= STAGE_TECH_COUNTS.civilization,
    bonus: { type: "ep", value: 0.015 },
  },
  {
    id: "civilization_builder",
    name: "Civilization Architect",
    desc: `Build at least one of every Civilization-stage system type (${STAGE_SYSTEM_COUNTS.civilization} types).`,
    category: "stages",
    icon: "🌆",
    check: (c) => (c.systemsByStage?.civilization || 0) >= STAGE_SYSTEM_COUNTS.civilization,
    bonus: { type: "capacity", value: 0.01 },
  },

  // ----- EMPIRE -----
  {
    id: "first_empire",
    name: "Imperial Ambition",
    desc: "Evolve past the Civilization stage for the first time.",
    category: "stages",
    icon: "⚔️",
    check: (c) => (c.stageClearCounts.civilization || 0) >= 1,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "first_empire_system",
    name: "First Banner",
    desc: "Build your first system in the Empire stage.",
    category: "stages",
    icon: "🚩",
    check: (c) => (c.systemsByStage?.empire || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_empire_tech",
    name: "First Doctrine",
    desc: "Research your first Empire-stage technology.",
    category: "stages",
    icon: "📜",
    check: (c) => (c.techsByStage?.empire || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "empire_completionist",
    name: "Empire Scholar",
    desc: `Research all ${STAGE_TECH_COUNTS.empire} Empire-stage technologies.`,
    category: "stages",
    icon: "🎓",
    check: (c) => (c.techsByStage?.empire || 0) >= STAGE_TECH_COUNTS.empire,
    bonus: { type: "ep", value: 0.02 },
  },
  {
    id: "empire_builder",
    name: "Empire Architect",
    desc: `Build at least one of every Empire-stage system type (${STAGE_SYSTEM_COUNTS.empire} types).`,
    category: "stages",
    icon: "🏰",
    check: (c) => (c.systemsByStage?.empire || 0) >= STAGE_SYSTEM_COUNTS.empire,
    bonus: { type: "capacity", value: 0.01 },
  },

  // ----- SOLAR -----
  {
    id: "first_solar",
    name: "Sky-Breaker",
    desc: "Evolve past the Empire stage for the first time.",
    category: "stages",
    icon: "☀️",
    check: (c) => (c.stageClearCounts.empire || 0) >= 1,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "first_solar_system",
    name: "First Launch",
    desc: "Build your first system in the Solar stage.",
    category: "stages",
    icon: "🚀",
    check: (c) => (c.systemsByStage?.solar || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_solar_tech",
    name: "First Orbit",
    desc: "Research your first Solar-stage technology.",
    category: "stages",
    icon: "🛰️",
    check: (c) => (c.techsByStage?.solar || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "solar_completionist",
    name: "Solar Scholar",
    desc: `Research all ${STAGE_TECH_COUNTS.solar} Solar-stage technologies.`,
    category: "stages",
    icon: "🎓",
    check: (c) => (c.techsByStage?.solar || 0) >= STAGE_TECH_COUNTS.solar,
    bonus: { type: "ep", value: 0.02 },
  },
  {
    id: "solar_builder",
    name: "Solar Architect",
    desc: `Build at least one of every Solar-stage system type (${STAGE_SYSTEM_COUNTS.solar} types).`,
    category: "stages",
    icon: "🌍",
    check: (c) => (c.systemsByStage?.solar || 0) >= STAGE_SYSTEM_COUNTS.solar,
    bonus: { type: "capacity", value: 0.01 },
  },

  // ----- GALACTIC -----
  {
    id: "first_galactic",
    name: "Creation Reaches the Stars",
    desc: "Achieve Galactic Ascension for the first time.",
    category: "stages",
    icon: "🌌",
    check: (c) => c.galacticWins >= 1,
    bonus: { type: "production", value: 0.02 },
  },
  {
    id: "first_galactic_system",
    name: "First Star Nation",
    desc: "Build your first system in the Galactic stage.",
    category: "stages",
    icon: "✨",
    check: (c) => (c.systemsByStage?.galactic || 0) >= 1,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "first_galactic_tech",
    name: "First Cosmology",
    desc: "Research your first Galactic-stage technology.",
    category: "stages",
    icon: "🔭",
    check: (c) => (c.techsByStage?.galactic || 0) >= 1,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "galactic_completionist",
    name: "Galactic Scholar",
    desc: `Research all ${STAGE_TECH_COUNTS.galactic} Galactic-stage technologies.`,
    category: "stages",
    icon: "🎓",
    check: (c) => (c.techsByStage?.galactic || 0) >= STAGE_TECH_COUNTS.galactic,
    bonus: { type: "ep", value: 0.02 },
  },
  {
    id: "galactic_builder",
    name: "Galactic Architect",
    desc: `Build at least one of every Galactic-stage system type (${STAGE_SYSTEM_COUNTS.galactic} types).`,
    category: "stages",
    icon: "🌠",
    check: (c) => (c.systemsByStage?.galactic || 0) >= STAGE_SYSTEM_COUNTS.galactic,
    bonus: { type: "capacity", value: 0.015 },
  },

  // ========================================================================
  // CATEGORY 2 — LAYER ACHIEVEMENTS (10 layers × 5 = 50)
  // For each of the 10 layers (L1..L10):
  //   1. Enter Layer N        — unlock this layer
  //   2. First [Layer Action] — do the first action in this layer
  //   3. Layer Progress       — reach ~50% completion of the main loop
  //   4. Layer Complete      — complete the full loop
  //   5. Layer Master        — go above and beyond
  // L1=Challenges, L2=Constellations, L3=Market, L4=GalaxyClaim,
  // L5=Heresy, L6=Singularity, L7=Omnipotence, L8=Divinity,
  // L9=Infinity, L10=Eternity
  // ========================================================================

  // ----- L1 — CHALLENGES / TRIALS -----
  // REMOVED enter_layer_1 — the base Evolution layer is unlocked by
  // default at game start, so the achievement fired trivially on every
  // fresh save. The "First Word" (milestone_first_scripture) achievement
  // already serves as the "you started the game" welcome.
  {
    id: "first_trial",
    name: "First Trial",
    desc: "Complete your first challenge (Layer 1 trial).",
    category: "layers",
    icon: "⚔️",
    check: (c) => (c.challengesCompletedCount || 0) >= 1,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "layer_1_progress",
    name: "Trial Adept",
    desc: "Complete 5 different challenges (half of the 10 trials).",
    category: "layers",
    icon: "🏅",
    check: (c) => (c.challengesCompletedCount || 0) >= 5,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "layer_1_complete",
    name: "Trial Master",
    desc: "Complete all 10 trials (Layer 1 fully complete).",
    category: "layers",
    icon: "🏆",
    check: (c) => (c.challengesCompletedCount || 0) >= 10,
    bonus: { type: "ep", value: 0.02 },
  },
  {
    id: "layer_1_master",
    name: "True Masochistic Perfection",
    desc: "Complete all 10 trials at max repeat level 10.",
    category: "layers",
    icon: "💀",
    check: (c) => (c.challengesAtMaxLevel || 0) >= 10,
    bonus: { type: "ep", value: 0.03 },
  },

  // ----- L2 — CONSTELLATIONS -----
  {
    id: "enter_layer_2",
    name: "Enter Layer 2 — Ascension",
    desc: "Unlock the Ascension layer (constellation map).",
    category: "layers",
    icon: "✨",
    check: (c) => (c.unlockedLayers?.enlightenment || false),
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_star",
    name: "First Star",
    desc: "Light your first constellation star.",
    category: "layers",
    icon: "⭐",
    check: (c) => (c.constellationStarsLit || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "layer_2_progress",
    name: "Stargazer",
    desc: "Light 247 constellation stars (~50% of 497).",
    category: "layers",
    icon: "🌠",
    check: (c) => (c.constellationStarsLit || 0) >= 247,
    bonus: { type: "production", value: 0.02 },
  },
  {
    id: "layer_2_complete",
    name: "Cartographer",
    desc: "Complete all 88 constellations.",
    category: "layers",
    icon: "🗺️",
    check: (c) => (c.constellationsCompleted || 0) >= 88,
    bonus: { type: "ep", value: 0.02 },
  },
  {
    id: "layer_2_master",
    name: "Star Singer",
    desc: "Light all 497 constellation stars AND complete all 88 constellations.",
    category: "layers",
    icon: "🌟",
    check: (c) => (c.constellationStarsLit || 0) >= 497 && (c.constellationsCompleted || 0) >= 88,
    bonus: { type: "capacity", value: 0.02 },
  },

  // ----- L3 — DIVINE MARKET -----
  {
    id: "enter_layer_3",
    name: "Enter Layer 3 — Transcendence",
    desc: "Unlock the Transcendence layer (divine market).",
    category: "layers",
    icon: "🔺",
    check: (c) => (c.unlockedLayers?.transcendence || false),
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_market_trade",
    name: "First Trade",
    desc: "Execute your first divine market trade.",
    category: "layers",
    icon: "💱",
    check: (c) => (c.marketTradesTotal || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "layer_3_progress",
    name: "Speculator",
    desc: "Execute 50 market trades (half of the L3 loop).",
    category: "layers",
    icon: "📈",
    check: (c) => (c.marketTradesTotal || 0) >= 50,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "layer_3_complete",
    name: "Market Tycoon",
    desc: "Earn 10,000 Divinity from portfolio dividends.",
    category: "layers",
    icon: "💰",
    check: (c) => (c.portfolioDividendsEarned || 0) >= 10000,
    bonus: { type: "ep", value: 0.02 },
  },
  {
    id: "layer_3_master",
    name: "Divine Banker",
    desc: "Earn 100,000 Divinity from portfolio dividends.",
    category: "layers",
    icon: "🏦",
    check: (c) => (c.portfolioDividendsEarned || 0) >= 100000,
    bonus: { type: "ep", value: 0.03 },
  },

  // ----- L4 — GALAXY CLAIM -----
  {
    id: "enter_layer_4",
    name: "Enter Layer 4 — Genesis",
    desc: "Unlock the Genesis layer (galaxy claim).",
    category: "layers",
    icon: "🥚",
    check: (c) => (c.unlockedLayers?.genesis || false),
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_system_claim",
    name: "First Claim",
    desc: "Claim your first star system on the galaxy map.",
    category: "layers",
    icon: "📍",
    check: (c) => (c.galaxySystemsClaimed || 0) >= 1 || (c.galaxySystemsClaimedTotal || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "layer_4_progress",
    name: "Surveyor",
    desc: "Claim 25 star systems on the galaxy map (half of 50).",
    category: "layers",
    icon: "🧭",
    check: (c) => (c.galaxySystemsClaimed || 0) >= 25,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "layer_4_complete",
    name: "World Builder",
    desc: "Claim all 50 star systems on the galaxy map.",
    category: "layers",
    icon: "🌍",
    check: (c) => (c.galaxySystemsClaimed || 0) >= 50,
    bonus: { type: "ep", value: 0.02 },
  },
  {
    id: "layer_4_master",
    name: "Galactic Surveyor",
    desc: "Claim 100 star systems across all runs.",
    category: "layers",
    icon: "🌌",
    check: (c) => (c.galaxySystemsClaimedTotal || 0) >= 100,
    bonus: { type: "capacity", value: 0.02 },
  },

  // ----- L5 — HERESY / GALACTIC CONQUEST -----
  {
    id: "enter_layer_5",
    name: "Enter Layer 5 — Apotheosis",
    desc: "Unlock the Apotheosis layer (heresy web + galactic conquest).",
    category: "layers",
    icon: "👁️",
    check: (c) => (c.unlockedLayers?.apotheosis || false),
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_galaxy_attack",
    name: "First Skirmish",
    desc: "Attack your first rival star system.",
    category: "layers",
    icon: "💥",
    check: (c) => (c.galaxiesConquered || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "layer_5_progress",
    name: "Crusader",
    desc: "Conquer 1 rival galaxy (third of the L5 → L6 unlock).",
    category: "layers",
    icon: "⚔️",
    check: (c) => (c.galaxiesConquered || 0) >= 1,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "layer_5_complete",
    name: "Galaxy Conqueror",
    desc: "Conquer 3 rival galaxies (L5 → L6 unlock threshold).",
    category: "layers",
    icon: "👑",
    check: (c) => (c.galaxiesConquered || 0) >= 3,
    bonus: { type: "ep", value: 0.02 },
  },
  {
    id: "layer_5_master",
    name: "Heresy Survivor",
    desc: "Survive a heresy run-ender event.",
    category: "layers",
    icon: "🛡️",
    check: (c) => (c.heresySurvivor || false),
    bonus: { type: "capacity", value: 0.02 },
  },

  // ----- L6 — SINGULARITY / UNIVERSAL MAP -----
  {
    id: "enter_layer_6",
    name: "Enter Layer 6 — Singularity",
    desc: "Unlock the Singularity layer (universal map + rifts).",
    category: "layers",
    icon: "🌀",
    check: (c) => (c.unlockedLayers?.singularity || false),
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_rift_close",
    name: "First Rift Closed",
    desc: "Close your first Old-God rift.",
    category: "layers",
    icon: "🌀",
    check: (c) => (c.riftsClosed || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "layer_6_progress",
    name: "Rift Tender",
    desc: "Close 10 rifts (half of the L6 → L7 threshold).",
    category: "layers",
    icon: "🕳️",
    check: (c) => (c.riftsClosed || 0) >= 10,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "layer_6_complete",
    name: "Rift Closer",
    desc: "Close 20 rifts AND place 10 reality anchors (L6 → L7).",
    category: "layers",
    icon: "🛡️",
    check: (c) => (c.riftsClosed || 0) >= 20 && (c.anchorsPlaced || 0) >= 10,
    bonus: { type: "ep", value: 0.02 },
  },
  {
    id: "layer_6_master",
    name: "Reality Anchor",
    desc: "Place your first reality anchor AND close 50 rifts total.",
    category: "layers",
    icon: "⚓",
    check: (c) => (c.anchorsPlaced || 0) >= 1 && (c.riftsClosed || 0) >= 50,
    bonus: { type: "capacity", value: 0.02 },
  },

  // ----- L7 — OMNIPOTENCE / BIO-ENGINEERING -----
  {
    id: "enter_layer_7",
    name: "Enter Layer 7 — Omnipotence",
    desc: "Unlock the Omnipotence layer (creature lab + skirmish).",
    category: "layers",
    icon: "🧬",
    check: (c) => (c.unlockedLayers?.omnipotence || false),
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_creature_designed",
    name: "First Creature",
    desc: "Design your first custom creature in the lab.",
    category: "layers",
    icon: "🧫",
    check: (c) => (c.unlockedLayers?.omnipotence || false) && (c.mutationsTriggered || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "layer_7_progress",
    name: "First Blood",
    desc: "Repel your first outpost raid.",
    category: "layers",
    icon: "🩸",
    check: (c) => (c.raidsRepelled || 0) >= 1,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "layer_7_complete",
    name: "Commander",
    desc: "Repel 10 outpost raids (L7 → L8 unlock threshold).",
    category: "layers",
    icon: "🎖️",
    check: (c) => (c.raidsRepelled || 0) >= 10,
    bonus: { type: "ep", value: 0.02 },
  },
  {
    id: "layer_7_master",
    name: "Mutation Master",
    desc: "Trigger 25 mutations in the creature lab.",
    category: "layers",
    icon: "🧟",
    check: (c) => (c.mutationsTriggered || 0) >= 25,
    bonus: { type: "pop", value: 0.02 },
  },

  // ----- L8 — DIVINITY / DIVINE ALLIANCE -----
  {
    id: "enter_layer_8",
    name: "Enter Layer 8 — Divinity",
    desc: "Unlock the Divinity layer (divine alliance).",
    category: "layers",
    icon: "🙏",
    check: (c) => (c.unlockedLayers?.divinity || false),
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_negotiation",
    name: "First Negotiation",
    desc: "Negotiate with your first minor god.",
    category: "layers",
    icon: "🤝",
    check: (c) => (c.alliancesFormed || 0) >= 1 && (c.unlockedLayers?.divinity || false),
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "layer_8_progress",
    name: "Envoy",
    desc: "Form 1 alliance with a minor god.",
    category: "layers",
    icon: "🪶",
    check: (c) => (c.alliancesFormed || 0) >= 1,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "layer_8_complete",
    name: "Diplomat",
    desc: "Form 2 alliances (Divine Alliance complete; L8 → L9).",
    category: "layers",
    icon: "🕊️",
    check: (c) => (c.alliancesFormed || 0) >= 2,
    bonus: { type: "ep", value: 0.02 },
  },
  {
    id: "layer_8_master",
    name: "Pantheon Builder",
    desc: "Form alliances with all 6 minor gods.",
    category: "layers",
    icon: "🏛️",
    check: (c) => (c.alliancesFormed || 0) >= 6,
    bonus: { type: "capacity", value: 0.02 },
  },

  // ----- L9 — INFINITY / DIVINE WAR -----
  {
    id: "enter_layer_9",
    name: "Enter Layer 9 — Infinity",
    desc: "Unlock the Infinity layer (divine war against Old Gods).",
    category: "layers",
    icon: "♾️",
    check: (c) => (c.unlockedLayers?.infinity || false),
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "first_battle",
    name: "First Battle",
    desc: "Begin your first Old God battle.",
    category: "layers",
    icon: "⚔️",
    check: (c) => (c.unlockedLayers?.infinity || false) && (c.oldGodBattlesWon || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "layer_9_progress",
    name: "Old God Slayer",
    desc: "Defeat 1 Old God.",
    category: "layers",
    icon: "🗡️",
    check: (c) => (c.oldGodBattlesWon || 0) >= 1,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "layer_9_complete",
    name: "War Hero",
    desc: "Defeat 2 Old Gods (L9 → L10 unlock threshold).",
    category: "layers",
    icon: "🛡️",
    check: (c) => (c.oldGodBattlesWon || 0) >= 2,
    bonus: { type: "ep", value: 0.02 },
  },
  {
    id: "layer_9_master",
    name: "God-Slayer",
    desc: "Defeat all 3 Old Gods.",
    category: "layers",
    icon: "💥",
    check: (c) => (c.oldGodBattlesWon || 0) >= 3,
    bonus: { type: "capacity", value: 0.02 },
  },

  // ----- L10 — ETERNITY / GENESIS ENGINE -----
  {
    id: "enter_layer_10",
    name: "Enter Layer 10 — Eternity",
    desc: "Unlock the Eternity layer (Genesis Engine).",
    category: "layers",
    icon: "🌠",
    check: (c) => (c.unlockedLayers?.eternity || false),
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "first_big_bang",
    name: "Big Bang",
    desc: "Trigger your first Big Bang simulation.",
    category: "layers",
    icon: "💥",
    check: (c) => (c.bigBangsTriggered || 0) >= 1,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "layer_10_progress",
    name: "Universe Crafter",
    desc: "Discover 50 procedural archetypes (half of 100).",
    category: "layers",
    icon: "🪐",
    check: (c) => (c.discoveredProceduralArchetypes || 0) >= 50,
    bonus: { type: "production", value: 0.02 },
  },
  {
    id: "layer_10_complete",
    name: "Genesis Engine",
    desc: "Create your first stable universe via the Genesis Engine.",
    category: "layers",
    icon: "🥚",
    check: (c) => (c.stableUniversesCreated || 0) >= 1,
    bonus: { type: "ep", value: 0.025 },
  },
  {
    id: "layer_10_master",
    name: "Multiverse Architect",
    desc: "Discover all 100 procedural archetypes.",
    category: "layers",
    icon: "🌌",
    check: (c) => (c.discoveredProceduralArchetypes || 0) >= 100,
    bonus: { type: "ep", value: 0.03 },
  },

  // ========================================================================
  // CATEGORY 3 — MILESTONE ACHIEVEMENTS (~100)
  // 36 user-specified + ~65 tiered progression counters.
  // ========================================================================

  // ----- PRESTIGE TIERS -----
  {
    id: "milestone_first_prestige",
    name: "First Prestige",
    desc: "Complete your first run.",
    category: "milestones",
    icon: "🌱",
    check: (c) => c.totalRuns >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "milestone_ten_runs",
    name: "Persistent God",
    desc: "Complete 10 runs total.",
    category: "milestones",
    icon: "🔁",
    check: (c) => c.totalRuns >= 10,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "milestone_fifty_runs",
    name: "Cycle Walker",
    desc: "Complete 50 runs total.",
    category: "milestones",
    icon: "🔂",
    check: (c) => c.totalRuns >= 50,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "milestone_hundred_runs",
    name: "Persistence",
    desc: "Complete 100 runs total.",
    category: "milestones",
    icon: "♾️",
    check: (c) => c.totalRuns >= 100,
    bonus: { type: "production", value: 0.02 },
  },
  {
    id: "milestone_five_hundred_runs",
    name: "Eternal Curator",
    desc: "Complete 500 runs total.",
    category: "milestones",
    icon: "🌀",
    check: (c) => c.totalRuns >= 500,
    bonus: { type: "production", value: 0.025 },
  },
  {
    id: "milestone_thousand_runs",
    name: "Wheel of Becoming",
    desc: "Complete 1000 runs total.",
    category: "milestones",
    icon: "☸️",
    check: (c) => c.totalRuns >= 1000,
    bonus: { type: "production", value: 0.03 },
  },

  // ----- GALACTIC WINS TIERS -----
  {
    id: "milestone_first_galactic_win",
    name: "Galactic Ascension",
    desc: "Achieve Galactic Ascension for the first time.",
    category: "milestones",
    icon: "🌌",
    check: (c) => c.galacticWins >= 1,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "milestone_five_galactic_wins",
    name: "Five Universes",
    desc: "Achieve Galactic Ascension 5 times.",
    category: "milestones",
    icon: "🌟",
    check: (c) => c.galacticWins >= 5,
    bonus: { type: "production", value: 0.02 },
  },
  {
    id: "milestone_ten_galactic_wins",
    name: "Stellar Sovereign",
    desc: "Achieve Galactic Ascension 10 times.",
    category: "milestones",
    icon: "✨",
    check: (c) => c.galacticWins >= 10,
    bonus: { type: "production", value: 0.025 },
  },
  {
    id: "milestone_fifty_galactic_wins",
    name: "Cosmic Lineage",
    desc: "Achieve Galactic Ascension 50 times.",
    category: "milestones",
    icon: "🌠",
    check: (c) => c.galacticWins >= 50,
    bonus: { type: "production", value: 0.03 },
  },

  // ----- LAYER UNLOCKS -----
  {
    id: "milestone_all_layers_unlocked",
    name: "All Layers Unlocked",
    desc: "Unlock all 10 prestige layers.",
    category: "milestones",
    icon: "🔓",
    check: (c) => (c.unlockedLayerCount || 0) >= 10,
    bonus: { type: "production", value: 0.03 },
  },
  {
    id: "milestone_first_cosmic_boon",
    name: "First Cosmic Boon",
    desc: "Complete Layer 10 and choose to reset for a Cosmic Boon.",
    category: "milestones",
    icon: "💫",
    check: (c) => (c.cosmicBoonStacks || 0) >= 1,
    bonus: { type: "ep", value: 0.02 },
  },

  // ----- SPEED -----
  {
    id: "milestone_fast_cell",
    name: "Quick Spark",
    desc: "Evolve past Cell in under 5 minutes of game time.",
    category: "milestones",
    icon: "⏱️",
    check: (c) => (c.stageClearCounts.cell || 0) >= 1 && (c.fastestCellClear || 999999) <= 300,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "milestone_speed_demon",
    name: "Speed Demon",
    desc: "Reach Galactic Ascension in under 30 minutes of game time.",
    category: "milestones",
    icon: "⚡",
    check: (c) => c.galacticWins >= 1 && (c.fastestGalacticClearSec || 999999) <= 1800,
    bonus: { type: "production", value: 0.025 },
  },
  {
    id: "milestone_trial_speedrun",
    name: "Trial Speedrun",
    desc: "Complete a trial in under 60 seconds.",
    category: "milestones",
    icon: "🏁",
    check: (c) => (c.fastestTrialClearSec || 999999) <= 60,
    bonus: { type: "production", value: 0.015 },
  },

  // ----- TIME PLAYED TIERS -----
  {
    id: "milestone_one_hour_played",
    name: "First Hour",
    desc: "Play for 1 hour total across all runs.",
    category: "milestones",
    icon: "🕐",
    check: (c) => (c.totalPlayTime || 0) >= 3600,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "milestone_six_hour_played",
    name: "Devoted",
    desc: "Play for 6 hours total across all runs.",
    category: "milestones",
    icon: "🕕",
    check: (c) => (c.totalPlayTime || 0) >= 21600,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "milestone_marathon_runner",
    name: "Marathon Runner",
    desc: "Play for 24 hours total across all runs.",
    category: "milestones",
    icon: "🏆",
    check: (c) => (c.totalPlayTime || 0) >= 86400,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "milestone_century_played",
    name: "Centurion",
    desc: "Play for 100 hours total across all runs.",
    category: "milestones",
    icon: "💯",
    check: (c) => (c.totalPlayTime || 0) >= 360000,
    bonus: { type: "production", value: 0.02 },
  },
  {
    id: "milestone_millennium_played",
    name: "Eternal Witness",
    desc: "Play for 1000 hours total across all runs.",
    category: "milestones",
    icon: "🌟",
    check: (c) => (c.totalPlayTime || 0) >= 3600000,
    bonus: { type: "production", value: 0.03 },
  },

  // ----- IDLE + PAUSE -----
  {
    id: "milestone_idle_master",
    name: "Idle Master",
    desc: "Let the game run for 1 hour without clicking.",
    category: "milestones",
    icon: "😴",
    check: (c) => (c.idleDurationSec || 0) >= 3600,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "milestone_pause_master",
    name: "Pause Master",
    desc: "Pause the game for 60 seconds straight.",
    category: "milestones",
    icon: "⏸️",
    check: (c) => (c.pauseDurationSec || 0) >= 60,
    bonus: { type: "capacity", value: 0.01 },
  },

  // ----- POPULATION TIERS -----
  {
    id: "milestone_pop_50",
    name: "Village",
    desc: "Reach 50 population in a single run.",
    category: "milestones",
    icon: "🏘️",
    check: (c) => (c.maxPopulation || 0) >= 50,
    bonus: { type: "pop", value: 0.01 },
  },
  {
    id: "milestone_pop_200",
    name: "Town",
    desc: "Reach 200 population in a single run.",
    category: "milestones",
    icon: "🏙️",
    check: (c) => (c.maxPopulation || 0) >= 200,
    bonus: { type: "pop", value: 0.015 },
  },
  {
    id: "milestone_pop_1000",
    name: "Metropolis",
    desc: "Reach 1,000 population in a single run.",
    category: "milestones",
    icon: "🌆",
    check: (c) => (c.maxPopulation || 0) >= 1000,
    bonus: { type: "pop", value: 0.02 },
  },
  {
    id: "milestone_pop_5000",
    name: "Megalopolis",
    desc: "Reach 5,000 population in a single run.",
    category: "milestones",
    icon: "🌃",
    check: (c) => (c.maxPopulation || 0) >= 5000,
    bonus: { type: "pop", value: 0.025 },
  },
  {
    id: "milestone_pop_10000",
    name: "Population Boom",
    desc: "Reach 10,000 population in a single run.",
    category: "milestones",
    icon: "🌍",
    check: (c) => (c.maxPopulation || 0) >= 10000,
    bonus: { type: "pop", value: 0.03 },
  },
  {
    id: "milestone_pop_100000",
    name: "World Soul",
    desc: "Reach 100,000 population in a single run.",
    category: "milestones",
    icon: "🌌",
    check: (c) => (c.maxPopulation || 0) >= 100000,
    bonus: { type: "pop", value: 0.03 },
  },

  // ----- SYSTEMS BUILT TIERS -----
  {
    id: "milestone_systems_10",
    name: "Hands-On Builder",
    desc: "Build 10 distinct system types.",
    category: "milestones",
    icon: "🏗️",
    check: (c) => c.systemsDiscoveredCount >= 10,
    bonus: { type: "capacity", value: 0.005 },
  },
  {
    id: "milestone_systems_50",
    name: "Master Architect",
    desc: "Build 50 distinct system types.",
    category: "milestones",
    icon: "🏰",
    check: (c) => c.systemsDiscoveredCount >= 50,
    bonus: { type: "capacity", value: 0.01 },
  },
  {
    id: "milestone_systems_100",
    name: "System Overload",
    desc: "Build 500 total systems across all runs.",
    category: "milestones",
    icon: "⚡",
    check: (c) => (c.totalSystemsBuilt || 0) >= 500,
    bonus: { type: "capacity", value: 0.015 },
  },
  {
    id: "milestone_systems_all",
    name: "Cosmic Builder",
    desc: "Build all 437 system types across all stages.",
    category: "milestones",
    icon: "🌌",
    check: (c) => c.systemsDiscoveredCount >= 437,
    bonus: { type: "capacity", value: 0.03 },
  },

  // ----- TECHS RESEARCHED TIERS -----
  {
    id: "milestone_techs_10",
    name: "Curious Mind",
    desc: "Research 10 different technologies.",
    category: "milestones",
    icon: "🔬",
    check: (c) => c.techResearchedCount >= 10,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "milestone_techs_50",
    name: "Scholar",
    desc: "Research 50 different technologies.",
    category: "milestones",
    icon: "📚",
    check: (c) => c.techResearchedCount >= 50,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "milestone_techs_100",
    name: "Renaissance Man",
    desc: "Research 100 different technologies.",
    category: "milestones",
    icon: "🎓",
    check: (c) => c.techResearchedCount >= 100,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "milestone_techs_200",
    name: "Polymath",
    desc: "Research 200 different technologies.",
    category: "milestones",
    icon: "🧠",
    check: (c) => c.techResearchedCount >= 200,
    bonus: { type: "production", value: 0.02 },
  },
  {
    id: "milestone_techs_all",
    name: "Universal Mind",
    desc: "Research all 406 technologies across all stages.",
    category: "milestones",
    icon: "🌟",
    check: (c) => c.techResearchedCount >= 406,
    bonus: { type: "production", value: 0.03 },
  },

  // ----- EVENTS RESOLVED TIERS -----
  {
    id: "milestone_first_event",
    name: "Tested by Chance",
    desc: "Resolve your first random event.",
    category: "milestones",
    icon: "🎲",
    check: (c) => (c.totalEventsResolved || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "milestone_ten_events",
    name: "Weathered",
    desc: "Resolve 10 random events across all runs.",
    category: "milestones",
    icon: "🌦️",
    check: (c) => (c.totalEventsResolved || 0) >= 10,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "milestone_fifty_events",
    name: "Storm-Tossed",
    desc: "Resolve 50 random events across all runs.",
    category: "milestones",
    icon: "⛈️",
    check: (c) => (c.totalEventsResolved || 0) >= 50,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "milestone_hundred_events",
    name: "Fate-Touched",
    desc: "Resolve 100 random events across all runs.",
    category: "milestones",
    icon: "🌧️",
    check: (c) => (c.totalEventsResolved || 0) >= 100,
    bonus: { type: "production", value: 0.02 },
  },
  {
    id: "milestone_five_hundred_events",
    name: "Chaos-Walker",
    desc: "Resolve 500 random events across all runs.",
    category: "milestones",
    icon: "🌪️",
    check: (c) => (c.totalEventsResolved || 0) >= 500,
    bonus: { type: "production", value: 0.025 },
  },

  // ----- STORY UNLOCKED TIERS -----
  {
    id: "milestone_first_scripture",
    name: "First Word",
    desc: "Unlock your first story entry.",
    category: "milestones",
    icon: "📖",
    check: (c) => c.storyUnlockedCount >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "milestone_five_scriptures",
    name: "Chronicler",
    desc: "Unlock 5 story entries.",
    category: "milestones",
    icon: "✍️",
    check: (c) => c.storyUnlockedCount >= 5,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "milestone_all_scriptures",
    name: "Testament",
    desc: "Unlock all 34 story entries.",
    category: "milestones",
    icon: "📜",
    check: (c) => c.storyUnlockedCount >= 34,
    bonus: { type: "production", value: 0.02 },
  },

  // ----- SHOP UPGRADES TIERS -----
  {
    id: "milestone_first_upgrade",
    name: "Investor",
    desc: "Purchase your first shop upgrade.",
    category: "milestones",
    icon: "🛒",
    check: (c) => c.upgradesOwnedCount >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "milestone_five_upgrades",
    name: "Patron",
    desc: "Own 5 shop upgrades (any levels).",
    category: "milestones",
    icon: "💎",
    check: (c) => c.upgradesOwnedCount >= 5,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "milestone_ten_upgrades",
    name: "Connoisseur",
    desc: "Own 10 shop upgrades (any levels).",
    category: "milestones",
    icon: "💠",
    check: (c) => c.upgradesOwnedCount >= 10,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "milestone_twenty_five_upgrades",
    name: "Collector",
    desc: "Own 25 shop upgrades (any levels).",
    category: "milestones",
    icon: "🏆",
    check: (c) => c.upgradesOwnedCount >= 25,
    bonus: { type: "production", value: 0.02 },
  },
  {
    id: "milestone_shopaholic",
    name: "Shopaholic",
    desc: "Own all 48 shop upgrades (any levels).",
    category: "milestones",
    icon: "🛍️",
    check: (c) => c.upgradesOwnedCount >= 48,
    bonus: { type: "production", value: 0.025 },
  },

  // ----- LINEAGE ARCHETYPES TIERS -----
  {
    id: "milestone_three_archetypes",
    name: "Diverse Genesis",
    desc: "Lock in 3 different archetypes across runs.",
    category: "milestones",
    icon: "🧬",
    check: (c) => (c.archivedArchetypes?.length || 0) >= 3,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "milestone_archetype_collector",
    name: "Archetype Collector",
    desc: "Lock in 5 different archetypes across runs.",
    category: "milestones",
    icon: "🗂️",
    check: (c) => (c.archivedArchetypes?.length || 0) >= 5,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "milestone_six_archetypes",
    name: "Lineage Cartographer",
    desc: "Lock in 6 different archetypes across runs.",
    category: "milestones",
    icon: "🗺️",
    check: (c) => (c.archivedArchetypes?.length || 0) >= 6,
    bonus: { type: "production", value: 0.02 },
  },
  {
    id: "milestone_nine_basic_archetypes",
    name: "Specimen Cabinet",
    desc: "Lock in all 9 basic archetypes.",
    category: "milestones",
    icon: "🗃️",
    check: (c) => {
      const basics = ["humanoid", "mammalian", "reptilian", "avian", "arthropoid", "molluscoid", "fungoid", "plantoid", "aquatic"];
      return basics.every((id) => (c.archivedArchetypes || []).includes(id));
    },
    bonus: { type: "production", value: 0.025 },
  },
  {
    id: "milestone_all_basic_archetypes",
    name: "Completionist",
    desc: "Lock in all 13 archetypes (basic + rare).",
    category: "milestones",
    icon: "📇",
    check: (c) => (c.archivedArchetypes?.length || 0) >= 13,
    bonus: { type: "production", value: 0.03 },
  },
  {
    id: "milestone_first_rare_archetype",
    name: "Rare Genesis",
    desc: "Lock in a rare archetype (Lithoid, Necroid, Toxoid, or Extremophile).",
    category: "milestones",
    icon: "💠",
    check: (c) => {
      const rares = ["lithoid", "necroid", "toxoid", "extremophile"];
      return (c.archivedArchetypes || []).some((id) => rares.includes(id));
    },
    bonus: { type: "production", value: 0.02 },
  },

  // ----- GALAXIES CONQUERED TIERS -----
  {
    id: "milestone_first_galaxy_conquered",
    name: "Conqueror",
    desc: "Conquer 1 rival galaxy.",
    category: "milestones",
    icon: "🚀",
    check: (c) => (c.galaxiesConquered || 0) >= 1,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "milestone_five_galaxies_conquered",
    name: "Galactic Hegemon",
    desc: "Conquer 5 rival galaxies.",
    category: "milestones",
    icon: "🛸",
    check: (c) => (c.galaxiesConquered || 0) >= 5,
    bonus: { type: "production", value: 0.025 },
  },

  // ----- RIFTS / ANCHORS TIERS -----
  {
    id: "milestone_five_anchors",
    name: "Anchorite",
    desc: "Place 5 reality anchors.",
    category: "milestones",
    icon: "🪨",
    check: (c) => (c.anchorsPlaced || 0) >= 5,
    bonus: { type: "capacity", value: 0.01 },
  },
  {
    id: "milestone_ten_anchors",
    name: "Bedrock",
    desc: "Place 10 reality anchors (L6 → L7 unlock threshold).",
    category: "milestones",
    icon: "⛰️",
    check: (c) => (c.anchorsPlaced || 0) >= 10,
    bonus: { type: "capacity", value: 0.015 },
  },
  {
    id: "milestone_fifty_rifts",
    name: "Void Stitcher",
    desc: "Close 50 rifts total.",
    category: "milestones",
    icon: "🕳️",
    check: (c) => (c.riftsClosed || 0) >= 50,
    bonus: { type: "capacity", value: 0.02 },
  },

  // ----- COSMIC BOONS TIERS -----
  {
    id: "milestone_three_cosmic_boons",
    name: "Dimension Hopper",
    desc: "Earn 3 Cosmic Boons.",
    category: "milestones",
    icon: "💫",
    check: (c) => (c.cosmicBoonStacks || 0) >= 3,
    bonus: { type: "ep", value: 0.015 },
  },
  {
    id: "milestone_five_cosmic_boons",
    name: "Multiverse Walker",
    desc: "Earn 5 Cosmic Boons.",
    category: "milestones",
    icon: "🌈",
    check: (c) => (c.cosmicBoonStacks || 0) >= 5,
    bonus: { type: "ep", value: 0.02 },
  },
  {
    id: "milestone_ten_cosmic_boons",
    name: "Cosmic Sovereign",
    desc: "Earn 10 Cosmic Boons.",
    category: "milestones",
    icon: "👑",
    check: (c) => (c.cosmicBoonStacks || 0) >= 10,
    bonus: { type: "ep", value: 0.025 },
  },

  // ----- OLD GOD BATTLES WON TIERS -----
  {
    id: "milestone_first_old_god",
    name: "First God-Fall",
    desc: "Defeat your first Old God.",
    category: "milestones",
    icon: "🗡️",
    check: (c) => (c.oldGodBattlesWon || 0) >= 1,
    bonus: { type: "production", value: 0.015 },
  },

  // ----- DIVINE ENGINE WORLDS TIERS -----
  {
    id: "milestone_thousand_worlds",
    name: "World Counter",
    desc: "Reach 1,000 worlds in the Divine Engine.",
    category: "milestones",
    icon: "🌍",
    check: (c) => (c.divineEngineWorlds || 0) >= 1000,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "milestone_ten_thousand_worlds",
    name: "World Counter II",
    desc: "Reach 10,000 worlds in the Divine Engine.",
    category: "milestones",
    icon: "🪐",
    check: (c) => (c.divineEngineWorlds || 0) >= 10000,
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "milestone_hundred_thousand_worlds",
    name: "World Counter III",
    desc: "Reach 100,000 worlds in the Divine Engine.",
    category: "milestones",
    icon: "🌌",
    check: (c) => (c.divineEngineWorlds || 0) >= 100000,
    bonus: { type: "production", value: 0.02 },
  },
  {
    id: "milestone_million_worlds",
    name: "Million Worlds",
    desc: "Reach 1,000,000 worlds in the Divine Engine.",
    category: "milestones",
    icon: "✨",
    check: (c) => (c.divineEngineWorlds || 0) >= 1000000,
    bonus: { type: "production", value: 0.03 },
  },

  // ----- STAR SYSTEMS CLAIMED (L4) TIERS -----

  // ----- MARKET DIVIDENDS TIERS -----
  {
    id: "milestone_market_mogul",
    name: "Market Mogul",
    desc: "Earn 10,000 Divinity from portfolio dividends.",
    category: "milestones",
    icon: "💰",
    check: (c) => (c.portfolioDividendsEarned || 0) >= 10000,
    bonus: { type: "ep", value: 0.015 },
  },

  // ----- SPECIFIC USER-REQUESTED MILESTONES -----
  {
    id: "milestone_first_mutation",
    name: "First Mutation",
    desc: "Trigger a mutation event in the creature lab.",
    category: "milestones",
    icon: "🧬",
    check: (c) => (c.mutationsTriggered || 0) >= 1,
    bonus: { type: "pop", value: 0.01 },
  },
  {
    id: "milestone_government_established",
    name: "Government Established",
    desc: "Get your first government assigned at the Civilization stage.",
    category: "milestones",
    icon: "🏛️",
    check: (c) => (c.governmentAssigned || false),
    bonus: { type: "production", value: 0.015 },
  },
  {
    id: "milestone_trial_and_error",
    name: "Trial and Error",
    desc: "Abandon 5 trials.",
    category: "milestones",
    icon: "❌",
    check: (c) => (c.trialsAbandoned || 0) >= 5,
    bonus: { type: "production", value: 0.01 },
  },

  // ========================================================================
  // CATEGORY 4 — FUN / HIDDEN ACHIEVEMENTS (~30)
  // UI-driven / easter-egg achievements + retained legacy curiosities.
  // ========================================================================

  // ----- UI / EASTER-EGG -----
  {
    id: "fun_title_clicker",
    name: "Title Clicker",
    desc: "Click the \"Cosmogenesis\" title 10 times to unlock debug mode.",
    category: "fun",
    icon: "🖱️",
    check: (c) => (c.titleClickCount || 0) >= 10,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "fun_hidden_message",
    name: "Easter Egg: Hidden Message",
    desc: "Click the version text 5 times.",
    category: "fun",
    icon: "🥚",
    check: (c) => (c.versionClickCount || 0) >= 5,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "fun_view_credits",
    name: "View Credits",
    desc: "View the Layer 10 ending screen.",
    category: "fun",
    icon: "🎬",
    check: (c) => (c.viewedCredits || false),
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "fun_ai_detected",
    name: "AI Detected",
    desc: "Activate the AI theme.",
    category: "fun",
    icon: "🤖",
    check: (c) => (c.aiThemeActive || false),
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "fun_time_traveler",
    name: "Time Traveler",
    desc: "Use the offline progress feature.",
    category: "fun",
    icon: "⏳",
    check: (c) => (c.offlineProgressUsed || false),
    bonus: { type: "production", value: 0.005 },
  },

  // ----- LEGACY CURIOSITIES (kept from prior achievement set) -----
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a])
);

export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; label: string; icon: string }[] = [
  { id: "stages", label: "Stages", icon: "⚡" },
  { id: "layers", label: "Layers", icon: "🌀" },
  { id: "milestones", label: "Milestones", icon: "🏆" },
  { id: "fun", label: "Fun / Hidden", icon: "🥚" },
];

// Compute total bonus from earned achievements of a given type.
export function achievementBonus(
  earned: Record<string, boolean>,
  ctx: AchievementCheckCtx,
  type: AchievementBonusType = "production"
): number {
  let total = 0;
  for (const ach of ACHIEVEMENTS) {
    const isEarned = earned[ach.id] || ach.check(ctx);
    if (isEarned && ach.bonus.type === type) {
      total += ach.bonus.value;
    }
  }
  return total;
}
