"use client";

import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { RITUALS, RITUAL_MAP } from "@/game/data/transcendence";
import { ACTIVE_ABILITIES } from "@/game/data/activeAbilities";
import { useActiveLayer, layerName, layerRank } from "@/game/state/layerHelpers";
import { formatNumber, formatTime } from "../shared/format";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Pause, Play, FastForward, Save, Settings, Store, Clock, Check, Skull, Crown, Eye, Triangle, Egg, Sparkles, Circle, Atom, Church, Infinity as InfinityIcon, Star, Zap, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const stageIndex = useGameStore((s) => s.stageIndex);
  const population = useGameStore((s) => s.population);
  const time = useGameStore((s) => s.time);
  const speed = useGameStore((s) => s.speed);
  const paused = useGameStore((s) => s.paused);
  const evolutionPoints = useGameStore((s) => s.evolutionPoints);
  const galacticWins = useGameStore((s) => s.galacticWins);
  const totalRuns = useGameStore((s) => s.totalRuns);
  const lastSaved = useGameStore((s) => s.lastSaved);
  const upgrades = useGameStore((s) => s.upgrades);
  const unlockedChallenges = useGameStore((s) => s.unlockedChallenges);
  const activeChallenge = useGameStore((s) => s.activeChallenge);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const heresy = useGameStore((s) => s.heresy);
  const instability = useGameStore((s) => s.instability);
  const prestigePoints = useGameStore((s) => s.prestigePoints);

  // QUICK WIN 6 — visual feedback for active effects
  const activeTemporaryRituals = useGameStore((s) => s.activeTemporaryRituals || {});
  const ritualComboTimer = useGameStore((s) => s.ritualComboTimer || 0);
  const activeAbilityEffects = useGameStore((s) => s.activeAbilityEffects || {});
  const activeAbilityCooldowns = useGameStore((s) => s.activeAbilityCooldowns || {});

  const setSpeed = useGameStore((s) => s.setSpeed);
  const togglePause = useGameStore((s) => s.togglePause);
  const saveGame = useGameStore((s) => s.saveGame);
  const setShowShop = useGameStore((s) => s.setShowShop);
  const setShowSettings = useGameStore((s) => s.setShowSettings);
  const setShowChallenges = useGameStore((s) => s.setShowChallenges);
  const setShowEnlightenment = useGameStore((s) => s.setShowEnlightenment);
  const setShowTranscendence = useGameStore((s) => s.setShowTranscendence);
  const setShowGenesis = useGameStore((s) => s.setShowGenesis);
  const setShowApotheosis = useGameStore((s) => s.setShowApotheosis);
  const setShowSingularity = useGameStore((s) => s.setShowSingularity);
  const setShowOmnipotence = useGameStore((s) => s.setShowOmnipotence);
  const setShowDivinityLayer = useGameStore((s) => s.setShowDivinityLayer);
  const setShowInfinity = useGameStore((s) => s.setShowInfinity);
  const setShowEternity = useGameStore((s) => s.setShowEternity);
  const setTab = useGameStore((s) => s.setTab);

  const stage = STAGES[stageIndex];
  const speeds = [1, 2, 4, 8];
  const speedIdx = speeds.indexOf(speed);
  const nextSpeed = speeds[(speedIdx + 1) % speeds.length];

  // Layer-separation: at L5+, collapse L1-L3 into "Lower Layers" dropdown.
  // BACKGROUND-SIMULATION — at L2+ (Enlightenment unlocked), the base game is
  // abstracted into the Divine Engine; the Header logo + subtitle switch
  // from the current stage's icon/name to the Divine Engine cosmic identity.
  const { activeLayerId, activeLayerRank, isAtLeast } = useActiveLayer();
  const isL2Plus = isAtLeast("enlightenment");
  const isL5Plus = isAtLeast("apotheosis");
  const activeLayerDisplayName = layerName(activeLayerId);

  // Layer button definitions — used to render either standalone buttons or items in the Lower Layers dropdown.
  const layerButtons = [
    { id: "L1", label: "Trials", icon: <Skull className="w-3 h-3 mr-1" />, onClick: () => setShowChallenges(true), unlocked: !!unlockedChallenges, layerId: "evolution", pulse: !!activeChallenge, extra: activeChallenge ? <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> : null, title: "Layer 1 — Trials" },
    { id: "L2", label: "Foresight", icon: <Eye className="w-3 h-3 mr-1" />, onClick: () => setShowEnlightenment(true), unlocked: !!unlockedLayers?.enlightenment, layerId: "enlightenment", title: "Layer 2 — Foresight" },
    { id: "L3", label: "Sacrifice", icon: <Triangle className="w-3 h-3 mr-1" />, onClick: () => setShowTranscendence(true), unlocked: !!unlockedLayers?.transcendence, layerId: "transcendence", title: "Layer 3 — Sacrifice" },
    { id: "L4", label: "Genesis", icon: <Egg className="w-3 h-3 mr-1" />, onClick: () => setShowGenesis(true), unlocked: !!unlockedLayers?.genesis, layerId: "genesis", title: "Layer 4 — Genesis" },
    { id: "L5", label: "Divine", icon: <Sparkles className="w-3 h-3 mr-1" />, onClick: () => setShowApotheosis(true), unlocked: !!unlockedLayers?.apotheosis, layerId: "apotheosis", pulse: heresy >= 75, extra: heresy >= 75 ? <span className="ml-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> : null, title: "Layer 5 — Divine" },
    { id: "L6", label: "System", icon: <Circle className="w-3 h-3 mr-1" />, onClick: () => setShowSingularity(true), unlocked: !!unlockedLayers?.singularity, layerId: "singularity", title: "Layer 6 — System" },
    { id: "L7", label: "Hybrid", icon: <Atom className="w-3 h-3 mr-1" />, onClick: () => setShowOmnipotence(true), unlocked: !!unlockedLayers?.omnipotence, layerId: "omnipotence", pulse: instability >= 75, extra: instability >= 75 ? <span className="ml-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> : null, title: "Layer 7 — Hybrid" },
    { id: "L8", label: "Masks", icon: <Church className="w-3 h-3 mr-1" />, onClick: () => setShowDivinityLayer(true), unlocked: !!unlockedLayers?.divinity, layerId: "divinity", title: "Layer 8 — Masks" },
    { id: "L9", label: "Echoes", icon: <InfinityIcon className="w-3 h-3 mr-1" />, onClick: () => setShowInfinity(true), unlocked: !!unlockedLayers?.infinity, layerId: "infinity", title: "Layer 9 — Echoes" },
    { id: "L10", label: "Eternity", icon: <Star className="w-3 h-3 mr-1" />, onClick: () => setShowEternity(true), unlocked: !!unlockedLayers?.eternity, layerId: "eternity", title: "Layer 10 — Eternity" },
  ];
  // At L5+, L1-L3 collapse into "Lower Layers" dropdown. L4+ remain standalone (if unlocked).
  const collapseLowerLayers = isL5Plus;
  const lowerLayerButtons = collapseLowerLayers
    ? layerButtons.filter((b) => ["L1", "L2", "L3"].includes(b.id) && b.unlocked)
    : [];
  const standaloneLayerButtons = collapseLowerLayers
    ? layerButtons.filter((b) => !["L1", "L2", "L3"].includes(b.id))
    : layerButtons;

  // Effective speed = base speed × temporal_acceleration multiplier
  const temporalLvl = upgrades["temporal_acceleration"] || 0;
  const temporalMult = 1 + temporalLvl * 0.5;
  const effectiveSpeed = speed * temporalMult;
  const showEffectiveSpeed = temporalLvl > 0;

  // Save flash indicator
  const [saveFlash, setSaveFlash] = useState(false);
  const prevLastSaved = useRef(lastSaved);
  useEffect(() => {
    if (lastSaved !== prevLastSaved.current) {
      prevLastSaved.current = lastSaved;
      const timer1 = setTimeout(() => setSaveFlash(true), 0);
      const timer2 = setTimeout(() => setSaveFlash(false), 600);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [lastSaved]);

  return (
    <header
      className="sticky top-0 z-30 glass-strong border-b border-border"
      style={{ boxShadow: `inset 0 -1px 0 ${stage.accent}40` }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-3">
        {/* Logo + title */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
            style={
              isL2Plus
                ? { background: `rgba(139,92,246,0.20)`, border: `1px solid rgba(167,139,250,0.40)` }
                : { background: `${stage.accent}20`, border: `1px solid ${stage.accent}40` }
            }
          >
            {isL2Plus ? "🌌" : stage.icon}
          </div>
          <div className="min-w-0 hidden sm:block">
            <h1 className="text-base font-bold leading-tight truncate">
              Evolution Idle
            </h1>
            {/* Stage label — at L2+ (Divine Engine mode), show "Divine Engine"
                with active layer name. At L5+ also include the layer rank. */}
            {isL2Plus ? (
              <p className="text-xs leading-tight truncate">
                <span className="font-bold bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                  Divine Engine
                </span>
                <span className="text-muted-foreground/70"> · {activeLayerDisplayName}{isL5Plus ? ` (L${activeLayerRank})` : ""}</span>
              </p>
            ) : isL5Plus ? (
              <p className="text-xs leading-tight truncate">
                <span className="font-bold text-amber-300">
                  {activeLayerDisplayName} (L{activeLayerRank})
                </span>
                <span className="text-muted-foreground/70"> · {stage.name}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground leading-tight truncate">
                {stage.name} · {stage.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
          <HeaderStat
            icon={<Clock className="w-3 h-3" />}
            label="Time"
            value={formatTime(time)}
            color="text-cyan-300"
          />
          <HeaderStat
            label="Pop"
            value={formatNumber(population, 0)}
            color="text-emerald-300"
          />
          {/* EP chip — hidden once the EP Auto-Converter upgrade is owned
              (PP-SHOP-TABS — EP becomes internal-only at that point). */}
          {evolutionPoints > 0 && (upgrades["ep_auto_converter"] || 0) === 0 && (
            <HeaderStat
              label="EP"
              value={formatCompact(evolutionPoints)}
              color="text-amber-300"
            />
          )}
          {prestigePoints > 0 && (
            <HeaderStat
              label="PP"
              value={formatNumber(prestigePoints, 0)}
              color="text-fuchsia-300"
            />
          )}
          {galacticWins > 0 && (
            <HeaderStat
              label="Wins"
              value={formatNumber(galacticWins, 0)}
              color="text-violet-300"
            />
          )}
        </div>

        {/* Speed controls */}
        <div className="hidden md:flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={togglePause}
            title={paused ? "Resume" : "Pause"}
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setSpeed(nextSpeed)}
            title={showEffectiveSpeed ? `Base ${speed}× × Temporal Accel ${temporalMult.toFixed(1)}× = effective ${effectiveSpeed.toFixed(1)}×` : "Cycle speed"}
          >
            <FastForward className="w-3 h-3 mr-1" />
            {effectiveSpeed.toFixed(1)}×
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Lower Layers dropdown (L5+ only — replaces L1-L3 standalone buttons) */}
          {collapseLowerLayers && lowerLayerButtons.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 hidden sm:flex"
                  title="Lower prestige layers (L1-L3)"
                >
                  <Layers className="w-3 h-3 mr-1" />
                  Lower Layers
                  <span className="ml-1 text-[0.6rem] text-muted-foreground">({lowerLayerButtons.length})</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {lowerLayerButtons.map((b) => (
                  <DropdownMenuItem key={b.id} onClick={b.onClick} className="cursor-pointer">
                    {b.icon}
                    <span className="flex-1">{b.label}</span>
                    {b.extra}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* Standalone layer buttons — either all layers (below L5) or L4+ (at L5+) */}
          {standaloneLayerButtons.filter((b) => b.unlocked).map((b) => (
            <Button
              key={b.id}
              variant="outline"
              size="sm"
              className="h-8 hidden sm:flex"
              onClick={b.onClick}
              title={b.title}
            >
              {b.icon}
              {b.label}
              {b.extra}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-8 hidden sm:flex"
            onClick={() => setTab("prestige")}
            title="Prestige layer roadmap"
          >
            <Crown className="w-3 h-3 mr-1" />
            Prestige
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 hidden sm:flex"
            onClick={() => setShowShop(true)}
          >
            <Store className="w-3 h-3 mr-1" />
            Shop
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 relative"
            onClick={() => saveGame()}
            title="Save game"
          >
            {saveFlash ? (
              <Check className="w-4 h-4 text-emerald-400 save-indicator" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSettings(true)}
            title="Settings, save export/import, reset"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile speed bar */}
      <div className="md:hidden flex items-center justify-center gap-1 pb-2 px-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={togglePause}
        >
          {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          <span className="ml-1">{paused ? "Paused" : "Playing"}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setSpeed(nextSpeed)}
        >
          <FastForward className="w-3 h-3 mr-1" />
          {effectiveSpeed.toFixed(1)}×
        </Button>
        {/* L1-L3 standalone buttons — shown only when NOT collapsed (below L5+) */}
        {!collapseLowerLayers && unlockedChallenges && (
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowChallenges(true)}>
            <Skull className="w-3 h-3 mr-1" />Trials
          </Button>
        )}
        {!collapseLowerLayers && unlockedLayers?.enlightenment && (
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowEnlightenment(true)}>
            <Eye className="w-3 h-3 mr-1" />Foresight
          </Button>
        )}
        {!collapseLowerLayers && unlockedLayers?.transcendence && (
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowTranscendence(true)}>
            <Triangle className="w-3 h-3 mr-1" />Sacrifice
          </Button>
        )}
        {/* At L5+, hide L1-L3 standalone on mobile too — collapse into a single dropdown button */}
        {collapseLowerLayers && lowerLayerButtons.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs" title="Lower prestige layers (L1-L3)">
                <Layers className="w-3 h-3 mr-1" />
                Lower ({lowerLayerButtons.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-44">
              {lowerLayerButtons.map((b) => (
                <DropdownMenuItem key={b.id} onClick={b.onClick} className="cursor-pointer">
                  {b.icon}
                  <span className="flex-1">{b.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {unlockedLayers?.genesis && (
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowGenesis(true)}>
            <Egg className="w-3 h-3 mr-1" />Genesis
          </Button>
        )}
        {unlockedLayers?.apotheosis && (
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowApotheosis(true)}>
            <Sparkles className="w-3 h-3 mr-1" />Divine
          </Button>
        )}
        {unlockedLayers?.singularity && (
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowSingularity(true)}>
            <Circle className="w-3 h-3 mr-1" />System
          </Button>
        )}
        {unlockedLayers?.omnipotence && (
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowOmnipotence(true)}>
            <Atom className="w-3 h-3 mr-1" />Hybrid
          </Button>
        )}
        {unlockedLayers?.divinity && (
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowDivinityLayer(true)}>
            <Church className="w-3 h-3 mr-1" />Masks
          </Button>
        )}
        {unlockedLayers?.infinity && (
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowInfinity(true)}>
            <InfinityIcon className="w-3 h-3 mr-1" />Echoes
          </Button>
        )}
        {unlockedLayers?.eternity && (
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowEternity(true)}>
            <Star className="w-3 h-3 mr-1" />Eternity
          </Button>
        )}
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowShop(true)}>
          <Store className="w-3 h-3 mr-1" />Shop
        </Button>
      </div>

      {/* QUICK WIN 6 — Active effects feedback row (ritual, combo, ability effects, cooldowns) */}
      <ActiveEffectsRow
        activeTemporaryRituals={activeTemporaryRituals}
        ritualComboTimer={ritualComboTimer}
        activeAbilityEffects={activeAbilityEffects}
        activeAbilityCooldowns={activeAbilityCooldowns}
      />
    </header>
  );
}

// QUICK WIN 6 — Active effects feedback row.
// Shows: ritual active (glowing badge with name), Divine Combo (amber),
// Surge/Overclock effect timers, and active-ability cooldown progress bars.
function ActiveEffectsRow({
  activeTemporaryRituals,
  ritualComboTimer,
  activeAbilityEffects,
  activeAbilityCooldowns,
}: {
  activeTemporaryRituals: Record<string, number>;
  ritualComboTimer: number;
  activeAbilityEffects: Record<string, number>;
  activeAbilityCooldowns: Record<string, number>;
}) {
  // Active rituals (temporary only) — show name + remaining seconds
  const activeRitualEntries = Object.entries(activeTemporaryRituals).filter(([, t]) => t > 0);
  const surgeActive = (activeAbilityEffects.surge || 0) > 0;
  const overclockActive = (activeAbilityEffects.overclock || 0) > 0;
  const comboActive = ritualComboTimer > 0;
  // Active cooldowns — show progress bars
  const cooldownEntries = ACTIVE_ABILITIES
    .map((ab) => ({ ab, cd: activeAbilityCooldowns[ab.id] || 0 }))
    .filter((x) => x.cd > 0);

  const hasAny = activeRitualEntries.length > 0 || surgeActive || overclockActive || comboActive || cooldownEntries.length > 0;
  if (!hasAny) return null;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-1.5 flex flex-wrap items-center gap-1.5 no-scrollbar overflow-x-auto">
      {activeRitualEntries.map(([rid, t]) => {
        const r = RITUAL_MAP[rid];
        return (
          <span
            key={rid}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-medium border border-violet-400/50 bg-violet-500/20 text-violet-200 ritual-glow"
            title={`Ritual active: ${r?.name || rid}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-300 animate-pulse" />
            Ritual: {r?.name || rid} ({Math.ceil(t)}s)
          </span>
        );
      })}
      {comboActive && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-medium border border-amber-400/60 bg-amber-500/20 text-amber-200 ritual-glow"
          title="Divine Combo: +50% all production"
        >
          <Sparkles className="w-2.5 h-2.5" />
          Combo! ×1.5 Production ({Math.ceil(ritualComboTimer)}s)
        </span>
      )}
      {surgeActive && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-medium border border-rose-400/60 bg-rose-500/20 text-rose-200 ritual-glow"
          title="Surge active: ×3 production"
        >
          <Zap className="w-2.5 h-2.5" />
          Surge ×3 ({Math.ceil(activeAbilityEffects.surge)}s)
        </span>
      )}
      {overclockActive && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-medium border border-emerald-400/60 bg-emerald-500/20 text-emerald-200 ritual-glow"
          title="Overclock active: ×2 all prestige bonuses"
        >
          <Circle className="w-2.5 h-2.5" />
          Overclock ×2 ({Math.ceil(activeAbilityEffects.overclock)}s)
        </span>
      )}
      {cooldownEntries.map(({ ab, cd }) => {
        const pct = ((ab.cooldownSec - cd) / ab.cooldownSec) * 100;
        return (
          <span
            key={ab.id}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.6rem] font-medium border border-border/60 bg-muted/40 text-muted-foreground"
            title={`${ab.name} cooldown`}
          >
            <span className="text-[0.6rem]">{ab.icon}</span>
            <span className="relative inline-block w-12 h-1 rounded-full bg-muted/60 overflow-hidden">
              <span className="absolute inset-y-0 left-0 bg-amber-400/70 transition-all" style={{ width: `${pct}%` }} />
            </span>
            <span className="tabular-nums">{Math.ceil(cd)}s</span>
          </span>
        );
      })}
    </div>
  );
}

function HeaderStat({
  icon,
  label,
  value,
  color,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/30 border border-border/40 whitespace-nowrap">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={cn("text-xs font-bold tabular-nums", color)}>{value}</span>
    </div>
  );
}
