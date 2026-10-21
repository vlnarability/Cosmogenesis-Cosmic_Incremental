"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/game/state/store";
import {
  GALAXY_SYSTEMS,
  GALAXY_SCAN_COST,
  GALAXY_TOTAL_SYSTEMS,
  galaxyClaimCost,
  getGalaxySystemNeighbors,
  summarizeGalaxyBonuses,
  type GalaxyBonusType,
} from "@/game/data/galaxyMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Lock,
  Egg,
  Telescope,
  Star,
  Boxes,
  Database,
  Sparkles,
  Gauge,
  Package,
  Users,
} from "lucide-react";
import { formatNumber } from "../shared/format";
import { BackgroundLayerBadge } from "../shared/BackgroundLayerBadge";
import { EmptyState } from "../shared/EmptyState";

// Star radius (SVG units). 4 keeps the 50-star map readable inside a
// 520-ish-wide viewBox while still fitting on narrow phone screens (the
// container scrolls horizontally when needed).
const STAR_SIZE = 4;

const BONUS_ICON: Record<GalaxyBonusType, string> = {
  production: "⚙️",
  capacity: "📦",
  ep: "✨",
  pop: "👥",
};

const BONUS_LABEL: Record<GalaxyBonusType, string> = {
  production: "Production",
  capacity: "Capacity",
  ep: "Enlightenment",
  pop: "Population",
};

function bonusPct(value: number): string {
  return `+${Math.round(value * 100)}%`;
}

export function GenesisContent() {
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const divinity = useGameStore((s) => s.divinity);
  const debugFreeBuy = useGameStore((s) => s.debugFreeBuy);

  const galaxySystems = useGameStore((s) => s.galaxySystems || []);
  const scanGalaxySystem = useGameStore((s) => s.scanGalaxySystem);
  const claimGalaxySystem = useGameStore((s) => s.claimGalaxySystem);

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const isUnlocked = !!unlockedLayers.genesis;

  // Pre-compute pixel positions + viewBox for the SVG. GALAXY_SYSTEMS is
  // static, but we depend on `galaxySystems` so the per-system state
  // (claimed/explored) is fresh on every interaction.
  const layout = useMemo(() => {
    const pts = GALAXY_SYSTEMS.map((sys) => {
      const state = galaxySystems.find((g) => g.id === sys.id);
      const px = { x: sys.pos.x, y: sys.pos.y };
      return { sys, state, x: px.x, y: px.y };
    });
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const pad = STAR_SIZE * 3;
    return {
      pts,
      viewBox: `${(minX - pad).toFixed(2)} ${(minY - pad).toFixed(2)} ${((maxX - minX) + pad * 2).toFixed(2)} ${((maxY - minY) + pad * 2).toFixed(2)}`,
    };
  }, [galaxySystems]);

  const summary = useMemo(() => summarizeGalaxyBonuses(galaxySystems), [galaxySystems]);
  const claimedCount = summary.claimedCount;
  const exploredCount = galaxySystems.filter((g) => g.explored).length;
  const nextClaimCost = galaxyClaimCost(claimedCount);
  const worldBonus = claimedCount * 10;
  const canScan = debugFreeBuy || divinity >= GALAXY_SCAN_COST;
  const canClaim = debugFreeBuy || divinity >= nextClaimCost;

  // Connection lines between adjacent claimed systems (deduped: A→B and B→A
  // are the same line).
  const connectionLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
    const seen = new Set<string>();
    const claimedPts = layout.pts.filter((p) => p.state?.claimed);
    for (const p of claimedPts) {
      const neighbors = getGalaxySystemNeighbors(p.sys.id);
      for (const n of neighbors) {
        const np = layout.pts.find((pp) => pp.sys.id === n.id);
        if (!np || !np.state?.claimed) continue;
        const key = [p.sys.id, np.sys.id].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        lines.push({ x1: p.x, y1: p.y, x2: np.x, y2: np.y, key });
      }
    }
    return lines;
  }, [layout]);

  // Neighbor set for hover highlight.
  const hoveredNeighborIds = useMemo(() => {
    if (!hoveredId) return new Set<string>();
    return new Set(getGalaxySystemNeighbors(hoveredId).map((n) => n.id));
  }, [hoveredId]);

  // Quick lookup for "claimed neighbor count" per system (used for the ★ synergy
  // marker — claimed systems adjacent to 2+ other claimed systems).
  const claimedNeighborCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const sys of GALAXY_SYSTEMS) {
      const neighbors = getGalaxySystemNeighbors(sys.id);
      const c = neighbors.filter((n) => galaxySystems.find((g) => g.id === n.id)?.claimed).length;
      map.set(sys.id, c);
    }
    return map;
  }, [galaxySystems]);

  return (
    <>
      {/* LAYER-AS-TAB — was <DialogHeader>/<DialogTitle>/<DialogDescription>
          (Radix primitives that require a <Dialog> parent). Now plain HTML
          since this content renders inline in the tab panel. */}
      <div className="flex flex-col gap-2 text-center sm:text-left mb-3">
        <h2 className="text-lg leading-none font-semibold flex items-center gap-2 flex-wrap">
          <Egg className="w-5 h-5" />
          Layer 4 — Genesis (Galaxy Claim)
          <BackgroundLayerBadge layerId="genesis" />
        </h2>
        <p className="text-sm text-muted-foreground flex items-center justify-between flex-wrap gap-2">
          <span>
            Survey 50 star systems on a star map. Scan the unknown, then claim with Divinity to grow the Divine Engine.
          </span>
          <Badge variant="outline" className="text-emerald-300 border-emerald-400/40 whitespace-nowrap">
            {formatNumber(divinity, 0)} Divinity
          </Badge>
        </p>
      </div>

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Genesis is sealed.</p>
            <p className="text-xs mt-1">Perform all 4 Blood Pacts (Layer 3) to unlock Genesis.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            {/* P7 — Empty state banner: shown when no systems claimed yet,
                to guide the player toward their first scan + claim. */}
            {claimedCount === 0 && (
              <div className="lg:col-span-2">
                <EmptyState
                  compact
                  icon={<Telescope className="w-6 h-6" />}
                  title="No systems claimed yet."
                  description="Scan a system to reveal its bonus, then claim it with Divinity. Click an unexplored star (with a ?) to begin."
                />
              </div>
            )}
            {/* Hex map */}
            <div className="stat-card overflow-x-auto">
              <svg
                viewBox={layout.viewBox}
                className="w-full h-auto"
                style={{ minWidth: 560, maxHeight: "62vh" }}
                role="img"
                aria-label="Galaxy star map"
              >
                {/* Connection lines (under stars) */}
                <g>
                  {connectionLines.map((l) => (
                    <line
                      key={l.key}
                      x1={l.x1}
                      y1={l.y1}
                      x2={l.x2}
                      y2={l.y2}
                      stroke="rgba(56, 189, 248, 0.55)"
                      strokeWidth={1.5}
                    />
                  ))}
                </g>

                {/* Hexes */}
                {layout.pts.map((p) => {
                  const sys = p.sys;
                  const state = p.state;
                  const claimed = !!state?.claimed;
                  const explored = !!state?.explored;
                  const isHovered = hoveredId === sys.id;
                  const isHoverNeighbor = hoveredNeighborIds.has(sys.id);
                  const synergyCount = claimedNeighborCount.get(sys.id) || 0;
                  const hasSynergy = claimed && synergyCount >= 2;

                  const fill = claimed
                    ? "rgba(56, 189, 248, 0.32)"
                    : explored
                      ? "rgba(148, 163, 184, 0.16)"
                      : "rgba(15, 23, 42, 0.55)";
                  const stroke = claimed
                    ? "rgba(56, 189, 248, 0.95)"
                    : explored
                      ? "rgba(148, 163, 184, 0.55)"
                      : "rgba(100, 116, 139, 0.55)";
                  const strokeW = isHovered ? 2.6 : isHoverNeighbor ? 1.8 : 1;

                  const shortName = sys.name.length > 9 ? `${sys.name.slice(0, 8)}…` : sys.name;

                  return (
                    <Tooltip key={sys.id}>
                      <TooltipTrigger asChild>
                        <g
                          transform={`translate(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredId(sys.id)}
                          onMouseLeave={() => setHoveredId((cur) => (cur === sys.id ? null : cur))}
                          onClick={() => {
                            if (!explored) scanGalaxySystem(sys.id);
                            else if (!claimed) claimGalaxySystem(sys.id);
                          }}
                        >
                          <circle
                            r={STAR_SIZE}
                            fill={fill}
                            stroke={isHovered ? "#fde047" : stroke}
                            strokeWidth={strokeW}
                          />
                          {claimed ? (
                            <>
                              <text
                                textAnchor="middle"
                                y={-3}
                                fontSize={11}
                                fill="#bae6fd"
                                style={{ pointerEvents: "none" }}
                              >
                                {BONUS_ICON[sys.bonus.type]}
                              </text>
                              <text
                                textAnchor="middle"
                                y={8}
                                fontSize={6.5}
                                fill="#cbd5e1"
                                style={{ pointerEvents: "none" }}
                              >
                                {shortName}
                              </text>
                              {hasSynergy && (
                                <text
                                  textAnchor="middle"
                                  y={-12}
                                  fontSize={10}
                                  fill="#fde047"
                                  style={{ pointerEvents: "none" }}
                                >
                                  ★
                                </text>
                              )}
                            </>
                          ) : explored ? (
                            <>
                              <text
                                textAnchor="middle"
                                y={-2}
                                fontSize={11}
                                fill="#fbbf24"
                                style={{ pointerEvents: "none" }}
                              >
                                {BONUS_ICON[sys.bonus.type]}
                              </text>
                              <text
                                textAnchor="middle"
                                y={8}
                                fontSize={6.5}
                                fill="#94a3b8"
                                style={{ pointerEvents: "none" }}
                              >
                                {bonusPct(sys.bonus.value)}
                              </text>
                            </>
                          ) : (
                            <text
                              textAnchor="middle"
                              y={4}
                              fontSize={14}
                              fill="#64748b"
                              style={{ pointerEvents: "none" }}
                            >
                              ?
                            </text>
                          )}
                        </g>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px]">
                        <div className="text-[0.7rem] space-y-0.5">
                          <div className="font-semibold text-cyan-200">{sys.name}</div>
                          <div className="text-muted-foreground">Position ({sys.pos.x.toFixed(1)}, {sys.pos.y.toFixed(1)})</div>
                          {explored ? (
                            <>
                              <div>
                                {BONUS_LABEL[sys.bonus.type]}: {bonusPct(sys.bonus.value)}
                              </div>
                              {sys.rareResource && (
                                <div className="text-amber-300">
                                  Rare: {sys.rareResource === "alloys" ? "Alloys" : "Data"}
                                </div>
                              )}
                              <div className={claimed ? "text-cyan-300" : "text-emerald-300"}>
                                {claimed
                                  ? "✓ Claimed"
                                  : `Claim cost: ${nextClaimCost} Divinity`}
                              </div>
                            </>
                          ) : (
                            <div className="text-violet-300">
                              Unexplored — Scan for {GALAXY_SCAN_COST} Divinity
                            </div>
                          )}
                          <div className="text-muted-foreground">
                            {synergyCount} claimed neighbor{synergyCount === 1 ? "" : "s"}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </svg>
              <div className="text-[0.6rem] text-muted-foreground mt-1 leading-relaxed">
                Hover to highlight neighbors. Click an unexplored star to{" "}
                <span className="text-violet-300">scan</span> ({GALAXY_SCAN_COST} Divinity) or an
                explored unclaimed star to{" "}
                <span className="text-emerald-300">claim</span> ({nextClaimCost} Divinity).{" "}
                <span className="text-amber-300">★</span> = synergy (2+ claimed neighbors, +50% bonus).
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Progress */}
              <div className="stat-card">
                <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1">
                  Galaxy progress
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-cyan-200">{claimedCount}</span>
                  <span className="text-xs text-muted-foreground">/ {GALAXY_TOTAL_SYSTEMS} systems</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-[0.6rem] text-emerald-300 border-emerald-400/40">
                    {formatNumber(divinity, 0)} Divinity
                  </Badge>
                  <Badge variant="outline" className="text-[0.6rem] text-violet-300 border-violet-400/40">
                    {exploredCount} explored
                  </Badge>
                  <Badge variant="outline" className="text-[0.6rem] text-amber-300 border-amber-400/40">
                    {summary.synergyCount} ★ synergy
                  </Badge>
                </div>
              </div>

              {/* Worlds contributed */}
              <div className="stat-card">
                <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1">
                  Worlds contributed
                </div>
                <div className="text-lg font-bold text-amber-200">+{worldBonus}</div>
                <div className="text-[0.6rem] text-muted-foreground">
                  +10 worlds per claimed system (counts toward background simulations cap of 1,000 at L4)
                </div>
              </div>

              {/* Active bonuses */}
              <div className="stat-card">
                <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1">
                  Active bonuses
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <BonusRow icon={Gauge}    label="Prod" pct={summary.productionMult} tone="cyan" />
                  <BonusRow icon={Package}  label="Cap"   pct={summary.capMult}        tone="amber" />
                  <BonusRow icon={Sparkles} label="EP"    pct={summary.epMult}         tone="emerald" />
                  <BonusRow icon={Users}   label="Pop"   pct={summary.popGrowthMult}   tone="violet" />
                </div>
              </div>

              {/* Rare resources */}
              <div className="stat-card">
                <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1">
                  Rare resources collected
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[0.6rem] text-sky-300 border-sky-400/40">
                    <Boxes className="w-3 h-3 mr-1" /> Alloys × {summary.alloysCount}
                  </Badge>
                  <Badge variant="outline" className="text-[0.6rem] text-fuchsia-300 border-fuchsia-400/40">
                    <Database className="w-3 h-3 mr-1" /> Data × {summary.dataCount}
                  </Badge>
                </div>
              </div>

              {/* Next costs */}
              <div className="stat-card">
                <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1">
                  Next action
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[0.7rem]">
                    <span className="flex items-center gap-1">
                      <Telescope className="w-3 h-3" /> Scan (unexplored)
                    </span>
                    <Badge
                      variant="outline"
                      className={canScan
                        ? "text-violet-300 border-violet-400/40"
                        : "text-rose-300 border-rose-400/40"}
                    >
                      {GALAXY_SCAN_COST} Divinity
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[0.7rem]">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" /> Claim (explored)
                    </span>
                    <Badge
                      variant="outline"
                      className={canClaim
                        ? "text-cyan-300 border-cyan-400/40"
                        : "text-rose-300 border-rose-400/40"}
                    >
                      {nextClaimCost} Divinity
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="text-[0.6rem] text-muted-foreground leading-relaxed">
                Fill all {GALAXY_TOTAL_SYSTEMS} systems to complete Layer 4 and unlock{" "}
                <span className="text-cyan-300">Apotheosis (Layer 5)</span>.
              </div>
            </div>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1">
          The galaxy star map is the Layer 4 gameplay loop — scan unknown systems to reveal their bonus and
          rare resource, then claim them with Divinity. Adjacency matters: systems with 2+ claimed
          neighbors gain a <span className="text-amber-300">+50% synergy bonus</span>.
        </div>
    </>
  );
}

// Small helper component for the bonus summary rows.
function BonusRow({
  icon: Icon,
  label,
  pct,
  tone,
}: {
  icon: typeof Gauge;
  label: string;
  pct: number;
  tone: "cyan" | "amber" | "emerald" | "violet";
}) {
  const toneClasses = {
    cyan: "text-cyan-300 border-cyan-400/40",
    amber: "text-amber-300 border-amber-400/40",
    emerald: "text-emerald-300 border-emerald-400/40",
    violet: "text-violet-300 border-violet-400/40",
  }[tone];
  return (
    <Badge variant="outline" className={`text-[0.6rem] justify-between ${toneClasses}`}>
      <span className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </span>
      <span>+{Math.round(pct * 100)}%</span>
    </Badge>
  );
}
