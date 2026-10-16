"use client";

import { useEffect, useRef, lazy, Suspense } from "react";
import { useGameStore } from "@/game/state/store";
import { useGameLoop } from "@/game/hooks/useGameLoop";
import { useKeyboardShortcuts } from "@/game/hooks/useKeyboardShortcuts";
import { STAGES } from "@/game/data/stages";
import { THEME_MAP } from "@/game/data/themes";
import { Header } from "./Header";
import { StagePanel } from "./StagePanel";
import { DivineEnginePanel } from "./DivineEnginePanel";
import { ResourceBar } from "./ResourceBar";
import { TabNav } from "./TabNav";
import { ActionsTab } from "../tabs/ActionsTab";
import { SystemsTab } from "../tabs/SystemsTab";
import { ProductionTab } from "../tabs/ProductionTab";
import { TechTab } from "../tabs/TechTab";
import { StoryTab } from "../tabs/StoryTab";
import { CodexTab } from "../tabs/CodexTab";
import { AchievementsTab } from "../tabs/AchievementsTab";
import { ArchiveTab } from "../tabs/ArchiveTab";
import { LogTab } from "../tabs/LogTab";
import { PrestigeTab } from "../tabs/PrestigeTab";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ListTree, Archive as ArchiveIcon, ScrollText, Trophy } from "lucide-react";

// LAZY-LOAD modals — these are only rendered when their `show*` flag is true.
// This dramatically reduces initial bundle size + memory usage (the OOM killer
// was triggered by all 17 modals + their data files being in the initial chunk).
//
// P6 — MODAL CONSOLIDATION: The 10 layer modals (Challenge, Enlightenment,
// Transcendence, Genesis, Apotheosis, Singularity, Omnipotence, DivinityLayer,
// Infinity, Eternity) are no longer rendered individually here. They are
// consolidated into a single <LayerModal /> that switches content based on
// the `activeLayerModal` state field. LayerModal lazy-loads each layer's
// content separately (so memory optimization is preserved).
const ShopModal = lazy(() => import("../modals/ShopModal").then(m => ({ default: m.ShopModal })));
const EvolveModal = lazy(() => import("../modals/EvolveModal").then(m => ({ default: m.EvolveModal })));
const StoryPopup = lazy(() => import("../modals/StoryPopup").then(m => ({ default: m.StoryPopup })));
const AchievementToast = lazy(() => import("../modals/AchievementToast").then(m => ({ default: m.AchievementToast })));
const SettingsModal = lazy(() => import("../modals/SettingsModal").then(m => ({ default: m.SettingsModal })));
const EventModal = lazy(() => import("../modals/EventModal").then(m => ({ default: m.EventModal })));
const StageTransition = lazy(() => import("../modals/StageTransition").then(m => ({ default: m.StageTransition })));
const LayerModal = lazy(() => import("../modals/LayerModal").then(m => ({ default: m.LayerModal })));
const TutorialHints = lazy(() => import("./TutorialHints").then(m => ({ default: m.TutorialHints })));
const OfflineSummary = lazy(() => import("../modals/OfflineSummary").then(m => ({ default: m.OfflineSummary })));

import { cn } from "@/lib/utils";

// ============================================================
// InfoModal — FIX-UI-TABS.
// Wraps Log / Archive / Codex / Achievements tab content in a shared
// Dialog driven by the `activeInfoModal` state field. The content is
// the SAME tab component that used to render in the main panel — just
// wrapped in a Dialog so it appears as a modal when invoked from the
// gear dropdown.
// ============================================================
const INFO_MODAL_META: Record<
  "log" | "archive" | "codex" | "achievements",
  { title: string; description: string; icon: React.ReactNode }
> = {
  log: {
    title: "Run Log",
    description: "Recent events from this run.",
    icon: <ListTree className="w-4 h-4" />,
  },
  archive: {
    title: "Run Archive",
    description: "Every run you've completed.",
    icon: <ArchiveIcon className="w-4 h-4" />,
  },
  codex: {
    title: "Codex",
    description: "Encyclopedia of stages, systems, techs, and upgrades.",
    icon: <ScrollText className="w-4 h-4" />,
  },
  achievements: {
    title: "Achievements",
    description: "Milestones unlocked across all runs.",
    icon: <Trophy className="w-4 h-4" />,
  },
};

function InfoModal() {
  const activeInfoModal = useGameStore((s) => s.activeInfoModal);
  const closeInfoModal = useGameStore((s) => s.closeInfoModal);

  const meta = activeInfoModal ? INFO_MODAL_META[activeInfoModal] : null;

  return (
    <Dialog
      open={activeInfoModal !== null}
      onOpenChange={(o) => {
        if (!o) closeInfoModal();
      }}
    >
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto glass-strong flex flex-col">
        {meta && (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {meta.icon}
              {meta.title}
            </DialogTitle>
            <DialogDescription>{meta.description}</DialogDescription>
          </DialogHeader>
        )}
        {/* Render the corresponding tab content. The tab components
            are all client components that subscribe to the store —
            they don't care whether they're shown as a tab or modal. */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeInfoModal === "log" && <LogTab />}
          {activeInfoModal === "archive" && <ArchiveTab />}
          {activeInfoModal === "codex" && <CodexTab />}
          {activeInfoModal === "achievements" && <AchievementsTab />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GameShell() {
  const { offlineSummary, dismissOffline } = useGameLoop();
  useKeyboardShortcuts();
  const currentTab = useGameStore((s) => s.currentTab);
  const stageIndex = useGameStore((s) => s.stageIndex);
  const stage = STAGES[stageIndex];

  // BACKGROUND-SIMULATION — at L2+ (Enlightenment unlocked) the base game is
  // fully abstracted into the Divine Engine panel; we swap out StagePanel.
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const showDivineEngine = !!(unlockedLayers?.enlightenment);
  const setTab = useGameStore((s) => s.setTab);

  // AUTO-REDIRECT (one-time): At L2+, if the current tab is a hidden base-game tab
  // (actions/systems/tech/production/story), redirect to "prestige" ONCE so the
  // player never sees the Cell Actions / Manual Action section.
  // This runs only when transitioning into L2 (not on every render) to avoid
  // the "keeps resetting to prestige" bug.
  const prevShowDivineEngine = useRef(showDivineEngine);
  useEffect(() => {
    // Only redirect on the TRANSITION from L1 → L2 (when showDivineEngine flips true),
    // or if the saved tab is a hidden base-game tab at L2+.
    // Don't redirect on every render — that would trap the player on prestige.
    const hiddenTabs = ["actions", "systems", "tech", "production"];
    if (showDivineEngine && hiddenTabs.includes(currentTab)) {
      setTab("prestige");
    }
    prevShowDivineEngine.current = showDivineEngine;
  }, [showDivineEngine, currentTab, setTab]);

  // Theme state — apply CSS classes to the root div.
  // Special overrides everything; otherwise stage + optional layer overlay.
  const activeStageTheme = useGameStore((s) => s.activeStageTheme || "stage-cell");
  const activeLayerTheme = useGameStore((s) => s.activeLayerTheme);
  const activeSpecialTheme = useGameStore((s) => s.activeSpecialTheme);

  // DIMENSION SYSTEM — apply the active dimension's CSS overrides.
  const activeDimension = useGameStore((s) => s.activeDimension || "mundane");
  const dimensionClass = activeDimension !== "mundane" ? `dimension-${activeDimension}` : "";
  // ORGANELLES-THEMES — some special themes (e.g. mini-ai) carry an
  // `extraClass` that opts into additional styling (glassmorphism, glow
  // shadows, icon-in-box). Look it up via THEME_MAP when a special is on.
  const activeSpecialDef = activeSpecialTheme
    ? THEME_MAP[activeSpecialTheme]
    : undefined;
  const extraClass = activeSpecialDef?.extraClass || "";

  const themeClass = [
    activeSpecialTheme
      ? `theme-${activeSpecialTheme}`
      : `theme-${activeStageTheme}`,
    activeLayerTheme && !activeSpecialTheme ? `theme-${activeLayerTheme}` : "",
    dimensionClass,
    extraClass,
  ].filter(Boolean).join(" ");

  return (
    <div className={cn("min-h-screen flex flex-col", themeClass)}>
      {/* Background layers */}
      <div className="bg-layer-1" />
      <div className="bg-layer-2" />
      <div className="bg-vignette" />

      <Header />

      {/* Sticky resource bar — scrolls with the header, stays pinned under it */}
      <ResourceBar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-[112px]">
              {/* FIX-PRESTIGE-DIVINE-CONSTELLATIONS: the DivineEnginePanel
                  MUST keep rendering at L2+ (when `unlockedLayers.enlightenment`
                  is true). Players at L2+ lose access to StagePanel and rely
                  on the DivineEnginePanel for world count, Divinity/s, EP/s,
                  peak production, and quick-access layer buttons. Do not
                  remove this conditional — it's the only way to see
                  background-sim throughput after L1. */}
              {showDivineEngine ? <DivineEnginePanel /> : <StagePanel />}
            </div>
          </div>
          <div className="lg:col-span-8 xl:col-span-9">
            <TabNav />
            <div className="mt-4 mb-20 md:mb-4">
              {currentTab === "actions" && <ActionsTab />}
              {currentTab === "systems" && <SystemsTab />}
              {currentTab === "production" && <ProductionTab />}
              {currentTab === "tech" && <TechTab />}
              {currentTab === "story" && <StoryTab />}
              {currentTab === "codex" && <CodexTab />}
              {currentTab === "achievements" && <AchievementsTab />}
              {currentTab === "archive" && <ArchiveTab />}
              {currentTab === "prestige" && <PrestigeTab />}
              {currentTab === "log" && <LogTab />}
            </div>
          </div>
        </div>
      </main>

      {/* Modals — lazy-loaded + conditionally rendered to reduce memory */}
      {/* P7 — Loading state: show a centered spinner instead of `null` while
          modal chunks are lazy-loading. */}
      <Suspense fallback={<ModalLoadingFallback />}>
        <ShopModal />
        <EvolveModal />
        <StoryPopup />
        <AchievementToast />
        <SettingsModal />
        <EventModal />
        <StageTransition />
        {/* P6 — Consolidated layer modal. Renders the active layer's content
            inside a single shared <Dialog> wrapper based on `activeLayerModal`. */}
        <LayerModal />
        <TutorialHints />
        {/* FIX-UI-TABS — Shared info modal for Log/Archive/Codex/Awards.
            Opened from the gear dropdown (Header); content switches on
            `activeInfoModal`. Renders the same tab component that the
            main panel would render — just wrapped in a Dialog. */}
        <InfoModal />
        {offlineSummary && (
          <OfflineSummary
            elapsed={offlineSummary.elapsed}
            resourcesGained={offlineSummary.resourcesGained}
            onClose={dismissOffline}
          />
        )}
      </Suspense>
    </div>
  );
}

// P7 — Loading state for lazy-loaded modals. Centered, non-blocking, subtle.
function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none" aria-hidden>
      <div className="animate-spin text-3xl select-none opacity-70">⏳</div>
    </div>
  );
}
