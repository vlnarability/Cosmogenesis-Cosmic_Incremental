"use client";

import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { ARCHETYPES, ARCHETYPE_MAP, dominantArchetype } from "@/game/data/archetypes";
import { formatNumber } from "../shared/format";
import { ArchetypeRadar } from "../shared/ArchetypeRadar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Star, TrendingUp, Sparkles, Dna, Info } from "lucide-react";
import { useState } from "react";

export function StagePanel() {
  const stageIndex = useGameStore((s) => s.stageIndex);
  const population = useGameStore((s) => s.population);
  const populationProgress = useGameStore((s) => s.populationProgress);
  const time = useGameStore((s) => s.time);
  const resources = useGameStore((s) => s.resources);
  const ownedSystems = useGameStore((s) => s.ownedSystems);
  const technologies = useGameStore((s) => s.technologies);
  const setShowEvolve = useGameStore((s) => s.setShowEvolve);
  const upgrades = useGameStore((s) => s.upgrades);
  const archetypeAffinity = useGameStore((s) => s.archetypeAffinity);
  const lockedArchetype = useGameStore((s) => s.lockedArchetype);
  // ARCHETYPES-REWORK — which archetypes the player has EVER locked in.
  // Persists across prestiges. Drives the ??? reveal state on the radar.
  const revealedLineageArchetypes = useGameStore((s) => s.revealedLineageArchetypes || {});
  const galacticWins = useGameStore((s) => s.galacticWins);
  const totalRuns = useGameStore((s) => s.totalRuns);

  const [showPopInfo, setShowPopInfo] = useState(false);
  const [showArchInfo, setShowArchInfo] = useState(false);

  const stage = STAGES[stageIndex];
  const totalSystems = Object.values(ownedSystems).reduce((a, b) => a + b, 0);
  const totalTech = Object.keys(technologies).length;
  const score = computeScore(resources, ownedSystems, technologies, population, time);

  const reqs = stage.evolveRequires;
  const evolveBoost = 1 - Math.min(0.30, (upgrades["evolutionary_momentum"] || 0) * 0.05);
  const popPct = Math.min(100, (population / (reqs.minPopulation * evolveBoost)) * 100);
  const sysPct = Math.min(100, (totalSystems / (reqs.minSystems * evolveBoost)) * 100);
  const techPct = Math.min(100, (totalTech / (reqs.minTech * evolveBoost)) * 100);
  const canEvolve = popPct >= 100 && sysPct >= 100 && techPct >= 100;

  // Archetype drift
  const hasAffinity = Object.values(archetypeAffinity).some((v) => v > 0);
  const domArch = dominantArchetype(archetypeAffinity);
  const totalAffinity = Object.values(archetypeAffinity).reduce((a, b) => a + b, 0);
  // ARCHETYPES-REWORK — all 13 archetypes render on the radar; discovery
  // (revealed via first lock-in) controls ??? vs. full label display.
  // The player can always see their affinity polygon drift.
  const isLocked = !!lockedArchetype;

  return (
    <div className="glass-panel rounded-xl p-4 relative overflow-hidden">
      {/* Accent corner mark — like a stamped seal */}
      <div
        className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
        style={{
          background: `linear-gradient(225deg, ${stage.accent}25 0%, transparent 60%)`,
        }}
      />
      <div
        className="absolute top-2 right-2 text-[0.6rem] font-mono uppercase tracking-widest text-muted-foreground/60"
      >
        {stageIndex + 1}/{STAGES.length}
      </div>

      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-3xl leading-none">{stage.icon}</span>
          <div>
            <h2 className="text-xl font-bold tracking-tight leading-none">{stage.name}</h2>
            <p className="text-xs text-muted-foreground italic mt-0.5">{stage.tagline}</p>
          </div>
        </div>
        {/* Auto-running indicator — shown when the player owns any auto-buyer upgrade */}
        {(upgrades["auto_system_buyer"] || upgrades["auto_tech_buyer"] || upgrades["auto_evolver"]) && (
          <div className="mt-2 flex items-center gap-1.5 text-[0.65rem] px-2 py-1 rounded-md border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
            <span className="inline-block">🔄</span>
            <span>Auto-running — base game progresses on its own.</span>
            <Badge variant="outline" className="ml-auto text-[0.55rem] text-emerald-300 border-emerald-400/40 px-1 py-0">
              {(1 + (totalRuns || 0) * 0.5).toFixed(1)}× speed
            </Badge>
          </div>
        )}
      </div>

      {/* Stage art panel — less glowy, more like a specimen plate */}
      <div
        className="stage-plate mb-3 flex items-center justify-center relative"
        style={{
          background: stage.bgGradient,
          borderColor: `${stage.accent}40`,
        }}
      >
        <div className="relative z-10 text-center py-6">
          <div
            className="text-5xl mb-1"
            style={{ filter: `drop-shadow(0 0 12px ${stage.accent}80)` }}
          >
            {stage.icon}
          </div>
          <div className="text-[0.6rem] text-white/60 font-mono uppercase tracking-[0.2em]">
            {stage.name} · {stage.duration}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{stage.desc}</p>

      {/* Population stat with growth progress */}
      <div className="stat-card mb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Users className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wide">Population</span>
          </div>
          <button
            onClick={() => setShowPopInfo(!showPopInfo)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="How does population grow?"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">{Math.floor(population)}</span>
          <span className="text-xs text-muted-foreground">
            +{(populationProgress * 100).toFixed(0)}% toward next
          </span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all"
            style={{ width: `${populationProgress * 100}%` }}
          />
        </div>
        {showPopInfo && (
          <div className="mt-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded p-2 leading-relaxed">
            <p className="font-semibold text-foreground mb-1">How population grows</p>
            <p>Population accrues continuously. The growth rate scales with <span className="text-amber-400">happiness</span> — high happiness (+30%), low happiness (−10%).</p>
            {["creature", "tribal", "civilization", "empire"].includes(stage.id) && (
              <p className="mt-1">From {stage.name} onward, critically low <span className="text-emerald-400">food</span> or <span className="text-blue-400">water</span> (under 10% of capacity) cuts growth by 70%.</p>
            )}
          </div>
        )}
      </div>

      {/* Stats grid (2 — systems/tech) */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <MiniStat
          icon={<Sparkles className="w-3 h-3" />}
          label="Systems"
          value={formatNumber(totalSystems, 0)}
          ok={totalSystems >= reqs.minSystems * evolveBoost}
          need={formatNumber(reqs.minSystems * evolveBoost, 0)}
        />
        <MiniStat
          icon={<TrendingUp className="w-3 h-3" />}
          label="Tech"
          value={formatNumber(totalTech, 0)}
          ok={totalTech >= reqs.minTech * evolveBoost}
          need={formatNumber(reqs.minTech * evolveBoost, 0)}
        />
      </div>

      {/* Archetype / Lineage panel */}
      <div className="stat-card mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Dna className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wide">Lineage</span>
          </div>
          <button
            onClick={() => setShowArchInfo(!showArchInfo)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="How does lineage work?"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {showArchInfo && (
          <div className="mb-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded p-2 leading-relaxed">
            <p className="font-semibold text-foreground mb-1">Lineage & Archetypes</p>
            <p>Buying certain systems and techs shifts your <span className="text-foreground">lineage drift</span> toward one of 13 archetypes. When you evolve from <span className="text-foreground">Creature → Tribal</span>, the dominant archetype <span className="text-foreground">locks in</span> for the rest of the run and grants 3 buffs + 1 debuff.</p>
            <p className="mt-1">Undiscovered archetypes appear as <span className="text-foreground">???</span> on the radar. Lock one in once to reveal its name forever — even across resets.</p>
            <p className="mt-1">Choose your path deliberately — or let it emerge from how you play.</p>
          </div>
        )}

        {isLocked ? (
          <LockedArchetypeDisplay archId={lockedArchetype!} />
        ) : hasAffinity ? (
          <div className="space-y-2">
            <ArchetypeRadar
              affinity={archetypeAffinity}
              lockedArchetype={lockedArchetype}
              discoveredArchetypes={revealedLineageArchetypes}
              size={180}
            />
            {stageIndex < 1 && (
              <p className="text-[0.65rem] text-muted-foreground italic text-center">
                Lineage locks at Creature → Tribal evolution
              </p>
            )}
            {stageIndex >= 1 && domArch && (
              <p className="text-[0.65rem] text-amber-400 italic text-center">
                Will lock as {ARCHETYPE_MAP[domArch]?.name} on evolution
              </p>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">
            {stageIndex < 1
              ? "Drift begins as you build. Locked at Creature → Tribal."
              : "No drift yet — build systems or research tech to find your path."}
          </div>
        )}
      </div>

      {/* Evolve progress */}
      <div className="space-y-1.5 mb-3">
        <ProgressRow label="Population" pct={popPct} color="bg-cyan-400" />
        <ProgressRow label="Systems" pct={sysPct} color="bg-violet-400" />
        <ProgressRow label="Tech" pct={techPct} color="bg-amber-400" />
      </div>

      <Button
        className={cn("w-full transition-all", canEvolve && "evolve-ready")}
        size="lg"
        disabled={!canEvolve}
        onClick={() => setShowEvolve(true)}
        style={canEvolve ? { background: stage.accent, color: "#0a0a1a" } : undefined}
      >
        {stageIndex >= STAGES.length - 1 ? "🌌 Achieve Galactic Ascension" : `Evolve to ${STAGES[stageIndex + 1]?.name || "Next"}`}
      </Button>
      {!canEvolve && (
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Complete all three requirements to evolve
        </p>
      )}
      {canEvolve && (
        <p className="text-xs text-emerald-400 mt-1 text-center font-semibold animate-pulse">
          ✓ Ready to evolve
        </p>
      )}
    </div>
  );
}

function LockedArchetypeDisplay({ archId }: { archId: string }) {
  const arch = ARCHETYPE_MAP[archId];
  if (!arch) return null;
  // ARCHETYPES-REWORK — show the 3 buffs + 1 debuff as structured lists.
  // Falls back to the legacy single-label badge if buffs/debuff aren't
  // populated (defensive — should always be populated post-rework).
  const buffs = arch.bonus.buffs ?? [];
  const debuff = arch.bonus.debuff;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-lg font-mono" style={{ color: arch.color }}>{arch.glyph}</span>
        <div>
          <div className="text-sm font-bold" style={{ color: arch.color }}>{arch.name}</div>
          <div className="text-[0.65rem] text-muted-foreground">{arch.rarity} · locked</div>
        </div>
        {buffs.length === 0 && (
          <Badge variant="outline" className="ml-auto text-[0.6rem] text-emerald-400 border-emerald-500/30">
            {arch.bonus.label}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground italic leading-snug">{arch.bonus.desc}</p>
      {buffs.length > 0 && (
        <div className="space-y-0.5 mt-1">
          {buffs.map((b, i) => (
            <div key={i} className="flex items-start gap-1 text-[0.65rem] text-emerald-300/90 leading-snug">
              <span className="text-emerald-400 shrink-0">+</span>
              <span>{b}</span>
            </div>
          ))}
          {debuff && (
            <div className="flex items-start gap-1 text-[0.65rem] text-rose-300/90 leading-snug mt-0.5">
              <span className="text-rose-400 shrink-0">−</span>
              <span>{debuff}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value, ok, need }: { icon: React.ReactNode; label: string; value: string; ok: boolean; need: string }) {
  return (
    <div className="stat-card text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground text-[0.65rem] mb-1 uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="text-base font-bold tabular-nums leading-none">{value}</div>
      <div className={cn("text-[0.65rem] mt-0.5", ok ? "text-emerald-400" : "text-muted-foreground")}>
        / {need}
      </div>
    </div>
  );
}

function ProgressRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  const nearComplete = pct >= 90 && pct < 100;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", color, nearComplete && "bar-near-complete")}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className={cn("text-xs w-10 text-right tabular-nums", pct >= 100 ? "text-emerald-400 font-bold" : "text-muted-foreground")}>
        {Math.floor(pct)}%
      </span>
    </div>
  );
}

function computeScore(
  resources: Record<string, number>,
  ownedSystems: Record<string, number>,
  technologies: Record<string, boolean>,
  population: number,
  time: number
): number {
  const totalSystems = Object.values(ownedSystems).reduce((a, b) => a + b, 0);
  const totalTech = Object.keys(technologies).length;
  const resourceSum = Object.values(resources).reduce((a, b) => a + b, 0);
  return Math.floor(
    population * 2 +
    totalSystems * 5 +
    totalTech * 10 +
    resourceSum * 0.5 +
    time * 0.1
  );
}
