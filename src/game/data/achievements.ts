// Achievement system — persistent goals across all runs
// Each achievement gives a small permanent bonus (0.5-1% production)
// Total at full completion: ~15-20% bonus

import type { StageId } from "../state/types";

export type AchievementCategory =
  | "stage" | "speed" | "lineage" | "resource" | "crisis"
  | "narrative" | "layer" | "cosmetic";

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  category: AchievementCategory;
  icon: string;
  // Check if achievement is earned given the meta state
  check: (meta: AchievementCheckCtx) => boolean;
  bonus: { type: "production" | "manual" | "capacity" | "evolve"; value: number };
  // For display: tiers/progress (optional, not implemented yet)
  tier?: number;
}

export interface AchievementCheckCtx {
  galacticWins: number;
  totalRuns: number;
  stageClearCounts: Record<StageId, number>;
  archivedArchetypes: string[];
  storyUnlockedCount: number;
  systemsDiscoveredCount: number;
  techResearchedCount: number;
  upgradesOwnedCount: number;
  // current run state (optional)
  maxPopulation?: number;
  maxScore?: number;
  totalResources?: number;
  fastestCellClear?: number; // seconds
  eventsResolved?: number; // events resolved this run (meta)
  totalEventsResolved?: number; // across all runs
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ===== STAGE COMPLETION =====
  {
    id: "first_cell",
    name: "First Spark",
    desc: "Evolve past the Cell stage for the first time.",
    category: "stage",
    icon: "⚡",
    check: (c) => (c.stageClearCounts.cell || 0) >= 1,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "first_creature",
    name: "First Body",
    desc: "Evolve past the Creature stage for the first time.",
    category: "stage",
    icon: "🧬",
    check: (c) => (c.stageClearCounts.creature || 0) >= 1,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "first_tribal",
    name: "Fire-Keeper",
    desc: "Evolve past the Tribal stage for the first time.",
    category: "stage",
    icon: "🔥",
    check: (c) => (c.stageClearCounts.tribal || 0) >= 1,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "first_civilization",
    name: "City-Builder",
    desc: "Evolve past the Civilization stage for the first time.",
    category: "stage",
    icon: "🏛️",
    check: (c) => (c.stageClearCounts.civilization || 0) >= 1,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "first_empire",
    name: "Imperial Ambition",
    desc: "Evolve past the Empire stage for the first time.",
    category: "stage",
    icon: "⚔️",
    check: (c) => (c.stageClearCounts.empire || 0) >= 1,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "first_solar",
    name: "Sky-Breaker",
    desc: "Evolve past the Solar stage for the first time.",
    category: "stage",
    icon: "☀️",
    check: (c) => (c.stageClearCounts.solar || 0) >= 1,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "first_galactic",
    name: "Creation Reaches the Stars",
    desc: "Achieve Galactic Ascension for the first time.",
    category: "stage",
    icon: "🌌",
    check: (c) => c.galacticWins >= 1,
    bonus: { type: "production", value: 0.02 },
  },

  // ===== RUNS =====
  {
    id: "ten_runs",
    name: "Persistent God",
    desc: "Complete 10 runs total.",
    category: "layer",
    icon: "🔁",
    check: (c) => c.totalRuns >= 10,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "hundred_runs",
    name: "Eternal Curator",
    desc: "Complete 100 runs total.",
    category: "layer",
    icon: "♾️",
    check: (c) => c.totalRuns >= 100,
    bonus: { type: "production", value: 0.03 },
  },
  {
    id: "five_galactic_wins",
    name: "Five Universes",
    desc: "Achieve Galactic Ascension 5 times.",
    category: "layer",
    icon: "🌟",
    check: (c) => c.galacticWins >= 5,
    bonus: { type: "production", value: 0.02 },
  },

  // ===== LINEAGE MASTERY =====
  {
    id: "three_archetypes",
    name: "Diverse Genesis",
    desc: "Lock in 3 different archetypes across runs.",
    category: "lineage",
    icon: "🧬",
    check: (c) => (c.archivedArchetypes?.length || 0) >= 3,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "six_archetypes",
    name: "Lineage Cartographer",
    desc: "Lock in 6 different archetypes across runs.",
    category: "lineage",
    icon: "🗺️",
    check: (c) => (c.archivedArchetypes?.length || 0) >= 6,
    bonus: { type: "production", value: 0.02 },
  },
  {
    id: "all_basic_archetypes",
    name: "Specimen Cabinet",
    desc: "Lock in all 9 basic archetypes.",
    category: "lineage",
    icon: "🗂️",
    check: (c) => {
      const basics = ["humanoid", "mammalian", "reptilian", "avian", "arthropoid", "molluscoid", "fungoid", "plantoid", "aquatic"];
      return basics.every((id) => (c.archivedArchetypes || []).includes(id));
    },
    bonus: { type: "production", value: 0.03 },
  },

  // ===== DISCOVERY =====
  {
    id: "discover_10_systems",
    name: "Hands-On Builder",
    desc: "Build 10 different systems.",
    category: "resource",
    icon: "🏗️",
    check: (c) => c.systemsDiscoveredCount >= 10,
    bonus: { type: "capacity", value: 0.02 },
  },
  {
    id: "discover_all_systems",
    name: "Master Architect",
    desc: "Build all 39 systems across all stages.",
    category: "resource",
    icon: "🏰",
    check: (c) => c.systemsDiscoveredCount >= 39,
    bonus: { type: "capacity", value: 0.05 },
  },
  {
    id: "research_10_techs",
    name: "Curious Mind",
    desc: "Research 10 different technologies.",
    category: "resource",
    icon: "🔬",
    check: (c) => c.techResearchedCount >= 10,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "research_all_techs",
    name: "Polymath",
    desc: "Research all 30 technologies across all stages.",
    category: "resource",
    icon: "🎓",
    check: (c) => c.techResearchedCount >= 30,
    bonus: { type: "production", value: 0.03 },
  },

  // ===== NARRATIVE =====
  {
    id: "first_scripture",
    name: "First Word",
    desc: "Unlock your first story entry.",
    category: "narrative",
    icon: "📖",
    check: (c) => c.storyUnlockedCount >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "five_scriptures",
    name: "Chronicler",
    desc: "Unlock 5 story entries.",
    category: "narrative",
    icon: "✍️",
    check: (c) => c.storyUnlockedCount >= 5,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "all_scriptures",
    name: "Testament",
    desc: "Unlock every story entry.",
    category: "narrative",
    icon: "📜",
    check: (c) => c.storyUnlockedCount >= 14,
    bonus: { type: "production", value: 0.02 },
  },

  // ===== SHOP =====
  {
    id: "first_upgrade",
    name: "Investor",
    desc: "Purchase your first shop upgrade.",
    category: "layer",
    icon: "🛒",
    check: (c) => c.upgradesOwnedCount >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "five_upgrades",
    name: "Patron",
    desc: "Own 5 shop upgrades (any levels).",
    category: "layer",
    icon: "💎",
    check: (c) => c.upgradesOwnedCount >= 5,
    bonus: { type: "production", value: 0.01 },
  },

  // ===== POPULATION MILESTONES =====
  {
    id: "pop_50",
    name: "Village",
    desc: "Reach 50 population in a single run.",
    category: "resource",
    icon: "🏘️",
    check: (c) => (c.maxPopulation || 0) >= 50,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "pop_200",
    name: "Town",
    desc: "Reach 200 population in a single run.",
    category: "resource",
    icon: "🏙️",
    check: (c) => (c.maxPopulation || 0) >= 200,
    bonus: { type: "production", value: 0.02 },
  },
  {
    id: "pop_1000",
    name: "Metropolis",
    desc: "Reach 1,000 population in a single run.",
    category: "resource",
    icon: "🌆",
    check: (c) => (c.maxPopulation || 0) >= 1000,
    bonus: { type: "production", value: 0.03 },
  },

  // ===== STAGE MASTERY TIERS =====
  {
    id: "cell_master_5",
    name: "Cell Veteran",
    desc: "Evolve past the Cell stage 5 times.",
    category: "stage",
    icon: "⚡",
    check: (c) => (c.stageClearCounts.cell || 0) >= 5,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "creature_master_5",
    name: "Creature Veteran",
    desc: "Evolve past the Creature stage 5 times.",
    category: "stage",
    icon: "🧬",
    check: (c) => (c.stageClearCounts.creature || 0) >= 5,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "tribal_master_5",
    name: "Tribal Veteran",
    desc: "Evolve past the Tribal stage 5 times.",
    category: "stage",
    icon: "🔥",
    check: (c) => (c.stageClearCounts.tribal || 0) >= 5,
    bonus: { type: "production", value: 0.01 },
  },

  // ===== SPEED RUNS =====
  {
    id: "fast_cell",
    name: "Quick Spark",
    desc: "Evolve past Cell in under 5 minutes of game time.",
    category: "speed",
    icon: "⏱️",
    check: (c) => (c.stageClearCounts.cell || 0) >= 1 && (c.fastestCellClear || 999999) <= 300,
    bonus: { type: "production", value: 0.02 },
  },

  // ===== RARE ARCHETYPES =====
  {
    id: "first_rare_archetype",
    name: "Rare Genesis",
    desc: "Lock in a rare archetype (Lithoid, Necroid, Toxoid, or Extremophile).",
    category: "lineage",
    icon: "💠",
    check: (c) => {
      const rares = ["lithoid", "necroid", "toxoid", "extremophile"];
      return (c.archivedArchetypes || []).some((id) => rares.includes(id));
    },
    bonus: { type: "production", value: 0.02 },
  },

  // ===== EVENT ACHIEVEMENTS =====
  {
    id: "first_event",
    name: "Tested by Chance",
    desc: "Resolve your first random event.",
    category: "layer",
    icon: "🎲",
    check: (c) => (c.totalEventsResolved || 0) >= 1,
    bonus: { type: "production", value: 0.005 },
  },
  {
    id: "ten_events",
    name: "Weathered",
    desc: "Resolve 10 random events across all runs.",
    category: "layer",
    icon: "🌦️",
    check: (c) => (c.totalEventsResolved || 0) >= 10,
    bonus: { type: "production", value: 0.01 },
  },
  {
    id: "fifty_events",
    name: "Storm-Tossed",
    desc: "Resolve 50 random events across all runs.",
    category: "layer",
    icon: "⛈️",
    check: (c) => (c.totalEventsResolved || 0) >= 50,
    bonus: { type: "production", value: 0.02 },
  },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a])
);

export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; label: string; icon: string }[] = [
  { id: "stage", label: "Stages", icon: "⚡" },
  { id: "lineage", label: "Lineage", icon: "🧬" },
  { id: "resource", label: "Milestones", icon: "🏘️" },
  { id: "speed", label: "Speed", icon: "⏱️" },
  { id: "narrative", label: "Narrative", icon: "📖" },
  { id: "layer", label: "Mastery", icon: "🏆" },
];

// Compute total production bonus from earned achievements
export function achievementBonus(
  earned: Record<string, boolean>,
  ctx: AchievementCheckCtx,
  type: "production" | "manual" | "capacity" | "evolve" = "production"
): number {
  let total = 0;
  for (const ach of ACHIEVEMENTS) {
    const isEarned = earned[ach.id] || ach.check(ctx);
    if (isEarned && ach.bonus.type === type) {
      total += ach.bonus.value;
    }
  }
  return total;
}
