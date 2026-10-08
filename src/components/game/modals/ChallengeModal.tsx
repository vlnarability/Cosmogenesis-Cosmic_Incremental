"use client";

import { useGameStore } from "@/game/state/store";
import { CHALLENGES, getMaxRepeats, getChallengeDebuffAtRepeat, getChallengeMasteryAtRepeat, type ChallengeCompleteWhen } from "@/game/data/challenges";
import {
  TRIAL_REALMS,
  PLAYABLE_REALM_IDS,
  REALM_GROWTH_BREAKS_GOAL,
  REALM_DISCONTENT_HAPPINESS_THRESHOLD,
  REALM_DISCONTENT_SURVIVE_SECONDS,
  REALM_DISCONTENT_GOLD_GOAL,
  REALM_SWIFTNESS_TIME_LIMIT,
} from "@/game/data/trialRealms";
import { STAGES, STAGE_IDS } from "@/game/data/stages";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Lock, Trophy, Skull, Sparkles, Clock, Hourglass } from "lucide-react";
import { formatNumber } from "../shared/format";

// Static color class lookup so Tailwind keeps the classes at build time.
const REALM_COLOR_CLASSES: Record<string, { text: string; border: string }> = {
  emerald: { text: "text-emerald-300", border: "border-emerald-400/40" },
  amber: { text: "text-amber-300", border: "border-amber-400/40" },
  rose: { text: "text-rose-300", border: "border-rose-400/40" },
  violet: { text: "text-violet-300", border: "border-violet-400/40" },
  cyan: { text: "text-cyan-300", border: "border-cyan-400/40" },
  red: { text: "text-red-300", border: "border-red-400/40" },
  pink: { text: "text-pink-300", border: "border-pink-400/40" },
  sky: { text: "text-sky-300", border: "border-sky-400/40" },
  indigo: { text: "text-indigo-300", border: "border-indigo-400/40" },
  yellow: { text: "text-yellow-300", border: "border-yellow-400/40" },
};

export function ChallengeModal() {
  const showChallenges = useGameStore((s) => s.showChallenges);
  const setShowChallenges = useGameStore((s) => s.setShowChallenges);
  const unlockedChallenges = useGameStore((s) => s.unlockedChallenges);
  const activeChallenge = useGameStore((s) => s.activeChallenge);
  const completedChallenges = useGameStore((s) => s.completedChallenges || {});
  const upgrades = useGameStore((s) => s.upgrades);
  const setActiveChallenge = useGameStore((s) => s.setActiveChallenge);

  // QUICK WIN 4 — real-time challenge progress fields
  const population = useGameStore((s) => s.population);
  const stageIndex = useGameStore((s) => s.stageIndex);
  const resources = useGameStore((s) => s.resources || {});

  // REBUILD L1 — Trial Realms state
  const activeTrialRealm = useGameStore((s) => s.activeTrialRealm);
  const trialRealmState = useGameStore((s) => s.trialRealmState || {});
  const trialRealmsCompleted = useGameStore((s) => s.trialRealmsCompleted || {});
  const trialRealmBestTimes = useGameStore((s) => s.trialRealmBestTimes || {}); // FEATURE 1 — local leaderboard
  const gameTime = useGameStore((s) => s.time); // FEATURE 1 — live timer tick
  const setActiveTrialRealm = useGameStore((s) => s.setActiveTrialRealm);
  const realmBreakthrough = useGameStore((s) => s.realmBreakthrough);
  const realmDiscontentAction = useGameStore((s) => s.realmDiscontentAction);

  const hasMastery = (upgrades["challenge_mastery"] || 0) > 0;
  const maxRepeats = getMaxRepeats(hasMastery);
  const totalCompleted = Object.values(completedChallenges).filter((c) => c > 0).length;
  const totalRepeats = Object.values(completedChallenges).reduce((a, b) => a + (b || 0), 0);
  const realmsCompletedCount = Object.values(trialRealmsCompleted).filter(Boolean).length;

  // FEATURE 1 — format best time as "Xm Ys"
  function formatBestTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  }
  // Live timer for the currently active realm
  const liveElapsed = activeTrialRealm
    ? Math.max(0, gameTime - ((trialRealmState[activeTrialRealm]?.startedAt) || gameTime))
    : 0;

  return (
    <Dialog open={showChallenges} onOpenChange={setShowChallenges}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Skull className="w-5 h-5" />
            Layer 1 — Trials & Realms
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>
              Two paths of mastery: <span className="text-cyan-300">Trials</span> (debuff runs) and <span className="text-amber-300">Realms</span> (mini-games).
            </span>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-cyan-400 border-cyan-400/40">
                {totalCompleted}/{CHALLENGES.length} trials
              </Badge>
              <Badge variant="outline" className="text-amber-400 border-amber-400/40">
                {realmsCompletedCount}/{TRIAL_REALMS.length} realms
              </Badge>
              <Badge variant="outline" className="text-violet-400 border-violet-400/40">
                {totalRepeats} repeats
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        {!unlockedChallenges ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Trials are sealed.</p>
            <p className="text-xs mt-1">Earn your first Galactic Ascension to unlock Layer 1.</p>
          </div>
        ) : activeTrialRealm ? (
          <ActiveRealmView
            realmId={activeTrialRealm}
            state={trialRealmState[activeTrialRealm] || {}}
            onClose={() => setActiveTrialRealm(null)}
            onBreakthrough={realmBreakthrough}
            onDiscontentAction={realmDiscontentAction}
            stageIndex={stageIndex}
            liveElapsed={liveElapsed}
          />
        ) : (
          <>
            {/* Trial Realms — the new gameplay loop */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-amber-300/80 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Trial Realms — distinct mini-games
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TRIAL_REALMS.map((r) => {
                  const completed = !!trialRealmsCompleted[r.id];
                  const isActive = activeTrialRealm === r.id;
                  const playable = PLAYABLE_REALM_IDS.includes(r.id);
                  const colorClass = REALM_COLOR_CLASSES[r.color] || REALM_COLOR_CLASSES.amber;
                  const bestTime = trialRealmBestTimes[r.id]; // FEATURE 1 — local best time
                  return (
                    <button
                      key={r.id}
                      onClick={() => playable && !completed && setActiveTrialRealm(r.id)}
                      disabled={!playable || completed || isActive}
                      className={`stat-card text-left p-3 ${isActive ? "border-amber-400/60 bg-amber-500/10" : completed ? "opacity-60 border-emerald-400/40" : playable ? "hover:border-amber-400/40" : "opacity-70"}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-2xl shrink-0">{r.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-sm font-semibold">{r.name}</span>
                            {playable ? (
                              <Badge variant="outline" className={`text-[0.55rem] ${colorClass.text} ${colorClass.border}`}>Mini-game</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[0.55rem] text-muted-foreground">Coming Soon</Badge>
                            )}
                            {completed && (
                              <Badge className="text-[0.55rem] bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
                                <Trophy className="w-2.5 h-2.5 mr-0.5" /> Done
                              </Badge>
                            )}
                            {/* FEATURE 1 — local best-time leaderboard */}
                            {bestTime !== undefined && (
                              <Badge variant="outline" className="text-[0.55rem] text-amber-300 border-amber-400/40">
                                <Clock className="w-2.5 h-2.5 mr-0.5" /> Best: {formatBestTime(bestTime)}
                              </Badge>
                            )}
                            {/* FEATURE 1 — live timer for currently active realm */}
                            {isActive && (
                              <Badge variant="outline" className="text-[0.55rem] text-cyan-300 border-cyan-400/40 animate-pulse">
                                <Hourglass className="w-2.5 h-2.5 mr-0.5" /> Time: {Math.floor(liveElapsed)}s
                              </Badge>
                            )}
                          </div>
                          <div className="text-[0.65rem] text-muted-foreground leading-snug mt-0.5">{r.tagline}</div>
                          <div className="text-[0.6rem] text-amber-300/70 mt-1">Goal: {r.goal}</div>
                          {!playable && (
                            <div className="text-[0.55rem] text-muted-foreground mt-1 italic">{r.mechanic}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <Separator className="my-3" />

            {/* Classic Trials — the existing debuff system */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-cyan-300/80 mb-2 flex items-center gap-1">
                <Skull className="w-3 h-3" /> Classic Trials — debuff runs for permanent mastery
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
          </>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1">
          <span className="text-amber-300">Trial Realms</span> are interactive mini-games with one core mechanic each.
          The <span className="text-cyan-300">Classic Trials</span> apply debuffs for repeatable mastery bonuses.
          Complete any 3 distinct trials to unlock the Enlightenment prestige layer.
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShowChallenges(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== Active realm view — shows the actual mini-game UI =====
function ActiveRealmView({
  realmId,
  state,
  onClose,
  onBreakthrough,
  onDiscontentAction,
  stageIndex,
  liveElapsed = 0,
}: {
  realmId: string;
  state: Record<string, any>;
  onClose: () => void;
  onBreakthrough: () => void;
  onDiscontentAction: (action: "celebrate" | "tax" | "ignore") => void;
  stageIndex: number;
  liveElapsed?: number; // FEATURE 1 — live timer
}) {
  const realm = TRIAL_REALMS.find((r) => r.id === realmId);
  if (!realm) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{realm.icon}</span>
          <div>
            <div className="text-base font-semibold">{realm.name}</div>
            <div className="text-[0.65rem] text-muted-foreground">{realm.tagline}</div>
          </div>
          {/* FEATURE 1 — live timer in the active realm header */}
          <Badge variant="outline" className="ml-2 text-[0.6rem] text-cyan-300 border-cyan-400/40 animate-pulse">
            <Hourglass className="w-2.5 h-2.5 mr-0.5" /> Time: {Math.floor(liveElapsed)}s
          </Badge>
        </div>
        <Button size="sm" variant="outline" onClick={onClose}>Exit Realm</Button>
      </div>

      {realmId === "realm_growth" && (
        <RealmGrowthGame state={state} onBreakthrough={onBreakthrough} />
      )}
      {realmId === "realm_discontent" && (
        <RealmDiscontentGame
          state={state}
          onAction={onDiscontentAction}
        />
      )}
      {realmId === "realm_swiftness" && (
        <RealmSwiftnessGame state={state} stageIndex={stageIndex} />
      )}
    </div>
  );
}

// ===== Realm of Growth — energy bar that fills passively, click to Break Through =====
function RealmGrowthGame({ state, onBreakthrough }: { state: Record<string, any>; onBreakthrough: () => void }) {
  const energy = state.energy || 0;
  const breaks = state.breaks || 0;
  const completed = !!state.completed;
  const canBreak = energy >= 100 && !completed;

  return (
    <div className="stat-card space-y-3">
      <div className="text-[0.7rem] text-muted-foreground">
        Energy fills at 0.5/s. When the bar is full, click Break Through to convert energy into +50% population.
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-emerald-300/80">Energy</span>
          <span className="font-mono">{energy.toFixed(1)} / 100</span>
        </div>
        <div className="h-6 rounded-md bg-emerald-950/40 border border-emerald-500/30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600/60 to-emerald-400/80 transition-all"
            style={{ width: `${Math.min(100, energy)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs">
          <span className="text-muted-foreground">Break-Throughs: </span>
          <span className="font-semibold text-amber-300">{breaks} / {REALM_GROWTH_BREAKS_GOAL}</span>
        </div>
        {completed ? (
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
            <Trophy className="w-3 h-3 mr-1" /> Conquered
          </Badge>
        ) : (
          <Button size="sm" disabled={!canBreak} onClick={onBreakthrough}>
            <Sparkles className="w-3 h-3 mr-1" /> Break Through
          </Button>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex gap-1">
        {Array.from({ length: REALM_GROWTH_BREAKS_GOAL }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-sm ${i < breaks ? "bg-emerald-400" : "bg-muted-foreground/20"}`}
          />
        ))}
      </div>
    </div>
  );
}

// ===== Realm of Discontent — oscillating happiness + gold goal =====
function RealmDiscontentGame({
  state,
  onAction,
}: {
  state: Record<string, any>;
  onAction: (action: "celebrate" | "tax" | "ignore") => void;
}) {
  const happiness = state.happiness ?? 50;
  const gold = state.gold ?? 0;
  const survivedTime = state.survivedTime ?? 0;
  const completed = !!state.completed;
  const happinessBelowThreshold = !!state.happinessBelowThreshold;
  const survivalProgress = Math.min(REALM_DISCONTENT_SURVIVE_SECONDS, survivedTime);

  const danger = happiness < REALM_DISCONTENT_HAPPINESS_THRESHOLD + 5;

  return (
    <div className="stat-card space-y-3">
      <div className="text-[0.7rem] text-muted-foreground">
        Happiness oscillates between 0-100. Keep it above <span className="text-rose-300">{REALM_DISCONTENT_HAPPINESS_THRESHOLD}</span> while stockpiling <span className="text-amber-300">{REALM_DISCONTENT_GOLD_GOAL} gold</span>. Survive {REALM_DISCONTENT_SURVIVE_SECONDS}s above the threshold.
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className={danger ? "text-rose-300" : "text-amber-300/80"}>Happiness</span>
          <span className="font-mono">{happiness.toFixed(1)} / 100</span>
        </div>
        <div className="h-4 rounded-md bg-rose-950/40 border border-rose-500/30 overflow-hidden relative">
          {/* Threshold line at 30% */}
          <div className="absolute top-0 bottom-0 w-px bg-rose-400/50 z-10" style={{ left: `${REALM_DISCONTENT_HAPPINESS_THRESHOLD}%` }} />
          <div
            className={`h-full transition-all ${danger ? "bg-rose-500/80" : "bg-gradient-to-r from-amber-600/60 to-amber-400/80"}`}
            style={{ width: `${Math.min(100, happiness)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md bg-amber-500/10 border border-amber-400/20 p-2">
          <div className="text-[0.6rem] uppercase tracking-wide text-amber-300/80">Gold</div>
          <div className="text-lg font-mono">{Math.floor(gold)} / {REALM_DISCONTENT_GOLD_GOAL}</div>
        </div>
        <div className="rounded-md bg-cyan-500/10 border border-cyan-400/20 p-2">
          <div className="text-[0.6rem] uppercase tracking-wide text-cyan-300/80">Survived (above threshold)</div>
          <div className="text-lg font-mono">{survivalProgress.toFixed(0)} / {REALM_DISCONTENT_SURVIVE_SECONDS}s</div>
        </div>
      </div>

      {happinessBelowThreshold && happiness < REALM_DISCONTENT_HAPPINESS_THRESHOLD && (
        <div className="text-[0.65rem] text-rose-300/80 italic">
          ⚠ Happiness is below the threshold — survival counter paused. Restore happiness above 30 to resume.
        </div>
      )}

      {completed ? (
        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
          <Trophy className="w-3 h-3 mr-1" /> Conquered — gold & survival goals reached
        </Badge>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          <Button size="sm" variant="default" onClick={() => onAction("celebrate")}>
            🎉 Celebrate
            <div className="text-[0.55rem] opacity-80">+20 happy, -10 gold</div>
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAction("tax")}>
            💰 Tax
            <div className="text-[0.55rem] opacity-80">+20 gold, -15 happy</div>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onAction("ignore")}>
            🤷 Ignore
            <div className="text-[0.55rem] opacity-80">+5 each</div>
          </Button>
        </div>
      )}
    </div>
  );
}

// ===== Realm of Swiftness — countdown with 5× production, reach Galactic =====
function RealmSwiftnessGame({ state, stageIndex }: { state: Record<string, any>; stageIndex: number }) {
  const timeLeft = state.timeLeft ?? REALM_SWIFTNESS_TIME_LIMIT;
  const reachedGalactic = !!state.reachedGalactic;
  const completed = !!state.completed;
  const totalStages = STAGES.length;
  const progressPct = ((stageIndex + 1) / totalStages) * 100;

  return (
    <div className="stat-card space-y-3">
      <div className="text-[0.7rem] text-muted-foreground">
        Reach the <span className="text-amber-300">Galactic</span> stage within <span className="text-amber-300">{REALM_SWIFTNESS_TIME_LIMIT}s</span>. Production is multiplied by 5× while the realm is active.
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hourglass className={`w-5 h-5 ${timeLeft < 60 ? "text-rose-400" : "text-amber-300"}`} />
          <span className={`text-2xl font-mono ${timeLeft < 60 ? "text-rose-300" : "text-amber-300"}`}>
            {Math.floor(timeLeft / 60)}:{String(Math.floor(timeLeft % 60)).padStart(2, "0")}
          </span>
        </div>
        {completed ? (
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
            <Trophy className="w-3 h-3 mr-1" /> Conquered
          </Badge>
        ) : reachedGalactic ? (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/40">
            <Sparkles className="w-3 h-3 mr-1" /> Galactic reached
          </Badge>
        ) : (
          <Badge variant="outline" className="text-rose-400 border-rose-400/40">
            <Clock className="w-3 h-3 mr-1" /> Racing
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-cyan-300/80">Stage progress</span>
          <span className="font-mono">{STAGES[stageIndex]?.name} ({stageIndex + 1}/{totalStages})</span>
        </div>
        <div className="h-3 rounded-md bg-cyan-950/40 border border-cyan-500/30 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-600/60 to-amber-400/80 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="text-[0.65rem] text-muted-foreground">
        Production is 5× normal. Use your normal actions and systems to evolve quickly. The realm closes when you reach Galactic or time runs out.
      </div>
    </div>
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

function formatEffects(eff: Record<string, unknown>): string {
  const parts: string[] = [];
  if (eff.productionMult !== undefined) {
    const v = eff.productionMult as number;
    parts.push(v >= 0 ? `+${(v * 100).toFixed(0)}% prod` : `${(v * 100).toFixed(0)}% prod`);
  }
  if (eff.costMult !== undefined) {
    const v = eff.costMult as number;
    if (v >= 1) parts.push(`costs ×${v.toFixed(2)}`);
    else parts.push(`costs ${(v * 100).toFixed(0)}%`);
  }
  if (eff.popGrowthMult !== undefined) {
    const v = eff.popGrowthMult as number;
    parts.push(v >= 1 ? `pop ×${v.toFixed(2)}` : `pop ${(v * 100).toFixed(0)}%`);
  }
  if (eff.capMult !== undefined) {
    const v = eff.capMult as number;
    parts.push(v >= 1 ? `cap ×${v.toFixed(2)}` : `cap ${(v * 100).toFixed(0)}%`);
  }
  if (eff.epMult !== undefined) {
    const v = eff.epMult as number;
    parts.push(`+${(v * 100).toFixed(0)}% EP`);
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
