"use client";

// GovernmentChoiceModal — Tribal stage's government picker.
//
// FIRES WHEN: player researches the `political_theory` prerequisite tech.
// The modal shows all available governments (base playstyle governments +
// archetype-specific ones). For each: "what the people want" (advantages)
// vs "what you're headed towards" (disadvantages) + an "Enact" button.
//
// ON PICK: `chooseGovernment(govId)` is called, which sets `pendingGovernment`
// AND applies a -25 happiness hit (the disruption of new governance). The
// player must then recover happiness to ≥50 to evolve to Civ (enforced by
// the `requiresHappinessThreshold` gate).
//
// Per user: 'an expensive prerequisite tech that unlocks the government tab
// which shows what the people want versus what you are headed towards with
// a button to enact government and a description of what will happen and
// what it does. The player can select any of the base governments or their
// archetype specific one.'

import { useGameStore } from "@/game/state/store";
import { GOVERNMENTS, ARCHETYPE_GOVERNMENT_MAP } from "@/game/data/governments";
import { ARCHETYPE_MAP } from "@/game/data/archetypes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, Landmark, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function GovernmentChoiceModal() {
  const showGovernmentChoice = useGameStore((s) => s.showGovernmentChoice);
  const setShowGovernmentChoice = useGameStore((s) => s.setShowGovernmentChoice);
  const chooseGovernment = useGameStore((s) => s.chooseGovernment);
  const pendingGovernment = useGameStore((s) => s.pendingGovernment);
  const activeGovernment = useGameStore((s) => s.activeGovernment);
  const lockedArchetype = useGameStore((s) => s.lockedArchetype);

  // The player's archetype-specific government (if any). Shown alongside
  // the base playstyle governments. Per user: 'The player can select any
  // of the base governments or their archetype specific one.'
  const archetypeGovId = lockedArchetype ? ARCHETYPE_GOVERNMENT_MAP[lockedArchetype] : undefined;

  // Show all base governments + the player's archetype government (if any).
  // The base governments are the playstyle ones (totalitarian, technocracy,
  // etc.) — they don't have a requiredArchetype field on GovernmentDef.
  // The archetype government is identified via ARCHETYPE_GOVERNMENT_MAP.
  // We show base governments first, then the archetype government tagged.
  const baseGovs = GOVERNMENTS.filter((g) => g.id !== archetypeGovId);
  const archetypeGov = archetypeGovId ? GOVERNMENTS.find((g) => g.id === archetypeGovId) : undefined;
  const availableGovs = archetypeGov ? [...baseGovs, archetypeGov] : baseGovs;

  return (
    <Dialog open={showGovernmentChoice} onOpenChange={(v) => !v && setShowGovernmentChoice(false)}>
      <DialogContent className="max-w-3xl glass-strong max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Landmark className="w-5 h-5 text-amber-400" />
            A Framework of Governance
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Political theory is codified. The tribe must now decide how it will be ruled. Each framework carries <span className="font-semibold text-foreground">what the people want</span> — and <span className="font-semibold text-foreground">what you're headed towards</span>. The transition will disrupt society (happiness -25); you must recover to ≥50 happiness to evolve to Civilization.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          {availableGovs.map((g) => {
            const isChosen = pendingGovernment === g.id || activeGovernment === g.id;
            const isArchGov = g.id === archetypeGovId;
            return (
              <div
                key={g.id}
                className={cn(
                  "rounded-lg border p-3 transition-all",
                  isChosen
                    ? "border-amber-400/60 bg-amber-500/10"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm">{g.name}</span>
                      {isArchGov && (
                        <span className="text-[0.55rem] px-1 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-wide">
                          {lockedArchetype ? ARCHETYPE_MAP[lockedArchetype]?.name : "Archetype"}
                        </span>
                      )}
                    </div>
                  </div>
                  {isChosen && (
                    <span className="text-[0.6rem] text-amber-400 font-mono uppercase tracking-wide flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3" />
                      Chosen
                    </span>
                  )}
                </div>
                <p className="text-[0.7rem] text-muted-foreground italic leading-snug mb-2">
                  {g.desc}
                </p>
                {/* What the people want (advantages) */}
                <div className="mb-1.5">
                  <div className="text-[0.6rem] uppercase tracking-wide text-emerald-400 mb-0.5 flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5" />
                    What the people want
                  </div>
                  <div className="text-[0.65rem] text-emerald-300/90 leading-snug">
                    {g.advantages.join(" · ")}
                  </div>
                </div>
                {/* What you're headed towards (disadvantages) */}
                {g.disadvantages.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[0.6rem] uppercase tracking-wide text-rose-400 mb-0.5 flex items-center gap-1">
                      <TrendingDown className="w-2.5 h-2.5" />
                      What you're headed towards
                    </div>
                    <div className="text-[0.65rem] text-rose-300/90 leading-snug">
                      {g.disadvantages.join(" · ")}
                    </div>
                  </div>
                )}
                {/* Enact button */}
                <button
                  onClick={() => {
                    chooseGovernment(g.id);
                    setShowGovernmentChoice(false);
                  }}
                  disabled={isChosen}
                  className={cn(
                    "w-full text-[0.65rem] font-mono uppercase tracking-wide py-1.5 rounded border transition-colors",
                    isChosen
                      ? "border-amber-400/40 text-amber-400/60 cursor-not-allowed"
                      : "border-amber-400/40 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400/80"
                  )}
                >
                  {isChosen ? "Enacted" : `Enact ${g.name}`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-[0.65rem] text-muted-foreground/70 italic text-center">
          You may change your choice before evolving — the happiness hit applies only on first enactment.
        </div>
      </DialogContent>
    </Dialog>
  );
}
