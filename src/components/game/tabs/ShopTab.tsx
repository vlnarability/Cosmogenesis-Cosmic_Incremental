"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/game/state/store";
import { UPGRADES, upgradeCost } from "@/game/data/upgrades";
import { ARCHETYPES } from "@/game/data/archetypes";
import { GOVERNMENTS } from "@/game/data/governments";
import { FORESIGHT_ROUTES } from "@/game/data/foresight";
import type { UpgradeDef } from "@/game/state/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Lock, CheckCircle2, Sparkles, Layers, Star, Egg, Triangle, Circle, Atom, Church, Infinity as InfinityIcon, Settings2, Users, Landmark, Eye } from "lucide-react";
import { formatNumber } from "../shared/format";
import { EmptyState } from "../shared/EmptyState";
import { PurchaseErrorBanner } from "../shared/PurchaseErrorBanner";

// ============================================================
// ShopTab — LAYER-AS-TAB + CURRENCY-UNIFICATION refactor.
//
// What used to be ShopModal is now a TAB page (no Dialog wrapper).
// Renders inline in the main content area when `currentTab === "shop"`.
//
// CURRENCY-UNIFICATION — the shop now uses a SINGLE currency (Divinity)
// for ALL purchases. The legacy `evolutionPoints` (EP) + `prestigePoints`
// (PP) fields are no longer spent here; `buyUpgrade` and
// `buyUniversalUpgrade` both spend Divinity now. This dramatically
// simplifies the shop UI — there's only one currency badge in the
// header, and the player no longer has to mentally convert EP↔PP↔Div.
//
// MULTI-ROW-TABS — the tab bar uses a multi-row layout when many layer
// tabs are visible (sm:grid-cols-2 → sm:grid-cols-3 → md:grid-cols-4).
// This prevents the row from getting cut off when L7+ layer tabs are
// unlocked.
// ============================================================

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

// Tab definitions for the tabbed shop. CURRENCY-UNIFICATION — every tab
// now uses Divinity (D) as its currency. The legacy `currency: "EP" |
// "PP"` field is kept for back-compat but no longer drives any logic.
type ShopTabDef = {
  id: string;
  label: string;
  shortLabel: string;
  layerId?: string;        // if set, this tab is only shown when this layer is unlocked
  icon?: React.ReactNode;
  /** @deprecated CURRENCY-UNIFICATION — all tabs now use Divinity. Kept for back-compat. */
  currency: "PP" | "EP";
};

const SHOP_TABS: ShopTabDef[] = [
  { id: "main", label: "Main", shortLabel: "Main", currency: "PP", icon: <Sparkles className="w-3 h-3" /> },
  { id: "L1", label: "L1 — Evolution", shortLabel: "L1", currency: "EP", icon: <Store className="w-3 h-3" /> },
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
// Main tab → all universal-category upgrades (Divinity-purchased boosts + auto-buyers).
// L1 tab   → all EP-category upgrades (automation/economy/acceleration/prestige).
// L2-L10   → upgrades with `requiresLayer === <layerId>` (and category "layer").
//
// AUTOBUYER-SETTINGS / EP-AUTO-CONVERTER — universal upgrades (category
// "universal") like the auto-buyers ONLY show in the Main tab. Previously
// they leaked into the L2+ tabs because they have `requiresLayer:
// "enlightenment"` etc. — the L2+ tabs now exclude category "universal"
// so they no longer appear in two places.
function tabFilter(tab: ShopTabDef, up: UpgradeDef): boolean {
  if (tab.id === "main") return up.category === "universal";
  if (tab.id === "L1") {
    // Existing EP shop: automation, economy, acceleration, prestige (NOT universal, NOT layer).
    return up.category === "automation" || up.category === "economy" || up.category === "acceleration" || up.category === "prestige";
  }
  // L2-L10: filter by requiresLayer, AND only "layer" category. Universal
  // upgrades that gate on a layer belong ONLY in the Main tab.
  return !!tab.layerId && up.requiresLayer === tab.layerId && up.category === "layer";
}

// Map a layer id → its numeric rank (L1=1, L2=2, ... L10=10). Used for the
// "automation unlock chain" hint on each layer tab.
const LAYER_RANK: Record<string, number> = {
  evolution: 1, enlightenment: 2, transcendence: 3, genesis: 4, apotheosis: 5,
  singularity: 6, omnipotence: 7, divinity: 8, infinity: 9, eternity: 10,
};

export function ShopTab() {
  // CURRENCY-UNIFICATION — only `divinity` is used for purchases.
  const divinity = useGameStore((s) => s.divinity);
  const upgrades = useGameStore((s) => s.upgrades);
  const galacticWins = useGameStore((s) => s.galacticWins);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const buyUniversalUpgrade = useGameStore((s) => s.buyUniversalUpgrade);
  // DEBUG-FREE-BUY — when enabled, all affordability checks are bypassed;
  // costs render as "FREE / 0" and purchase buttons stay enabled.
  const debugFreeBuy = useGameStore((s) => s.debugFreeBuy);

  const ppUnlocked = !!unlockedLayers?.enlightenment;

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
      <div className="space-y-3">
        {/* Header — title + currency badge (Divinity-only) */}
        <div className="stat-card flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-300" />
            <div>
              <div className="text-lg font-semibold">Evolution Shop</div>
              <div className="text-xs text-muted-foreground">
                Prestige upgrades persist across all runs. Reach Layer 2 (Enlightenment) to unlock the tabbed PP shop.
              </div>
            </div>
          </div>
          {/* CURRENCY-UNIFICATION — single Divinity badge replaces the old
              dual "EP / PP" badges. */}
          <Badge variant="outline" className="text-violet-300 border-violet-400/40">
            ✨ {formatNumber(divinity, 0)} Divinity
          </Badge>
        </div>

        {/* P7 — Inline purchase error banner (auto-fades after 2s). */}
        <PurchaseErrorBanner />
        <FlatUpgradeList
          isVisible={isVisible}
          upgrades={upgrades}
          divinity={divinity}
          galacticWins={galacticWins}
          buyUpgrade={buyUpgrade}
          debugFreeBuy={debugFreeBuy}
        />
        <div className="text-[0.65rem] text-muted-foreground px-1 pt-1">
          <span className="text-amber-300/80">Divinity</span> is earned each time you prestige
          and from background simulations. Spend it on permanent upgrades that persist across runs.
        </div>
      </div>
    );
  }

  // ===== TABBED LAYOUT (PP unlocked — L2+) =====
  return (
    <div className="space-y-3">
      {/* Header — title + currency badge */}
      <div className="stat-card flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-amber-300" />
          <div>
            <div className="text-lg font-semibold">Evolution Shop</div>
            <div className="text-xs text-muted-foreground">
              Prestige upgrades persist across all runs. Auto-buyers run on timers in the background.
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-violet-300 border-violet-400/40">
          ✨ {formatNumber(divinity, 0)} Divinity
        </Badge>
      </div>

      <Tabs value={effectiveTab} onValueChange={setActiveTab} className="flex flex-col">
        {/* MULTI-ROW-TABS — tab bar uses a flex-wrap layout so all 11
            tabs fit even at L10. Each tab button has shrink-0 + a
            min-width so it doesn't get crushed when wrapping. The old
            single-row + overflow-x-auto design got cut off when many
            layer tabs were unlocked; this multi-row layout fixes it. */}
        <TabsList className="h-auto w-full flex flex-wrap justify-start gap-0.5 mb-2">
          {visibleTabs.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="h-8 px-2.5 text-xs min-w-[70px] shrink-0"
              title={t.label}
            >
              {t.icon}
              <span className="ml-1">{t.shortLabel}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab contents — each scrollable. */}
        <div className="pr-1 pt-1">
          {/* P7 — Inline purchase error banner (auto-fades after 2s via
              usePurchaseError hook). Shows the latest failure message from
              buyUpgrade / buyUniversalUpgrade. */}
          <PurchaseErrorBanner />
          {visibleTabs.map((tab) => {
            const list = UPGRADES.filter((u) => tabFilter(tab, u) && isVisible(u));
            const isMain = tab.id === "main";
            const isL1 = tab.id === "L1";
            const tabLayerId = tab.layerId;
            const tabLayerRank = tabLayerId ? LAYER_RANK[tabLayerId] : 0;
            // CURRENCY-UNIFICATION — onBuy always uses buyUpgrade now
            // (both buyUpgrade and buyUniversalUpgrade spend Divinity).
            // We still call buyUniversalUpgrade for universal-category
            // upgrades so the legacy log message mentions the right
            // action; both actions spend Divinity so the behavior is
            // identical.
            const onBuy = isMain ? buyUniversalUpgrade : buyUpgrade;
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
                          ? "EP shop — automation, economy, acceleration, prestige. Purchased with Divinity."
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

                  {/* AUTOBUYER-SETTINGS — collapsible settings panel that
                      appears at the top of the Main tab once the player
                      owns any autobuyer (or reaches L2, where the foresight
                      route picker becomes available). Lets the player
                      direct what each autobuyer drifts towards. */}
                  {isMain && (
                    <AutobuyerSettingsPanel
                      hasSystemBuyer={(upgrades["auto_system_buyer"] || 0) > 0}
                      hasTechBuyer={(upgrades["auto_tech_buyer"] || 0) > 0}
                    />
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
                            {/* CURRENCY-UNIFICATION — cost shown as
                                "✨ N Divinity" (or "FREE" in debug mode).
                                The legacy "🌱 N EP" / "✦ N PP" labels
                                are gone. */}
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

      {/* Footer — explains the unified currency system. */}
      <div className="text-[0.65rem] text-muted-foreground px-1 pt-2 border-t border-border/40 mt-2">
        <span className="text-violet-300/80">Divinity</span> is the single
        shop currency — earned at prestige, from background simulations,
        and from Divine Market transactions. Spend it on any upgrade across
        all layer tabs. Auto-buyers unlock when the next layer is reached.
      </div>
    </div>
  );
}

// ===== FLAT LAYOUT — old shop (pre-PP unlock) =====
// Renders the same category-grouped flat list the shop used to have.
// PP is not yet earned so universal upgrades are hidden (the player can't
// afford them anyway).
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
  buyUpgrade: (upgradeId: string) => void;
  debugFreeBuy: boolean;
}) {
  // Group upgrades by category for display.
  const grouped = useMemo(() => {
    const groups: Record<string, UpgradeDef[]> = {};
    for (const up of UPGRADES) {
      if (!isVisible(up)) continue;
      // Skip universal upgrades in the flat layout — they need PP unlocked.
      if (up.category === "universal") continue;
      // Skip layer-specific upgrades (requiresLayer) — they appear in the
      // tabbed shop, not the flat one.
      if (up.requiresLayer) continue;
      if (!groups[up.category]) groups[up.category] = [];
      groups[up.category].push(up);
    }
    return groups;
  }, [isVisible]);

  const CATEGORY_LABELS: Record<string, string> = {
    automation: "Automation",
    economy: "Economy",
    acceleration: "Acceleration",
    prestige: "Prestige",
  };

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([cat, ups]) => (
        <div key={cat} className="stat-card">
          <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-2">
            {CATEGORY_LABELS[cat] || cat}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ups.map((up) => {
              const owned = upgrades[up.id] || 0;
              const maxed = owned >= up.maxLevel;
              const requiresWins = !!(up.requiresWins && galacticWins < (up.requiresWins || 0));
              const cost = upgradeCost(up, owned);
              const canAfford = debugFreeBuy || divinity >= cost;
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
                        <Badge variant="outline" className="text-[0.6rem]">
                          Lv {owned}/{up.maxLevel}
                        </Badge>
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
      ))}
    </div>
  );
}

// ============================================================================
// AutobuyerSettingsPanel — appears at the top of the Main tab.
// Lets the player direct what each autobuyer drifts towards:
//   • Auto-Builder archetype target (system purchasing)
//   • Auto-Researcher archetype target (tech purchasing)
//   • Preferred government (overrides the auto-pick at Empire stage)
//   • Preferred foresight route (auto-applied at L2+)
//
// All four controls are null-tolerant — selecting "None" clears the
// preference and the autobuyer reverts to its default "cheapest affordable"
// behavior. The panel only renders when the player has unlocked at least
// one autobuyer (otherwise there's nothing to configure).
// ============================================================================
function AutobuyerSettingsPanel({
  hasSystemBuyer,
  hasTechBuyer,
}: {
  hasSystemBuyer: boolean;
  hasTechBuyer: boolean;
}) {
  const settings = useGameStore((s) => s.autoBuyerSettings);
  const setSystemTarget = useGameStore((s) => s.setAutoBuyerSystemTarget);
  const setTechTarget = useGameStore((s) => s.setAutoBuyerTechTarget);
  const setPreferredGov = useGameStore((s) => s.setPreferredGovernment);
  const setPreferredRoute = useGameStore((s) => s.setPreferredForesightRoute);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const [expanded, setExpanded] = useState(false);

  const isL2Plus = !!unlockedLayers?.enlightenment;
  // Show the panel if any autobuyer is owned OR L2+ is unlocked (foresight
  // route picker is always available at L2+).
  const hasAnything = hasSystemBuyer || hasTechBuyer || isL2Plus;
  if (!hasAnything) return null;

  return (
    <div className="stat-card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 text-left"
        aria-expanded={expanded}
      >
        <Settings2 className="w-4 h-4 text-cyan-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Autobuyer Settings</div>
          <div className="text-[0.65rem] text-muted-foreground truncate">
            Direct what your autobuyers drift towards — archetype, government, foresight route.
          </div>
        </div>
        <Badge variant="outline" className="text-[0.6rem] text-cyan-300 border-cyan-400/40 shrink-0">
          {expanded ? "Hide" : "Show"}
        </Badge>
      </button>
      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Auto-Builder archetype target */}
          {hasSystemBuyer && (
            <div className="space-y-1.5">
              <label className="text-[0.7rem] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                Auto-Builder drift target
              </label>
              <Select
                value={settings?.systemTarget ?? "__none__"}
                onValueChange={(v) => setSystemTarget(v === "__none__" ? null : v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Cheapest (no preference)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Cheapest (no preference)</SelectItem>
                  {ARCHETYPES.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.glyph} {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[0.6rem] text-muted-foreground leading-snug">
                When set, the Auto-Builder prefers systems that grant affinity to this archetype (sorted before cost).
              </p>
            </div>
          )}

          {/* Auto-Researcher archetype target */}
          {hasTechBuyer && (
            <div className="space-y-1.5">
              <label className="text-[0.7rem] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                Auto-Researcher drift target
              </label>
              <Select
                value={settings?.techTarget ?? "__none__"}
                onValueChange={(v) => setTechTarget(v === "__none__" ? null : v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Cheapest (no preference)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Cheapest (no preference)</SelectItem>
                  {ARCHETYPES.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.glyph} {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[0.6rem] text-muted-foreground leading-snug">
                When set, the Auto-Researcher prefers techs that grant affinity to this archetype.
              </p>
            </div>
          )}

          {/* Preferred government — only meaningful at Civilization+ */}
          <div className="space-y-1.5">
            <label className="text-[0.7rem] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Landmark className="w-3 h-3" />
              Preferred government (Empire stage)
            </label>
            <Select
              value={settings?.preferredGovernment ?? "__auto__"}
              onValueChange={(v) => setPreferredGov(v === "__auto__" ? null : v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Auto (from tech branch + archetype)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__auto__">Auto (from tech branch + archetype)</SelectItem>
                {GOVERNMENTS.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.icon} {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[0.6rem] text-muted-foreground leading-snug">
              When you enter the Empire stage, this overrides the auto-pick (which derives from your tech branches and locked archetype).
            </p>
          </div>

          {/* Preferred foresight route — only at L2+ */}
          {isL2Plus && (
            <div className="space-y-1.5">
              <label className="text-[0.7rem] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Preferred foresight route (L2)
              </label>
              <Select
                value={settings?.preferredForesightRoute ?? "__none__"}
                onValueChange={(v) => setPreferredRoute(v === "__none__" ? null : v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="None (no preference)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (no preference)</SelectItem>
                  {FORESIGHT_ROUTES.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.icon} {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[0.6rem] text-muted-foreground leading-snug">
                Cosmetic bonus layer — pick the route whose bonus (production / cap / EP / pop) best fits your build.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
