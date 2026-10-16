// ===========================================================================
// QUICK WINS — ACTIVE ABILITIES (REMOVED — save-compat stubs only)
// ===========================================================================
// Active abilities were cut from the game (Task REMOVE-ABILITIES-REPLACE-
// CHALLENGES) — they were cluttering the screen and overwhelming the player.
//
// The `ActiveAbilityDef` type and `ActiveAbilityEffectKind` union are kept
// here purely so existing TypeScript imports and old saves continue to type-
// check. The runtime arrays/maps are intentionally empty. The store still
// carries `activeAbilityCooldowns` and `activeAbilityEffects` for save-compat
// (old saves may have lingering timers); the tick decay self-cleans them.
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
  layerId: string;     // prestige layer this ability belongs to
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

// REMOVED — no active abilities ship with the game anymore.
export const ACTIVE_ABILITIES: ActiveAbilityDef[] = [];
export const ACTIVE_ABILITY_MAP: Record<string, ActiveAbilityDef> = {};

/** Returns the active ability for a given prestige layer id, or null.
 *  REMOVED — always returns null. Kept for save-compat imports. */
export function abilityForLayer(_layerId: string): ActiveAbilityDef | null {
  return null;
}
