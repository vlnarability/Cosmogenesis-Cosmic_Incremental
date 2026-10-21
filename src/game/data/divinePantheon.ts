// ===========================================================================
// IDEA-8 — DIVINE PANTHEON (L8 sub-system)
// ===========================================================================
// The god fragments their own essence into named Avatars that manage
// aspects of the Divine Engine. Each Avatar occupies a Pantheon slot,
// holds a Domain (one of 5), and is upgraded through Power Levels (1-10).
//
// Each Domain passively boosts one stat across the entire Divine Engine:
//   • ascendant — +X% Divinity/s per Power Level
//   • harvester — +X% Faith/s per Power Level
//   • sentinel  — reduces world-collapse chance per Power Level
//   • architect — +X% peak production rate per Power Level
//   • voidborn  — +X% Void Shard/s per Power Level
//
// The player can have up to PANTHEON_SLOTS Avatars at once. Slot unlocks
// scale in Divinity cost. Avatar creation is free once the slot is open —
// the player just picks a Domain. Each slot can be dismissed and re-created
// freely (no refund of unlock cost).
// ===========================================================================

export type AvatarDomain =
  | "ascendant"
  | "harvester"
  | "sentinel"
  | "architect"
  | "voidborn";

export interface Avatar {
  /** Stable per-slot id, used as React key. Equal to the slot index. */
  id: number;
  /** Player-defined or randomized display name. */
  name: string;
  /** Domain determines which bonus the Avatar grants. */
  domain: AvatarDomain;
  /** Power Level 1-10. Each level scales the Domain bonus. */
  powerLevel: number;
}

export interface PantheonSlot {
  /** null = slot is empty (no Avatar assigned). Avatar = occupied. */
  avatar: Avatar | null;
  /** true once the slot has been unlocked. False = locked. */
  unlocked: boolean;
}

/** Number of slots in the Pantheon. Slots unlock in order (cheapest first). */
export const PANTHEON_SLOTS = 5;

/** Maximum Power Level an Avatar can be raised to. */
export const MAX_AVATAR_POWER = 10;

/** Divinity cost to unlock each slot, indexed by slot position. */
export const PANHEON_SLOT_UNLOCK_COSTS: number[] = [500, 5_000, 50_000, 500_000, 5_000_000];

/** Base Divinity cost for raising an Avatar one Power Level.
 *  Final cost = BASE × 2^(currentLevel - 1) × (slotIndex + 1). */
export const AVATAR_UPGRADE_BASE_COST = 100;

/** Per-Domain bonus rate per Power Level. */
export const DOMAIN_BONUS_PER_LEVEL: Record<AvatarDomain, number> = {
  ascendant: 0.05,  // +5% Divinity/s per level
  harvester: 0.03,  // +3% Faith/s per level
  sentinel:  0.05,   // -5% world collapse chance per level (capped)
  architect: 0.02,   // +2% peak production rate per level
  voidborn:  0.05,   // +5% Void Shard/s per level
};

/** Display metadata for each Domain (icon, label, description, accent). */
export interface DomainMeta {
  id: AvatarDomain;
  icon: string;
  label: string;
  blurb: string;
  accent: string; // tailwind text-* + border-* prefix color
  bonusLabel: (level: number) => string;
}

export const DOMAIN_META: Record<AvatarDomain, DomainMeta> = {
  ascendant: {
    id: "ascendant",
    icon: "🌅",
    label: "Ascendant",
    blurb: "Avatar of Radiance — channels Divinity from the Engine itself.",
    accent: "text-amber-300 border-amber-400/40",
    bonusLabel: (lvl) => `+${(lvl * DOMAIN_BONUS_PER_LEVEL.ascendant * 100).toFixed(0)}% Divinity/s`,
  },
  harvester: {
    id: "harvester",
    icon: "🌾",
    label: "Harvester",
    blurb: "Avatar of Reaping — gathers Faith from your worlds.",
    accent: "text-emerald-300 border-emerald-400/40",
    bonusLabel: (lvl) => `+${(lvl * DOMAIN_BONUS_PER_LEVEL.harvester * 100).toFixed(0)}% Faith/s`,
  },
  sentinel: {
    id: "sentinel",
    icon: "🛡️",
    label: "Sentinel",
    blurb: "Avatar of Warding — shields worlds against collapse.",
    accent: "text-sky-300 border-sky-400/40",
    bonusLabel: (lvl) => `-${Math.min(80, lvl * DOMAIN_BONUS_PER_LEVEL.sentinel * 100).toFixed(0)}% crash chance`,
  },
  architect: {
    id: "architect",
    icon: "📐",
    label: "Architect",
    blurb: "Avatar of Design — refines peak production across worlds.",
    accent: "text-violet-300 border-violet-400/40",
    bonusLabel: (lvl) => `+${(lvl * DOMAIN_BONUS_PER_LEVEL.architect * 100).toFixed(0)}% peak prod`,
  },
  voidborn: {
    id: "voidborn",
    icon: "🕳️",
    label: "Voidborn",
    blurb: "Avatar of the Void — harvests Void Shards from chaos.",
    accent: "text-fuchsia-300 border-fuchsia-400/40",
    bonusLabel: (lvl) => `+${(lvl * DOMAIN_BONUS_PER_LEVEL.voidborn * 100).toFixed(0)}% Void Shards`,
  },
};

/** Ordered list of all 5 Domains — used by the picker UI. */
export const ALL_DOMAINS: AvatarDomain[] = [
  "ascendant", "harvester", "sentinel", "architect", "voidborn",
];

/** Random name pools for fresh Avatars (combines prefix + suffix). */
const NAME_PREFIXES = [
  "Astra", "Cael", "Vyr", "Mor", "Eon", "Zeph", "Kael", "Sael",
  "Ther", "Lyr", "Nyx", "Or", "Quor", "Vel", "Xan", "Ymn",
  "Hel", "Sol", "Lun", "Aur", "Tor", "Gar", "Syl", "Fen",
];
const NAME_SUFFIXES = [
  "ion", "ius", "ara", "oth", "el", "ix", "or", "ae",
  "as", "il", "yn", "os", "eth", "ius", "a", "us",
];

/** Picks a random display name for a freshly-created Avatar. */
export function randomAvatarName(): string {
  const p = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
  const s = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
  return p + s;
}

/** Computes the Divinity cost to raise an Avatar from level → level + 1. */
export function avatarUpgradeCost(slotIndex: number, currentLevel: number): number {
  return Math.ceil(AVATAR_UPGRADE_BASE_COST * Math.pow(2, currentLevel - 1) * (slotIndex + 1));
}

/** Builds an empty Pantheon state — 5 locked slots. */
export function makeInitialPantheon(): PantheonSlot[] {
  return Array.from({ length: PANTHEON_SLOTS }, (_, i) => ({
    id: i,
    avatar: null,
    unlocked: false,
  }));
}

/**
 * Aggregated Pantheon bonuses, ready to apply in the tick.
 *   divinityMult    — additive multiplier (e.g. 0.15 = +15% Divinity/s)
 *   faithMult       — additive multiplier on Faith generation
 *   voidShardsMult  — additive multiplier on Void Shard gain
 *   peakMult        — additive multiplier on peakProductionRate
 *   crashReduction  — 0..0.8 — fraction of world-collapse chance removed
 *   totalAvatars    — count of created Avatars
 *   totalPower      — sum of all Avatar power levels
 */
export interface PantheonBonus {
  divinityMult: number;
  faithMult: number;
  voidShardsMult: number;
  peakMult: number;
  crashReduction: number;
  totalAvatars: number;
  totalPower: number;
}

export const ZERO_PANTHEON_BONUS: PantheonBonus = {
  divinityMult: 0,
  faithMult: 0,
  voidShardsMult: 0,
  peakMult: 0,
  crashReduction: 0,
  totalAvatars: 0,
  totalPower: 0,
};

/** Sums the per-Domain bonuses across all created Avatars. */
export function pantheonBonus(slots: Array<PantheonSlot | null | undefined>): PantheonBonus {
  const out: PantheonBonus = { ...ZERO_PANTHEON_BONUS };
  if (!Array.isArray(slots)) return out;
  for (const slot of slots) {
    if (!slot?.avatar) continue;
    const { domain, powerLevel } = slot.avatar;
    const lvl = Math.max(1, Math.min(MAX_AVATAR_POWER, powerLevel));
    out.totalAvatars += 1;
    out.totalPower += lvl;
    switch (domain) {
      case "ascendant":
        out.divinityMult += lvl * DOMAIN_BONUS_PER_LEVEL.ascendant;
        break;
      case "harvester":
        out.faithMult += lvl * DOMAIN_BONUS_PER_LEVEL.harvester;
        break;
      case "sentinel":
        // Capped at 80% reduction (lvl 10 → -50%, but multiple Avatars stack further).
        out.crashReduction = Math.min(0.8, out.crashReduction + lvl * DOMAIN_BONUS_PER_LEVEL.sentinel);
        break;
      case "architect":
        out.peakMult += lvl * DOMAIN_BONUS_PER_LEVEL.architect;
        break;
      case "voidborn":
        out.voidShardsMult += lvl * DOMAIN_BONUS_PER_LEVEL.voidborn;
        break;
    }
  }
  return out;
}
