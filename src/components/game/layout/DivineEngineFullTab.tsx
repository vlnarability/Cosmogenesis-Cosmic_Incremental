"use client";

import { useGameStore } from "@/game/state/store";
import { formatNumber, formatCompact } from "../shared/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FUSION_TIERS, rawWorldCount, effectiveWorldCount, eternalFlameMultiplier } from "@/game/data/worldFusion";
import { ARCHETYPES } from "@/game/data/archetypes";
import {
  Sparkles, Flame, Globe, TrendingUp, Layers, Eye, Triangle, Egg, Users, Gauge,
  RotateCcw, Orbit, ZoomIn, ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

// ===========================================================================
// DivineEngineFullTab — the god's full control panel for reality.
//
// Sections:
//   • Summary stats (worlds, Div/s, peak prod, Eternal Flame multiplier)
//   • World Tier Visualization — 3D starfield, drag to rotate 360° in any
//     direction (up / down / left / right / angled). Auto-rotates when not
//     being dragged.
//   • World Archetype Injection — choose archetype, changes Divinity/s mult
//   • Evolution Sliders — 4 sliders that share a 10-point pool, default 0,
//     reallocate freely at any time
//   • Quick access buttons to L2/L3/L4 tabs
// ===========================================================================

const TIER_COLORS: Record<string, string> = {
  "1": "#e2e8f0", "2": "#93c5fd", "3": "#60a5fa", "4": "#3b82f6", "5": "#818cf8",
  "6": "#a78bfa", "7": "#c084fc", "8": "#e879f9", "9": "#f472b6", "10": "#fbbf24",
  "ascendant": "#fde047", "greater_ascendant": "#fef08a", "celestial_core": "#e0f2fe", "void": "#1e1b4b",
};

const TIER_SIZES: Record<string, number> = {
  "1": 5, "2": 7, "3": 9, "4": 11, "5": 13,
  "6": 16, "7": 19, "8": 22, "9": 26, "10": 30,
  "ascendant": 38, "greater_ascendant": 44, "celestial_core": 50, "void": 60,
};

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

interface WorldDot {
  x: number;
  y: number;
  z: number;
  tier: string;
  color: string;
  size: number;
}

// Generate stable 3D positions for worlds. Each world gets a deterministic
// random position in a sphere. We use a sqrt-radius distribution so worlds
// are spread more on the outer shell (less clumping at the center) and a
// wide radius range (60..380) so dots are visibly separate in 3D space.
function computeWorldDots(worldTiers: Record<string, number>): WorldDot[] {
  const rng = mulberry32(0xfeedface);
  const dots: WorldDot[] = [];
  for (const tier of FUSION_TIERS) {
    const count = Math.max(0, Math.floor(worldTiers[tier.id] || 0));
    if (count === 0) continue;
    // Cap the visualized count per tier so the 3D scene stays performant.
    const maxDots = Math.min(count, tier.id === "1" ? 220 : 40);
    for (let i = 0; i < maxDots; i++) {
      // Uniform direction (theta + phi via acos trick).
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      // sqrt distribution → more dots near the outer shell (galaxy look).
      // Radius range 60..380 gives ~6× spread between nearest + farthest,
      // so dots are clearly separated at any rotation angle.
      const r = 60 + Math.sqrt(rng()) * 320;
      dots.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        tier: tier.id,
        color: TIER_COLORS[tier.id] || "#fff",
        size: TIER_SIZES[tier.id] || 5,
      });
    }
  }
  return dots;
}

// Background starfield — distant points positioned in 3D, rendered with
// reduced opacity for parallax depth. Pushed far back so they don't
// overlap with the world sphere.
function computeStarfield(): WorldDot[] {
  const rng = mulberry32(0x12345678);
  const stars: WorldDot[] = [];
  for (let i = 0; i < 100; i++) {
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    const r = 500 + rng() * 200; // far outside the world sphere
    stars.push({
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
      tier: "1",
      color: "#ffffff",
      size: 1.5 + rng() * 1.5,
    });
  }
  return stars;
}

// ===========================================================================
// WorldVisualization3D — pure CSS 3D transforms. No external deps.
// Features:
//   • Drag to rotate 360° (rotateX clamped ±89°, rotateY unbounded).
//   • Auto-rotate 6°/s on Y axis when not dragging.
//   • Zoom in/out via buttons (+/-), mouse wheel, or pinch (touch).
//   • Sharper dot rendering: solid dot + thin border + small glow (no
//     soft blur). `will-change: transform` to hint the compositor.
//   • Reset button restores default angle + zoom.
// ===========================================================================

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3.0;
const ZOOM_STEP = 0.15;

export function WorldVisualization3D({ dots }: { dots: WorldDot[] }) {
  // Rotation state — degrees. Drag to update; auto-rotate when idle.
  const [rotX, setRotX] = useState(-18);
  const [rotY, setRotY] = useState(25);
  const [zoom, setZoom] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; rotX: number; rotY: number } | null>(null);
  // Pinch-tracking refs (touch). Stores the initial distance + zoom.
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stars = useMemo(() => computeStarfield(), []);

  // Auto-rotate when not dragging. Subtle continuous Y rotation.
  useEffect(() => {
    if (isDragging) return;
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      // 6°/s slow rotation around Y axis.
      setRotY((prev) => (prev + 6 * dt) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isDragging]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
    dragStart.current = { x: e.clientX, y: e.clientY, rotX, rotY };
    setIsDragging(true);
  }, [rotX, rotY]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    // 0.4° per pixel of drag — feels responsive without being twitchy.
    const newRotY = (dragStart.current.rotY + dx * 0.4) % 360;
    let newRotX = dragStart.current.rotX - dy * 0.4;
    // Clamp X rotation to [-89°, 89°] so the scene never fully flips.
    newRotX = Math.max(-89, Math.min(89, newRotX));
    setRotY(newRotY);
    setRotX(newRotX);
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragStart.current) {
      try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
    }
    dragStart.current = null;
    pinchStart.current = null;
    setIsDragging(false);
  }, []);

  // Zoom helpers — clamp to [ZOOM_MIN, ZOOM_MAX].
  const clampZoom = useCallback((v: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, v)), []);
  const zoomIn = useCallback(() => setZoom((z) => clampZoom(z + ZOOM_STEP * 2)), [clampZoom]);
  const zoomOut = useCallback(() => setZoom((z) => clampZoom(z - ZOOM_STEP * 2)), [clampZoom]);

  // Mouse-wheel zoom — intercepts wheel so the page doesn't scroll.
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    // deltaY > 0 = scroll down = zoom out. Step scaled by scroll amount.
    const step = ZOOM_STEP * Math.min(3, Math.abs(e.deltaY) / 50);
    const delta = e.deltaY > 0 ? -step : step;
    setZoom((z) => clampZoom(z + delta));
  }, [clampZoom]);

  // Touch pinch — when 2 fingers are down, the distance between them
  // drives zoom. We track the initial distance + zoom and apply the ratio.
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    if (!pinchStart.current) {
      pinchStart.current = { dist, zoom };
      return;
    }
    const ratio = dist / pinchStart.current.dist;
    setZoom(clampZoom(pinchStart.current.zoom * ratio));
  }, [zoom, clampZoom]);

  const resetView = useCallback(() => {
    setRotX(-18);
    setRotY(25);
    setZoom(1.0);
  }, []);

  return (
    <div className="relative w-full" style={{ height: "clamp(360px, 60vh, 600px)" }}>
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden rounded-lg border border-violet-500/20 bg-gradient-to-b from-[#020817] via-[#0a0a23] to-[#050518] touch-none select-none"
        // Perspective scales inversely with zoom: higher zoom = smaller
        // perspective = closer view. Base 1100px gives comfortable depth.
        style={{ perspective: `${1100 / zoom}px`, perspectiveOrigin: "50% 50%" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onTouchMove={onTouchMove}
        role="application"
        aria-label="Drag to rotate · scroll to zoom · 3D world visualization"
      >
        {/* Inner 3D scene — preserve-3d so children are positioned in 3D space.
            Scale by zoom so the whole sphere grows/shrinks together. */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transformStyle: "preserve-3d",
            transform: `translate(-50%, -50%) scale3d(${zoom}, ${zoom}, ${zoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            willChange: "transform",
          }}
        >
          {/* Starfield — far back, low opacity. */}
          {stars.map((s, i) => (
            <div
              key={`star-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${s.size}px`,
                height: `${s.size}px`,
                background: s.color,
                opacity: 0.4,
                transform: `translate3d(${s.x}px, ${s.y}px, ${s.z}px)`,
                transformStyle: "preserve-3d",
                willChange: "transform",
              }}
            />
          ))}

          {/* World dots — solid dot + thin border + small glow. */}
          {dots.map((dot, i) => (
            <div
              key={`world-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                marginLeft: `-${dot.size / 2}px`,
                marginTop: `-${dot.size / 2}px`,
                background: dot.color,
                // Sharp 1px border for definition + small glow for visibility.
                // Old boxShadow was 2-layer with 1.6× radius → too soft.
                border: `1px solid ${dot.color}`,
                boxShadow: `0 0 ${Math.max(4, dot.size * 0.6)}px ${dot.size * 0.25}px ${dot.color}66`,
                opacity: 0.95,
                transform: `translate3d(${dot.x}px, ${dot.y}px, ${dot.z}px)`,
                transformStyle: "preserve-3d",
                willChange: "transform",
              }}
              title={`${FUSION_TIERS.find(t => t.id === dot.tier)?.name || dot.tier} world`}
            >
              {dot.tier === "void" && (
                <div
                  className="absolute inset-0 rounded-full border-2"
                  style={{
                    borderColor: "#a855f7",
                    transform: "scale(1.8)",
                    opacity: 0.6,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Top-left: hint badge + zoom controls + Reset */}
        <div className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none flex-wrap">
          <Badge variant="outline" className="text-[0.55rem] text-violet-200 border-violet-400/40 bg-slate-950/70 backdrop-blur pointer-events-auto">
            <Orbit className="w-2.5 h-2.5 mr-0.5" /> Drag · scroll to zoom
          </Badge>
          <div className="flex items-center gap-0.5 pointer-events-auto bg-slate-950/70 backdrop-blur rounded-md border border-violet-400/40">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-violet-200 hover:bg-violet-500/20"
              onClick={zoomOut}
              disabled={zoom <= ZOOM_MIN + 0.001}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <span className="text-[0.55rem] text-violet-200 font-mono px-1 min-w-[2.4rem] text-center">
              {zoom.toFixed(2)}×
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-violet-200 hover:bg-violet-500/20"
              onClick={zoomIn}
              disabled={zoom >= ZOOM_MAX - 0.001}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[0.55rem] text-violet-200 border-violet-400/40 bg-slate-950/70 backdrop-blur pointer-events-auto"
            onClick={resetView}
            title="Reset view to default angle + zoom"
          >
            <RotateCcw className="w-2.5 h-2.5 mr-0.5" /> Reset
          </Button>
        </div>

        {/* Coordinate axis hint — small 3D triad in the corner */}
        <div
          className="absolute bottom-2 right-2 pointer-events-none"
          style={{ perspective: "200px" }}
          aria-hidden
        >
          <div
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
              width: "44px",
              height: "44px",
              position: "relative",
            }}
          >
            {/* X axis - red */}
            <div style={{ position: "absolute", left: "22px", top: "22px", width: "18px", height: "2px", background: "#ef4444", transform: "rotateY(0deg)", transformOrigin: "left center", borderRadius: "1px" }} />
            {/* Y axis - green */}
            <div style={{ position: "absolute", left: "22px", top: "22px", width: "2px", height: "18px", background: "#10b981", transform: "rotateX(0deg)", transformOrigin: "center top", borderRadius: "1px" }} />
            {/* Z axis - blue (toward viewer) */}
            <div style={{ position: "absolute", left: "22px", top: "22px", width: "18px", height: "2px", background: "#3b82f6", transform: "rotateY(90deg)", transformOrigin: "left center", borderRadius: "1px" }} />
          </div>
        </div>

        {/* Tier legend — bottom-left */}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-x-3 gap-y-1 rounded-md border border-slate-700/50 bg-slate-950/70 px-2.5 py-1 text-[0.6rem] text-slate-300 backdrop-blur pointer-events-none max-w-[60%]">
          {FUSION_TIERS.filter(t => (useGameStore.getState().worldTiers || {})[t.id] > 0).map(tier => (
            <span key={tier.id} className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: TIER_COLORS[tier.id] || "#fff" }} />
              {tier.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Main DivineEngineFullTab component
// ===========================================================================

export function DivineEngineFullTab() {
  const divinity = useGameStore((s) => s.divinity);
  const peakProductionRate = useGameStore((s) => s.peakProductionRate || 0);
  const worldTiers = useGameStore((s) => s.worldTiers || {});
  const eternalFlameInvested = useGameStore((s) => s.eternalFlameInvested || 0);
  const voidShards = useGameStore((s) => s.voidShards || 0);
  const setTab = useGameStore((s) => s.setTab);

  // IDEA-2: World Archetype Injection
  const activeWorldArchetype = useGameStore((s) => s.activeWorldArchetype);
  const setWorldArchetype = useGameStore((s) => s.setWorldArchetype);

  // IDEA-5: Evolution Sliders — 4 sliders share a 10-point pool.
  const evolutionSliders = useGameStore((s) => s.evolutionSliders || { speed: 0, aggression: 0, curiosity: 0, faith: 0 });
  const setEvolutionSlider = useGameStore((s) => s.setEvolutionSlider);

  const rawCount = rawWorldCount(worldTiers);
  const effectiveCount = effectiveWorldCount(worldTiers);
  const flameMult = eternalFlameMultiplier(eternalFlameInvested);
  const dots = useMemo(() => computeWorldDots(worldTiers), [worldTiers]);

  // Speed slider → Divinity/s multiplier: 1 + speed × 0.10 (0 → ×1.0, 10 → ×2.0).
  const sliderSpeedMult = 1 + (evolutionSliders.speed || 0) * 0.10;
  const sliderSum =
    (evolutionSliders.speed || 0) +
    (evolutionSliders.aggression || 0) +
    (evolutionSliders.curiosity || 0) +
    (evolutionSliders.faith || 0);

  const divPerSec = effectiveCount > 0 && peakProductionRate > 0
    ? effectiveCount * peakProductionRate * 0.01 * flameMult * (activeWorldArchetype ? 1.30 : 1) * sliderSpeedMult
    : 0;

  return (
    <div className="space-y-4">
      {/* ===== HEADER ===== */}
      <div className="stat-card flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-violet-300" />
          <div>
            <h2 className="text-lg font-bold">Divine Engine</h2>
            <p className="text-xs text-muted-foreground">The machinery of reality — worlds producing Divinity</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-violet-300 border-violet-400/40">
            <Sparkles className="w-3 h-3 mr-1" />
            {formatCompact(divinity)} Divinity
          </Badge>
          <Badge variant="outline" className="text-amber-300 border-amber-400/40">
            <TrendingUp className="w-3 h-3 mr-1" />
            {divPerSec > 0 ? `${formatCompact(divPerSec)} Div/s` : "0 Div/s"}
          </Badge>
          {voidShards > 0 && (
            <Badge variant="outline" className="text-purple-300 border-purple-400/40">
              🔮 {formatCompact(voidShards)} Void Shards
            </Badge>
          )}
        </div>
      </div>

      {/* ===== STATS GRID ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="stat-card text-center">
          <div className="text-[0.6rem] text-muted-foreground uppercase">Raw Worlds</div>
          <div className="text-xl font-bold text-violet-300">{formatNumber(rawCount, 0)}</div>
          <div className="text-[0.55rem] text-muted-foreground">toward cap</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-[0.6rem] text-muted-foreground uppercase">Effective</div>
          <div className="text-xl font-bold text-cyan-300">{formatCompact(effectiveCount)}</div>
          <div className="text-[0.55rem] text-muted-foreground">production-weighted</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-[0.6rem] text-muted-foreground uppercase">Peak Prod</div>
          <div className="text-xl font-bold text-amber-300">{formatCompact(peakProductionRate)}</div>
          <div className="text-[0.55rem] text-muted-foreground">resources/s</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-[0.6rem] text-muted-foreground uppercase">Flame</div>
          <div className="text-xl font-bold text-orange-300">×{flameMult.toFixed(2)}</div>
          <div className="text-[0.55rem] text-muted-foreground">{formatCompact(eternalFlameInvested)} invested</div>
        </div>
      </div>

      {/* ===== WORLD TIER VISUALIZATION (3D) ===== */}
      {rawCount > 0 && (
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Layers className="w-4 h-4 text-violet-300" />
            <span className="text-sm font-semibold">3D World Visualization</span>
            <span className="text-[0.65rem] text-muted-foreground">
              — each dot is a world, colored by fusion tier · drag to rotate (360°)
            </span>
          </div>
          <WorldVisualization3D dots={dots} />
        </div>
      )}

      {/* ===== IDEA-2: WORLD ARCHETYPE INJECTION ===== */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-cyan-300" />
          <span className="text-sm font-semibold">World Archetype</span>
          <span className="text-[0.65rem] text-muted-foreground">— choose what evolves inside your worlds (+30% Divinity/s when active)</span>
        </div>
        <Select
          value={activeWorldArchetype ?? "__none__"}
          onValueChange={(v) => setWorldArchetype(v === "__none__" ? null : v)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="No archetype (no bonus)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No archetype (no bonus)</SelectItem>
            {ARCHETYPES.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.glyph} {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeWorldArchetype && (
          <p className="text-[0.6rem] text-cyan-300/80 mt-1">
            Active: {ARCHETYPES.find(a => a.id === activeWorldArchetype)?.name} — +30% Divinity/s from all worlds.
          </p>
        )}
      </div>

      {/* ===== IDEA-5: EVOLUTION SLIDERS (10-point shared pool) ===== */}
      <div className="stat-card">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-300" />
            <span className="text-sm font-semibold">Evolution Sliders</span>
            <span className="text-[0.65rem] text-muted-foreground">— tune how your worlds behave</span>
          </div>
          <Badge variant="outline" className={`border-amber-400/40 ${sliderSum === 10 ? "text-amber-300" : sliderSum === 0 ? "text-muted-foreground" : "text-cyan-300"}`}>
            Pool: {sliderSum.toFixed(1)} / 10
          </Badge>
        </div>
        <div className="space-y-3">
          {/* Speed */}
          <SliderRow
            label="Evolution Speed"
            icon="⚡"
            value={evolutionSliders.speed}
            max={10}
            color="text-amber-300"
            display={`×${(1 + (evolutionSliders.speed || 0) * 0.10).toFixed(2)} Div/s`}
            onValueChange={(v) => setEvolutionSlider("speed", v)}
            help="+10% Divinity/s per point (×1.0 → ×2.0)."
          />
          {/* Aggression */}
          <SliderRow
            label="Aggression"
            icon="⚔️"
            value={evolutionSliders.aggression}
            max={10}
            color="text-rose-300"
            display={`+${((evolutionSliders.aggression || 0) * 10).toFixed(0)}% Void Shards`}
            onValueChange={(v) => setEvolutionSlider("aggression", v)}
            help="Each point = +10% Void Shards from worlds."
          />
          {/* Curiosity */}
          <SliderRow
            label="Curiosity"
            icon="🔭"
            value={evolutionSliders.curiosity}
            max={10}
            color="text-cyan-300"
            display={`+${((evolutionSliders.curiosity || 0) * 0.01).toFixed(3)}% peak/s`}
            onValueChange={(v) => setEvolutionSlider("curiosity", v)}
            help="Peak production rate grows slowly over time."
          />
          {/* Faith */}
          <SliderRow
            label="Faith"
            icon="✨"
            value={evolutionSliders.faith}
            max={10}
            color="text-violet-300"
            display={`+${((evolutionSliders.faith || 0) * 10).toFixed(0)}% Faith/s`}
            onValueChange={(v) => setEvolutionSlider("faith", v)}
            help="Each point = +10% passive Faith from worlds."
          />
        </div>
        <div className="text-[0.6rem] text-muted-foreground italic mt-2 flex items-center gap-1">
          <Flame className="w-2.5 h-2.5" />
          Distribute 10 points across the 4 sliders. Set one higher and the pool shrinks for the others. Reallocate freely at any time.
        </div>
      </div>

      {/* ===== QUICK ACCESS BUTTONS ===== */}
      <div className="stat-card">
        <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-2">Quick Access</div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setTab("constellations")} className="h-8 gap-1">
            <Eye className="w-3 h-3" /> Constellations
          </Button>
          <Button size="sm" variant="outline" onClick={() => setTab("market")} className="h-8 gap-1">
            <Triangle className="w-3 h-3" /> Transcendence (L3)
          </Button>
          <Button size="sm" variant="outline" onClick={() => setTab("galaxy")} className="h-8 gap-1">
            <Egg className="w-3 h-3" /> Galaxy Claim (L4)
          </Button>
        </div>
      </div>
    </div>
  );
}

// ===== Sub-component: a single slider row with label + value + help text =====
function SliderRow({
  label, icon, value, max, color, display, onValueChange, help,
}: {
  label: string;
  icon: string;
  value: number;
  max: number;
  color: string;
  display: string;
  onValueChange: (v: number) => void;
  help: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-[0.7rem] mb-1 items-center">
        <span className="text-muted-foreground flex items-center gap-1">
          <span>{icon}</span>
          <span>{label}</span>
        </span>
        <span className={`font-mono ${color}`}>{display}</span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={max}
        step={0.5}
        onValueChange={(v) => onValueChange(v[0])}
        className="w-full"
      />
      <p className="text-[0.55rem] text-muted-foreground mt-0.5">{help}</p>
    </div>
  );
}
