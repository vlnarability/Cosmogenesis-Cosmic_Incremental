"use client";

import { useGameStore } from "@/game/state/store";
import {
  OLD_GODS,
  OLD_GOD_MAP,
  divineFragmentBonus,
  isInfinityComplete,
} from "@/game/data/infinity";
import { MINOR_GOD_MAP } from "@/game/data/divinity_layer";
import { CREATURE_BODY_TYPE_MAP, legionPower } from "@/game/data/omnipotence";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lock, Swords, CheckCircle2, Crosshair, Users, Clock, Sparkles } from "lucide-react";

const PHASE_LABELS: Record<string, string> = {
  skirmish: "Skirmish",
  siege: "Siege",
  final_stand: "Final Stand",
};

export function InfinityModal() {
  const show = useGameStore((s) => s.showInfinity);
  const setShow = useGameStore((s) => s.setShowInfinity);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const oldGodBattles = useGameStore((s) => s.oldGodBattles || {});
  const divineFragments = useGameStore((s) => s.divineFragments || 0);
  const legions = useGameStore((s) => s.legions || []);
  const creatures = useGameStore((s) => s.creatures || []);
  const minorGods = useGameStore((s) => s.minorGods || []);
  const alliances = useGameStore((s) => s.alliances || {});

  const startOldGodBattle = useGameStore((s) => s.startOldGodBattle);
  const deployLegionToBattle = useGameStore((s) => s.deployLegionToBattle);
  const callAllyToBattle = useGameStore((s) => s.callAllyToBattle);
  const attackOldGod = useGameStore((s) => s.attackOldGod);
  // FEATURE 9 — Temporal Storms
  const temporalStorms = useGameStore((s) => s.temporalStorms || {});
  const stabilizeTime = useGameStore((s) => s.stabilizeTime);

  const isUnlocked = !!unlockedLayers.infinity;
  const fragmentBonus = divineFragmentBonus(divineFragments);
  const alliedGods = minorGods.filter((g) => alliances[g.id]);
  const totalDefeated = OLD_GODS.filter((g) => oldGodBattles[g.id]?.status === "won").length;

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Swords className="w-5 h-5" />
            Layer 9 — Infinity (Divine War)
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>
              Battle the Old Gods. Deploy Legions, call Allies, defeat all 3 to ascend.
            </span>
            <Badge variant="outline" className="text-cyan-300 border-cyan-400/40">
              {divineFragments} Divine Fragments
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">The War Council is sealed.</p>
            <p className="text-xs mt-1">Form 2+ alliances (Layer 8 — Divine Alliance) to unlock Divine War.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status */}
            <div className="stat-card">
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">
                {totalDefeated}/{OLD_GODS.length} Old Gods defeated · {legions.length} legions · {alliedGods.length} allies available
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-cyan-300 border-cyan-400/40">+{(fragmentBonus.productionMult * 100).toFixed(0)}% prod</Badge>
                <Badge variant="outline" className="text-amber-300 border-amber-400/40">+{(fragmentBonus.capMult * 100).toFixed(0)}% cap</Badge>
                <Badge variant="outline" className="text-emerald-300 border-emerald-400/40">+{(fragmentBonus.epMult * 100).toFixed(0)}% EP</Badge>
                <Badge variant="outline" className="text-violet-300 border-violet-400/40">+{(fragmentBonus.popGrowthMult * 100).toFixed(0)}% pop</Badge>
              </div>
            </div>

            {/* Old God Boss Cards */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                <Crosshair className="w-3 h-3" /> The Old Gods (3 bosses — each grants +1 Divine Fragment)
              </div>
              <div className="space-y-2">
                {OLD_GODS.map((god) => {
                  const battle = oldGodBattles[god.id] || { status: "not_started", bossHp: god.hp, bossMaxHp: god.hp, phase: "skirmish", deployedLegionIds: [], calledAllyIds: [], turn: 0, log: [] };
                  const isWon = battle.status === "won";
                  const isActive = battle.status === "in_progress";
                  const hpPct = (battle.bossHp / battle.bossMaxHp) * 100;
                  // FEATURE 9 — Temporal Storm active for this battle
                  const stormActive = !!temporalStorms[god.id];
                  return (
                    <div key={god.id} className={`stat-card p-2 ${isWon ? "border-emerald-400/40 bg-emerald-500/5" : isActive ? "border-rose-400/40" : ""} ${stormActive ? "relative overflow-hidden" : ""}`}>
                      {/* FEATURE 9 — Temporal Storm blue/purple overlay */}
                      {stormActive && (
                        <div className="absolute inset-0 pointer-events-none temporal-storm-overlay rounded-md" />
                      )}
                      <div className="flex items-start gap-2 relative">
                        <span className="text-2xl shrink-0">{god.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold">{god.name}</span>
                            <Badge variant="outline" className="text-[0.55rem] text-muted-foreground italic">{god.title}</Badge>
                            {isWon && (
                              <Badge className="text-[0.55rem] bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
                                <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Defeated
                              </Badge>
                            )}
                            {isActive && (
                              <Badge variant="outline" className="text-[0.55rem] text-rose-300 border-rose-400/40">
                                Phase: {PHASE_LABELS[battle.phase] || battle.phase}
                              </Badge>
                            )}
                            {/* FEATURE 9 — Temporal Storm badge */}
                            {stormActive && (
                              <Badge variant="outline" className="text-[0.55rem] text-violet-200 border-violet-400/60 animate-pulse">
                                <Clock className="w-2.5 h-2.5 mr-0.5" /> Temporal Storm
                              </Badge>
                            )}
                          </div>
                          <div className="text-[0.6rem] text-muted-foreground leading-snug mt-0.5">{god.desc}</div>
                          <div className="text-[0.55rem] text-amber-300/80 mt-0.5">
                            HP {god.hp} · ATK {god.attack} · Weakness: {god.weakness}
                          </div>

                          {/* FEATURE 9 — Temporal Storm banner */}
                          {stormActive && (
                            <div className="rounded-md border border-violet-400/60 bg-violet-500/15 p-1.5 mt-1.5 text-[0.6rem] text-violet-100 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 shrink-0" />
                              <span className="flex-1">🌀 The timeline shudders — enemy strikes may be delayed or accelerated.</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-5 text-[0.55rem] text-cyan-200 border-cyan-400/50"
                                disabled={divineFragments < 1}
                                onClick={() => stabilizeTime(god.id)}
                                title="Stabilize Time (costs 1 Divine Fragment)"
                              >
                                ⏳ Stabilize (1 Fragment)
                              </Button>
                            </div>
                          )}

                          {/* HP bar */}
                          {(isActive || isWon) && (
                            <div className="mt-1.5">
                              <div className="flex items-center justify-between text-[0.55rem] text-muted-foreground mb-0.5">
                                <span>Boss HP</span>
                                <span>{Math.ceil(battle.bossHp)}/{battle.bossMaxHp}</span>
                              </div>
                              <div className="h-2 bg-rose-950/50 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${isWon ? "bg-emerald-400" : hpPct < 33 ? "bg-rose-500" : "bg-rose-400/70"}`}
                                  style={{ width: `${Math.max(0, hpPct)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Battle actions */}
                          {isActive && (
                            <div className="mt-2 space-y-1.5">
                              <div className="text-[0.55rem] text-muted-foreground">Deploy Legions (toggle):</div>
                              {legions.length === 0 ? (
                                <div className="text-[0.55rem] text-rose-300/60 italic">No legions formed — visit Layer 7.</div>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {legions.map((l) => {
                                    const deployed = battle.deployedLegionIds.includes(l.id);
                                    const power = legionPower(l, creatures);
                                    return (
                                      <button
                                        key={l.id}
                                        onClick={() => deployLegionToBattle(god.id, l.id)}
                                        className={`stat-card text-[0.6rem] px-2 py-1 ${deployed ? "border-amber-400/60 bg-amber-500/10" : ""}`}
                                      >
                                        {l.name} (ATK {power.attack})
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              <div className="text-[0.55rem] text-muted-foreground mt-1">Call Allies (toggle):</div>
                              {alliedGods.length === 0 ? (
                                <div className="text-[0.55rem] text-rose-300/60 italic">No allies — form alliances in Layer 8.</div>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {alliedGods.map((g) => {
                                    const called = battle.calledAllyIds.includes(g.id);
                                    return (
                                      <button
                                        key={g.id}
                                        onClick={() => callAllyToBattle(god.id, g.id)}
                                        className={`stat-card text-[0.6rem] px-2 py-1 ${called ? "border-amber-400/60 bg-amber-500/10" : ""}`}
                                      >
                                        {g.icon} {g.name} ({g.powerLevel})
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 w-full mt-1"
                                disabled={battle.deployedLegionIds.length === 0 && battle.calledAllyIds.length === 0}
                                onClick={() => attackOldGod(god.id)}
                              >
                                <Swords className="w-3 h-3 mr-1" /> Attack! (turn {battle.turn})
                              </Button>

                              {/* Battle log */}
                              {battle.log && battle.log.length > 0 && (
                                <div className="text-[0.55rem] text-muted-foreground bg-muted/10 rounded p-1.5 mt-1 space-y-0.5 max-h-24 overflow-y-auto">
                                  {battle.log.slice(-6).map((line, i) => (
                                    <div key={i}>• {line}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {!isActive && !isWon && (
                            <Button size="sm" variant="default" className="h-7 mt-2 w-full" onClick={() => startOldGodBattle(god.id)}>
                              <Swords className="w-3 h-3 mr-1" /> Begin Battle
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Available forces summary */}
            <section className="stat-card">
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> Your Forces
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[0.6rem] text-muted-foreground mb-0.5">Legions ({legions.length})</div>
                  {legions.length === 0 ? (
                    <div className="text-[0.55rem] text-rose-300/60 italic">No legions — visit Layer 7.</div>
                  ) : (
                    <div className="space-y-0.5">
                      {legions.map((l) => {
                        const p = legionPower(l, creatures);
                        return (
                          <div key={l.id} className="text-[0.55rem] text-muted-foreground flex items-center gap-1">
                            {l.name}: {p.count} units, ATK {p.attack}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[0.6rem] text-muted-foreground mb-0.5">Allies ({alliedGods.length})</div>
                  {alliedGods.length === 0 ? (
                    <div className="text-[0.55rem] text-rose-300/60 italic">No allies — visit Layer 8.</div>
                  ) : (
                    <div className="space-y-0.5">
                      {alliedGods.map((g) => (
                        <div key={g.id} className="text-[0.55rem] text-muted-foreground flex items-center gap-1">
                          {g.icon} {g.name} — power {g.powerLevel}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1 flex items-center gap-1">
          <Swords className="w-3 h-3" />
          Defeat all 3 Old Gods to unlock Layer 10 (Ascension). Each victory grants a permanent Divine Fragment bonus.
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShow(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mark unused imports as used (for tree-shaking safety; data references may evolve)
void OLD_GOD_MAP;
void MINOR_GOD_MAP;
void CREATURE_BODY_TYPE_MAP;
void isInfinityComplete;
