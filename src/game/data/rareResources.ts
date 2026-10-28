// Rare Resources — PART-2-LAYER-A/B/C drops.
//
// Rare resources are obtained from:
//   - Trade partners (rareDrop field on TradePartner — chance per tick)
//   - Hunting (huntNow action — 15% chance per hunt)
//   - Rival counter-raids (loot drops)
//
// Each rare resource, once obtained, UNLOCKS a special system or tech that
// would otherwise be unavailable. This gives the player a reason to engage
// with the Trade + Hunt + Rival systems — the rare drops are gating items
// for unique content.
//
// RARE-RESOURCE-DESIGN: each rare resource maps to an unlock. Once the player
// has >= 1 of the resource, the corresponding system/tech becomes visible
// and buildable/researchable. The resource is NOT consumed (it's a
// "discovery flag" that persists — you've found it, it's yours).

export interface RareResourceDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** What this rare resource unlocks (systemId or techId). */
  unlocks: {
    type: "system" | "tech";
    id: string;
    name: string;
    desc: string;
  };
  /** Sources where this can be obtained. */
  sources: string[];
}

export const RARE_RESOURCES: RareResourceDef[] = [
  {
    id: "rare_furs",
    name: "Rare Furs",
    icon: "🦊",
    desc: "Luxurious pelts from exotic beasts. Trade them to unlock...",
    unlocks: {
      type: "system",
      id: "fur_trading_post",
      name: "Fur Trading Post",
      desc: "A specialized post that converts rare furs into steady gold income.",
    },
    sources: ["hunt", "trade:bone_clan"],
  },
  {
    id: "bone_tools",
    name: "Bone Tools",
    icon: "🦴",
    desc: "Crafted implements of bone — the first technology beyond stone.",
    unlocks: {
      type: "tech",
      id: "bone_crafting",
      name: "Bone Crafting",
      desc: "+15% materials production. The first tools beyond stone.",
    },
    sources: ["hunt"],
  },
  {
    id: "venom_sac",
    name: "Venom Sac",
    icon: "☠️",
    desc: "A potent toxin harvested from a predator. Could be weaponized...",
    unlocks: {
      type: "tech",
      id: "venom_warfare",
      name: "Venom Warfare",
      desc: "+25% military_power. Toxin-coated weapons strike fear.",
    },
    sources: ["hunt", "trade"],
  },
  {
    id: "ancient_relic",
    name: "Ancient Relic",
    icon: "🏺",
    desc: "An artifact from a forgotten age. Its inscription hints at lost knowledge.",
    unlocks: {
      type: "system",
      id: "ancient_archive",
      name: "Ancient Archive",
      desc: "A repository of lost knowledge. +20% science permanently.",
    },
    sources: ["hunt", "trade:scientists", "rival_loot"],
  },
  {
    id: "river_pearls",
    name: "River Pearls",
    icon: "🫧",
    desc: "Lustrous pearls from the river-bed. Worth a fortune to the right buyer.",
    unlocks: {
      type: "system",
      id: "pearl_market",
      name: "Pearl Market",
      desc: "A market that converts pearls into steady gold + culture income.",
    },
    sources: ["trade:river_runners"],
  },
  {
    id: "marble_blocs",
    name: "Marle Blocs",
    icon: "🧱",
    desc: "Premium construction stone from the Marble Republic's quarries.",
    unlocks: {
      type: "system",
      id: "marble_quarry",
      name: "Marble Quarry",
      desc: "+15% production + +10% culture. The finest stone money can buy.",
    },
    sources: ["trade:marble_republic"],
  },
  {
    id: "iron_ore",
    name: "Iron Ore",
    icon: "⛏️",
    desc: "High-grade iron from the Iron Horde's mountain claims.",
    unlocks: {
      type: "tech",
      id: "iron_metallurgy",
      name: "Iron Metallurgy",
      desc: "+20% military_power + +10% production. Iron changes everything.",
    },
    sources: ["trade:iron_horde"],
  },
  {
    id: "silk_bolt",
    name: "Silk Bolt",
    icon: "🧵",
    desc: "A bolt of silk so fine it seems woven from light itself.",
    unlocks: {
      type: "system",
      id: "silk_workshop",
      name: "Silk Workshop",
      desc: "+20% culture + +10% happiness. Silk softens every edge.",
    },
    sources: ["trade:silk_concord"],
  },
  {
    id: "stellar_isotope",
    name: "Stellar Isotope",
    icon: "⚛️",
    desc: "A rare nuclear isotope from the Stellar Hegemony's research reactors.",
    unlocks: {
      type: "tech",
      id: "antimatter_collection",
      name: "Antimatter Collection",
      desc: "Unlocks antimatter reactors. +50% energy.",
    },
    sources: ["trade:stellar_hegemony", "rival_loot"],
  },
  {
    id: "crystal_shard",
    name: "Crystal Shard",
    icon: "💎",
    desc: "A fragment of the Crystal Compact's resonant crystalline matrix.",
    unlocks: {
      type: "system",
      id: "crystal_resonator",
      name: "Crystal Resonator",
      desc: "+25% data + +15% science. The crystal amplifies thought.",
    },
    sources: ["trade:crystal_compact"],
  },
  {
    id: "rare_element",
    name: "Rare Element",
    icon: "🔷",
    desc: "An unstable transuranic from the Outer Belt's asteroid mines.",
    unlocks: {
      type: "tech",
      id: "rare_element_refinery",
      name: "Rare Element Refinery",
      desc: "+30% alloys. Refine the unstable into the unbreakable.",
    },
    sources: ["trade:outer_belt", "rival_loot"],
  },
];

export const RARE_RESOURCE_MAP: Record<string, RareResourceDef> = Object.fromEntries(
  RARE_RESOURCES.map((r) => [r.id, r])
);

/** Check if a rare resource has been discovered (count >= 1 in rareResources state). */
export function isRareResourceDiscovered(
  rareResources: Record<string, number>,
  id: string
): boolean {
  return (rareResources[id] || 0) >= 1;
}

/** Get all unlocks (system IDs + tech IDs) that the player has discovered via rare resources. */
export function getDiscoveredUnlocks(
  rareResources: Record<string, number>
): { systems: string[]; techs: string[] } {
  const systems: string[] = [];
  const techs: string[] = [];
  for (const r of RARE_RESOURCES) {
    if (isRareResourceDiscovered(rareResources, r.id)) {
      if (r.unlocks.type === "system") systems.push(r.unlocks.id);
      else techs.push(r.unlocks.id);
    }
  }
  return { systems, techs };
}
