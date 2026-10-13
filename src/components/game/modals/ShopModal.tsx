"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/game/state/store";
import { UPGRADES, upgradeCost } from "@/game/data/upgrades";
import type { UpgradeDef } from "@/game/state/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Store, Lock, CheckCircle2, Sparkles, Layers, Star, Egg, Triangle, Circle, Atom, Church, Infinity as InfinityIcon } from "lucide-react";
import { formatNumber } from "../shared/format";

// Display names for layer ids used by `unlockedLayers` in the store.
// Used for the "Requires: <Layer>" lock badge on layer-specific upgrades,
// AND for the tab labels in the new tabbed shop.
const LAYER_DISPLAY_NAMES: Record<string, string> = {
  evolution: "Evolution",
  enlightenment: "Enlightenment",
  transcendence: "Transcendence",
  genesis: "Genesis",
  apotheosis: "Apotheosis",
  singularity: "Singularity",
  omnipotence: "Bio-Engineering",
  divinity: "Divine Alliance",
  infinity: "Divine War",
  eternity: "Ascension",
};

// Tab definitions for the tabbed shop. The "Main" tab holds the universal
// PP-purchased upgrades (auto-buyers + boosts); each "L{n}" tab holds the
// layer-specific upgrades for that layer (filtered via requiresLayer).
// Layer tabs only render when the corresponding layer is unlocked.
type ShopTab = {
  id: string;
  label: string;
  shortLabel: string;
  layerId?: string;        // if set, this tab is only shown when this layer is unlocked
  icon?: React.ReactNode;
  currency: "PP" | "EP";   // PP = prestigePoints, EP = evolutionPoints
};

const SHOP_TABS: ShopTab[] = [
  { id: "main", label: "Main (PP)", shortLabel: "Main", currency: "PP", icon: <Sparkles className="w-3 h-3" /> },
  { id: "L1", label: "L1 — Evolution (EP)", shortLabel: "L1", currency: "EP", icon: <Store className="w-3 h-3" /> },
  { id: "L2", label: "L2 — Enlightenment", shortLabel: "L2", layerId: "enlightenment", currency: "EP", icon: <Star className="w-3 h-3" /> },
  { id: "L3", label: "L3 — Transcendence", shortLabel: "L3", layerId: "transcendence", currency: "EP", icon: <Triangle className="w-3 h-3" /> },
  { id: "L4", label: "L4 — Genesis", shortLabel: "L4", layerId: "genesis", currency: "EP", icon: <Egg className="w-3 h-3" /> },
  { id: "L5", label: "L5 — Apotheosis", shortLabel: "L5", layerId: "apotheosis", currency: "EP", icon: <Sparkles className="w-3 h-3" /> },
  { id: "L6", label: "L6 — Singularity", shortLabel: "L6", layerId: "singularity", currency: "EP", icon: <Circle className="w-3 h-3" /> },
  { id: "L7", label: "L7 — Bio-Engineering", shortLabel: "L7", layerId: "omnipotence", currency: "EP", icon: <Atom className="w-3 h-3" /> },
  { id: "L8", label: "L8 — Divine Alliance", shortLabel: "L8", layerId: "divinity", currency: "EP", icon: <Church className="w-3 h-3" /> },
  { id: "L9", label: "L9 — Divine War", shortLabel: "L9", layerId: "infinity", currency: "EP", icon: <InfinityIcon className="w-3 h-3" /> },
  { id: "L10", label: "L10 — Ascension", shortLabel: "L10", layerId: "eternity", currency: "EP", icon: <Star className="w-3 h-3" /> },
];

// Map a tab id to the filter predicate that selects which upgrades belong to it.
// Main tab → all universal-category upgrades (PP-purchased boosts + auto-buyers).
// L1 tab   → all EP-category upgrades (automation/economy/acceleration/prestige).
// L2-L10   → upgrades with `requiresLayer === <layerId>` (and category "layer").
function tabFilter(tab: ShopTab, up: UpgradeDef): boolean {
  if (tab.id === "main") return up.category === "universal";
  if (tab.id === "L1") {
    // Existing EP shop: automation, economy, acceleration, prestige (NOT universal, NOT layer).
    return up.category === "automation" || up.category === "economy" || up.category === "acceleration" || up.category === "prestige";
  }
  // L2-L10: filter by requiresLayer.
  return !!tab.layerId && up.requiresLayer === tab.layerId;
}

// Map a layer id → its numeric rank (L1=1, L2=2, ... L10=10). Used for the
// "automation unlock chain" hint on each layer tab.
const LAYER_RANK: Record<string, number> = {
  evolution: 1, enlightenment: 2, transcendence: 3, genesis: 4, apotheosis: 5,
  singularity: 6, omnipotence: 7, divinity: 8, infinity: 9, eternity: 10,
};

export function ShopModal() {
  const showShop = useGameStore((s) => s.showShop);
  const setShowShop = useGameStore((s) => s.setShowShop);
  const evolutionPoints = useGameStore((s) => s.evolutionPoints);
  const prestigePoints = useGameStore((s) => s.prestigePoints);
  const upgrades = useGameStore((s) => s.upgrades);
  const galacticWins = useGameStore((s) => s.galacticWins);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const buyUniversalUpgrade = useGameStore((s) => s.buyUniversalUpgrade);

  // PP shop is unlocked once Enlightenment (L2) is reached — the player has
  // earned their first Prestige Points via trials + background sims.
  // Until then, the shop shows the OLD flat EP-only layout.
  const ppUnlocked = !!unlockedLayers?.enlightenment;
  const epAutoConverterOwned = (upgrades["ep_auto_converter"] || 0) > 0;

  // Currently selected tab. Defaults to "main" once PP is unlocked; before
  // PP unlock, defaults to "L1" (the only visible tab in the flat layout).
  const [activeTab, setActiveTab] = useState<string>(ppUnlocked ? "main" : "L1");

  // Filtering rules:
  // - Hide upgrades whose `requiresLayer` is not yet unlocked.
  // - Hide upgrades whose `requiresWins` is far-future (> galacticWins + 3).
  const isVisible = useMemo(() => {
    return (up: UpgradeDef): boolean => {
      if (up.requiresLayer && !unlockedLayers?.[up.requiresLayer]) return false;
      if (up.requiresWins && up.requiresWins > galacticWins + 3) return false;
      return true;
    };
  }, [unlockedLayers, galacticWins]);

  // Decide which tabs to render. The "main" + "L1" tabs always render; the
  // L2-L10 tabs only render when their layer is unlocked.
  const visibleTabs = useMemo(() => {
    return SHOP_TABS.filter((t) => {
      if (!t.layerId) return true; // main + L1 always visible
      return !!unlockedLayers?.[t.layerId];
    });
  }, [unlockedLayers]);

  // Derive the effective active tab during render (instead of an effect that
  // calls setState synchronously — which violates `react-hooks/set-state-in-effect`).
  // If the stored activeTab is no longer visible (e.g. the player lost a layer —
  // shouldn't normally happen, but be defensive), fall back to "main" or "L1".
  const effectiveTab = visibleTabs.find((t) => t.id === activeTab)
    ? activeTab
    : (ppUnlocked ? "main" : "L1");

  // ===== FLAT LAYOUT (PP not yet unlocked) =====
  // Old behavior — show all categories in a flat list. This is preserved so
  // the very first prestige shop experience is unchanged.
  if (!ppUnlocked) {
    return (
      <Dialog open={showShop} onOpenChange={setShowShop}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto glass-strong">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Store className="w-5 h-5" />
              Evolution Shop
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center justify-between">
                <span>Prestige upgrades persist across all runs.</span>
                <Badge variant="outline" className="text-amber-400 border-amber-400/40">
                  🌱 {formatNumber(evolutionPoints, 0)} EP
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
          <FlatUpgradeList
            isVisible={isVisible}
            upgrades={upgrades}
            evolutionPoints={evolutionPoints}
            galacticWins={galacticWins}
            buyUpgrade={buyUpgrade}
          />
          <div className="text-[0.65rem] text-muted-foreground px-1 pt-1">
            <span className="text-amber-300/80">Evolution Points</span> are earned
            each time you prestige. Reach Layer 2 (Enlightenment) to unlock Prestige
            Points and the tabbed PP shop with auto-buyers.
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setShowShop(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ===== TABBED LAYOUT (PP unlocked — L2+) =====
  return (
    <Dialog open={showShop} onOpenChange={setShowShop}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-hidden glass-strong flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Store className="w-5 h-5" />
            Evolution Shop
            <span className="text-xs font-normal text-muted-foreground ml-1">
              (Prestige Points + Layer Tabs)
            </span>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span>Prestige upgrades persist across all runs. PP unlocks auto-buyers.</span>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-amber-400 border-amber-400/40">
                  🌱 {formatNumber(evolutionPoints, 0)} EP
                  {epAutoConverterOwned && (
                    <span className="ml-1 text-[0.6rem] text-fuchsia-300/80 italic">auto→PP</span>
                  )}
                </Badge>
                <Badge variant="outline" className="text-fuchsia-300 border-fuchsia-400/40">
                  ✦ {formatNumber(prestigePoints, 0)} PP
                </Badge>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={effectiveTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar — horizontally scrollable so all 11 tabs fit on mobile. */}
          <TabsList className="h-9 w-full overflow-x-auto no-scrollbar justify-start gap-0.5">
            {visibleTabs.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="h-7 px-2.5 text-xs flex-1 min-w-[60px]"
                title={t.label}
              >
                {t.icon}
                <span className="ml-1">{t.shortLabel}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab contents — each scrollable. */}
          <div className="flex-1 overflow-y-auto pr-1 pt-2">
            {visibleTabs.map((tab) => {
              const list = UPGRADES.filter((u) => tabFilter(tab, u) && isVisible(u));
              const isMain = tab.id === "main";
              const isL1 = tab.id === "L1";
              const currency = tab.currency;
              const canAffordCurrency = currency === "PP" ? prestigePoints : evolutionPoints;
              const onBuy = currency === "PP" ? buyUniversalUpgrade : buyUpgrade;
              const tabLayerId = tab.layerId;
              const tabLayerRank = tabLayerId ? LAYER_RANK[tabLayerId] : 0;
              return (
                <TabsContent key={tab.id} value={tab.id} className="mt-0">
                  <div className="space-y-2">
                    {/* Tab header — describes what's in this tab. */}
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-1.5">
                        {tab.icon}
                        {tab.label}
                      </h3>
                      <span className="text-[0.65rem] text-muted-foreground">
                        {isMain
                          ? "Universal upgrades purchased with Prestige Points. Auto-buyers run on timers in the background."
                          : isL1
                            ? "EP shop — automation, economy, acceleration, prestige. Purchased with Evolution Points."
                            : `Layer ${tabLayerRank} upgrades — purchased with EP, scale with layer depth.`}
                      </span>
                    </div>

                    {/* L1 EP-auto-converter notice — appears when the upgrade is owned. */}
                    {isL1 && epAutoConverterOwned && (
                      <div className="px-3 py-1.5 rounded-md border border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        EP is now auto-converted to PP every tick at 1:1. EP upgrades still cost EP (held briefly before conversion).
                      </div>
                    )}

                    {/* Main tab — highlight the automation unlock chain. */}
                    {isMain && (
                      <div className="px-3 py-1.5 rounded-md border border-cyan-400/40 bg-cyan-500/10 text-cyan-200 text-xs flex items-center gap-1.5">
                        <Layers className="w-3 h-3 shrink-0" />
                        Each auto-buyer unlocks when the NEXT layer unlocks (e.g. Auto-Light Stars appears once L3 is reached).
                      </div>
                    )}

                    {/* Empty-state — tab has no upgrades yet (rare; would mean layer
                        unlocked but no layer-specific upgrades defined). */}
                    {list.length === 0 && (
                      <div className="text-xs text-muted-foreground px-1 py-4">
                        No upgrades available in this tab yet.
                      </div>
                    )}

                    {/* Upgrade grid — 1 col mobile, 2 col sm+. */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {list.map((up) => {
                        const owned = upgrades[up.id] || 0;
                        const maxed = owned >= up.maxLevel;
                        const requiresWins = !!(up.requiresWins && galacticWins < (up.requiresWins || 0));
                        const cost = upgradeCost(up, owned);
                        const canAfford = canAffordCurrency >= cost;
                        const layerName = up.requiresLayer ? (LAYER_DISPLAY_NAMES[up.requiresLayer] || up.requiresLayer) : null;
                        return (
                          <div
                            key={up.id}
                            className={`stat-card ${maxed ? "opacity-70" : requiresWins ? "opacity-40" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                {maxed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : requiresWins ? (
                                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                                ) : null}
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold truncate">{up.name}</div>
                                  <div className="flex flex-wrap items-center gap-1">
                                    <Badge variant="outline" className="text-[0.6rem]">
                                      Lv {owned}/{up.maxLevel}
                                    </Badge>
                                    {layerName && (
                                      <Badge variant="outline" className="text-[0.55rem] text-cyan-300 border-cyan-400/40 flex items-center gap-0.5">
                                        <Layers className="w-2.5 h-2.5" />
                                        {layerName}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 leading-snug">{up.desc(owned)}</p>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold ${canAfford ? (currency === "PP" ? "text-fuchsia-300" : "text-amber-400") : "text-red-400"}`}>
                                {currency === "PP" ? "✦" : "🌱"} {formatNumber(cost, 0)} {currency}
                              </span>
                              <Button
                                size="sm"
                                className="h-7"
                                disabled={maxed || requiresWins || !canAfford}
                                onClick={() => onBuy(up.id)}
                              >
                                {maxed ? "Maxed" : requiresWins ? `Need ${up.requiresWins} wins` : "Upgrade"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </div>
        </Tabs>

        {/* Footer — explains the two-currency system. */}
        <div className="text-[0.65rem] text-muted-foreground px-1 pt-2 border-t border-border/40 mt-2">
          <span className="text-fuchsia-300/80">Universal upgrades</span> are purchased with Prestige Points,
          earned by completing trials, purchasing foresight nodes, performing rituals & blood pacts, enacting
          divine laws, and binding relics. <span className="text-amber-300/80">Layer-specific upgrades</span> are
          purchased with EP and only appear once their layer is unlocked.{" "}
          {epAutoConverterOwned && (
            <span className="text-fuchsia-300/80 italic">
              EP Auto-Converter is active — EP is being auto-converted to PP every tick.
            </span>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShowShop(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== FLAT LAYOUT — old shop (pre-PP unlock) =====
// Renders the same category-grouped flat list the shop used to have.
// PP is not yet earned so universal upgrades are hidden (the player can't
// afford them anyway).
function FlatUpgradeList({
  isVisible,
  upgrades,
  evolutionPoints,
  galacticWins,
  buyUpgrade,
}: {
  isVisible: (up: UpgradeDef) => boolean;
  upgrades: Record<string, number>;
  evolutionPoints: number;
  galacticWins: number;
  buyUpgrade: (id: string) => void;
}) {
  const categories = [
    { id: "automation", label: "Automation" },
    { id: "economy", label: "Economy" },
    { id: "acceleration", label: "Acceleration" },
    { id: "prestige", label: "Prestige" },
  ] as const;

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const list = UPGRADES.filter((u) => u.category === cat.id && isVisible(u));
        if (list.length === 0) return null;
        return (
          <div key={cat.id}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              {cat.label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {list.map((up) => {
                const owned = upgrades[up.id] || 0;
                const maxed = owned >= up.maxLevel;
                const requiresWins = !!(up.requiresWins && galacticWins < (up.requiresWins || 0));
                const cost = upgradeCost(up, owned);
                const canAfford = evolutionPoints >= cost;
                const layerName = up.requiresLayer ? (LAYER_DISPLAY_NAMES[up.requiresLayer] || up.requiresLayer) : null;
                return (
                  <div
                    key={up.id}
                    className={`stat-card ${maxed ? "opacity-70" : requiresWins ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {maxed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : requiresWins ? (
                          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : null}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">{up.name}</div>
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge variant="outline" className="text-[0.6rem]">
                              Lv {owned}/{up.maxLevel}
                            </Badge>
                            {layerName && (
                              <Badge variant="outline" className="text-[0.55rem] text-cyan-300 border-cyan-400/40 flex items-center gap-0.5">
                                <Layers className="w-2.5 h-2.5" />
                                {layerName}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 leading-snug">{up.desc(owned)}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${canAfford ? "text-amber-400" : "text-red-400"}`}>
                        🌱 {formatNumber(cost, 0)} EP
                      </span>
                      <Button
                        size="sm"
                        className="h-7"
                        disabled={maxed || requiresWins || !canAfford}
                        onClick={() => buyUpgrade(up.id)}
                      >
                        {maxed ? "Maxed" : requiresWins ? `Need ${up.requiresWins} wins` : "Upgrade"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
