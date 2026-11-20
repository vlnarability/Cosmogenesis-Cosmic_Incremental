"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

// ===========================================================================
// SOLAR GENESIS — pre-game cosmic dust simulation (inspired by Aurora, 2011)
// ===========================================================================
// The player controls a glowing cursor that acts as a gravity well when
// holding the mouse button. Dust particles drift around a central star;
// holding click pulls them together until they merge and accrete into
// rocks, then planets. Guiding a planet into the star's habitable zone
// (the dashed ring) causes oceans and greenery to develop. Once a planet
// has life, the player clicks "Begin" to start the cell->galactic loop.
//
// Physics: Newtonian gravity from the star + cursor well, momentum-
// conserving merges, destructive collisions at high relative speed,
// dynamic camera zoom-out as the system grows.
// ===========================================================================

// ---- Physics constants (tuned for visual appeal, not realism) ----
const G = 45;
const STAR_MASS = 8000;
// Tuned for intuitive gameplay — planets should form within 10-15s of holding.
const CURSOR_MASS = 8000;
const DT = 1 / 60;
const DUST_COUNT = 100;
const TARGET_DUST = 100;
const DUST_SPAWN_INTERVAL = 1.0;
const HABITABLE_INNER = 150;
const HABITABLE_OUTER = 260;
const MERGE_SPEED_THRESHOLD = 80;
const PLANET_MASS_THRESHOLD = 6;
const LIFE_RATE = 0.04;
const TRAIL_LENGTH = 18;
const CURSOR_RANGE = 220;
const SHATTER_MIN_SPEED = 50;

interface Body {
  id: number;
  type: "dust" | "rock" | "planet";
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  hue: number;
  trail: Array<{ x: number; y: number }>;
  lifeProgress: number;
  inHabitableZone: boolean;
  name?: string;
  saveId?: string;
}

interface Star {
  x: number;
  y: number;
  mass: number;
  radius: number;
  pulse: number;
}

let nextId = 1;

function makeBody(type: Body["type"], x: number, y: number, vx: number, vy: number, mass: number, radius: number, hue: number): Body {
  return { id: nextId++, type, x, y, vx, vy, mass, radius, hue, trail: [], lifeProgress: 0, inHabitableZone: false };
}

function initDust(starX: number, starY: number): Body[] {
  const bodies: Body[] = [];
  for (let i = 0; i < DUST_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 280;
    const x = starX + Math.cos(angle) * dist;
    const y = starY + Math.sin(angle) * dist;
    // Orbital velocity for roughly circular orbit: v = sqrt(G * M / r)
    const orbSpeed = Math.sqrt((G * STAR_MASS) / dist) * (0.7 + Math.random() * 0.5);
    const vx = -Math.sin(angle) * orbSpeed;
    const vy = Math.cos(angle) * orbSpeed;
    const mass = 0.8 + Math.random() * 0.4;
    const radius = 1.8 + Math.random() * 1.0;
    const hue = 190 + Math.random() * 50;
    bodies.push(makeBody("dust", x, y, vx, vy, mass, radius, hue));
  }
  return bodies;
}

// Spawn a single dust particle at a random orbital position on the outer
// edge of the dust field. Used by the continuous-spawn system to maintain
// ~TARGET_DUST dust particles on screen at all times.
function spawnDust(starX: number, starY: number): Body {
  const angle = Math.random() * Math.PI * 2;
  const d = 250 + Math.random() * 150; // outer edge (250-400 from star)
  const x = starX + Math.cos(angle) * d;
  const y = starY + Math.sin(angle) * d;
  const orbSpeed = Math.sqrt((G * STAR_MASS) / d) * (0.7 + Math.random() * 0.5);
  const vx = -Math.sin(angle) * orbSpeed;
  const vy = Math.cos(angle) * orbSpeed;
  const mass = 0.8 + Math.random() * 0.4;
  const radius = 1.8 + Math.random() * 1.0;
  const hue = 190 + Math.random() * 50;
  return makeBody("dust", x, y, vx, vy, mass, radius, hue);
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// Merge two bodies conserving momentum and mass.
// RADIUS FIX: uses sqrt(r1² + r2²) (area-conserving, 2D) instead of
// cbrt(r1³ + r2³) (volume-conserving, 3D). The 3D formula made merged
// bodies barely larger than their components (two r=2 dust → r=2.52,
// only 26% bigger). The 2D formula gives a visible size increase
// (two r=2 dust → r=2.83, 42% bigger).
function mergeBodies(a: Body, b: Body): Body {
  const totalMass = a.mass + b.mass;
  const nx = (a.mass * a.x + b.mass * b.x) / totalMass;
  const ny = (a.mass * a.y + b.mass * b.y) / totalMass;
  const nvx = (a.mass * a.vx + b.mass * b.vx) / totalMass;
  const nvy = (a.mass * a.vy + b.mass * b.vy) / totalMass;
  const nr = Math.sqrt(a.radius ** 2 + b.radius ** 2);
  const ntype = totalMass >= PLANET_MASS_THRESHOLD ? "planet" : totalMass >= 1.5 ? "rock" : "dust";
  const nHue = (a.hue + b.hue) / 2;
  const lifeProgress = Math.max(a.lifeProgress, b.lifeProgress);
  const inHab = a.inHabitableZone || b.inHabitableZone;
  const result = makeBody(ntype, nx, ny, nvx, nvy, totalMass, nr, nHue);
  result.lifeProgress = lifeProgress;
  result.inHabitableZone = inHab;
  // Preserve name + saveId if either body had them (the larger one wins).
  if (a.saveId || b.saveId) {
    const keeper = a.mass >= b.mass ? a : b;
    result.name = keeper.name;
    result.saveId = keeper.saveId;
  }
  return result;
}

// Shatter a body into debris when a high-speed collision occurs.
function shatterBody(body: Body, relVx: number, relVy: number): Body[] {
  const pieces: Body[] = [];
  const count = Math.min(5, Math.max(2, Math.floor(body.mass / 2)));
  const pieceMass = body.mass / count;
  const pieceRadius = Math.cbrt(body.radius ** 3 / count);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const spread = 15 + Math.random() * 20;
    const px = body.x + Math.cos(angle) * body.radius;
    const py = body.y + Math.sin(angle) * body.radius;
    const pvx = body.vx + Math.cos(angle) * spread + relVx * 0.2;
    const pvy = body.vy + Math.sin(angle) * spread + relVy * 0.2;
    pieces.push(makeBody("rock", px, py, pvx, pvy, pieceMass, pieceRadius, body.hue + (Math.random() - 0.5) * 20));
  }
  return pieces;
}

// ---- Solar system persistence ----
// Life planets are saved to localStorage so they persist between sessions.
// Dust and rocks are transient (regenerated each session). Each life planet
// maps to a save data entry: cosmogenesis_save_{saveId}.
const SOLAR_SYSTEM_KEY = "cosmogenesis_solar_system";
const SAVE_PREFIX = "cosmogenesis_save_";

interface PersistedPlanet {
  id: number;
  name: string;
  saveId: string;
  x: number; y: number;
  vx: number; vy: number;
  mass: number;
  radius: number;
  hue: number;
  lifeProgress: number;
}

function loadSolarSystem(): PersistedPlanet[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(SOLAR_SYSTEM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSolarSystem(planets: PersistedPlanet[]) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(SOLAR_SYSTEM_KEY, JSON.stringify(planets));
  } catch { /* ignore */ }
}

interface SolarGenesisProps {
  onComplete: (saveId?: string) => void;
}

export function SolarGenesis({ onComplete }: SolarGenesisProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodiesRef = useRef<Body[]>([]);
  const starRef = useRef<Star>({ x: 0, y: 0, mass: STAR_MASS, radius: 22, pulse: 0 });
  const mouseRef = useRef<{ x: number; y: number; down: boolean }>({ x: 0, y: 0, down: false });
  const cameraRef = useRef<{ zoom: number; offsetX: number; offsetY: number }>({ zoom: 0.8, offsetX: 0, offsetY: 0 });
  const animRef = useRef<number>(0);
  const dustSpawnTimerRef = useRef<number>(0);
  const [hasLifePlanet, setHasLifePlanet] = useState(false);
  const [planetCount, setPlanetCount] = useState(0);
  const [dustCount, setDustCount] = useState(DUST_COUNT);
  const [rockCount, setRockCount] = useState(0);
  // Refs mirror the state values so the animation loop can read them
  // without being recreated when they change. This prevents the
  // requestAnimationFrame loop from being cancelled + restarted dozens
  // of times per second during merging (which was preventing the dust
  // spawn timer from ever firing).
  const hasLifePlanetRef = useRef(false);
  const planetCountRef = useRef(0);
  const dustCountRef = useRef(DUST_COUNT);
  const rockCountRef = useRef(0);
  const [selectedPlanetId, setSelectedPlanetId] = useState<number | null>(null);
  const selectedPlanetIdRef = useRef<number | null>(null);
  const saveTimerRef = useRef<number>(0);
  const [selectedPlanetName, setSelectedPlanetName] = useState("");

  // Wrapper that updates both the state and the ref together.
  const selectPlanet = useCallback((id: number | null) => {
    selectedPlanetIdRef.current = id;
    setSelectedPlanetId(id);
    if (id !== null) {
      const p = bodiesRef.current.find((b) => b.id === id);
      setSelectedPlanetName(p?.name || "");
    } else {
      setSelectedPlanetName("");
    }
  }, []);

  // ---- Initialize ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    starRef.current.x = w / 2;
    starRef.current.y = h / 2;
    // Load persisted life planets + fresh dust.
    const persisted = loadSolarSystem();
    const planetBodies: Body[] = persisted.map((p) => ({
      id: p.id,
      type: "planet" as const,
      x: p.x, y: p.y,
      vx: p.vx, vy: p.vy,
      mass: p.mass,
      radius: p.radius,
      hue: p.hue,
      trail: [],
      lifeProgress: p.lifeProgress,
      inHabitableZone: true,
      name: p.name,
      saveId: p.saveId,
    }));
    // Ensure nextId doesn't collide with persisted IDs.
    const maxId = planetBodies.reduce((mx, b) => Math.max(mx, b.id), 0);
    nextId = Math.max(nextId, maxId + 1);
    bodiesRef.current = [...planetBodies, ...initDust(starRef.current.x, starRef.current.y)];
    cameraRef.current.offsetX = w / 2;
    cameraRef.current.offsetY = h / 2;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Manual zoom via mouse wheel — user controls zoom entirely.
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = cameraRef.current;
      const zoomDelta = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      cam.zoom = Math.max(0.2, Math.min(3.0, cam.zoom * zoomDelta));
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // ---- Physics + render loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const star = starRef.current;
      const bodies = bodiesRef.current;
      const mouse = mouseRef.current;
      const cam = cameraRef.current;

      // ---- Physics step ----
      star.pulse += DT * 0.5;

      // Apply star gravity + cursor gravity
      for (const b of bodies) {
        const dx = star.x - b.x;
        const dy = star.y - b.y;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2);
        if (r < star.radius) {
          // Consumed by star — if this is a life planet with a save, delete the save.
          if (b.type === "planet" && b.lifeProgress >= 1.0 && b.saveId) {
            try { localStorage.removeItem(`${SAVE_PREFIX}${b.saveId}`); } catch { /* ignore */ }
            if (b.id === selectedPlanetIdRef.current) {
              setSelectedPlanetId(null);
              setSelectedPlanetName("");
            }
          }
          b.mass = 0;
          continue;
        }

        // ORBIT LOCKING — life planets (lifeProgress >= 1.0) that are NOT
        // selected have their orbits locked: they maintain a stable circular
        // orbit and are immune to the cursor gravity well. This prevents
        // accidentally pulling a save-planet out of orbit when clicking near
        // it. Selecting a planet unlocks its orbit (so the player can push
        // it into the sun to delete the save).
        const isLockedLifePlanet = b.type === "planet" && b.lifeProgress >= 1.0 && b.id !== selectedPlanetIdRef.current;
        if (isLockedLifePlanet) {
          // Clamp velocity to ideal circular orbital velocity for this radius.
          // This keeps the planet in a stable orbit indefinitely.
          const idealV = Math.sqrt((G * STAR_MASS) / r);
          const vMag = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          if (vMag > 0) {
            const scale = idealV / vMag;
            b.vx *= scale;
            b.vy *= scale;
          }
          // Skip cursor gravity + damping for locked planets.
          b.vx += (dx / r) * ((G * STAR_MASS) / Math.max(r2, 100)) * DT;
          b.vy += (dy / r) * ((G * STAR_MASS) / Math.max(r2, 100)) * DT;
          b.x += b.vx * DT;
          b.y += b.vy * DT;
          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > TRAIL_LENGTH) b.trail.shift();
          continue;
        }

        const starForce = (G * STAR_MASS) / Math.max(r2, 100);
        let ax = (dx / r) * starForce;
        let ay = (dy / r) * starForce;

        // Cursor gravity well — convert mouse from screen space to world space.
        // The camera applies: screen = (world - star) * zoom + offset
        // So: world = (screen - offset) / zoom + star
        if (mouse.down) {
          const worldMx = (mouse.x - cam.offsetX) / cam.zoom + star.x;
          const worldMy = (mouse.y - cam.offsetY) / cam.zoom + star.y;
          const cdx = worldMx - b.x;
          const cdy = worldMy - b.y;
          const cr = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cr < CURSOR_RANGE && cr > 1) {
            const cursorForce = (G * CURSOR_MASS) / Math.max(cr * cr, 50);
            ax += (cdx / cr) * cursorForce;
            ay += (cdy / cr) * cursorForce;
            // Velocity damping within the gravity well — simulates
            // inter-particle collisions that dissipate kinetic energy,
            // allowing material to accrete rather than fling past.
            // Strong damping (0.93/tick) so long holds reliably merge
            // all nearby dust into progressively larger bodies.
            b.vx *= 0.93;
            b.vy *= 0.93;
          }
        }

        b.vx += ax * DT;
        b.vy += ay * DT;
        b.x += b.vx * DT;
        b.y += b.vy * DT;

        // Trail
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > TRAIL_LENGTH) b.trail.shift();

        // Habitable zone check (planets only)
        if (b.type === "planet") {
          const orbR = dist(b.x, b.y, star.x, star.y);
          const inZone = orbR >= HABITABLE_INNER && orbR <= HABITABLE_OUTER;
          b.inHabitableZone = inZone;
          if (inZone) {
            // Check orbit stability — velocity should be roughly perpendicular to radius
            const vMag = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            const idealV = Math.sqrt((G * STAR_MASS) / orbR);
            const speedRatio = vMag / idealV;
            const stability = 1 - Math.abs(speedRatio - 1);
            if (stability > 0.5) {
              b.lifeProgress = Math.min(1, b.lifeProgress + LIFE_RATE * DT * stability);
            }
          }
        }
      }

      // Remove bodies consumed by star
      bodiesRef.current = bodies.filter((b) => b.mass > 0);

      // ---- Collision detection ----
      const alive = bodiesRef.current;
      const merged: Set<number> = new Set();
      const newBodies: Body[] = [];

      for (let i = 0; i < alive.length; i++) {
        if (merged.has(alive[i].id)) continue;
        for (let j = i + 1; j < alive.length; j++) {
          if (merged.has(alive[j].id)) continue;
          const a = alive[i];
          const b = alive[j];
          const d = dist(a.x, a.y, b.x, b.y);
          // Sticky zone — bodies within a small extra radius merge more
          // easily. This simulates gravitational attraction between nearby
          // bodies without full N-body computation.
          const stickyBonus = (a.type !== "dust" || b.type !== "dust") ? 4 : 2;
          if (d < a.radius + b.radius + stickyBonus) {
            const relVx = b.vx - a.vx;
            const relVy = b.vy - a.vy;
            const relSpeed = Math.sqrt(relVx * relVx + relVy * relVy);
            // LIFE PLANET PROTECTION — locked life planets (lifeProgress >= 1.0,
            // not selected) are immune to destructive collisions. They absorb
            // incoming bodies (merge) regardless of relative speed. This
            // prevents accidentally destroying a save-planet when pulling dust
            // near it with the gravity well.
            const aIsLockedLife = a.type === "planet" && a.lifeProgress >= 1.0 && a.id !== selectedPlanetIdRef.current;
            const bIsLockedLife = b.type === "planet" && b.lifeProgress >= 1.0 && b.id !== selectedPlanetIdRef.current;
            if (aIsLockedLife || bIsLockedLife) {
              // Always merge — the life planet absorbs the other body.
              // The life planet's name/saveId/lifeProgress are preserved by
              // mergeBodies (larger mass wins).
              const merged_body = mergeBodies(a, b);
              merged.add(a.id);
              merged.add(b.id);
              newBodies.push(merged_body);
              break;
            }
            if (relSpeed < MERGE_SPEED_THRESHOLD) {
              // Merge
              const merged_body = mergeBodies(a, b);
              merged.add(a.id);
              merged.add(b.id);
              newBodies.push(merged_body);
              break;
            } else if (relSpeed > SHATTER_MIN_SPEED && (a.type === "planet" || b.type === "planet")) {
              // Destructive collision — shatter the planet
              const planetBody = a.type === "planet" ? a : b;
              const otherBody = a.type === "planet" ? b : a;
              merged.add(a.id);
              merged.add(b.id);
              const debris = shatterBody(planetBody, relVx, relVy);
              newBodies.push(...debris);
              // The other body survives with reduced mass
              if (otherBody.mass > 1) {
                otherBody.mass *= 0.7;
                otherBody.radius = Math.cbrt(otherBody.radius ** 3 * 0.7);
              }
              newBodies.push(otherBody);
              break;
            } else {
              // Bounce (elastic collision approximation)
              const nx = (b.x - a.x) / d;
              const ny = (b.y - a.y) / d;
              const dvx = b.vx - a.vx;
              const dvy = b.vy - a.vy;
              const dot = dvx * nx + dvy * ny;
              if (dot < 0) {
                const totalMass = a.mass + b.mass;
                const impulse = (2 * dot) / totalMass;
                a.vx += impulse * b.mass * nx;
                a.vy += impulse * b.mass * ny;
                b.vx -= impulse * a.mass * nx;
                b.vy -= impulse * a.mass * ny;
              }
            }
          }
        }
      }

      // Add surviving + new bodies
      const finalBodies = alive.filter((b) => !merged.has(b.id)).concat(newBodies);
      bodiesRef.current = finalBodies;

      // ---- Camera: manual zoom only (user controls via wheel) ----
      const w = canvas.width;
      const h = canvas.height;
      cam.offsetX = w / 2;
      cam.offsetY = h / 2;

      // ---- Continuous dust spawning — maintain ~TARGET_DUST particles ----
      dustSpawnTimerRef.current -= DT;
      if (dustSpawnTimerRef.current <= 0) {
        dustSpawnTimerRef.current = DUST_SPAWN_INTERVAL;
        const currentDust = finalBodies.filter((b) => b.type === "dust").length;
        if (currentDust < TARGET_DUST) {
          const toSpawn = Math.min(10, TARGET_DUST - currentDust);
          for (let i = 0; i < toSpawn; i++) {
            finalBodies.push(spawnDust(star.x, star.y));
          }
          bodiesRef.current = finalBodies;
        }
      }

      // ---- Update React state (throttled by comparing values) ----
      const planets = finalBodies.filter((b) => b.type === "planet");
      const dust = finalBodies.filter((b) => b.type === "dust").length;
      const rocks = finalBodies.filter((b) => b.type === "rock").length;

      // Assign saveId + default name to planets that just developed life.
      for (const p of planets) {
        if (p.lifeProgress >= 1.0 && !p.saveId) {
          p.saveId = `planet_${p.id}_${Date.now()}`;
          p.name = p.name || `Planet ${p.id}`;
        }
      }

      const hasLife = planets.some((p) => p.lifeProgress > 0.99);
      if (planets.length !== planetCountRef.current) { planetCountRef.current = planets.length; setPlanetCount(planets.length); }
      if (dust !== dustCountRef.current) { dustCountRef.current = dust; setDustCount(dust); }
      if (rocks !== rockCountRef.current) { rockCountRef.current = rocks; setRockCount(rocks); }
      if (hasLife && !hasLifePlanetRef.current) { hasLifePlanetRef.current = true; setHasLifePlanet(true); }
      if (!hasLife && hasLifePlanetRef.current) { hasLifePlanetRef.current = false; setHasLifePlanet(false); selectPlanet(null); }

      // ---- Periodic solar system save (every ~5 seconds) ----
      saveTimerRef.current -= DT;
      if (saveTimerRef.current <= 0) {
        saveTimerRef.current = 5;
        const toSave: PersistedPlanet[] = planets
          .filter((p) => p.lifeProgress >= 1.0 && p.saveId)
          .map((p) => ({
            id: p.id, name: p.name || "", saveId: p.saveId!,
            x: p.x, y: p.y, vx: p.vx, vy: p.vy,
            mass: p.mass, radius: p.radius, hue: p.hue,
            lifeProgress: p.lifeProgress,
          }));
        saveSolarSystem(toSave);
      }

      // ---- Render ----
      ctx.fillStyle = "rgba(3, 3, 12, 1)";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(cam.offsetX, cam.offsetY);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-star.x, -star.y);

      // Habitable zone ring
      ctx.strokeStyle = "rgba(52, 211, 153, 0.15)";
      ctx.lineWidth = 1.5 / cam.zoom;
      ctx.setLineDash([6 / cam.zoom, 8 / cam.zoom]);
      ctx.beginPath();
      ctx.arc(star.x, star.y, HABITABLE_INNER, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(star.x, star.y, HABITABLE_OUTER, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Habitable zone fill (subtle green tint)
      const habGrad = ctx.createRadialGradient(star.x, star.y, HABITABLE_INNER, star.x, star.y, HABITABLE_OUTER);
      habGrad.addColorStop(0, "rgba(52, 211, 153, 0)");
      habGrad.addColorStop(0.5, "rgba(52, 211, 153, 0.04)");
      habGrad.addColorStop(1, "rgba(52, 211, 153, 0)");
      ctx.fillStyle = habGrad;
      ctx.beginPath();
      ctx.arc(star.x, star.y, HABITABLE_OUTER, 0, Math.PI * 2);
      ctx.arc(star.x, star.y, HABITABLE_INNER, 0, Math.PI * 2, true);
      ctx.fill();

      // Star
      const starGlow = 1 + Math.sin(star.pulse) * 0.05;
      const starGrad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 4 * starGlow);
      starGrad.addColorStop(0, "rgba(255, 240, 180, 1)");
      starGrad.addColorStop(0.2, "rgba(255, 200, 100, 0.6)");
      starGrad.addColorStop(0.5, "rgba(255, 150, 50, 0.15)");
      starGrad.addColorStop(1, "rgba(255, 100, 0, 0)");
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius * 4 * starGlow, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 245, 200, 1)";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius * starGlow, 0, Math.PI * 2);
      ctx.fill();

      // Bodies + trails
      for (const b of finalBodies) {
        // Trail
        if (b.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(b.trail[0].x, b.trail[0].y);
          for (let i = 1; i < b.trail.length; i++) {
            ctx.lineTo(b.trail[i].x, b.trail[i].y);
          }
          const trailAlpha = b.type === "planet" ? 0.3 : b.type === "rock" ? 0.15 : 0.08;
          ctx.strokeStyle = `hsla(${b.hue}, 60%, 70%, ${trailAlpha})`;
          ctx.lineWidth = b.radius * 0.5;
          ctx.stroke();
        }

        // Body glow
        if (b.type === "planet") {
          const glowR = b.radius * 3;
          const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, glowR);
          const lifeHue = b.lifeProgress > 0.5 ? 140 : 210;
          glow.addColorStop(0, `hsla(${lifeHue}, 70%, 60%, 0.3)`);
          glow.addColorStop(1, `hsla(${lifeHue}, 70%, 60%, 0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(b.x, b.y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Body
        if (b.type === "dust") {
          ctx.fillStyle = `hsla(${b.hue}, 40%, 75%, 0.6)`;
        } else if (b.type === "rock") {
          ctx.fillStyle = `hsla(${b.hue}, 25%, 55%, 0.85)`;
        } else {
          // Planet — color shifts with life progress
          const life = b.lifeProgress;
          if (life < 0.01) {
            ctx.fillStyle = `hsla(${b.hue}, 30%, 50%, 1)`;
          } else if (life < 0.5) {
            // Gray -> blue (oceans forming)
            const t = life * 2;
            const h = b.hue * (1 - t) + 210 * t;
            ctx.fillStyle = `hsla(${h}, ${30 + t * 40}%, ${50 + t * 10}%, 1)`;
          } else {
            // Blue -> green (life developing)
            const t = (life - 0.5) * 2;
            const h = 210 * (1 - t) + 140 * t;
            ctx.fillStyle = `hsla(${h}, ${70 - t * 10}%, ${60 - t * 5}%, 1)`;
          }
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Life indicator ring
        if (b.type === "planet" && b.lifeProgress > 0.01) {
          ctx.strokeStyle = `hsla(140, 70%, 60%, ${b.lifeProgress * 0.6})`;
          ctx.lineWidth = 1 / cam.zoom;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius + 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Cursor gravity well (rendered in screen space, not world space)
      ctx.restore();
      if (mouse.down) {
        const cursorGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, CURSOR_RANGE);
        cursorGrad.addColorStop(0, "rgba(167, 139, 250, 0.12)");
        cursorGrad.addColorStop(0.5, "rgba(167, 139, 250, 0.04)");
        cursorGrad.addColorStop(1, "rgba(167, 139, 250, 0)");
        ctx.fillStyle = cursorGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, CURSOR_RANGE, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(167, 139, 250, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // ---- Mouse handlers ----
  // Clicking a life planet SELECTS it (doesn't create a gravity well).
  // Clicking empty space or the SELECTED planet activates the gravity well
  // (so the player can push the selected planet into the sun to delete it).
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const cam = cameraRef.current;
    const star = starRef.current;
    const wx = (sx - cam.offsetX) / cam.zoom + star.x;
    const wy = (sy - cam.offsetY) / cam.zoom + star.y;

    // Check if clicking on an unselected life planet → select it, no gravity well.
    for (const b of bodiesRef.current) {
      if (b.type === "planet" && b.lifeProgress >= 1.0 && b.id !== selectedPlanetIdRef.current) {
        if (dist(wx, wy, b.x, b.y) < b.radius + 8) {
          setSelectedPlanetId(b.id);
          setSelectedPlanetName(b.name || "");
          return; // Don't activate gravity well.
        }
      }
    }

    // Clicking on empty space when a planet is selected → deselect.
    if (selectedPlanetIdRef.current !== null) {
      let clickedOnSelected = false;
      for (const b of bodiesRef.current) {
        if (b.id === selectedPlanetIdRef.current && dist(wx, wy, b.x, b.y) < b.radius + 8) {
          clickedOnSelected = true;
          break;
        }
      }
      if (!clickedOnSelected) {
        setSelectedPlanetId(null);
        setSelectedPlanetName("");
      }
    }

    // Activate gravity well (for dust pulling OR pushing the selected planet).
    mouseRef.current.x = sx;
    mouseRef.current.y = sy;
    mouseRef.current.down = true;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  }, []);

  const handlePointerUp = useCallback(() => {
    mouseRef.current.down = false;
  }, []);

  return (
    <div className="fixed inset-0 bg-[#03030c] flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* UI overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
        <h1 className="text-2xl font-light tracking-wide text-amber-100/90 mb-1">
          Solar Genesis
        </h1>
        {selectedPlanetId !== null ? (
          <p className="text-sm text-emerald-300/90 max-w-md">
            Selected. Press Begin to start, or hold near the planet to push it into the sun (delete).
          </p>
        ) : !hasLifePlanet ? (
          <p className="text-sm text-slate-400/80 max-w-md">
            Hold to pull dust together. Scroll to zoom. Guide a planet into the green ring to seed life.
          </p>
        ) : (
          <p className="text-sm text-emerald-300/90 max-w-md">
            Life detected. Click a green planet to select it.
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="absolute bottom-6 left-6 text-xs text-slate-500/70 font-mono pointer-events-none z-10 space-y-0.5">
        <div>Dust: {dustCount}</div>
        <div>Rocks: {rockCount}</div>
        <div>Planets: {planetCount}</div>
        {hasLifePlanet && <div className="text-emerald-400/80">Life: detected</div>}
      </div>

      {/* Selected planet panel: name input + Begin button */}
      {selectedPlanetId !== null && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          <input
            type="text"
            value={selectedPlanetName}
            onChange={(e) => {
              const name = e.target.value.slice(0, 24);
              setSelectedPlanetName(name);
              const p = bodiesRef.current.find((b) => b.id === selectedPlanetId);
              if (p) p.name = name;
            }}
            placeholder="Name this world…"
            maxLength={24}
            className="bg-[#0a0a1a] border border-emerald-400/30 rounded px-3 py-2 text-sm text-emerald-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/60"
          />
          <Button
            size="lg"
            className="px-8 py-3 text-base bg-emerald-600/80 hover:bg-emerald-500 border border-emerald-400/40 text-emerald-50 shadow-lg shadow-emerald-500/20"
            onClick={() => {
              const p = bodiesRef.current.find((b) => b.id === selectedPlanetId);
              onComplete(p?.saveId);
            }}
          >
            Begin
          </Button>
        </div>
      )}
    </div>
  );
}
