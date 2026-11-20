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
const CURSOR_MASS = 6000;
const DT = 1 / 60;
const DUST_COUNT = 70;
const HABITABLE_INNER = 150;
const HABITABLE_OUTER = 260;
const MERGE_SPEED_THRESHOLD = 60;
const PLANET_MASS_THRESHOLD = 6;
const LIFE_RATE = 0.04;
const TRAIL_LENGTH = 18;
const CURSOR_RANGE = 200;
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

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// Merge two bodies conserving momentum and mass.
function mergeBodies(a: Body, b: Body): Body {
  const totalMass = a.mass + b.mass;
  const nx = (a.mass * a.x + b.mass * b.x) / totalMass;
  const ny = (a.mass * a.y + b.mass * b.y) / totalMass;
  const nvx = (a.mass * a.vx + b.mass * b.vx) / totalMass;
  const nvy = (a.mass * a.vy + b.mass * b.vy) / totalMass;
  const nr = Math.cbrt(a.radius ** 3 + b.radius ** 3);
  const ntype = totalMass >= PLANET_MASS_THRESHOLD ? "planet" : totalMass >= 1.5 ? "rock" : "dust";
  const nHue = (a.hue + b.hue) / 2;
  const lifeProgress = Math.max(a.lifeProgress, b.lifeProgress);
  const inHab = a.inHabitableZone || b.inHabitableZone;
  return makeBody(ntype, nx, ny, nvx, nvy, totalMass, nr, nHue);
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

interface SolarGenesisProps {
  onComplete: () => void;
}

export function SolarGenesis({ onComplete }: SolarGenesisProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodiesRef = useRef<Body[]>([]);
  const starRef = useRef<Star>({ x: 0, y: 0, mass: STAR_MASS, radius: 22, pulse: 0 });
  const mouseRef = useRef<{ x: number; y: number; down: boolean }>({ x: 0, y: 0, down: false });
  const cameraRef = useRef<{ zoom: number; offsetX: number; offsetY: number }>({ zoom: 1, offsetX: 0, offsetY: 0 });
  const animRef = useRef<number>(0);
  const [hasLifePlanet, setHasLifePlanet] = useState(false);
  const [planetCount, setPlanetCount] = useState(0);
  const [dustCount, setDustCount] = useState(DUST_COUNT);
  const [rockCount, setRockCount] = useState(0);
  const [selectedPlanetId, setSelectedPlanetId] = useState<number | null>(null);

  // ---- Initialize ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    starRef.current.x = w / 2;
    starRef.current.y = h / 2;
    bodiesRef.current = initDust(starRef.current.x, starRef.current.y);
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
    return () => window.removeEventListener("resize", handleResize);
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
          // Consumed by star
          b.mass = 0;
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
            // Without this, bodies orbit the cursor at high speed and
            // never slow down enough to merge.
            b.vx *= 0.97;
            b.vy *= 0.97;
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

      // ---- Camera zoom ----
      let maxDist = 0;
      for (const b of finalBodies) {
        const d = dist(b.x, b.y, star.x, star.y);
        if (d > maxDist) maxDist = d;
      }
      const w = canvas.width;
      const h = canvas.height;
      const targetZoom = Math.min(1.0, (Math.min(w, h) * 0.42) / Math.max(maxDist, HABITABLE_OUTER + 50));
      cam.zoom += (targetZoom - cam.zoom) * 0.02;
      cam.offsetX = w / 2;
      cam.offsetY = h / 2;

      // ---- Update React state (throttled by comparing values) ----
      const planets = finalBodies.filter((b) => b.type === "planet");
      const dust = finalBodies.filter((b) => b.type === "dust").length;
      const rocks = finalBodies.filter((b) => b.type === "rock").length;
      const hasLife = planets.some((p) => p.lifeProgress > 0.99);
      if (planets.length !== planetCount) setPlanetCount(planets.length);
      if (dust !== dustCount) setDustCount(dust);
      if (rocks !== rockCount) setRockCount(rocks);
      if (hasLife && !hasLifePlanet) {
        setHasLifePlanet(true);
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
  }, [hasLifePlanet, planetCount, dustCount]);

  // ---- Mouse handlers ----
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
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

  // ---- Click a planet to select it ----
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!hasLifePlanet) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const cam = cameraRef.current;
    const star = starRef.current;
    // Screen -> world: (sx - offsetX) / zoom + starX
    const wx = (sx - cam.offsetX) / cam.zoom + star.x;
    const wy = (sy - cam.offsetY) / cam.zoom + star.y;
    for (const b of bodiesRef.current) {
      if (b.type === "planet" && b.lifeProgress > 0.99) {
        if (dist(wx, wy, b.x, b.y) < b.radius + 8) {
          setSelectedPlanetId(b.id);
          break;
        }
      }
    }
  }, [hasLifePlanet]);

  return (
    <div className="fixed inset-0 bg-[#03030c] flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
      />

      {/* UI overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
        <h1 className="text-2xl font-light tracking-wide text-amber-100/90 mb-1">
          Solar Genesis
        </h1>
        {!hasLifePlanet ? (
          <p className="text-sm text-slate-400/80 max-w-md">
            Hold to pull dust together. Guide a planet into the green habitable ring to seed life.
          </p>
        ) : (
          <p className="text-sm text-emerald-300/90 max-w-md">
            Life detected. Click the green planet to select it, then press Begin.
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

      {/* Begin button */}
      {hasLifePlanet && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <Button
            size="lg"
            className="px-8 py-3 text-base bg-emerald-600/80 hover:bg-emerald-500 border border-emerald-400/40 text-emerald-50 shadow-lg shadow-emerald-500/20"
            disabled={selectedPlanetId === null}
            onClick={onComplete}
          >
            {selectedPlanetId === null
              ? "Select a planet first"
              : "Begin"}
          </Button>
        </div>
      )}
    </div>
  );
}
