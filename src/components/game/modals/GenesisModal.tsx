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
} from "lucide-react";
import { formatNumber } from "../shared/format";
import { BackgroundLayerBadge } from "../shared/BackgroundLayerBadge";
import { EmptyState } from "../shared/EmptyState";
import { HexMap, generateHexMap, type HexCell } from "../shared/HexMap";

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
  production: "Production",
  capacity: "Capacity",
  ep: "Enlightenment",
  pop: "Population",
};

function bonusPct(value: number): string {
  return `+${Math.round(value * 100)}%`;
}

export function GenesisContent() {
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const divinity = useGameStore((s) => s.divinity);
  const debugFreeBuy = useGameStore((s) => s.debugFreeBuy);

  const galaxySystems = useGameStore((s) => s.galaxySystems || []);
  const scanGalaxySystem = useGameStore((s) => s.scanGalaxySystem);
  const claimGalaxySystem = useGameStore((s) => s.claimGalaxySystem);

  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selectedSys = selectedId ? GALAXY_SYSTEMS.find((s) => s.id === selectedId) : null;
  const selectedState = selectedId ? galaxySystems.find((g) => g.id === selectedId) : null;

  return (
    <>
      {/* LAYER-AS-TAB — was <DialogHeader>/<DialogTitle>/<DialogDescription>
          (Radix primitives that require a <Dialog> parent). Now plain HTML
          since this content renders inline in the tab panel. */}
      <div className="flex flex-col gap-2 text-center sm:text-left mb-3">
        <h2 className="text-lg leading-none font-semibold flex items-center gap-2 flex-wrap">
          <Egg className="w-5 h-5" />
          Layer 4 — Genesis (Galaxy Claim)
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

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Genesis is sealed.</p>
            <p className="text-xs mt-1">Perform all 4 Blood Pacts (Layer 3) to unlock Genesis.</p>
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
                selectedId={selectedId}
                onHexClick={(id) => {
                  setSelectedId(id);
                  const sys = GALAXY_SYSTEMS.find((s) => s.id === id);
                  const state = galaxySystems.find((g) => g.id === id);
                  if (sys && !state?.explored) scanGalaxySystem(id);
                  else if (sys && state?.explored && !state?.claimed) claimGalaxySystem(id);
                }}
                title="Star System Map"
                subtitle={`${claimedCount}/${GALAXY_TOTAL_SYSTEMS} claimed · ${exploredCount} explored`}
              />
              <div className="text-[0.6rem] text-muted-foreground mt-1 leading-relaxed text-center">
                Click an unexplored hex to{" "}
                <span className="text-violet-300">scan</span> ({GALAXY_SCAN_COST} Divinity) or an
                explored hex to{" "}
                <span className="text-emerald-300">claim</span> ({nextClaimCost} Divinity).
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
                        {selectedState.claimed ? "✓ Claimed" : `Claim: ${nextClaimCost} Divinity`}
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
                  +10 worlds per claimed system (counts toward background simulations cap of 1,000 at L4)
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
                Fill all {GALAXY_TOTAL_SYSTEMS} systems to complete Layer 4 and unlock{" "}
                <span className="text-cyan-300">Apotheosis (Layer 5)</span>.
              </div>
            </div>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1">
          The galaxy star map is the Layer 4 gameplay loop — scan unknown systems to reveal their bonus and
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
