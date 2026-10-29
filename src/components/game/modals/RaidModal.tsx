"use client";

// RaidModal — PART-2-LAYER-C raid event modal.
//
// FIRES WHEN: a rival's threat hits 100%. The threat decay tick sets
// `activeRaid` to the rival's id; this modal opens.
//
// Shows: rival name/icon, player's military vs rival strength, win chance.
// Two choices:
//   - Defend (auto-roll): win chance = mil / (strength × 50), capped 95%.
//     Win = no loss + relation +5. Lose = 10% resource loss + relation -10.
//   - Counter-Attack: spend military (40 × strength) for guaranteed win +
//     gold/culture loot. Increments counteredRaids (reduces assimilation cost).
//
// Either choice clears activeRaid + resets the rival's threat to 0.

import { useGameStore } from "@/game/state/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Swords, Shield, Crosshair, TrendingUp, TrendingDown, Users } from "lucide-react";
import { formatNumber, resourceColor, resourceIcon } from "../shared/format";
import { cn } from "@/lib/utils";

// PROCEDURAL-RIVALS FIX — RIVAL_MAP (legacy) is EMPTY: procedural rivals live
// in the store's `rivals` array. Look the raider up there so the modal shows
// the real display name, icon, strength, and population instead of falling
// back to the raw rival id + a hardcoded strength of 1.
export function RaidModal() {
  const activeRaid = useGameStore((s) => s.activeRaid);
  const resolveRaid = useGameStore((s) => s.resolveRaid);
  const resources = useGameStore((s) => s.resources || {});
  const rivals = useGameStore((s) => s.rivals || []);

  if (!activeRaid) return null;

  const rivalDef = rivals.find((r) => r.id === activeRaid);
  const rivalName = rivalDef?.name || activeRaid;
  const rivalIcon = rivalDef?.icon || "⚔️";
  const strength = rivalDef?.strength || 1;
  const population = rivalDef?.population || 0;
  // Flavor line built from the raider's live stats (procedural rivals have no static desc).
  const rivalDesc = rivalDef
    ? `Their spies have watched you for ages. ${Math.floor(population)} souls marshal beneath the banner of ${rivalName} — and their patience has run out.`
    : "Their forces descend upon your borders.";

  const mil = resources.military_power || 0;
  const counterCost = Math.max(20, 40 * strength);
  const winChance = Math.min(0.95, mil / (strength * 50));
  const canCounter = mil >= counterCost;

  return (
    <Dialog open={!!activeRaid} onOpenChange={() => { /* don't allow close — must choose */ }}>
      <DialogContent className="max-w-md glass-strong" >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Swords className="w-5 h-5 text-rose-400" />
            {rivalName} is Raiding!
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            <span className="text-lg mr-1">{rivalIcon}</span>
            {rivalDesc}
          </DialogDescription>
        </DialogHeader>

        {/* Military comparison */}
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1.5">
          <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1">
            Military Comparison
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Your military:</span>
            <span className="font-semibold tabular-nums" style={{ color: resourceColor("military_power") }}>
              {resourceIcon("military_power")} {formatNumber(mil, 0)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{rivalName} strength:</span>
            <span className="font-semibold tabular-nums text-rose-400">
              {strength.toFixed(1)}
            </span>
          </div>
          {rivalDef && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" /> Their population:
              </span>
              <span className="font-semibold tabular-nums text-muted-foreground">
                {formatNumber(population, 0)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-1 border-t border-border/40">
            <span className="text-muted-foreground">Defend win chance:</span>
            <span className={cn(
              "font-bold tabular-nums",
              winChance > 0.7 ? "text-emerald-400" : winChance > 0.4 ? "text-amber-400" : "text-rose-400"
            )}>
              {(winChance * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Choice buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          {/* Defend */}
          <button
            onClick={() => resolveRaid("defend")}
            className="text-left rounded-lg border border-cyan-500/40 bg-cyan-500/5 p-3 hover:bg-cyan-500/10 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-sm text-cyan-400">Defend</span>
            </div>
            <p className="text-[0.65rem] text-muted-foreground leading-snug mb-2">
              Auto-roll your military against the raid. Win = no losses. Lose = 10% resource loss.
            </p>
            <div className={cn(
              "text-[0.65rem] flex items-center gap-1",
              winChance > 0.5 ? "text-emerald-400" : "text-amber-400"
            )}>
              {winChance > 0.5 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {(winChance * 100).toFixed(0)}% win chance
            </div>
          </button>

          {/* Counter-Attack */}
          <button
            onClick={() => resolveRaid("counter")}
            disabled={!canCounter}
            className={cn(
              "text-left rounded-lg border p-3 transition-colors",
              canCounter
                ? "border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10"
                : "border-muted/40 bg-muted/10 opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Crosshair className="w-4 h-4 text-rose-400" />
              <span className="font-semibold text-sm text-rose-400">Counter-Attack</span>
            </div>
            <p className="text-[0.65rem] text-muted-foreground leading-snug mb-2">
              Spend military for a guaranteed win + gold + culture loot. Increments counter-raids (reduces assimilation cost).
            </p>
            <div className={cn(
              "text-[0.65rem]",
              canCounter ? "text-rose-400" : "text-muted-foreground"
            )}>
              Cost: {resourceIcon("military_power")} {formatNumber(counterCost, 0)}
              {!canCounter && (
                <span className="ml-1 text-muted-foreground/70">(need {formatNumber(counterCost, 0)}, have {formatNumber(mil, 0)})</span>
              )}
            </div>
          </button>
        </div>

        <div className="mt-2 text-[0.65rem] text-muted-foreground/70 italic text-center">
          You must choose one option to continue.
        </div>
      </DialogContent>
    </Dialog>
  );
}
