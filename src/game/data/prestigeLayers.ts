import type { StageId } from "../state/types";

// Prestige layers — the ten "ages" of cosmic becoming.
// Each layer is a long-form prestige: an entire saga the player can ascend through.
// Layer 1 (Evolution) is the base game; later layers unlock progressively.

export type PrestigeLayerId =
  | "evolution"
  | "ascension"
  | "transcendence"
  | "enlightenment"
  | "cosmic"
  | "eternal"
  | "genesis"
  | "singularity"
  | "omega"
  | "eternity";

export type UnlockCondition =
  | { type: "default" }
  | { type: "galacticWins"; value: number }
  | { type: "challengesCompleted"; value: number }
  | { type: "totalRuns"; value: number };

export interface PrestigeLayer {
  id: PrestigeLayerId;
  name: string;
  order: number;
  icon: string;
  tagline: string;
  story: string;
  unlockCondition: UnlockCondition;
  currencyName: string; // prestige currency granted by this layer
}

export const PRESTIGE_LAYERS: PrestigeLayer[] = [
  {
    id: "evolution",
    name: "Evolution",
    order: 1,
    icon: "🌱",
    tagline: "The first spark learns to climb",
    story:
      "From a single cell to a galactic god — the slow climb of life that learned to remember. " +
      "Here the saga begins: clear stages, earn Evolution Points, and prove your lineage deserves to ascend.",
    unlockCondition: { type: "default" },
    currencyName: "Evolution Points",
  },
  {
    id: "ascension",
    name: "Ascension",
    order: 2,
    icon: "✨",
    tagline: "The god opens its eyes",
    story:
      "The Galactic crown is only the threshold. Beyond lies Ascension — where matter bends to will " +
      "and the civilization you built chooses what kind of divinity to become.",
    unlockCondition: { type: "galacticWins", value: 1 },
    currencyName: "Divinity",
  },
  {
    id: "transcendence",
    name: "Transcendence",
    order: 3,
    icon: "🔺",
    tagline: "Form becomes optional",
    story:
      "Bodies, then ships, then stars — and now form itself. Transcendence is the layer where " +
      "the ascended god sheds the last of its clay and learns to walk between thoughts.",
    unlockCondition: { type: "galacticWins", value: 3 },
    currencyName: "Transcendence",
  },
  {
    id: "enlightenment",
    name: "Enlightenment",
    order: 4,
    icon: "👁️",
    tagline: "The first truth is remembered",
    story:
      "Trials are the door, and the door opens only to those who refused the easy road. " +
      "After three challenges mastered, the Enlightened gaze turns inward — and the second saga begins.",
    unlockCondition: { type: "challengesCompleted", value: 3 },
    currencyName: "Enlightenment",
  },
  {
    id: "cosmic",
    name: "Cosmic",
    order: 5,
    icon: "🌌",
    tagline: "Galaxies are toys",
    story:
      "When one galaxy is no longer enough to hold you, the Cosmic layer begins — " +
      "you weave clusters of galaxies the way a child once wove grass, and time becomes a craft.",
    unlockCondition: { type: "galacticWins", value: 5 },
    currencyName: "Cosmic Cores",
  },
  {
    id: "eternal",
    name: "Eternal",
    order: 6,
    icon: "♾️",
    tagline: "Time forgets to end",
    story:
      "Eternity is not a length but a way of being. The Eternal layer dissolves the line " +
      "between past, present, and future — and the player learns to walk all three at once.",
    unlockCondition: { type: "galacticWins", value: 10 },
    currencyName: "Eternal Shards",
  },
  {
    id: "genesis",
    name: "Genesis",
    order: 7,
    icon: "🥚",
    tagline: "A new universe, seeded",
    story:
      "To shape a single life was the first wonder. To shape a single universe is the seventh. " +
      "Genesis is the layer where the player plants a fresh cosmos and watches it bloom.",
    unlockCondition: { type: "totalRuns", value: 20 },
    currencyName: "Genesis Seeds",
  },
  {
    id: "singularity",
    name: "Singularity",
    order: 8,
    icon: "🌀",
    tagline: "All paths converge",
    story:
      "Every choice the player ever made — every cell, every war, every ascension — was always " +
      "arriving here. At Singularity, they remember this, and time collapses to a single luminous point.",
    unlockCondition: { type: "galacticWins", value: 50 },
    currencyName: "Singularity Cores",
  },
  {
    id: "omega",
    name: "Bio-Engineering",
    order: 9,
    icon: "🧬",
    tagline: "Create life to fight the Old Gods",
    story:
      "Beyond your dimension, the Old Gods stir. You cannot defeat them with the life you have guided — " +
      "you must CREATE life. Design creatures with specific traits, combine them into Legions, and prepare " +
      "for the confrontation to come. Genetic instability is the price of creation.",
    unlockCondition: { type: "galacticWins", value: 100 },
    currencyName: "Creatures",
  },
  {
    id: "eternity",
    name: "Ascension",
    order: 10,
    icon: "🌠",
    tagline: "Forge a new universe of your own rules",
    story:
      "After the Old Gods fall, the player god becomes one. Choose which minor gods to keep as allies " +
      "and which to absorb. Then, with the survivors at your side, define the rules of a new universe — " +
      "physics, biology, magic, time, space, consciousness, death, rebirth — and decide whether to " +
      "preserve this cosmos or reset and begin again with a Cosmic Boon.",
    unlockCondition: { type: "galacticWins", value: 250 },
    currencyName: "Cosmic Boons",
  },
];

export const PRESTIGE_LAYER_MAP: Record<string, PrestigeLayer> = Object.fromEntries(
  PRESTIGE_LAYERS.map((l) => [l.id, l])
);

// Check whether a layer is unlocked given current meta state.
export function isLayerUnlocked(
  layer: PrestigeLayer,
  ctx: {
    galacticWins: number;
    totalRuns: number;
    unlockedLayers: Record<string, boolean>;
    challengesCompletedCount: number;
  }
): boolean {
  if (ctx.unlockedLayers[layer.id]) return true;
  switch (layer.unlockCondition.type) {
    case "default":
      return true;
    case "galacticWins":
      return ctx.galacticWins >= layer.unlockCondition.value;
    case "challengesCompleted":
      return ctx.challengesCompletedCount >= layer.unlockCondition.value;
    case "totalRuns":
      return ctx.totalRuns >= layer.unlockCondition.value;
    default:
      return false;
  }
}

// Compute the number of challenges completed across all challenge types.
export function countChallengesCompleted(
  completed: Record<string, number>
): number {
  return Object.values(completed || {}).reduce((a, b) => a + (b > 0 ? 1 : 0), 0);
}

// Total mastery level — sum of all completed challenge repeat counts.
export function totalChallengeMastery(
  completed: Record<string, number>
): number {
  return Object.values(completed || {}).reduce((a, b) => a + (b || 0), 0);
}

// Stage used for StageId import (avoids unused warning in tooling).
export type { StageId };
