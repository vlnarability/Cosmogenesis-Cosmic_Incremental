"use client";

import { useGameStore, DEFAULT_KEYBOARD_SHORTCUTS, SHORTCUT_LAYER_GATE } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { ACHIEVEMENTS } from "@/game/data/achievements";
import { STAGE_THEMES, LAYER_THEMES, SPECIAL_THEMES, MINI_THEMES } from "@/game/data/themes";
import { EVENTS } from "@/game/data/events";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Settings, Download, Upload, Save, AlertTriangle, Copy, Check,
  Clock, Users, Star, Award, Database, Keyboard, Bug, Palette, Lock,
  RotateCcw,
} from "lucide-react";
import { formatNumber, formatTime } from "../shared/format";
import { cn } from "@/lib/utils";

// ============================================================
// Action-id → human label (for the Shortcuts tab + Settings hints).
// Layer actions are gated by SHORTCUT_LAYER_GATE; universal actions
// (pause, speed1-8, save, shop, prestige, close) are always active.
// ============================================================
const SHORTCUT_LABELS: Record<string, string> = {
  pause: "Pause / Resume",
  speed1: "Speed 1×",
  speed2: "Speed 2×",
  speed4: "Speed 4×",
  speed8: "Speed 8×",
  save: "Save Game",
  shop: "Open Shop",
  prestige: "Prestige Roadmap",
  trials: "Trials Layer (L1)",
  constellations: "Constellations Layer (L2)",
  market: "Divine Market Layer (L3)",
  galaxy: "Galaxy Layer (L4)",
  heresy: "Heresy Layer (L5)",
  universal: "Universal Map Layer (L6)",
  creatures: "Creatures Layer (L7)",
  diplomacy: "Diplomacy Layer (L8)",
  war: "War Layer (L9)",
  genesis: "Genesis Engine Layer (L10)",
  close: "Close Modal / Dismiss Popup",
};

// Display-friendly key label. Space → "Space", Escape → "Esc", letters
// uppercased for readability.
function keyLabel(key: string): string {
  if (key === " ") return "Space";
  if (key === "Escape") return "Esc";
  if (key.length === 1) return key.toUpperCase();
  return key;
}

export function SettingsModal() {
  const showSettings = useGameStore((s) => s.showSettings);
  const setShowSettings = useGameStore((s) => s.setShowSettings);
  const exportSave = useGameStore((s) => s.exportSave);
  const importSave = useGameStore((s) => s.importSave);
  const hardReset = useGameStore((s) => s.hardReset);
  const saveGame = useGameStore((s) => s.saveGame);
  const debugUnlockAll = useGameStore((s) => s.debugUnlockAll);
  const debugFreeBuy = useGameStore((s) => s.debugFreeBuy);
  const toggleDebugFreeBuy = useGameStore((s) => s.toggleDebugFreeBuy);
  const triggerDebugEvent = useGameStore((s) => s.triggerDebugEvent);
  const eventFrequency = useGameStore((s) => s.eventFrequency || "normal");
  const setEventFrequency = useGameStore((s) => s.setEventFrequency);

  // Debug actions (DEBUG-SHORTCUTS)
  const debugGrantResources = useGameStore((s) => s.debugGrantResources);
  const debugGrantCurrency = useGameStore((s) => s.debugGrantCurrency);
  const debugCompleteLayer = useGameStore((s) => s.debugCompleteLayer);
  const debugGenerateBoon = useGameStore((s) => s.debugGenerateBoon);
  const debugSpawnRelic = useGameStore((s) => s.debugSpawnRelic);
  const debugForcePrestige = useGameStore((s) => s.debugForcePrestige);
  const debugToggle100x = useGameStore((s) => s.debugToggle100x);

  // Theme state
  const activeStageTheme = useGameStore((s) => s.activeStageTheme || "stage-cell");
  const activeLayerTheme = useGameStore((s) => s.activeLayerTheme);
  const activeSpecialTheme = useGameStore((s) => s.activeSpecialTheme);
  const unlockedThemes = useGameStore((s) => s.unlockedThemes || { "stage-cell": true });
  const themeMode = useGameStore((s) => s.themeMode || "auto");
  const setStageTheme = useGameStore((s) => s.setStageTheme);
  const setLayerTheme = useGameStore((s) => s.setLayerTheme);
  const setSpecialTheme = useGameStore((s) => s.setSpecialTheme);
  const setThemeMode = useGameStore((s) => s.setThemeMode);
  // ACHIEVEMENT-HOOKS-CONDITIONAL-EVENTS — generic UI hook for the
  // counter/flag achievements. The version-text click below uses it to
  // bump `versionClicks` ("Easter Egg: Hidden Message"). The "AI
  // Detected" flag is set inside `setSpecialTheme` (store-side) when the
  // player picks `mini-ai`, so we don't need to call it from here.
  const bumpAchievementMeta = useGameStore((s) => s.bumpAchievementMeta);

  // Game stats
  const time = useGameStore((s) => s.time);
  const population = useGameStore((s) => s.population);
  const totalRuns = useGameStore((s) => s.totalRuns);
  const galacticWins = useGameStore((s) => s.galacticWins);
  // CURRENCY-UNIFICATION — show Divinity as the unified currency. EP field
  // is kept on GameState for back-compat with old saves but is no longer
  // surfaced to the player.
  const divinity = useGameStore((s) => s.divinity);
  const achievements = useGameStore((s) => s.achievements || {});
  const stageIndex = useGameStore((s) => s.stageIndex);
  const lastSaved = useGameStore((s) => s.lastSaved);
  const speed = useGameStore((s) => s.speed);

  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [importResult, setImportResult] = useState<"idle" | "success" | "error">("idle");
  const [confirmReset, setConfirmReset] = useState(false);
  const [versionClicks, setVersionClicks] = useState(0);
  const [debugUnlocked, setDebugUnlocked] = useState(false);
  const [debugEventChoice, setDebugEventChoice] = useState<string>("random");
  const [activeTab, setActiveTab] = useState<string>("settings");

  const stage = STAGES[stageIndex];
  const earnedAchievements = ACHIEVEMENTS.filter((a) => achievements[a.id]).length;

  const handleExport = () => {
    const data = exportSave();
    setExportText(data);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text field
      setCopied(false);
    }
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setImportResult("error");
      return;
    }
    const ok = importSave(importText.trim());
    setImportResult(ok ? "success" : "error");
    if (ok) {
      setTimeout(() => {
        setShowSettings(false);
        setImportText("");
        setImportResult("idle");
      }, 1000);
    }
  };

  const handleDownload = () => {
    const data = exportSave();
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evolution-idle-save-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || "";
      setImportText(text);
    };
    reader.readAsText(file);
  };

  const handleVersionClick = () => {
    const next = versionClicks + 1;
    setVersionClicks(next);
    // ACHIEVEMENT-HOOKS-CONDITIONAL-EVENTS — sync the cumulative click
    // count to the store so the "Easter Egg: Hidden Message" achievement
    // (checks `versionClicks >= 5`) fires. The local counter is also
    // retained because it drives the debug-panel reveal below.
    bumpAchievementMeta("versionClicks");
    if (next >= 5 && !debugUnlocked) {
      setDebugUnlocked(true);
      setVersionClicks(0);
    }
    // Also call debugUnlockAll directly after 5 clicks as fallback
    if (next >= 4) {
      setDebugUnlocked(true);
      setVersionClicks(0);
    }
  };

  const handleDebugUnlock = () => {
    debugUnlockAll();
  };

  const lastSavedDate = lastSaved ? new Date(lastSaved).toLocaleString() : "never";

  return (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5" />
            Settings & Save Management
          </DialogTitle>
          <DialogDescription>
            Export your progress, import a backup, or reset.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="settings" className="flex-1">
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="flex-1">
              <Keyboard className="w-3.5 h-3.5 mr-1.5" />
              Shortcuts
            </TabsTrigger>
          </TabsList>

          {/* ============================ SETTINGS TAB ============================ */}
          <TabsContent value="settings" className="space-y-1 outline-none">
            {/* Game stats summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <StatCard icon={<Clock className="w-3 h-3" />} label="Run Time" value={formatTime(time)} />
              <StatCard icon={<Users className="w-3 h-3" />} label="Population" value={formatNumber(population, 0)} />
              <StatCard icon={<Star className="w-3 h-3" />} label="Total Runs" value={String(totalRuns)} />
              <StatCard icon={<Award className="w-3 h-3" />} label="Achievements" value={`${earnedAchievements}/${ACHIEVEMENTS.length}`} />
              <StatCard icon={<Database className="w-3 h-3" />} label="Galactic Wins" value={String(galacticWins)} />
              <StatCard icon={<Star className="w-3 h-3" />} label="Divinity" value={formatNumber(divinity, 0)} />
              <StatCard icon={<Star className="w-3 h-3" />} label="Stage" value={`${stageIndex + 1}/7`} />
              <StatCard icon={<Save className="w-3 h-3" />} label="Last Saved" value={lastSavedDate.split(",")[0] || "now"} />
            </div>

            <Separator className="my-3" />

            {/* Export section */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Download className="w-4 h-4 text-primary" />
                Export Save
              </h3>
              <p className="text-xs text-muted-foreground">
                Generate an encoded save string. Copy it or download as a file to back up your progress.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExport} className="h-8">
                  <Download className="w-3 h-3 mr-1" />
                  Generate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  disabled={!exportText}
                  className="h-8"
                >
                  {copied ? <Check className="w-3 h-3 mr-1 text-emerald-400" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  disabled={!exportText}
                  className="h-8"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
              {exportText && (
                <textarea
                  readOnly
                  value={exportText}
                  className="w-full h-20 text-xs font-mono p-2 rounded bg-muted/40 border border-border resize-none"
                  onFocus={(e) => e.target.select()}
                />
              )}
            </div>

            <Separator className="my-3" />

            {/* Import section */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-primary" />
                Import Save
              </h3>
              <p className="text-xs text-muted-foreground">
                Paste a save string or load from a file. This will overwrite your current progress.
              </p>
              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportResult("idle");
                }}
                placeholder="Paste your save string here..."
                className="w-full h-20 text-xs font-mono p-2 rounded bg-muted/40 border border-border resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="h-8"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Import
                </Button>
                <label className="inline-flex items-center gap-1 px-3 h-8 text-xs rounded-md border border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                  <Upload className="w-3 h-3" />
                  Load File
                  <input type="file" accept=".txt,.json" onChange={handleFileImport} className="hidden" />
                </label>
                {importResult === "success" && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 self-center">
                    <Check className="w-3 h-3" /> Imported successfully!
                  </span>
                )}
                {importResult === "error" && (
                  <span className="text-xs text-red-400 flex items-center gap-1 self-center">
                    <AlertTriangle className="w-3 h-3" /> Invalid save data
                  </span>
                )}
              </div>
            </div>

            <Separator className="my-3" />

            {/* Manual save */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Save className="w-4 h-4 text-primary" />
                Manual Save
              </h3>
              <p className="text-xs text-muted-foreground">
                The game auto-saves every 30 seconds. You can also save manually now.
              </p>
              <Button size="sm" variant="outline" onClick={() => saveGame()} className="h-8">
                <Save className="w-3 h-3 mr-1" />
                Save Now
              </Button>
            </div>

            <Separator className="my-3" />

            {/* Gameplay settings */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-primary" />
                Gameplay
              </h3>
              <div className="flex items-center justify-between gap-3 py-1">
                <div>
                  <div className="text-xs font-medium">Event Frequency</div>
                  <div className="text-[0.65rem] text-muted-foreground">How often random events fire.</div>
                </div>
                <div className="flex gap-1">
                  {(["off", "normal", "frequent"] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setEventFrequency(freq)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs border transition-colors capitalize",
                        eventFrequency === freq
                          ? "border-primary bg-primary/15 text-primary font-semibold"
                          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* REDUCE-MOTION — accessibility toggle. Disables decorative
                  animations (number tween, caravan bob, rival pulse, rare
                  shimmer, threat pulse, raid shake/vignette). The OS
                  prefers-reduced-motion is honored via CSS regardless; this
                  is an opt-in override for users who want calm without
                  changing their OS setting. */}
              <div className="flex items-center justify-between gap-3 py-1">
                <div>
                  <div className="text-xs font-medium">Reduce Motion</div>
                  <div className="text-[0.65rem] text-muted-foreground">
                    Calms decorative animations (tween, caravan bob, pulses, shimmer). Honors your OS setting too.
                  </div>
                </div>
                <ReduceMotionToggle />
              </div>
            </div>

            <Separator className="my-3" />

            {/* Customization — Theme picker (Part 1e) */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-primary" />
                Customization
              </h3>
              <p className="text-xs text-muted-foreground">
                Stage themes set the base palette. Divine overlays (Layer 1-10) tint the primary/accent colors.
                Special themes override everything when active. Locked themes show "???". Themes auto-unlock as you progress.
              </p>

              {/* Theme mode toggle: Auto vs Custom */}
              <div className="stat-card !p-2.5 flex items-center gap-3 mt-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span>Theme Mode</span>
                    <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wide">
                      {themeMode === "auto" ? "Auto · follows stage/layer" : "Custom · locked in"}
                    </span>
                  </div>
                  <p className="text-[0.65rem] text-muted-foreground mt-0.5 leading-snug">
                    {themeMode === "auto"
                      ? "Themes will switch automatically as you advance through stages and unlock layers. Switch to Custom to lock in your favorite look."
                      : "Your selected theme stays locked even as you progress. Switch back to Auto to follow the stage/layer."}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setThemeMode("auto")}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      themeMode === "auto"
                        ? "bg-primary/15 border-primary/50 text-primary"
                        : "border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => setThemeMode("custom")}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      themeMode === "custom"
                        ? "bg-primary/15 border-primary/50 text-primary"
                        : "border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {themeMode === "auto" && (
                <div className="text-[0.65rem] text-amber-300/80 italic px-1">
                  ⚙ Auto mode is active — manual theme picks below are overridden until you switch to Custom.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                {/* Stage themes */}
                <ThemeColumn
                  title="Stage Theme"
                  themes={STAGE_THEMES}
                  activeId={activeStageTheme}
                  unlockedThemes={unlockedThemes}
                  onSelect={(id) => { if (id) setStageTheme(id); }}
                />

                {/* Layer overlay themes */}
                <ThemeColumn
                  title="Divine Overlay"
                  themes={LAYER_THEMES}
                  activeId={activeLayerTheme}
                  unlockedThemes={unlockedThemes}
                  allowNone
                  onSelect={(id) => setLayerTheme(id)}
                />

                {/* Special themes */}
                <ThemeColumn
                  title="Special"
                  themes={SPECIAL_THEMES}
                  activeId={activeSpecialTheme}
                  unlockedThemes={unlockedThemes}
                  allowNone
                  onSelect={(id) => setSpecialTheme(id)}
                />

                {/* Mini themes (ORGANELLES-THEMES) */}
                <ThemeColumn
                  title="Mini & Archetype"
                  themes={MINI_THEMES}
                  activeId={activeSpecialTheme}
                  unlockedThemes={unlockedThemes}
                  allowNone
                  onSelect={(id) => setSpecialTheme(id)}
                />
              </div>
            </div>

            <Separator className="my-3" />

            {/* Keyboard shortcuts — hint pointing to the Shortcuts tab */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-primary" />
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-muted-foreground">
                Power-user controls. Active when no input is focused. Rebind any key in the Shortcuts tab.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab("shortcuts")}
                className="h-8"
              >
                <Keyboard className="w-3 h-3 mr-1" />
                Customize Shortcuts
              </Button>
            </div>

            <Separator className="my-3" />

            {/* Danger zone */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </h3>
              {!confirmReset ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmReset(true)}
                  className="h-8 border-red-500/40 text-red-400 hover:bg-red-500/10"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Hard Reset
                </Button>
              ) : (
                <div className="space-y-2 p-3 rounded border border-red-500/40 bg-red-500/5">
                  <p className="text-xs text-red-300">
                    This will erase <span className="font-bold">ALL progress</span> — every run, every upgrade,
                    every achievement, every story beat. This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setConfirmReset(false)} className="h-8">
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        hardReset();
                        setShowSettings(false);
                        setConfirmReset(false);
                      }}
                      className="h-8"
                    >
                      Erase Everything
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center pt-1">
              <button
                onClick={handleVersionClick}
                className="text-[0.6rem] text-muted-foreground/60 hover:text-muted-foreground transition-colors select-none"
                title={debugUnlocked ? "Debug mode enabled" : "Click 5× to enable debug"}
              >
                Cosmogenesis · v1.0
              </button>
            </div>

            {/* ===== DEBUG PANEL (DEBUG-SHORTCUTS) — only shown after 5× version click ===== */}
            {debugUnlocked && (
              <>
                <Separator className="my-3" />
                <div className="space-y-3 p-3 rounded border border-amber-500/30 bg-amber-500/5">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-amber-300">
                    <Bug className="w-4 h-4" />
                    Debug Tools
                  </h3>
                  <p className="text-[0.65rem] text-amber-300/70 -mt-1">
                    For testing only. Use Complete Layer + Speed 100× to fast-forward progression.
                  </p>

                  {/* Row 1 — existing tools + new grants */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDebugUnlock}
                      className="h-8 border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
                      title="Testing only: unlock all prestige layers + grant resources"
                    >
                      <Bug className="w-3 h-3 mr-1" />
                      Unlock All Layers
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleDebugFreeBuy}
                      className={cn(
                        "h-8",
                        debugFreeBuy
                          ? "border-emerald-500/60 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20"
                          : "border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
                      )}
                      title="Testing only: all purchases cost 0 resources"
                    >
                      <Bug className="w-3 h-3 mr-1" />
                      {debugFreeBuy ? "Free Buy: ON" : "Free Buy: OFF"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={debugGrantResources}
                      className="h-8 border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
                      title="+1000 of every primary resource"
                    >
                      <Bug className="w-3 h-3 mr-1" />
                      Grant Resources
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={debugGrantCurrency}
                      className="h-8 border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
                      title="+1000 Divinity · +100 Faith / Seeds / Cores"
                    >
                      <Bug className="w-3 h-3 mr-1" />
                      Grant Currency
                    </Button>
                  </div>

                  {/* Row 2 — progression + ending tools */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={debugCompleteLayer}
                      className="h-8 border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
                      title="Unlock the next locked layer"
                    >
                      <Bug className="w-3 h-3 mr-1" />
                      Complete Current Layer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={debugGenerateBoon}
                      className="h-8 border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
                      title="+1 cosmicBoonStacks (L10 ending)"
                    >
                      <Bug className="w-3 h-3 mr-1" />
                      Generate Cosmic Boon
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={debugSpawnRelic}
                      className="h-8 border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
                      title="Spawn 1 fresh relic into the inventory (L10 Genesis Engine)"
                    >
                      <Bug className="w-3 h-3 mr-1" />
                      Spawn Relic
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={debugForcePrestige}
                      className="h-8 border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
                      title="Immediately trigger prestige"
                    >
                      <Bug className="w-3 h-3 mr-1" />
                      Force Prestige
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={debugToggle100x}
                      className={cn(
                        "h-8",
                        speed === 100
                          ? "border-emerald-500/60 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20"
                          : "border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
                      )}
                      title="Toggle speed between 100× and 1×"
                    >
                      <Bug className="w-3 h-3 mr-1" />
                      Speed {speed === 100 ? "1×" : "100×"}
                    </Button>
                  </div>

                  {/* Trigger Event — dropdown */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-amber-300">Trigger Event</div>
                    <p className="text-[0.65rem] text-amber-300/70">
                      Fire a random event immediately. "Random" picks any event valid for the current stage; a
                      specific id will fire that one if it&apos;s available for the stage.
                    </p>
                    <div className="flex gap-2">
                      <Select
                        value={debugEventChoice}
                        onValueChange={(v) => setDebugEventChoice(v)}
                      >
                        <SelectTrigger size="sm" className="h-8 flex-1 border-amber-500/40 text-amber-200">
                          <SelectValue placeholder="Pick an event" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">🎲 Random</SelectItem>
                          {EVENTS.map((ev) => (
                            <SelectItem key={ev.id} value={ev.id}>
                              {ev.icon} {ev.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerDebugEvent(debugEventChoice as string | "random")}
                        className="h-8 border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
                        title="Fire the selected event"
                      >
                        Fire
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-2 items-center gap-2">
              <Button variant="outline" onClick={() => setShowSettings(false)}>Close</Button>
            </div>
          </TabsContent>

          {/* ============================ SHORTCUTS TAB ============================ */}
          <TabsContent value="shortcuts" className="outline-none">
            <ShortcutsTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// ShortcutsTab — rebindable keyboard shortcut list.
// Each row shows: action name · current key (click to rebind) ·
// for locked-layer actions: a "???" badge + the key button is disabled.
// ============================================================
function ShortcutsTab() {
  const shortcuts = useGameStore((s) => s.keyboardShortcuts) || {};
  const setKeyboardShortcut = useGameStore((s) => s.setKeyboardShortcut);
  const resetKeyboardShortcuts = useGameStore((s) => s.resetKeyboardShortcuts);
  const unlockedChallenges = useGameStore((s) => s.unlockedChallenges);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);

  // Which action is currently in "listening for key" mode.
  const [listeningAction, setListeningAction] = useState<string | null>(null);

  const isLocked = useCallback((actionId: string): boolean => {
    const layerId = SHORTCUT_LAYER_GATE[actionId];
    if (!layerId) return false;
    if (layerId === "challenges") return !unlockedChallenges;
    return !unlockedLayers?.[layerId as keyof typeof unlockedLayers];
  }, [unlockedChallenges, unlockedLayers]);

  // Global key listener while an action is in "listening" mode. Captures any
  // key (including Escape, which would otherwise close the modal via the main
  // keyboard-shortcut handler) and binds it to the active action.
  useEffect(() => {
    if (!listeningAction) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      // stopImmediatePropagation is required (not just stopPropagation) —
      // both this listener AND the main useKeyboardShortcuts handler are
      // registered on `window`. stopImmediatePropagation prevents other
      // listeners on the SAME target from firing.
      e.stopImmediatePropagation();
      // Ignore pure modifier keys — they shouldn't be a bind on their own.
      if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") return;
      setKeyboardShortcut(listeningAction, e.key);
      setListeningAction(null);
    };
    // Capture-phase so we beat the main shortcut handler to the event.
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [listeningAction, setKeyboardShortcut]);

  // Stable action-id ordering (defaults order, then any custom extras).
  const actionIds = Object.keys(DEFAULT_KEYBOARD_SHORTCUTS);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Keyboard className="w-4 h-4 text-primary" />
            Keyboard Shortcuts
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any key to rebind. Press the new key to set it. Locked layers show <span className="text-amber-300 font-mono">???</span> and can&apos;t be triggered until unlocked.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={resetKeyboardShortcuts}
          className="h-8 shrink-0"
          title="Reset all shortcuts to defaults"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      <Separator />

      <div className="space-y-1.5">
        {actionIds.map((actionId) => {
          const key = shortcuts[actionId] ?? DEFAULT_KEYBOARD_SHORTCUTS[actionId];
          const locked = isLocked(actionId);
          const listening = listeningAction === actionId;
          return (
            <ShortcutRow
              key={actionId}
              label={SHORTCUT_LABELS[actionId] ?? actionId}
              keyStr={key}
              locked={locked}
              listening={listening}
              onRebind={() => setListeningAction(listening ? null : actionId)}
              onCancel={() => setListeningAction(null)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ShortcutRow({
  label,
  keyStr,
  locked,
  listening,
  onRebind,
  onCancel,
}: {
  label: string;
  keyStr: string;
  locked: boolean;
  listening: boolean;
  onRebind: () => void;
  onCancel: () => void;
}) {
  // Auto-cancel "listening" mode after 3s of no input.
  const cancelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!listening) return;
    cancelTimer.current = setTimeout(() => onCancel(), 3000);
    return () => {
      if (cancelTimer.current) clearTimeout(cancelTimer.current);
    };
  }, [listening, onCancel]);

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 px-2 rounded border border-border/50 bg-muted/20">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-medium truncate">{label}</span>
        {locked && (
          <Badge variant="outline" className="text-[0.55rem] text-amber-300 border-amber-500/40 px-1 py-0 shrink-0">
            ???
          </Badge>
        )}
      </div>
      <button
        onClick={onRebind}
        disabled={locked && !listening}
        className={cn(
          "px-2.5 py-1 rounded border text-xs font-mono font-semibold min-w-[3.5rem] text-center shrink-0 transition-colors",
          listening
            ? "border-primary bg-primary/15 text-primary animate-pulse"
            : locked
              ? "border-border/40 bg-muted/10 text-muted-foreground/50 cursor-not-allowed"
              : "border-border bg-muted/40 hover:bg-muted/60 text-foreground"
        )}
        title={
          listening
            ? "Press any key to bind…"
            : locked
              ? "Locked layer"
              : "Click to rebind"
        }
      >
        {listening ? "…" : locked ? "???" : keyLabel(keyStr)}
      </button>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="stat-card text-center py-2">
      <div className="flex items-center justify-center gap-1 text-muted-foreground text-[0.6rem] mb-1 uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="text-sm font-bold tabular-nums truncate">{value}</div>
    </div>
  );
}

// ============================================================
// Theme picker column — renders a list of stage/layer/special themes
// as radio-style buttons. Locked themes show "???".
// ============================================================
function ThemeColumn({
  title,
  themes,
  activeId,
  unlockedThemes,
  allowNone,
  onSelect,
}: {
  title: string;
  themes: { id: string; name: string; desc: string }[];
  activeId: string | null;
  unlockedThemes: Record<string, boolean>;
  allowNone?: boolean;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground font-semibold">
        {title}
      </div>
      <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
        {allowNone && (
          <ThemeOption
            name="None"
            desc="No overlay — use stage theme as-is."
            active={activeId === null}
            unlocked={true}
            onClick={() => onSelect(null)}
          />
        )}
        {themes.map((t) => (
          <ThemeOption
            key={t.id}
            name={t.name}
            desc={t.desc}
            active={activeId === t.id}
            unlocked={!!unlockedThemes[t.id]}
            onClick={() => onSelect(t.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeOption({
  name,
  desc,
  active,
  unlocked,
  onClick,
}: {
  name: string;
  desc: string;
  active: boolean;
  unlocked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!unlocked}
      title={unlocked ? desc : "Locked — progress further to unlock"}
      className={cn(
        "w-full text-left px-2 py-1.5 rounded border text-xs transition-colors",
        active
          ? "border-primary bg-primary/15 text-primary font-semibold"
          : unlocked
          ? "border-border bg-muted/30 hover:bg-muted/50 text-foreground"
          : "border-border/40 bg-muted/10 text-muted-foreground/40 cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate">
          {unlocked ? name : "???"}
        </span>
        {active ? (
          <Badge variant="outline" className="text-[0.55rem] text-primary border-primary/40 px-1 py-0">
            On
          </Badge>
        ) : !unlocked ? (
          <Lock className="w-3 h-3 shrink-0" />
        ) : null}
      </div>
      {unlocked && (
        <div className="text-[0.6rem] text-muted-foreground mt-0.5 leading-tight line-clamp-2">
          {desc}
        </div>
      )}
    </button>
  );
}

// ReduceMotionToggle — on/off switch for the reduce-motion accessibility
// setting. Uses the shadcn Switch component. The GameShell effect applies
// the `reduce-motion` class on <html>; the CSS disables the animations.
function ReduceMotionToggle() {
  const reduceMotion = useGameStore((s) => !!s.reduceMotion);
  const setReduceMotion = useGameStore((s) => s.setReduceMotion);
  return (
    <Switch
      checked={reduceMotion}
      onCheckedChange={setReduceMotion}
      aria-label="Reduce motion"
    />
  );
}
