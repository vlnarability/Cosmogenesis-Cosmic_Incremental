"use client";

import { useGameStore } from "@/game/state/store";
import {
  OFFERINGS,
  RITUALS,
  SCRIPTS,
  BLOOD_PACTS,
  offeringDivinityAtRepeat,
} from "@/game/data/transcendence";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lock, Triangle, CheckCircle2, Clock, TrendingUp, TrendingDown, Coins } from "lucide-react";
import { formatNumber, resourceName } from "../shared/format";

const MARKET_RESOURCES = ["food", "water", "materials", "science", "gold", "energy"] as const;
const MARKET_LABELS: Record<string, { icon: string; color: string }> = {
  food: { icon: "🌾", color: "text-amber-300" },
  water: { icon: "💧", color: "text-sky-300" },
  materials: { icon: "🪨", color: "text-stone-300" },
  science: { icon: "🔬", color: "text-cyan-300" },
  gold: { icon: "🪙", color: "text-yellow-300" },
  energy: { icon: "⚡", color: "text-violet-300" },
};

export function TranscendenceModal() {
  const show = useGameStore((s) => s.showTranscendence);
  const setShow = useGameStore((s) => s.setShowTranscendence);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const divinity = useGameStore((s) => s.divinity);
  const population = useGameStore((s) => s.population);
  const resources = useGameStore((s) => s.resources);
  const time = useGameStore((s) => s.time);
  const offeringsUsed = useGameStore((s) => s.transcendenceOfferingsUsed || {});
  const purchasedRituals = useGameStore((s) => s.purchasedRituals || {});
  const activeTemporaryRituals = useGameStore((s) => s.activeTemporaryRituals || {});
  const activeScripts = useGameStore((s) => s.activeScripts || {});
  const bloodPactsUsed = useGameStore((s) => s.bloodPactsUsed || {});
  // QUICK WIN 3 — ritual combo tracking
  const lastRitualTime = useGameStore((s) => s.lastRitualTime || 0);
  const lastRitualId = useGameStore((s) => s.lastRitualId);
  const ritualComboCount = useGameStore((s) => s.ritualComboCount || 0);
  const ritualComboTimer = useGameStore((s) => s.ritualComboTimer || 0);

  const performOffering = useGameStore((s) => s.performOffering);
  const performRitual = useGameStore((s) => s.performRitual);
  const toggleScript = useGameStore((s) => s.toggleScript);
  const performBloodPact = useGameStore((s) => s.performBloodPact);

  // REBUILD L3 — Divine Market state
  const marketPrices = useGameStore((s) => s.marketPrices || {});
  const priceHistory = useGameStore((s) => s.priceHistory || {});
  const marketOwned = useGameStore((s) => s.marketOwnedResources || {});
  const marketTickTimer = useGameStore((s) => s.marketTickTimer || 0);
  const marketBuy = useGameStore((s) => s.marketBuyResource);
  const marketSell = useGameStore((s) => s.marketSellResource);
  const marketOffering = useGameStore((s) => s.marketOffering);
  // FEATURE 3 — Market Crashes
  const marketCrashActive = useGameStore((s) => !!s.marketCrashActive);
  const marketCrashDuration = useGameStore((s) => s.marketCrashDuration || 0);
  const marketCrashTimer = useGameStore((s) => s.marketCrashTimer || 0);

  const isUnlocked = !!unlockedLayers.transcendence;
  const pactsUsedCount = BLOOD_PACTS.filter((p) => bloodPactsUsed[p.id]).length;

  // Compute dividends (live from owned resource counts ≥ 100)
  const dividendsPerSec = MARKET_RESOURCES.filter((r) => (marketOwned[r] || 0) >= 100).length;

  // QUICK WIN 3 — combo display
  const comboActive = ritualComboTimer > 0;
  const secondsSinceLast = Math.max(0, time - lastRitualTime);
  const windowRemaining = comboActive ? ritualComboTimer : Math.max(0, 60 - secondsSinceLast);
  const comboLabel = comboActive
    ? `Divine Combo! +50% production — ${Math.ceil(ritualComboTimer)}s remaining`
    : `Combo: ${ritualComboCount}/3 (${Math.ceil(windowRemaining)}s remaining in window)`;

  // Price-trend helper for an individual resource
  function priceTrend(resId: string): "up" | "down" | "flat" {
    const hist = priceHistory[resId] || [];
    if (hist.length < 2) return "flat";
    const last = hist[hist.length - 1];
    const prev = hist[hist.length - 2];
    if (last > prev * 1.05) return "up";
    if (last < prev * 0.95) return "down";
    return "flat";
  }

  function avgPrice(resId: string): number {
    const hist = priceHistory[resId] || [];
    if (hist.length === 0) return marketPrices[resId] || 10;
    return hist.reduce((a: number, b: number) => a + b, 0) / hist.length;
  }

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Triangle className="w-5 h-5" />
            Layer 3 — Transcendence (Divine Market)
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>
              Buy low, sell high. Sacrifice resources for Divinity. All 4 Blood Pacts unlock Genesis.
            </span>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-violet-300 border-violet-400/40">
                {formatNumber(divinity, 0)} Divinity
              </Badge>
              <Badge variant="outline" className="text-rose-300 border-rose-400/40">
                {pactsUsedCount}/4 pacts
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Transcendence is sealed.</p>
            <p className="text-xs mt-1">Inscribe 10 Foresight nodes (Layer 2) to unlock Transcendence.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* FEATURE 3 — Market Crash banner */}
            {marketCrashActive ? (
              <div className="rounded-md border border-rose-400/70 bg-rose-500/20 p-2 text-[0.75rem] text-rose-200 flex items-center gap-2 animate-pulse">
                <span className="text-base">⚠</span>
                <span className="font-semibold flex-1">MARKET CRASH! All prices dropped to 30% of base — buy now to profit on recovery.</span>
                <Badge variant="outline" className="text-[0.6rem] text-rose-200 border-rose-400/60">
                  {Math.ceil(marketCrashDuration)}s remaining
                </Badge>
              </div>
            ) : (
              <div className="rounded-md border border-muted-foreground/20 bg-muted/10 p-1.5 text-[0.65rem] text-muted-foreground flex items-center gap-2">
                <span className="text-base">📊</span>
                <span className="flex-1">Next market crash check in <span className="font-mono text-amber-300">{Math.ceil(marketCrashTimer)}s</span> (20% chance).</span>
              </div>
            )}

            {/* Divine Market — the new mini-game */}
            <section className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[0.7rem] uppercase tracking-wide text-amber-300/80 flex items-center gap-1">
                  <Coins className="w-3 h-3" /> Divine Market
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-[0.6rem] text-cyan-300 border-cyan-400/40">
                    ⏱ next tick {Math.ceil(marketTickTimer)}s
                  </Badge>
                  <Badge variant="outline" className="text-[0.6rem] text-emerald-300 border-emerald-400/40">
                    💎 Dividends: +{dividendsPerSec} Div/s
                  </Badge>
                </div>
              </div>
              <div className="text-[0.65rem] text-muted-foreground mb-2">
                Prices random-walk ±30% every 10s. Owning 100+ of a resource grants +1 Divinity/s as a Divine-dend.
                Offerings yield more Divinity when the price is HIGH.
              </div>
              <div className="space-y-1.5">
                {MARKET_RESOURCES.map((resId) => {
                  const price = marketPrices[resId] || 10;
                  const hist = priceHistory[resId] || [];
                  const trend = priceTrend(resId);
                  const avg = avgPrice(resId);
                  const owned = marketOwned[resId] || 0;
                  const label = MARKET_LABELS[resId];
                  const highPrice = price > avg * 1.1;
                  const canBuy1 = divinity >= price;
                  const canSell1 = owned >= 1;
                  const canOffer10 = owned >= 10;
                  // Max height for sparkline bars (relative to last 20 prices)
                  const maxHist = Math.max(...hist, price, 1);
                  return (
                    <div key={resId} className="rounded-md border border-border bg-muted/10 p-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">{label?.icon}</span>
                          <span className={`text-xs font-medium ${label?.color || ""}`}>{resourceName(resId)}</span>
                          <Badge variant="outline" className="text-[0.55rem]">{owned} owned</Badge>
                          {owned >= 100 && (
                            <Badge className="text-[0.55rem] bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
                              💎 +1 Div/s
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className={`text-sm font-mono ${highPrice ? "text-emerald-300" : "text-foreground"}`}>
                              {price.toFixed(1)} Div
                            </div>
                            <div className="text-[0.55rem] text-muted-foreground">
                              avg {avg.toFixed(1)} {trend === "up" ? <TrendingUp className="inline w-2.5 h-2.5 text-emerald-400" /> : trend === "down" ? <TrendingDown className="inline w-2.5 h-2.5 text-rose-400" /> : "—"}
                            </div>
                          </div>
                          {/* Sparkline */}
                          <div className="flex items-end gap-0.5 h-8 w-24">
                            {hist.slice(-20).map((h: number, i: number) => {
                              const hgt = Math.max(2, (h / maxHist) * 100);
                              const isLast = i === hist.length - 1;
                              return (
                                <div
                                  key={i}
                                  className={`flex-1 ${isLast ? "bg-amber-400" : "bg-cyan-400/40"}`}
                                  style={{ height: `${hgt}%` }}
                                  title={`${h.toFixed(1)}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <Button size="sm" variant="default" disabled={!canBuy1} onClick={() => marketBuy(resId, 1)} className="h-7 text-[0.65rem]">
                          Buy 1 ({price.toFixed(1)})
                        </Button>
                        <Button size="sm" variant="outline" disabled={!canSell1} onClick={() => marketSell(resId, 1)} className="h-7 text-[0.65rem]">
                          Sell 1 (+{price.toFixed(1)})
                        </Button>
                        <Button size="sm" variant="ghost" disabled={!canOffer10} onClick={() => marketOffering(resId, 10)} className="h-7 text-[0.65rem]">
                          Offer 10 (+{(10 * price * 1.5).toFixed(0)})
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* QUICK WIN 3 — Ritual combo progress banner */}
            <div className={`rounded-md border p-2 text-[0.7rem] flex items-center gap-2 ${comboActive ? "border-amber-400/60 bg-amber-500/10 text-amber-200" : "border-border bg-muted/20 text-muted-foreground"}`}>
              <span className="text-base">{comboActive ? "🌟" : "🔗"}</span>
              <span className="font-medium">{comboLabel}</span>
              {lastRitualId && !comboActive && (
                <span className="ml-auto text-[0.6rem] opacity-80">Last ritual: {RITUALS.find((r) => r.id === lastRitualId)?.name || lastRitualId}</span>
              )}
            </div>

            {/* Classic offerings — preserved */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">Offerings (sacrifice in-game resources → Divinity)</div>
              <div className="space-y-1.5">
                {OFFERINGS.map((o) => {
                  const repeats = offeringsUsed[o.id] || 0;
                  const gain = offeringDivinityAtRepeat(o, repeats);
                  const canAfford = Object.entries(o.cost).every(([r, v]) => (resources[r] || 0) >= (v as number));
                  return (
                    <div key={o.id} className="stat-card flex items-center gap-3 py-2">
                      <span className="text-xl shrink-0">{o.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{o.name}</div>
                        <div className="text-[0.65rem] text-muted-foreground leading-snug">{o.desc}</div>
                        <div className="text-[0.6rem] text-muted-foreground mt-0.5">
                          Cost: {Object.entries(o.cost).map(([r, v]) => `${formatNumber(v as number, 0)} ${resourceName(r)}`).join(", ")}
                          {repeats > 0 && <span className="ml-1 text-amber-300/80">· repeat {repeats} (×{o.repeatMult.toFixed(2)})</span>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[0.6rem] text-emerald-300/80">+{gain} Div</div>
                        <Button size="sm" className="h-7 mt-1" disabled={!canAfford} onClick={() => performOffering(o.id)}>
                          Offer
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Rituals */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">Rituals (spend Divinity for effects)</div>
              <div className="space-y-1.5">
                {RITUALS.map((r) => {
                  const purchased = r.kind === "permanent" && purchasedRituals[r.id];
                  const active = r.kind === "temporary" && (activeTemporaryRituals[r.id] || 0) > 0;
                  const canAfford = divinity >= r.cost;
                  return (
                    <div key={r.id} className={`stat-card flex items-center gap-3 py-2 ${purchased || active ? "border-emerald-400/40" : ""}`}>
                      <span className="text-xl shrink-0">{r.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{r.name}</span>
                          <Badge variant="outline" className="text-[0.6rem] capitalize">{r.kind}</Badge>
                          {purchased && (
                            <Badge className="text-[0.6rem] bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Permanent
                            </Badge>
                          )}
                          {active && (
                            <Badge className="text-[0.6rem] bg-amber-500/20 text-amber-300 border-amber-400/40">
                              <Clock className="w-2.5 h-2.5 mr-0.5" /> {Math.ceil(activeTemporaryRituals[r.id])}s
                            </Badge>
                          )}
                        </div>
                        <div className="text-[0.65rem] text-muted-foreground leading-snug">{r.desc}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[0.6rem] text-violet-300/80">{r.cost} Div</div>
                        <Button size="sm" className="h-7 mt-1" disabled={!!purchased || !!active || !canAfford} onClick={() => performRitual(r.id)}>
                          {purchased ? "Owned" : active ? "Active" : "Perform"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Scripts */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">Scripts (toggleable automation)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {SCRIPTS.map((sc) => {
                  const on = !!activeScripts[sc.id];
                  return (
                    <button key={sc.id} onClick={() => toggleScript(sc.id)} className={`stat-card text-left p-2 ${on ? "border-amber-400/60 bg-amber-500/10" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{sc.icon}</span>
                          <span className="text-xs font-medium">{sc.name}</span>
                        </div>
                        <Badge variant="outline" className={`text-[0.6rem] ${on ? "text-amber-300 border-amber-400/40" : "text-muted-foreground"}`}>
                          {on ? "ON" : "OFF"}
                        </Badge>
                      </div>
                      <div className="text-[0.6rem] text-muted-foreground mt-0.5 leading-snug">{sc.desc}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Blood Pacts */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">Blood Pacts (sacrifice population → Divinity, once per run)</div>
              <div className="space-y-1.5">
                {BLOOD_PACTS.map((p) => {
                  const used = !!bloodPactsUsed[p.id];
                  const canAffordPop = population >= p.popCost;
                  return (
                    <div key={p.id} className={`stat-card flex items-center gap-3 py-2 ${used ? "border-rose-400/40 opacity-60" : ""}`}>
                      <span className="text-xl shrink-0">{p.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{p.name}</div>
                        <div className="text-[0.65rem] text-muted-foreground leading-snug">{p.desc}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[0.6rem] text-rose-300/80">-{p.popCost} pop</div>
                        <div className="text-[0.6rem] text-emerald-300/80">+{p.divinityGain} Div</div>
                        <Button size="sm" className="h-7 mt-1" disabled={used || !canAffordPop} onClick={() => performBloodPact(p.id)}>
                          {used ? "Used" : "Pact"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1">
          <span className="text-amber-300">Divine Market</span> prices drift every 10s — buy low and sell high to multiply your Divinity.
          Owning 100+ of any market resource grants a passive <span className="text-emerald-300">Divine-dend</span> of +1 Div/s.
          Perform all 4 Blood Pacts to unlock Layer 4 (Genesis).
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShow(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
