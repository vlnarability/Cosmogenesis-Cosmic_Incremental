// Divinity — Layer 8 (Divinity) — the god becomes a cosmic object of devotion.
//
// After Omnipotence, the next transformation is the strangest yet: the god
// stops being one presence and becomes six. Populations generate prayer in
// different forms; the player routes that prayer into divine channels and
// chooses a Divine Mask — the face the god shows to creation. Each mask
// reshapes how creation perceives the divine, and what worship it generates.
//
// Three pillars of Divinity:
//
//   1. Divine Masks (6) — Radiant Sovereign, Hidden Architect, Devouring Judge,
//      Nurturing Creator, Cold Lawgiver, Trickster Star. Each mask shifts the
//      shape of prayer: which worship forms generate, which events dominate,
//      which laws feel natural. Choosing a mask costs Divinity (a meaningful
//      commitment per run); switching mid-run is allowed but expensive.
//   2. Prayer Routing (6 channels) — Growth, Harmony, Conquest, Wealth,
//      Knowledge, Transcendence. Prayer is generated passively by the
//      population and routed (via percentages 0-100, must sum to 100) into
//      these channels. Each channel empowers a different game system.
//   3. Worship Polarity (5) — Reverence, Fear, Wonder, Ambition, Mystery.
//      The emotional tone of how the god is approached. Polarity shifts
//      prayer generation rates and the dominant tone of mask effects.
//
// NOTE on naming: the Enlightenment (Layer 2) currency is called "Divinity".
// This prestige *layer* is also called "Divinity" — it represents the god
// becoming a true cosmic presence (not just the Enlightenment-era foresight
// currency). State fields use the `divinityLayer*` / `divineMask*` prefix
// to disambiguate from the currency.

import type { ResourceId } from "../state/types";

// ============================================================
// Divine Mask — the face the god shows to creation.
//
// Six masks, each generating a different shape of worship and
// shifting which events/laws dominate. Setting a mask costs
// Divinity (the Enlightenment currency). Switching mid-run is
// allowed but expensive (full price of the new mask).
// ============================================================

export interface DivineMaskEffects {
  /** Per-resource production bonus (additive with all other per-resource stacks). */
  resourceMult?: Partial<Record<ResourceId, number>>;
  /** Additive bonus to all production. */
  allProductionMult?: number;
  /** Multiplier on prayer generation rate (1.0 = base). */
  prayerMult?: number;
  /** Multiplier on population happiness (1.0 = no change). */
  happinessMult?: number;
  /** Multiplier on population growth (1.0 = no change). */
  popGrowthMult?: number;
  /** Multiplier on military production (1.0 = no change). */
  militaryMult?: number;
  /** Multiplier on science production (1.0 = no change). */
  scienceMult?: number;
  /** Multiplier on gold + production (1.0 = no change). */
  goldMult?: number;
  /** Multiplier on Divinity accrual rate (1.0 = no change). */
  divinityMult?: number;
  /** Default prayer routing when this mask is donned (percentages sum to 100). */
  defaultRouting?: Record<string, number>;
}

export interface DivineMask {
  id: string;
  name: string;
  desc: string;
  icon: string;
  /** Accent color for the mask card. */
  color: string;
  /** Divinity cost to don this mask (paid in Enlightenment currency). */
  divinityCost: number;
  effects: DivineMaskEffects;
  /** Short label shown in the modal's effect summary. */
  effectLabel: string;
  /** Which polarity this mask leans toward (cosmetic alignment hint). */
  favoredPolarity: WorshipPolarity;
}

export const DIVINE_MASKS: DivineMask[] = [
  {
    id: "radiant_sovereign",
    name: "Radiant Sovereign",
    desc: "The god shines. Temples gleam; choirs sing; the people feel watched over. Growth surges; the harvest is plentiful; the sky is bright with assurance.",
    icon: "☀️",
    color: "#fbbf24",
    divinityCost: 30,
    effects: {
      prayerMult: 1.3,
      popGrowthMult: 1.15,
      resourceMult: { food: 0.10 },
      happinessMult: 1.10,
      defaultRouting: { growth: 50, harmony: 20, conquest: 10, wealth: 10, knowledge: 5, transcendence: 5 },
    },
    effectLabel: "+30% prayer · +15% pop growth · +10% food · +10% happiness",
    favoredPolarity: "reverence",
  },
  {
    id: "hidden_architect",
    name: "Hidden Architect",
    desc: "The god is felt only by what it builds. Curiosity deepens; the people learn to look for the design in things. Science rises; prayer is quieter but truer.",
    icon: "🔍",
    color: "#a78bfa",
    divinityCost: 30,
    effects: {
      prayerMult: 0.9,
      scienceMult: 1.25,
      resourceMult: { science: 0.15 },
      defaultRouting: { growth: 10, harmony: 10, conquest: 5, wealth: 10, knowledge: 50, transcendence: 15 },
    },
    effectLabel: "+25% science · +15% science · −10% prayer (but truer)",
    favoredPolarity: "mystery",
  },
  {
    id: "devouring_judge",
    name: "Devouring Judge",
    desc: "The god is feared. Spears line the temple steps; the harvest is taken. Military swells; the people obey; the prayer that reaches the god is loud with terror.",
    icon: "⚖️",
    color: "#ef4444",
    divinityCost: 35,
    effects: {
      prayerMult: 1.2,
      militaryMult: 1.30,
      happinessMult: 0.85,
      resourceMult: { military_power: 0.15 },
      defaultRouting: { growth: 10, harmony: 5, conquest: 50, wealth: 15, knowledge: 10, transcendence: 10 },
    },
    effectLabel: "+30% military · +15% military · +20% prayer · −15% happiness",
    favoredPolarity: "fear",
  },
  {
    id: "nurturing_creator",
    name: "Nurturing Creator",
    desc: "The god is grateful. The people feel the god's gratitude for what they have made together. Harmony blooms; happiness holds steady; prayer comes softly.",
    icon: "🌱",
    color: "#34d399",
    divinityCost: 30,
    effects: {
      prayerMult: 1.1,
      happinessMult: 1.15,
      popGrowthMult: 1.10,
      resourceMult: { food: 0.10, culture: 0.15 },
      defaultRouting: { growth: 20, harmony: 50, conquest: 5, wealth: 5, knowledge: 10, transcendence: 10 },
    },
    effectLabel: "+15% happiness · +10% pop · +10% food · +15% culture",
    favoredPolarity: "reverence",
  },
  {
    id: "cold_lawgiver",
    name: "Cold Lawgiver",
    desc: "The god is duty. The people work; the world obeys; the laws hold. Production and stability rise; prayer is steady and unsurprised. Nothing wavers; nothing celebrates.",
    icon: "❄️",
    color: "#60a5fa",
    divinityCost: 35,
    effects: {
      prayerMult: 1.0,
      goldMult: 1.20,
      resourceMult: { production: 0.15, gold: 0.10 },
      popGrowthMult: 1.05,
      defaultRouting: { growth: 15, harmony: 15, conquest: 10, wealth: 30, knowledge: 15, transcendence: 15 },
    },
    effectLabel: "+20% gold & production · +15% production · +5% pop",
    favoredPolarity: "ambition",
  },
  {
    id: "trickster_star",
    name: "Trickster Star",
    desc: "The god surprises. The people laugh and tremble at the same jokes. Prayer comes weirdly, in dreams and riddles. Transcendence rises; reality flickers. The mask changes the god as much as the god changes the world.",
    icon: "✨",
    color: "#22d3ee",
    divinityCost: 40,
    effects: {
      prayerMult: 1.15,
      divinityMult: 1.20,
      allProductionMult: 0.05,
      resourceMult: { divinity: 0.15 },
      defaultRouting: { growth: 5, harmony: 10, conquest: 5, wealth: 5, knowledge: 15, transcendence: 60 },
    },
    effectLabel: "+15% prayer · +20% Divinity accrual · +5% all production",
    favoredPolarity: "wonder",
  },
];

export const DIVINE_MASK_MAP: Record<string, DivineMask> = Object.fromEntries(
  DIVINE_MASKS.map((m) => [m.id, m])
);

export function getDivineMask(id: string): DivineMask | undefined {
  return DIVINE_MASK_MAP[id];
}

export function totalDivineMaskCount(): number {
  return DIVINE_MASKS.length;
}

// ============================================================
// PrayerChannel — where routed prayer goes.
//
// Six channels: Growth, Harmony, Conquest, Wealth, Knowledge,
// Transcendence. Prayer is generated passively by population
// (with mask + polarity modifiers) and routed into these
// channels (percentages must sum to 100). Each channel
// provides a bonus that scales with the prayer it receives
// per tick.
// ============================================================

export type PrayerChannelId =
  | "growth"
  | "harmony"
  | "conquest"
  | "wealth"
  | "knowledge"
  | "transcendence";

export interface PrayerChannelEffects {
  /** Per-resource production bonus per prayer-per-second received. */
  resourceMult?: Partial<Record<ResourceId, number>>;
  /** Additive bonus to all production per prayer-per-second received. */
  allProductionMult?: number;
  /** Population growth multiplier per prayer-per-second received. */
  popGrowthMult?: number;
  /** Capacity multiplier per prayer-per-second received. */
  capacityMult?: number;
  /** Happiness multiplier per prayer-per-second received. */
  happinessMult?: number;
  /** Divinity-per-second gain per prayer-per-second received (small). */
  divinityPerSec?: number;
}

export interface PrayerChannel {
  id: PrayerChannelId;
  name: string;
  desc: string;
  icon: string;
  /** Accent color. */
  color: string;
  /** Effects applied per unit of prayer/sec received in this channel. */
  effects: PrayerChannelEffects;
  /** Short label shown in the modal's effect summary. */
  effectLabel: string;
}

export const PRAYER_CHANNELS: PrayerChannel[] = [
  {
    id: "growth",
    name: "Growth",
    desc: "Prayer poured into the soil. Fields wave heavy; the people multiply; the harvest comes early and stays long.",
    icon: "🌱",
    color: "#34d399",
    effects: {
      resourceMult: { food: 0.02 },
      popGrowthMult: 0.02,
    },
    effectLabel: "+2% food · +2% pop growth per prayer/sec",
  },
  {
    id: "harmony",
    name: "Harmony",
    desc: "Prayer poured into the songs. Happiness holds; culture blooms; the people find ways to live with themselves.",
    icon: "🎭",
    color: "#f9a8d4",
    effects: {
      resourceMult: { culture: 0.02, happiness: 0.02 },
      happinessMult: 0.02,
    },
    effectLabel: "+2% culture · +2% happiness per prayer/sec",
  },
  {
    id: "conquest",
    name: "Conquest",
    desc: "Prayer poured into the forges. Spears sharpen; banners unfurl; the god's enemies learn to kneel.",
    icon: "⚔️",
    color: "#ef4444",
    effects: {
      resourceMult: { military_power: 0.03 },
    },
    effectLabel: "+3% military per prayer/sec",
  },
  {
    id: "wealth",
    name: "Wealth",
    desc: "Prayer poured into the ledgers. Gold flows; production follows the coin; the world counts its gains.",
    icon: "🪙",
    color: "#eab308",
    effects: {
      resourceMult: { gold: 0.03, production: 0.02 },
    },
    effectLabel: "+3% gold · +2% production per prayer/sec",
  },
  {
    id: "knowledge",
    name: "Knowledge",
    desc: "Prayer poured into the libraries. Ink flows; the people learn to look further; the god sees through their eyes.",
    icon: "📚",
    color: "#a78bfa",
    effects: {
      resourceMult: { science: 0.03 },
    },
    effectLabel: "+3% science per prayer/sec",
  },
  {
    id: "transcendence",
    name: "Transcendence",
    desc: "Prayer poured into the void between stars. The world grows quieter, brighter, stranger — and the god draws strength from what lies beyond it.",
    icon: "✨",
    color: "#22d3ee",
    effects: {
      allProductionMult: 0.01,
      divinityPerSec: 0.05,
    },
    effectLabel: "+1% all production · +0.05 Divinity/sec per prayer/sec",
  },
];

export const PRAYER_CHANNEL_MAP: Record<string, PrayerChannel> = Object.fromEntries(
  PRAYER_CHANNELS.map((c) => [c.id, c])
);

export function getPrayerChannel(id: string): PrayerChannel | undefined {
  return PRAYER_CHANNEL_MAP[id];
}

export function totalPrayerChannelCount(): number {
  return PRAYER_CHANNELS.length;
}

/** Default prayer routing (equal split across all six channels). */
export function defaultPrayerRouting(): Record<string, number> {
  // 100 / 6 ≈ 16.67 — round to 17, 17, 17, 17, 16, 16 (sums to 100).
  const each = Math.floor(100 / PRAYER_CHANNELS.length); // 16
  const remainder = 100 - each * PRAYER_CHANNELS.length; // 4
  const routing: Record<string, number> = {};
  PRAYER_CHANNELS.forEach((c, i) => {
    routing[c.id] = each + (i < remainder ? 1 : 0);
  });
  return routing;
}

// ============================================================
// Worship Polarity — the emotional tone of how the god is
// approached.
//
// Five polarities: Reverence, Fear, Wonder, Ambition, Mystery.
// Each shifts prayer generation rates and the dominant tone
// of mask effects. No cost to switch — polarity is a posture.
// ============================================================

export type WorshipPolarity =
  | "reverence"
  | "fear"
  | "wonder"
  | "ambition"
  | "mystery";

export interface PolarityConfig {
  id: WorshipPolarity;
  name: string;
  desc: string;
  icon: string;
  /** Multiplier on prayer generation (1.0 = base). */
  prayerMult: number;
  /** Multiplier on population happiness (1.0 = no change). */
  happinessMult: number;
  /** Multiplier on military production (1.0 = no change). */
  militaryMult: number;
  /** Multiplier on science production (1.0 = no change). */
  scienceMult: number;
  /** Multiplier on gold + production (1.0 = no change). */
  goldMult: number;
  /** Multiplier on Divinity accrual rate (1.0 = no change). */
  divinityMult: number;
  /** Accent color. */
  color: string;
}

export const WORSHIP_POLARITIES: PolarityConfig[] = [
  {
    id: "reverence",
    name: "Reverence",
    desc: "The people love their god. Prayer flows freely; happiness holds. The harvest is given gladly.",
    icon: "🙏",
    prayerMult: 1.2,
    happinessMult: 1.10,
    militaryMult: 1.0,
    scienceMult: 1.0,
    goldMult: 1.0,
    divinityMult: 1.0,
    color: "#f9a8d4",
  },
  {
    id: "fear",
    name: "Fear",
    desc: "The people obey their god. Prayer is loud and terrified; military swells; joy withers.",
    icon: "💀",
    prayerMult: 1.1,
    happinessMult: 0.85,
    militaryMult: 1.25,
    scienceMult: 1.0,
    goldMult: 1.0,
    divinityMult: 1.0,
    color: "#ef4444",
  },
  {
    id: "wonder",
    name: "Wonder",
    desc: "The people marvel at their god. Prayer comes in dreams and riddles; the world feels strange; transcendence rises.",
    icon: "🌟",
    prayerMult: 1.15,
    happinessMult: 1.05,
    militaryMult: 1.0,
    scienceMult: 1.10,
    goldMult: 1.0,
    divinityMult: 1.15,
    color: "#22d3ee",
  },
  {
    id: "ambition",
    name: "Ambition",
    desc: "The people serve their god to gain. Prayer becomes transaction; gold flows; production follows the coin.",
    icon: "🪙",
    prayerMult: 1.0,
    happinessMult: 1.0,
    militaryMult: 1.0,
    scienceMult: 1.0,
    goldMult: 1.25,
    divinityMult: 1.0,
    color: "#eab308",
  },
  {
    id: "mystery",
    name: "Mystery",
    desc: "The god is veiled. Prayer is quiet; knowledge deepens; the people seek and in seeking learn. The god grows subtler.",
    icon: "🌙",
    prayerMult: 0.95,
    happinessMult: 1.0,
    militaryMult: 1.0,
    scienceMult: 1.20,
    goldMult: 1.0,
    divinityMult: 1.10,
    color: "#a78bfa",
  },
];

export const WORSHIP_POLARITY_MAP: Record<WorshipPolarity, PolarityConfig> =
  Object.fromEntries(WORSHIP_POLARITIES.map((p) => [p.id, p])) as Record<
    WorshipPolarity,
    PolarityConfig
  >;

export function getPolarity(id: WorshipPolarity): PolarityConfig {
  return WORSHIP_POLARITY_MAP[id];
}

// ============================================================
// Compiled Divinity-layer effects — combine the player's
// divine mask + prayer routing + worship polarity into a single
// effects bundle that the tick / production code applies.
//
// Note: the mask's per-resource and all-production bonuses are
// applied here (stack with all other layers). The prayer-channel
// bonuses are computed in tick() because they scale with the
// per-tick prayer generation (not a flat multiplier).
// ============================================================

export interface CompiledDivinityLayerEffects {
  /** Per-resource production bonus (additive with all other per-resource stacks). */
  resourceMult: Record<string, number>;
  /** Additive bonus to all production (stacks with archetype allProductionMult, etc.). */
  allProductionMult: number;
  /** Population growth multiplier (additive). */
  popGrowthMult: number;
  /** Capacity multiplier (additive). */
  capacityMult: number;
  /** Happiness multiplier (additive to happiness resource bonus). */
  happinessMult: number;
  /** Multiplier on prayer generation rate (1.0 = base). Stacks mask × polarity. */
  prayerMult: number;
  /** Multiplier on Divinity accrual rate (1.0 = no change). Stacks mask × polarity. */
  divinityMult: number;
  /** Divinity-per-second gain (from transcendence channel). Computed in tick(). */
  divinityPerSec: number;
}

/**
 * Compile the player's divine mask + worship polarity into a single effects
 * bundle. Called once per tick. (Prayer-channel bonuses are computed in the
 * tick because they scale with the per-tick prayer generation.)
 *
 * Returned numbers are *additive* with route / foresight / archetype / world /
 * apotheosis / singularity / omnipotence bonuses.
 */
export function compileDivinityLayerEffects(
  maskId: string | null,
  polarityId: WorshipPolarity | null
): CompiledDivinityLayerEffects {
  const resourceMult: Record<string, number> = {};
  let allProductionMult = 0;
  let popGrowthMult = 0;
  let capacityMult = 0;
  let happinessMult = 0;
  let prayerMult = 1;
  let divinityMult = 1;
  let divinityPerSec = 0;

  // Mask effects (per-resource + all-production are flat bonuses folded
  // into the existing stacks. Multiplier-style effects (prayerMult, happinessMult,
  // popGrowthMult, etc.) are applied as (mult - 1) additive to the corresponding
  // resource/mult stack — same convention as apotheosis WorshipModeEffects.)
  if (maskId) {
    const mask = DIVINE_MASK_MAP[maskId];
    if (mask) {
      const e = mask.effects;
      if (e.resourceMult) {
        for (const [r, v] of Object.entries(e.resourceMult)) {
          resourceMult[r] = (resourceMult[r] || 0) + (v as number);
        }
      }
      if (e.allProductionMult) allProductionMult += e.allProductionMult;
      if (e.prayerMult) prayerMult *= e.prayerMult;
      if (e.popGrowthMult) popGrowthMult += e.popGrowthMult - 1;
      if (e.happinessMult) {
        happinessMult += e.happinessMult - 1;
        resourceMult.happiness = (resourceMult.happiness || 0) + (e.happinessMult - 1);
      }
      if (e.militaryMult) {
        resourceMult.military_power =
          (resourceMult.military_power || 0) + (e.militaryMult - 1);
      }
      if (e.scienceMult) {
        resourceMult.science = (resourceMult.science || 0) + (e.scienceMult - 1);
      }
      if (e.goldMult) {
        resourceMult.gold = (resourceMult.gold || 0) + (e.goldMult - 1);
        resourceMult.production = (resourceMult.production || 0) + (e.goldMult - 1);
      }
      if (e.divinityMult) divinityMult *= e.divinityMult;
    }
  }

  // Polarity effects (multiplier-style, additive to the corresponding stacks).
  if (polarityId) {
    const p = WORSHIP_POLARITY_MAP[polarityId];
    if (p) {
      prayerMult *= p.prayerMult;
      happinessMult += p.happinessMult - 1;
      resourceMult.happiness = (resourceMult.happiness || 0) + (p.happinessMult - 1);
      resourceMult.military_power =
        (resourceMult.military_power || 0) + (p.militaryMult - 1);
      resourceMult.science = (resourceMult.science || 0) + (p.scienceMult - 1);
      resourceMult.gold = (resourceMult.gold || 0) + (p.goldMult - 1);
      resourceMult.production = (resourceMult.production || 0) + (p.goldMult - 1);
      divinityMult *= p.divinityMult;
    }
  }

  return {
    resourceMult,
    allProductionMult,
    popGrowthMult,
    capacityMult,
    happinessMult,
    prayerMult,
    divinityMult,
    divinityPerSec,
  };
}

// ============================================================
// Prayer generation rate — base rate per population per second,
// before mask + polarity multipliers.
//
// Tuning: with a population of 100 (mid Civilization stage), the
// base rate yields 1 prayer/sec. With mask + polarity multipliers
// (~1.3 × 1.2 = ~1.56), that becomes ~1.56 prayer/sec — enough
// to feed ~0.05 prayer/sec per channel at the default 16% routing,
// which produces a noticeable but modest bonus in each channel
// (e.g. +0.05 × 0.02 = +0.001 food/sec — small but compounding).
// ============================================================

export const BASE_PRAYER_PER_POP = 0.01; // 1 prayer/sec per 100 population

// ============================================================
// Divinity-layer unlock condition — the god becomes a cosmic
// presence after Omnipotence is unlocked AND the player has
// sustained instability above 50 in a run AND survived it
// (didn't end the run via instability collapse).
//
// We track this via the `survivedInstability50` lifetime flag
// set in triggerPrestige when the player prestiges out of a run
// where instability reached 50+ but did NOT collapse to 100.
// ============================================================

export function checkDivinityLayerUnlockCondition(s: {
  omnipotenceUnlocked: boolean;
  survivedInstability50?: boolean;
}): boolean {
  if (!s.omnipotenceUnlocked) return false;
  return !!s.survivedInstability50;
}
