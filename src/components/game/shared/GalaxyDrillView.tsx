"use client";

import { useMemo } from "react";
import { useGameStore } from "@/game/state/store";
import {
  UNIVERSAL_GALAXY_MAP,
  WORLDS_PER_NEW_SYSTEM_L6,
} from "@/game/data/universalMap";
import { HexMap, type HexCell, type HexCoord } from "./HexMap";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Telescope, Swords, ChevronRight } from "lucide-react";

// ============================================================
// C4 — GalaxyDrillView
//
// Renders a synthesized hex-grid view of a single galaxy's
// star systems. Used when the player drills into a NON-STARTER
// galaxy from the L6 Singularity universal map.
//
// The starter galaxy ("galaxy_starter", owned by the player at
// L4 start) uses the real Genesis modal — it has a per-system
// claim mechanic with named systems + bonuses. Non-starter
// galaxies are abstract containers with a `systemCount` number
// and a `systemsClaimed` runtime counter (driven by the L6
// attack action).
//
// This view synthesizes a procedural hex map of `systemCount`
// hexes, marking the first `systemsClaimed` of them as
// "claimed" (color-coded by galaxy owner). Clicking a hex
// calls drillIntoCosmosSystem so the SystemDrillView can show
// a per-system detail panel (with an "Attack this system"
// action for new-L6 galaxies).
// ============================================================

export interface GalaxyDrillViewProps {
  /** Galaxy id drilled into. */
  galaxyId: string;
}

export function GalaxyDrillView({ galaxyId }: GalaxyDrillViewProps) {
  const galaxy = UNIVERSAL_GALAXY_MAP[galaxyId];
  const universalGalaxies = useGameStore((s) => s.universalGalaxies || []);
  const drillIntoCosmosSystem = useGameStore((s) => s.drillIntoCosmosSystem);
  const drillNav = useGameStore((s) => s.drillNav);
  const attackUniversalGalaxy = useGameStore((s) => s.attackUniversalGalaxy);
  const faith = useGameStore((s) => s.faith);
  const newGalaxyAttackCost = useGameStore((s) => {
    // compute via the same formula the modal uses
    const claimed = (s.universalGalaxies || [])
      .filter((g) => {
        const def = UNIVERSAL_GALAXY_MAP[g.id];
        return def?.isNewL6;
      })
      .reduce((sum, g) => sum + Math.max(0, Math.min(UNIVERSAL_GALAXY_MAP[g.id]?.systemCount || 0, g.systemsClaimed)), 0);
    return Math.ceil(50 * Math.pow(1.05, claimed));
  });

  // Hooks MUST run unconditionally (rules-of-hooks). Derive all values first,
  // then bail to null AFTER all hooks have executed.
  const state = universalGalaxies.find((g) => g.id === galaxyId);
  const systemCount = galaxy ? Math.max(1, Math.min(120, galaxy.systemCount)) : 1;
  const claimed = state ? Math.min(systemCount, state.systemsClaimed) : 0;
  const selectedSystemId = drillNav?.cosmos?.systemId ?? null;

  // Deterministic hex map for this galaxy (seeded by galaxy id hash so it's
  // stable across renders / reloads within the same session).
  const hexCoords = useMemo(
    () => generateHexMapSeeded(systemCount, hashStr(galaxyId)),
    [systemCount, galaxyId],
  );

  const hexCells: HexCell[] = useMemo(() => {
    if (!galaxy || !state) return [];
    const cells: HexCell[] = [];
    for (let i = 0; i < hexCoords.length; i++) {
      const hc = hexCoords[i];
      const isClaimed = i < claimed;
      const isOrigin = i === 0;
      const owner = state.ownerId;
      let fill: string;
      let stroke: string;
      let label: string | undefined;
      if (isClaimed) {
        if (owner === "player") {
          fill = "rgba(251,191,36,0.22)";
          stroke = "#fbbf24";
        } else if (owner.startsWith("rival_")) {
          fill = "rgba(244,114,182,0.22)";
          stroke = "#f472b6";
        } else {
          fill = "rgba(99,102,241,0.22)";
          stroke = "#818cf8";
        }
        label = "★";
      } else {
        // Unclaimed — color by attackable vs not
        if (galaxy.isNewL6 && owner === "neutral") {
          fill = "rgba(15,23,42,0.85)";
          stroke = "#475569";
          label = "·";
        } else if (owner === "rival_") {
          fill = "rgba(60,20,30,0.7)";
          stroke = "#7c2d3a";
          label = "?";
        } else {
          fill = "rgba(15,23,42,0.85)";
          stroke = "#334155";
          label = "·";
        }
      }
      cells.push({
        id: `${galaxyId}#${i}`,
        q: hc.q,
        r: hc.r,
        fill,
        stroke,
        strokeWidth: isOrigin ? 2 : 1,
        label,
        glow: isOrigin && isClaimed,
        dimmed: !isClaimed && owner !== "player" && !galaxy.isNewL6,
      });
    }
    return cells;
  }, [hexCoords, claimed, state, galaxy, galaxyId]);

  // Now safe to bail — all hooks have run.
  if (!galaxy || !state) return null;

  const ownerLabel = state.ownerId === "player"
    ? "Owned by you"
    : state.ownerId.startsWith("rival_")
      ? `Rival: ${state.ownerId.replace("rival_", "")}`
      : "Neutral";

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-cyan-200 flex items-center gap-1.5">
            <Telescope className="w-4 h-4" />
            {galaxy.name}
            {galaxy.isNewL6 && (
              <Badge variant="outline" className="text-[0.55rem] text-violet-300 border-violet-400/40 ml-1">
                NEW L6
              </Badge>
            )}
          </div>
          <div className="text-[0.6rem] text-muted-foreground mt-0.5">{galaxy.tagline}</div>
        </div>
        <div className="text-right">
          <div className="text-[0.7rem] font-mono text-cyan-300">
            {claimed} / {systemCount}
          </div>
          <div className="text-[0.55rem] text-muted-foreground uppercase tracking-wide">
            systems claimed
          </div>
        </div>
      </div>

      <HexMap
        cells={hexCells}
        hexRadius={20}
        selectedId={selectedSystemId}
        onHexClick={(id) => drillIntoCosmosSystem(galaxyId, id)}
        title="Star Systems in this Galaxy"
        subtitle={`${ownerLabel} · heresy ${Math.floor(state.heresy)}%`}
      />

      <div className="mt-2 text-[0.6rem] text-muted-foreground leading-relaxed text-center">
        Click any hex to inspect that system
        {galaxy.isNewL6 && state.systemsClaimed < systemCount && (
          <> — or use the <span className="text-amber-300">Attack</span> button below to claim the next system.</>
        )}
      </div>

      {/* Attack action — only for new neutral L6 galaxies with remaining systems */}
      {galaxy.isNewL6 && state.systemsClaimed < systemCount && (
        <div className="mt-2 rounded-md border border-amber-400/30 bg-amber-500/5 p-2 flex items-center justify-between gap-2">
          <div className="text-[0.65rem] text-amber-200 flex items-center gap-1">
            <Swords className="w-3 h-3" />
            Claim system #{state.systemsClaimed + 1}
            <span className="text-muted-foreground">(+{WORLDS_PER_NEW_SYSTEM_L6} worlds)</span>
          </div>
          <button
            type="button"
            onClick={() => attackUniversalGalaxy(galaxyId)}
            disabled={faith < newGalaxyAttackCost}
            className="text-[0.65rem] font-medium px-2.5 py-1 rounded border border-amber-400/50 bg-amber-600/40 text-amber-100 hover:bg-amber-600/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            title={`Launch attack on ${galaxy.name} — cost ${newGalaxyAttackCost} Faith`}
          >
            <Swords className="w-3 h-3" />
            {newGalaxyAttackCost} Faith
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
      {galaxy.isNewL6 && state.systemsClaimed >= systemCount && (
        <div className="mt-2 rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-[0.65rem] text-emerald-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Galaxy fully claimed — contributed {(systemCount * WORLDS_PER_NEW_SYSTEM_L6).toLocaleString()} worlds to the Divine Engine.
        </div>
      )}
    </div>
  );
}

// ----- Helpers -----

// Stable hash → 32-bit int (FNV-1a style). Used to seed the per-galaxy hex
// generator so each galaxy gets a deterministic-but-unique layout.
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// Seeded version of generateHexMap — uses a local PRNG (mulberry32) instead
// of Math.random so each galaxy's hex layout is deterministic for a given
// seed. Inlines the axial-coordinate growth algorithm from HexMap.tsx so we
// don't need to globally override Math.random.
const HEX_DIRECTIONS = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function generateHexMapSeeded(totalHexes: number, seed: number): HexCoord[] {
  const rng = mulberry32(seed);
  const mapSet = new Map<string, HexCoord>();
  const origin: HexCoord = { q: 0, r: 0, id: "0,0" };
  mapSet.set(origin.id, origin);
  let lastPlaced = origin;
  const coreSize = Math.min(18, Math.max(6, Math.floor(totalHexes / 3)));

  const getNeighborCount = (q: number, r: number) => {
    let count = 0;
    for (const dir of HEX_DIRECTIONS) {
      if (mapSet.has(`${q + dir.q},${r + dir.r}`)) count++;
    }
    return count;
  };

  while (mapSet.size < totalHexes) {
    const currentCount = mapSet.size;
    const frontier: { q: number; r: number; weight: number }[] = [];
    const visitedFrontier = new Set<string>();

    for (const hex of mapSet.values()) {
      for (const dir of HEX_DIRECTIONS) {
        const nq = hex.q + dir.q;
        const nr = hex.r + dir.r;
        const key = `${nq},${nr}`;
        if (!mapSet.has(key) && !visitedFrontier.has(key)) {
          visitedFrontier.add(key);
          const touching = getNeighborCount(nq, nr);
          let weight = 1;
          if (currentCount < coreSize) {
            weight = Math.pow(touching, 3);
          } else {
            const r1 = rng();
            if (r1 < 0.45) {
              const dist = Math.max(
                Math.abs(nq - lastPlaced.q),
                Math.abs(nr - lastPlaced.r),
                Math.abs((nq + nr) - (lastPlaced.q + lastPlaced.r)),
              );
              weight = dist === 1 ? 8 : 1;
            } else if (r1 < 0.8) {
              weight = 2;
            } else {
              weight = touching >= 2 ? 4 : 1;
            }
          }
          frontier.push({ q: nq, r: nr, weight });
        }
      }
    }

    if (frontier.length === 0) break; // safety
    const totalWeight = frontier.reduce((s, i) => s + i.weight, 0);
    let roll = rng() * totalWeight;
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
