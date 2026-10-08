// Cosmetics — visual customization items purchasable with Aether Shards.
// Aether Shards are earned by prestiging (1 per 100 EP earned, capped per run)
// and by completing achievements. Cosmetics never affect gameplay — purely visual.
//
// Cosmetic categories:
//   1. Themes         — full UI color/glow re-skins
//   2. Particle Effects — visual flair on actions (sparks, leaves, runes, etc.)
//   3. Icons          — alternate icons for key resources (atp, glucose, etc.)
//   4. Player Titles  — honorifics shown in header next to "Evolution Idle"
//   5. Stage Banners  — alternate banner colors per stage

export type CosmeticCategory = "theme" | "particle" | "icon" | "title" | "banner";

export interface CosmeticDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: CosmeticCategory;
  cost: number; // Aether Shards cost
  // Theme: CSS class to apply to the root wrapper (acts as a CSS variable override)
  themeClass?: string;
  // Particle: emoji used as the action particle effect
  particleEmoji?: string;
  // Icon: replaces the resource icon (resourceId → emoji)
  iconOverride?: Record<string, string>;
  // Title: the title text to display
  titleText?: string;
  // Banner: gradient class for stage banner
  bannerClass?: string;
  // Rarity for visual flair
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
}

// ============ THEMES ============
// 6 themes: default + 5 unlockable
export const COSMETIC_THEMES: CosmeticDef[] = [
  {
    id: "theme_default",
    name: "Cosmic (Default)",
    desc: "The original dark cosmic theme. No change.",
    icon: "🌌",
    category: "theme",
    cost: 0,
    themeClass: "theme-cosmic",
    rarity: "common",
  },
  {
    id: "theme_emerald",
    name: "Emerald Grove",
    desc: "Verdant green-gold palette. Soothing and organic.",
    icon: "🌿",
    category: "theme",
    cost: 25,
    themeClass: "theme-emerald",
    rarity: "uncommon",
  },
  {
    id: "theme_ember",
    name: "Ember Forge",
    desc: "Smoldering red-orange with deep charcoal. Warm and intense.",
    icon: "🔥",
    category: "theme",
    cost: 40,
    themeClass: "theme-ember",
    rarity: "rare",
  },
  {
    id: "theme_rose",
    name: "Rose Quartz",
    desc: "Soft pink-rose with cream highlights. Gentle and refined.",
    icon: "🌸",
    category: "theme",
    cost: 60,
    themeClass: "theme-rose",
    rarity: "rare",
  },
  {
    id: "theme_void",
    name: "Void Cantor",
    desc: "Black-purple with cyan glints. Cryptic and unsettling.",
    icon: "🌑",
    category: "theme",
    cost: 100,
    themeClass: "theme-void",
    rarity: "epic",
  },
  {
    id: "theme_astral",
    name: "Astral Prism",
    desc: "Iridescent rainbow refraction across all UI. God-tier shimmer.",
    icon: "✨",
    category: "theme",
    cost: 250,
    themeClass: "theme-astral",
    rarity: "legendary",
  },
];

// ============ PARTICLE EFFECTS ============
export const COSMETIC_PARTICLES: CosmeticDef[] = [
  {
    id: "particle_default",
    name: "None",
    desc: "No particle effect on actions.",
    icon: "○",
    category: "particle",
    cost: 0,
    particleEmoji: "",
    rarity: "common",
  },
  {
    id: "particle_spark",
    name: "Sparks",
    desc: "Tiny spark burst on every manual action.",
    icon: "✦",
    category: "particle",
    cost: 15,
    particleEmoji: "✦",
    rarity: "common",
  },
  {
    id: "particle_leaves",
    name: "Drift Leaves",
    desc: "Soft green leaves flutter on each action.",
    icon: "🍃",
    category: "particle",
    cost: 20,
    particleEmoji: "🍃",
    rarity: "uncommon",
  },
  {
    id: "particle_runes",
    name: "Arcane Runes",
    desc: "Glowing runes materialize briefly with each action.",
    icon: "ᚠ",
    category: "particle",
    cost: 30,
    particleEmoji: "ᚠ",
    rarity: "rare",
  },
  {
    id: "particle_stars",
    name: "Stardust",
    desc: "Constellation of stars trails from your cursor on each click.",
    icon: "⭐",
    category: "particle",
    cost: 50,
    particleEmoji: "⭐",
    rarity: "epic",
  },
  {
    id: "particle_heart",
    name: "Divine Heart",
    desc: "Sacred heart pulses on each manual action.",
    icon: "💗",
    category: "particle",
    cost: 75,
    particleEmoji: "💗",
    rarity: "legendary",
  },
];

// ============ ICON OVERRIDES ============
export const COSMETIC_ICONS: CosmeticDef[] = [
  {
    id: "icons_default",
    name: "Default Icons",
    desc: "Original resource icons.",
    icon: "🎨",
    category: "icon",
    cost: 0,
    rarity: "common",
  },
  {
    id: "icons_runes",
    name: "Rune Set",
    desc: "Replaces ATP/glucose/proteins with arcane runes.",
    icon: "ᚨ",
    category: "icon",
    cost: 20,
    iconOverride: { atp: "ᚨ", glucose: "ᚷ", proteins: "ᛈ", lipids: "ᛚ", elements: "ᛟ" },
    rarity: "uncommon",
  },
  {
    id: "icons_crystal",
    name: "Crystal Set",
    desc: "Crystalline gemstone icons for cell resources.",
    icon: "💎",
    category: "icon",
    cost: 35,
    iconOverride: { atp: "⚡", glucose: "🍬", proteins: "🥩", lipids: "🧈", elements: "🪨" },
    rarity: "rare",
  },
  {
    id: "icons_emoji",
    name: "Emoji Burst",
    desc: "Big expressive emoji replacements for all primary resources.",
    icon: "😀",
    category: "icon",
    cost: 45,
    iconOverride: {
      atp: "⚡", glucose: "🍭", proteins: "🍖", lipids: "🧈", elements: "🪨",
      food: "🍞", water: "💧", materials: "🪵", organic_matter: "🍂",
      knowledge: "📚", culture: "🎭", wood: "🪵", lumber: "🪚", stone: "🪨", clay: "🧱",
      science: "🔬", happiness: "😊", military_power: "⚔️", production: "⚙️",
      gold: "🪙", influence: "👑", energy: "🔋", alloys: "🔩", data: "💾",
    },
    rarity: "epic",
  },
];

// ============ PLAYER TITLES ============
export const COSMETIC_TITLES: CosmeticDef[] = [
  {
    id: "title_none",
    name: "No Title",
    desc: "Hide the title prefix.",
    icon: "",
    category: "title",
    cost: 0,
    titleText: "",
    rarity: "common",
  },
  {
    id: "title_watcher",
    name: "The Watcher",
    desc: "Shown in the header next to your run stats.",
    icon: "👁️",
    category: "title",
    cost: 10,
    titleText: "The Watcher",
    rarity: "common",
  },
  {
    id: "title_shaper",
    name: "The Shaper",
    desc: "Earned through shaping life across stages.",
    icon: "🤲",
    category: "title",
    cost: 30,
    titleText: "The Shaper",
    rarity: "uncommon",
  },
  {
    id: "title_architect",
    name: "The Architect",
    desc: "For those who build worlds.",
    icon: "📐",
    category: "title",
    cost: 60,
    titleText: "The Architect",
    rarity: "rare",
  },
  {
    id: "title_ascended",
    name: "The Ascended",
    desc: "Reserved for prestige-layer masters.",
    icon: "👑",
    category: "title",
    cost: 150,
    titleText: "The Ascended",
    rarity: "legendary",
  },
];

// ============ ALL COSMETICS ============
export const ALL_COSMETICS: CosmeticDef[] = [
  ...COSMETIC_THEMES,
  ...COSMETIC_PARTICLES,
  ...COSMETIC_ICONS,
  ...COSMETIC_TITLES,
];

export const COSMETIC_MAP: Record<string, CosmeticDef> = Object.fromEntries(
  ALL_COSMETICS.map((c) => [c.id, c])
);

// How many Aether Shards to grant on prestige (1 per 100 EP earned this run, capped at 50)
export function aetherShardsForRun(epEarned: number): number {
  return Math.min(50, Math.max(0, Math.floor(epEarned / 100)));
}

// Helper: get the active theme class
export function getActiveThemeClass(activeCosmetics: Record<string, string>): string {
  const themeId = activeCosmetics.theme;
  if (!themeId) return "theme-cosmic";
  return COSMETIC_MAP[themeId]?.themeClass || "theme-cosmic";
}

// Helper: get the active particle emoji
export function getActiveParticle(activeCosmetics: Record<string, string>): string {
  const partId = activeCosmetics.particle;
  if (!partId) return "";
  return COSMETIC_MAP[partId]?.particleEmoji || "";
}

// Helper: get icon overrides (merged map)
export function getActiveIconOverrides(activeCosmetics: Record<string, string>): Record<string, string> {
  const iconId = activeCosmetics.icon;
  if (!iconId) return {};
  return COSMETIC_MAP[iconId]?.iconOverride || {};
}

// Helper: get active title text
export function getActiveTitle(activeCosmetics: Record<string, string>): string {
  const titleId = activeCosmetics.title;
  if (!titleId) return "";
  return COSMETIC_MAP[titleId]?.titleText || "";
}

// Categories for display
export const COSMETIC_CATEGORIES: { id: CosmeticCategory; label: string; icon: string; items: CosmeticDef[] }[] = [
  { id: "theme", label: "Themes", icon: "🎨", items: COSMETIC_THEMES },
  { id: "particle", label: "Particle FX", icon: "✨", items: COSMETIC_PARTICLES },
  { id: "icon", label: "Icon Sets", icon: "🔁", items: COSMETIC_ICONS },
  { id: "title", label: "Titles", icon: "👑", items: COSMETIC_TITLES },
];
