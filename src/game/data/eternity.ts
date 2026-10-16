// ===========================================================================
// LAYER 10 — ETERNITY (GENESIS ENGINE)
// ===========================================================================
// The canonical L10 system is the Genesis Engine (crucible + divine relics +
// 100 archetypes) — see `./genesisEngine.ts`. This file holds the ending-screen
// data + the Cosmic Boon bonus (which still applies after a successful
// "Explore another Dimension" reset).
// ===========================================================================

// ----- Ending Choices (the ending-screen flow) -----
// The ending screen appears after discovering all 100 archetypes. The two
// buttons ("Continue in this realm" / "Explore another Dimension") map to
// these endings.
export type EndingChoiceId = "preserve" | "reset";

export interface EndingChoice {
  id: EndingChoiceId;
  name: string;
  icon: string;
  desc: string;
}

export const ENDING_CHOICES: EndingChoice[] = [
  {
    id: "preserve",
    name: "Continue in this Realm",
    icon: "🌠",
    desc: "Remain in your current cosmos. Continue playing with all bonuses intact and chase further goals.",
  },
  {
    id: "reset",
    name: "Explore another Dimension",
    icon: "🔄",
    desc: "Reset the universe and begin a fresh cycle. Gain a permanent Cosmic Boon (+10% all production) that stacks with each reset.",
  },
];

export const ENDING_CHOICE_MAP: Record<EndingChoiceId, EndingChoice> = Object.fromEntries(
  ENDING_CHOICES.map((e) => [e.id, e])
) as Record<EndingChoiceId, EndingChoice>;

// ----- Cosmic Boon (still used by ending-screen "Explore another Dimension") -----
/**
 * Cosmic Boon: +10% all production per "Explore another Dimension" reset.
 */
export function cosmicBoonBonus(stacks: number): number {
  return stacks * 0.10;
}

// ----- Eternity completion check (based on discovered archetypes) -----
/**
 * Layer 10 is complete when the player has discovered ALL 100 archetypes.
 */
export function isEternityComplete(
  chosenEnding: string | null | undefined,
  _universeRules?: Array<string | null>,
  discoveredArchetypes?: Record<string, boolean>
): boolean {
  if (chosenEnding === "preserve") return true;
  if (discoveredArchetypes) {
    const count = Object.values(discoveredArchetypes).filter(Boolean).length;
    if (count >= 100) return true;
  }
  return false;
}
