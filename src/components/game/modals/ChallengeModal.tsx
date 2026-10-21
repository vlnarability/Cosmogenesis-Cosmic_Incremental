"use client";

import { useGameStore } from "@/game/state/store";
import {
  CHALLENGES,
  getMaxRepeats,
  getChallengeDebuffAtRepeat,
  getChallengeMasteryAtRepeat,
  type ChallengeCompleteWhen,
  type ChallengeEffects,
} from "@/game/data/challenges";
import { STAGES, STAGE_IDS } from "@/game/data/stages";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Lock, Trophy, Skull, Sparkles } from "lucide-react";
import { formatNumber } from "../shared/format";
import { BackgroundLayerBadge } from "../shared/BackgroundLayerBadge";

export function ChallengeContent() {
  const unlockedChallenges = useGameStore((s) => s.unlockedChallenges);
  const activeChallenge = useGameStore((s) => s.activeChallenge);
  const completedChallenges = useGameStore((s) => s.completedChallenges || {});
  const upgrades = useGameStore((s) => s.upgrades);
  const setActiveChallenge = useGameStore((s) => s.setActiveChallenge);

  // QUICK WIN 4 — real-time challenge progress fields
  const population = useGameStore((s) => s.population);
  const stageIndex = useGameStore((s) => s.stageIndex);
  const resources = useGameStore((s) => s.resources || {});

  const hasMastery = (upgrades["challenge_mastery"] || 0) > 0;
  const maxRepeats = getMaxRepeats(hasMastery);
  const totalCompleted = Object.values(completedChallenges).filter((c) => c > 0).length;
  const totalRepeats = Object.values(completedChallenges).reduce((a, b) => a + (b || 0), 0);

  return (
    <>
      {/* LAYER-AS-TAB — was <DialogHeader>/<DialogTitle>/<DialogDescription>
          (Radix primitives that require a <Dialog> parent). Now plain HTML
          since this content renders inline in the tab panel. */}
      <div className="flex flex-col gap-2 text-center sm:text-left mb-3">
        <h2 className="text-lg leading-none font-semibold flex items-center gap-2 flex-wrap">
          <Skull className="w-5 h-5" />
          Layer 1 — Trials
          <BackgroundLayerBadge layerId="evolution" />
        </h2>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>
              Run-modifier challenges — apply a debuff during a run, then earn a permanent mastery bonus on completion.
            </span>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-cyan-400 border-cyan-400/40">
                {totalCompleted}/{CHALLENGES.length} mastered
              </Badge>
              <Badge variant="outline" className="text-violet-400 border-violet-400/40">
                {totalRepeats} repeats
              </Badge>
            </div>
          </div>
        </div>
      </div>

        {!unlockedChallenges ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Trials are sealed.</p>
            <p className="text-xs mt-1">Earn your first Galactic Ascension to unlock Layer 1.</p>
          </div>
        ) : (
          <section>
            <div className="text-[0.7rem] uppercase tracking-wide text-cyan-300/80 mb-2 flex items-center gap-1">
              <Skull className="w-3 h-3" /> Debuff runs for permanent mastery
            </div>
            <div className="space-y-2">
              {CHALLENGES.map((ch) => {
                const completed = completedChallenges[ch.id] || 0;
                const isActive = activeChallenge === ch.id;
                const maxed = completed >= maxRepeats;
                const nextRepeat = completed;
                const debuff = getChallengeDebuffAtRepeat(ch, nextRepeat);
                const mastery = getChallengeMasteryAtRepeat(ch, nextRepeat);
                return (
                  <div key={ch.id} className={`stat-card ${isActive ? "border-amber-400/60" : maxed ? "opacity-60" : ""}`}>
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl shrink-0">{ch.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-sm font-semibold">{ch.name}</span>
                          <Badge variant="outline" className="text-[0.6rem] capitalize">{ch.category}</Badge>
                          {isActive && (
                            <Badge className="text-[0.6rem] bg-amber-500/20 text-amber-300 border-amber-400/40">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Active
                            </Badge>
                          )}
                          {maxed && (
                            <Badge className="text-[0.6rem] bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
                              <Trophy className="w-2.5 h-2.5 mr-0.5" /> Mastered
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug">{ch.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className="text-[0.6rem]">{completed}/{maxRepeats}</Badge>
                      </div>
                    </div>
                    <div className="text-[0.65rem] text-muted-foreground mb-1">
                      <span className="font-semibold text-foreground/80">Goal:</span> {formatGoal(ch)}
                    </div>
                    {isActive && (
                      <div className="text-[0.65rem] mb-1">
                        <ChallengeProgress cond={ch.completeWhen} population={population} stageIndex={stageIndex} resources={resources} />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="rounded-md bg-red-500/10 border border-red-400/20 p-2">
                        <div className="text-[0.6rem] uppercase tracking-wide text-red-300/80 mb-0.5">Debuff (repeat {nextRepeat + 1})</div>
                        <div className="text-[0.7rem] text-foreground/90 leading-snug">{ch.debuff.label}</div>
                        <div className="text-[0.6rem] text-red-300/70 mt-0.5">{formatEffects(debuff)}</div>
                      </div>
                      <div className="rounded-md bg-emerald-500/10 border border-emerald-400/20 p-2">
                        <div className="text-[0.6rem] uppercase tracking-wide text-emerald-300/80 mb-0.5">Reward (repeat {nextRepeat + 1})</div>
                        <div className="text-[0.7rem] text-foreground/90 leading-snug">{ch.mastery.label}</div>
                        <div className="text-[0.6rem] text-emerald-300/70 mt-0.5">{formatEffects(mastery)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-2">
                      {maxed ? (
                        <Button size="sm" variant="outline" disabled className="h-7">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Maxed
                        </Button>
                      ) : isActive ? (
                        <Button size="sm" variant="outline" className="h-7" onClick={() => setActiveChallenge(null)}>
                          Abandon Trial
                        </Button>
                      ) : (
                        <Button size="sm" className="h-7" onClick={() => setActiveChallenge(ch.id)}>
                          Begin Trial (repeat {nextRepeat + 1})
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1">
          Each <span className="text-cyan-300">trial</span> applies a debuff to the run. Complete the goal to
          earn a permanent mastery bonus. Each repeat strengthens the debuff AND the reward (up to {maxRepeats}×).
          Master any <span className="text-amber-300">3 distinct trials</span> (or complete <span className="text-amber-300">5 total repeats</span>) to unlock the Enlightenment prestige layer.
        </div>
    </>
  );
}

function formatGoal(ch: typeof CHALLENGES[number]): string {
  switch (ch.completeWhen.type) {
    case "reachPopulation":
      return `Reach a population of ${ch.completeWhen.value}`;
    case "reachStage":
      return `Reach the ${cap(ch.completeWhen.stage)} stage`;
    case "clearStage":
      return `Clear the ${cap(ch.completeWhen.stage)} stage (evolve past it)`;
    case "reachGalactic":
      return `Reach the Galactic stage`;
    case "stockpileResource":
      return `Stockpile ${ch.completeWhen.value} of ${ch.completeWhen.resource.replace("_", " ")}`;
    default:
      return "Unknown goal";
  }
}

function formatEffects(eff: ChallengeEffects): string {
  const parts: string[] = [];
  if (eff.productionMult !== undefined) {
    const v = eff.productionMult;
    parts.push(v >= 0 ? `+${(v * 100).toFixed(0)}% prod` : `${(v * 100).toFixed(0)}% prod`);
  }
  if (eff.costMult !== undefined) {
    const v = eff.costMult;
    if (v >= 1) parts.push(`costs ×${v.toFixed(2)}`);
    else parts.push(`costs ${(v * 100).toFixed(0)}%`);
  }
  if (eff.popGrowthMult !== undefined) {
    const v = eff.popGrowthMult;
    parts.push(v >= 1 ? `pop ×${v.toFixed(2)}` : `pop ${(v * 100).toFixed(0)}%`);
  }
  if (eff.capMult !== undefined) {
    const v = eff.capMult;
    parts.push(v >= 1 ? `cap ×${v.toFixed(2)}` : `cap ${(v * 100).toFixed(0)}%`);
  }
  if (eff.epMult !== undefined) {
    const v = eff.epMult;
    parts.push(`+${(v * 100).toFixed(0)}% Div`);
  }
  if (eff.disableTech) parts.push("no tech");
  if (eff.disableMilitary) parts.push("no military");
  if (eff.disableEvents) parts.push("no events");
  if (eff.disablePause) parts.push("no pause");
  if (eff.startPop !== undefined) parts.push(`start pop = ${eff.startPop}`);
  if (eff.maxSystems !== undefined) parts.push(`max ${eff.maxSystems} systems`);
  return parts.join(" · ");
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// QUICK WIN 4 — Real-time progress for an active challenge, based on its completeWhen condition.
function ChallengeProgress({
  cond,
  population,
  stageIndex,
  resources,
}: {
  cond: ChallengeCompleteWhen;
  population: number;
  stageIndex: number;
  resources: Record<string, number>;
}) {
  const curStageId = STAGES[stageIndex]?.id;
  switch (cond.type) {
    case "reachPopulation": {
      const cur = Math.min(population, cond.value);
      const pct = Math.min(100, (cur / cond.value) * 100);
      return (
        <div className="rounded-md border border-amber-400/30 bg-amber-500/10 p-1.5">
          <div className="flex items-center justify-between text-amber-300/90">
            <span className="font-semibold">Population progress</span>
            <span>{formatNumber(cur, 0)}/{formatNumber(cond.value, 0)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mt-1">
            <div className="h-full bg-amber-400/80 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }
    case "stockpileResource": {
      const cur = Math.min(resources[cond.resource] || 0, cond.value);
      const pct = Math.min(100, (cur / cond.value) * 100);
      return (
        <div className="rounded-md border border-amber-400/30 bg-amber-500/10 p-1.5">
          <div className="flex items-center justify-between text-amber-300/90">
            <span className="font-semibold">Resources ({cond.resource.replace("_", " ")})</span>
            <span>{formatNumber(cur, 0)}/{formatNumber(cond.value, 0)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mt-1">
            <div className="h-full bg-amber-400/80 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }
    case "reachStage": {
      const targetIdx = STAGE_IDS.indexOf(cond.stage);
      const reached = stageIndex >= targetIdx;
      return (
        <div className="rounded-md border border-amber-400/30 bg-amber-500/10 p-1.5">
          <div className="flex items-center justify-between text-amber-300/90">
            <span className="font-semibold">Stage</span>
            <span>Current: {cap(curStageId || "")} · need {cap(cond.stage)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mt-1">
            <div className="h-full bg-amber-400/80 transition-all" style={{ width: `${reached ? 100 : (stageIndex / Math.max(targetIdx, 1)) * 100}%` }} />
          </div>
        </div>
      );
    }
    case "clearStage": {
      const targetIdx = STAGE_IDS.indexOf(cond.stage);
      const cleared = stageIndex > targetIdx;
      const pct = cleared ? 100 : Math.min(100, (stageIndex / Math.max(targetIdx + 1, 1)) * 100);
      return (
        <div className="rounded-md border border-amber-400/30 bg-amber-500/10 p-1.5">
          <div className="flex items-center justify-between text-amber-300/90">
            <span className="font-semibold">Clear stage</span>
            <span>{cleared ? "Cleared!" : `At ${cap(curStageId || "")} — need to evolve past ${cap(cond.stage)}`}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mt-1">
            <div className="h-full bg-amber-400/80 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }
    case "reachGalactic": {
      const totalStages = STAGES.length;
      const pct = Math.min(100, ((stageIndex + 1) / totalStages) * 100);
      const reached = stageIndex >= totalStages - 1;
      return (
        <div className="rounded-md border border-amber-400/30 bg-amber-500/10 p-1.5">
          <div className="flex items-center justify-between text-amber-300/90">
            <span className="font-semibold">Reach Galactic</span>
            <span>{reached ? "Galactic!" : `Stage ${stageIndex + 1}/${totalStages}`}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mt-1">
            <div className="h-full bg-amber-400/80 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}
