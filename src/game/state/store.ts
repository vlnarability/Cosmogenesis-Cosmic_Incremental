"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GameState, GameStore, StageId, TabId } from "./types";
import { emptyResources, emptyCapacities } from "../data/resources";
import { STAGES, STAGE_IDS, nextStage } from "../data/stages";
import { ACTION_MAP } from "../data/actions";
import { SYSTEMS, SYSTEM_MAP, systemCost } from "../data/systems";
import { TECH_MAP, TECHS } from "../data/techs";
import { UPGRADE_MAP, UPGRADES, upgradeCost } from "../data/upgrades";
import { STORY_MAP, STORY_TRIGGERS } from "../data/story";
import { ARCHETYPE_MAP, dominantArchetype } from "../data/archetypes";
import { ACHIEVEMENTS, achievementBonus, type AchievementCheckCtx } from "../data/achievements";
import { EVENTS, eventsForStage, EVENT_MAP } from "../data/events";
import {
  CHALLENGES,
  CHALLENGE_MAP,
  getMaxRepeats,
  getChallengeDebuffAtRepeat,
  challengeMasteryBonusFromRepeats,
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
  RELIC_LOADOUTS,
  RELIC_LOADOUT_MAP,
  LOGIC_CORES,
  LOGIC_CORE_MAP,
  relicBonus,
  logicCoreBonus,
} from "../data/singularity";
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
  type OmnipotenceStanceId,
  type CreatureBodyTypeId,
  type CreatureDietId,
  type CreatureSpecialId,
  type Creature,
  type Legion,
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
  prayerChannelBonus,
  divineMaskBonus,
  worshipPolarityBonus,
  prayerRate,
  type MinorGod,
} from "../data/divinity_layer";
import {
  OLD_GODS,
  OLD_GOD_MAP,
  ECHO_TYPES,
  ECHO_TYPE_MAP,
  FORK_SCENARIOS,
  FORK_SCENARIO_MAP,
  FUTURE_DEBT_TIERS,
  FUTURE_DEBT_TIER_MAP,
  makeInitialBattleState,
  divineFragmentBonus,
  computePlayerAttack,
  computeBossAttack,
  phaseForHp,
  echoBonus,
  forkBonus,
  activeDebtBonus,
  isInfinityComplete,
  type BattleState,
} from "../data/infinity";
import {
  UNIVERSE_SLOTS,
  UNIVERSE_SLOT_MAP,
  TESTAMENT_CLAUSES,
  TESTAMENT_CLAUSE_MAP,
  CANONIZATIONS,
  CANONIZATION_MAP,
  PERMANENCE_WEAVES,
  PERMANENCE_WEAVE_MAP,
  ENDING_CHOICES,
  ENDING_CHOICE_MAP,
  universeSlotBonus,
  keptGodsBonus,
  testamentClauseBonus,
  canonizationBonus,
  permanenceWeaveBonus,
  cosmicBoonBonus,
  isEternityComplete,
} from "../data/eternity";
import {
  STAGE_INDEX_TO_THEME,
  LAYER_ID_TO_THEME,
} from "../data/themes";
import { ACTIVE_ABILITIES, ACTIVE_ABILITY_MAP } from "../data/activeAbilities";
import {
  TRIAL_REALMS,
  TRIAL_REALM_MAP,
  PLAYABLE_REALM_IDS,
  makeDefaultRealmState,
  REALM_GROWTH_BREAKS_GOAL,
  REALM_GROWTH_PASSIVE_FILL_PER_SEC,
  REALM_DISCONTENT_HAPPINESS_THRESHOLD,
  REALM_DISCONTENT_SURVIVE_SECONDS,
  REALM_DISCONTENT_GOLD_GOAL,
  REALM_SWIFTNESS_TIME_LIMIT,
  // TRIALS-7 — newly playable realm constants
  REALM_FAMINE_SURVIVE_SECONDS,
  REALM_FAMINE_THRESHOLD,
  REALM_FAMINE_DECAY_PER_SEC,
  REALM_FAMINE_FLOW_PER_SEC,
  REALM_FAMINE_PUMP_FROM,
  REALM_FAMINE_PUMP_TO,
  REALM_IGNORANCE_NODE_COUNT,
  REALM_IGNORANCE_BUDGET,
  REALM_IGNORANCE_NODE_COSTS,
  REALM_STAGNATION_STAGE_COUNT,
  REALM_STAGNATION_GOODS_GOAL,
  REALM_STAGNATION_UPGRADE_BASE_COST,
  REALM_STAGNATION_RATE_DIVISOR,
  REALM_WEAKNESS_WAVE_COUNT,
  REALM_WEAKNESS_WAVE_DURATION,
  REALM_WEAKNESS_ENEMY_BASE,
  REALM_WEAKNESS_ENEMY_PER_WAVE,
  REALM_WEAKNESS_TOWER_KILL_RATE,
  REALM_WEAKNESS_TOWER_COST,
  REALM_WEAKNESS_WAVE_REWARD,
  REALM_WEAKNESS_LEAK_DAMAGE,
  REALM_LATE_BLOOM_POP_GOAL,
  REALM_LATE_BLOOM_PROD_COEFF,
  REALM_LATE_BLOOM_COST_PER_POP,
  REALM_PURITY_POOL_CAP,
  REALM_PURITY_SYSTEMS_GOAL,
  REALM_PURITY_BUILD_COST,
  REALM_PURITY_DRAIN_PER_SYSTEM,
  REALM_ASCETIC_STAGES,
  REALM_ASCETIC_SYSTEM_COSTS,
  REALM_ASCETIC_BASE_RATE,
  trialRealmRewardBonus,
} from "../data/trialRealms";

const STORAGE_KEY = "evolution_idle_v2";

// ===== REBUILD: L1-6 helper factories =====
function makeInitialFollowerGrid(): Array<{ state: string; type: string }> {
  // 8×4 = 32 cells. All start faithful.
  return Array.from({ length: 32 }, () => ({ state: "faithful", type: "follower" }));
}

function makeInitialDimensions() {
  return [
    { id: 0, name: "Alpha", speed: 1, pop: 8, stageIndex: 0, resources: 0, reachedGalactic: false },
    { id: 1, name: "Beta", speed: 0.5, pop: 8, stageIndex: 0, resources: 0, reachedGalactic: false },
    { id: 2, name: "Gamma", speed: 0.25, pop: 8, stageIndex: 0, resources: 0, reachedGalactic: false },
  ];
}

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
// L1 → L2: 5+ trial realms completed (was: 3 challenges completed)
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
    unlockedLayers: { evolution: true, enlightenment: false, transcendence: false, genesis: false, apotheosis: false, singularity: false, omnipotence: false, divinity: false, infinity: false, eternity: false },
    achievements: {},
    newAchievements: [],
    // Layer 1 — Challenges
    unlockedChallenges: false,
    activeChallenge: null,
    completedChallenges: {},
    challengeRepeatCounts: {},
    showChallenges: false,
    // Auto-action timers (game-time markers for periodic automation)
    autoTimers: { system: 0, tech: 0, evolve: 0, challenge: 0 },

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

    // Layer 6 — Singularity
    singularityCores: 0,
    equippedRelics: {},
    activeLogicCores: {},
    logicCoreTimers: {},
    showSingularity: false,
    // L6 FIX — Dimension Engine bonus tracker (resets each run)
    dimensionEngineBonusClaimed: false,

    // Layer 7 — Omnipotence (Bio-engineering)
    equippedHybrids: {},
    activeOmnipotenceStance: "balanced",
    instability: 0,
    peakInstability: 0,
    showOmnipotence: false,
    // NEW: Creature Lab
    creatures: [],
    legions: [],
    geneticInstability: 0,
    creatureDesignDraft: { bodyType: "predator", diet: "herbivore", special: "regen", name: "" },

    // Layer 8 — Divinity (the layer; not the resource) — Divine Alliance
    prayer: 0,
    prayerChannelLevels: {},
    activeDivineMask: null,
    activeWorshipPolarity: null,
    showDivinityLayer: false,
    // NEW: Divine Alliance — initialize the 6 minor god NPCs and relationships
    minorGods: MINOR_GODS.map((g) => ({ ...g })),
    godRelationships: Object.fromEntries(MINOR_GODS.map((g) => [g.id, g.startingRelationship])),
    alliances: {},

    // Layer 9 — Infinity — Divine War
    echoes: 0,
    purchasedEchoes: {},
    resolvedForks: {},
    takenFutureDebts: {},
    repaidFutureDebts: {},
    showInfinity: false,
    // NEW: Divine War — battle state for each Old God
    oldGodBattles: Object.fromEntries(OLD_GODS.map((g) => [g.id, makeInitialBattleState(g.id)])),
    divineFragments: 0,

    // Layer 10 — Eternity — Ascension
    testamentClauses: 0,
    purchasedTestamentClauses: {},
    activeCanonizations: {},
    activePermanenceWeaves: {},
    chosenEnding: null,
    cosmicBoonStacks: 0,
    showEternity: false,
    // NEW: Universe Creation — 8 slots, each holding an option id or null
    universeRules: Array(UNIVERSE_SLOTS.length).fill(null),
    keptGods: [],

    currentTab: "actions",
    speed: 1,
    paused: false,
    showShop: false,
    showEvolve: false,
    showSettings: false,
    activeStoryPopup: "first_spark",
    activeEvent: null,
    eventCooldown: 60, // first event can fire after 60s
    eventHistory: [],
    hasSeenIntro: false,
    lastSaved: Date.now(),
    tutorialStep: 0,
    tutorialActive: true,
    tutorialDismissed: false,
    eventFrequency: "normal",

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
    // Layer 1 — Trial Realms
    activeTrialRealm: null,
    trialRealmState: {},
    trialRealmsCompleted: {},
    trialRealmBestTimes: {}, // FEATURE 1 — local leaderboard (no login)
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
    // Layer 4 — Sacred Grid (5×4 = 20 cells)
    worldGrid: Array(20).fill(null),
    worldGridSeeds: Array(20).fill(null),
    // FEATURE 4 — Natural Disasters
    disasterTimer: 90,
    lastDisasterCell: null,
    lastDisasterAt: 0,
    // Layer 5 — Heresy Web (8×4 = 32 follower cells)
    followerGrid: makeInitialFollowerGrid(),
    heresySpreadTimer: 10,
    heresySeedTimer: 30,            // seed first heretic after 30s if grid is all-faithful
    heresyThresholdsSeeded: {},     // tracks 25/50/75 threshold seeding (per-run)
    // FEATURE 5 — Prophets (max 2 at a time)
    prophets: [],
    prophetConvertTimer: 10,
    // Layer 6 — Dimension Engine (3 parallel dimensions)
    dimensions: makeInitialDimensions(),
    dimensionRiftTimer: 60,

    // ===== FEATURE ENHANCEMENTS (L7–L10) =====
    // FEATURE 8 — Amplifiers (max 3 at a time)
    amplifiers: [],
    // FEATURE 9 — Temporal Storms (per-battle)
    temporalStorms: {},
    // FEATURE 10 — Forbidden Words (paradox counter)
    universeParadox: 0,

    // ===== BACKGROUND-SIMULATION =====
    // Base game abstracted into passive Divinity generation after first prestige.
    peakProductionRate: 0,        // best per-second total production ever (META)
    backgroundSimulations: 0,     // COMPUTED each tick: (3 + starsLit) × simMult (cached for display)
    divinityFromBackground: 0,    // lifetime Divinity from background sims (META, display only)
    epFromBackground: 0,          // lifetime EP from background sims (META, display only)
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
        const relics = relicBonus(s.equippedRelics || {});
        const cores = logicCoreBonus(s.activeLogicCores || {});
        // Layer 7 — Omnipotence (creatures + legions + stance)
        const hybrids = legionBonus(s.creatures || [], s.legions || [], s.activeOmnipotenceStance);
        // Layer 8 — Divinity (alliances with minor gods)
        const chanBonus = prayerChannelBonus(s.prayerChannelLevels || {});
        const maskBonus = divineMaskBonus(s.activeDivineMask);
        const polarityBonus = worshipPolarityBonus(s.activeWorshipPolarity);
        const allianceB = allianceBonus(s.alliances || {}, s.minorGods || MINOR_GODS);
        // Layer 9 — Infinity (divine fragments — permanent power boost per Old God defeated)
        const echoB = echoBonus(s.purchasedEchoes || {});
        const forkB = forkBonus(s.resolvedForks || {});
        const debtB = activeDebtBonus(s.takenFutureDebts || {}, s.repaidFutureDebts || {});
        const fragmentB = divineFragmentBonus(s.divineFragments || 0);
        // Layer 10 — Eternity (universe rules + kept gods + cosmic boon)
        const testB = testamentClauseBonus(s.purchasedTestamentClauses || {});
        const canonB = canonizationBonus(s.activeCanonizations || {});
        const weaveB = permanenceWeaveBonus(s.activePermanenceWeaves || {});
        const universeB = universeSlotBonus(s.universeRules || Array(UNIVERSE_SLOTS.length).fill(null));
        // LAYER UPGRADE — universe_foundation: +25% per level (max 4) to all universe slot bonuses
        // (mutates the fresh object returned by universeSlotBonus — productionMult, capMult, popGrowthMult, epMult)
        const ufLvl = (s.upgrades?.universe_foundation as number) || 0;
        const ufMult = 1 + 0.25 * ufLvl;
        universeB.productionMult *= ufMult;
        universeB.capMult *= ufMult;
        universeB.popGrowthMult *= ufMult;
        universeB.epMult *= ufMult;
        const keptB = keptGodsBonus(s.keptGods || []);
        const cosmicBoon = cosmicBoonBonus(s.cosmicBoonStacks || 0);

        // L4 FIX — Sacred Grid tile bonuses (were display-only, now applied to production).
        // Each placed tile gives +5% production. Mountains also give +5% capacity (sturdy).
        const gridTiles = (s.worldGrid || []).filter((t) => t !== null);
        const sacredGridProdBonus = gridTiles.length * 0.05;  // +5% per tile
        const sacredGridCapBonus = gridTiles.filter((t) => t === "mountain").length * 0.05;  // +5% cap per mountain

        // TRIALS-7 — Layer 1 trial realm rewards (permanent bonuses from completed realms)
        const trialReward = trialRealmRewardBonus(s.trialRealmsCompleted || {});
        // Late Bloom: +25% pop growth only when current population < 50
        const lateBloomPopBonus =
          (s.trialRealmsCompleted?.realm_late_bloom && s.population < 50) ? 0.25 : 0;

        const layerProdBonus =
          constB.productionMult +
          foresight.productionMult + route.productionMult + ritualProd +
          wProd + dLaw.productionMult + wMode.productionMult + hResp +
          relics.productionMult + cores.productionMult +
          hybrids.productionMult + chanBonus.productionMult + maskBonus.productionMult +
          polarityBonus.productionMult + allianceB.productionMult +
          echoB.productionMult + forkB.productionMult + debtB.productionMult +
          fragmentB.productionMult + testB.productionMult + canonB.productionMult +
          weaveB.productionMult + universeB.productionMult + keptB.productionMult + cosmicBoon +
          sacredGridProdBonus +  // L4 Sacred Grid tile bonus
          trialReward.prodMult;
        const layerCapBonus =
          constB.capMult +
          foresight.capMult + route.capMult + ritualCap + wCap +
          dLaw.capMult + relics.capMult + cores.capMult +
          hybrids.capMult + chanBonus.capMult + maskBonus.capMult +
          polarityBonus.capMult + allianceB.capMult +
          echoB.capMult + forkB.capMult + debtB.capMult +
          fragmentB.capMult + testB.capMult + canonB.capMult +
          weaveB.capMult + universeB.capMult + keptB.capMult +
          sacredGridCapBonus +  // L4 Sacred Grid mountain capacity bonus
          trialReward.capMult;
        const layerPopBonus =
          constB.popGrowthMult +
          foresight.popGrowthMult + route.popGrowthMult + ritualPop + wPop +
          dLaw.popGrowthMult + relics.popGrowthMult +
          hybrids.popGrowthMult + chanBonus.popGrowthMult + maskBonus.popGrowthMult +
          polarityBonus.popGrowthMult + allianceB.popGrowthMult +
          echoB.popGrowthMult + forkB.popGrowthMult + debtB.popGrowthMult +
          fragmentB.popGrowthMult + testB.popGrowthMult + canonB.popGrowthMult +
          weaveB.popGrowthMult + universeB.popGrowthMult + keptB.popGrowthMult +
          trialReward.popMult + lateBloomPopBonus;

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

        // Apply: overclock multiplies layer bonuses (foresight, ritual, relics, etc.) by 2
        const layerProdBonusApplied = layerProdBonus * (overclockActive ? 2 : 1);
        // Surge multiplies total production output (after layer bonus & miracle)
        const surgeMult = surgeActive ? 3 : 1;
        const divineComboMult = divineComboActive ? 1.5 : 1;
        // REBUILD L1 — Realm of Swiftness: 5× production while realm is active
        const realmSwiftnessActive = s.activeTrialRealm === "realm_swiftness";
        const realmSwiftnessMult = realmSwiftnessActive ? 5 : 1;
        autoMult *= (1 + layerProdBonusApplied) * (miracleDouble ? 2 : 1) * surgeMult * divineComboMult * universalBoostMult * realmSwiftnessMult;

        const techMult = techMultiplier(s, "production");
        const capBoostLvl = s.upgrades["expansive_vaults"] || 0;
        let capMult = 1 + capBoostLvl * 0.20;
        capMult *= (1 + layerCapBonus);
        if (challengeDebuff.capMult !== undefined) capMult *= challengeDebuff.capMult;
        const hasAutoBalancer = (s.upgrades["auto_balancer"] || 0) > 0;

        // Archetype bonus
        const archetype = s.lockedArchetype ? ARCHETYPE_MAP[s.lockedArchetype] : null;
        const archAllMult = archetype?.bonus.allProductionMult || 0;
        const archPopMult = archetype?.bonus.populationGrowthMult || 0;
        const archCapMult = archetype?.bonus.capMult || 0;

        const resources = { ...s.resources };
        let capacities = recomputeCapacitiesFresh(s, capMult + archCapMult);

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
          if (!manuallyEnabled && !hasAutoBalancer) continue;

          // Cap-aware logic: if all output resources are at cap, idle the system
          // (don't produce, don't consume upkeep — no waste)
          const outputsCapped = Object.keys(sys.produces).length > 0 &&
            Object.keys(sys.produces).every((r) => {
              const cap = capacities[r] || 0;
              return (resources[r] || 0) >= cap - 0.01;
            });

          if (outputsCapped) {
            // System idles — no production, no upkeep
            continue;
          }

          const stageMult = sys.stage === STAGES[s.stageIndex].id ? 1 : 0.5;
          const mult = autoMult * techMult * stageMult * (1 + archAllMult);

          // Per-resource archetype bonus
          const produces = sys.produces as Record<string, number>;
          for (const [r, v] of Object.entries(produces)) {
            const archResBonus = archetype?.bonus.productionMult?.[r] || 0;
            const rate = v * count * mult * (1 + archResBonus);
            resources[r] = (resources[r] || 0) + rate * realDt;
            totalProductionRate += rate; // accumulate per-second rate (pre-cap-clamp)
          }
          // Upkeep
          if (sys.upkeep) {
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

        // Population growth with progress bar
        // QUICK WIN 1: 3× faster base rate (0.015 → 0.045) — waiting for pop is the #1 fun killer
        let popGrowthRate = 0.045; // base per second
        const happiness = resources.happiness || 50;
        popGrowthRate *= (1 + (happiness - 40) / 200);
        popGrowthRate *= (1 + archPopMult);
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
        if (["creature", "tribal", "civilization", "empire"].includes(curStage.id)) {
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

        // ---- Auto-Builder: every 8s, buy cheapest affordable system ----
        // Player MUST purchase the auto_system_buyer shop upgrade (8 EP) to enable.
        const hasAutoSystemBuyer = (s.upgrades["auto_system_buyer"] || 0) > 0;
        const systemBuyerInterval = 8;
        if (hasAutoSystemBuyer && newTime - (autoTimers.system || 0) >= systemBuyerInterval) {
          const stageId = STAGES[s.stageIndex].id;
          const totalSystemsNow = Object.values(ownedSystems).reduce((a, b) => a + b, 0);
          const maxSystemsCap = challengeDebuff.maxSystems ?? Infinity;
          const canExceedCap = totalSystemsNow < maxSystemsCap;
          const disableMilitary = !!challengeDebuff.disableMilitary;

          const candidates = SYSTEMS.filter((sys) => sys.stage === stageId)
            .map((sys) => {
              const owned = ownedSystems[sys.id] || 0;
              if (sys.maxOwned && owned >= sys.maxOwned) return null;
              if (sys.requiredTech && !technologies[sys.requiredTech]) return null;
              if (disableMilitary && sys.category === "Military") return null;
              const cost = systemCost(sys, owned, costReduction);
              const scaledCost: Record<string, number> = {};
              let totalCost = 0;
              let canAfford = true;
              for (const [r, v] of Object.entries(cost)) {
                const scaled = Math.ceil((v as number) * challengeCostMult);
                scaledCost[r] = scaled;
                totalCost += scaled;
                if ((resources[r] || 0) < scaled) canAfford = false;
              }
              return { sys, scaledCost, totalCost, canAfford };
            })
            .filter((x): x is NonNullable<typeof x> => x !== null && x.canAfford);

          if (canExceedCap && candidates.length > 0) {
            candidates.sort((a, b) => a.totalCost - b.totalCost);
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
        const hasAutoTechBuyer = (s.upgrades["auto_tech_buyer"] || 0) > 0;
        const techBuyerInterval = 12;
        if (hasAutoTechBuyer && newTime - (autoTimers.tech || 0) >= techBuyerInterval) {
          const stageId = STAGES[s.stageIndex].id;
          const disableTech = !!challengeDebuff.disableTech;
          const disableMilitary = !!challengeDebuff.disableMilitary;

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
                return { t, scaledCost, totalCost, canAfford };
              })
              .filter((x): x is NonNullable<typeof x> => x !== null && x.canAfford);

            if (techCandidates.length > 0) {
              techCandidates.sort((a, b) => a.totalCost - b.totalCost);
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
        if (hasAutoEvolver && newTime - (autoTimers.evolve || 0) >= 2) {
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
        let activeEvent = s.activeEvent;
        let eventCooldown = (s.eventCooldown || 0) - realDt;
        if (eventCooldown < 0) eventCooldown = 0;
        const eventFreq = s.eventFrequency || "normal";
        const eventsAllowed = !challengeDebuff.disableEvents;
        const isL2Plus = !!(s.unlockedLayers?.enlightenment);
        if (eventFreq !== "off" && eventsAllowed && !activeEvent && !activePopup && eventCooldown === 0 && !isL2Plus) {
          const stageId = STAGES[s.stageIndex].id;
          const possible = eventsForStage(stageId, newTime);
          if (possible.length > 0) {
            const totalWeight = possible.reduce((sum, e) => sum + e.weight, 0);
            const roll = Math.random() * totalWeight;
            let cum = 0;
            for (const ev of possible) {
              cum += ev.weight;
              if (roll < cum) {
                activeEvent = ev.id;
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
              // Enlightenment unlocks at 3 challenges completed (not 10)
              const totalChallengesCompleted = countChallengesCompleted(completedChallenges);
              // NEW L1→L2 gate: 5+ trial realms completed OR 3+ old challenges completed (either works)
              const trialRealmsCompletedCount = Object.values(s.trialRealmsCompleted || {}).filter(Boolean).length;
              if (!unlockedLayers.enlightenment &&
                  (totalChallengesCompleted >= 3 || trialRealmsCompletedCount >= TRIAL_REALMS_REQUIRED_FOR_LAYER_2)) {
                unlockedLayers = { ...unlockedLayers, enlightenment: true };
                setTimeout(() => get().addToLog(`Trial progress threshold reached (${trialRealmsCompletedCount}/${TRIAL_REALMS_REQUIRED_FOR_LAYER_2} realms, or 3+ old challenges). Enlightenment layer unlocked.`), 0);
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
        let activeTemporaryRituals = s.activeTemporaryRituals || {};
        let miracleTimers = s.miracleTimers || {};
        const activeScripts = s.activeScripts || {};
        let scriptTimers = s.scriptTimers || {};
        const activeLogicCores = s.activeLogicCores || {};
        let logicCoreTimers = s.logicCoreTimers || {};
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
        // Layer 1 — Trial of Fortune: every 120s, +20% of capacity to 2 random primary resources
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
        // Layer 5 — Heresy Surge: every 90s (after apotheosis unlocked), +10 heresy (BAD event)
        if (unlockedLayers.apotheosis) {
          if ((layerEventTimers.heresy_surge || 0) === 0) {
            layerEventTimers.heresy_surge = newTime;
          } else if (newTime - layerEventTimers.heresy_surge >= 90) {
            layerEventTimers.heresy_surge = newTime;
            heresy = Math.min(100, heresy + 10);
            setTimeout(() => get().addToLog("🔥 Heresy Surge! +10 heresy accrued — the flock doubts."), 0);
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

        // Layer 5 — Faith generation, heresy accrual (Apotheosis)
        if (unlockedLayers.apotheosis) {
          faith += wMode.faithPerSec * realDt;
          // Heresy gain = worship mode's heresyPerSec × divine law heresy mult × heresy response mult
          const heresyGain = wMode.heresyPerSec * dLaw.heresyRateMult * heresyRateMult(activeHeresyResponse);
          if (heresyGain > 0) {
            heresy = Math.min(100, heresy + heresyGain * realDt);
            if (heresy >= 100) {
              // Run ends — force prestige (deferred to avoid mid-set race)
              heresy = 100;
              setTimeout(() => {
                get().addToLog("Heresy has reached 100. The god is cast down — the run ends in ruin.");
                get().triggerPrestige();
              }, 0);
            }
          }
        }

        // Layer 6 — Logic Core automation (Singularity)
        if (unlockedLayers.singularity) {
          // Architect Core: every 10s, buy cheapest affordable system (faster than Auto-Builder)
          if (activeLogicCores["core_architect"] && newTime - (logicCoreTimers["core_architect"] || 0) >= 10) {
            logicCoreTimers = { ...logicCoreTimers, core_architect: newTime };
            const stageId = STAGES[s.stageIndex].id;
            const candidates = SYSTEMS.filter((sys) => sys.stage === stageId)
              .map((sys) => {
                const owned = ownedSystems[sys.id] || 0;
                if (sys.maxOwned && owned >= sys.maxOwned) return null;
                if (sys.requiredTech && !technologies[sys.requiredTech]) return null;
                const cost = systemCost(sys, owned, costReduction);
                const scaledCost: Record<string, number> = {};
                let totalCost = 0;
                let canAfford = true;
                for (const [r, v] of Object.entries(cost)) {
                  const scaled = Math.ceil((v as number) * challengeCostMult);
                  scaledCost[r] = scaled;
                  totalCost += scaled;
                  if ((resources[r] || 0) < scaled) canAfford = false;
                }
                return { sys, scaledCost, totalCost, canAfford };
              })
              .filter((x): x is NonNullable<typeof x> => x !== null && x.canAfford);
            if (candidates.length > 0) {
              candidates.sort((a, b) => a.totalCost - b.totalCost);
              const pick = candidates[0];
              for (const [r, v] of Object.entries(pick.scaledCost)) {
                resources[r] -= v;
              }
              ownedSystems = { ...ownedSystems, [pick.sys.id]: (ownedSystems[pick.sys.id] || 0) + 1 };
              if (systemEnabled[pick.sys.id] === undefined) {
                systemEnabled = { ...systemEnabled, [pick.sys.id]: true };
              }
              totalSystemsBuilt += 1;
            }
          }

          // Sage Core: every 15s, research cheapest affordable tech (faster than Auto-Researcher)
          if (activeLogicCores["core_sage"] && newTime - (logicCoreTimers["core_sage"] || 0) >= 15) {
            logicCoreTimers = { ...logicCoreTimers, core_sage: newTime };
            const stageId = STAGES[s.stageIndex].id;
            const techCands = TECHS.filter((t) => t.stage === stageId && !technologies[t.id])
              .map((t) => {
                if (t.requires) {
                  for (const req of t.requires) {
                    if (!technologies[req]) return null;
                  }
                }
                const cost = t.cost as Record<string, number>;
                let canAfford = true;
                let totalCost = 0;
                for (const [r, v] of Object.entries(cost)) {
                  const scaled = Math.ceil(v * challengeCostMult);
                  totalCost += scaled;
                  if ((resources[r] || 0) < scaled) canAfford = false;
                }
                return { t, totalCost, canAfford };
              })
              .filter((x): x is NonNullable<typeof x> => x !== null && x.canAfford);
            if (techCands.length > 0) {
              techCands.sort((a, b) => a.totalCost - b.totalCost);
              const pick = techCands[0];
              for (const [r, v] of Object.entries(pick.t.cost)) {
                const scaled = Math.ceil((v as number) * challengeCostMult);
                resources[r] = Math.max(0, resources[r] - scaled);
              }
              technologies = { ...technologies, [pick.t.id]: true };
              totalTechResearched += 1;
            }
          }

          // Chronicler Core: every 60s, perform cheapest affordable offering (Layer 3 helper)
          if (activeLogicCores["core_chronicler"] && unlockedLayers.transcendence && newTime - (logicCoreTimers["core_chronicler"] || 0) >= 60) {
            logicCoreTimers = { ...logicCoreTimers, core_chronicler: newTime };
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
            }
          }
        }

        // ---- Layer 7 — Omnipotence (Bio-engineering): genetic instability accrual ----
        let instability = s.instability || 0;
        let peakInstability = s.peakInstability || 0;
        if (unlockedLayers.omnipotence) {
          const rate = effectiveInstabilityRate(s.creatures || [], s.legions || [], s.activeOmnipotenceStance);
          // LAYER UPGRADE — genetic_stabilizer: -25% per level (max 4 → no instability gain)
          const gsLvl = (s.upgrades?.genetic_stabilizer as number) || 0;
          const stabMult = Math.max(0, 1 - 0.25 * gsLvl);
          const effectiveRate = rate * stabMult;
          if (effectiveRate > 0) {
            instability = Math.min(100, instability + effectiveRate * realDt);
            peakInstability = Math.max(peakInstability, instability);
            if (instability >= 100) {
              instability = 100;
              peakInstability = 100;
              setTimeout(() => {
                get().addToLog("Genetic instability has reached 100. Your creatures go rogue — the run ends.");
                get().triggerPrestige();
              }, 0);
            }
          }
        }
        const geneticInstability = instability; // alias

        // ---- Layer 8 — Divinity (layer): Prayer generation ----
        let prayer = s.prayer || 0;
        if (unlockedLayers.divinity) {
          const pRate = prayerRate(population, s.prayerChannelLevels || {}, s.activeDivineMask, s.activeWorshipPolarity);
          if (pRate > 0) prayer += pRate * realDt;
        }

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
        // Layer 5 (Apotheosis): authored at least 1 world config
        if (unlockedLayers.genesis && !unlockedLayers.apotheosis) {
          if (hasAuthoredWorld(s.authoredWorlds || [])) {
            unlockedLayers = { ...unlockedLayers, apotheosis: true };
            setTimeout(() => get().addToLog("First world authored. Apotheosis layer unlocked."), 0);
          }
        }
        // Layer 6 (Singularity): enacted 3+ divine laws
        if (unlockedLayers.apotheosis && !unlockedLayers.singularity) {
          if (hasEnactedThreeLaws(s.enactedDivineLaws || {})) {
            unlockedLayers = { ...unlockedLayers, singularity: true };
            setTimeout(() => get().addToLog("3 Divine Laws enacted. Singularity layer unlocked."), 0);
          }
        }
        // Layer 7 (Omnipotence): 3+ active logic cores
        const activeCoreCount = Object.values(s.activeLogicCores || {}).filter(Boolean).length;
        if (unlockedLayers.singularity && !unlockedLayers.omnipotence) {
          if (activeCoreCount >= 3) {
            unlockedLayers = { ...unlockedLayers, omnipotence: true };
            setTimeout(() => get().addToLog("3 Logic Cores activated. Omnipotence layer unlocked."), 0);
          }
        }
        // Layer 8 (Divinity): 2+ alliances formed
        if (unlockedLayers.omnipotence && !unlockedLayers.divinity) {
          if (isOmnipotenceComplete(peakInstability)) {
            unlockedLayers = { ...unlockedLayers, divinity: true };
            setTimeout(() => get().addToLog("Peak instability reached 80. Divine Alliance layer unlocked."), 0);
          }
        }
        // Layer 9 (Infinity): 2+ alliances formed (Divine Alliance complete)
        if (unlockedLayers.divinity && !unlockedLayers.infinity) {
          if (isDivinityComplete(s.alliances || {})) {
            unlockedLayers = { ...unlockedLayers, infinity: true };
            setTimeout(() => get().addToLog("Two alliances forged. Divine War layer unlocked."), 0);
          }
        }
        // Layer 10 (Eternity): all 3 Old Gods defeated
        if (unlockedLayers.infinity && !unlockedLayers.eternity) {
          if (isInfinityComplete(s.oldGodBattles || {})) {
            unlockedLayers = { ...unlockedLayers, eternity: true };
            setTimeout(() => get().addToLog("All 3 Old Gods defeated. Ascension layer unlocked."), 0);
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

        // ===== REBUILD: LAYERS 1-6 UNIQUE GAMEPLAY LOOPS — tick processing =====
        // Layer 1 — Trial Realms: progress the active realm's mini-game
        let activeTrialRealm = s.activeTrialRealm;
        // FEATURE 1 — capture the original realm ID for safe indexing (activeTrialRealm may be reassigned to null on auto-close)
        const tickRealmId = s.activeTrialRealm;
        let trialRealmState = { ...(s.trialRealmState || {}) };
        let trialRealmsCompleted = { ...(s.trialRealmsCompleted || {}) };
        // FEATURE 1 — local best-time leaderboard (no login required)
        let trialRealmBestTimes = { ...(s.trialRealmBestTimes || {}) };
        if (activeTrialRealm && PLAYABLE_REALM_IDS.includes(activeTrialRealm)) {
          const st = { ...(trialRealmState[activeTrialRealm] || makeDefaultRealmState(activeTrialRealm)) };
          // Ensure startedAt is set (migration safety)
          if (!st.startedAt) st.startedAt = newTime - realDt;
          switch (activeTrialRealm) {
            case "realm_growth": {
              st.energy = Math.min(100, (st.energy || 0) + REALM_GROWTH_PASSIVE_FILL_PER_SEC * realDt);
              break;
            }
            case "realm_discontent": {
              // Happiness oscillates as a sine wave centered on 50, amplitude 35, period 12s
              st.timer = (st.timer || 0) + realDt;
              const phase = (st.timer / 12) * Math.PI * 2;
              const target = 50 + Math.sin(phase) * 35;
              // Drift toward target slowly
              st.happiness = (st.happiness || 50) + (target - (st.happiness || 50)) * 0.1 * realDt;
              st.happiness = Math.max(0, Math.min(100, st.happiness));
              // Survival timer only progresses while happiness is above the threshold
              st.survivedTime = (st.survivedTime || 0) + ((st.happiness || 0) >= REALM_DISCONTENT_HAPPINESS_THRESHOLD ? realDt : 0);
              if ((st.happiness || 0) < REALM_DISCONTENT_HAPPINESS_THRESHOLD) {
                st.happinessBelowThreshold = true;
              }
              // Check completion: survived ≥ 90s AND gold ≥ 200
              if ((st.survivedTime || 0) >= REALM_DISCONTENT_SURVIVE_SECONDS && (st.gold || 0) >= REALM_DISCONTENT_GOLD_GOAL && !st.completed) {
                st.completed = true;
                trialRealmsCompleted[tickRealmId!] = true;
                // FEATURE 1 — record best time
                const completionTime = Math.max(0, newTime - (st.startedAt || newTime));
                const prevBest = trialRealmBestTimes[tickRealmId!];
                if (prevBest === undefined || completionTime < prevBest) {
                  trialRealmBestTimes[tickRealmId!] = completionTime;
                }
                // Check L2 unlock after trial completion
                const trialsDone = Object.values(trialRealmsCompleted).filter(Boolean).length;
                if (trialsDone >= TRIAL_REALMS_REQUIRED_FOR_LAYER_2 && !unlockedLayers.enlightenment) {
                  unlockedLayers = { ...unlockedLayers, enlightenment: true };
                  setTimeout(() => get().addToLog(`Trial progress threshold reached (${trialsDone}/${TRIAL_REALMS_REQUIRED_FOR_LAYER_2} realms). Enlightenment layer unlocked.`), 0);
                }
                setTimeout(() => get().addToLog("Realm of Discontent conquered! Permanent reward granted."), 0);
              }
              break;
            }
            case "realm_swiftness": {
              st.timeLeft = Math.max(0, (st.timeLeft || REALM_SWIFTNESS_TIME_LIMIT) - realDt);
              if (st.timeLeft <= 0 && !st.completed) {
                // Time expired; failed unless we already reached Galactic
                if (!st.reachedGalactic) {
                  setTimeout(() => get().addToLog("Realm of Swiftness: time expired — run failed."), 0);
                  activeTrialRealm = null;
                }
              }
              if (s.stageIndex >= STAGES.length - 1) {
                st.reachedGalactic = true;
                if (!st.completed) {
                  st.completed = true;
                  trialRealmsCompleted[tickRealmId!] = true;
                  // FEATURE 1 — record best time (faster = better)
                  const completionTime = Math.max(0, newTime - (st.startedAt || newTime));
                  const prevBest = trialRealmBestTimes[tickRealmId!];
                  if (prevBest === undefined || completionTime < prevBest) {
                    trialRealmBestTimes[tickRealmId!] = completionTime;
                  }
                  // Check L2 unlock after trial completion
                  const trialsDone = Object.values(trialRealmsCompleted).filter(Boolean).length;
                  if (trialsDone >= TRIAL_REALMS_REQUIRED_FOR_LAYER_2 && !unlockedLayers.enlightenment) {
                    unlockedLayers = { ...unlockedLayers, enlightenment: true };
                    setTimeout(() => get().addToLog(`Trial progress threshold reached (${trialsDone}/${TRIAL_REALMS_REQUIRED_FOR_LAYER_2} realms). Enlightenment layer unlocked.`), 0);
                  }
                  setTimeout(() => get().addToLog("Realm of Swiftness conquered! +15% all production speed."), 0);
                }
              }
              break;
            }
            // TRIALS-7 — 7 newly playable realm tick cases
            case "realm_famine": {
              // Each resource decays slowly. Player pumps forward (A→B→C→A) to
              // refill whichever is low. Survival timer only progresses while
              // all three are at/above REALM_FAMINE_THRESHOLD.
              st.timer = (st.timer || 0) + realDt;
              const decay = REALM_FAMINE_DECAY_PER_SEC * realDt;
              st.a = Math.max(0, Math.min(100, (st.a || 0) - decay));
              st.b = Math.max(0, Math.min(100, (st.b || 0) - decay));
              st.c = Math.max(0, Math.min(100, (st.c || 0) - decay));
              // Survival timer only progresses while all three are at/above the threshold
              const allAbove =
                (st.a || 0) >= REALM_FAMINE_THRESHOLD &&
                (st.b || 0) >= REALM_FAMINE_THRESHOLD &&
                (st.c || 0) >= REALM_FAMINE_THRESHOLD;
              st.survivedTime = (st.survivedTime || 0) + (allAbove ? realDt : 0);
              if ((st.survivedTime || 0) >= REALM_FAMINE_SURVIVE_SECONDS && !st.completed) {
                st.completed = true;
                trialRealmsCompleted[tickRealmId!] = true;
                const completionTime = Math.max(0, newTime - (st.startedAt || newTime));
                const prevBest = trialRealmBestTimes[tickRealmId!];
                if (prevBest === undefined || completionTime < prevBest) {
                  trialRealmBestTimes[tickRealmId!] = completionTime;
                }
                const trialsDone = Object.values(trialRealmsCompleted).filter(Boolean).length;
                if (trialsDone >= TRIAL_REALMS_REQUIRED_FOR_LAYER_2 && !unlockedLayers.enlightenment) {
                  unlockedLayers = { ...unlockedLayers, enlightenment: true };
                  setTimeout(() => get().addToLog(`Trial progress threshold reached (${trialsDone}/${TRIAL_REALMS_REQUIRED_FOR_LAYER_2} realms). Enlightenment layer unlocked.`), 0);
                }
                setTimeout(() => get().addToLog("Realm of Famine conquered! +15% food & water production permanently."), 0);
              }
              break;
            }
            case "realm_ignorance": {
              // Passive tick — no time pressure; completion handled by buy-node action.
              // No-op: progress happens when player clicks "Unlock" on each tech node.
              break;
            }
            case "realm_stagnation": {
              // Production rate = (lvl1 × lvl2 × lvl3 × lvl4) / 16 per sec
              const lv = st.levels || [1, 1, 1, 1];
              const rate = (lv[0] * lv[1] * lv[2] * lv[3]) / REALM_STAGNATION_RATE_DIVISOR;
              st.goods = (st.goods || 0) + rate * realDt;
              st.produced = (st.produced || 0) + rate * realDt;
              if ((st.produced || 0) >= REALM_STAGNATION_GOODS_GOAL && !st.completed) {
                st.completed = true;
                trialRealmsCompleted[tickRealmId!] = true;
                const completionTime = Math.max(0, newTime - (st.startedAt || newTime));
                const prevBest = trialRealmBestTimes[tickRealmId!];
                if (prevBest === undefined || completionTime < prevBest) {
                  trialRealmBestTimes[tickRealmId!] = completionTime;
                }
                const trialsDone = Object.values(trialRealmsCompleted).filter(Boolean).length;
                if (trialsDone >= TRIAL_REALMS_REQUIRED_FOR_LAYER_2 && !unlockedLayers.enlightenment) {
                  unlockedLayers = { ...unlockedLayers, enlightenment: true };
                  setTimeout(() => get().addToLog(`Trial progress threshold reached (${trialsDone}/${TRIAL_REALMS_REQUIRED_FOR_LAYER_2} realms). Enlightenment layer unlocked.`), 0);
                }
                setTimeout(() => get().addToLog("Realm of Stagnation conquered! +10% production at every stage permanently."), 0);
              }
              break;
            }
            case "realm_weakness": {
              // Auto-start first wave
              if ((st.wave || 0) === 0) {
                st.wave = 1;
                st.enemies = REALM_WEAKNESS_ENEMY_BASE + 1 * REALM_WEAKNESS_ENEMY_PER_WAVE;
                st.waveTimer = REALM_WEAKNESS_WAVE_DURATION;
              }
              if ((st.wave || 0) > 0 && !st.completed && !st.failed) {
                // Towers kill enemies at REALM_WEAKNESS_TOWER_KILL_RATE per tower per sec
                const kills = (st.towers || 0) * REALM_WEAKNESS_TOWER_KILL_RATE * realDt;
                st.enemies = Math.max(0, (st.enemies || 0) - kills);
                st.waveTimer = Math.max(0, (st.waveTimer || 0) - realDt);
                if ((st.waveTimer || 0) <= 0) {
                  // Wave ends — leftover enemies damage the base
                  const leak = Math.floor(st.enemies || 0);
                  if (leak > 0) {
                    st.baseHp = Math.max(0, (st.baseHp || 100) - leak * REALM_WEAKNESS_LEAK_DAMAGE);
                  }
                  if ((st.baseHp || 0) <= 0) {
                    st.failed = true;
                    setTimeout(() => get().addToLog("Realm of Weakness: base destroyed — realm failed."), 0);
                    activeTrialRealm = null;
                    break;
                  }
                  // Reward & advance wave
                  st.military = (st.military || 0) + REALM_WEAKNESS_WAVE_REWARD;
                  st.wave = (st.wave || 0) + 1;
                  if ((st.wave || 0) > REALM_WEAKNESS_WAVE_COUNT) {
                    st.completed = true;
                    trialRealmsCompleted[tickRealmId!] = true;
                    const completionTime = Math.max(0, newTime - (st.startedAt || newTime));
                    const prevBest = trialRealmBestTimes[tickRealmId!];
                    if (prevBest === undefined || completionTime < prevBest) {
                      trialRealmBestTimes[tickRealmId!] = completionTime;
                    }
                    const trialsDone = Object.values(trialRealmsCompleted).filter(Boolean).length;
                    if (trialsDone >= TRIAL_REALMS_REQUIRED_FOR_LAYER_2 && !unlockedLayers.enlightenment) {
                      unlockedLayers = { ...unlockedLayers, enlightenment: true };
                      setTimeout(() => get().addToLog(`Trial progress threshold reached (${trialsDone}/${TRIAL_REALMS_REQUIRED_FOR_LAYER_2} realms). Enlightenment layer unlocked.`), 0);
                    }
                    setTimeout(() => get().addToLog("Realm of Weakness conquered! +15% military power permanently."), 0);
                  } else {
                    // Start next wave (uses new st.wave value)
                    st.enemies = REALM_WEAKNESS_ENEMY_BASE + (st.wave || 1) * REALM_WEAKNESS_ENEMY_PER_WAVE;
                    st.waveTimer = REALM_WEAKNESS_WAVE_DURATION;
                  }
                }
              }
              break;
            }
            case "realm_late_bloom": {
              // Geometric growth: food rate = pop² × coeff; cost per pop = pop × COST_PER_POP
              const pop = Math.max(1, st.pop || 1);
              const rate = pop * pop * REALM_LATE_BLOOM_PROD_COEFF;
              st.food = (st.food || 0) + rate * realDt;
              let guard = 0;
              while ((st.food || 0) >= pop * REALM_LATE_BLOOM_COST_PER_POP && (st.pop || 0) < REALM_LATE_BLOOM_POP_GOAL && guard < 1000) {
                st.food = (st.food || 0) - pop * REALM_LATE_BLOOM_COST_PER_POP;
                st.pop = (st.pop || 1) + 1;
                guard++;
              }
              if ((st.pop || 0) >= REALM_LATE_BLOOM_POP_GOAL && !st.completed) {
                st.completed = true;
                trialRealmsCompleted[tickRealmId!] = true;
                const completionTime = Math.max(0, newTime - (st.startedAt || newTime));
                const prevBest = trialRealmBestTimes[tickRealmId!];
                if (prevBest === undefined || completionTime < prevBest) {
                  trialRealmBestTimes[tickRealmId!] = completionTime;
                }
                const trialsDone = Object.values(trialRealmsCompleted).filter(Boolean).length;
                if (trialsDone >= TRIAL_REALMS_REQUIRED_FOR_LAYER_2 && !unlockedLayers.enlightenment) {
                  unlockedLayers = { ...unlockedLayers, enlightenment: true };
                  setTimeout(() => get().addToLog(`Trial progress threshold reached (${trialsDone}/${TRIAL_REALMS_REQUIRED_FOR_LAYER_2} realms). Enlightenment layer unlocked.`), 0);
                }
                setTimeout(() => get().addToLog("Realm of Late Bloom conquered! +25% population growth on slow starts (under 50 pop)."), 0);
              }
              break;
            }
            case "realm_purity": {
              // Each built system drains the pool passively
              const drain = (st.systemsBuilt || 0) * REALM_PURITY_DRAIN_PER_SYSTEM * realDt;
              st.pool = Math.max(0, (st.pool || 0) - drain);
              if ((st.pool || 0) <= 0 && !st.completed && !st.failed) {
                st.failed = true;
                setTimeout(() => get().addToLog("Realm of Purity: shared pool exhausted — realm failed."), 0);
                activeTrialRealm = null;
              }
              if ((st.systemsBuilt || 0) >= REALM_PURITY_SYSTEMS_GOAL && !st.completed) {
                st.completed = true;
                trialRealmsCompleted[tickRealmId!] = true;
                const completionTime = Math.max(0, newTime - (st.startedAt || newTime));
                const prevBest = trialRealmBestTimes[tickRealmId!];
                if (prevBest === undefined || completionTime < prevBest) {
                  trialRealmBestTimes[tickRealmId!] = completionTime;
                }
                const trialsDone = Object.values(trialRealmsCompleted).filter(Boolean).length;
                if (trialsDone >= TRIAL_REALMS_REQUIRED_FOR_LAYER_2 && !unlockedLayers.enlightenment) {
                  unlockedLayers = { ...unlockedLayers, enlightenment: true };
                  setTimeout(() => get().addToLog(`Trial progress threshold reached (${trialsDone}/${TRIAL_REALMS_REQUIRED_FOR_LAYER_2} realms). Enlightenment layer unlocked.`), 0);
                }
                setTimeout(() => get().addToLog("Realm of Purity conquered! +5% production (scaling reward) permanently."), 0);
              }
              break;
            }
            case "realm_ascetic": {
              // Essence accumulates passively: rate = BASE_RATE + stage
              const rate = REALM_ASCETIC_BASE_RATE + (st.stage || 0);
              st.essence = (st.essence || 0) + rate * realDt;
              // Completion handled by build-system action (each purchase advances the stage)
              if ((st.stage || 0) >= REALM_ASCETIC_STAGES && !st.completed) {
                st.completed = true;
                trialRealmsCompleted[tickRealmId!] = true;
                const completionTime = Math.max(0, newTime - (st.startedAt || newTime));
                const prevBest = trialRealmBestTimes[tickRealmId!];
                if (prevBest === undefined || completionTime < prevBest) {
                  trialRealmBestTimes[tickRealmId!] = completionTime;
                }
                const trialsDone = Object.values(trialRealmsCompleted).filter(Boolean).length;
                if (trialsDone >= TRIAL_REALMS_REQUIRED_FOR_LAYER_2 && !unlockedLayers.enlightenment) {
                  unlockedLayers = { ...unlockedLayers, enlightenment: true };
                  setTimeout(() => get().addToLog(`Trial progress threshold reached (${trialsDone}/${TRIAL_REALMS_REQUIRED_FOR_LAYER_2} realms). Enlightenment layer unlocked.`), 0);
                }
                setTimeout(() => get().addToLog("Realm of the Ascetic conquered! +12% production with constraints lifted."), 0);
              }
              break;
            }
          }
          // Auto-close realm if completed (Growth handled in the breakthrough action)
          if (st.completed && activeTrialRealm !== "realm_growth") {
            activeTrialRealm = null;
          }
          if (tickRealmId) trialRealmState[tickRealmId] = st;
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

        // Layer 4 — FEATURE 4 — Natural Disasters: every ~90s, 15% chance to destroy a random tile (not protected by a Mountain neighbor)
        let worldGrid = s.worldGrid ? s.worldGrid.slice() : Array(20).fill(null);
        let worldGridSeeds = s.worldGridSeeds ? s.worldGridSeeds.slice() : Array(20).fill(null);
        let disasterTimer = Math.max(0, (s.disasterTimer || 90) - realDt);
        let lastDisasterCell = s.lastDisasterCell ?? null;
        let lastDisasterAt = s.lastDisasterAt || 0;
        if (unlockedLayers.genesis && disasterTimer <= 0) {
          disasterTimer = 90;
          // LAYER UPGRADE — disaster_shield: -25% per level (max 4 → 0% chance)
          const dsLvl = (s.upgrades?.disaster_shield as number) || 0;
          const disasterChance = Math.max(0, 0.15 * (1 - 0.25 * dsLvl));
          // Roll disaster chance to destroy a random filled tile (excluding mountain-adjacent)
          if (Math.random() < disasterChance) {
            // Build list of vulnerable cells: filled tiles NOT adjacent to a Mountain
            const vulnerable: number[] = [];
            for (let i = 0; i < worldGrid.length; i++) {
              if (worldGrid[i] === null) continue;
              if (worldGrid[i] === "mountain") continue; // mountains are sturdy
              const row = Math.floor(i / 5);
              const col = i % 5;
              const neighbors = [
                col > 0 ? i - 1 : -1,
                col < 4 ? i + 1 : -1,
                row > 0 ? i - 5 : -1,
                row < 3 ? i + 5 : -1,
              ].filter((n) => n >= 0);
              const protectedByMountain = neighbors.some((n) => worldGrid[n] === "mountain");
              if (!protectedByMountain) vulnerable.push(i);
            }
            if (vulnerable.length > 0) {
              const target = vulnerable[Math.floor(Math.random() * vulnerable.length)];
              worldGrid[target] = null;
              lastDisasterCell = target;
              lastDisasterAt = newTime;
              setTimeout(() => get().addToLog(`🌋 Disaster! Tile on cell ${target + 1} was destroyed. Rebuild it (costs a tile from your supply).`), 0);
            }
          }
        }

        // Layer 5 — Heresy Web: spread every 10s (independent of the global heresy meter)
        let followerGrid = s.followerGrid ? s.followerGrid.slice() : makeInitialFollowerGrid();
        let heresySpreadTimer = (s.heresySpreadTimer || 10) - realDt;

        // HERETIC SEEDING — if there are 0 heretics in the grid, seed one every 30s.
        // Also seed extra heretics when global heresy crosses 25/50/75 thresholds (one-time per run).
        let heresySeedTimer = Math.max(0, (s.heresySeedTimer || 30) - realDt);
        let heresyThresholdsSeeded = { ...(s.heresyThresholdsSeeded || {}) };
        if (unlockedLayers.apotheosis) {
          // Threshold-based seeding (one-time per run per threshold)
          const heresyNow = s.heresy || 0;
          for (const threshold of [25, 50, 75]) {
            if (heresyNow >= threshold && !heresyThresholdsSeeded[String(threshold)]) {
              heresyThresholdsSeeded[String(threshold)] = true;
              const count = threshold === 25 ? 1 : threshold === 50 ? 2 : 3;
              const faithfulIndices = followerGrid
                .map((c, i) => (c.state === "faithful" ? i : -1))
                .filter((i) => i >= 0);
              for (let k = 0; k < count && faithfulIndices.length > 0; k++) {
                const pick = Math.floor(Math.random() * faithfulIndices.length);
                const idx = faithfulIndices.splice(pick, 1)[0];
                followerGrid[idx] = { ...followerGrid[idx], state: "heretical" };
              }
              setTimeout(() => get().addToLog(`😈 Heresy surges past ${threshold}! ${count} heretic(s) seeded in your flock.`), 0);
            }
          }
          // Timer-based seeding (every 30s if grid is all-faithful)
          if (heresySeedTimer <= 0) {
            heresySeedTimer = 30;
            const hereticCount = followerGrid.filter((c) => c.state === "heretical").length;
            if (hereticCount === 0) {
              const faithfulIndices = followerGrid
                .map((c, i) => (c.state === "faithful" ? i : -1))
                .filter((i) => i >= 0);
              if (faithfulIndices.length > 0) {
                const pick = faithfulIndices[Math.floor(Math.random() * faithfulIndices.length)];
                followerGrid[pick] = { ...followerGrid[pick], state: "heretical" };
                setTimeout(() => get().addToLog("😈 A whisper of doubt spreads through your flock. A heretic appears."), 0);
              }
            }
          }
        }

        if (unlockedLayers.apotheosis && heresySpreadTimer <= 0) {
          heresySpreadTimer = 10;
          // LAYER UPGRADE — heresy_ward: -30% spread chance per level (max 4 → 0% spread)
          const hwLvl = (s.upgrades?.heresy_ward as number) || 0;
          const spreadChance = Math.max(0, 1 - 0.30 * hwLvl);
          const next = followerGrid.map((c) => ({ ...c }));
          // Spread from each heretical cell to one random adjacent faithful cell
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
          followerGrid = next;
        }

        // FEATURE 5 — Prophets: every 10s, each prophet converts ALL adjacent heretics to faithful
        let prophets = (s.prophets || []).map((p) => ({ ...p }));
        let prophetConvertTimer = Math.max(0, (s.prophetConvertTimer || 10) - realDt);
        if (unlockedLayers.apotheosis && prophets.length > 0 && prophetConvertTimer <= 0) {
          prophetConvertTimer = 10;
          // LAYER UPGRADE — prophet_inspiration: +1 cell layer per level (max 2).
          // Level 0 = 4 orthogonal neighbors; Level 1 = also 4 diagonals (8 total);
          // Level 2 = also 4 two-step orthogonal cells (12 total).
          const piLvl = (s.upgrades?.prophet_inspiration as number) || 0;
          const next = followerGrid.map((c) => ({ ...c }));
          for (const p of prophets) {
            const i = p.cellIndex;
            const row = Math.floor(i / 8);
            const col = i % 8;
            const candidates: number[] = [];
            // Orthogonal (always)
            if (col > 0) candidates.push(i - 1);
            if (col < 7) candidates.push(i + 1);
            if (row > 0) candidates.push(i - 8);
            if (row < 3) candidates.push(i + 8);
            // Level 1+ — diagonals
            if (piLvl >= 1) {
              if (col > 0 && row > 0) candidates.push(i - 9);
              if (col < 7 && row > 0) candidates.push(i - 7);
              if (col > 0 && row < 3) candidates.push(i + 7);
              if (col < 7 && row < 3) candidates.push(i + 9);
            }
            // Level 2+ — two-step orthogonal
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
              setTimeout(() => get().addToLog(`🌟 Prophet converted ${converted} adjacent heretic(s) back to the faithful.`), 0);
            }
          }
          followerGrid = next;
        }

        // Layer 6 — Dimension Engine: parallel dimension progress
        let dimensions = (s.dimensions || makeInitialDimensions()).map((d) => ({ ...d }));
        let dimensionRiftTimer = (s.dimensionRiftTimer || 60) - realDt;
        // LAYER UPGRADE — dimension_boost: +20% accrual speed per level (max 5)
        const dbLvl = (s.upgrades?.dimension_boost as number) || 0;
        const dimSpeedMult = 1 + 0.20 * dbLvl;
        // LAYER UPGRADE — rift_redirect: rifts always transfer from richest → poorest
        const rrLvl = (s.upgrades?.rift_redirect as number) || 0;
        const riftRedirected = rrLvl > 0;
        // L6 FIX — Track Galactic transitions & singularity core rewards
        let singularityCores = s.singularityCores || 0;
        let dimensionEngineBonusClaimed = !!(s.dimensionEngineBonusClaimed);
        const galacticLog: string[] = [];
        for (const d of dimensions) {
          if (d.reachedGalactic) continue;
          // Each dimension accrues resources & population at its own speed (boosted)
          d.resources += d.pop * 0.1 * d.speed * dimSpeedMult * realDt;
          // Pop grows slowly (1 per 5s at speed 1)
          d.pop += 0.2 * d.speed * dimSpeedMult * realDt;
          // Stage up: every 100 resources → advance stage
          while (d.resources >= 100 && d.stageIndex < STAGES.length - 1) {
            d.resources -= 100;
            d.stageIndex += 1;
          }
          if (d.stageIndex >= STAGES.length - 1) {
            d.reachedGalactic = true;
            // L6 FIX — +1 Singularity Core per dimension reaching Galactic
            singularityCores += 1;
            galacticLog.push(`Dimension ${d.name} reached Galactic! +1 Singularity Core.`);
          }
        }
        // L6 FIX — +5 Singularity Core bonus when ALL 3 dimensions reach Galactic (one-time per run)
        if (
          !dimensionEngineBonusClaimed &&
          dimensions.length === 3 &&
          dimensions.every((d) => d.reachedGalactic)
        ) {
          singularityCores += 5;
          dimensionEngineBonusClaimed = true;
          galacticLog.push("All dimensions synchronized! +5 Singularity Core bonus.");
        }
        if (dimensionRiftTimer <= 0) {
          // Rift event — transfer resources between two dimensions
          dimensionRiftTimer = 60;
          if (dimensions.length >= 2) {
            let fromIdx = 0;
            let toIdx = 1;
            if (riftRedirected) {
              // Always transfer from the richest dimension to the poorest (always beneficial)
              let maxRes = -Infinity;
              let minRes = Infinity;
              for (let i = 0; i < dimensions.length; i++) {
                if (dimensions[i].resources > maxRes) { maxRes = dimensions[i].resources; fromIdx = i; }
                if (dimensions[i].resources < minRes) { minRes = dimensions[i].resources; toIdx = i; }
              }
              // Fallback to random if (impossibly) identical
              if (fromIdx === toIdx) {
                fromIdx = Math.floor(Math.random() * dimensions.length);
                toIdx = Math.floor(Math.random() * dimensions.length);
                while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * dimensions.length);
              }
            } else {
              fromIdx = Math.floor(Math.random() * dimensions.length);
              toIdx = Math.floor(Math.random() * dimensions.length);
              while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * dimensions.length);
            }
            const transfer = Math.min(dimensions[fromIdx].resources, 25);
            dimensions[fromIdx].resources -= transfer;
            dimensions[toIdx].resources += transfer;
            setTimeout(() => get().addToLog(`🌀 Rift event! ${dimensions[fromIdx].name} → ${dimensions[toIdx].name}: ${transfer.toFixed(1)} resources transferred.${riftRedirected ? " (Rift Redirect active)" : ""}`), 0);
          }
        }

        // ===== BACKGROUND-SIMULATION — Divinity + EP generation =====
        // At L2+ (Enlightenment unlocked), the base game runs in the background.
        // Simulations = (3 starter + starsLit) × simMult (from simulation_amplifier upgrade).
        // Each sim generates Divinity at 1% of peakProductionRate/sec AND EP at 0.1% of peak/sec.
        let divinityFromBackground = s.divinityFromBackground || 0;
        let epFromBackground = s.epFromBackground || 0;
        // Compute current sim count from constellation stars + shop upgrade.
        const starsLitCount = Object.values(s.constellationStars || {}).filter(Boolean).length;
        const simMult = 1 + (s.upgrades["simulation_amplifier"] || 0);  // level 0 = ×1, level 1 = ×2, ...
        const computedBackgroundSims = (s.unlockedLayers?.enlightenment)
          ? (3 + starsLitCount) * simMult  // 3 starter sims + 1 per star × multiplier
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
              `🌌 Background sims: ${backgroundSimulations} running (${starsLitCount} stars × ${simMult}× mult + 3 starters). +${bgDivPerSec.toFixed(2)} Div/s, +${bgEpPerSec.toFixed(2)} EP/s.`
            ), 0);
          }
        }

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
          eventCooldown,
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
          activeLogicCores,
          logicCoreTimers,
          bloodPactsUsed,
          // L8 FIX — per-god Negotiate cooldowns
          ...negotiateCooldowns,
          // Layer 7-8 state
          instability,
          geneticInstability,
          peakInstability,
          prayer,
          // NEW: Layer 7-10 runtime state
          // (creatures/legions/minorGods/oldGodBattles/universeRules are mutated
          //  through dedicated actions, not inside the tick — they persist as-is.)
          // QUICK WINS — runtime timers + universal currency
          activeAbilityCooldowns,
          activeAbilityEffects,
          ritualComboTimer,
          layerEventTimers,
          prestigePoints,
          // REBUILD L1-6 — runtime state for the new mini-games
          activeTrialRealm,
          trialRealmState,
          trialRealmsCompleted,
          trialRealmBestTimes,
          marketPrices,
          priceHistory,
          marketOwnedResources,
          marketTickTimer,
          // FEATURE 3 — Market Crashes
          marketCrashTimer,
          marketCrashActive,
          marketCrashDuration,
          // FEATURE 4 — Natural Disasters
          worldGrid,
          worldGridSeeds,
          disasterTimer,
          lastDisasterCell,
          lastDisasterAt,
          followerGrid,
          heresySpreadTimer,
          heresySeedTimer,
          heresyThresholdsSeeded,
          // FEATURE 5 — Prophets
          prophets,
          prophetConvertTimer,
          dimensions,
          dimensionRiftTimer,
          // L6 FIX — Dimension Engine rewards
          singularityCores,
          dimensionEngineBonusClaimed,
          // BACKGROUND-SIMULATION — peak + lifetime trackers + computed sim count
          peakProductionRate,
          backgroundSimulations,
          divinityFromBackground,
          epFromBackground,
          evolutionPoints,
        });
        // L6 FIX — log Galactic transition messages (deferred to avoid setState-in-loop)
        for (const msg of galacticLog) {
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
          const totalArchMult = 1 + archResBonus + (archetype?.bonus.allProductionMult || 0);
          const amount = (v as number) * finalMult * totalArchMult;
          res[r] = Math.min(cap, (res[r] || 0) + amount);
        }

        set({
          resources: res,
          totalActions: (s.totalActions || 0) + 1,
        });
      },

      buySystem: (systemId, qty) => {
        const s = get();
        const sys = SYSTEM_MAP[systemId];
        if (!sys) return;
        if (sys.stage !== STAGES[s.stageIndex].id) return;
        // Check tech prerequisite
        if (sys.requiredTech && !s.technologies[sys.requiredTech]) return;

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
        let owned = s.ownedSystems[systemId] || 0;
        if (sys.maxOwned && owned >= sys.maxOwned) return;

        const res = { ...s.resources };
        const ownedSystems = { ...s.ownedSystems };
        const systemEnabled = { ...s.systemEnabled };
        const archetypeAffinity = { ...s.archetypeAffinity };

        let bought = 0;
        for (let i = 0; i < qty; i++) {
          if (sys.maxOwned && owned + bought >= sys.maxOwned) break;
          if (challengeDebuff.maxSystems !== undefined) {
            const totalSystems = Object.values(ownedSystems).reduce((a, b) => a + b, 0);
            if (totalSystems + bought >= challengeDebuff.maxSystems) break;
          }
          const cost = systemCost(sys, owned + bought, costReduction);
          let canAfford = true;
          for (const [r, v] of Object.entries(cost)) {
            const scaled = Math.ceil((v as number) * challengeCostMult);
            if ((res[r] || 0) < scaled) {
              canAfford = false;
              break;
            }
          }
          if (!canAfford) break;
          for (const [r, v] of Object.entries(cost)) {
            const scaled = Math.ceil((v as number) * challengeCostMult);
            res[r] -= scaled;
          }
          bought++;
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
        for (const [r, v] of Object.entries(tech.cost)) {
          const scaled = Math.ceil((v as number) * challengeCostMult * layerTechCostMult);
          if ((res[r] || 0) < scaled) return;
        }
        for (const [r, v] of Object.entries(tech.cost)) {
          const scaled = Math.ceil((v as number) * challengeCostMult * layerTechCostMult);
          res[r] -= scaled;
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
        if (up.requiresWins && s.galacticWins < up.requiresWins) return;
        // Layer-specific upgrades require their layer to be unlocked
        if (up.requiresLayer && !s.unlockedLayers?.[up.requiresLayer]) return;
        const owned = s.upgrades[upgradeId] || 0;
        if (owned >= up.maxLevel) return;
        const cost = upgradeCost(up, owned);
        if (s.evolutionPoints < cost) return;
        const upgrades = { ...s.upgrades, [upgradeId]: owned + 1 };
        set({
          evolutionPoints: s.evolutionPoints - cost,
          upgrades,
        });
        get().addToLog(`Purchased ${up.name} (Lv ${owned + 1}).`);
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
        if (stage.id === "creature" && !lockedArchetype) {
          const dom = dominantArchetype(s.archetypeAffinity);
          if (dom) {
            lockedArchetype = dom;
            get().addToLog(`Lineage locked: ${ARCHETYPE_MAP[dom].name}.`);
          } else {
            lockedArchetype = "humanoid"; // default fallback
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

        // Check achievements after stage clear
        const postEvolveState = { ...s, stageClearCounts, lockedArchetype, fastestCellClear } as GameState;
        const achResult = checkAchievements(postEvolveState);
        const newAchievements = achResult.newOnes.length > 0
          ? [...(s.newAchievements || []), ...achResult.newOnes]
          : s.newAchievements;

        set({
          stageIndex: nextStageIdx,
          resources,
          capacities,
          storyUnlocked: newStory,
          activeStoryPopup: storyId?.id || s.activeStoryPopup,
          stageClearCounts,
          fastestCellClear,
          lockedArchetype,
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
        const relicEp = relicBonus(s.equippedRelics || {}).epMult;
        const coreEp = logicCoreBonus(s.activeLogicCores || {}).epMult;
        // Layers 7-10 EP bonus
        const hybridEp = legionBonus(s.creatures || [], s.legions || [], s.activeOmnipotenceStance).epMult;
        const chanEp = prayerChannelBonus(s.prayerChannelLevels || {}).epMult;
        const maskEp = divineMaskBonus(s.activeDivineMask).epMult;
        const polEp = worshipPolarityBonus(s.activeWorshipPolarity).epMult;
        const allianceEp = allianceBonus(s.alliances || {}, s.minorGods || MINOR_GODS).epMult;
        const echoEp = echoBonus(s.purchasedEchoes || {}).epMult;
        const forkEp = forkBonus(s.resolvedForks || {}).epMult;
        const debtEp = activeDebtBonus(s.takenFutureDebts || {}, s.repaidFutureDebts || {}).epMult;
        const fragmentEp = divineFragmentBonus(s.divineFragments || 0).epMult;
        const testEp = testamentClauseBonus(s.purchasedTestamentClauses || {}).epMult;
        const canonEp = canonizationBonus(s.activeCanonizations || {}).epMult;
        const weaveEp = permanenceWeaveBonus(s.activePermanenceWeaves || {}).epMult;
        const universeEp = universeSlotBonus(s.universeRules || Array(UNIVERSE_SLOTS.length).fill(null)).epMult;
        const keptEp = keptGodsBonus(s.keptGods || []).epMult;
        const layerEpMult = 1 +
          fs.epMult + constBp.epMult + rb.epMult + ritualEp + wEp + dl.epMult + relicEp + coreEp +
          hybridEp + chanEp + maskEp + polEp + allianceEp + echoEp + forkEp + debtEp +
          fragmentEp + testEp + canonEp + weaveEp + universeEp + keptEp;
        epEarned = Math.max(1, Math.floor(epEarned * layerEpMult));

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
        // ---- Layer 9 (Infinity): grant Echoes based on stage ----
        let echoGain = 0;
        if (s.unlockedLayers?.infinity) {
          const echoMult = 1 + echoBonus(s.purchasedEchoes || {}).echoMult;
          echoGain = Math.max(1, Math.floor(stageMult / 3 * echoMult));
        }
        // ---- Layer 10 (Eternity): grant Testament Clauses based on stage ----
        let testamentGain = 0;
        if (s.unlockedLayers?.eternity) {
          const testMult = 1 + testamentClauseBonus(s.purchasedTestamentClauses || {}).testamentMult;
          testamentGain = Math.max(1, Math.floor(stageMult / 5 * testMult));
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

        // ---- Fail any in-progress challenge on prestige (challenge not completed) ----
        const failedChallenge = s.activeChallenge;
        const newChallengeRepeatCounts = { ...(s.challengeRepeatCounts || {}) };
        if (failedChallenge) {
          delete newChallengeRepeatCounts[failedChallenge];
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
          evolutionPoints: s.evolutionPoints + epEarned,
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
          upgrades: s.upgrades,
          storyUnlocked: { ...s.storyUnlocked, god_opens_its_eyes: true },
          storyAcknowledged: s.storyAcknowledged,
          unlockedLayers: s.unlockedLayers,
          stageClearCounts: s.stageClearCounts,
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
          completedChallenges: s.completedChallenges || {},
          challengeRepeatCounts: newChallengeRepeatCounts,
          showChallenges: false,
          // Reset auto-action timers
          autoTimers: { system: 0, tech: 0, evolve: 0, challenge: 0 },

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
          heresy: 0, // reset per-run
          activeHeresyResponse: s.activeHeresyResponse || "hr_ignore",
          showApotheosis: false,

          // Layer 6 — Singularity (persist relics + cores; reset timers)
          singularityCores: (s.singularityCores || 0) + singularityCoreGain,
          equippedRelics: s.equippedRelics || {},
          activeLogicCores: s.activeLogicCores || {},
          logicCoreTimers: {}, // reset per-run
          showSingularity: false,
          // L6 FIX — Dimension Engine bonus is one-time per run; reset on prestige.
          dimensionEngineBonusClaimed: false,

          // Layer 7 — Omnipotence (Bio-engineering) — persist creatures, legions, stance; reset instability
          equippedHybrids: s.equippedHybrids || {},
          activeOmnipotenceStance: s.activeOmnipotenceStance || "balanced",
          instability: 0, // reset per-run
          peakInstability: 0, // reset per-run
          geneticInstability: 0, // reset per-run
          showOmnipotence: false,
          creatures: s.creatures || [],
          legions: s.legions || [],
          creatureDesignDraft: s.creatureDesignDraft || null,

          // Layer 8 — Divinity (Divine Alliance) — persist minor gods, relationships, alliances
          prayer: (s.prayer || 0), // currency persists
          prayerChannelLevels: s.prayerChannelLevels || {},
          activeDivineMask: s.activeDivineMask,
          activeWorshipPolarity: s.activeWorshipPolarity,
          showDivinityLayer: false,
          minorGods: s.minorGods || MINOR_GODS.map((g) => ({ ...g })),
          godRelationships: s.godRelationships ||
            Object.fromEntries(MINOR_GODS.map((g) => [g.id, g.startingRelationship])),
          alliances: s.alliances || {},

          // Layer 9 — Infinity (Divine War) — persist divine fragments; reset battles per-run
          echoes: (s.echoes || 0) + echoGain,
          purchasedEchoes: s.purchasedEchoes || {},
          resolvedForks: {},
          takenFutureDebts: {},
          repaidFutureDebts: {},
          showInfinity: false,
          oldGodBattles: Object.fromEntries(OLD_GODS.map((g) => [g.id, makeInitialBattleState(g.id)])),
          divineFragments: s.divineFragments || 0,

          // Layer 10 — Eternity (Ascension) — persist universe rules + kept gods; reset ending
          testamentClauses: (s.testamentClauses || 0) + testamentGain,
          purchasedTestamentClauses: s.purchasedTestamentClauses || {},
          activeCanonizations: s.activeCanonizations || {},
          activePermanenceWeaves: s.activePermanenceWeaves || {},
          chosenEnding: null,
          cosmicBoonStacks: (s.cosmicBoonStacks || 0) +
            (s.chosenEnding === "reset" ? 1 : 0),
          showEternity: false,
          universeRules: s.universeRules || Array(UNIVERSE_SLOTS.length).fill(null),
          keptGods: s.keptGods || [],

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
          currentTab: "actions",
          speed: 1,
          paused: false,
          showShop: false,
          showEvolve: false,
          activeStoryPopup: s.totalRuns === 0 ? "god_opens_its_eyes" : null,
          hasSeenIntro: true,
          lastSaved: Date.now(),
          tutorialActive: false,
        });
        get().addToLog(`Prestige! Earned ${epEarned} Evolution Points.`);
        if (isFirstGalacticWin) {
          get().addToLog("Layer 1 trials unlocked. Visit the Trials button to begin a Challenge.");
        }
        // NOTE: Background simulations are now computed from (3 + starsLit) × simMult,
        // not incremented on prestige. No log needed here — the sim system runs at L2+.
        if (failedChallenge) {
          get().addToLog(`Trial abandoned: ${CHALLENGE_MAP[failedChallenge]?.name}. You may try again.`);
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
        if (echoGain > 0) {
          get().addToLog(`Layer 9: +${echoGain} Echoes (Infinity).`);
        }
        if (testamentGain > 0) {
          get().addToLog(`Layer 10: +${testamentGain} Testament Clauses (Eternity).`);
        }
      },

      setTab: (tab) => set({ currentTab: tab }),
      setSpeed: (speed) => set({ speed }),
      togglePause: () => set((s) => ({ paused: !s.paused })),
      setShowShop: (v) => set({ showShop: v }),
      setShowEvolve: (v) => set({ showEvolve: v }),
      setShowSettings: (v) => set({ showSettings: v }),
      setShowChallenges: (v) => set({ showChallenges: v }),
      setShowEnlightenment: (v) => set({ showEnlightenment: v }),
      setShowTranscendence: (v) => set({ showTranscendence: v }),
      setShowGenesis: (v) => set({ showGenesis: v }),
      setShowApotheosis: (v) => set({ showApotheosis: v }),
      setShowSingularity: (v) => set({ showSingularity: v }),
      setShowOmnipotence: (v) => set({ showOmnipotence: v }),
      setShowDivinityLayer: (v) => set({ showDivinityLayer: v }),
      setShowInfinity: (v) => set({ showInfinity: v }),
      setShowEternity: (v) => set({ showEternity: v }),

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
            set({ activeChallenge: null, challengeRepeatCounts: newRepeatCounts });
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
      /**
       * LEGACY no-op stub. Old saves / external callers may invoke
       * `purchaseForesightNode(nodeId)`. New design uses `illuminateStar`.
       */
      purchaseForesightNode: (_nodeId) => {
        // No-op — use `illuminateStar(constellationId, starId)` instead.
      },

      setForesightRoute: (routeId) => {
        const s = get();
        if (!s.unlockedLayers?.enlightenment) return;
        if (routeId !== null && !FORESIGHT_ROUTE_MAP[routeId]) return;
        set({ activeForesightRoute: routeId });
        const r = routeId ? FORESIGHT_ROUTE_MAP[routeId] : null;
        get().addToLog(r ? `Foresight route chosen: ${r.name}.` : "Foresight route cleared.");
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
          case "reduceHeresy":
            heresy = Math.max(0, heresy - m.magnitude);
            break;
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
      toggleRelicLoadout: (relicId) => {
        const s = get();
        if (!s.unlockedLayers?.singularity) return;
        const relic = RELIC_LOADOUT_MAP[relicId];
        if (!relic) return;
        const equippedRelics = { ...(s.equippedRelics || {}) };
        // Omega shard is exclusive — equipping it unequips everything else
        if (relicId === "relic_omega") {
          if (equippedRelics[relicId]) {
            delete equippedRelics[relicId];
          } else {
            for (const k of Object.keys(equippedRelics)) delete equippedRelics[k];
            equippedRelics[relicId] = true;
          }
        } else {
          // Equipping another relic unequips omega if it's active
          if (equippedRelics.relic_omega) delete equippedRelics.relic_omega;
          if (equippedRelics[relicId]) {
            delete equippedRelics[relicId];
          } else {
            equippedRelics[relicId] = true;
          }
        }
        set({ equippedRelics });
        // QUICK WIN 5 — +1 Prestige Point when binding (equipping) a relic (not on unequip)
        if (equippedRelics[relicId]) {
          set({ prestigePoints: (get().prestigePoints || 0) + 1 });
          get().addToLog(`${relic.name} equipped. (+1 PP)`);
        } else {
          get().addToLog(`${relic.name} unequipped.`);
        }
      },

      toggleLogicCore: (coreId) => {
        const s = get();
        if (!s.unlockedLayers?.singularity) return;
        const core = LOGIC_CORE_MAP[coreId];
        if (!core) return;
        const activeLogicCores = { ...(s.activeLogicCores || {}) };
        activeLogicCores[coreId] = !activeLogicCores[coreId];
        set({ activeLogicCores });
        get().addToLog(`${core.name} ${activeLogicCores[coreId] ? "activated" : "deactivated"}.`);
      },

      // ============ REBUILD L1-6 — NEW MINI-GAME ACTIONS ============
      // ---- Layer 1 — Trial Realms ----
      setActiveTrialRealm: (realmId) => {
        const s = get();
        if (realmId === null) {
          set({ activeTrialRealm: null });
          return;
        }
        if (!TRIAL_REALM_MAP[realmId]) return;
        const realmState = { ...(s.trialRealmState || {}) };
        if (!realmState[realmId]) {
          realmState[realmId] = makeDefaultRealmState(realmId);
        }
        // FEATURE 1 — record realm start time for leaderboard tracking
        if (!realmState[realmId].startedAt) {
          realmState[realmId].startedAt = s.time || 0;
        }
        set({ activeTrialRealm: realmId, trialRealmState: realmState });
      },

      realmBreakthrough: () => {
        const s = get();
        const realmId = s.activeTrialRealm;
        if (realmId !== "realm_growth") return;
        const rs = { ...(s.trialRealmState || {}) };
        const st = { ...(rs.realm_growth || makeDefaultRealmState("realm_growth")) };
        if ((st.energy || 0) < 100) return;
        st.energy = 0;
        st.breaks = (st.breaks || 0) + 1;
        st.breakCostMult = (st.breakCostMult || 1) * 1.2;
        // Population gain +50% of current population
        const popGain = Math.max(2, Math.floor(s.population * 0.5));
        const newPop = s.population + popGain;
        const trialRealmsCompleted = { ...(s.trialRealmsCompleted || {}) };
        // FEATURE 1 — local leaderboard
        const trialRealmBestTimes = { ...(s.trialRealmBestTimes || {}) };
        if (st.breaks >= REALM_GROWTH_BREAKS_GOAL) {
          st.completed = true;
          trialRealmsCompleted.realm_growth = true;
          // Record best time (only if faster than previous)
          const completionTime = Math.max(0, (s.time || 0) - (st.startedAt || s.time || 0));
          const prevBest = trialRealmBestTimes.realm_growth;
          if (prevBest === undefined || completionTime < prevBest) {
            trialRealmBestTimes.realm_growth = completionTime;
          }
          setTimeout(() => get().addToLog(`Realm of Growth conquered! 10 Break-Throughs performed. +10% population growth permanently.`), 0);
        }
        rs.realm_growth = st;
        set({
          population: newPop,
          maxPopulation: Math.max(s.maxPopulation || 0, newPop),
          trialRealmState: rs,
          trialRealmsCompleted,
          trialRealmBestTimes,
          activeTrialRealm: st.completed ? null : s.activeTrialRealm,
        });
        get().addToLog(`🌱 Break-Through #${st.breaks}! +${popGain} population.`);
      },

      realmDiscontentAction: (action) => {
        const s = get();
        const realmId = s.activeTrialRealm;
        if (realmId !== "realm_discontent") return;
        const rs = { ...(s.trialRealmState || {}) };
        const st = { ...(rs.realm_discontent || makeDefaultRealmState("realm_discontent")) };
        const resources = { ...s.resources };
        switch (action) {
          case "celebrate":
            st.happiness = Math.min(100, (st.happiness || 50) + 20);
            resources.gold = Math.max(0, (resources.gold || 0) - 10);
            break;
          case "tax":
            st.gold = (st.gold || 0) + 20;
            resources.gold = (resources.gold || 0) + 20;
            st.happiness = Math.max(0, (st.happiness || 50) - 15);
            break;
          case "ignore":
            st.happiness = Math.min(100, (st.happiness || 50) + 5);
            st.gold = (st.gold || 0) + 5;
            resources.gold = (resources.gold || 0) + 5;
            break;
        }
        rs.realm_discontent = st;
        set({ trialRealmState: rs, resources });
      },

      // TRIALS-7 — newly playable realm actions
      realmFaminePump: (resourceId) => {
        const s = get();
        if (s.activeTrialRealm !== "realm_famine") return;
        const rs = { ...(s.trialRealmState || {}) };
        const st = { ...(rs.realm_famine || makeDefaultRealmState("realm_famine")) };
        if (st.completed || st.failed) return;
        // resourceId is the SOURCE of the pump (forward direction A→B, B→C, C→A).
        // Source loses REALM_FAMINE_PUMP_FROM, target gains REALM_FAMINE_PUMP_TO.
        const next: "a" | "b" | "c" = resourceId === "a" ? "b" : resourceId === "b" ? "c" : "a";
        if ((st[resourceId] || 0) < REALM_FAMINE_PUMP_FROM) return; // not enough to pump
        st[resourceId] = Math.max(0, (st[resourceId] || 0) - REALM_FAMINE_PUMP_FROM);
        st[next] = Math.min(100, (st[next] || 0) + REALM_FAMINE_PUMP_TO);
        rs.realm_famine = st;
        set({ trialRealmState: rs });
      },

      realmIgnoranceBuyNode: (nodeId) => {
        const s = get();
        if (s.activeTrialRealm !== "realm_ignorance") return;
        if (nodeId < 0 || nodeId >= REALM_IGNORANCE_NODE_COUNT) return;
        const rs = { ...(s.trialRealmState || {}) };
        const st = { ...(rs.realm_ignorance || makeDefaultRealmState("realm_ignorance")) };
        if (st.completed) return;
        const unlocked: boolean[] = [...(st.unlocked || Array(REALM_IGNORANCE_NODE_COUNT).fill(false))];
        if (unlocked[nodeId]) return;
        // Must unlock nodes in chain order (0 → 1 → 2 → ... → 9)
        if (nodeId > 0 && !unlocked[nodeId - 1]) return;
        const cost = REALM_IGNORANCE_NODE_COSTS[nodeId];
        if ((st.science || 0) < cost) return;
        st.science = (st.science || 0) - cost;
        unlocked[nodeId] = true;
        st.unlocked = unlocked;
        st.unlockedCount = unlocked.filter(Boolean).length;
        // Final node reached → completed
        if (nodeId === REALM_IGNORANCE_NODE_COUNT - 1) {
          st.completed = true;
          const trialRealmsCompleted = { ...(s.trialRealmsCompleted || {}) };
          trialRealmsCompleted.realm_ignorance = true;
          const trialRealmBestTimes = { ...(s.trialRealmBestTimes || {}) };
          const completionTime = Math.max(0, (s.time || 0) - (st.startedAt || s.time || 0));
          const prevBest = trialRealmBestTimes.realm_ignorance;
          if (prevBest === undefined || completionTime < prevBest) {
            trialRealmBestTimes.realm_ignorance = completionTime;
          }
          const trialsDone = Object.values(trialRealmsCompleted).filter(Boolean).length;
          const unlockedLayers = { ...(s.unlockedLayers || {}) };
          if (trialsDone >= TRIAL_REALMS_REQUIRED_FOR_LAYER_2 && !unlockedLayers.enlightenment) {
            unlockedLayers.enlightenment = true;
            setTimeout(() => get().addToLog(`Trial progress threshold reached (${trialsDone}/${TRIAL_REALMS_REQUIRED_FOR_LAYER_2} realms). Enlightenment layer unlocked.`), 0);
          }
          setTimeout(() => get().addToLog("Realm of Ignorance conquered! +20% science production permanently."), 0);
          rs.realm_ignorance = st;
          set({
            trialRealmState: rs,
            trialRealmsCompleted,
            trialRealmBestTimes,
            unlockedLayers,
            activeTrialRealm: null,
          });
          return;
        }
        rs.realm_ignorance = st;
        set({ trialRealmState: rs });
      },

      realmStagnationUpgrade: (stage) => {
        const s = get();
        if (s.activeTrialRealm !== "realm_stagnation") return;
        if (stage < 0 || stage >= REALM_STAGNATION_STAGE_COUNT) return;
        const rs = { ...(s.trialRealmState || {}) };
        const st = { ...(rs.realm_stagnation || makeDefaultRealmState("realm_stagnation")) };
        if (st.completed) return;
        const levels = [...(st.levels || [1, 1, 1, 1])];
        const cost = REALM_STAGNATION_UPGRADE_BASE_COST * levels[stage];
        if ((st.goods || 0) < cost) return;
        st.goods = (st.goods || 0) - cost;
        levels[stage] = levels[stage] + 1;
        st.levels = levels;
        rs.realm_stagnation = st;
        set({ trialRealmState: rs });
      },

      realmWeaknessPlaceTower: () => {
        const s = get();
        if (s.activeTrialRealm !== "realm_weakness") return;
        const rs = { ...(s.trialRealmState || {}) };
        const st = { ...(rs.realm_weakness || makeDefaultRealmState("realm_weakness")) };
        if (st.completed || st.failed) return;
        if ((st.military || 0) < REALM_WEAKNESS_TOWER_COST) return;
        st.military = (st.military || 0) - REALM_WEAKNESS_TOWER_COST;
        st.towers = (st.towers || 0) + 1;
        rs.realm_weakness = st;
        set({ trialRealmState: rs });
      },

      realmPurityBuildSystem: () => {
        const s = get();
        if (s.activeTrialRealm !== "realm_purity") return;
        const rs = { ...(s.trialRealmState || {}) };
        const st = { ...(rs.realm_purity || makeDefaultRealmState("realm_purity")) };
        if (st.completed || st.failed) return;
        if ((st.pool || 0) < REALM_PURITY_BUILD_COST) return;
        st.pool = (st.pool || 0) - REALM_PURITY_BUILD_COST;
        st.systemsBuilt = (st.systemsBuilt || 0) + 1;
        // Completion handled in tick to record best time, but we can short-circuit here too
        if ((st.systemsBuilt || 0) >= REALM_PURITY_SYSTEMS_GOAL && !st.completed) {
          st.completed = true;
          const trialRealmsCompleted = { ...(s.trialRealmsCompleted || {}) };
          trialRealmsCompleted.realm_purity = true;
          const trialRealmBestTimes = { ...(s.trialRealmBestTimes || {}) };
          const completionTime = Math.max(0, (s.time || 0) - (st.startedAt || s.time || 0));
          const prevBest = trialRealmBestTimes.realm_purity;
          if (prevBest === undefined || completionTime < prevBest) {
            trialRealmBestTimes.realm_purity = completionTime;
          }
          const trialsDone = Object.values(trialRealmsCompleted).filter(Boolean).length;
          const unlockedLayers = { ...(s.unlockedLayers || {}) };
          if (trialsDone >= TRIAL_REALMS_REQUIRED_FOR_LAYER_2 && !unlockedLayers.enlightenment) {
            unlockedLayers.enlightenment = true;
            setTimeout(() => get().addToLog(`Trial progress threshold reached (${trialsDone}/${TRIAL_REALMS_REQUIRED_FOR_LAYER_2} realms). Enlightenment layer unlocked.`), 0);
          }
          setTimeout(() => get().addToLog("Realm of Purity conquered! +5% production (scaling reward) permanently."), 0);
          rs.realm_purity = st;
          set({
            trialRealmState: rs,
            trialRealmsCompleted,
            trialRealmBestTimes,
            unlockedLayers,
            activeTrialRealm: null,
          });
          return;
        }
        rs.realm_purity = st;
        set({ trialRealmState: rs });
      },

      realmAsceticBuildSystem: (systemId) => {
        const s = get();
        if (s.activeTrialRealm !== "realm_ascetic") return;
        if (systemId < 0 || systemId >= REALM_ASCETIC_STAGES) return;
        const rs = { ...(s.trialRealmState || {}) };
        const st = { ...(rs.realm_ascetic || makeDefaultRealmState("realm_ascetic")) };
        if (st.completed) return;
        const systems: boolean[] = [...(st.systems || Array(REALM_ASCETIC_STAGES).fill(false))];
        if (systems[systemId]) return;
        const cost = REALM_ASCETIC_SYSTEM_COSTS[systemId];
        if ((st.essence || 0) < cost) return;
        st.essence = (st.essence || 0) - cost;
        systems[systemId] = true;
        st.systems = systems;
        st.stage = (st.stage || 0) + 1;
        // Completion when stage reaches 7 (handled in tick too — but short-circuit here)
        if ((st.stage || 0) >= REALM_ASCETIC_STAGES && !st.completed) {
          st.completed = true;
          const trialRealmsCompleted = { ...(s.trialRealmsCompleted || {}) };
          trialRealmsCompleted.realm_ascetic = true;
          const trialRealmBestTimes = { ...(s.trialRealmBestTimes || {}) };
          const completionTime = Math.max(0, (s.time || 0) - (st.startedAt || s.time || 0));
          const prevBest = trialRealmBestTimes.realm_ascetic;
          if (prevBest === undefined || completionTime < prevBest) {
            trialRealmBestTimes.realm_ascetic = completionTime;
          }
          const trialsDone = Object.values(trialRealmsCompleted).filter(Boolean).length;
          const unlockedLayers = { ...(s.unlockedLayers || {}) };
          if (trialsDone >= TRIAL_REALMS_REQUIRED_FOR_LAYER_2 && !unlockedLayers.enlightenment) {
            unlockedLayers.enlightenment = true;
            setTimeout(() => get().addToLog(`Trial progress threshold reached (${trialsDone}/${TRIAL_REALMS_REQUIRED_FOR_LAYER_2} realms). Enlightenment layer unlocked.`), 0);
          }
          setTimeout(() => get().addToLog("Realm of the Ascetic conquered! +12% production with constraints lifted."), 0);
          rs.realm_ascetic = st;
          set({
            trialRealmState: rs,
            trialRealmsCompleted,
            trialRealmBestTimes,
            unlockedLayers,
            activeTrialRealm: null,
          });
          return;
        }
        rs.realm_ascetic = st;
        set({ trialRealmState: rs });
      },

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
        if ((s.divinity || 0) < cost) return;
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
        set({
          divinity: (s.divinity || 0) - cost,
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

      /**
       * LEGACY no-op stub. Old UI / saves called `illuminateConstellationNode(nodeId)`.
       * New design uses `illuminateStar(constellationId, starId)`. Old node ids
       * don't map to new star ids, so this is a graceful no-op.
       */
      illuminateConstellationNode: (_nodeId) => {
        // No-op — use `illuminateStar(constellationId, starId)` instead.
      },

      // L2 active abilities REMOVED — stars are lit only by purchasing with Divinity.
      // These are no-op stubs kept for save-compatibility.
      stargazeReveal: () => {},
      supernovaIlluminate: () => {},
      blackHoleReset: () => {},
      activateCosmicBridge: () => {},


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

      // ---- Layer 4 — Sacred Grid ----
      placeGridTile: (cellIndex, tileType) => {
        const s = get();
        if (!s.unlockedLayers?.genesis) return;
        if (cellIndex < 0 || cellIndex >= 20) return;
        const grid = (s.worldGrid || Array(20).fill(null)).slice();
        if (grid[cellIndex] !== null) return;
        grid[cellIndex] = tileType;
        // Reveal dormant seeds on adjacent empty cells (1 in 3 chance of a seed appearing)
        const seeds = (s.worldGridSeeds || Array(20).fill(null)).slice();
        const row = Math.floor(cellIndex / 5);
        const col = cellIndex % 5;
        const neighborIdx = [
          col > 0 ? cellIndex - 1 : -1,
          col < 4 ? cellIndex + 1 : -1,
          row > 0 ? cellIndex - 5 : -1,
          row < 3 ? cellIndex + 5 : -1,
        ].filter((i) => i >= 0 && grid[i] === null && !seeds[i]);
        for (const ni of neighborIdx) {
          if (Math.random() < 0.33) seeds[ni] = "seed_dormant";
        }
        set({ worldGrid: grid, worldGridSeeds: seeds });
        get().addToLog(`🗺️ Placed ${tileType} tile on cell ${cellIndex + 1}.`);
      },

      resetWorldGrid: () => {
        const s = get();
        if (!s.unlockedLayers?.genesis) return;
        set({ worldGrid: Array(20).fill(null), worldGridSeeds: Array(20).fill(null) });
        get().addToLog("🗺️ Sacred Grid reset.");
      },

      // ---- Layer 5 — Heresy Web ----
      convertFollower: (cellIndex) => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        if (cellIndex < 0 || cellIndex >= 32) return;
        const grid = (s.followerGrid || makeInitialFollowerGrid()).map((c) => ({ ...c }));
        if (grid[cellIndex].state === "faithful") return; // already faithful
        const cost = 5;
        if ((s.divinity || 0) < cost) return;
        grid[cellIndex].state = "faithful";
        set({ divinity: (s.divinity || 0) - cost, followerGrid: grid });
      },

      purgeFollower: (cellIndex) => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        if (cellIndex < 0 || cellIndex >= 32) return;
        const grid = (s.followerGrid || makeInitialFollowerGrid()).map((c) => ({ ...c }));
        if (grid[cellIndex].state === "empty") return;
        grid[cellIndex].state = "empty";
        // Faith drop minor
        const faithDrop = 2;
        set({ followerGrid: grid, faith: Math.max(0, (s.faith || 0) - faithDrop) });
      },

      initFollowerGrid: () => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        set({ followerGrid: makeInitialFollowerGrid() });
        get().addToLog("Flock restored to 32 faithful followers.");
      },

      // ---- Layer 6 — Dimension Engine ----
      setDimensionSpeed: (dimId, speed) => {
        const s = get();
        if (!s.unlockedLayers?.singularity) return;
        const dims = (s.dimensions || makeInitialDimensions()).map((d) => ({ ...d }));
        const d = dims.find((x) => x.id === dimId);
        if (!d) return;
        if (![1, 0.5, 0.25].includes(speed)) return;
        d.speed = speed;
        set({ dimensions: dims });
      },

      syncDimension: (fromId, toId) => {
        const s = get();
        if (!s.unlockedLayers?.singularity) return;
        const cost = 50;
        if ((s.divinity || 0) < cost) return;
        const dims = (s.dimensions || makeInitialDimensions()).map((d) => ({ ...d }));
        const from = dims.find((x) => x.id === fromId);
        const to = dims.find((x) => x.id === toId);
        if (!from || !to || from.id === to.id) return;
        // Copy progress: stageIndex and population (not resources — to prevent full duplication)
        to.stageIndex = Math.max(to.stageIndex, from.stageIndex);
        to.pop = Math.max(to.pop, Math.floor(from.pop * 0.5));
        if (from.reachedGalactic) to.reachedGalactic = true;
        set({ divinity: (s.divinity || 0) - cost, dimensions: dims });
        get().addToLog(`🔄 Sync: ${from.name} → ${to.name} (-50 Divinity).`);
      },

      initDimensions: () => {
        const s = get();
        if (!s.unlockedLayers?.singularity) return;
        set({ dimensions: makeInitialDimensions() });
        get().addToLog("Dimension Engine initialized — three parallel timelines.");
      },

      // FEATURE 6 — Collapse two dimensions of the same stage into one
      collapseDimensions: (fromId, toId) => {
        const s = get();
        if (!s.unlockedLayers?.singularity) return;
        const cost = 50;
        if ((s.divinity || 0) < cost) return;
        const dims = (s.dimensions || makeInitialDimensions()).map((d) => ({ ...d }));
        const from = dims.find((x) => x.id === fromId);
        const to = dims.find((x) => x.id === toId);
        if (!from || !to || from.id === to.id) return;
        // Both dimensions must be at the same stageIndex to collapse
        if (from.stageIndex !== to.stageIndex) {
          get().addToLog(`Collapse requires both dimensions at the same stage (${from.name}: ${from.stageIndex}, ${to.name}: ${to.stageIndex}).`);
          return;
        }
        // Merge into `to`: combined speed + combined resources + combined pop
        to.speed = to.speed + from.speed;
        to.resources = to.resources + from.resources;
        to.pop = to.pop + from.pop;
        to.reachedGalactic = to.reachedGalactic || from.reachedGalactic;
        const remaining = dims.filter((d) => d.id !== from.id);
        set({ divinity: (s.divinity || 0) - cost, dimensions: remaining });
        get().addToLog(`🌌 Dimension Collapse! ${from.name} merged into ${to.name} — combined speed ${to.speed}×, resources ${to.resources.toFixed(0)}, pop ${Math.floor(to.pop)} (-50 Divinity).`);
      },

      // ===== FEATURE ENHANCEMENTS — NEW ACTIONS =====
      // FEATURE 5 — Prophets (place on heresy grid; max 2)
      placeProphet: (cellIndex) => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        if (cellIndex < 0 || cellIndex >= 32) return;
        const cost = 50;
        if ((s.divinity || 0) < cost) return;
        const prophets = (s.prophets || []).slice();
        if (prophets.length >= 2) {
          get().addToLog("Max 2 Prophets at a time.");
          return;
        }
        if (prophets.some((p) => p.cellIndex === cellIndex)) {
          get().addToLog("A Prophet is already placed there.");
          return;
        }
        // Place only on empty or faithful cells
        const grid = (s.followerGrid || makeInitialFollowerGrid()).slice();
        const cell = grid[cellIndex];
        if (!cell || cell.state === "empty") {
          // Convert empty cell to faithful so the prophet has a place to stand
          grid[cellIndex] = { state: "faithful", type: "prophet" };
        } else if (cell.state === "heretical") {
          grid[cellIndex] = { state: "faithful", type: "prophet" };
        } else {
          grid[cellIndex] = { ...cell, type: "prophet" };
        }
        prophets.push({ cellIndex, lastConvertedAt: 0 });
        set({
          divinity: (s.divinity || 0) - cost,
          prophets,
          followerGrid: grid,
        });
        get().addToLog(`🌟 Prophet placed on cell ${cellIndex + 1} (-50 Divinity). Converts adjacent heretics every 10s.`);
      },

      removeProphet: (cellIndex) => {
        const s = get();
        if (!s.unlockedLayers?.apotheosis) return;
        const prophets = (s.prophets || []).filter((p) => p.cellIndex !== cellIndex);
        const grid = (s.followerGrid || makeInitialFollowerGrid()).slice();
        if (grid[cellIndex]?.type === "prophet") {
          grid[cellIndex] = { state: "faithful", type: "follower" };
        }
        set({ prophets, followerGrid: grid });
        get().addToLog(`Prophet removed from cell ${cellIndex + 1}.`);
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

      // FEATURE 10 — Resolve Paradox (costs 100 Divinity; reduces paradox by 1)
      resolveParadox: () => {
        const s = get();
        if (!s.unlockedLayers?.eternity) return;
        const cost = 100;
        if ((s.divinity || 0) < cost) return;
        if ((s.universeParadox || 0) <= 0) {
          get().addToLog("No paradox to resolve.");
          return;
        }
        set({ divinity: (s.divinity || 0) - cost, universeParadox: (s.universeParadox || 0) - 1 });
        get().addToLog(`✦ Paradox resolved (-1 Paradox, -100 Divinity). Reality steadies.`);
      },

      // ===== BACKGROUND-SIMULATION — spawn action REMOVED =====
      // Sims are now computed from (3 + starsLit) × simMult, not manually spawned.
      // The simulation_amplifier shop upgrade increases the multiplier.
      // (spawnBackgroundSimulation action removed — kept as no-op stub for save-compat.)
      spawnBackgroundSimulation: () => {
        get().addToLog("Simulations now come from lighting constellation stars. Buy the Simulation Amplifier upgrade to multiply them.");
      },

      // ============ LAYER 7 — OMNIPOTENCE (Bio-engineering) ============
      toggleHybridLineage: (hybridId) => {
        // LEGACY stub — kept for migration. The new Creature Lab doesn't use hybrids.
        void hybridId;
      },

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
        // L7 FIX Bug 1 — Cap: base 5 + 1 per L10 universe slot filled (so L10 choices expand the cap).
        const filledSlots = (s.universeRules || []).filter(Boolean).length;
        const maxCreatures = 5 + filledSlots;
        const currentCount = (s.creatures || []).length;
        if (currentCount >= maxCreatures) {
          get().addToLog(`Creature lab at capacity (${currentCount}/${maxCreatures}). Author more universe rules or release a creature.`);
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
        set({
          creatures: [...(s.creatures || []), creature],
          divinity: (s.divinity || 0) - divinityCost,
          faith: (s.faith || 0) - faithCost,
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

      // ============ LAYER 8 — DIVINITY (Divine Alliance) ============
      levelPrayerChannel: (_channelId) => {
        // LEGACY stub — kept for migration. The new Divine Alliance doesn't use channels.
        void _channelId;
      },

      setDivineMask: (_maskId) => {
        // LEGACY stub — kept for migration. The new Divine Alliance doesn't use masks.
        void _maskId;
      },

      setWorshipPolarity: (_polarityId) => {
        // LEGACY stub — kept for migration.
        void _polarityId;
      },

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
        const demandResource = god.demand.resource as "divinity" | "prayer" | "faith";
        const demandAmount = god.demand.amount;
        const have = (s as any)[demandResource] || 0;
        if (have < demandAmount) {
          get().addToLog(`Not enough ${demandResource} to trade with ${god.name} (need ${demandAmount}).`);
          return;
        }
        const rewardResource = god.reward.resource as "divinity" | "prayer" | "faith";
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
      purchaseEcho: (_echoId) => {
        // LEGACY stub — kept for migration. The new Divine War doesn't use echoes.
        void _echoId;
      },

      resolveFork: (_forkId, _branchId) => {
        // LEGACY stub — kept for migration.
        void _forkId;
        void _branchId;
      },

      takeFutureDebt: (_debtId) => {
        // LEGACY stub — kept for migration.
        void _debtId;
      },

      repayFutureDebt: (_debtId) => {
        // LEGACY stub — kept for migration.
        void _debtId;
      },

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

      // ============ LAYER 10 — ETERNITY (Ascension) ============
      purchaseTestamentClause: (_clauseId) => {
        // LEGACY stub — kept for migration. The new Ascension uses Universe Creation.
        void _clauseId;
      },

      toggleCanonization: (_canonId) => {
        // LEGACY stub — kept for migration.
        void _canonId;
      },

      togglePermanenceWeave: (_weaveId) => {
        // LEGACY stub — kept for migration.
        void _weaveId;
      },

      chooseEnding: (endingId) => {
        const s = get();
        if (!s.unlockedLayers?.eternity) return;
        const ending = ENDING_CHOICE_MAP[endingId];
        if (!ending) return;
        // Reset ending requires all 8 universe slots filled
        if (endingId === "reset") {
          const { filledCount } = universeSlotBonus(s.universeRules || Array(UNIVERSE_SLOTS.length).fill(null));
          if (filledCount < UNIVERSE_SLOTS.length) {
            get().addToLog(`Cannot Reset Universe: ${filledCount}/${UNIVERSE_SLOTS.length} universe slots filled. Fill all 8 to ascend.`);
            return;
          }
        }
        set({ chosenEnding: endingId });
        get().addToLog(`Ending chosen: ${ending.name}. ${ending.desc}`);
        if (endingId === "reset") {
          setTimeout(() => {
            get().addToLog("The universe is reset. A new cosmos stirs, governed by your rules.");
            get().triggerPrestige();
          }, 0);
        }
      },

      setUniverseRule: (slotIndex, optionId) => {
        const s = get();
        if (!s.unlockedLayers?.eternity) return;
        if (slotIndex < 0 || slotIndex >= UNIVERSE_SLOTS.length) return;
        const slot = UNIVERSE_SLOTS[slotIndex];
        const opt = slot.options.find((o) => o.id === optionId);
        if (!opt) return;
        const rules = (s.universeRules || Array(UNIVERSE_SLOTS.length).fill(null)).slice();
        const prevOptId = rules[slotIndex];
        const prevOpt = prevOptId ? slot.options.find((o) => o.id === prevOptId) : null;
        // FEATURE 10 — Forbidden Words: track paradox delta
        let universeParadox = s.universeParadox || 0;
        if (prevOpt?.forbidden && !opt.forbidden) universeParadox = Math.max(0, universeParadox - 1);
        if (!prevOpt?.forbidden && opt.forbidden) universeParadox = universeParadox + 1;
        rules[slotIndex] = optionId;
        // LAYER UPGRADE — paradox_insight: paradox threshold +1 per level (max 1 — base 2 → 3)
        // L10 FIX — Base threshold lowered from 3 to 2 so picking 2 Forbidden Words triggers reset.
        // Player must invest in paradox_insight to safely pick even one Forbidden Word.
        const piLvl = (s.upgrades?.paradox_insight as number) || 0;
        const paradoxThreshold = 2 + piLvl;
        // If paradox reaches the threshold, universe creation fails and resets
        if (universeParadox >= paradoxThreshold) {
          set({
            universeRules: Array(UNIVERSE_SLOTS.length).fill(null),
            universeParadox: 0,
          });
          setTimeout(() => get().addToLog(`💥 PARADOX OVERLOAD! Reality rejects your creation — universe rules reset. Resolve paradoxes before they pile up.`), 0);
          return;
        }
        set({ universeRules: rules, universeParadox });
        get().addToLog(`Universe rule set: ${slot.name} → ${opt.label}${opt.forbidden ? " (FORBIDDEN — +1 Paradox)" : ""}.`);
      },

      toggleKeptGod: (godId) => {
        const s = get();
        if (!s.unlockedLayers?.eternity) return;
        if (!MINOR_GOD_MAP[godId]) return;
        // Only allied gods can be kept in the new pantheon
        if (!s.alliances?.[godId]) {
          get().addToLog(`${MINOR_GOD_MAP[godId].name} is not an ally — cannot keep.`);
          return;
        }
        const kept = [...(s.keptGods || [])];
        const idx = kept.indexOf(godId);
        if (idx >= 0) {
          kept.splice(idx, 1);
          get().addToLog(`${MINOR_GOD_MAP[godId].name} removed from your pantheon.`);
        } else {
          kept.push(godId);
          get().addToLog(`${MINOR_GOD_MAP[godId].name} will be kept in your new pantheon.`);
        }
        set({ keptGods: kept });
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
        set({ activeSpecialTheme: id });
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
      // WIN 2 — useActiveAbility: triggers the active ability for a given prestige layer
      useActiveAbility: (layerId) => {
        const s = get();
        const ability = ACTIVE_ABILITY_MAP[layerId];
        if (!ability) return;
        // Must have the layer unlocked
        if (layerId !== "evolution") {
          if (!s.unlockedLayers?.[layerId]) return;
        } else {
          // Layer 1 (Evolution) requires unlockedChallenges (first Galactic win) — keeps it as a meaningful perk
          if (!s.unlockedChallenges) return;
        }
        // Check cooldown
        const cooldowns = { ...(s.activeAbilityCooldowns || {}) };
        if ((cooldowns[ability.id] || 0) > 0) return;

        // Apply effect
        const patch: Partial<GameState> = {};
        const effectsPatch: Record<string, number> = { ...(s.activeAbilityEffects || {}) };
        switch (ability.effect.kind) {
          case "instant_pop": {
            const pop = s.population + (ability.effect.magnitude || 0);
            patch.population = pop;
            patch.maxPopulation = Math.max(s.maxPopulation || 0, pop);
            break;
          }
          case "instant_divinity": {
            patch.divinity = (s.divinity || 0) + (ability.effect.magnitude || 0);
            break;
          }
          case "temp_surge": {
            effectsPatch["surge"] = ability.effect.durationSec || 10;
            break;
          }
          case "instant_genesis_seed": {
            patch.genesisSeeds = (s.genesisSeeds || 0) + (ability.effect.magnitude || 1);
            break;
          }
          case "reduce_heresy": {
            patch.heresy = Math.max(0, (s.heresy || 0) - (ability.effect.magnitude || 0));
            break;
          }
          case "temp_overclock": {
            effectsPatch["overclock"] = ability.effect.durationSec || 15;
            break;
          }
        }
        // Set cooldown
        cooldowns[ability.id] = ability.cooldownSec;
        patch.activeAbilityCooldowns = cooldowns;
        patch.activeAbilityEffects = effectsPatch;
        set(patch);
        get().addToLog(`${ability.name} activated! (${ability.cooldownSec}s cooldown)`);
      },

      // WIN 5 — buyUniversalUpgrade: spends Prestige Points on universal upgrades
      buyUniversalUpgrade: (upgradeId) => {
        const s = get();
        const up = UPGRADE_MAP[upgradeId];
        if (!up) return;
        if (up.category !== "universal") return;
        const owned = s.upgrades[upgradeId] || 0;
        if (owned >= up.maxLevel) return;
        const cost = upgradeCost(up, owned);
        if ((s.prestigePoints || 0) < cost) return;
        const upgrades = { ...s.upgrades, [upgradeId]: owned + 1 };
        set({
          prestigePoints: (s.prestigePoints || 0) - cost,
          upgrades,
        });
        get().addToLog(`Purchased ${up.name} (Lv ${owned + 1}) for ${cost} Prestige Points.`);
      },

      dismissTutorial: () => set({ tutorialActive: false, tutorialDismissed: true }),
      setEventFrequency: (freq) => set({ eventFrequency: freq }),

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
        // Apply effects
        const res = { ...s.resources };
        if (choice.resourceChanges) {
          for (const [r, v] of Object.entries(choice.resourceChanges)) {
            const cap = s.capacities[r] || Infinity;
            res[r] = Math.max(0, Math.min(cap, (res[r] || 0) + (v as number)));
          }
        }
        let pop = s.population;
        if (choice.populationChange) {
          pop = Math.max(0, pop + choice.populationChange);
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
        set({
          resources: res,
          population: pop,
          maxPopulation: Math.max(s.maxPopulation || 0, pop),
          archetypeAffinity,
          activeEvent: null,
          eventHistory,
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
          divinity: (s.divinity || 0) + 500,
          prayer: (s.prayer || 0) + 200,
          faith: (s.faith || 0) + 200,
          // BACKGROUND-SIMULATION — seed a non-zero peak so the Divine Engine
          // panel has visible Divinity generation when debug-unlocked.
          // (backgroundSimulations is computed from stars lit, not set here.)
          peakProductionRate: Math.max(s.peakProductionRate || 0, 100),
        });
        get().addToLog("DEBUG: All prestige layers unlocked. +1000 EP, +500 Divinity, +200 Prayer, +200 Faith granted.");
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
      version: 10,
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
        if (!persisted.equippedRelics) persisted.equippedRelics = {};
        if (!persisted.activeLogicCores) persisted.activeLogicCores = {};
        if (!persisted.logicCoreTimers) persisted.logicCoreTimers = {};
        if (persisted.showSingularity === undefined) persisted.showSingularity = false;
        // L6 FIX — Dimension Engine bonus tracker (defaults false on old saves)
        if (persisted.dimensionEngineBonusClaimed === undefined) persisted.dimensionEngineBonusClaimed = false;
        // unlockedLayers should always exist (v3+); ensure all 10 layer flags exist
        if (!persisted.unlockedLayers) persisted.unlockedLayers = { evolution: true };
        if (persisted.unlockedLayers.enlightenment === undefined) persisted.unlockedLayers.enlightenment = false;
        if (persisted.unlockedLayers.transcendence === undefined) persisted.unlockedLayers.transcendence = false;
        if (persisted.unlockedLayers.genesis === undefined) persisted.unlockedLayers.genesis = false;
        if (persisted.unlockedLayers.apotheosis === undefined) persisted.unlockedLayers.apotheosis = false;
        if (persisted.unlockedLayers.singularity === undefined) persisted.unlockedLayers.singularity = false;

        // v5 migration: Layers 7-10 state fields
        // Layer 7 — Omnipotence
        if (!persisted.equippedHybrids) persisted.equippedHybrids = {};
        if (persisted.activeOmnipotenceStance === undefined) persisted.activeOmnipotenceStance = "balanced";
        if (persisted.instability === undefined) persisted.instability = 0;
        if (persisted.peakInstability === undefined) persisted.peakInstability = 0;
        if (persisted.showOmnipotence === undefined) persisted.showOmnipotence = false;
        if (persisted.unlockedLayers.omnipotence === undefined) persisted.unlockedLayers.omnipotence = false;
        // Layer 8 — Divinity (layer)
        if (persisted.prayer === undefined) persisted.prayer = 0;
        if (!persisted.prayerChannelLevels) persisted.prayerChannelLevels = {};
        if (persisted.activeDivineMask === undefined) persisted.activeDivineMask = null;
        if (persisted.activeWorshipPolarity === undefined) persisted.activeWorshipPolarity = null;
        if (persisted.showDivinityLayer === undefined) persisted.showDivinityLayer = false;
        if (persisted.unlockedLayers.divinity === undefined) persisted.unlockedLayers.divinity = false;
        // Layer 9 — Infinity
        if (persisted.echoes === undefined) persisted.echoes = 0;
        if (!persisted.purchasedEchoes) persisted.purchasedEchoes = {};
        if (!persisted.resolvedForks) persisted.resolvedForks = {};
        if (!persisted.takenFutureDebts) persisted.takenFutureDebts = {};
        if (!persisted.repaidFutureDebts) persisted.repaidFutureDebts = {};
        if (persisted.showInfinity === undefined) persisted.showInfinity = false;
        if (persisted.unlockedLayers.infinity === undefined) persisted.unlockedLayers.infinity = false;
        // Layer 10 — Eternity
        if (persisted.testamentClauses === undefined) persisted.testamentClauses = 0;
        if (!persisted.purchasedTestamentClauses) persisted.purchasedTestamentClauses = {};
        if (!persisted.activeCanonizations) persisted.activeCanonizations = {};
        if (!persisted.activePermanenceWeaves) persisted.activePermanenceWeaves = {};
        if (persisted.chosenEnding === undefined) persisted.chosenEnding = null;
        if (persisted.cosmicBoonStacks === undefined) persisted.cosmicBoonStacks = 0;
        if (persisted.showEternity === undefined) persisted.showEternity = false;
        if (persisted.unlockedLayers.eternity === undefined) persisted.unlockedLayers.eternity = false;

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
        if (persisted.activeTrialRealm === undefined) persisted.activeTrialRealm = null;
        if (!persisted.trialRealmState) persisted.trialRealmState = {};
        if (!persisted.trialRealmsCompleted) persisted.trialRealmsCompleted = {};
        // FEATURE 1 — local leaderboard migration
        if (!persisted.trialRealmBestTimes) persisted.trialRealmBestTimes = {};
        // v9 migration: L2 constellation redesign — old `constellationNodes`
        // entries don't map to new star ids, so clear them. Initialize the
        // new state fields with empty records. The legacy fields remain as
        // empty records for backward compatibility with any code that still
        // references them.
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
        if (!persisted.worldGrid) persisted.worldGrid = Array(20).fill(null);
        if (!persisted.worldGridSeeds) persisted.worldGridSeeds = Array(20).fill(null);
        // FEATURE 4 — Natural Disasters migration
        if (persisted.disasterTimer === undefined) persisted.disasterTimer = 90;
        if (persisted.lastDisasterCell === undefined) persisted.lastDisasterCell = null;
        if (persisted.lastDisasterAt === undefined) persisted.lastDisasterAt = 0;
        if (!persisted.followerGrid) persisted.followerGrid = Array.from({ length: 32 }, () => ({ state: "faithful", type: "follower" }));
        if (persisted.heresySpreadTimer === undefined) persisted.heresySpreadTimer = 10;
        if (persisted.heresySeedTimer === undefined) persisted.heresySeedTimer = 30;
        if (!persisted.heresyThresholdsSeeded) persisted.heresyThresholdsSeeded = {};
        // FEATURE 5 — Prophets migration
        if (!persisted.prophets) persisted.prophets = [];
        if (persisted.prophetConvertTimer === undefined) persisted.prophetConvertTimer = 10;
        if (!persisted.dimensions) persisted.dimensions = [
          { id: 0, name: "Alpha", speed: 1, pop: 8, stageIndex: 0, resources: 0, reachedGalactic: false },
          { id: 1, name: "Beta", speed: 0.5, pop: 8, stageIndex: 0, resources: 0, reachedGalactic: false },
          { id: 2, name: "Gamma", speed: 0.25, pop: 8, stageIndex: 0, resources: 0, reachedGalactic: false },
        ];
        if (persisted.dimensionRiftTimer === undefined) persisted.dimensionRiftTimer = 60;

        // v10 migration: FEATURE ENHANCEMENTS — L7 mutations (creature.mutated flag), L8 amplifiers, L9 temporal storms, L10 paradox
        if (persisted.creatures) {
          for (const c of persisted.creatures) {
            if (c.mutated === undefined) c.mutated = false;
          }
        }
        if (!persisted.amplifiers) persisted.amplifiers = [];
        if (!persisted.temporalStorms) persisted.temporalStorms = {};
        if (persisted.universeParadox === undefined) persisted.universeParadox = 0;

        // v9 migration: REBUILD L7-10 — new narrative (Bio-engineering, Divine Alliance, Divine War, Ascension)
        // Layer 7 — Creature Lab
        if (!persisted.creatures) persisted.creatures = [];
        if (!persisted.legions) persisted.legions = [];
        if (persisted.geneticInstability === undefined) persisted.geneticInstability = 0;
        if (persisted.creatureDesignDraft === undefined) {
          persisted.creatureDesignDraft = { bodyType: "predator", diet: "herbivore", special: "regen", name: "" };
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
        // Layer 10 — Universe Creation
        if (!persisted.universeRules) {
          persisted.universeRules = Array(UNIVERSE_SLOTS.length).fill(null);
        }
        if (!persisted.keptGods) persisted.keptGods = [];

        // v10 migration: BACKGROUND-SIMULATION — peak production tracker +
        // lifetime Divinity + EP counters. backgroundSimulations is now COMPUTED
        // each tick from (3 + starsLit) × simMult — no longer a stored counter.
        if (persisted.peakProductionRate === undefined) persisted.peakProductionRate = 0;
        if (persisted.divinityFromBackground === undefined) persisted.divinityFromBackground = 0;
        if (persisted.epFromBackground === undefined) persisted.epFromBackground = 0;
        // backgroundSimulations field kept for display-cache compat; recomputed each tick.
        if (persisted.backgroundSimulations === undefined) persisted.backgroundSimulations = 0;

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
