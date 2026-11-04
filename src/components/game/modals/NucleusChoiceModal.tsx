"use client";

// NucleusChoiceModal — Cell stage's lineage picker (Round A).
//
// FIRES WHEN: the player attempts to buy a drift organelle (a cell-stage
// system with grantsAffinity) or a drift mutation (cell tech with
// grantsAffinity) WITHOUT having chosen a nucleus yet. buySystem/buyTech
// block the purchase + set showNucleusChoice=true, opening this modal.
//
// ON PICK: the chosen nucleus system (nucleus / nucleoid_region /
// nucleomorph / nuclear_body) is auto-built (ownedSystems[id]=1) + initial
// drift toward the pool's flagship is seeded. The other 3 are locked via
// exclusiveWith (you can only own one). The choice is permanent (one-shot).
//
// POOL LOCK: once chosen, all OTHER cell-stage drift systems/techs must
// grant drift toward an archetype IN the chosen pool (enforced in
// buySystem/buyTech). This is the "choosing a nucleus restricts any
// organelle/mutation that doesn't match that pool" rule.

import { useGameStore } from "@/game/state/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Dna, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NUCLEUS_POOLS } from "@/game/data/nucleusPools";
import { ARCHETYPE_MAP } from "@/game/data/archetypes";

export function NucleusChoiceModal() {
  const showNucleusChoice = useGameStore((s) => s.showNucleusChoice);
  const setShowNucleusChoice = useGameStore((s) => s.setShowNucleusChoice);
  const chooseNucleusPath = useGameStore((s) => s.chooseNucleusPath);
  const nucleusChoice = useGameStore((s) => s.nucleusChoice);

  // Defensive — if already chosen, don't show (prevents resurrection on HMR).
  if (nucleusChoice) return null;

  return (
    <Dialog open={showNucleusChoice} onOpenChange={(v) => !v && setShowNucleusChoice(false)}>
      <DialogContent className="max-w-3xl glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Dna className="w-5 h-5 text-primary" />
            The First Lineage
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Your cell's nuclear architecture determines which lineage of life you can drift toward. The four paths are <span className="font-semibold text-foreground">mutually exclusive</span> — once a nucleus form is chosen, the others are locked forever, and every organelle + mutation you build must drift toward an archetype within your chosen pool. This is the first + most consequential archetype decision of the run.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {NUCLEUS_POOLS.map((pool) => (
            <button
              key={pool.id}
              onClick={() => chooseNucleusPath(pool.id)}
              className="group text-left rounded-lg border p-4 transition-all hover:scale-[1.01] hover:shadow-lg"
              style={{
                borderColor: `${pool.color}40`,
                background: `${pool.color}08`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xl"
                  style={{ background: `${pool.color}18`, color: pool.color }}
                >
                  {pool.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm" style={{ color: pool.color }}>
                    {pool.name}
                  </div>
                  <div className="text-[0.65rem] text-muted-foreground italic truncate">
                    {pool.subtitle}
                  </div>
                </div>
              </div>
              <p className="text-[0.7rem] text-muted-foreground leading-relaxed mb-2">
                {pool.description}
              </p>
              {/* S2 — Archetype pool preview: glyphs arranged in a circular
                  layout with the flagship highlighted. Each archetype shows
                  its glyph + color; the flagship gets a ring + larger size. */}
              <div className="flex items-center gap-3 mb-2">
                {/* Circular glyph arrangement */}
                <div className="relative w-20 h-20 shrink-0" aria-hidden>
                  {pool.archetypes.map((archId, i) => {
                    const def = ARCHETYPE_MAP[archId];
                    const isFlagship = archId === pool.flagship;
                    const angle = (i / pool.archetypes.length) * Math.PI * 2 - Math.PI / 2;
                    const radius = isFlagship ? 0 : 28;
                    const x = 40 + Math.cos(angle) * radius;
                    const y = 40 + Math.sin(angle) * radius;
                    return (
                      <span
                        key={archId}
                        className="absolute flex items-center justify-center rounded-full transition-transform"
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                          transform: "translate(-50%, -50%)",
                          width: isFlagship ? "24px" : "18px",
                          height: isFlagship ? "24px" : "18px",
                          fontSize: isFlagship ? "14px" : "10px",
                          color: def?.color || pool.color,
                          background: isFlagship ? `${pool.color}20` : `${pool.color}08`,
                          border: isFlagship ? `1.5px solid ${pool.color}` : `1px solid ${pool.color}40`,
                          opacity: def ? 1 : 0.4,
                        }}
                        title={def ? `${def.name} — ${def.blurb}` : `${archId} (unlocks later)`}
                      >
                        {def?.glyph || "?"}
                      </span>
                    );
                  })}
                </div>
                {/* Archetype name list (compact, 2 columns) */}
                <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {pool.archetypes.map((archId) => {
                    const def = ARCHETYPE_MAP[archId];
                    const isFlagship = archId === pool.flagship;
                    return (
                      <span
                        key={archId}
                        className="text-[0.55rem] flex items-center gap-1"
                        style={{ color: def ? def.color : "var(--muted-foreground)", opacity: def ? 1 : 0.5 }}
                        title={def ? def.name : archId}
                      >
                        <span className="text-[0.7rem]">{def?.glyph || "?"}</span>
                        <span className={cn("truncate", isFlagship && "font-bold")}>{def?.name || archId}</span>
                        {isFlagship && <span className="text-amber-400 text-[0.5rem]">★</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
              {/* Flagship + effects summary */}
              <div className="space-y-0.5">
                <div className="text-[0.65rem] flex items-center gap-1.5" style={{ color: pool.color }}>
                  <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                  <span className="font-medium">
                    Initial drift: {ARCHETYPE_MAP[pool.flagship]?.name || pool.flagship}
                  </span>
                </div>
                <div className="text-[0.65rem] flex items-center gap-1.5" style={{ color: pool.color }}>
                  <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                  <span className="font-medium">{pool.archetypes.length} archetypes in pool</span>
                </div>
              </div>
              <div
                className="mt-3 text-[0.65rem] font-mono uppercase tracking-wide text-center py-1.5 rounded border transition-colors"
                style={{ borderColor: `${pool.color}40`, color: pool.color }}
              >
                Choose {pool.name}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-[0.65rem] text-muted-foreground/70 italic text-center">
          The choice is permanent. The other nucleus forms will be locked — your lineage is set.
        </div>
      </DialogContent>
    </Dialog>
  );
}
