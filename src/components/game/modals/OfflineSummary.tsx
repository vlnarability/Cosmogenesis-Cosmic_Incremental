"use client";

import { formatNumber, formatTime, resourceColor, resourceIcon, resourceName } from "../shared/format";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";
import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { STAGE_RESOURCES, RESOURCE_MAP } from "@/game/data/resources";
import { isLayerAtLeast } from "@/game/state/layerHelpers";

interface OfflineSummaryProps {
  elapsed: number; // seconds
  resourcesGained: Record<string, number>;
  onClose: () => void;
}

export function OfflineSummary({ elapsed, resourcesGained, onClose }: OfflineSummaryProps) {
  // OFFLINE-RELEVANT-FILTER: only show resources that matter for the
  // player's CURRENT stage + unlocked layers. A galactic-tier player
  // doesn't care that their cell systems produced +5 glucose while
  // they were away — they care about Divinity / Faith / Void Shards.
  // L2+ players see only meta currencies (the base game runs in the
  // background via auto-buyers; L1 stage resources are noise).
  const stageIndex = useGameStore((s) => s.stageIndex);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);

  const stage = STAGES[stageIndex];
  const isL2Plus = isLayerAtLeast("enlightenment", unlockedLayers);

  // Build the set of resource IDs that are relevant to surface.
  // L1: stage resources for the current stage (cumulative forward,
  // i.e. STAGE_RESOURCES[currentStageId]).
  // L2+: ONLY meta currencies (divinity / faith / void shards). Stage
  // resources are abstracted into the Divine Engine and run in the
  // background — showing +5 glucose is noise.
  const relevantResourceIds = new Set<string>();
  if (isL2Plus) {
    // L2+ — meta currencies only. Add any meta-currency gains that
    // actually occurred (divinity, faith, void shards if present).
    // We don't pre-populate the set; we just filter gains to the
    // meta category at render time.
    for (const id of Object.keys(resourcesGained)) {
      const def = RESOURCE_MAP[id];
      if (def?.category === "divinity" || def?.category === "meta") {
        relevantResourceIds.add(id);
      }
    }
  } else {
    // L1 — show all stage resources for the current stage.
    const stageRes = STAGE_RESOURCES[stage.id] || [];
    for (const id of stageRes) relevantResourceIds.add(id);
    // Also include meta currencies if any were gained (rare but possible).
    for (const id of Object.keys(resourcesGained)) {
      const def = RESOURCE_MAP[id];
      if (def?.category === "divinity" || def?.category === "meta") {
        relevantResourceIds.add(id);
      }
    }
  }

  const gains = Object.entries(resourcesGained)
    .filter(([r, v]) => Math.abs(v) > 0.01 && relevantResourceIds.has(r))
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));

  const positiveGains = gains.filter(([, v]) => v > 0);
  const negativeGains = gains.filter(([, v]) => v < 0);
  const hiddenCount = Object.entries(resourcesGained)
    .filter(([r, v]) => Math.abs(v) > 0.01 && !relevantResourceIds.has(r))
    .length;

  return (
    <div className="story-popup-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="story-popup-card glass-strong rounded-xl overflow-hidden border border-primary/30 max-w-md">
        {/* Header */}
        <div className="relative p-4 border-b border-border/60 bg-primary/10">
          <div className="text-[0.65rem] uppercase tracking-[0.25em] text-primary font-mono mb-2 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Offline Progress
          </div>
          <h2 className="text-lg font-bold leading-tight">
            You were away for {formatTime(elapsed)}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {isL2Plus
              ? `Your Divine Engine continued accumulating while you were gone.`
              : `Your civilization continued to produce while you were gone.`}
          </p>
        </div>

        {/* Body — resource gains (filtered to relevant resources) */}
        <div className="p-5 space-y-3">
          {gains.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isL2Plus
                ? "No meta-currency gains while away — your Divine Engine is steady."
                : "No significant changes while away."}
            </p>
          ) : (
            <>
              {positiveGains.length > 0 && (
                <div>
                  <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    Gained
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {positiveGains.map(([r, v]) => (
                      <div key={r} className="stat-card flex items-center gap-2 py-1.5">
                        <span className="text-base">{resourceIcon(r)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[0.65rem] text-muted-foreground truncate">{resourceName(r)}</div>
                          <div className="text-sm font-bold tabular-nums" style={{ color: resourceColor(r) }}>
                            +{formatNumber(v)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {negativeGains.length > 0 && (
                <div>
                  <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-red-400" />
                    Consumed
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {negativeGains.map(([r, v]) => (
                      <div key={r} className="stat-card flex items-center gap-2 py-1.5 opacity-70">
                        <span className="text-base">{resourceIcon(r)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[0.65rem] text-muted-foreground truncate">{resourceName(r)}</div>
                          <div className="text-sm font-bold tabular-nums text-red-400">
                            {formatNumber(v)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {hiddenCount > 0 && (
                <p className="text-[0.65rem] text-muted-foreground/60 italic text-center pt-1">
                  {hiddenCount} other background resource{hiddenCount === 1 ? "" : "s"} not shown
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <Button onClick={onClose} variant="default" size="lg" className="w-full">
            Welcome Back
          </Button>
        </div>
      </div>
    </div>
  );
}

