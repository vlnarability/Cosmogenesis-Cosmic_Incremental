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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, TrendingUp, Swords, Handshake, AlertTriangle } from "lucide-react";
import { formatNumber, resourceIcon, resourceName } from "../shared/format";
import { cn } from "@/lib/utils";

export function WorldTab() {
  const stageIndex = useGameStore((s) => s.stageIndex);
  const stage = STAGES[stageIndex];
  const tradeAgreements = useGameStore((s) => s.tradeAgreements || {});
  const rivals = useGameStore((s) => s.rivals || []);
  const ownedSystems = useGameStore((s) => s.ownedSystems || {});
  const establishTrade = useGameStore((s) => s.establishTrade);
  const breakTrade = useGameStore((s) => s.breakTrade);

  // Collect all trade partners for the current stage + earlier stages
  // (the player may have established trade routes in past stages that
  // are still active).
  const stageIds = STAGES.slice(0, stageIndex + 1).map((s) => s.id);
  const allPartners = stageIds.flatMap((sid) => tradePartnersForStage(sid));

  // Trade Caravan count (civ stage system). Shows how many caravans the
  // player owns — these generate the bonus resources for trade agreements.
  const caravanCount = ownedSystems["trade_caravan"] || 0;

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
              return (
                <div
                  key={r.id}
                  className={cn(
                    "stat-card rounded-lg border p-3 transition-colors",
                    isActive ? "border-rose-500/40 bg-rose-500/5" : "border-emerald-500/40 bg-emerald-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-sm">{r.name}</span>
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
                      <div className="text-[0.65rem] text-muted-foreground mb-2">
                        Relation: <span className={cn("font-semibold", r.relation > 0 ? "text-emerald-400" : r.relation < -50 ? "text-rose-400" : "text-amber-400")}>{r.relation > 0 ? "+" : ""}{r.relation.toFixed(0)}</span>
                      </div>
                      {r.threat > 70 && (
                        <div className="text-[0.6rem] text-rose-400 italic flex items-center gap-1 mb-2">
                          <AlertTriangle className="w-3 h-3" />
                          Raid imminent — build military!
                        </div>
                      )}
                    </>
                  )}
                  {!isActive && (
                    <div className="text-[0.65rem] text-emerald-400 mb-2">
                      Resolved — no longer a threat.
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1"
                      disabled={!isActive}
                    >
                      Raid
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1"
                      disabled={!isActive}
                    >
                      Counter-Raid
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1"
                      disabled={!isActive}
                    >
                      Treaty
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
