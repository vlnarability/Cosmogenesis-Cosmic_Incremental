"use client";

import { useGameStore } from "@/game/state/store";
import { STAGE_RESOURCES, RESOURCE_MAP } from "@/game/data/resources";
import { STAGES, STAGE_IDS } from "@/game/data/stages";
import { useActiveLayer, isLayerAtLeast } from "@/game/state/layerHelpers";
import { computeResourceBreakdown, formatRate, type ResourceSource } from "@/game/state/resourceBreakdown";
import { formatNumber, formatCompact, resourceColor, resourceIcon, resourceName } from "../shared/format";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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

  // IDEA-8 — Divine Pantheon: show a compact pill at L8+ when at least one
  // Avatar is active. The pill surfaces the aggregate Divinity bonus from
  // the Ascendant domain (the most universally useful indicator). Hides
  // when no Avatar is present (avoids visual noise on fresh L8 unlock).
  const divinePantheon = useGameStore((s) => s.divinePantheon);
  const pantheonDivMult = useMemo(() => {
    if (!divinePantheon || !Array.isArray(divinePantheon)) return 0;
    let m = 0;
    for (const slot of divinePantheon) {
      if (slot?.avatar?.domain === "ascendant") {
        m += slot.avatar.powerLevel * 0.05;
      }
    }
    return m;
  }, [divinePantheon]);

  const stage = STAGES[stageIndex];
  const { isAtLeast } = useActiveLayer();
  const isL2Plus = isAtLeast("enlightenment");

  // RESOURCE-BREAKDOWN — subscribe to the underlying state slices that
  // affect the breakdown so useMemo re-runs only when those change.
  const ownedSystems = useGameStore((s) => s.ownedSystems);
  const systemEnabled = useGameStore((s) => s.systemEnabled);
  const technologies = useGameStore((s) => s.technologies);
  const capacitiesState = useGameStore((s) => s.capacities);
  const resourcesState = useGameStore((s) => s.resources);
  const breakdown = useMemo(
    () => computeResourceBreakdown({
      ownedSystems,
      systemEnabled,
      technologies,
      resources: resourcesState,
      capacities: capacitiesState,
      stageIndex,
    } as never),
    [ownedSystems, systemEnabled, technologies, resourcesState, capacitiesState, stageIndex]
  );

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
                  breakdown={breakdown[id]}
                />
              ))}
            </div>
          )}

          {/* === Meta currency pills (right; L2+: full-width left-aligned row) === */}
          <div className={cn(
            "flex items-center gap-1.5 shrink-0",
            isL2Plus && "flex-1 flex-wrap min-w-0 overflow-x-auto no-scrollbar justify-start"
          )}>
            {/* Priority list — max 3 (CURRENCY-UNIFICATION removed EP + PP).
                IDEA-8 — Pantheon pill at L8+ when an Ascendant Avatar is
                active, surfacing the active Divinity multiplier. */}
            {isLayerAtLeast("enlightenment", unlockedLayers) && (
              <MetaPill icon="✨" label="Div" value={formatCompact(divinity)} color="text-violet-300" title="Divinity" />
            )}
            {isLayerAtLeast("apotheosis", unlockedLayers) && (
              <MetaPill icon="👑" label="Faith" value={formatCompact(faith)} color="text-amber-300" title="Faith" />
            )}
            {isLayerAtLeast("divinity", unlockedLayers) && pantheonDivMult > 0 && (
              <MetaPill
                icon="🔱"
                label="Pantheon"
                value={`+${(pantheonDivMult * 100).toFixed(0)}%`}
                color="text-cyan-300"
                title={`Divine Pantheon: +${(pantheonDivMult * 100).toFixed(0)}% Divinity/s from Ascendant Avatars`}
              />
            )}
            {/* MERGED: Genesis Seeds removed from display — merged with Divinity */}
          </div>
        </div>
      </div>
    </div>
  );
}

// === Sub-components ===

function ResourceChip({ id, value, capacity, breakdown }: {
  id: string;
  value: number;
  capacity: number;
  breakdown?: { net: number; sources: ResourceSource[] };
}) {
  const pct = capacity > 0 ? (value / capacity) * 100 : 0;
  const nearCap = pct > 90;
  const low = id === "happiness" ? value < 25 : false;
  const net = breakdown?.net ?? 0;
  const hasSources = !!(breakdown && breakdown.sources.length > 0);
  const netPositive = net > 0.005;
  const netNegative = net < -0.005;
  // HUD-DE-NOISE: idle resources (|net| < 0.005) hide their rate entirely —
  // a wall of "0/s" chips is persistent noise. The rate span only renders
  // when something is actually flowing. (The tooltip still explains
  // per-system contributions on hover.)
  const showRate = netPositive || netNegative;
  return (
    <HoverCard openDelay={200} closeDelay={150}>
      <HoverCardTrigger asChild>
        <div
          className={cn(
            "res-chip group relative shrink-0 cursor-help",
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
          {/* Net rate/sec — only rendered when something is actually
              flowing (non-zero). Idle chips drop the rate entirely,
              reserving attention for resources that matter. */}
          {showRate && (
            <span
              className={cn(
                "ml-1 text-[0.6rem] tabular-nums font-medium",
                netPositive && "text-emerald-400",
                netNegative && "text-red-400",
                !netPositive && !netNegative && "text-muted-foreground/70"
              )}
              title={hasSources ? "Hover for per-system breakdown" : "No systems affect this resource yet"}
            >
              {formatRate(net)}
            </span>
          )}
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
      </HoverCardTrigger>
      {hasSources && (
        <HoverCardContent
          className="w-64 p-0 glass-strong"
          side="bottom"
          align="center"
        >
          <ResourceBreakdownTooltip id={id} value={value} capacity={capacity} breakdown={breakdown!} />
        </HoverCardContent>
      )}
    </HoverCard>
  );
}

function ResourceBreakdownTooltip({
  id,
  value,
  capacity,
  breakdown,
}: {
  id: string;
  value: number;
  capacity: number;
  breakdown: { net: number; sources: ResourceSource[] };
}) {
  const pct = capacity > 0 ? (value / capacity) * 100 : 0;
  const net = breakdown.net;
  return (
    <div className="text-xs">
      {/* Header: resource name + current/cap + net */}
      <div className="px-3 py-2 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-base">{resourceIcon(id)}</span>
          <span className="font-semibold" style={{ color: resourceColor(id) }}>
            {resourceName(id)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground">
          <span>{formatNumber(value)} / {formatNumber(capacity)} ({pct.toFixed(0)}%)</span>
          <span className={cn(
            "font-semibold tabular-nums",
            net > 0.005 && "text-emerald-400",
            net < -0.005 && "text-red-400",
            Math.abs(net) < 0.005 && "text-muted-foreground"
          )}>
            net {formatRate(net)}
          </span>
        </div>
      </div>
      {/* Per-system source list — scrollable if many systems contribute */}
      <div className="max-h-64 overflow-y-auto custom-scroll px-2 py-1.5 space-y-0.5">
        {breakdown.sources.map((src) => (
          <div
            key={`${src.systemId}-${src.kind}`}
            className="flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-muted/40"
          >
            <span className="text-sm leading-none">{src.systemIcon}</span>
            <span className="flex-1 truncate text-[0.7rem]">{src.systemName}</span>
            {src.disabled && (
              <span className="text-[0.55rem] text-muted-foreground italic">disabled</span>
            )}
            {src.idleByCap && (
              <span className="text-[0.55rem] text-amber-400 italic">idle (cap)</span>
            )}
            <span
              className={cn(
                "tabular-nums text-[0.7rem] font-semibold",
                src.amount > 0 && "text-emerald-400",
                src.amount < 0 && "text-red-400",
                src.amount === 0 && "text-muted-foreground"
              )}
            >
              {formatRate(src.amount)}
            </span>
          </div>
        ))}
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
