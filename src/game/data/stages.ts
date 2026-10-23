import type { StageDef, StageId } from "../state/types";

export const STAGES: StageDef[] = [
  {
    id: "cell",
    name: "Cell",
    tagline: "A single spark in the dark",
    desc: "Awaken as a single cell. Harvest ATP, build organelles, discover the building blocks of life.",
    icon: "⚡",
    accent: "#22d3ee",
    bgGradient: "radial-gradient(ellipse at top, #0c4a6e 0%, #082f49 40%, #020617 100%)",
    duration: "5-60 min",
    evolveRequires: { minPopulation: 8, minSystems: 4, minTech: 2, requiresSystems: ["nucleus"] },
    storyIntro:
      "In the warm dark of a young sea, something stirs. A membrane holds. A spark of ATP ignites. " +
      "You are not yet awake — but you are becoming. The first law of this universe is survival.",
    storyOutro:
      "The cell divides. The membrane holds through a thousand tremors. " +
      "What was single is now many. The first body stirs in the deep.",
  },
  {
    id: "creature",
    name: "Creature",
    tagline: "The first body learns to move",
    desc: "A multicellular organism emerges. Hunt, gather, and develop your body plan.",
    icon: "🧬",
    accent: "#84cc16",
    bgGradient: "radial-gradient(ellipse at top, #365314 0%, #1a2e05 40%, #0a0f02 100%)",
    duration: "30-90 min",
    evolveRequires: { minPopulation: 30, minSystems: 8, minTech: 3 },
    storyIntro:
      "The first body uncurls. Eyes that were spots now see. Hunger that was instinct now becomes want. " +
      "The world is wide and full of teeth. You must move, eat, fear, and remember.",
    storyOutro:
      "Around the firelight, the pack settles. The first language is gesture. The first law is kin. " +
      "The tribe is born not from one body, but from many that chose to stay.",
  },
  {
    id: "tribal",
    name: "Tribal",
    tagline: "Fire is remembered",
    desc: "Gather your kin. Build, settle, and discover the first technologies of civilization.",
    icon: "🔥",
    accent: "#f97316",
    bgGradient: "radial-gradient(ellipse at top, #7c2d12 0%, #431407 40%, #1c0701 100%)",
    duration: "60-120 min",
    evolveRequires: { minPopulation: 80, minSystems: 10, minTech: 4 },
    storyIntro:
      "The fire holds through the night. The circle of faces becomes a circle of names. " +
      "Story is born — and with story, the first memory that outlives a single life.",
    storyOutro:
      "Walls rise where tents stood. Granaries hold what hands once carried. " +
      "The village becomes a city. The dream of rule begins.",
  },
  {
    id: "civilization",
    name: "Civilization",
    tagline: "Cities learn to dream",
    desc: "Build cities, develop production, research science, and shape culture.",
    icon: "🏛️",
    accent: "#eab308",
    bgGradient: "radial-gradient(ellipse at top, #713f12 0%, #422006 40%, #1a1003 100%)",
    duration: "120-180 min",
    evolveRequires: { minPopulation: 200, minSystems: 12, minTech: 5 },
    storyIntro:
      "Stone rises in courses. Laws are carved beside grain counts. " +
      "The city learns to dream of more than tomorrow — it dreams of empire.",
    storyOutro:
      "The banner of one city becomes the banner of a continent. Roads bind the provinces. " +
      "An empire wakes — and so do its rivals.",
  },
  {
    id: "empire",
    name: "Empire",
    tagline: "Distance begins to obey",
    desc: "Manage multiple regions. Logistics, rivals, and the age of grand administration.",
    icon: "⚔️",
    accent: "#a855f7",
    bgGradient: "radial-gradient(ellipse at top, #581c87 0%, #3b0764 40%, #1a0335 100%)",
    duration: "120-180 min",
    evolveRequires: { minPopulation: 600, minSystems: 14, minTech: 7 },
    storyIntro:
      "Distance begins to obey. The roads of an empire run long, and along them ride not just grain and gold — " +
      "but the slow weight of rivals who dream the same dreams.",
    storyOutro:
      "The empire reaches the edges of its sky. The sun, once a god, is now a neighbor. " +
      "The next shore is not across the sea, but across the void.",
  },
  {
    id: "solar",
    name: "Solar",
    tagline: "The sky stops being a wall",
    desc: "Colonize worlds. Harness energy and alloys. Choose your path to the stars.",
    icon: "☀️",
    accent: "#fb923c",
    bgGradient: "radial-gradient(ellipse at top, #9a3412 0%, #7c2d12 30%, #1c0701 100%)",
    duration: "3-5 hours",
    evolveRequires: { minPopulation: 1000, minSystems: 12, minTech: 8 },
    storyIntro:
      "The sky stops being a wall. A ship breaks the sky and does not fall. " +
      "The first new world waits in the dark — and beyond it, a hundred more.",
    storyOutro:
      "A hundred worlds breathe. A thousand ships cross the dark between them. " +
      "The next shore is not a planet — but a star.",
  },
  {
    id: "galactic",
    name: "Galactic",
    tagline: "The galaxy takes a shape",
    desc: "An interstellar civilization. Build megastructures and choose your ascension path.",
    icon: "🌌",
    accent: "#6366f1",
    bgGradient: "radial-gradient(ellipse at top, #312e81 0%, #1e1b4b 30%, #030712 100%)",
    duration: "6-24 hours",
    evolveRequires: { minPopulation: 2000, minSystems: 12, minTech: 10 },
    storyIntro:
      "The galaxy takes a shape. A thousand suns answer one banner. " +
      "The question is no longer whether to live — but what kind of life deserves to live forever.",
    storyOutro:
      "Creation reaches the stars. The god opens its eyes — and sees, for the first time, " +
      "that it has been watching itself all along.",
  },
];

export const STAGE_MAP: Record<StageId, StageDef> = Object.fromEntries(
  STAGES.map((s) => [s.id, s])
) as Record<StageId, StageDef>;

export const STAGE_IDS: StageId[] = STAGES.map((s) => s.id);

export function getStage(id: StageId): StageDef {
  return STAGE_MAP[id];
}

export function nextStage(id: StageId): StageId | null {
  const idx = STAGE_IDS.indexOf(id);
  if (idx < 0 || idx >= STAGE_IDS.length - 1) return null;
  return STAGE_IDS[idx + 1];
}
