"use client";

import { useState, useMemo } from "react";
import { useGameStore } from "@/game/state/store";
import {
  UNIVERSAL_GALAXIES,
  UNIVERSAL_GALAXY_MAP,
  TOTAL_UNIVERSAL_GALAXIES,
  TOTAL_NEW_GALAXIES_L6,
  TOTAL_NEW_SYSTEMS_L6,
  WORLDS_PER_NEW_SYSTEM_L6,
  RIFTS_REQUIRED_FOR_L7,
  ANCHORS_REQUIRED_FOR_L7,
  ANCHOR_RADIUS,
  riftCloseCost,
  anchorPlaceCost,
  newGalaxyAttackCost,
  galaxiesInAnchorRadius,
  isGalaxyAnchored,
  isUniversalMapComplete,
  totalNewSystemsClaimed,
  totalRivalSystemsClaimed,
  totalUniversalSystemsClaimed,
  type UniversalGalaxy,
} from "@/game/data/universalMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Lock, CheckCircle2, Anchor, Shield, Swords, Orbit, Sparkles, Crosshair, Globe2,
} from "lucide-react";
import { formatNumber, formatCompact } from "../shared/format";
import { BackgroundLayerBadge } from "../shared/BackgroundLayerBadge";
import { EmptyState } from "../shared/EmptyState";

// SVG viewport for the universal map (galaxy pos is in 0-100 units).
const MAP_SIZE = 100;

export function SingularityContent() {
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const singularityCores = useGameStore((s) => s.singularityCores);
  const faith = useGameStore((s) => s.faith);

  // L6 Universal Map runtime state
  const universalGalaxies = useGameStore((s) => s.universalGalaxies || []);
  const rifts = useGameStore((s) => s.rifts || []);
  const realityAnchors = useGameStore((s) => s.realityAnchors || []);
  const riftsClosed = useGameStore((s) => s.riftsClosed || 0);
  const anchorsPlaced = useGameStore((s) => s.anchorsPlaced || 0);
  const riftSpawnTimer = useGameStore((s) => s.riftSpawnTimer || 0);

  // Actions
  const closeRift = useGameStore((s) => s.closeRift);
  const placeRealityAnchor = useGameStore((s) => s.placeRealityAnchor);
  const attackUniversalGalaxy = useGameStore((s) => s.attackUniversalGalaxy);

  // Selected galaxy (for the detail panel). null = none.
  const [selectedGalaxyId, setSelectedGalaxyId] = useState<string | null>(null);

  const isUnlocked = !!unlockedLayers.singularity;

  // Build lookup maps for fast access in the SVG layer.
  const stateById = useMemo(() => {
    const m: Record<string, (typeof universalGalaxies)[number]> = {};
    for (const g of universalGalaxies) m[g.id] = g;
    return m;
  }, [universalGalaxies]);

  const riftsByGalaxyId = useMemo(() => {
    const m: Record<string, (typeof rifts)[number][]> = {};
    for (const r of rifts) {
      if (!m[r.galaxyId]) m[r.galaxyId] = [];
      m[r.galaxyId].push(r);
    }
    return m;
  }, [rifts]);

  const anchorGalaxyIds = useMemo(() => realityAnchors.map((a) => a.galaxyId), [realityAnchors]);

  // Aggregate stats for the sidebar.
  const totalSystemsClaimed = totalUniversalSystemsClaimed(universalGalaxies);
  const newSystemsClaimed = totalNewSystemsClaimed(universalGalaxies);
  const rivalSystemsClaimed = totalRivalSystemsClaimed(universalGalaxies);
  const worldBonusFromL6 = newSystemsClaimed * WORLDS_PER_NEW_SYSTEM_L6;

  const nextAnchorCost = anchorPlaceCost(anchorsPlaced);
  const l6Complete = isUniversalMapComplete(riftsClosed, anchorsPlaced);

  const selectedGalaxy = selectedGalaxyId ? UNIVERSAL_GALAXY_MAP[selectedGalaxyId] : null;
  const selectedState = selectedGalaxyId ? stateById[selectedGalaxyId] : null;
  const selectedRifts = selectedGalaxyId ? (riftsByGalaxyId[selectedGalaxyId] || []) : [];
  const selectedAnchored = selectedGalaxyId ? isGalaxyAnchored(selectedGalaxyId, anchorGalaxyIds) : false;
  const selectedIsNewL6 = !!selectedGalaxy?.isNewL6;
  const selectedAttackCost = selectedIsNewL6
    ? newGalaxyAttackCost(newSystemsClaimed)
    : 0;

  // SVG-friendly coordinate helper: galaxy.pos (0-100) → svg viewBox (0-100).
  const galaxyColor = (g: UniversalGalaxy): string => {
    const st = stateById[g.id];
    const owner = st?.ownerId || g.ownerId;
    if (owner === "player") return "#fbbf24"; // amber-400 — owned by player
    if (owner.startsWith("rival_")) return "#f472b6"; // pink-400 — rival-owned
    return "#475569"; // slate-600 — neutral
  };

  return (
    <>
      {/* LAYER-AS-TAB — was <DialogHeader>/<DialogTitle>/<DialogDescription>
          (Radix primitives that require a <Dialog> parent). Now plain HTML
          since this content renders inline in the tab panel. */}
      <div className="flex flex-col gap-2 text-center sm:text-left mb-3">
        <h2 className="text-lg leading-none font-semibold flex items-center gap-2 flex-wrap">
          <Orbit className="w-5 h-5 text-cyan-300" />
          Layer 6 — Singularity (Universal Map)
          <BackgroundLayerBadge layerId="singularity" />
        </h2>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span>
              Defend the 50-galaxy universe from Old-God rifts. Close rifts (Singularity Cores),
              place Reality Anchors (Singularity Cores) to immunize galaxies, and conquer
              neutral galaxies (Faith) for <span className="text-cyan-300">+198 worlds</span> each.
            </span>
            <div className="flex gap-1 flex-wrap">
              <Badge variant="outline" className="text-cyan-300 border-cyan-400/40">
                  <Sparkles className="w-3 h-3 mr-0.5" /> {formatNumber(singularityCores, 0)} Cores
                </Badge>
                <Badge variant="outline" className={l6Complete ? "text-emerald-300 border-emerald-400/40" : "text-amber-300 border-amber-400/40"}>
                  <Shield className="w-3 h-3 mr-0.5" /> {riftsClosed}/{RIFTS_REQUIRED_FOR_L7} rifts
                </Badge>
                <Badge variant="outline" className={l6Complete ? "text-emerald-300 border-emerald-400/40" : "text-amber-300 border-amber-400/40"}>
                  <Anchor className="w-3 h-3 mr-0.5" /> {anchorsPlaced}/{ANCHORS_REQUIRED_FOR_L7} anchors
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Singularity is sealed.</p>
            <p className="text-xs mt-1">Enact 3+ Divine Laws (Layer 5) to unlock Singularity.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
            {/* P7 — Empty state banner: shown when player hasn't closed any
                rifts yet, to point them at the rift-closing mechanic. */}
            {riftsClosed === 0 && (
              <div className="lg:col-span-2">
                <EmptyState
                  compact
                  icon={<Shield className="w-6 h-6" />}
                  title="No rifts closed yet."
                  description="Close your first rift to defend reality. When a rift spawns on the map, click it to spend Singularity Cores and seal it."
                />
              </div>
            )}
            {/* ===== UNIVERSAL MAP (SVG) ===== */}
            <section className="stat-card p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[0.7rem] uppercase tracking-wide text-cyan-300/80 flex items-center gap-1">
                  <Globe2 className="w-3 h-3" /> Universal Map — {TOTAL_UNIVERSAL_GALAXIES} galaxies ({TOTAL_NEW_GALAXIES_L6} new)
                </div>
                <Badge variant="outline" className="text-[0.6rem] text-violet-300 border-violet-400/40">
                  🌀 Next rift in {Math.max(0, Math.ceil(riftSpawnTimer))}s
                </Badge>
              </div>

              <div className="relative w-full aspect-square rounded-md border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 overflow-hidden">
                <svg viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} className="w-full h-full">
                  {/* Anchor coverage rings — drawn first so galaxies sit on top */}
                  {realityAnchors.map((a) => {
                    const g = UNIVERSAL_GALAXY_MAP[a.galaxyId];
                    if (!g) return null;
                    return (
                      <circle
                        key={`anchor-ring-${a.id}`}
                        cx={g.pos.x}
                        cy={g.pos.y}
                        r={ANCHOR_RADIUS}
                        fill="rgba(59, 130, 246, 0.08)"
                        stroke="rgba(96, 165, 250, 0.45)"
                        strokeWidth={0.4}
                        strokeDasharray="1 1.5"
                      />
                    );
                  })}

                  {/* Galaxies */}
                  {UNIVERSAL_GALAXIES.map((g) => {
                    const st = stateById[g.id];
                    const riftList = riftsByGalaxyId[g.id] || [];
                    const anchored = isGalaxyAnchored(g.id, anchorGalaxyIds);
                    const owned = (st?.ownerId || g.ownerId) === "player";
                    const radius = owned ? 1.8 : 1.3;
                    const fill = galaxyColor(g);
                    const isSelected = selectedGalaxyId === g.id;
                    return (
                      <g
                        key={g.id}
                        onClick={() => setSelectedGalaxyId(g.id)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Selection highlight */}
                        {isSelected && (
                          <circle
                            cx={g.pos.x}
                            cy={g.pos.y}
                            r={radius + 1.5}
                            fill="none"
                            stroke="#fcd34d"
                            strokeWidth={0.5}
                          />
                        )}
                        {/* Anchor indicator ring around the galaxy itself */}
                        {anchored && (
                          <circle
                            cx={g.pos.x}
                            cy={g.pos.y}
                            r={radius + 1}
                            fill="none"
                            stroke="#60a5fa"
                            strokeWidth={0.6}
                            className="singularity-anchor-glow"
                          />
                        )}
                        {/* Galaxy body */}
                        <circle
                          cx={g.pos.x}
                          cy={g.pos.y}
                          r={radius}
                          fill={fill}
                          stroke={owned ? "#fde68a" : "rgba(148, 163, 184, 0.4)"}
                          strokeWidth={owned ? 0.4 : 0.2}
                          opacity={owned ? 1 : 0.7}
                        />
                        {/* Rift pulse — red overlay drawn on top of the galaxy */}
                        {riftList.length > 0 && (
                          <>
                            <circle
                              cx={g.pos.x}
                              cy={g.pos.y}
                              r={radius + 0.8}
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth={0.5}
                              className="singularity-rift-pulse"
                            />
                            <circle
                              cx={g.pos.x}
                              cy={g.pos.y}
                              r={radius + 1.6}
                              fill="none"
                              stroke="rgba(239, 68, 68, 0.4)"
                              strokeWidth={0.3}
                              className="singularity-rift-pulse-outer"
                            />
                          </>
                        )}
                        {/* Heresy tint — opacity scales with heresy level */}
                        {((st?.heresy || 0) > 0) && (
                          <circle
                            cx={g.pos.x}
                            cy={g.pos.y}
                            r={radius}
                            fill="#7c1d1d"
                            opacity={Math.min(0.7, (st?.heresy || 0) / 100 * 0.7)}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Map legend */}
                <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1.5 text-[0.55rem]">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900/70 border border-slate-700/50 text-amber-300 flex items-center gap-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" /> Owned
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900/70 border border-slate-700/50 text-slate-300 flex items-center gap-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-500" /> Neutral
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900/70 border border-slate-700/50 text-pink-300 flex items-center gap-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-400" /> Rival
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900/70 border border-slate-700/50 text-blue-300 flex items-center gap-0.5">
                    <Anchor className="w-2.5 h-2.5" /> Anchored
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900/70 border border-slate-700/50 text-red-300 flex items-center gap-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Rift
                  </span>
                </div>
              </div>

              {/* Selected-galaxy detail / actions */}
              {selectedGalaxy && selectedState ? (
                <div className="mt-2 rounded-md border border-cyan-400/30 bg-cyan-950/20 p-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-cyan-200">
                      {selectedGalaxy.name}
                      {selectedGalaxy.isNewL6 && (
                        <Badge variant="outline" className="ml-1 text-[0.55rem] text-violet-300 border-violet-400/40">
                          NEW L6
                        </Badge>
                      )}
                    </div>
                    <div className="text-[0.6rem] text-muted-foreground">
                      {selectedGalaxy.tagline}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[0.65rem] font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Owner</span>
                      <span className="text-amber-300">{selectedState.ownerId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Systems</span>
                      <span className="text-cyan-300">
                        {selectedState.systemsClaimed}/{selectedGalaxy.systemCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Heresy</span>
                      <span className={selectedState.heresy > 50 ? "text-red-300" : "text-slate-300"}>
                        {Math.floor(selectedState.heresy)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Anchored</span>
                      <span className={selectedAnchored ? "text-blue-300" : "text-slate-500"}>
                        {selectedAnchored ? "YES" : "no"}
                      </span>
                    </div>
                  </div>

                  {/* Active rifts on this galaxy — close buttons */}
                  {selectedRifts.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-cyan-400/20">
                      <div className="text-[0.6rem] uppercase text-red-300/80 flex items-center gap-1">
                        <Crosshair className="w-2.5 h-2.5" /> {selectedRifts.length} active rift{selectedRifts.length === 1 ? "" : "s"}
                      </div>
                      {selectedRifts.map((r) => {
                        const cost = riftCloseCost(r.severity);
                        const afford = singularityCores >= cost;
                        return (
                          <div key={r.id} className="flex items-center justify-between gap-2 text-[0.65rem]">
                            <span className="text-red-300">
                              Severity {r.severity} — close cost {cost} Core{cost === 1 ? "" : "s"}
                            </span>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 text-[0.6rem] px-2"
                              disabled={!afford}
                              onClick={() => {
                                closeRift(r.id);
                              }}
                            >
                              <Shield className="w-2.5 h-2.5 mr-0.5" /> Close
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Anchor placement */}
                  {!selectedAnchored && (
                    <div className="pt-1 border-t border-cyan-400/20 flex items-center justify-between gap-2 text-[0.65rem]">
                      <span className="text-blue-300">
                        Anchor this galaxy (+ covers {galaxiesInAnchorRadius(selectedGalaxy.id).length} galaxies in {ANCHOR_RADIUS}u radius)
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[0.6rem] px-2 border-blue-400/40 text-blue-300"
                        disabled={singularityCores < nextAnchorCost}
                        onClick={() => placeRealityAnchor(selectedGalaxy.id)}
                        title={`Place Reality Anchor on ${selectedGalaxy.name} — cost ${nextAnchorCost} Singularity Cores`}
                      >
                        <Anchor className="w-2.5 h-2.5 mr-0.5" /> {nextAnchorCost}
                      </Button>
                    </div>
                  )}
                  {selectedAnchored && (
                    <div className="pt-1 border-t border-cyan-400/20 text-[0.6rem] text-blue-300/80 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Reality Anchor in place — immune to rift corruption.
                    </div>
                  )}

                  {/* Attack — only for new neutral L6 galaxies */}
                  {selectedIsNewL6 && selectedState.systemsClaimed < selectedGalaxy.systemCount && (
                    <div className="pt-1 border-t border-cyan-400/20 flex items-center justify-between gap-2 text-[0.65rem]">
                      <span className="text-amber-300">
                        Claim system {selectedState.systemsClaimed + 1}/{selectedGalaxy.systemCount} (+198 worlds)
                      </span>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-6 text-[0.6rem] px-2 bg-amber-600/70 hover:bg-amber-600"
                        disabled={faith < selectedAttackCost}
                        onClick={() => attackUniversalGalaxy(selectedGalaxy.id)}
                        title={`Launch attack on ${selectedGalaxy.name} — cost ${selectedAttackCost} Faith`}
                      >
                        <Swords className="w-2.5 h-2.5 mr-0.5" /> {selectedAttackCost} Faith
                      </Button>
                    </div>
                  )}
                  {selectedIsNewL6 && selectedState.systemsClaimed >= selectedGalaxy.systemCount && (
                    <div className="pt-1 border-t border-cyan-400/20 text-[0.6rem] text-emerald-300/80 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Galaxy fully claimed (+{(selectedGalaxy.systemCount * WORLDS_PER_NEW_SYSTEM_L6).toLocaleString()} worlds total).
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 rounded-md border border-cyan-400/10 bg-cyan-950/10 p-2 text-[0.65rem] text-muted-foreground text-center">
                  Click a galaxy on the map to inspect it, close rifts, place anchors, or launch attacks.
                </div>
              )}
            </section>

            {/* ===== SIDEBAR ===== */}
            <aside className="space-y-3">
              {/* Universal Map progress */}
              <div className="stat-card">
                <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">
                  L6 → L7 progress
                </div>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[0.65rem] mb-0.5">
                      <span className="text-red-300/80">Rifts closed</span>
                      <span className="text-red-200 font-mono">{riftsClosed}/{RIFTS_REQUIRED_FOR_L7}</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all"
                        style={{ width: `${Math.min(100, (riftsClosed / RIFTS_REQUIRED_FOR_L7) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[0.65rem] mb-0.5">
                      <span className="text-blue-300/80">Anchors placed</span>
                      <span className="text-blue-200 font-mono">{anchorsPlaced}/{ANCHORS_REQUIRED_FOR_L7}</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                        style={{ width: `${Math.min(100, (anchorsPlaced / ANCHORS_REQUIRED_FOR_L7) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                {l6Complete && (
                  <div className="mt-2 rounded-md border border-emerald-400/60 bg-emerald-500/20 p-1.5 text-[0.65rem] text-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Universal Map stabilized — Omnipotence unlocked!
                  </div>
                )}
              </div>

              {/* Aggregate stats */}
              <div className="stat-card">
                <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">
                  Universe statistics
                </div>
                <div className="space-y-1 text-[0.7rem] font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total systems</span>
                    <span className="text-cyan-300">{formatNumber(totalSystemsClaimed, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">L5 rival systems</span>
                    <span className="text-pink-300">{formatNumber(rivalSystemsClaimed, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">L6 new systems</span>
                    <span className="text-violet-300">{formatNumber(newSystemsClaimed, 0)} / {TOTAL_NEW_SYSTEMS_L6}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">World bonus</span>
                    <span className="text-emerald-300">+{formatCompact(worldBonusFromL6)} worlds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active rifts</span>
                    <span className="text-red-300">{rifts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reality anchors</span>
                    <span className="text-blue-300">{realityAnchors.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Faith available</span>
                    <span className="text-amber-300">{formatNumber(faith, 0)}</span>
                  </div>
                </div>
              </div>

              {/* L6 progression summary */}
              <div className="stat-card">
                <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">
                  L6 progression
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-red-300 border-red-400/40">{rifts.length} active rift(s)</Badge>
                  <Badge variant="outline" className="text-blue-300 border-blue-400/40">{realityAnchors.length} anchor(s) placed</Badge>
                  <Badge variant="outline" className="text-amber-300 border-amber-400/40">{formatNumber(singularityCores, 0)} Singularity Cores</Badge>
                </div>
                <div className="text-[0.6rem] text-muted-foreground mt-1.5 leading-snug">
                  Close rifts (Singularity Cores) and place Reality Anchors (Singularity Cores) to stabilize the universe. Anchored galaxies are immune to rift corruption.
                </div>
              </div>
            </aside>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1">
          <span className="text-cyan-300">Universal Map</span> — defend 50 galaxies from Old-God rifts. Close rifts for Singularity Cores, place Reality Anchors to immunize galaxies in a {ANCHOR_RADIUS}-unit radius, and conquer new neutral galaxies (Faith) for +198 worlds each. Close {RIFTS_REQUIRED_FOR_L7} rifts + place {ANCHORS_REQUIRED_FOR_L7} anchors to unlock Layer 7 (Omnipotence).
        </div>
    </>
  );
}
