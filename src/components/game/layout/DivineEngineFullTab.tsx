"use client";

import { useGameStore } from "@/game/state/store";
import { formatNumber, formatCompact } from "../shared/format";
import { DivineEnginePanel } from "./DivineEnginePanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FUSION_TIERS, rawWorldCount, effectiveWorldCount, eternalFlameMultiplier } from "@/game/data/worldFusion";
import { Sparkles, Flame, Globe, TrendingUp, Layers, Eye, Triangle, Egg } from "lucide-react";

// ===========================================================================
// DivineEngineFullTab — the god's full control panel for reality.
//
// Shows the Divine Engine as a full tab (not just a sidebar). Includes:
//   • Summary stats (worlds, Div/s, peak prod, Eternal Flame multiplier)
//   • World Tier Visualization — worlds as glowing dots, color-coded by tier
//   • Quick access buttons to L3 systems (World Forge, Catalysts, etc.)
//
// The sidebar (DivineEnginePanel) stays as the compact summary. This tab
// gives the full godlike experience.
// ===========================================================================

// Tier → color mapping for the visualization
const TIER_COLORS: Record<string, string> = {
  "1": "#e2e8f0",       // white
  "2": "#93c5fd",       // light blue
  "3": "#60a5fa",       // blue
  "4": "#3b82f6",       // bright blue
  "5": "#818cf8",       // indigo
  "6": "#a78bfa",       // violet
  "7": "#c084fc",       // purple
  "8": "#e879f9",       // magenta
  "9": "#f472b6",       // pink
  "10": "#fbbf24",      // gold
  "ascendant": "#fde047",      // bright gold
  "greater_ascendant": "#fef08a", // pulsing gold
  "celestial_core": "#e0f2fe",    // diamond white
  "void": "#1e1b4b",            // black with purple corona
};

// Tier → size multiplier (higher tiers = bigger dots)
const TIER_SIZES: Record<string, number> = {
  "1": 1.5, "2": 1.8, "3": 2.0, "4": 2.3, "5": 2.5,
  "6": 2.8, "7": 3.0, "8": 3.3, "9": 3.6, "10": 4.0,
  "ascendant": 5.0, "greater_ascendant": 6.0, "celestial_core": 7.0, "void": 8.0,
};

// Deterministic PRNG for star positions
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

interface StarDot {
  x: number;
  y: number;
  tier: string;
  count: number;
  color: string;
  size: number;
}

function computeStarDots(worldTiers: Record<string, number>): StarDot[] {
  const rng = mulberry32(0xdeadbeef);
  const dots: StarDot[] = [];
  for (const tier of FUSION_TIERS) {
    const count = Math.max(0, Math.floor(worldTiers[tier.id] || 0));
    if (count === 0) continue;
    // Each tier gets dots positioned in a band
    // Higher tiers get fewer but bigger dots
    const maxDots = Math.min(count, tier.id === "1" ? 200 : 50);
    for (let i = 0; i < maxDots; i++) {
      dots.push({
        x: 2 + rng() * 96,
        y: 2 + rng() * 96,
        tier: tier.id,
        count: Math.ceil(count / maxDots), // each dot represents this many worlds
        color: TIER_COLORS[tier.id] || "#fff",
        size: TIER_SIZES[tier.id] || 2,
      });
    }
  }
  return dots;
}

export function DivineEngineFullTab() {
  const divinity = useGameStore((s) => s.divinity);
  const peakProductionRate = useGameStore((s) => s.peakProductionRate || 0);
  const worldTiers = useGameStore((s) => s.worldTiers || {});
  const eternalFlameInvested = useGameStore((s) => s.eternalFlameInvested || 0);
  const backgroundSimulations = useGameStore((s) => s.backgroundSimulations || 0);
  const voidShards = useGameStore((s) => s.voidShards || 0);
  const setTab = useGameStore((s) => s.setTab);

  const rawCount = rawWorldCount(worldTiers);
  const effectiveCount = effectiveWorldCount(worldTiers);
  const flameMult = eternalFlameMultiplier(eternalFlameInvested);
  const dots = computeStarDots(worldTiers);

  // Compute Divinity/s (simplified — matches the tick formula)
  const divPerSec = effectiveCount > 0 && peakProductionRate > 0
    ? effectiveCount * peakProductionRate * 0.01 * flameMult
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
          <div className="text-[0.6rem] text-muted-foreground uppercase">Effective Worlds</div>
          <div className="text-xl font-bold text-cyan-300">{formatCompact(effectiveCount)}</div>
          <div className="text-[0.55rem] text-muted-foreground">production-weighted</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-[0.6rem] text-muted-foreground uppercase">Peak Production</div>
          <div className="text-xl font-bold text-amber-300">{formatCompact(peakProductionRate)}</div>
          <div className="text-[0.55rem] text-muted-foreground">resources/s</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-[0.6rem] text-muted-foreground uppercase">Eternal Flame</div>
          <div className="text-xl font-bold text-orange-300">×{flameMult.toFixed(2)}</div>
          <div className="text-[0.55rem] text-muted-foreground">{formatCompact(eternalFlameInvested)} invested</div>
        </div>
      </div>

      {/* ===== WORLD TIER VISUALIZATION ===== */}
      {rawCount > 0 ? (
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-violet-300" />
            <span className="text-sm font-semibold">World Visualization</span>
            <span className="text-[0.65rem] text-muted-foreground">— each dot is a world, colored by fusion tier</span>
          </div>
          <div className="relative w-full" style={{ height: "clamp(300px, 50vh, 500px)" }}>
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full rounded-lg border border-violet-500/20 bg-gradient-to-b from-[#020817] via-[#0a0a23] to-[#050518]"
            >
              {/* Starfield background */}
              <defs>
                <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Background stars */}
              {Array.from({ length: 30 }).map((_, i) => {
                const rng = mulberry32(i * 7919);
                return (
                  <circle
                    key={`bg-${i}`}
                    cx={2 + rng() * 96}
                    cy={2 + rng() * 96}
                    r={0.15 + rng() * 0.2}
                    fill="#ffffff"
                    opacity={0.15 + rng() * 0.2}
                  />
                );
              })}
              {/* World dots */}
              {dots.map((dot, i) => (
                <g key={`dot-${i}`}>
                  {/* Glow */}
                  <circle cx={dot.x} cy={dot.y} r={dot.size * 2.5} fill={dot.color} opacity={0.15} />
                  {/* Dot */}
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={dot.size}
                    fill={dot.color}
                    opacity={0.8}
                  />
                  {/* Void World special effect */}
                  {dot.tier === "void" && (
                    <circle cx={dot.x} cy={dot.y} r={dot.size * 1.5} fill="none" stroke="#a855f7" strokeWidth={0.3} opacity={0.6} />
                  )}
                </g>
              ))}
            </svg>
            {/* Legend */}
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-x-3 gap-y-1 rounded-md border border-slate-700/50 bg-slate-950/70 px-2.5 py-1 text-[0.6rem] text-slate-300 backdrop-blur pointer-events-none">
              {FUSION_TIERS.filter(t => (worldTiers[t.id] || 0) > 0).map(tier => (
                <span key={tier.id} className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: TIER_COLORS[tier.id] || "#fff" }} />
                  {tier.name} ({formatNumber(worldTiers[tier.id] || 0, 0)})
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="stat-card text-center py-8">
          <Globe className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No worlds yet. Light constellation stars (L2) to generate background worlds.</p>
        </div>
      )}

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

// Import the icons used in Quick Access
