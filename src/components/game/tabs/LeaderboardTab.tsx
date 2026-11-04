"use client";

// ===========================================================================
// F12 — LeaderboardTab
//
// The hardmode-clear leaderboard. Shows the top fastest clears per stage,
// pulled from localStorage (the storage adapter in
// src/game/data/hardmodeLeaderboard.ts).
//
// This tab opens via the gear dropdown → Leaderboard (or
// `openInfoModal("leaderboard")`). All records are read-only from the
// UI's perspective — they're written by the evolve action on hardmode
// stage clears.
//
// The architecture is local-only for now. The "Sync to online leaderboard"
// button is a placeholder that surfaces the planned online sync (no network
// call yet) — the storage adapter can be swapped for a fetch-based one
// later without touching this UI.
// ===========================================================================

import { useMemo, useState } from "react";
import { useGameStore } from "@/game/state/store";
import {
  STAGES,
  STAGE_IDS,
  STAGE_MAP,
} from "@/game/data/stages";
import {
  loadLeaderboard,
  clearLeaderboard,
  totalRecordCount,
  getRankForClear,
  type HardmodeClearRecord,
  MAX_RECORDS_PER_STAGE,
} from "@/game/data/hardmodeLeaderboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy, Clock, Cpu, Sparkles, Crown, Trash2, RefreshCw, Cloud, ChevronRight, Timer,
} from "lucide-react";
import { formatTime, formatNumber } from "../shared/format";
import { cn } from "@/lib/utils";

// ----- Slot-aware reload hook -----
// Reads the current save slot from localStorage so we re-read the
// leaderboard when the player switches slots. Returns a number 1-3.
function readCurrentSlot(): number {
  try {
    if (typeof window === "undefined") return 1;
    const s = window.localStorage.getItem("cosmogenesis_slot");
    return s ? parseInt(s, 10) : 1;
  } catch {
    return 1;
  }
}

export function LeaderboardTab() {
  const difficultyMode = useGameStore((s) => s.difficultyMode || "normal");
  const slot = readCurrentSlot();
  const [refreshKey, setRefreshKey] = useState(0);

  // Reload the leaderboard data whenever the slot or refresh key changes.
  // Memoized so we don't re-read localStorage on every render.
  const data = useMemo(() => loadLeaderboard(), [slot, refreshKey]);
  const totalRecords = useMemo(() => totalRecordCount(), [slot, refreshKey]);

  // Lazy initial state — pick the first stage with records (or Cell).
  const [selectedStage, setSelectedStage] = useState<typeof STAGE_IDS[number]>(() => {
    const peek = loadLeaderboard();
    const firstWithRecords = STAGE_IDS.find((id) => (peek.records[id]?.length ?? 0) > 0);
    return firstWithRecords ?? "cell";
  });

  const records: HardmodeClearRecord[] = selectedStage
    ? (data.records[selectedStage] ?? [])
    : [];

  // ----- Compute "personal best" highlight: the top record for the selected stage. -----
  const personalBest = records[0] ?? null;

  // ----- Stats summary across all stages -----
  const stageSummaries = useMemo(() => {
    return STAGE_IDS.map((id) => {
      const list = data.records[id] ?? [];
      const fastest = list.length > 0 ? list[0].clearTimeSec : null;
      return {
        stageId: id,
        stageName: STAGE_MAP[id]?.name ?? id,
        icon: STAGE_MAP[id]?.icon ?? "",
        recordCount: list.length,
        fastestClearSec: fastest,
      };
    });
  }, [data]);

  return (
    <div className="space-y-3">
      {/* ===== Header summary ===== */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
            <Trophy className="w-4 h-4 text-amber-400" />
            Hardmode Leaderboard
            <Badge variant="outline" className="text-[0.55rem] text-amber-300 border-amber-400/40 ml-1">
              <Clock className="w-2.5 h-2.5 mr-0.5" />
              {difficultyMode === "hard" ? "Hardmode active" : "Normal mode"}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Fastest stage clears across your hardmode runs · {totalRecords} record{totalRecords === 1 ? "" : "s"} on slot {slot}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats summary grid — one cell per stage */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
            {stageSummaries.map((s) => {
              const isSelected = selectedStage === s.stageId;
              return (
                <button
                  key={s.stageId}
                  type="button"
                  onClick={() => setSelectedStage(s.stageId)}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-left transition-colors",
                    isSelected
                      ? "border-amber-400/60 bg-amber-500/10"
                      : "border-border/30 bg-muted/5 hover:bg-muted/20"
                  )}
                  title={`View ${s.stageName} leaderboard`}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-sm">{s.icon}</span>
                    <span className="text-[0.65rem] font-semibold truncate">{s.stageName}</span>
                  </div>
                  <div className="text-[0.55rem] text-muted-foreground tabular-nums">
                    {s.fastestClearSec !== null ? (
                      <span className="text-amber-300">{formatTime(s.fastestClearSec)}</span>
                    ) : (
                      <span className="text-muted-foreground/60">— no record —</span>
                    )}
                  </div>
                  <div className="text-[0.5rem] text-muted-foreground/70 tabular-nums">
                    {s.recordCount} record{s.recordCount === 1 ? "" : "s"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Online-sync placeholder */}
          <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between flex-wrap gap-2">
            <div className="text-[0.6rem] text-muted-foreground/70 flex items-center gap-1">
              <Cloud className="w-3 h-3" />
              Online sync coming soon — records are stored locally for now.
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[0.6rem] text-muted-foreground"
                onClick={() => setRefreshKey((k) => k + 1)}
                title="Re-read leaderboard from localStorage"
              >
                <RefreshCw className="w-3 h-3 mr-0.5" /> Refresh
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[0.6rem] text-rose-300 hover:bg-rose-500/10"
                onClick={() => {
                  if (confirm("Wipe all hardmode leaderboard records on this slot? This cannot be undone.")) {
                    clearLeaderboard();
                    setRefreshKey((k) => k + 1);
                  }
                }}
                title="Wipe all records on this slot"
              >
                <Trash2 className="w-3 h-3 mr-0.5" /> Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Per-stage records table ===== */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Timer className="w-4 h-4 text-amber-400" />
            {selectedStage ? STAGE_MAP[selectedStage]?.name : "—"} — Top Clears
          </CardTitle>
          <CardDescription className="text-xs">
            Sorted by clear time (fastest first) · capped at {MAX_RECORDS_PER_STAGE} records per stage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-xs">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No hardmode clears recorded for this stage yet.</p>
              <p className="mt-1 text-[0.6rem] text-muted-foreground/70">
                Switch to hardmode on the landing page and clear this stage — the fastest time will be recorded here.
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {/* Column header (hidden on mobile) */}
              <div className="hidden sm:grid grid-cols-[2rem_1fr_5rem_5rem_5rem_5rem] gap-2 text-[0.55rem] uppercase tracking-wide text-muted-foreground px-2 py-1">
                <span>#</span>
                <span>Build</span>
                <span className="text-right">Time</span>
                <span className="text-right">Systems</span>
                <span className="text-right">Techs</span>
                <span className="text-right">Run</span>
              </div>
              {records.map((rec, idx) => {
                const isTop = idx === 0;
                const isPersonalBest = rec === personalBest;
                return (
                  <div
                    key={rec.id}
                    className={cn(
                      "grid grid-cols-[2rem_1fr_5rem] sm:grid-cols-[2rem_1fr_5rem_5rem_5rem_5rem] gap-2 items-center px-2 py-1.5 rounded-md border text-[0.65rem] font-mono",
                      isTop
                        ? "border-amber-400/40 bg-amber-500/5"
                        : "border-border/20 bg-muted/5"
                    )}
                  >
                    {/* Rank */}
                    <span className={cn(
                      "flex items-center justify-center w-5 h-5 rounded-full text-[0.6rem] font-bold shrink-0",
                      isTop ? "bg-amber-500/20 text-amber-300 border border-amber-400/40" : "text-muted-foreground"
                    )}>
                      {isTop ? <Crown className="w-3 h-3" /> : idx + 1}
                    </span>
                    {/* Build — nucleus / ascension / government */}
                    <div className="min-w-0">
                      <div className="truncate">
                        {rec.nucleusChoice ? (
                          <span className="text-violet-300">{rec.nucleusChoice}</span>
                        ) : (
                          <span className="text-muted-foreground/60">no nucleus</span>
                        )}
                        {rec.ascensionPath && (
                          <span className="text-muted-foreground/70"> · {rec.ascensionPath}</span>
                        )}
                      </div>
                      {rec.government && (
                        <div className="text-[0.55rem] text-muted-foreground/70 truncate">
                          gov: {rec.government}
                        </div>
                      )}
                    </div>
                    {/* Time */}
                    <div className={cn("text-right tabular-nums", isTop ? "text-amber-300 font-bold" : "text-cyan-300")}>
                      {formatTime(rec.clearTimeSec)}
                    </div>
                    {/* Systems (hidden on mobile) */}
                    <div className="hidden sm:block text-right tabular-nums text-emerald-300/80">
                      {formatNumber(rec.totalSystemsBuilt, 0)}
                    </div>
                    {/* Techs (hidden on mobile) */}
                    <div className="hidden sm:block text-right tabular-nums text-violet-300/80">
                      {formatNumber(rec.totalTechsResearched, 0)}
                    </div>
                    {/* Run # (hidden on mobile) */}
                    <div className="hidden sm:block text-right tabular-nums text-muted-foreground/70">
                      #{rec.runNumber}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer note */}
          {records.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border/40 text-[0.6rem] text-muted-foreground/70 flex items-center gap-1">
              <ChevronRight className="w-2.5 h-2.5" />
              Records are per save-slot — switching slots shows a different leaderboard.
              {difficultyMode === "normal" && (
                <span className="ml-1 text-amber-300/70">
                  You're in Normal mode — clears won't be recorded. Start a Hardmode run to populate the leaderboard.
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
