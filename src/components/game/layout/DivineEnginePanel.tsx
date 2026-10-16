"use client";

import { useGameStore } from "@/game/state/store";
import {
  useActiveLayer,
  nextLayerId,
} from "@/game/state/layerHelpers";
import { formatNumber, formatCompact } from "../shared/format";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  HelpCircle,
  Skull,
  Eye,
  Triangle,
  Egg,
  Sparkles,
  Circle,
  Atom,
  Church,
  Infinity as InfinityIcon,
  Star,
  Lock,
  Globe,
  TrendingUp,
  Leaf,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// DivineEnginePanel — streamlined (P3)
//
// Replaces the old 5-stat-card + cosmic-viz + progress-bar layout
// with one focused readout:
//
//   ┌─────────────────────┐
//   │  Divine Engine      │
//   │                     │
//   │     12 Worlds       ← big (text-3xl)
//   │     ✦ 450 Div/s     ← medium (text-lg)
//   │     🌱 23 EP/s       ← small (text-sm)
//   │                     │
//   │   [L3 Sacrifice]    ← current layer's modal
//   │   [L4 Genesis 🔒]   ← next layer (teaser)
//   └─────────────────────┘
//
// Formula hidden behind a "?" tooltip.
// ============================================================

// Map each layer id to its label + icon. P6 — Modal Consolidation: the
// `open` field is no longer a per-layer setter name; we now call the single
// `openLayerModal(layerId)` action.
const LAYER_MODAL: Record<
  string,
  { label: string; icon: LucideIcon }
> = {
  evolution: { label: "Trials", icon: Skull },
  enlightenment: { label: "Foresight", icon: Eye },
  transcendence: { label: "Sacrifice", icon: Triangle },
  genesis: { label: "Genesis", icon: Egg },
  apotheosis: { label: "Divine", icon: Sparkles },
  singularity: { label: "System", icon: Circle },
  omnipotence: { label: "Hybrid", icon: Atom },
  divinity: { label: "Masks", icon: Church },
  infinity: { label: "Echoes", icon: InfinityIcon },
  eternity: { label: "Eternity", icon: Star },
};

// P6 — map DivineEnginePanel layer keys to the consolidated LayerModal ids.
// (The DivineEnginePanel uses `evolution` for L1, but the consolidated
// LayerModal uses `challenges` for that layer's modal content.)
const LAYER_MODAL_ID: Record<string, string> = {
  evolution: "challenges",
  enlightenment: "enlightenment",
  transcendence: "transcendence",
  genesis: "genesis",
  apotheosis: "apotheosis",
  singularity: "singularity",
  omnipotence: "omnipotence",
  divinity: "divinity",
  infinity: "infinity",
  eternity: "eternity",
};

export function DivineEnginePanel() {
  const peakProductionRate = useGameStore((s) => s.peakProductionRate || 0);
  const backgroundSimulations = useGameStore((s) => s.backgroundSimulations || 0);
  const divinityFromBackground = useGameStore((s) => s.divinityFromBackground || 0);
  const upgrades = useGameStore((s) => s.upgrades);
  const constellationStars = useGameStore((s) => s.constellationStars || {});

  // P6 — Modal Consolidation: replaced per-layer setShow* setters with the
  // single openLayerModal(layerId) action.
  const openLayerModal = useGameStore((s) => s.openLayerModal);

  const { activeLayerId, activeLayerRank } = useActiveLayer();
  const nextId = nextLayerId(activeLayerId);

  // Background-sim production rates.
  const divPerSec = peakProductionRate * 0.01 * backgroundSimulations;
  const epPerSec = peakProductionRate * 0.001 * backgroundSimulations;

  // Simulation Amplifier breakdown — kept for the "?" tooltip.
  const simAmpLevel = (upgrades?.["simulation_amplifier"] as number) || 0;
  const simMult = 1 + simAmpLevel;
  const starsLit = Object.values(constellationStars).filter(Boolean).length;

  // Open the modal for the current layer.
  function openModal(layerId: string) {
    const modalId = LAYER_MODAL_ID[layerId];
    if (modalId) openLayerModal(modalId);
  }

  // The "current layer" and "next layer to unlock" buttons.
  const currentDef = LAYER_MODAL[activeLayerId];
  const nextDef = nextId ? LAYER_MODAL[nextId] : null;
  const nextIsUnlocked = useIsLayerUnlocked(nextId);

  return (
    <div className="glass-panel rounded-xl p-4 relative">
      {/* Header — single line, no gradient text */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-violet-300" aria-hidden />
          <h2 className="text-sm font-semibold tracking-tight">Divine Engine</h2>
        </div>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Show formula"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[14rem]">
              <div className="space-y-1">
                <div className="font-semibold text-[0.7rem]">Formula</div>
                <div className="text-[0.65rem] leading-snug">
                  Worlds = (3 + {starsLit} stars) × {simMult}× amplifier
                </div>
                <div className="text-[0.65rem] leading-snug">
                  Divinity/s = peak × 1% × worlds
                </div>
                <div className="text-[0.65rem] leading-snug">
                  EP/s = peak × 0.1% × worlds
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* === One big number + minimal context === */}
      {/* FIX-PRESTIGE-DIVINE-CONSTELLATIONS: panel now shows EP/s at L2+ (was
          L4+ only) and adds a "Peak production" stat line so players at L2+
          never lose sight of their background-sim throughput. */}
      <div className="space-y-1.5 mb-4">
        {/* Worlds — big */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums leading-none">
            {formatNumber(backgroundSimulations, 0)}
          </span>
          <span className="text-sm text-muted-foreground">Worlds</span>
        </div>
        {/* Divinity/sec — medium */}
        <div className="flex items-baseline gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-amber-300" aria-hidden />
          <span className="text-lg font-semibold tabular-nums text-amber-300 leading-none">
            {divPerSec > 0 ? formatNumber(divPerSec, 2) : "0"}
          </span>
          <span className="text-xs text-muted-foreground">Divinity/s</span>
        </div>
        {/* EP/sec — small, shown at L2+ (was L4+ only) */}
        <div className="flex items-baseline gap-1.5">
          <Leaf className="w-3 h-3 text-emerald-300" aria-hidden />
          <span className="text-sm font-semibold tabular-nums text-emerald-300 leading-none">
            {epPerSec > 0 ? formatNumber(epPerSec, 2) : "0"}
          </span>
          <span className="text-[0.7rem] text-muted-foreground">EP/s</span>
        </div>
        {/* Peak production — the raw throughput feeding the rates above */}
        <div className="flex items-baseline gap-1.5">
          <Globe className="w-3 h-3 text-violet-300" aria-hidden />
          <span className="text-sm font-semibold tabular-nums text-violet-300 leading-none">
            {formatNumber(peakProductionRate, 0)}
          </span>
          <span className="text-[0.7rem] text-muted-foreground">Peak prod</span>
        </div>
        {/* Lifetime Divinity — quiet footnote */}
        {divinityFromBackground > 0 && (
          <div className="text-[0.65rem] text-muted-foreground/70 tabular-nums pt-1">
            Lifetime: {formatCompact(divinityFromBackground)} Divinity
          </div>
        )}
      </div>

      {/* === Quick-access buttons === */}
      <div className="flex flex-wrap gap-1.5">
        {currentDef && (
          <Button
            size="sm"
            variant="default"
            className="h-8 text-xs"
            onClick={() => openModal(activeLayerId)}
          >
            <currentDef.icon className="w-3.5 h-3.5" aria-hidden />
            <span className="ml-1">L{activeLayerRank} · {currentDef.label}</span>
          </Button>
        )}
        {nextDef && nextId && (
          <Button
            size="sm"
            variant={nextIsUnlocked ? "outline" : "ghost"}
            className="h-8 text-xs"
            disabled={!nextIsUnlocked}
            onClick={() => nextIsUnlocked && openModal(nextId)}
            title={
              nextIsUnlocked
                ? `Layer ${activeLayerRank + 1} — ${nextDef.label}`
                : `Locked: layer ${activeLayerRank + 1} not yet unlocked`
            }
          >
            {nextIsUnlocked ? (
              <nextDef.icon className="w-3.5 h-3.5" aria-hidden />
            ) : (
              <Lock className="w-3 h-3" aria-hidden />
            )}
            <span className="ml-1">L{activeLayerRank + 1} · {nextDef.label}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

// Local helper — checks if a layer is unlocked via the store.
function useIsLayerUnlocked(layerId: string | null): boolean {
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  if (!layerId) return false;
  if (layerId === "evolution") return true;
  return !!unlockedLayers?.[layerId];
}
