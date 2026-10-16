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
  Crown,
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
// FIX-UI-TABS — Tab restructure.
// The main tab bar now renders a LAYER-AWARE set of tabs:
//   • L1 (first playthrough, no wins yet):
//       Actions · Systems · Tech · Story · Prestige · Shop
//   • L1+ (after first Galactic win = `unlockedChallenges`):
//       + Trials (opens the L1 challenges modal via openLayerModal)
//   • L2+ (Enlightenment unlocked):
//       Remove Actions / Systems / Tech / Production;
//       add Constellations (L2 layer modal);
//       keep Story · Prestige · Shop
//   • L3+ (Transcendence): + Market
//   • L4+ (Genesis):        + Galaxy
//   • L5+ (Apotheosis):     + Conquest
//   • L6+ (Singularity):   + Universe
//   • L7+ (Omnipotence):    + Lab
//   • L8+ (Divinity):       + Diplomacy
//   • L9+ (Infinity):       + War
//   • L10+ (Eternity):      + Genesis Engine
//
// Log / Archive / Codex / Awards no longer live on the main bar — they
// are accessed via the gear dropdown in the Header and open as modals
// (see GameShell's InfoModal). This is why those tabs are NOT in
// MAIN_TABS / LAYER_TABS below.
// ============================================================

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

interface LayerTabDef {
  /** Unique react key. */
  id: string;
  /** Layer modal id passed to `openLayerModal`. */
  layerId: string;
  label: string;
  icon: React.ReactNode;
}

// Standard tabs (switch via `setTab(id)`). Production is intentionally
// omitted from the main bar per the task spec — its data is rolled into
// the Systems tab visually and the tab itself is reachable only via
// `setTab("production")` (no button).
const MAIN_TABS: TabDef[] = [
  { id: "actions", label: "Actions", icon: <Hand className="w-4 h-4" /> },
  { id: "systems", label: "Systems", icon: <Building2 className="w-4 h-4" /> },
  { id: "tech", label: "Tech", icon: <FlaskConical className="w-4 h-4" /> },
  { id: "story", label: "Story", icon: <BookOpen className="w-4 h-4" /> },
  { id: "prestige", label: "Prestige", icon: <Crown className="w-4 h-4" /> },
];

// Layer tabs (open via `openLayerModal(layerId)`). Each is gated by its
// own unlock condition — see `unlockedChallenges` for L1 (Trials) and
// `unlockedLayers.<layerId>` for L2-L10.
const LAYER_TABS: LayerTabDef[] = [
  { id: "trials",        layerId: "challenges",    label: "Trials",         icon: <Skull        className="w-4 h-4" /> },
  { id: "constellations",layerId: "enlightenment", label: "Constellations", icon: <Eye          className="w-4 h-4" /> },
  { id: "market",        layerId: "transcendence", label: "Market",         icon: <Triangle     className="w-4 h-4" /> },
  { id: "galaxy",        layerId: "genesis",       label: "Galaxy",         icon: <Egg          className="w-4 h-4" /> },
  { id: "conquest",      layerId: "apotheosis",    label: "Conquest",       icon: <Sparkles     className="w-4 h-4" /> },
  { id: "universe",      layerId: "singularity",   label: "Universe",       icon: <Circle       className="w-4 h-4" /> },
  { id: "lab",           layerId: "omnipotence",   label: "Lab",            icon: <Atom         className="w-4 h-4" /> },
  { id: "diplomacy",     layerId: "divinity",      label: "Diplomacy",      icon: <Church       className="w-4 h-4" /> },
  { id: "war",           layerId: "infinity",      label: "War",            icon: <InfinityIcon className="w-4 h-4" /> },
  { id: "genesis-engine",layerId: "eternity",      label: "Genesis Engine", icon: <Star         className="w-4 h-4" /> },
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

  // L2+ hides the base-game tabs (Actions / Systems / Tech / Production).
  const isL2Plus = isAtLeast("enlightenment");

  // Main tabs: at L2+, only Story + Prestige remain.
  const visibleMainTabs = MAIN_TABS.filter((tab) => {
    if (isL2Plus) {
      return !["actions", "systems", "tech"].includes(tab.id);
    }
    return true;
  });

  // Layer tabs: each shown only when its layer is unlocked.
  const visibleLayerTabs = LAYER_TABS.filter((tab) => {
    if (tab.layerId === "challenges") return !!unlockedChallenges;
    return !!unlockedLayers?.[tab.layerId];
  });

  // If the current tab is hidden (e.g. player advanced to L2 while on
  // Actions tab), show a fallback button so they don't get stuck.
  const currentTabVisible = visibleMainTabs.some((t) => t.id === currentTab);

  return (
    <>
      {/* ===== Desktop tab bar ===== */}
      <div className="desktop-only sticky top-[95px] z-20 glass-strong border-b border-border">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5">
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

          {/* Layer tabs — open via openLayerModal(). Highlighted when
              its layer is the active one (matches `activeLayerModal`). */}
          {visibleLayerTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => openLayerModal(tab.layerId)}
              className={cn(
                "tab-btn shrink-0",
                activeLayerModal === tab.layerId && "active"
              )}
              title={tab.label}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}

          {/* Fallback button when the current tab is hidden at L2+. */}
          {!currentTabVisible && (
            <button
              onClick={() => setTab("prestige")}
              className="tab-btn shrink-0"
              title="Your previous tab was hidden at a higher layer — redirecting to Prestige"
            >
              <Crown className="w-4 h-4" />
              <span>Back to Prestige</span>
            </button>
          )}

          {/* Spacer — pushes Shop to the right on desktop, but keeps
              the row scrollable on mobile when overflowing. */}
          <div className="flex-1" />

          {/* Shop button — ALWAYS on the main bar (per task spec).
              `shrink-0` keeps it from being clipped when other tabs
              overflow the scrollable row (Fix 2). */}
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

      {/* ===== Mobile bottom nav =====
          Horizontal-scrollable row. L1 shows the 4 base-game tabs + Shop;
          L2+ shows Story · Prestige · latest layer tab · Shop. The gear
          dropdown in the Header still hosts Log/Archive/Codex/Awards. */}
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

          {/* Latest unlocked layer tab — one-tap access to "where the
              action is" at the current layer. */}
          {visibleLayerTabs.length > 0 && (
            <button
              onClick={() => openLayerModal(visibleLayerTabs[visibleLayerTabs.length - 1].layerId)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md text-[0.6rem] font-medium transition-colors min-w-[44px] min-h-[44px] justify-center shrink-0",
                activeLayerModal === visibleLayerTabs[visibleLayerTabs.length - 1].layerId
                  ? "text-foreground bg-muted/40"
                  : "text-amber-400"
              )}
            >
              <span className="w-5 h-5 flex items-center justify-center">
                {visibleLayerTabs[visibleLayerTabs.length - 1].icon}
              </span>
              {visibleLayerTabs[visibleLayerTabs.length - 1].label}
            </button>
          )}

          {/* Shop — always reachable on mobile. */}
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
