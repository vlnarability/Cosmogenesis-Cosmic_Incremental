// ===========================================================================
// WORLD FUSION — multi-tier world merging system for the Divine Engine.
// ===========================================================================
// Players merge background worlds into higher tiers for more production per
// world (but lower total production until Ascendant tier). Each world counts
// as 1 toward the world cap (max 1,000,000 at L6+).
//
// Tier math:
//   Tier N produces 5× a Tier (N-1) world.
//   Fusing 10 Tier N → 1 Tier (N+1) = 5× production from 10× worlds = halved.
//   Ascendant = 100 Tier 10 → 100× a Tier 10 = breakeven (equal production).
//   Greater Ascendant = 100 Ascendant → 1000× an Ascendant = 10× boost.
//   Celestial Core = 1000 Greater Ascendant → 10000× = 10× boost.
//   Void World = 10000 Celestial Core → 1000000× = 10× boost + Void Shards.
//   Void World locked until L7+ (omnipotence).
// ===========================================================================

export interface FusionTier {
  id: string;
  name: string;
  icon: string;
  sourceTier: string | null; // the tier you merge FROM (null for Tier 1)
  sourceCount: number; // how many source worlds needed to fuse 1 of this tier
  productionMult: number; // × multiplier vs a single Tier 1 world
  requiresLayer?: string; // for Void World: "omnipotence" (L7+)
  producesCosmicFragments?: boolean;
  desc: string;
}

// Calculate 5^(tier-1) for tiers 1-10
function tierMult(tier: number): number {
  return Math.pow(5, tier - 1);
}

const T10_MULT = tierMult(10); // 5^9 = 1,953,125
const ASCENDANT_MULT = 100 * T10_MULT; // 195,312,500
const GREATER_MULT = 1000 * ASCENDANT_MULT; // 195,312,500,000
const CELESTIAL_MULT = 10000 * GREATER_MULT; // 1,953,125,000,000,000
const VOID_MULT = 1000000 * CELESTIAL_MULT; // 1,953,125,000,000,000,000,000

export const FUSION_TIERS: FusionTier[] = [
  { id: "1", name: "Tier 1 World", icon: "🌍", sourceTier: null, sourceCount: 0, productionMult: 1,
    desc: "Standard background simulation world. Produces base Divinity." },
  { id: "2", name: "Tier 2 World", icon: "🪐", sourceTier: "1", sourceCount: 10, productionMult: 5,
    desc: "5× a Tier 1 world. Fusing 10→1 halves total production." },
  { id: "3", name: "Tier 3 World", icon: "⭐", sourceTier: "2", sourceCount: 10, productionMult: 25,
    desc: "25× a Tier 1. Fusing quarters total production." },
  { id: "4", name: "Tier 4 World", icon: "🔮", sourceTier: "3", sourceCount: 10, productionMult: 125,
    desc: "125× a Tier 1." },
  { id: "5", name: "Tier 5 World", icon: "💎", sourceTier: "4", sourceCount: 10, productionMult: 625,
    desc: "625× a Tier 1." },
  { id: "6", name: "Tier 6 World", icon: "🏮", sourceTier: "5", sourceCount: 10, productionMult: 3125,
    desc: "3,125× a Tier 1." },
  { id: "7", name: "Tier 7 World", icon: "🎆", sourceTier: "6", sourceCount: 10, productionMult: 15625,
    desc: "15,625× a Tier 1." },
  { id: "8", name: "Tier 8 World", icon: "🌌", sourceTier: "7", sourceCount: 10, productionMult: 78125,
    desc: "78,125× a Tier 1." },
  { id: "9", name: "Tier 9 World", icon: "🌠", sourceTier: "8", sourceCount: 10, productionMult: 390625,
    desc: "390,625× a Tier 1." },
  { id: "10", name: "Tier 10 World", icon: "☀️", sourceTier: "9", sourceCount: 10, productionMult: T10_MULT,
    desc: "1,953,125× a Tier 1. The highest standard fusion tier." },
  { id: "ascendant", name: "Ascendant World", icon: "✨", sourceTier: "10", sourceCount: 100, productionMult: ASCENDANT_MULT,
    desc: "100× a Tier 10. Breakeven point — equal production to the 100 merged worlds." },
  { id: "greater_ascendant", name: "Greater Ascendant", icon: "🌟", sourceTier: "ascendant", sourceCount: 100, productionMult: GREATER_MULT,
    desc: "1000× an Ascendant. 10× production boost over merged worlds." },
  { id: "celestial_core", name: "Celestial Core", icon: "💠", sourceTier: "greater_ascendant", sourceCount: 1000, productionMult: CELESTIAL_MULT,
    desc: "10000× a Greater Ascendant. Another 10× boost." },
  { id: "void", name: "Void World", icon: "🌑", sourceTier: "celestial_core", sourceCount: 10000, productionMult: VOID_MULT,
    requiresLayer: "omnipotence", producesCosmicFragments: true,
    desc: "1000000× a Celestial Core. 10× boost + produces Void Shards. Locked until L7." },
];

export const FUSION_TIER_MAP: Record<string, FusionTier> = Object.fromEntries(
  FUSION_TIERS.map((t) => [t.id, t])
);

/** Production multiplier for a given tier (vs a single Tier 1 world). */
export function productionMultiplierForTier(tierId: string): number {
  return FUSION_TIER_MAP[tierId]?.productionMult ?? 0;
}

/** Sum of all world counts across all tiers (for cap purposes). */
export function rawWorldCount(worldTiers: Record<string, number>): number {
  let total = 0;
  for (const tier of FUSION_TIERS) {
    total += Math.max(0, Math.floor(worldTiers[tier.id] || 0));
  }
  return total;
}

/** Effective production count (Σ count × productionMult). */
export function effectiveWorldCount(worldTiers: Record<string, number>): number {
  let total = 0;
  for (const tier of FUSION_TIERS) {
    const count = Math.max(0, Math.floor(worldTiers[tier.id] || 0));
    total += count * tier.productionMult;
  }
  return total;
}

/** Check if a fusion tier is unlocked (Void World requires L7+). */
export function isFusionTierUnlocked(tierId: string, unlockedLayers: Record<string, boolean>): boolean {
  const tier = FUSION_TIER_MAP[tierId];
  if (!tier) return false;
  if (tier.requiresLayer && !unlockedLayers?.[tier.requiresLayer]) return false;
  return true;
}

/** Check if the player can fuse to the given tier (has enough source worlds). */
export function canFuseToTier(tierId: string, worldTiers: Record<string, number>): boolean {
  const tier = FUSION_TIER_MAP[tierId];
  if (!tier || !tier.sourceTier) return false;
  const available = Math.max(0, Math.floor(worldTiers[tier.sourceTier] || 0));
  return available >= tier.sourceCount;
}

// Eternal Flame multiplier formula: 1 + log10(invested + 1) × 0.5
export function eternalFlameMultiplier(invested: number): number {
  if (invested <= 0) return 1;
  return 1 + Math.log10(invested + 1) * 0.5;
}

// ===== ALIASES for the subagent's expected export names =====
export function makeInitialWorldTiers(): Record<string, number> {
  const tiers: Record<string, number> = {};
  for (const t of FUSION_TIERS) {
    tiers[t.id] = 0;
  }
  return tiers;
}

export function canFuse(
  worldTiers: Record<string, number>,
  targetTierId: string,
  unlockedLayers?: Record<string, boolean>
): { ok: boolean; reason?: string } {
  const tier = FUSION_TIER_MAP[targetTierId];
  if (!tier || !tier.sourceTier) return { ok: false, reason: "invalid tier" };
  if (unlockedLayers && tier.requiresLayer && !unlockedLayers[tier.requiresLayer]) {
    return { ok: false, reason: `requires ${tier.requiresLayer} layer` };
  }
  const available = Math.max(0, Math.floor(worldTiers[tier.sourceTier] || 0));
  if (available < tier.sourceCount) {
    return { ok: false, reason: `need ${tier.sourceCount} ${FUSION_TIER_MAP[tier.sourceTier].name}, have ${available}` };
  }
  return { ok: true };
}
