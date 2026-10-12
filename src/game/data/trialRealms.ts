// ===========================================================================
// LAYER 1 — TRIAL REALMS
// ===========================================================================
// Each realm is a distinct mini-game with its own win condition. Three are
// fully playable (Growth, Discontent, Swiftness); the remaining seven ship as
// "Coming Soon" placeholders with full data definitions so the layer reads as
// a coherent system.
// ===========================================================================

export type TrialRealmStatus = "available" | "inProgress" | "completed" | "comingSoon";

export interface TrialRealmDef {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  color: string; // tailwind border/text accent
  mechanic: string; // one-sentence summary of the core loop
  goal: string; // human-readable goal
  reward: string; // permanent reward text on completion
  status: TrialRealmStatus;
  durationSec?: number; // for time-based realms
}

export const TRIAL_REALMS: TrialRealmDef[] = [
  {
    id: "realm_growth",
    name: "Realm of Growth",
    tagline: "Break through the energy barrier.",
    icon: "🌱",
    color: "emerald",
    mechanic: "Fill an energy bar passively; click to Break Through for population gains.",
    goal: "Perform 10 Break-Throughs.",
    reward: "+10% population growth, permanently.",
    status: "available",
  },
  {
    id: "realm_famine",
    name: "Realm of Famine",
    tagline: "Three resources in a fragile chain.",
    icon: "🌾",
    color: "amber",
    mechanic: "Balance three converters A→B→C→A so none drops below 50%.",
    goal: "Survive 120 seconds without any resource falling below 50%.",
    reward: "+15% food & water production.",
    status: "available",
  },
  {
    id: "realm_discontent",
    name: "Realm of Discontent",
    tagline: "Happiness oscillates; gold calls.",
    icon: "🎭",
    color: "rose",
    mechanic: "Manage an oscillating happiness meter while earning gold.",
    goal: "Keep happiness above 30 for 90s while accumulating 200 gold.",
    reward: "+10% happiness and +10% gold production.",
    status: "available",
  },
  {
    id: "realm_ignorance",
    name: "Realm of Ignorance",
    tagline: "Find the path through the tech tree.",
    icon: "📖",
    color: "violet",
    mechanic: "Spend limited science on a 10-node tree to reach the final node.",
    goal: "Reach the final tech node within your science budget.",
    reward: "+20% science production.",
    status: "available",
  },
  {
    id: "realm_stagnation",
    name: "Realm of Stagnation",
    tagline: "Four-stage production chain.",
    icon: "⛓️",
    color: "cyan",
    mechanic: "Upgrade conversion rates across a 4-stage chain.",
    goal: "Produce 100 final goods.",
    reward: "+10% production at every stage.",
    status: "available",
  },
  {
    id: "realm_weakness",
    name: "Realm of Weakness",
    tagline: "Tower defense against ten waves.",
    icon: "⚔️",
    color: "red",
    mechanic: "Place towers (costs military) to repel each strengthening wave.",
    goal: "Survive all 10 waves.",
    reward: "+15% military power.",
    status: "available",
  },
  {
    id: "realm_late_bloom",
    name: "Realm of Late Bloom",
    tagline: "Slow start, outsized gains.",
    icon: "🌷",
    color: "pink",
    mechanic: "Start with 1 pop and 0 resources; production is 10× but costs 5×.",
    goal: "Reach 100 population.",
    reward: "+25% population growth on slow starts (under 50 pop).",
    status: "available",
  },
  {
    id: "realm_purity",
    name: "Realm of Purity",
    tagline: "One pool for every system.",
    icon: "💎",
    color: "sky",
    mechanic: "All systems draw from a single 500-cap pool. Build 10 systems.",
    goal: "Construct 10 systems without exhausting the shared pool.",
    reward: "+5% production per system you build (scaling reward).",
    status: "available",
  },
  {
    id: "realm_ascetic",
    name: "Realm of the Ascetic",
    tagline: "Only one of each.",
    icon: "🧘",
    color: "indigo",
    mechanic: "Only one of each system may be built. Evolve through 7 stages.",
    goal: "Evolve through all 7 stages.",
    reward: "+12% production with severe constraints lifted.",
    status: "available",
  },
  {
    id: "realm_swiftness",
    name: "Realm of Swiftness",
    tagline: "Race the countdown.",
    icon: "⚡",
    color: "yellow",
    mechanic: "300s countdown with 5× production. Evolve to Galactic before time runs out.",
    goal: "Reach the Galactic stage within 300 seconds.",
    reward: "+15% all production speed.",
    status: "available",
    durationSec: 300,
  },
];

export const TRIAL_REALM_MAP: Record<string, TrialRealmDef> = Object.fromEntries(
  TRIAL_REALMS.map((r) => [r.id, r])
);

export const PLAYABLE_REALM_IDS = [
  "realm_growth",
  "realm_famine",
  "realm_discontent",
  "realm_ignorance",
  "realm_stagnation",
  "realm_weakness",
  "realm_late_bloom",
  "realm_purity",
  "realm_ascetic",
  "realm_swiftness",
];
export const COMING_SOON_REALM_IDS = TRIAL_REALMS.filter((r) => r.status === "comingSoon").map((r) => r.id);

// ---- Realm-specific runtime state defaults ----

export function makeDefaultRealmState(realmId: string): Record<string, any> {
  switch (realmId) {
    case "realm_growth":
      return {
        energy: 0,            // 0-100
        breaks: 0,            // count of Break-Throughs performed
        breakCostMult: 1,     // cost growth multiplier (unused in this version)
        startedAt: 0,
        completed: false,
      };
    case "realm_discontent":
      return {
        happiness: 60,       // 0-100 oscillates
        gold: 0,
        timer: 0,             // elapsed seconds (drives oscillation)
        survivedTime: 0,     // only progresses while happiness > threshold
        survived: false,
        happinessBelowThreshold: false,
        goldReached: false,
        completed: false,
        startedAt: 0,
      };
    case "realm_swiftness":
      return {
        timeLeft: 300,
        productionMult: 5,
        startedAt: 0,
        reachedGalactic: false,
        completed: false,
      };
    case "realm_famine":
      return {
        // Three cyclic resources A→B→C→A, each 0-100
        a: 70,
        b: 70,
        c: 70,
        survivedTime: 0,    // only progresses while all 3 ≥ threshold
        timer: 0,            // total elapsed seconds
        failed: false,
        completed: false,
        startedAt: 0,
      };
    case "realm_ignorance":
      return {
        // 10-node chain; science budgeted to afford all of them
        science: 100,
        unlockedCount: 0,         // 0-10
        unlocked: Array(10).fill(false),
        completed: false,
        startedAt: 0,
      };
    case "realm_stagnation":
      return {
        // 4-stage chain. Each stage has an upgrade level (rate multiplier).
        levels: [1, 1, 1, 1],     // each stage level
        goods: 0,                  // current spendable balance
        produced: 0,               // total ever produced (drives completion)
        completed: false,
        startedAt: 0,
      };
    case "realm_weakness":
      return {
        // Tower defense vs 10 strengthening waves
        wave: 0,                   // current wave (1-indexed once started)
        enemies: 0,                // remaining enemies in current wave
        waveTimer: 0,              // seconds remaining in current wave
        military: 30,              // currency for placing towers
        towers: 0,                 // count of towers placed
        baseHp: 100,
        failed: false,
        completed: false,
        startedAt: 0,
      };
    case "realm_late_bloom":
      return {
        // 1 pop, 0 resources; geometric pop growth (passive)
        pop: 1,
        food: 0,
        productionMult: 10,        // for display
        costMult: 5,                // for display
        completed: false,
        startedAt: 0,
      };
    case "realm_purity":
      return {
        // Single 500-cap pool; each built system drains it passively.
        pool: 500,
        systemsBuilt: 0,
        failed: false,
        completed: false,
        startedAt: 0,
      };
    case "realm_ascetic":
      return {
        // 7 unique systems; each bought = one stage advanced.
        essence: 0,
        stage: 0,                  // 0-7
        systems: Array(7).fill(false),
        completed: false,
        startedAt: 0,
      };
    default:
      return {};
  }
}

// Goal thresholds for the playable realms
export const REALM_GROWTH_BREAKS_GOAL = 10;
export const REALM_GROWTH_PASSIVE_FILL_PER_SEC = 0.5; // energy fill rate
export const REALM_DISCONTENT_HAPPINESS_THRESHOLD = 30;
export const REALM_DISCONTENT_SURVIVE_SECONDS = 90;
export const REALM_DISCONTENT_GOLD_GOAL = 200;
export const REALM_SWIFTNESS_TIME_LIMIT = 300;

// ---- Realm of Famine (A→B→C→A balance) ----
export const REALM_FAMINE_SURVIVE_SECONDS = 120;
export const REALM_FAMINE_THRESHOLD = 50;          // each resource must stay ≥ this
export const REALM_FAMINE_DECAY_PER_SEC = 0.6;       // passive drain on each resource
export const REALM_FAMINE_FLOW_PER_SEC = 0.8;        // spontaneous A→B, B→C, C→A
export const REALM_FAMINE_PUMP_FROM = 6;             // pump source drain (per click)
export const REALM_FAMINE_PUMP_TO = 10;              // pump target gain (per click)

// ---- Realm of Ignorance (10-node tech tree) ----
export const REALM_IGNORANCE_NODE_COUNT = 10;
export const REALM_IGNORANCE_BUDGET = 100;
export const REALM_IGNORANCE_NODE_COSTS = [5, 7, 9, 10, 10, 11, 11, 12, 12, 13]; // sums to 100

// ---- Realm of Stagnation (4-stage production chain) ----
export const REALM_STAGNATION_STAGE_COUNT = 4;
export const REALM_STAGNATION_GOODS_GOAL = 100;
export const REALM_STAGNATION_UPGRADE_BASE_COST = 10; // 10 × level
export const REALM_STAGNATION_RATE_DIVISOR = 1;        // rate = (r1×r2×r3×r4) / divisor per sec

// ---- Realm of Weakness (tower defense) ----
export const REALM_WEAKNESS_WAVE_COUNT = 10;
export const REALM_WEAKNESS_WAVE_DURATION = 8;       // seconds per wave
export const REALM_WEAKNESS_ENEMY_BASE = 4;          // enemies = base + wave × mult
export const REALM_WEAKNESS_ENEMY_PER_WAVE = 2;
export const REALM_WEAKNESS_TOWER_KILL_RATE = 0.6;   // kills per tower per sec
export const REALM_WEAKNESS_TOWER_COST = 15;
export const REALM_WEAKNESS_WAVE_REWARD = 12;
export const REALM_WEAKNESS_BASE_HP = 100;
export const REALM_WEAKNESS_STARTING_MILITARY = 30;
export const REALM_WEAKNESS_LEAK_DAMAGE = 4;        // per leftover enemy

// ---- Realm of Late Bloom (geometric pop growth, passive) ----
export const REALM_LATE_BLOOM_POP_GOAL = 100;
export const REALM_LATE_BLOOM_PROD_COEFF = 0.2;       // food rate = pop² × coeff
export const REALM_LATE_BLOOM_COST_PER_POP = 2;       // food needed = pop × this

// ---- Realm of Purity (single 500-cap pool) ----
export const REALM_PURITY_POOL_CAP = 500;
export const REALM_PURITY_SYSTEMS_GOAL = 10;
export const REALM_PURITY_BUILD_COST = 30;
export const REALM_PURITY_DRAIN_PER_SYSTEM = 0.4;     // per system per sec

// ---- Realm of Ascetic (7 unique systems) ----
export const REALM_ASCETIC_STAGES = 7;
export const REALM_ASCETIC_SYSTEM_COSTS = [10, 15, 20, 25, 30, 40, 50]; // sums to 190
export const REALM_ASCETIC_BASE_RATE = 1;             // essence = (base + stage) per sec

// ---- Reward bonus helper ----
// Returns additive production / cap / pop multipliers from completed trial realms.
// Applied alongside the other layer bonuses inside the production tick.
export function trialRealmRewardBonus(
  completed: Record<string, boolean>
): { prodMult: number; capMult: number; popMult: number } {
  let prodMult = 0;
  let capMult = 0;
  let popMult = 0;
  if (completed.realm_growth) popMult += 0.10;          // +10% population growth
  if (completed.realm_famine) prodMult += 0.15;          // +15% food & water
  if (completed.realm_discontent) {
    prodMult += 0.10;                                     // +10% gold / happiness prod
    popMult += 0.10;                                      // +10% happiness translates to pop momentum
  }
  if (completed.realm_ignorance) prodMult += 0.20;       // +20% science
  if (completed.realm_stagnation) prodMult += 0.10;      // +10% production every stage
  if (completed.realm_weakness) prodMult += 0.15;        // +15% military power
  if (completed.realm_purity) prodMult += 0.05;          // +5% production (scaling reward)
  if (completed.realm_ascetic) prodMult += 0.12;         // +12% production
  if (completed.realm_swiftness) prodMult += 0.15;      // +15% all production speed
  // late_bloom applied conditionally in the tick (pop < 50)
  return { prodMult, capMult, popMult };
}
