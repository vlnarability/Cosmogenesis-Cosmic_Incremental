"use client";

import { useGameStore } from "@/game/state/store";
import { formatNumber, formatCompact } from "../shared/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FUSION_TIERS, rawWorldCount, effectiveWorldCount, eternalFlameMultiplier } from "@/game/data/worldFusion";
import { ARCHETYPES } from "@/game/data/archetypes";
import { Sparkles, Flame, Globe, TrendingUp, Layers, Eye, Triangle, Egg, Users, Gauge } from "lucide-react";

// ===========================================================================
// DivineEngineFullTab — the god's full control panel for reality.
//
// Sections:
//   • Summary stats (worlds, Div/s, peak prod, Eternal Flame multiplier)
//   • World Tier Visualization — worlds as glowing dots, color-coded by tier
//   • World Archetype Injection — choose archetype, changes Divinity/s multiplier
//   • Evolution Sliders — 4 sliders (Speed, Aggression, Curiosity, Faith)
//   • Quick access buttons to L2/L3/L4 tabs
// ===========================================================================

const TIER_COLORS: Record<string, string> = {
  "1": "#e2e8f0", "2": "#93c5fd", "3": "#60a5fa", "4": "#3b82f6", "5": "#818cf8",
  "6": "#a78bfa", "7": "#c084fc", "8": "#e879f9", "9": "#f472b6", "10": "#fbbf24",
  "ascendant": "#fde047", "greater_ascendant": "#fef08a", "celestial_core": "#e0f2fe", "void": "#1e1b4b",
};

const TIER_SIZES: Record<string, number> = {
  "1": 1.5, "2": 1.8, "3": 2.0, "4": 2.3, "5": 2.5,
  "6": 2.8, "7": 3.0, "8": 3.3, "9": 3.6, "10": 4.0,
  "ascendant": 5.0, "greater_ascendant": 6.0, "celestial_core": 7.0, "void": 8.0,
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

interface StarDot { x: number; y: number; tier: string; color: string; size: number; }

function computeStarDots(worldTiers: Record<string, number>): StarDot[] {
  const rng = mulberry32(0xdeadbeef);
  const dots: StarDot[] = [];
  for (const tier of FUSION_TIERS) {
    const count = Math.max(0, Math.floor(worldTiers[tier.id] || 0));
    if (count === 0) continue;
    const maxDots = Math.min(count, tier.id === "1" ? 200 : 50);
    for (let i = 0; i < maxDots; i++) {
      dots.push({
        x: 2 + rng() * 96, y: 2 + rng() * 96,
        tier: tier.id, color: TIER_COLORS[tier.id] || "#fff", size: TIER_SIZES[tier.id] || 2,
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
  const voidShards = useGameStore((s) => s.voidShards || 0);
  const setTab = useGameStore((s) => s.setTab);

  // IDEA-2: World Archetype Injection
  const activeWorldArchetype = useGameStore((s) => s.activeWorldArchetype);
  const setWorldArchetype = useGameStore((s) => s.setWorldArchetype);

  // IDEA-5: Evolution Sliders
  const evolutionSliders = useGameStore((s) => s.evolutionSliders || { speed: 1.0, aggression: 0, curiosity: 0, faith: 0 });
  const setEvolutionSlider = useGameStore((s) => s.setEvolutionSlider);

  const rawCount = rawWorldCount(worldTiers);
  const effectiveCount = effectiveWorldCount(worldTiers);
  const flameMult = eternalFlameMultiplier(eternalFlameInvested);
  const dots = computeStarDots(worldTiers);

  const divPerSec = effectiveCount > 0 && peakProductionRate > 0
    ? effectiveCount * peakProductionRate * 0.01 * flameMult * (activeWorldArchetype ? 1.30 : 1) * evolutionSliders.speed
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

      {/* ===== WORLD TIER VISUALIZATION ===== */}
      {rawCount > 0 && (
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-violet-300" />
            <span className="text-sm font-semibold">World Visualization</span>
            <span className="text-[0.65rem] text-muted-foreground">— each dot is a world, colored by fusion tier</span>
          </div>
          <div className="relative w-full" style={{ height: "clamp(300px, 50vh, 500px)" }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
              className="w-full h-full rounded-lg border border-violet-500/20 bg-gradient-to-b from-[#020817] via-[#0a0a23] to-[#050518]">
              {Array.from({ length: 30 }).map((_, i) => {
                const rng = mulberry32(i * 7919);
                return <circle key={`bg-${i}`} cx={2 + rng() * 96} cy={2 + rng() * 96} r={0.15 + rng() * 0.2} fill="#ffffff" opacity={0.15 + rng() * 0.2} />;
              })}
              {dots.map((dot, i) => (
                <g key={`dot-${i}`}>
                  <circle cx={dot.x} cy={dot.y} r={dot.size * 2.5} fill={dot.color} opacity={0.15} />
                  <circle cx={dot.x} cy={dot.y} r={dot.size} fill={dot.color} opacity={0.8} />
                  {dot.tier === "void" && <circle cx={dot.x} cy={dot.y} r={dot.size * 1.5} fill="none" stroke="#a855f7" strokeWidth={0.3} opacity={0.6} />}
                </g>
              ))}
            </svg>
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

      {/* ===== IDEA-5: EVOLUTION SLIDERS ===== */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-amber-300" />
          <span className="text-sm font-semibold">Evolution Sliders</span>
          <span className="text-[0.65rem] text-muted-foreground">— tune how your worlds behave</span>
        </div>
        <div className="space-y-3">
          {/* Speed */}
          <div>
            <div className="flex justify-between text-[0.7rem] mb-1">
              <span className="text-muted-foreground">Evolution Speed</span>
              <span className="text-amber-300 font-mono">{evolutionSliders.speed.toFixed(1)}×</span>
            </div>
            <Slider
              value={[evolutionSliders.speed]}
              min={0.1} max={10} step={0.1}
              onValueChange={(v) => setEvolutionSlider("speed", v[0])}
              className="w-full"
            />
            <p className="text-[0.55rem] text-muted-foreground mt-0.5">Multiplies Divinity/s. Higher = more Divinity per tick.</p>
          </div>
          {/* Aggression */}
          <div>
            <div className="flex justify-between text-[0.7rem] mb-1">
              <span className="text-muted-foreground">Aggression</span>
              <span className="text-rose-300 font-mono">{evolutionSliders.aggression}%</span>
            </div>
            <Slider
              value={[evolutionSliders.aggression]}
              min={0} max={100} step={1}
              onValueChange={(v) => setEvolutionSlider("aggression", v[0])}
              className="w-full"
            />
            <p className="text-[0.55rem] text-muted-foreground mt-0.5">Higher = more Void Shards from worlds.</p>
          </div>
          {/* Curiosity */}
          <div>
            <div className="flex justify-between text-[0.7rem] mb-1">
              <span className="text-muted-foreground">Curiosity</span>
              <span className="text-cyan-300 font-mono">{evolutionSliders.curiosity}%</span>
            </div>
            <Slider
              value={[evolutionSliders.curiosity]}
              min={0} max={100} step={1}
              onValueChange={(v) => setEvolutionSlider("curiosity", v[0])}
              className="w-full"
            />
            <p className="text-[0.55rem] text-muted-foreground mt-0.5">Higher = peak production rate grows slowly over time.</p>
          </div>
          {/* Faith */}
          <div>
            <div className="flex justify-between text-[0.7rem] mb-1">
              <span className="text-muted-foreground">Faith</span>
              <span className="text-amber-300 font-mono">{evolutionSliders.faith}%</span>
            </div>
            <Slider
              value={[evolutionSliders.faith]}
              min={0} max={100} step={1}
              onValueChange={(v) => setEvolutionSlider("faith", v[0])}
              className="w-full"
            />
            <p className="text-[0.55rem] text-muted-foreground mt-0.5">Higher = worlds generate passive Faith.</p>
          </div>
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
