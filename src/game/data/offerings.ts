// Offerings — Layer 3 (Transcendence) — the sacrificial economy.
//
// Once the god steps outside creation (Transcendence unlocked), what was built
// becomes fuel. Offerings convert run output into Divinity: surplus resources,
// stabilized infrastructure, knowledge archives, or — for the god willing to
// cross that line — population itself, in the form of a Blood Pact.
//
// Offerings are deliberately lopsided: each costs something the player spent
// real effort accumulating. A Surplus Food offering demands 100 food, which
// could have fed a city through a famine. A Blood Pact takes lives — the dark
// option, weighted with divine leverage that mundane sacrifice cannot match.
//
// Categories:
//   - surplus       : sacrifice a hoarded resource (food, gold, production, science)
//   - infrastructure: sacrifice an owned system (one of the buildings you built)
//   - population    : Blood Pact — sacrifice population for high divinity (dark)
//   - knowledge     : sacrifice a researched tech for divinity

import type { ResourceId } from "../state/types";

export type OfferingCategory =
  | "surplus"
  | "infrastructure"
  | "population"
  | "knowledge";

export interface OfferingCost {
  /** Resource to sacrifice. Required for surplus/knowledge offerings. */
  resourceId?: ResourceId;
  /** Amount of the resource to sacrifice. */
  amount: number;
  /** Population to sacrifice (Blood Pact). Used by `population` category. */
  population?: number;
  /** Whether the offering consumes one owned system (infrastructure category). */
  system?: boolean;
  /** Whether the offering consumes one researched tech (knowledge category). */
  tech?: boolean;
}

export interface OfferingDef {
  /** Stable machine id. */
  id: string;
  /** Display name. */
  name: string;
  /** Mythic-tone description of what is being offered and why it matters. */
  desc: string;
  /** Emoji icon for the card. */
  icon: string;
  /** Which sacrifice category this offering belongs to. */
  category: OfferingCategory;
  /** What the player gives up. */
  cost: OfferingCost;
  /** How much Divinity the offering generates. */
  divinityGain: number;
  /** Whether this is a "dark" offering — the Blood Pact, sacrifice of population. */
  isDark?: boolean;
}

// ============================================================
// Offering categories metadata — used for the modal's grouping UI.
// ============================================================

export const OFFERING_CATEGORIES: {
  id: OfferingCategory;
  label: string;
  icon: string;
  blurb: string;
  accent: string;
}[] = [
  {
    id: "surplus",
    label: "Surplus",
    icon: "📦",
    blurb: "Sacrifice hoarded resources — what was saved becomes divine leverage.",
    accent: "#fbbf24",
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    icon: "🏗️",
    blurb: "Dismantle a system you built. Stone returns to dust, the dust becomes divinity.",
    accent: "#a16207",
  },
  {
    id: "knowledge",
    label: "Knowledge Archive",
    icon: "📜",
    blurb: "Burn what was learned. Insight, kindled, becomes the god's breath.",
    accent: "#60a5fa",
  },
  {
    id: "population",
    label: "Blood Pact",
    icon: "🩸",
    blurb: "The dark option. Trade lives for the deepest divine leverage.",
    accent: "#ef4444",
  },
];

// ============================================================
// The ~8 offerings. Costs and gains tuned so a single offering
// is meaningful but not game-breaking: a Surplus Food offering
// trades 100 food (a meaningful mid-game hoard) for 2 Divinity,
// while a Major Blood Pact trades 50 lives for 25 Divinity —
// more efficient but morally weighted.
// ============================================================

export const OFFERINGS: OfferingDef[] = [
  // ===== Surplus (4) =====
  {
    id: "surplus_food",
    name: "Surplus Food",
    desc: "The granaries are full; the people are fed. The god takes the remainder.",
    icon: "🍖",
    category: "surplus",
    cost: { resourceId: "food", amount: 100 },
    divinityGain: 2,
  },
  {
    id: "surplus_gold",
    name: "Surplus Gold",
    desc: "Coin cannot follow the dead. Offer it to the god, and it becomes will.",
    icon: "🪙",
    category: "surplus",
    cost: { resourceId: "gold", amount: 50 },
    divinityGain: 3,
  },
  {
    id: "surplus_production",
    name: "Surplus Production",
    desc: "Idle forges cool. The god takes the unfinished work and finishes it in divine fire.",
    icon: "🏭",
    category: "surplus",
    cost: { resourceId: "production", amount: 80 },
    divinityGain: 4,
  },
  {
    id: "surplus_science",
    name: "Surplus Science",
    desc: "Theories unwritten, proofs unfinished. Offered to the god, they become foresight.",
    icon: "🔬",
    category: "surplus",
    cost: { resourceId: "science", amount: 60 },
    divinityGain: 3,
  },

  // ===== Infrastructure (1) =====
  {
    id: "infrastructure_offering",
    name: "Dismantled Infrastructure",
    desc: "A system you built — reduced to its essence. The dust rises as divinity.",
    icon: "🏗️",
    category: "infrastructure",
    cost: { amount: 1, system: true },
    divinityGain: 5,
  },

  // ===== Knowledge Archive (1) =====
  {
    id: "knowledge_archive",
    name: "Knowledge Archive",
    desc: "Burn a researched truth. Insight, kindled, lights the god's breath.",
    icon: "📜",
    category: "knowledge",
    cost: { amount: 1, tech: true },
    divinityGain: 6,
  },

  // ===== Blood Pact (2) — the dark option =====
  {
    id: "blood_pact_minor",
    name: "Blood Pact (Minor)",
    desc: "Ten lives, given. The god drinks deep, and the world shudders.",
    icon: "🩸",
    category: "population",
    cost: { amount: 10, population: 10 },
    divinityGain: 8,
    isDark: true,
  },
  {
    id: "blood_pact_major",
    name: "Blood Pact (Major)",
    desc: "Fifty souls, willingly offered. The god's will swells; the silence after is profound.",
    icon: "⚰️",
    category: "population",
    cost: { amount: 50, population: 50 },
    divinityGain: 25,
    isDark: true,
  },
];

export const OFFERING_MAP: Record<string, OfferingDef> = Object.fromEntries(
  OFFERINGS.map((o) => [o.id, o])
);

export function getOffering(id: string): OfferingDef | undefined {
  return OFFERING_MAP[id];
}

/**
 * Count total offerings available — used for the offering ledger progress meter.
 */
export function totalOfferingCount(): number {
  return OFFERINGS.length;
}
