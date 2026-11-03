"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { SYSTEMS, SYSTEM_MAP, systemsForStage, systemCost } from "@/game/data/systems";
import { TECHS, techsForStage } from "@/game/data/techs";
import { RESOURCE_MAP, STAGE_RESOURCES } from "@/game/data/resources";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowUpCircle, FlaskConical, Gem, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// NextStepHint — Smart context-aware "what should I do next?" banner
//
// A dismissible banner at the top of the main content area. Analyzes
// the current game state + suggests the single highest-priority next
// action. Improves game flow by always giving the player a clear
// direction.
//
// Priority order (highest first):
//   1. Can evolve → "Ready to evolve!"
//   2. Resource at cap → "Build [capacity system] to raise cap"
//   3. Key tech affordable → "Research [tech] for [bonus]"
//   4. Key system affordable → "Build [system] to produce [resource]"
//   5. Has Aether Shards → "Visit Cosmetics to spend shards"
//   6. (none) → banner hidden
//
// Each hint is dismissible (per-hint-id). Dismissed hints reset when
// the hint id changes (i.e. when the game state changes enough to
// produce a different hint).
// ============================================================

interface Hint {
  id: string;
  icon: typeof ArrowUpCircle;
  text: string;
  cta: string;
  action?: () => void;
  accent: string;
}

export function NextStepHint() {
  const s = useGameStore();
  const setTab = useGameStore((st) => st.setTab);
  const setShowEvolve = useGameStore((st) => st.setShowEvolve);
  const setShowCosmetics = useGameStore((st) => st.setShowCosmetics);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const hint = useMemo(() => {
    return computeNextHint(s, {
      setTab,
      setShowEvolve,
      setShowCosmetics,
    });
  }, [s, setTab, setShowEvolve, setShowCosmetics]);

  if (!hint) return null;
  if (dismissed.has(hint.id)) return null;

  const Icon = hint.icon;

  const dismiss = () => setDismissed((prev) => new Set([...prev, hint.id]));

  return (
    <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 backdrop-blur-sm px-3 py-2 flex items-center gap-2 group tab-fade-in">
      <Icon className={cn("w-4 h-4 shrink-0", hint.accent)} />
      <span className="text-xs text-foreground/80 flex-1 min-w-0 truncate">
        {hint.text}
      </span>
      {hint.action && (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[0.65rem] px-2 shrink-0 text-primary hover:bg-primary/10"
          onClick={() => {
            hint.action?.();
            dismiss();
          }}
        >
          {hint.cta}
          <ChevronRight className="w-3 h-3 ml-0.5" />
        </Button>
      )}
      <button
        type="button"
        className="text-muted-foreground/60 hover:text-foreground shrink-0 transition-colors text-sm leading-none"
        onClick={dismiss}
        aria-label="Dismiss hint"
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

// ============================================================
// computeNextHint — determines the next best action from game state
// ============================================================
function computeNextHint(
  s: ReturnType<typeof useGameStore.getState>,
  actions: {
    setTab: (t: string) => void;
    setShowEvolve: (v: boolean) => void;
    setShowCosmetics: (v: boolean) => void;
  }
): Hint | null {
  const stage = STAGES[s.stageIndex];
  if (!stage) return null;

  // 1. Can evolve?
  if (checkCanEvolve(s)) {
    const nextName = STAGES[s.stageIndex + 1]?.name || "next stage";
    return {
      id: `evolve-${stage.id}`,
      icon: ArrowUpCircle,
      text: `Ready to evolve to ${nextName}! All requirements met.`,
      cta: "Evolve",
      action: () => actions.setShowEvolve(true),
      accent: "text-emerald-400",
    };
  }

  // 2. Resource at cap → suggest capacity system.
  const cappedRes = findCappedResource(s);
  if (cappedRes) {
    const capSys = findCapacitySystem(s, cappedRes);
    if (capSys) {
      return {
        id: `cap-${cappedRes}`,
        icon: TrendingUp,
        text: `${RESOURCE_MAP[cappedRes]?.name || cappedRes} is at capacity — build ${capSys.name} to raise the cap.`,
        cta: "Build",
        action: () => actions.setTab("systems"),
        accent: "text-amber-400",
      };
    }
  }

  // 3. Key tech affordable.
  const tech = findAffordableTech(s);
  if (tech) {
    return {
      id: `tech-${tech.id}`,
      icon: FlaskConical,
      text: `Research ${tech.name} — ${tech.desc?.slice(0, 50) || "permanent bonus"}.`,
      cta: "Research",
      action: () => actions.setTab("tech"),
      accent: "text-violet-400",
    };
  }

  // 4. Key system affordable.
  const sys = findAffordableSystem(s);
  if (sys) {
    const produces = sys.produces ? Object.keys(sys.produces).map((r) => RESOURCE_MAP[r]?.name || r).join(", ") : "resources";
    return {
      id: `sys-${sys.id}`,
      icon: Zap,
      text: `Build ${sys.name} to produce ${produces}.`,
      cta: "Build",
      action: () => actions.setTab("systems"),
      accent: "text-cyan-400",
    };
  }

  // 5. Has Aether Shards.
  if ((s.aetherShards || 0) >= 10) {
    return {
      id: "spend-shards",
      icon: Gem,
      text: `You have ${Math.floor(s.aetherShards)} Aether Shards — visit Cosmetics to unlock visual customizations.`,
      cta: "Cosmetics",
      action: () => actions.setShowCosmetics(true),
      accent: "text-fuchsia-400",
    };
  }

  return null;
}

// ----- Helpers -----

function checkCanEvolve(s: ReturnType<typeof useGameStore.getState>): boolean {
  const stage = STAGES[s.stageIndex];
  if (!stage?.evolveRequires) return false;
  const reqs = stage.evolveRequires;
  if (reqs.minPopulation && (s.population || 0) < reqs.minPopulation) return false;
  if (reqs.minSystems) {
    const stageSystems = Object.entries(s.ownedSystems || {})
      .filter(([id]) => SYSTEM_MAP[id]?.stage === stage.id)
      .reduce((a, [, c]) => a + (c as number), 0);
    if (stageSystems < reqs.minSystems) return false;
  }
  if (reqs.requiresSystems && !reqs.requiresSystems.every((id) => (s.ownedSystems?.[id] || 0) > 0)) return false;
  if (reqs.requiresOneOfSystems && !reqs.requiresOneOfSystems.some((id) => (s.ownedSystems?.[id] || 0) > 0)) return false;
  if (reqs.requiresOneOfTechs && !reqs.requiresOneOfTechs.some((id) => s.technologies?.[id])) return false;
  if (reqs.requiresRivalsResolved) {
    const resolved = (s.rivals || []).filter((r) => r.state !== "active" && !r.hidden).length;
    if (resolved < (reqs.requiresRivalsMin || 1)) return false;
  }
  if (reqs.requiresGovernmentChosen && !s.activeGovernment) return false;
  if (reqs.requiresHappinessThreshold && (s.resources?.happiness || 0) < reqs.requiresHappinessThreshold) return false;
  if (reqs.requiresTradeRoutes && Object.keys(s.tradeAgreement || {}).length < reqs.requiresTradeRoutes) return false;
  return true;
}

function findCappedResource(s: ReturnType<typeof useGameStore.getState>): string | null {
  const stageRes = STAGE_RESOURCES[STAGES[s.stageIndex]?.id] || [];
  for (const resId of stageRes) {
    const val = s.resources?.[resId] || 0;
    const cap = s.capacities?.[resId] || 0;
    if (cap > 0 && val >= cap * 0.95) return resId;
  }
  return null;
}

function findCapacitySystem(
  s: ReturnType<typeof useGameStore.getState>,
  resourceId: string
): typeof SYSTEMS[number] | null {
  const stageSystems = systemsForStage(STAGES[s.stageIndex].id);
  for (const sys of stageSystems) {
    if (sys.capacityGains?.[resourceId] && (s.ownedSystems?.[sys.id] || 0) === 0) {
      const cost = systemCost(sys, 0, 1);
      if (Object.entries(cost).every(([r, v]) => (s.resources?.[r] || 0) >= (v as number))) {
        return sys;
      }
    }
  }
  return null;
}

function findAffordableTech(s: ReturnType<typeof useGameStore.getState>): typeof TECHS[number] | null {
  const stageTechs = techsForStage(STAGES[s.stageIndex].id);
  const affordable = stageTechs
    .filter((t) => !s.technologies?.[t.id])
    .filter((t) => !t.cost || Object.entries(t.cost).every(([r, v]) => (s.resources?.[r] || 0) >= (v as number)));
  return affordable[0] || null;
}

function findAffordableSystem(s: ReturnType<typeof useGameStore.getState>): typeof SYSTEMS[number] | null {
  const stageSystems = systemsForStage(STAGES[s.stageIndex].id);
  const affordable = stageSystems
    .filter((sys) => (s.ownedSystems?.[sys.id] || 0) === 0)
    .filter((sys) => sys.produces && Object.keys(sys.produces).length > 0)
    .filter((sys) => {
      const cost = systemCost(sys, 0, 1);
      return Object.entries(cost).every(([r, v]) => (s.resources?.[r] || 0) >= (v as number));
    });
  return affordable[0] || null;
}
