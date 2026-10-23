"use client";

import { useState } from "react";
import { useGameStore } from "@/game/state/store";
import {
  CONVERGENCE_CATALYSTS,
  WORLD_TEMPLATES,
  GENESIS_SEEDS,
  eternalFlameMultiplier,
} from "@/game/data/transcendence";
import {
  FUSION_TIERS,
  FUSION_TIER_MAP,
  rawWorldCount,
  effectiveWorldCount,
  canFuse,
} from "@/game/data/worldFusion";
import {
  PORTFOLIOS,
  PORTFOLIO_MAP,
  PORTFOLIO_PRICE_MIN,
  PORTFOLIO_PRICE_MAX,
  portfolioDividendsPerSec,
  totalAllocatedWorlds,
  riskLabel,
} from "@/game/data/marketPortfolios";
import {
  CONSTELLATIONS,
  starCost,
  type ConstellationState,
} from "@/game/data/constellations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Lock,
  Triangle,
  CheckCircle2,
  Clock,
  Globe,
  Star,
  AlertTriangle,
  Flame,
  Hammer,
  Sparkles,
  TreePine,
  TrendingUp,
  Coins,
  Layers,
} from "lucide-react";
import { formatNumber, formatCompact } from "../shared/format";
import { BackgroundLayerBadge } from "../shared/BackgroundLayerBadge";
import { cn } from "@/lib/utils";

// ===========================================================================
// LAYER 3 — TRANSCENDENCE (REDESIGNED)
// ===========================================================================
// The L3 layer has been redesigned. The classic Offerings / Rituals / Scripts /
// Blood Pacts / Divine Market sections are REMOVED from the UI. The new L3 UI
// shows:
//   1. Divine Engine Overview — current worlds, Divinity/s, peak production,
//      Eternal Flame multiplier.
//   2. World Fusion — show all tiers, fuse buttons, effective production.
//   3. Eternal Flame — invest Divinity, current multiplier, invest button.
//   4. World Forge — forge new worlds, cost, current count.
//   5. Convergence Catalysts — 5 catalysts, purchase buttons.
//   6. World Templates — 5 templates, active indicator, switch button.
//   7. Genesis Seeds — 4 seeds, plant buttons, maturity progress.
//   8. Astral Resonance — 4 categories, active indicator, set button.
//   9. Investment Portfolios — existing portfolio system (kept as-is).
//
// The Investment Portfolios system already works with the Divine Engine and
// is kept unchanged. See `marketPortfolios.ts` for PORTFOLIOS / PORTFOLIO_MAP.
// ===========================================================================

export function TranscendenceContent() {
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const divinity = useGameStore((s) => s.divinity);
  const time = useGameStore((s) => s.time);
  const peakProductionRate = useGameStore((s) => s.peakProductionRate || 0);
  const backgroundSimulations = useGameStore((s) => s.backgroundSimulations || 0);

  // L3-REDESIGN — new state subscriptions.
  const worldTiers = useGameStore((s) => s.worldTiers || {});
  const cosmicFragments = useGameStore((s) => s.voidShards || 0);
  const eternalFlameInvested = useGameStore((s) => s.eternalFlameInvested || 0);
  const worldsForged = useGameStore((s) => s.worldsForged || 0);
  const purchasedCatalysts = useGameStore((s) => s.purchasedCatalysts || {});
  const activeWorldTemplate = useGameStore((s) => s.activeWorldTemplate);
  const plantedSeeds = useGameStore((s) => s.plantedSeeds || {});

  // DIVINE INVESTMENT MARKET — portfolios (kept as-is).
  const portfolioAllocations = useGameStore((s) => s.portfolioAllocations || {});
  const portfolioLockTimers = useGameStore((s) => s.portfolioLockTimers || {});
  const portfolioPrices = useGameStore((s) => s.portfolioPrices || {});
  const portfolioDividendsEarned = useGameStore((s) => s.portfolioDividendsEarned || 0);
  const allocateWorlds = useGameStore((s) => s.allocateWorlds);
  const deallocateWorlds = useGameStore((s) => s.deallocateWorlds);
  const buyStarFromMarket = useGameStore((s) => s.buyStarFromMarket);
  // Constellation state for the "Buy Star" speed-up button.
  const constellationStars = useGameStore((s) => s.constellationStars || {});
  const constellationProgress = useGameStore((s) => s.constellationProgress || {});
  const constellationsStarted = useGameStore((s) => s.constellationsStarted || {});
  const constellationsCompleted = useGameStore((s) => s.constellationsCompleted || {});
  const upgrades = useGameStore((s) => s.upgrades || {});

  // L3-REDESIGN — new store actions.
  const fuseWorlds = useGameStore((s) => s.fuseWorlds);
  const investInFlame = useGameStore((s) => s.investInFlame);
  const forgeWorld = useGameStore((s) => s.forgeWorld);
  const purchaseCatalyst = useGameStore((s) => s.purchaseCatalyst);
  const setWorldTemplate = useGameStore((s) => s.setWorldTemplate);
  const plantGenesisSeed = useGameStore((s) => s.plantGenesisSeed);

  const isUnlocked = !!unlockedLayers.transcendence;

  // ===== Derived values =====
  // Effective worlds = Σ (count_tier × productionMult). This is what drives
  // bgDivPerSec = effectiveWorlds × peakProductionRate × 0.01 × multipliers.
  const rawWorlds = rawWorldCount(worldTiers);
  const effectiveWorlds = effectiveWorldCount(worldTiers);
  const flameMult = eternalFlameMultiplier(eternalFlameInvested);
  // Compute the current bgDivPerSec for display (matches the tick formula).
  const bgDivPerSec = effectiveWorlds * peakProductionRate * 0.01 * flameMult;

  // Available worlds for portfolio allocation = backgroundSimulations −
  // already allocated.
  const allocatedTotal = totalAllocatedWorlds(portfolioAllocations);
  const availableWorlds = Math.max(0, Math.floor(backgroundSimulations) - allocatedTotal);

  // Per-portfolio live dividends preview — matches the tick formula exactly.
  const portfolioDivsPerSec = (pid: string): number => {
    const p = PORTFOLIO_MAP[pid];
    if (!p) return 0;
    return portfolioDividendsPerSec(p, portfolioAllocations[pid] || 0, peakProductionRate);
  };
  const totalPortfolioDivsPerSec = PORTFOLIOS.reduce(
    (sum, p) => sum + portfolioDivsPerSec(p.id),
    0
  );

  // Cheapest affordable unlit constellation star — for the "Buy Star" button.
  const cheapestStar = (() => {
    const cs: ConstellationState = {
      constellationStars,
      constellationProgress,
      constellationsStarted,
      constellationsCompleted,
    };
    const fdLvl = (upgrades?.foresight_discount as number) || 0;
    const foresightDiscountMult = Math.pow(0.80, fdLvl);
    let best: { cId: string; sId: string; cost: number } | null = null;
    for (const c of CONSTELLATIONS) {
      for (const st of c.stars) {
        if (cs.constellationStars[st.id]) continue;
        const cost = starCost(c.id, cs, st.id, { foresightDiscountMult });
        if (!best || cost < best.cost) best = { cId: c.id, sId: st.id, cost };
      }
    }
    return best;
  })();
  const canBuyCheapestStar = !!cheapestStar && divinity >= cheapestStar.cost;

  // L3 subtabs — split the 8 stacked sections into 3 nav targets:
  //   worlds (Overview + Fusion + Forge), boosts (Flame + Catalysts +
  //   Templates + Seeds), investments (Portfolios).
  const [subtab, setSubtab] = useState<"worlds" | "boosts" | "investments">("worlds");

  // Eternal Flame invest input — default 10% of current Divinity.
  const [flameInvestAmount, setFlameInvestAmount] = useState<string>("");
  const flameDefaultAmount = Math.floor(divinity * 0.10);
  const flameInvestValue = flameInvestAmount === ""
    ? flameDefaultAmount
    : Math.max(0, Math.floor(Number(flameInvestAmount) || 0));
  const flameInvestAll = Math.floor(divinity * 0.90);

  // Forge cost preview.
  const forgeCost = Math.ceil(50 * Math.pow(1.5, worldsForged));
  const canForge = divinity >= forgeCost;

  // Genesis seed maturity helpers.
  function seedProgress(seedId: string): { progress: number; remainingSec: number; mature: boolean } {
    const seed = GENESIS_SEEDS.find((s) => s.id === seedId);
    const entry = plantedSeeds[seedId];
    if (!seed || !entry?.planted) {
      return { progress: 0, remainingSec: seed?.maturitySec || 0, mature: false };
    }
    const elapsed = (time || 0) - entry.plantedAtTime;
    const remaining = Math.max(0, seed.maturitySec - elapsed);
    const progress = Math.min(1, elapsed / seed.maturitySec);
    return { progress, remainingSec: remaining, mature: remaining === 0 };
  }

  // Portfolio price-trend label.
  function portfolioPriceLabel(price: number): { text: string; tone: string } {
    if (price <= PORTFOLIO_PRICE_MIN + 20) return { text: "cheap", tone: "text-emerald-300" };
    if (price >= PORTFOLIO_PRICE_MAX - 20) return { text: "expensive", tone: "text-rose-300" };
    return { text: "fair", tone: "text-amber-300" };
  }

  return (
    <>
      {/* LAYER-AS-TAB — plain HTML header (no Radix Dialog primitives). */}
      <div className="flex flex-col gap-2 text-center sm:text-left mb-3">
        <h2 className="text-lg leading-none font-semibold flex items-center gap-2 flex-wrap">
          <Triangle className="w-5 h-5" />
          Layer 3 — Transcendence (Divine Engine)
          <BackgroundLayerBadge layerId="transcendence" />
        </h2>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span>
              Forge, fuse, and amplify background worlds. Plant all 4 Genesis Seeds to unlock Genesis (L4).
            </span>
            <div className="flex gap-1 flex-wrap">
              <Badge variant="outline" className="text-violet-300 border-violet-400/40">
                {formatNumber(divinity, 0)} Divinity
              </Badge>
              <Badge variant="outline" className="text-cyan-300 border-cyan-400/40">
                🌌 {formatCompact(rawWorlds)} raw worlds
              </Badge>
              <Badge variant="outline" className="text-amber-300 border-amber-400/40">
                ⚡ {formatCompact(effectiveWorlds)} effective
              </Badge>
              {cosmicFragments > 0 && (
                <Badge variant="outline" className="text-fuchsia-300 border-fuchsia-400/40">
                  💠 {formatCompact(cosmicFragments)} Cosmic Frags
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isUnlocked ? (
        <div className="text-center text-muted-foreground py-10">
          <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Transcendence is sealed.</p>
          <p className="text-xs mt-1">Complete 10 constellations (Layer 2) to unlock Transcendence.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* L3 subtab nav bar — 3 targets (Worlds / Boosts / Investments). */}
          <div className="flex items-center gap-1 mb-1 flex-wrap">
            {([
              { id: "worlds" as const, label: "🌍 Worlds" },
              { id: "boosts" as const, label: "✨ Boosts" },
              { id: "investments" as const, label: "📊 Investments" },
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => setSubtab(t.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[0.7rem] font-medium transition-colors border",
                  subtab === t.id
                    ? "bg-amber-500/20 text-amber-200 border-amber-400/40"
                    : "bg-muted/10 text-muted-foreground border-border hover:bg-muted/20"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ===== 1. DIVINE ENGINE OVERVIEW ===== */}
          {subtab === "worlds" && (
          <section className="stat-card">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
              <div className="text-[0.7rem] uppercase tracking-wide text-amber-300/80 flex items-center gap-1">
                <Globe className="w-3 h-3" /> Divine Engine Overview
              </div>
              <Badge variant="outline" className="text-[0.6rem] text-emerald-300 border-emerald-400/40">
                +{formatNumber(bgDivPerSec, 2)} Div/s
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <div className="text-[0.6rem] text-muted-foreground">Raw worlds</div>
                <div className="text-violet-300 font-semibold">{formatNumber(rawWorlds, 0)}</div>
              </div>
              <div>
                <div className="text-[0.6rem] text-muted-foreground">Effective</div>
                <div className="text-amber-300 font-semibold">{formatCompact(effectiveWorlds)}</div>
              </div>
              <div>
                <div className="text-[0.6rem] text-muted-foreground">Peak prod/s</div>
                <div className="text-cyan-300 font-semibold">{formatCompact(peakProductionRate)}</div>
              </div>
              <div>
                <div className="text-[0.6rem] text-muted-foreground">Flame mult</div>
                <div className="text-rose-300 font-semibold">×{flameMult.toFixed(2)}</div>
              </div>
            </div>
            <div className="text-[0.6rem] text-muted-foreground mt-2 leading-snug">
              Each world produces Divinity based on your peak production rate.
              Fuse 10 worlds of one tier into 1 of the next tier for 5× production per world
              (Ascendant tier and above are pure boosts).
            </div>
          </section>
          )}

          {/* ===== 2. WORLD FUSION ===== */}
          {subtab === "worlds" && (
          <section className="stat-card">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
              <div className="text-[0.7rem] uppercase tracking-wide text-amber-300/80 flex items-center gap-1">
                <Layers className="w-3 h-3" /> World Fusion
              </div>
              <Badge variant="outline" className="text-[0.6rem] text-amber-300 border-amber-400/40">
                {FUSION_TIERS.length} tiers
              </Badge>
            </div>
            <div className="text-[0.6rem] text-muted-foreground mb-2 leading-snug">
              Fuse 10 worlds of a source tier into 1 of the target tier for 5× production per world.
              Ascendant tier is breakeven (100× = equal to merged). Greater Ascendant+ are pure boosts
              (10× each). Void World produces Cosmic Fragments — locked until L7+.
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
              {FUSION_TIERS.map((tier) => {
                const count = Math.max(0, Math.floor(worldTiers[tier.id] || 0));
                // Skip tier 1 — it's the source, no fusing into it.
                if (tier.sourceTier === null) {
                  return (
                    <div key={tier.id} className="rounded-md border border-border bg-muted/10 p-2 flex items-center gap-2">
                      <span className="text-lg shrink-0">{tier.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold flex items-center gap-1">
                          {tier.name}
                          <Badge variant="outline" className="text-[0.55rem] text-violet-300 border-violet-400/40">
                            base tier
                          </Badge>
                        </div>
                        <div className="text-[0.6rem] text-muted-foreground leading-snug">{tier.desc}</div>
                      </div>
                      <Badge variant="outline" className="text-[0.6rem] text-emerald-300 border-emerald-400/40 shrink-0">
                        {formatNumber(count, 0)} worlds
                      </Badge>
                    </div>
                  );
                }
                const sourceCount = worldTiers[tier.sourceTier] || 0;
                const check = canFuse(worldTiers, tier.id, unlockedLayers || {});
                const isLocked = !!tier.requiresLayer && !unlockedLayers?.[tier.requiresLayer];
                const canFuseNow = check.ok;
                return (
                  <div
                    key={tier.id}
                    className={`rounded-md border p-2 flex items-center gap-2 ${
                      isLocked ? "border-muted-foreground/30 bg-muted/5 opacity-60" : "border-border bg-muted/10"
                    }`}
                  >
                    <span className="text-lg shrink-0">{tier.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold flex items-center gap-1 flex-wrap">
                        {tier.name}
                        {tier.producesCosmicFragments && (
                          <Badge variant="outline" className="text-[0.55rem] text-fuchsia-300 border-fuchsia-400/40">
                            💠 Cosmic Frags
                          </Badge>
                        )}
                        {isLocked && (
                          <Badge variant="outline" className="text-[0.55rem] text-rose-300 border-rose-400/40 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> L7+
                          </Badge>
                        )}
                      </div>
                      <div className="text-[0.6rem] text-muted-foreground leading-snug">
                        {tier.sourceCount} × {FUSION_TIER_MAP[tier.sourceTier!].name} → 1 (×{tier.productionMult.toLocaleString()} prod)
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-[0.6rem] text-emerald-300 border-emerald-400/40">
                        {formatNumber(count, 0)} owned
                      </Badge>
                      <div className="flex items-center gap-1">
                        <span className="text-[0.55rem] text-muted-foreground">
                          {sourceCount}/{tier.sourceCount}
                        </span>
                        <Button
                          size="sm"
                          variant="default"
                          disabled={!canFuseNow}
                          onClick={() => fuseWorlds(tier.id)}
                          className="h-6 text-[0.6rem] px-2"
                          title={check.reason || `Fuse ${tier.sourceCount} ${FUSION_TIER_MAP[tier.sourceTier!].name} → 1 ${tier.name}`}
                        >
                          Fuse
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          )}

          {/* ===== 3. ETERNAL FLAME ===== */}
          {subtab === "boosts" && (
          <section className="stat-card">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
              <div className="text-[0.7rem] uppercase tracking-wide text-amber-300/80 flex items-center gap-1">
                <Flame className="w-3 h-3" /> Eternal Flame
              </div>
              <Badge variant="outline" className="text-[0.6rem] text-rose-300 border-rose-400/40">
                ×{flameMult.toFixed(2)} multiplier
              </Badge>
            </div>
            <div className="text-[0.6rem] text-muted-foreground mb-2 leading-snug">
              Invest Divinity to grow the flame's multiplier. Formula: 1 + log10(invested + 1) × 0.5.
              At 100 invested = ×2.0, 1,000 = ×2.5, 10,000 = ×3.0, 1,000,000 = ×4.0. Unbounded growth.
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-2">
              <div>
                <div className="text-[0.6rem] text-muted-foreground">Invested</div>
                <div className="text-rose-300 font-semibold">{formatNumber(eternalFlameInvested, 0)}</div>
              </div>
              <div>
                <div className="text-[0.6rem] text-muted-foreground">Current mult</div>
                <div className="text-amber-300 font-semibold">×{flameMult.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[0.6rem] text-muted-foreground">Divinity</div>
                <div className="text-violet-300 font-semibold">{formatNumber(divinity, 0)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                type="number"
                placeholder={`Invest (default 10% = ${formatNumber(flameDefaultAmount, 0)})`}
                value={flameInvestAmount}
                onChange={(e) => setFlameInvestAmount(e.target.value)}
                className="h-8 text-xs flex-1 min-w-[160px]"
                min={0}
                max={Math.floor(divinity)}
              />
              <Button
                size="sm"
                variant="default"
                disabled={flameInvestValue <= 0 || divinity < flameInvestValue}
                onClick={() => {
                  investInFlame(flameInvestValue);
                  setFlameInvestAmount("");
                }}
                className="h-8 text-xs"
              >
                Invest {formatNumber(flameInvestValue, 0)}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={flameInvestAll <= 0}
                onClick={() => {
                  investInFlame(flameInvestAll);
                  setFlameInvestAmount("");
                }}
                className="h-8 text-xs"
                title="Invest 90% of current Divinity (keeps 10% for spending)"
              >
                Invest All (90%)
              </Button>
            </div>
          </section>
          )}

          {/* ===== 4. WORLD FORGE ===== */}
          {subtab === "worlds" && (
          <section className="stat-card">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
              <div className="text-[0.7rem] uppercase tracking-wide text-amber-300/80 flex items-center gap-1">
                <Hammer className="w-3 h-3" /> World Forge
              </div>
              <Badge variant="outline" className="text-[0.6rem] text-emerald-300 border-emerald-400/40">
                {worldsForged} forged (lifetime)
              </Badge>
            </div>
            <div className="text-[0.6rem] text-muted-foreground mb-2 leading-snug">
              Spend Divinity to create a new background world (Tier 1). Cost scales 1.5× per
              world already forged. Forged worlds persist across prestiges.
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs">
                <span className="text-muted-foreground">Next cost: </span>
                <span className="text-amber-300 font-mono">{formatNumber(forgeCost, 0)}</span>
                <span className="text-muted-foreground"> Divinity</span>
              </div>
              <Button
                size="sm"
                variant="default"
                disabled={!canForge}
                onClick={() => forgeWorld()}
                className="h-8 text-xs"
              >
                <Hammer className="w-3 h-3 mr-1" /> Forge World
              </Button>
            </div>
          </section>
          )}

          {/* ===== 5. CONVERGENCE CATALYSTS ===== */}
          {subtab === "boosts" && (
          <section className="stat-card">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
              <div className="text-[0.7rem] uppercase tracking-wide text-amber-300/80 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Convergence Catalysts
              </div>
              <Badge variant="outline" className="text-[0.6rem] text-cyan-300 border-cyan-400/40">
                {Object.values(purchasedCatalysts).filter(Boolean).length}/{CONVERGENCE_CATALYSTS.length} owned
              </Badge>
            </div>
            <div className="text-[0.6rem] text-muted-foreground mb-2 leading-snug">
              5 one-time permanent Divine Engine upgrades purchased with Divinity.
            </div>
            <div className="space-y-1">
              {CONVERGENCE_CATALYSTS.map((c) => {
                const owned = !!purchasedCatalysts[c.id];
                const canAfford = divinity >= c.cost;
                return (
                  <div
                    key={c.id}
                    className={`rounded-md border p-2 flex items-center gap-2 ${
                      owned ? "border-emerald-400/40 bg-emerald-500/5" : "border-border bg-muted/10"
                    }`}
                  >
                    <span className="text-lg shrink-0">{c.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold flex items-center gap-1">
                        {c.name}
                        {owned && (
                          <Badge className="text-[0.55rem] bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
                            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Owned
                          </Badge>
                        )}
                      </div>
                      <div className="text-[0.6rem] text-muted-foreground leading-snug">{c.desc}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[0.6rem] text-amber-300/80">{formatNumber(c.cost, 0)} Div</div>
                      <Button
                        size="sm"
                        variant={owned ? "ghost" : "default"}
                        disabled={owned || !canAfford}
                        onClick={() => purchaseCatalyst(c.id)}
                        className="h-7 mt-1 text-[0.65rem]"
                      >
                        {owned ? "Owned" : "Purchase"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          )}

          {/* ===== 6. WORLD TEMPLATES ===== */}
          {subtab === "boosts" && (
          <section className="stat-card">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
              <div className="text-[0.7rem] uppercase tracking-wide text-amber-300/80 flex items-center gap-1">
                <Globe className="w-3 h-3" /> World Templates
              </div>
              <Badge variant="outline" className="text-[0.6rem] text-violet-300 border-violet-400/40">
                {activeWorldTemplate ? WORLD_TEMPLATES.find((t) => t.id === activeWorldTemplate)?.name : "none"}
              </Badge>
            </div>
            <div className="text-[0.6rem] text-muted-foreground mb-2 leading-snug">
              Choose the "mode" of all background worlds. Only one active at a time. Switching costs 50 Divinity.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {WORLD_TEMPLATES.map((t) => {
                const isActive = activeWorldTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setWorldTemplate(isActive ? null : t.id)}
                    className={`stat-card text-left p-2 ${isActive ? "border-amber-400/60 bg-amber-500/10" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-base">{t.icon}</span>
                        <span className="text-xs font-medium">{t.name}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[0.55rem] ${isActive ? "text-amber-300 border-amber-400/40" : "text-muted-foreground"}`}
                      >
                        {isActive ? "ACTIVE" : `${t.divinityMult.toFixed(2)}×`}
                      </Badge>
                    </div>
                    <div className="text-[0.55rem] text-muted-foreground leading-snug">{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </section>
          )}

          {/* ===== 7. GENESIS SEEDS ===== */}
          {subtab === "boosts" && (
          <section className="stat-card">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
              <div className="text-[0.7rem] uppercase tracking-wide text-amber-300/80 flex items-center gap-1">
                <TreePine className="w-3 h-3" /> Genesis Seeds
              </div>
              <Badge
                variant="outline"
                className={`text-[0.6rem] ${
                  GENESIS_SEEDS.every((s) => plantedSeeds[s.id]?.planted)
                    ? "text-emerald-300 border-emerald-400/40"
                    : "text-amber-300 border-amber-400/40"
                }`}
              >
                {GENESIS_SEEDS.filter((s) => plantedSeeds[s.id]?.planted).length}/{GENESIS_SEEDS.length} planted → L4
              </Badge>
            </div>
            <div className="text-[0.6rem] text-muted-foreground mb-2 leading-snug">
              Plant seeds that mature into permanent Divinity generators. All 4 planted unlocks Genesis (L4).
            </div>
            <div className="space-y-1">
              {GENESIS_SEEDS.map((seed) => {
                const entry = plantedSeeds[seed.id];
                const planted = !!entry?.planted;
                const prog = seedProgress(seed.id);
                const canAfford = divinity >= seed.cost;
                return (
                  <div
                    key={seed.id}
                    className={`rounded-md border p-2 flex items-center gap-2 ${
                      planted && prog.mature ? "border-emerald-400/40 bg-emerald-500/5"
                      : planted ? "border-amber-400/40 bg-amber-500/5"
                      : "border-border bg-muted/10"
                    }`}
                  >
                    <span className="text-lg shrink-0">{seed.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold flex items-center gap-1 flex-wrap">
                        {seed.name}
                        {planted && prog.mature && (
                          <Badge className="text-[0.55rem] bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
                            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Mature (+{seed.divinityPerSec}/s)
                          </Badge>
                        )}
                        {planted && !prog.mature && (
                          <Badge className="text-[0.55rem] bg-amber-500/20 text-amber-300 border-amber-400/40">
                            <Clock className="w-2.5 h-2.5 mr-0.5" /> {Math.ceil(prog.remainingSec)}s
                          </Badge>
                        )}
                      </div>
                      <div className="text-[0.6rem] text-muted-foreground leading-snug">{seed.desc}</div>
                      {planted && !prog.mature && (
                        <div className="mt-1 h-1 bg-muted/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400/70 transition-all"
                            style={{ width: `${prog.progress * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[0.6rem] text-amber-300/80">{formatNumber(seed.cost, 0)} Div</div>
                      <Button
                        size="sm"
                        variant={planted ? "ghost" : "default"}
                        disabled={planted || !canAfford}
                        onClick={() => plantGenesisSeed(seed.id)}
                        className="h-7 mt-1 text-[0.65rem]"
                      >
                        {planted ? (prog.mature ? "Mature" : "Growing") : "Plant"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          )}

          {/* ===== ASTRAL RESONANCE REMOVED — system was not clear enough per user feedback ===== */}

          {/* ===== 9. INVESTMENT PORTFOLIOS (kept as-is) ===== */}
          {subtab === "investments" && (
          <section className="stat-card">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
              <div className="text-[0.7rem] uppercase tracking-wide text-amber-300/80 flex items-center gap-1">
                <Coins className="w-3 h-3" /> Divine Investment Portfolios
              </div>
              <div className="flex gap-1 flex-wrap">
                <Badge variant="outline" className="text-[0.6rem] text-sky-300 border-sky-400/40">
                  🌍 {formatCompact(backgroundSimulations)} worlds
                </Badge>
                <Badge variant="outline" className="text-[0.6rem] text-cyan-300 border-cyan-400/40">
                  ✨ {formatCompact(availableWorlds)} free
                </Badge>
                <Badge variant="outline" className="text-[0.6rem] text-emerald-300 border-emerald-400/40">
                  💰 +{formatNumber(totalPortfolioDivsPerSec, 2)} Div/s
                </Badge>
                <Badge variant="outline" className="text-[0.6rem] text-amber-300 border-amber-400/40">
                  🏆 {formatCompact(portfolioDividendsEarned)} lifetime
                </Badge>
              </div>
            </div>
            <div className="text-[0.65rem] text-muted-foreground mb-2 leading-snug">
              Allocate background worlds across 5 portfolios. Each pays Divinity dividends = worlds ×
              yield × peak production × 1%. Riskier portfolios crash and consume worlds.
              {purchasedCatalysts?.eternal_engine && (
                <span className="text-emerald-300"> Eternal Engine active — no crashes.</span>
              )}
            </div>
            <div className="space-y-1.5">
              {PORTFOLIOS.map((p) => {
                const alloc = Math.max(0, Math.floor(portfolioAllocations[p.id] || 0));
                const price = portfolioPrices[p.id] || 100;
                const priceBand = portfolioPriceLabel(price);
                const divs = portfolioDivsPerSec(p.id);
                const lockT = portfolioLockTimers[p.id] || 0;
                const locked = lockT > 0;
                const hasWorldsToAllocate = availableWorlds > 0;
                const hasWorldsToDeallocate = alloc > 0 && !locked;
                const crashWarning =
                  p.riskLevel === "extreme" ? "50% / tick ALL"
                  : p.riskLevel === "high" ? "30% / tick −30%"
                  : p.crashChance > 0 ? `${Math.round(p.crashChance * 100)}% / tick −${Math.round(p.crashLoss * 100)}%`
                  : null;
                const riskTone =
                  p.riskLevel === "extreme" ? "text-amber-300 border-amber-400/40"
                  : p.riskLevel === "high" ? "text-rose-300 border-rose-400/40"
                  : p.riskLevel === "medium" ? "text-violet-300 border-violet-400/40"
                  : p.riskLevel === "low" ? "text-emerald-300 border-emerald-400/40"
                  : "text-sky-300 border-sky-400/40";
                return (
                  <div key={p.id} className={`rounded-md border p-2 ${locked ? "border-sky-400/40 bg-sky-500/5" : "border-border bg-muted/10"}`}>
                    <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-lg shrink-0">{p.icon}</span>
                        <span className="text-xs font-semibold truncate">{p.name}</span>
                        <Badge variant="outline" className={`text-[0.55rem] capitalize ${riskTone}`}>
                          {riskLabel(p.riskLevel)}
                        </Badge>
                        {locked && (
                          <Badge className="text-[0.55rem] bg-sky-500/20 text-sky-300 border-sky-400/40">
                            <Lock className="w-2.5 h-2.5 mr-0.5" /> {Math.ceil(lockT)}s
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className={`text-sm font-mono ${priceBand.tone}`}>{price.toFixed(0)}</div>
                          <div className="text-[0.55rem] text-muted-foreground">
                            {priceBand.text} · +{(p.baseYield * 100).toFixed(0)}% yield
                          </div>
                        </div>
                        <div className="w-16 h-2 rounded-full bg-muted/40 overflow-hidden">
                          <div
                            className={`h-full ${price <= PORTFOLIO_PRICE_MIN + 20 ? "bg-emerald-400" : price >= PORTFOLIO_PRICE_MAX - 20 ? "bg-rose-400" : "bg-amber-400"}`}
                            style={{ width: `${((price - PORTFOLIO_PRICE_MIN) / (PORTFOLIO_PRICE_MAX - PORTFOLIO_PRICE_MIN)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-[0.6rem] text-muted-foreground leading-snug mb-1">{p.desc}</div>
                    <div className="flex items-center justify-between mb-1 text-[0.6rem]">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[0.55rem] text-amber-300 border-amber-400/40">
                          🌍 {alloc} worlds
                        </Badge>
                        <Badge variant="outline" className="text-[0.55rem] text-emerald-300 border-emerald-400/40">
                          💰 +{formatNumber(divs, 2)} Div/s
                        </Badge>
                        {crashWarning && (
                          <Badge variant="outline" className="text-[0.55rem] text-rose-300 border-rose-400/40 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> {crashWarning}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={!hasWorldsToAllocate}
                        onClick={() => allocateWorlds(p.id, 1)}
                        className="h-7 text-[0.65rem]"
                      >
                        +1
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={availableWorlds < 10}
                        onClick={() => allocateWorlds(p.id, 10)}
                        className="h-7 text-[0.65rem]"
                      >
                        +10
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!hasWorldsToAllocate}
                        onClick={() => allocateWorlds(p.id, availableWorlds)}
                        className="h-7 text-[0.65rem]"
                      >
                        +Max
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!hasWorldsToDeallocate}
                        onClick={() => deallocateWorlds(p.id, alloc)}
                        className="h-7 text-[0.65rem]"
                      >
                        −All
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Buy Star speed-up — bridges L3 dividend economy → L2 progress. */}
            <div className="mt-2 rounded-md border border-amber-400/30 bg-amber-500/5 p-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[0.7rem] font-medium text-amber-200">Buy Star from Market</div>
                <div className="text-[0.6rem] text-muted-foreground leading-snug">
                  {cheapestStar
                    ? <>Spend Divinity to light the cheapest unlit constellation star — {cheapestStar.cost} Div.</>
                    : "All constellation stars are lit."}
                </div>
              </div>
              <Button
                size="sm"
                variant="default"
                disabled={!canBuyCheapestStar}
                onClick={() => buyStarFromMarket()}
                className="h-7 text-[0.65rem] shrink-0"
              >
                {cheapestStar ? `Light (${cheapestStar.cost} Div)` : "None"}
              </Button>
            </div>
          </section>
          )}
        </div>
      )}

      <Separator className="my-2" />
      <div className="text-[0.65rem] text-muted-foreground px-1 space-y-0.5">
        <div>
          <span className="text-amber-300">Divine Engine</span> — your background worlds (Tier 1) produce
          Divinity based on your peak production rate, multiplied by Eternal Flame + active template.
          Forge worlds with Divinity, fuse them into higher tiers for more production per world
          (Ascendant tier and above are pure boosts).
        </div>
        <div>
          <span className="text-amber-300">Eternal Flame</span> — invest infinite Divinity for a
          logarithmic multiplier (unbounded growth).
        </div>
        <div>
          <span className="text-amber-300">Convergence Catalysts</span> — 5 one-time permanent upgrades
          (Harmonic Resonance, Stellar Furnace, Temporal Dilation, Divine Multiplication, Eternal Engine).
        </div>
        <div>
          <span className="text-amber-300">World Templates</span> — choose the "mode" of all worlds
          (Harmony / Crucible / Monastery / Ascendant / Void). Switching costs 50 Divinity.
        </div>
        <div>
          <span className="text-amber-300">Genesis Seeds</span> — plant all 4 to unlock L4 (Genesis).
          Each seed matures into a permanent Divinity/s generator.
        </div>
        <div>
          <span className="text-amber-300">Astral Resonance</span> — align ALL worlds to a constellation
          category (Zodiac / Northern / Equatorial / Southern) for a Div/s bonus with a tradeoff.
        </div>
        <div>
          <span className="text-amber-300">Investment Portfolios</span> — allocate background worlds
          across 5 portfolios for Divinity dividends. Riskier portfolios crash more often (Eternal Engine
          catalyst prevents crashes).
        </div>
        <div>Plant all 4 Genesis Seeds to unlock Layer 4 (Genesis).</div>
      </div>
    </>
  );
}
