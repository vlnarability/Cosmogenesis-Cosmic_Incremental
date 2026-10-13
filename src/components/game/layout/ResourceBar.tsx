"use client";

import { useGameStore } from "@/game/state/store";
import { STAGE_RESOURCES, RESOURCE_MAP } from "@/game/data/resources";
import { STAGES, STAGE_IDS } from "@/game/data/stages";
import { ARCHETYPE_MAP } from "@/game/data/archetypes";
import { useActiveLayer, isLayerAtLeast } from "@/game/state/layerHelpers";
import { formatNumber, formatCompact, resourceColor, resourceIcon, resourceName } from "../shared/format";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

export function ResourceBar() {
  const resources = useGameStore((s) => s.resources);
  const capacities = useGameStore((s) => s.capacities);
  const stageIndex = useGameStore((s) => s.stageIndex);
  const evolutionPoints = useGameStore((s) => s.evolutionPoints);
  const galacticWins = useGameStore((s) => s.galacticWins);
  const lockedArchetype = useGameStore((s) => s.lockedArchetype);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  // PP-SHOP-TABS — read the EP Auto-Converter ownership so we can hide the EP
  // chip from the ResourceBar once EP becomes internal-only.
  const upgrades = useGameStore((s) => s.upgrades);

  // Layer currencies (shown when their layer is unlocked)
  const divinity = useGameStore((s) => s.divinity);
  const genesisSeeds = useGameStore((s) => s.genesisSeeds);
  const faith = useGameStore((s) => s.faith);
  const singularityCores = useGameStore((s) => s.singularityCores);
  const divineFragments = useGameStore((s) => s.divineFragments);
  const cosmicBoonStacks = useGameStore((s) => s.cosmicBoonStacks);
  const prestigePoints = useGameStore((s) => s.prestigePoints);

  const stage = STAGES[stageIndex];

  const { activeLayerId, isAtLeast } = useActiveLayer();
  const isL2Plus = isAtLeast("enlightenment");   // L2+ — hide primitive resources
  const isL3Plus = isAtLeast("transcendence");    // L3+ — collapse to top 3
  const isL5Plus = isAtLeast("apotheosis");       // L5+ — single summary chip

  // === Compute visible stage resources based on active layer ===
  // BACKGROUND-SIMULATION — at L2+ (Enlightenment unlocked), ALL stage
  // resources are hidden. The ResourceBar shows only meta currencies:
  // Divinity, EP, PP. The base game is abstracted into the Divine Engine.
  const visibleStageResources = useMemo(() => {
    const all = STAGE_RESOURCES[stage.id] || [];
    if (isL2Plus) return [] as string[]; // L2+: hide ALL stage resources
    // L2+: hide resources whose `firstStage` is more than 3 stages below current.
    // (e.g. at galactic, hide food/water/culture/science/happiness/military_power which originated in creature/tribal)
    const cutoff = Math.max(0, stageIndex - 3);
    return all.filter((id) => {
      const def = RESOURCE_MAP[id];
      if (!def) return true;
      const firstIdx = STAGE_IDS.indexOf(def.firstStage as any);
      return firstIdx < 0 || firstIdx >= cutoff;
    });
  }, [stage.id, stageIndex, isL2Plus]);

  // Top 3 by current value (L3+ collapse mode)
  const top3 = useMemo(() => {
    return [...visibleStageResources]
      .sort((a, b) => (resources[b] || 0) - (resources[a] || 0))
      .slice(0, 3);
  }, [visibleStageResources, resources]);

  const [expanded, setExpanded] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // Summary chip stats (L5+)
  const summaryStats = useMemo(() => {
    const ids = STAGE_RESOURCES[stage.id] || [];
    let total = 0;
    let totalPct = 0;
    let count = 0;
    for (const id of ids) {
      const res = resources[id] || 0;
      const cap = capacities[id] || 0;
      if (cap > 0) {
        totalPct += Math.min(100, (res / cap) * 100);
        count++;
      }
      total++;
    }
    const avgPct = count > 0 ? Math.round(totalPct / count) : 0;
    return { total, avgPct };
  }, [stage.id, resources, capacities]);

  const archDef = lockedArchetype ? ARCHETYPE_MAP[lockedArchetype] : null;

  // Determine which stage-resource list to actually render:
  // - L5+: hidden by default (replaced by summary chip)
  // - L3+: top 3 (or all if expanded)
  // - L2+: visibleStageResources (filtered)
  // - L1: all
  const renderStageResources = isL5Plus
    ? (summaryExpanded ? (STAGE_RESOURCES[stage.id] || []) : [])
    : isL3Plus
    ? (expanded ? visibleStageResources : top3)
    : visibleStageResources;

  const hiddenCount = isL3Plus
    ? Math.max(0, visibleStageResources.length - top3.length)
    : 0;

  return (
    <div
      className="sticky top-[53px] z-20 glass-strong border-b border-border/80"
      style={{ boxShadow: `0 4px 20px -8px ${stage.accent}40` }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Stage label (de-emphasized at L5+) */}
          {/* BACKGROUND-SIMULATION — at L2+ (Enlightenment unlocked), the base
              game is fully abstracted; the ResourceBar shows "🌌 Divine Engine"
              instead of the current stage's icon + name. */}
          <div className="flex items-center gap-1.5 shrink-0 mr-1">
            {isL2Plus ? (
              <>
                <span className="text-base animate-pulse">🌌</span>
                <span
                  className="text-xs font-bold uppercase tracking-wider hidden sm:inline bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent"
                  title="Background simulations are running — base game abstracted away"
                >
                  Divine Engine
                </span>
              </>
            ) : (
              <>
                <span className="text-base">{stage.icon}</span>
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider hidden sm:inline",
                    isL5Plus ? "text-muted-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {stage.name}
                </span>
                {isL5Plus && (
                  <span
                    className="text-xs font-bold uppercase tracking-wider hidden sm:inline text-amber-300"
                    title={`Active layer: ${activeLayerId}`}
                  >
                    · {activeLayerId}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Stage resource chips (or summary chip at L5+).
              BACKGROUND-SIMULATION — at L2+ (Enlightenment unlocked), the entire
              stage-resource row is hidden. ResourceBar shows only meta currencies
              (Divinity, EP, PP) which render in the right-side meta-chip group. */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0 overflow-x-auto no-scrollbar">
            {isL5Plus && !isL2Plus && !summaryExpanded && (
              <button
                onClick={() => setSummaryExpanded(true)}
                className="res-chip shrink-0 cursor-pointer hover:bg-muted/40 transition-colors"
                title="Click to expand stage resources"
              >
                <span className="text-sm">📚</span>
                <span className="text-xs font-semibold text-foreground/80">
                  {summaryStats.total} resources
                </span>
                <span className="text-[0.65rem] text-muted-foreground tabular-nums">
                  {summaryStats.avgPct}% avg
                </span>
              </button>
            )}
            {isL5Plus && !isL2Plus && summaryExpanded && (
              <button
                onClick={() => setSummaryExpanded(false)}
                className="res-chip shrink-0 cursor-pointer hover:bg-muted/40 transition-colors"
                title="Collapse stage resources"
              >
                <span className="text-sm">📚</span>
                <span className="text-xs font-semibold text-amber-300">Collapse</span>
              </button>
            )}
            {renderStageResources.map((id) => (
              <ResourceChip
                key={id}
                id={id}
                value={resources[id] || 0}
                capacity={capacities[id] || 0}
              />
            ))}
            {isL3Plus && !expanded && hiddenCount > 0 && (
              <button
                onClick={() => setExpanded(true)}
                className="res-chip shrink-0 cursor-pointer hover:bg-muted/40 transition-colors text-xs text-muted-foreground"
                title={`Expand ${hiddenCount} more resources`}
              >
                +{hiddenCount} more
              </button>
            )}
            {isL3Plus && expanded && hiddenCount > 0 && (
              <button
                onClick={() => setExpanded(false)}
                className="res-chip shrink-0 cursor-pointer hover:bg-muted/40 transition-colors text-xs text-muted-foreground"
              >
                Collapse
              </button>
            )}
          </div>

          {/* Right-side meta chips (prestige currencies + archetype) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {archDef && (
              <div
                className="res-chip shrink-0"
                title={`Lineage: ${archDef.name} — ${archDef.bonus.label}`}
                style={{ borderColor: `${archDef.color}60` }}
              >
                <span className="text-sm font-mono">{archDef.glyph}</span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: archDef.color }}
                >
                  {archDef.name}
                </span>
              </div>
            )}
            {/* Prestige Points (universal currency) */}
            {prestigePoints > 0 && (
              <MetaChip icon="✨" label="PP" value={formatCompact(prestigePoints)} color="text-fuchsia-300" title="Prestige Points" />
            )}
            {/* Layer 2 — Divinity (also used as L3 Transcendence currency) */}
            {isLayerAtLeast("enlightenment", unlockedLayers) && divinity > 0 && (
              <MetaChip icon="✨" label="Div" value={formatCompact(divinity)} color="text-violet-300" title="Divinity (Layer 2/3)" />
            )}
            {/* Layer 4 — Genesis Seeds */}
            {isLayerAtLeast("genesis", unlockedLayers) && genesisSeeds > 0 && (
              <MetaChip icon="🥚" label="Seed" value={formatCompact(genesisSeeds)} color="text-emerald-300" title="Genesis Seeds (Layer 4)" />
            )}
            {/* Layer 5 — Faith */}
            {isLayerAtLeast("apotheosis", unlockedLayers) && faith > 0 && (
              <MetaChip icon="👑" label="Faith" value={formatCompact(faith)} color="text-amber-300" title="Faith (Layer 5)" />
            )}
            {/* Layer 6 — Singularity Cores */}
            {isLayerAtLeast("singularity", unlockedLayers) && singularityCores > 0 && (
              <MetaChip icon="🌀" label="Core" value={formatCompact(singularityCores)} color="text-cyan-300" title="Singularity Cores (Layer 6)" />
            )}
            {/* Layer 9 — Divine Fragments */}
            {isLayerAtLeast("infinity", unlockedLayers) && divineFragments > 0 && (
              <MetaChip icon="💎" label="Frag" value={formatCompact(divineFragments)} color="text-sky-300" title="Divine Fragments (Layer 9)" />
            )}
            {/* Layer 10 — Cosmic Boons */}
            {isLayerAtLeast("eternity", unlockedLayers) && cosmicBoonStacks > 0 && (
              <MetaChip icon="🌠" label="Boon" value={formatCompact(cosmicBoonStacks)} color="text-indigo-300" title="Cosmic Boons (Layer 10)" />
            )}
            {/* EP — always show if > 0, UNLESS the EP Auto-Converter upgrade
                is owned (PP-SHOP-TABS — EP becomes internal-only at that point). */}
            {(evolutionPoints > 0 || galacticWins > 0) && (upgrades["ep_auto_converter"] || 0) === 0 && (
              <div className="res-chip shrink-0" title="Evolution Points">
                <span className="text-sm">🌱</span>
                <span className="font-semibold text-emerald-400 text-xs tabular-nums">
                  {formatCompact(evolutionPoints)}
                </span>
              </div>
            )}
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

function MetaChip({
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
