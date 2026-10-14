// ===========================================================================
// LAYER 1 — TRIAL REALMS (LEGACY — REMOVED)
// ===========================================================================
// Superseded by the run-modifier challenges in `challenges.ts`. The 10 trials
// are: Discontent, Plague, Rival, Mutation, Gold Rush, Taxman, Minimalist,
// Black Market, Gambler, Philosopher. See `challenges.ts` for the active system.
// ===========================================================================

export const TRIAL_REALMS: never[] = [];
export const TRIAL_REALM_MAP: Record<string, never> = {};
export const PLAYABLE_REALM_IDS: string[] = [];
export const COMING_SOON_REALM_IDS: string[] = [];

export type TrialRealmStatus = "available" | "inProgress" | "completed" | "comingSoon";
export interface TrialRealmDef { id: string; name: string; }

export function makeDefaultRealmState(_realmId: string): Record<string, never> { return {}; }
export function trialRealmRewardBonus(_completed: Record<string, boolean>): { prodMult: number; capMult: number; popMult: number } {
  return { prodMult: 0, capMult: 0, popMult: 0 };
}
