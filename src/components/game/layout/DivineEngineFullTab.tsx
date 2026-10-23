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
  Hammer, Merge, ChevronsRight,
} from "lucide-react";
import { useMemo } from "react";
import { WorldVisualization3D, computeWorldDots, type WorldDot } from "./WorldVisualization3D";

// ===========================================================================
// DivineEngineFullTab — the god's full control panel for reality.
//
// Sections:
//   • Summary stats (worlds, Div/s, peak prod, Eternal Flame multiplier)
//   • World Tier Visualization — REAL Three.js 3D sphere meshes (drag to
//     rotate 360° in any direction; auto-rotates when idle). Each world is
//     a SphereGeometry instance with MeshStandardMaterial, lit by ambient +
//     key + rim directional lights so specular highlights actually rotate
//     with the scene.
//   • World Archetype Injection — choose archetype, changes Divinity/s mult
//   • Evolution Sliders — 4 sliders that share a 10-point pool, default 0,
//     reallocate freely at any time
//   • Quick access buttons to L2/L3/L4 tabs
// ===========================================================================

// Tier color palette — kept in this file so other consumers (e.g. World
// Fusion row accents) can reference it. The actual color mapping used by
// the 3D visualization lives in WorldVisualization3D.tsx where it is also
// exported. The two definitions are kept in sync manually.
const TIER_COLORS: Record<string, string> = {
  "1": "#e2e8f0", "2": "#93c5fd", "3": "#60a5fa", "4": "#3b82f6", "5": "#818cf8",
  "6": "#a78bfa", "7": "#c084fc", "8": "#e879f9", "9": "#f472b6", "10": "#fbbf24",
  "ascendant": "#fde047", "greater_ascendant": "#fef08a", "celestial_core": "#e0f2fe", "void": "#1e1b4b",
};

// Re-export so external consumers that import from DivineEngineFullTab can
// still reach the WorldDot type without changing their import path.
export type { WorldDot };
// Mark TIER_COLORS as intentionally retained for future use (e.g. accent
// colors on the World Fusion rows once that styling lands). Without this
// the no-unused-vars rule (currently off) would still not complain, but
// the explicit annotation documents intent for future maintainers.
void TIER_COLORS;

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

  // RESTORE-BULK-FORGE-FUSE — World Forge + World Fusion actions + state.
  const worldsForged = useGameStore((s) => s.worldsForged || 0);
  const upgrades = useGameStore((s) => s.upgrades || {});
  const debugFreeBuy = useGameStore((s) => s.debugFreeBuy);
  const forgeWorld = useGameStore((s) => s.forgeWorld);
  const forgeWorldBulk = useGameStore((s) => s.forgeWorldBulk);
  const fuseWorlds = useGameStore((s) => s.fuseWorlds);
  const fuseWorldsBulk = useGameStore((s) => s.fuseWorldsBulk);

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

  // Bulk upgrade ownership — bypassed in debug mode (debugFreeBuy).
  const hasBulkForge10 = debugFreeBuy || (upgrades["bulk_forge_10x"] || 0) > 0;
  const hasBulkForge100 = debugFreeBuy || (upgrades["bulk_forge_100x"] || 0) > 0;
  const hasBulkForgeMax = debugFreeBuy || (upgrades["bulk_forge_max"] || 0) > 0;
  const hasBulkFuse10 = debugFreeBuy || (upgrades["bulk_fuse_10x"] || 0) > 0;
  const hasBulkFuse100 = debugFreeBuy || (upgrades["bulk_fuse_100x"] || 0) > 0;
  const hasBulkFuseMax = debugFreeBuy || (upgrades["bulk_fuse_max"] || 0) > 0;

  // Cost of the next single forge = ceil(50 × 1.5^worldsForged).
  const nextForgeCost = Math.ceil(50 * Math.pow(1.5, worldsForged));
  const canAffordNextForge = debugFreeBuy || divinity >= nextForgeCost;

  // Compute how many worlds the player can afford to forge right now,
  // starting from `worldsForged`. Capped at 10000 (safety cap). The cost
  // grows exponentially so the loop terminates quickly even with very
  // large divinity pools.
  const maxForgeable = useMemo(() => {
    if (divinity <= 0 && !debugFreeBuy) return 0;
    let remaining = divinity;
    let count = 0;
    for (let i = 0; i < 10000; i++) {
      const cost = Math.ceil(50 * Math.pow(1.5, worldsForged + i));
      if (remaining < cost) break;
      remaining -= cost;
      count++;
    }
    return count;
  }, [divinity, worldsForged, debugFreeBuy]);

  // For each fusion tier with a source, compute the max fusable count =
  // floor(sourceAvailable / sourceCount), capped at 10000.
  const maxFusableByTier = useMemo(() => {
    const out: Record<string, number> = {};
    for (const tier of FUSION_TIERS) {
      if (tier.sourceTier === null) continue;
      const available = Math.max(0, Math.floor(worldTiers[tier.sourceTier] || 0));
      out[tier.id] = Math.min(10000, Math.floor(available / tier.sourceCount));
    }
    return out;
  }, [worldTiers]);

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
              — each sphere is a 3D world mesh, lit by ambient + key + rim directional lights · drag to rotate (360°)
            </span>
          </div>
          <WorldVisualization3D dots={dots} />
        </div>
      )}

      {/* ===== RESTORE-BULK-FORGE-FUSE: WORLD FORGE ===== */}
      <div className="stat-card">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Hammer className="w-4 h-4 text-amber-300" />
            <span className="text-sm font-semibold">World Forge</span>
            <span className="text-[0.65rem] text-muted-foreground">
              — spend Divinity to create new Tier 1 worlds
            </span>
          </div>
          <Badge variant="outline" className="text-amber-300 border-amber-400/40">
            {formatNumber(worldsForged, 0)} forged lifetime
          </Badge>
        </div>
        <p className="text-[0.7rem] text-muted-foreground mb-2">
          Each forged world costs <span className="font-mono text-amber-200">ceil(50 × 1.5<sup>forged</sup>)</span> Divinity. Next: <span className="font-mono text-amber-200">{formatNumber(nextForgeCost, 0)}</span> Divinity → +1 Tier 1 world.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => forgeWorld()}
            disabled={!canAffordNextForge}
            className="h-8"
            title={`Forge 1 Tier 1 world (costs ${formatNumber(nextForgeCost, 0)} Divinity)`}
          >
            <Hammer className="w-3 h-3 mr-1" /> Forge ×1
          </Button>
          {hasBulkForge10 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => forgeWorldBulk(10)}
              disabled={!canAffordNextForge}
              className="h-8 border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
              title="Forge 10 worlds at once (capped by Divinity)"
            >
              <ChevronsRight className="w-3 h-3 mr-1" /> Forge ×10
            </Button>
          )}
          {hasBulkForge100 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => forgeWorldBulk(100)}
              disabled={!canAffordNextForge}
              className="h-8 border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
              title="Forge 100 worlds at once (capped by Divinity)"
            >
              <ChevronsRight className="w-3 h-3 mr-1" /> Forge ×100
            </Button>
          )}
          {hasBulkForgeMax && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => forgeWorldBulk(-1)}
              disabled={maxForgeable <= 0}
              className="h-8 border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10"
              title={`Forge as many worlds as affordable (capped at 10000). You can afford ${formatNumber(maxForgeable, 0)} right now.`}
            >
              <ChevronsRight className="w-3 h-3 mr-1" /> Forge Max ({formatNumber(maxForgeable, 0)})
            </Button>
          )}
        </div>
        {!hasBulkForge10 && (
          <p className="text-[0.6rem] text-muted-foreground italic mt-2 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            Buy Bulk Forge ×10 in the shop to unlock bulk forging.
          </p>
        )}
      </div>

      {/* ===== RESTORE-BULK-FORGE-FUSE: WORLD FUSION ===== */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Merge className="w-4 h-4 text-violet-300" />
          <span className="text-sm font-semibold">World Fusion</span>
          <span className="text-[0.65rem] text-muted-foreground">
            — merge N source worlds into 1 higher-tier world (×5 prod per tier)
          </span>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {FUSION_TIERS.filter((t) => t.sourceTier !== null).map((tier) => {
            const sourceTier = FUSION_TIERS.find((t) => t.id === tier.sourceTier);
            const owned = Math.max(0, Math.floor(worldTiers[tier.id] || 0));
            const sourceAvail = Math.max(0, Math.floor(worldTiers[tier.sourceTier!] || 0));
            const maxFuse = maxFusableByTier[tier.id] || 0;
            const canFuseOnce = sourceAvail >= tier.sourceCount;
            return (
              <div
                key={tier.id}
                className="flex items-center justify-between gap-2 flex-wrap p-2 rounded-md border border-slate-700/40 bg-slate-950/30"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">{tier.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{tier.name}</div>
                    <div className="text-[0.6rem] text-muted-foreground">
                      {tier.sourceCount} × {sourceTier?.icon} {sourceTier?.name} → 1 (×{formatCompact(tier.productionMult)} prod)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[0.6rem] text-violet-200 border-violet-400/40">
                    {formatNumber(owned, 0)} owned
                  </Badge>
                  <Badge variant="outline" className="text-[0.6rem] text-cyan-200 border-cyan-400/40">
                    {formatNumber(sourceAvail, 0)} src
                  </Badge>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => fuseWorlds(tier.id)}
                    disabled={!canFuseOnce}
                    className="h-7"
                    title={`Fuse ${tier.sourceCount} ${sourceTier?.name} → 1 ${tier.name}`}
                  >
                    <Merge className="w-3 h-3 mr-0.5" /> ×1
                  </Button>
                  {hasBulkFuse10 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fuseWorldsBulk(tier.id, 10)}
                      disabled={maxFuse < 1}
                      className="h-7 border-violet-500/40 text-violet-200 hover:bg-violet-500/10"
                      title={`Fuse 10× → 10 ${tier.name} (needs ${tier.sourceCount * 10} ${sourceTier?.name})`}
                    >
                      ×10
                    </Button>
                  )}
                  {hasBulkFuse100 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fuseWorldsBulk(tier.id, 100)}
                      disabled={maxFuse < 1}
                      className="h-7 border-violet-500/40 text-violet-200 hover:bg-violet-500/10"
                      title={`Fuse 100× → 100 ${tier.name} (needs ${tier.sourceCount * 100} ${sourceTier?.name})`}
                    >
                      ×100
                    </Button>
                  )}
                  {hasBulkFuseMax && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fuseWorldsBulk(tier.id, -1)}
                      disabled={maxFuse <= 0}
                      className="h-7 border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10"
                      title={`Fuse as many as possible (capped at 10000). Available: ${maxFuse}`}
                    >
                      Max ({formatNumber(maxFuse, 0)})
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!hasBulkFuse10 && (
          <p className="text-[0.6rem] text-muted-foreground italic mt-2 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            Buy Bulk Fuse ×10 in the shop to unlock bulk fusing.
          </p>
        )}
      </div>

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
