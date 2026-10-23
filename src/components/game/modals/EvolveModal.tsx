"use client";

import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { SYSTEMS, SYSTEM_MAP } from "@/game/data/systems";
import { TECHS, TECH_MAP } from "@/game/data/techs";
import { ARCHETYPE_MAP, dominantArchetype } from "@/game/data/archetypes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { formatNumber } from "../shared/format";

export function EvolveModal() {
  const showEvolve = useGameStore((s) => s.showEvolve);
  const setShowEvolve = useGameStore((s) => s.setShowEvolve);
  const stageIndex = useGameStore((s) => s.stageIndex);
  const population = useGameStore((s) => s.population);
  const ownedSystems = useGameStore((s) => s.ownedSystems);
  const technologies = useGameStore((s) => s.technologies);
  const resources = useGameStore((s) => s.resources);
  const time = useGameStore((s) => s.time);
  const upgrades = useGameStore((s) => s.upgrades);
  const archetypeAffinity = useGameStore((s) => s.archetypeAffinity);
  const lockedArchetype = useGameStore((s) => s.lockedArchetype);
  // ARCHETYPES-REWORK — which archetypes have ever been locked. Drives
  // the ??? reveal state on the "Lineage Will Lock" warning panel.
  const revealedLineageArchetypes = useGameStore((s) => s.revealedLineageArchetypes || {});
  const evolveStage = useGameStore((s) => s.evolveStage);

  const stage = STAGES[stageIndex];
  const isLocked = !!lockedArchetype;
  const domArch = dominantArchetype(archetypeAffinity);
  const next = STAGES[stageIndex + 1];
  const isFinal = !next;

  const reqs = stage.evolveRequires;
  const evolveBoost = 1 - Math.min(0.30, (upgrades["evolutionary_momentum"] || 0) * 0.05);
  // PER-STAGE-EVOLUTION-COUNT — match evolveStage's logic: count only
  // systems/techs of the CURRENT stage toward the requirement.
  const currentStageId = stage.id;
  const totalSystems = Object.entries(ownedSystems)
    .filter(([id, cnt]) => {
      const sys = SYSTEM_MAP[id];
      return sys && sys.stage === currentStageId && (cnt || 0) > 0;
    })
    .reduce((a, [, c]) => a + (c as number), 0);
  const totalTech = Object.keys(technologies)
    .filter((tid) => TECH_MAP[tid]?.stage === currentStageId)
    .length;
  const score = computeScore(resources, ownedSystems, technologies, population, time);

  const checks = [
    { label: "Population", current: population, need: reqs.minPopulation * evolveBoost },
    { label: "Systems built", current: totalSystems, need: reqs.minSystems * evolveBoost },
    { label: "Technologies", current: totalTech, need: reqs.minTech * evolveBoost },
  ];
  // STAGE-PREREQ-SYSTEMS — additional hard requirement (e.g. Nucleus
  // required to evolve Cell→Creature). Surfaced as an extra check row.
  if (reqs.requiresSystems && reqs.requiresSystems.length > 0) {
    const owned = reqs.requiresSystems.filter((rid) => (ownedSystems[rid] || 0) > 0).length;
    checks.push({
      label: "Key systems",
      current: owned,
      need: reqs.requiresSystems.length,
    });
  }

  const canEvolve = checks.every((c) => c.current >= c.need);

  return (
    <Dialog open={showEvolve} onOpenChange={setShowEvolve}>
      <DialogContent className="max-w-lg glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl">{stage.icon}</span>
            {isFinal ? "Achieve Galactic Ascension" : `Evolve: ${stage.name} → ${next?.name}`}
          </DialogTitle>
          <DialogDescription>
            {isFinal
              ? "Your civilization has reached the pinnacle of mortal achievement. Beyond lies the divine."
              : "Complete all four requirements to evolve to the next stage of life."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Story beat */}
          <div className="rounded-lg bg-muted/30 border border-border p-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {isFinal ? "Final Words" : `${stage.name} → ${next?.name}`}
            </div>
            <p className="text-sm italic leading-relaxed text-foreground/90">
              &ldquo;{isFinal ? stage.storyOutro : stage.storyOutro}&rdquo;
            </p>
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            {checks.map((c) => {
              const ok = c.current >= c.need;
              const pct = Math.min(100, (c.current / c.need) * 100);
              return (
                <div key={c.label} className="flex items-center gap-3">
                  {ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm w-28 shrink-0">{c.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className={`h-full transition-all ${ok ? "bg-emerald-400" : "bg-amber-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-xs tabular-nums w-24 text-right ${ok ? "text-emerald-400" : "text-muted-foreground"}`}>
                    {formatNumber(c.current, 0)} / {formatNumber(c.need, 0)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Next stage preview */}
          {!isFinal && (
            <div className="rounded-lg border border-accent/30 p-3" style={{ background: `${next.accent}10` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{next.icon}</span>
                <span className="text-sm font-bold">{next.name}</span>
                <Badge variant="outline" className="text-xs ml-auto">{next.duration}</Badge>
              </div>
              <p className="text-xs text-muted-foreground italic leading-relaxed">{next.tagline}. {next.desc}</p>
            </div>
          )}

          {/* Archetype lock-in warning (Creature → Tribal) */}
          {stage.id === "creature" && !isLocked && domArch && (
            (() => {
              // HIDE-UNKNOWN-LINEAGE — if the player has never locked this
              // archetype in any prior run, mask the name + bonus as ???
              // to preserve the discovery beat. They learn the lineage
              // only by evolving and locking it for the first time.
              const revealed = !!revealedLineageArchetypes?.[domArch];
              const archName = revealed ? ARCHETYPE_MAP[domArch]?.name : "???";
              const archBonus = revealed ? ARCHETYPE_MAP[domArch]?.bonus.label : "an unrevealed permanent bonus";
              const archColor = revealed ? ARCHETYPE_MAP[domArch]?.color : "#94a3b8";
              const archGlyph = revealed ? ARCHETYPE_MAP[domArch]?.glyph : "?";
              return (
                <div
                  className="rounded-lg border p-3 flex items-start gap-3"
                  style={{
                    background: `${archColor}15`,
                    borderColor: `${archColor}50`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 font-mono"
                    style={{ background: `${archColor}25`, color: archColor }}
                  >
                    {archGlyph}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: archColor }}>
                      Lineage Will Lock
                    </div>
                    <p className="text-xs text-foreground/90 leading-snug">
                      Evolving to Tribal will lock your lineage as{" "}
                      <span className="font-bold" style={{ color: archColor }}>
                        {archName}
                      </span>
                      . This grants{" "}
                      <span className="font-semibold">{archBonus}</span>{" "}
                      for the rest of the run. This cannot be changed.
                      {!revealed && (
                        <span className="block mt-1 text-[0.65rem] text-muted-foreground italic">
                          You have not yet discovered this lineage — evolve to reveal it.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })()
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={() => setShowEvolve(false)}>Not yet</Button>
            <Button
              disabled={!canEvolve}
              onClick={() => {
                evolveStage();
                setShowEvolve(false);
              }}
              className="gap-1"
              style={canEvolve ? { background: next?.accent || stage.accent, color: "#0a0a1a" } : undefined}
            >
              {isFinal ? "Ascend 🌌" : `Evolve to ${next?.name}`}
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function computeScore(
  resources: Record<string, number>,
  ownedSystems: Record<string, number>,
  technologies: Record<string, boolean>,
  population: number,
  time: number
): number {
  const totalSystems = Object.values(ownedSystems).reduce((a, b) => a + b, 0);
  const totalTech = Object.keys(technologies).length;
  const resourceSum = Object.values(resources).reduce((a, b) => a + b, 0);
  return Math.floor(
    population * 2 +
    totalSystems * 5 +
    totalTech * 10 +
    resourceSum * 0.5 +
    time * 0.1
  );
}
