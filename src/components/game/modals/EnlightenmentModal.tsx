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
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

// Sky dimensions — the wide panorama.
const SKY_W = 3000;
const SKY_H = 500;

// Per-instance offsets for the infinite-wrap 3-copy trick.
// We render the sky at three x-offsets: -SKY_W (left), 0 (center), +SKY_W
// (right). The wrapper translates them all by `scrollX`. As the user scrolls,
// when |scrollX| exceeds SKY_W, we wrap by adding/subtracting SKY_W so the
// visible area always shows at least one fully-populated instance. The wrap
// is invisible because all 3 instances render identical content.
const SKY_OFFSETS: number[] = [-SKY_W, 0, SKY_W];

// FIX-UI-TABS / react-hooks/set-state-in-effect — module-level helper
// for the infinite-wrap. Moved out of useEffect (which linted as a
// cascading-render trigger) and applied at each setScrollX() call site.
function wrapScrollX(x: number): number {
  if (x < -SKY_W) return x + SKY_W;
  if (x > SKY_W) return x - SKY_W;
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
  if (bonus.productionMult) out.push({ label: "Production", value: `+${(bonus.productionMult * 100).toFixed(1)}%`, cls: "text-cyan-300 border-cyan-400/40" });
  if (bonus.capMult) out.push({ label: "Capacity", value: `+${(bonus.capMult * 100).toFixed(1)}%`, cls: "text-amber-300 border-amber-400/40" });
  if (bonus.epMult) out.push({ label: "EP", value: `+${(bonus.epMult * 100).toFixed(1)}%`, cls: "text-emerald-300 border-emerald-400/40" });
  if (bonus.popGrowthMult) out.push({ label: "Pop growth", value: `+${(bonus.popGrowthMult * 100).toFixed(1)}%`, cls: "text-violet-300 border-violet-400/40" });
  if (bonus.costMult) out.push({ label: "Cost", value: `${(bonus.costMult * 100).toFixed(1)}%`, cls: "text-pink-300 border-pink-400/40" });
  if (bonus.divinityMult) out.push({ label: "Divinity", value: `+${(bonus.divinityMult * 100).toFixed(0)}%`, cls: "text-yellow-300 border-yellow-400/40" });
  return out;
}

export function EnlightenmentContent() {
  const closeLayerModal = useGameStore((s) => s.closeLayerModal);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const divinity = useGameStore((s) => s.divinity);
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

  const isUnlocked = !!unlockedLayers.enlightenment;

  // ===== UI state =====
  // `selectedStar` drives the per-star purchase popup. `scrollX` is the
  // translateX of the wide-sky wrapper (in pixels). `isDragging` is a ref
  // (not state) so we don't trigger re-renders on every mousemove.
  const [selectedStar, setSelectedStar] = useState<StarSelection | null>(null);
  const [scrollX, setScrollX] = useState(0);
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
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartScroll.current = scrollX;
    dragDistance.current = 0;
    setDragging(true);
    // Capture pointer so move events keep firing even if the cursor leaves
    // the viewport bounds mid-drag.
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }, [scrollX]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    dragDistance.current = Math.abs(dx);
    setScrollX(wrapScrollX(dragStartScroll.current + dx));
  }, []);

  const endDrag = useCallback(() => {
    isDragging.current = false;
    setDragging(false);
  }, []);

  // Arrow-button scroll — jumps by ~10% of the sky width per click.
  const handleScrollButton = useCallback((dir: "left" | "right") => {
    setScrollX((x) => wrapScrollX(x + (dir === "left" ? -300 : 300)));
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
    const canAfford = divinity >= cost;
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
  }, [selectedStar, constellationStars, constellationState, foresightDiscountMult, constellationsStarted, constellationsCompleted, constellationProgress, divinity]);

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
  const panToConstellation = useCallback((cId: string) => {
    const cdef = CONSTELLATION_MAP[cId];
    if (!cdef) return;
    const first = cdef.stars[0];
    if (!first) return;
    const targetX = -(first.x / 100) * SKY_W + 150;
    setScrollX(wrapScrollX(targetX));
  }, []);

  // ===== Render a single instance of the wide sky at the given x offset =====
  // Called 3 times by the wrapper to produce the infinite-scroll illusion.
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
  function renderSkyInstance(offset: number) {
    return (
      <div
        key={offset}
        className="absolute top-0"
        style={{
          left: `${offset}px`,
          width: `${SKY_W}px`,
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
        {/* Constellation connection lines — SVG fills the parent and uses
            a normalized 0-100 viewBox so lines scale to any height. */}
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
                strokeWidth={isCompleted ? 0.25 : 0.12}
                strokeLinecap="round"
                opacity={dim ? 0.35 : 0.9}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {/* Stars as clickable buttons positioned using PERCENTAGE
            coordinates so they always scale with the parent's height. */}
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
                width: "14px",
                height: "14px",
                background: lit ? accent : started ? "#475569" : "#1e293b",
                boxShadow: lit
                  ? `0 0 8px 2px ${accent}88`
                  : isSelected
                    ? "0 0 6px 1px #fff"
                    : "none",
                border: isSelected
                  ? "2px solid #fff"
                  : lit
                    ? `1px solid ${accent}`
                    : "1px solid transparent",
                cursor: "pointer",
                zIndex: isSelected ? 20 : 10,
              }}
              aria-label={`${starDesignation(fs.starId, fs.cI18nName)} in ${fs.cI18nName} constellation${lit ? " (lit)" : " (unlit)"}`}
            />
          );
        })}
        {/* Constellation name labels — percentage positioning. */}
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
              className="absolute text-[10px] italic font-serif pointer-events-none select-none whitespace-nowrap"
              style={{
                left: `${la.left}%`,
                top: `${la.top}%`,
                color: isCompleted
                  ? CATEGORY_ACCENT[cdef.category]
                  : isStarted
                    ? "#cbd5e1"
                    : "#475569",
                opacity: dim ? 0.35 : 0.95,
              }}
            >
              {cdef.i18nName}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg flex-wrap">
          <Eye className="w-5 h-5" />
          Layer 2 — Enlightenment (Constellation Sky)
          <BackgroundLayerBadge layerId="enlightenment" />
        </DialogTitle>
        <DialogDescription className="flex items-center justify-between flex-wrap gap-2">
          <span>
            Drag the wide sky or use ◀ ▶ to pan. Click a star to inspect it and illuminate.
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
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 min-h-0">
          {/* ===== WIDE SCROLLABLE SKY + PROGRESS SUMMARY ===== */}
          <div className="flex flex-col gap-2 min-h-0">
            {/* The wide-sky viewport — responsive height (was fixed SKY_H).
                STAR-MAP-FIX: using clamp() so the map grows to fill the
                modal on tall viewports. */}
            <div
              className="relative w-full overflow-hidden rounded-lg border border-violet-500/20 bg-gradient-to-b from-[#020817] via-[#0a0a23] to-[#050518] touch-none select-none"
              style={{
                height: "clamp(380px, 56vh, 700px)",
                cursor: dragging ? "grabbing" : "grab",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
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
                {SKY_OFFSETS.map((off) => renderSkyInstance(off))}
              </div>

              {/* ◀ Left navigation arrow */}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-30 h-9 w-9 rounded-full bg-slate-950/80 border border-violet-500/30 hover:bg-slate-800/90 text-violet-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleScrollButton("left");
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
                  handleScrollButton("right");
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
                <Badge variant="outline" className="text-emerald-300 border-emerald-400/40">+{(cb.epMult * 100).toFixed(1)}% EP</Badge>
                <Badge variant="outline" className="text-violet-300 border-violet-400/40">+{(cb.popGrowthMult * 100).toFixed(1)}% pop</Badge>
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
                A custom fixed-position overlay (avoids nesting two Radix
                Dialogs, which has focus-trap quirks). The popup floats over
                the modal content centered horizontally. */}
            {selectedInfo && (
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
            )}
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
                          onClick={() => panToConstellation(c.id)}
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
        Click any star to inspect it; then press <span className="text-violet-300">Illuminate</span> to purchase. Costs scale by <span className="text-cyan-300">{WITHIN_CONSTELLATION_GROWTH}×</span> per star already lit in the same constellation, plus <span className="text-amber-300">{COST_GROWTH_PER_STARTED}<sup>{startedCount > 0 ? "N" : "0"}</sup>={Math.pow(COST_GROWTH_PER_STARTED, startedCount).toFixed(1)}×</span> per other started constellation. Complete <span className="text-emerald-300">{CONSTELLATIONS_REQUIRED_FOR_LAYER_3}</span> constellations to advance to Layer 3.
      </div>
      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={() => closeLayerModal()}>Close</Button>
      </div>
    </>
  );
}
