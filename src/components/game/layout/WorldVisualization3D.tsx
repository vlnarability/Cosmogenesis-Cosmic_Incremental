"use client";

// ===========================================================================
// WorldVisualization3D — REAL 3D renderer using Three.js.
//
// C1 POLISH ROUND:
//   • Tier color palette redesigned — no more indigo/blue dominance.
//     Each tier has a distinct cosmic hue (silver → green → cyan → gold →
//     amber → magenta → crimson → emerald → violet → gold-core), with the
//     higher tiers moving toward warm whites + void-black.
//   • Auto-rotate speed is now adjustable via a slider (0–24°/s). The
//     default is 8°/s (was 6°/s). A pause/play button toggles auto-rotate
//     without needing to drag first.
//   • Tier filter chips — click a tier in the legend to toggle its
//     visibility. Hidden tiers' instances are scaled to 0 (no re-alloc).
//   • Reactive legend — subscribes to worldTiers via useGameStore (was
//     calling getState() inline, which is not reactive).
//   • World count overlay — shows Σ visible / total in the top-right.
//   • Subtle glow halos around the higher-tier worlds (Tier 6+) via a
//     second InstancedMesh with additive-blended sphere geometry scaled
//     1.4× — gives Ascendant/Celestial Core worlds a luminous corona.
//   • Reduced-motion: when reduceMotion is on, auto-rotate defaults to 0
//     and the rotation slider is hidden.
//
// InstancedMesh draws all worlds in a single draw call (200+ spheres →
// 1 draw call). Material is shared so GPU memory footprint is tiny.
// ===========================================================================

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Orbit, ZoomIn, ZoomOut, RotateCcw, Pause, Play, Eye, EyeOff } from "lucide-react";
import { FUSION_TIERS } from "@/game/data/worldFusion";
import { useGameStore } from "@/game/state/store";
import { cn } from "@/lib/utils";

// ----- C1 tier color palette (cosmic, no indigo/blue dominance) -----
// Lower tiers = cooler / dimmer (silver, pale green, cyan).
// Mid tiers = warm (gold, amber, magenta, crimson).
// High tiers = luminous white-gold + emerald + violet accents.
// Top tier (void) = deep obsidian.
export const TIER_COLORS: Record<string, string> = {
  "1": "#cbd5e1",                  // silver-300 — base world
  "2": "#86efac",                  // green-300 — first fusion
  "3": "#22d3ee",                  // cyan-400 — brightened
  "4": "#fbbf24",                  // amber-400 — golden
  "5": "#fb923c",                  // orange-400 — burning
  "6": "#f472b6",                  // pink-400 — magenta
  "7": "#f87171",                  // red-400 — crimson
  "8": "#34d399",                  // emerald-400 — life-green
  "9": "#e879f9",                  // fuchsia-400 — neon violet
  "10": "#fde68a",                 // amber-200 — gold core
  "ascendant": "#fef3c7",          // amber-100 — luminous white-gold
  "greater_ascendant": "#ffffff",  // pure luminous
  "celestial_core": "#a7f3d0",     // emerald-200 — celestial mint
  "void": "#0c0a1e",               // obsidian void
};

// Tier radii — unchanged (preserves scene proportions).
export const TIER_RADII: Record<string, number> = {
  "1": 5, "2": 7, "3": 9, "4": 11, "5": 13,
  "6": 16, "7": 19, "8": 22, "9": 26, "10": 30,
  "ascendant": 38, "greater_ascendant": 44, "celestial_core": 50, "void": 60,
};

// Tier glow strength — 0 = no glow halo, >0 = additive-blended corona scale.
// Higher tiers get a glow so they read as "luminous" against the starfield.
const TIER_GLOW: Record<string, number> = {
  "1": 0, "2": 0, "3": 0, "4": 0, "5": 0.1,
  "6": 0.25, "7": 0.35, "8": 0.45, "9": 0.55, "10": 0.7,
  "ascendant": 0.85, "greater_ascendant": 1.0, "celestial_core": 1.2, "void": 0.6,
};

// Deterministic PRNG (mulberry32) — stable positions across re-renders.
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export interface WorldDot {
  x: number;
  y: number;
  z: number;
  tier: string;
  color: string;
  size: number;
  glow: number;
  /** Stable instance index within its tier — used for the glow mesh. */
  idx: number;
}

// Generate stable 3D positions for worlds. Each world gets a deterministic
// random position in a sphere. sqrt-radius distribution spreads dots on the
// outer shell (galaxy look). Wide radius range (60..380) keeps dots separate.
export function computeWorldDots(worldTiers: Record<string, number>): WorldDot[] {
  const rng = mulberry32(0xfeedface);
  const dots: WorldDot[] = [];
  for (const tier of FUSION_TIERS) {
    const count = Math.max(0, Math.floor(worldTiers[tier.id] || 0));
    if (count === 0) continue;
    // Cap the visualized count per tier for performance.
    const maxDots = Math.min(count, tier.id === "1" ? 220 : 40);
    for (let i = 0; i < maxDots; i++) {
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const r = 60 + Math.sqrt(rng()) * 320;
      dots.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        tier: tier.id,
        color: TIER_COLORS[tier.id] || "#ffffff",
        size: TIER_RADII[tier.id] || 5,
        glow: TIER_GLOW[tier.id] || 0,
        idx: i,
      });
    }
  }
  return dots;
}

// Background starfield — 300 distant points at radius 500-700.
function createStarfield(): THREE.Points {
  const rng = mulberry32(0x12345678);
  const count = 300;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    const r = 500 + rng() * 200;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2.5,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

// Default camera position — distance from origin ≈ 670.8.
const DEFAULT_CAM = new THREE.Vector3(400, 200, 500);
const DEFAULT_CAM_DIST = DEFAULT_CAM.length();

const ZOOM_MIN_DIST = 200;
const ZOOM_MAX_DIST = 1500;

// Convert degrees/sec → radians/sec.
const degToRadPerSec = (deg: number) => (deg * Math.PI) / 180;

export interface WorldVisualization3DProps {
  dots: WorldDot[];
}

export function WorldVisualization3D({ dots }: WorldVisualization3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  // Refs read by the animation loop without re-creating it.
  const autoRotateRef = useRef(true);
  const rotationSpeedRef = useRef(degToRadPerSec(8)); // 8°/s default
  const hiddenTiersRef = useRef<Set<string>>(new Set());
  // The instMesh + glowMesh refs let us update visibility + matrix without
  // re-running the full useEffect.
  const instMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const glowMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const dotIndexRef = useRef<{ dot: WorldDot; instIdx: number; glowIdx: number | null }[]>([]);

  // UI state — re-renders the React overlay but the animation loop reads refs.
  const [zoomDisplay, setZoomDisplay] = useState("1.00×");
  const [rotationDeg, setRotationDeg] = useState(8);
  const [paused, setPaused] = useState(false);
  const [hiddenTiers, setHiddenTiers] = useState<Set<string>>(new Set());

  // Reactive worldTiers (for the legend + filter chips). The old version
  // used useGameStore.getState() inside render, which is not reactive.
  const worldTiers = useGameStore((s) => s.worldTiers || {});
  const reduceMotion = useGameStore((s) => s.reduceMotion || false);

  // ----- Setup the 3D scene once per `dots` change -----
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (dots.length === 0) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 400;

    // ----- Scene + camera + renderer -----
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050518);
    // Subtle radial fog — distant worlds fade into the void.
    scene.fog = new THREE.FogExp2(0x050518, 0.0008);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 5000);
    camera.position.copy(DEFAULT_CAM);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // cap at 2 for perf
    mount.appendChild(renderer.domElement);

    // ----- 3-light setup -----
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(300, 400, 300);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x6080ff, 0.4);
    rimLight.position.set(-200, -100, -200);
    scene.add(rimLight);

    // ----- Background starfield -----
    const stars = createStarfield();
    scene.add(stars);

    // ----- World spheres (InstancedMesh) -----
    const sphereGeo = new THREE.SphereGeometry(1, 24, 18); // bumped segments for smoother highlights
    const worldMat = new THREE.MeshStandardMaterial({
      metalness: 0.35,
      roughness: 0.45,
      emissive: 0x101030,
      emissiveIntensity: 0.4,
    });
    const instMesh = new THREE.InstancedMesh(sphereGeo, worldMat, dots.length);
    instMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    // ----- Glow halos for higher tiers (separate InstancedMesh) -----
    // Collect dots that have glow > 0 — these get a second sphere rendered
    // with additive blending + transparent material so they bloom.
    const glowDots = dots.filter((d) => d.glow > 0);
    const glowGeo = new THREE.SphereGeometry(1, 12, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowMesh = glowDots.length > 0
      ? new THREE.InstancedMesh(glowGeo, glowMat, glowDots.length)
      : null;
    if (glowMesh) {
      glowMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    }

    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const scaleVec = new THREE.Vector3();
    const posVec = new THREE.Vector3();
    const colorVec = new THREE.Color();
    const dotIndex: { dot: WorldDot; instIdx: number; glowIdx: number | null }[] = [];

    let glowIdx = 0;
    dots.forEach((d, i) => {
      posVec.set(d.x, d.y, d.z);
      quat.identity();
      scaleVec.setScalar(d.size);
      matrix.compose(posVec, quat, scaleVec);
      instMesh.setMatrixAt(i, matrix);
      colorVec.set(d.color);
      instMesh.setColorAt(i, colorVec);

      let thisGlowIdx: number | null = null;
      if (glowMesh && d.glow > 0) {
        // Glow halo = world sphere scaled by (1 + glow * 0.6).
        const glowScale = d.size * (1 + d.glow * 0.6);
        scaleVec.setScalar(glowScale);
        matrix.compose(posVec, quat, scaleVec);
        glowMesh.setMatrixAt(glowIdx, matrix);
        colorVec.set(d.color);
        glowMesh.setColorAt(glowIdx, colorVec);
        thisGlowIdx = glowIdx;
        glowIdx++;
      }
      dotIndex.push({ dot: d, instIdx: i, glowIdx: thisGlowIdx });
    });
    instMesh.instanceMatrix.needsUpdate = true;
    if (instMesh.instanceColor) instMesh.instanceColor.needsUpdate = true;
    if (glowMesh) {
      glowMesh.instanceMatrix.needsUpdate = true;
      if (glowMesh.instanceColor) glowMesh.instanceColor.needsUpdate = true;
    }
    scene.add(instMesh);
    if (glowMesh) scene.add(glowMesh);

    instMeshRef.current = instMesh;
    glowMeshRef.current = glowMesh;
    dotIndexRef.current = dotIndex;

    // ----- OrbitControls -----
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = ZOOM_MIN_DIST;
    controls.maxDistance = ZOOM_MAX_DIST;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.8;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // ----- Auto-rotate pause on pointer down -----
    const onPointerDown = () => {
      // Don't disable autoRotateRef here — the user might just be
      // clicking. Instead, the Pause button explicitly toggles it.
      // Dragging still works regardless.
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const updateZoomDisplay = () => {
      const dist = camera.position.length();
      const factor = DEFAULT_CAM_DIST / Math.max(0.0001, dist);
      setZoomDisplay(`${factor.toFixed(2)}×`);
    };
    controls.addEventListener("end", updateZoomDisplay);
    updateZoomDisplay();

    // ----- Animation loop -----
    let raf = 0;
    let last = performance.now();
    const animate = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (autoRotateRef.current) {
        const omega = rotationSpeedRef.current;
        instMesh.rotation.y += omega * dt;
        stars.rotation.y += omega * dt * 0.4; // starfield rotates slower (parallax)
        if (glowMesh) glowMesh.rotation.y = instMesh.rotation.y;
      }
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    // ----- Resize handler -----
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // ----- Cleanup -----
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      controls.removeEventListener("end", updateZoomDisplay);
      controls.dispose();
      sphereGeo.dispose();
      worldMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      stars.geometry.dispose();
      (stars.material as THREE.PointsMaterial).dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
      controlsRef.current = null;
      instMeshRef.current = null;
      glowMeshRef.current = null;
      dotIndexRef.current = [];
    };
  }, [dots]);

  // ----- Reduce-motion: default auto-rotate to 0 -----
  useEffect(() => {
    if (reduceMotion) {
      autoRotateRef.current = false;
      setPaused(true);
      setRotationDeg(0);
      rotationSpeedRef.current = 0;
    }
  }, [reduceMotion]);

  // ----- Apply hidden-tiers filter to the InstancedMesh matrices -----
  // When the user toggles a tier in the legend, we scale its instances to 0
  // (or back to their original size) by recomposing the matrix. This avoids
  // any re-allocation of the InstancedMesh.
  useEffect(() => {
    const instMesh = instMeshRef.current;
    const glowMesh = glowMeshRef.current;
    const dotIndex = dotIndexRef.current;
    if (!instMesh || dotIndex.length === 0) return;
    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const scaleVec = new THREE.Vector3();
    const posVec = new THREE.Vector3();
    const hidden = hiddenTiersRef.current;
    for (const entry of dotIndex) {
      const d = entry.dot;
      const isHidden = hidden.has(d.tier);
      posVec.set(d.x, d.y, d.z);
      quat.identity();
      scaleVec.setScalar(isHidden ? 0 : d.size);
      matrix.compose(posVec, quat, scaleVec);
      instMesh.setMatrixAt(entry.instIdx, matrix);
      if (glowMesh && entry.glowIdx !== null) {
        const glowScale = isHidden ? 0 : d.size * (1 + d.glow * 0.6);
        scaleVec.setScalar(glowScale);
        matrix.compose(posVec, quat, scaleVec);
        glowMesh.setMatrixAt(entry.glowIdx, matrix);
      }
    }
    instMesh.instanceMatrix.needsUpdate = true;
    if (glowMesh) glowMesh.instanceMatrix.needsUpdate = true;
  }, [hiddenTiers]);

  // ----- Reset button -----
  const resetView = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cam = controls.object;
    cam.position.copy(DEFAULT_CAM);
    controls.target.set(0, 0, 0);
    controls.update();
    autoRotateRef.current = !paused;
    setZoomDisplay("1.00×");
  }, [paused]);

  const zoomIn = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cam = controls.object;
    const dist = cam.position.length();
    if (dist <= ZOOM_MIN_DIST + 0.001) return;
    const newDist = Math.max(ZOOM_MIN_DIST, dist - 100);
    cam.position.multiplyScalar(newDist / dist);
    controls.update();
    setZoomDisplay(`${(DEFAULT_CAM_DIST / newDist).toFixed(2)}×`);
  }, []);

  const zoomOut = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cam = controls.object;
    const dist = cam.position.length();
    if (dist >= ZOOM_MAX_DIST - 0.001) return;
    const newDist = Math.min(ZOOM_MAX_DIST, dist + 100);
    cam.position.multiplyScalar(newDist / dist);
    controls.update();
    setZoomDisplay(`${(DEFAULT_CAM_DIST / newDist).toFixed(2)}×`);
  }, []);

  // ----- Rotation speed slider handler -----
  const onRotationChange = useCallback((deg: number) => {
    setRotationDeg(deg);
    rotationSpeedRef.current = degToRadPerSec(deg);
    // If the user moves the slider above 0, unpause automatically.
    if (deg > 0 && paused) {
      setPaused(false);
      autoRotateRef.current = true;
    } else if (deg === 0) {
      autoRotateRef.current = false;
    } else {
      autoRotateRef.current = !paused;
    }
  }, [paused]);

  const togglePause = useCallback(() => {
    const newPaused = !paused;
    setPaused(newPaused);
    autoRotateRef.current = !newPaused && rotationDeg > 0;
  }, [paused, rotationDeg]);

  // ----- Tier filter toggle -----
  const toggleTier = useCallback((tierId: string) => {
    setHiddenTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tierId)) next.delete(tierId);
      else next.add(tierId);
      hiddenTiersRef.current = next;
      return next;
    });
  }, []);

  // ----- Compute visible / total counts for the overlay -----
  const totalCount = dots.length;
  const visibleCount = useMemo(() => {
    let sum = 0;
    for (const d of dots) {
      if (!hiddenTiers.has(d.tier)) sum++;
    }
    return sum;
  }, [dots, hiddenTiers]);

  // Tier counts (for legend).
  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tier of FUSION_TIERS) {
      counts[tier.id] = Math.max(0, Math.floor(worldTiers[tier.id] || 0));
    }
    return counts;
  }, [worldTiers]);

  return (
    <div
      className="relative w-full"
      style={{ height: "clamp(360px, 60vh, 600px)" }}
    >
      <div
        ref={mountRef}
        className="w-full h-full overflow-hidden rounded-lg border border-violet-500/20 bg-[#050518] touch-none select-none"
        role="application"
        aria-label="Drag to rotate · scroll to zoom · 3D world visualization"
      />

      {/* Top-left: hint + zoom + reset */}
      <div className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none flex-wrap z-10 max-w-[calc(100%-1rem)]">
        <Badge variant="outline" className="text-[0.55rem] text-violet-200 border-violet-400/40 bg-slate-950/70 backdrop-blur pointer-events-auto">
          <Orbit className="w-2.5 h-2.5 mr-0.5" /> Drag · scroll to zoom
        </Badge>
        <div className="flex items-center gap-0.5 pointer-events-auto bg-slate-950/70 backdrop-blur rounded-md border border-violet-400/40">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-violet-200 hover:bg-violet-500/20"
            onClick={zoomOut}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3 h-3" />
          </Button>
          <span className="text-[0.55rem] text-violet-200 font-mono px-1 min-w-[2.6rem] text-center">
            {zoomDisplay}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-violet-200 hover:bg-violet-500/20"
            onClick={zoomIn}
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

      {/* Top-right: world count + rotation speed control */}
      <div className="absolute top-2 right-2 flex flex-col items-end gap-1 pointer-events-auto z-10">
        <Badge variant="outline" className="text-[0.55rem] text-cyan-200 border-cyan-400/40 bg-slate-950/70 backdrop-blur">
          <Eye className="w-2.5 h-2.5 mr-0.5" />
          {visibleCount.toLocaleString()} / {totalCount.toLocaleString()} worlds
        </Badge>
        {!reduceMotion && (
          <div className="flex items-center gap-1 bg-slate-950/70 backdrop-blur rounded-md border border-violet-400/40 px-1.5 py-0.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 text-violet-200 hover:bg-violet-500/20"
              onClick={togglePause}
              title={paused ? "Resume auto-rotate" : "Pause auto-rotate"}
              aria-label={paused ? "Resume auto-rotate" : "Pause auto-rotate"}
            >
              {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </Button>
            <span className="text-[0.55rem] text-muted-foreground font-mono min-w-[1.4rem] text-center">
              {rotationDeg}°/s
            </span>
            <Slider
              value={[rotationDeg]}
              onValueChange={(v) => onRotationChange(v[0] ?? 0)}
              min={0}
              max={24}
              step={1}
              className="w-16 h-3"
              aria-label="Auto-rotate speed"
            />
          </div>
        )}
      </div>

      {/* Tier legend + filter chips — bottom-left */}
      <div className="absolute bottom-2 left-2 flex flex-wrap gap-1 rounded-md border border-slate-700/50 bg-slate-950/70 px-2 py-1 text-[0.6rem] text-slate-300 backdrop-blur pointer-events-auto max-w-[calc(100%-1rem)] z-10">
        {FUSION_TIERS.filter((t) => tierCounts[t.id] > 0).map((tier) => {
          const hidden = hiddenTiers.has(tier.id);
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => toggleTier(tier.id)}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors",
                hidden ? "opacity-40 hover:opacity-70" : "hover:bg-slate-800/80",
              )}
              title={`${hidden ? "Show" : "Hide"} ${tier.name} (${tierCounts[tier.id]} worlds)`}
              aria-pressed={!hidden}
            >
              <span
                className={cn("inline-block w-2 h-2 rounded-full", hidden && "ring-1 ring-slate-500")}
                style={{ background: TIER_COLORS[tier.id] || "#fff" }}
              />
              <span className="truncate max-w-[6rem]">{tier.name.replace(" World", "")}</span>
              <span className="text-muted-foreground/70 tabular-nums">×{tierCounts[tier.id]}</span>
              {hidden && <EyeOff className="w-2.5 h-2.5 text-muted-foreground/60" />}
            </button>
          );
        })}
        {hiddenTiers.size > 0 && (
          <button
            type="button"
            onClick={() => {
              setHiddenTiers(new Set());
              hiddenTiersRef.current = new Set();
            }}
            className="ml-1 px-1.5 py-0.5 rounded text-[0.55rem] text-cyan-200 hover:bg-cyan-500/20"
            title="Show all tiers"
          >
            Show all
          </button>
        )}
      </div>
    </div>
  );
}
