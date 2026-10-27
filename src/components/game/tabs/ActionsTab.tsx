"use client";

import { useGameStore, isActionCapped } from "@/game/state/store";
import { actionsForStage } from "@/game/data/actions";
import { STAGES } from "@/game/data/stages";
import { formatNumber, resourceColor, resourceIcon } from "../shared/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useRef, useCallback } from "react";

export function ActionsTab() {
  const stageIndex = useGameStore((s) => s.stageIndex);
  const stage = STAGES[stageIndex];
  const actions = actionsForStage(stage.id);

  return (
    <div className="space-y-4">
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-xl">{stage.icon}</span>
            {stage.name} Actions
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {stage.storyIntro}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Manual Actions</CardTitle>
          <CardDescription>
            Click to gather. Actions that would only overflow a capped resource are disabled — no waste.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {actions.map((a) => (
              <ActionCard key={a.id} action={a} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PART-2-LAYER-B — manual Hunt action. Per user: 'add a hunt button on
          actions that spends military and/or pop to trigger immediately'.
          Spends military_power + population for an immediate burst of
          food/materials/organic_matter + 15% rare-drop chance. Available
          from creature stage onwards (hunting requires a body, not a cell). */}
      {stageIndex >= 1 && <HuntCard />}
    </div>
  );
}

function HuntCard() {
  const stageIndex = useGameStore((s) => s.stageIndex);
  const resources = useGameStore((s) => s.resources);
  const population = useGameStore((s) => s.population);
  const huntNow = useGameStore((s) => s.huntNow);

  const stageTier = stageIndex + 1;
  const milCost = 5 * stageTier;
  const popCost = Math.max(1, Math.floor(stageTier / 2));
  const mil = resources?.military_power ?? 0;
  const pop = population ?? 0;
  const canHunt = mil >= milCost && pop >= popCost;

  // Estimated rewards (shown on the card so the player knows what they'll get).
  const foodGain = 15 * stageTier;
  const matGain = 8 * stageTier;
  const orgGain = 5 * stageTier;

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          🏹 Hunt
        </CardTitle>
        <CardDescription>
          Spend military + population for an immediate burst of food, materials, and organic matter. 15% chance of a rare drop.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span style={{ color: resourceColor("military_power") }}>
              {resourceIcon("military_power")}{formatNumber(milCost, 0)}
            </span>
            <span className="text-muted-foreground">+ {popCost} 👥 pop</span>
            <span className="text-muted-foreground/60">→</span>
            <span style={{ color: resourceColor("food") }}>
              +{formatNumber(foodGain, 0)}{resourceIcon("food")}
            </span>
            <span style={{ color: resourceColor("materials") }}>
              +{formatNumber(matGain, 0)}{resourceIcon("materials")}
            </span>
            <span style={{ color: resourceColor("organic_matter") }}>
              +{formatNumber(orgGain, 0)}{resourceIcon("organic_matter")}
            </span>
            <span className="text-amber-400">+ 15% rare drop</span>
          </div>
          <Button
            size="sm"
            disabled={!canHunt}
            onClick={() => huntNow()}
            className="ml-auto"
          >
            Hunt Now
          </Button>
        </div>
        {!canHunt && (
          <p className="text-[0.65rem] text-muted-foreground/70 mt-2 italic">
            Need {milCost} military_power (have {Math.floor(mil)}) + {popCost} population (have {Math.floor(pop)}).
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface FloatNum {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
}

function ActionCard({ action }: { action: typeof import("@/game/data/actions").ACTIONS[number] }) {
  const resources = useGameStore((s) => s.resources);
  const capacities = useGameStore((s) => s.capacities);
  const performAction = useGameStore((s) => s.performAction);
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const floatId = useRef(0);

  const canAfford = !action.cost || Object.entries(action.cost).every(([r, v]) => (resources[r] || 0) >= (v as number));
  const capped = isActionCapped(action.produces as Record<string, number>, resources, capacities);
  const disabled = !canAfford || capped;

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Create floating numbers for each produced resource
    const newFloats: FloatNum[] = Object.entries(action.produces).map(([r, v], i) => {
      const id = floatId.current++;
      return {
        id,
        text: `+${formatNumber(v as number)}${resourceIcon(r)}`,
        color: resourceColor(r),
        x: rect.width / 2 + (i - (Object.keys(action.produces).length - 1) / 2) * 30,
        y: 10,
      };
    });
    setFloats((prev) => [...prev, ...newFloats]);
    // Remove floats after animation
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => !newFloats.find((nf) => nf.id === f.id)));
    }, 800);
    performAction(action.id);
  }, [disabled, action, performAction]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn("action-btn relative overflow-visible", capped && "opacity-40")}
      title={capped ? "Output resource is at capacity — no waste" : action.desc}
    >
      {/* Floating numbers */}
      {floats.map((f) => (
        <span
          key={f.id}
          className="absolute font-bold text-sm pointer-events-none z-20"
          style={{
            left: `${f.x}px`,
            top: `${f.y}px`,
            color: f.color,
            animation: "floatUp 0.8s ease-out forwards",
          }}
        >
          {f.text}
        </span>
      ))}
      <span className="icon">{action.icon}</span>
      <span className="label">{action.name}</span>
      {capped ? (
        <span className="cost text-amber-500/80">capped</span>
      ) : (
        <>
          <span className="cost">
            {action.cost && Object.keys(action.cost).length > 0 ? (
              Object.entries(action.cost).map(([r, v]) => (
                <span
                  key={r}
                  className="mr-1"
                  style={{ color: (resources[r] || 0) >= (v as number) ? resourceColor(r) : "#ef4444" }}
                >
                  {resourceIcon(r)}{formatNumber(v as number)}
                </span>
              ))
            ) : (
              <span className="text-emerald-400">free</span>
            )}
          </span>
          <span className="cost text-emerald-300">
            +{Object.entries(action.produces).map(([r, v]) =>
              `${formatNumber(v as number)}${resourceIcon(r)}`
            ).join(" ")}
          </span>
        </>
      )}
    </button>
  );
}
