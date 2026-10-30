"use client";

import { useGameStore } from "@/game/state/store";
import { useActiveLayer } from "@/game/state/layerHelpers";
import type { TabId } from "@/game/state/types";
import { cn } from "@/lib/utils";
import {
  Hand,
  Building2,
  FlaskConical,
  Globe,
  Eye,
  Triangle,
  Egg,
  Sparkles,
  Circle,
  Swords,
  Church,
} from "lucide-react";

// ============================================================
// RESTORE-UI-CHANGES — Tab consolidation.
//
// The tab bar now uses a SINGLE ROW: main tabs + layer tabs.
// Removed from the tab bar (moved elsewhere):
//   • Divine Engine  — accessible via the sidebar "Enter Divine
//                       Engine" button in DivineEnginePanel.
//   • Shop           — top-bar button in Header (amber Divinity badge).
//   • Story          — moved into the gear dropdown.
//   • Trials         — top-bar button in Header (visible when L1
//                       unlocked).
//
// Layer merging:
//   • L4 Galaxy        — HIDDEN when L5 (Apotheosis) unlocks (merged
//                        into the Universe tab — GameShell stacks L4
//                        + L5 + L6 content when currentTab === "universe").
//   • L5 Conquest      — HIDDEN when L6 (Singularity) unlocks (merged
//                        into the Universe tab). Renamed label to
//                        "Galactic Cluster".
//   • L9 War           — REMOVED from tab bar entirely (merged into
//                        the L7 Lab tab — GameShell renders L9 content
//                        first then L7 content when currentTab === "lab").
//   • L7 Lab           — renamed to "War" with <Swords> icon. Handles
//                        both L7 + L9 content (merged).
//   • L10 Genesis Eng  — REMOVED from tab bar entirely (merged into
//                        the Divine Engine sidebar button — GameShell
//                        renders DivineEngineFullTab + EternityContent
//                        when currentTab === "divine_engine").
//
// Back-compat: GameShell still renders single-layer content for old
// saves that have `currentTab === "galaxy" | "conquest" | "war" |
// "genesis_engine"` stored in localStorage.
// ============================================================

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

interface LayerTabDef {
  id: string;
  layerId: string;
  label: string;
  icon: React.ReactNode;
}

// REMOVE-PRESTIGE-TAB — "prestige" is no longer in MAIN_TABS. The
// prestige flow is now driven entirely by the Auto-Ascend autobuyer +
// the Big Bang button at L10.
const MAIN_TABS: TabDef[] = [
  { id: "actions", label: "Actions", icon: <Hand className="w-4 h-4" /> },
  { id: "systems", label: "Systems", icon: <Building2 className="w-4 h-4" /> },
  { id: "tech", label: "Tech", icon: <FlaskConical className="w-4 h-4" /> },
  // PART-2 — World tab combines Trade + Rivals. Player chooses an NPC
  // from the list and can trade with them or do rival actions. Per user:
  // 'Merge with Rivals Tab. Call it something like World.' Unlocked at
  // creature stage (when the first rival/trade partner appears).
  { id: "world", label: "World", icon: <Globe className="w-4 h-4" /> },
];

// RESTORE-UI-CHANGES — REFERENCE_TABS is now empty. Story moved into
// the gear dropdown; Log/Archive/Codex/Awards already live in the
// gear dropdown's Reference section (see Header).
const REFERENCE_TABS: TabDef[] = [];

const LAYER_TABS: LayerTabDef[] = [
  { id: "constellations",  layerId: "enlightenment", label: "Constellations",   icon: <Eye      className="w-4 h-4" /> },
  { id: "market",          layerId: "transcendence", label: "Market",            icon: <Triangle  className="w-4 h-4" /> },
  { id: "galaxy",          layerId: "genesis",       label: "Galaxy",            icon: <Egg       className="w-4 h-4" /> },
  // RESTORE-UI-CHANGES — renamed label from "Conquest" to "Galactic Cluster".
  { id: "conquest",        layerId: "apotheosis",    label: "Galactic Cluster",  icon: <Sparkles  className="w-4 h-4" /> },
  { id: "universe",        layerId: "singularity",   label: "Universe",          icon: <Circle    className="w-4 h-4" /> },
  // RESTORE-UI-CHANGES — renamed label from "Lab" to "War" with <Swords> icon.
  // This tab handles BOTH L7 (Omnipotence) AND L9 (Infinity) content —
  // GameShell renders InfinityContent first (if L9 unlocked) then
  // OmnipotenceContent when currentTab === "lab".
  { id: "lab",             layerId: "omnipotence",   label: "War",               icon: <Swords    className="w-4 h-4" /> },
  { id: "diplomacy",       layerId: "divinity",      label: "Diplomacy",         icon: <Church    className="w-4 h-4" /> },
];

export function TabNav() {
  const currentTab = useGameStore((s) => s.currentTab);
  const setTab = useGameStore((s) => s.setTab);
  const openLayerModal = useGameStore((s) => s.openLayerModal);
  const activeLayerModal = useGameStore((s) => s.activeLayerModal);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const activeChallenge = useGameStore((s) => s.activeChallenge);
  const { isAtLeast } = useActiveLayer();

  const isL2Plus = isAtLeast("enlightenment");
  // BUGFIX-TRIALS: when a Trial is active, force-show the base-game tabs
  // (Actions/Systems/Tech/World) even at L2+, + hide the layer tabs so the
  // player has a focused base-game surface to actually play the trial.
  const inTrial = !!activeChallenge;

  // Main tabs: at L2+, hide Actions/Systems/Tech — UNLESS a Trial is active.
  const visibleMainTabs = inTrial ? MAIN_TABS : MAIN_TABS.filter(() => !isL2Plus);

  // Layer tabs: shown when their layer is unlocked. Higher layers MERGE
  // lower layers out of the tab bar (their content is still rendered
  // inside the higher tab — see GameShell's universe/lab cases).
  // BUGFIX-TRIALS: hide all layer tabs during a Trial (focused base-game mode).
  const visibleLayerTabs = inTrial ? [] : LAYER_TABS.filter((tab) => {
    // L4 Galaxy — hidden when L5 (Apotheosis) unlocks (merged into the Universe tab).
    if (tab.id === "galaxy" && !!unlockedLayers?.apotheosis) return false;
    // L5 Conquest (now "Galactic Cluster") — hidden when L6 (Singularity) unlocks (merged into Universe).
    if (tab.id === "conquest" && !!unlockedLayers?.singularity) return false;
    // Standard unlock check.
    return !!unlockedLayers?.[tab.layerId];
  });

  const visibleReferenceTabs = REFERENCE_TABS;

  return (
    <>
      {/* ===== Desktop tab bar — SINGLE ROW ===== */}
      <div className="desktop-only sticky top-[95px] z-20 glass-strong border-b border-border">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5">
          {/* Single row — main + layer tabs (left-aligned, scrollable) */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {visibleMainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={cn("tab-btn shrink-0", currentTab === tab.id && "active")}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}

            {visibleLayerTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => openLayerModal(tab.layerId)}
                // LAYER-AS-TAB — highlight when EITHER:
                //   • `currentTab === tab.id` (the new inline-tab model — openLayerModal
                //     also flips currentTab via LAYER_TO_TAB), OR
                //   • `activeLayerModal === tab.layerId` (legacy flag, kept for
                //     back-compat with Header chip / useKeyboardShortcuts).
                className={cn(
                  "tab-btn shrink-0",
                  (currentTab === tab.id || activeLayerModal === tab.layerId) && "active"
                )}
                title={tab.label}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}

            {/* Reference tabs (empty array — Story moved to gear dropdown,
                Log/Archive/Codex/Awards already in gear dropdown). */}
            {visibleReferenceTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={cn("tab-btn shrink-0", currentTab === tab.id && "active")}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Mobile bottom nav — shows ALL visible layer tabs (no
              more "latest layer only" button). Shop + Story removed
              (mobile users access them via the gear dropdown). ===== */}
      <nav
        className="mobile-only sticky-footer glass-strong border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center gap-1 py-1.5 px-1 overflow-x-auto no-scrollbar">
          {visibleMainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md text-[0.6rem] font-medium transition-colors min-w-[44px] min-h-[44px] justify-center shrink-0",
                currentTab === tab.id ? "text-foreground bg-muted/40" : "text-muted-foreground"
              )}
            >
              <span className="w-5 h-5 flex items-center justify-center">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}

          {/* All visible layer tabs (replaces the old single "latest layer" button). */}
          {visibleLayerTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => openLayerModal(tab.layerId)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md text-[0.6rem] font-medium transition-colors min-w-[44px] min-h-[44px] justify-center shrink-0",
                (currentTab === tab.id || activeLayerModal === tab.layerId)
                  ? "text-foreground bg-muted/40"
                  : "text-amber-400"
              )}
              title={tab.label}
            >
              <span className="w-5 h-5 flex items-center justify-center">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
