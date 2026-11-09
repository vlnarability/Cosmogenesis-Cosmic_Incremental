"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/game/state/store";
import {
  GALAXY_SYSTEMS,
  GALAXY_SCAN_COST,
  GALAXY_TOTAL_SYSTEMS,
  galaxyClaimCost,
  getGalaxySystemNeighbors,
  summarizeGalaxyBonuses,
} from "@/game/data/galaxyMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Lock,
  Egg,
  Telescope,
  Star,
  Sparkles,
  Gauge,
  Package,
  Users,
  Globe2,
  Orbit,
} from "lucide-react";
import { formatNumber } from "../shared/format";
import { BackgroundLayerBadge } from "../shared/BackgroundLayerBadge";
import { EmptyState } from "../shared/EmptyState";
import { HexMap, generateHexMap, type HexCell } from "../shared/HexMap";
// C4 — drill-down navigation
import { DrillBreadcrumb, type BreadcrumbItem } from "../shared/DrillBreadcrumb";

// Star radius (SVG units). 4 keeps the 50-star map readable inside a
// 520-ish-wide viewBox while still fitting on narrow phone screens (the
// container scrolls horizontally when needed).
const STAR_SIZE = 2;

const BONUS_ICON: Record<string, string> = {
  production: "⚙️",
  capacity: "📦",
  ep: "✨",
  pop: "👥",
};

const BONUS_LABEL: Record<string, string> = {
  divinity: "Divinity",
  cost: "Cost reduction",
  // Legacy keys kept for back-compat with older saves that may use the old
  // bonus type strings. The current GalaxyBonusType is "divinity" | "cost".
  production: "Production",
  capacity: "Capacity",
  ep: "Enlightenment",
  pop: "Population",
};

function bonusPct(value: number): string {
  // Negative values (cost reduction) render as "-X%" instead of "+-X%".
  const pct = Math.round(value * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

export function GenesisContent() {
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const divinity = useGameStore((s) => s.divinity);
  const debugFreeBuy = useGameStore((s) => s.debugFreeBuy);

  const galaxySystems = useGameStore((s) => s.galaxySystems || []);
  const scanGalaxySystem = useGameStore((s) => s.scanGalaxySystem);
  const claimGalaxySystem = useGameStore((s) => s.claimGalaxySystem);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Blocker 2 — transient success flash: highlight the hex that was just
  // scanned or claimed for ~600ms so the player gets immediate visual feedback.
  const [flashHexId, setFlashHexId] = useState<string | null>(null);

  // C4 — drill-down navigation. When GenesisModal is opened via drill from
  // L6 Singularity, drillNav.cosmos.galaxyId is set. We render a breadcrumb
  // at the top so the player can route back to the universe map.
  const drillNav = useGameStore((s) => s.drillNav);
  const drillBackCosmos = useGameStore((s) => s.drillBackCosmos);
  const drillIntoCosmosSystem = useGameStore((s) => s.drillIntoCosmosSystem);
  const cosmosDrill = drillNav?.cosmos;
  const drilledSystemId = cosmosDrill?.systemId ?? null;
  // The selected system follows the drill state when set; otherwise falls
  // back to the local click selection.
  const effectiveSelectedId = drilledSystemId ?? selectedId;

  const isUnlocked = !!unlockedLayers.genesis;

  // C3 — Generate a stable hex map (50 hexes) + map the galaxy systems onto it.
  const hexCoords = useMemo(() => generateHexMap(50), []);
  const hexCells: HexCell[] = useMemo(() => {
    return hexCoords.map((hc, i) => {
      const sys = GALAXY_SYSTEMS[i];
      if (!sys) return { id: hc.id, q: hc.q, r: hc.r, dimmed: true };
      const state = galaxySystems.find((g) => g.id === sys.id);
      const claimed = state?.claimed;
      const explored = state?.explored;
      const isOrigin = i === 0;
      return {
        id: sys.id,
        q: hc.q,
        r: hc.r,
        fill: claimed ? "rgba(34,211,238,0.2)" : explored ? "rgba(30,41,59,0.8)" : "rgba(15,23,42,0.9)",
        stroke: claimed ? "#22d3ee" : explored ? "#475569" : "#334155",
        strokeWidth: claimed ? 2 : 1,
        label: claimed ? "★" : explored ? "·" : "?",
        glow: isOrigin && claimed,
        dimmed: !explored && !claimed,
      };
    });
  }, [hexCoords, galaxySystems]);

  const summary = useMemo(() => summarizeGalaxyBonuses(galaxySystems), [galaxySystems]);
  const claimedCount = summary.claimedCount;
  const exploredCount = galaxySystems.filter((g) => g.explored).length;
  const nextClaimCost = galaxyClaimCost(claimedCount);
  const worldBonus = claimedCount * 10;
  const canScan = debugFreeBuy || divinity >= GALAXY_SCAN_COST;
  const canClaim = debugFreeBuy || divinity >= nextClaimCost;

  const selectedSys = effectiveSelectedId ? GALAXY_SYSTEMS.find((s) => s.id === effectiveSelectedId) : null;
  const selectedState = effectiveSelectedId ? galaxySystems.find((g) => g.id === effectiveSelectedId) : null;

  // Blocker 2 — wrap scan/claim so we can fire a transient flash overlay on
  // the affected hex. The flash is cleared after 600ms to match the
  // animate-ping cycle in HexMap.tsx. The conditional setter ensures that
  // if the player triggers a second flash on a different hex before the
  // first timeout fires, the second flash is not prematurely cleared.
  const handleScan = (id: string) => {
    scanGalaxySystem(id);
    setFlashHexId(id);
    setTimeout(() => setFlashHexId((cur) => (cur === id ? null : cur)), 600);
  };
  const handleClaim = (id: string) => {
    claimGalaxySystem(id);
    setFlashHexId(id);
    setTimeout(() => setFlashHexId((cur) => (cur === id ? null : cur)), 600);
  };

  // C4 — build the cosmos breadcrumb. GenesisModal always sits at the
  // "galaxy" level of the cosmos drill family (it represents the player's
  // starter galaxy). When a system is drilled in, a third crumb appears.
  const cosmosBreadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [{
      id: "universe",
      label: "Universe",
      icon: <Globe2 className="w-3 h-3" />,
      onClick: () => drillBackCosmos("universe"),
      title: "Back to the Universal Map",
    }];
    items.push({
      id: "galaxy",
      label: "Galaxy: Starter Galaxy",
      icon: <Orbit className="w-3 h-3" />,
      onClick: drilledSystemId ? () => drillBackCosmos("galaxy") : undefined,
      isCurrent: !drilledSystemId,
      title: drilledSystemId ? "Back to the starter galaxy's star map" : undefined,
    });
    if (drilledSystemId && selectedSys) {
      items.push({
        id: "system",
        label: selectedSys.name,
        icon: <Telescope className="w-3 h-3" />,
        isCurrent: true,
      });
    }
    return items;
  }, [drilledSystemId, selectedSys, drillBackCosmos]);

  return (
    <>
      {/* LAYER-AS-TAB — was <DialogHeader>/<DialogTitle>/<DialogDescription>
          (Radix primitives that require a <Dialog> parent). Now plain HTML
          since this content renders inline in the tab panel. */}
      <div className="flex flex-col gap-2 text-center sm:text-left mb-3">
        <h2 className="text-lg leading-none font-semibold flex items-center gap-2 flex-wrap">
          <Egg className="w-5 h-5" />
          Genesis (Galaxy Claim)
          <BackgroundLayerBadge layerId="genesis" />
        </h2>
        <p className="text-sm text-muted-foreground flex items-center justify-between flex-wrap gap-2">
          <span>
            Survey 50 star systems on a star map. Scan the unknown, then claim with Divinity to grow the Divine Engine.
          </span>
          <Badge variant="outline" className="text-emerald-300 border-emerald-400/40 whitespace-nowrap">
            {formatNumber(divinity, 0)} Divinity
          </Badge>
        </p>
      </div>

      {/* C4 — Cosmos drill breadcrumb. Always shown so players can route
          back to the Universe (L6) view from inside the starter galaxy. */}
      {isUnlocked && (
        <DrillBreadcrumb
          tone="cosmos"
          items={cosmosBreadcrumbItems}
          className="mb-3"
        />
      )}

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Genesis is sealed.</p>
            <p className="text-xs mt-1">Plant all 4 Genesis Seeds (Layer 3) to unlock Genesis.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            {/* P7 — Empty state banner: shown when no systems claimed yet,
                to guide the player toward their first scan + claim. */}
            {claimedCount === 0 && (
              <div className="lg:col-span-2">
                <EmptyState
                  compact
                  icon={<Telescope className="w-6 h-6" />}
                  title="No systems claimed yet."
                  description="Scan a system to reveal its bonus, then claim it with Divinity. Click an unexplored star (with a ?) to begin."
                />
              </div>
            )}
            {/* C3 — Hex map (replaces the old SVG circle star map) */}
            <div className="stat-card">
              <HexMap
                cells={hexCells}
                hexRadius={28}
                selectedId={effectiveSelectedId}
                onHexClick={(id) => {
                  // C4 — clicking a hex selects it locally AND drills into
                  // the per-system detail view (breadcrumb updates to show
                  // the system as the current location). The existing
                  // scan/claim-on-click behavior is preserved.
                  setSelectedId(id);
                  drillIntoCosmosSystem("galaxy_starter", id);
                  const sys = GALAXY_SYSTEMS.find((s) => s.id === id);
                  const state = galaxySystems.find((g) => g.id === id);
                  if (sys && !state?.explored) handleScan(id);
                  else if (sys && state?.explored && !state?.claimed) handleClaim(id);
                }}
                title="Star System Map"
                subtitle={`${claimedCount}/${GALAXY_TOTAL_SYSTEMS} claimed · ${exploredCount} explored`}
                // UI-FIX: Pass hex tooltip data so hovering shows system info
                hexTooltip={(cell) => {
                  const sys = GALAXY_SYSTEMS.find(s => s.id === cell.id);
                  const state = galaxySystems.find(g => g.id === cell.id);
                  if (!sys) return '';
                  if (!state?.explored) return `${sys.name} — Unexplored (scan: ${GALAXY_SCAN_COST} Divinity)`;
                  if (state?.claimed) return `${sys.name} — ✓ Claimed (${BONUS_LABEL[sys.bonus.type]}: ${bonusPct(sys.bonus.value)})${sys.hasVoidShards ? ' · Void Shards' : ''}`;
                  return `${sys.name} — ${BONUS_LABEL[sys.bonus.type]}: ${bonusPct(sys.bonus.value)} (claim: ${formatNumber(nextClaimCost, 0)} Divinity)${sys.hasVoidShards ? ' · Void Shards' : ''}`;
                }}
                flashId={flashHexId}
              />
              {/* Blocker 1 — explicit Scan/Claim action row. Surfaces the
                  selected system's name + status and gives the player a
                  visible primary button instead of relying on implicit
                  click-to-scan/claim behavior. */}
              <div className="flex gap-2 items-center justify-between mt-2">
                {effectiveSelectedId && selectedSys ? (
                  <>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-cyan-200 truncate">{selectedSys.name}</span>
                      <span className="text-[0.65rem] text-muted-foreground">
                        {selectedState?.claimed ? "Claimed" : selectedState?.explored ? "Scanned" : "Unexplored"}
                      </span>
                    </div>
                    {selectedState?.claimed ? (
                      <Button variant="secondary" disabled className="opacity-70 shrink-0">
                        ✓ Claimed
                      </Button>
                    ) : selectedState?.explored ? (
                      <Button
                        className="bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400/40 shrink-0"
                        disabled={!canClaim}
                        onClick={() => { if (effectiveSelectedId) handleClaim(effectiveSelectedId); }}
                      >
                        ✓ Claim — {formatNumber(nextClaimCost, 0)} Divinity
                      </Button>
                    ) : (
                      <Button
                        className="bg-violet-500 hover:bg-violet-600 text-white border-violet-400/40 shrink-0"
                        disabled={!canScan}
                        onClick={() => { if (effectiveSelectedId) handleScan(effectiveSelectedId); }}
                      >
                        🔍 Scan — {GALAXY_SCAN_COST} Divinity
                      </Button>
                    )}
                  </>
                ) : (
                  <span className="text-[0.7rem] text-muted-foreground">Select a star system on the map above</span>
                )}
              </div>
              {/* UI-FIX: State-aware hint text that changes based on completion */}
              <div className="text-[0.6rem] text-muted-foreground mt-1 leading-relaxed text-center">
                {claimedCount === GALAXY_TOTAL_SYSTEMS ? (
                  <span className="text-cyan-300">★ All {GALAXY_TOTAL_SYSTEMS} systems claimed — Layer 5 unlocked!</span>
                ) : exploredCount === GALAXY_TOTAL_SYSTEMS ? (
                  <>Click an explored hex to{" "}<span className="text-emerald-300">claim</span> ({formatNumber(nextClaimCost, 0)} Divinity).</>
                ) : (
                  <>Click an unexplored hex to{" "}<span className="text-violet-300">scan</span> ({GALAXY_SCAN_COST} Divinity) or an
                  explored hex to{" "}<span className="text-emerald-300">claim</span> ({formatNumber(nextClaimCost, 0)} Divinity).</>
                )}
              </div>
              {selectedSys && selectedState && (
                <div className="mt-2 p-2 rounded-md bg-muted/20 border border-border/40 text-xs space-y-1">
                  <div className="font-semibold text-cyan-200">{selectedSys.name}</div>
                  {selectedState.explored ? (
                    <>
                      <div className="text-muted-foreground">
                        {BONUS_LABEL[selectedSys.bonus.type]}: {bonusPct(selectedSys.bonus.value)}
                      </div>
                      {selectedSys.hasVoidShards && (
                        <div className="text-amber-300">Rare: Void Shards</div>
                      )}
                      <div className={selectedState.claimed ? "text-cyan-300" : "text-emerald-300"}>
                        {selectedState.claimed ? "✓ Claimed" : `Claim: ${formatNumber(nextClaimCost, 0)} Divinity`}
                      </div>
                    </>
                  ) : (
                    <div className="text-violet-300">Unexplored — Scan for {GALAXY_SCAN_COST} Divinity</div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Progress */}
              <div className="stat-card">
                <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1">
                  Galaxy progress
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-cyan-200">{claimedCount}</span>
                  <span className="text-xs text-muted-foreground">/ {GALAXY_TOTAL_SYSTEMS} systems</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-[0.6rem] text-emerald-300 border-emerald-400/40">
                    {formatNumber(divinity, 0)} Divinity
                  </Badge>
                  <Badge variant="outline" className="text-[0.6rem] text-violet-300 border-violet-400/40">
                    {exploredCount} explored
                  </Badge>
                  <Badge variant="outline" className="text-[0.6rem] text-amber-300 border-amber-400/40">
                    {summary.synergyCount} ★ synergy
                  </Badge>
                </div>
              </div>

              {/* Worlds contributed */}
              <div className="stat-card">
                <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1">
                  Worlds contributed
                </div>
                <div className="text-lg font-bold text-amber-200">+{worldBonus}</div>
                <div className="text-[0.6rem] text-muted-foreground">
                  +10 worlds per claimed system (counts toward background simulations cap of 1,000 at Genesis)
                </div>
              </div>

              {/* Active bonuses */}
              <div className="stat-card">
                <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1">
                  Active bonuses
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <BonusRow icon={Gauge}    label="Prod" pct={summary.divinityMult} tone="cyan" />
                  <BonusRow icon={Package}  label="Cap"   pct={summary.costMult}        tone="amber" />
                  <BonusRow icon={Sparkles} label="Div"   pct={summary.divinityMult}    tone="emerald" />
                  <BonusRow icon={Users}   label="Pop"   pct={0}                        tone="violet" />
                </div>
              </div>

              {/* Rare resources */}
              <div className="stat-card">
                <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1">
                  Rare resources collected
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[0.6rem] text-amber-300 border-amber-400/40">
                    <Sparkles className="w-3 h-3 mr-1" /> Void Shards × {summary.voidShardsCount}
                  </Badge>
                </div>
              </div>

              {/* Next costs */}
              <div className="stat-card">
                <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1">
                  Next action
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[0.7rem]">
                    <span className="flex items-center gap-1">
                      <Telescope className="w-3 h-3" /> Scan (unexplored)
                    </span>
                    <Badge
                      variant="outline"
                      className={canScan
                        ? "text-violet-300 border-violet-400/40"
                        : "text-rose-300 border-rose-400/40"}
                    >
                      {GALAXY_SCAN_COST} Divinity
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[0.7rem]">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" /> Claim (explored)
                    </span>
                    <Badge
                      variant="outline"
                      className={canClaim
                        ? "text-cyan-300 border-cyan-400/40"
                        : "text-rose-300 border-rose-400/40"}
                    >
                      {nextClaimCost} Divinity
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="text-[0.6rem] text-muted-foreground leading-relaxed">
                Fill all {GALAXY_TOTAL_SYSTEMS} systems to complete Genesis and unlock{" "}
                <span className="text-cyan-300">Apotheosis (Layer 5)</span>.
              </div>
            </div>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1">
          The galaxy star map is the Genesis gameplay loop — scan unknown systems to reveal their bonus and
          rare resource, then claim them with Divinity. Adjacency matters: systems with 2+ claimed
          neighbors gain a <span className="text-amber-300">+50% synergy bonus</span>.
        </div>
    </>
  );
}

// Small helper component for the bonus summary rows.
function BonusRow({
  icon: Icon,
  label,
  pct,
  tone,
}: {
  icon: typeof Gauge;
  label: string;
  pct: number;
  tone: "cyan" | "amber" | "emerald" | "violet";
}) {
  const toneClasses = {
    cyan: "text-cyan-300 border-cyan-400/40",
    amber: "text-amber-300 border-amber-400/40",
    emerald: "text-emerald-300 border-emerald-400/40",
    violet: "text-violet-300 border-violet-400/40",
  }[tone];
  return (
    <Badge variant="outline" className={`text-[0.6rem] justify-between ${toneClasses}`}>
      <span className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </span>
      <span>+{Math.round(pct * 100)}%</span>
    </Badge>
  );
}
