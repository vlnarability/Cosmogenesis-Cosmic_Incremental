"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/game/state/store";
import {
  ENDING_CHOICES,
  cosmicBoonBonus,
} from "@/game/data/eternity";
import {
  UNIVERSE_RULES,
  RULE_BASE,
  RULE_TOTAL_TARGET,
  RULE_STABLE_MIN,
  RULE_STABLE_MAX,
  BIG_BANG_DURATION_SEC,
  REVEAL_COST_RULE,
  REVEAL_COST_AMOUNT,
  ARCHETYPES,
  ARCHETYPE_MAP,
  ARCHETYPE_COUNT,
  computeCrucibleRules,
  type DivineRelic,
} from "@/game/data/genesisEngine";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Lock, Sparkles, CheckCircle2, Star, RefreshCw, AlertTriangle, Atom, Eye, Plus } from "lucide-react";
import { BackgroundLayerBadge } from "../shared/BackgroundLayerBadge";
import { formatNumber, formatTime } from "../shared/format";
import { DIMENSIONS } from "@/game/data/dimensions";

// ----- helpers -----

function ruleShortName(ruleId: string): string {
  const r = UNIVERSE_RULES.find((x) => x.id === ruleId);
  return r ? r.shortName : ruleId;
}

function ruleIcon(ruleId: string): string {
  const r = UNIVERSE_RULES.find((x) => x.id === ruleId);
  return r ? r.icon : "?";
}

function amountLabel(amt: number): string {
  return `${amt >= 0 ? "+" : ""}${amt}`;
}

// ----- main component -----

export function EternityModal() {
  const show = useGameStore((s) => s.showEternity);
  const setShow = useGameStore((s) => s.setShowEternity);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const divinity = useGameStore((s) => s.divinity || 0);
  const cosmicBoonStacks = useGameStore((s) => s.cosmicBoonStacks || 0);
  const chosenEnding = useGameStore((s) => s.chosenEnding);

  // Genesis Engine state
  const divineRelics = useGameStore((s) => s.divineRelics || []);
  const crucibleRelicIds = useGameStore((s) => s.crucibleRelicIds || []);
  const discoveredArchetypes = useGameStore((s) => s.discoveredArchetypes || {});
  const universeSimulating = useGameStore((s) => s.universeSimulating);
  const simulationStartTime = useGameStore((s) => s.simulationStartTime || 0);
  const lastSimResult = useGameStore((s) => s.lastSimulationResult);
  // Subscribe to time so the progress bar updates each tick.
  const time = useGameStore((s) => s.time || 0);
  const totalPlayTime = useGameStore((s) => s.totalPlayTime || 0);
  const totalRuns = useGameStore((s) => s.totalRuns || 0);

  // Actions
  const addRelicToCrucible = useGameStore((s) => s.addRelicToCrucible);
  const clearCrucible = useGameStore((s) => s.clearCrucible);
  const revealRelicRule = useGameStore((s) => s.revealRelicRule);
  const revealRelicAmount = useGameStore((s) => s.revealRelicAmount);
  const triggerBigBang = useGameStore((s) => s.triggerBigBang);
  const chooseEnding = useGameStore((s) => s.chooseEnding);

  const isUnlocked = !!unlockedLayers.eternity;
  const discoveredCount = Object.values(discoveredArchetypes).filter(Boolean).length;
  const allDiscovered = discoveredCount >= ARCHETYPE_COUNT;
  const boon = cosmicBoonBonus(cosmicBoonStacks);

  // Compute crucible rule view (recomputed each render — cheap).
  const crucibleRelics: DivineRelic[] = useMemo(() => {
    return crucibleRelicIds
      .map((id) => divineRelics.find((r) => r.id === id))
      .filter((r): r is DivineRelic => !!r);
  }, [crucibleRelicIds, divineRelics]);

  const crucibleComp = useMemo(
    () => computeCrucibleRules(crucibleRelics),
    [crucibleRelics]
  );

  const simElapsed = universeSimulating ? Math.min(BIG_BANG_DURATION_SEC, time - simulationStartTime) : 0;
  const simProgressPct = universeSimulating ? Math.min(100, (simElapsed / BIG_BANG_DURATION_SEC) * 100) : 0;
  const simRemainingSec = universeSimulating ? Math.max(0, BIG_BANG_DURATION_SEC - simElapsed) : 0;

  // Ending confirmation dialog
  const [pendingEnding, setPendingEnding] = useState<"preserve" | "reset" | null>(null);
  const confirmEnding = () => {
    if (pendingEnding) {
      chooseEnding(pendingEnding);
      setPendingEnding(null);
    }
  };

  // Total score for the ending screen
  const finalScore = useMemo(() => {
    // Resources: sum of all primary resources.
    const resourceIds: Array<string> = ["atp", "glucose", "proteins", "lipids", "elements",
      "food", "water", "materials", "organic_matter", "knowledge", "culture",
      "wood", "lumber", "stone", "clay", "science", "happiness", "military_power",
      "production", "gold", "influence", "energy", "alloys", "data",
      "divinity", "evolution_points", "enlightenment_points", "transcendence_points"];
    const resources = useGameStore.getState().resources || {};
    let sum = 0;
    for (const id of resourceIds) {
      sum += (resources as any)[id] || 0;
    }
    // Layers completed count
    const unlocked = useGameStore.getState().unlockedLayers || {};
    const layersCompleted = Object.values(unlocked).filter(Boolean).length;
    // Worlds: authored worlds + claimed galaxy systems
    const authoredWorlds = (useGameStore.getState() as any).authoredWorlds || [];
    const galaxySystems = (useGameStore.getState() as any).galaxySystems || [];
    const claimedGalaxies = galaxySystems.filter((g: any) => g?.claimed).length;
    const worldCount = authoredWorlds.length + claimedGalaxies;
    // Final score: weighted sum
    return Math.floor(sum * 0.01 + worldCount * 100 + layersCompleted * 500 + discoveredCount * 1000);
  }, [discoveredCount, allDiscovered]);

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg flex-wrap">
            <Star className="w-5 h-5" />
            Layer 10 — Eternity (Genesis Engine)
            <BackgroundLayerBadge layerId="eternity" />
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between flex-wrap gap-2">
            <span>
              Load relics into the Crucible, trigger Big Bangs, and discover all 100 archetypes.
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-violet-300 border-violet-400/40">
                ✨ {formatNumber(divinity, 0)} Divinity
              </Badge>
              <Badge variant="outline" className="text-amber-300 border-amber-400/40">
                🌟 {discoveredCount}/{ARCHETYPE_COUNT}
              </Badge>
              {cosmicBoonStacks > 0 && (
                <Badge variant="outline" className="text-indigo-300 border-indigo-400/40">
                  🌠 {cosmicBoonStacks} Boon{cosmicBoonStacks !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">The Genesis Engine lies dormant.</p>
            <p className="text-xs mt-1">Defeat all 3 Old Gods (Layer 9 — Divine War) to ignite the Crucible.</p>
          </div>
        ) : allDiscovered && chosenEnding === null ? (
          <EndingScreen
            discoveredCount={discoveredCount}
            totalPlayTime={totalPlayTime}
            thisRunTime={time}
            totalRuns={totalRuns}
            finalScore={finalScore}
            boon={boon}
            cosmicBoonStacks={cosmicBoonStacks}
            onChooseEnding={(id) => setPendingEnding(id)}
          />
        ) : chosenEnding !== null ? (
          <div className="text-center py-10">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-amber-300" />
            <p className="text-sm">Ending chosen: {ENDING_CHOICES.find((e) => e.id === chosenEnding)?.name}</p>
            <p className="text-xs mt-1 text-muted-foreground">
              {ENDING_CHOICES.find((e) => e.id === chosenEnding)?.desc}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setShow(false)}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Relic Inventory */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1 justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Divine Relic Inventory ({divineRelics.length})
                </span>
                <span className="text-[0.6rem] normal-case">
                  Reveal rule name: {REVEAL_COST_RULE} Div · amount: {REVEAL_COST_AMOUNT} Div
                </span>
              </div>
              {divineRelics.length === 0 ? (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  No relics yet. Trigger your first Big Bang with a starter relic to gain more.
                  <div className="mt-2">
                    <StarterRelicHint />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {divineRelics.map((r) => {
                    const inCrucible = crucibleRelicIds.includes(r.id);
                    return (
                      <div
                        key={r.id}
                        className={`stat-card p-2 ${inCrucible ? "border-amber-400/70 bg-amber-500/10" : "border-slate-600/40"}`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <Atom className="w-3 h-3 text-amber-300" />
                          <span className="text-xs font-medium truncate flex-1">{r.name}</span>
                          {inCrucible && (
                            <Badge variant="outline" className="text-[0.55rem] text-amber-300 border-amber-400/60">in crucible</Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          {r.rules.map((rr, idx) => {
                            const showRule = rr.revealed.rule;
                            const showAmt = rr.revealed.amount;
                            return (
                              <div key={idx} className="flex items-center gap-1 text-[0.65rem]">
                                <span className="w-4 text-center">{showRule ? ruleIcon(rr.ruleId) : "?"}</span>
                                <span className={`flex-1 truncate ${showRule ? "text-foreground" : "text-muted-foreground/70"}`}>
                                  {showRule ? ruleShortName(rr.ruleId) : "???"}
                                </span>
                                <span className={`font-mono ${showAmt ? (rr.amount >= 0 ? "text-emerald-300" : "text-rose-300") : "text-muted-foreground/70"}`}>
                                  {showAmt ? amountLabel(rr.amount) : "???"}
                                </span>
                                <div className="flex items-center gap-0.5">
                                  {!showRule && (
                                    <button
                                      onClick={() => revealRelicRule(r.id, idx)}
                                      disabled={divinity < REVEAL_COST_RULE || universeSimulating}
                                      className="text-[0.55rem] px-1 py-0.5 rounded border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                                      title={`Reveal rule name (${REVEAL_COST_RULE} Divinity)`}
                                    >
                                      <Eye className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                  {showRule && !showAmt && (
                                    <button
                                      onClick={() => revealRelicAmount(r.id, idx)}
                                      disabled={divinity < REVEAL_COST_AMOUNT || universeSimulating}
                                      className="text-[0.55rem] px-1 py-0.5 rounded border border-amber-400/40 text-amber-300 hover:bg-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                                      title={`Reveal amount (${REVEAL_COST_AMOUNT} Divinity)`}
                                    >
                                      <Eye className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                  {showRule && showAmt && (
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {!inCrucible && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-6 mt-1.5 text-[0.6rem] text-amber-300 border-amber-400/40"
                            disabled={crucibleRelicIds.length >= 5 || universeSimulating}
                            onClick={() => addRelicToCrucible(r.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add to Crucible ({crucibleRelicIds.length}/5)
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Crucible */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1 justify-between">
                <span className="flex items-center gap-1">
                  <Atom className="w-3 h-3" /> The Crucible ({crucibleRelicIds.length}/5 relics)
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-5 text-[0.55rem] text-rose-300 border-rose-400/40"
                    disabled={crucibleRelicIds.length === 0 || universeSimulating}
                    onClick={() => clearCrucible()}
                    title="Clear all relics from the crucible"
                  >
                    <RefreshCw className="w-2.5 h-2.5 mr-0.5" /> Clear
                  </Button>
                </div>
              </div>
              <div className="stat-card p-2">
                {/* Crucible slots */}
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const relic = crucibleRelics[slotIdx];
                    return (
                      <div
                        key={slotIdx}
                        className={`rounded border p-1 text-center text-[0.55rem] ${relic ? "border-amber-400/60 bg-amber-500/10 text-amber-200" : "border-slate-700/40 text-muted-foreground/60"}`}
                      >
                        {relic ? (
                          <div className="truncate" title={relic.name}>
                            <Atom className="w-2.5 h-2.5 inline mr-0.5" />
                            {relic.name.replace("Relic of the ", "")}
                          </div>
                        ) : (
                          <span>empty</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Computed rule levels */}
                <div className="space-y-1">
                  {crucibleComp.rules.map((rv) => {
                    const stable = rv.finalValue >= RULE_STABLE_MIN && rv.finalValue <= RULE_STABLE_MAX;
                    const low = rv.finalValue < RULE_STABLE_MIN;
                    const high = rv.finalValue > RULE_STABLE_MAX;
                    return (
                      <div key={rv.ruleId} className="flex items-center gap-2 text-[0.7rem]">
                        <span className="w-5 text-center">{ruleIcon(rv.ruleId)}</span>
                        <span className="w-28 truncate">{ruleShortName(rv.ruleId)}</span>
                        {/* Displayed value: revealed portion + mystery marker */}
                        <span className={`font-mono w-14 text-right ${stable ? "text-emerald-300" : low ? "text-rose-300" : high ? "text-amber-300" : "text-foreground"}`}>
                          {rv.revealedValue}
                          {rv.hasMystery ? "±?" : ""}
                        </span>
                        <span className="text-muted-foreground/60 text-[0.6rem]">→</span>
                        {/* Final value (after overflow) */}
                        <span className={`font-mono w-8 text-right font-bold ${stable ? "text-emerald-300" : low ? "text-rose-300" : high ? "text-amber-300" : "text-foreground"}`}>
                          {rv.finalValue}
                        </span>
                        {(low || high) && (
                          <AlertTriangle className={`w-3 h-3 ${low ? "text-rose-400" : "text-amber-400"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40 text-[0.65rem]">
                  <span className="text-muted-foreground">
                    Total: <span className={`font-mono font-bold ${crucibleComp.total === RULE_TOTAL_TARGET ? "text-emerald-300" : "text-rose-300"}`}>{crucibleComp.total}</span> / {RULE_TOTAL_TARGET}
                  </span>
                  <span className="text-muted-foreground">
                    Base per rule: {RULE_BASE} · Stability: <span className={crucibleComp.unstable ? "text-rose-300" : "text-emerald-300"}>
                      {crucibleComp.unstable ? `UNSTABLE (instability ${crucibleComp.instability})` : "stable"}
                    </span>
                  </span>
                </div>
              </div>
              {/* Big Bang button */}
              <div className="mt-2">
                {universeSimulating ? (
                  <div className="stat-card p-2">
                    <div className="flex items-center justify-between text-[0.7rem] mb-1">
                      <span className="text-amber-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 animate-pulse" /> Simulating the cosmos...
                      </span>
                      <span className="font-mono text-amber-300">{simRemainingSec.toFixed(0)}s</span>
                    </div>
                    <Progress value={simProgressPct} className="h-2 bg-slate-800/60" />
                    <div className="text-[0.6rem] text-muted-foreground mt-1 text-center">
                      The crucible blazes — reality crystallizes...
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full h-9 bg-gradient-to-r from-amber-600 via-rose-600 to-violet-600 hover:from-amber-500 hover:via-rose-500 hover:to-violet-500 text-white font-bold"
                    disabled={crucibleRelicIds.length < 1}
                    onClick={() => triggerBigBang()}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Trigger Big Bang {crucibleRelicIds.length < 1 ? "(add a relic first)" : `(${crucibleRelicIds.length} relic${crucibleRelicIds.length !== 1 ? "s" : ""})`}
                  </Button>
                )}
              </div>
            </section>

            {/* Last simulation result */}
            {lastSimResult && (
              <section>
                <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">
                  Last Big Bang Result
                </div>
                <div className={`stat-card p-2 ${lastSimResult.stable ? "border-emerald-400/60 bg-emerald-500/5" : "border-rose-400/60 bg-rose-500/5"}`}>
                  {lastSimResult.stable ? (
                    <div className="text-[0.7rem]">
                      <div className="flex items-center gap-1 text-emerald-300 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> STABLE
                      </div>
                      <div className="text-muted-foreground mt-1">
                        {lastSimResult.archetypeId ? (
                          <>Discovered archetype: <span className="text-amber-300 font-semibold">{ARCHETYPE_MAP[lastSimResult.archetypeId]?.name || "Unknown"}</span></>
                        ) : (
                          <>No archetype matched this combination.</>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-0.5">
                        +{lastSimResult.relicsGained} new relic(s).
                      </div>
                    </div>
                  ) : (
                    <div className="text-[0.7rem]">
                      <div className="flex items-center gap-1 text-rose-300 font-semibold">
                        <AlertTriangle className="w-3 h-3" /> UNSTABLE
                      </div>
                      <div className="text-muted-foreground mt-1">
                        Instability level: {lastSimResult.instability}. Lost {lastSimResult.relicsLost} relic(s) from inventory.
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Archetype Collection */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" /> Archetype Collection ({discoveredCount}/{ARCHETYPE_COUNT})
                </span>
                <span className="text-[0.6rem] normal-case">
                  {allDiscovered ? "All discovered — ending unlocked!" : `${ARCHETYPE_COUNT - discoveredCount} remaining`}
                </span>
              </div>
              <Progress value={(discoveredCount / ARCHETYPE_COUNT) * 100} className="h-2 mb-2 bg-slate-800/60" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1">
                {ARCHETYPES.map((a) => {
                  const found = !!discoveredArchetypes[a.id];
                  return (
                    <div
                      key={a.id}
                      className={`stat-card p-1.5 text-[0.65rem] ${found ? "border-amber-400/60 bg-amber-500/10" : "border-slate-700/40 opacity-80"}`}
                    >
                      <div className="flex items-center gap-1">
                        {found ? (
                          <CheckCircle2 className="w-2.5 h-2.5 text-amber-300" />
                        ) : (
                          <Lock className="w-2.5 h-2.5 text-muted-foreground/60" />
                        )}
                        <span className={`font-medium truncate flex-1 ${found ? "text-amber-200" : "text-muted-foreground"}`}>
                          {found ? a.name : "???"}
                        </span>
                        {found && (
                          <Badge variant="outline" className="text-[0.5rem] text-emerald-300 border-emerald-400/40">+1%</Badge>
                        )}
                      </div>
                      <div className="text-[0.55rem] text-muted-foreground/80 mt-0.5 leading-tight">
                        {found ? `Rules: ${a.rules.join("/")}` : a.hint}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Bonus summary */}
            <section>
              <div className="stat-card p-2 text-[0.7rem]">
                <div className="text-[0.6rem] uppercase tracking-wide text-muted-foreground mb-1">Current bonuses</div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-emerald-300 border-emerald-400/40">
                    +{(discoveredCount * 1).toFixed(0)}% production (archetypes)
                  </Badge>
                  {cosmicBoonStacks > 0 && (
                    <Badge variant="outline" className="text-indigo-300 border-indigo-400/40">
                      +{(boon * 100).toFixed(0)}% production (cosmic boons)
                    </Badge>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          Discover all {ARCHETYPE_COUNT} archetypes to unlock the ending screen. Each archetype grants +1% production.
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShow(false)}>Close</Button>
        </div>
      </DialogContent>

      {/* Ending-screen confirmation dialog */}
      <AlertDialog open={pendingEnding !== null} onOpenChange={(open) => { if (!open) setPendingEnding(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingEnding === "preserve" ? "Continue in this Realm?" : "Explore another Dimension?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingEnding === "preserve"
                ? "Continue playing with all bonuses intact. The Genesis Engine remains open for further experiments."
                : "Reset the universe and begin a new dimension. You keep all discovered archetypes and gain a permanent Cosmic Boon stack (+10% all production). This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEnding}
              className={pendingEnding === "reset" ? "bg-rose-600 hover:bg-rose-700 text-white" : ""}
            >
              {pendingEnding === "preserve" ? "Continue" : "Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

// ----- Ending screen -----

function EndingScreen({
  discoveredCount,
  totalPlayTime,
  thisRunTime,
  totalRuns,
  finalScore,
  boon,
  cosmicBoonStacks,
  onChooseEnding,
}: {
  discoveredCount: number;
  totalPlayTime: number;
  thisRunTime: number;
  totalRuns: number;
  finalScore: number;
  boon: number;
  cosmicBoonStacks: number;
  onChooseEnding: (id: "preserve" | "reset") => void;
}) {
  return (
    <div className="space-y-4">
      {/* Cosmic visualization */}
      <div className="relative h-48 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-900 via-violet-900 to-rose-900 border border-amber-400/30">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute -inset-12 rounded-full bg-amber-400/20 blur-2xl animate-pulse" />
            <div className="absolute -inset-8 rounded-full bg-violet-400/30 blur-xl animate-pulse" />
            <Sparkles className="w-16 h-16 text-amber-300 relative animate-pulse" />
            <div className="absolute -top-3 -left-3 w-3 h-3 bg-cyan-300 rounded-full animate-ping" />
            <div className="absolute -top-6 right-0 w-2 h-2 bg-rose-300 rounded-full animate-ping" />
            <div className="absolute bottom-2 -right-4 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
            <div className="absolute bottom-4 -left-8 w-1.5 h-1.5 bg-amber-200 rounded-full animate-ping" />
          </div>
        </div>
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <div className="text-amber-200 text-sm font-bold tracking-wide">THE GENESIS COMPLETE</div>
          <div className="text-[0.65rem] text-amber-100/70 mt-0.5">
            You have forged all 100 archetypes. The multiverse unfolds before you.
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <EndingStat label="Archetypes" value={`${discoveredCount}/${ARCHETYPE_COUNT}`} />
        <EndingStat label="Total time (all dimensions)" value={formatTime(totalPlayTime)} />
        <EndingStat label="This dimension" value={formatTime(thisRunTime)} />
        <EndingStat label="Dimensions explored" value={`${totalRuns + 1}`} />
        <EndingStat label="Cosmic Boons" value={`${cosmicBoonStacks} (+${(boon * 100).toFixed(0)}%)`} />
        <EndingStat label="Final score" value={formatNumber(finalScore, 0)} />
      </div>

      {/* Choice buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Continue in this Realm */}
        <button
          onClick={() => onChooseEnding("preserve")}
          className="stat-card text-left p-3 hover:border-amber-400/60 border-amber-400/40"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🌐</span>
            <span className="text-sm font-bold">Continue in this Realm</span>
          </div>
          <div className="text-[0.65rem] text-muted-foreground leading-snug">
            Keep playing with all bonuses intact. The Genesis Engine remains open for further experiments.
          </div>
        </button>
        {/* Explore another Dimension — shows the dimension picker */}
        <button
          onClick={() => onChooseEnding("reset")}
          className="stat-card text-left p-3 hover:border-rose-400/60 border-rose-400/50"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🔄</span>
            <span className="text-sm font-bold">Explore another Dimension</span>
          </div>
          <div className="text-[0.65rem] text-muted-foreground leading-snug">
            Reset with a Cosmic Boon (+10% all production permanently). Choose your next dimension below.
          </div>
        </button>
      </div>

      {/* Dimension picker — shown when player chooses "Explore another Dimension" */}
      {/* The picker is always visible on the ending screen so the player can see their options. */}
      <DimensionPicker />
    </div>
  );
}

// ----- Dimension Picker -----
// Shows all available dimensions. The player's current dimension + any visited
// dimensions are selectable. Unvisited dimensions are selectable too (first visit).
function DimensionPicker() {
  const selectDimension = useGameStore((s) => s.selectDimension);
  const activeDimension = useGameStore((s) => s.activeDimension || "mundane");
  const visitedDimensions = useGameStore((s) => s.visitedDimensions || ["mundane"]);

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Choose Your Next Dimension
      </div>
      <div className="space-y-1.5">
        {DIMENSIONS.map((dim) => {
          const isCurrent = dim.id === activeDimension;
          const isVisited = visitedDimensions.includes(dim.id);
          const isAvailable = dim.isBase || true; // All 3 dimensions available at launch
          return (
            <button
              key={dim.id}
              disabled={!isAvailable || isCurrent}
              onClick={() => selectDimension(dim.id)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                isCurrent
                  ? "border-amber-400/60 bg-amber-500/10 opacity-60"
                  : isAvailable
                    ? "border-border/60 hover:border-amber-400/40 hover:bg-amber-500/5"
                    : "border-border/30 opacity-40 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{dim.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">
                    {dim.name}
                    {isCurrent && <span className="text-[0.6rem] text-amber-300 ml-2">(current)</span>}
                    {isVisited && !isCurrent && <span className="text-[0.6rem] text-emerald-300 ml-2">visited</span>}
                  </div>
                  <div className="text-[0.65rem] text-muted-foreground truncate">{dim.desc}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="text-[0.6rem] text-muted-foreground/60 italic">
        Future dimensions (Norse, Greek, Egypt, Post-Apocalyptic) will be added in content updates.
      </div>
    </div>
  );
}

function EndingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card p-2">
      <div className="text-[0.55rem] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-bold text-amber-200 mt-0.5">{value}</div>
    </div>
  );
}

// ----- Starter relic helper -----
// Hint shown to players who haven't acquired any relics yet. The actual
// starter-relic seeding happens in the store when L10 first unlocks (and via
// debugUnlockAll for testing).

function StarterRelicHint() {
  return (
    <span className="text-[0.6rem] text-muted-foreground">
      Defeat Old Gods and complete trials to earn relics — or use the Genesis Engine once you have one.
    </span>
  );
}
