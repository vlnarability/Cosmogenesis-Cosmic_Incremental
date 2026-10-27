"use client";

// WorldTab — PART-2 combined Trade + Rivals panel.
//
// Per user: 'Merge with Rivals Tab. Call it something like World or
// something else that makes sense for what it is. Player chooses an NPC
// from that list and can trade with them or do the rival actions.'
//
// Lists all NPCs (trade partners + rivals) for the current stage + past
// stages. Each NPC card shows:
//   - Name, icon, type (Trader / Rival)
//   - Relation (-100 to +100)
//   - State (active / allied / conquered / merged — for rivals)
//   - Trade status (established / not — for traders)
//   - Threat level (0-100 — for rivals)
//   - Action buttons: Establish Trade / Break Trade (traders),
//     Raid / Counter-Raid / Sign Treaty (rivals)
//
// Also shows Trade Caravan progress: how many caravans are assigned to
// each partner + bonus resource rate. Per user: 'Add a way to see
// progress on the World tab.'
//
// NOTE: this is the UI skeleton. The full rival mechanics (threat decay
// tick, raid events, counter-raid action, assimilation logic) are
// implemented in subsequent rounds. The trade establish/break actions
// are stubs in the store (establishTrade / breakTrade) — they log but
// don't yet apply costs or generate passive bonuses. That wiring is next.

import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { tradePartnersForStage, TRADE_PARTNER_MAP } from "@/game/data/tradePartners";
import { RIVAL_MAP, assimilationCost, MIL_REDUCTION_PER_COUNTER, CUL_REDUCTION_PER_TRADE } from "@/game/data/rivals";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, TrendingUp, Swords, Handshake, AlertTriangle, Check } from "lucide-react";
import { formatNumber, resourceIcon, resourceName, resourceColor } from "../shared/format";
import { cn } from "@/lib/utils";

export function WorldTab() {
  const stageIndex = useGameStore((s) => s.stageIndex);
  const stage = STAGES[stageIndex];
  const tradeAgreements = useGameStore((s) => s.tradeAgreements || {});
  const rivals = useGameStore((s) => s.rivals || []);
  const ownedSystems = useGameStore((s) => s.ownedSystems || {});
  const establishTrade = useGameStore((s) => s.establishTrade);
  const breakTrade = useGameStore((s) => s.breakTrade);
  const counterRaid = useGameStore((s) => s.counterRaid);
  const assimilateRival = useGameStore((s) => s.assimilateRival);
  const resources = useGameStore((s) => s.resources || {});

  // Collect all trade partners for the current stage + earlier stages
  // (the player may have established trade routes in past stages that
  // are still active).
  const stageIds = STAGES.slice(0, stageIndex + 1).map((s) => s.id);
  const allPartners = stageIds.flatMap((sid) => tradePartnersForStage(sid));

  // Trade Caravan count — sum across ALL stage-specific caravan systems.
  // Each stage has its own (tribal_trade_caravan, trade_caravan,
  // empire_trade_caravan, solar_trade_caravan, galactic_trade_caravan).
  const caravanCount =
    (ownedSystems["tribal_trade_caravan"] || 0) +
    (ownedSystems["trade_caravan"] || 0) +
    (ownedSystems["empire_trade_caravan"] || 0) +
    (ownedSystems["solar_trade_caravan"] || 0) +
    (ownedSystems["galactic_trade_caravan"] || 0);

  // Rivals for the current + past stages.
  const stageRivals = rivals.filter((r) => {
    const rStageIdx = STAGES.findIndex((s) => s.id === r.stage);
    return rStageIdx >= 0 && rStageIdx <= stageIndex;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" />
            World
          </CardTitle>
          <CardDescription>
            Trade partners and rival civilizations. Establish trade routes for bonus resources, or engage rivals militarily.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="text-[0.65rem]">
              <Handshake className="w-3 h-3 mr-1" />
              {Object.keys(tradeAgreements).length} trade route{Object.keys(tradeAgreements).length === 1 ? "" : "s"}
            </Badge>
            {caravanCount > 0 && (
              <Badge variant="outline" className="text-[0.65rem]">
                <TrendingUp className="w-3 h-3 mr-1" />
                {caravanCount} trade caravan{caravanCount === 1 ? "" : "s"}
              </Badge>
            )}
            {stageRivals.length > 0 && (
              <Badge variant="outline" className="text-[0.65rem] text-rose-400 border-rose-500/30">
                <Swords className="w-3 h-3 mr-1" />
                {stageRivals.filter((r) => r.state === "active").length} active rival{stageRivals.filter((r) => r.state === "active").length === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trade Partners */}
      {allPartners.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Handshake className="w-4 h-4 text-cyan-400" />
            Trade Partners
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {allPartners.map((p) => {
              const agreement = tradeAgreements[p.id];
              const isEstablished = !!agreement;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "stat-card rounded-lg border p-3 transition-colors",
                    isEstablished ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60"
                  )}
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    <span className="text-lg shrink-0">{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-sm truncate">{p.name}</span>
                        <span className="text-[0.55rem] text-muted-foreground uppercase tracking-wide shrink-0">
                          {p.stage}
                        </span>
                      </div>
                      <p className="text-[0.7rem] text-muted-foreground italic leading-snug">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                  <div className="text-[0.65rem] text-muted-foreground mb-2">
                    Gives: <span className="font-semibold text-foreground">{resourceIcon(p.givesResource)} {resourceName(p.givesResource)} +{p.bonusPerTick}/s</span>
                    {p.rareDrop && (
                      <span className="ml-2">Rare: <span className="text-amber-400">{resourceName(p.rareDrop.resource)} ({(p.rareDrop.chance * 100).toFixed(0)}%)</span></span>
                    )}
                  </div>
                  {isEstablished && (
                    <div className="text-[0.65rem] text-emerald-400 mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Active — {caravanCount > 0 ? `×${caravanCount} caravans` : "no caravans assigned"}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    {!isEstablished ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs flex-1"
                        onClick={() => establishTrade(p.id)}
                      >
                        Establish Trade
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs flex-1 text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                        onClick={() => breakTrade(p.id)}
                      >
                        Break Trade
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rivals */}
      {stageRivals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Swords className="w-4 h-4 text-rose-400" />
            Rivals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {stageRivals.map((r) => {
              const isActive = r.state === "active";
              const rivalDef = RIVAL_MAP[r.id];
              const cost = isActive
                ? assimilationCost(r.id, r.counteredRaids || 0, r.successfulTrades || 0)
                : { military: 0, culture: 0 };
              const milHave = resources.military_power || 0;
              const culHave = resources.culture || 0;
              const canAssimilate = isActive && milHave >= cost.military && culHave >= cost.culture;
              return (
                <div
                  key={r.id}
                  className={cn(
                    "stat-card rounded-lg border p-3 transition-colors",
                    isActive ? "border-rose-500/40 bg-rose-500/5" : "border-emerald-500/40 bg-emerald-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{r.icon}</span>
                      <span className="font-semibold text-sm truncate">{r.name}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[0.55rem]",
                        isActive
                          ? "text-rose-400 border-rose-500/40"
                          : "text-emerald-400 border-emerald-500/40"
                      )}
                    >
                      {r.state}
                    </Badge>
                  </div>
                  {isActive && (
                    <>
                      <div className="text-[0.65rem] text-muted-foreground mb-1">
                        Threat: <span className={cn("font-semibold", r.threat > 70 ? "text-rose-400" : r.threat > 40 ? "text-amber-400" : "text-emerald-400")}>{r.threat.toFixed(0)}/100</span>
                      </div>
                      <div className="text-[0.65rem] text-muted-foreground mb-1">
                        Relation: <span className={cn("font-semibold", r.relation > 0 ? "text-emerald-400" : r.relation < -50 ? "text-rose-400" : "text-amber-400")}>{r.relation > 0 ? "+" : ""}{r.relation.toFixed(0)}</span>
                      </div>
                      {r.threat > 70 && (
                        <div className="text-[0.6rem] text-rose-400 italic flex items-center gap-1 mb-2">
                          <AlertTriangle className="w-3 h-3" />
                          Raid imminent — build military!
                        </div>
                      )}
                      {/* ASSIMILATION-COST-DISPLAY per user spec */}
                      <div className="text-[0.6rem] text-muted-foreground mb-2 p-1.5 rounded bg-muted/30 border border-border/40">
                        <div className="font-semibold mb-0.5">Assimilation cost:</div>
                        <div className="flex flex-wrap gap-2">
                          <span style={{ color: resourceColor("military_power") }}>
                            ⚔️ {formatNumber(cost.military, 0)} mil
                            <span className="text-muted-foreground/70 ml-1">(have {formatNumber(milHave, 0)})</span>
                          </span>
                          <span style={{ color: resourceColor("culture") }}>
                            🎭 {formatNumber(cost.culture, 0)} cul
                            <span className="text-muted-foreground/70 ml-1">(have {formatNumber(culHave, 0)})</span>
                          </span>
                        </div>
                        <div className="mt-1 text-[0.55rem] text-muted-foreground/70">
                          Counter-raids: {r.counteredRaids || 0} (−{(r.counteredRaids || 0) * MIL_REDUCTION_PER_COUNTER} mil) ·
                          Successful trades: {Math.floor(r.successfulTrades || 0)} (−{Math.floor(r.successfulTrades || 0) * CUL_REDUCTION_PER_TRADE} cul)
                        </div>
                      </div>
                    </>
                  )}
                  {!isActive && (
                    <div className="text-[0.65rem] text-emerald-400 mb-2 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Resolved — {rivalDef?.assimilationBonus?.desc || "no longer a threat."}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1"
                      disabled={!isActive}
                      onClick={() => counterRaid(r.id)}
                    >
                      Counter-Raid
                    </Button>
                    <Button
                      size="sm"
                      variant={canAssimilate ? "default" : "outline"}
                      className={cn("h-7 text-xs flex-1", canAssimilate && "bg-amber-500/20 border-amber-500/40")}
                      disabled={!canAssimilate}
                      onClick={() => assimilateRival(r.id)}
                    >
                      Assimilate
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {allPartners.length === 0 && stageRivals.length === 0 && (
        <Card className="glass-panel">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No trade partners or rivals yet.</p>
            <p className="text-xs mt-1">Advance to later stages to meet your neighbors.</p>
          </CardContent>
        </Card>
      )}

      {/* Hunting action placeholder — per user: 'add a hunt button on
          actions that spends military and/or pop to trigger immediately'.
          This belongs on the Actions tab, not here. Documented for next round. */}
    </div>
  );
}
