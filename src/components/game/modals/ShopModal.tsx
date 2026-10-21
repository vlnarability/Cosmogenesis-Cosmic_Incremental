"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/game/state/store";
import { UPGRADES, upgradeCost } from "@/game/data/upgrades";
import type { UpgradeDef } from "@/game/state/types";
import { ARCHETYPES } from "@/game/data/archetypes";
import { GOVERNMENTS } from "@/game/data/governments";
import { FORESIGHT_ROUTES } from "@/game/data/foresight";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Store, Lock, CheckCircle2, Sparkles, Layers, Star, Egg, Triangle, Circle, Atom, Church, Infinity as InfinityIcon, Settings2, ChevronDown } from "lucide-react";
import { formatNumber } from "../shared/format";
import { EmptyState } from "../shared/EmptyState";
import { PurchaseErrorBanner } from "../shared/PurchaseErrorBanner";

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
// Divinity-purchased upgrades (auto-buyers + boosts); each "L{n}" tab holds
// the layer-specific upgrades for that layer (filtered via requiresLayer).
// Layer tabs only render when the corresponding layer is unlocked.
// CURRENCY-UNIFICATION — every tab now spends Divinity (was: Main spent PP,
// L1–L10 spent EP). The `currency` field is kept for cosmetic cost-label
// rendering only; the affordability check uses Divinity uniformly.
type ShopTab = {
  id: string;
  label: string;
  shortLabel: string;
  layerId?: string;        // if set, this tab is only shown when this layer is unlocked
  icon?: React.ReactNode;
  currency: "Div";         // CURRENCY-UNIFICATION — single currency
};

const SHOP_TABS: ShopTab[] = [
  { id: "main", label: "Main", shortLabel: "Main", currency: "Div", icon: <Sparkles className="w-3 h-3" /> },
  { id: "L1", label: "L1 — Evolution", shortLabel: "L1", currency: "Div", icon: <Store className="w-3 h-3" /> },
  { id: "L2", label: "L2 — Enlightenment", shortLabel: "L2", layerId: "enlightenment", currency: "Div", icon: <Star className="w-3 h-3" /> },
  { id: "L3", label: "L3 — Transcendence", shortLabel: "L3", layerId: "transcendence", currency: "Div", icon: <Triangle className="w-3 h-3" /> },
  { id: "L4", label: "L4 — Genesis", shortLabel: "L4", layerId: "genesis", currency: "Div", icon: <Egg className="w-3 h-3" /> },
  { id: "L5", label: "L5 — Apotheosis", shortLabel: "L5", layerId: "apotheosis", currency: "Div", icon: <Sparkles className="w-3 h-3" /> },
  { id: "L6", label: "L6 — Singularity", shortLabel: "L6", layerId: "singularity", currency: "Div", icon: <Circle className="w-3 h-3" /> },
  { id: "L7", label: "L7 — Bio-Engineering", shortLabel: "L7", layerId: "omnipotence", currency: "Div", icon: <Atom className="w-3 h-3" /> },
  { id: "L8", label: "L8 — Divine Alliance", shortLabel: "L8", layerId: "divinity", currency: "Div", icon: <Church className="w-3 h-3" /> },
  { id: "L9", label: "L9 — Divine War", shortLabel: "L9", layerId: "infinity", currency: "Div", icon: <InfinityIcon className="w-3 h-3" /> },
  { id: "L10", label: "L10 — Ascension", shortLabel: "L10", layerId: "eternity", currency: "Div", icon: <Star className="w-3 h-3" /> },
];

// Map a tab id to the filter predicate that selects which upgrades belong to it.
// Main tab → all universal-category upgrades (Divinity-purchased boosts + auto-buyers).
// L1 tab   → all Divinity-category upgrades (automation/economy/acceleration/prestige).
// L2-L10   → upgrades with `requiresLayer === <layerId>` (and category "layer").
function tabFilter(tab: ShopTab, up: UpgradeDef): boolean {
  if (tab.id === "main") return up.category === "universal";
  if (tab.id === "L1") {
    // Existing Divinity shop: automation, economy, acceleration, prestige (NOT universal, NOT layer).
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
  // CURRENCY-UNIFICATION — the shop now spends a single currency (Divinity)
  // for ALL upgrades (was: evolutionPoints for L1–L10 layer upgrades +
  // prestigePoints for Main universal upgrades). `evolutionPoints` and
  // `prestigePoints` are kept on GameState for back-compat but are no
  // longer read by the shop UI.
  const divinity = useGameStore((s) => s.divinity);
  const upgrades = useGameStore((s) => s.upgrades);
  const galacticWins = useGameStore((s) => s.galacticWins);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const buyUniversalUpgrade = useGameStore((s) => s.buyUniversalUpgrade);
  // DEBUG-FREE-BUY — when enabled, all affordability checks are bypassed;
  // costs render as "FREE / 0" and purchase buttons stay enabled.
  const debugFreeBuy = useGameStore((s) => s.debugFreeBuy);

  // AUTOBUYER-SETTINGS — panel gating. Show the targeting panel when the
  // player owns at least one of the base autobuyers OR is at L2+.
  const autoBuyerSettings = useGameStore((s) => s.autoBuyerSettings);
  const setAutoBuyerSystemTarget = useGameStore((s) => s.setAutoBuyerSystemTarget);
  const setAutoBuyerTechTarget = useGameStore((s) => s.setAutoBuyerTechTarget);
  const setPreferredGovernment = useGameStore((s) => s.setPreferredGovernment);
  const setPreferredForesightRoute = useGameStore((s) => s.setPreferredForesightRoute);
  const hasAutoSystemBuyer = (upgrades["auto_system_buyer"] || 0) > 0;
  const hasAutoTechBuyer = (upgrades["auto_tech_buyer"] || 0) > 0;
  const showAutobuyerSettings =
    !!unlockedLayers?.enlightenment || hasAutoSystemBuyer || hasAutoTechBuyer;

  // Shop unlocks the tabbed layout once Enlightenment (L2) is reached.
  // Until then, the shop shows the OLD flat Divinity-only layout.
  const tabbedUnlocked = !!unlockedLayers?.enlightenment;

  // Currently selected tab. Defaults to "main" once L2 is unlocked; before
  // L2, defaults to "L1" (the only visible tab in the flat layout).
  const [activeTab, setActiveTab] = useState<string>(tabbedUnlocked ? "main" : "L1");

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
    : (tabbedUnlocked ? "main" : "L1");

  // ===== FLAT LAYOUT (L2 not yet unlocked) =====
  // Old behavior — show all categories in a flat list. This is preserved so
  // the very first prestige shop experience is unchanged.
  if (!tabbedUnlocked) {
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
                <Badge variant="outline" className="text-violet-300 border-violet-400/40">
                  ✨ {formatNumber(divinity, 0)} Divinity
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
          {/* P7 — Inline purchase error banner (auto-fades after 2s). */}
          <PurchaseErrorBanner />
          {showAutobuyerSettings && (
            <AutobuyerSettingsPanel
              autoBuyerSettings={autoBuyerSettings}
              hasAutoSystemBuyer={hasAutoSystemBuyer}
              hasAutoTechBuyer={hasAutoTechBuyer}
              setAutoBuyerSystemTarget={setAutoBuyerSystemTarget}
              setAutoBuyerTechTarget={setAutoBuyerTechTarget}
              setPreferredGovernment={setPreferredGovernment}
              setPreferredForesightRoute={setPreferredForesightRoute}
            />
          )}
          <FlatUpgradeList
            isVisible={isVisible}
            upgrades={upgrades}
            divinity={divinity}
            galacticWins={galacticWins}
            buyUpgrade={buyUpgrade}
            debugFreeBuy={debugFreeBuy}
          />
          <div className="text-[0.65rem] text-muted-foreground px-1 pt-1">
            <span className="text-violet-300/80">Divinity</span> is the unified shop
            currency — earned each time you prestige and folded into your balance
            automatically. Reach Layer 2 (Enlightenment) to unlock the tabbed shop
            with auto-buyers + layer-specific upgrades.
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setShowShop(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ===== TABBED LAYOUT (L2 unlocked) =====
  return (
    <Dialog open={showShop} onOpenChange={setShowShop}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-hidden glass-strong flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Store className="w-5 h-5" />
            Evolution Shop
            <span className="text-xs font-normal text-muted-foreground ml-1">
              (Divinity + Layer Tabs)
            </span>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span>Prestige upgrades persist across all runs. Spend Divinity on auto-buyers + boosts.</span>
              <Badge variant="outline" className="text-violet-300 border-violet-400/40">
                ✨ {formatNumber(divinity, 0)} Divinity
              </Badge>
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
            {/* P7 — Inline purchase error banner (auto-fades after 2s via
                usePurchaseError hook). Shows the latest failure message from
                buyUpgrade / buyUniversalUpgrade. */}
            <PurchaseErrorBanner />

            {/* AUTOBUYER-SETTINGS — targeting panel. Visible whenever the
                player owns any autobuyer OR is at L2+. Lives at the top of
                the tab content area so it stays in view across all tabs. */}
            {showAutobuyerSettings && (
              <AutobuyerSettingsPanel
                autoBuyerSettings={autoBuyerSettings}
                hasAutoSystemBuyer={hasAutoSystemBuyer}
                hasAutoTechBuyer={hasAutoTechBuyer}
                setAutoBuyerSystemTarget={setAutoBuyerSystemTarget}
                setAutoBuyerTechTarget={setAutoBuyerTechTarget}
                setPreferredGovernment={setPreferredGovernment}
                setPreferredForesightRoute={setPreferredForesightRoute}
              />
            )}

            {visibleTabs.map((tab) => {
              const list = UPGRADES.filter((u) => tabFilter(tab, u) && isVisible(u));
              const isMain = tab.id === "main";
              const isL1 = tab.id === "L1";
              // CURRENCY-UNIFICATION — all tabs now spend Divinity. The
              // `onBuy` callback still differs (universal vs. layer) but
              // the affordability check uses the same currency uniformly.
              const onBuy = isMain ? buyUniversalUpgrade : buyUpgrade;
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
                          ? "Universal upgrades purchased with Divinity. Auto-buyers run on timers in the background."
                          : isL1
                            ? "Divinity shop — automation, economy, acceleration, prestige."
                            : `Layer ${tabLayerRank} upgrades — purchased with Divinity, scale with layer depth.`}
                      </span>
                    </div>

                    {/* Main tab — highlight the automation unlock chain. */}
                    {isMain && (
                      <div className="px-3 py-1.5 rounded-md border border-cyan-400/40 bg-cyan-500/10 text-cyan-200 text-xs flex items-center gap-1.5">
                        <Layers className="w-3 h-3 shrink-0" />
                        Each auto-buyer unlocks when the NEXT layer unlocks (e.g. Auto-Light Stars appears once L3 is reached).
                      </div>
                    )}

                    {/* P7 — Empty state: layer tab has no upgrades available yet. */}
                    {list.length === 0 && (
                      <EmptyState
                        compact
                        icon={<Store className="w-6 h-6" />}
                        title="No upgrades available for this layer yet."
                        description="This layer is unlocked, but no layer-specific upgrades have been defined for it. Check back later."
                      />
                    )}

                    {/* Upgrade grid — 1 col mobile, 2 col sm+. */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {list.map((up) => {
                        const owned = upgrades[up.id] || 0;
                        const maxed = owned >= up.maxLevel;
                        const requiresWins = !!(up.requiresWins && galacticWins < (up.requiresWins || 0));
                        const cost = upgradeCost(up, owned);
                        // CURRENCY-UNIFICATION — affordability check uses
                        // Divinity uniformly; debugFreeBuy bypasses it.
                        const canAfford = debugFreeBuy || divinity >= cost;
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
                              <span className={`text-xs font-bold ${debugFreeBuy ? "text-emerald-400" : canAfford ? "text-violet-300" : "text-red-400"}`}>
                                {debugFreeBuy ? "FREE" : `✨ ${formatNumber(cost, 0)} Divinity`}
                              </span>
                              <Button
                                size="sm"
                                className="h-7"
                                disabled={maxed || requiresWins || !(debugFreeBuy || canAfford)}
                                onClick={() => onBuy(up.id)}
                              >
                                {maxed ? "Maxed" : requiresWins ? `Need ${up.requiresWins} wins` : debugFreeBuy ? "Free Upgrade" : "Upgrade"}
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

        {/* Footer — explains the unified-currency system. */}
        <div className="text-[0.65rem] text-muted-foreground px-1 pt-2 border-t border-border/40 mt-2">
          <span className="text-violet-300/80">Divinity</span> is the unified shop
          currency — earned each time you prestige and from layer activity.
          All upgrades — universal auto-buyers + layer-specific boosts — spend
          from the same Divinity pool.
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShowShop(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== FLAT LAYOUT — old shop (pre-L2 unlock) =====
// Renders the same category-grouped flat list the shop used to have.
// L2 is not yet unlocked so universal upgrades are hidden (the player can't
// afford them anyway — Divinity is earned at prestige).
function FlatUpgradeList({
  isVisible,
  upgrades,
  divinity,
  galacticWins,
  buyUpgrade,
  debugFreeBuy,
}: {
  isVisible: (up: UpgradeDef) => boolean;
  upgrades: Record<string, number>;
  divinity: number;
  galacticWins: number;
  buyUpgrade: (id: string) => void;
  debugFreeBuy: boolean;
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
                // CURRENCY-UNIFICATION — affordability check uses Divinity.
                const canAfford = debugFreeBuy || divinity >= cost;
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
                      <span className={`text-xs font-bold ${debugFreeBuy ? "text-emerald-400" : canAfford ? "text-violet-300" : "text-red-400"}`}>
                        {debugFreeBuy ? "FREE" : `✨ ${formatNumber(cost, 0)} Divinity`}
                      </span>
                      <Button
                        size="sm"
                        className="h-7"
                        disabled={maxed || requiresWins || !(debugFreeBuy || canAfford)}
                        onClick={() => buyUpgrade(up.id)}
                      >
                        {maxed ? "Maxed" : requiresWins ? `Need ${up.requiresWins} wins` : debugFreeBuy ? "Free Upgrade" : "Upgrade"}
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

// ============================================================
// AUTOBUYER-SETTINGS — targeting panel.
// Collapsible stat-card with 4 Select dropdowns that let the player
// steer the Auto-Builder / Auto-Researcher toward a preferred
// archetype (drift), override the auto-pick government at Empire
// stage, and auto-apply a preferred foresight route at L2+.
// Visible whenever the player owns any autobuyer OR is at L2+.
// ============================================================
function AutobuyerSettingsPanel({
  autoBuyerSettings,
  hasAutoSystemBuyer,
  hasAutoTechBuyer,
  setAutoBuyerSystemTarget,
  setAutoBuyerTechTarget,
  setPreferredGovernment,
  setPreferredForesightRoute,
}: {
  autoBuyerSettings: {
    systemTarget: string | null;
    techTarget: string | null;
    preferredGovernment: string | null;
    preferredForesightRoute: string | null;
  } | undefined;
  hasAutoSystemBuyer: boolean;
  hasAutoTechBuyer: boolean;
  setAutoBuyerSystemTarget: (id: string | null) => void;
  setAutoBuyerTechTarget: (id: string | null) => void;
  setPreferredGovernment: (id: string | null) => void;
  setPreferredForesightRoute: (id: string | null) => void;
}) {
  // shadcn Select treats empty string as the placeholder; we map
  // null → "__none__" so we can render a real "None" option for the
  // nullable targeting slots.
  const NONE = "__none__";
  const toValue = (id: string | null | undefined) => (id ? id : NONE);
  const settings = autoBuyerSettings || {
    systemTarget: null,
    techTarget: null,
    preferredGovernment: null,
    preferredForesightRoute: null,
  };
  const archOptions = ARCHETYPES;
  const govOptions = GOVERNMENTS;
  const routeOptions = FORESIGHT_ROUTES; // currently empty (legacy shim)
  // Disable the targeting selectors for autobuyers the player doesn't own.
  const disableSystem = !hasAutoSystemBuyer;
  const disableTech = !hasAutoTechBuyer;

  return (
    <Collapsible className="stat-card mb-2">
      <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 group">
        <div className="flex items-center gap-2 min-w-0">
          <Settings2 className="w-4 h-4 text-cyan-300 shrink-0" />
          <div className="min-w-0 text-left">
            <div className="text-sm font-semibold">Autobuyer Targeting</div>
            <div className="text-[0.65rem] text-muted-foreground leading-tight">
              Steer the Auto-Builder / Auto-Researcher toward a preferred archetype,
              override the auto-pick government at Empire stage, or set a preferred
              foresight route.
            </div>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Auto-Builder archetype target */}
          <TargetingSelect
            label="Auto-Builder archetype"
            value={toValue(settings.systemTarget)}
            disabled={disableSystem}
            disabledHint={disableSystem ? "Purchase Auto-Builder (Main tab) to enable." : undefined}
            onValueChange={(v) => setAutoBuyerSystemTarget(v === NONE ? null : v)}
            options={archOptions.map((a) => ({ value: a.id, label: a.name }))}
          />
          {/* Auto-Researcher archetype target */}
          <TargetingSelect
            label="Auto-Researcher archetype"
            value={toValue(settings.techTarget)}
            disabled={disableTech}
            disabledHint={disableTech ? "Purchase Auto-Researcher (Main tab) to enable." : undefined}
            onValueChange={(v) => setAutoBuyerTechTarget(v === NONE ? null : v)}
            options={archOptions.map((a) => ({ value: a.id, label: a.name }))}
          />
          {/* Preferred government (auto-applied at Empire stage) */}
          <TargetingSelect
            label="Preferred government"
            value={toValue(settings.preferredGovernment)}
            onValueChange={(v) => setPreferredGovernment(v === NONE ? null : v)}
            options={govOptions.map((g) => ({ value: g.id, label: `${g.icon} ${g.name}` }))}
          />
          {/* Preferred foresight route (auto-applied at L2+) */}
          <TargetingSelect
            label="Preferred foresight route"
            value={toValue(settings.preferredForesightRoute)}
            onValueChange={(v) => setPreferredForesightRoute(v === NONE ? null : v)}
            options={routeOptions.map((r) => ({ value: r.id, label: r.name }))}
            emptyHint="No foresight routes available yet."
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// TargetingSelect — single labelled Select dropdown. Renders an extra
// "None (no preference)" option first; the emptyOptionsHint shows when
// the option list is empty (e.g. foresight routes today).
function TargetingSelect({
  label,
  value,
  onValueChange,
  options,
  disabled,
  disabledHint,
  emptyHint,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  disabledHint?: string;
  emptyHint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">None (no preference)</SelectItem>
          {options.length === 0 && emptyHint && (
            <div className="px-2 py-1.5 text-[0.65rem] text-muted-foreground italic">
              {emptyHint}
            </div>
          )}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {disabled && disabledHint && (
        <div className="text-[0.6rem] text-muted-foreground italic">{disabledHint}</div>
      )}
    </div>
  );
}
