// Government system — auto-assigned at Empire stage based on locked archetype
// + most-researched tech branch. NOT selectable — emerges from playstyle.
//
// Triggered inside `evolveStage` (store.ts) when stageIndex becomes 4 (Empire).
// Persisted on GameState as `activeGovernment: string | null`.
//
// The 5 playstyle governments (Totalitarian, Technocracy, Cultural Republic,
// Merchant Oligarchy, Democracy) are selected by counting researched techs
// per Civilization-stage branch (Military, Science, Culture, Economics).
// The 13 archetype governments are forced when the player has locked the
// matching archetype — they OVERRIDE the playstyle pick so an archetype's
// thematic government always wins.
//
// Tick application:
//   productionMult    → additive all-production mult (same shape as
//                      archetype `allProductionMult`).
//   scienceMult      → additive production mult for the `science` resource.
//   militaryMult     → additive production mult for `military_power`.
//   goldMult         → additive production mult for `gold`.
//   happinessMult    → per-tick happiness drift (positive = rises,
//                      negative = falls) scaled by HAPPINESS_DRIFT_SCALE.
//   popGrowthMult    → additive population-growth mult (same shape as
//                      archetype `populationGrowthMult`).
//   capacityMult     → additive capacity mult (same shape as
//                      archetype `capMult`).
//   tradeMult         → currently cosmetic (no trade system in tick yet) —
//                      mirrors archetype `tradeValueMult` for future market.

import { TECH_MAP } from "./techs";

export interface GovernmentDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  advantages: string[];
  disadvantages: string[];
  /** Additive all-production multiplier (+0.30 = +30%). */
  productionMult?: number;
  /** Additive `science` production multiplier. */
  scienceMult?: number;
  /** Additive `military_power` production multiplier. */
  militaryMult?: number;
  /** Per-tick happiness drift (scaled in tick). +0.20 = slow rise. */
  happinessMult?: number;
  /** Additive population-growth multiplier. +0.15 = +15%. */
  popGrowthMult?: number;
  /** Additive `gold` production multiplier. */
  goldMult?: number;
  /** Additive resource capacity multiplier. +0.50 = +50% cap. */
  capacityMult?: number;
  /** Additive trade multiplier (cosmetic / future market). */
  tradeMult?: number;
}

/** Per-second happiness drift = happinessMult × this factor. */
export const HAPPINESS_DRIFT_SCALE = 0.05;

/**
 * Map from locked-archetype id → forced government id. When the player enters
 * Empire with one of these archetypes locked, they get the matching government
 * regardless of tech branch counts.
 */
export const ARCHETYPE_GOVERNMENT_MAP: Record<string, string> = {
  necroid: "necrocracy",
  toxoid: "venom_council",
  plantoid: "gaia_communion",
  lithoid: "crystal_hegemony",
  avian: "aerie_senate",
  aquatic: "tidal_federation",
  mammalian: "pack_dominion",
  reptilian: "reptilian_junta",
  arthropoid: "hive_collective",
  fungoid: "fungal_network",
  molluscoid: "mollusc_syndicate",
  humanoid: "human_republic",
  extremophile: "extremophile_regime",
};

export const GOVERNMENTS: GovernmentDef[] = [
  // ============================================================
  // PLAYSTYLE GOVERNMENTS — chosen by dominant tech branch at Empire
  // ============================================================

  {
    id: "totalitarian",
    name: "Totalitarian",
    icon: "⚔️",
    desc: "Iron rule. The state is the sword — and the sword does not ask.",
    advantages: ["+50% military", "+30% production"],
    disadvantages: ["-30% happiness", "-20% pop growth"],
    productionMult: 0.30,
    militaryMult: 0.50,
    happinessMult: -0.30,
    popGrowthMult: -0.20,
  },
  {
    id: "technocracy",
    name: "Technocracy",
    icon: "🔬",
    desc: "Rule by experts. Data decides; charisma is a relic.",
    advantages: ["+25% science", "+15% production"],
    disadvantages: ["-10% happiness"],
    productionMult: 0.15,
    scienceMult: 0.25,
    happinessMult: -0.10,
  },
  {
    id: "cultural_republic",
    name: "Cultural Republic",
    icon: "🎭",
    desc: "The arts are the state, and the state is the arts.",
    advantages: ["+20% happiness", "+15% pop growth"],
    disadvantages: ["-10% military"],
    happinessMult: 0.20,
    popGrowthMult: 0.15,
    militaryMult: -0.10,
  },
  {
    id: "merchant_oligarchy",
    name: "Merchant Oligarchy",
    icon: "💰",
    desc: "A few families own the ledgers. Everyone else rents.",
    advantages: ["+40% gold", "+20% trade"],
    disadvantages: ["-15% military"],
    goldMult: 0.40,
    tradeMult: 0.20,
    militaryMult: -0.15,
  },
  {
    id: "democracy",
    name: "Democracy",
    icon: "🗳️",
    desc: "Slow, loud, fair enough. No grand peaks, no terrible valleys.",
    advantages: ["+10% all production", "+10% happiness"],
    disadvantages: ["No big bonuses"],
    productionMult: 0.10,
    happinessMult: 0.10,
  },
  {
    id: "socialist_collective",
    name: "Socialist Collective",
    icon: "🌾",
    desc: "From each by ability; to each by need. The granary is always full.",
    advantages: ["+30% food", "+20% happiness", "+10% pop growth"],
    disadvantages: ["-15% production", "-20% gold"],
    popGrowthMult: 0.10,
    happinessMult: 0.20,
    goldMult: -0.20,
  },
  {
    id: "industrial_juggernaut",
    name: "Industrial Juggernaut",
    icon: "🏭",
    desc: "The factory IS the state. Smoke never sleeps.",
    advantages: ["+40% production", "+15% capacity"],
    disadvantages: ["-25% happiness", "-15% science"],
    productionMult: 0.40,
    capacityMult: 0.15,
    happinessMult: -0.25,
    scienceMult: -0.15,
  },

  // ============================================================
  // ARCHETYPE GOVERNMENTS — forced when locked archetype matches
  // ============================================================

  {
    id: "necrocracy",
    name: "Necrocracy",
    icon: "☥",
    desc: "The dead rule. The living serve. Both pay taxes.",
    advantages: ["+30% production", "pop never decreases"],
    disadvantages: ["-50% pop growth"],
    productionMult: 0.30,
    popGrowthMult: -0.50,
  },
  {
    id: "venom_council",
    name: "Venom Council",
    icon: "☣",
    desc: "Seven venom-lords, one throne of fangs. The dose is law.",
    advantages: ["+40% military", "+20% pop growth"],
    disadvantages: ["-25% happiness"],
    militaryMult: 0.40,
    popGrowthMult: 0.20,
    happinessMult: -0.25,
  },
  {
    id: "gaia_communion",
    name: "Gaia Communion",
    icon: "✿",
    desc: "Roots bind the realm. Branches bear the law. Leaves vote in spring.",
    advantages: ["+30% food", "+20% pop growth"],
    disadvantages: ["-20% military"],
    popGrowthMult: 0.20,
    militaryMult: -0.20,
  },
  {
    id: "crystal_hegemony",
    name: "Crystal Hegemony",
    icon: "◆",
    desc: "Patience made stone. The throne outlives its heirs.",
    advantages: ["+50% capacity", "+20% production"],
    disadvantages: ["-30% pop growth"],
    productionMult: 0.20,
    capacityMult: 0.50,
    popGrowthMult: -0.30,
  },
  {
    id: "aerie_senate",
    name: "Aerie Senate",
    icon: "⋋",
    desc: "A council of far-sighted flocks. The horizon is the chamber.",
    advantages: ["+25% science", "+15% happiness"],
    disadvantages: ["-10% military"],
    scienceMult: 0.25,
    happinessMult: 0.15,
    militaryMult: -0.10,
  },
  {
    id: "tidal_federation",
    name: "Tidal Federation",
    icon: "≈",
    desc: "Provinces of the deep, joined by current and memory.",
    advantages: ["+20% trade", "+15% science"],
    disadvantages: ["-15% military"],
    tradeMult: 0.20,
    scienceMult: 0.15,
    militaryMult: -0.15,
  },
  {
    id: "pack_dominion",
    name: "Pack Dominion",
    icon: "denti",
    desc: "One alpha, many kin. Loyalty is currency and muscle.",
    advantages: ["+20% food", "+15% pop growth"],
    disadvantages: ["-10% science"],
    popGrowthMult: 0.15,
    scienceMult: -0.10,
  },
  {
    id: "reptilian_junta",
    name: "Reptilian Junta",
    icon: "∿",
    desc: "Cold generals, colder orders. The strike is the speech.",
    advantages: ["+30% military", "+15% production"],
    disadvantages: ["-20% happiness"],
    militaryMult: 0.30,
    productionMult: 0.15,
    happinessMult: -0.20,
  },
  {
    id: "hive_collective",
    name: "Hive Collective",
    icon: "✶",
    desc: "One will, many limbs. The queen is the state.",
    advantages: ["+25% production", "+15% capacity"],
    disadvantages: ["-20% happiness"],
    productionMult: 0.25,
    capacityMult: 0.15,
    happinessMult: -0.20,
  },
  {
    id: "fungal_network",
    name: "Fungal Network",
    icon: "☂",
    desc: "Mycelium of policy. What rots becomes law.",
    advantages: ["+20% all production per system", "+10% capacity"],
    disadvantages: ["-15% happiness"],
    capacityMult: 0.10,
    happinessMult: -0.15,
  },
  {
    id: "mollusc_syndicate",
    name: "Mollusc Syndicate",
    icon: "◯",
    desc: "Soft brokers in shell-towers. Patience is the premium.",
    advantages: ["+20% trade", "+15% gold"],
    disadvantages: ["-10% military"],
    tradeMult: 0.20,
    goldMult: 0.15,
    militaryMult: -0.10,
  },
  {
    id: "human_republic",
    name: "Human Republic",
    icon: "☻",
    desc: "Compromise dressed as conviction. Adaptable, average, free.",
    advantages: ["+15% all production", "+10% happiness"],
    disadvantages: ["No big bonuses"],
    productionMult: 0.15,
    happinessMult: 0.10,
  },
  {
    id: "extremophile_regime",
    name: "Extremophile Regime",
    icon: "☢",
    desc: "Hardiness as ideology. Discomfort is devotion.",
    advantages: ["Immune to ALL events", "+30% capacity"],
    disadvantages: ["-15% all production when resources plentiful"],
    capacityMult: 0.30,
    productionMult: -0.15,
  },
];

export const GOVERNMENT_MAP: Record<string, GovernmentDef> = Object.fromEntries(
  GOVERNMENTS.map((g) => [g.id, g])
);

/**
 * Civilization-stage tech branches used to determine the playstyle government.
 * Counted across the player's researched techs (`technologies` map).
 */
export const PLAYSTYLE_BRANCHES = {
  military: "Military",
  science: "Science",
  culture: "Culture",
  economics: "Economics",
} as const;

export type PlaystyleBranch = keyof typeof PLAYSTYLE_BRANCHES;

/**
 * Each archetype has a UNIQUE trigger condition for its government — a
 * different combination of tech branch dominance. This means getting the
 * Necrocracy requires a different playstyle than getting the Venom Council.
 *
 * The 7 general governments (Totalitarian, Technocracy, Cultural Republic,
 * Merchant Oligarchy, Socialist Collective, Industrial Juggernaut, Democracy)
 * are available to ALL archetypes — they just require a different tech focus.
 *
 * The archetype-specific government triggers ONLY when the player's tech path
 * matches the archetype's unique recipe. Otherwise, they fall through to the
 * general pool.
 */
interface ArchetypeGovCondition {
  /** Minimum tech count per branch to trigger this archetype's government */
  military: number;
  science: number;
  culture: number;
  economics: number;
  /** Which branch must be the highest (or null for balanced/dual-focus) */
  dominantBranch?: PlaystyleBranch | null;
  /** Which branch must be the lowest (or null for any) */
  weakestBranch?: PlaystyleBranch | null;
  /** If true, ALL branches must be nearly equal (max-min ≤ 1) — for Humanoid/Extremophile only */
  requireBalance?: boolean;
}

export const ARCHETYPE_GOV_CONDITIONS: Record<string, ArchetypeGovCondition> = {
  // Humanoid → perfectly balanced across all 4 → Human Republic
  humanoid:    { military: 2, science: 2, culture: 2, economics: 2, dominantBranch: null, weakestBranch: null, requireBalance: true },
  // Mammalian → high Culture + low Military → Pack Dominion
  mammalian:   { military: 0, science: 0, culture: 3, economics: 2, dominantBranch: "culture", weakestBranch: "military" },
  // Reptilian → high Military + low Culture → Reptilian Junta
  reptilian:   { military: 4, science: 0, culture: 0, economics: 0, dominantBranch: "military", weakestBranch: "culture" },
  // Necroid → high Science + low Economics → Necrocracy
  necroid:     { military: 0, science: 4, culture: 0, economics: 0, dominantBranch: "science", weakestBranch: "economics" },
  // Arthropoid → high Economics + low Culture → Hive Collective
  arthropoid:  { military: 0, science: 0, culture: 0, economics: 4, dominantBranch: "economics", weakestBranch: "culture" },
  // Plantoid → high Culture + low Military → Gaia Communion
  plantoid:    { military: 0, science: 0, culture: 4, economics: 0, dominantBranch: "culture", weakestBranch: "military" },
  // Fungoid → high Economics + high Science (both ≥ 3) → Fungal Network
  fungoid:     { military: 0, science: 3, culture: 0, economics: 3, dominantBranch: null, weakestBranch: null },
  // Molluscoid → high Economics + high Culture (both ≥ 3) → Mollusc Syndicate
  molluscoid:  { military: 0, science: 0, culture: 3, economics: 3, dominantBranch: null, weakestBranch: null },
  // Lithoid → high Science + high Military (both ≥ 3) → Crystal Hegemony
  lithoid:     { military: 3, science: 3, culture: 0, economics: 0, dominantBranch: null, weakestBranch: null },
  // Toxoid → high Military + high Economics (both ≥ 3) → Venom Council
  toxoid:      { military: 3, science: 0, culture: 0, economics: 3, dominantBranch: null, weakestBranch: null },
  // Avian → high Science + high Culture (both ≥ 3) → Aerie Senate
  avian:       { military: 0, science: 3, culture: 3, economics: 0, dominantBranch: null, weakestBranch: null },
  // Aquatic → high Science + high Economics (both ≥ 3) → Tidal Federation
  aquatic:     { military: 0, science: 3, culture: 0, economics: 3, dominantBranch: null, weakestBranch: null },
  // Extremophile → ALL branches exactly equal (perfect tie, all ≥ 2) → Extremophile Regime
  extremophile:{ military: 2, science: 2, culture: 2, economics: 2, dominantBranch: null, weakestBranch: null, requireBalance: true },
};

/**
 * Check if the player's tech counts match their archetype's unique condition.
 * Each archetype requires a different pattern — e.g. Necroid needs high Science
 * + low Economics, while Toxoid needs high Military + high Economics.
 */
function matchesArchetypeCondition(
  counts: Record<PlaystyleBranch, number>,
  cond: ArchetypeGovCondition
): boolean {
  // Check minimums
  if (counts.military < cond.military) return false;
  if (counts.science < cond.science) return false;
  if (counts.culture < cond.culture) return false;
  if (counts.economics < cond.economics) return false;
  // Check dominant branch (only if specified)
  if (cond.dominantBranch) {
    const dom = counts[cond.dominantBranch];
    for (const k of Object.keys(counts) as PlaystyleBranch[]) {
      if (k !== cond.dominantBranch && counts[k] > dom) return false;
    }
  }
  // Check weakest branch (only if specified)
  if (cond.weakestBranch) {
    const weak = counts[cond.weakestBranch];
    for (const k of Object.keys(counts) as PlaystyleBranch[]) {
      if (k !== cond.weakestBranch && counts[k] < weak) return false;
    }
  }
  // Check perfect balance (only for Humanoid/Extremophile with requireBalance flag)
  if (cond.requireBalance) {
    const vals = Object.values(counts);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    if (max - min > 1) return false;
  }
  return true;
}

/**
 * Pick a playstyle government based on which of the four Civilization-stage
 * branches the player has researched the most. These 7 are available to ALL
 * archetypes. Ties → Democracy.
 *
 * Also checks for special conditions:
 * - High Culture + Economics → Socialist Collective
 * - High Economics, low Military → Industrial Juggernaut
 */
export function pickPlaystyleGovernment(
  technologies: Record<string, boolean>
): string {
  const counts: Record<PlaystyleBranch, number> = {
    military: 0,
    science: 0,
    culture: 0,
    economics: 0,
  };
  for (const [techId, owned] of Object.entries(technologies)) {
    if (!owned) continue;
    const tech = TECH_REF[techId];
    if (!tech) continue;
    for (const k of Object.keys(counts) as PlaystyleBranch[]) {
      if (tech.branch === PLAYSTYLE_BRANCHES[k]) {
        counts[k] += 1;
      }
    }
  }

  // Check for special playstyle conditions:
  if (counts.culture >= 3 && counts.economics >= 2) {
    return "socialist_collective";
  }
  if (counts.economics >= 4 && counts.military <= 1) {
    return "industrial_juggernaut";
  }

  // Find the dominant branch (ties → Democracy).
  let best: PlaystyleBranch | null = null;
  let bestVal = 0;
  let tie = false;
  for (const k of Object.keys(counts) as PlaystyleBranch[]) {
    if (counts[k] > bestVal) {
      bestVal = counts[k];
      best = k;
      tie = false;
    } else if (counts[k] === bestVal && bestVal > 0) {
      tie = true;
    }
  }
  if (!best || bestVal === 0 || tie) return "democracy";
  switch (best) {
    case "military":   return "totalitarian";
    case "science":    return "technocracy";
    case "culture":    return "cultural_republic";
    case "economics":  return "merchant_oligarchy";
    default:           return "democracy";
  }
}

/**
 * Count tech branches for the player's researched techs.
 */
export function countTechBranches(
  technologies: Record<string, boolean>
): Record<PlaystyleBranch, number> {
  const counts: Record<PlaystyleBranch, number> = {
    military: 0, science: 0, culture: 0, economics: 0,
  };
  for (const [techId, owned] of Object.entries(technologies)) {
    if (!owned) continue;
    const tech = TECH_REF[techId];
    if (!tech) continue;
    for (const k of Object.keys(counts) as PlaystyleBranch[]) {
      if (tech.branch === PLAYSTYLE_BRANCHES[k]) counts[k] += 1;
    }
  }
  return counts;
}

/**
 * Decide which government to assign at Empire evolution.
 *
 *  1. Check if the player's locked archetype has a unique government trigger
 *     (each archetype has a DIFFERENT recipe — e.g. Necroid needs high Science
 *     + low Economics, Toxoid needs high Military + high Economics).
 *  2. If the archetype condition matches → assign the archetype government.
 *  3. Otherwise → fall through to the 7 general governments (available to all).
 *
 * This means:
 * - A Necroid with heavy Military gets Totalitarian (general), not Necrocracy.
 * - A Necroid with heavy Science + low Economics gets Necrocracy (archetype).
 * - Any archetype can get any of the 7 general governments.
 * - Each archetype's unique government requires a different playstyle.
 */
export function pickGovernmentForEmpire(
  lockedArchetype: string | null,
  technologies: Record<string, boolean>
): string {
  const counts = countTechBranches(technologies);

  // Step 1: Check archetype-specific condition (each has a unique recipe)
  if (lockedArchetype) {
    const cond = ARCHETYPE_GOV_CONDITIONS[lockedArchetype];
    const archGov = ARCHETYPE_GOVERNMENT_MAP[lockedArchetype];
    if (cond && archGov && GOVERNMENT_MAP[archGov]) {
      if (matchesArchetypeCondition(counts, cond)) {
        return archGov;
      }
    }
  }

  // Step 2: Fall through to general governments (7, available to all)
  // Special conditions first
  if (counts.culture >= 3 && counts.economics >= 2) return "socialist_collective";
  if (counts.economics >= 4 && counts.military <= 1) return "industrial_juggernaut";

  // Find dominant branch
  let best: PlaystyleBranch | null = null;
  let bestVal = 0;
  let tie = false;
  for (const k of Object.keys(counts) as PlaystyleBranch[]) {
    if (counts[k] > bestVal) {
      bestVal = counts[k];
      best = k;
      tie = false;
    } else if (counts[k] === bestVal && bestVal > 0) {
      tie = true;
    }
  }
  if (!best || bestVal === 0 || tie) return "democracy";
  switch (best) {
    case "military":   return "totalitarian";
    case "science":    return "technocracy";
    case "culture":    return "cultural_republic";
    case "economics":  return "merchant_oligarchy";
    default:           return "democracy";
  }
}

// TECH_REF — internal lazy reference to the tech branch lookup. Pulled in
// at module load so this data module can resolve tech branches for the
// playstyle count without creating a cycle (techs.ts does not import this
// file).
const TECH_REF = TECH_MAP;
