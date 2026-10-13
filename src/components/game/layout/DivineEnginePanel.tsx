"use client";

import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { formatNumber, formatCompact } from "../shared/format";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Atom, TrendingUp, Infinity as InfinityIcon, Star as StarIcon, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

// DivineEnginePanel — replaces StagePanel in the left rail once the player
// has unlocked Enlightenment (L2+). The base game (Cell → Galactic) is now
// abstracted away and simulated in the background as `backgroundSimulations`
// (called "Worlds" in the UI) — parallel runs, each generating Divinity at
// 1% of `peakProductionRate` per second. Worlds are no longer purchased
// manually — they are computed each tick as (3 starter + constellation
// stars lit) × Simulation Amplifier multiplier. To get more worlds, light
// more stars in the Enlightenment (constellation) modal OR buy the
// Simulation Amplifier shop upgrade.
export function DivineEnginePanel() {
  const peakProductionRate = useGameStore((s) => s.peakProductionRate || 0);
  const backgroundSimulations = useGameStore((s) => s.backgroundSimulations || 0);
  const divinityFromBackground = useGameStore((s) => s.divinityFromBackground || 0);
  const stageIndex = useGameStore((s) => s.stageIndex);
  const population = useGameStore((s) => s.population);
  const ownedSystems = useGameStore((s) => s.ownedSystems);
  const technologies = useGameStore((s) => s.technologies);
  const upgrades = useGameStore((s) => s.upgrades);
  // Constellation stars lit — drives the background world count formula.
  const constellationStars = useGameStore((s) => s.constellationStars || {});

  // Divine generation rate = peak × 1% × backgroundSimulations (Divinity/sec).
  const divPerSec = peakProductionRate * 0.01 * backgroundSimulations;

  // Simulation Amplifier shop upgrade: each level multiplies the sims-per-star
  // count. Level 0 → ×1, level 1 → ×2, etc.
  const simAmpLevel = (upgrades?.["simulation_amplifier"] as number) || 0;
  const simMult = 1 + simAmpLevel;
  // Stars lit across all 88 constellations — recomputed locally to display the
  // formula breakdown (the store recomputes this each tick too).
  const starsLit = Object.values(constellationStars).filter(Boolean).length;
  // Sanity note: backgroundSimulations from the store equals (3 + starsLit) × simMult.
  // We don't recompute it here to avoid drift; we just display the breakdown.

  // Auto-evolver progress bar — fraction of stage progression toward Galactic.
  // When the player owns auto_evolver, this hints how close the base game is
  // to the next prestige. 0/7 = Cell start, 6/7 = Galactic = next prestige.
  const hasAutoEvolver = (upgrades["auto_evolver"] || 0) > 0;
  const stageProgressPct = Math.min(100, (stageIndex / (STAGES.length - 1)) * 100);
  const currentStage = STAGES[stageIndex];

  // Bonus indicator: shows the next-stage requirements progress (the most
  // "limiting" of pop / systems / tech), so the player has SOME sense of
  // how the background sim is doing.
  const totalSystems = Object.values(ownedSystems).reduce((a, b) => a + b, 0);
  const totalTech = Object.keys(technologies).length;
  const reqs = currentStage.evolveRequires;
  const evolveBoost = 1 - Math.min(0.30, (upgrades["evolutionary_momentum"] || 0) * 0.05);
  const popPct = Math.min(100, (population / (reqs.minPopulation * evolveBoost)) * 100);
  const sysPct = Math.min(100, (totalSystems / (reqs.minSystems * evolveBoost)) * 100);
  const techPct = Math.min(100, (totalTech / (reqs.minTech * evolveBoost)) * 100);
  const minPct = Math.min(popPct, sysPct, techPct);
  const atGalactic = stageIndex >= STAGES.length - 1;

  return (
    <div className="glass-panel rounded-xl p-4 relative overflow-hidden">
      {/* Cosmic accent corner */}
      <div
        className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, rgba(167,139,250,0.35) 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute top-2 right-2 text-[0.6rem] font-mono uppercase tracking-widest text-violet-300/70"
      >
        Divine Engine
      </div>

      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-3xl leading-none animate-pulse-slow">🌌</span>
          <div>
            <h2 className="text-xl font-bold tracking-tight leading-none bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
              Divine Engine
            </h2>
            <p className="text-xs text-muted-foreground italic mt-0.5">
              Worlds under your command spinning Divinity from mortal ambition.
            </p>
          </div>
        </div>
      </div>

      {/* Cosmic visualization — rotating galaxy */}
      <div
        className="relative mb-3 rounded-lg overflow-hidden border border-violet-400/20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(76,29,149,0.45) 0%, rgba(15,23,42,0.85) 60%, rgba(2,6,23,0.95) 100%)",
          height: "120px",
        }}
      >
        {/* Slowly rotating star ring */}
        <div
          className="absolute inset-0 divine-engine-orbit"
          aria-hidden
        >
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const r = 40;
            const cx = 50 + (Math.cos(angle) * r);
            const cy = 50 + (Math.sin(angle) * r);
            return (
              <span
                key={i}
                className="absolute w-1 h-1 rounded-full bg-violet-200 divine-engine-twinkle"
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  animationDelay: `${(i * 0.2).toFixed(2)}s`,
                  boxShadow: "0 0 6px rgba(196,181,253,0.8)",
                }}
              />
            );
          })}
          {/* Inner faster ring */}
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
            const r = 22;
            const cx = 50 + (Math.cos(angle) * r);
            const cy = 50 + (Math.sin(angle) * r);
            return (
              <span
                key={`inner-${i}`}
                className="absolute w-0.5 h-0.5 rounded-full bg-fuchsia-200 divine-engine-twinkle"
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  animationDelay: `${(i * 0.15).toFixed(2)}s`,
                  boxShadow: "0 0 4px rgba(240,171,252,0.9)",
                }}
              />
            );
          })}
        </div>
        {/* Central core */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white divine-engine-core"
          style={{ boxShadow: "0 0 24px 6px rgba(216,180,254,0.9)" }}
        />
        {/* Engine label overlay */}
        <div className="absolute bottom-1 left-0 right-0 text-center text-[0.55rem] text-violet-200/70 font-mono uppercase tracking-[0.2em] pointer-events-none">
          {backgroundSimulations > 0
            ? `${backgroundSimulations} world${backgroundSimulations === 1 ? "" : "s"} running`
            : "idle — awaiting ascension"}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatCard
          icon={<Atom className="w-3 h-3" />}
          label="Worlds"
          value={formatNumber(backgroundSimulations, 0)}
          sub={`${starsLit} stars lit`}
          accent="text-violet-300"
        />
        <StatCard
          icon={<TrendingUp className="w-3 h-3" />}
          label="Peak"
          value={`${formatCompact(peakProductionRate)}/s`}
          sub="best production"
          accent="text-cyan-300"
        />
      </div>

      {/* Divine Generation — the headline number */}
      <div className="stat-card mb-3 border-violet-400/30 bg-violet-500/5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-violet-200 text-xs uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Divine Generation</span>
          </div>
          <Badge variant="outline" className="text-[0.55rem] text-violet-300 border-violet-400/40 px-1 py-0">
            peak × 1% × N
          </Badge>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums text-violet-200">
            {divPerSec > 0 ? formatNumber(divPerSec, 2) : "0"}
          </span>
          <span className="text-xs text-muted-foreground">Divinity/sec</span>
        </div>
        <div className="mt-1 text-[0.65rem] text-muted-foreground tabular-nums">
          {peakProductionRate > 0
            ? `${formatCompact(peakProductionRate)} peak × 0.01 × ${backgroundSimulations} worlds`
            : "Peak production will be recorded as your civilizations run."}
        </div>
      </div>

      {/* Lifetime Divinity from background */}
      <div className="stat-card mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <InfinityIcon className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wide">Lifetime</span>
        </div>
        <div className="text-sm font-semibold tabular-nums text-amber-200">
          {formatCompact(divinityFromBackground)} Divinity
        </div>
      </div>

      {/* Auto-evolver progress bar (subtle) */}
      {hasAutoEvolver && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1 text-[0.65rem] text-muted-foreground">
            <span className="uppercase tracking-wide">Auto-run progress</span>
            <span className="tabular-nums">
              {atGalactic ? "Galactic — ready" : `${currentStage.name} → ${STAGES[stageIndex + 1]?.name || "Ascend"}`}
            </span>
          </div>
          {/* Stage progression bar */}
          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mb-1.5">
            <div
              className="h-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-500"
              style={{ width: `${stageProgressPct}%` }}
            />
          </div>
          {/* Next-stage requirement bar */}
          {!atGalactic && (
            <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  minPct >= 100 ? "bg-emerald-400" : "bg-violet-400/60"
                )}
                style={{ width: `${Math.min(100, minPct)}%` }}
              />
            </div>
          )}
          {!atGalactic && (
            <p className="mt-1 text-[0.6rem] text-muted-foreground/70 italic">
              Auto-evolving at {Math.floor(minPct)}% of next-stage requirements
            </p>
          )}
        </div>
      )}

      {/* Worlds count — informational display.
          Formula: worlds = (3 starters + stars lit) × Simulation Amplifier multiplier.
          More stars lit → more worlds → more Divinity + EP per second. */}
      <div className="stat-card mb-3 border-violet-400/30 bg-violet-500/5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-violet-200 text-xs uppercase tracking-wide">
            <StarIcon className="w-3.5 h-3.5" />
            <span>Worlds</span>
          </div>
          <Badge variant="outline" className="text-[0.55rem] text-violet-300 border-violet-400/40 px-1 py-0">
            3 + stars × {simMult}×
          </Badge>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums text-violet-200">
            {formatNumber(backgroundSimulations, 0)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({3 + starsLit} base × {simMult}× amp)
          </span>
        </div>
        <div className="mt-1 text-[0.65rem] text-muted-foreground tabular-nums">
          formula: (3 starter worlds + {starsLit} constellation star{starsLit === 1 ? "" : "s"} lit) × {simMult}× amplifier = {formatNumber(backgroundSimulations, 0)} worlds
        </div>
      </div>

      {/* How to get more worlds — explainer hint. */}
      <div className="stat-card mb-3 flex items-start gap-2 border-amber-400/30 bg-amber-500/5">
        <Lightbulb className="w-3.5 h-3.5 text-amber-300 mt-0.5 shrink-0" />
        <div className="text-[0.65rem] text-amber-100/90 leading-snug">
          <span className="font-semibold">Want more worlds?</span>{" "}
          Light more stars in the{" "}
          <span className="text-amber-300 font-medium">Enlightenment (constellation) modal</span>{" "}
          to add a world per star, or buy the{" "}
          <span className="text-amber-300 font-medium">Simulation Amplifier</span>{" "}
          shop upgrade (×{simMult + 1} at level {simAmpLevel + 1}).
        </div>
      </div>

      <style>{`
        @keyframes divine-engine-orbit {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes divine-engine-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.7); }
          50%      { opacity: 1;   transform: scale(1.3); }
        }
        @keyframes divine-engine-core {
          0%, 100% { transform: translate(-50%, -50%) scale(1);   opacity: 0.8; }
          50%      { transform: translate(-50%, -50%) scale(1.5); opacity: 1;   }
        }
        .divine-engine-orbit {
          animation: divine-engine-orbit 30s linear infinite;
        }
        .divine-engine-twinkle {
          animation: divine-engine-twinkle 2.4s ease-in-out infinite;
        }
        .divine-engine-core {
          animation: divine-engine-core 3s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="stat-card text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground text-[0.65rem] mb-1 uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className={cn("text-base font-bold tabular-nums leading-none", accent)}>{value}</div>
      <div className="text-[0.6rem] mt-0.5 text-muted-foreground/70">{sub}</div>
    </div>
  );
}
