"use client";

import { useMemo } from "react";
import { useGameStore } from "@/game/state/store";
import { STAGES, STAGE_IDS, STAGE_MAP } from "@/game/data/stages";
import { ACHIEVEMENTS } from "@/game/data/achievements";
import { RARE_RESOURCES, RARE_RESOURCE_MAP } from "@/game/data/rareResources";
import { SYSTEMS } from "@/game/data/systems";
import { TECHS } from "@/game/data/techs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Clock, Users, Sparkles, Swords, Handshake, Gem, Trophy, Layers, Compass, Cpu, ChevronRight, GitBranch } from "lucide-react";
import { formatNumber, formatTime } from "../shared/format";
import { cn } from "@/lib/utils";

// StatsTab — a run + lifetime progress overview. Surfaces counters that
// already exist on state / achievementMeta but were never displayed: playtime,
// actions, systems built, techs researched, rares consumed, deep hunts,
// treaties, max reputation, rivals resolved, etc. Gives long-term players a
// progress dashboard + makes the new-system counters visible.
//
// Opened via the gear dropdown → Statistics (or the keyboard shortcut once
// bound). All values are read-only (no actions); purely informational.

export function StatsTab() {
  const s = useGameStore();
  const stage = STAGES[s.stageIndex];
  const meta = s.achievementMeta || {};

  // Lifetime counters (cumulative across runs).
  const totalDeepHunts = (meta.totalDeepHunts as number) || 0;
  const totalRaresConsumed = (meta.totalRaresConsumed as number) || 0;

  // Current-run derived values.
  const rivalsResolved = (s.rivals || []).filter((r) => r.state !== "active" && !r.hidden).length;
  const rivalsActive = (s.rivals || []).filter((r) => r.state === "active" && !r.hidden).length;
  const treatiesActive = Object.keys(s.treaties || {}).length;
  const tradeRoutes = Object.keys(s.tradeAgreements || {}).length;
  const raresDiscovered = Object.keys(s.rareResources || {}).length;
  const reliquaryRanks = Object.keys(s.reliquary || {}).length;
  let maxRep = 0;
  for (const ag of Object.values(s.tradeAgreements || {})) {
    const r = (ag as any)?.reputation || 0;
    if (r > maxRep) maxRep = r;
  }
  const totalSystemsOwned = Object.values(s.ownedSystems || {}).reduce((a, b) => a + b, 0);
  const totalTechsResearched = Object.keys(s.technologies || {}).filter((k) => s.technologies[k]).length;
  const achievementsEarned = Object.keys(s.achievements || {}).filter((k) => s.achievements[k]).length;

  // F11 — per-stage breakdown.
  //   stageTimeTotals: lifetime seconds spent in each stage (accumulates in tick).
  //   stageRunTimes: current-run seconds per stage.
  //   stageSystemsBuilt: lifetime systems built per stage (counts the buySystem action,
  //     not distinct system types — so buying 5× of one system adds 5).
  //   stageTechsResearched: lifetime techs researched per stage.
  //   maxSystemTypesPerStage / maxTechsPerStage: the total available systems/techs
  //     per stage (from data) — used for the "% complete" bar in each row.
  const stageTimeTotals = s.stageTimeTotals || {};
  const stageRunTimes = s.stageRunTimes || {};
  const stageSystemsBuilt = s.stageSystemsBuilt || {};
  const stageTechsResearched = s.stageTechsResearched || {};

  // Total available systems + techs per stage (from data, static).
  const maxPerStage = useMemo(() => {
    const out: Record<string, { systems: number; techs: number }> = {};
    for (const st of STAGE_IDS) {
      const sysCount = SYSTEMS.filter((sy) => sy.stage === st).length;
      const techCount = TECHS.filter((t) => t.stage === st).length;
      out[st] = { systems: sysCount, techs: techCount };
    }
    return out;
  }, []);

  // Currently-owned distinct system/tech types per stage (for the "owned/max" column).
  const ownedPerStage = useMemo(() => {
    const out: Record<string, { systems: number; techs: number }> = {};
    for (const st of STAGE_IDS) {
      const stageSystemIds = SYSTEMS.filter((sy) => sy.stage === st).map((sy) => sy.id);
      const stageTechIds = TECHS.filter((t) => t.stage === st).map((t) => t.id);
      out[st] = {
        systems: stageSystemIds.filter((id) => (s.ownedSystems?.[id] || 0) > 0).length,
        techs: stageTechIds.filter((id) => s.technologies?.[id]).length,
      };
    }
    return out;
  }, [s.ownedSystems, s.technologies]);

  // Total lifetime time across all stages (for the % bar widths).
  const totalStageTime = useMemo(
    () => STAGE_IDS.reduce((sum, id) => sum + ((stageTimeTotals[id] as number) || 0), 0),
    [stageTimeTotals],
  );

  return (
    <div className="space-y-3">
      {/* Current run */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            Current Run
          </CardTitle>
          <CardDescription className="text-xs">Where you are right now.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <StatCell icon={<Layers className="w-3 h-3" />} label="Stage" value={stage?.name || "—"} accent="text-primary" />
            <StatCell icon={<Clock className="w-3 h-3" />} label="Run Time" value={formatTime(s.time || 0)} accent="text-cyan-300" />
            <StatCell icon={<Users className="w-3 h-3" />} label="Population" value={formatNumber(s.population || 0, 0)} accent="text-emerald-300" />
            <StatCell icon={<Cpu className="w-3 h-3" />} label="Systems Owned" value={formatNumber(totalSystemsOwned, 0)} accent="text-emerald-300" />
            <StatCell icon={<Sparkles className="w-3 h-3" />} label="Techs Researched" value={formatNumber(totalTechsResearched, 0)} accent="text-violet-300" />
            <StatCell icon={<Swords className="w-3 h-3" />} label="Rivals Resolved" value={formatNumber(rivalsResolved, 0)} accent="text-emerald-300" />
          </div>
        </CardContent>
      </Card>

      {/* Trade + diplomacy economy */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Handshake className="w-4 h-4 text-cyan-400" />
            Trade & Diplomacy
          </CardTitle>
          <CardDescription className="text-xs">Your engagement with the NPC economy.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <StatCell icon={<Handshake className="w-3 h-3" />} label="Trade Routes" value={formatNumber(tradeRoutes, 0)} accent="text-cyan-300" />
            <StatCell icon={<Trophy className="w-3 h-3" />} label="Max Reputation" value={`${Math.round(maxRep)}/100`} accent="text-amber-300" />
            <StatCell icon={<Handshake className="w-3 h-3" />} label="Active Treaties" value={formatNumber(treatiesActive, 0)} accent="text-violet-300" />
            <StatCell icon={<Swords className="w-3 h-3" />} label="Active Rivals" value={formatNumber(rivalsActive, 0)} accent="text-rose-300" />
          </div>
        </CardContent>
      </Card>

      {/* Rare resources + reliquary */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gem className="w-4 h-4 text-amber-400" />
            Rares & Reliquary
          </CardTitle>
          <CardDescription className="text-xs">Discovery + consumption progress.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <StatCell icon={<Gem className="w-3 h-3" />} label="Rares Discovered" value={`${raresDiscovered}/${RARE_RESOURCES.length}`} accent="text-amber-300" />
            <StatCell icon={<Sparkles className="w-3 h-3" />} label="Reliquary Ranks" value={formatNumber(reliquaryRanks, 0)} accent="text-violet-300" />
            <StatCell icon={<Sparkles className="w-3 h-3" />} label="Rares Consumed (life)" value={formatNumber(totalRaresConsumed, 0)} accent="text-violet-300" />
          </div>
          {/* Reliquary breakdown — per-rare rank / max. */}
          {reliquaryRanks > 0 && (
            <div className="mt-2 pt-2 border-t border-border/40 space-y-1">
              {Object.entries(s.reliquary || {}).filter(([, rank]) => rank > 0).map(([rareId, rank]) => {
                const def = RARE_RESOURCE_MAP[rareId];
                if (!def?.reliquary) return null;
                return (
                  <div key={rareId} className="flex items-center justify-between text-[0.7rem]">
                    <span className="text-muted-foreground">{def.icon} {def.name}</span>
                    <span className="tabular-nums font-semibold text-violet-300">
                      {rank}/{def.reliquary.maxConsume} <span className="text-muted-foreground/60">(+{(rank * def.reliquary.perRank * 100).toFixed(0)}% {def.reliquary.resource})</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lifetime totals */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Lifetime Totals
          </CardTitle>
          <CardDescription className="text-xs">Cumulative across all runs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <StatCell icon={<Layers className="w-3 h-3" />} label="Runs Completed" value={formatNumber(s.totalRuns || 0, 0)} accent="text-primary" />
            <StatCell icon={<Clock className="w-3 h-3" />} label="Total Play Time" value={formatTime(s.totalPlayTime || 0)} accent="text-cyan-300" />
            <StatCell icon={<Sparkles className="w-3 h-3" />} label="Total Actions" value={formatNumber(s.totalActions || 0, 0)} accent="text-emerald-300" />
            <StatCell icon={<Cpu className="w-3 h-3" />} label="Systems Built" value={formatNumber(s.totalSystemsBuilt || 0, 0)} accent="text-emerald-300" />
            <StatCell icon={<Sparkles className="w-3 h-3" />} label="Techs Researched" value={formatNumber(s.totalTechResearched || 0, 0)} accent="text-violet-300" />
            <StatCell icon={<Compass className="w-3 h-3" />} label="Deep Hunts" value={formatNumber(totalDeepHunts, 0)} accent="text-amber-300" />
            <StatCell icon={<Trophy className="w-3 h-3" />} label="Galactic Wins" value={formatNumber(s.galacticWins || 0, 0)} accent="text-amber-300" />
            <StatCell icon={<Trophy className="w-3 h-3" />} label="Achievements" value={`${achievementsEarned}/${ACHIEVEMENTS.length}`} accent="text-amber-300" />
          </div>
        </CardContent>
      </Card>

      {/* F11 — Per-Stage Breakdown */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Per-Stage Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            Time / systems / techs per stage · lifetime vs current run.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Column headers — hidden on mobile (rows stack instead). */}
          <div className="hidden sm:grid grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr] gap-2 text-[0.6rem] uppercase tracking-wide text-muted-foreground mb-1 px-1">
            <span>Stage</span>
            <span className="text-right">Lifetime Time</span>
            <span className="text-right">This Run</span>
            <span className="text-right">Systems Built</span>
            <span className="text-right">Techs</span>
          </div>
          <div className="space-y-1">
            {STAGES.map((st, idx) => {
              const stageId = st.id;
              const isCurrent = idx === s.stageIndex;
              const isPast = idx < s.stageIndex;
              const lifetimeTime = (stageTimeTotals[stageId] as number) || 0;
              const runTime = (stageRunTimes[stageId] as number) || 0;
              const systemsBuilt = (stageSystemsBuilt[stageId] as number) || 0;
              const techsResearched = (stageTechsResearched[stageId] as number) || 0;
              const ownedSys = ownedPerStage[stageId]?.systems || 0;
              const ownedTech = ownedPerStage[stageId]?.techs || 0;
              const maxSys = maxPerStage[stageId]?.systems || 0;
              const maxTech = maxPerStage[stageId]?.techs || 0;
              const timePct = totalStageTime > 0 ? Math.min(100, (lifetimeTime / totalStageTime) * 100) : 0;
              const sysPct = maxSys > 0 ? Math.min(100, (ownedSys / maxSys) * 100) : 0;
              const techPct = maxTech > 0 ? Math.min(100, (ownedTech / maxTech) * 100) : 0;
              return (
                <div
                  key={stageId}
                  className={cn(
                    "rounded-md border px-2 py-1.5 transition-colors",
                    isCurrent
                      ? "border-primary/40 bg-primary/5"
                      : isPast
                        ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                        : "border-border/30 bg-muted/5",
                  )}
                >
                  {/* Row 1: stage name + lifetime time bar */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base shrink-0">{st.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold truncate">{st.name}</span>
                        {isCurrent && (
                          <Badge variant="outline" className="text-[0.5rem] py-0 px-1 text-primary border-primary/40">
                            current
                          </Badge>
                        )}
                        {isPast && (
                          <Badge variant="outline" className="text-[0.5rem] py-0 px-1 text-emerald-300 border-emerald-400/40">
                            cleared
                          </Badge>
                        )}
                      </div>
                      {/* Lifetime time bar — width proportional to share of total playtime */}
                      <div className="h-1 rounded-full bg-muted/30 overflow-hidden mt-1">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-violet-400 transition-all"
                          style={{ width: `${timePct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Row 2: stats grid (lifetime time, run time, systems, techs) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-1 text-[0.65rem] font-mono pl-6">
                    <div className="flex items-center justify-between sm:justify-end gap-1">
                      <Clock className="w-2.5 h-2.5 text-muted-foreground shrink-0 sm:hidden" />
                      <div className="sm:text-right">
                        <div className="text-cyan-300 tabular-nums">{formatTime(lifetimeTime)}</div>
                        <div className="text-[0.5rem] text-muted-foreground uppercase sm:hidden">Lifetime</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-1">
                      <Clock className="w-2.5 h-2.5 text-muted-foreground shrink-0 sm:hidden" />
                      <div className="sm:text-right">
                        <div className="text-violet-300 tabular-nums">{formatTime(runTime)}</div>
                        <div className="text-[0.5rem] text-muted-foreground uppercase sm:hidden">This run</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-1">
                      <Cpu className="w-2.5 h-2.5 text-muted-foreground shrink-0 sm:hidden" />
                      <div className="sm:text-right">
                        {/* Lifetime built count + current-owned / max distinct types */}
                        <div className="text-emerald-300 tabular-nums">
                          {formatNumber(systemsBuilt, 0)} <span className="text-muted-foreground/60">built</span>
                        </div>
                        <div className="text-[0.5rem] text-muted-foreground">
                          <span className="text-emerald-200/80">{ownedSys}</span>
                          <span className="text-muted-foreground/50">/{maxSys} types</span>
                          {/* Mini progress bar for system-type completion */}
                          <span className="inline-block w-8 h-0.5 align-middle ml-1 rounded-full bg-muted/40 overflow-hidden">
                            <span
                              className="block h-full bg-emerald-400/70"
                              style={{ width: `${sysPct}%` }}
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-muted-foreground shrink-0 sm:hidden" />
                      <div className="sm:text-right">
                        <div className="text-violet-300 tabular-nums">
                          {formatNumber(techsResearched, 0)} <span className="text-muted-foreground/60">res.</span>
                        </div>
                        <div className="text-[0.5rem] text-muted-foreground">
                          <span className="text-violet-200/80">{ownedTech}</span>
                          <span className="text-muted-foreground/50">/{maxTech} types</span>
                          <span className="inline-block w-8 h-0.5 align-middle ml-1 rounded-full bg-muted/40 overflow-hidden">
                            <span
                              className="block h-full bg-violet-400/70"
                              style={{ width: `${techPct}%` }}
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Summary footer — totals row */}
          <div className="mt-2 pt-2 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-1 text-[0.65rem] font-mono">
            <div className="flex items-center justify-between sm:justify-end gap-1">
              <span className="text-muted-foreground uppercase text-[0.5rem] sm:hidden">Σ Time</span>
              <span className="text-cyan-300 tabular-nums">{formatTime(totalStageTime)}</span>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-1">
              <span className="text-muted-foreground uppercase text-[0.5rem] sm:hidden">Σ Run</span>
              <span className="text-violet-300 tabular-nums">
                {formatTime(STAGE_IDS.reduce((sum, id) => sum + ((stageRunTimes[id] as number) || 0), 0))}
              </span>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-1">
              <span className="text-muted-foreground uppercase text-[0.5rem] sm:hidden">Σ Sys</span>
              <span className="text-emerald-300 tabular-nums">
                {formatNumber(s.totalSystemsBuilt || 0, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-1">
              <span className="text-muted-foreground uppercase text-[0.5rem] sm:hidden">Σ Techs</span>
              <span className="text-violet-300 tabular-nums">
                {formatNumber(s.totalTechResearched || 0, 0)}
              </span>
            </div>
          </div>
          <div className="text-[0.6rem] text-muted-foreground/70 mt-2 flex items-center gap-1">
            <ChevronRight className="w-2.5 h-2.5" />
            "built" counts every purchase (5× one system = 5). "types" = distinct system kinds owned right now.
          </div>
        </CardContent>
      </Card>

      {/* F13 — Stage Progression Timeline */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            Stage Progression Timeline
          </CardTitle>
          <CardDescription className="text-xs">
            Visual breakdown of where your time goes this run vs across all runs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* ===== This-run timeline ===== */}
          <div className="mb-3">
            <div className="text-[0.6rem] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center justify-between">
              <span>This run</span>
              <span className="text-cyan-300/70 tabular-nums">{formatTime(s.time || 0)}</span>
            </div>
            <StageTimeline
              stageRunTimes={stageRunTimes}
              currentStageIndex={s.stageIndex}
              totalRunTime={s.time || 0}
              variant="run"
            />
          </div>
          {/* ===== Lifetime timeline ===== */}
          <div className="mb-2">
            <div className="text-[0.6rem] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center justify-between">
              <span>Lifetime</span>
              <span className="text-violet-300/70 tabular-nums">{formatTime(totalStageTime)}</span>
            </div>
            <StageTimeline
              stageRunTimes={stageTimeTotals}
              currentStageIndex={s.stageIndex}
              totalRunTime={totalStageTime}
              variant="lifetime"
            />
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-border/40 text-[0.55rem] text-muted-foreground">
            {STAGES.map((st) => (
              <span key={st.id} className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: st.accent }} />
                {st.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===========================================================================
// F13 — StageTimeline component
//
// Renders a horizontal proportional timeline of the 7 stages. Each stage's
// segment width = (stageTime / totalRunTime) × 100%. Stages not yet reached
// (index > currentStageIndex) are rendered as a thin gray strip at the end.
//
// The current stage gets a subtle pulsing dot at its left edge + a slightly
// brighter segment. Cleared stages (index < currentStageIndex) get a check
// mark.
//
// Two variants:
//   - "run": uses stageRunTimes (this run only) — totalRunTime = s.time
//   - "lifetime": uses stageTimeTotals (all runs) — totalRunTime = sum
//
// The timeline is a flexbox of segments (no SVG needed). Each segment is a
// div with a background-color from STAGE_MAP[stageId].accent + opacity
// scaling by share. Hover shows the stage name + time.
// ===========================================================================
function StageTimeline({
  stageRunTimes,
  currentStageIndex,
  totalRunTime,
  variant,
}: {
  stageRunTimes: Record<string, number>;
  currentStageIndex: number;
  totalRunTime: number;
  variant: "run" | "lifetime";
}) {
  // Compute per-stage time + width %.
  const segments = useMemo(() => {
    return STAGES.map((st, idx) => {
      const time = (stageRunTimes[st.id] as number) || 0;
      const pct = totalRunTime > 0 ? (time / totalRunTime) * 100 : 0;
      const reached = idx <= currentStageIndex;
      const isCurrent = idx === currentStageIndex;
      const isCleared = idx < currentStageIndex;
      return {
        stage: st,
        idx,
        time,
        pct,
        reached,
        isCurrent,
        isCleared,
      };
    });
  }, [stageRunTimes, totalRunTime, currentStageIndex]);

  // Minimum segment width for unreached stages so they're visible.
  const totalReachedPct = segments.filter((s) => s.reached).reduce((a, s) => a + s.pct, 0);
  const unreachedCount = segments.filter((s) => !s.reached).length;
  const unreachedPct = totalReachedPct < 100 && unreachedCount > 0
    ? (100 - totalReachedPct) / unreachedCount
    : 0;

  return (
    <div className="space-y-1.5">
      {/* The timeline bar — flexbox of segments */}
      <div className="flex h-8 rounded-md overflow-hidden border border-border/40 bg-muted/10">
        {segments.map((seg) => {
          const width = seg.reached ? seg.pct : Math.max(2, unreachedPct);
          if (width <= 0 && !seg.reached) return null;
          return (
            <div
              key={seg.stage.id}
              className={cn(
                "relative flex items-center justify-center transition-all group hover:flex-[2] flex-[1]",
                seg.reached ? "" : "opacity-30",
              )}
              style={{
                flexGrow: 0,
                flexBasis: `${Math.max(0.5, width)}%`,
                background: seg.reached
                  ? `${seg.stage.accent}${seg.isCurrent ? "" : "80"}`
                  : "rgba(100,116,139,0.2)",
                minWidth: seg.reached ? "1.5rem" : "0.5rem",
              }}
              title={`${seg.stage.name}: ${formatTime(seg.time)} (${pctLabel(seg.pct)}${variant === "run" ? " of run" : " of lifetime"})`}
            >
              {/* Stage icon — only show if segment is wide enough */}
              {width > 6 && (
                <span className="text-xs leading-none select-none" style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" }}>
                  {seg.stage.icon}
                </span>
              )}
              {/* Current-stage pulsing dot at the left edge */}
              {seg.isCurrent && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white animate-ping"
                  aria-hidden
                />
              )}
              {/* Cleared check mark */}
              {seg.isCleared && width > 4 && (
                <span className="absolute top-0.5 right-0.5 text-[0.5rem] text-white/80" aria-hidden>
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* Per-stage labels row — only show for reached stages */}
      <div className="flex text-[0.55rem] text-muted-foreground tabular-nums gap-0.5">
        {segments.map((seg) => {
          if (!seg.reached) return <div key={seg.stage.id} className="flex-1" />;
          const width = seg.pct;
          return (
            <div
              key={seg.stage.id}
              className="text-center truncate"
              style={{ flexGrow: 0, flexBasis: `${Math.max(0.5, width)}%`, minWidth: "1.5rem" }}
            >
              {width > 8 ? formatTime(seg.time) : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function pctLabel(pct: number): string {
  if (pct < 0.1) return "<0.1%";
  return `${pct.toFixed(1)}%`;
}

function StatCell({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="stat-card flex items-center gap-2 py-1.5">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[0.6rem] text-muted-foreground uppercase tracking-wide truncate">{label}</div>
        <div className={cn("text-sm font-bold tabular-nums truncate", accent)}>{value}</div>
      </div>
    </div>
  );
}
