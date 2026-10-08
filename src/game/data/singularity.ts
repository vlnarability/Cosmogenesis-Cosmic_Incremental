// ===========================================================================
// LAYER 6 — SINGULARITY
// ===========================================================================
// All paths converge. Singularity is the layer of final choices: equip Relic
// Loadouts (each with a powerful upside AND a real downside) and activate
// Logic Cores (automation that runs the universe while you watch). Bonuses
// apply as multipliers. This is the deepest layer before Eternity.
// ===========================================================================

// ----- Relic Loadouts (8) -----
// Each relic grants a big upside AND a real downside — the player chooses
// which trade-offs to accept.
export interface RelicLoadout {
  id: string;
  name: string;
  icon: string;
  upside: string;
  downside: string;
  bonus: {
    productionMult?: number; // additive bonus
    capMult?: number;
    epMult?: number;
    popGrowthMult?: number;
  };
  penalty: {
    productionMult?: number; // additive penalty (usually negative)
    capMult?: number;
    epMult?: number;
    popGrowthMult?: number;
  };
}

export const RELIC_LOADOUTS: RelicLoadout[] = [
  {
    id: "relic_overdrive",
    name: "Heart of Overdrive",
    icon: "💗",
    upside: "+75% all production.",
    downside: "-25% all capacities.",
    bonus: { productionMult: 0.75 },
    penalty: { capMult: -0.25 },
  },
  {
    id: "relic_vastness",
    name: "Cradle of Vastness",
    icon: "🌌",
    upside: "+60% all capacities.",
    downside: "-30% population growth.",
    bonus: { capMult: 0.60 },
    penalty: { popGrowthMult: -0.30 },
  },
  {
    id: "relic_throne",
    name: "Throne of Coins",
    icon: "👑",
    upside: "+100% EP per prestige.",
    downside: "-20% all production.",
    bonus: { epMult: 1.00 },
    penalty: { productionMult: -0.20 },
  },
  {
    id: "relic_swarm",
    name: "Song of the Swarm",
    icon: "🐝",
    upside: "+80% population growth.",
    downside: "-15% EP per prestige.",
    bonus: { popGrowthMult: 0.80 },
    penalty: { epMult: -0.15 },
  },
  {
    id: "relic_balance",
    name: "Scales of the Maker",
    icon: "⚖️",
    upside: "+20% to all four: production, cap, EP, pop.",
    downside: "No real downside — a relic of balance.",
    bonus: { productionMult: 0.20, capMult: 0.20, epMult: 0.20, popGrowthMult: 0.20 },
    penalty: {},
  },
  {
    id: "relic_void",
    name: "The Void Crown",
    icon: "🕳️",
    upside: "+150% all production.",
    downside: "-40% EP, -40% cap. The void gives, and the void takes.",
    bonus: { productionMult: 1.50 },
    penalty: { epMult: -0.40, capMult: -0.40 },
  },
  {
    id: "relic_ancient",
    name: "Echo of the Ancient",
    icon: "📜",
    upside: "+50% EP, +25% production.",
    downside: "-25% population growth.",
    bonus: { epMult: 0.50, productionMult: 0.25 },
    penalty: { popGrowthMult: -0.25 },
  },
  {
    id: "relic_omega",
    name: "The Omega Shard",
    icon: "Ω",
    upside: "+30% to all four — the ultimate synthesis.",
    downside: "Cannot equip any other relic. (Soft cap.)",
    bonus: { productionMult: 0.30, capMult: 0.30, epMult: 0.30, popGrowthMult: 0.30 },
    penalty: {},
  },
];

export const RELIC_LOADOUT_MAP: Record<string, RelicLoadout> = Object.fromEntries(
  RELIC_LOADOUTS.map((r) => [r.id, r])
);

// ----- Logic Cores (6) -----
// Toggleable automation. Each core performs a different automated action.
export interface LogicCore {
  id: string;
  name: string;
  icon: string;
  desc: string;
  intervalSec: number;
  productionMult?: number; // passive bonus while active
}

export const LOGIC_CORES: LogicCore[] = [
  {
    id: "core_eternal",
    name: "Eternal Engine",
    icon: "♾️",
    desc: "+10% all production while active.",
    intervalSec: 0,
    productionMult: 0.10,
  },
  {
    id: "core_bulwark",
    name: "Bulwark Core",
    icon: "🛡️",
    desc: "+15% all capacities while active.",
    intervalSec: 0,
  },
  {
    id: "core_chronicler",
    name: "Chronicler Core",
    icon: "📜",
    desc: "Auto-performs cheapest affordable Offering every 60s.",
    intervalSec: 60,
  },
  {
    id: "core_architect",
    name: "Architect Core",
    icon: "🏗️",
    desc: "Auto-buys the cheapest affordable system every 10s (faster than Auto-Builder).",
    intervalSec: 10,
  },
  {
    id: "core_sage",
    name: "Sage Core",
    icon: "🎓",
    desc: "Auto-researches the cheapest affordable tech every 15s (faster than Auto-Researcher).",
    intervalSec: 15,
  },
  {
    id: "core_ascendant",
    name: "Ascendant Core",
    icon: "🔺",
    desc: "+25% EP per prestige while active.",
    intervalSec: 0,
  },
];

export const LOGIC_CORE_MAP: Record<string, LogicCore> = Object.fromEntries(
  LOGIC_CORES.map((c) => [c.id, c])
);

// ----- Helpers -----

/**
 * Aggregated bonus from all equipped relics (upside - downside).
 */
export function relicBonus(
  equipped: Record<string, boolean>
): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
} {
  let productionMult = 0;
  let capMult = 0;
  let epMult = 0;
  let popGrowthMult = 0;
  for (const relic of RELIC_LOADOUTS) {
    if (!equipped[relic.id]) continue;
    productionMult += (relic.bonus.productionMult || 0) + (relic.penalty.productionMult || 0);
    capMult += (relic.bonus.capMult || 0) + (relic.penalty.capMult || 0);
    epMult += (relic.bonus.epMult || 0) + (relic.penalty.epMult || 0);
    popGrowthMult += (relic.bonus.popGrowthMult || 0) + (relic.penalty.popGrowthMult || 0);
  }
  return { productionMult, capMult, epMult, popGrowthMult };
}

/**
 * Aggregated bonus from all active Logic Cores (only production/EP passive bonuses).
 */
export function logicCoreBonus(
  active: Record<string, boolean>
): {
  productionMult: number;
  epMult: number;
  capMult: number;
} {
  let productionMult = 0;
  let epMult = 0;
  let capMult = 0;
  for (const core of LOGIC_CORES) {
    if (!active[core.id]) continue;
    if (core.productionMult) productionMult += core.productionMult;
    // Core-specific bonuses (mapped onto common dimensions):
    if (core.id === "core_bulwark") capMult += 0.15;
    if (core.id === "core_ascendant") epMult += 0.25;
  }
  return { productionMult, epMult, capMult };
}
