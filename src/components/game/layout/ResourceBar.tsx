"use client";

import { useGameStore } from "@/game/state/store";
import { STAGE_RESOURCES, RESOURCE_MAP } from "@/game/data/resources";
import { STAGES, STAGE_IDS } from "@/game/data/stages";
import { useActiveLayer, isLayerAtLeast } from "@/game/state/layerHelpers";
import { formatNumber, formatCompact, resourceColor, resourceIcon, resourceName } from "../shared/format";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

// ============================================================
// ResourceBar — streamlined (P4)
//
// L1 (first playthrough): keep current behavior — stage resources
//   (food/water/glucose/etc.) matter, shown as chips with capacity
//   progress bars.
//
// L2+: stage resources are abstracted into the Divine Engine. The bar
//   shows only META CURRENCIES as compact pills. Priority list (max 3):
//     Divinity · Faith · Genesis Seeds
//
// CURRENCY-UNIFICATION — the Evolution Points (EP) and Prestige Points
// (PP) pills have been removed. The shop now spends a single currency
// (Divinity) for all upgrades. EP/PP fields stay on GameState for
// back-compat but are no longer rendered anywhere in the UI.
//
// Removed in this redesign:
//   - "📚 N resources X% avg" summary chip (was confusing)
//   - Archetype badge (lives in the Prestige tab now)
//   - The "🌌 Divine Engine" label text at L2+ (the Header already shows
//     the active layer; the bar doesn't need to repeat it)
//   - EP pill (was: 🌱 N EP) — folded into Divinity
//   - PP pill (was: ✦ N PP) — folded into Divinity
// ============================================================

export function ResourceBar() {
  const resources = useGameStore((s) => s.resources);
  const capacities = useGameStore((s) => s.capacities);
  const stageIndex = useGameStore((s) => s.stageIndex);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);

  // Meta currencies (priority list — L2+ only).
  // CURRENCY-UNIFICATION — Divinity is now the single shop currency; the
  // old EP/PP subscriptions are gone.
  const divinity = useGameStore((s) => s.divinity);
  // MERGED: genesisSeeds removed — merged with Divinity
  // const genesisSeeds = useGameStore((s) => s.genesisSeeds);
  const faith = useGameStore((s) => s.faith);

  const stage = STAGES[stageIndex];
  const { isAtLeast } = useActiveLayer();
  const isL2Plus = isAtLeast("enlightenment");

  // === L1: stage-resource chip rendering (kept intact for first playthrough) ===
  const visibleStageResources = useMemo(() => {
    const all = STAGE_RESOURCES[stage.id] || [];
    if (isL2Plus) return [] as string[];
    // Hide resources whose `firstStage` is more than 3 stages below current
    // (e.g. at galactic, hide food/water/culture which originated in creature/tribal).
    const cutoff = Math.max(0, stageIndex - 3);
    return all.filter((id) => {
      const def = RESOURCE_MAP[id];
      if (!def) return true;
      const firstIdx = STAGE_IDS.indexOf(def.firstStage as never);
      return firstIdx < 0 || firstIdx >= cutoff;
    });
  }, [stage.id, stageIndex, isL2Plus]);

  return (
    <div
      className="sticky top-[53px] z-20 glass-strong border-b border-border/80"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* === L1: stage icon + name (left) === */}
          {!isL2Plus && (
            <div className="flex items-center gap-1.5 shrink-0 mr-1">
              <span className="text-base">{stage.icon}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:inline">
                {stage.name}
              </span>
            </div>
          )}

          {/* === L1: stage resource chips (left/center) === */}
          {!isL2Plus && (
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0 overflow-x-auto no-scrollbar">
              {visibleStageResources.map((id) => (
                <ResourceChip
                  key={id}
                  id={id}
                  value={resources[id] || 0}
                  capacity={capacities[id] || 0}
                />
              ))}
            </div>
          )}

          {/* === Meta currency pills (right; L2+: full-width left-aligned row) === */}
          <div className={cn(
            "flex items-center gap-1.5 shrink-0",
            isL2Plus && "flex-1 flex-wrap min-w-0 overflow-x-auto no-scrollbar justify-start"
          )}>
            {/* Priority list — max 3 (CURRENCY-UNIFICATION removed EP + PP). */}
            {isLayerAtLeast("enlightenment", unlockedLayers) && (
              <MetaPill icon="✨" label="Div" value={formatCompact(divinity)} color="text-violet-300" title="Divinity" />
            )}
            {isLayerAtLeast("apotheosis", unlockedLayers) && (
              <MetaPill icon="👑" label="Faith" value={formatCompact(faith)} color="text-amber-300" title="Faith" />
            )}
            {/* MERGED: Genesis Seeds removed from display — merged with Divinity */}
          </div>
        </div>
      </div>
    </div>
  );
}

// === Sub-components ===

function ResourceChip({ id, value, capacity }: { id: string; value: number; capacity: number }) {
  const pct = capacity > 0 ? (value / capacity) * 100 : 0;
  const nearCap = pct > 90;
  const low = id === "happiness" ? value < 25 : false;
  return (
    <div
      title={`${resourceName(id)}: ${formatNumber(value)} / ${formatNumber(capacity)}`}
      className={cn(
        "res-chip group relative shrink-0",
        nearCap && "chip-near-cap",
        low && "ring-1 ring-red-500/60"
      )}
    >
      <span className="text-sm leading-none">{resourceIcon(id)}</span>
      <span
        className="font-semibold tabular-nums text-xs"
        style={{ color: resourceColor(id) }}
      >
        {formatNumber(value)}
      </span>
      <span className="text-[0.65rem] text-muted-foreground tabular-nums">
        /{formatNumber(capacity)}
      </span>
      {/* Mini progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b overflow-hidden bg-muted/40">
        <div
          className={cn(
            "h-full transition-all",
            nearCap ? "bg-amber-400" : low ? "bg-red-400" : "bg-primary/70"
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

// MetaPill — compact inline currency pill. Icon sits inline, no box wrapper.
function MetaPill({
  icon,
  label,
  value,
  color,
  title,
}: {
  icon: string;
  label: string;
  value: string;
  color?: string;
  title?: string;
}) {
  return (
    <div className="res-chip shrink-0" title={title || label}>
      <span className="text-sm">{icon}</span>
      <span className={cn("font-semibold text-xs tabular-nums", color)}>{value}</span>
      <span className="text-[0.6rem] text-muted-foreground uppercase">{label}</span>
    </div>
  );
}
