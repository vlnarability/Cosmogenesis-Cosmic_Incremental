"use client";

import { ARCHETYPES, ARCHETYPE_MAP, dominantArchetype } from "@/game/data/archetypes";

// ============================================================
// ArchetypeRadar — radial spider chart showing archetype drift.
// Each archetype is a point on the circle. The distance from center
// = affinity value.
//
// ARCHETYPES-REWORK — all 13 archetypes render on the radar at all times.
// Undiscovered archetypes (those the player has NEVER locked in) display
// as "???" with a dim point — they reveal their name + glyph only once
// the player has locked them in at least once (tracked in
// `revealedLineageArchetypes` on GameState). The data polygon (current
// affinity distribution) still renders — players see which direction
// they're drifting even if they don't know what archetype lives there.
// ============================================================

interface ArchetypeRadarProps {
  affinity: Record<string, number>;
  lockedArchetype: string | null;
  discoveredArchetypes: Record<string, boolean>; // ARCHETYPES-REWORK — drives ??? reveal
  size?: number; // SVG size in px
}

export function ArchetypeRadar({
  affinity,
  lockedArchetype,
  discoveredArchetypes,
  size = 180,
}: ArchetypeRadarProps) {
  const center = size / 2;
  const maxRadius = size / 2 - 28; // padding for labels
  const totalAffinity = Object.values(affinity).reduce((a, b) => a + b, 0);
  const maxAffinity = Math.max(1, ...Object.values(affinity));
  const domArch = dominantArchetype(affinity);

  // All 13 archetypes render at all times — discovered ones show full
  // name + glyph; undiscovered ones show ??? with a dim point.
  const visibleArchetypes = ARCHETYPES;

  // Compute positions for each archetype on the circle
  const points = visibleArchetypes.map((arch, i) => {
    const angle = (i / visibleArchetypes.length) * Math.PI * 2 - Math.PI / 2;
    const value = affinity[arch.id] || 0;
    const normalizedR = totalAffinity > 0 ? (value / maxAffinity) * maxRadius : 0;
    return {
      arch,
      angle,
      value,
      discovered: !!discoveredArchetypes[arch.id],
      x: center + Math.cos(angle) * normalizedR,
      y: center + Math.sin(angle) * normalizedR,
      labelX: center + Math.cos(angle) * (maxRadius + 14),
      labelY: center + Math.sin(angle) * (maxRadius + 14),
    };
  });

  // Build polygon path from the data points
  const polygonPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ") + " Z";

  // Grid rings (25%, 50%, 75%, 100%)
  const gridRings = [0.25, 0.5, 0.75, 1.0].map((frac) => {
    const r = maxRadius * frac;
    const ringPoints = visibleArchetypes.map((_, i) => {
      const angle = (i / visibleArchetypes.length) * Math.PI * 2 - Math.PI / 2;
      return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
    }).join(" ");
    return { frac, points: ringPoints };
  });

  // Spokes from center to each archetype label position
  const spokes = visibleArchetypes.map((_, i) => {
    const angle = (i / visibleArchetypes.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x1: center,
      y1: center,
      x2: center + Math.cos(angle) * maxRadius,
      y2: center + Math.sin(angle) * maxRadius,
    };
  });

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Grid rings */}
        {gridRings.map((ring, i) => (
          <polygon
            key={i}
            points={ring.points}
            fill="none"
            stroke="oklch(0.30 0.015 260 / 0.3)"
            strokeWidth="0.5"
          />
        ))}

        {/* Spokes */}
        {spokes.map((s, i) => (
          <line
            key={i}
            x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="oklch(0.30 0.015 260 / 0.2)"
            strokeWidth="0.5"
          />
        ))}

        {/* Data polygon — always renders actual affinity distribution
            so the player sees their drift even on undiscovered archetypes. */}
        {totalAffinity > 0 && (
          <path
            d={polygonPath}
            fill="oklch(0.65 0.15 260 / 0.15)"
            stroke="oklch(0.65 0.15 260 / 0.6)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        )}

        {/* Data points — discovered archetypes get a bright colored dot,
            undiscovered ones get a dim gray dot (still shows drift). */}
        {points.map((p) => {
          const isDom = p.arch.id === domArch;
          const isLocked = p.arch.id === lockedArchetype;
          if (p.value === 0) return null;
          if (!p.discovered) {
            // Undiscovered — dim gray point regardless of dominance
            return (
              <circle
                key={p.arch.id}
                cx={p.x}
                cy={p.y}
                r={isLocked ? 3.5 : 2.5}
                fill="oklch(0.45 0.01 260 / 0.6)"
                stroke={isLocked ? "oklch(0.75 0 0 / 0.7)" : "none"}
                strokeWidth="1"
              />
            );
          }
          return (
            <circle
              key={p.arch.id}
              cx={p.x}
              cy={p.y}
              r={isLocked ? 4 : isDom ? 3.5 : 2.5}
              fill={p.arch.color}
              stroke={isLocked ? "oklch(0.95 0 0)" : "none"}
              strokeWidth="1"
            />
          );
        })}

        {/* Labels — discovered show name + glyph, undiscovered show ??? */}
        {points.map((p) => {
          const isDom = p.arch.id === domArch;
          const isLocked = p.arch.id === lockedArchetype;
          const label = p.discovered ? p.arch.name : "???";
          const glyph = p.discovered ? p.arch.glyph : "?";
          const labelColor = !p.discovered
            ? "oklch(0.45 0.01 260 / 0.7)"
            : isLocked
              ? p.arch.color
              : isDom
                ? p.arch.color
                : "oklch(0.55 0.01 260)";
          return (
            <g key={p.arch.id}>
              <text
                x={p.labelX}
                y={p.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fontWeight={isDom || isLocked ? "700" : "400"}
                fill={labelColor}
              >
                {glyph} {label}
              </text>
              {p.value > 0 && p.discovered && (
                <text
                  x={p.labelX}
                  y={p.labelY + 9}
                  textAnchor="middle"
                  fontSize="6.5"
                  fill="oklch(0.50 0.01 260)"
                >
                  {p.value.toFixed(0)}
                </text>
              )}
            </g>
          );
        })}

        {/* Center dot */}
        <circle cx={center} cy={center} r="1.5" fill="oklch(0.40 0.01 260)" />
      </svg>
    </div>
  );
}
