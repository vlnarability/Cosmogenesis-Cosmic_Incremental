"use client";

import { useGameStore } from "@/game/state/store";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_MAP,
  achievementBonus,
  achievementTier,
  type AchievementCheckCtx,
} from "@/game/data/achievements";
import { SYSTEMS } from "@/game/data/systems";
import { TECHS } from "@/game/data/techs";
import { UPGRADES } from "@/game/data/upgrades";
import { STORY_ENTRIES } from "@/game/data/story";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AchievementsTab() {
  return <AchievementsContent />;
}

function AchievementsContent() {
  const achievements = useGameStore((s) => s.achievements || {});
  const galacticWins = useGameStore((s) => s.galacticWins);
  const totalRuns = useGameStore((s) => s.totalRuns);
  const stageClearCounts = useGameStore((s) => s.stageClearCounts);
  const archivedArchetypes = useGameStore((s) => s.archivedArchetypes || []);
  const storyUnlocked = useGameStore((s) => s.storyUnlocked);
  const ownedSystems = useGameStore((s) => s.ownedSystems);
  const technologies = useGameStore((s) => s.technologies);
  const upgrades = useGameStore((s) => s.upgrades);
  const [filter, setFilter] = useState<string>("all");

  const ctx: AchievementCheckCtx = {
    galacticWins,
    totalRuns,
    stageClearCounts,
    archivedArchetypes,
    storyUnlockedCount: Object.keys(storyUnlocked).filter((k) => storyUnlocked[k]).length,
    systemsDiscoveredCount: Object.keys(ownedSystems).filter((id) => (ownedSystems[id] || 0) > 0).length,
    techResearchedCount: Object.keys(technologies).filter((k) => technologies[k]).length,
    upgradesOwnedCount: Object.values(upgrades).filter((c) => c > 0).length,
  };

  const earnedCount = ACHIEVEMENTS.filter((a) => achievements[a.id] || a.check(ctx)).length;
  const totalCount = ACHIEVEMENTS.length;
  const prodBonus = achievementBonus(achievements, ctx, "production");
  const capBonus = achievementBonus(achievements, ctx, "capacity");
  // ACHIEVEMENT-EXPANSION — also surface the EP + pop bonuses on the
  // summary card. Both are additive multipliers applied at prestige / in
  // the population tick (see store.ts).
  const epBonus = achievementBonus(achievements, ctx, "ep");
  const popBonus = achievementBonus(achievements, ctx, "pop");

  const filtered = filter === "all" ? ACHIEVEMENTS : ACHIEVEMENTS.filter((a) => a.category === filter);

  return (
    <div className="space-y-4">
      {/* Header card with summary */}
      <Card className="glass-panel relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
          style={{ background: "radial-gradient(circle at top right, var(--primary)20, transparent 70%)" }} />
        <CardHeader className="pb-2 relative">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Achievements
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>Persistent goals across all runs. Each grant a small permanent bonus.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground uppercase tracking-wide">Earned</span>
              <span className="font-mono font-bold">
                {earnedCount} / {totalCount}
              </span>
            </div>
            <Progress value={(earnedCount / totalCount) * 100} className="h-2" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="stat-card">
              <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Production Bonus
              </div>
              <div className="text-lg font-bold text-emerald-400 tabular-nums">
                +{(prodBonus * 100).toFixed(1)}%
              </div>
            </div>
            <div className="stat-card">
              <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Capacity Bonus
              </div>
              <div className="text-lg font-bold text-cyan-400 tabular-nums">
                +{(capBonus * 100).toFixed(1)}%
              </div>
            </div>
            <div className="stat-card">
              <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Divinity Bonus
              </div>
              <div className="text-lg font-bold text-amber-400 tabular-nums">
                +{(epBonus * 100).toFixed(1)}%
              </div>
            </div>
            <div className="stat-card">
              <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Pop Growth Bonus
              </div>
              <div className="text-lg font-bold text-pink-400 tabular-nums">
                +{(popBonus * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-2.5 py-1 rounded text-xs border transition-colors",
            filter === "all"
              ? "border-primary bg-primary/15 text-primary font-semibold"
              : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
          )}
        >
          All ({totalCount})
        </button>
        {ACHIEVEMENT_CATEGORIES.map((cat) => {
          const count = ACHIEVEMENTS.filter((a) => a.category === cat.id).length;
          const earned = ACHIEVEMENTS.filter((a) => a.category === cat.id && (achievements[a.id] || a.check(ctx))).length;
          return (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={cn(
                "px-2.5 py-1 rounded text-xs border transition-colors",
                filter === cat.id
                  ? "border-primary bg-primary/15 text-primary font-semibold"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.icon} {cat.label} ({earned}/{count})
            </button>
          );
        })}
      </div>

      {/* Achievement grid — earned first (tiered), then trackable locked
          (progress bars), then the hidden-goals collapsed summary. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Earned achievements — full cards with S1 tiered styling. */}
        {filtered.filter((ach) => achievements[ach.id] || ach.check(ctx)).map((ach) => {
          const tier = achievementTier(ach);
          return (
            <div key={ach.id} className={cn("stat-card stat-card-accent flex items-start gap-3 transition-all", `ach-tier-${tier}`)}>
              <div className="ach-icon-box text-2xl shrink-0 leading-none mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/30" aria-hidden>
                {ach.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm font-semibold leading-tight">{ach.name}</h3>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  {tier !== "common" && (
                    <span className={cn(
                      "text-[0.5rem] px-1 py-px rounded-full border font-bold uppercase tracking-wide",
                      tier === "legendary" && "border-amber-500/50 bg-amber-500/15 text-amber-300",
                      tier === "rare" && "border-violet-500/50 bg-violet-500/15 text-violet-300",
                      tier === "secret" && "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                    )}>
                      {tier}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">{ach.desc}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Badge variant="outline" className="text-[0.6rem] text-emerald-400 border-emerald-500/30">
                    +{(ach.bonus.value * 100).toFixed(1)}% {ach.bonus.type}
                  </Badge>
                  <Badge variant="secondary" className="text-[0.6rem]">{ach.category}</Badge>
                </div>
              </div>
            </div>
          );
        })}

        {/* F8 — trackable locked achievements: render individual cards with a
            progress bar (current/max). Only achievements with a `progress`
            function surface here; the rest stay hidden in the summary below.
            This reveals the numeric-threshold goals (runs, deep hunts, rep,
            treaties, etc.) so long-term progress is trackable, while keeping
            the hidden/easter-egg achievements mysterious. */}
        {filtered
          .filter((ach) => !(achievements[ach.id] || ach.check(ctx)) && ach.progress)
          .map((ach) => {
            const prog = ach.progress!(ctx);
            if (!prog) return null;
            const pct = Math.min(100, (prog.current / prog.max) * 100);
            return (
              <div key={ach.id} className="stat-card flex items-start gap-3 opacity-80 border-dashed">
                <div className="ach-icon-box text-2xl shrink-0 leading-none mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center bg-muted/20 border border-border/40 grayscale" aria-hidden>
                  {ach.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <h3 className="text-sm font-semibold leading-tight text-muted-foreground">{ach.name}</h3>
                    <span className="text-[0.6rem] tabular-nums text-muted-foreground shrink-0">
                      {Math.floor(prog.current)} / {prog.max}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 leading-snug mt-0.5">{ach.desc}</p>
                  <Progress value={pct} className="h-1.5 mt-1.5" />
                </div>
              </div>
            );
          })}

        {/* Locked achievements without progress — collapsed summary (mystery). */}
        {(() => {
          const locked = filtered.filter((ach) => !(achievements[ach.id] || ach.check(ctx)) && !ach.progress);
          if (locked.length === 0) return null;
          return (
            <div className="stat-card flex items-center gap-3 col-span-full border-dashed opacity-70">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-muted-foreground">
                  {locked.length} hidden {locked.length === 1 ? "achievement" : "achievements"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Keep playing to discover hidden goals — each grants a permanent bonus.
                </div>
              </div>
              <Badge variant="outline" className="text-[0.6rem] text-muted-foreground">
                {locked.reduce((sum, a) => sum + a.bonus.value * 100, 0).toFixed(1)}% available
              </Badge>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
