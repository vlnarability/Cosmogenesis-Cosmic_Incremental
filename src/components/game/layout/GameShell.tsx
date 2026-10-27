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
import { DivineEngineFullTab } from "./DivineEngineFullTab";
import { ResourceBar } from "./ResourceBar";
import { TabNav } from "./TabNav";
import { ActionsTab } from "../tabs/ActionsTab";
import { SystemsTab } from "../tabs/SystemsTab";
import { ProductionTab } from "../tabs/ProductionTab";
import { TechTab } from "../tabs/TechTab";
import { WorldTab } from "../tabs/WorldTab";
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
// LAYER-AS-TAB — the 10 layer content components (Challenge, Enlightenment,
// Transcendence, Genesis, Apotheosis, Singularity, Omnipotence, DivinityLayer,
// Infinity, Eternity) are now rendered INLINE in the main tab panel based on
// `currentTab`. They used to live inside the <LayerModal/> wrapper (a shared
// <Dialog>); that wrapper is no longer rendered here (the file remains in
// `modals/LayerModal.tsx` for back-compat). The layer content is still
// lazy-loaded individually, preserving the memory optimization.
const ShopModal = lazy(() => import("../modals/ShopModal").then(m => ({ default: m.ShopModal })));
const EvolveModal = lazy(() => import("../modals/EvolveModal").then(m => ({ default: m.EvolveModal })));
const FTLChoiceModal = lazy(() => import("../modals/FTLChoiceModal").then(m => ({ default: m.FTLChoiceModal })));
const AscensionChoiceModal = lazy(() => import("../modals/AscensionChoiceModal").then(m => ({ default: m.AscensionChoiceModal })));
const GovernmentChoiceModal = lazy(() => import("../modals/GovernmentChoiceModal").then(m => ({ default: m.GovernmentChoiceModal })));
const RaidModal = lazy(() => import("../modals/RaidModal").then(m => ({ default: m.RaidModal })));
const StoryPopup = lazy(() => import("../modals/StoryPopup").then(m => ({ default: m.StoryPopup })));
const AchievementToast = lazy(() => import("../modals/AchievementToast").then(m => ({ default: m.AchievementToast })));
const SettingsModal = lazy(() => import("../modals/SettingsModal").then(m => ({ default: m.SettingsModal })));
const EventModal = lazy(() => import("../modals/EventModal").then(m => ({ default: m.EventModal })));
const StageTransition = lazy(() => import("../modals/StageTransition").then(m => ({ default: m.StageTransition })));
const TutorialHints = lazy(() => import("./TutorialHints").then(m => ({ default: m.TutorialHints })));
const OfflineSummary = lazy(() => import("../modals/OfflineSummary").then(m => ({ default: m.OfflineSummary })));

// LAYER-AS-TAB — lazy-load each layer's CONTENT (no <Dialog> wrapper).
// Each content component reads its own layer state from the store; GameShell
// renders them inline based on `currentTab`. The Suspense fallback below
// (InlineLayerLoading) shows a centered spinner while the chunk loads.
const ChallengeContent = lazy(() =>
  import("../modals/ChallengeModal").then((m) => ({ default: m.ChallengeContent as React.ComponentType }))
);
const EnlightenmentContent = lazy(() =>
  import("../modals/EnlightenmentModal").then((m) => ({ default: m.EnlightenmentContent as React.ComponentType }))
);
const TranscendenceContent = lazy(() =>
  import("../modals/TranscendenceModal").then((m) => ({ default: m.TranscendenceContent as React.ComponentType }))
);
const GenesisContent = lazy(() =>
  import("../modals/GenesisModal").then((m) => ({ default: m.GenesisContent as React.ComponentType }))
);
const ApotheosisContent = lazy(() =>
  import("../modals/ApotheosisModal").then((m) => ({ default: m.ApotheosisContent as React.ComponentType }))
);
const SingularityContent = lazy(() =>
  import("../modals/SingularityModal").then((m) => ({ default: m.SingularityContent as React.ComponentType }))
);
const OmnipotenceContent = lazy(() =>
  import("../modals/OmnipotenceModal").then((m) => ({ default: m.OmnipotenceContent as React.ComponentType }))
);
const DivinityLayerContent = lazy(() =>
  import("../modals/DivinityLayerModal").then((m) => ({ default: m.DivinityLayerContent as React.ComponentType }))
);
const InfinityContent = lazy(() =>
  import("../modals/InfinityModal").then((m) => ({ default: m.InfinityContent as React.ComponentType }))
);
const EternityContent = lazy(() =>
  import("../modals/EternityModal").then((m) => ({ default: m.EternityContent as React.ComponentType }))
);

// ---- Inline-layer loading state — shown while a layer's content chunk loads. ----
function InlineLayerLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 min-h-[200px]">
      <div className="animate-spin text-3xl select-none" aria-hidden>
        ⏳
      </div>
      <p className="text-xs text-muted-foreground">Loading layer…</p>
    </div>
  );
}

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
      {/* h-[80vh] (FIXED height, not max-h) — keeps the modal a stable size
          regardless of content. Internal scroll area handles overflow.
          This fixes the bug where the close button (top-right) kept moving
          as new log entries grew the modal. The height is viewport-relative
          so it scales with the browser window (responsive). */}
      <DialogContent className="max-w-4xl h-[80vh] overflow-hidden glass-strong flex flex-col">
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

  // AUTO-REDIRECT: At L2+, if the current tab is a hidden base-game tab
  // (actions/systems/tech/production), redirect to "story" so the player
  // never sees the Cell Actions / Manual Action section.
  // REMOVE-PRESTIGE-TAB — redirect to "story" instead of "prestige".
  const prevShowDivineEngine = useRef(showDivineEngine);
  useEffect(() => {
    const hiddenTabs = ["actions", "systems", "tech", "production"];
    if (showDivineEngine && hiddenTabs.includes(currentTab)) {
      setTab("story");
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
              {currentTab === "world" && <WorldTab />}
              {currentTab === "story" && <StoryTab />}
              {currentTab === "codex" && <CodexTab />}
              {currentTab === "achievements" && <AchievementsTab />}
              {currentTab === "archive" && <ArchiveTab />}
              {currentTab === "prestige" && <PrestigeTab />}
              {currentTab === "log" && <LogTab />}

              {/* DIVINE-ENGINE-TAB — the god's full control panel.
                  RESTORE-UI-CHANGES: now also renders L10 Eternity content
                  (merged — L10 "Genesis Engine" tab was removed from the
                  tab bar; players access it via the sidebar "Enter Divine
                  Engine" button + this merged tab). EternityContent is
                  lazy-loaded so it gets its own nested Suspense. */}
              {currentTab === "divine_engine" && (
                <>
                  <DivineEngineFullTab />
                  {unlockedLayers?.eternity && (
                    <Suspense fallback={<InlineLayerLoading />}>
                      <EternityContent />
                    </Suspense>
                  )}
                </>
              )}

              {/* LAYER-AS-TAB — the 10 prestige-layer content components
                  render INLINE here, in the same panel as the other tabs,
                  driven by `currentTab` (NOT `activeLayerModal`). Each
                  layer's chunk is lazy-loaded above; Suspense shows a
                  centered spinner while the chunk fetches. */}
              {(currentTab === "trials" ||
                currentTab === "constellations" ||
                currentTab === "market" ||
                currentTab === "galaxy" ||
                currentTab === "conquest" ||
                currentTab === "universe" ||
                currentTab === "lab" ||
                currentTab === "diplomacy" ||
                currentTab === "war" ||
                currentTab === "genesis_engine") && (
                <Suspense fallback={<InlineLayerLoading />}>
                  {currentTab === "trials" && <ChallengeContent />}
                  {currentTab === "constellations" && <EnlightenmentContent />}
                  {currentTab === "market" && <TranscendenceContent />}
                  {/* Back-compat: old saves may have currentTab === "galaxy".
                      The galaxy tab is HIDDEN from the tab bar at L5+, but
                      GameShell still renders it standalone for old saves. */}
                  {currentTab === "galaxy" && <GenesisContent />}
                  {/* Back-compat: old saves may have currentTab === "conquest". */}
                  {currentTab === "conquest" && <ApotheosisContent />}
                  {/* RESTORE-UI-CHANGES — merged tab: render L4 (Genesis, if
                      unlocked) + L5 (Apotheosis, if unlocked) + L6 (Singularity,
                      always — the tab is only visible at L6+). */}
                  {currentTab === "universe" && (
                    <>
                      {unlockedLayers?.genesis && <GenesisContent />}
                      {unlockedLayers?.apotheosis && <ApotheosisContent />}
                      <SingularityContent />
                    </>
                  )}
                  {/* RESTORE-UI-CHANGES — merged tab "War" (was "Lab"): render
                      L9 (Infinity) FIRST if unlocked, then L7 (Omnipotence,
                      always — the tab is only visible at L7+). */}
                  {currentTab === "lab" && (
                    <>
                      {unlockedLayers?.infinity && <InfinityContent />}
                      <OmnipotenceContent />
                    </>
                  )}
                  {currentTab === "diplomacy" && <DivinityLayerContent />}
                  {/* Back-compat: old saves may have currentTab === "war" (old
                      standalone L9 tab, now merged into the "lab"/War tab). */}
                  {currentTab === "war" && <InfinityContent />}
                  {/* Back-compat: old saves may have currentTab ===
                      "genesis_engine" (old standalone L10 tab, now merged into
                      the divine_engine tab). */}
                  {currentTab === "genesis_engine" && <EternityContent />}
                </Suspense>
              )}
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
        <FTLChoiceModal />
        <AscensionChoiceModal />
        <GovernmentChoiceModal />
        <RaidModal />
        <StoryPopup />
        <AchievementToast />
        <SettingsModal />
        <EventModal />
        <StageTransition />
        {/* LAYER-AS-TAB — <LayerModal/> is no longer rendered here. The 10
            layer content components are now rendered INLINE in the main tab
            panel above (driven by `currentTab`). The LayerModal.tsx file is
            kept in `modals/` for back-compat (PrestigeTab.onView buttons and
            useKeyboardShortcuts still call openLayerModal, which now flips
            `currentTab` via LAYER_TO_TAB). */}
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
