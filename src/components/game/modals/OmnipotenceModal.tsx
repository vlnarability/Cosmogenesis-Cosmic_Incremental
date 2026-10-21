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
  OUTPOST_RAIDS,
  OUTPOST_RAID_MAP,
  OUTPOST_RAID_COUNT_FOR_L8,
  CREATURE_XP_PER_LEVEL,
  CREATURE_XP_PER_RAID,
  MAX_ACTIVE_OUTPOST_RAIDS,
  creatureLevel,
  creatureLevelBonus,
} from "@/game/data/omnipotence";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lock, Dna, CheckCircle2, AlertTriangle, Trash2, Plus, Sparkles, Swords, Zap, Target } from "lucide-react";
import { BackgroundLayerBadge } from "../shared/BackgroundLayerBadge";
import { EmptyState } from "../shared/EmptyState";

export function OmnipotenceContent() {
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const creatures = useGameStore((s) => s.creatures || []);
  const legions = useGameStore((s) => s.legions || []);
  const activeStance = useGameStore((s) => s.activeOmnipotenceStance || "balanced");
  const instability = useGameStore((s) => s.instability || 0);
  const draft = useGameStore((s) => s.creatureDesignDraft);
  // L7 FIX Bug 1 — cost & capacity state for Create Creature button.
  // L10-GENESIS-ENGINE: capacity now scales with discovered archetypes
  // (was: universe-rules slots filled).
  const divinity = useGameStore((s) => s.divinity || 0);
  const faith = useGameStore((s) => s.faith || 0);
  const discoveredArchetypes = useGameStore((s) => s.discoveredArchetypes || {});

  const setCreatureDesignDraft = useGameStore((s) => s.setCreatureDesignDraft);
  const createCreature = useGameStore((s) => s.createCreature);
  const addCreatureToLegion = useGameStore((s) => s.addCreatureToLegion);
  const removeCreatureFromLegion = useGameStore((s) => s.removeCreatureFromLegion);
  const createLegion = useGameStore((s) => s.createLegion);
  const deleteLegion = useGameStore((s) => s.deleteLegion);
  const setOmnipotenceStance = useGameStore((s) => s.setOmnipotenceStance);

  // Skirmish Arena — outpost raids + creature XP/levels
  const outpostRaids = useGameStore((s) => s.outpostRaids || []);
  const raidsRepelled = useGameStore((s) => s.raidsRepelled || 0);
  const activeOutpostRaid = useGameStore((s) => s.activeOutpostRaid || null);
  const creatureXp = useGameStore((s) => s.creatureXp || {});
  const creatureLevels = useGameStore((s) => s.creatureLevels || {});
  const divineFragments = useGameStore((s) => s.divineFragments || 0);
  const spawnOutpostRaid = useGameStore((s) => s.spawnOutpostRaid);
  const deployLegionToRaid = useGameStore((s) => s.deployLegionToRaid);
  const attackOutpost = useGameStore((s) => s.attackOutpost);
  const setActiveOutpostRaid = useGameStore((s) => s.setActiveOutpostRaid);

  const isUnlocked = !!unlockedLayers.omnipotence;
  const lb = legionBonus(creatures, legions, activeStance);
  const rate = effectiveInstabilityRate(creatures, legions, activeStance);
  const stanceRateMult = instabilityRateMult(activeStance);

  // L7 FIX Bug 1 — Capacity = 5 base + 1 per L10 archetype discovered.
  const filledUniverseSlots = Object.values(discoveredArchetypes).filter(Boolean).length;
  const maxCreatures = 5 + filledUniverseSlots;
  const createCostDiv = 5;
  const createCostFaith = 5;
  const canAffordCreature = divinity >= createCostDiv && faith >= createCostFaith;
  const atCapacity = creatures.length >= maxCreatures;
  const canCreateCreature = canAffordCreature && !atCapacity;

  const [selectedLegionId, setSelectedLegionId] = useState<string | null>(null);

  const draftStats = draft
    ? computeCreatureStats(
        draft.bodyType as any,
        draft.diet as any,
        draft.special as any
      )
    : null;

  return (
    <>
      {/* LAYER-AS-TAB — was <DialogHeader>/<DialogTitle>/<DialogDescription>
          (Radix primitives that require a <Dialog> parent). Now plain HTML
          since this content renders inline in the tab panel. */}
      <div className="flex flex-col gap-2 text-center sm:text-left mb-3">
        <h2 className="text-lg leading-none font-semibold flex items-center gap-2 flex-wrap">
          <Dna className="w-5 h-5" />
          Layer 7 — Omnipotence (Bio-engineering)
          <BackgroundLayerBadge layerId="omnipotence" />
        </h2>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
          <span>
            Design creatures, combine them into Legions. Each active creature adds instability — at 100, they go rogue.
          </span>
          <div className="flex gap-1">
              <Badge variant="outline" className="text-violet-300 border-violet-400/40">
                {creatures.length}/{maxCreatures} creatures
              </Badge>
              <Badge variant="outline" className="text-amber-300 border-amber-400/40">
                {legions.length} legions
              </Badge>
              <Badge variant="outline" className={instability >= 75 ? "text-rose-400 border-rose-400/60" : "text-rose-300 border-rose-400/40"}>
                {instability.toFixed(1)} / 100
              </Badge>
            </div>
          </div>
        </div>
      </div>

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
                  rate ×{stanceRateMult.toFixed(2)} · {rate.toFixed(3)}/s · current {instability.toFixed(1)}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
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
                {/* L7 FIX Bug 1 — Cost + capacity gating for Create Creature */}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <div className="text-[0.6rem] text-muted-foreground leading-tight">
                    Cost: <span className={canAffordCreature ? "text-amber-300" : "text-rose-400"}>{createCostDiv} Div</span>
                    {" + "}
                    <span className={canAffordCreature ? "text-amber-300" : "text-rose-400"}>{createCostFaith} Faith</span>
                    <span className="block">
                      Capacity: {creatures.length}/{maxCreatures}
                      {filledUniverseSlots > 0 && <span className="text-violet-300/80"> (+{filledUniverseSlots} from L10 archetypes)</span>}
                    </span>
                    {atCapacity && (
                      <span className="block text-rose-400">At capacity — discover more L10 archetypes or release a creature.</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="h-7"
                    disabled={!canCreateCreature}
                    onClick={() => createCreature()}
                    title={atCapacity ? "Lab at capacity" : !canAffordCreature ? "Not enough Divinity/Faith" : "Create Creature"}
                  >
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

            {/* ===== SKIRMISH ARENA — Outpost Raids ===== */}
            <section className="stat-card">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[0.7rem] uppercase tracking-wide text-rose-300/80 flex items-center gap-1">
                  <Swords className="w-3 h-3" /> Skirmish Arena — Outpost Raids
                </div>
                <Badge variant="outline" className={`text-[0.6rem] ${raidsRepelled >= OUTPOST_RAID_COUNT_FOR_L8 ? "text-emerald-300 border-emerald-400/50" : "text-amber-300 border-amber-400/40"}`}>
                  Repelled: {raidsRepelled}/{OUTPOST_RAID_COUNT_FOR_L8}
                </Badge>
              </div>
              <div className="text-[0.6rem] text-muted-foreground mb-2 leading-tight">
                Minor Old-God outposts raid your galaxies every {120}s. Deploy legions → click Attack → repel 10 raids to unlock Layer 8 (Divine Alliance).
                Each victory: +1 Divine Fragment (total {divineFragments}) + {CREATURE_XP_PER_RAID} XP per deployed creature. Creatures level up every {CREATURE_XP_PER_LEVEL} XP (+10% ATK/DEF/SPD per level).
              </div>

              {/* P7 — Empty state: shown until the player repels their first
                  outpost raid. The "no active raids" message below handles
                  the "waiting for the next raid" case. */}
              {raidsRepelled === 0 && outpostRaids.filter((r) => r.status === "active").length === 0 && (
                <EmptyState
                  compact
                  icon={<Swords className="w-6 h-6" />}
                  title="No raids repelled yet."
                  description='Deploy a legion and attack an outpost. Click "Summon Outpost Raid" below to spawn your first target.'
                />
              )}

              <div className="space-y-1.5">
                {outpostRaids.length === 0 && (
                  <div className="text-center text-muted-foreground py-3 text-xs">
                    No active raids. Outposts will spawn automatically — or summon one below.
                  </div>
                )}
                {outpostRaids.map((raid) => {
                  const def = OUTPOST_RAID_MAP[raid.outpostDef];
                  if (!def) return null;
                  const isSelected = activeOutpostRaid === raid.id;
                  const active = raid.status === "active";
                  const deployedPowers = raid.deployedLegionIds.map((lid) => {
                    const legion = legions.find((l) => l.id === lid);
                    if (!legion) return null;
                    return legionPower(legion, creatures);
                  });
                  const totalAttack = deployedPowers.reduce((a, p) => a + (p?.attack || 0), 0);
                  const totalDefense = deployedPowers.reduce((a, p) => a + (p?.defense || 0), 0);
                  const totalSpeed = deployedPowers.reduce((a, p) => a + (p?.speed || 0), 0);
                  return (
                    <div
                      key={raid.id}
                      className={`stat-card p-2 ${isSelected ? "border-rose-400/60 bg-rose-500/5" : ""} ${!active ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg shrink-0">{def.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs font-semibold truncate">{def.name}</span>
                            <Badge variant="outline" className="text-[0.5rem] text-rose-300 border-rose-400/40">
                              HP {def.hp} · ATK {def.attack} · DEF {def.defense}
                            </Badge>
                            {raid.status === "won" && (
                              <Badge variant="outline" className="text-[0.5rem] text-emerald-300 border-emerald-400/50">
                                <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Repelled
                              </Badge>
                            )}
                            {raid.status === "active" && (
                              <Badge variant="outline" className="text-[0.5rem] text-amber-300 border-amber-400/50">
                                Turn {raid.turn}
                              </Badge>
                            )}
                          </div>
                          <div className="text-[0.55rem] text-muted-foreground leading-tight">{def.desc}</div>
                        </div>
                        {active && (
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            className="h-6 text-[0.6rem]"
                            onClick={() => setActiveOutpostRaid(isSelected ? null : raid.id)}
                          >
                            {isSelected ? "Selected" : "Engage"}
                          </Button>
                        )}
                      </div>

                      {/* HP bars */}
                      {active && (
                        <div className="mt-1.5 space-y-1">
                          <div>
                            <div className="flex justify-between text-[0.55rem] text-rose-300/80 mb-0.5">
                              <span>Boss HP</span>
                              <span>{Math.ceil(raid.bossHp)}/{raid.bossMaxHp}</span>
                            </div>
                            <div className="h-1.5 bg-rose-950/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-rose-500 transition-all"
                                style={{ width: `${(raid.bossHp / raid.bossMaxHp) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[0.55rem] text-cyan-300/80 mb-0.5">
                              <span>Your HP</span>
                              <span>{Math.ceil(raid.playerHp)}/{raid.playerMaxHp}</span>
                            </div>
                            <div className="h-1.5 bg-cyan-950/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-400 transition-all"
                                style={{ width: `${(raid.playerHp / raid.playerMaxHp) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Deployed legions + deploy buttons (only for selected active raid) */}
                      {active && isSelected && (
                        <div className="mt-2 space-y-1">
                          <div className="text-[0.55rem] text-muted-foreground">
                            Deployed: {raid.deployedLegionIds.length} legion(s) — Power ATK {totalAttack} / DEF {totalDefense} / SPD {totalSpeed}
                          </div>
                          {legions.length === 0 ? (
                            <div className="text-[0.55rem] text-rose-400">Form a legion above before deploying.</div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {legions.map((l) => {
                                const deployed = raid.deployedLegionIds.includes(l.id);
                                return (
                                  <Button
                                    key={l.id}
                                    size="sm"
                                    variant={deployed ? "default" : "outline"}
                                    className="h-6 text-[0.6rem]"
                                    onClick={() => deployLegionToRaid(raid.id, l.id)}
                                  >
                                    {deployed ? "✓" : "+"} {l.name}
                                  </Button>
                                );
                              })}
                            </div>
                          )}
                          <Button
                            size="sm"
                            className="h-7 mt-1 w-full"
                            disabled={raid.deployedLegionIds.length === 0}
                            onClick={() => attackOutpost(raid.id)}
                          >
                            <Zap className="w-3 h-3 mr-1" /> Attack {def.name}
                          </Button>
                        </div>
                      )}

                      {/* Battle log (last 3 entries) */}
                      {raid.log.length > 0 && (
                        <div className="mt-1.5 text-[0.55rem] text-muted-foreground/80 space-y-0.5 pl-1 border-l border-muted-foreground/20">
                          {raid.log.slice(-3).map((entry, i) => (
                            <div key={i}>{entry}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Manual raid spawn (debug + on-demand) */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted-foreground/20">
                <div className="text-[0.55rem] text-muted-foreground">
                  Active: {outpostRaids.filter((r) => r.status === "active").length}/{MAX_ACTIVE_OUTPOST_RAIDS} (auto-spawns every 120s)
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[0.6rem]"
                  disabled={outpostRaids.filter((r) => r.status === "active").length >= MAX_ACTIVE_OUTPOST_RAIDS}
                  onClick={() => spawnOutpostRaid()}
                >
                  <Target className="w-3 h-3 mr-1" /> Summon Raid
                </Button>
              </div>
            </section>

            {/* ===== Creature XP / Levels ===== */}
            {creatures.length > 0 && (
              <section>
                <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">
                  Creature Progression — XP / Levels (+10% ATK/DEF/SPD per level)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {creatures.map((c) => {
                    const xp = creatureXp[c.id] || 0;
                    const lvl = creatureLevel(c.id, creatureLevels);
                    const bonus = creatureLevelBonus(lvl);
                    return (
                      <div key={c.id} className="stat-card p-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[0.65rem] font-semibold truncate">{c.name}</span>
                          <Badge variant="outline" className="text-[0.5rem] text-amber-300 border-amber-400/40">
                            Lv {lvl}
                          </Badge>
                        </div>
                        <div className="text-[0.55rem] text-muted-foreground">
                          ATK {Math.round(c.attack * bonus.attackMult)} · DEF {Math.round(c.defense * bonus.defenseMult)} · SPD {Math.round(c.speed * bonus.speedMult)}
                        </div>
                        <div className="h-1 bg-amber-950/50 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-amber-400 transition-all"
                            style={{ width: `${(xp % CREATURE_XP_PER_LEVEL) / CREATURE_XP_PER_LEVEL * 100}%` }}
                          />
                        </div>
                        <div className="text-[0.5rem] text-muted-foreground/80 mt-0.5">
                          {xp % CREATURE_XP_PER_LEVEL}/{CREATURE_XP_PER_LEVEL} XP to next level (total {xp})
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Design creatures → form Legions → repel {OUTPOST_RAID_COUNT_FOR_L8} outpost raids to unlock Layer 8 (Divine Alliance). At 100 instability, creatures go rogue and raid YOUR galaxies.
        </div>
    </>
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
