// ===========================================================================
// LAYER 1 — TRIAL REALMS (LEGACY — REMOVED)
// ===========================================================================
// This file used to define 10 standalone mini-games (Realm of Growth, Famine,
// Discontent, Ignorance, Stagnation, Weakness, Late Bloom, Purity, Ascetic,
// Swiftness). They have been superseded by the run-modifier challenges in
// `challenges.ts`. The trialRealm* state fields and actions remain as no-op
// stubs in the store for save-shape compatibility.
//
// See `challenges.ts` for the active L1 system (10 run modifiers: Pacifist,
// Speed Demon, Hermit, Hoarder, Technophobe, Minimalist, Warmonger, Time
// Trial, Catalyst, Endurance).
// ===========================================================================

// Empty stubs retained so any external imports don't break the build. The
// canonical L1 trials are now `CHALLENGES` from `challenges.ts`.
export const TRIAL_REALMS: never[] = [];
export const TRIAL_REALM_MAP: Record<string, never> = {};
export const PLAYABLE_REALM_IDS: string[] = [];
export const COMING_SOON_REALM_IDS: string[] = [];

// Legacy type aliases kept for any consumer that still imports them.
export type TrialRealmStatus = "available" | "inProgress" | "completed" | "comingSoon";
export interface TrialRealmDef {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  mechanic: string;
  goal: string;
  reward: string;
  status: TrialRealmStatus;
  durationSec?: number;
}

// makeDefaultRealmState — kept as a no-op stub for save-compat callers.
export function makeDefaultRealmState(_realmId: string): Record<string, never> {
  return {};
}

// trialRealmRewardBonus — kept as a no-op stub for save-compat callers. Returns
// zero bonuses (no trial realm rewards apply anymore).
export function trialRealmRewardBonus(
  _completed: Record<string, boolean>
): { prodMult: number; capMult: number; popMult: number } {
  return { prodMult: 0, capMult: 0, popMult: 0 };
}
