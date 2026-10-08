// ===========================================================================
// LAYER 9 — INFINITY (DIVINE WAR)
// ===========================================================================
// Direct combat with the Old Gods. Turn-based strategy battles. Deploy Legions
// (from Layer 7) and call on Allies (from Layer 8) for support. Each Old God
// has unique mechanics and weaknesses across 3 battle phases: Skirmish,
// Siege, Final Stand. Each victory grants a "Divine Fragment" — a permanent
// power boost. Defeating all 3 Old Gods unlocks Layer 10 (Eternity).
// The Time Loom becomes a "Battle Timeline" — plan your attacks across time.
// ===========================================================================

// ----- Old God Bosses (3) -----
export interface OldGod {
  id: string;
  name: string;
  title: string;
  icon: string;
  hp: number;             // total HP across all phases
  attack: number;         // base attack per turn
  weakness: string;       // body type that does +50% damage
  desc: string;
  phases: OldGodPhase[];
}

export interface OldGodPhase {
  id: string;             // "skirmish" | "siege" | "final_stand"
  name: string;
  icon: string;
  hpThreshold: number;    // phase ends when boss HP drops below this
  desc: string;
}

export const OLD_GODS: OldGod[] = [
  {
    id: "old_god_morlock",
    name: "Mor'lok",
    title: "Hollow Hunger",
    icon: "🦷",
    hp: 600,
    attack: 12,
    weakness: "predator",
    desc: "An insatiable maw that devoured the first stars. Weak to predators.",
    phases: [
      { id: "skirmish", name: "Skirmish", icon: "⚔️", hpThreshold: 400, desc: "Probe the Hunger's outer ring of teeth." },
      { id: "siege", name: "Siege", icon: "🏰", hpThreshold: 200, desc: "Crack the inner carapace." },
      { id: "final_stand", name: "Final Stand", icon: "💀", hpThreshold: 0, desc: "Drive the Hunger back into the void." },
    ],
  },
  {
    id: "old_god_zephira",
    name: "Zephira",
    title: "Wail of Endings",
    icon: "🌬️",
    hp: 800,
    attack: 16,
    weakness: "flyer",
    desc: "A wind that wears down mountains. Weak to flyers who ride the storm.",
    phases: [
      { id: "skirmish", name: "Skirmish", icon: "⚔️", hpThreshold: 540, desc: "Brave the outer screaming gusts." },
      { id: "siege", name: "Siege", icon: "🏰", hpThreshold: 270, desc: "Quiet the inner wail." },
      { id: "final_stand", name: "Final Stand", icon: "💀", hpThreshold: 0, desc: "Silence the voice at the eye." },
    ],
  },
  {
    id: "old_god_thalos",
    name: "Thalos",
    title: "Root Beneath All",
    icon: "🕸️",
    hp: 1000,
    attack: 22,
    weakness: "burrower",
    desc: "An immense root-system that anchors reality. Weak to burrowers.",
    phases: [
      { id: "skirmish", name: "Skirmish", icon: "⚔️", hpThreshold: 700, desc: "Sever the outer tendrils." },
      { id: "siege", name: "Siege", icon: "🏰", hpThreshold: 350, desc: "Dig through the bark." },
      { id: "final_stand", name: "Final Stand", icon: "💀", hpThreshold: 0, desc: "Pull up the root." },
    ],
  },
];

export const OLD_GOD_MAP: Record<string, OldGod> = Object.fromEntries(
  OLD_GODS.map((g) => [g.id, g])
);

// ----- Battle State -----
// Each Old God has its own battle state. A battle is "active" when in progress.
export type BattlePhase = "skirmish" | "siege" | "final_stand";
export type BattleStatus = "not_started" | "in_progress" | "won" | "lost";

export interface BattleState {
  oldGodId: string;
  status: BattleStatus;
  bossHp: number;         // current HP
  bossMaxHp: number;
  phase: BattlePhase;
  deployedLegionIds: string[];   // legions deployed
  calledAllyIds: string[];       // minor god allies called for support
  turn: number;                  // current turn number
  log: string[];                 // recent battle events
}

/**
 * Creates the initial BattleState for an Old God (not yet started).
 */
export function makeInitialBattleState(oldGodId: string): BattleState {
  const god = OLD_GOD_MAP[oldGodId];
  if (!god) throw new Error(`Unknown Old God: ${oldGodId}`);
  return {
    oldGodId,
    status: "not_started",
    bossHp: god.hp,
    bossMaxHp: god.hp,
    phase: "skirmish",
    deployedLegionIds: [],
    calledAllyIds: [],
    turn: 0,
    log: [],
  };
}

// ----- Divine Fragments -----
// Each victory grants one Divine Fragment — +5% production, +3% cap, +2% EP,
// +3% pop growth. Stacks permanently.
export const DIVINE_FRAGMENT_REWARD = {
  productionMult: 0.05,
  capMult: 0.03,
  epMult: 0.02,
  popGrowthMult: 0.03,
};

export function divineFragmentBonus(fragments: number): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
} {
  return {
    productionMult: fragments * DIVINE_FRAGMENT_REWARD.productionMult,
    capMult: fragments * DIVINE_FRAGMENT_REWARD.capMult,
    epMult: fragments * DIVINE_FRAGMENT_REWARD.epMult,
    popGrowthMult: fragments * DIVINE_FRAGMENT_REWARD.popGrowthMult,
  };
}

// ----- Helpers -----

/**
 * Computes the player's attack for a turn given the deployed legions and
 * called allies. Returns total damage dealt to the Old God.
 */
export function computePlayerAttack(
  deployedLegionPowers: Array<{ attack: number; count: number }>,
  calledAllyPowers: Array<{ powerLevel: number }>,
  weakToBodyType: boolean
): number {
  let dmg = 0;
  for (const lp of deployedLegionPowers) {
    let legionDmg = lp.attack;
    if (weakToBodyType) legionDmg *= 1.5;
    dmg += legionDmg;
  }
  for (const ally of calledAllyPowers) {
    dmg += ally.powerLevel * 0.5; // each ally adds half their power as damage
  }
  return Math.round(dmg);
}

/**
 * Computes the boss's attack for a turn (boss attacks back after player).
 */
export function computeBossAttack(bossAttack: number, playerDefense: number): number {
  const dmg = Math.max(1, bossAttack - playerDefense * 0.3);
  return Math.round(dmg);
}

/**
 * Returns the current phase name given boss HP and thresholds.
 */
export function phaseForHp(god: OldGod, hp: number): BattlePhase {
  if (hp <= god.phases[2].hpThreshold) return "final_stand";
  if (hp <= god.phases[1].hpThreshold) return "siege";
  return "skirmish";
}

/**
 * Layer 10 (Eternity) unlock: all 3 Old Gods defeated.
 */
export function isInfinityComplete(
  oldGodBattles: Record<string, BattleState>
): boolean {
  for (const god of OLD_GODS) {
    const st = oldGodBattles[god.id];
    if (!st || st.status !== "won") return false;
  }
  return true;
}

// ----- Legacy compatibility shims -----
// The original Layer 9 data had Echo Types, Fork Scenarios, and Future Debt.
// These are preserved as empty arrays / no-op helpers so that any references
// in older code don't break the build. The new layer ignores them.

export const ECHO_TYPES: any[] = [];
export const ECHO_TYPE_MAP: Record<string, any> = {};
export const FORK_SCENARIOS: any[] = [];
export const FORK_SCENARIO_MAP: Record<string, any> = {};
export const FUTURE_DEBT_TIERS: any[] = [];
export const FUTURE_DEBT_TIER_MAP: Record<string, any> = {};

export function echoBonus(_purchased: Record<string, boolean>): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  echoMult: number;
} {
  return { productionMult: 0, capMult: 0, epMult: 0, popGrowthMult: 0, echoMult: 0 };
}

export function forkBonus(_resolved: Record<string, string>): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  resolvedCount: number;
} {
  return { productionMult: 0, capMult: 0, epMult: 0, popGrowthMult: 0, resolvedCount: 0 };
}

export function activeDebtBonus(
  _taken: Record<string, boolean>,
  _repaid: Record<string, boolean>
): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  activeCount: number;
} {
  return { productionMult: 0, capMult: 0, epMult: 0, popGrowthMult: 0, activeCount: 0 };
}
