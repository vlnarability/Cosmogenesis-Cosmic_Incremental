"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GameState, GameStore, StageId, TabId } from "./types";
import { emptyResources, emptyCapacities, RESOURCE_MAP, RESOURCES } from "../data/resources";
import { STAGES, STAGE_IDS, nextStage } from "../data/stages";
import { ACTION_MAP } from "../data/actions";
import { SYSTEMS, SYSTEM_MAP, systemCost, systemsForStage } from "../data/systems";
import { TECH_MAP, TECHS, techsForStage } from "../data/techs";
import { UPGRADE_MAP, UPGRADES, upgradeCost } from "../data/upgrades";
import { STORY_MAP, STORY_TRIGGERS } from "../data/story";
import { ARCHETYPE_MAP, dominantArchetype, isArchetypeImmuneToEvent } from "../data/archetypes";
import { GOVERNMENT_MAP, HAPPINESS_DRIFT_SCALE, pickGovernmentForEmpire } from "../data/governments";
import { ACHIEVEMENTS, achievementBonus, type AchievementCheckCtx } from "../data/achievements";
import { EVENTS, eventsForStage, EVENT_MAP } from "../data/events";
import {
  CHALLENGES,
  CHALLENGE_MAP,
  getMaxRepeats,
  getChallengeDebuffAtRepeat,
  challengeMasteryBonusFromRepeats,
  MAX_REPEATS_WITH_MASTERY,
  type ChallengeEffects,
} from "../data/challenges";
import { countChallengesCompleted } from "../data/prestigeLayers";
import {
  FORESIGHT_NODES,
  FORESIGHT_NODE_MAP,
  FORESIGHT_ROUTE_MAP,
  foresightBonus,
  routeBonus,
  countForesightNodes,
  FORESIGHT_NODES_REQUIRED_FOR_LAYER_3,
} from "../data/foresight";
import {
  CONSTELLATIONS,
  CONSTELLATION_MAP,
  constellationBonus,
  countCompletedConstellations,
  countLitStars,
  canAdvanceToTranscendence,
  starCost,
  CONSTELLATIONS_REQUIRED_FOR_LAYER_3,
  STARGAZE_COST,
  STARGAZE_COOLDOWN_SEC,
  SUPERNOVA_COST,
  SUPERNOVA_COOLDOWN_SEC,
  BLACK_HOLE_COST,
  BLACK_HOLE_COOLDOWN_SEC,
  BLACK_HOLE_REFUND_FRACTION,
  COSMIC_BRIDGE_COST,
  COSMIC_BRIDGE_COOLDOWN_SEC,
  COSMIC_BRIDGE_DURATION_SEC,
  STARGAZE_CD_KEY,
  SUPERNOVA_CD_KEY,
  BLACK_HOLE_CD_KEY,
  COSMIC_BRIDGE_CD_KEY,
  type ConstellationState,
  type CosmicBridgeLink,
} from "../data/constellations";
import {
  OFFERINGS,
  OFFERING_MAP,
  RITUALS,
  RITUAL_MAP,
  SCRIPTS,
  BLOOD_PACTS,
  BLOOD_PACT_MAP,
  offeringDivinityAtRepeat,
  activeRitualProductionBonus,
  activeRitualCapBonus,
  activeRitualEpBonus,
  activeRitualPopBonus,
  transcendenceDivinityPerSecond,
  allBloodPactsUsed,
} from "../data/transcendence";
import {
  PORTFOLIOS,
  PORTFOLIO_MAP,
  PORTFOLIO_PRICE_MIN,
  PORTFOLIO_PRICE_MAX,
  PORTFOLIO_PRICE_START,
  PORTFOLIO_PRICE_DRIFT,
  portfolioDividendsPerSec,
  totalAllocatedWorlds,
} from "../data/marketPortfolios";
import {
  CRADLE_WORLDS,
  PRIME_CONDITIONS,
  SACRED_GEOGRAPHIES,
  DORMANT_SEEDS,
  DIFFICULTY_TIERS,
  worldProductionMult,
  worldCapMult,
  worldEpMultiplier,
  worldPopGrowthMult,
  hasAuthoredWorld,
  type WorldConfig,
} from "../data/genesis";
import {
  DIVINE_LAWS,
  DIVINE_LAW_MAP,
  WORSHIP_MODES,
  WORSHIP_MODE_MAP,
  MIRACLES,
  MIRACLE_MAP,
  HERESY_RESPONSES,
  HERESY_RESPONSE_MAP,
  divineLawBonus,
  worshipModeBonus,
  heresyRateMult,
  heresyResponseProductionMult,
  hasEnactedThreeLaws,
} from "../data/apotheosis";
import {
  GALAXY_SYSTEMS,
  GALAXY_SYSTEM_MAP,
  GALAXY_SCAN_COST,
  makeInitialGalaxySystems,
  summarizeGalaxyBonuses,
  isGalaxyComplete,
  galaxyClaimCost,
  getGalaxySystemNeighbors,
  type GalaxySystemState,
} from "../data/galaxyMap";
import {
  RIVAL_GALAXIES,
  RIVAL_GALAXY_MAP,
  GALAXY_MAP_BY_ID,
  STARTER_GALAXY_ID,
  TOTAL_RIVAL_SYSTEMS,
  WORLDS_PER_RIVAL_SYSTEM,
  TOTAL_NEW_WORLDS_L5,
  GALAXIES_REQUIRED_FOR_L6,
  makeInitialRivalSystems,
  galaxyAttackCost,
  isGalaxyConquered,
  countConqueredGalaxies,
  countClaimedRivalSystems,
  rivalSystemWorlds,
  heresySeverity,
  heresyLossCount,
  averageHeresy,
  ownedGalaxyIds,
  type RivalSystemState,
} from "../data/galaxies";
import {
  UNIVERSAL_GALAXIES,
  UNIVERSAL_GALAXY_MAP,
  TOTAL_UNIVERSAL_GALAXIES,
  TOTAL_NEW_GALAXIES_L6,
  TOTAL_NEW_SYSTEMS_L6,
  WORLDS_PER_NEW_SYSTEM_L6,
  TOTAL_NEW_WORLDS_L6,
  RIFTS_REQUIRED_FOR_L7,
  ANCHORS_REQUIRED_FOR_L7,
  ANCHOR_RADIUS,
  RIFT_SPAWN_MIN_SEC,
  RIFT_SPAWN_MAX_SEC,
  RIFT_CORRUPTION_PER_TICK,
  RIFT_SEVERITY_MIN,
  RIFT_SEVERITY_MAX,
  galaxiesInAnchorRadius,
  isGalaxyAnchored,
  riftCloseCost,
  anchorPlaceCost,
  newGalaxyAttackCost,
  isUniversalMapComplete,
  makeInitialUniversalGalaxies,
  totalNewSystemsClaimed,
  totalRivalSystemsClaimed,
  totalUniversalSystemsClaimed,
  pickRiftSpawnTarget,
  type UniversalGalaxyState,
  type Rift,
  type RealityAnchor,
} from "../data/universalMap";
import {
  CREATURE_BODY_TYPES,
  CREATURE_BODY_TYPE_MAP,
  CREATURE_DIETS,
  CREATURE_DIET_MAP,
  CREATURE_SPECIALS,
  CREATURE_SPECIAL_MAP,
  LEGION_MAX_CREATURES,
  OMNIPOTENCE_STANCES,
  OMNIPOTENCE_STANCE_MAP,
  legionBonus,
  legionInstabilityPerSec,
  computeCreatureStats,
  creatureInstabilityPerSec,
  legionPower,
  instabilityRateMult,
  effectiveInstabilityRate,
  isOmnipotenceComplete,
  OUTPOST_RAIDS,
  OUTPOST_RAID_MAP,
  OUTPOST_RAID_COUNT_FOR_L8,
  CREATURE_XP_PER_LEVEL,
  CREATURE_XP_PER_RAID,
  OUTPOST_RAID_SPAWN_INTERVAL_SEC,
  MAX_ACTIVE_OUTPOST_RAIDS,
  INSTABILITY_ROGUE_THRESHOLD,
  INSTABILITY_AFTER_ROGUE,
  creatureLevel,
  creatureLevelBonus,
  raidDeployedPower,
  type OmnipotenceStanceId,
  type CreatureBodyTypeId,
  type CreatureDietId,
  type CreatureSpecialId,
  type Creature,
  type Legion,
  type OutpostRaid,
} from "../data/omnipotence";
import {
  MINOR_GODS,
  MINOR_GOD_MAP,
  RELATIONSHIP_NEGOTIATE_GAIN,
  RELATIONSHIP_TRADE_GAIN,
  RELATIONSHIP_ALLIANCE_THRESHOLD,
  RELATIONSHIP_MAX,
  allianceBonus,
  canFormAlliance,
  isDivinityComplete,
  type MinorGod,
} from "../data/divinity_layer";
import {
  OLD_GODS,
  OLD_GOD_MAP,
  makeInitialBattleState,
  divineFragmentBonus,
  computePlayerAttack,
  computeBossAttack,
  phaseForHp,
  isInfinityComplete,
  type BattleState,
} from "../data/infinity";
import {
  ENDING_CHOICE_MAP,
  cosmicBoonBonus,
} from "../data/eternity";
import {
  UNIVERSE_RULES,
  RULE_IDS,
  RULE_BASE,
  RULE_TOTAL_TARGET,
  BIG_BANG_DURATION_SEC,
  REVEAL_COST_RULE,
  REVEAL_COST_AMOUNT,
  ARCHETYPES,
  ARCHETYPE_MAP as GENESIS_ARCHETYPE_MAP,
  ARCHETYPE_COUNT,
  generateRandomRelic,
  generateRelicReward,
  computeCrucibleRules,
  matchArchetype,
  archetypeBonus,
  relicLossCount,
  isGenesisComplete,
  type DivineRelic,
} from "../data/genesisEngine";
import { getDimension, DIMENSIONS, DIMENSION_MAP } from "../data/dimensions";
import {
  STAGE_INDEX_TO_THEME,
  LAYER_ID_TO_THEME,
} from "../data/themes";
// REMOVED — active abilities were cut from the game (Task REMOVE-ABILITIES-
// REPLACE-CHALLENGES). The empty arrays/maps remain in activeAbilities.ts for
// save-compat; the only remaining runtime references to activeAbilityCooldowns
// / activeAbilityEffects are the tick-decay (which self-cleans old saves).
// Legacy trialRealms module — REMOVED in CLEANUP-LEGACY. The canonical L1
// system lives in `challenges.ts`.

const STORAGE_KEY = "evolution_idle_v2";

// ===== KEYBOARD SHORTCUTS (DEBUG-SHORTCUTS) =====
// Default mapping of action id → KeyboardEvent.key value. The
// useKeyboardShortcuts hook reads from `state.keyboardShortcuts` at fire
// time (so player can rebind in Settings → Shortcuts). Locked-layer
// shortcuts (trials/constellations/.../genesis) are gated by the layer
// being unlocked before firing — see the hook for the gate logic.
//
// Layer-action id → layerId mapping (used by the hook + the Settings UI):
//   trials        → "challenges"        (L1; gate = unlockedChallenges)
//   constellations → "enlightenment"    (L2)
//   market         → "transcendence"     (L3)
//   galaxy         → "genesis"           (L4)
//   heresy         → "apotheosis"        (L5)
//   universal      → "singularity"       (L6)
//   creatures      → "omnipotence"      (L7)
//   diplomacy      → "divinity"          (L8)
//   war            → "infinity"          (L9)
//   genesis        → "eternity"          (L10 — the Genesis Engine / Big Bang)
export const DEFAULT_KEYBOARD_SHORTCUTS: Record<string, string> = {
  pause: " ",
  speed1: "1",
  speed2: "2",
  speed4: "4",
  speed8: "8",
  save: "s",
  shop: "b",
  prestige: "p",
  trials: "t",
  constellations: "c",
  market: "m",
  galaxy: "g",
  heresy: "h",
  universal: "u",
  creatures: "l",
  diplomacy: "d",
  war: "f",
  genesis: "e",
  close: "Escape",
};

// Mapping of layer-action id → layer id (the unlock gate the hook checks).
export const SHORTCUT_LAYER_GATE: Record<string, string> = {
  trials: "challenges",          // special: gated by `unlockedChallenges`
  constellations: "enlightenment",
  market: "transcendence",
  galaxy: "genesis",
  heresy: "apotheosis",
  universal: "singularity",
  creatures: "omnipotence",
  diplomacy: "divinity",
  war: "infinity",
  genesis: "eternity",
};

// LAYER-AS-TAB — layerId → tab id. `openLayerModal(layerId)` calls
// `setTab(LAYER_TO_TAB[layerId])` in addition to the legacy `activeLayerModal`
// + `show*` flag flips. GameShell renders the layer content INLINE (as a
// tab) instead of inside a <Dialog>, so this is how the player exits now.
// The legacy `activeLayerModal` + `show*` flags stay for back-compat with
// any code still reading them (e.g. Header buttons highlighting the active
// layer chip; PrestigeTab onView buttons; useKeyboardShortcuts).
export const LAYER_TO_TAB: Record<string, TabId> = {
  challenges: "trials",
  enlightenment: "constellations",
  transcendence: "market",
  genesis: "galaxy",
  apotheosis: "conquest",
  singularity: "universe",
  omnipotence: "lab",
  divinity: "diplomacy",
  infinity: "war",
  eternity: "genesis_engine",
};

// ===== REBUILD: L1-6 helper factories =====
function makeInitialFollowerGrid(): Array<{ state: string; type: string }> {
  // 8×4 = 32 cells. All start faithful.
  return Array.from({ length: 32 }, () => ({ state: "faithful", type: "follower" }));
}

// (Legacy) makeInitialDimensions — REMOVED in the Universal Map redesign.
// The canonical L6 state lives in `universalGalaxies` (built via
// makeInitialUniversalGalaxies() from the data layer).

// Returns the layer overlay theme id for the highest unlocked layer (used by auto theme mode).
// Order matches the layer progression order in LAYER_ID_TO_THEME keys.
const LAYER_ORDER_FOR_THEME = [
  "eternity",
  "infinity",
  "divinity",
  "omnipotence",
  "singularity",
  "apotheosis",
  "genesis",
  "transcendence",
  "enlightenment",
  "evolution",
];
function highestUnlockedLayerThemeId(unlockedLayers: Record<string, boolean>): string | null {
  for (const layerId of LAYER_ORDER_FOR_THEME) {
    if (unlockedLayers[layerId]) {
      return LAYER_ID_TO_THEME[layerId] || null;
    }
  }
  return null;
}

// New layer-progression gates: per-layer "completion metric" → unlocks the next layer.
// L1 → L2: 3+ distinct challenges completed OR 5+ total challenge repeats.
export const TRIAL_REALMS_REQUIRED_FOR_LAYER_2 = 5;

function initialRunState(): Partial<GameState> {
  const resources = emptyResources();
  const capacities = emptyCapacities();
  resources.atp = 15;
  resources.glucose = 20;
  resources.happiness = 75;
  return {
    stageIndex: 0,
    time: 0,
    population: 8,
    populationProgress: 0,
    maxPopulation: 8,
    resources,
    capacities,
    ownedSystems: {},
    systemEnabled: {},
    technologies: {},
    archetypeAffinity: {},
    lockedArchetype: null,
    activeGovernment: null,
    log: ["New run started. The first spark stirs."],
  };
}

function initialMetaState(): Partial<GameState> {
  return {
    evolutionPoints: 0,
    totalRuns: 0,
    galacticWins: 0,
    stageClearCounts: Object.fromEntries(STAGE_IDS.map((s) => [s, 0])) as Record<StageId, number>,
    fastestCellClear: 0,
    totalEventsResolved: 0,
    totalPlayTime: 0,
    totalActions: 0,
    totalSystemsBuilt: 0,
    totalTechResearched: 0,
    upgrades: Object.fromEntries(UPGRADES.map((u) => [u.id, 0])),
    storyUnlocked: { first_spark: true },
    storyAcknowledged: {},
    archive: [],
    archivedArchetypes: [],
    revealedLineageArchetypes: {},
    unlockedLayers: { evolution: true, enlightenment: false, transcendence: false, genesis: false, apotheosis: false, singularity: false, omnipotence: false, divinity: false, infinity: false, eternity: false },
    achievements: {},
    newAchievements: [],
    // Layer 1 — Challenges
    unlockedChallenges: false,
    activeChallenge: null,
    completedChallenges: {},
    challengeRepeatCounts: {},
    showChallenges: false,
    // Auto-action timers (game-time markers for periodic automation).
    // PP-SHOP-TABS — extended with universal auto-buyer timers (one per layer).
    autoTimers: {
      system: 0,
      tech: 0,
      evolve: 0,
      challenge: 0,
      // Universal auto-buyers (PP-SHOP-TABS):
      light_stars: 0,
      invest_market: 0,
      claim_systems: 0,
      manage_heresy: 0,
      place_anchors: 0,
      negotiate: 0,
      attack_old_gods: 0,
      author_universes: 0,
    },

    // Layer 2 — Enlightenment (Foresight / Constellation Map)
    divinity: 0,
    foresightNodes: {}, // LEGACY compat — kept empty
    activeForesightRoute: null,
    showEnlightenment: false,
    // Constellation Map (new L2 loop — see src/game/data/constellations.ts)
    constellationStars: {},
    constellationProgress: {},
    constellationsStarted: {},
    constellationsCompleted: {},
    constellationNodes: {}, // LEGACY compat — kept empty
    constellationRevealed: {},
    cosmicBridgeLink: null,
    stargazeRecommendedActive: false,

    // Layer 3 — Transcendence
    transcendenceOfferingsUsed: {},
    purchasedRituals: {},
    activeTemporaryRituals: {},
    activeScripts: {},
    bloodPactsUsed: {},
    scriptTimers: {},
    showTranscendence: false,

    // Layer 4 — Genesis
    genesisSeeds: 0,
    authoredWorlds: [],
    pendingWorldConfig: {},
    showGenesis: false,

    // Layer 5 — Apotheosis
    faith: 0,
    enactedDivineLaws: {},
    activeWorshipMode: null,
    performedMiracles: {},
    miracleTimers: {},
    heresy: 0,
    activeHeresyResponse: "hr_ignore",
    showApotheosis: false,

    // Layer 6 — Singularity (Universal Map redesign — replaces Dimension Engine + Logic Cores)
    singularityCores: 0,
    showSingularity: false,
    // L6 Universal Map — 50 galaxies (10 L5 starter+rival + 40 NEW neutral).
    // `universalGalaxies` + `realityAnchors` persist across prestiges (anchors
    // are a permanent investment). `rifts` + `riftSpawnTimer` reset per-run.
    // `riftsClosed` + `anchorsPlaced` are lifetime counters (persist).
    universalGalaxies: makeInitialUniversalGalaxies(),
    rifts: [],
    realityAnchors: [],
    riftSpawnTimer: 45,
    riftsClosed: 0,
    anchorsPlaced: 0,

    // Layer 7 — Omnipotence (Bio-engineering)
    activeOmnipotenceStance: "balanced",
    instability: 0,
    showOmnipotence: false,
    // NEW: Creature Lab
    creatures: [],
    legions: [],
    geneticInstability: 0,
    creatureDesignDraft: { bodyType: "predator", diet: "herbivore", special: "regen", name: "" },
    // NEW: Skirmish Arena — outpost raids + creature XP/levels
    outpostRaids: [],
    raidsRepelled: 0,
    activeOutpostRaid: null,
    creatureXp: {},
    creatureLevels: {},
    outpostRaidSpawnTimer: OUTPOST_RAID_SPAWN_INTERVAL_SEC,
    // NOTE: autoManageHeresyTimer is intentionally NOT used — the canonical
    // Auto-Manage Heresy tick (further below) uses `autoTimers.manage_heresy`
    // and operates on per-galaxy `galaxyFollowerGrid`.

    // Layer 8 — Divinity (the layer; not the resource) — Divine Alliance
    showDivinityLayer: false,
    // NEW: Divine Alliance — initialize the 6 minor god NPCs and relationships
    minorGods: MINOR_GODS.map((g) => ({ ...g })),
    godRelationships: Object.fromEntries(MINOR_GODS.map((g) => [g.id, g.startingRelationship])),
    alliances: {},

    // Layer 9 — Infinity — Divine War
    showInfinity: false,
    // NEW: Divine War — battle state for each Old God
    oldGodBattles: Object.fromEntries(OLD_GODS.map((g) => [g.id, makeInitialBattleState(g.id)])),
    divineFragments: 0,

    // Layer 10 — Eternity — Genesis Engine (crucible + divine relics + 100 archetypes)
    chosenEnding: null,
    cosmicBoonStacks: 0,
    showEternity: false,
    activeDimension: "mundane",
    visitedDimensions: ["mundane"],
    // NEW: Genesis Engine state
    divineRelics: [],
    crucibleRelicIds: [],
    discoveredArchetypes: {},
    universeSimulating: false,
    simulationStartTime: 0,
    lastSimulationResult: null,

    currentTab: "actions",
    speed: 1,
    paused: false,
    showShop: false,
    showEvolve: false,
    showSettings: false,
    // FIX-UI-TABS — Log/Archive/Codex/Awards moved into a shared info
    // modal accessible from the gear dropdown (no longer on the main tab bar).
    activeInfoModal: null,
    // P6 — Modal Consolidation: single source-of-truth for which layer modal
    // is open. Per-layer `show*` flags are mirrored in openLayerModal() for
    // save-compat with old code that reads them directly.
    activeLayerModal: null,
    // P7 — Error states: latest purchase-error message + timestamp. UIs
    // subscribe and surface this inline (auto-fade via consumer hook).
    lastPurchaseError: null,
    activeStoryPopup: "first_spark",
    activeEvent: null,
    eventTimer: 0, // 60s countdown — auto-resolves with default choice when it hits 0
    eventCooldown: 60, // first event can fire after 60s
    eventHistory: [],
    hasSeenIntro: false,
    lastSaved: Date.now(),
    tutorialStep: 0,
    tutorialActive: true,
    tutorialDismissed: false,
    eventFrequency: "normal",
    debugFreeBuy: false,

    // AUTOBUYER-SETTINGS — archetype / government targeting preferences.
    // All four slots default to null (no preference); the shop panel sets
    // them via the setAutoBuyerSystemTarget / setAutoBuyerTechTarget /
    // setPreferredGovernment / setPreferredForesightRoute actions.
    autoBuyerSettings: {
      systemTarget: null,
      techTarget: null,
      preferredGovernment: null,
      preferredForesightRoute: null,
    },
    // EVENT-CHAINS — scheduled follow-up events awaiting their fire time.
    // Empty at fresh-start; populated by resolveEvent() when a choice has
    // a `followUpEvent` field. The tick scans for due entries and either
    // fires them (chance roll passed) or drops them (chance roll failed).
    pendingFollowUps: [],

    // Theme customization (Part 1)
    activeStageTheme: "stage-cell",
    activeLayerTheme: null,
    activeSpecialTheme: null,
    unlockedThemes: { "stage-cell": true },
    themeMode: "auto" as "auto" | "custom",

    // ===== QUICK WINS =====
    // WIN 2 — Active abilities (runtime, persisted across refresh)
    activeAbilityCooldowns: {},
    activeAbilityEffects: {},
    // WIN 3 — Ritual combo tracking
    lastRitualTime: 0,
    lastRitualId: null,
    ritualComboCount: 0,
    ritualComboTimer: 0,
    // WIN 5 — Prestige Points (universal currency)
    prestigePoints: 0,
    // WIN 7 — Random layer event timers (game-time markers)
    layerEventTimers: { trial_of_fortune: 0, vision: 0, divine_whim: 0, heresy_surge: 0 },

    // ===== REBUILD: LAYERS 1-6 UNIQUE GAMEPLAY LOOPS =====
    // Layer 1 — Trial Realms were REMOVED in CLEANUP-LEGACY. The canonical L1
    // system lives in `challenges.ts` (10 run-modifier challenges).
    // Layer 2 — Constellation Map: state fields declared above alongside
    // the other L2 fields. (constellationNodes / constellationRevealed
    // are kept as empty legacy compat records.)
    // Layer 3 — Divine Market
    marketPrices: { food: 10, water: 8, materials: 15, science: 20, gold: 25, energy: 30 },
    priceHistory: { food: [10], water: [8], materials: [15], science: [20], gold: [25], energy: [30] },
    marketOwnedResources: {},
    marketTickTimer: 10,
    // FEATURE 3 — Market Crashes
    marketCrashTimer: 120,
    marketCrashActive: false,
    marketCrashDuration: 0,
    // Layer 3 — DIVINE INVESTMENT MARKET (new design). Worlds (background sims)
    // allocated to the 5 portfolios in src/game/data/marketPortfolios.ts.
    // Each portfolio pays dividends × baseYield × peakProductionRate × 0.01 per
    // sec; riskier portfolios may crash & consume worlds. See the portfolio tick
    // block below + the `allocateWorlds` / `deallocateWorlds` / `buyStarFromMarket`
    // actions.
    portfolioAllocations: {},
    portfolioLockTimers: {},
    portfolioPrices: Object.fromEntries(
      PORTFOLIOS.map((p) => [p.id, PORTFOLIO_PRICE_START])
    ),
    portfolioDividendsEarned: 0,
    // Layer 4 — Sacred Grid was REMOVED in the L4 redesign (replaced by
    // `galaxySystems` below). Natural Disasters were also removed.
    // Layer 4 — Galaxy Claim: 50 star systems on a hex spiral (all unclaimed
    // at fresh-start; the explored flags come from the galaxyMap data).
    galaxySystems: makeInitialGalaxySystems(),
    // Layer 5 — Heresy Web (8×4 = 32 follower cells) — per-galaxy grids in `galaxyFollowerGrid`.
    heresySpreadTimer: 10,
    heresySeedTimer: 30,            // seed first heretic after 30s if grid is all-faithful
    heresyThresholdsSeeded: {},     // tracks 25/50/75 threshold seeding (per-galaxy, key `${gid}:${threshold}`)
    // FEATURE 5 — Prophets (max 2 at a time; per-galaxy: { galaxyId, cellIndex, lastConvertedAt })
    prophets: [],
    prophetConvertTimer: 10,
    // === L5 redesign — Galactic Conquest ===
    // Per-galaxy heresy level (galaxyId → 0-100). Starter starts at 0.
    galaxyHeresy: { [STARTER_GALAXY_ID]: 0 },
    // Per-galaxy 8×4 heresy follower grid. Starter seeded with all faithful.
    galaxyFollowerGrid: { [STARTER_GALAXY_ID]: makeInitialFollowerGrid() },
    // Per-galaxy rival star systems. Each rival galaxy gets `makeInitialRivalSystems(gid)`.
    galaxyRivalSystems: Object.fromEntries(
      RIVAL_GALAXIES.map((g) => [g.id, makeInitialRivalSystems(g.id)])
    ),
    // galaxyId → fully conquered. Drives the L5 → L6 unlock (3+ conquered).
    conqueredGalaxies: {},
    // Currently selected galaxy tab in the Apotheosis modal (cosmetic; persisted).
    selectedGalaxyId: STARTER_GALAXY_ID,

    // ===== FEATURE ENHANCEMENTS (L7–L10) =====
    // FEATURE 8 — Amplifiers (max 3 at a time)
    amplifiers: [],
    // FEATURE 9 — Temporal Storms (per-battle)
    temporalStorms: {},

    // ===== BACKGROUND-SIMULATION =====
    // Base game abstracted into passive Divinity generation after first prestige.
    peakProductionRate: 0,        // best per-second total production ever (META)
    backgroundSimulations: 0,     // COMPUTED each tick: (3 + starsLit) × simMult (cached for display)
    divinityFromBackground: 0,    // lifetime Divinity from background sims (META, display only)
    epFromBackground: 0,          // lifetime EP from background sims (META, display only)

    // ===== KEYBOARD SHORTCUTS (DEBUG-SHORTCUTS) =====
    // Default rebindable shortcuts. See DEFAULT_KEYBOARD_SHORTCUTS above for
    // the action-id → layer mapping + comments.
    keyboardShortcuts: { ...DEFAULT_KEYBOARD_SHORTCUTS },

    // ===== ACHIEVEMENT META (ACHIEVEMENT-EXPANSION) =====
    // Loose bag of counters + UI flags that don't fit elsewhere on GameState.
    // Wired keys are documented on the GameState type. Initialized to {} —
    // buildAchievementCtx reads with `|| 0` defaults so missing keys are safe.
    achievementMeta: {},
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialRunState(),
      ...initialMetaState(),

      // ============ TICK ============
      tick: (dt) => {
        const s = get();
        if (s.paused) return;

        // ACHIEVEMENT-EXPANSION — track consecutive idle duration (real
        // time since the last player-initiated action). When the gap
        // exceeds 1 second, increment `idleDurationSec` by the tick dt
        // (capped at 3600 = 1 hour, the "Idle Master" threshold). The
        // counter resets on any player action via `markPlayerAction`.
        // We mutate the local `s.achievementMeta` snapshot so that any
        // mid-tick flag updates (e.g. heresySurvivor) AND this idle
        // counter are persisted by the tail set() call.
        const idleMeta = { ...(s.achievementMeta || {}) };
        const lastActionRealTime = (idleMeta.lastActionRealTime as number) || 0;
        if (lastActionRealTime > 0) {
          const gapSec = (Date.now() - lastActionRealTime) / 1000;
          if (gapSec >= 1) {
            const prevIdle = (idleMeta.idleDurationSec as number) || 0;
            if (prevIdle < 3600) {
              idleMeta.idleDurationSec = Math.min(3600, prevIdle + dt);
            }
          }
        }
        // Persist onto the local snapshot so the tail set() picks it up.
        (s as GameState).achievementMeta = idleMeta;

        // ---- Temporal Acceleration: +0.5× effective speed per level ----
        const temporalLvl = s.upgrades["temporal_acceleration"] || 0;
        const temporalMult = 1 + temporalLvl * 0.5;
        // ---- Prestige Speed Bonus: +50% per total run (Part 2c) ----
        const prestigeSpeedMult = 1 + (s.totalRuns || 0) * 0.5;
        // ---- QUICK WIN 5 — Universal Speed upgrade: +10% per level ----
        const universalSpeedLvlTick = s.upgrades["universal_speed"] || 0;
        const universalSpeedMultTick = 1 + universalSpeedLvlTick * 0.10;
        const realDt = dt * s.speed * temporalMult * prestigeSpeedMult * universalSpeedMultTick;

        // ---- Deep Memory: +5% production per level per total run ----
        const deepMemLvl = s.upgrades["deep_memory"] || 0;
        const deepMemMult = 1 + deepMemLvl * 0.05 * (s.totalRuns || 0);

        const autoLvl = s.upgrades["inherited_efficiency"] || 0;
        let autoMult = (1 + autoLvl * 0.15) * deepMemMult;

        // ---- Active challenge debuff (scaled by repeat level) ----
        let challengeDebuff: ChallengeEffects = {};
        if (s.activeChallenge && s.unlockedChallenges) {
          const ch = CHALLENGE_MAP[s.activeChallenge];
          if (ch) {
            const repeat = s.challengeRepeatCounts?.[s.activeChallenge] || 0;
            challengeDebuff = getChallengeDebuffAtRepeat(ch, repeat);
            if (challengeDebuff.productionMult !== undefined) {
              autoMult *= challengeDebuff.productionMult;
            }
          }
        }

        // ---- Layers 2-6: aggregate additive bonuses (production, cap, pop, ep, cost) ----
        // Layer 2 — Constellation Map (new design): per-star + per-completed-constellation bonus.
        const constellationState: ConstellationState = {
          constellationStars: s.constellationStars || {},
          constellationProgress: s.constellationProgress || {},
          constellationsStarted: s.constellationsStarted || {},
          constellationsCompleted: s.constellationsCompleted || {},
        };
        const constB = constellationBonus(constellationState);
        // Legacy foresight field returns all-zeros on new saves; kept for legacy callers.
        const foresight = foresightBonus(s.foresightNodes || {});
        const route = routeBonus(s.activeForesightRoute);
        const ritualProd = activeRitualProductionBonus(s.purchasedRituals || {}, s.activeTemporaryRituals || {});
        const ritualCap = activeRitualCapBonus(s.purchasedRituals || {}, s.activeTemporaryRituals || {});
        const ritualPop = activeRitualPopBonus(s.purchasedRituals || {}, s.activeTemporaryRituals || {});
        // LAYER UPGRADE — world_blueprint: +50% per level (max 4) to all authored-world bonuses
        const wbLvl = (s.upgrades?.world_blueprint as number) || 0;
        const wbMult = 1 + 0.50 * wbLvl;
        const wProd = worldProductionMult(s.authoredWorlds || []) * wbMult;
        const wCap = worldCapMult(s.authoredWorlds || []) * wbMult;
        const wPop = worldPopGrowthMult(s.authoredWorlds || []) * wbMult;
        const dLaw = divineLawBonus(s.enactedDivineLaws || {});
        const wMode = worshipModeBonus(s.activeWorshipMode);
        const hResp = heresyResponseProductionMult(s.activeHeresyResponse);
        // Layer 7 — Omnipotence (creatures + legions + stance)
        const hybrids = legionBonus(s.creatures || [], s.legions || [], s.activeOmnipotenceStance);
        // Layer 8 — Divinity (alliances with minor gods)
        const allianceB = allianceBonus(s.alliances || {}, s.minorGods || MINOR_GODS);
        // Layer 9 — Infinity (divine fragments — permanent power boost per Old God defeated)
        const fragmentB = divineFragmentBonus(s.divineFragments || 0);
        // NEW: Genesis Engine — archetype bonus (+1% production per discovered archetype)
        const archetypeB = archetypeBonus(s.discoveredArchetypes || {});
        // LAYER UPGRADE — universe_foundation (now "Crucible Mastery"):
        // +25% per level (max 4) to the archetype bonus.
        const ufLvl = (s.upgrades?.universe_foundation as number) || 0;
        const ufMult = 1 + 0.25 * ufLvl;
        const archetypeProdMult = archetypeB.productionMult * ufMult;
        const cosmicBoon = cosmicBoonBonus(s.cosmicBoonStacks || 0);

        // L4 REDESIGN — Galaxy Claim bonuses (replaces the old Sacred Grid).
        // Each claimed system grants its bonus (production / capacity / EP /
        // pop). Systems adjacent to 2+ other claimed systems gain +50% to
        // their bonus value (synergy). Rare resources (alloys/data) are
        // tracked for the sidebar display but don't apply a direct tick bonus
        // (their boost is implicit: they sit on systems with stronger bonuses).
        const galaxySummary = summarizeGalaxyBonuses(s.galaxySystems || []);

        // FIX-ARCHETYPE-LOCKED — horizontal_transfer tech (Cell) grants
        // +5% production per system owned (additive). Computed early so it
        // can be folded into `layerProdBonus` below. `totalOwnedSystems` is
        // also re-declared later for the archetype-all-prod block, but the
        // value is identical.
        const totalOwnedSystemsEarly = Object.values(s.ownedSystems).reduce((a, b) => a + b, 0);
        const horizontalTransferBonus = s.technologies["horizontal_transfer"]
          ? totalOwnedSystemsEarly * 0.05
          : 0;

        const layerProdBonus =
          constB.productionMult +
          foresight.productionMult + route.productionMult + ritualProd +
          wProd + dLaw.productionMult + wMode.productionMult + hResp +
          hybrids.productionMult + allianceB.productionMult +
          fragmentB.productionMult +
          archetypeProdMult + cosmicBoon +
          galaxySummary.productionMult +  // L4 Galaxy Claim system bonuses (+ adjacency synergy)
          horizontalTransferBonus;       // FIX-ARCHETYPE-LOCKED — +5% prod per system
        const layerCapBonus =
          constB.capMult +
          foresight.capMult + route.capMult + ritualCap + wCap +
          dLaw.capMult +
          hybrids.capMult + allianceB.capMult +
          fragmentB.capMult +
          galaxySummary.capMult;  // L4 Galaxy Claim capacity bonuses
        const layerPopBonus =
          constB.popGrowthMult +
          foresight.popGrowthMult + route.popGrowthMult + ritualPop + wPop +
          dLaw.popGrowthMult +
          hybrids.popGrowthMult + allianceB.popGrowthMult +
          fragmentB.popGrowthMult +
          galaxySummary.popGrowthMult;  // L4 Galaxy Claim pop-growth bonuses

        // QUICK WIN 2 — Active abilities: Surge (×3 prod) + Overclock (×2 layer bonuses)
        const surgeActive = (s.activeAbilityEffects?.surge || 0) > 0;
        const overclockActive = (s.activeAbilityEffects?.overclock || 0) > 0;
        // QUICK WIN 3 — Divine Combo: +50% all production while ritualComboTimer > 0
        const divineComboActive = (s.ritualComboTimer || 0) > 0;
        // QUICK WIN 5 — Universal Boost upgrade: +5% all production per level
        const universalBoostLvl = s.upgrades["universal_boost"] || 0;
        const universalBoostMult = 1 + universalBoostLvl * 0.05;

        // Miracle: double production (one-shot temporary effect)
        const miracleDouble = (s.miracleTimers?.mir_genesis || 0) > 0;

        // Apply: overclock multiplies layer bonuses (foresight, ritual, etc.) by 2
        const layerProdBonusApplied = layerProdBonus * (overclockActive ? 2 : 1);
        // Surge multiplies total production output (after layer bonus & miracle)
        const surgeMult = surgeActive ? 3 : 1;
        const divineComboMult = divineComboActive ? 1.5 : 1;
        autoMult *= (1 + layerProdBonusApplied) * (miracleDouble ? 2 : 1) * surgeMult * divineComboMult * universalBoostMult;

        const techMult = techMultiplier(s, "production");
        const capBoostLvl = s.upgrades["expansive_vaults"] || 0;
        let capMult = 1 + capBoostLvl * 0.20;
        capMult *= (1 + layerCapBonus);
        if (challengeDebuff.capMult !== undefined) capMult *= challengeDebuff.capMult;
        const hasAutoBalancer = (s.upgrades["auto_balancer"] || 0) > 0;

        // Archetype bonus
        const archetype = s.lockedArchetype ? ARCHETYPE_MAP[s.lockedArchetype] : null;
        // ARCHETYPES-REWORK — extended archetype bonus fields.
        // archAllMult is composed of:
        //   - base allProductionMult (e.g. Humanoid +10%, Necroid Ascendant +20%)
        //   - productionPerSystemAllMult × totalOwnedSystems (Fungoid network)
        //   - productionInWarmStagesMult (Reptilian — Tribal+)
        //   - productionWhenLowResourcesMult (Extremophile — when avg fill < 20%)
        //   - productionWhenPlentifulMult (Extremophile debuff — when avg fill > 80%)
        const totalOwnedSystems = Object.values(s.ownedSystems).reduce((a, b) => a + b, 0);
        let archAllMult = archetype?.bonus.allProductionMult || 0;
        if (archetype?.bonus.productionPerSystemAllMult) {
          archAllMult += archetype.bonus.productionPerSystemAllMult * totalOwnedSystems;
        }
        const curStageId = STAGES[s.stageIndex].id;
        const isWarmStage = ["tribal", "civilization", "empire", "solar", "galactic"].includes(curStageId);
        if (archetype?.bonus.productionInWarmStagesMult && isWarmStage) {
          archAllMult += archetype.bonus.productionInWarmStagesMult;
        }
        // Extremophile conditional bonuses — based on average resource fill
        // across all resources that have a capacity > 0.
        if (archetype?.bonus.productionWhenLowResourcesMult || archetype?.bonus.productionWhenPlentifulMult) {
          let capSum = 0;
          let resSum = 0;
          for (const [r, v] of Object.entries(s.resources)) {
            const cap = s.capacities[r] || 0;
            if (cap > 0) {
              capSum += cap;
              resSum += Math.max(0, v);
            }
          }
          const fillRatio = capSum > 0 ? resSum / capSum : 1;
          if (archetype.bonus.productionWhenLowResourcesMult && fillRatio < 0.20) {
            archAllMult += archetype.bonus.productionWhenLowResourcesMult;
          }
          if (archetype.bonus.productionWhenPlentifulMult && fillRatio > 0.80) {
            archAllMult += archetype.bonus.productionWhenPlentifulMult;
          }
        }
        const archPopMult = archetype?.bonus.populationGrowthMult || 0;
        const archCapMult = archetype?.bonus.capMult || 0;
        const archMilitaryMult = archetype?.bonus.militaryPowerMult || 0;
        const archDisabledFrac = archetype?.bonus.productionFromDisabledSystemsMult || 0;
        const archMineralBonus = archetype?.bonus.productionFromMineralSystemsMult || 0;
        const archPopImmortal = !!archetype?.bonus.populationImmortal;
        const archPopGrowsNoFood = !!archetype?.bonus.popGrowsWithoutFood;
        const archHappinessPerTick = archetype?.bonus.happinessPerTick || 0;
        // Archetype system-cost multiplier (additive: +0.10 = +10% costs, -0.15 = -15%)
        const archSystemCostMult = archetype?.bonus.systemCostMult || 0;

        // GOVERNMENT-SYSTEMS — apply active government bonuses (set when the
        // player enters Empire stage). Folded into the archetype-bonus fields
        // below so the existing per-resource + capacity + pop + happiness
        // pipelines pick them up without duplicating logic.
        const gov = s.activeGovernment ? GOVERNMENT_MAP[s.activeGovernment] : null;
        const govAllMult = gov?.productionMult || 0;
        const govPopMult = gov?.popGrowthMult || 0;
        const govCapMult = gov?.capacityMult || 0;
        const govMilitaryMult = gov?.militaryMult || 0;
        // Happiness drift — government happinessMult (e.g. +0.20 Cultural
        // Republic) is scaled to a per-second delta and folded into the
        // archetype happiness drift so it caps naturally at the happiness cap.
        const govHappinessPerTick = (gov?.happinessMult || 0) * HAPPINESS_DRIFT_SCALE;
        // Per-resource government bonuses (science + gold). military is
        // folded into the combined military multiplier below; tradeMult stays
        // cosmetic until a market/trade system exists (mirrors archetype's
        // tradeValueMult handling).
        const govResourceBonus: Record<string, number> = {};
        if (gov?.scienceMult) govResourceBonus.science = (govResourceBonus.science || 0) + gov.scienceMult;
        if (gov?.goldMult)   govResourceBonus.gold    = (govResourceBonus.gold    || 0) + gov.goldMult;

        const allAllMult = archAllMult + govAllMult;
        const allPopMult = archPopMult + govPopMult;
        const allCapMult = archCapMult + govCapMult;
        const allMilitaryMult = archMilitaryMult + govMilitaryMult;
        const allHappinessPerTick = archHappinessPerTick + govHappinessPerTick;

        const resources = { ...s.resources };
        let capacities = recomputeCapacitiesFresh(s, capMult + allCapMult);

        // Cost reduction (frugality) — also used by auto-buyer
        // Layers 2-6: foresight cost reduction (additive, negative = cheaper).
        // New L2: completed constellations can also grant costMult reduction.
        const layerCostReduction = foresight.costMult + constB.costMult;
        const costReduction = (s.upgrades["frugality"] || 0) * 0.04 + Math.max(0, -layerCostReduction);
        // Challenge cost multiplier (debuff)
        const challengeCostMult = challengeDebuff.costMult ?? 1;

        // Apply system production — with cap-aware pausing
        // BACKGROUND-SIMULATION: accumulate the per-second total resource production
        // (before cap-clamping) so we can track `peakProductionRate` — the best
        // per-second production ever achieved. Used to scale passive Divinity
        // generation from background simulations after the first Galactic prestige.
        let totalProductionRate = 0;
        for (const [sysId, count] of Object.entries(s.ownedSystems)) {
          if (!count) continue;
          const sys = SYSTEM_MAP[sysId];
          if (!sys) continue;
          if (sys.requiredTech && !s.technologies[sys.requiredTech]) continue;

          // Check if system is manually disabled
          const manuallyEnabled = s.systemEnabled[sysId] !== false; // default true
          // ARCHETYPES-REWORK — Necroid grants partial production from disabled
          // systems (productionFromDisabledSystemsMult). When active, disabled
          // systems still produce at the fractional rate but consume no upkeep.
          const isDisabledProducer = !manuallyEnabled && archDisabledFrac > 0;
          if (!manuallyEnabled && !hasAutoBalancer && !isDisabledProducer) continue;

          // Cap-aware logic: if all output resources are at cap, idle the system
          // (don't produce, don't consume upkeep — no waste). Disabled producers
          // (necroid) skip this check — they still produce even when capped, but
          // only at the fractional rate.
          if (!isDisabledProducer) {
            const outputsCapped = Object.keys(sys.produces).length > 0 &&
              Object.keys(sys.produces).every((r) => {
                const cap = capacities[r] || 0;
                return (resources[r] || 0) >= cap - 0.01;
              });

            if (outputsCapped) {
              // System idles — no production, no upkeep
              continue;
            }
          }

          const stageMult = sys.stage === STAGES[s.stageIndex].id ? 1 : 0.5;
          // ARCHETYPES-REWORK — disabled producers (necroid) get only the
          // fractional production rate. They still benefit from archAllMult +
          // stage scaling, but their effective count is multiplied by the
          // fraction (e.g. 0.20 = 20% of normal output).
          // GOVERNMENT-SYSTEMS — govAllMult (productionMult) is folded in via
          // `allAllMult` so all-production bonuses from both sources stack.
          const disabledFrac = isDisabledProducer ? archDisabledFrac : 1;
          const mult = autoMult * techMult * stageMult * (1 + allAllMult) * disabledFrac;

          // Per-resource archetype bonus
          // ARCHETYPES-REWORK — military_power gets an additional multiplier
          // from militaryPowerMult (Reptilian +15%, Toxoid +15%, etc.).
          // Lithoid gets bonus production from stone/alloy-producing systems
          // (productionFromMineralSystemsMult).
          // GOVERNMENT-SYSTEMS — govResourceBonus (science + gold) and the
          // combined allMilitaryMult are folded in here.
          const produces = sys.produces as Record<string, number>;
          const sysIsMineral = !!(produces.stone || produces.alloys);
          for (const [r, v] of Object.entries(produces)) {
            const archResBonus = archetype?.bonus.productionMult?.[r] || 0;
            let resourceBonus = archResBonus + (govResourceBonus[r] || 0);
            if (r === "military_power" && allMilitaryMult) {
              resourceBonus += allMilitaryMult;
            }
            if (sysIsMineral && archMineralBonus && (r === "stone" || r === "alloys")) {
              resourceBonus += archMineralBonus;
            }
            const rate = v * count * mult * (1 + resourceBonus);
            resources[r] = (resources[r] || 0) + rate * realDt;
            totalProductionRate += rate; // accumulate per-second rate (pre-cap-clamp)
          }
          // Upkeep — disabled producers (necroid) consume NO upkeep.
          if (!isDisabledProducer && sys.upkeep) {
            const upkeep = sys.upkeep as Record<string, number>;
            for (const [r, v] of Object.entries(upkeep)) {
              resources[r] = (resources[r] || 0) - v * count * realDt;
            }
          }
        }

        // BACKGROUND-SIMULATION — update peakProductionRate if this tick's
        // total per-second production exceeds the previous best. META field:
        // persists across prestiges, never resets.
        const peakProductionRate = Math.max(s.peakProductionRate || 0, totalProductionRate);

        // Clamp resources to capacities (no overflow)
        for (const r of Object.keys(resources)) {
          const cap = capacities[r];
          if (cap != null && resources[r] > cap) resources[r] = cap;
          if (resources[r] < 0) resources[r] = 0;
        }

        // Slow passive ATP for cell (keeps early game from stalling)
        if (STAGES[s.stageIndex].id === "cell") {
          resources.atp = Math.min(capacities.atp || 30, resources.atp + 0.5 * realDt);
        }

        // ARCHETYPES-REWORK — archetype happiness drift (Fungoid -15% / Toxoid -10%).
        // Applied as a per-second delta, capped by the happiness capacity floor/ceiling.
        // GOVERNMENT-SYSTEMS — government happinessMult is folded in via
        // `allHappinessPerTick` so e.g. Cultural Republic (+20% happiness)
        // drifts happiness up while Totalitarian (-30%) drifts it down.
        if (allHappinessPerTick !== 0) {
          const cap = capacities.happiness || 100;
          const cur = resources.happiness ?? 50;
          const next = Math.max(0, Math.min(cap, cur + allHappinessPerTick * realDt));
          resources.happiness = next;
        }

        // Population growth with progress bar
        // QUICK WIN 1: 3× faster base rate (0.015 → 0.045) — waiting for pop is the #1 fun killer
        let popGrowthRate = 0.045; // base per second
        const happiness = resources.happiness || 50;
        popGrowthRate *= (1 + (happiness - 40) / 200);
        // GOVERNMENT-SYSTEMS — govPopMult folded into allPopMult.
        popGrowthRate *= (1 + allPopMult);
        // Layers 2-6: aggregate pop-growth bonus
        popGrowthRate *= (1 + layerPopBonus);

        // Direct pop-growth contributions from population-focused systems
        // (mitochondrial_bloom, brood_chamber, hearth_circle, sanitation_grid,
        // fertility_program, orbital_habitats, genetic_synthesizer).
        // These are independent of resource production cap logic — a brood
        // chamber keeps hatching even when its secondary outputs are capped.
        let systemPopGrowth = 0;
        for (const [sysId, count] of Object.entries(s.ownedSystems)) {
          if (!count) continue;
          const sys = SYSTEM_MAP[sysId];
          if (!sys || !sys.popGrowth) continue;
          // Respect manual disable (unless Auto-Balancer is active)
          const manuallyEnabled = s.systemEnabled[sysId] !== false;
          if (!manuallyEnabled && !hasAutoBalancer) continue;
          const stageMult = sys.stage === STAGES[s.stageIndex].id ? 1 : 0.5;
          systemPopGrowth += sys.popGrowth * count * stageMult;
        }
        popGrowthRate += systemPopGrowth;

        const curStage = STAGES[s.stageIndex];
        // ARCHETYPES-REWORK — Plantoid's popGrowsWithoutFood skips the
        // food/water depletion check (photosynthesis feeds the pop).
        if (!archPopGrowsNoFood && ["creature", "tribal", "civilization", "empire"].includes(curStage.id)) {
          const foodCap = capacities.food || 1;
          const waterCap = capacities.water || 1;
          const foodPct = (resources.food || 0) / foodCap;
          const waterPct = (resources.water || 0) / waterCap;
          if (foodPct < 0.1) popGrowthRate *= 0.3;
          if (waterPct < 0.1) popGrowthRate *= 0.3;
        }
        // Challenge pop-growth debuff
        if (challengeDebuff.popGrowthMult !== undefined) {
          popGrowthRate *= challengeDebuff.popGrowthMult;
        }

        // Population tech multiplier (from techs with multiplier.target === "population").
        // Intentionally isolated from production-tech carryover so pop growth has
        // its own balance curve (see techMultiplier helper).
        const popTechMult = techMultiplier(s, "population");
        popGrowthRate *= popTechMult;

        // ACHIEVEMENT-EXPANSION — apply the "pop" achievement bonus as an
        // additive multiplier on population growth (e.g. "Population Boom"
        // achievement grants +1% pop growth). Achievements are checked
        // against the current snapshot via buildAchievementCtx.
        popGrowthRate *= 1 + achievementBonus(s.achievements || {}, buildAchievementCtx(s), "pop");

        let populationProgress = (s.populationProgress || 0) + popGrowthRate * realDt;
        let population = s.population;
        while (populationProgress >= 1) {
          populationProgress -= 1;
          population += 1;
        }

        const maxPopulation = Math.max(s.maxPopulation || 0, population);

        const newTime = s.time + realDt;

        // ---- Auto-Builder: every 8s, buy cheapest affordable system ----
        let ownedSystems = s.ownedSystems;
        let systemEnabled = s.systemEnabled;
        let archetypeAffinity = s.archetypeAffinity;
        let totalSystemsBuilt = s.totalSystemsBuilt || 0;
        let autoTimers = { ...s.autoTimers };
        let technologies = s.technologies;
        let totalTechResearched = s.totalTechResearched || 0;

        // Auto-buyers always run (trial realm mini-games were removed in CLEANUP-LEGACY).
        const trialAutobuyersBlocked = false;

        // ---- Auto-Builder: every 8s, buy cheapest affordable system ----
        // Player MUST purchase the auto_system_buyer shop upgrade (8 EP) to enable.
        // AUTOBUYER-SETTINGS — when `systemTarget` is set, the buyer prefers
        // candidates whose `grantsAffinity.archetype` matches the target. The
        // sort order is (matchesTarget DESC, totalCost ASC) so the cheapest
        // matching candidate wins; when no candidate matches, the cheapest
        // overall wins (identical to the original behaviour).
        const hasAutoSystemBuyer = (s.upgrades["auto_system_buyer"] || 0) > 0;
        const systemBuyerInterval = 8;
        if (!trialAutobuyersBlocked && hasAutoSystemBuyer && newTime - (autoTimers.system || 0) >= systemBuyerInterval) {
          const stageId = STAGES[s.stageIndex].id;
          const totalSystemsNow = Object.values(ownedSystems).reduce((a, b) => a + b, 0);
          const maxSystemsCap = challengeDebuff.maxSystems ?? Infinity;
          const canExceedCap = totalSystemsNow < maxSystemsCap;
          const disableMilitary = !!challengeDebuff.disableMilitary;
          const systemTarget = s.autoBuyerSettings?.systemTarget || null;

          const candidates = SYSTEMS.filter((sys) => sys.stage === stageId)
            .map((sys) => {
              const owned = ownedSystems[sys.id] || 0;
              if (sys.maxOwned && owned >= sys.maxOwned) return null;
              if (sys.requiredTech && !technologies[sys.requiredTech]) return null;
              if (disableMilitary && sys.category === "Military") return null;
              const cost = systemCost(sys, owned, costReduction);
              // ARCHETYPES-REWORK — apply archetype system-cost modifier (Humanoid +10% / Arthropoid -15%)
              const archCostFactor = 1 + (archetype?.bonus.systemCostMult || 0);
              const scaledCost: Record<string, number> = {};
              let totalCost = 0;
              let canAfford = true;
              for (const [r, v] of Object.entries(cost)) {
                const scaled = Math.ceil((v as number) * challengeCostMult * archCostFactor);
                scaledCost[r] = scaled;
                totalCost += scaled;
                if ((resources[r] || 0) < scaled) canAfford = false;
              }
              const matchesTarget = !!systemTarget && !!(sys.grantsAffinity && sys.grantsAffinity.archetype === systemTarget);
              return { sys, scaledCost, totalCost, canAfford, matchesTarget };
            })
            .filter((x): x is NonNullable<typeof x> => x !== null && x.canAfford);

          if (canExceedCap && candidates.length > 0) {
            // AUTOBUYER-SETTINGS — sort by (matchesTarget DESC, totalCost ASC).
            candidates.sort((a, b) => {
              const aM = a.matchesTarget ? 1 : 0;
              const bM = b.matchesTarget ? 1 : 0;
              if (aM !== bM) return bM - aM;
              return a.totalCost - b.totalCost;
            });
            const pick = candidates[0];
            // Apply purchase
            const newResources = { ...resources };
            for (const [r, v] of Object.entries(pick.scaledCost)) {
              newResources[r] -= v;
            }
            Object.assign(resources, newResources);
            ownedSystems = { ...ownedSystems, [pick.sys.id]: (ownedSystems[pick.sys.id] || 0) + 1 };
            if (systemEnabled[pick.sys.id] === undefined) {
              systemEnabled = { ...systemEnabled, [pick.sys.id]: true };
            }
            if (pick.sys.grantsAffinity) {
              archetypeAffinity = { ...archetypeAffinity };
              const arch = pick.sys.grantsAffinity.archetype;
              archetypeAffinity[arch] = (archetypeAffinity[arch] || 0) + pick.sys.grantsAffinity.amount;
            }
            totalSystemsBuilt += 1;
            autoTimers.system = newTime;
          } else {
            // Even if no purchase happened, advance the timer so we don't retry every tick.
            autoTimers.system = newTime;
          }
        }

        // ---- Auto-Researcher: every 12s, research cheapest affordable tech ----
        // Player MUST purchase the auto_tech_buyer shop upgrade (10 EP) to enable.
        // AUTOBUYER-SETTINGS — when `techTarget` is set, the buyer prefers
        // techs whose `grantsAffinity.archetype` matches the target. The
        // sort order is (matchesTarget DESC, totalCost ASC).
        const hasAutoTechBuyer = (s.upgrades["auto_tech_buyer"] || 0) > 0;
        const techBuyerInterval = 12;
        if (!trialAutobuyersBlocked && hasAutoTechBuyer && newTime - (autoTimers.tech || 0) >= techBuyerInterval) {
          const stageId = STAGES[s.stageIndex].id;
          const disableTech = !!challengeDebuff.disableTech;
          const disableMilitary = !!challengeDebuff.disableMilitary;
          const techTarget = s.autoBuyerSettings?.techTarget || null;

          if (!disableTech) {
            const techCandidates = TECHS.filter((t) => t.stage === stageId && !technologies[t.id])
              .map((t) => {
                if (t.requires) {
                  for (const req of t.requires) {
                    if (!technologies[req]) return null;
                  }
                }
                if (disableMilitary && t.branch === "Conflict") return null;
                const cost = t.cost as Record<string, number>;
                const scaledCost: Record<string, number> = {};
                let totalCost = 0;
                let canAfford = true;
                for (const [r, v] of Object.entries(cost)) {
                  const scaled = Math.ceil(v * challengeCostMult);
                  scaledCost[r] = scaled;
                  totalCost += scaled;
                  if ((resources[r] || 0) < scaled) canAfford = false;
                }
                const matchesTarget = !!techTarget && !!(t.grantsAffinity && t.grantsAffinity.archetype === techTarget);
                return { t, scaledCost, totalCost, canAfford, matchesTarget };
              })
              .filter((x): x is NonNullable<typeof x> => x !== null && x.canAfford);

            if (techCandidates.length > 0) {
              // AUTOBUYER-SETTINGS — sort by (matchesTarget DESC, totalCost ASC).
              techCandidates.sort((a, b) => {
                const aM = a.matchesTarget ? 1 : 0;
                const bM = b.matchesTarget ? 1 : 0;
                if (aM !== bM) return bM - aM;
                return a.totalCost - b.totalCost;
              });
              const pick = techCandidates[0];
              const newResources = { ...resources };
              for (const [r, v] of Object.entries(pick.scaledCost)) {
                newResources[r] -= v;
              }
              Object.assign(resources, newResources);
              technologies = { ...technologies, [pick.t.id]: true };
              if (pick.t.grantsAffinity) {
                archetypeAffinity = { ...archetypeAffinity };
                const arch = pick.t.grantsAffinity.archetype;
                archetypeAffinity[arch] = (archetypeAffinity[arch] || 0) + pick.t.grantsAffinity.amount;
              }
              totalTechResearched += 1;
              autoTimers.tech = newTime;
            } else {
              autoTimers.tech = newTime;
            }
          } else {
            autoTimers.tech = newTime;
          }
        }

        // ---- Auto-Evolver: check every 2s, trigger evolve if threshold met ----
        // Player MUST purchase the auto_evolver shop upgrade (15 EP) to enable.
        // Threshold scales with level: 1.2, 1.4, 1.6, 1.8, 2.0, 2.2 (auto-evolves EARLIER as level rises).
        const autoEvolveLvl = s.upgrades["auto_evolver"] || 0;
        const hasAutoEvolver = autoEvolveLvl > 0;
        if (!trialAutobuyersBlocked && hasAutoEvolver && newTime - (autoTimers.evolve || 0) >= 2) {
          autoTimers.evolve = newTime;
          const stage = STAGES[s.stageIndex];
          const next = nextStage(stage.id);
          if (next) {
            // Threshold: 1.0 + autoEvolveLvl * 0.2 (level 1 = 1.2× reqs, level 5 = 2.0× reqs).
            // Higher level = auto-evolves EARLIER (when player has exceeded base reqs by 20% per level).
            const threshold = 1 + autoEvolveLvl * 0.2;
            const reqs = stage.evolveRequires;
            const evolveBoost = 1 - Math.min(0.30, (s.upgrades["evolutionary_momentum"] || 0) * 0.05);
            const totalSystemsNow = Object.values(ownedSystems).reduce((a, b) => a + b, 0);
            const totalTechNow = Object.keys(technologies).length;
            if (
              population >= reqs.minPopulation * evolveBoost * threshold &&
              totalSystemsNow >= reqs.minSystems * evolveBoost * threshold &&
              totalTechNow >= reqs.minTech * evolveBoost * threshold
            ) {
              // Defer evolve to next tick to avoid mutating state mid-set.
              setTimeout(() => get().evolveStage(), 0);
            }
          }
        }

        // FIX-STORE-BUGS Bug 5 — Auto-Ascend: trigger prestige when at Galactic stage.
        // The player must own the `auto_ascend` PP upgrade. We defer the actual
        // triggerPrestige() call via setTimeout to avoid mutating state mid-tick
        // (same pattern as Auto-Evolver above). `STAGES.length - 1` is Galactic.
        const hasAutoAscend = (s.upgrades["auto_ascend"] || 0) > 0;
        if (hasAutoAscend && s.stageIndex >= STAGES.length - 1) {
          setTimeout(() => {
            get().addToLog("🌌 Auto-Ascend: triggering prestige.");
            get().triggerPrestige();
          }, 0);
        }

        // Check story triggers
        const newStory = { ...s.storyUnlocked };
        let activePopup = s.activeStoryPopup;
        const ctx = { ...s, resources, ownedSystems };
        for (const trig of STORY_TRIGGERS) {
          if (!newStory[trig.id] && trig.condition(ctx)) {
            newStory[trig.id] = true;
            if (!activePopup) activePopup = trig.id;
          }
        }

        // Check achievements periodically (every ~2 seconds of game time)
        let achievements = s.achievements;
        let newAchievements = s.newAchievements;
        const checkInterval = 2.0;
        const lastCheck = (s as any)._lastAchCheck || 0;
        if (newTime - lastCheck >= checkInterval) {
          const curState = { ...s, resources, ownedSystems, technologies, time: newTime } as GameState;
          const result = checkAchievements(curState);
          if (result.newOnes.length > 0) {
            achievements = result.earned;
            newAchievements = [...(newAchievements || []), ...result.newOnes];
          } else if (Object.keys(result.earned).length !== Object.keys(achievements || {}).length) {
            achievements = result.earned;
          }
          (s as any)._lastAchCheck = newTime; // not persisted, just a runtime marker
        }

        // Random event firing — only if no popup/modal is active, and not blocked by challenge.
        // LAYER FILTER: At L2+ (enlightenment unlocked), the base game runs in the background
        // and cell-galactic events no longer fire — the player is focused on the divine layers.
        // EVENT TIMEOUT: If an event is active and the player doesn't choose within 60s,
        // auto-resolve with the default (first) choice.
        let activeEvent = s.activeEvent;
        let eventCooldown = (s.eventCooldown || 0) - realDt;
        if (eventCooldown < 0) eventCooldown = 0;
        let eventTimer = s.eventTimer || 0;
        // Countdown active event timer — uses REAL TIME (dt), not game time (realDt).
        // This ensures the 60s auto-resolve timeout is 60 real seconds, not 60 game seconds
        // (which at 8× speed would be 7.5 real seconds).
        if (activeEvent) {
          eventTimer -= dt;
          if (eventTimer <= 0) {
            // Auto-resolve with the default (first) choice
            const evDef = EVENT_MAP[activeEvent];
            if (evDef && evDef.choices.length > 0) {
              const defaultChoice = evDef.choices[0];
              setTimeout(() => {
                get().resolveEvent(activeEvent, defaultChoice.id);
                get().addToLog(`Event "${evDef.name}" auto-resolved with default choice: ${defaultChoice.label}.`);
              }, 0);
            }
            activeEvent = null;
            eventTimer = 0;
          }
        }
        const eventFreq = s.eventFrequency || "normal";
        const eventsAllowed = !challengeDebuff.disableEvents;
        const isL2Plus = !!(s.unlockedLayers?.enlightenment);

        // ---- EVENT-CHAINS — scan pendingFollowUps for due entries ----
        // Chain events fire BEFORE the random pool check so a scheduled
        // follow-up pre-empts a random event. Chain events are NOT gated
        // by `eventFreq`, `eventsAllowed`, or `isL2Plus` — they were
        // scheduled by the player's previous choice and should always
        // fire (subject to the chance roll). The only gating: no other
        // event/popup may be active.
        let pendingFollowUps = s.pendingFollowUps || [];
        if (!activeEvent && !activePopup && pendingFollowUps.length > 0) {
          const now = Date.now();
          // Oldest due entry first.
          const due = pendingFollowUps
            .filter((p) => p.fireAt <= now)
            .sort((a, b) => a.fireAt - b.fireAt);
          if (due.length > 0) {
            const followUp = due[0];
            // Remove the fired entry whether or not the chance roll passes.
            pendingFollowUps = pendingFollowUps.filter((p) => p !== followUp);
            const srcName = EVENT_MAP[followUp.sourceEventId]?.name || followUp.sourceEventId;
            if (Math.random() < followUp.chance) {
              const evDef = EVENT_MAP[followUp.eventId];
              if (evDef) {
                activeEvent = followUp.eventId;
                eventTimer = 60;
                eventCooldown = 5;
                setTimeout(() => get().addToLog(`🔗 Event chain: "${srcName}" triggered follow-up "${evDef.name}".`), 0);
              } else {
                // Target event was removed from EVENT_MAP — drop silently.
                setTimeout(() => get().addToLog(`🔗 Event chain from "${srcName}" — follow-up "${followUp.eventId}" no longer exists; dropped.`), 0);
              }
            } else {
              setTimeout(() => get().addToLog(`🔗 Event chain from "${srcName}" — follow-up did not fire (chance roll failed).`), 0);
            }
          }
        }

        if (eventFreq !== "off" && eventsAllowed && !activeEvent && !activePopup && eventCooldown === 0 && !isL2Plus) {
          const stageId = STAGES[s.stageIndex].id;
          // ARCHETYPES-REWORK — filter out events the locked archetype is
          // immune to (Mammalian→cold, Fungoid/Toxoid→plague, Lithoid→disaster,
          // Extremophile/Lithoid Titan→all). See isArchetypeImmuneToEvent.
          //
          // FIX-EVENTS-IMMUNITY-POPUPS — two more filters:
          //   • requiredArchetype: 90 archetype-specific lineage events
          //     (humanoid_tool_innovation_tribal, plantoid_gaia_world_galactic,
          //     …) only fire when the player's locked archetype matches.
          //   • immuneTech: events blocked by immunity techs (dna_repair→
          //     mutations, osmoregulation→water, camouflage→predators,
          //     hibernation→droughts, immune_system→plagues) are excluded
          //     once the player has researched that tech.
          const possible = eventsForStage(stageId, newTime).filter((ev) => {
            if (isArchetypeImmuneToEvent(s.lockedArchetype, ev.id)) return false;
            if (ev.requiredArchetype && ev.requiredArchetype !== s.lockedArchetype) return false;
            if (ev.immuneTech && s.technologies[ev.immuneTech]) return false;
            return true;
          });
          if (possible.length > 0) {
            const totalWeight = possible.reduce((sum, e) => sum + e.weight, 0);
            const roll = Math.random() * totalWeight;
            let cum = 0;
            for (const ev of possible) {
              cum += ev.weight;
              if (roll < cum) {
                activeEvent = ev.id;
                eventTimer = 60; // 60s to choose, else auto-resolve
                const base = eventFreq === "frequent" ? 30 : 90;
                const range = eventFreq === "frequent" ? 30 : 90;
                eventCooldown = base + Math.random() * range;
                break;
              }
            }
          }
        }

        // ---- Challenge completion check (every 5s) ----
        let completedChallenges = s.completedChallenges;
        let challengeRepeatCounts = s.challengeRepeatCounts;
        let activeChallenge = s.activeChallenge;
        let unlockedLayers = s.unlockedLayers;
        // QUICK WIN 5 — Prestige Points (universal currency). Earned from layer activity.
        let prestigePoints = s.prestigePoints || 0;
        if (s.activeChallenge && s.unlockedChallenges && newTime - (autoTimers.challenge || 0) >= 5) {
          autoTimers.challenge = newTime;
          const ch = CHALLENGE_MAP[s.activeChallenge];
          if (ch) {
            let isComplete = false;
            switch (ch.completeWhen.type) {
              case "reachPopulation":
                if (population >= ch.completeWhen.value) isComplete = true;
                break;
              case "reachStage":
                if (STAGES[s.stageIndex].id === ch.completeWhen.stage) isComplete = true;
                break;
              case "clearStage": {
                const targetIdx = STAGE_IDS.indexOf(ch.completeWhen.stage);
                if (s.stageIndex > targetIdx) isComplete = true;
                break;
              }
              case "reachGalactic":
                if (s.stageIndex >= STAGES.length - 1) isComplete = true;
                break;
              case "stockpileResource":
                if ((resources[ch.completeWhen.resource] || 0) >= ch.completeWhen.value) isComplete = true;
                break;
            }
            if (isComplete) {
              const completedCount = (s.completedChallenges?.[s.activeChallenge] || 0) + 1;
              completedChallenges = { ...(s.completedChallenges || {}), [s.activeChallenge]: completedCount };
              challengeRepeatCounts = { ...(s.challengeRepeatCounts || {}) };
              delete challengeRepeatCounts[s.activeChallenge];
              const chName = ch.name;
              activeChallenge = null;
              // QUICK WIN 5 — +1 Prestige Point for completing a trial
              prestigePoints += 1;
              // L1→L2 gate: 3+ distinct challenges completed OR 5+ total challenge
              // repeats. (Legacy trialRealm mini-games removed in CLEANUP-LEGACY.)
              const totalChallengesCompleted = countChallengesCompleted(completedChallenges);
              const totalRepeats = Object.values(completedChallenges).reduce((a, b) => a + (b || 0), 0);
              if (!unlockedLayers.enlightenment &&
                  (totalChallengesCompleted >= 3 || totalRepeats >= TRIAL_REALMS_REQUIRED_FOR_LAYER_2)) {
                unlockedLayers = { ...unlockedLayers, enlightenment: true };
                setTimeout(() => get().addToLog(`Trial progress threshold reached (${totalChallengesCompleted}/3 distinct trials, or ${totalRepeats}/${TRIAL_REALMS_REQUIRED_FOR_LAYER_2} total repeats). Enlightenment layer unlocked.`), 0);
              }
              // Defer log so we don't race with set()
              setTimeout(() => get().addToLog(`Trial complete: ${chName} (repeat ${completedCount}). Mastery bonus made permanent. (+1 Prestige Point)`), 0);
            }
          }
        }

        // ---- Layers 2-6: passive currency generation, timer decay, unlock chain ----
        let divinity = s.divinity || 0;
        let evolutionPoints = s.evolutionPoints || 0;  // mutable — background sims add EP
        let faith = s.faith || 0;
        let heresy = s.heresy || 0;
        // L5 redesign — per-galaxy heresy surge staging variable. When the L5
        // Heresy Surge event fires (every 90s), we stage a new starter-galaxy
        // grid with one heretic seeded. The per-galaxy L5 tick block below
        // consumes this so the surge is applied on the same tick it fires.
        let pendingSurgeGrid: Array<{ state: string; type: string }> | null = null;
        let activeTemporaryRituals = s.activeTemporaryRituals || {};
        let miracleTimers = s.miracleTimers || {};
        const activeScripts = s.activeScripts || {};
        let scriptTimers = s.scriptTimers || {};
        let bloodPactsUsed = s.bloodPactsUsed || {};
        const activeHeresyResponse = s.activeHeresyResponse || "hr_ignore";

        // Decay temporary ritual timers
        if (Object.keys(activeTemporaryRituals).length > 0) {
          activeTemporaryRituals = { ...activeTemporaryRituals };
          let changed = false;
          for (const id of Object.keys(activeTemporaryRituals)) {
            const remaining = activeTemporaryRituals[id] - realDt;
            if (remaining <= 0) {
              delete activeTemporaryRituals[id];
              changed = true;
            } else {
              activeTemporaryRituals[id] = remaining;
              changed = true;
            }
          }
          void changed;
        }

        // Decay miracle timers
        if (Object.keys(miracleTimers).length > 0) {
          miracleTimers = { ...miracleTimers };
          for (const id of Object.keys(miracleTimers)) {
            const remaining = miracleTimers[id] - realDt;
            if (remaining <= 0) {
              delete miracleTimers[id];
            } else {
              miracleTimers[id] = remaining;
            }
          }
        }

        // L8 FIX — Decay per-god Negotiate cooldowns + L5 miracle cooldowns (stored as negotiate_<godId> / miracleCd_<id> fields)
        let negotiateCooldowns: Record<string, number> = {};
        for (const k of Object.keys(s)) {
          if ((k.startsWith("negotiate_") || k.startsWith("miracleCd_")) && typeof (s as any)[k] === "number") {
            const remaining = (s as any)[k] - realDt;
            if (remaining > 0) negotiateCooldowns[k] = remaining;
          }
        }

        // QUICK WIN 2 — Decay active ability cooldowns + effect timers
        let activeAbilityCooldowns = s.activeAbilityCooldowns || {};
        let activeAbilityEffects = s.activeAbilityEffects || {};
        if (Object.keys(activeAbilityCooldowns).length > 0) {
          activeAbilityCooldowns = { ...activeAbilityCooldowns };
          for (const id of Object.keys(activeAbilityCooldowns)) {
            const remaining = Math.max(0, activeAbilityCooldowns[id] - realDt);
            if (remaining <= 0) delete activeAbilityCooldowns[id];
            else activeAbilityCooldowns[id] = remaining;
          }
        }
        if (Object.keys(activeAbilityEffects).length > 0) {
          activeAbilityEffects = { ...activeAbilityEffects };
          for (const id of Object.keys(activeAbilityEffects)) {
            const remaining = Math.max(0, activeAbilityEffects[id] - realDt);
            if (remaining <= 0) delete activeAbilityEffects[id];
            else activeAbilityEffects[id] = remaining;
          }
        }

        // QUICK WIN 3 — Decay ritual combo bonus timer
        let ritualComboTimer = Math.max(0, (s.ritualComboTimer || 0) - realDt);

        // QUICK WIN 7 — Random layer events (log-only state mutations)
        let layerEventTimers = { ...(s.layerEventTimers || { trial_of_fortune: 0, vision: 0, divine_whim: 0, heresy_surge: 0 }) };
        // Layer 1 — Trial of Fortune: every 120s, +20% of capacity to 2 random primary resources.
        // FIX-STORE-BUGS Bug 1: gated behind `unlockedChallenges` so it only fires after the first Galactic win (L1 unlock).
        if (s.unlockedChallenges) {
          if (newTime - (layerEventTimers.trial_of_fortune || 0) >= 120 && (layerEventTimers.trial_of_fortune || 0) > 0) {
            layerEventTimers.trial_of_fortune = newTime;
            const primRes = ["glucose", "proteins", "lipids", "food", "water", "materials", "wood", "stone", "production", "gold", "influence", "energy", "alloys", "data"];
            const picks: string[] = [];
            for (let i = 0; i < 2 && primRes.length > 0; i++) {
              const idx = Math.floor(Math.random() * primRes.length);
              picks.push(primRes.splice(idx, 1)[0]);
            }
            for (const r of picks) {
              const cap = capacities[r] || 50;
              resources[r] = Math.min(cap, (resources[r] || 0) + cap * 0.20);
            }
            setTimeout(() => get().addToLog(`🎲 Trial of Fortune! +20% capacity to ${picks.join(", ")}.`), 0);
          } else if ((layerEventTimers.trial_of_fortune || 0) === 0) {
            // First-time initialization — wait 120s before first fire
            layerEventTimers.trial_of_fortune = newTime;
          }
        }
        // Layer 2 — Vision: every 90s (after enlightenment unlocked), +5 Divinity
        if (unlockedLayers.enlightenment) {
          if ((layerEventTimers.vision || 0) === 0) {
            layerEventTimers.vision = newTime;
          } else if (newTime - layerEventTimers.vision >= 90) {
            layerEventTimers.vision = newTime;
            divinity += 5;
            setTimeout(() => get().addToLog("👁️ Vision! +5 Divinity granted."), 0);
          }
        }
        // Layer 3 — Divine Whim: every 120s (after transcendence unlocked), +30 Divinity (≈ half a ritual's cost)
        if (unlockedLayers.transcendence) {
          if ((layerEventTimers.divine_whim || 0) === 0) {
            layerEventTimers.divine_whim = newTime;
          } else if (newTime - layerEventTimers.divine_whim >= 120) {
            layerEventTimers.divine_whim = newTime;
            divinity += 30;
            setTimeout(() => get().addToLog("🌀 Divine Whim! Ritual energies surge (+30 Divinity)."), 0);
          }
        }
        // Layer 5 — Heresy Surge: every 90s (after apotheosis unlocked), seed a
        // heretic in a random owned galaxy's grid (BAD event). Global heresy is
        // now derived from the grid heretic counts — the surge effectively bumps
        // the average by ~3 (1 heretic / 32 cells × 100, distributed across N galaxies).
        if (unlockedLayers.apotheosis) {
          if ((layerEventTimers.heresy_surge || 0) === 0) {
            layerEventTimers.heresy_surge = newTime;
          } else if (newTime - layerEventTimers.heresy_surge >= 90) {
            layerEventTimers.heresy_surge = newTime;
            // Seed a heretic in the starter galaxy (always owned). The mutation
            // is applied to a fresh local galaxyFollowerGrid object that gets
            // flushed by the per-galaxy L5 tick block further below.
            const surgeGrid = (s.galaxyFollowerGrid?.[STARTER_GALAXY_ID] || makeInitialFollowerGrid()).map((c) => ({ ...c }));
            const faithfulIdx = surgeGrid
              .map((c, i) => (c.state === "faithful" ? i : -1))
              .filter((i) => i >= 0);
            if (faithfulIdx.length > 0) {
              const pick = faithfulIdx[Math.floor(Math.random() * faithfulIdx.length)];
              surgeGrid[pick] = { ...surgeGrid[pick], state: "heretical" };
              pendingSurgeGrid = surgeGrid;
            }
            setTimeout(() => get().addToLog("🔥 Heresy Surge! A heretic appears in the Aurora Galaxy flock."), 0);
          }
        }

        // Layer 3 — Divinity generation from active rituals + tithe script
        if (unlockedLayers.transcendence) {
          const titheActive = !!activeScripts["script_divinity_tithe"];
          const divPerSec = transcendenceDivinityPerSecond(activeTemporaryRituals, titheActive);
          if (divPerSec > 0) divinity += divPerSec * realDt;

          // Divinity Tithe script: drains 1% of all resources per second
          if (titheActive) {
            const drained: Record<string, number> = {};
            for (const r of Object.keys(resources)) {
              if ((resources[r] || 0) > 1) {
                const drain = (resources[r] || 0) * 0.01 * realDt;
                drained[r] = drain;
              }
            }
            for (const [r, v] of Object.entries(drained)) {
              resources[r] = Math.max(0, (resources[r] || 0) - v);
            }
          }

          // Auto-scripts (Layer 3)
          // Auto-Libation: every 30s, perform cheapest affordable offering
          if (activeScripts["script_auto_offering"] && newTime - (scriptTimers["script_auto_offering"] || 0) >= 30) {
            scriptTimers = { ...scriptTimers, script_auto_offering: newTime };
            const candidates = OFFERINGS.filter((o) => {
              for (const [r, v] of Object.entries(o.cost)) {
                if ((resources[r] || 0) < (v as number)) return false;
              }
              return true;
            });
            if (candidates.length > 0) {
              const pick = candidates.reduce((a, b) => (a.divinityGain < b.divinityGain ? a : b));
              for (const [r, v] of Object.entries(pick.cost)) {
                resources[r] = Math.max(0, (resources[r] || 0) - (v as number));
              }
              const repeats = (s.transcendenceOfferingsUsed?.[pick.id] || 0);
              divinity += offeringDivinityAtRepeat(pick, repeats);
              setTimeout(() => get().addToLog(`Auto-Libation performed ${pick.name}.`), 0);
            }
          }

          // Auto-Ritual: every 120s, perform Silent Hour if affordable & inactive
          if (activeScripts["script_auto_ritual"] && newTime - (scriptTimers["script_auto_ritual"] || 0) >= 120) {
            scriptTimers = { ...scriptTimers, script_auto_ritual: newTime };
            const r = RITUAL_MAP["ritual_silent_hour"];
            if (r && !(s.purchasedRituals?.["ritual_silent_hour"]) && !(activeTemporaryRituals["ritual_silent_hour"] > 0) && divinity >= r.cost) {
              divinity -= r.cost;
              activeTemporaryRituals = { ...activeTemporaryRituals, ritual_silent_hour: r.durationSec || 0 };
              setTimeout(() => get().addToLog(`Ritualist performed ${r.name}.`), 0);
            }
          }

          // Auto-Blood Pact: every 300s, perform cheapest unused blood pact if affordable
          if (activeScripts["script_auto_blood_pact"] && newTime - (scriptTimers["script_auto_blood_pact"] || 0) >= 300) {
            scriptTimers = { ...scriptTimers, script_auto_blood_pact: newTime };
            const candidates = BLOOD_PACTS.filter((p) => !bloodPactsUsed[p.id] && population >= p.popCost);
            if (candidates.length > 0) {
              const pick = candidates.reduce((a, b) => (a.popCost < b.popCost ? a : b));
              population -= pick.popCost;
              divinity += pick.divinityGain;
              bloodPactsUsed = { ...bloodPactsUsed, [pick.id]: true };
              setTimeout(() => get().addToLog(`Crimson Ledger performed ${pick.name} (-${pick.popCost} pop, +${pick.divinityGain} Divinity).`), 0);
            }
          }

          // Auto-prestige: every 600s, prestige if at Galactic stage
          if (activeScripts["script_auto_prestige"] && s.stageIndex >= STAGES.length - 1 && newTime - (scriptTimers["script_auto_prestige"] || 0) >= 600) {
            scriptTimers = { ...scriptTimers, script_auto_prestige: newTime };
            setTimeout(() => {
              get().addToLog("Cycle of Becoming: auto-prestige triggered.");
              get().triggerPrestige();
            }, 0);
          }
        }

        // Layer 5 — Faith generation (Apotheosis). Per-galaxy heresy accrual is
        // now derived from each owned galaxy's heresy grid (handled in the
        // per-galaxy L5 tick block further below). Global `heresy` is the
        // average of `galaxyHeresy` across owned galaxies. CLEANUP-LEGACY:
        // the run-ender now triggers at heresy ≥ 75 (the per-galaxy "red"
        // threshold), since per-galaxy heresy resets at 75 (one-time per
        // threshold per galaxy) and the old ≥ 100 check was effectively dead.
        if (unlockedLayers.apotheosis) {
          faith += wMode.faithPerSec * realDt;
        }

        // Layer 6 — Singularity (Universal Map redesign — replaces the old Logic Core automation).
        // The L6 universal map tick block runs further below (rift spawn + corruption spread).
        // Logic Cores were removed; Reality Anchors now provide the strategic lever.

        // ---- Layer 7 — Omnipotence (Bio-engineering): genetic instability accrual + Skirmish Arena ----
        let instability = s.instability || 0;
        let raidsRepelled = s.raidsRepelled || 0;
        let outpostRaidSpawnTimer = Math.max(0, (s.outpostRaidSpawnTimer ?? OUTPOST_RAID_SPAWN_INTERVAL_SEC) - realDt);
        let outpostRaids = (s.outpostRaids || []).map((r) => ({ ...r, log: [...r.log], deployedLegionIds: [...r.deployedLegionIds] }));
        let galaxySystems = (s.galaxySystems || []).map((g) => ({ ...g }));
        if (unlockedLayers.omnipotence) {
          const rate = effectiveInstabilityRate(s.creatures || [], s.legions || [], s.activeOmnipotenceStance);
          // LAYER UPGRADE — genetic_stabilizer: -25% per level (max 4 → no instability gain)
          const gsLvl = (s.upgrades?.genetic_stabilizer as number) || 0;
          const stabMult = Math.max(0, 1 - 0.25 * gsLvl);
          const effectiveRate = rate * stabMult;
          if (effectiveRate > 0) {
            instability = Math.min(INSTABILITY_ROGUE_THRESHOLD, instability + effectiveRate * realDt);
          }
          // Skirmish Arena — periodic raid spawn (every 120s, max 3 active)
          if (outpostRaidSpawnTimer <= 0) {
            outpostRaidSpawnTimer = OUTPOST_RAID_SPAWN_INTERVAL_SEC;
            const activeRaids = outpostRaids.filter((r) => r.status === "active");
            if (activeRaids.length < MAX_ACTIVE_OUTPOST_RAIDS) {
              const def = OUTPOST_RAIDS[Math.floor(Math.random() * OUTPOST_RAIDS.length)];
              const id = `raid_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
              outpostRaids.push({
                id,
                outpostDef: def.id,
                status: "active",
                bossHp: def.hp,
                bossMaxHp: def.hp,
                playerHp: 200,
                playerMaxHp: 200,
                turn: 0,
                log: [`${def.icon} ${def.name} raids your galaxies! HP ${def.hp}, ATK ${def.attack}, DEF ${def.defense}.`],
                deployedLegionIds: [],
              });
              setTimeout(() => get().addToLog(`⚔️ ${def.name} (${def.icon}) raids your galaxies! Deploy legions to repel it.`), 0);
            }
          }
          // Instability ≥ 100 — creatures go ROGUE: lose 1 random claimed system, reset instability to 50.
          // (Replaces the old "run ends at 100" behavior. Player keeps the run but suffers a setback.)
          // The system-loss is deferred to a setTimeout so it reads the post-tick galaxy state
          // (avoiding conflicts with the L6 universal-map block that mutates universalGalaxies below).
          if (instability >= INSTABILITY_ROGUE_THRESHOLD) {
            instability = INSTABILITY_AFTER_ROGUE;
            // Try L4 galaxy systems first (always available at L7).
            const claimedL4 = galaxySystems.filter((g) => g.claimed);
            if (claimedL4.length > 0) {
              const idx = Math.floor(Math.random() * claimedL4.length);
              const sys = claimedL4[idx];
              sys.claimed = false;
              const lostName = sys.id;
              setTimeout(() => get().addToLog(`🧬 Creatures go rogue! They raid your galaxies and destroy system ${lostName}. Instability reset to ${INSTABILITY_AFTER_ROGUE}.`), 0);
            } else {
              // Defer to post-tick set() — decrement `systemsClaimed` on a random L6
              // universal galaxy that the player has claimed systems in.
              setTimeout(() => {
                const cur = get();
                let lostName: string | null = null;
                const nextUniversal = (cur.universalGalaxies || []).map((g) => ({ ...g }));
                for (const g of nextUniversal) {
                  if ((g.systemsClaimed || 0) > 0) {
                    lostName = `${g.id} (1 of ${g.systemsClaimed} system${g.systemsClaimed === 1 ? "" : "s"})`;
                    g.systemsClaimed = Math.max(0, (g.systemsClaimed || 0) - 1);
                    break;
                  }
                }
                if (lostName) {
                  set({ universalGalaxies: nextUniversal });
                  get().addToLog(`🧬 Creatures go rogue! They overrun galaxy ${lostName}. Instability reset to ${INSTABILITY_AFTER_ROGUE}.`);
                } else {
                  get().addToLog(`🧬 Creatures go rogue — but you have no claimed systems to lose. Instability reset to ${INSTABILITY_AFTER_ROGUE}.`);
                }
              }, 0);
            }
          }
        }
        const geneticInstability = instability; // alias

        // ---- Layer unlock chain (Layers 3-6) ----
        // Layer 3 (Transcendence): 10+ constellations COMPLETED (new L2 design).
        if (unlockedLayers.enlightenment && !unlockedLayers.transcendence) {
          if (canAdvanceToTranscendence(constellationState)) {
            unlockedLayers = { ...unlockedLayers, transcendence: true };
            setTimeout(() => get().addToLog(
              `${CONSTELLATIONS_REQUIRED_FOR_LAYER_3} constellations fully illuminated. Transcendence layer unlocked.`
            ), 0);
          }
        }
        // Layer 4 (Genesis): all 4 blood pacts used at least once
        if (unlockedLayers.transcendence && !unlockedLayers.genesis) {
          if (allBloodPactsUsed(bloodPactsUsed)) {
            unlockedLayers = { ...unlockedLayers, genesis: true };
            setTimeout(() => get().addToLog("All 4 Blood Pacts performed. Genesis layer unlocked."), 0);
          }
        }
        // Layer 5 (Apotheosis): L4 redesign — completing the galaxy (all 50 systems
        // claimed) unlocks L5. The old "authored 1 world" condition is kept as a
        // fallback for save-compat (older saves that authored a world but didn't
        // complete the galaxy can still progress).
        if (unlockedLayers.genesis && !unlockedLayers.apotheosis) {
          const galaxyDone = isGalaxyComplete(s.galaxySystems || []);
          const authoredDone = hasAuthoredWorld(s.authoredWorlds || []);
          if (galaxyDone || authoredDone) {
            unlockedLayers = { ...unlockedLayers, apotheosis: true };
            setTimeout(
              () => get().addToLog(
                galaxyDone
                  ? "Galaxy fully claimed. Apotheosis layer unlocked."
                  : "First world authored. Apotheosis layer unlocked."
              ),
              0
            );
          }
        }
        // Layer 6 (Singularity): 3 galaxies conquered OR 3 divine laws enacted.
        // FIX-AUTOBUYERS-TRIALS — previously used `hasEnactedThreeLaws` alone.
        // Spec now also accepts `countConqueredGalaxies >= GALAXIES_REQUIRED_FOR_L6`
        // (3 rival galaxies fully conquered). Either condition unlocks L6.
        if (unlockedLayers.apotheosis && !unlockedLayers.singularity) {
          const conqueredCount = countConqueredGalaxies(s.galaxyRivalSystems || {});
          const threeLawsEnacted = hasEnactedThreeLaws(s.enactedDivineLaws || {});
          if (conqueredCount >= GALAXIES_REQUIRED_FOR_L6 || threeLawsEnacted) {
            unlockedLayers = { ...unlockedLayers, singularity: true };
            setTimeout(() => get().addToLog(`3 galaxies conquered (or 3 divine laws enacted). Singularity layer unlocked.`), 0);
          }
        }
        // Layer 7 (Omnipotence): L6 Universal Map complete (20 rifts closed + 10 anchors placed)
        const l6RiftsClosed = s.riftsClosed || 0;
        const l6AnchorsPlaced = s.anchorsPlaced || 0;
        if (unlockedLayers.singularity && !unlockedLayers.omnipotence) {
          if (isUniversalMapComplete(l6RiftsClosed, l6AnchorsPlaced)) {
            unlockedLayers = { ...unlockedLayers, omnipotence: true };
            setTimeout(() => get().addToLog(
              `Universal Map stabilized — ${l6RiftsClosed}/${RIFTS_REQUIRED_FOR_L7} rifts closed, ${l6AnchorsPlaced}/${ANCHORS_REQUIRED_FOR_L7} anchors placed. Omnipotence layer unlocked.`
            ), 0);
          }
        }
        // Layer 8 (Divinity): repel OUTPOST_RAID_COUNT_FOR_L8 outpost raids
        if (unlockedLayers.omnipotence && !unlockedLayers.divinity) {
          if (isOmnipotenceComplete(raidsRepelled)) {
            unlockedLayers = { ...unlockedLayers, divinity: true };
            setTimeout(() => get().addToLog(`⚔️ ${OUTPOST_RAID_COUNT_FOR_L8} outpost raids repelled! Divine Alliance layer unlocked.`), 0);
          }
        }
        // Layer 9 (Infinity): 2+ alliances formed (Divine Alliance complete)
        if (unlockedLayers.divinity && !unlockedLayers.infinity) {
          if (isDivinityComplete(s.alliances || {})) {
            unlockedLayers = { ...unlockedLayers, infinity: true };
            setTimeout(() => get().addToLog("Two alliances forged. Divine War layer unlocked."), 0);
          }
        }
        // Layer 10 (Eternity — Genesis Engine): all 3 Old Gods defeated.
        // Seed 3 starter Divine Relics on first unlock so the player can begin
        // the crucible + Big Bang loop immediately.
        if (unlockedLayers.infinity && !unlockedLayers.eternity) {
          if (isInfinityComplete(s.oldGodBattles || {})) {
            unlockedLayers = { ...unlockedLayers, eternity: true };
            const starterRelics = generateRelicReward(3);
            setTimeout(() => {
              get().addToLog("All 3 Old Gods defeated. Genesis Engine unlocked — 3 starter relics granted.");
              set({ divineRelics: [...(get().divineRelics || []), ...starterRelics] });
            }, 0);
          }
        }

        // ---- Theme auto-unlock (Part 1f) ----
        let unlockedThemes = { ...(s.unlockedThemes || { "stage-cell": true }) };
        let themesChanged = false;
        // Stage themes — unlock the theme for the current stage index
        const stageThemeId = STAGE_INDEX_TO_THEME[s.stageIndex];
        if (stageThemeId && !unlockedThemes[stageThemeId]) {
          unlockedThemes[stageThemeId] = true;
          themesChanged = true;
        }
        // Layer themes — unlock the matching overlay when a layer unlocks
        for (const [layerId, themeId] of Object.entries(LAYER_ID_TO_THEME)) {
          if (unlockedLayers[layerId] && !unlockedThemes[themeId]) {
            unlockedThemes[themeId] = true;
            themesChanged = true;
          }
        }
        // Special themes
        if ((s.galacticWins || 0) >= 1 && !unlockedThemes["special-void"]) {
          unlockedThemes["special-void"] = true;
          themesChanged = true;
        }
        const achCount = Object.values(achievements || {}).filter(Boolean).length;
        if (achCount >= 10 && !unlockedThemes["special-retro"]) {
          unlockedThemes["special-retro"] = true;
          themesChanged = true;
        }
        const allLayersUnlocked = !!(unlockedLayers.evolution && unlockedLayers.enlightenment && unlockedLayers.transcendence && unlockedLayers.genesis && unlockedLayers.apotheosis && unlockedLayers.singularity && unlockedLayers.omnipotence && unlockedLayers.divinity && unlockedLayers.infinity && unlockedLayers.eternity);
        if (allLayersUnlocked && !unlockedThemes["special-cosmic"]) {
          unlockedThemes["special-cosmic"] = true;
          themesChanged = true;
        }

        // ---- Mini themes (ORGANELLES-THEMES) ----
        // 7 base mini-themes — unlock by milestones.
        if (achCount >= 10 && !unlockedThemes["mini-terminal"]) {
          unlockedThemes["mini-terminal"] = true;
          themesChanged = true;
        }
        if ((s.galacticWins || 0) >= 1 && !unlockedThemes["mini-void"]) {
          unlockedThemes["mini-void"] = true;
          themesChanged = true;
        }
        if ((s.galacticWins || 0) >= 3 && !unlockedThemes["mini-solar-flare"]) {
          unlockedThemes["mini-solar-flare"] = true;
          themesChanged = true;
        }
        if ((s.galacticWins || 0) >= 5 && !unlockedThemes["mini-forest"]) {
          unlockedThemes["mini-forest"] = true;
          themesChanged = true;
        }
        if ((s.galacticWins || 0) >= 10 && !unlockedThemes["mini-ice"]) {
          unlockedThemes["mini-ice"] = true;
          themesChanged = true;
        }
        if (allLayersUnlocked && !unlockedThemes["mini-volcanic"]) {
          unlockedThemes["mini-volcanic"] = true;
          themesChanged = true;
        }
        // mini-ai — easter egg: unlock when BOTH 10 galactic wins AND all 10
        // layers are unlocked. The joke is that you've done everything, so
        // the only thing left to "elevate" is the UI itself.
        if ((s.galacticWins || 0) >= 10 && allLayersUnlocked && !unlockedThemes["mini-ai"]) {
          unlockedThemes["mini-ai"] = true;
          themesChanged = true;
        }
        // 13 archetype mini-themes — unlock when that archetype is first
        // locked in (revealedLineageArchetypes[archId] === true).
        const revealedLineage = s.revealedLineageArchetypes || {};
        const ARCHETYPE_THEME_IDS: Array<string> = [
          "arch-humanoid",
          "arch-mammalian",
          "arch-reptilian",
          "arch-necroid",
          "arch-arthropoid",
          "arch-plantoid",
          "arch-fungoid",
          "arch-molluscoid",
          "arch-lithoid",
          "arch-toxoid",
          "arch-avian",
          "arch-aquatic",
          "arch-extremophile",
        ];
        const ARCHETYPE_KEYS: Array<string> = [
          "humanoid",
          "mammalian",
          "reptilian",
          "necroid",
          "arthropoid",
          "plantoid",
          "fungoid",
          "molluscoid",
          "lithoid",
          "toxoid",
          "avian",
          "aquatic",
          "extremophile",
        ];
        for (let i = 0; i < ARCHETYPE_THEME_IDS.length; i++) {
          const themeId = ARCHETYPE_THEME_IDS[i];
          const archKey = ARCHETYPE_KEYS[i];
          if (revealedLineage[archKey] && !unlockedThemes[themeId]) {
            unlockedThemes[themeId] = true;
            themesChanged = true;
          }
        }
        void themesChanged;

        // ---- Theme AUTO mode: re-derive the active stage/layer theme every tick ----
        // (when themeMode === "auto", the player's manual picks are overridden)
        let activeStageTheme = s.activeStageTheme || "stage-cell";
        let activeLayerTheme = s.activeLayerTheme;
        let activeSpecialTheme = s.activeSpecialTheme;
        if ((s.themeMode || "auto") === "auto") {
          const autoStageId = STAGE_INDEX_TO_THEME[s.stageIndex] || "stage-cell";
          const autoLayerId = highestUnlockedLayerThemeId(unlockedLayers);
          if (activeStageTheme !== autoStageId) activeStageTheme = autoStageId;
          if (activeLayerTheme !== autoLayerId) activeLayerTheme = autoLayerId;
          if (activeSpecialTheme !== null) activeSpecialTheme = null; // auto mode never uses special
        }

        // Layer 3 — Divine Market: random-walk prices every 10s
        let marketPrices = { ...(s.marketPrices || {}) };
        let priceHistory = { ...(s.priceHistory || {}) };
        let marketOwnedResources = { ...(s.marketOwnedResources || {}) };
        let marketTickTimer = (s.marketTickTimer || 10) - realDt;
        // FEATURE 3 — Market Crashes (every ~120s, 20% chance, 30s duration at 30% base price)
        let marketCrashTimer = (s.marketCrashTimer || 120) - realDt;
        let marketCrashActive = !!(s.marketCrashActive);
        let marketCrashDuration = Math.max(0, (s.marketCrashDuration || 0) - realDt);
        const MARKET_BASE_PRICES: Record<string, number> = { food: 10, water: 8, materials: 15, science: 20, gold: 25, energy: 30 };
        if (marketCrashActive) {
          // Force all prices to 30% of base during crash (continuous — overrides random walk)
          for (const r of Object.keys(MARKET_BASE_PRICES)) {
            marketPrices[r] = MARKET_BASE_PRICES[r] * 0.3;
          }
          if (marketCrashDuration <= 0) {
            // Crash ends — restore prices to base & resume normal walk
            marketCrashActive = false;
            marketCrashTimer = 120;
            for (const r of Object.keys(MARKET_BASE_PRICES)) {
              marketPrices[r] = MARKET_BASE_PRICES[r];
            }
            setTimeout(() => get().addToLog("📈 Market crash resolved — prices recover."), 0);
          }
        } else {
          if (marketCrashTimer <= 0) {
            // 20% chance to trigger a crash
            if (Math.random() < 0.20) {
              marketCrashActive = true;
              marketCrashDuration = 30;
              for (const r of Object.keys(MARKET_BASE_PRICES)) {
                marketPrices[r] = MARKET_BASE_PRICES[r] * 0.3;
              }
              setTimeout(() => get().addToLog("⚠ MARKET CRASH! All prices dropped to 30% — buy now!"), 0);
            } else {
              marketCrashTimer = 120;
            }
          }
          // Normal random walk (skipped during active crash)
          if (marketTickTimer <= 0) {
            marketTickTimer = 10;
            for (const r of Object.keys(marketPrices)) {
              const cur = marketPrices[r] || 10;
              const drift = (Math.random() - 0.5) * 0.6; // ±30%
              let next = cur * (1 + drift);
              next = Math.max(1, Math.min(200, next));
              marketPrices[r] = next;
              const hist = (priceHistory[r] || []).slice(-19);
              hist.push(next);
              priceHistory[r] = hist;
            }
          }
        }
        // Divine-dends — passive Divinity from owned resource types (100+ units → +1 Div/s)
        if (unlockedLayers.transcendence) {
          let dividends = 0;
          for (const r of Object.keys(marketOwnedResources)) {
            if ((marketOwnedResources[r] || 0) >= 100) dividends += 1;
          }
          if (dividends > 0) divinity += dividends * realDt;
        }

        // Layer 4 — Sacred Grid / Natural Disasters were REMOVED in CLEANUP-LEGACY.
        // The Galaxy Claim system (`galaxySystems` + `scanGalaxySystem` +
        // `claimGalaxySystem`) is the canonical L4 loop. The `disaster_shield`
        // shop upgrade is also legacy (it no longer affects anything).

        // ===== Layer 5 — Heresy Web (Galactic Conquest redesign) =====
        // Per-galaxy 8×4 heresy grid. Loop through ALL owned galaxies (starter
        // + any rival with ≥1 claimed system). For each:
        //   • Spread heresy every 10s (faithful→heretical via adjacent spread).
        //   • Seed 1 heretic every 30s if the grid is all-faithful.
        //   • Prophets convert adjacent heretics every 10s.
        //   • Compute heresy % = (hereticCount / 32) × 100.
        //   • When heresy crosses 25/50/75 (one-time per galaxy per threshold),
        //     apply system loss: yellow=1, orange=2, red=3 random claimed
        //     systems (rival galaxies only). Reset grid to 16 heretics (heresy=50).
        // Global `heresy` is recomputed as the average of galaxyHeresy across
        // owned galaxies (display value).
        let galaxyHeresy = { ...(s.galaxyHeresy || {}) };
        let galaxyFollowerGrid = { ...(s.galaxyFollowerGrid || {}) };
        let galaxyRivalSystems = { ...(s.galaxyRivalSystems || {}) };
        let heresyThresholdsSeeded = { ...(s.heresyThresholdsSeeded || {}) };
        let prophets = (s.prophets || []).map((p) => ({ ...p }));
        let heresySpreadTimer = (s.heresySpreadTimer || 10) - realDt;
        let heresySeedTimer = Math.max(0, (s.heresySeedTimer || 30) - realDt);
        let prophetConvertTimer = Math.max(0, (s.prophetConvertTimer || 10) - realDt);
        const heresyLog: string[] = [];
        const l5Upgrades = s.upgrades || {};
        const hwLvl = (l5Upgrades.heresy_ward as number) || 0;
        const spreadChance = Math.max(0, 1 - 0.30 * hwLvl);
        const piLvl = (l5Upgrades.prophet_inspiration as number) || 0;
        const owned = ownedGalaxyIds(galaxyRivalSystems);

        // Consume the staged surge grid (applied to the starter galaxy).
        if (pendingSurgeGrid) {
          galaxyFollowerGrid = {
            ...galaxyFollowerGrid,
            [STARTER_GALAXY_ID]: pendingSurgeGrid,
          };
          pendingSurgeGrid = null;
        }

        for (const gid of owned) {
          if (!galaxyFollowerGrid[gid]) {
            galaxyFollowerGrid[gid] = makeInitialFollowerGrid();
          }
          let grid = galaxyFollowerGrid[gid].map((c) => ({ ...c }));

          // Spread heresy every 10s (faithful→heretical via adjacent spread).
          if (unlockedLayers.apotheosis && heresySpreadTimer <= 0) {
            const next = grid.map((c) => ({ ...c }));
            for (let i = 0; i < next.length; i++) {
              if (next[i].state !== "heretical") continue;
              if (Math.random() >= spreadChance) continue; // ward blocks this spread
              const row = Math.floor(i / 8);
              const col = i % 8;
              const neighbors = [
                col > 0 ? i - 1 : -1,
                col < 7 ? i + 1 : -1,
                row > 0 ? i - 8 : -1,
                row < 3 ? i + 8 : -1,
              ].filter((n) => n >= 0 && next[n].state === "faithful");
              if (neighbors.length === 0) continue;
              const target = neighbors[Math.floor(Math.random() * neighbors.length)];
              next[target].state = "heretical";
            }
            grid = next;
          }

          // Seed heretic every 30s if grid is all-faithful.
          if (unlockedLayers.apotheosis && heresySeedTimer <= 0) {
            const hereticCount = grid.filter((c) => c.state === "heretical").length;
            if (hereticCount === 0) {
              const faithfulIndices = grid
                .map((c, i) => (c.state === "faithful" ? i : -1))
                .filter((i) => i >= 0);
              if (faithfulIndices.length > 0) {
                const pick = faithfulIndices[Math.floor(Math.random() * faithfulIndices.length)];
                grid[pick] = { ...grid[pick], state: "heretical" };
              }
            }
          }

          // Prophets on this galaxy convert adjacent heretics every 10s.
          const galaxyProphets = prophets.filter((p) => p.galaxyId === gid);
          if (unlockedLayers.apotheosis && galaxyProphets.length > 0 && prophetConvertTimer <= 0) {
            const next = grid.map((c) => ({ ...c }));
            for (const p of galaxyProphets) {
              const i = p.cellIndex;
              const row = Math.floor(i / 8);
              const col = i % 8;
              const candidates: number[] = [];
              if (col > 0) candidates.push(i - 1);
              if (col < 7) candidates.push(i + 1);
              if (row > 0) candidates.push(i - 8);
              if (row < 3) candidates.push(i + 8);
              if (piLvl >= 1) {
                if (col > 0 && row > 0) candidates.push(i - 9);
                if (col < 7 && row > 0) candidates.push(i - 7);
                if (col > 0 && row < 3) candidates.push(i + 7);
                if (col < 7 && row < 3) candidates.push(i + 9);
              }
              if (piLvl >= 2) {
                if (col > 1) candidates.push(i - 2);
                if (col < 6) candidates.push(i + 2);
                if (row > 1) candidates.push(i - 16);
                if (row < 2) candidates.push(i + 16);
              }
              const neighbors = candidates.filter((n) => n >= 0 && n < next.length);
              let converted = 0;
              for (const n of neighbors) {
                if (next[n].state === "heretical") {
                  next[n].state = "faithful";
                  converted++;
                }
              }
              if (converted > 0) {
                p.lastConvertedAt = newTime;
                heresyLog.push(`🌟 Prophet in ${RIVAL_GALAXY_MAP[gid]?.name || gid} converted ${converted} heretic(s).`);
              }
            }
            grid = next;
          }

          // Compute heresy % = (hereticCount / 32) × 100.
          const hereticCount = grid.filter((c) => c.state === "heretical").length;
          const heresyPct = (hereticCount / 32) * 100;
          galaxyHeresy[gid] = heresyPct;

          // Threshold crossings: 25/50/75 → system loss + grid reset (one-time per galaxy per threshold).
          for (const threshold of [25, 50, 75]) {
            const key = `${gid}:${threshold}`;
            if (heresyPct >= threshold && !heresyThresholdsSeeded[key]) {
              heresyThresholdsSeeded[key] = true;
              const lossCount = threshold === 25 ? 1 : threshold === 50 ? 2 : 3;
              const galaxyName = RIVAL_GALAXY_MAP[gid]?.name || gid;

              if (gid !== STARTER_GALAXY_ID) {
                // Lose random claimed systems from this rival galaxy.
                const systems = (galaxyRivalSystems[gid] || []).map((sys) => ({ ...sys }));
                const claimedIdx = systems
                  .map((sys, i) => (sys.claimed ? i : -1))
                  .filter((i) => i >= 0);
                let actuallyLost = 0;
                for (let k = 0; k < lossCount && claimedIdx.length > 0; k++) {
                  const pick = Math.floor(Math.random() * claimedIdx.length);
                  const idx = claimedIdx.splice(pick, 1)[0];
                  systems[idx].claimed = false;
                  actuallyLost++;
                }
                galaxyRivalSystems[gid] = systems;
                heresyLog.push(`🔥 ${galaxyName} heresy hit ${threshold}%. Lost ${actuallyLost} claimed system(s).`);
              } else {
                heresyLog.push(`🔥 ${galaxyName} heresy hit ${threshold}%. The flock wavers in doubt.`);
              }

              // Reset grid to 16 heretics (heresy = 50). Preserve prophet positions.
              const resetGrid = grid.map((c) => ({
                state: "faithful",
                type: c.type === "prophet" ? "prophet" : "follower",
              }));
              const nonProphetIdx = resetGrid
                .map((c, i) => (c.type !== "prophet" ? i : -1))
                .filter((i) => i >= 0);
              // Fisher-Yates shuffle then pick first 16 to convert.
              for (let i = nonProphetIdx.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [nonProphetIdx[i], nonProphetIdx[j]] = [nonProphetIdx[j], nonProphetIdx[i]];
              }
              for (let k = 0; k < 16 && k < nonProphetIdx.length; k++) {
                resetGrid[nonProphetIdx[k]].state = "heretical";
              }
              grid = resetGrid;
              galaxyHeresy[gid] = 50;
              break; // only one threshold per tick per galaxy
            }
          }

          galaxyFollowerGrid[gid] = grid;
        }

        // Reset spread/seed/prophet timers.
        if (heresySpreadTimer <= 0) heresySpreadTimer = 10;
        if (heresySeedTimer <= 0) heresySeedTimer = 30;
        if (prophetConvertTimer <= 0) prophetConvertTimer = 10;

        // Recompute global heresy as the average of owned galaxies' heresy.
        const newHeresy = owned.length > 0
          ? owned.reduce((sum, gid) => sum + (galaxyHeresy[gid] || 0), 0) / owned.length
          : 0;
        heresy = newHeresy;
        // Run-ender: if AVERAGE galaxy heresy reaches 75 (the per-galaxy "red"
        // threshold), the god is cast down. CLEANUP-LEGACY: previously this
        // checked heresy >= 100, but per-galaxy heresy resets at 75 (one-time
        // per threshold), so the average can briefly hit 75 but the global
        // value was effectively unreachable. Triggering at 75 is the meaningful
        // "your flock has abandoned you" condition (matching the L5 heresy
        // threshold seeding where 75 = "red" / 3 systems lost).
        if (heresy >= 75) {
          heresy = 75;
          // ACHIEVEMENT-EXPANSION — flag that the player experienced (and
          // thus "survived") a heresy run-ender event. Drives the "Heresy
          // Survivor" achievement.
          const heresyMeta = { ...(s.achievementMeta || {}) };
          heresyMeta.heresySurvivor = 1;
          (s as GameState).achievementMeta = heresyMeta;
          // Persist the flag in the tick's tail set() by mutating the
          // local snapshot — the bottom set() call below includes
          // `achievementMeta` when it differs from the start snapshot.
          setTimeout(() => {
            get().addToLog("Heresy has reached 75 (average across owned galaxies). The god is cast down — the run ends in ruin.");
            get().triggerPrestige();
          }, 0);
        }

        // Flush L5 per-galaxy heresy log messages (deferred to avoid setState-in-loop).
        for (const msg of heresyLog) {
          setTimeout(() => get().addToLog(msg), 0);
        }

        // ===== LAYER 6 — UNIVERSAL MAP (Rift Defense + Reality Anchors) =====
        // Replaces the old Dimension Engine. Each tick:
        //   • riftSpawnTimer counts down; at 0, spawn a rift on a random
        //     galaxy (preferring unanchored ones). Reset timer to 30-60s (random).
        //   • Each open rift spreads corruption: +5% heresy to a random
        //     non-anchored galaxy. Anchored galaxies are immune.
        //   • Per-galaxy heresy thresholds (25/50/75) are handled in the L5
        //     tick above (universal galaxies inherit the same loss-count
        //     formula via heresyLossCount). The run-ender triggers when
        //     AVERAGE galaxy heresy hits 75 (see L5 block above).
        let universalGalaxies = (s.universalGalaxies || makeInitialUniversalGalaxies()).map((g) => ({ ...g }));
        let rifts = (s.rifts || []).map((r) => ({ ...r }));
        let realityAnchors = (s.realityAnchors || []).map((a) => ({ ...a }));
        let riftSpawnTimer = Math.max(0, (s.riftSpawnTimer ?? 45) - realDt);
        let riftsClosed = s.riftsClosed || 0;
        const anchorsPlaced = s.anchorsPlaced || 0;
        // Set of galaxy ids currently covered by an anchor (immune to rift corruption).
        const anchorGalaxyIds = realityAnchors.map((a) => a.galaxyId);
        const riftLog: string[] = [];
        if (unlockedLayers.singularity) {
          // Spawn a rift when the timer expires.
          if (riftSpawnTimer <= 0) {
            riftSpawnTimer = RIFT_SPAWN_MIN_SEC + Math.random() * (RIFT_SPAWN_MAX_SEC - RIFT_SPAWN_MIN_SEC);
            const targetId = pickRiftSpawnTarget(universalGalaxies, Math.random);
            if (targetId) {
              const severity = RIFT_SEVERITY_MIN + Math.floor(Math.random() * (RIFT_SEVERITY_MAX - RIFT_SEVERITY_MIN + 1));
              const riftId = `rift_${newTime.toFixed(0)}_${Math.floor(Math.random() * 100000)}`;
              rifts = [...rifts, { id: riftId, galaxyId: targetId, severity, spawnedAt: newTime }];
              const galaxyName = UNIVERSAL_GALAXY_MAP[targetId]?.name || targetId;
              riftLog.push(`🌀 Old-God rift opened in ${galaxyName} (severity ${severity}).`);
            }
          }
          // Each open rift spreads corruption to a random non-anchored galaxy.
          if (rifts.length > 0) {
            const nonAnchoredIds = universalGalaxies
              .filter((g) => !isGalaxyAnchored(g.id, anchorGalaxyIds))
              .map((g) => g.id);
            if (nonAnchoredIds.length > 0) {
              const updated = [...universalGalaxies];
              for (const rift of rifts) {
                // Corruption target: prefer the rift's host galaxy if it isn't
                // anchored; otherwise spread to a random non-anchored galaxy.
                let target = rift.galaxyId;
                if (isGalaxyAnchored(target, anchorGalaxyIds)) {
                  target = nonAnchoredIds[Math.floor(Math.random() * nonAnchoredIds.length)];
                }
                const idx = updated.findIndex((g) => g.id === target);
                if (idx >= 0) {
                  updated[idx] = {
                    ...updated[idx],
                    heresy: Math.min(100, updated[idx].heresy + RIFT_CORRUPTION_PER_TICK),
                  };
                }
              }
              universalGalaxies = updated;
            }
          }
        }

        // ===== BACKGROUND-SIMULATION — Divinity + EP generation =====
        // At L2+ (Enlightenment unlocked), the base game runs in the background.
        // Worlds formula (L6 redesign):
        //   worlds = (3 + starsLit) × simMult            [constellation stars + starter]
        //          + claimedL4Systems × 10               [L4 galaxy claim]
        //          + claimedRivalSystems × 18            [L5 rival galaxy conquest]
        //          + claimedNewSystems × 198            [L6 universal map: 5,000 × 198 = 990,000]
        //   capped at: 500 (L2/L3), 1000 (L4), 10000 (L5), 1,000,000 (L6+).
        // Each world generates Divinity at 1% of peakProductionRate/sec AND
        // EP at 0.1% of peak/sec.
        let divinityFromBackground = s.divinityFromBackground || 0;
        let epFromBackground = s.epFromBackground || 0;
        // Compute current sim count from constellation stars + shop upgrade.
        const starsLitCount = Object.values(s.constellationStars || {}).filter(Boolean).length;
        const simMult = 1 + (s.upgrades["simulation_amplifier"] || 0);  // level 0 = ×1, level 1 = ×2, ...
        const constellationWorlds = (s.unlockedLayers?.enlightenment)
          ? (3 + starsLitCount) * simMult  // 3 starter sims + 1 per star × multiplier
          : 0;
        // L4 Galaxy Claim: each claimed system grants +10 worlds.
        const claimedGalaxyCount = (s.galaxySystems || []).filter((g) => g.claimed).length;
        const l4Worlds = s.unlockedLayers?.genesis ? claimedGalaxyCount * 10 : 0;
        // L5 Rival galaxies: each claimed rival system grants +18 worlds.
        // L5 redesign — source of truth is `galaxyRivalSystems` (the L5 attack
        // loop). The L6 universal map's `totalRivalSystemsClaimed` no longer
        // drives L5 worlds — it just shadows L5 galaxies for narrative continuity.
        const claimedRivalCount = countClaimedRivalSystems(s.galaxyRivalSystems || {});
        const l5Worlds = s.unlockedLayers?.apotheosis ? claimedRivalCount * 18 : 0;
        // L6 Universal Map: each claimed NEW system grants +198 worlds.
        const claimedNewCount = totalNewSystemsClaimed(universalGalaxies);
        const l6Worlds = s.unlockedLayers?.singularity ? claimedNewCount * 198 : 0;
        // Cap depends on the highest layer the player has unlocked:
        //   L2/L3: 500, L4: 1000, L5: 10000, L6+: 1000000.
        const worldCap = s.unlockedLayers?.singularity ? 1_000_000
          : s.unlockedLayers?.apotheosis ? 10_000
          : s.unlockedLayers?.genesis ? 1_000
          : s.unlockedLayers?.transcendence ? 500
          : s.unlockedLayers?.enlightenment ? 500
          : 0;
        const computedBackgroundSims = worldCap > 0
          ? Math.min(worldCap, constellationWorlds + l4Worlds + l5Worlds + l6Worlds)
          : 0;
        const backgroundSimulations = computedBackgroundSims;
        if (backgroundSimulations > 0 && peakProductionRate > 0) {
          const bgDivPerSec = peakProductionRate * 0.01 * backgroundSimulations;
          const bgEpPerSec = peakProductionRate * 0.001 * backgroundSimulations;  // EP at 10% of divinity rate
          const bgDivGain = bgDivPerSec * realDt;
          const bgEpGain = bgEpPerSec * realDt;
          divinity += bgDivGain;
          evolutionPoints += bgEpGain;
          divinityFromBackground += bgDivGain;
          epFromBackground += bgEpGain;
          // Log status every 60s of game time (runtime-only marker, not persisted).
          const lastBgLog = (s as any)._lastBgSimLog || 0;
          if (newTime - lastBgLog >= 60) {
            (s as any)._lastBgSimLog = newTime;
            setTimeout(() => get().addToLog(
              `🌌 Worlds: ${backgroundSimulations} running (${starsLitCount} stars × ${simMult}× mult + 3 starters + ${claimedGalaxyCount} L4 systems × 10 + ${claimedRivalCount} rival × 18 + ${claimedNewCount} new × 198 = cap ${worldCap.toLocaleString()}). +${bgDivPerSec.toFixed(2)} Div/s, +${bgEpPerSec.toFixed(2)} EP/s.`
            ), 0);
          }
        }

        // ===== DIVINE INVESTMENT MARKET (new L3 design) =====
        // Each background simulation can be allocated to one of 5 portfolios
        // (see src/game/data/marketPortfolios.ts). Allocated worlds pay Divinity
        // dividends = allocatedWorlds × portfolio.baseYield × peakProductionRate
        // × 0.01 per sec. Riskier portfolios may crash (per-tick roll vs.
        // portfolio.crashChance) and consume `crashLoss × allocatedWorlds`
        // worlds. Stability Bonds lock worlds for 120s on allocation. Portfolio
        // prices random-walk ±1 per tick (clamped 50–200) — currently cosmetic
        // (drives the buy-low / sell-high sparkline on the card).
        let portfolioAllocations = { ...(s.portfolioAllocations || {}) };
        let portfolioLockTimers = { ...(s.portfolioLockTimers || {}) };
        let portfolioPrices = { ...(s.portfolioPrices || {}) };
        let portfolioDividendsEarned = s.portfolioDividendsEarned || 0;
        // Defensive: ensure every portfolio has a starting price (50–200, init 100).
        for (const p of PORTFOLIOS) {
          if (typeof portfolioPrices[p.id] !== "number") {
            portfolioPrices[p.id] = PORTFOLIO_PRICE_START;
          }
          if (typeof portfolioAllocations[p.id] !== "number") {
            portfolioAllocations[p.id] = 0;
          }
        }
        if (unlockedLayers.transcendence) {
          // Pool of worlds the player has available — total minus already allocated.
          // We use `backgroundSimulations` (the value computed THIS tick) so the
          // cap stays in sync with the world count shown everywhere else.
          const allocatedNow = totalAllocatedWorlds(portfolioAllocations);
          const availableWorlds = Math.max(0, backgroundSimulations - allocatedNow);
          // If the world pool shrank (e.g. player lost galaxies) and
          // allocations now exceed the total, proportionally trim each
          // portfolio's allocation down so the totals stay valid.
          if (allocatedNow > backgroundSimulations && backgroundSimulations > 0) {
            const trimRatio = backgroundSimulations / allocatedNow;
            for (const p of PORTFOLIOS) {
              portfolioAllocations[p.id] = Math.floor(
                (portfolioAllocations[p.id] || 0) * trimRatio
              );
            }
          }
          // Track deferred log messages so we don't call setState mid-loop.
          const portfolioLogs: string[] = [];
          // Per-tick price random walk (±1 clamped 50–200). Cheap & expensive
          // labels in the UI are derived from this signal.
          for (const p of PORTFOLIOS) {
            const cur = portfolioPrices[p.id] ?? PORTFOLIO_PRICE_START;
            const drift = (Math.random() - 0.5) * PORTFOLIO_PRICE_DRIFT;
            const next = Math.max(
              PORTFOLIO_PRICE_MIN,
              Math.min(PORTFOLIO_PRICE_MAX, cur + drift)
            );
            portfolioPrices[p.id] = next;
          }
          // Dividends + crash rolls for each portfolio with allocated worlds.
          // We only process portfolios the player has invested in (alloc > 0)
          // OR that are still locked down (Stability Bonds timer > 0).
          for (const p of PORTFOLIOS) {
            // Decrement lock timer for Stability Bonds (and any future locked
            // portfolio) regardless of allocation — keeps the timer honest.
            if ((portfolioLockTimers[p.id] || 0) > 0) {
              portfolioLockTimers[p.id] = Math.max(
                0,
                (portfolioLockTimers[p.id] || 0) - realDt
              );
            }
            const alloc = Math.max(0, Math.floor(portfolioAllocations[p.id] || 0));
            if (alloc <= 0) continue;
            // Dividends = allocatedWorlds × baseYield × peakProductionRate × 0.01 × realDt
            // (×0.01 mirrors the 1%-of-peak-per-world background simulation rule.)
            const dividends = portfolioDividendsPerSec(p, alloc, peakProductionRate) * realDt;
            if (dividends > 0) {
              divinity += dividends;
              portfolioDividendsEarned += dividends;
            }
            // Crash roll — only when peakProductionRate > 0 (otherwise the
            // portfolio is producing nothing, so crashes feel pointless).
            if (peakProductionRate > 0 && p.crashChance > 0 && Math.random() < p.crashChance) {
              const worldsLost = Math.max(1, Math.floor(alloc * p.crashLoss));
              portfolioAllocations[p.id] = Math.max(0, alloc - worldsLost);
              if (p.crashLoss >= 1.0) {
                portfolioLogs.push(
                  `👁️ Old God Futures CRASHED — ${worldsLost} worlds lost to the void.`
                );
              } else {
                portfolioLogs.push(
                  `${p.icon} ${p.name} crashed — lost ${worldsLost} worlds (${(p.crashLoss * 100).toFixed(0)}% of allocation).`
                );
              }
            }
          }
          // Surface the available-worlds pool as a one-line runtime marker so
          // the modal can show a "free worlds" hint without recomputing.
          void availableWorlds;
          for (const msg of portfolioLogs) {
            setTimeout(() => get().addToLog(msg), 0);
          }
        }

        // ===== PP-SHOP-TABS — UNIVERSAL AUTO-BUYER TICK =====
        // Each auto-buyer is a universal upgrade (purchased with Prestige Points).
        // The auto-buyer for layer N unlocks when layer N+1 is unlocked (chain spec).
        // We update the per-tick timer AND defer the actual action via setTimeout
        // so the action's own set() call doesn't race with the tick's set() below.
        // Defensive: actions are guarded by their own layer-unlock checks, so if
        // any are not yet implemented (e.g. attackGalaxy for L5 rival galaxies),
        // the timer simply advances with no work done.

        // ---- auto_light_stars (L3+ unlocked): cheapest affordable constellation star ----
        if (!trialAutobuyersBlocked && (s.upgrades["auto_light_stars"] || 0) > 0
            && s.unlockedLayers?.transcendence
            && newTime - (autoTimers.light_stars || 0) >= 20) {
          autoTimers.light_stars = newTime;
          // Find the cheapest affordable unlit star across all constellations.
          const cs: ConstellationState = {
            constellationStars: s.constellationStars || {},
            constellationProgress: s.constellationProgress || {},
            constellationsStarted: s.constellationsStarted || {},
            constellationsCompleted: s.constellationsCompleted || {},
          };
          const fdLvl = (s.upgrades?.foresight_discount as number) || 0;
          const foresightDiscountMult = Math.pow(0.80, fdLvl);
          let best: { cId: string; sId: string; cost: number } | null = null;
          for (const c of CONSTELLATIONS) {
            for (const st of c.stars) {
              if (cs.constellationStars[st.id]) continue; // already lit
              const cost = starCost(c.id, cs, st.id, { foresightDiscountMult });
              if (cost <= (divinity) && (!best || cost < best.cost)) {
                best = { cId: c.id, sId: st.id, cost };
              }
            }
          }
          if (best) {
            const pick = best;
            setTimeout(() => get().illuminateStar(pick.cId, pick.sId), 0);
          }
        }

        // ---- auto_invest_market (L4+ unlocked): sell owned market resources for Divinity ----
        if ((s.upgrades["auto_invest_market"] || 0) > 0
            && s.unlockedLayers?.genesis
            && newTime - (autoTimers.invest_market || 0) >= 30) {
          autoTimers.invest_market = newTime;
          // Pick the resource with the highest current price × owned-qty to convert.
          const owned = s.marketOwnedResources || {};
          const prices = s.marketPrices || {};
          let bestRes: string | null = null;
          let bestValue = 0;
          for (const [rid, qty] of Object.entries(owned)) {
            if (!qty) continue;
            const price = prices[rid] || 10;
            const value = price * qty;
            if (value > bestValue) {
              bestValue = value;
              bestRes = rid;
            }
          }
          if (bestRes) {
            const rid = bestRes;
            const qty = owned[rid] || 0;
            setTimeout(() => get().marketOffering(rid, qty), 0);
          }
        }

        // ---- auto_claim_systems (L5+ unlocked): attack the cheapest affordable
        //      unclaimed system — L5 rival galaxy OR L6 NEW galaxy (whichever is cheaper) ----
        if (!trialAutobuyersBlocked && (s.upgrades["auto_claim_systems"] || 0) > 0
            && s.unlockedLayers?.apotheosis
            && newTime - (autoTimers.claim_systems || 0) >= 15) {
          autoTimers.claim_systems = newTime;
          // Candidate A: cheapest unclaimed L5 rival galaxy system.
          let bestGalaxy: { kind: "l5" | "l6"; id: string; cost: number } | null = null;
          const grs = s.galaxyRivalSystems || {};
          for (const g of RIVAL_GALAXIES) {
            if (g.ownerId === "player") continue; // starter — no attacking
            const list = grs[g.id] || [];
            const claimedCount = list.filter((sys) => sys.claimed).length;
            if (claimedCount >= g.systemCount) continue; // fully claimed
            const cost = galaxyAttackCost(claimedCount, g.defenseStrength);
            if (cost <= (s.faith || 0) && (!bestGalaxy || cost < bestGalaxy.cost)) {
              bestGalaxy = { kind: "l5", id: g.id, cost };
            }
          }
          // Candidate B: cheapest unclaimed L6 NEW galaxy system (Singularity unlocked).
          if (s.unlockedLayers?.singularity) {
            const ug = (universalGalaxies || []).map((g) => ({ ...g }));
            const totalNewClaimed = totalNewSystemsClaimed(ug);
            for (const g of ug) {
              const def = UNIVERSAL_GALAXY_MAP[g.id];
              if (!def || !def.isNewL6) continue;
              if (g.systemsClaimed >= def.systemCount) continue;
              const cost = newGalaxyAttackCost(totalNewClaimed);
              if (cost <= (s.faith || 0) && (!bestGalaxy || cost < bestGalaxy.cost)) {
                bestGalaxy = { kind: "l6", id: g.id, cost };
              }
            }
          }
          if (bestGalaxy) {
            const pick = bestGalaxy;
            setTimeout(() => {
              if (pick.kind === "l5") {
                // L5 rival galaxy attack — `attackGalaxy` is declared on
                // GameStore but not yet implemented (deferred to a future L5
                // wiring task). Defensively check before calling so the
                // auto-buyer doesn't crash if it's still undefined.
                const fn = (get() as any).attackGalaxy;
                if (typeof fn === "function") fn(pick.id);
              } else {
                get().attackUniversalGalaxy(pick.id);
              }
            }, 0);
          }
        }

        // ---- auto_manage_heresy (L7+ unlocked): convert heretics across owned galaxies ----
        if (!trialAutobuyersBlocked && (s.upgrades["auto_manage_heresy"] || 0) > 0
            && s.unlockedLayers?.omnipotence
            && newTime - (autoTimers.manage_heresy || 0) >= 15) {
          autoTimers.manage_heresy = newTime;
          // Auto-buyer is free per spec ("No Divinity/Faith cost — the Inquisition
          // runs itself"). Walk owned galaxies and convert the first heretic found.
          let convertedGalaxy: string | null = null;
          let convertedIdx = -1;
          for (const gid of owned) {
            const g = (galaxyFollowerGrid[gid] || makeInitialFollowerGrid()).map((c) => ({ ...c }));
            const idx = g.findIndex((c) => c?.state === "heretical");
            if (idx >= 0) {
              g[idx].state = "faithful";
              galaxyFollowerGrid = { ...galaxyFollowerGrid, [gid]: g };
              convertedGalaxy = gid;
              convertedIdx = idx;
              break;
            }
          }
          if (convertedGalaxy) {
            const gname = RIVAL_GALAXY_MAP[convertedGalaxy]?.name || convertedGalaxy;
            setTimeout(() => get().addToLog(`⚖️ Auto-Manage Heresy: converted cell ${convertedIdx + 1} in ${gname} back to the faithful.`), 0);
          }
        }

        // ---- auto_place_anchors (L7+ unlocked): place anchor on random unanchored galaxy ----
        if (!trialAutobuyersBlocked && (s.upgrades["auto_place_anchors"] || 0) > 0
            && s.unlockedLayers?.omnipotence
            && newTime - (autoTimers.place_anchors || 0) >= 60) {
          autoTimers.place_anchors = newTime;
          // Pick a random unanchored galaxy where anchorPlaceCost <= singularityCores.
          const ug = (universalGalaxies || []);
          const anchorsPlacedNow = s.anchorsPlaced || 0;
          const anchorCost = anchorPlaceCost(anchorsPlacedNow);
          const unanchored = ug.filter((g) => !g.anchored);
          if (unanchored.length > 0 && (s.singularityCores || 0) >= anchorCost) {
            const pick = unanchored[Math.floor(Math.random() * unanchored.length)];
            setTimeout(() => get().placeRealityAnchor(pick.id), 0);
          }
        }

        // ---- auto_negotiate (L9+ unlocked): negotiate with first available minor god ----
        if (!trialAutobuyersBlocked && (s.upgrades["auto_negotiate"] || 0) > 0
            && s.unlockedLayers?.infinity
            && newTime - (autoTimers.negotiate || 0) >= 30) {
          autoTimers.negotiate = newTime;
          // Pick the first god whose negotiate cooldown is 0 and relationship not maxed.
          const gods = (s.minorGods || []).slice();
          const rels = s.godRelationships || {};
          let pickGod: string | null = null;
          for (const g of gods) {
            const cdKey = `negotiate_${g.id}`;
            const cd = (s as any)[cdKey] || 0;
            if (cd > 0) continue;
            if ((rels[g.id] || g.startingRelationship) >= RELATIONSHIP_MAX) continue;
            pickGod = g.id;
            break;
          }
          if (pickGod) {
            const gid = pickGod;
            setTimeout(() => get().negotiateWithGod(gid), 0);
          }
        }

        // ---- auto_attack_old_gods (L10+ unlocked): attack every active Old God battle ----
        if (!trialAutobuyersBlocked && (s.upgrades["auto_attack_old_gods"] || 0) > 0
            && s.unlockedLayers?.eternity
            && newTime - (autoTimers.attack_old_gods || 0) >= 10) {
          autoTimers.attack_old_gods = newTime;
          // Iterate every active in_progress battle and attack it.
          const battles = s.oldGodBattles || {};
          const activeIds = Object.keys(battles).filter((id) => battles[id]?.status === "in_progress");
          for (const oldGodId of activeIds) {
            setTimeout(() => get().attackOldGod(oldGodId), 0);
          }
        }

        // ---- auto_author_universes (L10 finished — Genesis Engine): reveal a
        // random unrevealed rule name on a random owned relic every 120s.
        // (Re-purposed from the legacy "fill universe slot" action.)
        if (!trialAutobuyersBlocked && (s.upgrades["auto_author_universes"] || 0) > 0
            && s.unlockedLayers?.eternity
            && !s.universeSimulating
            && newTime - (autoTimers.author_universes || 0) >= 120) {
          autoTimers.author_universes = newTime;
          // Find relics with at least one unrevealed rule name.
          const relics = (s.divineRelics || []);
          const candidates: Array<{ relicId: string; ruleIndex: number }> = [];
          for (const r of relics) {
            for (let i = 0; i < r.rules.length; i++) {
              if (!r.rules[i].revealed.rule) {
                candidates.push({ relicId: r.id, ruleIndex: i });
              }
            }
          }
          if (candidates.length > 0 && (s.divinity || 0) >= REVEAL_COST_RULE) {
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            setTimeout(() => get().revealRelicRule(pick.relicId, pick.ruleIndex), 0);
          }
        }

        // ---- Big Bang simulation completion check ----
        // If a Big Bang is in progress and 30s have elapsed, complete it.
        if (s.universeSimulating && newTime - (s.simulationStartTime || 0) >= BIG_BANG_DURATION_SEC) {
          setTimeout(() => get().completeBigBang(), 0);
        }

        // CURRENCY-UNIFICATION — the `ep_auto_converter` tick block has been
        // REMOVED. The EP→PP conversion was redundant once the shop spends a
        // single currency (Divinity) for everything. Old saves keep their
        // `upgrades.ep_auto_converter` level but it has no effect — the
        // upgrade definition was removed from data/upgrades.ts and this tick
        // block is left as a marker. (Old behaviour: every tick, when the
        // player owned `ep_auto_converter` AND L2 was unlocked AND
        // `evolutionPoints > 0`, convert ALL EP→PP at 1:1. Rate-limited log.)

        set({
          resources,
          capacities,
          time: newTime,
          population,
          maxPopulation,
          populationProgress,
          storyUnlocked: newStory,
          activeStoryPopup: activePopup,
          achievements,
          newAchievements,
          activeEvent,
          eventTimer,
          eventCooldown,
          // EVENT-CHAINS — persist the (possibly mutated) pendingFollowUps
          // array. The block above pops + rolls due entries; entries whose
          // fireAt is still in the future stay queued.
          pendingFollowUps,
          ownedSystems,
          systemEnabled,
          archetypeAffinity,
          technologies,
          totalSystemsBuilt,
          totalTechResearched,
          autoTimers,
          completedChallenges,
          challengeRepeatCounts,
          activeChallenge,
          unlockedLayers,
          unlockedThemes,
          activeStageTheme,
          activeLayerTheme,
          activeSpecialTheme,
          totalPlayTime: (s.totalPlayTime || 0) + realDt,
          // Layer 2-6 currency + state
          divinity,
          faith,
          heresy,
          activeTemporaryRituals,
          miracleTimers,
          activeScripts,
          scriptTimers,
          bloodPactsUsed,
          // L8 FIX — per-god Negotiate cooldowns
          ...negotiateCooldowns,
          // Layer 7-8 state
          instability,
          geneticInstability,
          // NEW: Skirmish Arena — outpost raids + creature XP/levels
          outpostRaids,
          raidsRepelled,
          outpostRaidSpawnTimer,
          galaxySystems,
          // NEW: Layer 7-10 runtime state
          // (creatures/legions/minorGods/oldGodBattles/divineRelics/crucibleRelicIds/
          //  discoveredArchetypes are mutated through dedicated actions, not inside
          //  the tick — they persist as-is.)
          // QUICK WINS — runtime timers + universal currency
          activeAbilityCooldowns,
          activeAbilityEffects,
          ritualComboTimer,
          layerEventTimers,
          prestigePoints,
          // REBUILD L1-6 — runtime state for the layer mini-games
          // (Legacy trialRealm* state fields removed in CLEANUP-LEGACY — no
          // longer mutated by the tick. Kept in initialMetaState + persist
          // migration for save-shape compat.)
          marketPrices,
          priceHistory,
          marketOwnedResources,
          marketTickTimer,
          // FEATURE 3 — Market Crashes
          marketCrashTimer,
          marketCrashActive,
          marketCrashDuration,
          // DIVINE INVESTMENT MARKET — allocations, lock timers, prices, lifetime dividends
          portfolioAllocations,
          portfolioLockTimers,
          portfolioPrices,
          portfolioDividendsEarned,
          heresySpreadTimer,
          heresySeedTimer,
          heresyThresholdsSeeded,
          // FEATURE 5 — Prophets (per-galaxy)
          prophets,
          prophetConvertTimer,
          // L5 redesign — Galactic Conquest per-galaxy state
          galaxyHeresy,
          galaxyFollowerGrid,
          galaxyRivalSystems,
          // L6 Universal Map — new state.
          universalGalaxies,
          rifts,
          realityAnchors,
          riftSpawnTimer,
          riftsClosed,
          // anchorsPlaced is mutated only via the placeRealityAnchor action —
          // the tick does not change it. We don't write it here.
          // L6 Singularity Cores — kept as-is (not granted by the tick anymore;
          // gained via prestige + the close-rift action).
          // BACKGROUND-SIMULATION — peak + lifetime trackers + computed sim count
          peakProductionRate,
          backgroundSimulations,
          divinityFromBackground,
          epFromBackground,
          evolutionPoints,
          // ACHIEVEMENT-EXPANSION — persist the (possibly mutated)
          // achievementMeta record from the top-of-tick idle update and
          // any mid-tick flag updates (e.g. heresySurvivor).
          achievementMeta: s.achievementMeta,
        });
        // L6 Universal Map — log rift spawn / corruption events (deferred to avoid setState-in-loop).
        for (const msg of riftLog) {
          setTimeout(() => get().addToLog(msg), 0);
        }
      },

      // ============ ACTIONS ============
      performAction: (actionId) => {
        const s = get();
        const action = ACTION_MAP[actionId];
        if (!action) return;
        if (action.stage !== STAGES[s.stageIndex].id) return;

        const res = { ...s.resources };

        // Check if all output resources are at cap — if so, block (no waste)
        const outputs = Object.entries(action.produces);
        if (outputs.length > 0) {
          const allCapped = outputs.every(([r]) => {
            const cap = s.capacities[r] || 0;
            return (res[r] || 0) >= cap - 0.001;
          });
          if (allCapped) return; // action wasted — block it
        }

        // Check costs
        if (action.cost) {
          for (const [r, v] of Object.entries(action.cost)) {
            if ((res[r] || 0) < (v as number)) return;
          }
          for (const [r, v] of Object.entries(action.cost)) {
            res[r] -= v as number;
          }
        }

        // Manual action multiplier
        // (quickened_hands removed; no upgrade scales manual actions now)
        const mult = 1;
        const techMult = techMultiplier(s, "manual");
        const finalMult = mult * techMult;

        // Archetype per-resource bonus
        const archetype = s.lockedArchetype ? ARCHETYPE_MAP[s.lockedArchetype] : null;

        for (const [r, v] of Object.entries(action.produces)) {
          const cap = s.capacities[r] || 0;
          const archResBonus = archetype?.bonus.productionMult?.[r] || 0;
          // ARCHETYPES-REWORK — military_power gets additional bonus from
          // militaryPowerMult (Reptilian +15%, Toxoid +15%, Molluscoid -10%, etc.)
          const archMilBonus = r === "military_power" ? (archetype?.bonus.militaryPowerMult || 0) : 0;
          const totalArchMult = 1 + archResBonus + archMilBonus + (archetype?.bonus.allProductionMult || 0);
          const amount = (v as number) * finalMult * totalArchMult;
          res[r] = Math.min(cap, (res[r] || 0) + amount);
        }

        set({
          resources: res,
          totalActions: (s.totalActions || 0) + 1,
          // ACHIEVEMENT-EXPANSION — mark this as a player action so the
          // tick can reset the consecutive idle counter (drives "Idle
          // Master" — 1 hour without clicking).
          achievementMeta: markPlayerAction(s),
        });
      },

      buySystem: (systemId, qty) => {
        const s = get();
        const sys = SYSTEM_MAP[systemId];
        if (!sys) return;
        if (sys.stage !== STAGES[s.stageIndex].id) return;
        // Check tech prerequisite
        if (sys.requiredTech && !s.technologies[sys.requiredTech]) {
          const techName = TECH_MAP[sys.requiredTech]?.name || sys.requiredTech;
          get().notifyPurchaseError(`Requires tech: ${techName}`);
          return;
        }
        // FIX-ARCHETYPE-LOCKED — archetype-locked systems are only buildable
        // by the matching locked archetype (Tribal→Galactic archetype-drift
        // systems). Refuse purchase with an inline error.
        if (sys.requiredArchetype && s.lockedArchetype !== sys.requiredArchetype) {
          const archName = ARCHETYPE_MAP[sys.requiredArchetype]?.name || sys.requiredArchetype;
          get().notifyPurchaseError(`Requires ${archName} archetype`);
          return;
        }

        // ---- Active challenge restrictions ----
        let challengeDebuff: ChallengeEffects = {};
        if (s.activeChallenge && s.unlockedChallenges) {
          const ch = CHALLENGE_MAP[s.activeChallenge];
          if (ch) {
            const repeat = s.challengeRepeatCounts?.[s.activeChallenge] || 0;
            challengeDebuff = getChallengeDebuffAtRepeat(ch, repeat);
          }
        }
        const challengeCostMult = challengeDebuff.costMult ?? 1;
        if (challengeDebuff.disableMilitary && sys.category === "Military") {
          get().addToLog(`Trial ${CHALLENGE_MAP[s.activeChallenge!]?.name} forbids military systems.`);
          return;
        }
        if (challengeDebuff.maxSystems !== undefined) {
          const totalSystems = Object.values(s.ownedSystems).reduce((a, b) => a + b, 0);
          if (totalSystems >= challengeDebuff.maxSystems) {
            get().addToLog(`Trial ${CHALLENGE_MAP[s.activeChallenge!]?.name} caps you at ${challengeDebuff.maxSystems} systems.`);
            return;
          }
        }

        const costReduction = (s.upgrades["frugality"] || 0) * 0.04
          + Math.max(0, -(foresightBonus(s.foresightNodes || {}).costMult))
          + Math.max(0, -(constellationBonus({
              constellationStars: s.constellationStars || {},
              constellationProgress: s.constellationProgress || {},
              constellationsStarted: s.constellationsStarted || {},
              constellationsCompleted: s.constellationsCompleted || {},
            }).costMult));
        // ARCHETYPES-REWORK — locked archetype system-cost adjustment
        // (Humanoid +10% / Arthropoid -15%). Applied as a multiplicative modifier
        // on top of the challenge cost multiplier.
        const archSysCostMult = s.lockedArchetype
          ? (ARCHETYPE_MAP[s.lockedArchetype]?.bonus.systemCostMult || 0)
          : 0;
        const archCostFactor = 1 + archSysCostMult;
        let owned = s.ownedSystems[systemId] || 0;
        if (sys.maxOwned && owned >= sys.maxOwned) return;

        const res = { ...s.resources };
        const ownedSystems = { ...s.ownedSystems };
        const systemEnabled = { ...s.systemEnabled };
        const archetypeAffinity = { ...s.archetypeAffinity };

        let bought = 0;
        // P7 — Track the first resource we couldn't afford, so we can surface
        // an inline "Not enough [resource]" error in the UI when bought === 0.
        let missingResourceId: string | null = null;
        for (let i = 0; i < qty; i++) {
          if (sys.maxOwned && owned + bought >= sys.maxOwned) break;
          if (challengeDebuff.maxSystems !== undefined) {
            const totalSystems = Object.values(ownedSystems).reduce((a, b) => a + b, 0);
            if (totalSystems + bought >= challengeDebuff.maxSystems) break;
          }
          const cost = systemCost(sys, owned + bought, costReduction);
          // DEBUG: Free Buy — skip affordability check + cost deduction
          if (s.debugFreeBuy) {
            bought++;
            continue;
          }
          let canAfford = true;
          for (const [r, v] of Object.entries(cost)) {
            const scaled = Math.ceil((v as number) * challengeCostMult * archCostFactor);
            if ((res[r] || 0) < scaled) {
              canAfford = false;
              if (!missingResourceId) missingResourceId = r;
              break;
            }
          }
          if (!canAfford) break;
          for (const [r, v] of Object.entries(cost)) {
            const scaled = Math.ceil((v as number) * challengeCostMult * archCostFactor);
            res[r] -= scaled;
          }
          bought++;
        }

        // P7 — Error state: if we couldn't afford any (and weren't blocked by
        // max-owned / trial cap), surface the first missing resource name.
        if (bought === 0 && missingResourceId) {
          const friendlyName = RESOURCE_MAP[missingResourceId]?.name
            || missingResourceId.replace(/_/g, " ");
          get().notifyPurchaseError(`Not enough ${friendlyName}`);
        }
        if (bought === 0) return;

        ownedSystems[systemId] = owned + bought;
        // New systems are enabled by default
        if (systemEnabled[systemId] === undefined) systemEnabled[systemId] = true;

        // Apply archetype affinity grant
        if (sys.grantsAffinity) {
          const arch = sys.grantsAffinity.archetype;
          archetypeAffinity[arch] = (archetypeAffinity[arch] || 0) + sys.grantsAffinity.amount * bought;
        }

        // Trigger story
        const newStory = { ...s.storyUnlocked };
        let activePopup = s.activeStoryPopup;
        for (const trig of STORY_TRIGGERS) {
          if (!newStory[trig.id] && trig.condition({ ...s, resources: res, ownedSystems })) {
            newStory[trig.id] = true;
            if (!activePopup) activePopup = trig.id;
          }
        }

        set({
          resources: res,
          ownedSystems,
          systemEnabled,
          archetypeAffinity,
          storyUnlocked: newStory,
          activeStoryPopup: activePopup,
          totalSystemsBuilt: (s.totalSystemsBuilt || 0) + bought,
        });
        get().addToLog(`Built ${bought}× ${sys.name}.`);
      },

      toggleSystem: (systemId) => {
        const s = get();
        if (!s.ownedSystems[systemId]) return;
        const systemEnabled = { ...s.systemEnabled };
        systemEnabled[systemId] = systemEnabled[systemId] === false ? true : false;
        set({ systemEnabled });
      },

      enableAllSystems: (enabled) => {
        const s = get();
        const systemEnabled: Record<string, boolean> = {};
        for (const id of Object.keys(s.ownedSystems)) {
          systemEnabled[id] = enabled;
        }
        set({ systemEnabled });
      },

      buyTech: (techId) => {
        const s = get();
        const tech = TECH_MAP[techId];
        if (!tech) return;
        if (s.technologies[techId]) return;
        if (tech.stage !== STAGES[s.stageIndex].id) return;
        // FIX-ARCHETYPE-LOCKED — archetype-locked techs are only researchable
        // by the matching locked archetype.
        if (tech.requiredArchetype && s.lockedArchetype !== tech.requiredArchetype) {
          const archName = ARCHETYPE_MAP[tech.requiredArchetype]?.name || tech.requiredArchetype;
          get().notifyPurchaseError(`Requires ${archName} archetype`);
          return;
        }
        if (tech.requires) {
          for (const req of tech.requires) {
            if (!s.technologies[req]) return;
          }
        }

        // ---- Active challenge restrictions ----
        let challengeDebuff: ChallengeEffects = {};
        if (s.activeChallenge && s.unlockedChallenges) {
          const ch = CHALLENGE_MAP[s.activeChallenge];
          if (ch) {
            const repeat = s.challengeRepeatCounts?.[s.activeChallenge] || 0;
            challengeDebuff = getChallengeDebuffAtRepeat(ch, repeat);
          }
        }
        const challengeCostMult = challengeDebuff.costMult ?? 1;
        if (challengeDebuff.disableTech) {
          get().addToLog(`Trial ${CHALLENGE_MAP[s.activeChallenge!]?.name} forbids all tech research.`);
          return;
        }
        if (challengeDebuff.disableMilitary && tech.branch === "Conflict") {
          get().addToLog(`Trial ${CHALLENGE_MAP[s.activeChallenge!]?.name} forbids military tech.`);
          return;
        }

        const res = { ...s.resources };
        const layerTechCostMult = (1 - Math.max(0, -(foresightBonus(s.foresightNodes || {}).costMult)))
          * (1 - Math.max(0, -(constellationBonus({
              constellationStars: s.constellationStars || {},
              constellationProgress: s.constellationProgress || {},
              constellationsStarted: s.constellationsStarted || {},
              constellationsCompleted: s.constellationsCompleted || {},
            }).costMult)));
        // DEBUG: Free Buy — skip cost check + deduction
        if (!s.debugFreeBuy) {
          let missingTechResource: string | null = null;
          for (const [r, v] of Object.entries(tech.cost)) {
            const scaled = Math.ceil((v as number) * challengeCostMult * layerTechCostMult);
            if ((res[r] || 0) < scaled) {
              if (!missingTechResource) missingTechResource = r;
            }
          }
          if (missingTechResource) {
            // P7 — Error state: surface the first missing resource.
            const friendlyName = RESOURCE_MAP[missingTechResource]?.name
              || missingTechResource.replace(/_/g, " ");
            get().notifyPurchaseError(`Not enough ${friendlyName}`);
            return;
          }
          for (const [r, v] of Object.entries(tech.cost)) {
            const scaled = Math.ceil((v as number) * challengeCostMult * layerTechCostMult);
            res[r] -= scaled;
          }
        }
        const technologies = { ...s.technologies, [techId]: true };
        const archetypeAffinity = { ...s.archetypeAffinity };
        if (tech.grantsAffinity) {
          archetypeAffinity[tech.grantsAffinity.archetype] =
            (archetypeAffinity[tech.grantsAffinity.archetype] || 0) + tech.grantsAffinity.amount;
        }
        set({
          resources: res,
          technologies,
          archetypeAffinity,
          totalTechResearched: (s.totalTechResearched || 0) + 1,
        });
        get().addToLog(`Researched ${tech.name}.`);
      },

      buyUpgrade: (upgradeId) => {
        const s = get();
        const up = UPGRADE_MAP[upgradeId];
        if (!up) return;
        if (!s.debugFreeBuy) {
          if (up.requiresWins && s.galacticWins < up.requiresWins) return;
          // Layer-specific upgrades require their layer to be unlocked
          if (up.requiresLayer && !s.unlockedLayers?.[up.requiresLayer]) return;
        }
        const owned = s.upgrades[upgradeId] || 0;
        if (owned >= up.maxLevel) return;
        const cost = upgradeCost(up, owned);
        // CURRENCY-UNIFICATION — shop upgrades now cost Divinity (was EP).
        // `evolutionPoints` is kept on GameState for back-compat but is no
        // longer spent here. `debugFreeBuy` still bypasses affordability.
        if (!s.debugFreeBuy && (s.divinity || 0) < cost) {
          get().notifyPurchaseError("Not enough Divinity");
          return;
        }
        const upgrades = { ...s.upgrades, [upgradeId]: owned + 1 };
        set({
          divinity: s.debugFreeBuy ? (s.divinity || 0) : (s.divinity || 0) - cost,
          upgrades,
        });
        get().addToLog(`Purchased ${up.name} (Lv ${owned + 1}).${s.debugFreeBuy ? " (DEBUG: free)" : ` for ${cost} Divinity`}`);
      },

      evolveStage: () => {
        const s = get();
        const stage = STAGES[s.stageIndex];
        const next = nextStage(stage.id);
        if (!next) {
          get().triggerPrestige();
          return;
        }
        const reqs = stage.evolveRequires;
        const evolveBoost = 1 - Math.min(0.30, (s.upgrades["evolutionary_momentum"] || 0) * 0.05);
        const totalSystems = Object.values(s.ownedSystems).reduce((a, b) => a + b, 0);
        const totalTech = Object.keys(s.technologies).length;
        const score = computeScore(s);

        if (s.population < reqs.minPopulation * evolveBoost) return;
        if (totalSystems < reqs.minSystems * evolveBoost) return;
        if (totalTech < reqs.minTech * evolveBoost) return;
        // Score is NOT a requirement — it only affects EP earned at prestige

        const nextStageIdx = s.stageIndex + 1;
        const nextStageDef = STAGES[nextStageIdx];

        const resources = { ...s.resources };

        // Give starting resources for the new stage to prevent deadlocks
        const stageStartBonus: Record<string, Record<string, number>> = {
          creature: { food: 15, water: 10, materials: 5 },
          tribal: { wood: 15, stone: 5, clay: 3 },
          civilization: { production: 20, gold: 15 },
          empire: { influence: 5, gold: 30 },
          solar: { energy: 25, alloys: 8 },
          galactic: { data: 15, energy: 40 },
        };
        const startBonus = stageStartBonus[nextStageDef.id];
        if (startBonus) {
          for (const [r, v] of Object.entries(startBonus)) {
            resources[r] = (resources[r] || 0) + v;
          }
          get().addToLog(`Starting resources granted: ${Object.entries(startBonus).map(([r,v]) => `${v} ${r}`).join(', ')}`);
        }

        const capBoostLvl = s.upgrades["expansive_vaults"] || 0;
        const capMult = 1 + capBoostLvl * 0.20;
        const archetype = s.lockedArchetype ? ARCHETYPE_MAP[s.lockedArchetype] : null;
        const archCapMult = archetype?.bonus.capMult || 0;
        const capacities = recomputeCapacitiesFresh(s, capMult + archCapMult);

        const newStory = { ...s.storyUnlocked };
        const storyId = STORY_MAP[
          nextStageDef.id === "creature" ? "first_body_stirs"
          : nextStageDef.id === "tribal" ? "fire_remembered"
          : nextStageDef.id === "civilization" ? "cities_learn_to_dream"
          : nextStageDef.id === "empire" ? "distance_begins_to_obey"
          : nextStageDef.id === "solar" ? "sky_stops_being_a_wall"
          : "galaxy_takes_a_shape"
        ];
        if (storyId) newStory[storyId.id] = true;

        // Lock archetype when evolving from Creature → Tribal
        let lockedArchetype = s.lockedArchetype;
        // ARCHETYPES-REWORK — track which archetypes have EVER been locked in
        // (persists across prestiges). Drives the "???" reveal state on radar.
        let revealedLineageArchetypes = { ...(s.revealedLineageArchetypes || {}) };
        if (stage.id === "creature" && !lockedArchetype) {
          const dom = dominantArchetype(s.archetypeAffinity);
          if (dom) {
            lockedArchetype = dom;
            revealedLineageArchetypes[dom] = true;
            get().addToLog(`Lineage locked: ${ARCHETYPE_MAP[dom].name}.`);
          } else {
            lockedArchetype = "humanoid"; // default fallback
            revealedLineageArchetypes["humanoid"] = true;
            get().addToLog(`Lineage locked: Humanoid (no drift).`);
          }
        }

        const stageClearCounts = { ...s.stageClearCounts, [stage.id]: (s.stageClearCounts[stage.id] || 0) + 1 };

        // Auto-switch active stage theme if the player was on the previous stage's theme.
        // (Respects player's manual selection if they had a different theme active.)
        const prevStageThemeId = STAGE_INDEX_TO_THEME[s.stageIndex];
        const newStageThemeId = STAGE_INDEX_TO_THEME[nextStageIdx];
        let activeStageTheme = s.activeStageTheme || "stage-cell";
        if (newStageThemeId && activeStageTheme === prevStageThemeId) {
          activeStageTheme = newStageThemeId;
        }
        // Unlock the new stage's theme
        const unlockedThemes = { ...(s.unlockedThemes || { "stage-cell": true }) };
        if (newStageThemeId && !unlockedThemes[newStageThemeId]) {
          unlockedThemes[newStageThemeId] = true;
        }

        // Track fastest Cell clear
        let fastestCellClear = s.fastestCellClear || 0;
        if (stage.id === "cell") {
          const clearTime = s.time;
          if (fastestCellClear === 0 || clearTime < fastestCellClear) {
            fastestCellClear = clearTime;
          }
        }

        // ACHIEVEMENT-EXPANSION — track fastest Galactic clear (for the
        // "Speed Demon" achievement: reach Galactic in under 30 min).
        // Galactic is reached by evolving past Solar; record the run-time
        // at that moment and keep the minimum across all runs.
        let achievementMeta = { ...(s.achievementMeta || {}) };
        if (stage.id === "solar") {
          const galacticClearTime = s.time;
          const prevFastest = (achievementMeta.fastestGalacticClearSec as number) || 0;
          if (prevFastest === 0 || galacticClearTime < prevFastest) {
            achievementMeta.fastestGalacticClearSec = galacticClearTime;
          }
        }

        // GOVERNMENT-SYSTEMS — when entering Empire (stageIndex becomes 4),
        // auto-assign a government based on the player's locked archetype
        // (forced archetype government) OR, when no archetype government
        // applies, from the most-researched Civilization-stage tech branch.
        // The government's tick bonuses are applied in the tick below.
        // AUTOBUYER-SETTINGS — `preferredGovernment` overrides the auto-pick
        // when set AND the id exists in GOVERNMENT_MAP. Null = use auto-pick.
        let activeGovernment = s.activeGovernment ?? null;
        if (nextStageIdx === 4 && !activeGovernment) {
          const preferredGov = s.autoBuyerSettings?.preferredGovernment || null;
          const govId = (preferredGov && GOVERNMENT_MAP[preferredGov])
            ? preferredGov
            : pickGovernmentForEmpire(lockedArchetype, s.technologies);
          if (govId && GOVERNMENT_MAP[govId]) {
            activeGovernment = govId;
            const g = GOVERNMENT_MAP[govId];
            const advMsg = g.advantages.length ? g.advantages.join(", ") : "none";
            const disMsg = g.disadvantages.length ? g.disadvantages.join(", ") : "none";
            // Deferred log so it fires AFTER the "Evolved to Empire" line.
            const govLine = preferredGov === govId
              ? `Government established: ${g.name} (player-preferred). Advantages: ${advMsg}. Disadvantages: ${disMsg}.`
              : `Government established: ${g.name}. Advantages: ${advMsg}. Disadvantages: ${disMsg}.`;
            setTimeout(() => get().addToLog(govLine), 0);
          }
        }

        // Check achievements after stage clear
        const postEvolveState = { ...s, stageClearCounts, lockedArchetype, revealedLineageArchetypes, fastestCellClear, activeGovernment, achievementMeta } as GameState;
        const achResult = checkAchievements(postEvolveState);
        const newAchievements = achResult.newOnes.length > 0
          ? [...(s.newAchievements || []), ...achResult.newOnes]
          : s.newAchievements;

        // FIX-EVENTS-IMMUNITY-POPUPS — stage-evolution story popups fire
        // ONLY during the first playthrough (before the player's first
        // Galactic-stage win). After the first win the player has seen
        // the storyline once; subsequent runs evolve silently. We still
        // preserve any pre-existing activeStoryPopup (e.g. a STORY_TRIGGERS
        // popup fired earlier in the same tick).
        const nextStoryPopup = s.galacticWins === 0
          ? (storyId?.id || s.activeStoryPopup)
          : s.activeStoryPopup;

        set({
          stageIndex: nextStageIdx,
          resources,
          capacities,
          storyUnlocked: newStory,
          activeStoryPopup: nextStoryPopup,
          stageClearCounts,
          fastestCellClear,
          lockedArchetype,
          revealedLineageArchetypes,
          activeGovernment,
          // ACHIEVEMENT-EXPANSION — persist the (possibly updated)
          // fastestGalacticClearSec meta value.
          achievementMeta,
          achievements: achResult.earned,
          newAchievements,
          activeStageTheme,
          unlockedThemes,
        });
        get().addToLog(`Evolved to ${nextStageDef.name}. ${nextStageDef.tagline}`);
      },

      triggerPrestige: () => {
        const s = get();
        const stage = STAGES[s.stageIndex];
        const score = computeScore(s);
        const stageMult = [1, 2, 4, 8, 16, 32, 64][s.stageIndex] || 1;
        let epEarned = Math.max(1, Math.floor(Math.sqrt(score / 100) * stageMult));

        // ---- Cosmic Understanding: +25% EP per level ----
        const cosmicLvl = s.upgrades["cosmic_understanding"] || 0;
        epEarned = Math.max(1, Math.floor(epEarned * (1 + cosmicLvl * 0.25)));

        // ---- Layers 2-6: aggregate EP multiplier (foresight, route, ritual, world, law, relic, core) ----
        // New L2: constellation completion grants additive EP bonus; constellationDivinityMult boosts Divinity gain.
        const constStateForPrestige: ConstellationState = {
          constellationStars: s.constellationStars || {},
          constellationProgress: s.constellationProgress || {},
          constellationsStarted: s.constellationsStarted || {},
          constellationsCompleted: s.constellationsCompleted || {},
        };
        const constBp = constellationBonus(constStateForPrestige);
        const fs = foresightBonus(s.foresightNodes || {});
        const rb = routeBonus(s.activeForesightRoute);
        const ritualEp = activeRitualEpBonus(s.purchasedRituals || {}, s.activeTemporaryRituals || {});
        const wEp = worldEpMultiplier(s.authoredWorlds || []);
        const dl = divineLawBonus(s.enactedDivineLaws || {});
        // Layers 7-9 EP bonus
        const hybridEp = legionBonus(s.creatures || [], s.legions || [], s.activeOmnipotenceStance).epMult;
        const allianceEp = allianceBonus(s.alliances || {}, s.minorGods || MINOR_GODS).epMult;
        const fragmentEp = divineFragmentBonus(s.divineFragments || 0).epMult;
        const layerEpMult = 1 +
          fs.epMult + constBp.epMult + rb.epMult + ritualEp + wEp + dl.epMult +
          hybridEp + allianceEp + fragmentEp;
        epEarned = Math.max(1, Math.floor(epEarned * layerEpMult));

        // ACHIEVEMENT-EXPANSION — apply the "ep" achievement bonus as an
        // additive multiplier on EP earned from prestige (e.g. "Genesis
        // Engine" achievement grants +2.5% EP).
        const achEpBonus = achievementBonus(s.achievements || {}, buildAchievementCtx(s), "ep");
        if (achEpBonus > 0) {
          epEarned = Math.max(1, Math.floor(epEarned * (1 + achEpBonus)));
        }

        // ARCHETYPES-REWORK — locked archetype EP-from-prestige bonus
        // (Necroid +50%, Necroid Ascendant +50%, etc.). Additive multiplier.
        const archEpBonus = s.lockedArchetype
          ? (ARCHETYPE_MAP[s.lockedArchetype]?.bonus.epFromPrestigeMult || 0)
          : 0;
        if (archEpBonus > 0) {
          epEarned = Math.max(1, Math.floor(epEarned * (1 + archEpBonus)));
        }

        // FIX-ARCHETYPE-LOCKED — EP-from-prestige techs (stack additively):
        //   • epigenetic_memory (Cell)        → +10% EP from prestige
        //   • memory_formation  (Creature)    → +10% EP from prestige
        let techEpMult = 0;
        if (s.technologies["epigenetic_memory"]) techEpMult += 0.10;
        if (s.technologies["memory_formation"])  techEpMult += 0.10;
        if (techEpMult > 0) {
          epEarned = Math.max(1, Math.floor(epEarned * (1 + techEpMult)));
        }

        // ---- Layer 2 (Enlightenment): grant Divinity based on score ----
        let divinityGain = 0;
        if (s.unlockedLayers?.enlightenment) {
          divinityGain = Math.max(1, Math.floor(Math.sqrt(score / 200) * stageMult * (1 + fs.divinityMult + constBp.divinityMult)));
        }
        // ---- Layer 4 (Genesis): grant Genesis Seeds based on stage ----
        let genesisSeedGain = 0;
        if (s.unlockedLayers?.genesis) {
          genesisSeedGain = Math.max(1, Math.floor(stageMult / 2));
        }
        // ---- Layer 6 (Singularity): grant Singularity Cores based on stage ----
        let singularityCoreGain = 0;
        if (s.unlockedLayers?.singularity) {
          singularityCoreGain = Math.max(1, Math.floor(stageMult / 4));
        }

        const archive = [...s.archive];
        const archName = s.lockedArchetype ? ARCHETYPE_MAP[s.lockedArchetype]?.name : "Humanoid";
        archive.unshift({
          runId: `run_${s.totalRuns + 1}`,
          timestamp: Date.now(),
          stage: stage.id,
          archetype: s.lockedArchetype || "humanoid",
          score,
          epEarned,
          duration: s.time,
          ending: s.stageIndex >= 6 ? "Galactic Ascension" : `${stage.name} Evolution (${archName})`,
        });

        const archivedArchetypes = Array.from(new Set([
          ...(s.archivedArchetypes || []),
          ...(s.lockedArchetype ? [s.lockedArchetype] : []),
        ]));

        // ---- Determine if this prestige unlocks challenges ----
        const isFirstGalacticWin = s.stageIndex >= 6 && !s.unlockedChallenges;
        const newUnlockedChallenges = s.unlockedChallenges || isFirstGalacticWin;

        // ---- BACKGROUND-SIMULATION — no longer incremented on prestige ----
        // Sims are now COMPUTED from (3 + starsLit) × simMult, not stored as a counter.
        // The metaState preserves peakProductionRate, divinityFromBackground, epFromBackground
        // (all META — persist across prestiges). backgroundSimulations is recomputed each tick.

        // ---- Challenge completion/failure on prestige ----
        // ENDURANCE-FIX: "clearStage: galactic" requires prestiging FROM
        // Galactic. The tick's completion check `stageIndex > 6` is never
        // true because prestige resets stageIndex to 0. So we check HERE
        // (before the reset) whether the active challenge's completion
        // condition is met by this prestige, and if so mark it complete
        // instead of failing it.
        const activeChId = s.activeChallenge;
        let completedChallengesOnPrestige = { ...(s.completedChallenges || {}) };
        let challengeJustCompleted = false;
        const newChallengeRepeatCounts = { ...(s.challengeRepeatCounts || {}) };

        if (activeChId) {
          const ch = CHALLENGE_MAP[activeChId];
          if (ch) {
            // Check if this prestige satisfies the challenge's clearStage
            // condition (e.g., endurance = clearStage: galactic, which
            // means evolving past Galactic = prestiging from Galactic).
            const isClearStageGalactic =
              ch.completeWhen.type === "clearStage" &&
              ch.completeWhen.stage === "galactic" &&
              s.stageIndex >= 6;
            // Also check reachGalactic (prestige from Galactic = reached Galactic)
            const isReachGalactic =
              ch.completeWhen.type === "reachGalactic" &&
              s.stageIndex >= 6;

            if (isClearStageGalactic || isReachGalactic) {
              // Challenge completed by this prestige!
              const completedCount = (completedChallengesOnPrestige[activeChId] || 0) + 1;
              completedChallengesOnPrestige[activeChId] = completedCount;
              delete newChallengeRepeatCounts[activeChId];
              challengeJustCompleted = true;
              // +1 Prestige Point for completing a challenge
              setTimeout(() => get().addToLog(`🏆 Challenge complete: ${ch.name} (repeat ${completedCount}). Mastery bonus made permanent.`), 0);
            } else {
              // Challenge NOT completed by this prestige — fail it.
              delete newChallengeRepeatCounts[activeChId];
            }
          }
        }

        const fresh = initialRunState();

        // ---- Apply new-run upgrades to the fresh state ----
        // Warm Start: +5 per level to atp/glucose/proteins/lipids
        const warmLvl = s.upgrades["warm_start"] || 0;
        if (warmLvl > 0) {
          fresh.resources!.atp = (fresh.resources!.atp || 0) + warmLvl * 5;
          fresh.resources!.glucose = (fresh.resources!.glucose || 0) + warmLvl * 5;
          fresh.resources!.proteins = (fresh.resources!.proteins || 0) + warmLvl * 5;
          fresh.resources!.lipids = (fresh.resources!.lipids || 0) + warmLvl * 5;
        }
        // Ancestral Bounty: +10 of every resource per level
        const ancestralLvl = s.upgrades["ancestral_bounty"] || 0;
        if (ancestralLvl > 0) {
          for (const r of Object.keys(fresh.resources!)) {
            fresh.resources![r] = (fresh.resources![r] || 0) + ancestralLvl * 10;
          }
        }
        // Frontier Spirit: +10 starting pop per level
        const frontierLvl = s.upgrades["frontier_spirit"] || 0;
        let startingPop = 8 + frontierLvl * 10;
        let startingMaxPop = startingPop;
        // Active challenge startPop override (debuff)
        if (s.activeChallenge) {
          const ch = CHALLENGE_MAP[s.activeChallenge];
          if (ch && ch.debuff.effects.startPop !== undefined) {
            startingPop = ch.debuff.effects.startPop;
            startingMaxPop = startingPop;
          }
        }
        fresh.population = startingPop;
        fresh.maxPopulation = startingMaxPop;

        const metaState: Partial<GameState> = {
          // CURRENCY-UNIFICATION — EP is no longer spent in the shop. EP
          // earned at prestige is folded into the player's Divinity
          // balance (the unified shop currency). `evolutionPoints` is
          // kept on GameState for back-compat (old saves still load) but
          // is no longer mutated anywhere except here for accounting.
          evolutionPoints: s.evolutionPoints + epEarned,
          divinity: (s.divinity || 0) + epEarned,
          totalRuns: s.totalRuns + 1,
          galacticWins: s.galacticWins + (s.stageIndex >= 6 ? 1 : 0),
          // BACKGROUND-SIMULATION — META fields persist across prestiges.
          // peakProductionRate never resets (best production ever).
          // divinityFromBackground + epFromBackground are lifetime counters.
          // backgroundSimulations is NOT stored here — it's computed each tick from
          // (3 + starsLit) × simMult.
          peakProductionRate: s.peakProductionRate || 0,
          divinityFromBackground: s.divinityFromBackground || 0,
          epFromBackground: s.epFromBackground || 0,
          archive,
          archivedArchetypes,
          // ARCHETYPES-REWORK — revealed lineage archetypes persist across
          // prestiges (meta state — drives radar ??? reveal).
          revealedLineageArchetypes: s.revealedLineageArchetypes || {},
          upgrades: s.upgrades,
          storyUnlocked: { ...s.storyUnlocked, god_opens_its_eyes: true },
          storyAcknowledged: s.storyAcknowledged,
          unlockedLayers: s.unlockedLayers,
          stageClearCounts: s.stageClearCounts,
          // AUTOBUYER-SETTINGS — preferences persist across prestiges
          // (meta state; same as upgrades). The player picks once and forgets.
          autoBuyerSettings: s.autoBuyerSettings || {
            systemTarget: null,
            techTarget: null,
            preferredGovernment: null,
            preferredForesightRoute: null,
          },
          // EVENT-CHAINS — pending follow-ups are per-run; reset on prestige.
          // A chain that was mid-flight when the player prestiged simply dies.
          pendingFollowUps: [],
          fastestCellClear: s.fastestCellClear,
          totalEventsResolved: s.totalEventsResolved,
          totalPlayTime: s.totalPlayTime,
          totalActions: s.totalActions,
          totalSystemsBuilt: s.totalSystemsBuilt,
          totalTechResearched: s.totalTechResearched,
          achievements: s.achievements,
          newAchievements: s.newAchievements,
          // Layer 1 — Challenges
          unlockedChallenges: newUnlockedChallenges,
          activeChallenge: null, // challenge ends on prestige (failed or completed)
          // ENDURANCE-FIX — use completedChallengesOnPrestige (which includes
          // any challenge completed BY this prestige, e.g. endurance's
          // clearStage: galactic is satisfied by prestiging from Galactic).
          completedChallenges: completedChallengesOnPrestige,
          challengeRepeatCounts: newChallengeRepeatCounts,
          showChallenges: false,
          // Reset auto-action timers (PP-SHOP-TABS — universal auto-buyer timers also reset on prestige).
          autoTimers: {
            system: 0,
            tech: 0,
            evolve: 0,
            challenge: 0,
            light_stars: 0,
            invest_market: 0,
            claim_systems: 0,
            manage_heresy: 0,
            place_anchors: 0,
            negotiate: 0,
            attack_old_gods: 0,
            author_universes: 0,
          },

          // Layer 2 — Enlightenment (persist meta state, currency accrues)
          divinity: (s.divinity || 0) + divinityGain,
          foresightNodes: s.foresightNodes || {}, // LEGACY — always {}
          activeForesightRoute: s.activeForesightRoute,
          showEnlightenment: false,
          // Constellation Map — persist all progress across prestige
          constellationStars: s.constellationStars || {},
          constellationProgress: s.constellationProgress || {},
          constellationsStarted: s.constellationsStarted || {},
          constellationsCompleted: s.constellationsCompleted || {},
          constellationNodes: s.constellationNodes || {}, // LEGACY — always {}
          constellationRevealed: s.constellationRevealed || {},
          // Cosmic Bridge link is per-run (reset on prestige); the recommended
          // glow (Stargaze) persists because Stargaze reveals permanently.
          cosmicBridgeLink: null,
          stargazeRecommendedActive: s.stargazeRecommendedActive || false,

          // Layer 3 — Transcendence (persist purchases + scripts; reset per-run timers)
          transcendenceOfferingsUsed: s.transcendenceOfferingsUsed || {},
          purchasedRituals: s.purchasedRituals || {},
          activeTemporaryRituals: {}, // reset per-run
          activeScripts: s.activeScripts || {},
          bloodPactsUsed: {}, // reset per-run
          scriptTimers: {}, // reset per-run
          showTranscendence: false,

          // Layer 4 — Genesis (persist authored worlds; reset pending config)
          genesisSeeds: (s.genesisSeeds || 0) + genesisSeedGain,
          authoredWorlds: s.authoredWorlds || [],
          pendingWorldConfig: {},
          showGenesis: false,

          // Layer 5 — Apotheosis (persist laws + worship mode + heresy response; reset heresy + miracle timers)
          faith: s.faith || 0,
          enactedDivineLaws: s.enactedDivineLaws || {},
          activeWorshipMode: s.activeWorshipMode,
          performedMiracles: {}, // reset per-run
          miracleTimers: {}, // reset per-run
          heresy: 0, // reset per-run — derived from galaxyHeresy average
          activeHeresyResponse: s.activeHeresyResponse || "hr_ignore",
          showApotheosis: false,
          // L5 redesign — Galactic Conquest per-galaxy state reset.
          // Rival galaxy claim progress persists across prestiges (L5 attack progress
          // is a permanent investment, like L4 galaxy systems). Conquered flags persist.
          // Per-galaxy heresy grids reset to all-faithful; galaxyHeresy resets to 0.
          galaxyHeresy: Object.fromEntries(RIVAL_GALAXIES.map((g) => [g.id, 0])),
          galaxyFollowerGrid: Object.fromEntries(
            RIVAL_GALAXIES.map((g) => [g.id, makeInitialFollowerGrid()])
          ),
          galaxyRivalSystems: s.galaxyRivalSystems || Object.fromEntries(
            RIVAL_GALAXIES.map((g) => [g.id, makeInitialRivalSystems(g.id)])
          ),
          conqueredGalaxies: s.conqueredGalaxies || {},
          selectedGalaxyId: STARTER_GALAXY_ID,
          // L5 heresy timers — fresh per run
          heresySpreadTimer: 10,
          heresySeedTimer: 30,
          heresyThresholdsSeeded: {}, // per-galaxy threshold tracking — fresh per run
          prophets: [], // remove all placed prophets on prestige
          prophetConvertTimer: 10,

          // Layer 6 — Singularity (persist cores + universal map; reset rifts per-run).
          singularityCores: (s.singularityCores || 0) + singularityCoreGain,
          showSingularity: false,
          // L6 Universal Map — persist galaxy ownership + anchor coverage (anchors
          // are a permanent investment); reset per-run rifts + heresy (a fresh run
          // starts with no rifts open and all galaxies purged of corruption).
          universalGalaxies: (s.universalGalaxies || makeInitialUniversalGalaxies()).map((g) => ({
            ...g,
            heresy: 0, // reset per-run — no rifts to sustain corruption
          })),
          rifts: [], // reset per-run
          realityAnchors: s.realityAnchors || [], // persists (permanent investment)
          riftSpawnTimer: 45, // reset per-run
          riftsClosed: s.riftsClosed || 0, // lifetime counter — persists
          anchorsPlaced: s.anchorsPlaced || 0, // lifetime counter — persists

          // Layer 7 — Omnipotence (Bio-engineering) — persist creatures, legions, stance; reset instability
          activeOmnipotenceStance: s.activeOmnipotenceStance || "balanced",
          instability: 0, // reset per-run
          geneticInstability: 0, // reset per-run
          showOmnipotence: false,
          creatures: s.creatures || [],
          legions: s.legions || [],
          creatureDesignDraft: s.creatureDesignDraft || null,
          // Skirmish Arena — reset raids + raidsRepelled per-run; persist creature XP/levels.
          outpostRaids: [],
          raidsRepelled: 0,
          activeOutpostRaid: null,
          creatureXp: s.creatureXp || {},
          creatureLevels: s.creatureLevels || {},
          outpostRaidSpawnTimer: OUTPOST_RAID_SPAWN_INTERVAL_SEC,

          // Layer 8 — Divinity (Divine Alliance) — persist minor gods, relationships, alliances
          showDivinityLayer: false,
          minorGods: s.minorGods || MINOR_GODS.map((g) => ({ ...g })),
          godRelationships: s.godRelationships ||
            Object.fromEntries(MINOR_GODS.map((g) => [g.id, g.startingRelationship])),
          alliances: s.alliances || {},

          // Layer 9 — Infinity (Divine War) — persist divine fragments; reset battles per-run
          showInfinity: false,
          oldGodBattles: Object.fromEntries(OLD_GODS.map((g) => [g.id, makeInitialBattleState(g.id)])),
          divineFragments: s.divineFragments || 0,

          // Layer 10 — Eternity — Genesis Engine: persist relics + discovered
          // archetypes + cosmic boons; reset chosen ending + simulation state.
          chosenEnding: null,
          cosmicBoonStacks: (s.cosmicBoonStacks || 0) +
            (s.chosenEnding === "reset" ? 1 : 0),
          showEternity: false,
          // Dimension system — persists across prestiges
          activeDimension: s.activeDimension || "mundane",
          visitedDimensions: s.visitedDimensions || ["mundane"],
          // NEW: Genesis Engine state — persist relics + discoveries across prestiges
          divineRelics: s.divineRelics || [],
          crucibleRelicIds: [], // crucible is cleared on prestige
          discoveredArchetypes: s.discoveredArchetypes || {},
          universeSimulating: false,
          simulationStartTime: 0,
          lastSimulationResult: s.lastSimulationResult || null,

          // ===== QUICK WINS — prestige reset rules =====
          // prestigePoints is a universal currency — persists across prestiges
          prestigePoints: s.prestigePoints || 0,
          // Active ability cooldowns persist (real-time cooldowns); effect timers reset (per-run)
          activeAbilityCooldowns: s.activeAbilityCooldowns || {},
          activeAbilityEffects: {}, // reset per-run
          // Ritual combo tracking — reset per-run (lastRitualTime is game time)
          lastRitualTime: 0,
          lastRitualId: null,
          ritualComboCount: 0,
          ritualComboTimer: 0,
          // Layer event timers — reset per-run
          layerEventTimers: { trial_of_fortune: 0, vision: 0, divine_whim: 0, heresy_surge: 0 },
        };

        // Check achievements after prestige
        const postState = { ...s, ...metaState } as GameState;
        const achResult = checkAchievements(postState);
        metaState.achievements = achResult.earned;
        if (achResult.newOnes.length > 0) {
          metaState.newAchievements = [...(s.newAchievements || []), ...achResult.newOnes];
        }

        set({
          ...fresh,
          ...metaState,
          // PRESERVE player's current tab + pause/speed state across prestiges.
          // (Old behavior reset to "actions" tab + paused=false + speed=1, which was jarring.)
          currentTab: s.currentTab,
          speed: s.speed,
          paused: s.paused,
          showShop: false,
          showEvolve: false,
          // P6 — close the consolidated layer modal on prestige.
          activeLayerModal: null,
          // P7 — clear any purchase error banner on prestige.
          lastPurchaseError: null,
          showChallenges: false,
          showEnlightenment: false,
          showTranscendence: false,
          showGenesis: false,
          showApotheosis: false,
          showSingularity: false,
          showOmnipotence: false,
          showDivinityLayer: false,
          showInfinity: false,
          showEternity: false,
          activeStoryPopup: s.totalRuns === 0 ? "god_opens_its_eyes" : null,
          hasSeenIntro: true,
          lastSaved: Date.now(),
          tutorialActive: false,
        });
        get().addToLog(`Prestige! Earned ${epEarned} Divinity (CURRENCY-UNIFICATION: was Evolution Points, now folded into Divinity).`);
        if (isFirstGalacticWin) {
          get().addToLog("Layer 1 trials unlocked. Visit the Trials button to begin a Challenge.");
        }
        // NOTE: Background simulations are now computed from (3 + starsLit) × simMult,
        // not incremented on prestige. No log needed here — the sim system runs at L2+.
        // ENDURANCE-FIX — failedChallenge variable was replaced by the new
        // completion/failure logic above. Log trial abandonment only if the
        // challenge was NOT completed by this prestige.
        if (activeChId && !challengeJustCompleted) {
          const abandonedCh = CHALLENGE_MAP[activeChId];
          if (abandonedCh) {
            get().addToLog(`Trial abandoned: ${abandonedCh.name}. You may try again.`);
          }
        }
        if (divinityGain > 0) {
          get().addToLog(`Layer 2: +${divinityGain} Divinity accrued (Enlightenment).`);
        }
        if (genesisSeedGain > 0) {
          get().addToLog(`Layer 4: +${genesisSeedGain} Genesis Seeds (Genesis).`);
        }
        if (singularityCoreGain > 0) {
          get().addToLog(`Layer 6: +${singularityCoreGain} Singularity Cores (Singularity).`);
        }
      },

      setTab: (tab) => set({ currentTab: tab }),
      setSpeed: (speed) => set({ speed }),
      // ACHIEVEMENT-EXPANSION — togglePause now also tracks consecutive
      // pause duration. `achievementMeta.pauseDurationSec` records the
      // longest single pause so the "Pause Master" achievement (60s) can
      // fire even after the player un-pauses.
      togglePause: () => {
        const s = get();
        const nowPaused = !s.paused;
        const meta = { ...(s.achievementMeta || {}) };
        if (nowPaused) {
          // Begin a new pause window.
          meta.pauseStartRealTime = Date.now();
        } else {
          // End the current pause window — update the max consecutive.
          const start = (meta.pauseStartRealTime as number) || 0;
          if (start > 0) {
            const elapsed = Math.floor((Date.now() - start) / 1000);
            const prev = (meta.pauseDurationSec as number) || 0;
            meta.pauseDurationSec = Math.max(prev, elapsed);
            meta.pauseStartRealTime = 0;
          }
        }
        set({ paused: nowPaused, achievementMeta: meta });
      },
      setShowShop: (v) => set({ showShop: v }),
      setShowEvolve: (v) => set({ showEvolve: v }),
      setShowSettings: (v) => set({ showSettings: v }),
      setShowChallenges: (v) => set({ showChallenges: v }),
      // FIX-UI-TABS — Info modal opens Log/Archive/Codex/Awards as a
      // shared Dialog (called from the gear dropdown).
      openInfoModal: (target) => set({ activeInfoModal: target }),
      closeInfoModal: () => set({ activeInfoModal: null }),
      setShowEnlightenment: (v) => set({ showEnlightenment: v }),
      setShowTranscendence: (v) => set({ showTranscendence: v }),
      setShowGenesis: (v) => set({ showGenesis: v }),
      setShowApotheosis: (v) => set({ showApotheosis: v }),
      setShowSingularity: (v) => set({ showSingularity: v }),
      setShowOmnipotence: (v) => set({ showOmnipotence: v }),
      setShowDivinityLayer: (v) => set({ showDivinityLayer: v }),
      setShowInfinity: (v) => set({ showInfinity: v }),
      setShowEternity: (v) => set({ showEternity: v }),

      // ---- P6: Modal Consolidation ----
      // openLayerModal(layerId) sets `activeLayerModal` to the requested layer id
      // AND mirrors it into the corresponding legacy `show*` flag so any code
      // that still reads `show*` directly continues to work.
      //
      // LAYER-AS-TAB — also flips `currentTab` to the layer's tab id
      // (LAYER_TO_TAB). GameShell renders the layer content INLINE in the
      // tab panel now (the <LayerModal/> is no longer rendered). The legacy
      // flags stay for back-compat (Header chip highlight, PrestigeTab
      // onView buttons, useKeyboardShortcuts).
      openLayerModal: (layerId) => {
        const showFlagMap: Record<string, keyof GameState> = {
          challenges: "showChallenges",
          enlightenment: "showEnlightenment",
          transcendence: "showTranscendence",
          genesis: "showGenesis",
          apotheosis: "showApotheosis",
          singularity: "showSingularity",
          omnipotence: "showOmnipotence",
          divinity: "showDivinityLayer",
          infinity: "showInfinity",
          eternity: "showEternity",
        };
        const flagKey = showFlagMap[layerId];
        if (!flagKey) return; // unknown id — ignore
        // Close ALL legacy flags first, then open just the requested one. This
        // guarantees only one layer modal is ever open at a time.
        const patch: Partial<GameState> = {
          showChallenges: false,
          showEnlightenment: false,
          showTranscendence: false,
          showGenesis: false,
          showApotheosis: false,
          showSingularity: false,
          showOmnipotence: false,
          showDivinityLayer: false,
          showInfinity: false,
          showEternity: false,
          activeLayerModal: layerId,
        };
        (patch as Record<string, unknown>)[flagKey] = true;
        // LAYER-AS-TAB — also switch the active tab to the layer's tab id.
        const layerTabId = LAYER_TO_TAB[layerId];
        if (layerTabId) {
          (patch as Record<string, unknown>).currentTab = layerTabId;
        }
        set(patch);
      },
      closeLayerModal: () =>
        set({
          activeLayerModal: null,
          showChallenges: false,
          showEnlightenment: false,
          showTranscendence: false,
          showGenesis: false,
          showApotheosis: false,
          showSingularity: false,
          showOmnipotence: false,
          showDivinityLayer: false,
          showInfinity: false,
          showEternity: false,
        }),

      // ---- P7: Error states ----
      // notifyPurchaseError(message) sets the latest purchase-failure message.
      // UIs (ShopModal / SystemsTab / TechTab) subscribe to `lastPurchaseError`
      // and surface the message inline for ~2 seconds (then fade locally).
      notifyPurchaseError: (message) =>
        set({ lastPurchaseError: { message, ts: Date.now() } }),

      // ---- Layer 1: Challenges ----
      // Activating a challenge records the current repeat level (= completed count).
      // Each repeat makes the debuff 20% stronger AND the eventual mastery bonus 50% bigger.
      setActiveChallenge: (challengeId) => {
        const s = get();
        if (!challengeId) {
          // Clearing an active challenge without completing it.
          if (s.activeChallenge) {
            const newRepeatCounts = { ...(s.challengeRepeatCounts || {}) };
            delete newRepeatCounts[s.activeChallenge];
            // ACHIEVEMENT-EXPANSION — bump the trials-abandoned counter
            // (drives the "Trial and Error" achievement: abandon 5 trials).
            set({
              activeChallenge: null,
              challengeRepeatCounts: newRepeatCounts,
              achievementMeta: bumpAchievementMeta(s, "trialsAbandoned", 1),
            });
          } else {
            set({ activeChallenge: null });
          }
          return;
        }
        const ch = CHALLENGE_MAP[challengeId];
        if (!ch) return;
        if (!s.unlockedChallenges) return;

        const hasMastery = (s.upgrades["challenge_mastery"] || 0) > 0;
        const maxRepeats = getMaxRepeats(hasMastery);
        const completed = s.completedChallenges?.[challengeId] || 0;
        if (completed >= maxRepeats) {
          get().addToLog(`${ch.name} already mastered ${maxRepeats} times. No more repeats available.`);
          return;
        }

        // Block starting if the player is already past the completeWhen condition (prevents cheese).
        const alreadyComplete = checkChallengeComplete(ch, s);
        if (alreadyComplete) {
          get().addToLog(`Cannot start ${ch.name}: your current state already meets its goal. Prestige or progress further first.`);
          return;
        }

        set({
          activeChallenge: challengeId,
          challengeRepeatCounts: {
            ...(s.challengeRepeatCounts || {}),
            [challengeId]: completed, // next repeat = completed count
          },
        });
        get().addToLog(`Trial begun: ${ch.name} (repeat ${completed + 1}/${maxRepeats}).`);
      },

      // ============ LAYER 2 — ENLIGHTENMENT (CONSTELLATION MAP) ============
      setForesightRoute: (routeId) => {
        const s = get();
        if (!s.unlockedLayers?.enlightenment) return;
        if (routeId !== null && !FORESIGHT_ROUTE_MAP[routeId]) return;
        set({ activeForesightRoute: routeId });
        const r = routeId ? FORESIGHT_ROUTE_MAP[routeId] : null;
        get().addToLog(r ? `Foresight route chosen: ${r.name}.` : "Foresight route cleared.");
      },

      // ===== AUTOBUYER-SETTINGS — archetype / government targeting setters =====
      // Each setter validates the id (against ARCHETYPE_MAP /
      // GOVERNMENT_MAP / FORESIGHT_ROUTE_MAP) before storing. Null is
      // always accepted (means "no preference"). Persists across prestiges
      // via the metaState carry-forward in triggerPrestige.
      setAutoBuyerSystemTarget: (archetypeId) => {
        const s = get();
        if (archetypeId !== null && !ARCHETYPE_MAP[archetypeId]) return;
        const cur = s.autoBuyerSettings || {
          systemTarget: null, techTarget: null,
          preferredGovernment: null, preferredForesightRoute: null,
        };
        const archName = archetypeId ? ARCHETYPE_MAP[archetypeId]?.name : null;
        set({ autoBuyerSettings: { ...cur, systemTarget: archetypeId } });
        get().addToLog(archName
          ? `Auto-Builder target set: ${archName} (cheapest matching system wins).`
          : "Auto-Builder target cleared (cheapest-first, no preference)."
        );
      },
      setAutoBuyerTechTarget: (archetypeId) => {
        const s = get();
        if (archetypeId !== null && !ARCHETYPE_MAP[archetypeId]) return;
        const cur = s.autoBuyerSettings || {
          systemTarget: null, techTarget: null,
          preferredGovernment: null, preferredForesightRoute: null,
        };
        const archName = archetypeId ? ARCHETYPE_MAP[archetypeId]?.name : null;
        set({ autoBuyerSettings: { ...cur, techTarget: archetypeId } });
        get().addToLog(archName
          ? `Auto-Researcher target set: ${archName} (cheapest matching tech wins).`
          : "Auto-Researcher target cleared (cheapest-first, no preference)."
        );
      },
      setPreferredGovernment: (govId) => {
        const s = get();
        if (govId !== null && !GOVERNMENT_MAP[govId]) return;
        const cur = s.autoBuyerSettings || {
          systemTarget: null, techTarget: null,
          preferredGovernment: null, preferredForesightRoute: null,
        };
        const govName = govId ? GOVERNMENT_MAP[govId]?.name : null;
        set({ autoBuyerSettings: { ...cur, preferredGovernment: govId } });
        get().addToLog(govName
          ? `Preferred government set: ${govName} (auto-applied at Empire stage).`
          : "Preferred government cleared (auto-pick at Empire stage)."
        );
      },
      setPreferredForesightRoute: (routeId) => {
        const s = get();
        // FORESIGHT_ROUTE_MAP is currently empty (legacy shim) so this
        // setter only accepts null for now. Kept for forward-compat when
        // foresight routes are reintroduced.
        if (routeId !== null && !FORESIGHT_ROUTE_MAP[routeId]) return;
        const cur = s.autoBuyerSettings || {
          systemTarget: null, techTarget: null,
          preferredGovernment: null, preferredForesightRoute: null,
        };
        const routeName = routeId ? FORESIGHT_ROUTE_MAP[routeId]?.name : null;
        set({ autoBuyerSettings: { ...cur, preferredForesightRoute: routeId } });
        get().addToLog(routeName
          ? `Preferred foresight route set: ${routeName} (auto-applied at L2+).`
          : "Preferred foresight route cleared (auto-pick at L2+)."
        );
      },

      // ============ LAYER 3 — TRANSCENDENCE ============
      performOffering: (offeringId) => {
        const s = get();
        if (!s.unlockedLayers?.transcendence) return;
        const o = OFFERING_MAP[offeringId];
        if (!o) return;
        const res = { ...s.resources };
        for (const [r, v] of Object.entries(o.cost)) {
          if ((res[r] || 0) < (v as number)) return;
        }
        for (const [r, v] of Object.entries(o.cost)) {
          res[r] -= v as number;
        }
        const repeats = s.transcendenceOfferingsUsed?.[offeringId] || 0;
        const gain = offeringDivinityAtRepeat(o, repeats);
        set({
          resources: res,
          divinity: (s.divinity || 0) + gain,
          transcendenceOfferingsUsed: {
            ...(s.transcendenceOfferingsUsed || {}),
            [offeringId]: repeats + 1,
          },
        });
        get().addToLog(`Offering: ${o.name} (+${gain} Divinity).`);
      },

      performRitual: (ritualId) => {
        const s = get();
        if (!s.unlockedLayers?.transcendence) return;
        const r = RITUAL_MAP[ritualId];
        if (!r) return;
        if (r.kind === "permanent") {
          if (s.purchasedRituals?.[ritualId]) return;
        } else {
          if ((s.activeTemporaryRituals?.[ritualId] || 0) > 0) return;
        }
        if ((s.divinity || 0) < r.cost) return;

        // QUICK WIN 3 — Ritual combo tracking: 3 different rituals within 60s grants +50% production for 30s
        const now = s.time;
        const sinceLast = now - (s.lastRitualTime || 0);
        let comboCount = s.ritualComboCount || 0;
        let comboTimer = s.ritualComboTimer || 0;
        // Reset combo if more than 60s since last ritual, or if same ritual as last
        if (sinceLast > 60 || s.lastRitualId === ritualId) {
          comboCount = 0;
        }
        comboCount += 1;
        // When combo hits 3 (3 different rituals within 60s), grant Divine Combo bonus
        if (comboCount >= 3) {
          comboTimer = 30; // +50% all production for 30s
          comboCount = 0;
          setTimeout(() => get().addToLog("🌟 Divine Combo! +50% all production for 30s."), 0);
        } else {
          setTimeout(() => get().addToLog(`Ritual combo: ${comboCount}/3 — perform ${3 - comboCount} more different ritual(s) within ${Math.max(0, 60 - sinceLast).toFixed(0)}s for a Divine Combo.`), 0);
        }

        if (r.kind === "permanent") {
          set({
            divinity: (s.divinity || 0) - r.cost,
            purchasedRituals: { ...(s.purchasedRituals || {}), [ritualId]: true },
            // QUICK WIN 3 — combo tracking
            lastRitualTime: now,
            lastRitualId: ritualId,
            ritualComboCount: comboCount,
            ritualComboTimer: comboTimer,
            // QUICK WIN 5 — +1 Prestige Point for performing a ritual
            prestigePoints: (s.prestigePoints || 0) + 1,
          });
          get().addToLog(`Ritual (permanent): ${r.name} enacted (-${r.cost} Divinity). (+1 PP)`);
        } else {
          // LAYER UPGRADE — ritual_extension: +20% duration per level (max 5)
          const reLvl = (s.upgrades?.ritual_extension as number) || 0;
          const durationMult = 1 + 0.20 * reLvl;
          const extendedDuration = Math.ceil((r.durationSec || 0) * durationMult);
          set({
            divinity: (s.divinity || 0) - r.cost,
            activeTemporaryRituals: {
              ...(s.activeTemporaryRituals || {}),
              [ritualId]: extendedDuration,
            },
            // QUICK WIN 3 — combo tracking
            lastRitualTime: now,
            lastRitualId: ritualId,
            ritualComboCount: comboCount,
            ritualComboTimer: comboTimer,
            // QUICK WIN 5 — +1 Prestige Point for performing a ritual
            prestigePoints: (s.prestigePoints || 0) + 1,
          });
          get().addToLog(`Ritual (temporary): ${r.name} begun for ${extendedDuration}s (-${r.cost} Divinity). (+1 PP)`);
        }
      },

      toggleScript: (scriptId) => {
        const s = get();
        if (!s.unlockedLayers?.transcendence) return;
        const script = SCRIPTS.find((x) => x.id === scriptId);
        if (!script) return;
        const activeScripts = { ...(s.activeScripts || {}) };
        activeScripts[scriptId] = !activeScripts[scriptId];
        set({ activeScripts });
        get().addToLog(`${script.name} ${activeScripts[scriptId] ? "enabled" : "disabled"}.`);
      },

      performBloodPact: (tierId) => {
        const s = get();
        if (!s.unlockedLayers?.transcendence) return;
        const pact = BLOOD_PACT_MAP[tierId];
        if (!pact) return;
        if (s.bloodPactsUsed?.[tierId]) {
          get().addToLog(`${pact.name} already performed this run.`);
          return;
        }
        if (s.population < pact.popCost) {
          get().addToLog(`Not enough population for ${pact.name} (need ${pact.popCost}).`);
          return;
        }
        set({
          population: s.population - pact.popCost,
          maxPopulation: Math.max(s.maxPopulation || 0, s.population - pact.popCost),
          divinity: (s.divinity || 0) + pact.divinityGain,
          bloodPactsUsed: { ...(s.bloodPactsUsed || {}), [tierId]: true },
          // QUICK WIN 5 — +2 Prestige Points for performing a blood pact (high cost → higher reward)
          prestigePoints: (s.prestigePoints || 0) + 2,
        });
        get().addToLog(`Blood Pact: ${pact.name} (-${pact.popCost} pop, +${pact.divinityGain} Divinity). (+2 PP)`);
      },

      // ============ LAYER 4 — GENESIS ============
      setPendingWorldConfig: (cfg) => {
        const s = get();
        if (!s.unlockedLayers?.genesis) return;
        set({ pendingWorldConfig: { ...(s.pendingWorldConfig || {}), ...cfg } });
      },

      authorWorld: () => {
        const s = get();
        if (!s.unlockedLayers?.genesis) return;
        const p = s.pendingWorldConfig || {};
        if (!p.cradleWorldId || !p.primeConditionId || !p.sacredGeographyId || !p.dormantSeedId || !p.difficultyTierId) {
          get().addToLog("Select all 5 world components before authoring.");
          return;
        }
        const seedCost = 1;
        if ((s.genesisSeeds || 0) < seedCost) {
          get().addToLog(`Need ${seedCost} Genesis Seed to author a world.`);
          return;
        }
        const world: WorldConfig = {
          id: `world_${Date.now()}`,
          cradleWorldId: p.cradleWorldId!,
          primeConditionId: p.primeConditionId!,
          sacredGeographyId: p.sacredGeographyId!,
          dormantSeedId: p.dormantSeedId!,
          difficultyTierId: p.difficultyTierId!,
          createdAt: Date.now(),
        };
        set({
          genesisSeeds: (s.genesisSeeds || 0) - seedCost,
          authoredWorlds: [...(s.authoredWorlds || []), world],
          pendingWorldConfig: {},
        });
        get().addToLog(`World authored (${world.cradleWorldId}/${world.difficultyTierId}). Permanent bonuses applied.`);
      },

      // ============ LAYER 5 — APOTHEOSIS ============
      enactDivineLaw: (lawId) => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        const law = DIVINE_LAW_MAP[lawId];
        if (!law) return;
        if (s.enactedDivineLaws?.[lawId]) return;
        if ((s.faith || 0) < law.faithCost) return;
        set({
          faith: (s.faith || 0) - law.faithCost,
          enactedDivineLaws: { ...(s.enactedDivineLaws || {}), [lawId]: true },
          // QUICK WIN 5 — +1 Prestige Point for enacting a divine law
          prestigePoints: (s.prestigePoints || 0) + 1,
        });
        get().addToLog(`Divine Law enacted: ${law.name} (-${law.faithCost} Faith). (+1 PP)`);
      },

      setWorshipMode: (modeId) => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        if (modeId !== null && !WORSHIP_MODE_MAP[modeId]) return;
        set({ activeWorshipMode: modeId });
        const m = modeId ? WORSHIP_MODE_MAP[modeId] : null;
        get().addToLog(m ? `Worship mode: ${m.name}.` : "Worship mode cleared.");
      },

      performMiracle: (miracleId) => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        const m = MIRACLE_MAP[miracleId];
        if (!m) return;
        if ((s.faith || 0) < m.faithCost) return;
        // L5 FIX — per-miracle cooldown (default 120s, mir_blessing = 60s).
        // Stored as `miracleCd_<id>` on state, decayed each tick.
        const cdKey = `miracleCd_${miracleId}`;
        const cdRemaining = (s as any)[cdKey] || 0;
        if (cdRemaining > 0) {
          get().addToLog(`${m.name} is on cooldown (${Math.ceil(cdRemaining)}s remaining).`);
          return;
        }
        if (m.effect === "doubleProduction" && (s.miracleTimers?.[miracleId] || 0) > 0) {
          get().addToLog(`${m.name} already active.`);
          return;
        }
        const res = { ...s.resources };
        let pop = s.population;
        let faith = (s.faith || 0) - m.faithCost;
        let heresy = s.heresy || 0;
        // L5 redesign — for reduceHeresy miracles, mutate per-galaxy grids.
        let miracleGalaxyFollowerGrid: Record<string, Array<{ state: string; type: string }>> | null = null;
        let miracleGalaxyHeresy: Record<string, number> | null = null;
        const miracleTimers = { ...(s.miracleTimers || {}) };
        const performedMiracles = { ...(s.performedMiracles || {}), [miracleId]: (s.performedMiracles?.[miracleId] || 0) + 1 };
        switch (m.effect) {
          case "instantFaith":
            faith += m.magnitude;
            break;
          case "instantPop":
            pop += m.magnitude;
            break;
          case "instantResources":
            for (const r of Object.keys(res)) {
              const cap = s.capacities[r] || 0;
              if (cap > 0) res[r] = Math.min(cap, (res[r] || 0) + cap * m.magnitude);
            }
            break;
          case "reduceHeresy": {
            // Convert up to N heretics to faithful across owned galaxies
            // (N = ceil(magnitude/100 × 32)). Recomputes galaxyHeresy + global heresy.
            const owned = ownedGalaxyIds(s.galaxyRivalSystems || {});
            const gf = { ...(s.galaxyFollowerGrid || {}) };
            const gh = { ...(s.galaxyHeresy || {}) };
            const hereticsToConvert = Math.max(1, Math.ceil((m.magnitude / 100) * 32));
            let converted = 0;
            for (const gid of owned) {
              const grid = (gf[gid] || makeInitialFollowerGrid()).map((c) => ({ ...c }));
              for (let i = 0; i < grid.length && converted < hereticsToConvert; i++) {
                if (grid[i].state === "heretical") {
                  grid[i].state = "faithful";
                  converted++;
                }
              }
              gf[gid] = grid;
              const hc = grid.filter((c) => c.state === "heretical").length;
              gh[gid] = (hc / 32) * 100;
              if (converted >= hereticsToConvert) break;
            }
            heresy = owned.length > 0
              ? owned.reduce((sum, gid) => sum + (gh[gid] || 0), 0) / owned.length
              : 0;
            miracleGalaxyFollowerGrid = gf;
            miracleGalaxyHeresy = gh;
            break;
          }
          case "doubleProduction":
            miracleTimers[miracleId] = m.magnitude;
            break;
        }
        const cdSec = m.cooldownSec ?? 120;
        set({
          resources: res,
          population: pop,
          maxPopulation: Math.max(s.maxPopulation || 0, pop),
          faith,
          heresy,
          miracleTimers,
          performedMiracles,
          ...(miracleGalaxyFollowerGrid ? { galaxyFollowerGrid: miracleGalaxyFollowerGrid } : {}),
          ...(miracleGalaxyHeresy ? { galaxyHeresy: miracleGalaxyHeresy } : {}),
          [cdKey]: cdSec,
        });
        get().addToLog(`${m.name} performed!${cdSec > 0 ? ` (${cdSec}s cooldown)` : ""}`);
        get().addToLog(`Miracle: ${m.name}.`);
      },

      setHeresyResponse: (responseId) => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        if (!HERESY_RESPONSE_MAP[responseId]) return;
        set({ activeHeresyResponse: responseId });
        const r = HERESY_RESPONSE_MAP[responseId];
        get().addToLog(`Heresy response: ${r.name}.`);
      },

      // ============ LAYER 6 — SINGULARITY ============
      // ===== LAYER 6 — UNIVERSAL MAP ACTIONS (Rift Defense + Reality Anchors) =====
      // Singularity Cores are the L6 currency — spent to close rifts
      // (severity-scaled) and to place reality anchors (count-scaled).
      closeRift: (riftId) => {
        const s = get();
        if (!s.unlockedLayers?.singularity) return;
        const rifts = (s.rifts || []).map((r) => ({ ...r }));
        const rift = rifts.find((r) => r.id === riftId);
        if (!rift) return;
        const cost = riftCloseCost(rift.severity);
        const cores = s.singularityCores || 0;
        if (cores < cost) {
          get().addToLog(`Not enough Singularity Cores to close rift (need ${cost}, have ${cores}).`);
          return;
        }
        const remaining = rifts.filter((r) => r.id !== riftId);
        const riftsClosed = (s.riftsClosed || 0) + 1;
        // Clear the host galaxy's heresy back to 0 (the rift was its source).
        const universalGalaxies = (s.universalGalaxies || makeInitialUniversalGalaxies()).map((g) =>
          g.id === rift.galaxyId ? { ...g, heresy: 0 } : g
        );
        const galaxyName = UNIVERSAL_GALAXY_MAP[rift.galaxyId]?.name || rift.galaxyId;
        set({
          singularityCores: cores - cost,
          rifts: remaining,
          riftsClosed,
          universalGalaxies,
        });
        get().addToLog(
          `🛡️ Rift in ${galaxyName} sealed (severity ${rift.severity}, -${cost} Singularity Core${cost === 1 ? "" : "s"}). ${riftsClosed}/${RIFTS_REQUIRED_FOR_L7} rifts closed.`
        );
        // L6 → L7 unlock check.
        const anchorsPlaced = s.anchorsPlaced || 0;
        if (
          !s.unlockedLayers?.omnipotence &&
          isUniversalMapComplete(riftsClosed, anchorsPlaced)
        ) {
          set({ unlockedLayers: { ...s.unlockedLayers, omnipotence: true } });
          get().addToLog(
            `Universal Map stabilized — ${riftsClosed}/${RIFTS_REQUIRED_FOR_L7} rifts closed, ${anchorsPlaced}/${ANCHORS_REQUIRED_FOR_L7} anchors placed. Omnipotence layer unlocked.`
          );
        }
      },

      placeRealityAnchor: (galaxyId) => {
        const s = get();
        if (!s.unlockedLayers?.singularity) return;
        const galaxy = UNIVERSAL_GALAXY_MAP[galaxyId];
        if (!galaxy) return;
        const universalGalaxies = (s.universalGalaxies || makeInitialUniversalGalaxies()).map((g) => ({ ...g }));
        const st = universalGalaxies.find((g) => g.id === galaxyId);
        if (!st) return;
        if (st.anchored) {
          get().addToLog(`${galaxy.name} already has a Reality Anchor.`);
          return;
        }
        const anchorsPlaced = s.anchorsPlaced || 0;
        const cost = anchorPlaceCost(anchorsPlaced);
        const cores = s.singularityCores || 0;
        if (cores < cost) {
          get().addToLog(`Not enough Singularity Cores to place anchor (need ${cost}, have ${cores}).`);
          return;
        }
        st.anchored = true;
        // Anchored galaxies also shed their current heresy.
        st.heresy = 0;
        const realityAnchors = [
          ...(s.realityAnchors || []),
          { id: `anchor_${Date.now()}_${Math.floor(Math.random() * 100000)}`, galaxyId, placedAt: s.time || 0 },
        ];
        const newAnchorsPlaced = anchorsPlaced + 1;
        set({
          singularityCores: cores - cost,
          universalGalaxies,
          realityAnchors,
          anchorsPlaced: newAnchorsPlaced,
        });
        const coveredNames = galaxiesInAnchorRadius(galaxyId)
          .map((g) => g.name)
          .join(", ");
        get().addToLog(
          `⚓ Reality Anchor placed on ${galaxy.name} (-${cost} Singularity Core${cost === 1 ? "" : "s"}). Covers: ${coveredNames}. ${newAnchorsPlaced}/${ANCHORS_REQUIRED_FOR_L7} anchors placed.`
        );
        // L6 → L7 unlock check.
        const riftsClosed = s.riftsClosed || 0;
        if (
          !s.unlockedLayers?.omnipotence &&
          isUniversalMapComplete(riftsClosed, newAnchorsPlaced)
        ) {
          set({ unlockedLayers: { ...s.unlockedLayers, omnipotence: true } });
          get().addToLog(
            `Universal Map stabilized — ${riftsClosed}/${RIFTS_REQUIRED_FOR_L7} rifts closed, ${newAnchorsPlaced}/${ANCHORS_REQUIRED_FOR_L7} anchors placed. Omnipotence layer unlocked.`
          );
        }
      },

      attackUniversalGalaxy: (galaxyId) => {
        const s = get();
        if (!s.unlockedLayers?.singularity) return;
        const galaxy = UNIVERSAL_GALAXY_MAP[galaxyId];
        if (!galaxy) return;
        // Only NEW neutral L6 galaxies are attackable here (L5 rival galaxies use attackGalaxy).
        if (!galaxy.isNewL6) {
          get().addToLog(`${galaxy.name} cannot be attacked from the Universal Map (use the Apotheosis view).`);
          return;
        }
        const universalGalaxies = (s.universalGalaxies || makeInitialUniversalGalaxies()).map((g) => ({ ...g }));
        const st = universalGalaxies.find((g) => g.id === galaxyId);
        if (!st) return;
        if (st.systemsClaimed >= galaxy.systemCount) {
          get().addToLog(`${galaxy.name} is fully claimed (${galaxy.systemCount}/${galaxy.systemCount} systems).`);
          return;
        }
        const totalNewClaimed = totalNewSystemsClaimed(universalGalaxies);
        const cost = newGalaxyAttackCost(totalNewClaimed);
        const faith = s.faith || 0;
        if (faith < cost) {
          get().addToLog(`Not enough Faith to attack ${galaxy.name} (need ${cost}, have ${Math.floor(faith)}).`);
          return;
        }
        st.systemsClaimed += 1;
        if (st.ownerId === "neutral") st.ownerId = "player";
        set({
          faith: faith - cost,
          universalGalaxies,
        });
        get().addToLog(
          `⚔️ ${galaxy.name}: system ${st.systemsClaimed}/${galaxy.systemCount} claimed (-${cost} Faith, +198 worlds).`
        );
      },

      // ============ REBUILD L1-6 — LAYER-1-3 ACTIONS ============
      // Layer 1 — Trial Realm mini-games were removed in CLEANUP-LEGACY. The
      // canonical L1 system is now `challenges.ts` (10 run-modifier challenges
      // managed via setActiveChallenge / etc).


      // ---- Layer 2 — Constellation Map (new design) ----
      /**
       * Illuminate a single star within a constellation. Computes cost via
       * `starCost()`, deducts Divinity, sets `constellationStars[starId] = true`,
       * increments `constellationProgress[constellationId]`, marks the constellation
       * as started, and — if all stars lit — marks it completed. Awards +1 PP
       * per star (boosted by the `constellation_boost` shop upgrade).
       */
      illuminateStar: (constellationId, starId) => {
        const s = get();
        if (!s.unlockedLayers?.enlightenment) return;
        const cdef = CONSTELLATION_MAP[constellationId];
        if (!cdef) return;
        const star = cdef.stars.find((st) => st.id === starId);
        if (!star) return;
        if (s.constellationStars?.[starId]) return; // already lit
        const cs: ConstellationState = {
          constellationStars: s.constellationStars || {},
          constellationProgress: s.constellationProgress || {},
          constellationsStarted: s.constellationsStarted || {},
          constellationsCompleted: s.constellationsCompleted || {},
        };
        // LAYER UPGRADE — foresight_discount: multiplicative -20% per level (max 5)
        const fdLvl = (s.upgrades?.foresight_discount as number) || 0;
        const foresightDiscountMult = Math.pow(0.80, fdLvl);
        const cost = starCost(constellationId, cs, starId, { foresightDiscountMult });
        // DEBUG-FREE-BUY — bypass cost check when free-buy is enabled
        if (!s.debugFreeBuy && (s.divinity || 0) < cost) return;
        // LAYER UPGRADE — constellation_boost: +25% PP per node illuminated per level (max 4)
        const cbLvl = (s.upgrades?.constellation_boost as number) || 0;
        const ppGain = 1 + 0.25 * cbLvl;
        const newStars = { ...(s.constellationStars || {}), [starId]: true };
        const newStarted = { ...(s.constellationsStarted || {}), [constellationId]: true };
        const newProgress = {
          ...(s.constellationProgress || {}),
          [constellationId]: (s.constellationProgress?.[constellationId] || 0) + 1,
        };
        const newCompleted = { ...(s.constellationsCompleted || {}) };
        let completedThisPurchase = false;
        if (newProgress[constellationId] >= cdef.stars.length && !newCompleted[constellationId]) {
          newCompleted[constellationId] = true;
          completedThisPurchase = true;
        }
        // NOTE: Cosmic Bridge propagation REMOVED — active abilities were cut from L2.
        // Stars are lit only by purchasing them with Divinity.
        // DEBUG-FREE-BUY — don't deduct Divinity when free-buy is on
        set({
          divinity: s.debugFreeBuy ? (s.divinity || 0) : (s.divinity || 0) - cost,
          constellationStars: newStars,
          constellationProgress: newProgress,
          constellationsStarted: newStarted,
          constellationsCompleted: newCompleted,
          prestigePoints: (s.prestigePoints || 0) + ppGain,
        });
        const logMsg = completedThisPurchase
          ? `✦ ${cdef.name} illuminated: ${starId} (-${cost} Divinity). ${cdef.name} constellation COMPLETE! (+${ppGain.toFixed(1)} PP)`
          : `✦ ${cdef.name}: star ${starId} lit (-${cost} Divinity). (+${ppGain.toFixed(1)} PP)`;
        get().addToLog(logMsg);
      },

      // ---- Layer 3 — Divine Market ----
      marketBuyResource: (resourceId, qty) => {
        const s = get();
        if (!s.unlockedLayers?.transcendence) return;
        const price = s.marketPrices?.[resourceId] || 10;
        const totalCost = price * qty;
        if ((s.divinity || 0) < totalCost) return;
        const owned = { ...(s.marketOwnedResources || {}) };
        owned[resourceId] = (owned[resourceId] || 0) + qty;
        set({
          divinity: (s.divinity || 0) - totalCost,
          marketOwnedResources: owned,
        });
        get().addToLog(`🛒 Bought ${qty} ${resourceId} @ ${price.toFixed(1)} Div each (-${totalCost.toFixed(1)} Divinity).`);
      },

      marketSellResource: (resourceId, qty) => {
        const s = get();
        if (!s.unlockedLayers?.transcendence) return;
        const owned = { ...(s.marketOwnedResources || {}) };
        const have = owned[resourceId] || 0;
        if (have < qty) return;
        const price = s.marketPrices?.[resourceId] || 10;
        // LAYER UPGRADE — market_savvy: +30% sell profit per level (max 5)
        const msLvl = (s.upgrades?.market_savvy as number) || 0;
        const profitMult = 1 + 0.30 * msLvl;
        const gain = price * qty * profitMult;
        owned[resourceId] = have - qty;
        if (owned[resourceId] <= 0) delete owned[resourceId];
        set({
          divinity: (s.divinity || 0) + gain,
          marketOwnedResources: owned,
        });
        get().addToLog(`🛒 Sold ${qty} ${resourceId} @ ${price.toFixed(1)} Div each (+${gain.toFixed(1)} Divinity).`);
      },

      marketOffering: (resourceId, qty) => {
        // Convert owned market resources → Divinity scaled by current price
        const s = get();
        if (!s.unlockedLayers?.transcendence) return;
        const owned = { ...(s.marketOwnedResources || {}) };
        const have = owned[resourceId] || 0;
        if (have < qty) return;
        const price = s.marketPrices?.[resourceId] || 10;
        // LAYER UPGRADE — market_savvy: +30% offering profit per level (max 5)
        const msLvl = (s.upgrades?.market_savvy as number) || 0;
        const profitMult = 1 + 0.30 * msLvl;
        // High price → more Divinity per unit
        const gain = Math.floor(qty * price * 1.5 * profitMult);
        owned[resourceId] = have - qty;
        if (owned[resourceId] <= 0) delete owned[resourceId];
        set({
          divinity: (s.divinity || 0) + gain,
          marketOwnedResources: owned,
        });
        get().addToLog(`💎 Offering: ${qty} ${resourceId} → +${gain} Divinity (price ${price.toFixed(1)}).`);
      },

      // ---- Layer 3 — DIVINE INVESTMENT MARKET (new design) ----
      /**
       * Allocate `count` worlds from the available pool (backgroundSimulations −
       * already allocated) into the named portfolio. For Stability Bonds the
       * allocated worlds are locked for `portfolio.lockDuration` seconds —
       * `deallocateWorlds` will refuse to remove them while the lock is active.
       * Crashes happen passively inside the tick (see portfolio tick block).
       */
      allocateWorlds: (portfolioId, count) => {
        const s = get();
        if (!s.unlockedLayers?.transcendence) return;
        const portfolio = PORTFOLIO_MAP[portfolioId];
        if (!portfolio) return;
        if (count <= 0) return;
        // Pool of worlds available = current backgroundSimulations − already allocated.
        // (s.backgroundSimulations is the value computed by the LAST tick — the
        // tick recomputes it every frame and persists it on the state.)
        const bg = s.backgroundSimulations || 0;
        const allocatedNow = totalAllocatedWorlds(s.portfolioAllocations || {});
        const available = Math.max(0, bg - allocatedNow);
        if (available <= 0) return;
        const toAllocate = Math.min(count, available);
        if (toAllocate <= 0) return;
        const allocations = { ...(s.portfolioAllocations || {}) };
        const lockTimers = { ...(s.portfolioLockTimers || {}) };
        allocations[portfolioId] = (allocations[portfolioId] || 0) + toAllocate;
        // Stability Bonds lock the LATEST allocation (the whole portfolio's lock
        // is refreshed so any deallocate-attempt during the lock window fails).
        // We don't lock the lock for re-allocations to existing locked portfolios —
        // that would let players extend locks accidentally. The lock only refreshes
        // when the player adds MORE worlds to a portfolio that is currently unlocked.
        if (portfolio.lockDuration && portfolio.lockDuration > 0) {
          // Only (re)start the lock if the timer is already at 0 — this prevents
          // a player from accidentally extending their lock by topping-up.
          if ((lockTimers[portfolioId] || 0) <= 0) {
            lockTimers[portfolioId] = portfolio.lockDuration;
          }
        }
        set({
          portfolioAllocations: allocations,
          portfolioLockTimers: lockTimers,
        });
        get().addToLog(
          `📈 Allocated ${toAllocate} world${toAllocate === 1 ? "" : "s"} to ${portfolio.name}.` +
          (portfolio.lockDuration ? ` Locked for ${portfolio.lockDuration}s.` : "")
        );
      },

      /**
       * Move `count` worlds back from a portfolio into the available pool.
       * Refused while Stability Bonds lock is active (timer > 0).
       */
      deallocateWorlds: (portfolioId, count) => {
        const s = get();
        if (!s.unlockedLayers?.transcendence) return;
        const portfolio = PORTFOLIO_MAP[portfolioId];
        if (!portfolio) return;
        if (count <= 0) return;
        const allocations = { ...(s.portfolioAllocations || {}) };
        const have = Math.max(0, Math.floor(allocations[portfolioId] || 0));
        if (have <= 0) return;
        // Stability Bonds lock check.
        if ((s.portfolioLockTimers?.[portfolioId] || 0) > 0) {
          get().addToLog(
            `🔒 ${portfolio.name} worlds are locked for ${Math.ceil(s.portfolioLockTimers![portfolioId]!)}s — cannot deallocate.`
          );
          return;
        }
        const toRemove = Math.min(count, have);
        allocations[portfolioId] = have - toRemove;
        set({ portfolioAllocations: allocations });
        get().addToLog(
          `📉 Deallocated ${toRemove} world${toRemove === 1 ? "" : "s"} from ${portfolio.name}.`
        );
      },

      /**
       * Speed-up shortcut to L2: spend Divinity on the cheapest affordable
       * constellation star. Returns the purchased star (or null if none
       * affordable). Bridges the L3 dividend economy back into L2.
       */
      buyStarFromMarket: () => {
        const s = get();
        if (!s.unlockedLayers?.transcendence) return null;
        const cs: ConstellationState = {
          constellationStars: s.constellationStars || {},
          constellationProgress: s.constellationProgress || {},
          constellationsStarted: s.constellationsStarted || {},
          constellationsCompleted: s.constellationsCompleted || {},
        };
        const fdLvl = (s.upgrades?.foresight_discount as number) || 0;
        const foresightDiscountMult = Math.pow(0.80, fdLvl);
        let best: { cId: string; sId: string; cost: number } | null = null;
        for (const c of CONSTELLATIONS) {
          for (const st of c.stars) {
            if (cs.constellationStars[st.id]) continue;
            const cost = starCost(c.id, cs, st.id, { foresightDiscountMult });
            if (cost <= (s.divinity || 0) && (!best || cost < best.cost)) {
              best = { cId: c.id, sId: st.id, cost };
            }
          }
        }
        if (!best) return null;
        // Illuminate the star via the existing action (handles the cost deduction,
        // constellation progress, PP gain, log message).
        get().illuminateStar(best.cId, best.sId);
        return { constellationId: best.cId, starId: best.sId, cost: best.cost };
      },

      // ---- Layer 4 — Galaxy Claim (L4 redesign) ----
      // scanGalaxySystem: reveal an unexplored system. Costs GALAXY_SCAN_COST
      // Genesis Seeds (5). Idempotent if already explored/claimed or unreachable.
      scanGalaxySystem: (systemId) => {
        const s = get();
        if (!s.unlockedLayers?.genesis) return;
        const sys = GALAXY_SYSTEM_MAP[systemId];
        if (!sys) return;
        const galaxySystems = (s.galaxySystems || []).map((g) => ({ ...g }));
        const state = galaxySystems.find((g) => g.id === systemId);
        if (!state) return;
        if (state.explored || state.claimed) return;
        if ((s.genesisSeeds || 0) < GALAXY_SCAN_COST) {
          get().addToLog(`📡 Need ${GALAXY_SCAN_COST} Genesis Seeds to scan ${sys.name}.`);
          return;
        }
        state.explored = true;
        set({
          genesisSeeds: (s.genesisSeeds || 0) - GALAXY_SCAN_COST,
          galaxySystems,
        });
        const rareLabel = sys.rareResource || "none";
        get().addToLog(
          `📡 Scanned ${sys.name}. Bonus: ${sys.bonus.type} +${Math.round(sys.bonus.value * 100)}%. Rare: ${rareLabel}.`
        );
      },

      // claimGalaxySystem: claim an explored-but-unclaimed system. Cost scales
      // 1.15× per existing claim via `galaxyClaimCost(claimedCount)`. Each claim
      // grants +10 worlds (counted in backgroundSimulations) and the system's
      // production / capacity / EP / pop bonus (with adjacency synergy applied
      // in the tick via `summarizeGalaxyBonuses`).
      claimGalaxySystem: (systemId) => {
        const s = get();
        if (!s.unlockedLayers?.genesis) return;
        const sys = GALAXY_SYSTEM_MAP[systemId];
        if (!sys) return;
        const galaxySystems = (s.galaxySystems || []).map((g) => ({ ...g }));
        const state = galaxySystems.find((g) => g.id === systemId);
        if (!state) return;
        if (!state.explored) {
          get().addToLog(`📡 Scan ${sys.name} before claiming.`);
          return;
        }
        if (state.claimed) return;
        const claimedCount = galaxySystems.filter((g) => g.claimed).length;
        const cost = galaxyClaimCost(claimedCount);
        if ((s.genesisSeeds || 0) < cost) {
          get().addToLog(`⭐ Need ${cost} Genesis Seeds to claim ${sys.name}.`);
          return;
        }
        state.claimed = true;
        set({
          genesisSeeds: (s.genesisSeeds || 0) - cost,
          galaxySystems,
          // ACHIEVEMENT-EXPANSION — track total systems claimed across all
          // runs (drives "Galactic Surveyor" achievement).
          achievementMeta: bumpAchievementMeta(s, "galaxySystemsClaimedTotal", 1),
        });
        get().addToLog(
          `⭐ Claimed ${sys.name}! +10 worlds. Bonus: ${sys.bonus.type} +${Math.round(sys.bonus.value * 100)}%.`
        );
      },

      // ---- Layer 5 — Heresy Web (per-galaxy) ----
      // For backward compat, if galaxyId is falsy/empty, the starter galaxy is used.
      convertFollower: (galaxyId, cellIndex) => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        const gid = galaxyId || STARTER_GALAXY_ID;
        if (cellIndex < 0 || cellIndex >= 32) return;
        const galaxyFollowerGrid = { ...(s.galaxyFollowerGrid || {}) };
        const grid = (galaxyFollowerGrid[gid] || makeInitialFollowerGrid()).map((c) => ({ ...c }));
        if (grid[cellIndex].state === "faithful") return; // already faithful
        const cost = 5;
        if ((s.divinity || 0) < cost) return;
        grid[cellIndex].state = "faithful";
        galaxyFollowerGrid[gid] = grid;
        // Recompute this galaxy's heresy.
        const galaxyHeresy = { ...(s.galaxyHeresy || {}) };
        const hc = grid.filter((c) => c.state === "heretical").length;
        galaxyHeresy[gid] = (hc / 32) * 100;
        // Recompute global heresy as average of owned galaxies' heresy.
        const owned = ownedGalaxyIds(s.galaxyRivalSystems || {});
        const newHeresy = owned.length > 0 ? owned.reduce((sum, g) => sum + (galaxyHeresy[g] || 0), 0) / owned.length : 0;
        set({ divinity: (s.divinity || 0) - cost, galaxyFollowerGrid, galaxyHeresy, heresy: newHeresy });
      },

      purgeFollower: (galaxyId, cellIndex) => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        const gid = galaxyId || STARTER_GALAXY_ID;
        if (cellIndex < 0 || cellIndex >= 32) return;
        const galaxyFollowerGrid = { ...(s.galaxyFollowerGrid || {}) };
        const grid = (galaxyFollowerGrid[gid] || makeInitialFollowerGrid()).map((c) => ({ ...c }));
        if (grid[cellIndex].state === "empty") return;
        grid[cellIndex].state = "empty";
        // Faith drop minor
        const faithDrop = 2;
        galaxyFollowerGrid[gid] = grid;
        const galaxyHeresy = { ...(s.galaxyHeresy || {}) };
        const hc = grid.filter((c) => c.state === "heretical").length;
        galaxyHeresy[gid] = (hc / 32) * 100;
        const owned = ownedGalaxyIds(s.galaxyRivalSystems || {});
        const newHeresy = owned.length > 0 ? owned.reduce((sum, g) => sum + (galaxyHeresy[g] || 0), 0) / owned.length : 0;
        set({ galaxyFollowerGrid, galaxyHeresy, heresy: newHeresy, faith: Math.max(0, (s.faith || 0) - faithDrop) });
      },

      initFollowerGrid: (galaxyId) => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        const gid = galaxyId || STARTER_GALAXY_ID;
        const galaxyFollowerGrid = { ...(s.galaxyFollowerGrid || {}) };
        galaxyFollowerGrid[gid] = makeInitialFollowerGrid();
        const galaxyHeresy = { ...(s.galaxyHeresy || {}) };
        galaxyHeresy[gid] = 0;
        const owned = ownedGalaxyIds(s.galaxyRivalSystems || {});
        const newHeresy = owned.length > 0 ? owned.reduce((sum, g) => sum + (galaxyHeresy[g] || 0), 0) / owned.length : 0;
        set({ galaxyFollowerGrid, galaxyHeresy, heresy: newHeresy });
        const gname = RIVAL_GALAXY_MAP[gid]?.name || gid;
        get().addToLog(`${gname} flock restored to 32 faithful followers.`);
      },

      // ===== LAYER 5 — Galactic Conquest: attack rival galaxy (claims next system) =====
      // Spends Faith (scaled by claimed count + galaxy defense strength), claims
      // the next unclaimed rival system in the galaxy, and (when the galaxy is
      // fully claimed) marks it conquered. Each claimed rival system grants
      // +18 worlds to the Divine Engine (via countClaimedRivalSystems).
      // Conquering 3+ rival galaxies unlocks L6 (Singularity).
      attackGalaxy: (galaxyId) => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        const galaxy = RIVAL_GALAXY_MAP[galaxyId];
        if (!galaxy) return;
        if (galaxy.ownerId === "player") return; // starter — no attacking
        const grs = { ...(s.galaxyRivalSystems || {}) };
        let list = grs[galaxyId];
        if (!list || list.length === 0) {
          list = makeInitialRivalSystems(galaxyId);
        } else {
          list = list.map((sys) => ({ ...sys }));
        }
        const claimedCount = list.filter((sys) => sys.claimed).length;
        if (claimedCount >= galaxy.systemCount) {
          get().addToLog(`${galaxy.name} is already fully conquered (${galaxy.systemCount}/${galaxy.systemCount}).`);
          return;
        }
        const cost = galaxyAttackCost(claimedCount, galaxy.defenseStrength);
        const faith = s.faith || 0;
        if (faith < cost) {
          get().addToLog(`Not enough Faith to attack ${galaxy.name} (need ${cost}, have ${Math.floor(faith)}).`);
          return;
        }
        const nextSys = list.find((sys) => !sys.claimed);
        if (!nextSys) return;
        nextSys.claimed = true;
        nextSys.explored = true;
        grs[galaxyId] = list;
        const conqueredGalaxies = { ...(s.conqueredGalaxies || {}) };
        const nowConquered = list.every((sys) => sys.claimed);
        let justConquered = false;
        if (nowConquered && !conqueredGalaxies[galaxyId]) {
          conqueredGalaxies[galaxyId] = true;
          justConquered = true;
        }
        // L5 → L6 unlock: 3+ rival galaxies conquered.
        const unlockedLayers = { ...(s.unlockedLayers || {}) };
        let l6Unlock = false;
        if (justConquered && !unlockedLayers.singularity) {
          const conqueredCount = countConqueredGalaxies(grs);
          if (conqueredCount >= GALAXIES_REQUIRED_FOR_L6) {
            unlockedLayers.singularity = true;
            l6Unlock = true;
          }
        }
        set({
          faith: faith - cost,
          galaxyRivalSystems: grs,
          ...(justConquered ? { conqueredGalaxies } : {}),
          ...(l6Unlock ? { unlockedLayers } : {}),
        });
        get().addToLog(
          `⚔️ ${galaxy.name}: system ${claimedCount + 1}/${galaxy.systemCount} claimed (-${cost} Faith, +18 worlds).${nowConquered ? " Galaxy conquered!" : ""}`
        );
        if (justConquered) {
          setTimeout(() => get().addToLog(`🏆 ${galaxy.name} conquered! All ${galaxy.systemCount} systems claimed.`), 0);
        }
        if (l6Unlock) {
          setTimeout(() => get().addToLog(`3 rival galaxies conquered. Singularity layer unlocked.`), 0);
        }
      },

      setSelectedGalaxyId: (galaxyId) => {
        if (!RIVAL_GALAXY_MAP[galaxyId]) return;
        set({ selectedGalaxyId: galaxyId });
      },

      // ===== FEATURE ENHANCEMENTS — NEW ACTIONS =====
      // FEATURE 5 — Prophets (per-galaxy: place on a galaxy's heresy grid; max 2 globally)
      placeProphet: (galaxyId, cellIndex) => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        const gid = galaxyId || STARTER_GALAXY_ID;
        if (cellIndex < 0 || cellIndex >= 32) return;
        const cost = 50;
        if ((s.divinity || 0) < cost) return;
        const prophets = (s.prophets || []).slice();
        if (prophets.length >= 2) {
          get().addToLog("Max 2 Prophets at a time.");
          return;
        }
        if (prophets.some((p) => p.galaxyId === gid && p.cellIndex === cellIndex)) {
          get().addToLog("A Prophet is already placed there.");
          return;
        }
        const galaxyFollowerGrid = { ...(s.galaxyFollowerGrid || {}) };
        const grid = (galaxyFollowerGrid[gid] || makeInitialFollowerGrid()).slice();
        const cell = grid[cellIndex];
        if (!cell || cell.state === "empty") {
          // Convert empty cell to faithful so the prophet has a place to stand
          grid[cellIndex] = { state: "faithful", type: "prophet" };
        } else if (cell.state === "heretical") {
          grid[cellIndex] = { state: "faithful", type: "prophet" };
        } else {
          grid[cellIndex] = { ...cell, type: "prophet" };
        }
        galaxyFollowerGrid[gid] = grid;
        prophets.push({ galaxyId: gid, cellIndex, lastConvertedAt: 0 });
        set({
          divinity: (s.divinity || 0) - cost,
          prophets,
          galaxyFollowerGrid,
        });
        get().addToLog(`🌟 Prophet placed on cell ${cellIndex + 1} in ${RIVAL_GALAXY_MAP[gid]?.name || gid} (-50 Divinity). Converts adjacent heretics every 10s.`);
      },

      removeProphet: (galaxyId, cellIndex) => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        const gid = galaxyId || STARTER_GALAXY_ID;
        const prophets = (s.prophets || []).filter((p) => !(p.galaxyId === gid && p.cellIndex === cellIndex));
        const galaxyFollowerGrid = { ...(s.galaxyFollowerGrid || {}) };
        const grid = (galaxyFollowerGrid[gid] || makeInitialFollowerGrid()).slice();
        if (grid[cellIndex]?.type === "prophet") {
          grid[cellIndex] = { state: "faithful", type: "follower" };
        }
        galaxyFollowerGrid[gid] = grid;
        set({ prophets, galaxyFollowerGrid });
        get().addToLog(`Prophet removed from cell ${cellIndex + 1} in ${RIVAL_GALAXY_MAP[gid]?.name || gid}.`);
      },

      // FEATURE 8 — Amplifiers (max 3; place between your god and an NPC god to double Negotiate gains)
      placeAmplifier: (godId) => {
        const s = get();
        if (!s.unlockedLayers?.divinity) return;
        const cost = 30;
        if ((s.divinity || 0) < cost) return;
        if (!MINOR_GOD_MAP[godId]) return;
        const amplifiers = (s.amplifiers || []).slice();
        if (amplifiers.length >= 3) {
          get().addToLog("Max 3 Amplifiers at a time.");
          return;
        }
        if (amplifiers.some((a) => a.godId === godId)) {
          get().addToLog(`Amplifier already placed on ${MINOR_GOD_MAP[godId].name}.`);
          return;
        }
        const nextId = (amplifiers.reduce((m, a) => Math.max(m, a.id), 0) || 0) + 1;
        amplifiers.push({ id: nextId, godId });
        set({ divinity: (s.divinity || 0) - cost, amplifiers });
        get().addToLog(`📡 Amplifier placed on ${MINOR_GOD_MAP[godId].name} (-30 Divinity). Negotiate gains doubled.`);
      },

      removeAmplifier: (godId) => {
        const s = get();
        if (!s.unlockedLayers?.divinity) return;
        const amplifiers = (s.amplifiers || []).filter((a) => a.godId !== godId);
        set({ amplifiers });
        get().addToLog(`Amplifier removed from ${MINOR_GOD_MAP[godId]?.name || godId}.`);
      },

      // FEATURE 9 — Stabilize Time (costs 1 Divine Fragment; ends an active temporal storm)
      stabilizeTime: (oldGodId) => {
        const s = get();
        if (!s.unlockedLayers?.infinity) return;
        if ((s.divineFragments || 0) < 1) {
          get().addToLog("Not enough Divine Fragments to Stabilize Time (need 1).");
          return;
        }
        const temporalStorms = { ...(s.temporalStorms || {}) };
        if (!temporalStorms[oldGodId]) {
          get().addToLog("No temporal storm is active for that battle.");
          return;
        }
        temporalStorms[oldGodId] = false;
        set({ divineFragments: (s.divineFragments || 0) - 1, temporalStorms });
        get().addToLog(`⏳ Time Stabilized — temporal storm ended (-1 Divine Fragment).`);
      },

      // ============ LAYER 7 — OMNIPOTENCE (Bio-engineering) ============
      setOmnipotenceStance: (stanceId) => {
        const s = get();
        if (!s.unlockedLayers?.omnipotence) return;
        const stance = OMNIPOTENCE_STANCE_MAP[stanceId as OmnipotenceStanceId];
        if (!stance) return;
        set({ activeOmnipotenceStance: stanceId });
        get().addToLog(`Stance: ${stance.name}.`);
      },

      setCreatureDesignDraft: (draft) => {
        set({ creatureDesignDraft: draft });
      },

      createCreature: () => {
        const s = get();
        if (!s.unlockedLayers?.omnipotence) return;
        const draft = s.creatureDesignDraft;
        if (!draft) return;
        if (!draft.bodyType || !draft.diet || !draft.special) return;
        // L7 FIX Bug 1 — Cost: 5 Divinity + 5 Faith per creature (prevents infinite-spam exploit)
        const divinityCost = 5;
        const faithCost = 5;
        if ((s.divinity || 0) < divinityCost || (s.faith || 0) < faithCost) {
          get().addToLog(`Creature lab requires ${divinityCost} Divinity + ${faithCost} Faith to author a creature.`);
          return;
        }
        // L7 FIX Bug 1 — Cap: base 5 + 1 per L10 archetype discovered (so L10
        // Genesis Engine progress expands the creature lab capacity).
        const discoveredArchetypesCount = Object.values(s.discoveredArchetypes || {}).filter(Boolean).length;
        const filledSlots = discoveredArchetypesCount;
        const maxCreatures = 5 + filledSlots;
        const currentCount = (s.creatures || []).length;
        if (currentCount >= maxCreatures) {
          get().addToLog(`Creature lab at capacity (${currentCount}/${maxCreatures}). Discover more L10 archetypes or release a creature.`);
          return;
        }
        const bodyType = draft.bodyType as CreatureBodyTypeId;
        const diet = draft.diet as CreatureDietId;
        const special = draft.special as CreatureSpecialId;
        const stats = computeCreatureStats(bodyType, diet, special);
        const id = `creature_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const body = CREATURE_BODY_TYPE_MAP[bodyType];
        const name = (draft.name && draft.name.trim()) || `New ${body.name}`;
        // FEATURE 7 — Mutations: 10% chance to mutate on creation
        // LAYER UPGRADE — mutation_master: +10% per level (max 5, baseline 10% → up to 60%)
        const mmLvl = (s.upgrades?.mutation_master as number) || 0;
        const mutationChance = 0.10 + 0.10 * mmLvl;
        const mutated = Math.random() < mutationChance;
        // L7 FIX Bug 2 — Pick the mutated stat (attack/defense/speed); apply ×1.5 only to it.
        const mutatedStat: "attack" | "defense" | "speed" = (["attack", "defense", "speed"] as const)[Math.floor(Math.random() * 3)];
        let finalStats = { ...stats };
        if (mutated) {
          finalStats = {
            attack: mutatedStat === "attack" ? Math.round(stats.attack * 1.5) : stats.attack,
            defense: mutatedStat === "defense" ? Math.round(stats.defense * 1.5) : stats.defense,
            speed: mutatedStat === "speed" ? Math.round(stats.speed * 1.5) : stats.speed,
          };
        }
        const creature: Creature = {
          id,
          name,
          bodyType,
          diet,
          special,
          ...finalStats,
          createdAt: s.time || 0,
          mutated,
          mutatedStat: mutated ? mutatedStat : undefined,
        };
        // ACHIEVEMENT-EXPANSION — track mutation events (drives the
        // "First Mutation" + "Mutation Master" achievements).
        const metaAfterCreature = mutated
          ? bumpAchievementMeta(s, "mutationsTriggered", 1)
          : (s.achievementMeta || {});
        set({
          creatures: [...(s.creatures || []), creature],
          divinity: (s.divinity || 0) - divinityCost,
          faith: (s.faith || 0) - faithCost,
          achievementMeta: metaAfterCreature,
        });
        if (mutated) {
          get().addToLog(`🧬 Mutation! ${creature.name} (${body.name}) — ATK ${creature.attack} / DEF ${creature.defense} / SPD ${creature.speed}. (+50% to ${mutatedStat}, +20% instability). -${divinityCost} Div, -${faithCost} Faith.`);
        } else {
          get().addToLog(`Creature created: ${creature.name} (${body.name}) — ATK ${creature.attack} / DEF ${creature.defense} / SPD ${creature.speed}. (-${divinityCost} Div, -${faithCost} Faith.)`);
        }
      },

      addCreatureToLegion: (creatureId, legionId) => {
        const s = get();
        if (!s.unlockedLayers?.omnipotence) return;
        const legions = (s.legions || []).map((l) => ({ ...l, creatureIds: [...l.creatureIds] }));
        const legion = legions.find((l) => l.id === legionId);
        if (!legion) return;
        if (legion.creatureIds.length >= LEGION_MAX_CREATURES) {
          get().addToLog(`Legion ${legion.name} is full (max ${LEGION_MAX_CREATURES} creatures).`);
          return;
        }
        // Remove from any other legion first
        for (const l of legions) {
          l.creatureIds = l.creatureIds.filter((id) => id !== creatureId);
        }
        const target = legions.find((l) => l.id === legionId)!;
        target.creatureIds.push(creatureId);
        set({ legions });
      },

      removeCreatureFromLegion: (creatureId, legionId) => {
        const s = get();
        if (!s.unlockedLayers?.omnipotence) return;
        const legions = (s.legions || []).map((l) => ({ ...l, creatureIds: [...l.creatureIds] }));
        const legion = legions.find((l) => l.id === legionId);
        if (!legion) return;
        legion.creatureIds = legion.creatureIds.filter((id) => id !== creatureId);
        set({ legions });
      },

      createLegion: (name) => {
        const s = get();
        if (!s.unlockedLayers?.omnipotence) return;
        const id = `legion_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const legion: Legion = {
          id,
          name: name || `Legion ${(s.legions || []).length + 1}`,
          creatureIds: [],
          deployed: false,
        };
        set({ legions: [...(s.legions || []), legion] });
        get().addToLog(`Legion formed: ${legion.name}.`);
      },

      deleteLegion: (legionId) => {
        const s = get();
        if (!s.unlockedLayers?.omnipotence) return;
        set({ legions: (s.legions || []).filter((l) => l.id !== legionId) });
      },

      // ===== Skirmish Arena (L7 Outpost Raids) =====
      spawnOutpostRaid: (outpostDefId) => {
        const s = get();
        if (!s.unlockedLayers?.omnipotence) return;
        const defId = outpostDefId
          ? OUTPOST_RAID_MAP[outpostDefId]?.id
          : OUTPOST_RAIDS[Math.floor(Math.random() * OUTPOST_RAIDS.length)].id;
        if (!defId) return;
        const def = OUTPOST_RAID_MAP[defId];
        const activeRaids = (s.outpostRaids || []).filter((r) => r.status === "active");
        if (activeRaids.length >= MAX_ACTIVE_OUTPOST_RAIDS) {
          get().addToLog(`Skirmish Arena is full (${MAX_ACTIVE_OUTPOST_RAIDS}/${MAX_ACTIVE_OUTPOST_RAIDS} active raids). Repel one first.`);
          return;
        }
        const id = `raid_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const raid: OutpostRaid = {
          id,
          outpostDef: def.id,
          status: "active",
          bossHp: def.hp,
          bossMaxHp: def.hp,
          playerHp: 200,
          playerMaxHp: 200,
          turn: 0,
          log: [`${def.icon} ${def.name} raids your galaxies! HP ${def.hp}, ATK ${def.attack}, DEF ${def.defense}.`],
          deployedLegionIds: [],
        };
        set({
          outpostRaids: [...(s.outpostRaids || []), raid],
          activeOutpostRaid: s.activeOutpostRaid || id,
        });
        get().addToLog(`⚔️ ${def.name} (${def.icon}) engages your galaxies — deploy legions to repel it.`);
      },

      deployLegionToRaid: (raidId, legionId) => {
        const s = get();
        if (!s.unlockedLayers?.omnipotence) return;
        const raids = (s.outpostRaids || []).map((r) => ({ ...r, deployedLegionIds: [...r.deployedLegionIds] }));
        const raid = raids.find((r) => r.id === raidId);
        if (!raid || raid.status !== "active") return;
        const legion = (s.legions || []).find((l) => l.id === legionId);
        if (!legion) return;
        if (raid.deployedLegionIds.includes(legionId)) {
          raid.deployedLegionIds = raid.deployedLegionIds.filter((id) => id !== legionId);
          set({ outpostRaids: raids });
          get().addToLog(`Legion ${legion.name} recalled from ${OUTPOST_RAID_MAP[raid.outpostDef].name}.`);
          return;
        }
        raid.deployedLegionIds = [...raid.deployedLegionIds, legionId];
        set({ outpostRaids: raids });
        get().addToLog(`Legion ${legion.name} deployed against ${OUTPOST_RAID_MAP[raid.outpostDef].name}.`);
      },

      setActiveOutpostRaid: (raidId) => {
        const s = get();
        if (!s.unlockedLayers?.omnipotence) return;
        set({ activeOutpostRaid: raidId });
      },

      attackOutpost: (raidId) => {
        const s = get();
        if (!s.unlockedLayers?.omnipotence) return;
        const raids = (s.outpostRaids || []).map((r) => ({ ...r, log: [...r.log], deployedLegionIds: [...r.deployedLegionIds] }));
        const idx = raids.findIndex((r) => r.id === raidId);
        if (idx < 0) return;
        const raid = raids[idx];
        if (raid.status !== "active") return;
        const def = OUTPOST_RAID_MAP[raid.outpostDef];
        if (!def) return;
        // Collect all deployed creature IDs.
        const deployedCreatureIds = new Set<string>();
        for (const lid of raid.deployedLegionIds) {
          const legion = (s.legions || []).find((l) => l.id === lid);
          if (!legion) continue;
          for (const cid of legion.creatureIds) deployedCreatureIds.add(cid);
        }
        // Apply creature level multipliers to attack/defense.
        let totalAttack = 0;
        let totalDefense = 0;
        let deployedCount = 0;
        for (const c of (s.creatures || [])) {
          if (!deployedCreatureIds.has(c.id)) continue;
          const lvl = creatureLevel(c.id, s.creatureLevels);
          const bonus = creatureLevelBonus(lvl);
          totalAttack += c.attack * bonus.attackMult;
          totalDefense += c.defense * bonus.defenseMult;
          deployedCount += 1;
        }
        // Count deployed specials (mirrors L9 Old God combat semantics at smaller scale).
        let berserkCount = 0;
        let shieldCount = 0;
        let regenCount = 0;
        for (const c of (s.creatures || [])) {
          if (!deployedCreatureIds.has(c.id)) continue;
          if (c.special === "berserk") berserkCount += 1;
          else if (c.special === "shield") shieldCount += 1;
          else if (c.special === "regen") regenCount += 1;
        }
        if (deployedCount === 0) {
          get().addToLog(`No legions deployed against ${def.name}. Deploy at least one legion before attacking.`);
          return;
        }
        const berserkBonusMult = 1 + 0.20 * berserkCount; // +20% player dmg per berserk creature
        const shieldReductionMult = Math.max(0, 1 - 0.20 * shieldCount); // -20% boss dmg per shield creature
        // Outpost defense shaves player damage (same formula as L9 boss attack).
        const outpostDefenseAbsorb = def.defense * 0.3;
        const playerDmg = Math.max(1, Math.round(totalAttack * berserkBonusMult - outpostDefenseAbsorb));
        // Compute boss attack back
        const bossDmg = Math.max(1, Math.round((def.attack - totalDefense * 0.3) * shieldReductionMult));
        // Apply damage
        const bossHp = Math.max(0, raid.bossHp - playerDmg);
        let playerHp = Math.max(0, raid.playerHp - bossDmg);
        // regen special: heal player HP by 1 per regen creature per turn
        if (regenCount > 0) {
          playerHp = Math.min(raid.playerMaxHp, playerHp + regenCount);
        }
        const log = raid.log;
        log.push(`Turn ${raid.turn + 1}: You deal ${playerDmg} damage. ${def.name} retaliates for ${bossDmg}. (Your HP: ${playerHp}/${raid.playerMaxHp})`);
        if (log.length > 8) log.shift();
        let status: import("../data/omnipotence").OutpostRaidStatus = raid.status;
        if (bossHp <= 0) {
          status = "won";
          log.push(`${def.name} has been repelled! +${def.reward.fragments} Divine Fragment, +${CREATURE_XP_PER_RAID} XP per deployed creature.`);
        } else if (playerHp <= 0) {
          status = "lost";
          log.push(`Your forces have been routed! ${def.name} overruns your systems.`);
        }
        raids[idx] = {
          ...raid,
          bossHp,
          playerHp,
          status,
          turn: raid.turn + 1,
          log,
        };
        set({ outpostRaids: raids });
        if (status === "won") {
          // Grant Divine Fragment + XP per deployed creature + raidsRepelled counter
          const fragments = (s.divineFragments || 0) + def.reward.fragments;
          const newRaidsRepelled = (s.raidsRepelled || 0) + 1;
          const newXp = { ...(s.creatureXp || {}) };
          const newLevels = { ...(s.creatureLevels || {}) };
          let leveledUp = 0;
          for (const cid of deployedCreatureIds) {
            const curXp = newXp[cid] || 0;
            const nextXp = curXp + CREATURE_XP_PER_RAID;
            newXp[cid] = nextXp;
            // Level up for every CREATURE_XP_PER_LEVEL XP accumulated.
            const curLvl = newLevels[cid] || 1;
            const newLvl = curLvl + Math.floor(nextXp / CREATURE_XP_PER_LEVEL) - Math.floor(curXp / CREATURE_XP_PER_LEVEL);
            if (newLvl > curLvl) {
              newLevels[cid] = newLvl;
              leveledUp += newLvl - curLvl;
            } else {
              // Ensure level entry exists even if no level-up.
              if (!(cid in newLevels)) newLevels[cid] = curLvl;
            }
          }
          set({
            divineFragments: fragments,
            raidsRepelled: newRaidsRepelled,
            creatureXp: newXp,
            creatureLevels: newLevels,
          });
          get().addToLog(`⚔️ Repelled ${def.name}! +${def.reward.fragments} Divine Fragment (total: ${fragments}), +${CREATURE_XP_PER_RAID} XP × ${deployedCount} creature(s)${leveledUp > 0 ? `, ${leveledUp} level-up(s) (+10% ATK/DEF/SPD each)` : ""}. Raids repelled: ${newRaidsRepelled}/${OUTPOST_RAID_COUNT_FOR_L8}.`);
        } else if (status === "lost") {
          // Reset the raid for retry (same outpost, fresh HP pool).
          raids[idx] = {
            ...raids[idx],
            status: "active",
            bossHp: raid.bossMaxHp,
            playerHp: raid.playerMaxHp,
            turn: 0,
            log: ["Raid reset after defeat. Re-engage when ready."],
          };
          set({ outpostRaids: raids });
          get().addToLog(`Defeated by ${def.name}. Raid reset — re-engage when ready.`);
        } else {
          get().addToLog(`Strike ${def.name} for ${playerDmg} (HP ${bossHp}/${raid.bossMaxHp}). Boss hits back for ${bossDmg} (Your HP: ${playerHp}/${raid.playerMaxHp}).`);
        }
      },

      // ============ LAYER 8 — DIVINITY (Divine Alliance) ============
      negotiateWithGod: (godId) => {
        const s = get();
        if (!s.unlockedLayers?.divinity) return;
        const god = MINOR_GOD_MAP[godId];
        if (!god) return;
        // L8 FIX — Negotiate now costs 10 Divinity + has a 30s cooldown per god.
        const NEGOTIATE_COST = 10;
        const NEGOTIATE_COOLDOWN = 30;
        const cdKey = `negotiate_${godId}`;
        const cdRemaining = (s as any)[cdKey] || 0;
        if (cdRemaining > 0) {
          get().addToLog(`${god.name} is still cooling down (${Math.ceil(cdRemaining)}s).`);
          return;
        }
        if ((s.divinity || 0) < NEGOTIATE_COST) {
          get().addToLog(`Negotiate with ${god.name} requires ${NEGOTIATE_COST} Divinity (you have ${Math.floor(s.divinity || 0)}).`);
          return;
        }
        const relationships = { ...(s.godRelationships || {}) };
        const cur = relationships[godId] || god.startingRelationship;
        if (cur >= RELATIONSHIP_MAX) {
          get().addToLog(`${god.name}'s relationship is already maxed.`);
          return;
        }
        // FEATURE 8 — Amplifiers double the relationship gain from Negotiate
        const hasAmplifier = (s.amplifiers || []).some((a) => a.godId === godId);
        // LAYER UPGRADE — amplifier_overcharge: +50% amplifier bonus per level (max 3 → ×3.5 amplifier)
        const aoLvl = (s.upgrades?.amplifier_overcharge as number) || 0;
        const ampMult = hasAmplifier ? (2 + 0.50 * aoLvl) : 1;
        // LAYER UPGRADE — diplomatic_gift: relationship gain ×(1 + level) per level (max 3 → ×4)
        const dgLvl = (s.upgrades?.diplomatic_gift as number) || 0;
        const diploMult = 1 + dgLvl;
        const gain = Math.round(RELATIONSHIP_NEGOTIATE_GAIN * ampMult * diploMult);
        relationships[godId] = Math.min(RELATIONSHIP_MAX, cur + gain);
        set({
          godRelationships: relationships,
          divinity: (s.divinity || 0) - NEGOTIATE_COST,
          [cdKey]: NEGOTIATE_COOLDOWN,
        });
        get().addToLog(`Negotiated with ${god.name}: +${gain} relationship (now ${relationships[godId]}/100)${hasAmplifier ? ` (Amplifier ×${ampMult.toFixed(1)})` : ""}. (-${NEGOTIATE_COST} Divinity, ${NEGOTIATE_COOLDOWN}s cooldown)`);
      },

      tradeWithGod: (godId) => {
        const s = get();
        if (!s.unlockedLayers?.divinity) return;
        const god = MINOR_GOD_MAP[godId];
        if (!god) return;
        // Pay demand → receive reward
        const demandResource = god.demand.resource as "divinity" | "faith";
        const demandAmount = god.demand.amount;
        const have = (s as any)[demandResource] || 0;
        if (have < demandAmount) {
          get().addToLog(`Not enough ${demandResource} to trade with ${god.name} (need ${demandAmount}).`);
          return;
        }
        const rewardResource = god.reward.resource as "divinity" | "faith";
        const rewardAmount = god.reward.amount;
        const relationships = { ...(s.godRelationships || {}) };
        const cur = relationships[godId] || god.startingRelationship;
        // LAYER UPGRADE — diplomatic_gift: relationship gain ×(1 + level) per level (max 3 → ×4)
        const dgLvl = (s.upgrades?.diplomatic_gift as number) || 0;
        const diploMult = 1 + dgLvl;
        const tradeGain = Math.round(RELATIONSHIP_TRADE_GAIN * diploMult);
        relationships[godId] = Math.min(RELATIONSHIP_MAX, cur + tradeGain);
        const update: any = { godRelationships: relationships };
        update[demandResource] = have - demandAmount;
        update[rewardResource] = ((s as any)[rewardResource] || 0) + rewardAmount;
        set(update);
        get().addToLog(`Traded with ${god.name}: -${demandAmount} ${demandResource}, +${rewardAmount} ${rewardResource}, +${tradeGain} relationship.`);
      },

      formAlliance: (godId) => {
        const s = get();
        if (!s.unlockedLayers?.divinity) return;
        const god = MINOR_GOD_MAP[godId];
        if (!god) return;
        const alliances = { ...(s.alliances || {}) };
        if (alliances[godId]) {
          get().addToLog(`Already allied with ${god.name}.`);
          return;
        }
        const relationships = s.godRelationships || {};
        if (!canFormAlliance(relationships, alliances, godId)) {
          get().addToLog(`${god.name} requires relationship ≥ ${RELATIONSHIP_ALLIANCE_THRESHOLD} to form an alliance (current: ${relationships[godId] || 0}).`);
          return;
        }
        alliances[godId] = true;
        set({ alliances });
        get().addToLog(`Alliance formed with ${god.name} (${god.title}). Passive bonuses granted.`);
      },

      // ============ LAYER 9 — INFINITY (Divine War) ============
      startOldGodBattle: (oldGodId) => {
        const s = get();
        if (!s.unlockedLayers?.infinity) return;
        const god = OLD_GOD_MAP[oldGodId];
        if (!god) return;
        const battles = { ...(s.oldGodBattles || {}) };
        const cur = battles[oldGodId];
        if (cur && cur.status === "won") {
          get().addToLog(`${god.name} has already been defeated.`);
          return;
        }
        if (cur && cur.status === "in_progress") {
          get().addToLog(`Battle with ${god.name} is already in progress.`);
          return;
        }
        battles[oldGodId] = makeInitialBattleState(oldGodId);
        battles[oldGodId].status = "in_progress";
        set({ oldGodBattles: battles });
        get().addToLog(`Battle begun with ${god.name} (${god.title}). HP ${god.hp}, weakness: ${god.weakness}.`);
      },

      deployLegionToBattle: (oldGodId, legionId) => {
        const s = get();
        if (!s.unlockedLayers?.infinity) return;
        const battles = { ...(s.oldGodBattles || {}) };
        const battle = battles[oldGodId];
        if (!battle || battle.status !== "in_progress") return;
        const legion = (s.legions || []).find((l) => l.id === legionId);
        if (!legion) return;
        if (battle.deployedLegionIds.includes(legionId)) {
          battle.deployedLegionIds = battle.deployedLegionIds.filter((id) => id !== legionId);
          set({ oldGodBattles: battles });
          get().addToLog(`Legion ${legion.name} recalled from ${OLD_GOD_MAP[oldGodId].name}.`);
          return;
        }
        battle.deployedLegionIds = [...battle.deployedLegionIds, legionId];
        set({ oldGodBattles: battles });
        get().addToLog(`Legion ${legion.name} deployed against ${OLD_GOD_MAP[oldGodId].name}.`);
      },

      callAllyToBattle: (oldGodId, godId) => {
        const s = get();
        if (!s.unlockedLayers?.infinity) return;
        if (!s.alliances?.[godId]) {
          get().addToLog(`${MINOR_GOD_MAP[godId]?.name || "That god"} is not an ally.`);
          return;
        }
        const battles = { ...(s.oldGodBattles || {}) };
        const battle = battles[oldGodId];
        if (!battle || battle.status !== "in_progress") return;
        if (battle.calledAllyIds.includes(godId)) {
          battle.calledAllyIds = battle.calledAllyIds.filter((id) => id !== godId);
          set({ oldGodBattles: battles });
          get().addToLog(`Ally ${MINOR_GOD_MAP[godId].name} withdrawn from ${OLD_GOD_MAP[oldGodId].name}.`);
          return;
        }
        battle.calledAllyIds = [...battle.calledAllyIds, godId];
        set({ oldGodBattles: battles });
        get().addToLog(`Ally ${MINOR_GOD_MAP[godId].name} called to fight ${OLD_GOD_MAP[oldGodId].name}.`);
      },

      attackOldGod: (oldGodId) => {
        const s = get();
        if (!s.unlockedLayers?.infinity) return;
        const god = OLD_GOD_MAP[oldGodId];
        if (!god) return;
        const battles = { ...(s.oldGodBattles || {}) };
        const battle = battles[oldGodId];
        if (!battle || battle.status !== "in_progress") return;
        // FEATURE 9 — Temporal Storms: 20% chance per battle turn to spawn a storm
        const temporalStorms = { ...(s.temporalStorms || {}) };
        if (!temporalStorms[oldGodId] && Math.random() < 0.20) {
          temporalStorms[oldGodId] = true;
          setTimeout(() => get().addToLog(`🌀 Temporal Storm engulfs the battlefield — the timeline shudders. (Stabilize Time for 1 Divine Fragment to end it.)`), 0);
        }
        const stormActive = !!temporalStorms[oldGodId];
        // Compute player attack from deployed legions
        const deployedPowers = battle.deployedLegionIds.map((lid) => {
          const legion = (s.legions || []).find((l) => l.id === lid);
          if (!legion) return { attack: 0, defense: 0, speed: 0, count: 0 };
          return legionPower(legion, s.creatures || []);
        });
        // L7 FIX Bug 3 — Wire creature specials into the damage calculation.
        // Iterate deployed creatures and count specials. Apply: berserk → +20% player damage
        // per berserk creature; shield → -20% boss damage per shield creature.
        // TODO(regen): heal playerHp by 1 per regen creature per turn — requires BattleState.playerHp,
        // which Subagent F is adding in parallel. When present, wire regen here.
        const deployedCreatureIds = new Set<string>();
        for (const lid of battle.deployedLegionIds) {
          const legion = (s.legions || []).find((l) => l.id === lid);
          if (!legion) continue;
          for (const cid of legion.creatureIds) deployedCreatureIds.add(cid);
        }
        let berserkCount = 0;
        let shieldCount = 0;
        let regenCount = 0;
        for (const c of (s.creatures || [])) {
          if (!deployedCreatureIds.has(c.id)) continue;
          if (c.special === "berserk") berserkCount += 1;
          else if (c.special === "shield") shieldCount += 1;
          else if (c.special === "regen") regenCount += 1;
        }
        const berserkBonusMult = 1 + 0.20 * berserkCount; // +20% player dmg per berserk creature
        const shieldReductionMult = Math.max(0, 1 - 0.20 * shieldCount); // -20% boss dmg per shield creature
        void regenCount; // reserved for regen-on-playerHp wiring (Subagent F)
        const calledAllies = battle.calledAllyIds.map((aid) => {
          const ally = MINOR_GOD_MAP[aid];
          if (!ally) return { powerLevel: 0 };
          return { powerLevel: ally.powerLevel };
        });
        const weakToBodyType = (() => {
          // Check if ANY deployed legion has a creature whose bodyType matches the god's weakness.
          // This makes L7 creature design matter for L9 combat.
          const deployedBodyTypes = new Set<string>();
          for (const legId of battle.deployedLegionIds) {
            const legion = s.legions.find((l) => l.id === legId);
            if (!legion) continue;
            for (const cId of legion.creatureIds) {
              const c = s.creatures.find((cr) => cr.id === cId);
              if (c) deployedBodyTypes.add(c.bodyType);
            }
          }
          return deployedBodyTypes.has(god.weakness);
        })();
        // LAYER UPGRADE — war_preparation: +20% player damage per level (max 5)
        const wpLvl = (s.upgrades?.war_preparation as number) || 0;
        const warMult = 1 + 0.20 * wpLvl;
        const playerDmg = Math.round(computePlayerAttack(deployedPowers, calledAllies, weakToBodyType) * warMult * berserkBonusMult);
        // Compute boss attack back (storm shuffles timeline: 50% delayed, 50% accelerated)
        const totalDefense = deployedPowers.reduce((a, p) => a + p.defense, 0);
        let bossDmg = computeBossAttack(god.attack, totalDefense);
        // L7 FIX Bug 3 — shield special reduces incoming boss damage
        bossDmg = Math.max(1, Math.round(bossDmg * shieldReductionMult));
        let stormNote = "";
        if (stormActive) {
          // LAYER UPGRADE — temporal_shield: accelerated storm effect halved per level (max 2)
          const tsLvl = (s.upgrades?.temporal_shield as number) || 0;
          const accelMult = 1 + 0.5 * Math.pow(0.5, tsLvl);
          if (Math.random() < 0.5) {
            bossDmg = Math.round(bossDmg * 0.5); // delayed — half damage
            stormNote = " (storm delayed enemy strike)";
          } else {
            bossDmg = Math.round(bossDmg * accelMult); // accelerated — reduced by temporal_shield
            stormNote = ` (storm accelerated enemy strike ×${accelMult.toFixed(2)})`;
          }
        }
        // Apply damage
        const bossHp = Math.max(0, battle.bossHp - playerDmg);
        // Apply boss damage to player HP — battle is LOST when playerHp <= 0
        let playerHp = Math.max(0, (battle.playerHp || 200) - bossDmg);
        // regen special: heal player HP by 1 per regen creature per turn
        if (regenCount > 0) {
          playerHp = Math.min(battle.playerMaxHp || 200, playerHp + regenCount);
        }
        const log = [...(battle.log || [])];
        log.push(`Turn ${battle.turn + 1}: You deal ${playerDmg} damage. ${god.name} retaliates for ${bossDmg}.${stormNote} (Your HP: ${playerHp})`);
        if (log.length > 6) log.shift();
        let status: import("../data/infinity").BattleStatus = battle.status;
        let phase = battle.phase;
        if (bossHp <= 0) {
          status = "won";
          log.push(`${god.name} has fallen! +1 Divine Fragment.`);
          temporalStorms[oldGodId] = false; // clear storm on win
        } else if (playerHp <= 0) {
          // Player routed — battle lost, reset for retry
          status = "lost";
          log.push(`Your forces have been routed! The Old God repels your assault. Re-engage to try again.`);
          temporalStorms[oldGodId] = false;
        } else {
          phase = phaseForHp(god, bossHp);
        }
        battles[oldGodId] = {
          ...battle,
          bossHp,
          playerHp,
          phase,
          status,
          turn: battle.turn + 1,
          log,
        };
        set({ oldGodBattles: battles, temporalStorms });
        if (status === "won") {
          const fragments = (s.divineFragments || 0) + 1;
          set({ divineFragments: fragments });
          get().addToLog(`Victory over ${god.name}! Earned a Divine Fragment (total: ${fragments}).`);
        } else if (status === "lost") {
          // Reset battle for retry — boss HP and player HP back to full
          battles[oldGodId] = {
            ...battles[oldGodId],
            status: "not_started",
            bossHp: battle.bossMaxHp,
            playerHp: battle.playerMaxHp || 200,
            phase: "skirmish",
            turn: 0,
            log: ["Battle reset after defeat. Re-engage when ready."],
          };
          set({ oldGodBattles: battles });
          get().addToLog(`Defeated by ${god.name}. Battle reset. Re-engage to try again.`);
        } else {
          get().addToLog(`Strike ${god.name} for ${playerDmg} (HP ${bossHp}/${battle.bossMaxHp}). Boss hits back for ${bossDmg}${stormNote} (Your HP: ${playerHp}/${battle.playerMaxHp || 200}).`);
        }
      },

      // ============ LAYER 10 — ETERNITY (GENESIS ENGINE) ============
      chooseEnding: (endingId) => {
        const s = get();
        if (!s.unlockedLayers?.eternity) return;
        const ending = ENDING_CHOICE_MAP[endingId];
        if (!ending) return;
        // Ending choice is only available once all 100 archetypes are discovered.
        const discoveredCount = Object.values(s.discoveredArchetypes || {}).filter(Boolean).length;
        if (discoveredCount < ARCHETYPE_COUNT) {
          get().addToLog(`Ending locked: ${discoveredCount}/${ARCHETYPE_COUNT} archetypes discovered. Find all 100 to ascend.`);
          return;
        }
        set({ chosenEnding: endingId });
        get().addToLog(`Ending chosen: ${ending.name}. ${ending.desc}`);
        // Reset ending ("Explore another Dimension") triggers a prestige with a Cosmic Boon stack.
        if (endingId === "reset") {
          setTimeout(() => {
            get().addToLog("You step beyond the veil. A new dimension unfolds before you.");
            // Mark current dimension as visited
            const currentDim = s.activeDimension || "mundane";
            const visited = [...new Set([...(s.visitedDimensions || ["mundane"]), currentDim])];
            set({ visitedDimensions: visited });
            get().triggerPrestige();
          }, 0);
        }
      },

      // DIMENSION SYSTEM — select the active dimension (visual/naming reskin).
      // Called from the L10 ending screen dimension picker.
      selectDimension: (dimensionId) => {
        const s = get();
        const dim = getDimension(dimensionId);
        if (!dim) return;
        // Add to visited dimensions
        const visited = [...new Set([...(s.visitedDimensions || ["mundane"]), dimensionId])];
        set({
          activeDimension: dimensionId,
          visitedDimensions: visited,
        });
        get().addToLog(`Dimension selected: ${dim.name}. ${dim.desc}`);
      },

      // LEGACY — Genesis Engine redesign removed universe-rule slots.
      // Kept as no-op stub for save-compat (older saves may still call it).
      setUniverseRule: (_slotIndex, _optionId) => {
        void _slotIndex;
        void _optionId;
      },

      // LEGACY — Genesis Engine redesign removed the kept-gods pantheon.
      // Kept as no-op stub for save-compat.
      toggleKeptGod: (_godId) => {
        void _godId;
      },

      // ============ GENESIS ENGINE — new actions ============
      addRelicToCrucible: (relicId) => {
        const s = get();
        if (!s.unlockedLayers?.eternity) return;
        if (s.universeSimulating) return; // can't modify crucible mid-sim
        const crucible = [...(s.crucibleRelicIds || [])];
        if (crucible.length >= 5) {
          get().addToLog("Crucible is full (max 5 relics). Trigger a Big Bang or clear the crucible.");
          return;
        }
        if (crucible.includes(relicId)) {
          get().addToLog("That relic is already in the crucible.");
          return;
        }
        const relic = (s.divineRelics || []).find((r) => r.id === relicId);
        if (!relic) return;
        crucible.push(relicId);
        set({ crucibleRelicIds: crucible });
        get().addToLog(`Added ${relic.name} to the crucible (${crucible.length}/5).`);
      },

      clearCrucible: () => {
        const s = get();
        if (!s.unlockedLayers?.eternity) return;
        if (s.universeSimulating) return;
        if ((s.crucibleRelicIds || []).length === 0) return;
        set({ crucibleRelicIds: [] });
        get().addToLog("Crucible cleared.");
      },

      revealRelicRule: (relicId, ruleIndex) => {
        const s = get();
        if (!s.unlockedLayers?.eternity) return;
        const relics = (s.divineRelics || []).map((r) => ({ ...r, rules: r.rules.map((rr) => ({ ...rr, revealed: { ...rr.revealed } })) }));
        const relic = relics.find((r) => r.id === relicId);
        if (!relic) return;
        if (ruleIndex < 0 || ruleIndex >= relic.rules.length) return;
        if (relic.rules[ruleIndex].revealed.rule) return; // already revealed
        if ((s.divinity || 0) < REVEAL_COST_RULE) {
          get().addToLog(`Need ${REVEAL_COST_RULE} Divinity to reveal a rule name.`);
          return;
        }
        relic.rules[ruleIndex].revealed.rule = true;
        set({ divinity: (s.divinity || 0) - REVEAL_COST_RULE, divineRelics: relics });
        const ruleName = UNIVERSE_RULES.find((r) => r.id === relic.rules[ruleIndex].ruleId)?.shortName || "?";
        get().addToLog(`✦ Revealed: ${relic.name} affects ${ruleName} (-${REVEAL_COST_RULE} Divinity).`);
      },

      revealRelicAmount: (relicId, ruleIndex) => {
        const s = get();
        if (!s.unlockedLayers?.eternity) return;
        const relics = (s.divineRelics || []).map((r) => ({ ...r, rules: r.rules.map((rr) => ({ ...rr, revealed: { ...rr.revealed } })) }));
        const relic = relics.find((r) => r.id === relicId);
        if (!relic) return;
        if (ruleIndex < 0 || ruleIndex >= relic.rules.length) return;
        // Must reveal rule name first
        if (!relic.rules[ruleIndex].revealed.rule) {
          get().addToLog("Reveal the rule name first before revealing the amount.");
          return;
        }
        if (relic.rules[ruleIndex].revealed.amount) return; // already revealed
        if ((s.divinity || 0) < REVEAL_COST_AMOUNT) {
          get().addToLog(`Need ${REVEAL_COST_AMOUNT} Divinity to reveal a rule amount.`);
          return;
        }
        relic.rules[ruleIndex].revealed.amount = true;
        set({ divinity: (s.divinity || 0) - REVEAL_COST_AMOUNT, divineRelics: relics });
        const amt = relic.rules[ruleIndex].amount;
        const ruleName = UNIVERSE_RULES.find((r) => r.id === relic.rules[ruleIndex].ruleId)?.shortName || "?";
        get().addToLog(`✦ Revealed: ${relic.name} → ${ruleName} ${amt >= 0 ? "+" : ""}${amt} (-${REVEAL_COST_AMOUNT} Divinity).`);
      },

      triggerBigBang: () => {
        const s = get();
        if (!s.unlockedLayers?.eternity) return;
        if (s.universeSimulating) return;
        const crucibleIds = s.crucibleRelicIds || [];
        if (crucibleIds.length < 1) {
          get().addToLog("Add at least one relic to the crucible to trigger a Big Bang.");
          return;
        }
        // ACHIEVEMENT-EXPANSION — bump the lifetime Big Bang counter.
        const newMeta = bumpAchievementMeta(s, "bigBangsTriggered", 1);
        set({
          universeSimulating: true,
          simulationStartTime: s.time,
          lastSimulationResult: null,
          achievementMeta: newMeta,
        });
        get().addToLog("💥 Big Bang initiated — simulating the cosmos... (30s)");
      },

      completeBigBang: () => {
        const s = get();
        if (!s.universeSimulating) return;
        const crucibleIds = s.crucibleRelicIds || [];
        const relics = (s.divineRelics || []);
        const crucibleRelics = crucibleIds
          .map((id) => relics.find((r) => r.id === id))
          .filter((r): r is DivineRelic => !!r);
        if (crucibleRelics.length === 0) {
          // No relics (shouldn't happen — triggerBigBang requires ≥1) — bail.
          set({ universeSimulating: false, crucibleRelicIds: [] });
          return;
        }
        // Compute final rule levels + stability.
        const comp = computeCrucibleRules(crucibleRelics);
        const finalValues = comp.rules.map((r) => r.finalValue);
        // Crucible relics are CONSUMED in the Big Bang (always — stable or unstable).
        const remainingRelics = relics.filter((r) => !crucibleIds.includes(r.id));
        let relicsGained = 0;
        let relicsLost = 0;
        let archetypeId: string | null = null;
        if (comp.unstable) {
          // Unstable: lose additional relics from inventory based on instability level.
          const loss = relicLossCount(comp.instability, remainingRelics.length);
          // Remove the first `loss` relics from inventory (oldest first — by createdAt asc).
          const sortedRemaining = [...remainingRelics].sort((a, b) => a.createdAt - b.createdAt);
          const lostRelicIds = new Set(sortedRemaining.slice(0, loss).map((r) => r.id));
          relicsLost = loss;
          const afterLoss = remainingRelics.filter((r) => !lostRelicIds.has(r.id));
          set({
            universeSimulating: false,
            crucibleRelicIds: [],
            divineRelics: afterLoss,
            lastSimulationResult: {
              stable: false,
              archetypeId: null,
              relicsGained: 0,
              relicsLost: relicsLost,
              instability: comp.instability,
            },
          });
          get().addToLog(`💥 Big Bang FAILED — instability ${comp.instability}. Lost ${relicsLost} relic(s) from inventory.`);
        } else {
          // Stable: discover an archetype + gain 3-5 new relics.
          archetypeId = matchArchetype(finalValues);
          const newRelics = generateRelicReward(3 + Math.floor(Math.random() * 3)); // 3..5
          relicsGained = newRelics.length;
          const discovered = { ...(s.discoveredArchetypes || {}) };
          let isNew = false;
          if (archetypeId && !discovered[archetypeId]) {
            discovered[archetypeId] = true;
            isNew = true;
          }
          set({
            universeSimulating: false,
            crucibleRelicIds: [],
            divineRelics: [...remainingRelics, ...newRelics],
            discoveredArchetypes: discovered,
            lastSimulationResult: {
              stable: true,
              archetypeId,
              relicsGained,
              relicsLost: 0,
              instability: 0,
            },
            // ACHIEVEMENT-EXPANSION — bump the lifetime stable-universe
            // counter (drives the "Genesis Engine" + "layer_10_complete"
            // achievements).
            achievementMeta: bumpAchievementMeta(s, "stableUniversesCreated", 1),
          });
          const discoveredCount = Object.values(discovered).filter(Boolean).length;
          const archName = archetypeId ? (GENESIS_ARCHETYPE_MAP[archetypeId]?.name || "Unknown") : "no archetype";
          if (archetypeId && isNew) {
            get().addToLog(`🌟 Big Bang stable! Discovered new archetype: ${archName} (${discoveredCount}/${ARCHETYPE_COUNT}). Gained ${relicsGained} new relic(s).`);
          } else if (archetypeId) {
            get().addToLog(`🌟 Big Bang stable — archetype ${archName} already known (${discoveredCount}/${ARCHETYPE_COUNT}). Gained ${relicsGained} new relic(s).`);
          } else {
            get().addToLog(`🌟 Big Bang stable, but no archetype matched. Gained ${relicsGained} new relic(s).`);
          }
          if (isGenesisComplete(discovered)) {
            get().addToLog("🌠 You have discovered all 100 archetypes! The Genesis Engine unlocks the ending screen.");
          }
        }
      },

      // ============ THEME CUSTOMIZATION (Part 1) ============
      setStageTheme: (id) => {
        const s = get();
        const unlocked = s.unlockedThemes || { "stage-cell": true };
        if (!unlocked[id]) {
          get().addToLog(`Theme ${id} is locked.`);
          return;
        }
        set({ activeStageTheme: id });
        get().addToLog(`Stage theme: ${id}.`);
      },

      setLayerTheme: (id) => {
        const s = get();
        if (id === null) {
          set({ activeLayerTheme: null });
          get().addToLog("Layer overlay cleared.");
          return;
        }
        const unlocked = s.unlockedThemes || { "stage-cell": true };
        if (!unlocked[id]) {
          get().addToLog(`Overlay ${id} is locked.`);
          return;
        }
        set({ activeLayerTheme: id });
        get().addToLog(`Divine overlay: ${id}.`);
      },

      setSpecialTheme: (id) => {
        const s = get();
        if (id === null) {
          set({ activeSpecialTheme: null });
          get().addToLog("Special theme cleared — reverting to stage+layer theme.");
          return;
        }
        const unlocked = s.unlockedThemes || { "stage-cell": true };
        if (!unlocked[id]) {
          get().addToLog(`Special theme ${id} is locked.`);
          return;
        }
        // ACHIEVEMENT-HOOKS-CONDITIONAL-EVENTS — "AI Detected" achievement
        // checks `aiThemeActive`. The flag is set when the player picks the
        // `mini-ai` special/mini theme (the "MAXIMALLY AI-looking" palette).
        // Encoded as 0/1 on the loose `achievementMeta` record.
        const patch: Partial<GameState> = { activeSpecialTheme: id };
        if (id === "mini-ai") {
          patch.achievementMeta = bumpAchievementMeta(s, "aiThemeActive", 0, { replace: 1 });
        }
        set(patch);
        get().addToLog(`Special theme: ${id}.`);
      },

      // Theme mode toggle: "auto" follows stage/layer automatically; "custom" locks player's pick
      setThemeMode: (mode) => {
        set({ themeMode: mode });
        if (mode === "auto") {
          // Re-derive the auto theme from current state
          const s = get();
          const stageThemeId = STAGE_INDEX_TO_THEME[s.stageIndex] || "stage-cell";
          const layerThemeId = highestUnlockedLayerThemeId(s.unlockedLayers || {});
          set({
            activeStageTheme: stageThemeId,
            activeLayerTheme: layerThemeId,
            activeSpecialTheme: null, // auto mode clears special override
          });
          get().addToLog("Theme mode: Auto — follows stage & layer.");
        } else {
          get().addToLog("Theme mode: Custom — your selected theme is now locked in.");
        }
      },

      // ===== QUICK WINS =====
      // WIN 5 — buyUniversalUpgrade: spends Prestige Points on universal upgrades
      buyUniversalUpgrade: (upgradeId) => {
        const s = get();
        const up = UPGRADE_MAP[upgradeId];
        if (!up) return;
        if (up.category !== "universal") return;
        const owned = s.upgrades[upgradeId] || 0;
        if (owned >= up.maxLevel) return;
        const cost = upgradeCost(up, owned);
        // CURRENCY-UNIFICATION — universal shop upgrades now cost Divinity
        // (was Prestige Points). `prestigePoints` is kept on GameState for
        // back-compat but is no longer spent here. `debugFreeBuy` still
        // bypasses affordability.
        if (!s.debugFreeBuy && (s.divinity || 0) < cost) {
          get().notifyPurchaseError("Not enough Divinity");
          return;
        }
        const upgrades = { ...s.upgrades, [upgradeId]: owned + 1 };
        set({
          divinity: s.debugFreeBuy ? (s.divinity || 0) : (s.divinity || 0) - cost,
          upgrades,
        });
        get().addToLog(`Purchased ${up.name} (Lv ${owned + 1})${s.debugFreeBuy ? " (DEBUG: free)" : ` for ${cost} Divinity`}.`);
      },

      dismissTutorial: () => set({ tutorialActive: false, tutorialDismissed: true }),
      setEventFrequency: (freq) => set({ eventFrequency: freq }),

      // ACHIEVEMENT-HOOKS-CONDITIONAL-EVENTS — generic UI hook for
      // counter-based achievements ("Title Clicker", "Easter Egg: Hidden
      // Message") and flag-based achievements ("AI Detected", "View
      // Credits"). UIs call this with `(key)` to increment or
      // `(key, 0, { replace: 1 })` to set a 0/1 flag. The underlying
      // `bumpAchievementMeta` helper returns the new meta object so we can
      // batch it with other state in the same `set(...)` call.
      bumpAchievementMeta: (key, delta = 1, opts) => {
        const s = get();
        set({ achievementMeta: bumpAchievementMeta(s, key, delta, opts) });
      },

      resolveEvent: (eventId, choiceId) => {
        const s = get();
        const ev = EVENT_MAP[eventId];
        if (!ev) {
          set({ activeEvent: null });
          return;
        }
        const choice = ev.choices.find((c) => c.id === choiceId);
        if (!choice) {
          set({ activeEvent: null });
          return;
        }
        // ACHIEVEMENT-HOOKS-CONDITIONAL-EVENTS — apply conditionalEffects
        // when the player has satisfied the choice's gating condition
        // (tech researched OR system built). The conditionalEffects fully
        // REPLACE the base `resourceChanges` and `populationChange`; all
        // other base fields (happiness, affinity, unlockTech, logMsg) still
        // apply. This makes events STILL FIRE for tech-protected players
        // but with a softer penalty — replaces the old "immuneTech blocks
        // the event entirely" behaviour.
        let effectiveResourceChanges = choice.resourceChanges;
        let effectivePopulationChange = choice.populationChange;
        if (choice.conditionalEffects) {
          const cond = choice.conditionalEffects;
          const hasTech = cond.techId
            ? Boolean(s.technologies?.[cond.techId]) ||
              ((s.ownedSystems?.[cond.techId] || 0) > 0)
            : false;
          if (hasTech) {
            if (cond.resourceChanges) effectiveResourceChanges = cond.resourceChanges;
            if (cond.populationChange !== undefined) {
              effectivePopulationChange = cond.populationChange;
            }
          }
        }
        // Apply effects
        const res = { ...s.resources };
        if (effectiveResourceChanges) {
          for (const [r, v] of Object.entries(effectiveResourceChanges)) {
            const cap = s.capacities[r] || Infinity;
            res[r] = Math.max(0, Math.min(cap, (res[r] || 0) + (v as number)));
          }
        }
        let pop = s.population;
        if (effectivePopulationChange) {
          // ARCHETYPES-REWORK — Necroid/Necroid Ascendant populationImmortal
          // guards against event-driven decreases (population can still grow
          // from positive events, but never falls).
          const lockedArch = s.lockedArchetype ? ARCHETYPE_MAP[s.lockedArchetype] : null;
          const isImmortal = !!lockedArch?.bonus.populationImmortal;
          if (isImmortal && effectivePopulationChange < 0) {
            // Immortal — population never decreases from events.
            get().addToLog(`${lockedArch?.name} immortality prevented ${effectivePopulationChange} population loss.`);
          } else {
            pop = Math.max(0, pop + effectivePopulationChange);
          }
        }
        if (choice.happinessChange) {
          const cap = s.capacities.happiness || 100;
          res.happiness = Math.max(0, Math.min(cap, (res.happiness || 0) + choice.happinessChange));
        }
        const archetypeAffinity = { ...s.archetypeAffinity };
        if (choice.affinityChange) {
          for (const ac of choice.affinityChange) {
            archetypeAffinity[ac.archetype] = (archetypeAffinity[ac.archetype] || 0) + ac.amount;
          }
        }
        // L10-ENDING-L5-UI-UNLOCKTECH — grant optional tech unlock from
        // the resolved EventChoice. We set `technologies[unlockTech] = true`
        // (idempotent — re-unlocking an already-known tech is a no-op) and
        // log a clear message so the player can see what they earned.
        let technologies = s.technologies;
        if (choice.unlockTech) {
          if (!technologies[choice.unlockTech]) {
            technologies = { ...technologies, [choice.unlockTech]: true };
            // Find the tech name for a readable log message.
            const techName = TECHS.find((t) => t.id === choice.unlockTech)?.name || choice.unlockTech;
            get().addToLog(`Event unlocked tech: ${techName}`);
          } else {
            // Already unlocked — note it but don't duplicate the log line.
            const techName = TECHS.find((t) => t.id === choice.unlockTech)?.name || choice.unlockTech;
            get().addToLog(`Event unlocked tech: ${techName} (already known)`);
          }
        }
        // Record in event history
        const eventHistory = [
          {
            eventId: ev.id,
            eventName: ev.name,
            eventIcon: ev.icon,
            choiceId: choice.id,
            choiceLabel: choice.label,
            timestamp: Date.now(),
            gameTime: s.time,
          },
          ...(s.eventHistory || []),
        ].slice(0, 50); // keep last 50

        // EVENT-CHAINS — if the resolved choice schedules a follow-up event,
        // push a PendingFollowUp with `fireAt = Date.now() + delaySec*1000`.
        // The tick scans `pendingFollowUps` for due entries and either fires
        // the chained event (chance roll passed) or drops it (failed). We
        // only schedule when the target event exists in EVENT_MAP — this
        // gracefully no-ops if a chain event was removed in a future patch.
        let pendingFollowUps = s.pendingFollowUps || [];
        if (choice.followUpEvent && EVENT_MAP[choice.followUpEvent.eventId]) {
          const fu = choice.followUpEvent;
          const chance = fu.chance ?? 1;
          pendingFollowUps = [
            ...pendingFollowUps,
            {
              eventId: fu.eventId,
              fireAt: Date.now() + fu.delaySec * 1000,
              chance,
              sourceEventId: ev.id,
            },
          ];
          const targetName = EVENT_MAP[fu.eventId]?.name || fu.eventId;
          setTimeout(() => get().addToLog(`🔗 ${ev.name} scheduled follow-up "${targetName}" in ${fu.delaySec}s (chance ${Math.round(chance * 100)}%).`), 0);
        }

        set({
          resources: res,
          population: pop,
          maxPopulation: Math.max(s.maxPopulation || 0, pop),
          archetypeAffinity,
          technologies,
          activeEvent: null,
          eventHistory,
          pendingFollowUps,
          totalEventsResolved: (s.totalEventsResolved || 0) + 1,
        });
        if (choice.logMsg) get().addToLog(`${ev.name}: ${choice.logMsg}`);

        // Check achievements after event resolution
        const postEventState = get();
        const achResult = checkAchievements(postEventState);
        if (achResult.newOnes.length > 0) {
          set({
            achievements: achResult.earned,
            newAchievements: [...(postEventState.newAchievements || []), ...achResult.newOnes],
          });
        }
      },

      dismissStory: (id) => {
        const s = get();
        const ack = { ...s.storyAcknowledged, [id]: true };
        set({ activeStoryPopup: null, storyAcknowledged: ack });
      },

      dismissAchievementToast: () => {
        set({ newAchievements: [] });
      },

      applyOfflineProgress: () => {
        const s = get();
        if (!s.lastSaved) return null;
        const elapsedSec = Math.floor((Date.now() - s.lastSaved) / 1000);
        // Only apply if away for more than 30 seconds
        if (elapsedSec < 30) return null;
        // Cap: base 24h, +24h per temporal_reserves tier
        const tempReservesLvl = s.upgrades["temporal_reserves"] || 0;
        const maxBank = 86400 + tempReservesLvl * 86400;
        const appliedDt = Math.min(elapsedSec, maxBank);
        if (appliedDt < 30) return null;

        // Snapshot resources before to compute gains
        const before = { ...s.resources };

        // Apply tick at compressed speed (cap at 86400 per call to avoid huge loops)
        // We simulate in chunks of 3600s (1 hour) to stay performant
        const chunkSize = 3600;
        let remaining = appliedDt;
        // Temporarily set speed to 1 and call tick with large dt
        while (remaining > 0) {
          const chunk = Math.min(chunkSize, remaining);
          get().tick(chunk);
          remaining -= chunk;
          // Re-read state in case it changed
          const cur = get();
          if (cur.paused) break;
        }

        const after = get();
        const resourcesGained: Record<string, number> = {};
        for (const r of Object.keys(after.resources)) {
          const gain = (after.resources[r] || 0) - (before[r] || 0);
          if (Math.abs(gain) > 0.01) resourcesGained[r] = gain;
        }

        get().addToLog(`Offline progress: simulated ${Math.floor(appliedDt / 60)}m ${Math.floor(appliedDt % 60)}s away.`);

        // ACHIEVEMENT-EXPANSION — flag that the player used offline
        // progress (drives the "Time Traveler" achievement).
        const after2 = get();
        set({
          achievementMeta: bumpAchievementMeta(after2, "offlineProgressUsed", 0, { replace: 1 }),
        });

        return { elapsed: appliedDt, resourcesGained, applied: true };
      },

      addToLog: (msg) => {
        const s = get();
        const ts = new Date().toLocaleTimeString();
        const entry = `[${ts}] ${msg}`;
        const log = [entry, ...s.log].slice(0, 100);
        set({ log });
      },

      hardReset: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEY);
        }
        const fresh = { ...initialRunState(), ...initialMetaState() };
        set(fresh);
      },

      debugUnlockAll: () => {
        const s = get();
        // Seed 3 starter relics if the player has none (so the Genesis Engine is usable).
        const currentRelics = s.divineRelics || [];
        const starterRelics = currentRelics.length === 0 ? generateRelicReward(3) : [];
        set({
          unlockedChallenges: true,
          galacticWins: Math.max(s.galacticWins, 1),
          unlockedLayers: {
            evolution: true,
            enlightenment: true,
            transcendence: true,
            genesis: true,
            apotheosis: true,
            singularity: true,
            omnipotence: true,
            divinity: true,
            infinity: true,
            eternity: true,
          },
          evolutionPoints: (s.evolutionPoints || 0) + 1000,
          divinity: (s.divinity || 0) + 50000,
          faith: (s.faith || 0) + 5000,
          divineRelics: [...currentRelics, ...starterRelics],
          // Seed enough for L10 testing: high peak + some constellation stars lit
          peakProductionRate: Math.max(s.peakProductionRate || 0, 5000),
        });
        get().addToLog("DEBUG: All prestige layers unlocked. +1000 EP, +50000 Divinity, +5000 Faith granted. 3 starter relics seeded. Peak production set to 5000/s for L10 testing.");
      },

      // DEBUG: Free Buy — when enabled, all purchases cost 0 resources.
      toggleDebugFreeBuy: () => {
        const s = get();
        const next = !s.debugFreeBuy;
        set({ debugFreeBuy: next });
        get().addToLog(next ? "DEBUG: Free Buy ENABLED — all purchases cost 0." : "DEBUG: Free Buy disabled.");
      },

      // DEBUG: Trigger Event — force an event to fire immediately (random or specific).
      triggerDebugEvent: (eventId) => {
        const s = get();
        if (s.activeEvent) {
          get().addToLog("DEBUG: An event is already active — resolve it first.");
          return;
        }
        const stageId = STAGES[s.stageIndex].id;
        const possible = eventsForStage(stageId, s.time);
        if (possible.length === 0) {
          get().addToLog("DEBUG: No events available for the current stage.");
          return;
        }
        let pick;
        if (eventId === "random") {
          pick = possible[Math.floor(Math.random() * possible.length)];
        } else {
          pick = possible.find((e) => e.id === eventId) || possible[0];
        }
        set({
          activeEvent: pick.id,
          eventTimer: 60,
          eventCooldown: 0,
        });
        get().addToLog(`DEBUG: Triggered event "${pick.name}".`);
      },

      // ===== DEBUG-SHORTCUTS — additional debug actions =====
      // +1000 of every primary resource (atp, glucose, proteins, lipids,
      // elements, food, water, materials, organic_matter, knowledge, culture,
      // wood, lumber, stone, clay, science, happiness, military_power,
      // production, gold, influence, energy, alloys, data). Also bumps
      // capacities so the grant isn't immediately clipped.
      debugGrantResources: () => {
        const s = get();
        const resources = { ...(s.resources || {}) };
        const capacities = { ...(s.capacities || {}) };
        const DEBUG_GRANT_AMOUNT = 1000;
        for (const r of RESOURCES) {
          if (r.category !== "primary") continue;
          resources[r.id] = (resources[r.id] || 0) + DEBUG_GRANT_AMOUNT;
          // Lift the capacity floor so the grant isn't immediately lost.
          if ((capacities[r.id] || 0) < resources[r.id]) {
            capacities[r.id] = resources[r.id];
          }
        }
        set({ resources, capacities });
        get().addToLog(`DEBUG: +${DEBUG_GRANT_AMOUNT} of every primary resource granted.`);
      },

      // +1000 EP, +1000 PP, +1000 Divinity, +100 Faith, +100 Genesis Seeds,
      // +100 Singularity Cores.
      debugGrantCurrency: () => {
        const s = get();
        set({
          evolutionPoints: (s.evolutionPoints || 0) + 1000,
          prestigePoints: (s.prestigePoints || 0) + 1000,
          divinity: (s.divinity || 0) + 1000,
          faith: (s.faith || 0) + 100,
          genesisSeeds: (s.genesisSeeds || 0) + 100,
          singularityCores: (s.singularityCores || 0) + 100,
        });
        get().addToLog(
          "DEBUG: +1000 EP, +1000 PP, +1000 Divinity, +100 Faith, +100 Genesis Seeds, +100 Singularity Cores granted."
        );
      },

      // Unlock the next locked layer. Walks the layer progression chain and
      // opens the first one that isn't yet unlocked. If all 10 are open, logs.
      debugCompleteLayer: () => {
        const s = get();
        const chain = [
          { id: "enlightenment", label: "Enlightenment", gate: () => !!s.unlockedChallenges },
          { id: "transcendence", label: "Transcendence", gate: () => !!s.unlockedLayers?.enlightenment },
          { id: "genesis", label: "Genesis", gate: () => !!s.unlockedLayers?.transcendence },
          { id: "apotheosis", label: "Apotheosis", gate: () => !!s.unlockedLayers?.genesis },
          { id: "singularity", label: "Singularity", gate: () => !!s.unlockedLayers?.apotheosis },
          { id: "omnipotence", label: "Omnipotence", gate: () => !!s.unlockedLayers?.singularity },
          { id: "divinity", label: "Divinity", gate: () => !!s.unlockedLayers?.omnipotence },
          { id: "infinity", label: "Infinity", gate: () => !!s.unlockedLayers?.divinity },
          { id: "eternity", label: "Eternity", gate: () => !!s.unlockedLayers?.infinity },
        ];
        // L1 (Challenges) is its own thing — if not yet unlocked, unlock that.
        if (!s.unlockedChallenges) {
          // Challenges unlock after first Galactic win — simulate by granting 1 win.
          set({
            unlockedChallenges: true,
            galacticWins: Math.max(s.galacticWins || 0, 1),
          });
          get().addToLog("DEBUG: Challenges layer (L1) unlocked.");
          return;
        }
        for (const layer of chain) {
          if (!s.unlockedLayers?.[layer.id as keyof typeof s.unlockedLayers]) {
            // Seed starter relics on Eternity unlock (matches the tick's unlock path).
            const relicBump =
              layer.id === "eternity" && (s.divineRelics || []).length === 0
                ? { divineRelics: [...(s.divineRelics || []), ...generateRelicReward(3)] }
                : {};
            set({
              unlockedLayers: { ...s.unlockedLayers, [layer.id]: true },
              ...relicBump,
            });
            get().addToLog(`DEBUG: ${layer.label} layer unlocked.`);
            return;
          }
        }
        get().addToLog("DEBUG: All layers already unlocked.");
      },

      // +1 cosmicBoonStacks (L10 ending currency — multiplies final score on
      // "Explore another Dimension" resets).
      debugGenerateBoon: () => {
        const s = get();
        set({ cosmicBoonStacks: (s.cosmicBoonStacks || 0) + 1 });
        get().addToLog("DEBUG: +1 Cosmic Boon granted.");
      },

      // Immediately call triggerPrestige (the canonical prestige path).
      debugForcePrestige: () => {
        get().addToLog("DEBUG: Force prestige triggered.");
        get().triggerPrestige();
      },

      // Toggle speed between 100× (for fast testing) and 1×.
      debugToggle100x: () => {
        const s = get();
        const next = s.speed === 100 ? 1 : 100;
        set({ speed: next });
        get().addToLog(`DEBUG: Speed set to ${next}×.`);
      },

      // Rebind a keyboard shortcut by action id. The action id must exist
      // in DEFAULT_KEYBOARD_SHORTCUTS (otherwise the bind is a no-op).
      setKeyboardShortcut: (actionId, key) => {
        const s = get();
        const current = { ...(s.keyboardShortcuts || {}) };
        if (!(actionId in DEFAULT_KEYBOARD_SHORTCUTS)) return;
        // Strip any modifier prefixes — we don't support Ctrl+X etc. (yet).
        current[actionId] = key;
        set({ keyboardShortcuts: current });
      },

      // Reset all keyboard shortcuts to defaults.
      resetKeyboardShortcuts: () => {
        set({ keyboardShortcuts: { ...DEFAULT_KEYBOARD_SHORTCUTS } });
        get().addToLog("Keyboard shortcuts reset to defaults.");
      },

      saveGame: () => {
        set({ lastSaved: Date.now() });
      },

      loadGame: () => {
        // Handled by persist middleware
      },

      exportSave: () => {
        const s = get();
        return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
      },

      importSave: (data) => {
        try {
          const parsed = JSON.parse(decodeURIComponent(escape(atob(data))));
          set(parsed);
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      version: 15,
      partialize: (s) => s,
      // Migrate old saves (v1, v2, v3) to new structure
      migrate: (persisted: any, version: number) => {
        if (!persisted) return persisted;
        if (version < 2) {
          if (!persisted.systemEnabled) persisted.systemEnabled = {};
          if (!persisted.archetypeAffinity) persisted.archetypeAffinity = {};
          if (persisted.lockedArchetype === undefined) persisted.lockedArchetype = null;
          if (persisted.populationProgress === undefined) persisted.populationProgress = 0;
          if (!persisted.achievements) persisted.achievements = {};
          if (!persisted.newAchievements) persisted.newAchievements = [];
          if (persisted.upgrades) {
            if (persisted.upgrades.auto_balancer === undefined) persisted.upgrades.auto_balancer = 0;
            if (persisted.upgrades.archetype_insight === undefined) persisted.upgrades.archetype_insight = 0;
          }
        }
        // v3 migration: upgrade overhaul (removed quickened_hands, rival_insight)
        // + new Layer-1 challenge state + auto-action timers.
        if (version < 3 && persisted.upgrades) {
          // Remove dead upgrades
          delete persisted.upgrades.quickened_hands;
          delete persisted.upgrades.rival_insight;
          // Ensure every current upgrade entry exists at level 0 if not already present
          for (const up of UPGRADES) {
            if (persisted.upgrades[up.id] === undefined) persisted.upgrades[up.id] = 0;
          }
        }
        // Always ensure achievements fields exist (even on v3)
        if (!persisted.achievements) persisted.achievements = {};
        if (!persisted.newAchievements) persisted.newAchievements = [];
        if (persisted.showSettings === undefined) persisted.showSettings = false;
        // FIX-UI-TABS — Log/Archive/Codex/Awards info-modal state.
        if (persisted.activeInfoModal === undefined) persisted.activeInfoModal = null;
        if (persisted.tutorialDismissed === undefined) persisted.tutorialDismissed = false;
        if (persisted.maxPopulation === undefined) persisted.maxPopulation = persisted.population || 8;
        if (persisted.fastestCellClear === undefined) persisted.fastestCellClear = 0;
        if (persisted.activeEvent === undefined) persisted.activeEvent = null;
        if (persisted.eventCooldown === undefined) persisted.eventCooldown = 60;
        if (!persisted.eventHistory) persisted.eventHistory = [];
        if (persisted.totalEventsResolved === undefined) persisted.totalEventsResolved = 0;
        if (persisted.totalPlayTime === undefined) persisted.totalPlayTime = 0;
        if (persisted.totalActions === undefined) persisted.totalActions = 0;
        if (persisted.totalSystemsBuilt === undefined) persisted.totalSystemsBuilt = 0;
        if (persisted.totalTechResearched === undefined) persisted.totalTechResearched = 0;
        if (!persisted.eventFrequency) persisted.eventFrequency = "normal";
        // v3: Layer 1 challenge state
        if (persisted.unlockedChallenges === undefined) persisted.unlockedChallenges = false;
        if (persisted.activeChallenge === undefined) persisted.activeChallenge = null;
        if (!persisted.completedChallenges) persisted.completedChallenges = {};
        if (!persisted.challengeRepeatCounts) persisted.challengeRepeatCounts = {};
        if (persisted.showChallenges === undefined) persisted.showChallenges = false;
        // v3: auto-action timers
        if (!persisted.autoTimers) persisted.autoTimers = { system: 0, tech: 0, evolve: 0, challenge: 0 };
        // PP-SHOP-TABS — extend autoTimers with the new universal auto-buyer
        // keys for old saves (v1-v10) that pre-date the tab redesign.
        // The base-game timers (system/tech/evolve/challenge) are preserved.
        if (persisted.autoTimers) {
          if (persisted.autoTimers.light_stars === undefined) persisted.autoTimers.light_stars = 0;
          if (persisted.autoTimers.invest_market === undefined) persisted.autoTimers.invest_market = 0;
          if (persisted.autoTimers.claim_systems === undefined) persisted.autoTimers.claim_systems = 0;
          if (persisted.autoTimers.manage_heresy === undefined) persisted.autoTimers.manage_heresy = 0;
          if (persisted.autoTimers.place_anchors === undefined) persisted.autoTimers.place_anchors = 0;
          if (persisted.autoTimers.negotiate === undefined) persisted.autoTimers.negotiate = 0;
          if (persisted.autoTimers.attack_old_gods === undefined) persisted.autoTimers.attack_old_gods = 0;
          if (persisted.autoTimers.author_universes === undefined) persisted.autoTimers.author_universes = 0;
        }

        // v4 migration: Layers 2-6 state fields
        // Layer 2 — Enlightenment (Foresight)
        if (persisted.divinity === undefined) persisted.divinity = 0;
        if (!persisted.foresightNodes) persisted.foresightNodes = {};
        if (persisted.activeForesightRoute === undefined) persisted.activeForesightRoute = null;
        if (persisted.showEnlightenment === undefined) persisted.showEnlightenment = false;
        // Layer 3 — Transcendence
        if (!persisted.transcendenceOfferingsUsed) persisted.transcendenceOfferingsUsed = {};
        if (!persisted.purchasedRituals) persisted.purchasedRituals = {};
        if (!persisted.activeTemporaryRituals) persisted.activeTemporaryRituals = {};
        if (!persisted.activeScripts) persisted.activeScripts = {};
        if (!persisted.bloodPactsUsed) persisted.bloodPactsUsed = {};
        if (!persisted.scriptTimers) persisted.scriptTimers = {};
        if (persisted.showTranscendence === undefined) persisted.showTranscendence = false;
        // Layer 4 — Genesis
        if (persisted.genesisSeeds === undefined) persisted.genesisSeeds = 0;
        if (!persisted.authoredWorlds) persisted.authoredWorlds = [];
        if (!persisted.pendingWorldConfig) persisted.pendingWorldConfig = {};
        if (persisted.showGenesis === undefined) persisted.showGenesis = false;
        // Layer 5 — Apotheosis
        if (persisted.faith === undefined) persisted.faith = 0;
        if (!persisted.enactedDivineLaws) persisted.enactedDivineLaws = {};
        if (persisted.activeWorshipMode === undefined) persisted.activeWorshipMode = null;
        if (!persisted.performedMiracles) persisted.performedMiracles = {};
        if (!persisted.miracleTimers) persisted.miracleTimers = {};
        if (persisted.heresy === undefined) persisted.heresy = 0;
        if (persisted.activeHeresyResponse === undefined) persisted.activeHeresyResponse = "hr_ignore";
        if (persisted.showApotheosis === undefined) persisted.showApotheosis = false;
        // Layer 6 — Singularity
        if (persisted.singularityCores === undefined) persisted.singularityCores = 0;
        if (persisted.showSingularity === undefined) persisted.showSingularity = false;
        // L6 Universal Map redesign migration — initialize new fields on old saves.
        // `universalGalaxies` is the 50-galaxy runtime state; `realityAnchors` +
        // `riftsClosed` + `anchorsPlaced` persist across prestiges; `rifts` +
        // `riftSpawnTimer` reset per-run.
        if (!persisted.universalGalaxies || !Array.isArray(persisted.universalGalaxies) || persisted.universalGalaxies.length === 0) {
          persisted.universalGalaxies = makeInitialUniversalGalaxies();
        } else {
          // Reconcile against the canonical 50-galaxy list — if any new galaxies
          // were added to UNIVERSAL_GALAXIES (shouldn't happen mid-run, but be
          // defensive), backfill them. Also drop any stale ids.
          const canonical = makeInitialUniversalGalaxies();
          const byId = Object.fromEntries(persisted.universalGalaxies.map((g: UniversalGalaxyState) => [g.id, g]));
          persisted.universalGalaxies = canonical.map((g) => {
            const existing = byId[g.id];
            if (!existing) return g;
            return { ...g, ownerId: existing.ownerId || g.ownerId, systemsClaimed: existing.systemsClaimed || 0, heresy: existing.heresy || 0, anchored: !!existing.anchored };
          });
        }
        if (!persisted.rifts) persisted.rifts = [];
        if (!persisted.realityAnchors) persisted.realityAnchors = [];
        if (persisted.riftSpawnTimer === undefined) persisted.riftSpawnTimer = 45;
        if (persisted.riftsClosed === undefined) persisted.riftsClosed = 0;
        if (persisted.anchorsPlaced === undefined) persisted.anchorsPlaced = 0;
        // unlockedLayers should always exist (v3+); ensure all 10 layer flags exist
        if (!persisted.unlockedLayers) persisted.unlockedLayers = { evolution: true };
        if (persisted.unlockedLayers.enlightenment === undefined) persisted.unlockedLayers.enlightenment = false;
        if (persisted.unlockedLayers.transcendence === undefined) persisted.unlockedLayers.transcendence = false;
        if (persisted.unlockedLayers.genesis === undefined) persisted.unlockedLayers.genesis = false;
        if (persisted.unlockedLayers.apotheosis === undefined) persisted.unlockedLayers.apotheosis = false;
        if (persisted.unlockedLayers.singularity === undefined) persisted.unlockedLayers.singularity = false;

        // v5 migration: Layers 7-10 state fields
        // Layer 7 — Omnipotence
        if (persisted.activeOmnipotenceStance === undefined) persisted.activeOmnipotenceStance = "balanced";
        if (persisted.instability === undefined) persisted.instability = 0;
        if (persisted.showOmnipotence === undefined) persisted.showOmnipotence = false;
        if (persisted.unlockedLayers.omnipotence === undefined) persisted.unlockedLayers.omnipotence = false;
        // Layer 8 — Divinity (layer)
        if (persisted.showDivinityLayer === undefined) persisted.showDivinityLayer = false;
        if (persisted.unlockedLayers.divinity === undefined) persisted.unlockedLayers.divinity = false;
        // Layer 9 — Infinity
        if (persisted.showInfinity === undefined) persisted.showInfinity = false;
        if (persisted.unlockedLayers.infinity === undefined) persisted.unlockedLayers.infinity = false;
        // Layer 10 — Eternity — Genesis Engine
        if (persisted.chosenEnding === undefined) persisted.chosenEnding = null;
        if (persisted.cosmicBoonStacks === undefined) persisted.cosmicBoonStacks = 0;
        if (persisted.showEternity === undefined) persisted.showEternity = false;
        // Dimension system migration
        if (!persisted.activeDimension) persisted.activeDimension = "mundane";
        if (!persisted.visitedDimensions || !Array.isArray(persisted.visitedDimensions)) persisted.visitedDimensions = ["mundane"];
        if (persisted.unlockedLayers.eternity === undefined) persisted.unlockedLayers.eternity = false;
        // L10-ENDING-L5-UI-UNLOCKTECH — visitedDimensions always includes
        // "mundane" at minimum (the player starts there). Old saves without
        // the field get the default; saves that somehow lost "mundane" get
        // it re-added.
        if (!persisted.visitedDimensions || !Array.isArray(persisted.visitedDimensions)) {
          persisted.visitedDimensions = ["mundane"];
        } else if (!persisted.visitedDimensions.includes("mundane")) {
          persisted.visitedDimensions = ["mundane", ...persisted.visitedDimensions];
        }
        // NEW: Genesis Engine state migration (v12).
        //   - Legacy `universeRules` (8-slot array) and `keptGods` (god ids) are
        //     dropped — the Genesis Engine does not use them. Old saves simply
        //     lose them on load (no migration path needed since the new system
        //     starts the player with no relics / no discoveries).
        //   - New fields are initialized to empty / false / null.
        if (!persisted.divineRelics) persisted.divineRelics = [];
        if (!persisted.crucibleRelicIds) persisted.crucibleRelicIds = [];
        if (!persisted.discoveredArchetypes) persisted.discoveredArchetypes = {};
        // ARCHETYPES-REWORK — revealedLineageArchetypes tracks which of the 13
        // lineage archetypes the player has ever locked in. Persists across
        // prestiges. Drives the radar's ??? reveal state.
        // Migration: if a pre-rework save has `archivedArchetypes` (a list of
        // previously-locked archetype ids), seed revealedLineageArchetypes from
        // it so existing players don't lose visibility of archetypes they've
        // already locked in past runs.
        if (!persisted.revealedLineageArchetypes) {
          const archived = Array.isArray(persisted.archivedArchetypes) ? persisted.archivedArchetypes : [];
          persisted.revealedLineageArchetypes = Object.fromEntries(
            archived.map((id: string) => [id, true])
          );
        }
        if (persisted.universeSimulating === undefined) persisted.universeSimulating = false;
        if (persisted.simulationStartTime === undefined) persisted.simulationStartTime = 0;
        if (persisted.lastSimulationResult === undefined) persisted.lastSimulationResult = null;
        // If a save was mid-simulation when last persisted, cancel the sim
        // (we can't reliably resume a half-finished Big Bang).
        if (persisted.universeSimulating) {
          persisted.universeSimulating = false;
          persisted.simulationStartTime = 0;
        }
        // Drop legacy fields if they still exist (no-op for the new design).
        delete (persisted as any).universeRules;
        delete (persisted as any).keptGods;

        // v6 migration: Theme customization fields
        if (persisted.activeStageTheme === undefined) persisted.activeStageTheme = "stage-cell";
        if (persisted.activeLayerTheme === undefined) persisted.activeLayerTheme = null;
        if (persisted.activeSpecialTheme === undefined) persisted.activeSpecialTheme = null;
        if (!persisted.unlockedThemes) persisted.unlockedThemes = { "stage-cell": true };
        if (persisted.themeMode === undefined) persisted.themeMode = "auto";

        // v7 migration: Quick Wins — active abilities, ritual combos, prestige points, layer event timers
        if (!persisted.activeAbilityCooldowns) persisted.activeAbilityCooldowns = {};
        if (!persisted.activeAbilityEffects) persisted.activeAbilityEffects = {};
        if (persisted.lastRitualTime === undefined) persisted.lastRitualTime = 0;
        if (persisted.lastRitualId === undefined) persisted.lastRitualId = null;
        if (persisted.ritualComboCount === undefined) persisted.ritualComboCount = 0;
        if (persisted.ritualComboTimer === undefined) persisted.ritualComboTimer = 0;
        if (persisted.prestigePoints === undefined) persisted.prestigePoints = 0;
        if (!persisted.layerEventTimers) {
          persisted.layerEventTimers = { trial_of_fortune: 0, vision: 0, divine_whim: 0, heresy_surge: 0 };
        }
        // Ensure the new universal upgrades exist in upgrades record
        if (persisted.upgrades) {
          if (persisted.upgrades.universal_boost === undefined) persisted.upgrades.universal_boost = 0;
          if (persisted.upgrades.universal_speed === undefined) persisted.upgrades.universal_speed = 0;
        }

        // v8 migration: REBUILD L1-6 unique gameplay loops
        // Trial Realm mini-games were REMOVED in CLEANUP-LEGACY (replaced by
        // `challenges.ts`). No trialRealm state to migrate.
        // v9 migration: L2 constellation redesign — old `constellationNodes`
        // entries don't map to new star ids, so clear them. Initialize the
        // new state fields with empty records.
        if (!persisted.constellationStars) persisted.constellationStars = {};
        if (!persisted.constellationProgress) persisted.constellationProgress = {};
        if (!persisted.constellationsStarted) persisted.constellationsStarted = {};
        if (!persisted.constellationsCompleted) persisted.constellationsCompleted = {};
        if (!persisted.constellationNodes) persisted.constellationNodes = {};
        if (!persisted.constellationRevealed) persisted.constellationRevealed = {};
        // v10 migration: Cosmic Bridge + Stargaze recommended glow state.
        if (persisted.cosmicBridgeLink === undefined) persisted.cosmicBridgeLink = null;
        if (persisted.stargazeRecommendedActive === undefined) persisted.stargazeRecommendedActive = false;
        // Legacy `foresightNodes` always starts empty in new saves (no nodes
        // are migrated; the constellation map is the new L2 source of truth).
        if (!persisted.foresightNodes) persisted.foresightNodes = {};
        if (!persisted.marketPrices) persisted.marketPrices = { food: 10, water: 8, materials: 15, science: 20, gold: 25, energy: 30 };
        if (!persisted.priceHistory) persisted.priceHistory = { food: [10], water: [8], materials: [15], science: [20], gold: [25], energy: [30] };
        if (!persisted.marketOwnedResources) persisted.marketOwnedResources = {};
        if (persisted.marketTickTimer === undefined) persisted.marketTickTimer = 10;
        // FEATURE 3 — Market Crashes migration
        if (persisted.marketCrashTimer === undefined) persisted.marketCrashTimer = 120;
        if (persisted.marketCrashActive === undefined) persisted.marketCrashActive = false;
        if (persisted.marketCrashDuration === undefined) persisted.marketCrashDuration = 0;
        // DIVINE INVESTMENT MARKET migration — initialize the 4 new portfolio
        // state fields. Existing saves default to "no allocations, prices start
        // at 100" so the modal renders cleanly on first open after upgrade.
        if (!persisted.portfolioAllocations) persisted.portfolioAllocations = {};
        if (!persisted.portfolioLockTimers) persisted.portfolioLockTimers = {};
        if (!persisted.portfolioPrices) {
          persisted.portfolioPrices = Object.fromEntries(
            PORTFOLIOS.map((p) => [p.id, PORTFOLIO_PRICE_START])
          );
        }
        if (persisted.portfolioDividendsEarned === undefined) persisted.portfolioDividendsEarned = 0;
        if (persisted.heresySpreadTimer === undefined) persisted.heresySpreadTimer = 10;
        if (persisted.heresySeedTimer === undefined) persisted.heresySeedTimer = 30;
        if (!persisted.heresyThresholdsSeeded) persisted.heresyThresholdsSeeded = {};
        // FEATURE 5 — Prophets migration
        if (!persisted.prophets) persisted.prophets = [];
        if (persisted.prophetConvertTimer === undefined) persisted.prophetConvertTimer = 10;
        // === L5 redesign — Galactic Conquest migration ===
        // Per-galaxy heresy (starter seeded at 0). Ensure starter key exists.
        if (!persisted.galaxyHeresy) persisted.galaxyHeresy = {};
        if (persisted.galaxyHeresy[STARTER_GALAXY_ID] === undefined) {
          persisted.galaxyHeresy[STARTER_GALAXY_ID] = 0;
        }
        // Per-galaxy 8×4 heresy grid (starter seeded all faithful).
        if (!persisted.galaxyFollowerGrid) persisted.galaxyFollowerGrid = {};
        if (!persisted.galaxyFollowerGrid[STARTER_GALAXY_ID]) {
          persisted.galaxyFollowerGrid[STARTER_GALAXY_ID] = Array.from({ length: 32 }, () => ({ state: "faithful", type: "follower" }));
        }
        // Per-galaxy rival star systems — initialize from makeInitialRivalSystems
        // for every rival galaxy (idempotent: only initializes missing/short lists).
        if (!persisted.galaxyRivalSystems) persisted.galaxyRivalSystems = {};
        for (const g of RIVAL_GALAXIES) {
          const list = persisted.galaxyRivalSystems[g.id];
          if (!Array.isArray(list) || list.length !== g.systemCount) {
            persisted.galaxyRivalSystems[g.id] = makeInitialRivalSystems(g.id);
          } else {
            // Ensure each system has the expected shape (id/claimed/explored).
            persisted.galaxyRivalSystems[g.id] = list.map((sys: any, idx: number) => ({
              id: sys?.id || `rsys_${g.id}_${String(idx + 1).padStart(3, "0")}`,
              claimed: !!sys?.claimed,
              explored: !!sys?.explored,
            }));
          }
        }
        // Backfill any per-galaxy heresy grids for galaxies the player partially owns
        // (so the modal has a grid to render). Initialize all-faithful for any rival
        // galaxy that's missing a grid entry.
        for (const g of RIVAL_GALAXIES) {
          if (!persisted.galaxyFollowerGrid[g.id]) {
            persisted.galaxyFollowerGrid[g.id] = Array.from({ length: 32 }, () => ({ state: "faithful", type: "follower" }));
          }
          if (persisted.galaxyHeresy[g.id] === undefined) {
            persisted.galaxyHeresy[g.id] = 0;
          }
        }
        if (!persisted.conqueredGalaxies) persisted.conqueredGalaxies = {};
        if (!persisted.selectedGalaxyId) persisted.selectedGalaxyId = STARTER_GALAXY_ID;
        // Normalize prophet entries to per-galaxy shape (backfill galaxyId=starter for old saves).
        if (Array.isArray(persisted.prophets)) {
          persisted.prophets = persisted.prophets.map((p: any) => ({
            galaxyId: p?.galaxyId || STARTER_GALAXY_ID,
            cellIndex: p?.cellIndex ?? 0,
            lastConvertedAt: p?.lastConvertedAt ?? 0,
          }));
        }

        // v10 migration: FEATURE ENHANCEMENTS — L7 mutations (creature.mutated flag), L8 amplifiers, L9 temporal storms
        if (persisted.creatures) {
          for (const c of persisted.creatures) {
            if (c.mutated === undefined) c.mutated = false;
          }
        }
        if (!persisted.amplifiers) persisted.amplifiers = [];
        if (!persisted.temporalStorms) persisted.temporalStorms = {};

        // v9 migration: REBUILD L7-10 — new narrative (Bio-engineering, Divine Alliance, Divine War, Ascension)
        // Layer 7 — Creature Lab
        if (!persisted.creatures) persisted.creatures = [];
        if (!persisted.legions) persisted.legions = [];
        if (persisted.geneticInstability === undefined) persisted.geneticInstability = 0;
        if (persisted.creatureDesignDraft === undefined) {
          persisted.creatureDesignDraft = { bodyType: "predator", diet: "herbivore", special: "regen", name: "" };
        }
        // v11 migration: L7 Skirmish Arena — outpost raids + creature XP/levels + heresy auto-buyer timer
        if (!persisted.outpostRaids) persisted.outpostRaids = [];
        if (persisted.raidsRepelled === undefined) persisted.raidsRepelled = 0;
        if (persisted.activeOutpostRaid === undefined) persisted.activeOutpostRaid = null;
        if (!persisted.creatureXp) persisted.creatureXp = {};
        if (!persisted.creatureLevels) persisted.creatureLevels = {};
        if (persisted.outpostRaidSpawnTimer === undefined) persisted.outpostRaidSpawnTimer = OUTPOST_RAID_SPAWN_INTERVAL_SEC;
        // Backfill the auto_manage_heresy upgrade entry (universal shop upgrade).
        if (persisted.upgrades && persisted.upgrades.auto_manage_heresy === undefined) {
          persisted.upgrades.auto_manage_heresy = 0;
        }
        // Layer 8 — Divine Alliance
        if (!persisted.minorGods) {
          persisted.minorGods = MINOR_GODS.map((g) => ({ ...g }));
        }
        if (!persisted.godRelationships) {
          persisted.godRelationships = Object.fromEntries(MINOR_GODS.map((g) => [g.id, g.startingRelationship]));
        }
        if (!persisted.alliances) persisted.alliances = {};
        // Layer 9 — Divine War
        if (!persisted.oldGodBattles) {
          persisted.oldGodBattles = Object.fromEntries(OLD_GODS.map((g) => [g.id, makeInitialBattleState(g.id)]));
        }
        // Backfill playerHp/playerMaxHp on existing battle states (migration for older saves)
        if (persisted.oldGodBattles) {
          for (const godId of Object.keys(persisted.oldGodBattles)) {
            const bs = persisted.oldGodBattles[godId];
            if (bs && (bs.playerHp === undefined || bs.playerMaxHp === undefined)) {
              bs.playerHp = 200;
              bs.playerMaxHp = 200;
            }
          }
        }
        if (persisted.divineFragments === undefined) persisted.divineFragments = 0;
        // Layer 10 — Genesis Engine (legacy `universeRules` / `keptGods` already
        // dropped above in the v12 migration block). The new Genesis Engine
        // state is also initialized there.

        // v10 migration: BACKGROUND-SIMULATION — peak production tracker +
        // lifetime Divinity + EP counters. backgroundSimulations is now COMPUTED
        // each tick from (3 + starsLit) × simMult — no longer a stored counter.
        if (persisted.peakProductionRate === undefined) persisted.peakProductionRate = 0;
        if (persisted.divinityFromBackground === undefined) persisted.divinityFromBackground = 0;
        if (persisted.epFromBackground === undefined) persisted.epFromBackground = 0;
        // backgroundSimulations field kept for display-cache compat; recomputed each tick.
        if (persisted.backgroundSimulations === undefined) persisted.backgroundSimulations = 0;

        // P6 — Modal Consolidation migration. Older saves don't have the
        // `activeLayerModal` field; default it to null (closed). Also force
        // any stale `show*` flags false on load so a reloaded save doesn't
        // immediately open a layer modal the player didn't intend to open.
        if (persisted.activeLayerModal === undefined) persisted.activeLayerModal = null;
        // P7 — Error states migration: initialize the new field for older saves.
        if (persisted.lastPurchaseError === undefined) persisted.lastPurchaseError = null;
        // If a save somehow has multiple show* flags true, just clear them all
        // — the consolidated LayerModal will reopen the right one when the
        // player clicks a layer button.
        const anyLayerModalOpen =
          !!persisted.showChallenges ||
          !!persisted.showEnlightenment ||
          !!persisted.showTranscendence ||
          !!persisted.showGenesis ||
          !!persisted.showApotheosis ||
          !!persisted.showSingularity ||
          !!persisted.showOmnipotence ||
          !!persisted.showDivinityLayer ||
          !!persisted.showInfinity ||
          !!persisted.showEternity;
        if (anyLayerModalOpen) {
          // Don't auto-open on reload — reset to closed state.
          persisted.activeLayerModal = null;
          persisted.showChallenges = false;
          persisted.showEnlightenment = false;
          persisted.showTranscendence = false;
          persisted.showGenesis = false;
          persisted.showApotheosis = false;
          persisted.showSingularity = false;
          persisted.showOmnipotence = false;
          persisted.showDivinityLayer = false;
          persisted.showInfinity = false;
          persisted.showEternity = false;
        }

        // v13 migration (DEBUG-SHORTCUTS): seed the new `keyboardShortcuts`
        // field with defaults for older saves. Any custom binds merge over the
        // defaults. Missing keys (e.g. a brand-new action added in a future
        // patch) are filled in from DEFAULT_KEYBOARD_SHORTCUTS.
        if (!persisted.keyboardShortcuts) {
          persisted.keyboardShortcuts = { ...DEFAULT_KEYBOARD_SHORTCUTS };
        } else {
          persisted.keyboardShortcuts = {
            ...DEFAULT_KEYBOARD_SHORTCUTS,
            ...persisted.keyboardShortcuts,
          };
        }

        // ACHIEVEMENT-EXPANSION migration — seed the loose achievementMeta
        // record (counters + UI flags) for older saves. All reads default
        // to 0/undefined, so an empty object is safe; new counters added
        // in future patches also benefit from the same `|| 0` defaults.
        if (!persisted.achievementMeta) persisted.achievementMeta = {};

        // v14 migration (GOVERNMENT-SYSTEMS): initialize `activeGovernment`
        // to null for older saves. The evolveStage action will populate it
        // on the next Empire entry. For saves already past Empire that
        // never had a government assigned, we leave it null — the player
        // will see no government panel and no government bonuses until
        // their next prestige → Empire progression. (Bumping the version
        // to 14 here so the migrate block is unambiguous.)
        if (persisted.activeGovernment === undefined) {
          persisted.activeGovernment = null;
        }

        // v15 migration (AUTOBUYER-SETTINGS + EVENT-CHAINS +
        // CURRENCY-UNIFICATION):
        //   • Initialize the new `autoBuyerSettings` record (4 nullable
        //     targeting slots — systemTarget, techTarget,
        //     preferredGovernment, preferredForesightRoute). Old saves get
        //     all-null = no preference (matches fresh-start behaviour).
        //   • Initialize `pendingFollowUps` as [] (the follow-up event
        //     scheduler queue; old saves had no chains in flight).
        //   • CURRENCY-UNIFICATION does NOT remove the `ep_auto_converter`
        //     upgrade level from `upgrades` — old saves that bought it keep
        //     the level but it is inert (the tick logic + upgrade definition
        //     were both removed; see the comment blocks in those files).
        if (!persisted.autoBuyerSettings) {
          persisted.autoBuyerSettings = {
            systemTarget: null,
            techTarget: null,
            preferredGovernment: null,
            preferredForesightRoute: null,
          };
        } else {
          // Defensive — ensure all 4 slots exist on partial records.
          if (persisted.autoBuyerSettings.systemTarget === undefined) {
            persisted.autoBuyerSettings.systemTarget = null;
          }
          if (persisted.autoBuyerSettings.techTarget === undefined) {
            persisted.autoBuyerSettings.techTarget = null;
          }
          if (persisted.autoBuyerSettings.preferredGovernment === undefined) {
            persisted.autoBuyerSettings.preferredGovernment = null;
          }
          if (persisted.autoBuyerSettings.preferredForesightRoute === undefined) {
            persisted.autoBuyerSettings.preferredForesightRoute = null;
          }
        }
        if (!persisted.pendingFollowUps) {
          persisted.pendingFollowUps = [];
        }

        return persisted;
      },
    }
  )
);

// ============ HELPERS ============

function techMultiplier(s: GameState, target: "production" | "manual" | "capacity" | "population"): number {
  let mult = 1;
  // The "population" target is intentionally isolated — it does NOT carry
  // over production-tech bonuses (those scale resource output, not pop growth).
  // This keeps pop-growth techs balanceable on their own curve.
  const includeProductionCarryover = target !== "population";
  for (const [techId, owned] of Object.entries(s.technologies)) {
    if (!owned) continue;
    const tech = TECH_MAP[techId];
    if (!tech || !tech.multiplier) continue;
    if (tech.multiplier.target === target) {
      mult += tech.multiplier.value;
    } else if (includeProductionCarryover && tech.multiplier.target === "production") {
      mult += tech.multiplier.value;
    }
  }
  // Achievement + challenge-mastery production bonuses only apply when the
  // production carryover is in effect (i.e. for production/manual/capacity).
  if (includeProductionCarryover) {
    const ctx = buildAchievementCtx(s);
    mult += achievementBonus(s.achievements || {}, ctx, "production");
    // Layer 1 — Challenge mastery bonus (aggregated across all completed repeats).
    if (s.completedChallenges) {
      const agg = challengeMasteryBonusFromRepeats(s.completedChallenges);
      mult += agg.productionMult;
    }
  }
  return mult;
}

// Check whether a challenge's completeWhen condition is already met given the
// current game state. Used by setActiveChallenge to prevent cheese starts.
function checkChallengeComplete(
  ch: { completeWhen: import("../data/challenges").ChallengeCompleteWhen },
  s: GameState
): boolean {
  switch (ch.completeWhen.type) {
    case "reachPopulation":
      return s.population >= ch.completeWhen.value;
    case "reachStage":
      return STAGES[s.stageIndex].id === ch.completeWhen.stage;
    case "clearStage": {
      const targetIdx = STAGE_IDS.indexOf(ch.completeWhen.stage);
      return s.stageIndex > targetIdx;
    }
    case "reachGalactic":
      return s.stageIndex >= STAGES.length - 1;
    case "stockpileResource":
      return (s.resources[ch.completeWhen.resource] || 0) >= ch.completeWhen.value;
    default:
      return false;
  }
}

function buildAchievementCtx(s: GameState): AchievementCheckCtx {
  const systemsDiscoveredCount = Object.keys(s.ownedSystems).filter((id) => (s.ownedSystems[id] || 0) > 0).length;
  const techResearchedCount = Object.keys(s.technologies).filter((id) => s.technologies[id]).length;
  const upgradesOwnedCount = Object.values(s.upgrades).filter((c) => c > 0).length;
  const storyUnlockedCount = Object.keys(s.storyUnlocked).filter((id) => s.storyUnlocked[id]).length;

  // Derive per-stage tech + system counts for stage completionist/builder
  // achievements. techsByStage counts how many techs the player has researched
  // for each stage; systemsByStage counts how many distinct system TYPES the
  // player has built (≥1 owned) per stage.
  const techsByStage: Record<string, number> = {};
  const systemsByStage: Record<string, number> = {};
  for (const st of STAGE_IDS) {
    const stageTechIds = techsForStage(st).map((t) => t.id);
    const stageSystemIds = systemsForStage(st).map((sy) => sy.id);
    techsByStage[st] = stageTechIds.filter((id) => s.technologies[id]).length;
    systemsByStage[st] = stageSystemIds.filter((id) => (s.ownedSystems[id] || 0) > 0).length;
  }

  // Challenges / Trials
  const completedChallengesMap = s.completedChallenges || {};
  const challengesCompletedCount = Object.values(completedChallengesMap).filter((v) => (v || 0) > 0).length;
  const challengesTotalRepeats = Object.values(completedChallengesMap).reduce((a, b) => a + (b || 0), 0);
  const challengesAtMaxLevel = Object.values(completedChallengesMap).filter((v) => (v || 0) >= MAX_REPEATS_WITH_MASTERY).length;

  // Constellations (L2)
  const constellationStarsLit = Object.values(s.constellationStars || {}).filter(Boolean).length;
  const constellationsCompleted = Object.values(s.constellationsCompleted || {}).filter(Boolean).length;

  // Divine Market (L3) — portfolio dividends counter is persisted.
  const portfolioDividendsEarned = s.portfolioDividendsEarned || 0;

  // Galaxy Claim (L4) — current run claimed count + total across runs.
  const galaxySystemsClaimed = (s.galaxySystems || []).filter((g) => g.claimed).length;
  const galaxySystemsClaimedTotal = (s.achievementMeta?.galaxySystemsClaimedTotal as number) || 0;

  // Apotheosis (L5) — galaxies conquered (current run) + heresy survivor flag.
  const galaxiesConquered = Object.values(s.conqueredGalaxies || {}).filter(Boolean).length;
  const heresySurvivor = Boolean(s.achievementMeta?.heresySurvivor);

  // Singularity (L6)
  const riftsClosed = s.riftsClosed || 0;
  const anchorsPlaced = s.anchorsPlaced || 0;

  // Omnipotence (L7) — mutations triggered + outpost raids repelled.
  const mutationsTriggered = (s.achievementMeta?.mutationsTriggered as number) || 0;
  const raidsRepelled = s.raidsRepelled || 0;

  // Divinity (L8) — alliances formed.
  const alliancesFormed = Object.values(s.alliances || {}).filter(Boolean).length;

  // Infinity (L9) — Old God battles won.
  const oldGodBattlesWon = Object.values(s.oldGodBattles || {}).filter((b) => b?.status === "won").length;

  // Eternity (L10) — Genesis Engine counters.
  const bigBangsTriggered = (s.achievementMeta?.bigBangsTriggered as number) || 0;
  const stableUniversesCreated = (s.achievementMeta?.stableUniversesCreated as number) || 0;
  const discoveredProceduralArchetypes = Object.keys(s.discoveredArchetypes || {}).filter((id) => s.discoveredArchetypes[id]).length;
  const cosmicBoonStacks = s.cosmicBoonStacks || 0;

  // Layer unlock state — count unlocked non-default layers.
  const unlockedLayers = s.unlockedLayers || {};
  const unlockedLayerCount = Object.values(unlockedLayers).filter(Boolean).length;

  // Meta progression
  const totalPlayTime = s.totalPlayTime || 0;
  const totalActions = s.totalActions || 0;
  const totalSystemsBuilt = s.totalSystemsBuilt || 0;
  const totalTechResearched = s.totalTechResearched || 0;
  const stageIndex = s.stageIndex;

  // Government + divine engine worlds
  const governmentAssigned = !!s.activeGovernment;
  const divineEngineWorlds = s.backgroundSimulations || 0;

  // Fun / hidden UI flags (populated by store actions on the same record)
  const meta = s.achievementMeta || {};
  const titleClickCount = (meta.titleClicks as number) || 0;
  const versionClickCount = (meta.versionClicks as number) || 0;
  const aiThemeActive = Boolean(meta.aiThemeActive);
  const viewedCredits = Boolean(meta.viewedCredits);
  const offlineProgressUsed = Boolean(meta.offlineProgressUsed);
  const idleDurationSec = (meta.idleDurationSec as number) || 0;
  const pauseDurationSec = (meta.pauseDurationSec as number) || 0;
  const trialsAbandoned = (meta.trialsAbandoned as number) || 0;
  const fastestTrialClearSec = (meta.fastestTrialClearSec as number) || 0;
  const fastestGalacticClearSec = (meta.fastestGalacticClearSec as number) || 0;
  const marketTradesTotal = (meta.marketTradesTotal as number) || 0;

  return {
    galacticWins: s.galacticWins,
    totalRuns: s.totalRuns,
    stageClearCounts: s.stageClearCounts,
    archivedArchetypes: s.archivedArchetypes || [],
    storyUnlockedCount,
    systemsDiscoveredCount,
    techResearchedCount,
    upgradesOwnedCount,
    maxPopulation: s.maxPopulation || 0,
    fastestCellClear: s.fastestCellClear || 0,
    totalEventsResolved: s.totalEventsResolved || 0,

    // New fields
    stageIndex,
    totalPlayTime,
    totalActions,
    totalSystemsBuilt,
    totalTechResearched,
    unlockedLayers,
    unlockedLayerCount,
    challengesCompletedCount,
    challengesTotalRepeats,
    challengesAtMaxLevel,
    trialsAbandoned,
    fastestTrialClearSec,
    fastestGalacticClearSec,
    constellationStarsLit,
    constellationsCompleted,
    marketTradesTotal,
    portfolioDividendsEarned,
    galaxySystemsClaimed,
    galaxySystemsClaimedTotal,
    galaxiesConquered,
    heresySurvivor,
    riftsClosed,
    anchorsPlaced,
    mutationsTriggered,
    raidsRepelled,
    alliancesFormed,
    oldGodBattlesWon,
    bigBangsTriggered,
    stableUniversesCreated,
    discoveredProceduralArchetypes,
    cosmicBoonStacks,
    chosenEnding: s.chosenEnding,
    techsByStage: techsByStage as Record<StageId, number>,
    systemsByStage: systemsByStage as Record<StageId, number>,
    shopUpgradesAllOwned: upgradesOwnedCount >= UPGRADES.length,
    governmentAssigned,
    divineEngineWorlds,
    titleClickCount,
    versionClickCount,
    aiThemeActive,
    viewedCredits,
    offlineProgressUsed,
    idleDurationSec,
    pauseDurationSec,
  };
}

// Check all achievements; return new ones earned
function checkAchievements(s: GameState): { earned: Record<string, boolean>; newOnes: string[] } {
  const ctx = buildAchievementCtx(s);
  const earned = { ...(s.achievements || {}) };
  const newOnes: string[] = [];
  for (const ach of ACHIEVEMENTS) {
    if (!earned[ach.id] && ach.check(ctx)) {
      earned[ach.id] = true;
      newOnes.push(ach.id);
    }
  }
  return { earned, newOnes };
}

function computeScore(s: GameState): number {
  const totalSystems = Object.values(s.ownedSystems).reduce((a, b) => a + b, 0);
  const totalTech = Object.keys(s.technologies).length;
  const resourceSum = Object.values(s.resources).reduce((a, b) => a + b, 0);
  return Math.floor(
    s.population * 2 +
    totalSystems * 5 +
    totalTech * 10 +
    resourceSum * 0.5 +
    s.time * 0.1
  );
}

// Recompute all capacities from scratch based on owned systems
function recomputeCapacitiesFresh(s: GameState, capMult: number): Record<string, number> {
  const base = emptyCapacities();
  const caps: Record<string, number> = {};
  for (const r of Object.keys(base)) {
    let cap = (base[r] || 50) * capMult;
    for (const sys of SYSTEMS) {
      const count = s.ownedSystems[sys.id] || 0;
      if (!count || !sys.capacityBoost) continue;
      const boost = sys.capacityBoost[r];
      if (boost) cap += (boost as number) * count * capMult;
    }
    caps[r] = cap;
  }
  return caps;
}

// Export helper for components to compute whether an action is capped
export function isActionCapped(
  produces: Record<string, number>,
  resources: Record<string, number>,
  capacities: Record<string, number>
): boolean {
  const outputs = Object.entries(produces);
  if (outputs.length === 0) return false;
  return outputs.every(([r]) => {
    const cap = capacities[r] || 0;
    return (resources[r] || 0) >= cap - 0.001;
  });
}

// Export helper for whether a system is currently capped (idling)
export function isSystemCapped(
  sysId: string,
  resources: Record<string, number>,
  capacities: Record<string, number>
): boolean {
  const sys = SYSTEM_MAP[sysId];
  if (!sys) return false;
  const produces = Object.keys(sys.produces);
  if (produces.length === 0) return false;
  return produces.every((r) => {
    const cap = capacities[r] || 0;
    return (resources[r] || 0) >= cap - 0.01;
  });
}

// Export for components
export { STAGES, STAGE_IDS, SYSTEMS, TECHS, UPGRADES, ARCHETYPE_MAP };

// ===========================================================================
// ACHIEVEMENT-EXPANSION helpers
// ===========================================================================
// bumpAchievementMeta — increment a counter (or set a boolean flag encoded
// as 0/1) on the loose `achievementMeta` record. Returns the new meta
// object so callers can include it in a `set({...})` call. The `delta`
// defaults to 1; pass 0 to set a flag without incrementing.
function bumpAchievementMeta(
  s: GameState,
  key: string,
  delta: number = 1,
  opts: { cap?: number; replace?: number } = {}
): Record<string, number> {
  const meta = { ...(s.achievementMeta || {}) };
  const cur = (meta[key] as number) || 0;
  let next: number;
  if (opts.replace !== undefined) {
    next = opts.replace;
  } else {
    next = cur + delta;
  }
  if (opts.cap !== undefined && next > opts.cap) next = opts.cap;
  meta[key] = next;
  return meta;
}

// markPlayerAction — bump lastActionRealTime + reset consecutive idle timer.
// Called by any player-initiated action (manual action, buy, evolve, etc.)
// so the tick can compute idle duration as `now - lastActionRealTime`.
function markPlayerAction(s: GameState): Record<string, number> {
  const meta = { ...(s.achievementMeta || {}) };
  meta.lastActionRealTime = Date.now();
  // Reset the consecutive idle counter — "Idle Master" needs a full hour
  // without ANY player click.
  meta.idleDurationSec = 0;
  return meta;
}

// PLAYTEST-AUTOMATION — expose the store on `window` so automated
// playtest scripts (via agent-browser eval) can call store actions
// directly without going through React UI clicks.
if (typeof window !== "undefined") {
  (window as any).__gameStore = useGameStore;
}
