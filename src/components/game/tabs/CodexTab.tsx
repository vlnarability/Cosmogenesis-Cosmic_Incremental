"use client";

import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { SYSTEMS } from "@/game/data/systems";
import { TECHS } from "@/game/data/techs";
import { UPGRADES } from "@/game/data/upgrades";
import { ACHIEVEMENTS } from "@/game/data/achievements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollText, CheckCircle2, Lock, BarChart3 } from "lucide-react";
import { formatTime, formatNumber } from "../shared/format";

export function CodexTab() {
  const stageClearCounts = useGameStore((s) => s.stageClearCounts);
  const ownedSystems = useGameStore((s) => s.ownedSystems);
  const technologies = useGameStore((s) => s.technologies);
  const upgrades = useGameStore((s) => s.upgrades);
  const galacticWins = useGameStore((s) => s.galacticWins);
  const totalRuns = useGameStore((s) => s.totalRuns);
  const archive = useGameStore((s) => s.archive);
  const storyUnlocked = useGameStore((s) => s.storyUnlocked);
  const achievements = useGameStore((s) => s.achievements || {});
  const totalPlayTime = useGameStore((s) => s.totalPlayTime || 0);
  const totalActions = useGameStore((s) => s.totalActions || 0);
  const totalSystemsBuilt = useGameStore((s) => s.totalSystemsBuilt || 0);
  const totalTechResearched = useGameStore((s) => s.totalTechResearched || 0);
  const totalEventsResolved = useGameStore((s) => s.totalEventsResolved || 0);
  const fastestCellClear = useGameStore((s) => s.fastestCellClear || 0);
  const archivedArchetypes = useGameStore((s) => s.archivedArchetypes || []);

  const totalSystemsOwned = Object.values(ownedSystems).filter((c) => c > 0).length;
  const totalTechOwned = Object.keys(technologies).filter((k) => technologies[k]).length;
  const totalUpgradesOwned = Object.values(upgrades).filter((c) => c > 0).length;
  const storyCount = Object.keys(storyUnlocked).filter((k) => storyUnlocked[k]).length;
  const earnedAchievements = ACHIEVEMENTS.filter((a) => achievements[a.id]).length;

  return (
    <div className="space-y-4">
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="w-4 h-4" />
            Codex
          </CardTitle>
          <CardDescription>Persistent discoveries across all runs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            <CodexStat label="Galactic Wins" value={galacticWins} icon="🌌" />
            <CodexStat label="Total Runs" value={totalRuns} icon="🔄" />
            <CodexStat label="Archive Entries" value={archive.length} icon="📚" />
            <CodexStat label="Story Unlocked" value={storyCount} icon="📖" />
            <CodexStat label="Systems Built (lifetime)" value={totalSystemsBuilt} icon="🏗️" />
            <CodexStat label="Tech Researched (lifetime)" value={totalTechResearched} icon="🔬" />
            <CodexStat label="Shop Upgrades" value={`${totalUpgradesOwned}/${UPGRADES.length}`} icon="🛒" />
            <CodexStat label="Stages Cleared" value={Object.values(stageClearCounts).reduce((a, b) => a + b, 0)} icon="⏫" />
          </div>
        </CardContent>
      </Card>

      {/* Stage mastery */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Stage Mastery</CardTitle>
          <CardDescription>How many times you've evolved past each stage.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {STAGES.map((stage) => {
              const count = stageClearCounts[stage.id] || 0;
              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{stage.icon}</span>
                  <span className="text-sm font-medium w-24 shrink-0">{stage.name}</span>
                  <Progress value={Math.min(100, count * 20)} className="flex-1 h-2" />
                  <Badge variant="outline" className="text-xs tabular-nums">{count}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lifetime statistics */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Lifetime Statistics
          </CardTitle>
          <CardDescription>Cumulative activity across all runs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <CodexStat label="Total Play Time" value={formatTime(totalPlayTime)} icon="⏱️" />
            <CodexStat label="Actions Clicked" value={formatNumber(totalActions, 0)} icon="👆" />
            <CodexStat label="Systems Built" value={formatNumber(totalSystemsBuilt, 0)} icon="🏗️" />
            <CodexStat label="Techs Researched" value={formatNumber(totalTechResearched, 0)} icon="🔬" />
            <CodexStat label="Events Resolved" value={formatNumber(totalEventsResolved, 0)} icon="🎲" />
            <CodexStat label="Achievements" value={`${earnedAchievements}/${ACHIEVEMENTS.length}`} icon="🏆" />
            <CodexStat label="Archetypes Locked" value={`${archivedArchetypes.length}/13`} icon="🧬" />
            <CodexStat
              label="Fastest Cell Clear"
              value={fastestCellClear > 0 ? formatTime(fastestCellClear) : "—"}
              icon="⚡"
            />
          </div>
        </CardContent>
      </Card>

      {/* Systems discovered */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Systems Catalogue</span>
            <Badge variant="outline" className="text-xs">
              {SYSTEMS.filter((s) => (ownedSystems[s.id] || 0) > 0).length}/{SYSTEMS.length}
            </Badge>
          </CardTitle>
          <CardDescription>Discovered systems across all stages.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {/* Discovered first */}
            {SYSTEMS.filter((sys) => (ownedSystems[sys.id] || 0) > 0).map((sys) => (
              <div key={sys.id} className="stat-card flex items-center gap-2">
                <span className="text-lg">{sys.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{sys.name}</div>
                  <div className="text-[0.65rem] text-muted-foreground">
                    {STAGES.find((s) => s.id === sys.stage)?.name}
                  </div>
                </div>
              </div>
            ))}
            {/* Compact undiscovered summary */}
            {(() => {
              const undiscovered = SYSTEMS.filter((sys) => (ownedSystems[sys.id] || 0) === 0);
              if (undiscovered.length === 0) return null;
              return (
                <div className="stat-card flex items-center gap-2 col-span-full border-dashed opacity-60">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {undiscovered.length} undiscovered — keep building to find them
                  </span>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Tech discovered */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Tech Tree Index</span>
            <Badge variant="outline" className="text-xs">
              {TECHS.filter((t) => technologies[t.id]).length}/{TECHS.length}
            </Badge>
          </CardTitle>
          <CardDescription>Researched technologies.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Researched first */}
            {TECHS.filter((tech) => technologies[tech.id]).map((tech) => (
              <div key={tech.id} className="stat-card flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{tech.name}</div>
                  <div className="text-[0.65rem] text-muted-foreground">
                    {STAGES.find((s) => s.id === tech.stage)?.name} · {tech.branch}
                  </div>
                </div>
              </div>
            ))}
            {/* Compact undiscovered summary */}
            {(() => {
              const undiscovered = TECHS.filter((tech) => !technologies[tech.id]);
              if (undiscovered.length === 0) return null;
              return (
                <div className="stat-card flex items-center gap-2 col-span-full border-dashed opacity-60">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {undiscovered.length} unresearched — research tech to unlock bonuses
                  </span>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CodexStat({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="stat-card text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}
