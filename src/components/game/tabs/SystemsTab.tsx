"use client";

import { useGameStore, isSystemCapped } from "@/game/state/store";
import { systemsForStage, systemCost, SYSTEMS } from "@/game/data/systems";
import { STAGES } from "@/game/data/stages";
import { TECH_MAP } from "@/game/data/techs";
import { useActiveLayer } from "@/game/state/layerHelpers";
import { formatNumber, resourceColor, resourceIcon, resourceName } from "../shared/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ARCHETYPE_MAP } from "@/game/data/archetypes";
import { useState, useMemo } from "react";
import { Lock, Power, PowerOff, AlertCircle, History, Layers, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemDef } from "@/game/state/types";
import { PurchaseErrorBanner } from "../shared/PurchaseErrorBanner";

// Determine which stage indices are "legacy" (collapsed by default into the Legacy accordion)
// based on the player's current prestige layer.
function legacyStageRange(stageIndex: number, isL2Plus: boolean, isL5Plus: boolean): { start: number; end: number } {
  // Legacy = stages [0, end) — exclusive end.
  if (isL5Plus) return { start: 0, end: Math.min(5, stageIndex) }; // Stages 1-5 (cell..empire)
  if (isL2Plus) return { start: 0, end: Math.min(2, stageIndex) }; // Stages 1-2 (cell..creature)
  // Below L2: any past stages below current are shown as collapsible accordions (open by default).
  return { start: 0, end: 0 };
}

export function SystemsTab() {
  const stageIndex = useGameStore((s) => s.stageIndex);
  const resources = useGameStore((s) => s.resources);
  const capacities = useGameStore((s) => s.capacities);
  const ownedSystems = useGameStore((s) => s.ownedSystems);
  const systemEnabled = useGameStore((s) => s.systemEnabled);
  const technologies = useGameStore((s) => s.technologies);
  const upgrades = useGameStore((s) => s.upgrades);
  const debugFreeBuy = useGameStore((s) => s.debugFreeBuy);
  const buySystem = useGameStore((s) => s.buySystem);
  const toggleSystem = useGameStore((s) => s.toggleSystem);
  const enableAllSystems = useGameStore((s) => s.enableAllSystems);

  const { isAtLeast } = useActiveLayer();
  const isL2Plus = isAtLeast("enlightenment");
  const isL5Plus = isAtLeast("apotheosis");

  const stage = STAGES[stageIndex];
  const currentSystems = systemsForStage(stage.id);
  const costReduction = (upgrades["frugality"] || 0) * 0.04;
  const hasAutoBalancer = (upgrades["auto_balancer"] || 0) > 0;

  const ownedCount = currentSystems.filter((s) => (ownedSystems[s.id] || 0) > 0).length;

  // Legacy cutoff based on player's layer
  const legacyRange = useMemo(
    () => legacyStageRange(stageIndex, isL2Plus, isL5Plus),
    [stageIndex, isL2Plus, isL5Plus]
  );
  // Stages strictly below current that are NOT in the explicit legacy range (e.g. between legacy and current)
  const middleStages = useMemo(() => {
    const list: typeof STAGES = [];
    for (let i = legacyRange.end; i < stageIndex; i++) {
      list.push(STAGES[i]);
    }
    return list;
  }, [legacyRange.end, stageIndex]);
  const legacyStages = useMemo(() => STAGES.slice(legacyRange.start, legacyRange.end), [legacyRange]);

  // "Show only current stage" toggle — hides all legacy/middle accordions
  const [onlyCurrent, setOnlyCurrent] = useState(false);
  // Track which legacy/middle accordions are open. Default: legacy accordion is closed (per spec);
  // middle stage accordions (between legacy and current) are open by default so the player can see them.
  const [legacyOpen, setLegacyOpen] = useState(false);

  // Compute total counts for legacy summary
  const legacySystemsTotal = useMemo(() => {
    return legacyStages.reduce((sum, st) => sum + systemsForStage(st.id).length, 0);
  }, [legacyStages]);
  const legacySystemsOwned = useMemo(() => {
    return legacyStages.reduce((sum, st) => {
      const sys = systemsForStage(st.id);
      return sum + sys.filter((s) => (ownedSystems[s.id] || 0) > 0).length;
    }, 0);
  }, [legacyStages, ownedSystems]);

  const hasLegacy = legacyStages.length > 0;
  const hasMiddle = middleStages.length > 0;

  return (
    <div className="space-y-4">
      {/* P7 — Inline purchase error banner (auto-fades after 2s). */}
      <PurchaseErrorBanner />
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xl">{stage.icon}</span>
                {stage.name} Systems
              </CardTitle>
              <CardDescription className="mt-1">
                Buy and upgrade buildings. Toggle individual systems on/off to balance your economy.
                {hasAutoBalancer && " Auto-Balancer active — capped systems idle automatically."}
              </CardDescription>
            </div>
            <div className="flex gap-1 shrink-0 items-center flex-wrap">
              {ownedCount > 0 && (
                <>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => enableAllSystems(true)}>
                    <Power className="w-3 h-3 mr-1" /> All
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => enableAllSystems(false)}>
                    <PowerOff className="w-3 h-3 mr-1" /> None
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current stage systems — always shown (old stages hidden) */}
      {currentSystems.length === 0 ? (
        <Card className="glass-panel">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No systems for this stage yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentSystems.map((sys) => {
            const owned = ownedSystems[sys.id] || 0;
            const cost = systemCost(sys, owned, costReduction);
            const canAfford = debugFreeBuy || Object.entries(cost).every(([r, v]) => (resources[r] || 0) >= (v as number));
            const atMax = sys.maxOwned ? owned >= sys.maxOwned : false;
            const techLocked = sys.requiredTech && !technologies[sys.requiredTech];
            const enabled = systemEnabled[sys.id] !== false;
            const capped = owned > 0 && isSystemCapped(sys.id, resources, capacities);
            return (
              <SystemCard
                key={sys.id}
                sys={sys}
                owned={owned}
                cost={cost}
                canAfford={canAfford}
                atMax={atMax}
                techLocked={!!techLocked}
                requiredTechName={techLocked ? TECH_MAP[sys.requiredTech!]?.name : undefined}
                enabled={enabled}
                capped={capped}
                onBuy={(qty) => buySystem(sys.id, qty)}
                onToggle={() => toggleSystem(sys.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper grid sub-component (renders SystemCards for a list of systems)
function SystemsGrid({ systems }: { systems: SystemDef[] }) {
  const resources = useGameStore((s) => s.resources);
  const capacities = useGameStore((s) => s.capacities);
  const ownedSystems = useGameStore((s) => s.ownedSystems);
  const systemEnabled = useGameStore((s) => s.systemEnabled);
  const technologies = useGameStore((s) => s.technologies);
  const upgrades = useGameStore((s) => s.upgrades);
  const debugFreeBuy = useGameStore((s) => s.debugFreeBuy);
  const buySystem = useGameStore((s) => s.buySystem);
  const toggleSystem = useGameStore((s) => s.toggleSystem);
  const costReduction = (upgrades["frugality"] || 0) * 0.04;

  if (systems.length === 0) {
    return <div className="text-xs text-muted-foreground py-2">No systems for this stage.</div>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {systems.map((sys) => {
        const owned = ownedSystems[sys.id] || 0;
        const cost = systemCost(sys, owned, costReduction);
        const canAfford = debugFreeBuy || Object.entries(cost).every(([r, v]) => (resources[r] || 0) >= (v as number));
        const atMax = sys.maxOwned ? owned >= sys.maxOwned : false;
        const techLocked = sys.requiredTech && !technologies[sys.requiredTech];
        const enabled = systemEnabled[sys.id] !== false;
        const capped = owned > 0 && isSystemCapped(sys.id, resources, capacities);
        return (
          <SystemCard
            key={sys.id}
            sys={sys}
            owned={owned}
            cost={cost}
            canAfford={canAfford}
            atMax={atMax}
            techLocked={!!techLocked}
            requiredTechName={techLocked ? TECH_MAP[sys.requiredTech!]?.name : undefined}
            enabled={enabled}
            capped={capped}
            onBuy={(qty) => buySystem(sys.id, qty)}
            onToggle={() => toggleSystem(sys.id)}
          />
        );
      })}
    </div>
  );
}

interface SystemCardProps {
  sys: typeof SYSTEMS[number];
  owned: number;
  cost: Partial<Record<string, number>>;
  canAfford: boolean;
  atMax: boolean;
  techLocked: boolean;
  requiredTechName?: string;
  enabled: boolean;
  capped: boolean;
  onBuy: (qty: number) => void;
  onToggle: () => void;
}

function SystemCard({ sys, owned, cost, canAfford, atMax, techLocked, requiredTechName, enabled, capped, onBuy, onToggle }: SystemCardProps) {
  const [qty, setQty] = useState(1);
  const resources = useGameStore((s) => s.resources);
  const archDef = sys.grantsAffinity ? ARCHETYPE_MAP[sys.grantsAffinity.archetype] : null;

  return (
    <Card className={cn(
      "glass-panel relative overflow-hidden",
      !enabled && owned > 0 && "opacity-60",
      techLocked && "border-red-500/40"
    )}>
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: capped ? "#f59e0b" : techLocked ? "#ef4444" : "linear-gradient(90deg, var(--primary) 0%, transparent 100%)" }}
      />
      {/* Tech-locked overlay badge */}
      {techLocked && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 text-[0.6rem] px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 font-semibold uppercase tracking-wide">
          <Lock className="w-2.5 h-2.5" />
          Locked
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <div className="text-2xl shrink-0">{sys.icon}</div>
            <div className="min-w-0">
              <CardTitle className="text-sm leading-tight">{sys.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5 leading-snug">{sys.desc}</CardDescription>
              {archDef && (
                <Badge
                  variant="outline"
                  className="text-[0.6rem] mt-1"
                  style={{ borderColor: `${archDef.color}50`, color: archDef.color }}
                  title={`Grants ${archDef.name} lineage affinity`}
                >
                  {archDef.glyph} {archDef.name} drift +{sys.grantsAffinity!.amount}
                </Badge>
              )}
            </div>
          </div>
          {owned > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant="secondary" className="text-xs">×{owned}</Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={onToggle}
                title={enabled ? "Disable (idle this system)" : "Enable"}
              >
                {enabled ? <Power className="w-3.5 h-3.5 text-emerald-400" /> : <PowerOff className="w-3.5 h-3.5 text-muted-foreground" />}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Capped warning */}
        {capped && owned > 0 && enabled && (
          <div className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Output at capacity — idling to save upkeep</span>
          </div>
        )}
        {!enabled && owned > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 border border-border rounded px-2 py-1">
            <PowerOff className="w-3 h-3 shrink-0" />
            <span>Disabled — no production, no upkeep</span>
          </div>
        )}

        {/* Tech prereq */}
        {techLocked && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-1">
            <Lock className="w-3 h-3 shrink-0" />
            <span>Requires tech: <span className="font-semibold">{requiredTechName}</span></span>
          </div>
        )}

        {/* Production / effects */}
        {Object.keys(sys.produces).length > 0 && (
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="text-muted-foreground">Produces:</span>
            {Object.entries(sys.produces).map(([r, v]) => (
              <span key={r} className="font-semibold" style={{ color: resourceColor(r) }}>
                +{formatNumber((v as number) * owned, 2)}/s {resourceIcon(r)}
              </span>
            ))}
          </div>
        )}
        {/* Population growth (pop-growth systems) */}
        {sys.popGrowth && (
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="text-muted-foreground">Pop growth:</span>
            <span className="font-semibold" style={{ color: "#10b981" }}>
              +{formatNumber(sys.popGrowth * owned, 2)}/s 👥
            </span>
          </div>
        )}
        {sys.capacityBoost && Object.keys(sys.capacityBoost).length > 0 && owned > 0 && (
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="text-muted-foreground">Capacity:</span>
            {Object.entries(sys.capacityBoost).map(([r, v]) => (
              <span key={r} style={{ color: resourceColor(r) }}>
                +{(v as number) * owned} {resourceName(r)}
              </span>
            ))}
          </div>
        )}
        {sys.upkeep && Object.keys(sys.upkeep).length > 0 && owned > 0 && (
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="text-muted-foreground">Upkeep:</span>
            {Object.entries(sys.upkeep).map(([r, v]) => (
              <span key={r} className="text-red-400">
                −{formatNumber((v as number) * owned, 2)}/s {resourceIcon(r)}
              </span>
            ))}
          </div>
        )}

        {/* Cost */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(cost).map(([r, v]) => {
              const have = (resources[r] || 0);
              const enough = have >= (v as number);
              return (
                <span key={r} className={enough ? "" : "text-red-400"} style={enough ? { color: resourceColor(r) } : undefined}>
                  {resourceIcon(r)}{formatNumber(v as number)}
                </span>
              );
            })}
          </div>
        </div>

        {/* Buy buttons — qty presets + main build button */}
        <div className="pt-1 space-y-1.5">
          {/* Qty preset chips */}
          <div className="flex items-center gap-1">
            {[1, 10, 100].map((preset) => (
              <button
                key={preset}
                onClick={() => setQty(preset)}
                className={cn(
                  "flex-1 text-xs py-1 rounded border transition-colors tabular-nums",
                  qty === preset
                    ? "border-primary bg-primary/15 text-primary font-semibold"
                    : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-foreground/40"
                )}
              >
                ×{preset}
              </button>
            ))}
            <button
              onClick={() => setQty(100)}
              className={cn(
                "flex-1 text-xs py-1 rounded border transition-colors",
                qty === 100
                  ? "border-primary bg-primary/15 text-primary font-semibold"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-foreground/40"
                )}
              title="Buy as many as affordable up to 100"
            >
              Max
            </button>
          </div>
          <Button
            size="sm"
            className="h-8 w-full"
            disabled={!canAfford || atMax || techLocked}
            onClick={() => onBuy(qty)}
          >
            {atMax ? "Max owned" : techLocked ? "Locked" : `Build ${qty > 1 ? `×${qty}` : ""}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
