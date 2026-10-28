"use client";

// ===========================================================================
// WorldVisualization3D — REAL 3D renderer using Three.js.
//
// Replaces the old CSS-3D-transforms version (which only positioned flat
// 2D billboards in 3D space — they always faced the camera regardless of
// rotation, so they were not actually 3D objects).
//
// This version renders actual 3D sphere geometry:
//   • Each world is an InstancedMesh instance of SphereGeometry(1, 16, 12)
//     with MeshStandardMaterial (metalness 0.3, roughness 0.5).
//   • Per-instance transform matrix (position + scale) + per-instance color
//     via instanceColor.
//   • Three-light setup (ambient + key directional + rim directional)
//     creates specular highlights + shadow gradients that ACTUALLY rotate
//     with the scene — proving the geometry is real 3D.
//   • Background starfield via THREE.Points geometry (200 points at
//     radius 500-700, white, size 2.5, opacity 0.5).
//   • OrbitControls — drag to rotate 360°, wheel to zoom (min 200, max
//     1500), enableDamping, no panning.
//   • Auto-rotate 6°/s on Y axis when not dragging. Disabled on pointer
//     down, re-enabled on Reset button.
//
// InstancedMesh draws all worlds in a single draw call (200+ spheres →
// 1 draw call). Material is shared so GPU memory footprint is tiny.
// ===========================================================================

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Orbit, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { FUSION_TIERS } from "@/game/data/worldFusion";
import { useGameStore } from "@/game/state/store";

// Tier color palette (shared with DivineEngineFullTab's World Fusion rows
// — keep these in sync). Used to color each instance.
export const TIER_COLORS: Record<string, string> = {
  "1": "#e2e8f0", "2": "#93c5fd", "3": "#60a5fa", "4": "#3b82f6", "5": "#818cf8",
  "6": "#a78bfa", "7": "#c084fc", "8": "#e879f9", "9": "#f472b6", "10": "#fbbf24",
  "ascendant": "#fde047", "greater_ascendant": "#fef08a", "celestial_core": "#e0f2fe", "void": "#1e1b4b",
};

// World sphere radii (in scene units). SphereGeometry(1) is scaled by these
// values per instance — same proportions as the old CSS version so the
// scene reads the same at every zoom level.
export const TIER_RADII: Record<string, number> = {
  "1": 5, "2": 7, "3": 9, "4": 11, "5": 13,
  "6": 16, "7": 19, "8": 22, "9": 26, "10": 30,
  "ascendant": 38, "greater_ascendant": 44, "celestial_core": 50, "void": 60,
};

// Deterministic PRNG (mulberry32) — same seed every load so worlds keep
// stable positions across re-renders + page reloads.
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
}

// Generate stable 3D positions for worlds. Each world gets a deterministic
// random position in a sphere. We use a sqrt-radius distribution so worlds
// are spread more on the outer shell (less clumping at the center) and a
// wide radius range (60..380) so dots are visibly separate in 3D space.
export function computeWorldDots(worldTiers: Record<string, number>): WorldDot[] {
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
      const r = 60 + Math.sqrt(rng()) * 320;
      dots.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        tier: tier.id,
        color: TIER_COLORS[tier.id] || "#ffffff",
        size: TIER_RADII[tier.id] || 5,
      });
    }
  }
  return dots;
}

// Background starfield — 200 distant points at radius 500-700.
function createStarfield(): THREE.Points {
  const rng = mulberry32(0x12345678);
  const count = 200;
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

// Zoom limits (matches the OrbitControls min/max distance).
const ZOOM_MIN_DIST = 200;
const ZOOM_MAX_DIST = 1500;

export function WorldVisualization3D({ dots }: { dots: WorldDot[] }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  // Auto-rotate flag is a ref so the animation loop reads the latest value
  // without re-creating the loop. Disabled on pointer down, re-enabled on
  // Reset button click.
  const autoRotateRef = useRef(true);
  // Track the current camera distance for the zoom display label.
  const [zoomDisplay, setZoomDisplay] = useState("1.00×");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Bail if 0 dots — InstancedMesh(geo, mat, 0) is valid but pointless,
    // and we'd still be allocating lights + starfield for nothing.
    if (dots.length === 0) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 400;

    // ----- Scene + camera + renderer -----
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050518);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 5000);
    camera.position.copy(DEFAULT_CAM);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
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
    const sphereGeo = new THREE.SphereGeometry(1, 16, 12);
    const worldMat = new THREE.MeshStandardMaterial({
      metalness: 0.3,
      roughness: 0.5,
    });
    const instMesh = new THREE.InstancedMesh(sphereGeo, worldMat, dots.length);
    instMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion(); // identity — no per-instance rotation
    const scaleVec = new THREE.Vector3();
    const posVec = new THREE.Vector3();
    const colorVec = new THREE.Color();

    dots.forEach((d, i) => {
      posVec.set(d.x, d.y, d.z);
      quat.identity();
      scaleVec.setScalar(d.size);
      matrix.compose(posVec, quat, scaleVec);
      instMesh.setMatrixAt(i, matrix);
      colorVec.set(d.color);
      instMesh.setColorAt(i, colorVec);
    });
    instMesh.instanceMatrix.needsUpdate = true;
    if (instMesh.instanceColor) {
      instMesh.instanceColor.needsUpdate = true;
    }
    scene.add(instMesh);

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

    // ----- Auto-rotate control -----
    // When user starts dragging (pointer down), stop auto-rotation. The
    // Reset button re-enables it.
    const onPointerDown = () => {
      autoRotateRef.current = false;
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    // Track current camera distance for the zoom display label.
    const updateZoomDisplay = () => {
      const dist = camera.position.length();
      // 1.00× baseline = DEFAULT_CAM_DIST. Closer = bigger factor.
      const factor = DEFAULT_CAM_DIST / Math.max(0.0001, dist);
      setZoomDisplay(`${factor.toFixed(2)}×`);
    };
    controls.addEventListener("end", updateZoomDisplay);
    // Initialize label.
    updateZoomDisplay();

    // ----- Animation loop -----
    // 6°/s = 0.1047 rad/s. We rotate the InstancedMesh + starfield together
    // around the Y axis when not dragging.
    const RAD_PER_SEC = (6 * Math.PI) / 180;
    let raf = 0;
    let last = performance.now();
    const animate = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); // clamp dt to avoid jumps
      last = now;
      if (autoRotateRef.current) {
        instMesh.rotation.y += RAD_PER_SEC * dt;
        stars.rotation.y += RAD_PER_SEC * dt;
      }
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    // ----- Resize handler -----
    // ResizeObserver handles container resize (responsive layout).
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
      stars.geometry.dispose();
      (stars.material as THREE.PointsMaterial).dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
      controlsRef.current = null;
    };
  }, [dots]);

  // ----- Reset button -----
  // Restores the default camera position + re-enables auto-rotate.
  const resetView = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cam = controls.object;
    cam.position.copy(DEFAULT_CAM);
    controls.target.set(0, 0, 0);
    controls.update();
    autoRotateRef.current = true;
    setZoomDisplay("1.00×");
  }, []);

  // ----- Zoom buttons -----
  // Move camera along the radial direction toward/away from the target.
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

      {/* Top-left: hint badge + zoom controls + Reset */}
      <div className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none flex-wrap z-10">
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

      {/* Tier legend — bottom-left */}
      <div className="absolute bottom-2 left-2 flex flex-wrap gap-x-3 gap-y-1 rounded-md border border-slate-700/50 bg-slate-950/70 px-2.5 py-1 text-[0.6rem] text-slate-300 backdrop-blur pointer-events-none max-w-[60%] z-10">
        {FUSION_TIERS.filter(t => (useGameStore.getState().worldTiers || {})[t.id] > 0).map(tier => (
          <span key={tier.id} className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: TIER_COLORS[tier.id] || "#fff" }} />
            {tier.name}
          </span>
        ))}
      </div>
    </div>
  );
}
