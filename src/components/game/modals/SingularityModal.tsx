"use client";

import { useGameStore } from "@/game/state/store";
import {
  RELIC_LOADOUTS,
  LOGIC_CORES,
  relicBonus,
  logicCoreBonus,
} from "@/game/data/singularity";
import { STAGES } from "@/game/data/stages";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lock, Circle, Cpu, CheckCircle2, RefreshCw, Zap } from "lucide-react";
import { formatNumber } from "../shared/format";

const SPEED_OPTIONS = [
  { value: 1, label: "1×", desc: "Full speed" },
  { value: 0.5, label: "0.5×", desc: "Half speed" },
  { value: 0.25, label: "0.25×", desc: "Quarter speed" },
];

export function SingularityModal() {
  const show = useGameStore((s) => s.showSingularity);
  const setShow = useGameStore((s) => s.setShowSingularity);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const singularityCores = useGameStore((s) => s.singularityCores);
  const divinity = useGameStore((s) => s.divinity);
  const equippedRelics = useGameStore((s) => s.equippedRelics || {});
  const activeLogicCores = useGameStore((s) => s.activeLogicCores || {});

  const toggleRelicLoadout = useGameStore((s) => s.toggleRelicLoadout);
  const toggleLogicCore = useGameStore((s) => s.toggleLogicCore);

  // REBUILD L6 — Dimension Engine state
  const dimensions = useGameStore((s) => s.dimensions || []);
  const dimensionRiftTimer = useGameStore((s) => s.dimensionRiftTimer || 0);
  const setDimensionSpeed = useGameStore((s) => s.setDimensionSpeed);
  const syncDimension = useGameStore((s) => s.syncDimension);
  const initDimensions = useGameStore((s) => s.initDimensions);
  // FEATURE 6 — Dimension Collapses
  const collapseDimensions = useGameStore((s) => s.collapseDimensions);

  const isUnlocked = !!unlockedLayers.singularity;
  const rb = relicBonus(equippedRelics);
  const cb = logicCoreBonus(activeLogicCores);
  const equippedCount = RELIC_LOADOUTS.filter((r) => equippedRelics[r.id]).length;
  const coreCount = LOGIC_CORES.filter((c) => activeLogicCores[c.id]).length;

  const allGalactic = dimensions.length === 3 && dimensions.every((d) => d.reachedGalactic);
  const galacticCount = dimensions.filter((d) => d.reachedGalactic).length;

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Circle className="w-5 h-5" />
            Layer 6 — Singularity (Dimension Engine)
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>
              Three parallel dimensions evolve simultaneously. Sync progress between them — get all 3 to Galactic.
            </span>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-cyan-300 border-cyan-400/40">
                {formatNumber(singularityCores, 0)} Cores
              </Badge>
              <Badge variant="outline" className={allGalactic ? "text-emerald-300 border-emerald-400/40" : "text-amber-300 border-amber-400/40"}>
                {galacticCount}/3 Galactic
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Singularity is sealed.</p>
            <p className="text-xs mt-1">Enact 3+ Divine Laws (Layer 5) to unlock Singularity.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Dimension Engine — the new mini-game */}
            <section className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[0.7rem] uppercase tracking-wide text-cyan-300/80 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Dimension Engine — 3 parallel timelines
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-[0.6rem] text-violet-300 border-violet-400/40">
                    🌀 Rift in {Math.ceil(dimensionRiftTimer)}s
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={initDimensions} className="h-7 text-[0.65rem]">
                    <RefreshCw className="w-3 h-3 mr-1" /> Reset Dimensions
                  </Button>
                </div>
              </div>
              <div className="text-[0.65rem] text-muted-foreground mb-3">
                Each dimension accrues resources & population at its own speed. Stage up costs 100 resources. Sync copies stage & 50% of population (costs 50 Divinity). Rift events transfer resources between dimensions every 60s.
                <span className="text-violet-300"> Collapse</span> two dimensions of the same stage into one — combined speed & resources (costs 50 Divinity).
              </div>

              {/* FEATURE 6 — Collapse hint banner */}
              {dimensions.length >= 2 && (
                <div className="rounded-md border border-violet-400/30 bg-violet-500/5 p-1.5 text-[0.6rem] text-violet-200 mb-2 flex items-center gap-1">
                  <span className="text-base">🌌</span>
                  <span className="flex-1">
                    Collapse available for same-stage pairs:
                    {dimensions.map((d) => {
                      const matches = dimensions.filter((o) => o.id !== d.id && o.stageIndex === d.stageIndex && !o.reachedGalactic && !d.reachedGalactic);
                      return matches.length > 0 ? (
                        <span key={d.id} className="ml-1 px-1 rounded bg-violet-500/20 text-violet-200">
                          {d.name} (stage {d.stageIndex})
                        </span>
                      ) : null;
                    })}
                    {dimensions.every((d) => !dimensions.some((o) => o.id !== d.id && o.stageIndex === d.stageIndex && !o.reachedGalactic && !d.reachedGalactic)) && (
                      <span className="ml-1 text-muted-foreground">none yet — sync speeds first.</span>
                    )}
                  </span>
                </div>
              )}

              {/* Dimension panels — side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {dimensions.map((d) => {
                  const stage = STAGES[d.stageIndex];
                  const stageProgressPct = Math.min(100, (d.resources / 100) * 100);
                  // FEATURE 6 — Collapse targets: other dimensions at the same stageIndex (and not reached galactic)
                  const collapseTargets = dimensions.filter((o) => o.id !== d.id && o.stageIndex === d.stageIndex && !o.reachedGalactic && !d.reachedGalactic);
                  return (
                    <div
                      key={d.id}
                      className={`rounded-md border p-2 ${d.reachedGalactic ? "border-emerald-400/60 bg-emerald-500/10" : "border-cyan-400/30 bg-cyan-950/20"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-semibold">
                          {d.name}
                          {d.reachedGalactic && <CheckCircle2 className="inline w-3 h-3 ml-1 text-emerald-400" />}
                        </div>
                        <Badge variant="outline" className="text-[0.55rem]">{stage?.icon} {stage?.name}</Badge>
                      </div>

                      {/* Stats */}
                      <div className="space-y-1 text-[0.65rem] font-mono">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pop</span>
                          <span className="text-amber-300">{Math.floor(d.pop)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Resources</span>
                          <span className="text-cyan-300">{d.resources.toFixed(1)}/100</span>
                        </div>
                      </div>

                      {/* Stage progress bar */}
                      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden mt-1.5 mb-2">
                        <div
                          className={`h-full transition-all ${d.reachedGalactic ? "bg-emerald-400" : "bg-gradient-to-r from-cyan-500 to-amber-400"}`}
                          style={{ width: `${d.reachedGalactic ? 100 : stageProgressPct}%` }}
                        />
                      </div>

                      {/* Speed controls */}
                      <div className="text-[0.55rem] uppercase text-muted-foreground mb-0.5">Time Speed</div>
                      <div className="grid grid-cols-3 gap-0.5 mb-2">
                        {SPEED_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setDimensionSpeed(d.id, opt.value)}
                            disabled={d.reachedGalactic}
                            title={opt.desc}
                            className={`text-[0.6rem] py-1 rounded border transition-all
                              ${d.speed === opt.value
                                ? "border-amber-400/60 bg-amber-500/20 text-amber-300"
                                : "border-muted-foreground/20 bg-muted/10 text-muted-foreground hover:border-cyan-400/40"
                              }
                              ${d.reachedGalactic ? "opacity-40 cursor-not-allowed" : ""}
                            `}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Sync buttons */}
                      {!d.reachedGalactic && (
                        <div className="text-[0.55rem] uppercase text-muted-foreground mb-0.5">Sync from</div>
                      )}
                      {!d.reachedGalactic && (
                        <div className="grid grid-cols-2 gap-0.5">
                          {dimensions.filter((other) => other.id !== d.id).map((other) => (
                            <button
                              key={other.id}
                              onClick={() => syncDimension(other.id, d.id)}
                              disabled={divinity < 50 || other.stageIndex <= d.stageIndex}
                              title={`Copy progress from ${other.name} to ${d.name} (50 Divinity)`}
                              className="text-[0.55rem] py-1 rounded border border-violet-400/30 bg-violet-500/5 text-violet-300 hover:bg-violet-500/15 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              ← {other.name}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* FEATURE 6 — Collapse buttons: merge this dimension into another at the same stage */}
                      {!d.reachedGalactic && collapseTargets.length > 0 && (
                        <>
                          <div className="text-[0.55rem] uppercase text-muted-foreground mb-0.5 mt-1.5">Collapse into</div>
                          <div className="grid grid-cols-2 gap-0.5">
                            {collapseTargets.map((other) => (
                              <button
                                key={other.id}
                                onClick={() => collapseDimensions(d.id, other.id)}
                                disabled={divinity < 50}
                                title={`Collapse ${d.name} into ${other.name} — combined speed & resources (50 Divinity)`}
                                className="text-[0.55rem] py-1 rounded border border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                ⤳ {other.name}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {allGalactic && (
                <div className="rounded-md border border-emerald-400/60 bg-emerald-500/20 p-2 mt-2 text-[0.7rem] text-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> All 3 dimensions have reached Galactic! Singularity engine complete.
                </div>
              )}
            </section>

            {/* Aggregated bonuses */}
            <div className="stat-card">
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">
                Active bonuses: {equippedCount} relic(s), {coreCount} core(s) active
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-cyan-300 border-cyan-400/40">+{((rb.productionMult + cb.productionMult) * 100).toFixed(0)}% prod</Badge>
                <Badge variant="outline" className="text-amber-300 border-amber-400/40">+{((rb.capMult + cb.capMult) * 100).toFixed(0)}% cap</Badge>
                <Badge variant="outline" className="text-emerald-300 border-emerald-400/40">+{((rb.epMult + cb.epMult) * 100).toFixed(0)}% EP</Badge>
                <Badge variant="outline" className="text-violet-300 border-violet-400/40">+{(rb.popGrowthMult * 100).toFixed(0)}% pop</Badge>
              </div>
            </div>

            {/* Relic Loadouts (preserved) */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">Relic Loadouts (each has upside + downside)</div>
              <div className="space-y-1.5">
                {RELIC_LOADOUTS.map((r) => {
                  const equipped = !!equippedRelics[r.id];
                  return (
                    <div key={r.id} className={`stat-card flex items-center gap-3 py-2 ${equipped ? "border-amber-400/60" : ""}`}>
                      <span className="text-xl shrink-0">{r.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{r.name}</span>
                          {equipped && (
                            <Badge className="text-[0.6rem] bg-amber-500/20 text-amber-300 border-amber-400/40">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Equipped
                            </Badge>
                          )}
                        </div>
                        <div className="text-[0.65rem] text-emerald-300/80 leading-snug">▲ {r.upside}</div>
                        <div className="text-[0.65rem] text-rose-300/80 leading-snug">▼ {r.downside}</div>
                      </div>
                      <Button size="sm" variant={equipped ? "outline" : "default"} className="h-7" onClick={() => toggleRelicLoadout(r.id)}>
                        {equipped ? "Unequip" : "Equip"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Logic Cores (preserved) */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Logic Cores (toggleable automation)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {LOGIC_CORES.map((c) => {
                  const active = !!activeLogicCores[c.id];
                  return (
                    <button key={c.id} onClick={() => toggleLogicCore(c.id)} className={`stat-card text-left p-2 ${active ? "border-amber-400/60 bg-amber-500/10" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{c.icon}</span>
                          <span className="text-xs font-medium">{c.name}</span>
                        </div>
                        <Badge variant="outline" className={`text-[0.6rem] ${active ? "text-amber-300 border-amber-400/40" : "text-muted-foreground"}`}>
                          {active ? "ACTIVE" : "OFF"}
                        </Badge>
                      </div>
                      <div className="text-[0.6rem] text-muted-foreground mt-0.5 leading-snug">{c.desc}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1">
          <span className="text-cyan-300">Dimension Engine</span> runs three timelines in parallel — set each dimension's speed, sync progress (50 Div), and survive rift events to get all three to Galactic.
          Relics and Logic Cores persist across prestige.
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShow(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
