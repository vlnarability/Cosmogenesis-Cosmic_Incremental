"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useGameStore } from "@/game/state/store";
import {
  CONSTELLATIONS,
  CONSTELLATION_MAP,
  constellationBonus,
  starCost,
  countCompletedConstellations,
  countLitStars,
  canAdvanceToTranscendence,
  CONSTELLATIONS_REQUIRED_FOR_LAYER_3,
  CONSTELLATION_BASE_COST,
  WITHIN_CONSTELLATION_GROWTH,
  COST_GROWTH_PER_STARTED,
  NEW_CONSTELLATION_PENALTY,
  CATEGORY_LABEL,
  CATEGORY_ACCENT,
  STARGAZE_COST,
  STARGAZE_COOLDOWN_SEC,
  SUPERNOVA_COST,
  SUPERNOVA_COOLDOWN_SEC,
  BLACK_HOLE_COST,
  BLACK_HOLE_COOLDOWN_SEC,
  BLACK_HOLE_REFUND_FRACTION,
  COSMIC_BRIDGE_COST,
  COSMIC_BRIDGE_COOLDOWN_SEC,
  COSMIC_BRIDGE_DURATION_SEC,
  STARGAZE_CD_KEY,
  SUPERNOVA_CD_KEY,
  BLACK_HOLE_CD_KEY,
  COSMIC_BRIDGE_CD_KEY,
  type ConstellationState,
  type ConstellationCategory,
} from "@/game/data/constellations";
import {
  FORESIGHT_ROUTES,
  foresightBonus,
  routeBonus,
} from "@/game/data/foresight";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, Eye, Sparkles, Star, Sun, Disc3, Crosshair, Zap, Target, Orbit, Link as LinkIcon } from "lucide-react";
import { formatNumber } from "../shared/format";
import { BackgroundLayerBadge } from "../shared/BackgroundLayerBadge";

// SVG viewBox dimensions for the star map.
const MAP_W = 1000;
const MAP_H = 600;

// L2 ability modes. The first two are target-pick modes for Supernova/Black
// Hole; the last two implement the two-click Cosmic Bridge flow (pick first
// constellation, then pick second constellation to link).
type AbilityMode =
  | null
  | "supernova"
  | "blackhole"
  | "cosmicbridge_first"
  | "cosmicbridge_second";

/**
 * Layer 2 — Enlightenment (Constellation Map) — full redesign.
 *
 * Renders a star-map SVG (1000×600 viewBox) of all curated constellations.
 * Each star is a dim dot by default; lit stars glow. Constellation connection
 * lines appear dim until completed (or revealed by Stargaze), then bright.
 * Click a star to illuminate it (calls `illuminateStar`). Sidebar shows
 * progress stats, an active-constellation selector that pans/zooms the SVG,
 * and the three active abilities (Stargaze, Supernova, Black Hole).
 */
export function EnlightenmentModal() {
  const show = useGameStore((s) => s.showEnlightenment);
  const setShow = useGameStore((s) => s.setShowEnlightenment);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const divinity = useGameStore((s) => s.divinity);
  // L2 state
  const constellationStars = useGameStore((s) => s.constellationStars || {});
  const constellationProgress = useGameStore((s) => s.constellationProgress || {});
  const constellationsStarted = useGameStore((s) => s.constellationsStarted || {});
  const constellationsCompleted = useGameStore((s) => s.constellationsCompleted || {});
  const constellationRevealed = useGameStore((s) => s.constellationRevealed || {});
  const cosmicBridgeLink = useGameStore((s) => s.cosmicBridgeLink || null);
  const stargazeRecommendedActive = useGameStore((s) => s.stargazeRecommendedActive || false);
  const activeAbilityCooldowns = useGameStore((s) => s.activeAbilityCooldowns || {});
  const foresightNodes = useGameStore((s) => s.foresightNodes || {});
  const activeRoute = useGameStore((s) => s.activeForesightRoute);
  // Layer shop upgrades
  const upgrades = useGameStore((s) => s.upgrades || {});

  // Actions
  const illuminateStar = useGameStore((s) => s.illuminateStar);
  const stargazeReveal = useGameStore((s) => s.stargazeReveal);
  const supernovaIlluminate = useGameStore((s) => s.supernovaIlluminate);
  const blackHoleReset = useGameStore((s) => s.blackHoleReset);
  const activateCosmicBridge = useGameStore((s) => s.activateCosmicBridge);
  const setForesightRoute = useGameStore((s) => s.setForesightRoute);

  // Local UI state
  const [focusedConstellationId, setFocusedConstellationId] = useState<string | null>(null);
  const [abilityMode, setAbilityMode] = useState<AbilityMode>(null);
  const [bridgeFirst, setBridgeFirst] = useState<string | null>(null); // first constellation picked for bridge
  const [flashedStars, setFlashedStars] = useState<Set<string>>(new Set());
  const [collapsingStars, setCollapsingStars] = useState<Set<string>>(new Set());
  const [hoveredStar, setHoveredStar] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timers on unmount.
  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
  }, []);

  const isUnlocked = !!unlockedLayers.enlightenment;

  const constellationState: ConstellationState = useMemo(
    () => ({
      constellationStars,
      constellationProgress,
      constellationsStarted,
      constellationsCompleted,
    }),
    [constellationStars, constellationProgress, constellationsStarted, constellationsCompleted]
  );

  const fs = foresightBonus(foresightNodes); // legacy — returns zeros for new saves
  const rb = routeBonus(activeRoute);
  const cb = constellationBonus(constellationState);
  const completedCount = countCompletedConstellations(constellationState);
  const litStarsCount = countLitStars(constellationState);
  const startedCount = Object.values(constellationsStarted).filter(Boolean).length;
  const totalStars = useMemo(
    () => CONSTELLATIONS.reduce((acc, c) => acc + c.stars.length, 0),
    []
  );

  // Foresight discount level (shop upgrade)
  const fdLvl = (upgrades?.foresight_discount as number) || 0;
  const foresightDiscountMult = Math.pow(0.80, fdLvl);

  // Compute the cost for the focused constellation's next star (or first star).
  const focusedNextCost = useMemo(() => {
    const cid = focusedConstellationId;
    if (!cid) return null;
    const cdef = CONSTELLATION_MAP[cid];
    if (!cdef) return null;
    // First unlit star in the focused constellation
    const nextStar = cdef.stars.find((st) => !constellationStars[st.id]);
    if (!nextStar) return { starId: null, cost: 0, isNew: false, constellationId: cid, name: cdef.name };
    const cost = starCost(cid, constellationState, nextStar.id, { foresightDiscountMult });
    const isNew = (constellationProgress[cid] || 0) === 0;
    return { starId: nextStar.id, cost, isNew, constellationId: cid, name: cdef.name };
  }, [focusedConstellationId, constellationStars, constellationState, foresightDiscountMult, constellationProgress]);

  // Compute a "first star of any unstarted constellation" cost preview (for the
  // "new constellation penalty" tooltip).
  const newConstellationPreview = useMemo(() => {
    const cid = CONSTELLATIONS.find((c) => !constellationsStarted[c.id])?.id;
    if (!cid) return null;
    const cdef = CONSTELLATION_MAP[cid];
    if (!cdef) return null;
    const firstStar = cdef.stars[0];
    const cost = starCost(cid, constellationState, firstStar.id, { foresightDiscountMult });
    return { constellationId: cid, name: cdef.name, cost };
  }, [constellationsStarted, constellationState, foresightDiscountMult]);

  // SVG pan/zoom target based on focused constellation.
  const viewBox = useMemo(() => {
    if (!focusedConstellationId) return `0 0 ${MAP_W} ${MAP_H}`;
    const cdef = CONSTELLATION_MAP[focusedConstellationId];
    if (!cdef) return `0 0 ${MAP_W} ${MAP_H}`;
    const xs = cdef.stars.map((s) => s.x);
    const ys = cdef.stars.map((s) => s.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = 6;
    const w = (maxX - minX + pad * 2) * (MAP_W / 100);
    const h = (maxY - minY + pad * 2) * (MAP_H / 100);
    const cx = (minX + maxX) / 2 * (MAP_W / 100);
    const cy = (minY + maxY) / 2 * (MAP_H / 100);
    // Clamp to map bounds.
    const halfW = w / 2;
    const halfH = h / 2;
    const x0 = Math.max(0, Math.min(MAP_W - w, cx - halfW));
    const y0 = Math.max(0, Math.min(MAP_H - h, cy - halfH));
    return `${x0} ${y0} ${w} ${h}`;
  }, [focusedConstellationId]);

  // Click a star: illuminate (normal mode) or apply ability (ability mode).
  const onStarClick = useCallback(
    (constellationId: string, starId: string) => {
      if (!isUnlocked) return;
      if (abilityMode === "supernova") {
        supernovaIlluminate(constellationId, starId);
        // Flash the supernova'd cluster (target + connected stars).
        const cdef = CONSTELLATION_MAP[constellationId];
        if (cdef) {
          const affected = new Set<string>([starId]);
          for (const [a, b] of cdef.connections) {
            if (a === starId) affected.add(b);
            else if (b === starId) affected.add(a);
          }
          setFlashedStars(affected);
          if (flashTimer.current) clearTimeout(flashTimer.current);
          flashTimer.current = setTimeout(() => setFlashedStars(new Set()), 600);
        }
        setAbilityMode(null);
        return;
      }
      if (abilityMode === "blackhole") {
        const cdef = CONSTELLATION_MAP[constellationId];
        if (!cdef) return;
        // Capture the lit stars in this constellation for the collapse animation.
        const collapsing = new Set<string>(
          cdef.stars.filter((st) => constellationStars[st.id]).map((st) => st.id)
        );
        blackHoleReset(constellationId);
        if (collapsing.size > 0) {
          setCollapsingStars(collapsing);
          if (collapseTimer.current) clearTimeout(collapseTimer.current);
          collapseTimer.current = setTimeout(() => setCollapsingStars(new Set()), 600);
        }
        setAbilityMode(null);
        return;
      }
      if (abilityMode === "cosmicbridge_first") {
        // Pick first endpoint.
        setBridgeFirst(constellationId);
        setAbilityMode("cosmicbridge_second");
        return;
      }
      if (abilityMode === "cosmicbridge_second") {
        if (bridgeFirst && bridgeFirst !== constellationId) {
          activateCosmicBridge(bridgeFirst, constellationId);
        }
        setBridgeFirst(null);
        setAbilityMode(null);
        return;
      }
      illuminateStar(constellationId, starId);
    },
    [abilityMode, bridgeFirst, constellationStars, illuminateStar, supernovaIlluminate, blackHoleReset, activateCosmicBridge, isUnlocked]
  );

  // Compute the cheapest affordable unlit next star across ALL constellations
  // (for the Stargaze "recommended next" glow). Returns starId or null.
  const recommendedNextStarId = useMemo(() => {
    if (!stargazeRecommendedActive) return null;
    let best: { id: string; cost: number } | null = null;
    for (const c of CONSTELLATIONS) {
      for (const st of c.stars) {
        if (constellationStars[st.id]) continue;
        const cost = starCost(c.id, constellationState, st.id, { foresightDiscountMult });
        if (cost > divinity) continue; // must be affordable
        if (!best || cost < best.cost) best = { id: st.id, cost };
      }
    }
    return best?.id ?? null;
  }, [stargazeRecommendedActive, constellationStars, constellationState, foresightDiscountMult, divinity]);

  // Cooldown helpers (ceil to seconds for display).
  const stargazeCd = Math.ceil(activeAbilityCooldowns[STARGAZE_CD_KEY] || 0);
  const supernovaCd = Math.ceil(activeAbilityCooldowns[SUPERNOVA_CD_KEY] || 0);
  const blackHoleCd = Math.ceil(activeAbilityCooldowns[BLACK_HOLE_CD_KEY] || 0);
  const cosmicBridgeCd = Math.ceil(activeAbilityCooldowns[COSMIC_BRIDGE_CD_KEY] || 0);

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden glass-strong flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg flex-wrap">
            <Eye className="w-5 h-5" />
            Layer 2 — Enlightenment (Constellation Map)
            <BackgroundLayerBadge layerId="enlightenment" />
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between flex-wrap gap-2">
            <span>
              Illuminate stars within {CONSTELLATIONS.length} IAU constellations. Completing a constellation grants a permanent bonus.
            </span>
            <Badge variant="outline" className="text-violet-300 border-violet-400/40">
              {formatNumber(divinity, 0)} Divinity
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Enlightenment is sealed.</p>
            <p className="text-xs mt-1">Master 3 distinct Layer 1 trials to unlock the constellation map.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 min-h-0">
            {/* ===== STAR MAP ===== */}
            <div className="relative rounded-lg overflow-hidden border border-violet-500/20 bg-gradient-to-b from-[#020817] via-[#0a0a23] to-[#050518]">
              {/* Subtle starfield background */}
              <div
                className="absolute inset-0 opacity-60 pointer-events-none"
                style={{
                  backgroundImage: `
                    radial-gradient(1px 1px at 12% 18%, #fff, transparent),
                    radial-gradient(1px 1px at 28% 42%, #fff, transparent),
                    radial-gradient(1.5px 1.5px at 47% 12%, #fff, transparent),
                    radial-gradient(1px 1px at 63% 56%, #fff, transparent),
                    radial-gradient(1px 1px at 78% 28%, #fff, transparent),
                    radial-gradient(1.5px 1.5px at 88% 70%, #fff, transparent),
                    radial-gradient(1px 1px at 8% 72%, #fff, transparent),
                    radial-gradient(1px 1px at 33% 88%, #fff, transparent),
                    radial-gradient(1px 1px at 70% 85%, #fff, transparent),
                    radial-gradient(1px 1px at 95% 8%, #fff, transparent),
                    radial-gradient(1px 1px at 18% 50%, #fff, transparent),
                    radial-gradient(1px 1px at 53% 75%, #fff, transparent)
                  `,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 100%",
                }}
              />
              <svg
                viewBox={viewBox}
                className="relative w-full h-full"
                style={{ aspectRatio: `${MAP_W} / ${MAP_H}`, transition: "viewBox 0.6s ease" as any }}
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Connection lines */}
                {CONSTELLATIONS.flatMap((c) =>
                  c.connections.map(([aId, bId], i) => {
                    const aStar = c.stars.find((s) => s.id === aId);
                    const bStar = c.stars.find((s) => s.id === bId);
                    if (!aStar || !bStar) return null;
                    const x1 = (aStar.x / 100) * MAP_W;
                    const y1 = (aStar.y / 100) * MAP_H;
                    const x2 = (bStar.x / 100) * MAP_W;
                    const y2 = (bStar.y / 100) * MAP_H;
                    const isCompleted = !!constellationsCompleted[c.id];
                    const isStarted = !!constellationsStarted[c.id];
                    const isRevealed = !!constellationRevealed[c.id];
                    const dim = !isStarted && !isRevealed;
                    const stroke = isCompleted
                      ? CATEGORY_ACCENT[c.category]
                      : isStarted
                        ? `${CATEGORY_ACCENT[c.category]}80`
                        : "#1e293b";
                    return (
                      <line
                        key={`${c.id}-${i}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={stroke}
                        strokeWidth={isCompleted ? 2.2 : 1}
                        strokeLinecap="round"
                        opacity={dim ? 0.35 : 0.9}
                      />
                    );
                  })
                )}
                {/* Stars */}
                {CONSTELLATIONS.map((c) =>
                  c.stars.map((star) => {
                    const cx = (star.x / 100) * MAP_W;
                    const cy = (star.y / 100) * MAP_H;
                    const lit = !!constellationStars[star.id];
                    const isCompleted = !!constellationsCompleted[c.id];
                    const isStarted = !!constellationsStarted[c.id];
                    const isRevealed = !!constellationRevealed[c.id];
                    const accent = CATEGORY_ACCENT[c.category];
                    const isFocused = focusedConstellationId === c.id;
                    const isHovered = hoveredStar === star.id;
                    const isFlashing = flashedStars.has(star.id);
                    const isCollapsing = collapsingStars.has(star.id);
                    const isNewConstellation = (constellationProgress[c.id] || 0) === 0;
                    const cost = starCost(c.id, constellationState, star.id, { foresightDiscountMult });
                    const canAfford = divinity >= cost;
                    // In ability mode, all stars are clickable regardless of cost.
                    const inAbilityMode = abilityMode !== null;
                    const clickable = !lit && (canAfford || inAbilityMode);
                    const r = lit ? 4.5 : 2.2;
                    // Stargaze "recommended next" glow — pulsing amber ring around
                    // the single cheapest affordable unlit star in the sky.
                    const isRecommended = stargazeRecommendedActive && recommendedNextStarId === star.id;
                    // Cosmic Bridge: highlight stars in the linked pair.
                    const bridgeActive = !!cosmicBridgeLink && cosmicBridgeLink.remaining > 0 &&
                      (cosmicBridgeLink.from === c.id || cosmicBridgeLink.to === c.id);
                    const isBridgePick1 = (abilityMode === "cosmicbridge_second") && bridgeFirst === c.id;
                    return (
                      <g
                        key={star.id}
                        transform={`translate(${cx},${cy})`}
                        style={{ cursor: clickable ? "pointer" : "default" }}
                        onClick={() => clickable && onStarClick(c.id, star.id)}
                        onMouseEnter={() => setHoveredStar(star.id)}
                        onMouseLeave={() => setHoveredStar(null)}
                      >
                        {/* Glow halo for lit/hovered */}
                        {lit && (
                          <circle r={r * 3} fill={accent} opacity={0.18} />
                        )}
                        {isHovered && !lit && (
                          <circle r={r * 2.5} fill={accent} opacity={0.12} />
                        )}
                        {/* Stargaze recommended-next glow */}
                        {isRecommended && (
                          <circle r={r * 3.5} fill="none" stroke="#fbbf24" strokeWidth={0.9} opacity={0.85}>
                            <animate attributeName="r" values={`${r * 3.5};${r * 5};${r * 3.5}`} dur="1.6s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.85;0.3;0.85" dur="1.6s" repeatCount="indefinite" />
                          </circle>
                        )}
                        {/* Cosmic Bridge highlight ring around stars of a bridged constellation */}
                        {bridgeActive && !lit && (
                          <circle r={r * 2.2} fill="none" stroke="#a78bfa" strokeWidth={0.7} opacity={0.6} />
                        )}
                        {/* Highlight first-picked constellation in cosmic bridge mode */}
                        {isBridgePick1 && (
                          <circle r={r * 2.8} fill="none" stroke="#a78bfa" strokeWidth={1.1} opacity={0.95} />
                        )}
                        {/* Flash overlay (supernova) */}
                        {isFlashing && (
                          <circle r={r * 5} fill="#fbbf24" opacity={0.55} />
                        )}
                        {/* Collapse overlay (black hole) */}
                        {isCollapsing && (
                          <circle r={r * 1.4} fill="#1f2937" opacity={0.8} stroke="#ef4444" strokeWidth={0.8} />
                        )}
                        {/* The star itself */}
                        <circle
                          r={r}
                          fill={lit ? accent : isStarted ? "#475569" : "#1e293b"}
                          stroke={lit ? "#fff" : isFocused ? accent : "transparent"}
                          strokeWidth={lit || isFocused ? 0.8 : 0}
                          opacity={lit ? 1 : isStarted ? 0.8 : 0.55}
                        />
                        {/* Cost label on hover for unlit affordable stars (normal mode) */}
                        {isHovered && !lit && !inAbilityMode && (
                          <text
                            y={-8}
                            textAnchor="middle"
                            fill={canAfford ? "#a3e635" : "#f87171"}
                            fontSize="9"
                            fontFamily="monospace"
                            pointerEvents="none"
                          >
                            {isNewConstellation && startedCount > 0 ? `${cost}✦` : cost}
                          </text>
                        )}
                        {/* Ability-mode hint */}
                        {isHovered && abilityMode === "supernova" && (
                          <text y={-8} textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="monospace" pointerEvents="none">
                            ✦ nova
                          </text>
                        )}
                        {isHovered && abilityMode === "blackhole" && (
                          <text y={-8} textAnchor="middle" fill="#f87171" fontSize="9" fontFamily="monospace" pointerEvents="none">
                            ✦ collapse
                          </text>
                        )}
                      </g>
                    );
                  })
                )}
                {/* Constellation labels */}
                {CONSTELLATIONS.map((c) => {
                  const xs = c.stars.map((s) => s.x);
                  const ys = c.stars.map((s) => s.y);
                  const maxX = Math.max(...xs);
                  const minY = Math.min(...ys);
                  const lx = (maxX / 100) * MAP_W + 8;
                  const ly = (minY / 100) * MAP_H + 4;
                  const isCompleted = !!constellationsCompleted[c.id];
                  const isStarted = !!constellationsStarted[c.id];
                  const isRevealed = !!constellationRevealed[c.id];
                  const dim = !isStarted && !isRevealed;
                  return (
                    <text
                      key={`label-${c.id}`}
                      x={lx}
                      y={ly}
                      fill={isCompleted ? CATEGORY_ACCENT[c.category] : isStarted ? "#cbd5e1" : "#475569"}
                      fontSize="10"
                      fontFamily="serif"
                      fontStyle="italic"
                      opacity={dim ? 0.35 : 0.95}
                      pointerEvents="none"
                    >
                      {c.i18nName}
                    </text>
                  );
                })}
              </svg>
              {/* Ability-mode banner */}
              {abilityMode !== null && (
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 rounded-md border border-amber-400/60 bg-amber-500/15 px-3 py-1.5 text-amber-200 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {abilityMode === "supernova"
                      ? `Supernova armed — click a star to ignite it + its connected stars (${SUPERNOVA_COST} Div).`
                      : abilityMode === "blackhole"
                        ? `Black Hole armed — click a star to collapse that constellation & refund ${(BLACK_HOLE_REFUND_FRACTION * 100).toFixed(0)}% of its cost (${BLACK_HOLE_COST} Div).`
                        : abilityMode === "cosmicbridge_first"
                          ? `Cosmic Bridge step 1 — click any star in the FIRST constellation to link. (${COSMIC_BRIDGE_COST} Div)`
                          : bridgeFirst
                            ? `Cosmic Bridge step 2 — click a star in a SECOND constellation (different from ${CONSTELLATION_MAP[bridgeFirst]?.name || "?"}).`
                            : "Cosmic Bridge armed — click a star."}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAbilityMode(null);
                      setBridgeFirst(null);
                    }}
                    className="h-6 px-2 text-[0.65rem]"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              {/* Active Cosmic Bridge indicator */}
              {cosmicBridgeLink && cosmicBridgeLink.remaining > 0 && (
                <div className="absolute top-12 left-2 right-2 flex items-center justify-between gap-2 rounded-md border border-violet-400/60 bg-violet-500/15 px-3 py-1.5 text-violet-200 text-xs">
                  <span className="flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5" />
                    Bridge: {CONSTELLATION_MAP[cosmicBridgeLink.from]?.name || "?"} ↔ {CONSTELLATION_MAP[cosmicBridgeLink.to]?.name || "?"} ({Math.ceil(cosmicBridgeLink.remaining)}s)
                  </span>
                </div>
              )}
              {/* Map legend */}
              <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-slate-700/50 bg-slate-950/70 px-2.5 py-1 text-[0.6rem] text-slate-300 backdrop-blur">
                {(["zodiac", "northern", "equatorial", "southern"] as ConstellationCategory[]).map((cat) => (
                  <span key={cat} className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: CATEGORY_ACCENT[cat] }} />
                    {CATEGORY_LABEL[cat]}
                  </span>
                ))}
              </div>
            </div>

            {/* ===== SIDEBAR ===== */}
            <div className="flex flex-col gap-2 overflow-hidden min-h-0">
              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-3">
                  {/* Progress stats */}
                  <div className="stat-card">
                    <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1.5">
                      Constellation progress
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col">
                        <span className="text-[0.6rem] text-muted-foreground">Completed</span>
                        <span className="text-amber-300 font-semibold">
                          {completedCount} / {CONSTELLATIONS_REQUIRED_FOR_LAYER_3}
                          <span className="text-muted-foreground text-[0.6rem] ml-1">→ L3</span>
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.6rem] text-muted-foreground">Stars lit</span>
                        <span className="text-cyan-300 font-semibold">
                          {litStarsCount} / {totalStars}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.6rem] text-muted-foreground">Started</span>
                        <span className="text-violet-300 font-semibold">
                          {startedCount} / {CONSTELLATIONS.length}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.6rem] text-muted-foreground">Divinity</span>
                        <span className="text-violet-300 font-semibold">
                          {formatNumber(divinity, 0)}
                        </span>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-cyan-300 border-cyan-400/40">+{(cb.productionMult * 100).toFixed(1)}% prod</Badge>
                      <Badge variant="outline" className="text-amber-300 border-amber-400/40">+{(cb.capMult * 100).toFixed(1)}% cap</Badge>
                      <Badge variant="outline" className="text-emerald-300 border-emerald-400/40">+{(cb.epMult * 100).toFixed(1)}% EP</Badge>
                      <Badge variant="outline" className="text-violet-300 border-violet-400/40">+{(cb.popGrowthMult * 100).toFixed(1)}% pop</Badge>
                      {cb.costMult < 0 && (
                        <Badge variant="outline" className="text-pink-300 border-pink-400/40">{(cb.costMult * 100).toFixed(1)}% cost</Badge>
                      )}
                      {cb.divinityMult > 0 && (
                        <Badge variant="outline" className="text-yellow-300 border-yellow-400/40">+{(cb.divinityMult * 100).toFixed(0)}% Divinity</Badge>
                      )}
                    </div>
                    <div className="mt-2 text-[0.6rem] text-muted-foreground">
                      Per-star bonus: <span className="text-cyan-300">+0.5% prod</span> × {litStarsCount} lit star{litStarsCount === 1 ? "" : "s"} = <span className="text-cyan-300">+{(litStarsCount * 0.5).toFixed(1)}%</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`mt-2 ${canAdvanceToTranscendence(constellationState) ? "text-emerald-300 border-emerald-400/40" : "text-muted-foreground"}`}
                    >
                      {canAdvanceToTranscendence(constellationState)
                        ? "Transcendence unlocked!"
                        : `${CONSTELLATIONS_REQUIRED_FOR_LAYER_3 - completedCount} more constellation(s) to advance`}
                    </Badge>
                  </div>

                  {/* Active abilities */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={divinity < STARGAZE_COST || stargazeCd > 0}
                            onClick={stargazeReveal}
                            className="h-auto py-2 flex flex-col items-center gap-0.5"
                          >
                            <Star className="w-4 h-4 text-cyan-300" />
                            <span className="text-[0.65rem]">Stargaze</span>
                            <span className="text-[0.55rem] text-muted-foreground">
                              {stargazeCd > 0 ? `${stargazeCd}s` : `${STARGAZE_COST} Div`}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-[0.65rem] max-w-[220px]">
                            Reveal all constellation connection lines permanently AND highlight the cheapest affordable next star across the sky. {STARGAZE_COST} Div, {STARGAZE_COOLDOWN_SEC}s cooldown.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant={abilityMode === "supernova" ? "default" : "outline"}
                            disabled={divinity < SUPERNOVA_COST || supernovaCd > 0}
                            onClick={() => setAbilityMode(abilityMode === "supernova" ? null : "supernova")}
                            className="h-auto py-2 flex flex-col items-center gap-0.5"
                          >
                            <Sun className="w-4 h-4 text-amber-300" />
                            <span className="text-[0.65rem]">Supernova</span>
                            <span className="text-[0.55rem] text-muted-foreground">
                              {supernovaCd > 0 ? `${supernovaCd}s` : `${SUPERNOVA_COST} Div`}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-[0.65rem] max-w-[220px]">
                            Arm Supernova, then click any star to ignite it AND every star directly connected to it — for free. {SUPERNOVA_COST} Div, {SUPERNOVA_COOLDOWN_SEC}s cooldown. Strategic: use on a central star to complete a constellation instantly.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant={abilityMode === "blackhole" ? "default" : "outline"}
                            disabled={blackHoleCd > 0}
                            onClick={() => setAbilityMode(abilityMode === "blackhole" ? null : "blackhole")}
                            className="h-auto py-2 flex flex-col items-center gap-0.5"
                          >
                            <Disc3 className="w-4 h-4 text-rose-300" />
                            <span className="text-[0.65rem]">Black Hole</span>
                            <span className="text-[0.55rem] text-muted-foreground">
                              {blackHoleCd > 0 ? `${blackHoleCd}s` : `${BLACK_HOLE_COST} Div`}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-[0.65rem] max-w-[220px]">
                            Arm Black Hole, then click any star in a constellation to collapse that entire constellation — refunds {(BLACK_HOLE_REFUND_FRACTION * 100).toFixed(0)}% of the cost spent, lets you reallocate away from weak bonuses. {BLACK_HOLE_COST} Div, {BLACK_HOLE_COOLDOWN_SEC}s cooldown.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant={abilityMode === "cosmicbridge_first" || abilityMode === "cosmicbridge_second" ? "default" : "outline"}
                            disabled={divinity < COSMIC_BRIDGE_COST || cosmicBridgeCd > 0 || (!!cosmicBridgeLink && cosmicBridgeLink.remaining > 0)}
                            onClick={() => {
                              if (abilityMode === "cosmicbridge_first" || abilityMode === "cosmicbridge_second") {
                                setAbilityMode(null);
                                setBridgeFirst(null);
                              } else {
                                setAbilityMode("cosmicbridge_first");
                                setBridgeFirst(null);
                              }
                            }}
                            className="h-auto py-2 flex flex-col items-center gap-0.5"
                          >
                            <LinkIcon className="w-4 h-4 text-violet-300" />
                            <span className="text-[0.65rem]">Cosmic Bridge</span>
                            <span className="text-[0.55rem] text-muted-foreground">
                              {cosmicBridgeCd > 0
                                ? `${cosmicBridgeCd}s`
                                : cosmicBridgeLink && cosmicBridgeLink.remaining > 0
                                  ? "active"
                                  : `${COSMIC_BRIDGE_COST} Div`}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-[0.65rem] max-w-[220px]">
                            Link two constellations for {COSMIC_BRIDGE_DURATION_SEC}s. Lighting either side ALSO lights the cheapest unlit star in the other for free. Click to enter pick mode, then click a star in each of two constellations. {COSMIC_BRIDGE_COST} Div, {COSMIC_BRIDGE_COOLDOWN_SEC}s cooldown.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Cost preview for focused constellation */}
                  {focusedNextCost && (
                    <div className="stat-card">
                      <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                        <Crosshair className="w-3 h-3" /> Focused: {focusedNextCost.name}
                      </div>
                      {focusedNextCost.starId ? (
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Next star:</span>
                            <Badge variant="outline" className={divinity >= focusedNextCost.cost ? "text-cyan-300 border-cyan-400/40" : "text-rose-300 border-rose-400/40"}>
                              {focusedNextCost.cost} Div
                            </Badge>
                          </div>
                          {focusedNextCost.isNew && startedCount > 0 && (
                            <div className="text-[0.6rem] text-amber-300/80 flex items-center gap-1">
                              <Zap className="w-3 h-3" /> new-constellation penalty (×{Math.pow(NEW_CONSTELLATION_PENALTY, startedCount).toFixed(1)} = {NEW_CONSTELLATION_PENALTY}^{startedCount})
                            </div>
                          )}
                          <Button
                            size="sm"
                            className="w-full mt-1"
                            disabled={divinity < focusedNextCost.cost}
                            onClick={() => illuminateStar(focusedNextCost.constellationId, focusedNextCost.starId!)}
                          >
                            Illuminate star ({focusedNextCost.cost} Div)
                          </Button>
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Constellation complete.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cost preview: starting a NEW constellation */}
                  {newConstellationPreview && (
                    <div className="stat-card">
                      <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                        <Orbit className="w-3 h-3" /> Start a new constellation
                      </div>
                      <div className="text-xs flex items-center justify-between">
                        <span className="text-muted-foreground">{newConstellationPreview.name}</span>
                        <Badge variant="outline" className={divinity >= newConstellationPreview.cost ? "text-amber-300 border-amber-400/40" : "text-rose-300 border-rose-400/40"}>
                          {newConstellationPreview.cost} Div
                        </Badge>
                      </div>
                      <div className="text-[0.6rem] text-amber-300/70 mt-1">
                        ×{COST_GROWTH_PER_STARTED}^{startedCount} = ×{Math.pow(COST_GROWTH_PER_STARTED, startedCount).toFixed(1)} new-constellation multiplier
                      </div>
                    </div>
                  )}

                  {/* Cost model explainer */}
                  <details className="stat-card">
                    <summary className="text-[0.7rem] uppercase tracking-wide text-muted-foreground cursor-pointer">
                      Cost formula (expand)
                    </summary>
                    <div className="text-[0.6rem] text-muted-foreground mt-1.5 space-y-1 leading-snug">
                      <div>cost = <span className="text-cyan-300 font-mono">{CONSTELLATION_BASE_COST}</span> × {WITHIN_CONSTELLATION_GROWTH}^(stars lit in this constellation) × {COST_GROWTH_PER_STARTED}^(started constellations) {`(new: ×${NEW_CONSTELLATION_PENALTY})`}</div>
                      <div className="text-amber-300/70">Tip: finish a constellation before starting another — the penalty compounds.</div>
                    </div>
                  </details>

                  {/* Constellation list */}
                  <div className="stat-card">
                    <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1.5">
                      Constellations ({CONSTELLATIONS.length})
                    </div>
                    <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
                      {CONSTELLATIONS.map((c) => {
                        const prog = constellationProgress[c.id] || 0;
                        const total = c.stars.length;
                        const started = !!constellationsStarted[c.id];
                        const completed = !!constellationsCompleted[c.id];
                        const isFocused = focusedConstellationId === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => setFocusedConstellationId(isFocused ? null : c.id)}
                            className={`w-full text-left px-2 py-1 rounded text-[0.65rem] flex items-center justify-between gap-1 transition-colors
                              ${isFocused ? "bg-violet-500/20 border border-violet-400/60" : "hover:bg-muted/30 border border-transparent"}
                            `}
                          >
                            <span className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: completed ? CATEGORY_ACCENT[c.category] : started ? "#64748b" : "#334155" }}
                              />
                              <span className={`truncate ${completed ? "text-amber-300" : started ? "text-slate-200" : "text-muted-foreground"}`}>
                                {c.i18nName}
                              </span>
                            </span>
                            <span className="text-[0.55rem] text-muted-foreground font-mono shrink-0">
                              {prog}/{total}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Route picker (preserved from classic foresight) */}
                  <details className="stat-card">
                    <summary className="text-[0.7rem] uppercase tracking-wide text-muted-foreground cursor-pointer">
                      Route (cosmetic bonus layer)
                    </summary>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {FORESIGHT_ROUTES.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setForesightRoute(activeRoute === r.id ? null : r.id)}
                          className={`stat-card text-left p-1.5 ${activeRoute === r.id ? "border-amber-400/60 bg-amber-500/10" : ""}`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{r.icon}</span>
                            <span className="text-[0.65rem] font-medium">{r.name}</span>
                          </div>
                          <div className="text-[0.55rem] text-muted-foreground mt-0.5 leading-snug">{r.blurb}</div>
                        </button>
                      ))}
                    </div>
                    <div className="text-[0.6rem] text-amber-300/80 mt-1">
                      Route bonus: +{(rb.productionMult * 100).toFixed(0)}% prod, +{(rb.capMult * 100).toFixed(0)}% cap, +{(rb.epMult * 100).toFixed(0)}% EP, +{(rb.popGrowthMult * 100).toFixed(0)}% pop
                    </div>
                  </details>
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1">
          Click any star to illuminate it. Costs scale by <span className="text-cyan-300">{WITHIN_CONSTELLATION_GROWTH}×</span> per star already lit in the same constellation, plus <span className="text-amber-300">{COST_GROWTH_PER_STARTED}^{startedCount > 0 ? 'N' : '0'}={Math.pow(COST_GROWTH_PER_STARTED, startedCount).toFixed(1)}×</span> per other started constellation (the penalty sticks for every star in a started constellation). Complete <span className="text-emerald-300">{CONSTELLATIONS_REQUIRED_FOR_LAYER_3}</span> constellations to advance to Layer 3.
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShow(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
