"use client";

import { useGameStore } from "@/game/state/store";
import { useActiveLayer } from "@/game/state/layerHelpers";
import type { TabId } from "@/game/state/types";
import { cn } from "@/lib/utils";
import {
  Hand,
  Building2,
  Factory,
  FlaskConical,
  BookOpen,
  ScrollText,
  Trophy,
  Archive as ArchiveIcon,
  ListTree,
  Store,
  Crown,
} from "lucide-react";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  mobile?: boolean;
}

const ALL_TABS: TabDef[] = [
  { id: "actions", label: "Actions", icon: <Hand className="w-4 h-4" /> },
  { id: "systems", label: "Systems", icon: <Building2 className="w-4 h-4" /> },
  { id: "production", label: "Production", icon: <Factory className="w-4 h-4" /> },
  { id: "tech", label: "Tech", icon: <FlaskConical className="w-4 h-4" /> },
  { id: "story", label: "Story", icon: <BookOpen className="w-4 h-4" /> },
  { id: "codex", label: "Codex", icon: <ScrollText className="w-4 h-4" /> },
  { id: "achievements", label: "Awards", icon: <Trophy className="w-4 h-4" /> },
  { id: "archive", label: "Archive", icon: <ArchiveIcon className="w-4 h-4" /> },
  { id: "prestige", label: "Prestige", icon: <Crown className="w-4 h-4" /> },
  { id: "log", label: "Log", icon: <ListTree className="w-4 h-4" /> },
];

export function TabNav() {
  const currentTab = useGameStore((s) => s.currentTab);
  const setTab = useGameStore((s) => s.setTab);
  const setShowShop = useGameStore((s) => s.setShowShop);
  const evolutionPoints = useGameStore((s) => s.evolutionPoints);
  const { isAtLeast } = useActiveLayer();

  // Layer-based tab visibility:
  // - L3+ (Transcendence+): hide "Actions" (automation has taken over)
  // - L4+ (Genesis+): hide "Story" (accessible via Prestige tab)
  // - L5+ (Apotheosis+): hide "Production" (fully automated)
  // - Always visible: Systems, Tech, Prestige, Achievements, Log, Codex, Archive
  const hideActions = isAtLeast("transcendence");
  const hideStory = isAtLeast("genesis");
  const hideProduction = isAtLeast("apotheosis");

  const visibleTabs = ALL_TABS.filter((tab) => {
    if (tab.id === "actions" && hideActions) return false;
    if (tab.id === "story" && hideStory) return false;
    if (tab.id === "production" && hideProduction) return false;
    return true;
  });

  // If current tab was hidden (e.g. player advanced to L3 while on Actions tab),
  // show a fallback "More" style indicator pointing to Prestige tab so they don't get stuck.
  const currentTabVisible = visibleTabs.some((t) => t.id === currentTab);

  return (
    <>
      {/* Desktop tab bar */}
      <div className="desktop-only sticky top-[95px] z-20 glass-strong border-b border-border">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={cn("tab-btn", currentTab === tab.id && "active")}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
          {/* If the current tab is hidden, show a fallback button to go to Prestige */}
          {!currentTabVisible && (
            <button
              onClick={() => setTab("prestige")}
              className="tab-btn"
              title="Your previous tab was hidden at a higher layer — redirecting to Prestige"
            >
              <Crown className="w-4 h-4" />
              <span>Back to Prestige</span>
            </button>
          )}
          <div className="flex-1" />
          {evolutionPoints > 0 && (
            <button
              onClick={() => setShowShop(true)}
              className="tab-btn"
              style={{ color: "rgb(252 211 77)" }}
            >
              <Store className="w-4 h-4" />
              <span>Shop · {evolutionPoints} EP</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile bottom nav — show top 4 visible + "More" */}
      <nav className="mobile-only sticky-footer glass-strong border-t border-border" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around py-1.5 px-1">
          {visibleTabs.slice(0, 4).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md text-[0.6rem] font-medium transition-colors min-w-[44px] min-h-[44px] justify-center",
                currentTab === tab.id ? "text-foreground bg-muted/40" : "text-muted-foreground"
              )}
            >
              <span className="w-5 h-5 flex items-center justify-center">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => setTab("prestige")}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md text-[0.6rem] font-medium transition-colors min-w-[44px] min-h-[44px] justify-center",
              currentTab === "prestige" ? "text-foreground bg-muted/40" : "text-muted-foreground"
            )}
          >
            <span className="w-5 h-5 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </span>
            More
          </button>
        </div>
      </nav>
    </>
  );
}
