"use client";

import { useState } from "react";
import { useGameStore } from "@/game/state/store";
import {
  CREATURE_BODY_TYPES,
  CREATURE_BODY_TYPE_MAP,
  CREATURE_DIETS,
  CREATURE_DIET_MAP,
  CREATURE_SPECIALS,
  CREATURE_SPECIAL_MAP,
  LEGION_MAX_CREATURES,
  OMNIPOTENCE_STANCES,
  legionBonus,
  instabilityRateMult,
  effectiveInstabilityRate,
  legionPower,
  computeCreatureStats,
} from "@/game/data/omnipotence";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lock, Dna, CheckCircle2, AlertTriangle, Trash2, Plus, Sparkles } from "lucide-react";

export function OmnipotenceModal() {
  const show = useGameStore((s) => s.showOmnipotence);
  const setShow = useGameStore((s) => s.setShowOmnipotence);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const creatures = useGameStore((s) => s.creatures || []);
  const legions = useGameStore((s) => s.legions || []);
  const activeStance = useGameStore((s) => s.activeOmnipotenceStance || "balanced");
  const instability = useGameStore((s) => s.instability || 0);
  const peakInstability = useGameStore((s) => s.peakInstability || 0);
  const draft = useGameStore((s) => s.creatureDesignDraft);

  const setCreatureDesignDraft = useGameStore((s) => s.setCreatureDesignDraft);
  const createCreature = useGameStore((s) => s.createCreature);
  const addCreatureToLegion = useGameStore((s) => s.addCreatureToLegion);
  const removeCreatureFromLegion = useGameStore((s) => s.removeCreatureFromLegion);
  const createLegion = useGameStore((s) => s.createLegion);
  const deleteLegion = useGameStore((s) => s.deleteLegion);
  const setOmnipotenceStance = useGameStore((s) => s.setOmnipotenceStance);

  const isUnlocked = !!unlockedLayers.omnipotence;
  const lb = legionBonus(creatures, legions, activeStance);
  const rate = effectiveInstabilityRate(creatures, legions, activeStance);
  const stanceRateMult = instabilityRateMult(activeStance);

  const [selectedLegionId, setSelectedLegionId] = useState<string | null>(null);

  const draftStats = draft
    ? computeCreatureStats(
        draft.bodyType as any,
        draft.diet as any,
        draft.special as any
      )
    : null;

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Dna className="w-5 h-5" />
            Layer 7 — Omnipotence (Bio-engineering)
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>
              Design creatures, combine them into Legions. Each active creature adds instability — at 100, they go rogue.
            </span>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-violet-300 border-violet-400/40">
                {creatures.length} creatures
              </Badge>
              <Badge variant="outline" className="text-amber-300 border-amber-400/40">
                {legions.length} legions
              </Badge>
              <Badge variant="outline" className={instability >= 75 ? "text-rose-400 border-rose-400/60" : "text-rose-300 border-rose-400/40"}>
                {instability.toFixed(1)} / 100
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">The Creature Lab is sealed.</p>
            <p className="text-xs mt-1">Activate 3+ Logic Cores (Layer 6 — Singularity) to unlock Omnipotence.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Genetic Instability Meter */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Genetic Instability (creatures go rogue at 100)
                </div>
                <div className="text-[0.65rem] text-rose-300/80">
                  rate ×{stanceRateMult.toFixed(2)} · {rate.toFixed(3)}/s · peak {peakInstability.toFixed(1)}
                </div>
              </div>
              <div className="h-2 bg-rose-950/50 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${instability >= 75 ? "bg-rose-500" : "bg-rose-400/70"}`}
                  style={{ width: `${Math.min(100, instability)}%` }}
                />
              </div>
              <div className="text-[0.6rem] text-muted-foreground mt-1">
                Active bonuses: +{(lb.productionMult * 100).toFixed(0)}% prod, +{(lb.capMult * 100).toFixed(0)}% cap, +{(lb.epMult * 100).toFixed(0)}% EP, +{(lb.popGrowthMult * 100).toFixed(0)}% pop
              </div>
            </div>

            {/* Stances */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">Stance (trade instability vs. bonus)</div>
              <div className="grid grid-cols-3 gap-1.5">
                {OMNIPOTENCE_STANCES.map((s) => {
                  const active = activeStance === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setOmnipotenceStance(s.id)}
                      className={`stat-card text-left p-2 ${active ? "border-amber-400/60 bg-amber-500/10" : ""}`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-base">{s.icon}</span>
                        <span className="text-xs font-medium">{s.name}</span>
                      </div>
                      <div className="text-[0.55rem] text-muted-foreground mt-0.5 leading-tight">{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Creation Lab — Design a new creature */}
            <section className="stat-card">
              <div className="text-[0.7rem] uppercase tracking-wide text-emerald-300/80 mb-2 flex items-center gap-1">
                <Dna className="w-3 h-3" /> Creation Lab — Design a creature
                {/* FEATURE 7 — Mutation hint */}
                <Badge variant="outline" className="ml-2 text-[0.55rem] text-violet-300 border-violet-400/40">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" /> 10% mutation chance
                </Badge>
              </div>
              <div className="text-[0.6rem] text-violet-300/80 mb-2">
                FEATURE 7 — Each creature has a 10% chance to mutate on creation. Mutated creatures are 50% more powerful but add +20% to genetic instability.
              </div>
              <div className="space-y-2">
                <DesignPicker
                  label="Body Type"
                  items={CREATURE_BODY_TYPES.map((t) => ({ id: t.id, name: t.name, icon: t.icon, blurb: `ATK ${t.baseAttack} / DEF ${t.baseDefense} / SPD ${t.baseSpeed}` }))}
                  selected={draft?.bodyType || "predator"}
                  onSelect={(id) => setCreatureDesignDraft({ ...(draft || { bodyType: "predator", diet: "herbivore", special: "regen", name: "" }), bodyType: id })}
                />
                <DesignPicker
                  label="Diet"
                  items={CREATURE_DIETS.map((t) => ({ id: t.id, name: t.name, icon: t.icon, blurb: t.desc }))}
                  selected={draft?.diet || "herbivore"}
                  onSelect={(id) => setCreatureDesignDraft({ ...(draft || { bodyType: "predator", diet: "herbivore", special: "regen", name: "" }), diet: id })}
                />
                <DesignPicker
                  label="Special Ability"
                  items={CREATURE_SPECIALS.map((t) => ({ id: t.id, name: t.name, icon: t.icon, blurb: t.desc }))}
                  selected={draft?.special || "regen"}
                  onSelect={(id) => setCreatureDesignDraft({ ...(draft || { bodyType: "predator", diet: "herbivore", special: "regen", name: "" }), special: id })}
                />
                <div>
                  <div className="text-[0.65rem] text-muted-foreground mb-1">Creature name (optional)</div>
                  <input
                    type="text"
                    value={draft?.name || ""}
                    onChange={(e) => setCreatureDesignDraft({ ...(draft || { bodyType: "predator", diet: "herbivore", special: "regen", name: "" }), name: e.target.value })}
                    placeholder="e.g. Skarnjaw the Devourer"
                    className="w-full bg-input/50 border border-muted-foreground/30 rounded px-2 py-1 text-xs"
                  />
                </div>
                {draftStats && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" className="text-[0.6rem] text-rose-300 border-rose-400/40">ATK {draftStats.attack}</Badge>
                    <Badge variant="outline" className="text-[0.6rem] text-cyan-300 border-cyan-400/40">DEF {draftStats.defense}</Badge>
                    <Badge variant="outline" className="text-[0.6rem] text-emerald-300 border-emerald-400/40">SPD {draftStats.speed}</Badge>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button size="sm" className="h-7" onClick={() => createCreature()}>
                    <Plus className="w-3 h-3 mr-1" /> Create Creature
                  </Button>
                </div>
              </div>
            </section>

            {/* Creature Inventory */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">
                Designed creatures ({creatures.length}) — click a legion to add
              </div>
              {creatures.length === 0 ? (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  No creatures designed yet. Use the Creation Lab above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {creatures.map((c) => {
                    const body = CREATURE_BODY_TYPE_MAP[c.bodyType];
                    const inLegion = legions.find((l) => l.creatureIds.includes(c.id));
                    // FEATURE 7 — Mutation visual (purple aura)
                    const mutated = !!c.mutated;
                    return (
                      <div key={c.id} className={`stat-card flex items-center gap-2 py-1.5 ${inLegion ? "border-amber-400/40" : ""} ${mutated ? "mutation-aura border-violet-400/60" : ""}`}>
                        <span className="text-xl shrink-0">{body.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs font-semibold truncate">{c.name}</span>
                            {mutated && (
                              <Badge variant="outline" className="text-[0.5rem] bg-violet-500/20 text-violet-200 border-violet-400/60">
                                <Sparkles className="w-2.5 h-2.5 mr-0.5" /> MUTATED ({c.mutatedStat})
                              </Badge>
                            )}
                          </div>
                          <div className="text-[0.6rem] text-muted-foreground">
                            {body.name} · ATK {c.attack} / DEF {c.defense} / SPD {c.speed}
                          </div>
                          {inLegion && (
                            <div className="text-[0.55rem] text-amber-300/80 mt-0.5">In: {inLegion.name}</div>
                          )}
                        </div>
                        {selectedLegionId && !inLegion && (
                          <Button size="sm" variant="outline" className="h-6 text-[0.6rem]" onClick={() => addCreatureToLegion(c.id, selectedLegionId)}>
                            Add
                          </Button>
                        )}
                        {inLegion && (
                          <Button size="sm" variant="ghost" className="h-6 text-[0.6rem]" onClick={() => removeCreatureFromLegion(c.id, inLegion.id)}>
                            Remove
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Legions */}
            <section>
              <div className="flex items-center justify-between mb-1">
                <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">Legions (max {LEGION_MAX_CREATURES} creatures each)</div>
                <Button size="sm" variant="outline" className="h-7 text-[0.65rem]" onClick={() => {
                  createLegion(`Legion ${legions.length + 1}`);
                }}>
                  <Plus className="w-3 h-3 mr-1" /> New Legion
                </Button>
              </div>
              {legions.length === 0 ? (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  No legions formed. Create one to start assembling armies.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {legions.map((l) => {
                    const power = legionPower(l, creatures);
                    const isSelected = selectedLegionId === l.id;
                    return (
                      <div key={l.id} className={`stat-card p-2 ${isSelected ? "border-amber-400/60 bg-amber-500/5" : ""}`}>
                        <div className="flex items-center gap-2">
                          <button
                            className="flex-1 text-left"
                            onClick={() => setSelectedLegionId(isSelected ? null : l.id)}
                          >
                            <div className="text-xs font-semibold flex items-center gap-2">
                              {l.name}
                              <Badge variant="outline" className="text-[0.55rem]">{power.count}/{LEGION_MAX_CREATURES}</Badge>
                              {isSelected && <CheckCircle2 className="w-2.5 h-2.5 text-amber-300 ml-auto" />}
                            </div>
                            <div className="text-[0.6rem] text-muted-foreground">
                              Power: ATK {power.attack} / DEF {power.defense} / SPD {power.speed}
                            </div>
                          </button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteLegion(l.id)}>
                            <Trash2 className="w-3 h-3 text-rose-400/60" />
                          </Button>
                        </div>
                        {power.count > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {l.creatureIds.map((cid) => {
                              const c = creatures.find((x) => x.id === cid);
                              if (!c) return null;
                              const body = CREATURE_BODY_TYPE_MAP[c.bodyType];
                              return (
                                <Badge key={cid} variant="outline" className="text-[0.55rem] text-violet-300 border-violet-400/40">
                                  {body.icon} {c.name}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        {isSelected && (
                          <div className="text-[0.6rem] text-amber-300/80 mt-1">
                            Selected — click "Add" on any unassigned creature to place it here.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Design creatures → form Legions → deploy in Layer 9. Peak instability ≥ 80 unlocks Layer 8 (Divine Alliance).
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShow(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DesignPicker({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string;
  items: { id: string; name: string; icon: string; blurb: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="text-[0.65rem] text-muted-foreground mb-1">{label}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onSelect(it.id)}
            className={`stat-card text-left p-1.5 ${selected === it.id ? "border-amber-400/60 bg-amber-500/10" : ""}`}
          >
            <div className="flex items-center gap-1">
              <span className="text-sm">{it.icon}</span>
              <span className="text-[0.65rem] font-medium truncate">{it.name}</span>
            </div>
            <div className="text-[0.55rem] text-muted-foreground mt-0.5 leading-tight line-clamp-2">{it.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
