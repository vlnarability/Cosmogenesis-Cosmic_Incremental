"use client";

import { useEffect, useRef, lazy, Suspense } from "react";
import { useGameStore } from "@/game/state/store";
import { useGameLoop } from "@/game/hooks/useGameLoop";
import { useKeyboardShortcuts } from "@/game/hooks/useKeyboardShortcuts";
import { STAGES } from "@/game/data/stages";
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

  const themeClass = [
    activeSpecialTheme
      ? `theme-${activeSpecialTheme}`
      : `theme-${activeStageTheme}`,
    activeLayerTheme && !activeSpecialTheme ? `theme-${activeLayerTheme}` : "",
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
