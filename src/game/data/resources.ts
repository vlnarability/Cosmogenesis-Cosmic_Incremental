import type { ResourceDef, StageId } from "../state/types";

export const RESOURCES: ResourceDef[] = [
  // Cell stage
  { id: "atp", name: "ATP", category: "primary", firstStage: "cell", color: "#fbbf24", icon: "⚡" },
  { id: "glucose", name: "Glucose", category: "primary", firstStage: "cell", color: "#a3e635", icon: "🍬" },
  { id: "proteins", name: "Proteins", category: "primary", firstStage: "cell", color: "#f472b6", icon: "🧬" },
  { id: "lipids", name: "Lipids", category: "primary", firstStage: "cell", color: "#facc15", icon: "💧" },
  { id: "elements", name: "Elements", category: "primary", firstStage: "cell", color: "#94a3b8", icon: "⚛️" },
  // Creature stage
  { id: "food", name: "Food", category: "primary", firstStage: "creature", color: "#84cc16", icon: "🍖" },
  { id: "water", name: "Water", category: "primary", firstStage: "creature", color: "#38bdf8", icon: "💦" },
  { id: "materials", name: "Materials", category: "primary", firstStage: "creature", color: "#a16207", icon: "🪵" },
  { id: "organic_matter", name: "Organic Matter", category: "primary", firstStage: "creature", color: "#65a30d", icon: "🌿" },
  { id: "knowledge", name: "Knowledge", category: "primary", firstStage: "creature", color: "#c084fc", icon: "📚" },
  // Tribal stage
  { id: "wood", name: "Wood", category: "primary", firstStage: "tribal", color: "#92400e", icon: "🌲" },
  { id: "lumber", name: "Lumber", category: "primary", firstStage: "tribal", color: "#a16207", icon: "🪚" },
  { id: "stone", name: "Stone", category: "primary", firstStage: "tribal", color: "#78716c", icon: "🪨" },
  { id: "clay", name: "Clay", category: "primary", firstStage: "tribal", color: "#d97706", icon: "🏺" },
  { id: "science", name: "Science", category: "primary", firstStage: "tribal", color: "#60a5fa", icon: "🔬" },
  { id: "happiness", name: "Happiness", category: "primary", firstStage: "creature", color: "#fde047", icon: "😊" },
  { id: "military_power", name: "Military", category: "primary", firstStage: "tribal", color: "#ef4444", icon: "⚔️" },
  { id: "culture", name: "Culture", category: "primary", firstStage: "creature", color: "#f9a8d4", icon: "🎭" },
  // Civilization stage
  { id: "production", name: "Production", category: "primary", firstStage: "civilization", color: "#f59e0b", icon: "🏭" },
  { id: "gold", name: "Gold", category: "primary", firstStage: "civilization", color: "#eab308", icon: "🪙" },
  // Empire stage
  { id: "influence", name: "Influence", category: "primary", firstStage: "empire", color: "#8b5cf6", icon: "👑" },
  // Solar stage
  { id: "energy", name: "Energy", category: "primary", firstStage: "solar", color: "#22d3ee", icon: "🔋" },
  { id: "alloys", name: "Alloys", category: "primary", firstStage: "solar", color: "#cbd5e1", icon: "🔩" },
  // Galactic stage
  { id: "data", name: "Data", category: "primary", firstStage: "galactic", color: "#34d399", icon: "💾" },
  // Prestige currencies
  { id: "divinity", name: "Divinity", category: "divinity", firstStage: "galactic", color: "#a78bfa", icon: "✨" },
  { id: "evolution_points", name: "Evolution Points", category: "meta", firstStage: "cell", color: "#10b981", icon: "🌱" },
  { id: "enlightenment_points", name: "Enlightenment", category: "meta", firstStage: "cell", color: "#06b6d4", icon: "👁️" },
  { id: "transcendence_points", name: "Transcendence", category: "meta", firstStage: "cell", color: "#f43f5e", icon: "🔺" },
];

export const RESOURCE_MAP: Record<string, ResourceDef> = Object.fromEntries(
  RESOURCES.map((r) => [r.id, r])
);

// Resources visible at each stage (cumulative forward)
export const STAGE_RESOURCES: Record<StageId, string[]> = {
  cell: ["atp", "glucose", "proteins", "lipids", "elements"],
  creature: ["food", "water", "materials", "organic_matter", "knowledge", "culture", "happiness"],
  tribal: ["food", "water", "wood", "lumber", "stone", "clay", "science", "happiness", "military_power", "culture"],
  civilization: ["food", "water", "production", "gold", "science", "culture", "happiness", "military_power"],
  empire: ["food", "production", "gold", "science", "culture", "influence", "happiness", "military_power"],
  solar: ["food", "water", "production", "energy", "alloys", "science", "culture", "influence", "happiness"],
  galactic: ["food", "production", "energy", "alloys", "science", "data", "culture", "influence", "happiness", "military_power"],
};

export function emptyResources(): Record<string, number> {
  const obj: Record<string, number> = {};
  RESOURCES.forEach((r) => (obj[r.id] = 0));
  return obj;
}

export function emptyCapacities(): Record<string, number> {
  const obj: Record<string, number> = {};
  // Primary resources: 3x base capacity (150) for early stages to prevent frequent cap-overflow deadlocks.
  RESOURCES.forEach((r) => {
    if (r.category === "primary") {
      obj[r.id] = 150;
    } else {
      // Divinity + meta currencies stay at their original small caps
      obj[r.id] = 50;
    }
  });
  obj.atp = 90; // 3x the previous 30 — ATP is a small-pool primary
  obj.happiness = 100; // happiness stays at 100 (it's a 0-100 mood meter, not a stockpile)
  return obj;
}
