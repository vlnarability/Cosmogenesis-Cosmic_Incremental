"use client";

import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { ACHIEVEMENTS } from "@/game/data/achievements";
import { RARE_RESOURCES, RARE_RESOURCE_MAP } from "@/game/data/rareResources";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, Clock, Users, Sparkles, Swords, Handshake, Gem, Trophy, Layers, Compass, Cpu } from "lucide-react";
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
    </div>
  );
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
