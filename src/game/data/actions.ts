import type { StageAction } from "../state/types";

// Manual actions — clicked by player to bootstrap production
export const ACTIONS: StageAction[] = [
  // ===== CELL =====
  {
    id: "absorb_glucose",
    name: "Absorb Glucose",
    desc: "Pull glucose from the surrounding soup. The simplest act of survival.",
    stage: "cell",
    icon: "🍬",
    produces: { glucose: 2 },
    cooldown: 0.1,
  },
  {
    id: "scavenge_proteins",
    name: "Scavenge Proteins",
    desc: "Break down stray molecules into usable protein chains.",
    stage: "cell",
    icon: "🧬",
    cost: { glucose: 2 },
    produces: { proteins: 2 },
    cooldown: 0.2,
  },
  {
    id: "collect_lipids",
    name: "Collect Lipids",
    desc: "Harvest oily compounds to reinforce the membrane.",
    stage: "cell",
    icon: "💧",
    cost: { glucose: 3 },
    produces: { lipids: 4 },
    cooldown: 0.3,
  },
  {
    id: "extract_elements",
    name: "Extract Elements",
    desc: "Mine trace minerals — the rare inorganic backbone of life.",
    stage: "cell",
    icon: "⚛️",
    cost: { atp: 1, glucose: 2 },
    produces: { elements: 2 },
    cooldown: 0.4,
  },

  // ===== CREATURE =====
  {
    id: "forage",
    name: "Forage",
    desc: "Search the undergrowth for edible plants and small prey.",
    stage: "creature",
    icon: "🌿",
    produces: { food: 2 },
    cooldown: 0.3,
  },
  {
    id: "drink",
    name: "Drink",
    desc: "Find clean water. The body is mostly water, and it forgets.",
    stage: "creature",
    icon: "💦",
    produces: { water: 2 },
    cooldown: 0.3,
  },
  {
    id: "gather_materials",
    name: "Gather Materials",
    desc: "Collect sticks, hides, and bone — the first tools.",
    stage: "creature",
    icon: "🪵",
    cost: { food: 1 },
    produces: { materials: 1, organic_matter: 1 },
    cooldown: 0.4,
  },
  {
    id: "observe",
    name: "Observe",
    desc: "Sit. Watch. The world teaches those who pay attention.",
    stage: "creature",
    icon: "👁️",
    cost: { food: 1 },
    produces: { knowledge: 1, culture: 0.3 },
    cooldown: 0.5,
  },

  // ===== TRIBAL =====
  {
    id: "hunt",
    name: "Hunt",
    desc: "Send the pack for meat. Danger teaches — and feeds.",
    stage: "tribal",
    icon: "🏹",
    cost: { military_power: 0.5 },
    produces: { food: 5, materials: 1 },
    cooldown: 0.4,
  },
  {
    id: "fell_trees",
    name: "Fell Trees",
    desc: "Bring down timber for the long work of building.",
    stage: "tribal",
    icon: "🪓",
    produces: { wood: 3 },
    cooldown: 0.3,
  },
  {
    id: "quarry_stone",
    name: "Quarry Stone",
    desc: "Cut stone from the living rock for walls that last.",
    stage: "tribal",
    icon: "⛏️",
    cost: { wood: 1 },
    produces: { stone: 2, clay: 1 },
    cooldown: 0.4,
  },
  {
    id: "storytelling",
    name: "Tell Stories",
    desc: "Around the fire, the first wisdom is passed on.",
    stage: "tribal",
    icon: "🔥",
    cost: { food: 1 },
    produces: { culture: 2, science: 1, happiness: 1 },
    cooldown: 0.6,
  },

  // ===== CIVILIZATION =====
  // BOOTSTRAP-FIX: commission_building is free (was 1 gold) so the player can
  // always kickstart the civ economy. Mirrors absorb_glucose (Cell) and
  // fell_trees (Tribal) — every stage has a free primary gather action.
  {
    id: "commission_building",
    name: "Commission Build",
    desc: "Direct a workforce to raise a new structure.",
    stage: "civilization",
    icon: "🏗️",
    cost: {},
    produces: { production: 4 },
    cooldown: 0.5,
  },
  {
    id: "mint_currency",
    name: "Mint Currency",
    desc: "Stamp the first coins. Trade becomes possible.",
    stage: "civilization",
    icon: "🪙",
    cost: { production: 3 },
    produces: { gold: 2 },
    cooldown: 0.5,
  },
  {
    id: "fund_research",
    name: "Fund Research",
    desc: "Endow scholars to advance the frontiers of knowledge.",
    stage: "civilization",
    icon: "🔬",
    cost: { gold: 2 },
    produces: { science: 4, culture: 1 },
    cooldown: 0.6,
  },

  // ===== EMPIRE =====
  {
    id: "decree",
    name: "Issue Decree",
    desc: "A word from the throne reshapes provinces.",
    stage: "empire",
    icon: "📜",
    cost: { gold: 3 },
    produces: { influence: 3, production: 2 },
    cooldown: 0.7,
  },
  {
    id: "raise_legion",
    name: "Raise Legion",
    desc: "Levy and train a legion for the empire's defense and ambition.",
    stage: "empire",
    icon: "⚔️",
    cost: { gold: 4, production: 4 },
    produces: { military_power: 6, influence: 1 },
    cooldown: 0.8,
  },

  // ===== SOLAR =====
  {
    id: "solar_collect",
    name: "Harvest Sunlight",
    desc: "Catch the light of a star with vast arrays.",
    stage: "solar",
    icon: "☀️",
    produces: { energy: 5 },
    cooldown: 0.4,
  },
  {
    id: "refine_alloys",
    name: "Refine Alloys",
    desc: "Smelt metals in orbital forges for starship-grade alloy.",
    stage: "solar",
    icon: "🔩",
    cost: { energy: 3 },
    produces: { alloys: 3 },
    cooldown: 0.5,
  },
  {
    id: "survey_system",
    name: "Survey System",
    desc: "Map the worlds and phenomena of this system. Knowledge flows back.",
    stage: "solar",
    icon: "🔭",
    cost: {},
    produces: { science: 3, data: 1 },
    cooldown: 0.5,
  },

  // ===== GALACTIC =====
  {
    id: "data_mine",
    name: "Mine Data",
    desc: "Sift the cosmic background for patterns worth remembering.",
    stage: "galactic",
    icon: "💾",
    cost: { energy: 2 },
    produces: { data: 4 },
    cooldown: 0.4,
  },
  {
    id: "starlift",
    name: "Starlift",
    desc: "Siphon raw energy from captured stars. The backbone of galactic industry.",
    stage: "galactic",
    icon: "⭐",
    cost: {},
    produces: { energy: 8 },
    cooldown: 0.4,
  },
  {
    id: "smelt_alloys",
    name: "Smelt Alloys",
    desc: "Forge starship-grade alloys from planetary cores.",
    stage: "galactic",
    icon: "🏭",
    cost: { energy: 4 },
    produces: { alloys: 6 },
    cooldown: 0.5,
  },
  {
    id: "channel_divinity",
    name: "Channel Divinity",
    desc: "Reach inward and outward. The god begins to wake.",
    stage: "galactic",
    icon: "✨",
    cost: { data: 5, influence: 3 },
    produces: { divinity: 0.5 },
    cooldown: 1.0,
  },
];

export const ACTION_MAP: Record<string, StageAction> = Object.fromEntries(
  ACTIONS.map((a) => [a.id, a])
);

export function actionsForStage(stage: string): StageAction[] {
  return ACTIONS.filter((a) => a.stage === stage);
}
