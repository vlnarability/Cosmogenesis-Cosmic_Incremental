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
  const gameTime = useGameStore((s) => s.time);
  const lastDeepHuntAt = useGameStore((s) => s.lastDeepHuntAt || 0);
  const huntNow = useGameStore((s) => s.huntNow);
  const huntDeepNow = useGameStore((s) => s.huntDeepNow);
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const [deepFloats, setDeepFloats] = useState<FloatNum[]>([]);
  const floatId = useRef(0);

  const stageTier = stageIndex + 1;
  const milCost = 5 * stageTier;
  const popCost = Math.max(1, Math.floor(stageTier / 2));
  const mil = resources?.military_power ?? 0;
  const pop = population ?? 0;
  const canHunt = mil >= milCost && pop >= popCost;

  // F2 DEEP HUNT — 3× cost, ~3× yield, 40% rare-drop chance, 120s cooldown.
  const DEEP_COOLDOWN = 120;
  const deepMilCost = 15 * stageTier;
  const deepPopCost = 3 * Math.max(1, Math.floor(stageTier / 2));
  const deepElapsed = Math.max(0, (gameTime || 0) - lastDeepHuntAt);
  const deepRemaining = Math.max(0, DEEP_COOLDOWN - deepElapsed);
  const deepOnCooldown = deepRemaining > 0;
  const deepReady = !deepOnCooldown && mil >= deepMilCost && pop >= deepPopCost;
  const deepFood = 45 * stageTier;
  const deepMat = 24 * stageTier;
  const deepOrg = 15 * stageTier;
  // Cooldown progress 0..1 (1 = just used, 0 = ready).
  const cdProgress = Math.min(1, deepElapsed / DEEP_COOLDOWN);

  // Estimated rewards (shown on the card so the player knows what they'll get).
  const foodGain = 15 * stageTier;
  const matGain = 8 * stageTier;
  const orgGain = 5 * stageTier;

  // FLOATING GAINS — same source-tied feedback as the manual action buttons
  // (per user: numbers tied to the source of the gain make cause/effect
  // legible). The Hunt button previously had none.
  const handleHunt = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!canHunt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const gains: [string, number][] = [
      ["food", foodGain],
      ["materials", matGain],
      ["organic_matter", orgGain],
    ];
    const newFloats: FloatNum[] = gains.map(([r, v], i) => ({
      id: floatId.current++,
      text: `+${formatNumber(v)}${resourceIcon(r)}`,
      color: resourceColor(r),
      x: rect.width / 2 + (i - 1) * 30,
      y: 10,
    }));
    setFloats((prev) => [...prev, ...newFloats]);
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => !newFloats.find((nf) => nf.id === f.id)));
    }, 800);
    huntNow();
  };

  const handleDeepHunt = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!deepReady) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const gains: [string, number][] = [
      ["food", deepFood],
      ["materials", deepMat],
      ["organic_matter", deepOrg],
    ];
    const newFloats: FloatNum[] = gains.map(([r, v], i) => ({
      id: floatId.current++,
      text: `+${formatNumber(v)}${resourceIcon(r)}`,
      color: resourceColor(r),
      x: rect.width / 2 + (i - 1) * 30,
      y: 10,
    }));
    setDeepFloats((prev) => [...prev, ...newFloats]);
    setTimeout(() => {
      setDeepFloats((prev) => prev.filter((f) => !newFloats.find((nf) => nf.id === f.id)));
    }, 800);
    huntDeepNow();
  };

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
      <CardContent className="space-y-2.5">
        {/* Normal Hunt — always available when affordable */}
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
            onClick={handleHunt}
            className="ml-auto relative"
          >
            {/* Floating gains — same pattern as ActionCard */}
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
            Hunt Now
          </Button>
        </div>
        {!canHunt && (
          <p className="text-[0.65rem] text-muted-foreground/70 italic">
            Need {milCost} military_power (have {Math.floor(mil)}) + {popCost} population (have {Math.floor(pop)}).
          </p>
        )}

        {/* F2 DEEP HUNT — cooldown-gated premium expedition. 3× cost, ~3×
            yield, 40% rare-drop chance (printed verbatim). The cooldown bar
            depletes over 120 in-game seconds (pause/speed-safe via gameTime). */}
        <div className="pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">🦁</span>
            <span className="text-xs font-semibold text-violet-300">Deep Hunt</span>
            <span className="text-[0.55rem] text-muted-foreground/70 italic">— a deliberate expedition</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span style={{ color: mil >= deepMilCost ? resourceColor("military_power") : "#ef4444" }}>
                {resourceIcon("military_power")}{formatNumber(deepMilCost, 0)}
              </span>
              <span className={pop >= deepPopCost ? "text-muted-foreground" : "text-red-400"}>
                + {deepPopCost} 👥 pop
              </span>
              <span className="text-muted-foreground/60">→</span>
              <span style={{ color: resourceColor("food") }}>
                +{formatNumber(deepFood, 0)}{resourceIcon("food")}
              </span>
              <span style={{ color: resourceColor("materials") }}>
                +{formatNumber(deepMat, 0)}{resourceIcon("materials")}
              </span>
              <span style={{ color: resourceColor("organic_matter") }}>
                +{formatNumber(deepOrg, 0)}{resourceIcon("organic_matter")}
              </span>
              <span className="text-amber-400 font-semibold">+ 40% rare drop</span>
            </div>
            <Button
              size="sm"
              disabled={!deepReady}
              onClick={handleDeepHunt}
              className={cn("ml-auto relative", deepReady && "bg-violet-500/20 border-violet-500/40 text-violet-100 hover:bg-violet-500/30")}
              title={deepOnCooldown ? `Deep Hunt recovers in ${Math.ceil(deepRemaining)}s` : mil < deepMilCost ? `Need ${deepMilCost} military (have ${Math.floor(mil)})` : pop < deepPopCost ? `Need ${deepPopCost} population (have ${Math.floor(pop)})` : "Launch a Deep Hunt expedition"}
            >
              {deepFloats.map((f) => (
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
              {deepOnCooldown ? `Recovering ${Math.ceil(deepRemaining)}s` : "Deep Hunt"}
            </Button>
          </div>
          {/* Cooldown bar — depletes (fills toward empty) as it recovers. */}
          {deepOnCooldown && (
            <div className="h-1 rounded-full bg-muted/40 overflow-hidden mt-1.5" role="progressbar"
              aria-valuemin={0} aria-valuemax={DEEP_COOLDOWN} aria-valuenow={Math.ceil(deepRemaining)}
              aria-label={`Deep Hunt recovering, ${Math.ceil(deepRemaining)} seconds remaining`}
            >
              <div
                className="h-full rounded-full bg-violet-500/70 transition-[width] duration-300"
                style={{ width: `${(1 - cdProgress) * 100}%` }}
              />
            </div>
          )}
        </div>
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
