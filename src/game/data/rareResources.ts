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

import { TRADE_PARTNER_MAP } from "./tradePartners";

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
  /** F1 RELIQUARY — consume 1 of this rare for a permanent production
   *  bonus. The bonus is a per-resource multiplier (folded into the tick
   *  alongside rival assimilation bonuses). maxConsume caps the compounding
   *  so a single rare can't dominate. Optional — rares without this field
   *  are discovery-only (no consume path). */
  reliquary?: {
    /** Human-readable bonus label, shown on the consume button. */
    label: string;
    /** Resource whose production is boosted (matches RESOURCE_MAP ids). */
    resource: string;
    /** Per-rank additive multiplier (0.05 = +5% per consume). */
    perRank: number;
    /** Max ranks the player can bank for this rare. */
    maxConsume: number;
  };
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
    reliquary: { label: "+5% gold per rank", resource: "gold", perRank: 0.05, maxConsume: 5 },
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
    reliquary: { label: "+4% materials per rank", resource: "materials", perRank: 0.04, maxConsume: 5 },
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
    reliquary: { label: "+5% military per rank", resource: "military_power", perRank: 0.05, maxConsume: 5 },
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
    reliquary: { label: "+5% science per rank", resource: "science", perRank: 0.05, maxConsume: 5 },
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
    reliquary: { label: "+6% gold per rank", resource: "gold", perRank: 0.06, maxConsume: 5 },
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
    reliquary: { label: "+5% culture per rank", resource: "culture", perRank: 0.05, maxConsume: 5 },
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
    reliquary: { label: "+6% military per rank", resource: "military_power", perRank: 0.06, maxConsume: 5 },
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
    reliquary: { label: "+5% culture per rank", resource: "culture", perRank: 0.05, maxConsume: 5 },
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
    reliquary: { label: "+8% energy per rank", resource: "energy", perRank: 0.08, maxConsume: 3 },
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
    reliquary: { label: "+6% data per rank", resource: "data", perRank: 0.06, maxConsume: 5 },
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
    reliquary: { label: "+8% alloys per rank", resource: "alloys", perRank: 0.08, maxConsume: 3 },
  },
];

export const RARE_RESOURCE_MAP: Record<string, RareResourceDef> = Object.fromEntries(
  RARE_RESOURCES.map((r) => [r.id, r])
);

/** Check if a rare resource has been discovered. F1 RELIQUARY: the flag is
 *  (stockpiled + consumed) >= 1, so consuming down to 0 keeps the unlock
 *  intact as long as you've ever owned one. `reliquary` defaults to {} for
 *  callers that don't track it (legacy code paths). */
export function isRareResourceDiscovered(
  rareResources: Record<string, number>,
  id: string,
  reliquary?: Record<string, number>
): boolean {
  return (rareResources[id] || 0) + ((reliquary?.[id]) || 0) >= 1;
}

/** Get all unlocks (system IDs + tech IDs) that the player has discovered via rare resources. */
export function getDiscoveredUnlocks(
  rareResources: Record<string, number>,
  reliquary?: Record<string, number>
): { systems: string[]; techs: string[] } {
  const systems: string[] = [];
  const techs: string[] = [];
  for (const r of RARE_RESOURCES) {
    if (isRareResourceDiscovered(rareResources, r.id, reliquary)) {
      if (r.unlocks.type === "system") systems.push(r.unlocks.id);
      else techs.push(r.unlocks.id);
    }
  }
  return { systems, techs };
}

/**
 * Human-readable source list for a rare resource ("Hunting · Trade — Bone Clan
 * · Counter-raid loot"). Used by the Rare Discoveries tracker so players can
 * see WHERE an undiscovered resource can still be found — tracking what's
 * received AND what's still out there.
 */
export function formatSources(sources: string[]): string {
  return sources
    .map((src) => {
      if (src === "hunt") return "Hunting";
      if (src === "trade") return "Trade routes";
      if (src === "rival_loot") return "Counter-raid loot";
      if (src.startsWith("trade:")) {
        const partnerId = src.slice(6);
        const name = TRADE_PARTNER_MAP[partnerId]?.name;
        return name ? `Trade — ${name}` : "Trade routes";
      }
      return src;
    })
    .join(" · ");
}

/**
 * Spoiler-free source list: only sources the player can currently reach.
 * Generic sources (hunt / rival loot / trade) always pass; a specific trade
 * partner only passes if their stage is within `metStageIds` (current +
 * earlier stages). Returns the FULL sentence ("Found via Hunting · Trade —
 * Bone Clan" / "Found beyond this age.") so callers render it as-is.
 */
export function formatReachableSources(sources: string[], metStageIds: string[]): string {
  const reachable = sources.filter((src) => {
    if (!src.startsWith("trade:")) return true;
    const partner = TRADE_PARTNER_MAP[src.slice(6)];
    return !!partner && metStageIds.includes(partner.stage);
  });
  if (reachable.length === 0) return "Found beyond this age.";
  return `Found via ${formatSources(reachable)}`;
}
