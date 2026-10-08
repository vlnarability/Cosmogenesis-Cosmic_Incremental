// Rituals — Layer 3 (Transcendence) — expensive one-time divine interventions.
//
// Where Offerings convert matter into Divinity, Rituals spend that Divinity on
// sharp, deliberate acts of will. Each ritual is a powerful one-shot emergency
// tool — stabilize a collapsing stage, force open a future unlock, resolve a
// pressure spike, or pour a short-term surge through every system.
//
// Rituals are expensive (8-20 Divinity) and bound by a per-run cooldown: once
// performed, that ritual cannot be performed again until the next prestige.
// This makes them tools of last resort — a Ritual Surge used in the first
// thirty seconds is wasted; used at the moment the run would otherwise die,
// it becomes legend.
//
// Effect types:
//   - surge     : temporary production multiplier for a duration
//   - stabilize : set happiness to a minimum (raise it if below the floor)
//   - unlock    : instantly research the cheapest available tech (no resource cost)
//   - resolve   : instantly resolve the active event (picks the safer option)
//   - shield    : suppress negative events for a duration (Divine Shield)
//   - pop_boom  : instantly add population

export type RitualEffectType =
  | "surge"
  | "stabilize"
  | "unlock"
  | "resolve"
  | "shield"
  | "pop_boom";

export interface RitualEffect {
  type: RitualEffectType;
  /** Short user-facing description of what the ritual does mechanically. */
  description: string;
  /** For `surge`: production multiplier during the surge (e.g. 2 = 2× production). */
  surgeMult?: number;
  /** For `surge`: surge duration in seconds. */
  surgeDuration?: number;
  /** For `stabilize`: minimum happiness floor applied (raises happiness if below). */
  stabilizeHappiness?: number;
  /** For `resolve`: instantly clear the active event (auto-picks safer option). */
  clearEvent?: boolean;
  /** For `shield`: duration in seconds of divine-shield event suppression. */
  shieldDuration?: number;
  /** For `pop_boom`: instant population gain. */
  popGain?: number;
}

export interface RitualDef {
  /** Stable machine id. */
  id: string;
  /** Display name. */
  name: string;
  /** Mythic-tone description of what the ritual evokes. */
  desc: string;
  /** Emoji icon for the card. */
  icon: string;
  /** Divinity cost to perform. */
  divinityCost: number;
  /** One-time use per run (or per prestige). After performing, the ritual is on
   *  cooldown until the player prestiges. */
  oneTimePerRun: boolean;
  /** The mechanical effect applied when the ritual is performed. */
  effect: RitualEffect;
}

// ============================================================
// Ritual effect metadata — used by the modal to show a colored
// tag for each effect type.
// ============================================================

export const RITUAL_EFFECT_INFO: Record<
  RitualEffectType,
  { label: string; color: string; icon: string }
> = {
  surge: { label: "Surge", color: "#fbbf24", icon: "⚡" },
  stabilize: { label: "Stabilize", color: "#34d399", icon: "⚖️" },
  unlock: { label: "Unlock", color: "#60a5fa", icon: "🔓" },
  resolve: { label: "Resolve", color: "#c084fc", icon: "🛡️" },
  shield: { label: "Shield", color: "#a78bfa", icon: "✨" },
  pop_boom: { label: "Boom", color: "#84cc16", icon: "👥" },
};

// ============================================================
// The 6 rituals.
// ============================================================

export const RITUALS: RitualDef[] = [
  {
    id: "production_surge",
    name: "Production Surge",
    desc: "The god exhales. Every forge, every pump, every thinking organ fires at once.",
    icon: "⚡",
    divinityCost: 10,
    oneTimePerRun: true,
    effect: {
      type: "surge",
      description: "2× production for 60 seconds",
      surgeMult: 2,
      surgeDuration: 60,
    },
  },
  {
    id: "stability_rite",
    name: "Stability Rite",
    desc: "A whispered word steadies the people. Sorrow lifts; the harvest brightens.",
    icon: "⚖️",
    divinityCost: 8,
    oneTimePerRun: true,
    effect: {
      type: "stabilize",
      description: "Set happiness to a minimum of 75",
      stabilizeHappiness: 75,
    },
  },
  {
    id: "crisis_resolve",
    name: "Crisis Resolve",
    desc: "The god's hand closes over the moment of danger. The threat is unmade.",
    icon: "🛡️",
    divinityCost: 15,
    oneTimePerRun: true,
    effect: {
      type: "resolve",
      description: "Instantly resolve the current event (picks the safer option)",
      clearEvent: true,
    },
  },
  {
    id: "knowledge_burst",
    name: "Knowledge Burst",
    desc: "The god strikes the surface of understanding. Insight leaps unbidden.",
    icon: "🔓",
    divinityCost: 12,
    oneTimePerRun: true,
    effect: {
      type: "unlock",
      description: "Instantly research the cheapest available tech (no resource cost)",
    },
  },
  {
    id: "population_boom",
    name: "Population Boom",
    desc: "The god blesses the womb. Numbers swell; the future leans forward.",
    icon: "👥",
    divinityCost: 10,
    oneTimePerRun: true,
    effect: {
      type: "pop_boom",
      description: "+20 population instantly",
      popGain: 20,
    },
  },
  {
    id: "divine_shield",
    name: "Divine Shield",
    desc: "The god spreads its hand over creation. For a time, no ill wind may enter.",
    icon: "✨",
    divinityCost: 20,
    oneTimePerRun: true,
    effect: {
      type: "shield",
      description: "No negative events for 120 seconds",
      shieldDuration: 120,
    },
  },
];

export const RITUAL_MAP: Record<string, RitualDef> = Object.fromEntries(
  RITUALS.map((r) => [r.id, r])
);

export function getRitual(id: string): RitualDef | undefined {
  return RITUAL_MAP[id];
}

/**
 * Count total rituals available — used for the mastery progress meter.
 */
export function totalRitualCount(): number {
  return RITUALS.length;
}
