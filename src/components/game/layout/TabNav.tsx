"use client";

import { useGameStore } from "@/game/state/store";
import { useActiveLayer } from "@/game/state/layerHelpers";
import type { TabId } from "@/game/state/types";
import { cn } from "@/lib/utils";
import { formatCompact } from "../shared/format";
import {
  Hand,
  Building2,
  FlaskConical,
  BookOpen,
  Store,
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
} from "lucide-react";

// ============================================================
// REMOVE-PRESTIGE-TAB + MULTI-ROW-TABS
//
// The Prestige tab has been removed (user asked multiple times).
// The Prestige Roadmap button in the gear dropdown has also been
// removed.
//
// The desktop tab bar now uses a TWO-ROW layout:
//   Row 1 (left-aligned, scrollable): base-game tabs + layer tabs.
//   Row 2 (right-aligned): Story + Shop.
// This prevents the bar from getting cut off when many layers are
// unlocked (the old single-row design ran out of space at L7+).
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
];

// Reference tabs — row 2, right-aligned.
const REFERENCE_TABS: TabDef[] = [
  { id: "story", label: "Story", icon: <BookOpen className="w-4 h-4" /> },
];

const LAYER_TABS: LayerTabDef[] = [
  { id: "trials",          layerId: "challenges",    label: "Trials",         icon: <Skull        className="w-4 h-4" /> },
  { id: "constellations",  layerId: "enlightenment", label: "Constellations", icon: <Eye          className="w-4 h-4" /> },
  { id: "market",          layerId: "transcendence", label: "Market",         icon: <Triangle     className="w-4 h-4" /> },
  { id: "galaxy",          layerId: "genesis",       label: "Galaxy",         icon: <Egg          className="w-4 h-4" /> },
  { id: "conquest",        layerId: "apotheosis",    label: "Conquest",       icon: <Sparkles     className="w-4 h-4" /> },
  { id: "universe",        layerId: "singularity",   label: "Universe",       icon: <Circle       className="w-4 h-4" /> },
  { id: "lab",             layerId: "omnipotence",   label: "Lab",            icon: <Atom         className="w-4 h-4" /> },
  { id: "diplomacy",       layerId: "divinity",      label: "Diplomacy",      icon: <Church       className="w-4 h-4" /> },
  { id: "war",             layerId: "infinity",      label: "War",            icon: <InfinityIcon className="w-4 h-4" /> },
  { id: "genesis-engine", layerId: "eternity",      label: "Genesis Engine", icon: <Star         className="w-4 h-4" /> },
];

export function TabNav() {
  const currentTab = useGameStore((s) => s.currentTab);
  const setTab = useGameStore((s) => s.setTab);
  const setShowShop = useGameStore((s) => s.setShowShop);
  const showShop = useGameStore((s) => s.showShop);
  const evolutionPoints = useGameStore((s) => s.evolutionPoints);
  const openLayerModal = useGameStore((s) => s.openLayerModal);
  const activeLayerModal = useGameStore((s) => s.activeLayerModal);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const unlockedChallenges = useGameStore((s) => s.unlockedChallenges);
  const { isAtLeast } = useActiveLayer();

  const isL2Plus = isAtLeast("enlightenment");

  // Main tabs: at L2+, hide Actions/Systems/Tech.
  const visibleMainTabs = MAIN_TABS.filter(() => !isL2Plus);

  // Layer tabs: shown when their layer is unlocked.
  const visibleLayerTabs = LAYER_TABS.filter((tab) => {
    if (tab.layerId === "challenges") return !!unlockedChallenges;
    return !!unlockedLayers?.[tab.layerId];
  });

  const visibleReferenceTabs = REFERENCE_TABS;

  return (
    <>
      {/* ===== Desktop tab bar — TWO ROWS ===== */}
      <div className="desktop-only sticky top-[95px] z-20 glass-strong border-b border-border">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 space-y-1">
          {/* Row 1 — main + layer tabs (left-aligned, scrollable) */}
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
          </div>

          {/* Row 2 — Story + Shop (right-aligned) */}
          <div className="flex items-center justify-end gap-1 overflow-x-auto no-scrollbar">
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

            <button
              onClick={() => setShowShop(true)}
              className={cn("tab-btn shrink-0", showShop && "active")}
              style={{ color: "rgb(252 211 77)" }}
              title="Open Evolution Shop"
            >
              <Store className="w-4 h-4" />
              <span>
                Shop
                {evolutionPoints > 0 && ` · ${formatCompact(evolutionPoints)} EP`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== Mobile bottom nav ===== */}
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

          {/* Story tab */}
          <button
            onClick={() => setTab("story")}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md text-[0.6rem] font-medium transition-colors min-w-[44px] min-h-[44px] justify-center shrink-0",
              currentTab === "story" ? "text-foreground bg-muted/40" : "text-muted-foreground"
            )}
          >
            <span className="w-5 h-5 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </span>
            Story
          </button>

          {/* Latest layer tab */}
          {visibleLayerTabs.length > 0 && (
            (() => {
              const latest = visibleLayerTabs[visibleLayerTabs.length - 1];
              return (
                <button
                  onClick={() => openLayerModal(latest.layerId)}
                  // LAYER-AS-TAB — also highlight when currentTab is the
                  // latest layer tab (matches the desktop behavior above).
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md text-[0.6rem] font-medium transition-colors min-w-[44px] min-h-[44px] justify-center shrink-0",
                    (currentTab === latest.id || activeLayerModal === latest.layerId)
                      ? "text-foreground bg-muted/40"
                      : "text-amber-400"
                  )}
                >
                  <span className="w-5 h-5 flex items-center justify-center">
                    {latest.icon}
                  </span>
                  {latest.label}
                </button>
              );
            })()
          )}

          {/* Shop */}
          <button
            onClick={() => setShowShop(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md text-[0.6rem] font-medium transition-colors min-w-[44px] min-h-[44px] justify-center shrink-0",
              showShop ? "text-foreground bg-muted/40" : "text-amber-400"
            )}
            title="Open Evolution Shop"
          >
            <span className="w-5 h-5 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </span>
            Shop
          </button>
        </div>
      </nav>
    </>
  );
}
