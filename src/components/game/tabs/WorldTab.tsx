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
import { tradePartnersForStage, shipmentIntervalEff, shipmentAmount, caravanMultOf, caravanIconForStage, reputationTierOf, reputationBenefits, TRADE_PARTNER_MAP, type TradePartner } from "@/game/data/tradePartners";
import {
  assimilationCost,
  MIL_REDUCTION_PER_COUNTER,
  CUL_REDUCTION_PER_TRADE,
  estimateTimeToRaid,
  formatTimeToRaid,
  threatStage,
  relationLabel,
  counterAttackCost,
} from "@/game/data/rivals";
import { RARE_RESOURCES, RARE_RESOURCE_MAP, formatReachableSources } from "@/game/data/rareResources";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe, TrendingUp, Swords, Handshake, AlertTriangle, Check, Gem, FileText,
  ChevronDown, ChevronRight, ShieldAlert, Lock, Timer, Crosshair, Scale, Package, Gift,
  Sparkles, ScrollText,
} from "lucide-react";
import { formatNumber, resourceIcon, resourceName, resourceColor } from "../shared/format";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect, useRef } from "react";

export function WorldTab() {
  const stageIndex = useGameStore((s) => s.stageIndex);
  const stage = STAGES[stageIndex];
  const tradeAgreements = useGameStore((s) => s.tradeAgreements || {});
  const rivals = useGameStore((s) => s.rivals || []);
  const ownedSystems = useGameStore((s) => s.ownedSystems || {});
  const technologies = useGameStore((s) => s.technologies || {});
  const establishTrade = useGameStore((s) => s.establishTrade);
  const breakTrade = useGameStore((s) => s.breakTrade);
  const counterRaid = useGameStore((s) => s.counterRaid);
  const assimilateRival = useGameStore((s) => s.assimilateRival);
  const resources = useGameStore((s) => s.resources || {});
  const rareResources = useGameStore((s) => s.rareResources || {});
  const reliquary = useGameStore((s) => s.reliquary || {});
  const consumeRare = useGameStore((s) => s.consumeRare);
  const treaties = useGameStore((s) => s.treaties || {});
  const signTreaty = useGameStore((s) => s.signTreaty);
  const breakTreaty = useGameStore((s) => s.breakTreaty);
  const [treatyPartner, setTreatyPartner] = useState<string | null>(null);
  const [intelOpen, setIntelOpen] = useState<string | null>(null);

  // Collect all trade partners for the current stage + earlier stages
  // (the player may have established trade routes in past stages that
  // are still active).
  const stageIds = STAGES.slice(0, stageIndex + 1).map((s) => s.id);
  const allPartners = stageIds.flatMap((sid) => tradePartnersForStage(sid));

  // Trade Caravan count — sum across ALL stage-specific caravan systems.
  // Each stage has its own (tribal_trade_caravan, trade_caravan,
  // empire_trade_caravan, solar_trade_caravan, galactic_trade_caravan).
  // SHIPMENT-HELPERS: caravanMultOf is the SAME formula the tick uses, so
  // the card's ETA matches the simulation exactly.
  const caravanCount =
    (ownedSystems["tribal_trade_caravan"] || 0) +
    (ownedSystems["trade_caravan"] || 0) +
    (ownedSystems["empire_trade_caravan"] || 0) +
    (ownedSystems["solar_trade_caravan"] || 0) +
    (ownedSystems["galactic_trade_caravan"] || 0);
  const caravanMult = caravanMultOf(ownedSystems);

  // Rivals for the current + past stages. Exclude hidden rivals (those
  // that didn't make the cut at Cell→Creature carry-forward).
  const stageRivals = rivals.filter((r) => {
    const rStageIdx = STAGES.findIndex((s) => s.id === r.stage);
    return rStageIdx >= 0 && rStageIdx <= stageIndex && !r.hidden;
  });

  // S7 RIVAL COLLAPSE — group rivals by stage so a Galactic player can
  // collapse the Creature/Tribal noise. Default: current stage expanded,
  // earlier stages collapsed. Per-card collapse lets the player fold
  // individual cards within an expanded stage. Both states persist for the
  // session (component state, not saved — a fresh visit resets to defaults).
  const currentStageId = STAGES[stageIndex]?.id;
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set());
  const [collapsedRivals, setCollapsedRivals] = useState<Set<string>>(new Set());
  // Group rivals by stage, ordered current-stage-first then earlier stages
  // reverse-chronological (so Tribal sorts above Creature, etc.).
  const rivalsByStage = useMemo(() => {
    const groups: { stageId: string; rivals: typeof stageRivals }[] = [];
    const seen = new Set<string>();
    // Current stage first.
    if (currentStageId) {
      const cur = stageRivals.filter((r) => r.stage === currentStageId);
      if (cur.length) { groups.push({ stageId: currentStageId, rivals: cur }); seen.add(currentStageId); }
    }
    // Earlier stages reverse-chronological.
    for (let i = stageIndex - 1; i >= 0; i--) {
      const sid = STAGES[i].id;
      if (seen.has(sid)) continue;
      const g = stageRivals.filter((r) => r.stage === sid);
      if (g.length) groups.push({ stageId: sid, rivals: g });
    }
    return groups;
  }, [stageRivals, stageIndex, currentStageId]);
  const toggleStage = (sid: string) => setCollapsedStages((prev) => {
    const next = new Set(prev);
    if (next.has(sid)) next.delete(sid); else next.add(sid);
    return next;
  });
  const toggleRival = (rid: string) => setCollapsedRivals((prev) => {
    const next = new Set(prev);
    if (next.has(rid)) next.delete(rid); else next.add(rid);
    return next;
  });

  // F3 TREATIES OVERVIEW — derive a display row per active treaty with the
  // partner name + the CONCRETE effect it's applying. Partners can be trade
  // partners OR rivals; look both up. Effects mirror the tick wiring exactly
  // (research_pact +10% science, trade_agreement ×1.2 cadence, etc.) so the
  // card never disagrees with the simulation.
  const treatyRows = useMemo(() => {
    return Object.entries(treaties).map(([partnerId, t]) => {
      const partner = TRADE_PARTNER_MAP[partnerId];
      const rival = rivals.find((r) => r.id === partnerId);
      const partnerName = partner?.name || rival?.name || partnerId;
      const icon = partner?.icon || rival?.icon || "📜";
      let typeLabel = "";
      let effectDetail = "";
      let colorClass = "text-muted-foreground";
      switch (t.type) {
        case "trade_agreement":
          typeLabel = "Trade Agreement";
          effectDetail = "×1.2 shipment cadence";
          colorClass = "text-emerald-300";
          break;
        case "non_aggression":
          typeLabel = "Non-Aggression";
          effectDetail = "threat growth ×0.5";
          colorClass = "text-cyan-300";
          break;
        case "mutual_defense":
          typeLabel = "Mutual Defense";
          effectDetail = "auto-win defends";
          colorClass = "text-amber-300";
          break;
        case "research_pact":
          typeLabel = "Research Pact";
          effectDetail = "+10% science";
          colorClass = "text-violet-300";
          break;
      }
      return { partnerId, partnerName, icon, typeLabel, effectDetail, colorClass };
    });
  }, [treaties, rivals]);
  const treatyCount = treatyRows.length;

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

      {/* F3 TREATIES OVERVIEW — a single card listing every active treaty
          with its partner + the CONCRETE effect it's applying right now.
          research_pact's +10% science is wired in the tick but was invisible;
          this card makes diplomacy legible. Shown only when ≥1 treaty exists. */}
      {treatyCount > 0 && (
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-violet-300" />
              Active Treaties
              <Badge variant="outline" className="text-[0.55rem] text-violet-300 border-violet-500/30 ml-1">
                {treatyCount}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Each treaty applies a concrete effect — hover a treaty for the relation cost it took to sign.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {treatyRows.map((row) => (
                <div
                  key={row.partnerId}
                  className="flex items-center gap-2 p-1.5 rounded-md bg-muted/20 border border-border/40"
                  title={`Signed with ${row.partnerName}. ${row.effectDetail}`}
                >
                  <span className="text-base shrink-0">{row.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.7rem] font-semibold truncate">{row.partnerName}</div>
                    <div className={cn("text-[0.6rem] font-medium", row.colorClass)}>{row.typeLabel}</div>
                  </div>
                  <span className="text-[0.55rem] text-muted-foreground text-right leading-tight shrink-0 max-w-[45%]">
                    {row.effectDetail}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                  {/* SHIPMENT FRAMING — per user feedback, a flat "+0.3/s"
                      drip read like an idle-game stat with no cause→effect.
                      Pre-establishment the card sells the ROUTE in concrete
                      terms: what arrives, how much, how often. */}
                  <div className="text-[0.65rem] text-muted-foreground mb-2">
                    Ships{" "}
                    <span className="font-semibold text-foreground">
                      {resourceIcon(p.givesResource)} +{Math.round(shipmentAmount(p))} {resourceName(p.givesResource)}
                    </span>{" "}
                    every ~{p.shipmentInterval}s
                    {caravanCount > 0 && (
                      <span className="text-emerald-400/80"> (faster with your {caravanCount} caravan{caravanCount === 1 ? "" : "s"})</span>
                    )}
                    {p.rareDrop && (
                      <span className="ml-1.5">
                        ·{" "}
                        <span className="text-amber-400" title="Rolled once per shipment — the odds are real, not a slot machine">
                          🎁 {(p.rareDrop.chance * 100).toFixed(0)}% rare chance/shipment
                        </span>
                      </span>
                    )}
                  </div>
                  {isEstablished && (
                    <ShipmentTracker
                      partner={p}
                      agreement={agreement}
                      caravanMult={caravanMult}
                      treatyMult={treaties[p.id]?.type === "trade_agreement" ? 1.2 : 1}
                    />
                  )}
                  {/* F4 REPUTATION — tier + progress to next threshold + active
                      benefit chips. Reputation grows +1 per shipment delivered
                      (wired in the tick); tiers unlock concrete benefits. */}
                  {isEstablished && (
                    <ReputationRow reputation={agreement?.reputation || 0} />
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
                  {/* LAYER-D — Treaty section for trade partners. */}
                  {isEstablished && <TreatySection partnerId={p.id} relation={agreement?.relation || 0} treaties={treaties} signTreaty={signTreaty} breakTreaty={breakTreaty} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rivals — grouped by stage with collapsible headers + per-card
          collapse (S7). Earlier stages default collapsed so a Galactic
          player isn't buried in Creature/Tribal noise; the current stage
          is expanded. Each card's header row is always visible; the details
          (threat bar, assimilation cost, buttons, intel, treaty) fold away
          when the card is collapsed. */}
      {stageRivals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Swords className="w-4 h-4 text-rose-400" />
            Rivals
          </h3>
          {rivalsByStage.map((group) => {
            const isCurrent = group.stageId === currentStageId;
            // Default: current stage expanded, earlier stages collapsed.
            // `collapsedStages` tracks explicit toggles (flips the default).
            const stageCollapsed = isCurrent
              ? collapsedStages.has(group.stageId)
              : !collapsedStages.has(group.stageId);
            const activeCount = group.rivals.filter((r) => r.state === "active").length;
            const stageName = STAGES.find((s) => s.id === group.stageId)?.name || group.stageId;
            return (
              <div key={group.stageId}>
                {/* Stage-group collapsible header */}
                <button
                  onClick={() => toggleStage(group.stageId)}
                  aria-expanded={!stageCollapsed}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md border transition-colors text-left",
                    isCurrent ? "border-rose-500/30 bg-rose-500/5" : "border-border/40 bg-muted/20"
                  )}
                >
                  {stageCollapsed
                    ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  <span className={cn("text-xs font-semibold capitalize", isCurrent ? "text-rose-300" : "text-muted-foreground")}>
                    {stageName}
                  </span>
                  <span className="text-[0.6rem] text-muted-foreground tabular-nums">
                    {group.rivals.length} rival{group.rivals.length === 1 ? "" : "s"}
                    {activeCount > 0 && <span className="text-rose-400/80"> · {activeCount} active</span>}
                  </span>
                  {!isCurrent && (
                    <span className="ml-auto text-[0.55rem] text-muted-foreground/60 italic">earlier stage</span>
                  )}
                </button>
                {/* The grid — hidden when the stage group is collapsed. */}
                {!stageCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5">
                    {group.rivals.map((r) => {
                      const isActive = r.state === "active";
                      const isCellStage = r.stage === "cell";
                      const cost = isActive && !isCellStage
                        ? assimilationCost(r.strength || 1, r.counteredRaids || 0, r.successfulTrades || 0)
                        : { military: 0, culture: 0 };
                      const milHave = resources.military_power || 0;
                      const culHave = resources.culture || 0;
                      const canAssimilate = isActive && !isCellStage && milHave >= cost.military && culHave >= cost.culture;
                      const bonusDesc = r.assimilationBonus
                        ? `+${(r.assimilationBonus.mult * 100).toFixed(0)}% ${r.assimilationBonus.resource}`
                        : "no longer a threat.";
                      const tStage = threatStage(r.threat || 0);
                      const glowClass = !isActive
                        ? "rival-glow-calm"
                        : isCellStage
                          ? ""
                          : tStage.label === "CRITICAL" ? "rival-glow-critical"
                          : tStage.label === "RISING"   ? "rival-glow-rising"
                          : "rival-glow-calm";
                      const rivalCollapsed = collapsedRivals.has(r.id);
                      return (
                        <div
                          key={r.id}
                          className={cn(
                            "stat-card rounded-lg border p-3 transition-colors",
                            isActive ? "border-rose-500/40 bg-rose-500/5" : "border-emerald-500/40 bg-emerald-500/5",
                            glowClass
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-lg shrink-0">{r.icon}</span>
                              <div className="min-w-0">
                                <span className="font-semibold text-sm truncate block">{r.name}</span>
                                <span className="text-[0.55rem] text-muted-foreground uppercase tracking-wide">
                                  {r.stage}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {/* S7 per-card collapse chevron — folds the details. */}
                              <button
                                onClick={() => toggleRival(r.id)}
                                aria-expanded={!rivalCollapsed}
                                aria-label={rivalCollapsed ? "Expand rival details" : "Collapse rival details"}
                                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                              >
                                {rivalCollapsed
                                  ? <ChevronRight className="w-3.5 h-3.5" />
                                  : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
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
                          </div>
                          {/* Details — hidden when the card is collapsed. */}
                          {!rivalCollapsed && (
                            <>
                              {/* Population — always shown (per user: 'always show you the population'). */}
                              <div className="text-[0.65rem] text-muted-foreground mb-1">
                                👥 Population: <span className="font-semibold text-foreground">{Math.floor(r.population || 0)}</span>
                              </div>
                              {/* Military strength — shown from creature+. */}
                              {!isCellStage && (
                                <div className="text-[0.65rem] text-muted-foreground mb-1">
                                  ⚔️ Strength: <span className="font-semibold text-rose-400">{(r.strength || 1).toFixed(1)}</span>
                                </div>
                              )}
                              {isActive && !isCellStage && (
                                <>
                                  <ThreatBar
                                    threat={r.threat}
                                    timeToRaid={estimateTimeToRaid(r, milHave, treaties[r.id]?.type)}
                                  />
                                  <div className="text-[0.65rem] text-muted-foreground mb-1">
                                    Relation:{" "}
                                    <span className={cn("font-semibold", r.relation > 0 ? "text-emerald-400" : r.relation < -50 ? "text-rose-400" : "text-amber-400")}>
                                      {relationLabel(r.relation || -25)}
                                    </span>{" "}
                                    <span className="text-muted-foreground/60 tabular-nums">({(r.relation > 0 ? "+" : "") + (r.relation || 0).toFixed(0)})</span>
                                  </div>
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
                                  Resolved — {bonusDesc}
                                </div>
                              )}
                              <div className="flex gap-1.5">
                                {!isCellStage && (
                                  <>
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
                                  </>
                                )}
                                {isCellStage && isActive && (
                                  <p className="text-[0.6rem] text-muted-foreground/60 italic text-center w-full py-1">
                                    Rival cells — no interaction available at this stage
                                  </p>
                                )}
                              </div>
                              {isActive && !isCellStage && (
                                <div className="mt-1">
                                  <button
                                    onClick={() => setIntelOpen(intelOpen === r.id ? null : r.id)}
                                    aria-expanded={intelOpen === r.id}
                                    className="w-full flex items-center gap-1 text-[0.6rem] uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors py-0.5"
                                  >
                                    {intelOpen === r.id
                                      ? <ChevronDown className="w-3 h-3" />
                                      : <ChevronRight className="w-3 h-3" />}
                                    Rival Intelligence
                                  </button>
                                  {intelOpen === r.id && (
                                    <RivalIntel
                                      rival={r}
                                      military={milHave}
                                      treatyType={treaties[r.id]?.type}
                                    />
                                  )}
                                </div>
                              )}
                              {isActive && !isCellStage && <TreatySection partnerId={r.id} relation={r.relation || -25} treaties={treaties} signTreaty={signTreaty} breakTreaty={breakTreaty} />}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RARE DISCOVERIES TRACKER — per user request: 'Add some way to track
          the rare resources received and what they provide.' Shows:
            - progress: N / total discovered
            - each DISCOVERED rare: count, what it unlocks, and whether that
              unlock has been used (built / researched) or is still available
            - each UNDISCOVERED rare: "???" + where it can be found (sources
              limited to civilizations you've actually met — no spoilers)
          Section appears from creature stage (when hunting opens) onward. */}
      {(stageIndex >= 1 || Object.keys(rareResources).length > 0) && (
        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Gem className="w-4 h-4 text-amber-400" />
              Rare Discoveries
            </h3>
            <span className="text-[0.65rem] text-muted-foreground tabular-nums shrink-0">
              {Object.keys(rareResources).length} / {RARE_RESOURCES.length} found
            </span>
          </div>
          {/* Discovery progress bar */}
          <div className="h-1 rounded-full bg-muted/40 mb-2.5 overflow-hidden" role="progressbar"
            aria-valuemin={0} aria-valuemax={RARE_RESOURCES.length}
            aria-valuenow={Object.keys(rareResources).length}
          >
            <div
              className="h-full bg-amber-500/80 rounded-full transition-all"
              style={{ width: `${(Object.keys(rareResources).length / RARE_RESOURCES.length) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {RARE_RESOURCES.map((rrDef) => {
              const count = rareResources[rrDef.id] || 0;
              // F1 RELIQUARY — discovery = (stockpiled + consumed) >= 1, so
              // consuming down to 0 keeps the card visible (you've still
              // "found" it). The ×N badge shows the STOCKPILE only; consumed
              // ranks are shown separately on the consume row.
              const consumed = reliquary[rrDef.id] || 0;
              const discovered = count + consumed >= 1;
              if (!discovered) {
                // Undiscovered — hint at where to look (only sources the
                // player can currently reach; later-stage partners hidden).
                const reachableHint = formatReachableSources(rrDef.sources, stageIds);
                return (
                  <div
                    key={rrDef.id}
                    className="stat-card rounded-lg border border-border/40 bg-muted/10 p-2.5 opacity-70"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0 grayscale opacity-60"><Lock className="w-4 h-4" /></span>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-sm text-muted-foreground">???</span>
                        <p className="text-[0.6rem] text-muted-foreground/80 leading-snug mt-0.5">
                          <span className="text-amber-400/80">{reachableHint}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              // Discovered — what it provides + whether it's been claimed.
              const unlockUsed = rrDef.unlocks.type === "system"
                ? (ownedSystems[rrDef.unlocks.id] || 0) > 0
                : !!technologies[rrDef.unlocks.id];
              const unlockStatusLabel = unlockUsed
                ? (rrDef.unlocks.type === "system" ? "Built — bonus active" : "Researched — bonus active")
                : (rrDef.unlocks.type === "system" ? "Ready to build" : "Ready to research");
              // S4 SHIMMER + RARITY TIER — discovered cards get a slow shine
              // sweep + a left accent bar whose color reflects how MANY
              // sources can drop it (1 = common, 2 = uncommon, 3+ = rare).
              // Cosmetic only; the unlock math is unchanged.
              const srcCount = rrDef.sources.length;
              const tierClass = srcCount >= 3 ? "rare-tier-rare" : srcCount === 2 ? "rare-tier-uncommon" : "rare-tier-common";
              // F1 RELIQUARY — consume row. Only for rares with a reliquary
              // bonus. Shows current rank / max + the per-rank bonus, with a
              // Consume button (disabled at 0 stockpile or max rank).
              const relDef = rrDef.reliquary;
              const rank = consumed;
              const atMax = relDef ? rank >= relDef.maxConsume : false;
              const canConsume = relDef ? count >= 1 && !atMax : false;
              const totalBonus = relDef ? rank * relDef.perRank : 0;
              return (
                <div
                  key={rrDef.id}
                  className={cn(
                    "stat-card rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 rare-card-shimmer",
                    tierClass
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg shrink-0">{rrDef.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-sm text-amber-300 truncate">{rrDef.name}</span>
                        <Badge variant="outline" className="text-[0.55rem] text-amber-400 border-amber-500/30 shrink-0">
                          ×{count}
                        </Badge>
                      </div>
                      <p className="text-[0.65rem] text-muted-foreground italic leading-snug mb-1">
                        {rrDef.desc}
                      </p>
                      <div className="text-[0.6rem] text-amber-400/80 flex items-center gap-1">
                        {unlockUsed ? <Check className="w-2.5 h-2.5" /> : <Gem className="w-2.5 h-2.5" />}
                        {rrDef.unlocks.name}
                        <span className="text-muted-foreground/60">· {rrDef.unlocks.desc}</span>
                      </div>
                      <div className={cn(
                        "text-[0.55rem] mt-1 font-semibold uppercase tracking-wide",
                        unlockUsed ? "text-emerald-400" : "text-amber-400"
                      )}>
                        {unlockStatusLabel}
                      </div>
                      {/* F1 RELIQUARY consume row */}
                      {relDef && (
                        <div className="mt-1.5 pt-1.5 border-t border-amber-500/15 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[0.55rem] text-violet-300/90 font-semibold uppercase tracking-wide flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              Reliquary
                            </div>
                            <div className="text-[0.6rem] text-muted-foreground leading-tight">
                              {relDef.label}
                              {rank > 0 && (
                                <span className="text-violet-300 font-semibold"> · active +{(totalBonus * 100).toFixed(0)}%</span>
                              )}
                            </div>
                            {/* Rank pips */}
                            <div className="flex gap-0.5 mt-0.5">
                              {Array.from({ length: relDef.maxConsume }).map((_, i) => (
                                <span
                                  key={i}
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    i < rank ? "bg-violet-400" : "bg-muted-foreground/25"
                                  )}
                                />
                              ))}
                              <span className="text-[0.5rem] text-muted-foreground ml-1 tabular-nums">{rank}/{relDef.maxConsume}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={canConsume ? "default" : "outline"}
                            className={cn(
                              "h-6 px-2 text-[0.6rem] shrink-0",
                              canConsume && "bg-violet-500/20 border-violet-500/40 text-violet-200 hover:bg-violet-500/30"
                            )}
                            disabled={!canConsume}
                            onClick={() => consumeRare(rrDef.id)}
                            title={atMax ? "Reliquary maxed — bonus can't compound further" : count < 1 ? "No stockpile to consume" : `Consume 1 ${rrDef.name} for ${relDef.label} (rank ${rank + 1}/${relDef.maxConsume})`}
                          >
                            {atMax ? "Maxed" : count < 1 ? "None" : "Consume"}
                          </Button>
                        </div>
                      )}
                    </div>
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

// ============================================================
// ShipmentTracker — TRADE-SHIPMENTS card readout for an ACTIVE
// trade route (per user feedback: passive rare receipt felt like a
// slot machine — no cadence, no agency). Shows:
//   · progress bar filling toward the next delivery
//   · concrete "Next: +N res in ~Ns" (same math as the tick)
//   · explicit rare odds per shipment — understanding > randomness
//   · a brief arrival float (+N 🪵 / 🎁 rare) when a shipment lands
// The tracker re-renders every tick (shipmentProgress changes), so
// the bar animates natively and the 4s arrival window self-clears.
// ============================================================
function ShipmentTracker({
  partner,
  agreement,
  caravanMult,
  treatyMult,
}: {
  partner: TradePartner;
  agreement: { shipmentProgress?: number; totalShipments?: number; lastShipment?: { resource: string; amount: number; rare?: string; at: number } };
  caravanMult: number;
  treatyMult: number;
}) {
  const progress = Math.min(1, Math.max(0, agreement.shipmentProgress || 0));
  const intervalEff = shipmentIntervalEff(partner, caravanMult, treatyMult);
  const amount = shipmentAmount(partner);
  const eta = Math.max(1, Math.round((1 - progress) * intervalEff));
  const last = agreement.lastShipment;
  // Show the arrival float for 4s after a delivery. Date.now() is safe
  // here — this is client-only game UI and lastShipment is cleared on load.
  const lastAge = last ? (Date.now() - last.at) / 1000 : Infinity;
  const showFloat = last && lastAge < 4;
  const rareDef = partner.rareDrop ? RARE_RESOURCE_MAP[partner.rareDrop.resource] : undefined;
  return (
    <div className="mb-2" aria-label={`Next shipment: plus ${Math.round(amount)} ${resourceName(partner.givesResource)} in about ${eta} seconds`}>
      {/* Progress bar + concrete ETA */}
      <div className="flex items-center justify-between text-[0.6rem] mb-0.5">
        <span className="text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Package className="w-3 h-3" />
          Next: <span className="text-foreground font-semibold">+{Math.round(amount)} {resourceIcon(partner.givesResource)}</span>
        </span>
        <span className="text-muted-foreground tabular-nums flex items-center gap-0.5">
          <Timer className="w-2.5 h-2.5" />
          ~{eta}s
          {(caravanMult * treatyMult) > 1 && (
            <span className="text-emerald-400/90" title={`Deliveries ×${(caravanMult * treatyMult).toFixed(1)} faster (caravans${treatyMult > 1 ? " + trade treaty" : ""})`}>
              ⚡
            </span>
          )}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mb-1 relative" role="progressbar"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}
      >
        <div
          className="h-full rounded-full bg-emerald-500/80 transition-[width] duration-300"
          style={{ width: `${progress * 100}%` }}
        />
        {/* S2 TRAVELING CARAVAN — a stage-themed transport icon rides the
            right edge of the fill, gliding between tick updates via a CSS
            transition on `left`. Makes "more caravans = busier routes"
            visually obvious: the icon visibly advances toward each delivery. */}
        <span
          className="absolute -top-[3px] text-[0.7rem] leading-none pointer-events-none select-none caravan-bob"
          style={{ left: `calc(${progress * 100}% - 6px)`, transition: "left 300ms linear" }}
          aria-hidden
        >
          {caravanIconForStage(partner.stage)}
        </span>
      </div>
      <div className="flex items-center justify-between text-[0.55rem]">
        <span className="text-muted-foreground/80">
          {(agreement.totalShipments || 0) > 0 ? `${agreement.totalShipments} shipment${(agreement.totalShipments || 0) === 1 ? "" : "s"} received` : "First shipment en route"}
        </span>
        {partner.rareDrop && (
          <span className="text-amber-400/90 flex items-center gap-0.5" title={`Each shipment has a ${(partner.rareDrop.chance * 100).toFixed(0)}% chance to carry ${rareDef?.name || "a rare discovery"}`}>
            <Gift className="w-2.5 h-2.5" />
            {(partner.rareDrop.chance * 100).toFixed(0)}% rare
          </span>
        )}
      </div>
      {/* Arrival float — slides up + fades out. Golden variant when the
          shipment carried a rare (ties the surprise to the understood odds). */}
      {showFloat && last && (
        <div
          key={agreement.totalShipments}
          className={cn(
            "shipment-float mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.6rem] font-semibold border",
            last.rare
              ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
              : "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
          )}
          role="status"
        >
          {last.rare ? (
            <>
              <Gift className="w-3 h-3" />
              Rare! {RARE_RESOURCE_MAP[last.rare]?.name || last.rare} ×{1}
            </>
          ) : (
            <>
              +{Math.round(last.amount)} {resourceIcon(last.resource)} arrived
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// F4 ReputationRow — compact tier + progress readout for an active
// trade route. Reputation grows +1 per shipment delivered (wired in
// the tick); tiers unlock concrete benefits shown as chips. The mini
// bar shows progress toward the NEXT threshold (capped at Exalted).
// ============================================================
function ReputationRow({ reputation }: { reputation: number }) {
  const rep = Math.max(0, Math.min(100, reputation));
  const tier = reputationTierOf(rep);
  const benefits = reputationBenefits(rep);
  // S6 TIER-UP MICRO-INTERACTION — detect when the tier label crosses a
  // threshold + briefly pulse the badge + show a "+TIER" float. The ref
  // tracks the previous tier; the effect arms a 1.2s window when it changes.
  const prevTierRef = useRef<string>(tier.label);
  const [tierUp, setTierUp] = useState(false);
  useEffect(() => {
    if (prevTierRef.current !== tier.label && prevTierRef.current !== "") {
      const prevLabel = prevTierRef.current;
      prevTierRef.current = tier.label;
      // Defer the setState via microtask so it's not synchronous in the effect
      // body (satisfies react-hooks/set-state-in-effect + avoids cascading).
      queueMicrotask(() => {
        setTierUp(true);
        setTimeout(() => setTierUp(false), 1200);
      });
      return;
    }
    prevTierRef.current = tier.label;
  }, [tier.label]);
  // Progress toward the next threshold (0..1). Exalted = full bar.
  const prevThreshold = rep >= 90 ? 90 : rep >= 70 ? 70 : rep >= 40 ? 40 : rep >= 20 ? 20 : 0;
  const span = tier.nextThreshold ? tier.nextThreshold - prevThreshold : 1;
  const within = tier.nextThreshold ? Math.min(1, Math.max(0, (rep - prevThreshold) / span)) : 1;
  return (
    <div className="mb-2 relative" aria-label={`Reputation ${Math.round(rep)} of 100 — ${tier.label}`}>
      <div className="flex items-center justify-between text-[0.6rem] mb-0.5">
        <span className="text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Handshake className="w-3 h-3" />
          Reputation
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cn("font-bold tabular-nums", tier.colorClass)}>{Math.round(rep)}/100</span>
          <span className={cn(
            "font-bold uppercase tracking-wide px-1 py-px rounded border",
            tier.colorClass, "border-current/30 bg-current/5",
            tierUp && "rep-tier-up-pulse"
          )}>
            {tier.label}
          </span>
        </span>
      </div>
      <div className="h-1 rounded-full bg-muted/40 overflow-hidden mb-1" role="progressbar"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(rep)}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", tier.barClass)}
          style={{ width: `${within * 100}%` }}
        />
      </div>
      {/* S6 — "+TIER" float on threshold crossing. Rises + fades. */}
      {tierUp && (
        <span
          className="absolute right-0 top-3 text-[0.55rem] font-bold pointer-events-none rep-tier-up-float"
          aria-hidden
        >
          ↑ {tier.label}
        </span>
      )}
      {benefits.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {benefits.map((b) => (
            <span
              key={b}
              className="text-[0.5rem] px-1 py-px rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium"
            >
              {b}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ThreatBar — rival threat readout with full accessibility coding:
//   color (emerald→amber→rose) + stage LABEL (CALM/RISING/CRITICAL) +
// diagonal stripe pattern at CRITICAL + live time-to-raid estimate.
// The pulse animation ONLY plays when a raid is genuinely imminent
// (< 60s remaining — enough time to still respond), so it stays a
// real signal instead of background noise.
// ============================================================
function ThreatBar({ threat, timeToRaid }: { threat: number; timeToRaid: number }) {
  const t = Math.max(0, Math.min(100, threat));
  const stage = threatStage(t);
  const imminent = isFinite(timeToRaid) && timeToRaid < 60;
  return (
    <div className="mb-1.5" role="img" aria-label={`Threat ${t.toFixed(0)} of 100 — ${stage.label}${isFinite(timeToRaid) ? `, raid in approximately ${formatTimeToRaid(timeToRaid)}` : ""}`}>
      <div className="flex items-center justify-between text-[0.6rem] mb-0.5">
        <span className="text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          Threat
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cn("font-bold tabular-nums", stage.colorClass)}>{t.toFixed(0)}/100</span>
          <span
            className={cn(
              "font-bold uppercase tracking-wide px-1 py-px rounded border",
              stage.colorClass,
              t >= 75 ? "border-rose-500/40 bg-rose-500/10" : t >= 40 ? "border-amber-500/40 bg-amber-500/10" : "border-emerald-500/40 bg-emerald-500/10"
            )}
          >
            {stage.label}
          </span>
          {isFinite(timeToRaid) && (
            <span className={cn("text-muted-foreground tabular-nums flex items-center gap-0.5", imminent && "text-rose-400 font-bold threat-imminent-pulse")}>
              <Timer className="w-2.5 h-2.5" />
              raid in {formatTimeToRaid(timeToRaid)}
            </span>
          )}
        </span>
      </div>
      {/* Bar fill — stripes at CRITICAL are a non-color cue for
          color-blind players. */}
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", stage.barClass, t >= 75 && "threat-bar-stripes")}
          style={{ width: `${t}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// RivalIntel — expandable "Rival Intelligence" assessment. Deliberately
// CONCISE (per user feedback on analysis paralysis): one plain-language
// reading + a compact 2×2 stat grid. No charts, no history graphs.
// ============================================================
function RivalIntel({
  rival,
  military,
  treatyType,
}: {
  rival: {
    id: string;
    name: string;
    strength: number;
    relation: number;
    threat: number;
    stage: string;
    state: string;
    counteredRaids?: number;
    successfulTrades?: number;
    assimilationBonus?: { resource: string; mult: number };
  };
  military: number;
  treatyType?: string;
}) {
  const strength = rival.strength || 1;
  const cost = counterAttackCost(strength);
  const winChance = Math.min(0.95, military / (strength * 50));
  const ttr = estimateTimeToRaid(rival, military, treatyType);

  // Plain-language reading — the ONE thing the player actually needs.
  let read: string;
  if (treatyType === "non_aggression") {
    read = "Non-aggression pact holds — their threat grows at half pace.";
  } else if (military >= cost) {
    read = `You outgun them. A counter-raid is a guaranteed victory for ⚔️ ${formatNumber(cost, 0)} — and each one makes assimilation cheaper.`;
  } else if (winChance >= 0.5) {
    read = `Your defenses hold the edge (${(winChance * 100).toFixed(0)}% win chance), but a counter-raid needs ⚔️ ${formatNumber(cost, 0)}.`;
  } else if (military > 0) {
    read = `Your military is thin (${(winChance * 100).toFixed(0)}% win chance). Build toward ⚔️ ${formatNumber(cost, 0)} for a safe counter-attack.`;
  } else {
    read = `You have no military. If they raid before you arm, losses are certain — build toward ⚔️ ${formatNumber(cost, 0)}.`;
  }

  return (
    <div className="mt-1 mb-1 rounded-lg border border-border/50 bg-muted/20 p-2 space-y-1.5 animate-[slideUp_0.2s_ease]">
      {/* Plain-language reading first */}
      <p className="text-[0.65rem] leading-snug text-foreground/90 italic">{read}</p>
      {/* Compact stat grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[0.6rem]">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1"><Crosshair className="w-2.5 h-2.5" /> Your military</span>
          <span className="font-semibold tabular-nums" style={{ color: resourceColor("military_power") }}>
            {formatNumber(military, 0)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Their strength</span>
          <span className="font-semibold tabular-nums text-rose-400">{strength.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Defend odds</span>
          <span className={cn("font-semibold tabular-nums", winChance > 0.7 ? "text-emerald-400" : winChance > 0.4 ? "text-amber-400" : "text-rose-400")}>
            {(winChance * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1"><Timer className="w-2.5 h-2.5" /> Raid in</span>
          <span className="font-semibold tabular-nums">{formatTimeToRaid(ttr)}</span>
        </div>
      </div>
      {/* Assimilation prize preview */}
      {rival.assimilationBonus && (
        <div className="flex items-center justify-between text-[0.6rem] pt-1 border-t border-border/40">
          <span className="text-muted-foreground flex items-center gap-1"><Scale className="w-2.5 h-2.5" /> If assimilated</span>
          <span className="font-semibold text-amber-400">
            +{(rival.assimilationBonus.mult * 100).toFixed(0)}% {resourceName(rival.assimilationBonus.resource)}
          </span>
        </div>
      )}
    </div>
  );
}

// LAYER-D — Treaty section component. Shows the current treaty (if any)
// + 4 treaty-type buttons (disabled if relation < threshold) + break button.
// Used by both trade partner cards + rival cards.
function TreatySection({
  partnerId,
  relation,
  treaties,
  signTreaty,
  breakTreaty,
}: {
  partnerId: string;
  relation: number;
  treaties: Record<string, { type: string; signedAt: number }>;
  signTreaty: (id: string, type: "trade_agreement" | "non_aggression" | "mutual_defense" | "research_pact") => void;
  breakTreaty: (id: string) => void;
}) {
  const treaty = treaties[partnerId];
  const treatyTypes = [
    { type: "trade_agreement" as const, label: "Trade", threshold: 0, effect: "+20% bonus" },
    { type: "non_aggression" as const, label: "NAP", threshold: 25, effect: "Threat ×0.5" },
    { type: "mutual_defense" as const, label: "Defense", threshold: 50, effect: "Auto-win" },
    { type: "research_pact" as const, label: "Research", threshold: 25, effect: "+10% sci" },
  ];
  return (
    <div className="mt-1.5 pt-1.5 border-t border-border/40">
      {treaty && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[0.6rem] text-cyan-400 flex items-center gap-1">
            <FileText className="w-2.5 h-2.5" />
            {treaty.type.replace(/_/g, " ")}
          </span>
          <button
            onClick={() => breakTreaty(partnerId)}
            className="text-[0.55rem] text-rose-400 hover:text-rose-300 transition-colors"
          >
            Break
          </button>
        </div>
      )}
      <div className="flex gap-1">
        {treatyTypes.map((tt) => {
          const canSign = relation >= tt.threshold;
          const isActive = treaty?.type === tt.type;
          return (
            <button
              key={tt.type}
              onClick={() => canSign && !isActive && signTreaty(partnerId, tt.type)}
              disabled={!canSign || isActive}
              className={cn(
                "text-[0.55rem] px-1.5 py-0.5 rounded border transition-colors flex-1",
                isActive
                  ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-400"
                  : canSign
                    ? "border-border/40 text-muted-foreground hover:bg-muted/40"
                    : "border-transparent text-muted-foreground/30 cursor-not-allowed"
              )}
              title={`${tt.label}: ${tt.effect} (requires relation ≥ ${tt.threshold})`}
            >
              {tt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
