"use client";

import { useState, useMemo, useRef, useCallback } from "react";
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
  type ConstellationState,
  type ConstellationCategory,
  type ConstellationDef,
} from "@/game/data/constellations";
import {
  FORESIGHT_ROUTES,
  routeBonus,
} from "@/game/data/foresight";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Lock,
  Eye,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Maximize2,
  Minimize2,
  X,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { formatNumber } from "../shared/format";
import { BackgroundLayerBadge } from "../shared/BackgroundLayerBadge";

// ===========================================================================
// FIX-PRESTIGE-DIVINE-CONSTELLATIONS — Constellation UI redesign.
// ===========================================================================
//
// The L2 constellation map is now a wide, horizontally-scrollable sky:
//   - 3000px wide × 500px tall panorama of all 88 IAU constellations
//   - Stars are positioned by mapping the existing normalized (0-100) coords
//     to (0-SKY_W, 0-SKY_H) pixels
//   - Click and drag, or use ◀ ▶ arrows, to pan the sky
//   - The sky wraps infinitely (render 3 copies: left, center, right) — when
//     you scroll past the end, it loops back to the beginning seamlessly
//   - Click a star → opens a popup showing star name, constellation name,
//     reward for completing the constellation, cost in Divinity, and an
//     "Illuminate" button. Replaces the old direct-click illumination.
//
// The store action `illuminateStar(constellationId, starId)` is preserved.
// ===========================================================================

// ===========================================================================
// CONSTELLATION-REDESIGN-NOIRLAB — star map redesign.
// ===========================================================================
//
// The L2 constellation map has been redesigned for clarity and discoverability:
//   - Stars are now 18px grey circles with a subtle glow (not tiny 14px dots)
//   - The sky is wider (5000px) and the viewport is taller (clamp(500px,
//     64vh, 900px)) so stars at y=4 and y=96 are both reachable
//   - When a constellation is COMPLETED, the NOIRLab outline SVG is rendered
//     as a subtle overlay behind the stars (zIndex 1 < star zIndex 10+)
//   - A full-screen Expand mode opens an even wider (8000px) sky with the
//     same panning/click semantics
//   - Constellation connection lines are now thicker (0.30 / 0.15) and
//     more opaque (1.0 / 0.45) so the pattern is clearly visible
// ===========================================================================

// Sky dimensions — the wide panorama.
// CONSTELLATION-REDESIGN-NOIRLAB: SKY_W widened from 3000 → 5000 so the 88
// constellations have more breathing room (stars are no longer clustered).
const SKY_W = 5000;
const SKY_H = 500;

// Full-screen overlay uses an even wider sky so panning feels roomier.
const EXPANDED_SKY_W = 8000;
// EXPANDED_SKY_H is purely documentary — the expanded viewport renders
// height: 100% of its flex-1 parent. The constant documents the conceptual
// height that vertical percentage coordinates are calibrated against.
const EXPANDED_SKY_H = 600;

// Per-instance offsets for the infinite-wrap 3-copy trick.
// We render the sky at three x-offsets: -W (left), 0 (center), +W (right).
// The wrapper translates them all by `scrollX`. As the user scrolls, when
// |scrollX| exceeds W, we wrap by adding/subtracting W so the visible area
// always shows at least one fully-populated instance. The wrap is invisible
// because all 3 instances render identical content.
const SKY_OFFSETS: number[] = [-SKY_W, 0, SKY_W];
const EXPANDED_SKY_OFFSETS: number[] = [-EXPANDED_SKY_W, 0, EXPANDED_SKY_W];

// FIX-UI-TABS / react-hooks/set-state-in-effect — module-level helper for the
// infinite-wrap. Moved out of useEffect (which linted as a cascading-render
// trigger) and applied at each setScrollX() call site.
// CONSTELLATION-REDESIGN-NOIRLAB: parameterized over `w` so it works for both
// the standard (SKY_W) and expanded (EXPANDED_SKY_W) skies.
function wrapScrollX(x: number, w: number = SKY_W): number {
  if (x < -w) return x + w;
  if (x > w) return x - w;
  return x;
}

// Selection state for the per-star purchase popup.
interface StarSelection {
  constellationId: string;
  starId: string;
}

// Pre-flatten the constellation data into per-star and per-connection arrays
// so we don't recompute them on every render. Star coordinates are kept as
// the original normalized (0-100) values; the render function multiplies by
// SKY_W / SKY_H to get pixel positions.
interface FlatStar {
  cId: string;
  cName: string;
  cI18nName: string;
  starId: string;
  x: number;
  y: number;
  category: ConstellationCategory;
}
const FLAT_STARS: FlatStar[] = CONSTELLATIONS.flatMap((c) =>
  c.stars.map((s) => ({
    cId: c.id,
    cName: c.name,
    cI18nName: c.i18nName,
    starId: s.id,
    x: s.x,
    y: s.y,
    category: c.category,
  }))
);

interface FlatConn {
  cId: string;
  aId: string;
  bId: string;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  category: ConstellationCategory;
}
const FLAT_CONNS: FlatConn[] = CONSTELLATIONS.flatMap((c) => {
  const starMap = new Map(c.stars.map((s) => [s.id, s]));
  const out: FlatConn[] = [];
  for (const [aId, bId] of c.connections) {
    const a = starMap.get(aId);
    const b = starMap.get(bId);
    if (!a || !b) continue;
    out.push({
      cId: c.id,
      aId,
      bId,
      ax: a.x,
      ay: a.y,
      bx: b.x,
      by: b.y,
      category: c.category,
    });
  }
  return out;
});

// Per-constellation label anchor (top-right of the constellation's bounding
// box). Precomputed so we don't run Math.min/max on every render.
interface LabelAnchor { cId: string; left: number; top: number; }
const LABEL_ANCHORS: LabelAnchor[] = CONSTELLATIONS.map((c) => {
  const xs = c.stars.map((s) => s.x);
  const ys = c.stars.map((s) => s.y);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  return { cId: c.id, left: maxX, top: minY };
});

// Greek-letter → readable glyph, for star designations in the popup.
const GREEK: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", eps: "ε",
  zeta: "ζ", eta: "η", theta: "θ", iota: "ι", kappa: "κ", lambda: "λ",
  mu: "μ", nu: "ν", xi: "ξ", omicron: "ο", pi: "π", rho: "ρ", sigma: "σ",
  tau: "τ", upsilon: "υ", phi: "φ", chi: "χ", psi: "ψ", omega: "ω",
};

// Convert a star id like "aries_alpha" or "taurus_eps" or "orion_pi3" into a
// readable designation like "α Arietis". Falls back to the raw id if parsing
// fails (no constellation ever uses an unknown suffix pattern, but be safe).
function starDesignation(starId: string, constellationName: string): string {
  const parts = starId.split("_");
  if (parts.length < 2) return starId;
  const suffix = parts.slice(1).join("_");
  const m = suffix.match(/^([a-z]+)(\d*)$/);
  if (m) {
    const greek = GREEK[m[1]];
    if (greek) return `${greek}${m[2]} ${constellationName}`;
  }
  return `${suffix} ${constellationName}`;
}

// Format the constellation's completion bonus as a list of pill badges.
function bonusSummary(bonus: ConstellationDef["bonus"]): { label: string; value: string; cls: string }[] {
  const out: { label: string; value: string; cls: string }[] = [];
  // EP-MERGER: fold epMult into productionMult display (EP is gone, merged with Divinity)
  // POP-MERGER: fold popGrowthMult into productionMult display (pop is irrelevant at L2+)
  const effectiveProduction = (bonus.productionMult || 0) + (bonus.popGrowthMult || 0);
  const effectiveDivinity = (bonus.divinityMult || 0) + (bonus.epMult || 0);
  if (effectiveProduction) out.push({ label: "Production", value: `+${(effectiveProduction * 100).toFixed(1)}%`, cls: "text-cyan-300 border-cyan-400/40" });
  if (bonus.capMult) out.push({ label: "Capacity", value: `+${(bonus.capMult * 100).toFixed(1)}%`, cls: "text-amber-300 border-amber-400/40" });
  if (bonus.costMult) out.push({ label: "Cost", value: `${(bonus.costMult * 100).toFixed(1)}%`, cls: "text-pink-300 border-pink-400/40" });
  if (effectiveDivinity) out.push({ label: "Divinity", value: `+${(effectiveDivinity * 100).toFixed(0)}%`, cls: "text-yellow-300 border-yellow-400/40" });
  return out;
}

export function EnlightenmentContent() {
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const divinity = useGameStore((s) => s.divinity);
  // DEBUG-FREE-BUY — needed for the canAfford bypass in the star popup
  const debugFreeBuy = useGameStore((s) => s.debugFreeBuy);
  // L2 state
  const constellationStars = useGameStore((s) => s.constellationStars || {});
  const constellationProgress = useGameStore((s) => s.constellationProgress || {});
  const constellationsStarted = useGameStore((s) => s.constellationsStarted || {});
  const constellationsCompleted = useGameStore((s) => s.constellationsCompleted || {});
  const constellationRevealed = useGameStore((s) => s.constellationRevealed || {});
  const activeRoute = useGameStore((s) => s.activeForesightRoute);
  // Layer shop upgrades
  const upgrades = useGameStore((s) => s.upgrades || {});

  // Actions
  const illuminateStar = useGameStore((s) => s.illuminateStar);
  const setForesightRoute = useGameStore((s) => s.setForesightRoute);
  // L3-REDESIGN — constellation bulk purchase actions.
  const purchaseNextStar = useGameStore((s) => s.purchaseNextStar);
  const purchaseMaxStars = useGameStore((s) => s.purchaseMaxStars);

  const isUnlocked = !!unlockedLayers.enlightenment;

  // ===== UI state =====
  // `selectedStar` drives the per-star purchase popup. `selectedConstellation`
  // drives the constellation-bulk-purchase popup (L3-REDESIGN). `scrollX` is the
  // translateX of the wide-sky wrapper (in pixels). `isDragging` is a ref
  // (not state) so we don't trigger re-renders on every mousemove.
  // `expanded` opens the full-screen star-map overlay; `expandedScrollX` is
  // a separate scroll position so opening/closing Expand doesn't jump the
  // standard view.
  const [selectedStar, setSelectedStar] = useState<StarSelection | null>(null);
  // L3-REDESIGN — constellation-bulk-purchase popup state. When non-null,
  // opens a popup showing the constellation's progress + two buttons:
  // "Purchase Next Star" and "Purchase Max Stars".
  const [selectedConstellation, setSelectedConstellation] = useState<string | null>(null);
  const [scrollX, setScrollX] = useState(0);
  const [expandedScrollX, setExpandedScrollX] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  // Total drag distance — if very small, treat as a click (don't suppress the
  // star button's onClick). Otherwise we'd swallow click events after every
  // drag.
  const dragDistance = useRef(0);

  const constellationState: ConstellationState = useMemo(
    () => ({
      constellationStars,
      constellationProgress,
      constellationsStarted,
      constellationsCompleted,
    }),
    [constellationStars, constellationProgress, constellationsStarted, constellationsCompleted]
  );

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

  // ===== Drag-to-scroll handlers =====
  // Pointer events (works for mouse + touch). We mark `isDragging` via a ref
  // and only flip state for cursor styling — the actual scroll happens by
  // reading the ref inside the move handler.
  // CONSTELLATION-REDESIGN-NOIRLAB: each handler takes an `isExpanded` boolean
  // so the same handlers drive both the standard sky (uses scrollX/SKY_W) and
  // the full-screen overlay (uses expandedScrollX/EXPANDED_SKY_W).
  const onPointerDown = useCallback((e: React.PointerEvent, isExpanded = false) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartScroll.current = isExpanded ? expandedScrollX : scrollX;
    dragDistance.current = 0;
    setDragging(true);
    // Capture pointer so move events keep firing even if the cursor leaves
    // the viewport bounds mid-drag.
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }, [scrollX, expandedScrollX]);

  const onPointerMove = useCallback((e: React.PointerEvent, isExpanded = false) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    dragDistance.current = Math.abs(dx);
    if (isExpanded) {
      setExpandedScrollX(wrapScrollX(dragStartScroll.current + dx, EXPANDED_SKY_W));
    } else {
      setScrollX(wrapScrollX(dragStartScroll.current + dx, SKY_W));
    }
  }, []);

  const endDrag = useCallback(() => {
    isDragging.current = false;
    setDragging(false);
  }, []);

  // Arrow-button scroll — jumps by ~6% of the sky width per click (was 10%
  // of the old 3000px sky = 300px). With SKY_W=5000 we step 300px in standard
  // mode and 500px in expanded mode for proportional feel.
  const handleScrollButton = useCallback((dir: "left" | "right", isExpanded = false) => {
    const step = isExpanded ? 500 : 300;
    const w = isExpanded ? EXPANDED_SKY_W : SKY_W;
    const delta = dir === "left" ? -step : step;
    if (isExpanded) {
      setExpandedScrollX((x) => wrapScrollX(x + delta, w));
    } else {
      setScrollX((x) => wrapScrollX(x + delta, w));
    }
  }, []);

  // ===== Selected-star info =====
  // Memoized so we don't recompute cost/etc. on every render.
  const selectedInfo = useMemo(() => {
    if (!selectedStar) return null;
    const cdef = CONSTELLATION_MAP[selectedStar.constellationId];
    if (!cdef) return null;
    const star = cdef.stars.find((s) => s.id === selectedStar.starId);
    if (!star) return null;
    const lit = !!constellationStars[selectedStar.starId];
    const cost = starCost(selectedStar.constellationId, constellationState, selectedStar.starId, { foresightDiscountMult });
    // DEBUG-FREE-BUY — bypass affordability check when free-buy is on
    const canAfford = debugFreeBuy || divinity >= cost;
    const started = !!constellationsStarted[selectedStar.constellationId];
    const completed = !!constellationsCompleted[selectedStar.constellationId];
    const progress = constellationProgress[selectedStar.constellationId] || 0;
    const total = cdef.stars.length;
    return {
      cdef,
      star,
      lit,
      cost,
      canAfford,
      started,
      completed,
      progress,
      total,
      designation: starDesignation(star.id, cdef.i18nName),
      bonuses: bonusSummary(cdef.bonus),
    };
  }, [selectedStar, constellationStars, constellationState, foresightDiscountMult, constellationsStarted, constellationsCompleted, constellationProgress, divinity, debugFreeBuy]);

  // Handle the "Illuminate" button — fire the store action, then close the
  // popup so the player can see the now-lit star on the sky.
  const handleIlluminate = useCallback(() => {
    if (!selectedStar || !selectedInfo) return;
    if (selectedInfo.lit || !selectedInfo.canAfford) return;
    illuminateStar(selectedStar.constellationId, selectedStar.starId);
    setSelectedStar(null);
  }, [selectedStar, selectedInfo, illuminateStar]);

  // Click on a constellation in the sidebar list → pan the sky to that
  // constellation's first star. We compute a scrollX that puts the star ~150px
  // from the left edge of the viewport. (Viewport width is unknown at this
  // level — 150px is a safe left margin for any modal width ≥ 400px.)
  // The target is wrapped through `wrapScrollX` so the sky stays within the
  // 3-instance bounds — keeps the infinite-scroll illusion intact.
  // CONSTELLATION-REDESIGN-NOIRLAB: takes an `isExpanded` flag so panning from
  // the sidebar works whether the user is in standard or expanded mode.
  const panToConstellation = useCallback((cId: string, isExpanded = false) => {
    const cdef = CONSTELLATION_MAP[cId];
    if (!cdef) return;
    const first = cdef.stars[0];
    if (!first) return;
    const w = isExpanded ? EXPANDED_SKY_W : SKY_W;
    const targetX = -(first.x / 100) * w + 150;
    if (isExpanded) {
      setExpandedScrollX(wrapScrollX(targetX, w));
    } else {
      setScrollX(wrapScrollX(targetX, w));
    }
  }, []);

  // ===== Render a single instance of the wide sky at the given x offset =====
  // Called 3 times by the wrapper to produce the infinite-scroll illusion.
  //
  // CONSTELLATION-REDESIGN-NOIRLAB: parameterized over `skyW` so the same
  // function drives both the standard sky (SKY_W=5000) and the full-screen
  // overlay (EXPANDED_SKY_W=8000).
  //
  // STAR-MAP-FIX: previously the inner sky div had a fixed `height: SKY_H`
  // (500px) while the viewport could be variable height. When the viewport
  // was taller, the bottom was empty; when shorter, stars at high y-values
  // were clipped and unclickable.
  //
  // FIX: the inner sky div uses `height: 100%` so it matches the viewport's
  // rendered height. Star + label positions use PERCENTAGE positioning
  // (top: `${y}%`) so they always scale to the parent's height. The SVG
  // uses viewBox="0 0 100 100" + preserveAspectRatio="none" to stretch.
  function renderSkyInstance(offset: number, skyW: number) {
    return (
      <div
        key={`${offset}-${skyW}`}
        className="absolute top-0"
        style={{
          left: `${offset}px`,
          width: `${skyW}px`,
          height: "100%",
        }}
      >
        {/* Subtle starfield background (per-instance so the gradient fills
            each copy independently — avoids edge seams between instances). */}
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
        {/* CONSTELLATION-REDESIGN-NOIRLAB — NOIRLab outline overlay.
            For each constellation that is COMPLETED (all stars lit), render
            the NOIRLab outline SVG as a subtle (opacity 0.25) overlay
            positioned over the constellation's bounding box. The overlay is
            at zIndex 1 so it sits BEHIND the stars (which are zIndex 10+) but
            ABOVE the SVG connection lines (auto z-index = 0). object-fit:
            contain stretches the 360×360 viewBox SVG into the constellation's
            bounding box while preserving aspect ratio. */}
        {LABEL_ANCHORS.filter((la) => constellationsCompleted[la.cId]).map((la) => {
          const cdef = CONSTELLATION_MAP[la.cId];
          if (!cdef) return null;
          // Compute the constellation's bounding box from its star coords.
          const xs = cdef.stars.map((s) => s.x);
          const ys = cdef.stars.map((s) => s.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const width = maxX - minX;
          const height = maxY - minY;
          // Padding around the bounding box so the outline extends a bit
          // beyond the star cluster (NOIRLab outlines bleed outside the star
          // positions, not the other way around).
          const padX = width * 0.3;
          const padY = height * 0.3;
          return (
            <img
              key={`${offset}-outline-${la.cId}`}
              src={`/constellations/${la.cId}-outline.svg`}
              className="absolute pointer-events-none"
              style={{
                // Horizontal positioning in PIXELS (multiplied by skyW/100
                // because star coords are 0-100 normalized on the X axis).
                left: `${(minX - padX) * (skyW / 100)}px`,
                width: `${(width + padX * 2) * (skyW / 100)}px`,
                // Vertical positioning in PERCENTAGE so the overlay scales
                // with the viewport's rendered height (same scheme as the
                // star buttons).
                top: `${minY - padY}%`,
                height: `${height + padY * 2}%`,
                opacity: 0.25,
                objectFit: "contain",
                zIndex: 1,
              }}
              alt=""
              aria-hidden
            />
          );
        })}
        {/* Constellation connection lines — SVG fills the parent and uses
            a normalized 0-100 viewBox so lines scale to any height.
            CONSTELLATION-REDESIGN-NOIRLAB: thicker stroke (0.30 completed /
            0.15 dim) and more opaque (1.0 / 0.45) so the constellation
            pattern is clearly visible. */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {FLAT_CONNS.map((conn, i) => {
            const isCompleted = !!constellationsCompleted[conn.cId];
            const isStarted = !!constellationsStarted[conn.cId];
            const isRevealed = !!constellationRevealed[conn.cId];
            const dim = !isStarted && !isRevealed;
            const stroke = isCompleted
              ? CATEGORY_ACCENT[conn.category]
              : isStarted
                ? `${CATEGORY_ACCENT[conn.category]}80`
                : "#1e293b";
            return (
              <line
                key={`${offset}-${conn.cId}-${conn.aId}-${conn.bId}-${i}`}
                x1={conn.ax}
                y1={conn.ay}
                x2={conn.bx}
                y2={conn.by}
                stroke={stroke}
                strokeWidth={isCompleted ? 0.3 : 0.15}
                strokeLinecap="round"
                opacity={dim ? 0.45 : 1.0}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {/* Stars as clickable buttons positioned using PERCENTAGE
            coordinates so they always scale with the parent's height.
            CONSTELLATION-REDESIGN-NOIRLAB: stars are now 18px grey circles
            with a subtle glow (was 14px tiny dots). The unlit-but-started
            variant uses a lighter grey (#64748b) so the player can tell at a
            glance which constellations they've begun. */}
        {FLAT_STARS.map((fs) => {
          const lit = !!constellationStars[fs.starId];
          const started = !!constellationsStarted[fs.cId];
          const accent = CATEGORY_ACCENT[fs.category];
          const isSelected = selectedStar?.starId === fs.starId;
          return (
            <button
              key={`${offset}-${fs.starId}`}
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                if (dragDistance.current > 5) return;
                e.stopPropagation();
                setSelectedStar({ constellationId: fs.cId, starId: fs.starId });
              }}
              className="absolute rounded-full transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-white/60"
              style={{
                left: `${fs.x}%`,
                top: `${fs.y}%`,
                transform: "translate(-50%, -50%)",
                width: "18px",
                height: "18px",
                background: lit ? accent : started ? "#64748b" : "#475569",
                boxShadow: lit
                  ? `0 0 10px 3px ${accent}66, 0 0 4px 1px ${accent}`
                  : "0 0 4px 1px #94a3b855",
                border: isSelected
                  ? "2px solid #fff"
                  : lit
                    ? `1.5px solid ${accent}`
                    : "1.5px solid #64748b",
                cursor: "pointer",
                zIndex: isSelected ? 20 : 10,
              }}
              aria-label={`${starDesignation(fs.starId, fs.cI18nName)} in ${fs.cI18nName} constellation${lit ? " (lit)" : " (unlit)"}`}
            />
          );
        })}
        {/* Constellation name labels — percentage positioning.
            L3-REDESIGN — labels are now CLICKABLE (pointer-events-auto +
            cursor-pointer + hover:underline) and open the constellation
            bulk-purchase popup when clicked. Previously they were
            pointer-events-none (display only). */}
        {LABEL_ANCHORS.map((la) => {
          const cdef = CONSTELLATION_MAP[la.cId];
          if (!cdef) return null;
          const isCompleted = !!constellationsCompleted[la.cId];
          const isStarted = !!constellationsStarted[la.cId];
          const isRevealed = !!constellationRevealed[la.cId];
          const dim = !isStarted && !isRevealed;
          return (
            <span
              key={`${offset}-label-${la.cId}`}
              className="absolute text-[10px] italic font-serif select-none whitespace-nowrap pointer-events-auto cursor-pointer hover:underline"
              style={{
                left: `${la.left}%`,
                top: `${la.top}%`,
                color: isCompleted
                  ? CATEGORY_ACCENT[cdef.category]
                  : isStarted
                    ? "#cbd5e1"
                    : "#475569",
                opacity: dim ? 0.45 : 0.95,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                // Suppress click if this was the end of a drag.
                if (dragDistance.current > 5) return;
                e.stopPropagation();
                setSelectedConstellation(la.cId);
              }}
              role="button"
              tabIndex={0}
              title={`Open ${cdef.i18nName} constellation details`}
              aria-label={`Open ${cdef.i18nName} constellation details`}
            >
              {cdef.i18nName}
            </span>
          );
        })}
      </div>
    );
  }

  // ===== Render the per-star purchase popup =====
  // CONSTELLATION-REDESIGN-NOIRLAB: extracted to a function so the same popup
  // can be rendered in BOTH the standard view AND the full-screen expanded
  // overlay. Previously the popup was inline JSX in the standard view only —
  // which meant clicking a star while in expanded mode buried the popup
  // behind the expanded overlay (z-[100] > popup z-[80]). Now the popup is
  // rendered conditionally in whichever view is active, so it always appears
  // in the right stacking context.
  function renderStarPopup() {
    if (!selectedInfo) return null;
    return (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        onPointerDown={(e) => {
          // Click on the backdrop closes the popup.
          if (e.target === e.currentTarget) setSelectedStar(null);
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative glass-strong rounded-lg border border-violet-500/40 shadow-2xl max-w-md w-full p-4">
          {/* Popup header */}
          <div className="flex items-start gap-2 mb-3">
            <span
              className="inline-block w-3 h-3 rounded-full mt-1.5 shrink-0"
              style={{ background: CATEGORY_ACCENT[selectedInfo.cdef.category] }}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold leading-tight">
                {selectedInfo.designation}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                in <span className="text-foreground/90 font-medium">{selectedInfo.cdef.i18nName}</span> ·{" "}
                <span className="text-muted-foreground">{CATEGORY_LABEL[selectedInfo.cdef.category]}</span>
              </div>
            </div>
            {selectedInfo.lit && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shrink-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Lit
              </Badge>
            )}
          </div>

          {/* Reward for completing the constellation */}
          <div className="stat-card mb-2">
            <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1.5">
              Reward for completing {selectedInfo.cdef.i18nName}
            </div>
            {selectedInfo.bonuses.length === 0 ? (
              <div className="text-xs text-muted-foreground">No bonus (cosmetic).</div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedInfo.bonuses.map((b) => (
                  <Badge key={b.label} variant="outline" className={b.cls}>
                    {b.label} {b.value}
                  </Badge>
                ))}
              </div>
            )}
            <div className="text-[0.6rem] text-muted-foreground mt-1.5">
              Plus per-star bonus: <span className="text-cyan-300">+0.5% production</span> for every lit star.
            </div>
          </div>

          {/* Progress in this constellation */}
          <div className="stat-card mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">
                Progress in {selectedInfo.cdef.i18nName}
              </span>
              <span className="font-mono text-amber-300">
                {selectedInfo.progress} / {selectedInfo.total}
              </span>
            </div>
            <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400/70 transition-all"
                style={{ width: `${(selectedInfo.progress / selectedInfo.total) * 100}%` }}
              />
            </div>
            {selectedInfo.completed ? (
              <div className="text-[0.65rem] text-emerald-300 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Constellation complete — bonus active.
              </div>
            ) : (
              <div className="text-[0.65rem] text-muted-foreground mt-1">
                {selectedInfo.total - selectedInfo.progress} more star(s) to complete this constellation.
              </div>
            )}
          </div>

          {/* Cost */}
          <div className="stat-card mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-300" />
                Cost to illuminate
              </span>
              <Badge
                variant="outline"
                className={
                  selectedInfo.lit
                    ? "text-emerald-300 border-emerald-400/40"
                    : selectedInfo.canAfford
                      ? "text-emerald-300 border-emerald-400/40"
                      : "text-rose-300 border-rose-400/40"
                }
              >
                {formatNumber(selectedInfo.cost, 0)} Divinity
              </Badge>
            </div>
            {selectedInfo.lit ? (
              <div className="text-[0.65rem] text-emerald-300 mt-1">
                This star is already lit.
              </div>
            ) : !selectedInfo.canAfford ? (
              <div className="text-[0.65rem] text-rose-300/80 mt-1">
                Not enough Divinity. You have {formatNumber(divinity, 0)} / {formatNumber(selectedInfo.cost, 0)}.
              </div>
            ) : (
              <div className="text-[0.65rem] text-muted-foreground mt-1">
                You have {formatNumber(divinity, 0)} Divinity.
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSelectedStar(null)}
            >
              Close
            </Button>
            <Button
              className="flex-1"
              disabled={selectedInfo.lit || !selectedInfo.canAfford}
              onClick={handleIlluminate}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Illuminate
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ===== Render the constellation bulk-purchase popup =====
  // L3-REDESIGN — when the player clicks a constellation NAME (not a star),
  // this popup opens showing the constellation's progress + two buttons:
  //   • "Purchase Next Star" — illuminates the next unlit star (cheapest
  //     unlit star in the constellation).
  //   • "Purchase Max Stars" — illuminates ALL remaining unlit stars at once
  //     (respecting affordability — stops when can't afford the next one,
  //     unless debugFreeBuy is on).
  function renderConstellationPopup() {
    if (!selectedConstellation) return null;
    const cdef = CONSTELLATION_MAP[selectedConstellation];
    if (!cdef) return null;
    const progress = constellationProgress[selectedConstellation] || 0;
    const total = cdef.stars.length;
    const started = !!constellationsStarted[selectedConstellation];
    const completed = !!constellationsCompleted[selectedConstellation];
    // Find the next unlit star + compute the cost for the "Purchase Next Star" button.
    const cs: ConstellationState = {
      constellationStars,
      constellationProgress,
      constellationsStarted,
      constellationsCompleted,
    };
    const fdLvl = (upgrades?.foresight_discount as number) || 0;
    const foresightDiscountMult = Math.pow(0.80, fdLvl);
    let nextStar: { starId: string; cost: number } | null = null;
    // Also compute the total cost for "Purchase Max Stars" — sum of all
    // remaining unlit stars' costs, recomputing the cost after each purchase
    // (since the formula grows by WITHIN_CONSTELLATION_GROWTH per lit star).
    // We simulate the purchases on a copy of the state to compute the cost
    // accurately without mutating the actual state.
    let maxTotalCost = 0;
    let maxAffordableCost = 0;
    let maxAffordableCount = 0;
    const simState: ConstellationState = {
      constellationStars: { ...cs.constellationStars },
      constellationProgress: { ...cs.constellationProgress },
      constellationsStarted: { ...cs.constellationsStarted },
      constellationsCompleted: { ...cs.constellationsCompleted },
    };
    // Simulate purchasing all unlit stars in order of ascending cost.
    const unlitStars = cdef.stars
      .filter((st) => !cs.constellationStars[st.id])
      .map((st) => ({ starId: st.id, cost: starCost(selectedConstellation, cs, st.id, { foresightDiscountMult }) }))
      .sort((a, b) => a.cost - b.cost);
    let simDivinity = divinity;
    for (const cand of unlitStars) {
      // Recompute cost with the simulated state (progress grows after each).
      const cost = starCost(selectedConstellation, simState, cand.starId, { foresightDiscountMult });
      maxTotalCost += cost;
      if (debugFreeBuy || simDivinity >= cost) {
        maxAffordableCost += cost;
        maxAffordableCount++;
        if (!debugFreeBuy) simDivinity -= cost;
        // Mark as lit in the simulated state.
        simState.constellationStars[cand.starId] = true;
        simState.constellationProgress[selectedConstellation] = (simState.constellationProgress[selectedConstellation] || 0) + 1;
      } else {
        // Can't afford — stop counting affordable ones (but keep summing
        // total cost so the "Purchase Max" button can show the full cost).
      }
    }
    // Find the cheapest unlit star for the "Purchase Next Star" button.
    if (unlitStars.length > 0) {
      nextStar = unlitStars[0];
    }
    const canBuyNext = !!nextStar && (debugFreeBuy || divinity >= nextStar.cost);
    const canBuyMax = maxAffordableCount > 0;
    return (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) setSelectedConstellation(null);
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative glass-strong rounded-lg border border-violet-500/40 shadow-2xl max-w-md w-full p-4">
          {/* Popup header — constellation name + category */}
          <div className="flex items-start gap-2 mb-3">
            <span
              className="inline-block w-3 h-3 rounded-full mt-1.5 shrink-0"
              style={{ background: CATEGORY_ACCENT[cdef.category] }}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold leading-tight">
                {cdef.i18nName}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                <span className="text-foreground/90 font-medium">{cdef.name}</span> ·{" "}
                <span className="text-muted-foreground">{CATEGORY_LABEL[cdef.category]}</span>
              </div>
            </div>
            {completed && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shrink-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>

          {/* Reward for completing the constellation */}
          <div className="stat-card mb-2">
            <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1.5">
              Reward for completing {cdef.i18nName}
            </div>
            {bonusSummary(cdef.bonus).length === 0 ? (
              <div className="text-xs text-muted-foreground">No bonus (cosmetic).</div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {bonusSummary(cdef.bonus).map((b) => (
                  <Badge key={b.label} variant="outline" className={b.cls}>
                    {b.label} {b.value}
                  </Badge>
                ))}
              </div>
            )}
            <div className="text-[0.6rem] text-muted-foreground mt-1.5">
              Plus per-star bonus: <span className="text-cyan-300">+0.5% production</span> for every lit star.
            </div>
          </div>

          {/* Progress in this constellation */}
          <div className="stat-card mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">
                Progress in {cdef.i18nName}
              </span>
              <span className="font-mono text-amber-300">
                {progress} / {total}
              </span>
            </div>
            <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400/70 transition-all"
                style={{ width: `${(progress / total) * 100}%` }}
              />
            </div>
            {completed ? (
              <div className="text-[0.65rem] text-emerald-300 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Constellation complete — bonus active.
              </div>
            ) : (
              <div className="text-[0.65rem] text-muted-foreground mt-1">
                {total - progress} more star(s) to complete this constellation.
              </div>
            )}
          </div>

          {/* Action buttons: Purchase Next Star + Purchase Max Stars */}
          <div className="space-y-2">
            {/* Purchase Next Star */}
            <div className="stat-card">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium">Purchase Next Star</div>
                  <div className="text-[0.6rem] text-muted-foreground leading-snug">
                    {nextStar
                      ? <>Illuminates the cheapest unlit star in {cdef.i18nName}.</>
                      : "No unlit stars remaining."}
                  </div>
                  {nextStar && (
                    <div className="text-[0.6rem] mt-1">
                      <span className="text-muted-foreground">Cost: </span>
                      <Badge
                        variant="outline"
                        className={
                          canBuyNext
                            ? "text-emerald-300 border-emerald-400/40"
                            : "text-rose-300 border-rose-400/40"
                        }
                      >
                        {formatNumber(nextStar.cost, 0)} Divinity
                      </Badge>
                    </div>
                  )}
                </div>
                <Button
                  className="shrink-0"
                  disabled={!canBuyNext}
                  onClick={() => {
                    if (!selectedConstellation) return;
                    purchaseNextStar(selectedConstellation);
                    // Re-check after purchase — if no more unlit stars, close popup.
                    setTimeout(() => {
                      const updated = useGameStore.getState();
                      const cdef2 = CONSTELLATION_MAP[selectedConstellation];
                      if (!cdef2) return;
                      const allLit = cdef2.stars.every((st) => updated.constellationStars?.[st.id]);
                      if (allLit) setSelectedConstellation(null);
                    }, 0);
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Light Next
                </Button>
              </div>
            </div>

            {/* Purchase Max Stars */}
            <div className="stat-card">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium">Purchase Max Stars</div>
                  <div className="text-[0.6rem] text-muted-foreground leading-snug">
                    Illuminates ALL {unlitStars.length} remaining unlit star{unlitStars.length === 1 ? "" : "s"}
                    {unlitStars.length === 0 ? "." : " (stops when can't afford next)."}
                  </div>
                  {unlitStars.length > 0 && (
                    <div className="text-[0.6rem] mt-1 flex flex-wrap gap-1">
                      <span className="text-muted-foreground">Total cost (all): </span>
                      <Badge variant="outline" className="text-amber-300 border-amber-400/40">
                        {formatNumber(maxTotalCost, 0)} Div
                      </Badge>
                      <span className="text-muted-foreground">Affordable: </span>
                      <Badge
                        variant="outline"
                        className={
                          canBuyMax
                            ? "text-emerald-300 border-emerald-400/40"
                            : "text-rose-300 border-rose-400/40"
                        }
                      >
                        {maxAffordableCount} star{maxAffordableCount === 1 ? "" : "s"} ({formatNumber(maxAffordableCost, 0)} Div)
                      </Badge>
                    </div>
                  )}
                </div>
                <Button
                  className="shrink-0"
                  disabled={!canBuyMax}
                  onClick={() => {
                    if (!selectedConstellation) return;
                    purchaseMaxStars(selectedConstellation);
                    // Close popup after bulk purchase — the player can re-open
                    // if they want to keep buying.
                    setSelectedConstellation(null);
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Light All
                </Button>
              </div>
            </div>
          </div>

          {/* Close button */}
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSelectedConstellation(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* LAYER-AS-TAB — was <DialogHeader>/<DialogTitle>/<DialogDescription>
          (Radix primitives that require a <Dialog> parent). Now plain HTML
          since this content renders inline in the tab panel. */}
      <div className="flex flex-col gap-2 text-center sm:text-left mb-3">
        <h2 className="text-lg leading-none font-semibold flex items-center gap-2 flex-wrap">
          <Eye className="w-5 h-5" />
          Layer 2 — Enlightenment (Constellation Sky)
          <BackgroundLayerBadge layerId="enlightenment" />
        </h2>
        <div className="text-sm text-muted-foreground flex items-center justify-between flex-wrap gap-2">
          <span>
            Drag the wide sky or use ◀ ▶ to pan. Click a star to inspect it and illuminate.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {isUnlocked && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs gap-1 border-violet-500/40 text-violet-200 hover:bg-violet-500/10"
                onClick={() => setExpanded(true)}
                title="Open full-screen star map"
                aria-label="Open full-screen star map"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Expand
              </Button>
            )}
            <Badge variant="outline" className="text-violet-300 border-violet-400/40">
              {formatNumber(divinity, 0)} Divinity
            </Badge>
          </div>
        </div>
      </div>

      {!isUnlocked ? (
        <div className="text-center text-muted-foreground py-10">
          <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Enlightenment is sealed.</p>
          <p className="text-xs mt-1">Master 3 distinct Layer 1 trials to unlock the constellation map.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 min-h-0">
          {/* ===== WIDE SCROLLABLE SKY + PROGRESS SUMMARY ===== */}
          <div className="flex flex-col gap-2 min-h-0">
            {/* The wide-sky viewport — responsive height (was fixed SKY_H).
                STAR-MAP-FIX: using clamp() so the map grows to fill the
                modal on tall viewports. */}
            <div
              className="relative w-full overflow-hidden rounded-lg border border-violet-500/20 bg-gradient-to-b from-[#020817] via-[#0a0a23] to-[#050518] touch-none select-none"
              style={{
                // CONSTELLATION-REDESIGN-NOIRLAB: taller clamp so stars at
                // y=4 (top) and y=96 (bottom) are always within the visible
                // area (was clamp(380px, 56vh, 700px)).
                height: "clamp(500px, 64vh, 900px)",
                cursor: dragging ? "grabbing" : "grab",
              }}
              onPointerDown={(e) => onPointerDown(e, false)}
              onPointerMove={(e) => onPointerMove(e, false)}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onPointerLeave={endDrag}
            >
              {/* The 3 sky instances — wrapper height matches viewport (100%)
                  so the inner sky fills the visible area. */}
              <div
                className="absolute top-0 left-0"
                style={{
                  transform: `translateX(${scrollX}px)`,
                  width: SKY_W,
                  height: "100%",
                  willChange: "transform",
                }}
              >
                {SKY_OFFSETS.map((off) => renderSkyInstance(off, SKY_W))}
              </div>

              {/* ◀ Left navigation arrow */}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-30 h-9 w-9 rounded-full bg-slate-950/80 border border-violet-500/30 hover:bg-slate-800/90 text-violet-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleScrollButton("left", false);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Scroll sky left"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              {/* ▶ Right navigation arrow */}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-30 h-9 w-9 rounded-full bg-slate-950/80 border border-violet-500/30 hover:bg-slate-800/90 text-violet-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleScrollButton("right", false);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Scroll sky right"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>

              {/* Map legend (bottom-left) */}
              <div className="absolute bottom-2 left-12 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-slate-700/50 bg-slate-950/70 px-2.5 py-1 text-[0.6rem] text-slate-300 backdrop-blur pointer-events-none">
                {(["zodiac", "northern", "equatorial", "southern"] as ConstellationCategory[]).map((cat) => (
                  <span key={cat} className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: CATEGORY_ACCENT[cat] }} />
                    {CATEGORY_LABEL[cat]}
                  </span>
                ))}
              </div>

              {/* Drag hint (top-right) */}
              <div className="absolute top-2 right-12 rounded-md border border-violet-500/30 bg-slate-950/70 px-2 py-1 text-[0.6rem] text-violet-200/80 backdrop-blur pointer-events-none">
                drag ◀ ▶ to pan
              </div>
            </div>

            {/* Below-sky: progress summary + bonus badges */}
            <div className="stat-card">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <div className="text-[0.6rem] text-muted-foreground">Completed</div>
                  <div className="text-amber-300 font-semibold">
                    {completedCount} / {CONSTELLATIONS_REQUIRED_FOR_LAYER_3}
                    <span className="text-muted-foreground text-[0.6rem] ml-1">→ L3</span>
                  </div>
                </div>
                <div>
                  <div className="text-[0.6rem] text-muted-foreground">Stars lit</div>
                  <div className="text-cyan-300 font-semibold">
                    {litStarsCount} / {totalStars}
                  </div>
                </div>
                <div>
                  <div className="text-[0.6rem] text-muted-foreground">Started</div>
                  <div className="text-violet-300 font-semibold">
                    {startedCount} / {CONSTELLATIONS.length}
                  </div>
                </div>
                <div>
                  <div className="text-[0.6rem] text-muted-foreground">Divinity</div>
                  <div className="text-violet-300 font-semibold">
                    {formatNumber(divinity, 0)}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-cyan-300 border-cyan-400/40">+{(cb.productionMult * 100).toFixed(1)}% prod</Badge>
                <Badge variant="outline" className="text-amber-300 border-amber-400/40">+{(cb.capMult * 100).toFixed(1)}% cap</Badge>
                {/* EP + pop badges removed — EP merged with Divinity, pop is irrelevant at L2+ */}
                {cb.costMult < 0 && (
                  <Badge variant="outline" className="text-pink-300 border-pink-400/40">{(cb.costMult * 100).toFixed(1)}% cost</Badge>
                )}
                {cb.divinityMult > 0 && (
                  <Badge variant="outline" className="text-yellow-300 border-yellow-400/40">+{(cb.divinityMult * 100).toFixed(0)}% Divinity</Badge>
                )}
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

            {/* ===== STAR PURCHASE POPUP =====
                CONSTELLATION-REDESIGN-NOIRLAB: extracted to `renderStarPopup()`
                above so it can also be rendered inside the full-screen
                expanded overlay. Only render here when NOT in expanded mode —
                otherwise the popup would double-mount (once in the standard
                view, once in the expanded overlay). */}
            {!expanded && renderStarPopup()}
            {/* L3-REDESIGN — constellation bulk-purchase popup. Rendered in
                BOTH the standard view AND the expanded overlay (the
                parameterized pattern from CONSTELLATION-REDESIGN-NOIRLAB). */}
            {!expanded && renderConstellationPopup()}
          </div>

          {/* ===== SIDEBAR (constellation list + route picker + cost model) ===== */}
          <div className="flex flex-col gap-2 overflow-hidden min-h-0">
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-3">
                {/* Cost model explainer */}
                <details className="stat-card">
                  <summary className="text-[0.7rem] uppercase tracking-wide text-muted-foreground cursor-pointer">
                    Cost formula (expand)
                  </summary>
                  <div className="text-[0.6rem] text-muted-foreground mt-1.5 space-y-1 leading-snug">
                    <div>
                      cost = <span className="text-cyan-300 font-mono">{CONSTELLATION_BASE_COST}</span> × {WITHIN_CONSTELLATION_GROWTH}
                      <sup>stars in this constellation</sup> × {COST_GROWTH_PER_STARTED}
                      <sup>started constellations</sup> (new: ×{NEW_CONSTELLATION_PENALTY})
                    </div>
                    <div className="text-amber-300/70">
                      Tip: finish a constellation before starting another — the penalty compounds.
                    </div>
                  </div>
                </details>

                {/* Constellation list — click to pan the sky to that constellation */}
                <div className="stat-card">
                  <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1.5">
                    Constellations ({CONSTELLATIONS.length}) — click to pan
                  </div>
                  <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
                    {CONSTELLATIONS.map((c) => {
                      const prog = constellationProgress[c.id] || 0;
                      const total = c.stars.length;
                      const started = !!constellationsStarted[c.id];
                      const completed = !!constellationsCompleted[c.id];
                      return (
                        <button
                          key={c.id}
                          onClick={() => panToConstellation(c.id, false)}
                          className="w-full text-left px-2 py-1 rounded text-[0.65rem] flex items-center justify-between gap-1 transition-colors hover:bg-muted/30 border border-transparent"
                          aria-label={`Pan to ${c.i18nName} constellation`}
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                              style={{
                                background: completed
                                  ? CATEGORY_ACCENT[c.category]
                                  : started
                                    ? "#64748b"
                                    : "#334155",
                              }}
                            />
                            <span
                              className={`truncate ${completed ? "text-amber-300" : started ? "text-slate-200" : "text-muted-foreground"}`}
                            >
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
                    Route bonus: +{(rb.productionMult * 100).toFixed(0)}% prod, +{(rb.capMult * 100).toFixed(0)}% cap, +{(rb.divinityMult * 100).toFixed(0)}% Divinity
                  </div>
                </details>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      <Separator className="my-2" />
      <div className="text-[0.65rem] text-muted-foreground px-1">
        Click any star to inspect it; then press <span className="text-violet-300">Illuminate</span> to purchase. Costs scale by <span className="text-cyan-300">{WITHIN_CONSTELLATION_GROWTH}×</span> per star already lit in the same constellation, plus <span className="text-amber-300">{COST_GROWTH_PER_STARTED}<sup>{startedCount > 0 ? "N" : "0"}</sup>={Math.pow(COST_GROWTH_PER_STARTED, startedCount).toFixed(1)}×</span> per other started constellation. Complete <span className="text-emerald-300">{CONSTELLATIONS_REQUIRED_FOR_LAYER_3}</span> constellations to advance to Layer 3.
      </div>

      {/* ===========================================================================
          CONSTELLATION-REDESIGN-NOIRLAB — FULL-SCREEN EXPANDED OVERLAY
          ===========================================================================
          When `expanded` is true, render a full-screen (fixed inset-0 z-[100])
          overlay with an even wider sky (EXPANDED_SKY_W = 8000px). The overlay
          shares the same drag-to-pan/click-a-star semantics as the standard
          view via the parameterized `onPointerDown`/`onPointerMove`/`
          handleScrollButton`/`panToConstellation` functions. The per-star
          purchase popup is also rendered here (conditionally — only when
          `expanded` is true) so clicks on stars in expanded mode pop up the
          purchase UI in the right stacking context.

          Exit button: closes the overlay and clears the per-star selection
          so the player doesn't end up with a stray popup after exit.
          =========================================================================== */}
      {expanded && isUnlocked && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#020417]">
          {/* Top bar with title + Divinity + Exit + X */}
          <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-violet-500/30 bg-[#050518]/95 backdrop-blur">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-5 h-5 text-violet-300 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-violet-100 truncate">Constellation Sky — Full Screen</div>
                <div className="text-[0.65rem] text-muted-foreground truncate">{completedCount} / {CONSTELLATIONS_REQUIRED_FOR_LAYER_3} for L3 · {litStarsCount} / {totalStars} stars lit</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-violet-300 border-violet-400/40">{formatNumber(divinity, 0)} Divinity</Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 gap-1 border-violet-500/40 text-violet-100 hover:bg-violet-500/10"
                onClick={() => {
                  setSelectedStar(null);
                  setSelectedConstellation(null);
                  setExpanded(false);
                }}
                title="Exit full-screen"
                aria-label="Exit full-screen"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                Exit
              </Button>
              {/* X close button — top-right corner, always visible */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                onClick={() => {
                  setSelectedStar(null);
                  setSelectedConstellation(null);
                  setExpanded(false);
                }}
                title="Close (×)"
                aria-label="Close full-screen map"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Full-screen sky viewport — same drag/pan semantics as standard */}
          <div
            className="relative flex-1 overflow-hidden bg-gradient-to-b from-[#020817] via-[#0a0a23] to-[#050518] touch-none select-none"
            style={{ cursor: dragging ? "grabbing" : "grab" }}
            onPointerDown={(e) => onPointerDown(e, true)}
            onPointerMove={(e) => onPointerMove(e, true)}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={endDrag}
          >
            {/* The 3 sky instances — wider than standard (EXPANDED_SKY_W = 8000). */}
            <div
              className="absolute top-0 left-0"
              style={{
                transform: `translateX(${expandedScrollX}px)`,
                width: EXPANDED_SKY_W,
                height: "100%",
                willChange: "transform",
              }}
            >
              {EXPANDED_SKY_OFFSETS.map((off) => renderSkyInstance(off, EXPANDED_SKY_W))}
            </div>

            {/* ◀ Left navigation arrow (bigger in expanded mode) */}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 h-11 w-11 rounded-full bg-slate-950/80 border border-violet-500/30 hover:bg-slate-800/90 text-violet-100"
              onClick={(e) => {
                e.stopPropagation();
                handleScrollButton("left", true);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Scroll sky left"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            {/* ▶ Right navigation arrow (bigger in expanded mode) */}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 h-11 w-11 rounded-full bg-slate-950/80 border border-violet-500/30 hover:bg-slate-800/90 text-violet-100"
              onClick={(e) => {
                e.stopPropagation();
                handleScrollButton("right", true);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Scroll sky right"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Map legend (bottom-left) */}
            <div className="absolute bottom-3 left-16 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-slate-700/50 bg-slate-950/70 px-3 py-1.5 text-[0.65rem] text-slate-300 backdrop-blur pointer-events-none">
              {(["zodiac", "northern", "equatorial", "southern"] as ConstellationCategory[]).map((cat) => (
                <span key={cat} className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: CATEGORY_ACCENT[cat] }} />
                  {CATEGORY_LABEL[cat]}
                </span>
              ))}
            </div>

            {/* Drag hint (top-right) */}
            <div className="absolute top-3 right-16 rounded-md border border-violet-500/30 bg-slate-950/70 px-2.5 py-1 text-[0.65rem] text-violet-200/80 backdrop-blur pointer-events-none">
              drag ◀ ▶ to pan · press Exit to close
            </div>
          </div>

          {/* Per-star purchase popup (rendered in expanded context so the
              popup's z-[80] is correctly placed within the overlay's z-[100]
              stacking context — appears above the sky viewport). */}
          {expanded && renderStarPopup()}
          {/* L3-REDESIGN — constellation bulk-purchase popup rendered in the
              expanded overlay's stacking context (z-[100] parent creates a
              new context; the popup's z-[80] is the highest child). */}
          {expanded && renderConstellationPopup()}
        </div>
      )}
    </>
  );
}
