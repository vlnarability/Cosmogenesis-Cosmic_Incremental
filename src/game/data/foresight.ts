// ===========================================================================
// LAYER 2 — ENLIGHTENMENT (FORESIGHT)
// ===========================================================================
// After 3 challenges mastered, the god opens its eyes. Foresight is the first
// act of an awakened deity: choosing a Route through the cosmic tree, then
// purchasing Foresight Nodes that grant permanent production / capacity / EP
// multipliers. Currency = Divinity (earned on prestige when this layer is
// unlocked). Only 10 of 20 nodes need to be purchased to advance to Layer 3.
// ===========================================================================

export type ForesightRouteId =
  | "growth"
  | "conquest"
  | "harmony"
  | "wealth"
  | "knowledge"
  | "transcendence";

export interface ForesightRoute {
  id: ForesightRouteId;
  name: string;
  icon: string;
  blurb: string;
  bonus: {
    productionMult?: number; // additive bonus when this route is active
    capMult?: number;
    epMult?: number;
    popGrowthMult?: number;
  };
}

export const FORESIGHT_ROUTES: ForesightRoute[] = [
  {
    id: "growth",
    name: "Route of Growth",
    icon: "🌱",
    blurb: "Tend the small fires of life. Population and production grow faster.",
    bonus: { productionMult: 0.15, popGrowthMult: 0.20 },
  },
  {
    id: "conquest",
    name: "Route of Conquest",
    icon: "⚔️",
    blurb: "Force begets force. Production surges, but you cannot grow weary.",
    bonus: { productionMult: 0.25 },
  },
  {
    id: "harmony",
    name: "Route of Harmony",
    icon: "☯️",
    blurb: "Balance multiplies capacity. The vessel holds more of every tide.",
    bonus: { capMult: 0.30 },
  },
  {
    id: "wealth",
    name: "Route of Wealth",
    icon: "💰",
    blurb: "All coins flow toward the throne. Earn more Evolution Points per prestige.",
    bonus: { epMult: 0.50 },
  },
  {
    id: "knowledge",
    name: "Route of Knowledge",
    icon: "📚",
    blurb: "The slower path yields the deepest gains. +10% production, +20% EP.",
    bonus: { productionMult: 0.10, epMult: 0.20 },
  },
  {
    id: "transcendence",
    name: "Route of Transcendence",
    icon: "🔺",
    blurb: "All things in equal measure. A balanced ascent across every domain.",
    bonus: { productionMult: 0.08, capMult: 0.10, epMult: 0.10, popGrowthMult: 0.05 },
  },
];

export const FORESIGHT_ROUTE_MAP: Record<string, ForesightRoute> = Object.fromEntries(
  FORESIGHT_ROUTES.map((r) => [r.id, r])
);

// ----- Foresight Nodes -----
// 20 nodes across 6 categories. Each has a Divinity cost, an optional
// prerequisite node id, and a bonus applied as a multiplier / additive.

export type ForesightCategory =
  | "production"
  | "capacity"
  | "population"
  | "economy"
  | "science"
  | "ascension";

export interface ForesightNodeBonus {
  productionMult?: number;
  capMult?: number;
  epMult?: number;
  popGrowthMult?: number;
  costMult?: number; // negative = cost reduction
  divinityMult?: number; // bonus Divinity earned per prestige
}

export interface ForesightNode {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: ForesightCategory;
  cost: number; // Divinity
  requires?: string; // prerequisite node id
  bonus: ForesightNodeBonus;
}

export const FORESIGHT_NODES: ForesightNode[] = [
  // Production (4)
  {
    id: "fn_prod_ember",
    name: "Ember of Becoming",
    desc: "+10% all production.",
    icon: "🔥",
    category: "production",
    cost: 5,
    bonus: { productionMult: 0.10 },
  },
  {
    id: "fn_prod_blaze",
    name: "Blaze of Becoming",
    desc: "+20% all production. Requires Ember.",
    icon: "🌋",
    category: "production",
    cost: 15,
    requires: "fn_prod_ember",
    bonus: { productionMult: 0.20 },
  },
  {
    id: "fn_prod_inferno",
    name: "Inferno of Becoming",
    desc: "+35% all production. Requires Blaze.",
    icon: "☀️",
    category: "production",
    cost: 40,
    requires: "fn_prod_blaze",
    bonus: { productionMult: 0.35 },
  },
  {
    id: "fn_prod_singularity",
    name: "Productive Singularity",
    desc: "+50% all production. Requires Inferno.",
    icon: "⭐",
    category: "production",
    cost: 100,
    requires: "fn_prod_inferno",
    bonus: { productionMult: 0.50 },
  },

  // Capacity (3)
  {
    id: "fn_cap_vessel",
    name: "Wider Vessel",
    desc: "+15% all capacities.",
    icon: "🏺",
    category: "capacity",
    cost: 6,
    bonus: { capMult: 0.15 },
  },
  {
    id: "fn_cap_ocean",
    name: "An Ocean of Patience",
    desc: "+25% all capacities. Requires Wider Vessel.",
    icon: "🌊",
    category: "capacity",
    cost: 20,
    requires: "fn_cap_vessel",
    bonus: { capMult: 0.25 },
  },
  {
    id: "fn_cap_infinite",
    name: "The Infinite Cup",
    desc: "+40% all capacities. Requires An Ocean of Patience.",
    icon: "🪣",
    category: "capacity",
    cost: 60,
    requires: "fn_cap_ocean",
    bonus: { capMult: 0.40 },
  },

  // Population (3)
  {
    id: "fn_pop_hearth",
    name: "Hearth of Plenty",
    desc: "+15% population growth.",
    icon: "🔥",
    category: "population",
    cost: 5,
    bonus: { popGrowthMult: 0.15 },
  },
  {
    id: "fn_pop_swarm",
    name: "The Quiet Swarm",
    desc: "+25% population growth. Requires Hearth of Plenty.",
    icon: "🐝",
    category: "population",
    cost: 18,
    requires: "fn_pop_hearth",
    bonus: { popGrowthMult: 0.25 },
  },
  {
    id: "fn_pop_multitude",
    name: "A Multitude Without End",
    desc: "+35% population growth. Requires The Quiet Swarm.",
    icon: "👥",
    category: "population",
    cost: 50,
    requires: "fn_pop_swarm",
    bonus: { popGrowthMult: 0.35 },
  },

  // Economy (4)
  {
    id: "fn_eco_thrift",
    name: "Frugality of the Gods",
    desc: "-10% all system & tech costs.",
    icon: "🪙",
    category: "economy",
    cost: 8,
    bonus: { costMult: -0.10 },
  },
  {
    id: "fn_eco_bounty",
    name: "Bounty of the Throne",
    desc: "+25% Evolution Points per prestige.",
    icon: "💎",
    category: "economy",
    cost: 12,
    bonus: { epMult: 0.25 },
  },
  {
    id: "fn_eco_overflow",
    name: "The Overflowing Cup",
    desc: "+30% Divinity earned on prestige. Requires Bounty of the Throne.",
    icon: "🥤",
    category: "economy",
    cost: 35,
    requires: "fn_eco_bounty",
    bonus: { divinityMult: 0.30 },
  },
  {
    id: "fn_eco_pact",
    name: "Pact with the Treasury",
    desc: "-20% costs, +25% EP. Requires Frugality + Bounty.",
    icon: "📜",
    category: "economy",
    cost: 80,
    requires: "fn_eco_thrift",
    bonus: { costMult: -0.20, epMult: 0.25 },
  },

  // Science (3)
  {
    id: "fn_sci_insight",
    name: "First Insight",
    desc: "+8% production, +10% EP.",
    icon: "💡",
    category: "science",
    cost: 7,
    bonus: { productionMult: 0.08, epMult: 0.10 },
  },
  {
    id: "fn_sci_pattern",
    name: "Pattern in the Noise",
    desc: "+12% production, +15% EP. Requires First Insight.",
    icon: "🔮",
    category: "science",
    cost: 25,
    requires: "fn_sci_insight",
    bonus: { productionMult: 0.12, epMult: 0.15 },
  },
  {
    id: "fn_sci_grand",
    name: "The Grand Equation",
    desc: "+20% production, +25% EP. Requires Pattern in the Noise.",
    icon: "∑",
    category: "science",
    cost: 70,
    requires: "fn_sci_pattern",
    bonus: { productionMult: 0.20, epMult: 0.25 },
  },

  // Ascension (3)
  {
    id: "fn_asc_step",
    name: "First Step Beyond",
    desc: "+5% production, +5% cap, +5% pop, +5% EP. The balanced node.",
    icon: "🪜",
    category: "ascension",
    cost: 10,
    bonus: { productionMult: 0.05, capMult: 0.05, epMult: 0.05, popGrowthMult: 0.05 },
  },
  {
    id: "fn_asc_leap",
    name: "The Long Leap",
    desc: "+10% all bonuses. Requires First Step Beyond.",
    icon: "🌠",
    category: "ascension",
    cost: 30,
    requires: "fn_asc_step",
    bonus: { productionMult: 0.10, capMult: 0.10, epMult: 0.10, popGrowthMult: 0.10 },
  },
  {
    id: "fn_asc_apotheosis",
    name: "Toward Apotheosis",
    desc: "+15% all bonuses. Requires The Long Leap.",
    icon: "👑",
    category: "ascension",
    cost: 90,
    requires: "fn_asc_leap",
    bonus: { productionMult: 0.15, capMult: 0.15, epMult: 0.15, popGrowthMult: 0.15 },
  },
];

export const FORESIGHT_NODE_MAP: Record<string, ForesightNode> = Object.fromEntries(
  FORESIGHT_NODES.map((n) => [n.id, n])
);

// Nodes required to advance to Layer 3 (Transcendence).
export const FORESIGHT_NODES_REQUIRED_FOR_LAYER_3 = 10;

// ----- Helpers -----

/**
 * Aggregated bonus from all purchased foresight nodes.
 * Returns the sum of each bonus dimension across the purchased set.
 */
export function foresightBonus(
  purchased: Record<string, boolean>
): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  costMult: number;
  divinityMult: number;
} {
  let productionMult = 0;
  let capMult = 0;
  let epMult = 0;
  let popGrowthMult = 0;
  let costMult = 0;
  let divinityMult = 0;
  for (const node of FORESIGHT_NODES) {
    if (!purchased[node.id]) continue;
    const b = node.bonus;
    productionMult += b.productionMult || 0;
    capMult += b.capMult || 0;
    epMult += b.epMult || 0;
    popGrowthMult += b.popGrowthMult || 0;
    costMult += b.costMult || 0;
    divinityMult += b.divinityMult || 0;
  }
  return { productionMult, capMult, epMult, popGrowthMult, costMult, divinityMult };
}

/**
 * Bonus from the currently active foresight Route (or null).
 */
export function routeBonus(
  activeRoute: string | null | undefined
): {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
} {
  if (!activeRoute) return { productionMult: 0, capMult: 0, epMult: 0, popGrowthMult: 0 };
  const route = FORESIGHT_ROUTE_MAP[activeRoute];
  if (!route) return { productionMult: 0, capMult: 0, epMult: 0, popGrowthMult: 0 };
  return {
    productionMult: route.bonus.productionMult || 0,
    capMult: route.bonus.capMult || 0,
    epMult: route.bonus.epMult || 0,
    popGrowthMult: route.bonus.popGrowthMult || 0,
  };
}

/**
 * Returns true if the player has purchased enough nodes to advance to Layer 3.
 */
export function canAdvanceToTranscendence(
  purchased: Record<string, boolean>
): boolean {
  const count = FORESIGHT_NODES.filter((n) => purchased[n.id]).length;
  return count >= FORESIGHT_NODES_REQUIRED_FOR_LAYER_3;
}

/**
 * Count purchased foresight nodes.
 */
export function countForesightNodes(
  purchased: Record<string, boolean>
): number {
  return FORESIGHT_NODES.filter((n) => purchased[n.id]).length;
}
