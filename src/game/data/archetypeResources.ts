// Archetype-specific cosmetic resource naming
//
// When a lineage is locked at the Creature → Tribal evolution, resources get
// cosmetic name variants based on the locked archetype. The resource IDs and
// mechanical function are unchanged — only the display name changes for
// flavor. A Necroid run still collects "glucose" internally; the UI just calls
// it "necrotic essence".
//
// Scope: only the Cell and Creature stage resources are renamed. Later-stage
// resources (wood, lumber, stone, clay, science, happiness, military_power,
// production, gold, influence, energy, alloys, data) keep their default
// names. Prestige currencies (divinity, *_points) are never renamed.
//
// Design rationale: the Cell and Creature stages are when the player is
// actually becoming the archetype — early enough that the naming defines the
// fantasy, late enough that the archetype is locked. By Tribal, the
// civilization has organized around the lineage's biology and resource
// names standardize to civic terms (Wood, Stone, Science, etc.).
//
// Naming conventions per archetype (matching their blurb + bonus flavor):
//   lithoid      — mineral/crystal/geode
//   necroid      — death/bone/ash
//   toxoid       — poison/venom/blister
//   plantoid     — botanical/sap/root
//   fungoid      — fungal/mycelium/spore
//   aquatic      — water/ocean/tide
//   reptilian    — reptile/predator/saurian
//   mammalian    — warm-blooded/kin/nurture
//   avian        — flight/sky/thermal
//   arthropoid   — insect/hive/chitin
//   molluscoid   — tentacle/deep-sea/ink
//   humanoid     — standard/human (minimal drift from defaults)
//   extremophile — extreme/adaptive/survivalist

import type { ResourceId } from "../state/types";
import { RESOURCE_MAP } from "./resources";

/** The set of resource IDs that get archetype-specific display names. */
export const RENAMEABLE_RESOURCES: ResourceId[] = [
  // Cell stage
  "atp",
  "glucose",
  "proteins",
  "lipids",
  "elements",
  // Creature stage
  "food",
  "water",
  "materials",
  "organic_matter",
  "knowledge",
  "culture",
];

/** A complete cosmetic naming overlay for one archetype. */
export type ArchetypeResourceNames = Partial<Record<ResourceId, string>>;

/**
 * Map of archetypeId → { resourceId → displayName }.
 * Only the Cell and Creature stage resources are renamed; any resource not
 * present in the inner map falls back to its default name.
 */
export const ARCHETYPE_RESOURCE_NAMES: Record<string, ArchetypeResourceNames> = {
  // --- Lithoid (rare) — stone-born, crystalline, slow ---
  lithoid: {
    atp: "Geodic Charge",
    glucose: "Mineral Sugar",
    proteins: "Crystal Lattice",
    lipids: "Mineral Oil",
    elements: "Ore Matrix",
    food: "Raw Ore",
    water: "Mineral Brine",
    materials: "Cut Stone",
    organic_matter: "Matrix Residue",
    knowledge: "Engravings",
    culture: "Crystal Traditions",
  },

  // --- Necroid (rare) — death-touched, ritual-bound ---
  necroid: {
    atp: "Deathless Spark",
    glucose: "Necrotic Essence",
    proteins: "Bone Marrow",
    lipids: "Grave Wax",
    elements: "Ash Dust",
    food: "Carrion",
    water: "Bloodwater",
    materials: "Bone Fragments",
    organic_matter: "Rot Mulch",
    knowledge: "Memorials",
    culture: "Rites",
  },

  // --- Toxoid (rare) — venomous, adaptive, hazardous ---
  toxoid: {
    atp: "Venom Charge",
    glucose: "Toxic Nectar",
    proteins: "Venom Proteins",
    lipids: "Blister Oil",
    elements: "Toxic Reagents",
    food: "Tainted Meat",
    water: "Alkali Pools",
    materials: "Venom Sacs",
    organic_matter: "Fester Mass",
    knowledge: "Venom Lore",
    culture: "Contagion",
  },

  // --- Plantoid — rooted, photosynthetic, enduring ---
  plantoid: {
    atp: "Sap Flow",
    glucose: "Plant Sugars",
    proteins: "Phyto Proteins",
    lipids: "Plant Oils",
    elements: "Soil Minerals",
    food: "Fruiting Bodies",
    water: "Groundwater",
    materials: "Vine Fibers",
    organic_matter: "Leaf Mulch",
    knowledge: "Root Memory",
    culture: "Blooms",
  },

  // --- Fungoid — networked, decomposing, immortal ---
  fungoid: {
    atp: "Spore Energy",
    glucose: "Myco Sugars",
    proteins: "Fungal Proteins",
    lipids: "Mycelial Oils",
    elements: "Spore Trace",
    food: "Fruiting Bodies",
    water: "Mycelia Dew",
    materials: "Chitin Threads",
    organic_matter: "Mycelium Mass",
    knowledge: "Fungal Network",
    culture: "Spore Songs",
  },

  // --- Aquatic — fluid, pressure-deep, memory-holding ---
  aquatic: {
    atp: "Tidal Energy",
    glucose: "Marine Sugars",
    proteins: "Kelp Proteins",
    lipids: "Fish Oils",
    elements: "Sea Salts",
    food: "Sea Catch",
    water: "Open Water",
    materials: "Drift Materials",
    organic_matter: "Marine Biomass",
    knowledge: "Current Lore",
    culture: "Reef Songs",
  },

  // --- Reptilian — cold, patient, predatory ---
  reptilian: {
    atp: "Solar Charge",
    glucose: "Predator Sugars",
    proteins: "Saurian Flesh",
    lipids: "Reptile Oils",
    elements: "Trace Minerals",
    food: "Fresh Kill",
    water: "Scavenged Water",
    materials: "Hide Scraps",
    organic_matter: "Kill Remains",
    knowledge: "Trail Memory",
    culture: "Dominance Rites",
  },

  // --- Mammalian — warm-blooded, nurturing, social-bonded ---
  mammalian: {
    atp: "Warmth",
    glucose: "Milk Sugars",
    proteins: "Rich Proteins",
    lipids: "Milk Fats",
    elements: "Forage",
    food: "Foraged Food",
    water: "Fresh Water",
    materials: "Hide and Fur",
    organic_matter: "Compost",
    knowledge: "Tribal Memory",
    culture: "Kin Traditions",
  },

  // --- Avian — light-boned, far-sighted, quick ---
  avian: {
    atp: "Thermal Charge",
    glucose: "Sky Sugars",
    proteins: "Feather Keratin",
    lipids: "Flight Oils",
    elements: "Sky Minerals",
    food: "Foraged Grain",
    water: "Rainwater",
    materials: "Feathers and Twigs",
    organic_matter: "Guano",
    knowledge: "Migrations",
    culture: "Sky Songs",
  },

  // --- Arthropoid — many-limbed, industrious, hive-minded ---
  arthropoid: {
    atp: "Hive Charge",
    glucose: "Hive Sugar",
    proteins: "Chitin Proteins",
    lipids: "Wax Reserves",
    elements: "Shell Minerals",
    food: "Hive Stores",
    water: "Dew Pools",
    materials: "Wax and Chitin",
    organic_matter: "Hive Mass",
    knowledge: "Pheromone Trails",
    culture: "Swarm Rituals",
  },

  // --- Molluscoid — soft, ancient, patient ---
  molluscoid: {
    atp: "Neural Charge",
    glucose: "Abyss Sugars",
    proteins: "Tentacle Protein",
    lipids: "Ink Oils",
    elements: "Deep Minerals",
    food: "Deep Catch",
    water: "Saltwater",
    materials: "Shell Fragments",
    organic_matter: "Ink and Mucus",
    knowledge: "Engrams",
    culture: "Inked Scrolls",
  },

  // --- Humanoid — adaptable, social, tool-building ---
  // Minimal drift from defaults — slightly more grounded human terms.
  humanoid: {
    atp: "Vital Energy",
    glucose: "Sugar",
    proteins: "Protein",
    lipids: "Fats",
    elements: "Raw Elements",
    food: "Rations",
    water: "Fresh Water",
    materials: "Goods",
    organic_matter: "Compost",
    knowledge: "Records",
    culture: "Customs",
  },

  // --- Extremophile (rare) — lives where nothing should ---
  extremophile: {
    atp: "Stress Energy",
    glucose: "Rare Sugars",
    proteins: "Denatured Proteins",
    lipids: "Extreme Lipids",
    elements: "Trace Isotopes",
    food: "Harvested Scraps",
    water: "Brine Pools",
    materials: "Salvage",
    organic_matter: "Tolerant Biomass",
    knowledge: "Adaptive Memory",
    culture: "Survival Rites",
  },
};

/**
 * Get the display name for a resource, optionally flavored by the player's
 * locked archetype. If `archetypeId` is null (no archetype locked yet) or the
 * archetype has no override for the given resource, the resource's default
 * name is returned.
 *
 * Note: the resource ID is unchanged — this is a COSMETIC overlay only.
 * Game logic, save state, costs, and production all use the canonical id.
 */
export function getResourceName(
  resourceId: ResourceId,
  archetypeId: string | null
): string {
  const defaultName = RESOURCE_MAP[resourceId]?.name ?? resourceId;
  if (!archetypeId) return defaultName;
  return ARCHETYPE_RESOURCE_NAMES[archetypeId]?.[resourceId] ?? defaultName;
}

/**
 * Convenience: check whether a resource has an archetype-specific override
 * for the given archetype. Useful for tooltips that want to show both names.
 */
export function hasArchetypeOverride(
  resourceId: ResourceId,
  archetypeId: string | null
): boolean {
  if (!archetypeId) return false;
  return !!ARCHETYPE_RESOURCE_NAMES[archetypeId]?.[resourceId];
}
