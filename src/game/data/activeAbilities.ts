// ===========================================================================
// QUICK WINS — ACTIVE ABILITIES (one per prestige layer)
// ===========================================================================
// Each unlocked prestige layer grants one clickable active ability. Click to
// trigger an instant effect (or temporary buff); the ability then enters a
// cooldown before it can be used again.
// ===========================================================================

export type ActiveAbilityEffectKind =
  | "instant_pop"        // +N population instantly
  | "instant_divinity"   // +N Divinity instantly
  | "temp_surge"         // ×3 production for N seconds
  | "instant_genesis_seed" // +1 Genesis Seed
  | "reduce_heresy"      // -N heresy instantly
  | "temp_overclock";    // ×2 all prestige-layer bonuses for N seconds

export interface ActiveAbilityDef {
  id: string;          // matches prestige layer id (e.g. "evolution", "enlightenment", ...)
  layerId: string;    // prestige layer this ability belongs to
  name: string;
  desc: string;
  icon: string;
  cooldownSec: number;
  effect: {
    kind: ActiveAbilityEffectKind;
    magnitude?: number; // for instant_pop / instant_divinity / reduce_heresy
    durationSec?: number; // for temp_surge / temp_overclock (also used to set the active effect timer)
  };
}

export const ACTIVE_ABILITIES: ActiveAbilityDef[] = [
  {
    id: "ability_inspire",
    layerId: "evolution",
    name: "Inspire",
    desc: "Instantly gain +5 population.",
    icon: "✨",
    cooldownSec: 60,
    effect: { kind: "instant_pop", magnitude: 5 },
  },
  {
    id: "ability_divine_insight",
    layerId: "enlightenment",
    name: "Divine Insight",
    desc: "Instantly gain +10 Divinity.",
    icon: "👁️",
    cooldownSec: 30,
    effect: { kind: "instant_divinity", magnitude: 10 },
  },
  {
    id: "ability_surge",
    layerId: "transcendence",
    name: "Surge",
    desc: "×3 production for 10 seconds.",
    icon: "⚡",
    cooldownSec: 90,
    effect: { kind: "temp_surge", durationSec: 10 },
  },
  {
    id: "ability_seed_bloom",
    layerId: "genesis",
    name: "Seed Bloom",
    desc: "Instantly gain +1 Genesis Seed (awaken dormant seeds).",
    icon: "🥚",
    cooldownSec: 120,
    effect: { kind: "instant_genesis_seed", magnitude: 1 },
  },
  {
    id: "ability_smite_heretics",
    layerId: "apotheosis",
    name: "Smite Heretics",
    desc: "Reduce heresy by 25 instantly.",
    icon: "⚔️",
    cooldownSec: 45,
    effect: { kind: "reduce_heresy", magnitude: 25 },
  },
  {
    id: "ability_overclock",
    layerId: "singularity",
    name: "Overclock",
    desc: "×2 all prestige-layer bonuses for 15 seconds.",
    icon: "🌀",
    cooldownSec: 90,
    effect: { kind: "temp_overclock", durationSec: 15 },
  },
];

export const ACTIVE_ABILITY_MAP: Record<string, ActiveAbilityDef> = Object.fromEntries(
  ACTIVE_ABILITIES.map((a) => [a.layerId, a])
);

/** Returns the active ability for a given prestige layer id, or null. */
export function abilityForLayer(layerId: string): ActiveAbilityDef | null {
  return ACTIVE_ABILITY_MAP[layerId] || null;
}
