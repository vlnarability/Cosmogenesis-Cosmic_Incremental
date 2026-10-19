"use client";

import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { useActiveLayer, layerName } from "@/game/state/layerHelpers";
import { useActiveDimension } from "@/game/state/useDimension";
import { formatNumber, formatCompact, formatTime } from "../shared/format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Pause,
  Play,
  FastForward,
  Save,
  Settings,
  Store,
  Check,
  Skull,
  Crown,
  Eye,
  Triangle,
  Egg,
  Sparkles,
  Circle,
  Atom,
  Church,
  Infinity as InfinityIcon,
  Star,
  Layers as LayersIcon,
  Globe,
  TrendingUp,
  Leaf,
  Clock,
  ListTree,
  Archive as ArchiveIcon,
  ScrollText,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, type ReactNode } from "react";

// ============================================================
// Header — "Command Bar" redesign (P2)
// 3 zones: Navigation (left) · Status (center) · Actions (right)
//
// Layer buttons collapse into a single "Layers" dropdown.
// At L1–L3 the next 1–2 layers also show as standalone buttons
// (the player's immediate focus); at L4+ everything collapses into
// the dropdown. On mobile the Layers dropdown moves into the gear
// menu.
// ============================================================

interface LayerButtonDef {
  id: string;
  layerId: string;
  rank: number;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  unlocked: boolean;
  heresy?: number; // 0–100, used for the border-left accent (L5 galaxy tabs)
  activeChallenge?: boolean;
}

export function Header() {
  const stageIndex = useGameStore((s) => s.stageIndex);
  const dim = useActiveDimension();
  const population = useGameStore((s) => s.population);
  const time = useGameStore((s) => s.time);
  const speed = useGameStore((s) => s.speed);
  const paused = useGameStore((s) => s.paused);
  const upgrades = useGameStore((s) => s.upgrades);
  const unlockedChallenges = useGameStore((s) => s.unlockedChallenges);
  const activeChallenge = useGameStore((s) => s.activeChallenge);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const heresy = useGameStore((s) => s.heresy);
  const instability = useGameStore((s) => s.instability);
  const lastSaved = useGameStore((s) => s.lastSaved);
  // Background-sim stats (L2+ — shown in center zone)
  const peakProductionRate = useGameStore((s) => s.peakProductionRate || 0);
  const backgroundSimulations = useGameStore((s) => s.backgroundSimulations || 0);

  const setSpeed = useGameStore((s) => s.setSpeed);
  const togglePause = useGameStore((s) => s.togglePause);
  const saveGame = useGameStore((s) => s.saveGame);
  const setShowShop = useGameStore((s) => s.setShowShop);
  const setShowSettings = useGameStore((s) => s.setShowSettings);
  // P6 — Modal Consolidation: layer buttons now call `openLayerModal(layerId)`
  // instead of the per-layer `setShow*` setters. The store action mirrors
  // the open state into the corresponding legacy `show*` flag for any code
  // that still reads `show*` directly.
  const openLayerModal = useGameStore((s) => s.openLayerModal);
  const setTab = useGameStore((s) => s.setTab);
  // FIX-UI-TABS — Log/Archive/Codex/Awards moved into the gear dropdown
  // and open as modals (see GameShell's InfoModal). The setter is a
  // single action that takes a target id.
  const openInfoModal = useGameStore((s) => s.openInfoModal);
  // ACHIEVEMENT-HOOKS-CONDITIONAL-EVENTS — "Title Clicker" achievement
  // checks `titleClicks >= 10`. The "Evolution Idle" title in the header
  // is the canonical click target; each click bumps the counter via the
  // generic `bumpAchievementMeta` store action.
  const bumpAchievementMeta = useGameStore((s) => s.bumpAchievementMeta);

  const stage = STAGES[stageIndex];
  const speeds = [1, 2, 4, 8];
  const speedIdx = speeds.indexOf(speed);
  const nextSpeed = speeds[(speedIdx + 1) % speeds.length];

  const { activeLayerId, activeLayerRank, isAtLeast } = useActiveLayer();
  const isL2Plus = isAtLeast("enlightenment");
  const isL4Plus = isAtLeast("genesis");

  // Layer definitions — these are the items shown in the Layers dropdown.
  // At L1–L3 the next 1–2 unlocked layers also appear as standalone buttons
  // (the player's immediate focus). At L4+ everything collapses into dropdown.
  const layerButtons: LayerButtonDef[] = [
    { id: "L1", layerId: "evolution", rank: 1, label: dim.layerName("evolution", "Evolution"), icon: <Skull className="w-3.5 h-3.5" />, onClick: () => openLayerModal("challenges"), unlocked: !!unlockedChallenges, activeChallenge: !!activeChallenge },
    { id: "L2", layerId: "enlightenment", rank: 2, label: dim.layerName("enlightenment", "Enlightenment"), icon: <Eye className="w-3.5 h-3.5" />, onClick: () => openLayerModal("enlightenment"), unlocked: !!unlockedLayers?.enlightenment },
    { id: "L3", layerId: "transcendence", rank: 3, label: dim.layerName("transcendence", "Transcendence"), icon: <Triangle className="w-3.5 h-3.5" />, onClick: () => openLayerModal("transcendence"), unlocked: !!unlockedLayers?.transcendence },
    { id: "L4", layerId: "genesis", rank: 4, label: dim.layerName("genesis", "Genesis"), icon: <Egg className="w-3.5 h-3.5" />, onClick: () => openLayerModal("genesis"), unlocked: !!unlockedLayers?.genesis },
    { id: "L5", layerId: "apotheosis", rank: 5, label: dim.layerName("apotheosis", "Apotheosis"), icon: <Sparkles className="w-3.5 h-3.5" />, onClick: () => openLayerModal("apotheosis"), unlocked: !!unlockedLayers?.apotheosis, heresy: heresy },
    { id: "L6", layerId: "singularity", rank: 6, label: dim.layerName("singularity", "Singularity"), icon: <Circle className="w-3.5 h-3.5" />, onClick: () => openLayerModal("singularity"), unlocked: !!unlockedLayers?.singularity },
    { id: "L7", layerId: "omnipotence", rank: 7, label: dim.layerName("omnipotence", "Omnipotence"), icon: <Atom className="w-3.5 h-3.5" />, onClick: () => openLayerModal("omnipotence"), unlocked: !!unlockedLayers?.omnipotence },
    { id: "L8", layerId: "divinity", rank: 8, label: dim.layerName("divinity", "Divinity"), icon: <Church className="w-3.5 h-3.5" />, onClick: () => openLayerModal("divinity"), unlocked: !!unlockedLayers?.divinity },
    { id: "L9", layerId: "infinity", rank: 9, label: dim.layerName("infinity", "Infinity"), icon: <InfinityIcon className="w-3.5 h-3.5" />, onClick: () => openLayerModal("infinity"), unlocked: !!unlockedLayers?.infinity },
    { id: "L10", layerId: "eternity", rank: 10, label: dim.layerName("eternity", "Eternity"), icon: <Star className="w-3.5 h-3.5" />, onClick: () => openLayerModal("eternity"), unlocked: !!unlockedLayers?.eternity },
  ];

  const unlockedLayerButtons = layerButtons.filter((b) => b.unlocked);

  // At L1–L3, show the most-recently-unlocked 2 layers as standalone buttons
  // (the player's immediate focus). At L4+ everything collapses into the dropdown.
  const collapseAllIntoDropdown = isL4Plus;
  const standaloneLayerButtons = collapseAllIntoDropdown
    ? []
    : unlockedLayerButtons.slice(-2);

  // Effective speed = base speed × temporal_acceleration multiplier
  const temporalLvl = upgrades["temporal_acceleration"] || 0;
  const temporalMult = 1 + temporalLvl * 0.5;
  const effectiveSpeed = speed * temporalMult;
  const speedLabel = temporalLvl > 0
    ? `${effectiveSpeed.toFixed(1)}×`
    : `${speed}×`;

  // Save flash indicator
  const [saveFlash, setSaveFlash] = useState(false);
  const prevLastSaved = useRef(lastSaved);
  useEffect(() => {
    if (lastSaved !== prevLastSaved.current) {
      prevLastSaved.current = lastSaved;
      const t1 = setTimeout(() => setSaveFlash(true), 0);
      const t2 = setTimeout(() => setSaveFlash(false), 600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [lastSaved]);

  // === Center-zone stats ===
  // L1 (first playthrough): Population + Time
  // L2+: Worlds count + Divinity/sec (max 2 stats)
  // CURRENCY-UNIFICATION — the L4+ "EP/s" stat has been removed. EP is
  // no longer a spendable currency (folded into Divinity at prestige),
  // so the per-second generation number is meaningless to surface. The
  // L2+ "Div/s" stat already covers divinity generation.
  const divPerSec = peakProductionRate * 0.01 * backgroundSimulations;

  // === Layer label (left zone) ===
  const layerLabelText = isL2Plus
    ? `Layer ${activeLayerRank} — ${dim.layerName(activeLayerId, layerName(activeLayerId))}`
    : `${stage.name} Stage`;

  return (
    <header
      className="sticky top-0 z-30 glass-strong border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-3">
        {/* ===== LEFT ZONE — Logo + layer/stage name (single text label, NOT a button) ===== */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <span className="text-lg leading-none select-none" aria-hidden>
            {isL2Plus ? "🌌" : stage.icon}
          </span>
          <div className="min-w-0 hidden sm:block">
            <h1
              // ACHIEVEMENT-HOOKS-CONDITIONAL-EVENTS — clicking the title
              // 10× unlocks "Title Clicker". The h1 is wrapped in a
              // button-equivalent (role + tabIndex + key handler) so the
              // click is keyboard-accessible while still looking like
              // static text — `cursor-pointer` is the only visual cue.
              className="text-sm font-semibold leading-tight truncate cursor-pointer select-none hover:text-primary transition-colors"
              role="button"
              tabIndex={0}
              title="Evolution Idle — click 10× to unlock a secret achievement"
              onClick={() => bumpAchievementMeta("titleClicks")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  bumpAchievementMeta("titleClicks");
                }
              }}
            >
              Evolution Idle
            </h1>
            <p className="text-[0.7rem] leading-tight truncate text-muted-foreground">
              {layerLabelText}
            </p>
          </div>
          {/* Mobile: just the layer rank chip — name hidden to save space */}
          <span className="sm:hidden text-[0.65rem] text-muted-foreground whitespace-nowrap">
            L{activeLayerRank}
          </span>
        </div>

        {/* ===== CENTER ZONE — 1–3 key stats (1 on mobile) ===== */}
        <div className="flex-1 min-w-0 flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
          {!isL2Plus ? (
            // L1 (first playthrough): Population + Time
            <>
              <Stat
                icon={<Leaf className="w-3 h-3" />}
                label="Pop"
                value={formatNumber(population, 0)}
                color="text-emerald-300"
              />
              <Stat
                icon={<Clock className="w-3 h-3" />}
                label="Time"
                value={formatTime(time)}
                color="text-cyan-300"
                className="hidden sm:flex"
              />
            </>
          ) : (
            // L2+: Worlds + Divinity/sec (max 2 stats)
            <>
              <Stat
                icon={<Globe className="w-3 h-3" />}
                label="Worlds"
                value={formatNumber(backgroundSimulations, 0)}
                color="text-violet-300"
              />
              <Stat
                icon={<TrendingUp className="w-3 h-3" />}
                label="Div/s"
                value={divPerSec > 0 ? formatCompact(divPerSec) : "0"}
                color="text-amber-300"
                className="hidden sm:flex"
              />
            </>
          )}
        </div>

        {/* ===== RIGHT ZONE — Pause + Speed + Layers dropdown (desktop) + Gear menu ===== */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Pause toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={togglePause}
            title={paused ? "Resume" : "Pause"}
            aria-label={paused ? "Resume" : "Pause"}
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
          {/* Speed cycle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs tabular-nums"
            onClick={() => setSpeed(nextSpeed)}
            title={
              temporalLvl > 0
                ? `Base ${speed}× × Temporal Accel ${temporalMult.toFixed(1)}× = effective ${effectiveSpeed.toFixed(1)}×`
                : "Cycle speed"
            }
          >
            <FastForward className="w-3 h-3" />
            <span className="ml-1">{speedLabel}</span>
          </Button>

          {/* Layers dropdown — desktop only. On mobile it moves into the gear menu. */}
          {!collapseAllIntoDropdown && standaloneLayerButtons.length > 0 ? (
            // L1–L3: show standalone next-layer buttons + the dropdown for the rest
            <>
              {standaloneLayerButtons.map((b) => (
                <Button
                  key={b.id}
                  variant="outline"
                  size="sm"
                  className="h-8 hidden sm:flex"
                  onClick={b.onClick}
                  title={`Layer ${b.rank} — ${b.label}`}
                >
                  {b.icon}
                  <span className="ml-1 text-xs">{b.label}</span>
                </Button>
              ))}
              {unlockedLayerButtons.length > standaloneLayerButtons.length && (
                <LayersDropdown
                  items={unlockedLayerButtons.filter(
                    (b) => !standaloneLayerButtons.find((s) => s.id === b.id)
                  )}
                />
              )}
            </>
          ) : (
            // L4+: everything in the dropdown
            unlockedLayerButtons.length > 0 && (
              <LayersDropdown items={unlockedLayerButtons} className="hidden sm:flex" />
            )
          )}

          {/* Gear menu — Shop, Save, Settings, Trials(L1), Layers(mobile) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Menu"
                aria-label="Open menu"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {/* Layers — mobile only (desktop has its own dropdown) */}
              <span className="sm:hidden">
                <DropdownMenuLabel className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                  Layers
                </DropdownMenuLabel>
                {unlockedLayerButtons.length === 0 && (
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    No layers unlocked yet
                  </DropdownMenuItem>
                )}
                {unlockedLayerButtons.map((b) => (
                  <DropdownMenuItem
                    key={b.id}
                    onClick={b.onClick}
                    className="cursor-pointer text-xs"
                  >
                    {b.icon}
                    <span className="flex-1">{b.label}</span>
                    {b.activeChallenge && (
                      <span className="text-[0.6rem] text-amber-400">active</span>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </span>

              {/* REMOVE-PRESTIGE-TAB — Prestige Roadmap menu item removed
                  (user asked multiple times). The prestige flow is now
                  driven by the Auto-Ascend autobuyer + the Big Bang
                  button at L10. */}
              {/* Shop */}
              <DropdownMenuItem
                onClick={() => setShowShop(true)}
                className="cursor-pointer text-xs"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Shop</span>
              </DropdownMenuItem>
              {/* Save */}
              <DropdownMenuItem
                onClick={() => saveGame()}
                className="cursor-pointer text-xs"
              >
                {saveFlash ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 save-indicator" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save</span>
              </DropdownMenuItem>
              {/* FIX-UI-TABS — Log/Archive/Codex/Awards moved off the
                  main tab bar into the gear dropdown. They open as a
                  shared InfoModal (see GameShell) instead of switching
                  tabs. Settings stays at the bottom as the "real"
                  settings modal. */}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                Reference
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => openInfoModal("log")}
                className="cursor-pointer text-xs"
              >
                <ListTree className="w-3.5 h-3.5" />
                <span>Log</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openInfoModal("archive")}
                className="cursor-pointer text-xs"
              >
                <ArchiveIcon className="w-3.5 h-3.5" />
                <span>Archive</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openInfoModal("codex")}
                className="cursor-pointer text-xs"
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span>Codex</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openInfoModal("achievements")}
                className="cursor-pointer text-xs"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Awards</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Settings */}
              <DropdownMenuItem
                onClick={() => setShowSettings(true)}
                className="cursor-pointer text-xs"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile speed bar (compact) — pause + speed only; everything else is in the gear menu */}
      <div className="sm:hidden flex items-center justify-center gap-1 pb-1.5 px-3">
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
          className="h-7 px-2 text-xs tabular-nums"
          onClick={() => setSpeed(nextSpeed)}
        >
          <FastForward className="w-3 h-3" />
          <span className="ml-1">{speedLabel}</span>
        </Button>
      </div>
    </header>
  );
}

// ============================================================
// LayersDropdown — single button that opens a menu of all
// unlocked layers. Heresy severity (L5 galaxies) is shown as
// a border-left accent on the row, not a rainbow dot.
// ============================================================
function LayersDropdown({
  items,
  className,
}: {
  items: LayerButtonDef[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8", className)}
          title="Prestige layers"
        >
          <LayersIcon className="w-3.5 h-3.5" />
          <span className="ml-1 text-xs">Layers</span>
          <span className="ml-1 text-[0.6rem] text-muted-foreground">
            ({items.length})
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
          Prestige Layers
        </DropdownMenuLabel>
        {items.map((b) => (
          <DropdownMenuItem
            key={b.id}
            onClick={b.onClick}
            className="cursor-pointer text-xs"
          >
            {b.icon}
            <span className="flex-1">{b.label}</span>
            {b.activeChallenge && (
              <span className="text-[0.6rem] text-amber-400">active</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// Stat — compact inline stat (no tinted box wrapper).
// Icon sits inline with the value; no background box.
// ============================================================
function Stat({
  icon,
  label,
  value,
  color,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap",
        className
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex flex-col leading-none">
        <span className="text-[0.55rem] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className={cn("text-xs font-bold tabular-nums", color)}>
          {value}
        </span>
      </div>
    </div>
  );
}
