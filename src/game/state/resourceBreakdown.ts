// ResourceBreakdown — pure helper that computes a per-resource net rate
// (production − upkeep) and a per-system source list for hover tooltips
// on the ResourceBar.
//
// Scope: this is a NOMINAL breakdown — it computes what each owned
// system WOULD produce/consume per second at full efficiency, ignoring
// the cap-aware idling logic in the main tick (a system whose outputs
// are all at cap idles to 0 production in the real tick, but still
// shows its nominal rate here so the player can plan). It also
// ignores tech / archetype / stage multipliers — those are applied
// in the real tick and would double-count if naively recomputed here.
//
// The player sees the EFFECTIVE rate in the real resource delta (which
// already accounts for caps + multipliers); this tooltip explains the
// CONTRIBUTION STRUCTURE — which systems are responsible for the rate.

import type { GameState } from "./types";
import { SYSTEM_MAP } from "../data/systems";
import { STAGES } from "../data/stages";

export interface ResourceSource {
  systemId: string;
  systemName: string;
  systemIcon: string;
  /** Per-second rate contributed by this system (positive = production,
   * negative = upkeep). Already scaled by owned count. */
  amount: number;
  kind: "produce" | "upkeep";
  /** Whether the system is currently disabled by the player. */
  disabled: boolean;
  /** Whether the system is at cap-idle (all its outputs are at capacity). */
  idleByCap: boolean;
}

export interface ResourceBreakdownEntry {
  /** Net nominal rate (production − upkeep) for this resource. */
  net: number;
  /** Per-system source list (produces + upkeep combined). */
  sources: ResourceSource[];
}

export type ResourceBreakdown = Record<string, ResourceBreakdownEntry>;

/**
 * Compute a per-resource breakdown for the ResourceBar hover tooltip.
 * Pure function — does not mutate state. Returns a fresh object.
 */
export function computeResourceBreakdown(s: GameState): ResourceBreakdown {
  const out: ResourceBreakdown = {};
  const ensure = (r: string): ResourceBreakdownEntry => {
    if (!out[r]) out[r] = { net: 0, sources: [] };
    return out[r];
  };

  const currentStageId = STAGES[s.stageIndex]?.id;
  const capacities = s.capacities || {};
  const resources = s.resources || {};

  for (const [sysId, count] of Object.entries(s.ownedSystems || {})) {
    if (!count) continue;
    const sys = SYSTEM_MAP[sysId];
    if (!sys) continue;
    // Skip tech-locked systems (they shouldn't be producing — they
    // shouldn't even be owned, but defensive).
    if (sys.requiredTech && !s.technologies?.[sys.requiredTech]) continue;

    const manuallyEnabled = s.systemEnabled?.[sysId] !== false;
    const disabled = !manuallyEnabled;

    // Cap-idle check: if all output resources are at cap, the system idles.
    const outputsCapped =
      Object.keys(sys.produces).length > 0 &&
      Object.keys(sys.produces).every((r) => {
        const cap = capacities[r] || 0;
        return (resources[r] || 0) >= cap - 0.01;
      });
    const idleByCap = !disabled && outputsCapped;

    // Production
    for (const [r, v] of Object.entries(sys.produces || {})) {
      const entry = ensure(r);
      const amount = (v as number) * count;
      // If disabled or cap-idle, the system contributes 0 actual rate.
      const effectiveAmount = (disabled || idleByCap) ? 0 : amount;
      entry.net += effectiveAmount;
      entry.sources.push({
        systemId: sysId,
        systemName: sys.name,
        systemIcon: sys.icon,
        amount: effectiveAmount,
        kind: "produce",
        disabled,
        idleByCap,
      });
    }
    // Upkeep — disabled systems consume no upkeep (matches real tick).
    if (!disabled && sys.upkeep) {
      for (const [r, v] of Object.entries(sys.upkeep)) {
        const entry = ensure(r);
        const amount = -((v as number) * count);
        entry.net += amount;
        entry.sources.push({
          systemId: sysId,
          systemName: sys.name,
          systemIcon: sys.icon,
          amount,
          kind: "upkeep",
          disabled,
          idleByCap: false,
        });
      }
    }
  }

  // Sort sources: produces (descending) then upkeep (ascending) so the
  // biggest contributors appear at the top of the tooltip.
  for (const r of Object.keys(out)) {
    out[r].sources.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "produce" ? -1 : 1;
      return b.amount - a.amount;
    });
  }

  // Mark resources with no contributions at all (avoids showing an empty
  // tooltip — the chip just won't have a hover interaction).
  return out;
}

/** Format a per-second rate for compact display (e.g. +2.5/s, −0.3/s). */
export function formatRate(n: number): string {
  if (Math.abs(n) < 0.01) return "0/s";
  const sign = n > 0 ? "+" : "−";
  return `${sign}${Math.abs(n).toFixed(1)}/s`;
}
