// Scripts — Layer 3 (Transcendence) — set-and-forget conditional divine behaviors.
//
// Where Rituals are deliberate acts of will and Offerings convert matter to
// Divinity, Scripts are *automation* — divine logic that the god binds into
// the world once, and which fires whenever its condition is met. The player
// no longer needs to babysit a run through every crisis; a purchased Script
// watches for the trigger and acts.
//
// Scripts are purchased once (one-time Divinity cost), and from that moment
// forward they run automatically for every future run. They persist across
// prestige — the design doc calls this "scripts persist as reusable divine logic".
//
// Condition types:
//   - happiness_low   : trigger when happiness drops below `threshold`
//   - resource_low    : trigger when `resourceId` drops below `threshold`
//   - event_active    : trigger when an event is currently offered
//   - population_low  : trigger when population drops below `threshold`
//
// Action types:
//   - boost_happiness   : add `amount` happiness (one-shot, with cooldown)
//   - convert_resource  : convert `amount` of `fromResource` to `toResource`
//   - auto_resolve_event: pick the safer option of the active event
//   - boost_population  : add `amount` population (one-shot, with cooldown)
//   - regenerate_happiness: continuous +`amount`/s happiness while condition holds
//
// One-shot scripts (compassion_engine, resource_converter, guardian_spirit)
// use an internal cooldown to prevent firing every tick — typically 30-60s.
// The Sustainer is continuous: while happiness is below 50, it adds 0.5/s.

import type { ResourceId } from "../state/types";

export type ScriptConditionType =
  | "happiness_low"
  | "resource_low"
  | "event_active"
  | "population_low";

export type ScriptActionType =
  | "boost_happiness"
  | "convert_resource"
  | "auto_resolve_event"
  | "boost_population"
  | "regenerate_happiness";

export interface ScriptCondition {
  type: ScriptConditionType;
  /** Threshold below which the condition triggers (for *_low types). */
  threshold?: number;
  /** Resource to monitor (for `resource_low`). */
  resourceId?: ResourceId;
}

export interface ScriptAction {
  type: ScriptActionType;
  /** For `boost_happiness` / `boost_population`: the amount to add. */
  amount?: number;
  /** For `convert_resource`: source resource to consume. */
  fromResource?: ResourceId;
  /** For `convert_resource`: target resource to gain. The special value "auto"
   *  means "pick the lowest-value resource currently below threshold". */
  toResource?: ResourceId | "auto";
  /** For `convert_resource`: how much of `fromResource` to convert. */
  convertAmount?: number;
}

export interface ScriptDef {
  /** Stable machine id. */
  id: string;
  /** Display name. */
  name: string;
  /** Mythic-tone description of what the script represents. */
  desc: string;
  /** Emoji icon for the card. */
  icon: string;
  /** One-time Divinity purchase cost. */
  divinityCost: number;
  /** Condition that triggers the script. */
  condition: ScriptCondition;
  /** Action to take when the condition is met. */
  action: ScriptAction;
  /** Cooldown in seconds for one-shot scripts (default 60s). 0 = continuous. */
  cooldown?: number;
  /** Whether the script is one-shot (true) or continuous (false). */
  oneShot?: boolean;
}

// ============================================================
// Condition metadata — for the modal's color/tag rendering.
// ============================================================

export const SCRIPT_CONDITION_INFO: Record<
  ScriptConditionType,
  { label: string; color: string; icon: string }
> = {
  happiness_low: { label: "Happiness Low", color: "#fde047", icon: "😟" },
  resource_low: { label: "Resource Low", color: "#fbbf24", icon: "📉" },
  event_active: { label: "Event Active", color: "#c084fc", icon: "⚠️" },
  population_low: { label: "Population Low", color: "#84cc16", icon: "👥" },
};

export const SCRIPT_ACTION_INFO: Record<
  ScriptActionType,
  { label: string; color: string; icon: string }
> = {
  boost_happiness: { label: "Boost Happiness", color: "#fde047", icon: "😊" },
  convert_resource: { label: "Convert Resource", color: "#fbbf24", icon: "🔄" },
  auto_resolve_event: { label: "Auto-Resolve", color: "#c084fc", icon: "🛡️" },
  boost_population: { label: "Boost Population", color: "#84cc16", icon: "👥" },
  regenerate_happiness: { label: "Regenerate", color: "#34d399", icon: "♻️" },
};

// ============================================================
// The 5 scripts.
// ============================================================

export const SCRIPTS: ScriptDef[] = [
  {
    id: "compassion_engine",
    name: "Compassion Engine",
    desc: "When sorrow deepens, a quiet hand reaches out. The god cannot bear to watch its people weep.",
    icon: "💛",
    divinityCost: 15,
    condition: { type: "happiness_low", threshold: 30 },
    action: { type: "boost_happiness", amount: 20 },
    cooldown: 60,
    oneShot: true,
  },
  {
    id: "resource_converter",
    name: "Resource Converter",
    desc: "When the granary empties, the god reaches for what is plenty and folds it into what is needed.",
    icon: "🔄",
    divinityCost: 20,
    condition: { type: "resource_low", threshold: 10 },
    action: { type: "convert_resource", fromResource: "food", toResource: "auto", convertAmount: 50 },
    cooldown: 90,
    oneShot: true,
  },
  {
    id: "crisis_manager",
    name: "Crisis Manager",
    desc: "When the world trembles, the god's hand closes around the moment and steadies it.",
    icon: "🛡️",
    divinityCost: 25,
    condition: { type: "event_active" },
    action: { type: "auto_resolve_event" },
    cooldown: 30,
    oneShot: true,
  },
  {
    id: "guardian_spirit",
    name: "Guardian Spirit",
    desc: "When the people thin, the god breathes new life into the dying breath.",
    icon: "👼",
    divinityCost: 18,
    condition: { type: "population_low", threshold: 10 },
    action: { type: "boost_population", amount: 15 },
    cooldown: 90,
    oneShot: true,
  },
  {
    id: "sustainer",
    name: "Sustainer",
    desc: "A constant trickle of grace, like rain. Where happiness fades, the god sustains it.",
    icon: "♻️",
    divinityCost: 12,
    condition: { type: "happiness_low", threshold: 50 },
    action: { type: "regenerate_happiness", amount: 0.5 },
    oneShot: false,
  },
];

export const SCRIPT_MAP: Record<string, ScriptDef> = Object.fromEntries(
  SCRIPTS.map((s) => [s.id, s])
);

export function getScript(id: string): ScriptDef | undefined {
  return SCRIPT_MAP[id];
}

/**
 * Count total scripts available — used for the script library progress meter.
 */
export function totalScriptCount(): number {
  return SCRIPTS.length;
}
