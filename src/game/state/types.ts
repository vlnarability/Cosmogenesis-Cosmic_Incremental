// Core game type definitions for Cosmogenesis

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
  | "actions" | "systems" | "production" | "tech" | "story" | "world"
  | "codex" | "achievements" | "archive" | "log" | "shop" | "prestige"
  // LAYER-AS-TAB — 10 prestige-layer inline tabs
  | "trials" | "constellations" | "market" | "galaxy" | "conquest"
  | "universe" | "lab" | "diplomacy" | "war" | "genesis_engine"
  // DIVINE-ENGINE-TAB — the god's control panel for reality
  | "divine_engine";

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
  // If set, the system is only visible/buildable when the player's
  // `lockedArchetype` matches this archetype id (archetype-locked
  // systems in Tribal→Galactic stages).
  requiredArchetype?: string;
  // Population-growth systems: flat per-second contribution to
  // `populationProgress` (independent of resource production).
  popGrowth?: number;
  // SYSTEM-PREREQ — if set, this system requires another system to be
  // owned (count > 0) before it can be built. Used for chains like
  // Mammary Gland requires Mammary Precursor.
  requiredSystem?: string;
  // SYSTEM-EXCLUSIVITY — if set, buying this system is blocked while
  // any of the listed system ids are owned. Used for mutually-exclusive
  // biological strategies (e.g. cold-blood vs warm-blood).
  exclusiveWith?: string[];
  // RARE-RESOURCE-UNLOCK — if set, this system is only visible/buildable
  // when the player has discovered the named rare resource (count >= 1 in
  // rareResources state). Used for systems unlocked by trade/hunt/rival
  // rare drops (see rareResources.ts for the mapping).
  requiresRareResource?: string;
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
  // If set, the tech is only visible/researchable when the player's
  // `lockedArchetype` matches this archetype id.
  requiredArchetype?: string;
  // EITHER-OR — researching this tech LOCKS OUT the listed tech ids.
  exclusiveWith?: string[];
  // PART-1 — hide this tech from the Tech tab. Used for the 6 "modal-choice"
  // techs (3 FTL methods + 3 ascension paths) — these are NEVER researchable
  // directly from the Tech tab. They're only obtainable via the choice modal
  // that fires when the prerequisite tech (ftl_theory / ascension_theory) is
  // researched. The chosen one gets auto-researched; the others stay hidden.
  hiddenFromTechTab?: boolean;
  // RARE-RESOURCE-UNLOCK — if set, this tech is only visible/researchable
  // when the player has discovered the named rare resource (count >= 1 in
  // rareResources state). Used for techs unlocked by trade/hunt/rival
  // rare drops (see rareResources.ts for the mapping).
  requiresRareResource?: string;
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
    // STAGE-PREREQ-SYSTEMS — systems that MUST be owned (count > 0)
    // to evolve past this stage. Used to gate evolution behind key
    // biological milestones (e.g. Nucleus required to evolve Cell→Creature).
    requiresSystems?: string[];
    /** At least ONE of the listed systems must be owned (either/or paths,
     * e.g. the 3 FTL infrastructure systems for Solar→Galactic). */
    requiresOneOfSystems?: string[];
    // PART-1-STAGE-PROGRESSION — per-stage unique evolve requirements.
    // Each stage transition has its own thematic gate beyond the basic
    // pop/systems/tech stat-check. See DESIGN-PROPOSALS.md for the
    // confirmed per-stage requirement design.
    /** All listed techs must be researched to evolve. */
    requiresTechs?: string[];
    /** At least ONE of the listed techs must be researched (either/or paths,
     * e.g. the 3 FTL methods for Solar→Galactic, the 3 ascension paths for
     * Galactic→Prestige). */
    requiresOneOfTechs?: string[];
    /** All NPC rivals must be resolved (state !== "active") to evolve.
     * Used by Creature→Tribal (conquer/merge with rival creatures) and
     * Empire→Solar (ally with or wipe out all rival empires). */
    requiresRivalsResolved?: boolean;
    /** Player must have chosen a government (not auto-assigned) to evolve.
     * Used by Tribal→Civilization. Choosing causes a happiness hit that
     * the player must recover from before evolving. */
    requiresGovernmentChosen?: boolean;
    /** Happiness must be >= this value to evolve. Used alongside
     * requiresGovernmentChosen to gate on the post-choice recovery. */
    requiresHappinessThreshold?: number;
    /** Minimum count of established trade routes to evolve. Used by
     * Civilization→Empire (requires multiple trade routes). */
    requiresTradeRoutes?: number;
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
  | "universe_foundation"
  // Universal auto-buyers (PP-SHOP-TABS — purchased with Prestige Points):
  // Each unlocks a periodic automation chain in the tick. The auto-buyer
  // for layer N unlocks when layer N+1 unlocks (per the chain spec).
  | "auto_light_stars"           // L2 → L3 unlock
  | "auto_invest_market"          // L3 → L4 unlock
  | "auto_claim_systems"          // L4 → L5 unlock
  | "auto_manage_heresy"          // L6 → L7 unlock
  | "auto_place_anchors"          // L6 → L7 unlock (anchor placement)
  | "auto_negotiate"              // L8 → L9 unlock
  | "auto_attack_old_gods"        // L9 → L10 unlock
  | "auto_author_universes"       // L10 finished
  | "ep_auto_converter";          // L2+ — converts EP to PP at 1:1

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
  // GOVERNMENT-SYSTEMS — auto-assigned when the player enters Empire stage.
  // Derived from locked archetype (forced archetype government) OR, when no
  // archetype government applies, from the most-researched Civilization-stage
  // tech branch (Military / Science / Culture / Economics). Null until Empire.
  activeGovernment: string | null;
  // PART-1 — Tribal→Civ government choice. When the player chooses a
  // government via `chooseGovernment(govId)`, it's stored here as "pending"
  // (not active until evolve). Choosing causes a happiness hit. Evolve-to-Civ
  // is gated on `pendingGovernment !== null`.
  pendingGovernment: string | null;
  // PART-2-LAYER-A — Trade agreements. Map of partnerId → { established: number (timestamp), relation: number }.
  // Drives the Layer A Trade system + the Civ→Empire evolve gate (requiresTradeRoutes).
  tradeAgreements: Record<string, {
    established: number; relation: number;
    /** TRADE-SHIPMENTS — 0..1 progress toward the next delivery. */
    shipmentProgress?: number;
    /** Lifetime shipments received from this partner. */
    totalShipments?: number;
    /** Last delivery (transient UI hint — cleared on load; not used for logic). */
    lastShipment?: { resource: string; amount: number; rare?: string; at: number };
    /** F4 REPUTATION — 0..100 partner reputation, grown by +1 per shipment
     *  delivered. Tiered benefits unlock at 20/40/70/90 (Friendly / Trusted /
     *  Esteemed / Exalted): bigger shipments, effective caravans, boosted rare
     *  odds, and occasional bonus-rare shipments. Derived tier is computed in
     *  the UI; this field is the raw accrual. */
    reputation?: number;
  }>;
  // PART-2-LAYER-C — NPC rival civilizations. Each rival has:
  //   id, name, stage (which stage it appears at), state ("active"|"allied"|"conquered"|"merged"),
  //   threat (0-100, grows over time), relation (-100 to +100), strength (scales with player).
  // Creature→Tribal + Empire→Solar evolve gates check `rivals.every(r => r.state !== "active")`.
  // ASSIMILATION-COST-REDUCTION: counteredRaids reduces military cost;
  //   successfulTrades reduces culture cost (per user spec).
  rivals: Array<{
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
    // Per-rival multipliers from the procedural name (determine growth rates).
    popGrowthMult: number;   // modifierMult × nounMult
    militaryMult: number;    // modifierMult × conceptMult
  }>;
  // PART-2-LAYER-A/B/C — rare resource discoveries. Map of rareResourceId → count.
  // Obtained from trade partners (rareDrop chance), hunting (huntNow 15% chance),
  // and rival counter-raid loot. Each discovery unlocks a special system or tech
  // (see rareResources.ts for the unlock mapping).
  //
  // F1 RELIQUARY — the stockpile IS now consumable: spend 1 via consumeRare()
  // to bank a permanent production bonus (reliquary[]). The discovery flag is
  // (rareResources[id] + reliquary[id]) >= 1, so consuming down to 0 keeps the
  // unlock intact as long as you've ever owned one. This creates a real choice:
  // hoard rares for future unlocks, or consume the surplus for compounding buffs.
  rareResources: Record<string, number>;
  /** F1 RELIQUARY — rareResourceId → count consumed for permanent bonuses.
   *  Drives reliquaryBonus (per-resource production mult) in the tick.
   *  Caps at the rare's `reliquary.maxConsume` (data/rareResources.ts). */
  reliquary: Record<string, number>;
  /** F2 DEEP HUNT — `time` (in-game seconds) of the last Deep Hunt. Drives
   *  the 120s cooldown bar. Pause/speed-safe because it's in game-time, not
   *  wall-clock. */
  lastDeepHuntAt: number;
  // PART-2-LAYER-D — Treaties. Map of partnerId → treaty info.
  // Each treaty is signed with a trade partner OR a rival NPC. Treaty types:
  //   trade_agreement: +20% trade bonus for this partner
  //   non_aggression: rival threat growth ×0.5
  //   mutual_defense: auto-win defense when raided by this rival
  //   research_pact: +10% science production
  // Treaties require a minimum relation with the partner. Breaking a treaty
  // drops relation and may cause hostility.
  treaties: Record<string, {
    type: "trade_agreement" | "non_aggression" | "mutual_defense" | "research_pact";
    signedAt: number;
  }>;
  // PART-1 — choice modal state. Each modal fires when the corresponding
  // prerequisite tech is researched. The choice is permanent (one-shot).
  showFtlChoice: boolean;
  showAscensionChoice: boolean;
  showGovernmentChoice: boolean;
  ftlChoice: string | null;          // warp_theory | hyperlanes | jump_theory
  ascensionChoice: string | null;    // tech_ascension | bio_ascension | psionic_ascension
  // PART-2-LAYER-C — active raid event. Set when a rival's threat hits 100%.
  // The RaidModal opens; player chooses Defend (auto-roll) or Counter-Attack
  // (spend military for guaranteed win + loot). Null when no raid is active.
  activeRaid: string | null;
  // RAID-RECAP — outcome summary of the most recently resolved raid, shown
  // by the RaidRecapBanner for a few seconds after resolution. Transient
  // (excluded from persistence — an old banner should never re-appear on
  // reload). Carries just enough numbers to explain the result (win chance,
  // roll, losses/loot) without full dice math.
  lastRaidOutcome: {
    rivalName: string;
    rivalIcon: string;
    action: "defend" | "counter";
    won: boolean;
    winChance: number;          // 0-1, as shown in the modal
    roll: number;               // 0-100 die roll (defend only; 100 for counter)
    resourceLoss?: Record<string, number>; // per-resource 10% losses (defend loss)
    loot?: { gold: number; culture: number }; // counter-attack loot
    counteredRaids?: number;    // rival's new counter-raid count (counter only)
    at: number;                 // Date.now() when resolved
  } | null;
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
  // ARCHETYPES-REWORK — which of the 13 lineage archetypes the player has
  // EVER locked in (at Creature → Tribal evolution). Persists across
  // prestiges. Drives the "???" reveal state on the ArchetypeRadar —
  // undiscovered archetypes display as ??? until first lock-in.
  //
  // NOTE: distinct from `discoveredArchetypes` (Genesis Engine Layer-10
  // procedural archetypes — keys are `arch_NNN`, not lineage ids).
  revealedLineageArchetypes: Record<string, boolean>;
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
  // PP-SHOP-TABS — extended with universal auto-buyer timers (one per layer's
  // automation upgrade). Each timer marks the next game-time the auto-buyer
  // is allowed to fire. -1 / missing means "not yet active".
  autoTimers: {
    system: number;
    tech: number;
    evolve: number;
    challenge: number;
    // Universal auto-buyers (PP-SHOP-TABS):
    light_stars: number;       // auto_light_stars — every 20s
    invest_market: number;     // auto_invest_market — every 30s
    claim_systems: number;      // auto_claim_systems — every 15s
    manage_heresy: number;      // auto_manage_heresy — every 15s
    place_anchors: number;      // auto_place_anchors — every 60s
    negotiate: number;          // auto_negotiate — every 30s
    attack_old_gods: number;    // auto_attack_old_gods — every 10s
    author_universes: number;   // auto_author_universes — every 120s
  };

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
  authoredWorlds: WorldConfig[]; // list of authored world configs (permanent bonuses)
  pendingWorldConfig: Partial<WorldConfig>; // current authoring selections
  showGenesis: boolean;

  // Layer 5 — Apotheosis
  faith: number; // currency for divine laws / miracles
  enactedDivineLaws: Record<string, boolean>;
  activeWorshipMode: string | null;
  performedMiracles: Record<string, number>; // miracleId -> count
  miracleTimers: Record<string, number>; // miracleId -> remaining seconds (for temporary effects)
  heresy: number; // 0-100; DERIVED display value = average of owned galaxies' galaxyHeresy (run ends at 100)
  activeHeresyResponse: string; // default "hr_ignore"
  showApotheosis: boolean;

  // Layer 6 — Singularity (Universal Map redesign — adds rifts + anchors).
  // Singularity Cores are the L6 currency (spent to close rifts + place
  // reality anchors). Relics apply their bonus to the tick.
  singularityCores: number; // currency for closing rifts + placing anchors
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
  activeOmnipotenceStance: string; // "contained" | "balanced" | "embraced"
  instability: number; // 0-100; at 100 creatures go rogue (lose a system, reset to 50)
  showOmnipotence: boolean;
  // NEW: Creature Lab
  creatures: Array<import("../data/omnipotence").Creature>;
  legions: Array<import("../data/omnipotence").Legion>;
  geneticInstability: number; // alias of instability (kept for clarity)
  creatureDesignDraft: { bodyType: string; diet: string; special: string; name: string } | null;
  // NEW: Skirmish Arena — outpost raids + creature XP/levels
  outpostRaids: Array<import("../data/omnipotence").OutpostRaid>;
  raidsRepelled: number;                          // count toward L7 → L8 unlock
  activeOutpostRaid: string | null;              // currently selected raid id
  creatureXp: Record<string, number>;            // creature id → XP
  creatureLevels: Record<string, number>;        // creature id → level (1+)
  outpostRaidSpawnTimer: number;                  // seconds until next raid spawn tick
  // NOTE: Auto-Manage Heresy uses `autoTimers.manage_heresy` (defined under
  // GameState.autoTimers) — no separate field needed here.

  // Layer 8 — Divinity (the layer; not the resource) — Divine Alliance
  showDivinityLayer: boolean;
  // NEW: Divine Alliance
  minorGods: Array<import("../data/divinity_layer").MinorGod>;
  godRelationships: Record<string, number>; // godId -> 0-100
  alliances: Record<string, boolean>; // godId -> allied

  // Layer 9 — Infinity — Divine War
  showInfinity: boolean;
  // NEW: Divine War
  oldGodBattles: Record<string, import("../data/infinity").BattleState>;
  divineFragments: number;

  // Layer 10 — Eternity — Genesis Engine (crucible + divine relics + 100 archetypes)
  chosenEnding: string | null; // "preserve" | "reset" | null — shown on ending screen
  cosmicBoonStacks: number; // +1 per "Explore another Dimension" reset (ending screen)
  showEternity: boolean;
  // Dimension system — the active dimension (visual/naming reskin). Persists across prestiges.
  // L10-ENDING-L5-UI-UNLOCKTECH — dimensions the player has visited (always
  // starts with ["mundane"]). Future: unlocks additional dimensions by
  // finishing L10 in each one. Currently only "mundane" is selectable on the
  // ending-screen dimension picker.
  activeDimension: string; // "mundane" | "fantasy" | "cyberpunk" | ...
  visitedDimensions: string[]; // list of dimension ids the player has explored
  // NEW: Genesis Engine state
  //   divineRelics        — inventory of relics (each with rules + revealed state)
  //   crucibleRelicIds    — relic ids currently loaded into the crucible (max 5)
  //   discoveredArchetypes — archetype id → discovered (need all 100 to win)
  //   universeSimulating  — true during the 30s Big Bang animation
  //   simulationStartTime — game-time when the current Big Bang started
  //   lastSimulationResult — null until the first Big Bang completes
  divineRelics: Array<import("../data/genesisEngine").DivineRelic>;
  crucibleRelicIds: string[];
  discoveredArchetypes: Record<string, boolean>;
  universeSimulating: boolean;
  simulationStartTime: number;
  lastSimulationResult: {
    stable: boolean;
    archetypeId: string | null;
    relicsGained: number;
    relicsLost: number;
    instability: number;
  } | null;

  // UI state
  currentTab: TabId;
  speed: number;
  paused: boolean;
  showShop: boolean;
  showEvolve: boolean;
  showSettings: boolean;
  /**
   * FIX-UI-TABS — Tab restructure. Log/Archive/Codex/Awards no longer
   * live on the main tab bar; they're accessed via the gear dropdown
   * and open in a shared modal. `activeInfoModal` holds the target id
   * ("log" | "archive" | "codex" | "achievements") or null when closed.
   * The InfoModal component in GameShell wraps the corresponding tab
   * component (LogTab / ArchiveTab / CodexTab / AchievementsTab) in a
   * Dialog.
   */
  activeInfoModal: "log" | "archive" | "codex" | "achievements" | "stats" | null;
  /**
   * P6 — Modal Consolidation. Single source-of-truth for which layer modal
   * is open. Holds the layer id ("enlightenment", "transcendence", ...,
   * "eternity", "challenges") or null when closed. The LayerModal component
   * renders the appropriate lazy-loaded content inside a single shared
   * <Dialog> wrapper based on this value.
   *
   * The legacy per-layer `show*` booleans are still set in parallel for
   * save-compat / any code that still reads them.
   */
  activeLayerModal: string | null;
  /**
   * P7 — Error states. When a purchase fails (buySystem / buyTech /
   * buyUpgrade / buyUniversalUpgrade) due to insufficient resources, the
   * store sets this field. UIs that show purchase buttons subscribe to it
   * and surface the message inline (auto-fades after ~2s via the consumer
   * hook). `ts` is the timestamp of the failure, used by consumers to
   * retrigger their fade-out timer when the same message repeats.
   */
  lastPurchaseError: { message: string; ts: number } | null;
  activeStoryPopup: string | null;
  activeEvent: string | null; // ID of the currently-offered random event
  eventTimer: number; // seconds remaining before auto-resolve (60s timeout with default choice)
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
  /** REDUCE-MOTION — when true, disables decorative animations (number tween,
   *  caravan bob, rival pulse, rare shimmer, threat pulse). Honors the OS
   *  prefers-reduced-motion via the CSS @media block too; this toggle is an
   *  opt-in override for users who want calm without changing their OS. */
  reduceMotion: boolean;

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
  // Layer 1 — Trial Realms were REMOVED in CLEANUP-LEGACY. The canonical L1
  // system is now `challenges.ts` (10 run-modifier challenges tracked via
  // `activeChallenge` + `completedChallenges`).
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
  // Layer 3 — DIVINE INVESTMENT MARKET (new design). Worlds (background
  // simulations) can be allocated across 5 investment portfolios (Growth,
  // Transcendence, Chaos, Stability Bonds, Old God Futures). Each portfolio
  // pays Divinity dividends × its baseYield, but riskier portfolios may crash
  // and consume a fraction of allocated worlds. See src/game/data/marketPortfolios.ts.
  /** portfolioId → number of worlds currently allocated to that portfolio. */
  portfolioAllocations: Record<string, number>;
  /** portfolioId → seconds remaining before worlds can be deallocated
   *  (Stability Bonds lock worlds for 120s on allocation). */
  portfolioLockTimers: Record<string, number>;
  /** portfolioId → current price (random walk, 50–200; starts at 100). Buy low,
   *  sell high — the price is currently cosmetic (drives the sparkline + the
   *  "cheap / expensive" hint on the card). */
  portfolioPrices: Record<string, number>;
  /** Lifetime Divinity earned from portfolio dividends (META — display only). */
  portfolioDividendsEarned: number;
  // Layer 4 — Sacred Grid was REMOVED in the L4 redesign (replaced by
  // `galaxySystems` below). Natural Disasters were also removed.
  // Layer 4 — Galaxy Claim (the new L4 loop). 50 star systems on a hex spiral.
  // Each claimed system grants its bonus (production/cap/EP/pop), +10 worlds
  // to the Divine Engine, and adjacency synergy if 2+ neighbors are claimed.
  galaxySystems: GalaxySystemState[];
  // Layer 5 — Heresy Web (8×4 = 32 follower cells) — per-galaxy grids live in
  // `galaxyFollowerGrid` below.
  heresySpreadTimer: number;                   // seconds until next spread tick (per-galaxy cycle)
  heresySeedTimer: number;                     // seconds until next auto-seed of a heretic (per-galaxy cycle)
  /** Per-galaxy threshold tracking. Keys are `${galaxyId}:${threshold}` (threshold ∈ {25,50,75}). */
  heresyThresholdsSeeded: Record<string, boolean>;
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
  // Layer 6 — Dimension Engine was REMOVED in the Universal Map redesign.
  // The canonical L6 state lives in `universalGalaxies` (built via
  // makeInitialUniversalGalaxies() from the data layer).

  // ===== FEATURE ENHANCEMENTS (L7–L10) =====
  // FEATURE 7 — Mutations: creatures can mutate on creation (50% stronger, +20% instability)
  // Mutated flag stored on the creature itself (see omnipotence.ts Creature interface)
  // FEATURE 8 — Amplifiers: divine network nodes that double Negotiate gains
  amplifiers: Array<{ id: number; godId: string }>;
  // IDEA-8 — Divine Pantheon: 5 named Avatars that grant global Divine Engine
  // bonuses based on their Domain (ascendant/harvester/sentinel/architect/
  // voidborn). Each slot unlocks with scaling Divinity cost; an Avatar is
  // created inside an unlocked slot by picking a Domain (free). Power Level
  // 1-10 upgrades cost scaling Divinity. Slots persist across prestiges.
  divinePantheon: Array<import("../data/divinePantheon").PantheonSlot>;
  // FEATURE 9 — Temporal Storms (per-battle): shuffle timeline, delays/accelerates enemy attacks
  temporalStorms: Record<string, boolean>;     // oldGodId → storm active

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

  // ===== KEYBOARD SHORTCUTS (DEBUG-SHORTCUTS) =====
  // Maps a logical action id (e.g. "pause", "speed1", "shop", "genesis")
  // → the keyboard key the player has bound to it. Keys are stored as the
  // `KeyboardEvent.key` value (e.g. " " for space, "Escape" for Esc, "1"
  // for the 1 key, "b" for B). The useKeyboardShortcuts hook reads from
  // this map at fire-time and checks the action's layer-unlock gate.
  // Default values live in `DEFAULT_KEYBOARD_SHORTCUTS` (store.ts).
  keyboardShortcuts: Record<string, string>;

  // ===== ACHIEVEMENT META (ACHIEVEMENT-EXPANSION) =====
  // Persistent bag of counters + UI-driven flags that don't naturally have a
  // home elsewhere on GameState. Each value is either a number (counter) or
  // a boolean (encoded as 0/1). The bag is keyed by a small fixed set of
  // string ids — see ACHIEVEMENT_META_KEYS in store.ts. buildAchievementCtx
  // reads from this record to populate the AchievementCheckCtx.
  //
  // Wired keys (non-exhaustive):
  //   bigBangsTriggered         — incremented when a Big Bang completes
  //   stableUniversesCreated    — incremented when a stable universe emerges
  //   mutationsTriggered         — incremented on each creature mutation
  //   marketTradesTotal          — incremented on each market trade
  //   galaxySystemsClaimedTotal  — incremented on each galaxy system claim
  //   trialsAbandoned            — incremented when a challenge is abandoned
  //   fastestTrialClearSec       — updated when a challenge completes quickly
  //   fastestGalacticClearSec    — updated when Galactic ascension is reached
  //   heresySurvivor             — set to 1 when a heresy run-ender is survived
  //   titleClicks                — UI-driven (Header title click)
  //   versionClicks              — UI-driven (Header version click)
  //   aiThemeActive              — UI-driven (set when AI theme selected)
  //   viewedCredits              — UI-driven (set when L10 ending screen shown)
  //   offlineProgressUsed        — set when applyOfflineProgress runs
  //   idleDurationSec            — incremented each tick without player action
  //   pauseDurationSec           — incremented each tick while paused
  achievementMeta: Record<string, number>;

  // ===== AUTOBUYER-SETTINGS — archetype / government targeting =====
  // Lets the player steer the Auto-Builder / Auto-Researcher toward a
  // preferred archetype (drift), override the auto-pick government at
  // Empire stage, and auto-apply a preferred foresight route at L2+.
  // Null = no preference (the autobuyer falls back to cheapest-first).
  autoBuyerSettings: {
    systemTarget: string | null;        // archetype id the Auto-Builder prefers
    techTarget: string | null;          // archetype id the Auto-Researcher prefers
    preferredGovernment: string | null; // overrides auto-pick at Empire stage
    preferredForesightRoute: string | null; // auto-applied at L2+
  };

  // ===== EVENT-CHAINS — scheduled follow-up events =====
  // When a player resolves an event choice with a `followUpEvent` field,
  // a PendingFollowUp is pushed here. The tick scans for due entries and
  // either fires the chained event (chance roll succeeded) or drops it
  // (chance roll failed). Resets to [] on prestige — chains are per-run.
  pendingFollowUps: PendingFollowUp[];

  // ===== L3-REDESIGN — WORLD FUSION + ETERNAL FLAME + L3 REPLACEMENTS =====
  // The L3 layer (Transcendence) has been redesigned. Offerings / Rituals /
  // Scripts / Blood Pacts are replaced by:
  //   • World Forge — spend Divinity to create new background worlds.
  //   • Convergence Catalysts — 5 permanent Divine Engine upgrades.
  //   • World Templates — choose the "mode" of all background worlds.
  //   • Genesis Seeds — plant seeds that grow into permanent Divinity generators.
  //   • Astral Resonance — align ALL worlds to a constellation category.
  //   • World Fusion — merge worlds into higher tiers for more production per
  //     world (but lower total production until Ascendant tier).
  //   • Eternal Flame — dump infinite Divinity for a logarithmic multiplier
  //     on all Divinity generation.
  //
  // worldTiers: Record<string, number> — tier id ("1".."10", "ascendant",
  //   "greater_ascendant", "celestial_core", "void") → count. Tier 1 =
  //   standard background worlds. Higher tiers are produced by fusion.
  // voidShards: number — new currency from Void Worlds (preview of
  //   L9/L10 resources).
  // eternalFlameInvested: number — total Divinity invested in the Eternal
  //   Flame. Drives a logarithmic multiplier on all Divinity generation.
  // worldsForged: number — lifetime count of worlds created via World Forge.
  //   Persists across prestiges (forged worlds are permanent).
  // purchasedCatalysts: Record<string, boolean> — catalyst id → purchased.
  //   5 one-time catalysts that upgrade the Divine Engine permanently.
  // activeWorldTemplate: string | null — the active world template id (or
  //   null for none). Switching templates costs 50 Divinity.
  // plantedSeeds: Record<string, { planted: boolean; plantedAtTime: number } | undefined>
  //   — 4 genesis seeds (sprout/sapling/elder_tree/world_tree). Once
  //   planted, they mature after their duration and produce permanent
  //   Divinity/s. All 4 planted unlocks L4.
  //   ("zodiac" | "northern" | "equatorial" | "southern" | null).
  worldTiers: Record<string, number>;
  voidShards: number;

  // IDEA-2: World Archetype Injection — god picks an archetype,
  // all worlds get that archetype's effect (multiplier, crash immunity, etc.)
  activeWorldArchetype: string | null;

  // IDEA-5: Evolution Sliders — 4 sliders that share a 10-point pool. Each
  // slider is 0..10 and the SUM of all 4 must be ≤ 10. The player allocates
  // freely at any time (no cost, no commitment). Default is all 0 (sum 0).
  //   speed       — +10% Divinity/s per point (0 → ×1.0, 10 → ×2.0)
  //   aggression  — +10% Void Shards per point (0 → 0, 10 → ×1.0)
  //   curiosity   — +1% peak production growth per point per minute
  //   faith       — +10% Faith from worlds per point (0 → 0, 10 → ×1.0)
  evolutionSliders: {
    speed: number;
    aggression: number;
    curiosity: number;
    faith: number;
  };
  eternalFlameInvested: number;
  worldsForged: number;
  purchasedCatalysts: Record<string, boolean>;
  activeWorldTemplate: string | null;
  plantedSeeds: Record<string, { planted: boolean; plantedAtTime: number } | undefined>;
}

// PendingFollowUp — scheduled follow-up event awaiting its fire time.
export interface PendingFollowUp {
  eventId: string;        // the event to fire
  fireAt: number;         // wall-clock ms timestamp when the event becomes due
  chance: number;         // 0..1 — rolled when the entry becomes due
  sourceEventId: string;  // the event that scheduled this follow-up (for logging)
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
  /**
   * FIX-UI-TABS — Opens a shared InfoModal showing the target tab content
   * (Log / Archive / Codex / Awards) wrapped in a Dialog. Closes any
   * other open info modal first so only one is on screen at a time.
   */
  openInfoModal: (target: "log" | "archive" | "codex" | "achievements" | "stats") => void;
  /** Closes the shared InfoModal (clears `activeInfoModal`). */
  closeInfoModal: () => void;
  /**
   * P6 — Modal Consolidation. Opens the shared LayerModal showing the layer
   * with the given id. Also sets the corresponding legacy `show*` flag for
   * save-compat / any code that still reads `show*` directly.
   *
   * Accepted ids: "challenges", "enlightenment", "transcendence", "genesis",
   * "apotheosis", "singularity", "omnipotence", "divinity", "infinity",
   * "eternity". Unknown ids are ignored.
   */
  openLayerModal: (layerId: string) => void;
  /** Closes the shared LayerModal. Clears `activeLayerModal` AND all legacy `show*` flags. */
  closeLayerModal: () => void;
  /**
   * P7 — Sets the latest purchase-error message. Called by buySystem /
   * buyTech / buyUpgrade / buyUniversalUpgrade when the player can't afford
   * the item. UIs subscribe to `lastPurchaseError` and show the message
   * inline for ~2 seconds (then fade).
   */
  notifyPurchaseError: (message: string) => void;
  setActiveChallenge: (challengeId: string | null) => void;
  dismissTutorial: () => void;
  resolveEvent: (eventId: string, choiceId: string) => void;
  setEventFrequency: (freq: "off" | "normal" | "frequent") => void;
  setReduceMotion: (v: boolean) => void;
  /**
   * ACHIEVEMENT-HOOKS-CONDITIONAL-EVENTS — generic UI hook for the
   * counter/flag achievements ("Title Clicker", "Easter Egg: Hidden
   * Message", "AI Detected", "View Credits"). UIs call with `(key)` to
   * increment a counter or `(key, 0, { replace: 1 })` to set a 0/1 flag.
   */
  bumpAchievementMeta: (
    key: string,
    delta?: number,
    opts?: { cap?: number; replace?: number }
  ) => void;
  dismissStory: (id: string) => void;
  dismissAchievementToast: () => void;
  // TOAST-QUEUE — pops only the FRONT achievement (shows the next queued
  // one). dismissAchievementToast clears the whole queue (X button /
  // View All); the Dismiss button + 12s auto-dismiss advance instead, so a
  // pileup plays through one at a time instead of nuking the queue.
  advanceAchievementToast: () => void;
  applyOfflineProgress: () => { elapsed: number; resourcesGained: Record<string, number>; applied: boolean } | null;
  hardReset: () => void;
  saveGame: () => void;
  // Force any pending debounced save to write now. No-op if nothing queued.
  flushSave: () => void;
  // PART-1 — Tribal→Civ government choice (player picks, not auto-assigned).
  // Choosing causes happiness -25 (disruption). Evolve-to-Civ gated on this.
  chooseGovernment: (govId: string) => void;
  // PART-2-LAYER-A — establish / break trade agreements with NPC partners.
  establishTrade: (partnerId: string) => void;
  breakTrade: (partnerId: string) => void;
  // PART-1 — FTL/Ascension/Government choice modal state + choosers.
  setShowFtlChoice: (v: boolean) => void;
  setShowAscensionChoice: (v: boolean) => void;
  setShowGovernmentChoice: (v: boolean) => void;
  chooseFtlPath: (pathId: string) => void;
  chooseAscensionPath: (pathId: string) => void;
  // PART-2-LAYER-C — rival mechanics.
  // counterRaid: spend military_power to reduce a rival's threat + gain
  // resources. Each successful counter-raid increments the rival's
  // counteredRaids counter, which reduces the military cost to assimilate.
  counterRaid: (rivalId: string) => void;
  // assimilateRival: spend military_power + culture to absorb a rival.
  // Cost is reduced by the rival's counteredRaids (mil) + successfulTrades (cul).
  // On success: rival.state = "merged", player gets the assimilationBonus.
  assimilateRival: (rivalId: string) => void;
  // PART-2-LAYER-B — manual hunt. Spends military_power + population for
  // an immediate burst of food/materials/organic_matter + rare-drop chance.
  huntNow: () => void;
  // F2 DEEP HUNT — a cooldown-gated premium hunt (120s in-game). Costs 3×
  // the military + 3× the population of a normal hunt, but yields ~3× rewards
  // and a 40% rare-drop chance (vs 15%) — printed verbatim on the button so
  // the odds stay legible. Cooldown is tracked in game-time (pause/speed-safe).
  huntDeepNow: () => void;
  // F1 RELIQUARY — consume 1 of a rare resource for a permanent production
  // bonus. No-op if the player has 0 stockpiled or has already hit maxConsume.
  consumeRare: (relicId: string) => void;
  // PART-2-LAYER-C — resolve a raid event. action: "defend" (auto-roll,
  // may lose resources if military is too low) or "counter" (spend military
  // for guaranteed win + loot). Clears activeRaid.
  resolveRaid: (action: "defend" | "counter") => void;
  // RAID-RECAP — clear the recap banner (click / auto-timeout).
  dismissRaidRecap: () => void;
  // PART-2-LAYER-D — sign/break treaties with NPCs.
  signTreaty: (partnerId: string, type: "trade_agreement" | "non_aggression" | "mutual_defense" | "research_pact") => void;
  breakTreaty: (partnerId: string) => void;
  loadGame: () => void;
  exportSave: () => string;
  importSave: (data: string) => boolean;
  addToLog: (msg: string) => void;
  debugUnlockAll: () => void;
  debugFreeBuy: boolean;
  toggleDebugFreeBuy: () => void;
  triggerDebugEvent: (eventId: string | "random") => void;
  // DEBUG-SHORTCUTS — additional debug actions for fast testing.
  /** +1000 of every primary resource (atp/glucose/proteins/lipids/.../data). */
  debugGrantResources: () => void;
  /** +1000 EP, +1000 PP, +1000 Divinity, +100 Faith, +100 Genesis Seeds, +100 Singularity Cores. */
  debugGrantCurrency: () => void;
  /** Unlock the next locked layer (find highest unlocked + 1). Logs "All layers already unlocked." if all 10 are open. */
  debugCompleteLayer: () => void;
  /** +1 cosmicBoonStacks (L10 ending currency). Logs "DEBUG: +1 Cosmic Boon granted." */
  debugGenerateBoon: () => void;
  /** RESTORE-BULK-FORGE-FUSE — spawn 1 fresh relic into the inventory (L10 Genesis Engine). */
  debugSpawnRelic: () => void;
  /** Immediately call triggerPrestige(). */
  debugForcePrestige: () => void;
  /** Toggle game speed between 100× and 1×. */
  debugToggle100x: () => void;
  /** Rebind a keyboard shortcut by action id (e.g. "pause", "shop"). */
  setKeyboardShortcut: (actionId: string, key: string) => void;
  /** Reset all keyboard shortcuts to defaults. */
  resetKeyboardShortcuts: () => void;

  // Layer 2 — Enlightenment (Foresight / Constellation Map)
  setShowEnlightenment: (v: boolean) => void;
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
  /** Scan an unexplored galaxy system (L4). Costs GALAXY_SCAN_COST Genesis Seeds; reveals bonus + rare resource. */
  scanGalaxySystem: (systemId: string) => void;
  /** Claim an explored-but-unclaimed galaxy system (L4). Cost scales 1.15× per existing claim; +10 worlds + bonuses. */
  claimGalaxySystem: (systemId: string) => void;

  // Layer 5 — Apotheosis
  setShowApotheosis: (v: boolean) => void;
  enactDivineLaw: (lawId: string) => void;
  setWorshipMode: (modeId: string | null) => void;
  performMiracle: (miracleId: string) => void;
  setHeresyResponse: (responseId: string) => void;

  // Layer 6 — Singularity (Universal Map redesign)
  setShowSingularity: (v: boolean) => void;
  /** Close an active rift — spend Singularity Cores (scales with severity). */
  closeRift: (riftId: string) => void;
  /** Place a Reality Anchor on a galaxy — spend Singularity Cores (scales with anchors placed). */
  placeRealityAnchor: (galaxyId: string) => void;
  /** Attack a NEW neutral universal galaxy — spend Faith, claim 1 system. */
  attackUniversalGalaxy: (galaxyId: string) => void;

  // Layer 7 — Omnipotence (Bio-engineering)
  setShowOmnipotence: (v: boolean) => void;
  setOmnipotenceStance: (stanceId: string) => void;
  // NEW: Creature Lab actions
  setCreatureDesignDraft: (draft: { bodyType: string; diet: string; special: string; name: string } | null) => void;
  createCreature: () => void;
  addCreatureToLegion: (creatureId: string, legionId: string) => void;
  removeCreatureFromLegion: (creatureId: string, legionId: string) => void;
  createLegion: (name: string) => void;
  deleteLegion: (legionId: string) => void;
  // NEW: Skirmish Arena (outpost raids) actions
  spawnOutpostRaid: (outpostDefId?: string) => void;
  deployLegionToRaid: (raidId: string, legionId: string) => void;
  attackOutpost: (raidId: string) => void;
  setActiveOutpostRaid: (raidId: string | null) => void;

  // Layer 8 — Divinity (layer) — Divine Alliance
  setShowDivinityLayer: (v: boolean) => void;
  // NEW: Divine Alliance actions
  negotiateWithGod: (godId: string) => void;
  tradeWithGod: (godId: string) => void;
  formAlliance: (godId: string) => void;

  // Layer 9 — Infinity — Divine War
  setShowInfinity: (v: boolean) => void;
  // NEW: Divine War actions
  startOldGodBattle: (oldGodId: string) => void;
  deployLegionToBattle: (oldGodId: string, legionId: string) => void;
  callAllyToBattle: (oldGodId: string, godId: string) => void;
  attackOldGod: (oldGodId: string) => void;

  // Layer 10 — Eternity — Genesis Engine
  setShowEternity: (v: boolean) => void;
  chooseEnding: (endingId: "preserve" | "reset") => void;
  selectDimension: (dimensionId: string) => void;
  // LEGACY stubs (kept for save-compat — Genesis Engine redesign removed these)
  setUniverseRule: (slotIndex: number, optionId: string) => void;
  toggleKeptGod: (godId: string) => void;
  // NEW: Genesis Engine actions
  /** Add a relic to the crucible (max 5, no duplicates). Cannot be removed once added. */
  addRelicToCrucible: (relicId: string) => void;
  /** Remove ALL relics from the crucible (reset). Allowed only when not simulating. */
  clearCrucible: () => void;
  /** Spend Divinity to reveal a relic's rule NAME (cost: REVEAL_COST_RULE). */
  revealRelicRule: (relicId: string, ruleIndex: number) => void;
  /** Spend Divinity to reveal a relic's rule AMOUNT (cost: REVEAL_COST_AMOUNT). */
  revealRelicAmount: (relicId: string, ruleIndex: number) => void;
  /** Begin a Big Bang (requires ≥1 relic in crucible, not already simulating). 30s sim. */
  triggerBigBang: () => void;
  /** Complete the Big Bang after 30s. Stable → discover archetype + new relics. Unstable → lose relics. */
  completeBigBang: () => void;

  // Theme customization
  setStageTheme: (id: string) => void;
  setLayerTheme: (id: string | null) => void;
  setSpecialTheme: (id: string | null) => void;
  setThemeMode: (mode: "auto" | "custom") => void;

  // ===== QUICK WINS =====
  // WIN 5 — Universal shop upgrade purchase (spends Prestige Points)
  buyUniversalUpgrade: (upgradeId: string) => void;

  // ===== REBUILD: LAYERS 1-6 UNIQUE GAMEPLAY LOOPS =====
  // Layer 1 — Trial Realms were REMOVED in CLEANUP-LEGACY. The canonical L1
  // system is now `challenges.ts` (10 run-modifier challenges managed via
  // setActiveChallenge / etc).

  // Layer 3 — Divine Market
  marketBuyResource: (resourceId: string, qty: number) => void;
  marketSellResource: (resourceId: string, qty: number) => void;
  marketOffering: (resourceId: string, qty: number) => void; // spend resource → gain Divinity scaled by price

  // Layer 3 — DIVINE INVESTMENT MARKET (new design). Allocates worlds (from
  // the background-simulation pool) to one of the 5 portfolios in
  // src/game/data/marketPortfolios.ts. Each portfolio pays Divinity dividends
  // × its baseYield per tick; riskier portfolios may crash and consume a
  // fraction of the allocated worlds. See store.ts `tick` for the dividend
  // and crash math.
  allocateWorlds: (portfolioId: string, count: number) => void;
  deallocateWorlds: (portfolioId: string, count: number) => void;
  /** Spend Divinity to light the cheapest affordable constellation star.
   *  Bridges the L3 dividend economy back into L2 (speed-up shortcut). */
  buyStarFromMarket: () => { constellationId: string; starId: string; cost: number } | null;

  // Layer 5 — Heresy Web (Galactic Conquest redesign; per-galaxy)
  convertFollower: (galaxyId: string, cellIndex: number) => void;
  purgeFollower: (galaxyId: string, cellIndex: number) => void;
  initFollowerGrid: (galaxyId: string) => void;
  /** Attack a rival galaxy: spend Faith, claim the next unclaimed system. */
  attackGalaxy: (galaxyId: string) => void;
  /** Select a galaxy tab in the Apotheosis modal (cosmetic; persists). */
  setSelectedGalaxyId: (galaxyId: string) => void;

  // ===== FEATURE ENHANCEMENTS =====
  // FEATURE 5 — Prophets (per-galaxy: place/remove on a galaxy's heresy grid)
  placeProphet: (galaxyId: string, cellIndex: number) => void;
  removeProphet: (galaxyId: string, cellIndex: number) => void;
  // FEATURE 8 — Amplifiers
  placeAmplifier: (godId: string) => void;
  removeAmplifier: (godId: string) => void;
  // IDEA-8 — Divine Pantheon: unlock / create / upgrade / rename / dismiss
  unlockPantheonSlot: (slotIndex: number) => void;
  createPantheonAvatar: (slotIndex: number, domain: import("../data/divinePantheon").AvatarDomain) => void;
  upgradePantheonAvatar: (slotIndex: number) => void;
  renamePantheonAvatar: (slotIndex: number, name: string) => void;
  dismissPantheonAvatar: (slotIndex: number) => void;
  // FEATURE 9 — Temporal Storms
  stabilizeTime: (oldGodId: string) => void;

  // ===== BACKGROUND-SIMULATION =====
  // backgroundSimulations is now COMPUTED from (3 + starsLit) × simMult.
  // No manual spawn action — sims come from lighting constellation stars.
  // (The spawnBackgroundSimulation action was removed; sim amplifier is a shop upgrade.)

  // ===== AUTOBUYER-SETTINGS — setters for archetype/government targeting =====
  setAutoBuyerSystemTarget: (archetypeId: string | null) => void;
  setAutoBuyerTechTarget: (archetypeId: string | null) => void;
  setPreferredGovernment: (govId: string | null) => void;
  setPreferredForesightRoute: (routeId: string | null) => void;
  // IDEA-2: Set the active world archetype (null = no archetype)
  setWorldArchetype: (archetypeId: string | null) => void;
  // IDEA-5: Set an evolution slider value
  setEvolutionSlider: (key: 'speed' | 'aggression' | 'curiosity' | 'faith', value: number) => void;

  // ===== L3-REDESIGN — WORLD FUSION + ETERNAL FLAME + L3 REPLACEMENTS =====
  // Fuse 10 (or 100/1000/10000) worlds of the source tier into 1 of the
  // target tier. Checks source world count + layer-locked requirements
  // (e.g. Void World requires L7+ / omnipotence). Deducts source worlds
  // and adds 1 to the target tier's count.
  fuseWorlds: (targetTierId: string) => void;
  // Invest Divinity into the Eternal Flame. The flame multiplier is
  // logarithmic: 1 + log10(invested + 1) × 0.5. Applies to all bgDivPerSec.
  investInFlame: (amount: number) => void;
  // Spend Divinity to forge a new background world (Tier 1). Cost scales
  // 1.5× per world already forged. worldsForged persists across prestiges.
  forgeWorld: () => void;
  // RESTORE-BULK-FORGE-FUSE — forge N worlds at once. Cost for each forge
  // = ceil(50 × 1.5^(initialForged + i)) where initialForged is captured
  // BEFORE the loop (the bug that doubled the cost curve is now fixed).
  // N === -1 means "forge max" (as many as affordable). Safety cap: 10000
  // per click. Upgrade-gated: bulk_forge_10x for any bulk, bulk_forge_100x
  // for N≥100, bulk_forge_max for N<0. debugFreeBuy bypasses all gates.
  forgeWorldBulk: (count: number) => void;
  // Fuse N times into the target tier. Each fuse consumes
  // tier.sourceCount of the source tier. Stops early if source runs out.
  // N === -1 means "fuse max". Safety cap: 10000 per click. Upgrade-gated
  // same as forge. debugFreeBuy bypasses all gates.
  fuseWorldsBulk: (targetTierId: string, count: number) => void;
  // Purchase a one-time Convergence Catalyst (5 total). Each grants a
  // permanent Divine Engine upgrade (e.g. +10% Div/s, ×2 peak prod, etc.).
  purchaseCatalyst: (catalystId: string) => void;
  // Switch the active World Template (5 templates). Costs 50 Divinity to
  // switch (free to set to null). Templates apply bonuses/risks to all
  // background world production.
  setWorldTemplate: (templateId: string | null) => void;
  // Plant a Genesis Seed (4 total). Each seed matures after its duration
  // and produces permanent Divinity/s. All 4 planted unlocks L4.
  plantGenesisSeed: (seedId: string) => void;
  // Set the active Astral Resonance category (zodiac/northern/equatorial/
  // southern, or null to clear). Each category gives a Div/s bonus with a
  // tradeoff (Northern hurts other sources, Equatorial costs Faith, etc.).
  // Illuminate the next unlit star in a constellation (bulk purchase).
  // Respects the same cost formula as illuminateStar — finds the cheapest
  // unlit star in the constellation and lights it.
  purchaseNextStar: (constellationId: string) => void;
  // Illuminate ALL remaining unlit stars in a constellation, stopping when
  // the player can't afford the next one. debugFreeBuy bypasses affordability.
  purchaseMaxStars: (constellationId: string) => void;
}
