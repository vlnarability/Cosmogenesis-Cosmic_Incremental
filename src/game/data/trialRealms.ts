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
    status: "comingSoon",
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
    status: "comingSoon",
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
    status: "comingSoon",
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
    status: "comingSoon",
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
    status: "comingSoon",
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
    status: "comingSoon",
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
    status: "comingSoon",
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

export const PLAYABLE_REALM_IDS = ["realm_growth", "realm_discontent", "realm_swiftness"];
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
