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
import { tradePartnersForStage } from "@/game/data/tradePartners";
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
  ChevronDown, ChevronRight, ShieldAlert, Lock, Timer, Crosshair, Scale,
} from "lucide-react";
import { formatNumber, resourceIcon, resourceName, resourceColor } from "../shared/format";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  const caravanCount =
    (ownedSystems["tribal_trade_caravan"] || 0) +
    (ownedSystems["trade_caravan"] || 0) +
    (ownedSystems["empire_trade_caravan"] || 0) +
    (ownedSystems["solar_trade_caravan"] || 0) +
    (ownedSystems["galactic_trade_caravan"] || 0);

  // Rivals for the current + past stages. Exclude hidden rivals (those
  // that didn't make the cut at Cell→Creature carry-forward).
  const stageRivals = rivals.filter((r) => {
    const rStageIdx = STAGES.findIndex((s) => s.id === r.stage);
    return rStageIdx >= 0 && rStageIdx <= stageIndex && !r.hidden;
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
                      <span className="ml-2">
                        Rare drop:{" "}
                        <span className="text-amber-400">
                          {RARE_RESOURCE_MAP[p.rareDrop.resource]?.icon || "💎"}{" "}
                          {RARE_RESOURCE_MAP[p.rareDrop.resource]?.name || resourceName(p.rareDrop.resource)}{" "}
                          ({(p.rareDrop.chance * 100).toFixed(0)}%)
                        </span>
                      </span>
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
                  {/* LAYER-D — Treaty section for trade partners. */}
                  {isEstablished && <TreatySection partnerId={p.id} relation={agreement?.relation || 0} treaties={treaties} signTreaty={signTreaty} breakTreaty={breakTreaty} />}
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
                      <div className="min-w-0">
                        <span className="font-semibold text-sm truncate block">{r.name}</span>
                        <span className="text-[0.55rem] text-muted-foreground uppercase tracking-wide">
                          {r.stage}
                        </span>
                      </div>
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
                  {/* Population — always shown (per user: 'always show you the population'). */}
                  <div className="text-[0.65rem] text-muted-foreground mb-1">
                    👥 Population: <span className="font-semibold text-foreground">{Math.floor(r.population || 0)}</span>
                  </div>
                  {/* Military strength — shown from creature+ (per user: 'eventually when stage appropriate'). */}
                  {!isCellStage && (
                    <div className="text-[0.65rem] text-muted-foreground mb-1">
                      ⚔️ Strength: <span className="font-semibold text-rose-400">{(r.strength || 1).toFixed(1)}</span>
                    </div>
                  )}
                  {isActive && !isCellStage && (
                    <>
                      {/* THREAT-BAR — color shift + non-color cues: stage label
                          (CALM/RISING/CRITICAL), stripe pattern at CRITICAL,
                          and a live time-to-raid estimate. The pulse animation
                          only plays when a raid is genuinely imminent (< 60s
                          remaining — a real decision window), never for a
                          static threat level. */}
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
                  {/* RIVAL INTELLIGENCE — expandable assessment (per user
                      feedback: keep it concrete, avoid analysis paralysis —
                      one plain-language read + a compact stat grid). */}
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
                  {/* LAYER-D — Treaty section for rivals (creature+ only). */}
                  {isActive && !isCellStage && <TreatySection partnerId={r.id} relation={r.relation || -25} treaties={treaties} signTreaty={signTreaty} breakTreaty={breakTreaty} />}
                </div>
              );
            })}
          </div>
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
              const discovered = count >= 1;
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
              return (
                <div
                  key={rrDef.id}
                  className="stat-card rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5"
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
