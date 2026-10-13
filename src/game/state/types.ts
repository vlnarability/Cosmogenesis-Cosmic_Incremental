// Core game type definitions for Evolution Idle

import type { WorldConfig } from "../data/genesis";
import type { GalaxySystemState } from "../data/galaxyMap";
import type { RivalSystemState } from "../data/galaxies";
import type {
  UniversalGalaxyState,
  Rift,
  RealityAnchor,
} from "../data/universalMap";

export type ResourceId =
  | "atp" | "glucose" | "proteins" | "lipids" | "elements"
  | "food" | "water" | "materials" | "organic_matter" | "knowledge" | "culture"
  | "wood" | "lumber" | "stone" | "clay" | "science" | "happiness" | "military_power"
  | "production" | "gold" | "influence" | "energy" | "alloys" | "data"
  | "divinity" | "evolution_points" | "enlightenment_points" | "transcendence_points";

export type StageId =
  | "cell" | "creature" | "tribal" | "civilization" | "empire" | "solar" | "galactic";

export type TabId =
  | "actions" | "systems" | "production" | "tech" | "story"
  | "codex" | "achievements" | "archive" | "log" | "shop" | "prestige";

export interface ResourceDef {
  id: ResourceId;
  name: string;
  category: "primary" | "divinity" | "meta";
  firstStage: StageId;
  color: string;
  icon: string; // emoji
}

export interface StageAction {
  id: string;
  name: string;
  desc: string;
  stage: StageId;
  icon: string;
  cost?: Partial<Record<ResourceId, number>>;
  produces: Partial<Record<ResourceId, number>>;
  cooldown?: number; // seconds
  unlockRequirement?: string;
  scaleWith?: "population" | "happiness" | "tech";
}

export interface SystemDef {
  id: string;
  name: string;
  desc: string;
  stage: StageId;
  icon: string;
  category: string;
  baseCost: Partial<Record<ResourceId, number>>;
  costGrowth: number; // multiplier per owned
  produces: Partial<Record<ResourceId, number>>;
  capacityBoost?: Partial<Record<ResourceId, number>>;
  upkeep?: Partial<Record<ResourceId, number>>;
  maxOwned?: number;
  requiredTech?: string;
  grantsAffinity?: { archetype: string; amount: number };
  // Population-growth systems: flat per-second contribution to
  // `populationProgress` (independent of resource production).
  popGrowth?: number;
}

export interface TechDef {
  id: string;
  name: string;
  desc: string;
  stage: StageId;
  cost: Partial<Record<ResourceId, number>>;
  branch: string;
  tier: number;
  requires?: string[];
  effects: string;
  multiplier?: { target: "production" | "manual" | "capacity" | "population"; value: number };
  grantsAffinity?: { archetype: string; amount: number };
}

export interface StageDef {
  id: StageId;
  name: string;
  tagline: string;
  desc: string;
  icon: string;
  accent: string; // hex
  bgGradient: string; // css
  duration: string;
  evolveRequires: {
    minPopulation: number;
    minSystems: number;
    minTech: number;
  };
  storyIntro: string;
  storyOutro: string;
}

// Upgrade effect types. "manual_mult" and the "manual" category were removed
// (no manual actions scale that way anymore). "acceleration" was added for
// time-warping upgrades, plus several new automation / prestige effects.
// "layer" category + 18 layer-specific effect types were added for the
// SHOP-LAYER-ITEMS task — these only appear in the shop once their layer is
// unlocked (see UpgradeDef.requiresLayer).
export type UpgradeEffectType =
  | "auto_mult"
  | "cost_reduction"
  | "start_bonus"
  | "cap_boost"
  | "evolve_boost"
  | "auto_system_buyer"
  | "auto_tech_buyer"
  | "auto_evolver"
  | "frontier_spirit"
  | "ancestral_bounty"
  | "challenge_mastery"
  | "stage_compression"
  | "temporal_acceleration"
  | "deep_memory"
  | "cosmic_understanding"
  | "universal_boost"
  | "universal_speed"
  // Layer-specific (require their layer unlocked to appear in shop):
  | "foresight_discount"
  | "constellation_boost"
  | "ritual_extension"
  | "market_savvy"
  | "world_blueprint"
  | "disaster_shield"
  | "prophet_inspiration"
  | "heresy_ward"
  | "rift_redirect"
  | "dimension_boost"
  | "mutation_master"
  | "genetic_stabilizer"
  | "diplomatic_gift"
  | "amplifier_overcharge"
  | "war_preparation"
  | "temporal_shield"
  | "paradox_insight"
  | "universe_foundation";

export interface UpgradeDef {
  id: string;
  name: string;
  desc: (level: number) => string;
  baseCost: number;
  maxLevel: number;
  costGrowth: number;
  category: "automation" | "economy" | "acceleration" | "prestige" | "universal" | "layer";
  requiresWins?: number;
  // Layer id matching a key in `GameState.unlockedLayers`
  // (e.g. "enlightenment", "transcendence", "genesis", "apotheosis",
  // "singularity", "omnipotence", "divinity", "infinity", "eternity").
  // When set, the upgrade is hidden from the shop until that layer is unlocked.
  requiresLayer?: string;
  effect: { type: UpgradeEffectType; value: number };
}

export interface StoryEntry {
  id: string;
  title: string;
  body: string;
  stage: StageId | "meta";
  layer: string;
  trigger: string;
  category: "primary" | "stage" | "layer" | "choice" | "milestone";
}

export interface ArchiveEntry {
  runId: string;
  timestamp: number;
  stage: StageId;
  archetype: string;
  score: number;
  epEarned: number;
  duration: number;
  ending: string;
  notes?: string;
  favorite?: boolean;
}

export interface EventHistoryEntry {
  eventId: string;
  eventName: string;
  eventIcon: string;
  choiceId: string;
  choiceLabel: string;
  timestamp: number;
  gameTime: number;
}

export interface GameState {
  // Run state
  stageIndex: number;
  time: number;
  population: number;
  populationProgress: number; // 0-1 toward next population point
  maxPopulation: number; // peak population this run (for achievements)
  resources: Record<string, number>;
  capacities: Record<string, number>;
  ownedSystems: Record<string, number>;
  systemEnabled: Record<string, boolean>; // per-system on/off toggle
  technologies: Record<string, boolean>;
  archetypeAffinity: Record<string, number>; // drift during run
  lockedArchetype: string | null; // locked at Creature→Tribal
  log: string[];

  // Meta state
  evolutionPoints: number;
  totalRuns: number;
  galacticWins: number;
  stageClearCounts: Record<StageId, number>;
  fastestCellClear: number; // seconds, best time clearing Cell stage
  totalEventsResolved: number; // across all runs
  totalPlayTime: number; // seconds across all runs
  totalActions: number; // manual actions clicked across all runs
  totalSystemsBuilt: number; // systems built across all runs
  totalTechResearched: number; // techs researched across all runs
  upgrades: Record<string, number>;
  storyUnlocked: Record<string, boolean>;
  storyAcknowledged: Record<string, boolean>;
  archive: ArchiveEntry[];
  archivedArchetypes: string[];
  unlockedLayers: Record<string, boolean>;
  achievements: Record<string, boolean>; // earned achievements
  newAchievements: string[]; // queue of newly-earned achievement IDs for toast

  // Layer 1 — Challenges
  unlockedChallenges: boolean; // unlocked after first Galactic win
  activeChallenge: string | null; // challenge id currently in progress
  completedChallenges: Record<string, number>; // challengeId -> repeat count completed
  challengeRepeatCounts: Record<string, number>; // challengeId -> current repeat attempt
  showChallenges: boolean; // challenge modal visibility

  // Auto-action timers (game-time markers for periodic automation)
  autoTimers: { system: number; tech: number; evolve: number; challenge: number };

  // Layer 2 — Enlightenment (Foresight / Constellation Map)
  // Currency = Divinity (earned at prestige while this layer is unlocked).
  divinity: number;
  /** LEGACY compat: kept for old saves. Always `{}` in the new design. */
  foresightNodes: Record<string, boolean>;
  /** Currently active foresight route id (cosmetic / bonus layer). */
  activeForesightRoute: string | null;
  showEnlightenment: boolean;

  // Layer 2 — Constellation Map (the new L2 loop — see src/game/data/constellations.ts)
  /** starId → true (lit). All stars across all 88 constellations live in one map. */
  constellationStars: Record<string, boolean>;
  /** constellationId → count of lit stars. */
  constellationProgress: Record<string, number>;
  /** constellationId → started (≥1 lit star). */
  constellationsStarted: Record<string, boolean>;
  /** constellationId → fully lit (all stars illuminated). */
  constellationsCompleted: Record<string, boolean>;
  /** LEGACY compat: kept for old saves. Always `{}` in the new design. */
  constellationNodes: Record<string, boolean>;
  /** Connections revealed by Stargaze (constellationId → true). */
  constellationRevealed: Record<string, boolean>;
  /**
   * Active Cosmic Bridge link (null when not active). When active, illuminating
   * a star in either endpoint constellation ALSO illuminates the cheapest
   * unlit star in the other endpoint for free. Decays in the tick.
   */
  cosmicBridgeLink: { from: string; to: string; remaining: number } | null;
  /** Recommended-next glow: when true (Stargaze has been used), the modal
   *  highlights the cheapest affordable next star across all constellations. */
  stargazeRecommendedActive: boolean;

  // Layer 3 — Transcendence
  transcendenceOfferingsUsed: Record<string, number>; // offeringId -> repeat count
  purchasedRituals: Record<string, boolean>; // permanent rituals purchased
  activeTemporaryRituals: Record<string, number>; // ritualId -> remaining seconds
  activeScripts: Record<string, boolean>; // scriptId -> on
  bloodPactsUsed: Record<string, boolean>; // tierId -> used this run
  scriptTimers: Record<string, number>; // scriptId -> last-fired game-time
  showTranscendence: boolean;

  // Layer 4 — Genesis
  genesisSeeds: number; // currency for authoring worlds
  authoredWorlds: WorldConfig[]; // list of authored world configs (permanent bonuses)
  pendingWorldConfig: Partial<WorldConfig>; // current authoring selections
  showGenesis: boolean;

  // Layer 5 — Apotheosis
  faith: number; // currency for divine laws / miracles
  enactedDivineLaws: Record<string, boolean>;
  activeWorshipMode: string | null;
  performedMiracles: Record<string, number>; // miracleId -> count
  miracleTimers: Record<string, number>; // miracleId -> remaining seconds (for temporary effects)
  heresy: number; // 0-100; run ends at 100
  activeHeresyResponse: string; // default "hr_ignore"
  showApotheosis: boolean;

  // Layer 6 — Singularity (Universal Map redesign — adds rifts + anchors).
  // Singularity Cores are the L6 currency (spent to close rifts + place
  // reality anchors). Relics apply their bonus to the tick. Logic Cores +
  // Dimension Engine were the OLD L6 design — these legacy fields are kept
  // here for save-shape compat with pre-redesign store.ts code that still
  // references them. They are no-ops.
  singularityCores: number; // currency for closing rifts + placing anchors
  equippedRelics: Record<string, boolean>; // relicId -> equipped
  activeLogicCores: Record<string, boolean>; // LEGACY — kept for compat; no-op
  logicCoreTimers: Record<string, number>; // LEGACY — kept for compat; no-op
  showSingularity: boolean;
  // L6 Universal Map — 50 galaxies (10 L5 starter+rival + 40 NEW neutral).
  // Each NEW galaxy has 10-150 systems (totaling exactly 5,000). Each claimed
  // NEW system grants +198 worlds (5,000 × 198 = 990,000 new worlds; with
  // L4+L5's 10,000 baseline → 1,000,000 total at L6 cap).
  universalGalaxies: UniversalGalaxyState[];
  /** Active Old-God rifts the player must close. */
  rifts: Rift[];
  /** Reality Anchors placed on the universal map (anti-corruption coverage). */
  realityAnchors: RealityAnchor[];
  /** Countdown (seconds) to the next rift spawn. */
  riftSpawnTimer: number;
  /** # rifts closed this run (L6 → L7 unlock needs 20). */
  riftsClosed: number;
  /** # anchors placed (persists across prestiges; L6 → L7 unlock needs 10). */
  anchorsPlaced: number;

  // Layer 7 — Omnipotence (Bio-engineering)
  equippedHybrids: Record<string, boolean>; // LEGACY: kept for migration; unused by new logic
  activeOmnipotenceStance: string; // "contained" | "balanced" | "embraced"
  instability: number; // 0-100; creatures go rogue at 100 — run ends
  peakInstability: number; // peak this run (for unlock check)
  showOmnipotence: boolean;
  // NEW: Creature Lab
  creatures: Array<import("../data/omnipotence").Creature>;
  legions: Array<import("../data/omnipotence").Legion>;
  geneticInstability: number; // alias of instability (kept for clarity)
  creatureDesignDraft: { bodyType: string; diet: string; special: string; name: string } | null;

  // Layer 8 — Divinity (the layer; not the resource) — Divine Alliance
  prayer: number; // currency (preserved for legacy refs)
  prayerChannelLevels: Record<string, number>; // LEGACY: kept for migration
  activeDivineMask: string | null; // LEGACY: kept for migration
  activeWorshipPolarity: string | null; // LEGACY: kept for migration
  showDivinityLayer: boolean;
  // NEW: Divine Alliance
  minorGods: Array<import("../data/divinity_layer").MinorGod>;
  godRelationships: Record<string, number>; // godId -> 0-100
  alliances: Record<string, boolean>; // godId -> allied

  // Layer 9 — Infinity — Divine War
  echoes: number; // LEGACY: kept for migration
  purchasedEchoes: Record<string, boolean>; // LEGACY
  resolvedForks: Record<string, string>; // LEGACY
  takenFutureDebts: Record<string, boolean>; // LEGACY
  repaidFutureDebts: Record<string, boolean>; // LEGACY
  showInfinity: boolean;
  // NEW: Divine War
  oldGodBattles: Record<string, import("../data/infinity").BattleState>;
  divineFragments: number;

  // Layer 10 — Eternity — Ascension
  testamentClauses: number; // LEGACY: kept for migration (used as currency)
  purchasedTestamentClauses: Record<string, boolean>; // LEGACY
  activeCanonizations: Record<string, boolean>; // LEGACY
  activePermanenceWeaves: Record<string, boolean>; // LEGACY
  chosenEnding: string | null; // "preserve" | "reset" | null
  cosmicBoonStacks: number; // +1 per "Reset Universe" ending chosen
  showEternity: boolean;
  // NEW: Universe Creation
  universeRules: Array<string | null>; // 8 slots: physics, biology, magic, time, space, consciousness, death, rebirth
  keptGods: string[]; // minor god ids kept as part of the new pantheon

  // UI state
  currentTab: TabId;
  speed: number;
  paused: boolean;
  showShop: boolean;
  showEvolve: boolean;
  showSettings: boolean;
  activeStoryPopup: string | null;
  activeEvent: string | null; // ID of the currently-offered random event
  eventCooldown: number; // seconds until next event can fire
  eventHistory: EventHistoryEntry[]; // log of past event choices this run
  hasSeenIntro: boolean;
  lastSaved: number;

  // Tutorial
  tutorialStep: number;
  tutorialActive: boolean;
  tutorialDismissed: boolean;
  // Settings
  eventFrequency: "off" | "normal" | "frequent";

  // Theme customization (Part 1 — Stage Theme System)
  activeStageTheme: string;          // default "stage-cell"
  activeLayerTheme: string | null;   // null = no overlay
  activeSpecialTheme: string | null; // null = none (overrides stage+layer when set)
  unlockedThemes: Record<string, boolean>; // which themes are unlocked
  // Theme mode: "auto" = themes follow stage/layer automatically; "custom" = lock player's manual pick
  themeMode: "auto" | "custom";

  // ===== QUICK WINS =====
  // WIN 2 — Active ability cooldowns (runtime; persisted across refresh for fairness)
  activeAbilityCooldowns: Record<string, number>; // ability id → seconds remaining
  activeAbilityEffects: Record<string, number>;   // effect id ("surge"|"overclock"|"divine_combo") → seconds remaining

  // WIN 3 — Ritual combo tracking
  lastRitualTime: number;     // game-time of last ritual perform
  lastRitualId: string | null; // for "3 different rituals" requirement
  ritualComboCount: number;   // 0-3 — distinct rituals within 60s window
  ritualComboTimer: number;   // seconds remaining of Divine Combo bonus (+50% production)

  // WIN 5 — Prestige Points (universal currency)
  prestigePoints: number;

  // WIN 7 — Random layer event timers (game-time markers for periodic layer events)
  layerEventTimers: {
    trial_of_fortune: number;
    vision: number;
    divine_whim: number;
    heresy_surge: number;
  };

  // ===== REBUILD: LAYERS 1-6 UNIQUE GAMEPLAY LOOPS =====
  // Layer 1 — Trial Realms (mini-games)
  activeTrialRealm: string | null;              // currently open realm id
  trialRealmState: Record<string, any>;        // per-realm runtime state
  trialRealmsCompleted: Record<string, boolean>;
  trialRealmBestTimes: Record<string, number>; // realmId → best completion time (seconds) — LOCAL leaderboard (no login)
  // Layer 2 — Constellation Map: state fields live above (next to foresightNodes);
  // constellationRevealed, constellationStars, constellationProgress, constellationsStarted,
  // constellationsCompleted are declared alongside the other L2 fields.
  // Layer 3 — Divine Market (price simulation)
  marketPrices: Record<string, number>;        // resource id → current price
  priceHistory: Record<string, number[]>;     // resource id → last N prices (sparkline)
  marketOwnedResources: Record<string, number>; // resource id → units owned
  marketTickTimer: number;                     // seconds until next price tick
  // FEATURE 3 — Market Crashes
  marketCrashTimer: number;                    // seconds until next crash check
  marketCrashActive: boolean;
  marketCrashDuration: number;                 // seconds remaining of crash
  // Layer 4 — Sacred Grid (LEGACY — replaced by galaxySystems below; worldGrid
  // kept as an empty array for save-shape compat). worldGridSeeds also legacy.
  worldGrid: Array<string | null>;             // LEGACY — 20 cells; no longer used
  worldGridSeeds: Array<string | null>;        // LEGACY — always empty
  // FEATURE 4 — Natural Disasters (LEGACY — disaster logic removed in L4 redesign)
  disasterTimer: number;                       // seconds until next disaster roll (legacy)
  lastDisasterCell: number | null;             // last affected cell (legacy, unused)
  lastDisasterAt: number;                      // game-time of last disaster (legacy, unused)
  // Layer 4 — Galaxy Claim (the new L4 loop). 50 star systems on a hex spiral.
  // Each claimed system grants its bonus (production/cap/EP/pop), +10 worlds
  // to the Divine Engine, and adjacency synergy if 2+ neighbors are claimed.
  galaxySystems: GalaxySystemState[];
  // Layer 5 — Heresy Web (8×4 = 32 follower cells) — LEGACY followerGrid is
  // kept empty for save-shape compat; the new per-galaxy grids live in
  // galaxyFollowerGrid below.
  followerGrid: Array<{ state: string; type: string }>; // LEGACY — kept empty
  heresySpreadTimer: number;                   // seconds until next spread tick (per-galaxy cycle)
  heresySeedTimer: number;                     // seconds until next auto-seed of a heretic (per-galaxy cycle)
  heresyThresholdsSeeded: Record<string, boolean>; // LEGACY — kept for save compat
  // FEATURE 5 — Prophets (now per-galaxy: { galaxyId, cellIndex, lastConvertedAt })
  prophets: Array<{ galaxyId: string; cellIndex: number; lastConvertedAt: number }>;
  prophetConvertTimer: number;                  // seconds until next prophet conversion tick
  // === NEW (L5 redesign — Galactic Conquest) ===
  /** Per-galaxy heresy level (galaxyId → 0-100). Resets to 50 after a system-loss tick. */
  galaxyHeresy: Record<string, number>;
  /** Per-galaxy 8×4 heresy follower grid (galaxyId → 32 cells). */
  galaxyFollowerGrid: Record<string, Array<{ state: string; type: string }>>;
  /** Per-galaxy rival star systems (galaxyId → list of { id, claimed, explored }). */
  galaxyRivalSystems: Record<string, RivalSystemState[]>;
  /** galaxyId → fully conquered. Drives the L5 → L6 unlock (3+ conquered). */
  conqueredGalaxies: Record<string, boolean>;
  /** Currently selected galaxy tab in the Apotheosis modal (cosmetic; persisted). */
  selectedGalaxyId: string;
  // Layer 6 — Dimension Engine (parallel dimensions)
  dimensions: Array<{
    id: number;
    name: string;
    speed: number;       // 1 | 0.5 | 0.25
    pop: number;
    stageIndex: number;
    resources: number;   // abstract pooled resource
    reachedGalactic: boolean;
  }>;
  dimensionRiftTimer: number;                  // seconds until next rift event

  // ===== FEATURE ENHANCEMENTS (L7–L10) =====
  // FEATURE 7 — Mutations: creatures can mutate on creation (50% stronger, +20% instability)
  // Mutated flag stored on the creature itself (see omnipotence.ts Creature interface)
  // FEATURE 8 — Amplifiers: divine network nodes that double Negotiate gains
  amplifiers: Array<{ id: number; godId: string }>;
  // FEATURE 9 — Temporal Storms (per-battle): shuffle timeline, delays/accelerates enemy attacks
  temporalStorms: Record<string, boolean>;     // oldGodId → storm active
  // FEATURE 10 — Forbidden Words: paradox counter; ≥3 resets universe creation
  universeParadox: number;

  // ===== BACKGROUND-SIMULATION =====
  // The base game (Cell → Galactic) becomes abstracted and simulated in the
  // background once the player unlocks Layer 2 (Enlightenment). Sims are
  // computed from constellation stars lit, NOT from prestiging.
  // peakProductionRate: best per-second total resource production ever
  //   achieved across all runs (META — persists across prestiges).
  // backgroundSimulations: COMPUTED each tick = (3 starter + starsLit) × simMult.
  //   No longer a stored counter — derived from constellation state + shop upgrade.
  //   Stored as a cached value for display, recomputed every tick.
  // divinityFromBackground: lifetime Divinity earned from background sims (META).
  // epFromBackground: lifetime EP earned from background sims (META).
  peakProductionRate: number;
  backgroundSimulations: number;
  divinityFromBackground: number;
  epFromBackground: number;
}

export interface GameStore extends GameState {
  // Actions
  tick: (dt: number) => void;
  performAction: (actionId: string) => void;
  buySystem: (systemId: string, qty: number) => void;
  toggleSystem: (systemId: string) => void;
  enableAllSystems: (enabled: boolean) => void;
  buyTech: (techId: string) => void;
  buyUpgrade: (upgradeId: string) => void;
  evolveStage: () => void;
  triggerPrestige: () => void;
  setTab: (tab: TabId) => void;
  setSpeed: (speed: number) => void;
  togglePause: () => void;
  setShowShop: (v: boolean) => void;
  setShowEvolve: (v: boolean) => void;
  setShowSettings: (v: boolean) => void;
  setShowChallenges: (v: boolean) => void;
  setActiveChallenge: (challengeId: string | null) => void;
  dismissTutorial: () => void;
  resolveEvent: (eventId: string, choiceId: string) => void;
  setEventFrequency: (freq: "off" | "normal" | "frequent") => void;
  dismissStory: (id: string) => void;
  dismissAchievementToast: () => void;
  applyOfflineProgress: () => { elapsed: number; resourcesGained: Record<string, number>; applied: boolean } | null;
  hardReset: () => void;
  saveGame: () => void;
  loadGame: () => void;
  exportSave: () => string;
  importSave: (data: string) => boolean;
  addToLog: (msg: string) => void;
  debugUnlockAll: () => void;

  // Layer 2 — Enlightenment (Foresight / Constellation Map)
  setShowEnlightenment: (v: boolean) => void;
  /** LEGACY stub — old action, kept for compatibility. No-op in the new design. */
  purchaseForesightNode: (nodeId: string) => void;
  setForesightRoute: (routeId: string | null) => void;
  /**
   * Layer 2 — Constellation Map: illuminate a single star within a constellation.
   * Deducts Divinity via `starCost()`, sets `constellationStars[starId] = true`,
   * increments `constellationProgress[constellationId]`, marks the constellation
   * as started, and — if all stars lit — marks it completed (bonus applies).
   */
  illuminateStar: (constellationId: string, starId: string) => void;

  // Layer 3 — Transcendence
  setShowTranscendence: (v: boolean) => void;
  performOffering: (offeringId: string) => void;
  performRitual: (ritualId: string) => void;
  toggleScript: (scriptId: string) => void;
  performBloodPact: (tierId: string) => void;

  // Layer 4 — Genesis
  setShowGenesis: (v: boolean) => void;
  setPendingWorldConfig: (cfg: Partial<WorldConfig>) => void;
  authorWorld: () => void;

  // Layer 5 — Apotheosis
  setShowApotheosis: (v: boolean) => void;
  enactDivineLaw: (lawId: string) => void;
  setWorshipMode: (modeId: string | null) => void;
  performMiracle: (miracleId: string) => void;
  setHeresyResponse: (responseId: string) => void;

  // Layer 6 — Singularity (Universal Map redesign)
  setShowSingularity: (v: boolean) => void;
  toggleRelicLoadout: (relicId: string) => void;
  /** LEGACY — Logic Cores were deprecated in favor of Reality Anchors; kept as no-op stub. */
  toggleLogicCore: (coreId: string) => void;
  /** Close an active rift — spend Singularity Cores (scales with severity). */
  closeRift: (riftId: string) => void;
  /** Place a Reality Anchor on a galaxy — spend Singularity Cores (scales with anchors placed). */
  placeRealityAnchor: (galaxyId: string) => void;
  /** Attack a NEW neutral universal galaxy — spend Faith, claim 1 system. */
  attackUniversalGalaxy: (galaxyId: string) => void;

  // Layer 7 — Omnipotence (Bio-engineering)
  setShowOmnipotence: (v: boolean) => void;
  toggleHybridLineage: (hybridId: string) => void; // LEGACY stub
  setOmnipotenceStance: (stanceId: string) => void;
  // NEW: Creature Lab actions
  setCreatureDesignDraft: (draft: { bodyType: string; diet: string; special: string; name: string } | null) => void;
  createCreature: () => void;
  addCreatureToLegion: (creatureId: string, legionId: string) => void;
  removeCreatureFromLegion: (creatureId: string, legionId: string) => void;
  createLegion: (name: string) => void;
  deleteLegion: (legionId: string) => void;

  // Layer 8 — Divinity (layer) — Divine Alliance
  setShowDivinityLayer: (v: boolean) => void;
  levelPrayerChannel: (channelId: string) => void; // LEGACY stub
  setDivineMask: (maskId: string | null) => void; // LEGACY stub
  setWorshipPolarity: (polarityId: string | null) => void; // LEGACY stub
  // NEW: Divine Alliance actions
  negotiateWithGod: (godId: string) => void;
  tradeWithGod: (godId: string) => void;
  formAlliance: (godId: string) => void;

  // Layer 9 — Infinity — Divine War
  setShowInfinity: (v: boolean) => void;
  purchaseEcho: (echoId: string) => void; // LEGACY stub
  resolveFork: (forkId: string, branchId: string) => void; // LEGACY stub
  takeFutureDebt: (debtId: string) => void; // LEGACY stub
  repayFutureDebt: (debtId: string) => void; // LEGACY stub
  // NEW: Divine War actions
  startOldGodBattle: (oldGodId: string) => void;
  deployLegionToBattle: (oldGodId: string, legionId: string) => void;
  callAllyToBattle: (oldGodId: string, godId: string) => void;
  attackOldGod: (oldGodId: string) => void;

  // Layer 10 — Eternity — Ascension
  setShowEternity: (v: boolean) => void;
  purchaseTestamentClause: (clauseId: string) => void; // LEGACY stub
  toggleCanonization: (canonId: string) => void; // LEGACY stub
  togglePermanenceWeave: (weaveId: string) => void; // LEGACY stub
  chooseEnding: (endingId: "preserve" | "reset") => void;
  // NEW: Universe Creation actions
  setUniverseRule: (slotIndex: number, optionId: string) => void;
  toggleKeptGod: (godId: string) => void;

  // Theme customization
  setStageTheme: (id: string) => void;
  setLayerTheme: (id: string | null) => void;
  setSpecialTheme: (id: string | null) => void;
  setThemeMode: (mode: "auto" | "custom") => void;

  // ===== QUICK WINS =====
  // WIN 2 — Active abilities (one per prestige layer)
  useActiveAbility: (layerId: string) => void;
  // WIN 5 — Universal shop upgrade purchase (spends Prestige Points)
  buyUniversalUpgrade: (upgradeId: string) => void;

  // ===== REBUILD: LAYERS 1-6 UNIQUE GAMEPLAY LOOPS =====
  // Layer 1 — Trial Realms
  setActiveTrialRealm: (realmId: string | null) => void;
  realmBreakthrough: () => void;             // Realm of Growth click
  realmDiscontentAction: (action: "celebrate" | "tax" | "ignore") => void;
  // TRIALS-7 — 7 newly playable realms
  realmFaminePump: (resourceId: "a" | "b" | "c") => void;          // Realm of Famine — push converter forward
  realmIgnoranceBuyNode: (nodeId: number) => void;                 // Realm of Ignorance — unlock a tech node
  realmStagnationUpgrade: (stage: number) => void;                 // Realm of Stagnation — upgrade a stage
  realmWeaknessPlaceTower: () => void;                             // Realm of Weakness — buy a tower
  realmPurityBuildSystem: () => void;                              // Realm of Purity — build a system
  realmAsceticBuildSystem: (systemId: number) => void;            // Realm of the Ascetic — build one of 7 unique systems

  // Layer 2 — Constellation Map
  /** LEGACY stub — old action signature, kept for compatibility. No-op. */
  illuminateConstellationNode: (nodeId: string) => void;
  // Legacy stubs (kept for save-compat — no-ops)
  stargazeReveal: () => void;
  supernovaIlluminate: (constellationId: string, starId: string) => void;
  blackHoleReset: (constellationId: string) => void;
  activateCosmicBridge: (fromConstellationId: string, toConstellationId: string) => void;

  // Layer 3 — Divine Market
  marketBuyResource: (resourceId: string, qty: number) => void;
  marketSellResource: (resourceId: string, qty: number) => void;
  marketOffering: (resourceId: string, qty: number) => void; // spend resource → gain Divinity scaled by price

  // Layer 4 — Sacred Grid
  placeGridTile: (cellIndex: number, tileType: string) => void;
  resetWorldGrid: () => void;

  // Layer 5 — Heresy Web (Galactic Conquest redesign; per-galaxy)
  convertFollower: (galaxyId: string, cellIndex: number) => void;
  purgeFollower: (galaxyId: string, cellIndex: number) => void;
  initFollowerGrid: (galaxyId: string) => void;
  /** Attack a rival galaxy: spend Faith, claim the next unclaimed system. */
  attackGalaxy: (galaxyId: string) => void;
  /** Select a galaxy tab in the Apotheosis modal (cosmetic; persists). */
  setSelectedGalaxyId: (galaxyId: string) => void;

  // Layer 6 — Dimension Engine (LEGACY — Dimension Engine was REMOVED in the
  // Universal Map redesign. These action signatures are kept as no-op stubs
  // for save-compat; calling them does nothing. Use `closeRift`,
  // `placeRealityAnchor`, `attackUniversalGalaxy` instead.)
  setDimensionSpeed: (dimId: number, speed: number) => void;
  syncDimension: (fromId: number, toId: number) => void;
  initDimensions: () => void;
  // FEATURE 6 — Collapse two dimensions of the same stage into one (combined speed + resources)
  collapseDimensions: (fromId: number, toId: number) => void;

  // ===== FEATURE ENHANCEMENTS =====
  // FEATURE 5 — Prophets (per-galaxy: place/remove on a galaxy's heresy grid)
  placeProphet: (galaxyId: string, cellIndex: number) => void;
  removeProphet: (galaxyId: string, cellIndex: number) => void;
  // FEATURE 8 — Amplifiers
  placeAmplifier: (godId: string) => void;
  removeAmplifier: (godId: string) => void;
  // FEATURE 9 — Temporal Storms
  stabilizeTime: (oldGodId: string) => void;
  // FEATURE 10 — Forbidden Words
  resolveParadox: () => void;

  // ===== BACKGROUND-SIMULATION =====
  // backgroundSimulations is now COMPUTED from (3 + starsLit) × simMult.
  // No manual spawn action — sims come from lighting constellation stars.
  // (The spawnBackgroundSimulation action was removed; sim amplifier is a shop upgrade.)
}
