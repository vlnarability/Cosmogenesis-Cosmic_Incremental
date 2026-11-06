"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

// ============================================================
// C3 — HEX MAP COMPONENT
// A reusable SVG hex-grid map for the star system (L4), galaxy (L5),
// and universe (L6) layers. Based on the user's sample code with
// axial-coordinate hex generation.
//
// Features:
// - Procedural hex generation (50 connected hexes with 1-6 neighbors)
// - Pointy-top hexagons rendered as SVG <polygon>
// - Click-to-select with visual highlight
// - Per-hex color/fill/label customization
// - Auto-computed viewBox bounds
// - Dot-grid background pattern
// ============================================================

export type HexCoord = { q: number; r: number; id: string };

export interface HexCell {
  id: string;
  q: number;
  r: number;
  fill?: string;        // CSS color for the hex fill
  stroke?: string;      // CSS color for the hex border
  strokeWidth?: number;
  label?: string;       // Short text inside the hex
  icon?: string;        // Emoji/icon inside the hex
  glow?: boolean;       // Pulsing glow effect
  dimmed?: boolean;     // Reduced opacity
}

const DIRECTIONS = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];

/** Generate N connected hexes using the user's weighted-growth algorithm. */
export function generateHexMap(totalHexes = 50, coreSize = 18): HexCoord[] {
  const mapSet = new Map<string, HexCoord>();
  const origin: HexCoord = { q: 0, r: 0, id: "0,0" };
  mapSet.set(origin.id, origin);
  let lastPlaced = origin;

  const getNeighborCount = (q: number, r: number) => {
    let count = 0;
    for (const dir of DIRECTIONS) {
      if (mapSet.has(`${q + dir.q},${r + dir.r}`)) count++;
    }
    return count;
  };

  while (mapSet.size < totalHexes) {
    const currentCount = mapSet.size;
    const frontier: { q: number; r: number; weight: number }[] = [];
    const visitedFrontier = new Set<string>();

    for (const hex of mapSet.values()) {
      for (const dir of DIRECTIONS) {
        const nq = hex.q + dir.q;
        const nr = hex.r + dir.r;
        const key = `${nq},${nr}`;

        if (!mapSet.has(key) && !visitedFrontier.has(key)) {
          visitedFrontier.add(key);
          const touchingNeighbors = getNeighborCount(nq, nr);

          let weight = 1;
          if (currentCount < coreSize) {
            weight = Math.pow(touchingNeighbors, 3);
          } else {
            const rand = Math.random();
            if (rand < 0.45) {
              const distToLast = Math.max(
                Math.abs(nq - lastPlaced.q),
                Math.abs(nr - lastPlaced.r),
                Math.abs((nq + nr) - (lastPlaced.q + lastPlaced.r))
              );
              weight = distToLast === 1 ? 8 : 1;
            } else if (rand < 0.8) {
              weight = 2;
            } else {
              weight = touchingNeighbors >= 2 ? 4 : 1;
            }
          }
          frontier.push({ q: nq, r: nr, weight });
        }
      }
    }

    const totalWeight = frontier.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    let selected = frontier[0];
    for (const item of frontier) {
      roll -= item.weight;
      if (roll <= 0) { selected = item; break; }
    }

    const newHex: HexCoord = { q: selected.q, r: selected.r, id: `${selected.q},${selected.r}` };
    mapSet.set(newHex.id, newHex);
    lastPlaced = newHex;
  }

  return Array.from(mapSet.values());
}

/** Convert axial (q, r) to pixel (x, y) for pointy-top hexagons. */
function axialToPixel(q: number, r: number, radius: number): { x: number; y: number } {
  const x = radius * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = radius * ((3 / 2) * r);
  return { x, y };
}

/** SVG points string for a pointy-topped regular hexagon of given radius. */
function hexPoints(radius: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i - 30);
    points.push(`${radius * Math.cos(angleRad)},${radius * Math.sin(angleRad)}`);
  }
  return points.join(" ");
}

export interface HexMapProps {
  /** The hex cells to render (positions + per-cell styling). */
  cells: HexCell[];
  /** Hex radius in SVG units (default 30). */
  hexRadius?: number;
  /** Called when a hex is clicked (cell id). */
  onHexClick?: (id: string) => void;
  /** The currently selected hex id (gets a highlight ring). */
  selectedId?: string | null;
  /** Optional title shown above the map. */
  title?: string;
  /** Optional subtitle. */
  subtitle?: string;
  /** className for the outer container. */
  className?: string;
  /** UI-FIX: Optional tooltip renderer — returns a string for a given cell
   * that is displayed as a native HTML title tooltip on hover. */
  hexTooltip?: (cell: HexCell) => string;
  /** Blocker 2 — transient id of a hex that should "flash" (e.g. on scan or
   * claim success). The parent clears this after ~600ms; while set, the
   * matching hex renders an animated cyan overlay on top of its polygon. */
  flashId?: string | null;
}

export function HexMap({
  cells,
  hexRadius = 30,
  onHexClick,
  selectedId,
  title,
  subtitle,
  className,
  hexTooltip,
  flashId,
}: HexMapProps) {
  const points = useMemo(() => hexPoints(hexRadius), [hexRadius]);

  // Compute the SVG viewBox from the hex positions.
  const bounds = useMemo(() => {
    const hexWidth = Math.sqrt(3) * hexRadius;
    const hexHeight = 2 * hexRadius;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const cell of cells) {
      const { x, y } = axialToPixel(cell.q, cell.r, hexRadius);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return {
      viewBox: `${minX - hexWidth} ${minY - hexHeight} ${maxX - minX + hexWidth * 2} ${maxY - minY + hexHeight * 2}`,
    };
  }, [cells, hexRadius]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {title && (
        <div className="mb-2 text-center">
          <h3 className="text-sm font-bold tracking-wider text-foreground uppercase">{title}</h3>
          {subtitle && <p className="text-[0.65rem] text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="w-full aspect-video border border-border/40 bg-muted/5 rounded-xl p-2 flex items-center justify-center overflow-hidden">
        <svg
          viewBox={bounds.viewBox}
          className="w-full h-full max-h-[60vh] drop-shadow-[0_0_15px_rgba(34,211,238,0.08)]"
        >
          <defs>
            <pattern id="hex-dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.15" />
            </pattern>
          </defs>
          <rect x="-2000" y="-2000" width="4000" height="4000" fill="url(#hex-dot-grid)" pointerEvents="none" />

          {cells.map((cell) => {
            const { x, y } = axialToPixel(cell.q, cell.r, hexRadius);
            const isSelected = selectedId === cell.id;
            const isOrigin = cell.q === 0 && cell.r === 0;
            return (
              <g
                key={cell.id}
                transform={`translate(${x}, ${y})`}
                className={cn("group", onHexClick && "cursor-pointer")}
                onClick={() => onHexClick?.(cell.id)}
                opacity={cell.dimmed ? 0.4 : 1}
              >
                {/* UI-FIX: Add hover tooltip via a <title> element inside the <g> */}
                {hexTooltip && (
                  <title>{hexTooltip(cell)}</title>
                )}
                <polygon
                  points={points}
                  className={cn("transition-colors duration-200")}
                  fill={cell.fill || (isOrigin ? "rgba(34,211,238,0.15)" : "rgba(15,23,42,0.8)")}
                  stroke={cell.stroke || (isSelected ? "#fcd34d" : isOrigin ? "#22d3ee" : "rgba(71,85,105,0.6)")}
                  strokeWidth={cell.strokeWidth ?? (isSelected ? 2.5 : isOrigin ? 2 : 1)}
                />
                {cell.glow && (
                  <circle cx="0" cy="0" r="3" className="fill-white animate-ping" />
                )}
                {(cell.icon || cell.label) && (
                  <text
                    x="0" y="0"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={hexRadius * 0.45}
                    fill="currentColor"
                    className="pointer-events-none select-none"
                    style={{ fontFamily: "monospace" }}
                  >
                    {cell.icon || cell.label}
                  </text>
                )}
                {isSelected && (
                  <polygon
                    points={points}
                    fill="none"
                    stroke="#fcd34d"
                    strokeWidth="3"
                    className="pointer-events-none"
                    style={{ filter: "drop-shadow(0 0 4px rgba(252,211,77,0.5))" }}
                  />
                )}
                {/* Blocker 2 — transient success flash overlay. Rendered when
                    cell.id === flashId. The parent (GenesisModal) clears
                    flashId after 600ms so this never persists. Both children
                    are pointer-events-none so subsequent clicks pass through
                    to the underlying hex polygon handler. The polygon tints
                    the hex cyan (30% opacity) while the expanding circle
                    draws the player's eye to the affected hex. */}
                {flashId === cell.id && (
                  <>
                    <polygon
                      points={points}
                      className="fill-cyan-400/30 pointer-events-none"
                    />
                    <circle
                      cx="0"
                      cy="0"
                      r={hexRadius * 1.5}
                      className="animate-ping fill-cyan-400 pointer-events-none"
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
