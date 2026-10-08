// ===========================================================================
// LAYER 3 — TRANSCENDENCE
// ===========================================================================
// The ascended god sheds the last of its clay. Transcendence is the layer of
// sacrifice and ritual: Offerings consume run resources for Divinity, Rituals
// spend Divinity for permanent or temporary effects, Scripts automate the
// busywork of godhood, and Blood Pacts trade population for raw Divinity.
// Completing all 4 Blood Pact tiers unlocks Layer 4 (Genesis).
// ===========================================================================

import type { ResourceId } from "../state/types";

// ----- Offerings -----
// Sacrifice resources → gain Divinity. Each offering scales by repeat count.
export interface Offering {
  id: string;
  name: string;
  desc: string;
  icon: string;
  cost: Partial<Record<ResourceId, number>>; // resources consumed per perform
  divinityGain: number; // base Divinity gained per perform
  repeatMult: number; // each repeat makes the offering scale by this factor
}

export const OFFERINGS: Offering[] = [
  {
    id: "offering_glucose",
    name: "Libation of Sugar",
    desc: "Pour glucose into the cosmic cup. +2 Divinity per pour.",
    icon: "🍬",
    cost: { glucose: 500 },
    divinityGain: 2,
    repeatMult: 1.10,
  },
  {
    id: "offering_proteins",
    name: "Heart of Flesh",
    desc: "Burn proteins as incense. +5 Divinity per offering.",
    icon: "🧬",
    cost: { proteins: 800 },
    divinityGain: 5,
    repeatMult: 1.15,
  },
  {
    id: "offering_gold",
    name: "Coin of the Dead",
    desc: "Melt gold to feed the throne. +10 Divinity per melt.",
    icon: "🪙",
    cost: { gold: 1200 },
    divinityGain: 10,
    repeatMult: 1.20,
  },
  {
    id: "offering_alloys",
    name: "Star-metal Sacrifice",
    desc: "Refine alloys into Divinity. +25 Divinity per rite.",
    icon: "🔩",
    cost: { alloys: 2000 },
    divinityGain: 25,
    repeatMult: 1.25,
  },
  {
    id: "offering_data",
    name: "The Quiet Word",
    desc: "Surrender data to the deep. +60 Divinity per word.",
    icon: "💾",
    cost: { data: 3000 },
    divinityGain: 60,
    repeatMult: 1.30,
  },
  {
    id: "offering_influence",
    name: "The Crown Unworn",
    desc: "Forgo influence. +150 Divinity per act of abdication.",
    icon: "👑",
    cost: { influence: 4000 },
    divinityGain: 150,
    repeatMult: 1.35,
  },
];

export const OFFERING_MAP: Record<string, Offering> = Object.fromEntries(
  OFFERINGS.map((o) => [o.id, o])
);

// ----- Rituals -----
// Spend Divinity for permanent or temporary effects.
// "permanent" rituals apply a one-time bonus forever; "temporary" rituals
// have a duration and grant their effect while active.
export type RitualKind = "permanent" | "temporary";

export interface RitualEffect {
  productionMult?: number;
  capMult?: number;
  epMult?: number;
  popGrowthMult?: number;
  divinityPerSec?: number; // passive Divinity generation
}

export interface Ritual {
  id: string;
  name: string;
  desc: string;
  icon: string;
  kind: RitualKind;
  cost: number; // Divinity to perform
  durationSec?: number; // for temporary rituals
  effect: RitualEffect;
}

export const RITUALS: Ritual[] = [
  {
    id: "ritual_eternal_flame",
    name: "Eternal Flame",
    desc: "Permanent: +10% all production.",
    icon: "🕯️",
    kind: "permanent",
    cost: 50,
    effect: { productionMult: 0.10 },
  },
  {
    id: "ritual_unbound_vessel",
    name: "Unbound Vessel",
    desc: "Permanent: +20% all capacities.",
    icon: "🏺",
    kind: "permanent",
    cost: 60,
    effect: { capMult: 0.20 },
  },
  {
    id: "ritual_chorus_of_gods",
    name: "Chorus of Gods",
    desc: "Permanent: +25% EP per prestige.",
    icon: "🎶",
    kind: "permanent",
    cost: 75,
    effect: { epMult: 0.25 },
  },
  {
    id: "ritual_blood_chant",
    name: "Blood Chant",
    desc: "Permanent: +20% population growth.",
    icon: "🩸",
    kind: "permanent",
    cost: 55,
    effect: { popGrowthMult: 0.20 },
  },
  {
    id: "ritual_silent_hour",
    name: "The Silent Hour",
    desc: "Temporary (600s): +50% production. Reset on prestige.",
    icon: "🌌",
    kind: "temporary",
    cost: 30,
    durationSec: 600,
    effect: { productionMult: 0.50 },
  },
  {
    id: "ritual_fountain",
    name: "Fountain of Divinity",
    desc: "Temporary (300s): +1 Divinity per second while active.",
    icon: "⛲",
    kind: "temporary",
    cost: 25,
    durationSec: 300,
    effect: { divinityPerSec: 1 },
  },
  {
    id: "ritual_grand_mystery",
    name: "The Grand Mystery",
    desc: "Temporary (1200s): +30% all production, +1 Divinity/sec.",
    icon: "🌀",
    kind: "temporary",
    cost: 120,
    durationSec: 1200,
    effect: { productionMult: 0.30, divinityPerSec: 1 },
  },
];

export const RITUAL_MAP: Record<string, Ritual> = Object.fromEntries(
  RITUALS.map((r) => [r.id, r])
);

// ----- Scripts -----
// Toggleable automation. Each script performs an automated action while on.
export interface Script {
  id: string;
  name: string;
  desc: string;
  icon: string;
  intervalSec: number; // how often it fires
}

export const SCRIPTS: Script[] = [
  {
    id: "script_auto_offering",
    name: "Auto-Libation",
    desc: "Performs the cheapest affordable Offering every 30s.",
    icon: "💧",
    intervalSec: 30,
  },
  {
    id: "script_auto_prestige",
    name: "Cycle of Becoming",
    desc: "Auto-triggers prestige when stage >= Galactic (every 600s max).",
    icon: "🔄",
    intervalSec: 600,
  },
  {
    id: "script_auto_ritual",
    name: "Ritualist",
    desc: "Auto-performs the Silent Hour ritual when affordable & inactive.",
    icon: "📜",
    intervalSec: 120,
  },
  {
    id: "script_auto_blood_pact",
    name: "Crimson Ledger",
    desc: "Auto-performs the cheapest unused Blood Pact every 300s.",
    icon: "🩸",
    intervalSec: 300,
  },
  {
    id: "script_divinity_tithe",
    name: "Divinity Tithe",
    desc: "Drains 1% of all resources per second into +0.5 Divinity/sec.",
    icon: "⚗️",
    intervalSec: 1,
  },
];

export const SCRIPT_MAP: Record<string, Script> = Object.fromEntries(
  SCRIPTS.map((s) => [s.id, s])
);

// ----- Blood Pacts -----
// Sacrifice population for a one-time Divinity payout. Each tier can be used
// at most once per run. Using all 4 tiers unlocks Layer 4 (Genesis).
export interface BloodPactTier {
  id: string;
  name: string;
  desc: string;
  icon: string;
  popCost: number; // population sacrificed
  divinityGain: number; // Divinity gained
}

export const BLOOD_PACTS: BloodPactTier[] = [
  {
    id: "pact_minor",
    name: "The Minor Pact",
    desc: "Sacrifice 25 population for 30 Divinity.",
    icon: "🩸",
    popCost: 25,
    divinityGain: 30,
  },
  {
    id: "pact_lesser",
    name: "The Lesser Pact",
    desc: "Sacrifice 100 population for 120 Divinity.",
    icon: "🗡️",
    popCost: 100,
    divinityGain: 120,
  },
  {
    id: "pact_greater",
    name: "The Greater Pact",
    desc: "Sacrifice 500 population for 750 Divinity.",
    icon: "⚔️",
    popCost: 500,
    divinityGain: 750,
  },
  {
    id: "pact_grand",
    name: "The Grand Pact",
    desc: "Sacrifice 2000 population for 4000 Divinity.",
    icon: "💀",
    popCost: 2000,
    divinityGain: 4000,
  },
];

export const BLOOD_PACT_MAP: Record<string, BloodPactTier> = Object.fromEntries(
  BLOOD_PACTS.map((p) => [p.id, p])
);

// ----- Helpers -----

/**
 * Aggregated production bonus from all active (permanent or currently-active
 * temporary) rituals. Returns an additive multiplier (e.g. 0.10 = +10%).
 *
 * Permanent rituals are keyed by `purchasedRituals[id] === true`.
 * Temporary rituals are keyed by `activeTemporaryRituals[id] = remainingSec`.
 */
export function activeRitualProductionBonus(
  purchasedRituals: Record<string, boolean>,
  activeTemporaryRituals: Record<string, number>
): number {
  let bonus = 0;
  for (const r of RITUALS) {
    if (r.kind === "permanent") {
      if (purchasedRituals[r.id]) bonus += r.effect.productionMult || 0;
    } else {
      // Temporary: only counts while remaining time > 0
      if ((activeTemporaryRituals[r.id] || 0) > 0) {
        bonus += r.effect.productionMult || 0;
      }
    }
  }
  return bonus;
}

/**
 * Total cap bonus from all active rituals.
 */
export function activeRitualCapBonus(
  purchasedRituals: Record<string, boolean>,
  activeTemporaryRituals: Record<string, number>
): number {
  let bonus = 0;
  for (const r of RITUALS) {
    if (r.kind === "permanent") {
      if (purchasedRituals[r.id]) bonus += r.effect.capMult || 0;
    } else {
      if ((activeTemporaryRituals[r.id] || 0) > 0) bonus += r.effect.capMult || 0;
    }
  }
  return bonus;
}

/**
 * Total EP bonus from all active rituals.
 */
export function activeRitualEpBonus(
  purchasedRituals: Record<string, boolean>,
  activeTemporaryRituals: Record<string, number>
): number {
  let bonus = 0;
  for (const r of RITUALS) {
    if (r.kind === "permanent") {
      if (purchasedRituals[r.id]) bonus += r.effect.epMult || 0;
    } else {
      if ((activeTemporaryRituals[r.id] || 0) > 0) bonus += r.effect.epMult || 0;
    }
  }
  return bonus;
}

/**
 * Total population-growth bonus from all active rituals.
 */
export function activeRitualPopBonus(
  purchasedRituals: Record<string, boolean>,
  activeTemporaryRituals: Record<string, number>
): number {
  let bonus = 0;
  for (const r of RITUALS) {
    if (r.kind === "permanent") {
      if (purchasedRituals[r.id]) bonus += r.effect.popGrowthMult || 0;
    } else {
      if ((activeTemporaryRituals[r.id] || 0) > 0) bonus += r.effect.popGrowthMult || 0;
    }
  }
  return bonus;
}

/**
 * Total Divinity per second generated by active temporary rituals + the
 * Divinity Tithe script (if enabled).
 */
export function transcendenceDivinityPerSecond(
  activeTemporaryRituals: Record<string, number>,
  titheScriptActive: boolean
): number {
  let total = 0;
  for (const r of RITUALS) {
    if (r.kind === "temporary" && (activeTemporaryRituals[r.id] || 0) > 0) {
      total += r.effect.divinityPerSec || 0;
    }
  }
  if (titheScriptActive) total += 0.5;
  return total;
}

/**
 * Returns true when all 4 blood pact tiers have been used at least once
 * (i.e. Layer 4 unlock condition).
 */
export function allBloodPactsUsed(
  used: Record<string, boolean>
): boolean {
  return BLOOD_PACTS.every((p) => used[p.id]);
}

/**
 * Returns the actual Divinity gain for an offering at a given repeat count
 * (scales by repeatMult each repeat).
 */
export function offeringDivinityAtRepeat(offering: Offering, repeats: number): number {
  return Math.floor(offering.divinityGain * Math.pow(offering.repeatMult, repeats));
}
