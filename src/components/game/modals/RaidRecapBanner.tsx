"use client";

// RaidRecapBanner — brief outcome summary after a raid is resolved.
//
// Per user feedback: "Full dice math may feel clinical; show enough to
// explain the result, not every modifier." So the banner shows:
//   - Defend win:  "Win chance 34% · rolled 12" + "No losses"
//   - Defend loss: "Win chance 34% · rolled 71" + per-resource losses
//   - Counter:     "+12 gold · +6 culture" + counter-raid count note
//
// Auto-dismisses after 6s; clicking anywhere on it dismisses immediately.
// Bottom-CENTER placement (the achievement toast owns bottom-right).
// Transient state — never persisted, never re-shown after reload.

import { useEffect } from "react";
import { useGameStore } from "@/game/state/store";
import { ShieldCheck, ShieldX, Swords, Trophy } from "lucide-react";
import { formatNumber, resourceIcon } from "../shared/format";
import { cn } from "@/lib/utils";

const AUTO_DISMISS_MS = 6000;

export function RaidRecapBanner() {
  const outcome = useGameStore((s) => s.lastRaidOutcome);
  const dismissRaidRecap = useGameStore((s) => s.dismissRaidRecap);

  // Auto-dismiss timer — reset naturally because a new outcome object
  // replaces the old one (keyed by `outcome.at` below).
  useEffect(() => {
    if (!outcome) return;
    const t = setTimeout(() => dismissRaidRecap(), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [outcome, dismissRaidRecap]);

  if (!outcome) return null;

  const isCounter = outcome.action === "counter";
  const headline = isCounter
    ? "RAID REPELLED — COUNTER-ATTACK"
    : outcome.won
      ? "DEFENSE HELD"
      : "DEFENSE BROKEN";

  return (
    <div
      key={outcome.at}
      role="status"
      aria-live="polite"
      onClick={dismissRaidRecap}
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100%-2rem)]",
        "animate-[slideUp_0.3s_ease] cursor-pointer select-none"
      )}
      title="Click to dismiss"
    >
      <div
        className={cn(
          "glass-strong rounded-lg border overflow-hidden shadow-2xl",
          outcome.won ? "border-emerald-500/50" : "border-rose-500/50"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "px-3 py-1.5 flex items-center gap-2 border-b",
            outcome.won
              ? "bg-emerald-500/20 border-emerald-500/30"
              : "bg-rose-500/20 border-rose-500/30"
          )}
        >
          {isCounter ? (
            <Swords className="w-3.5 h-3.5 text-rose-400" />
          ) : outcome.won ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <ShieldX className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span
            className={cn(
              "text-[0.65rem] uppercase tracking-[0.2em] font-bold",
              outcome.won ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {headline}
          </span>
          <span className="ml-auto text-[0.65rem] text-muted-foreground">
            {outcome.rivalIcon} {outcome.rivalName}
          </span>
        </div>

        {/* Body — the numbers that explain the result */}
        <div className="p-3 text-xs space-y-1">
          {!isCounter && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Win chance · dice roll</span>
              <span className="font-semibold tabular-nums">
                <span className={outcome.won ? "text-emerald-400" : "text-amber-400"}>
                  {(outcome.winChance * 100).toFixed(0)}%
                </span>
                <span className="text-muted-foreground"> · rolled </span>
                <span className={outcome.won ? "text-emerald-400" : "text-rose-400"}>
                  {outcome.roll}
                </span>
              </span>
            </div>
          )}

          {isCounter && outcome.loot && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" /> Loot seized
              </span>
              <span className="font-semibold tabular-nums text-amber-400">
                +{formatNumber(outcome.loot.gold, 0)} gold · +{formatNumber(outcome.loot.culture, 0)} culture
              </span>
            </div>
          )}

          {outcome.won && !isCounter && (
            <div className="text-[0.7rem] text-muted-foreground">
              No losses. Their respect for you grew (relation +5).
            </div>
          )}

          {!outcome.won && outcome.resourceLoss && (
            <div className="text-[0.7rem] text-rose-400">
              Lost:{" "}
              {Object.entries(outcome.resourceLoss)
                .slice(0, 5)
                .map(([r, v]) => `${resourceIcon(r)} ${formatNumber(v, 1)}`)
                .join("  ")}
              {Object.keys(outcome.resourceLoss).length > 5 && " …"}
              <span className="text-muted-foreground"> (10% of each reserve)</span>
            </div>
          )}

          {isCounter && outcome.counteredRaids != null && (
            <div className="text-[0.7rem] text-muted-foreground">
              Counter-raids: {outcome.counteredRaids} — their assimilation cost keeps dropping.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
