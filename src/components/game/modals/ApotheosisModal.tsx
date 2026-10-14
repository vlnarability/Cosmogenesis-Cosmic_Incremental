"use client";

import { useState } from "react";
import { useGameStore } from "@/game/state/store";
import {
  DIVINE_LAWS,
  WORSHIP_MODES,
  MIRACLES,
  HERESY_RESPONSES,
  divineLawBonus,
  worshipModeBonus,
  heresyRateMult,
} from "@/game/data/apotheosis";
import {
  RIVAL_GALAXIES,
  RIVAL_GALAXY_MAP,
  STARTER_GALAXY_ID,
  GALAXIES_REQUIRED_FOR_L6,
  TOTAL_RIVAL_SYSTEMS,
  WORLDS_PER_RIVAL_SYSTEM,
  galaxyAttackCost,
  countClaimedRivalSystems,
  countConqueredGalaxies,
  heresySeverity,
  type HeresySeverity,
} from "@/game/data/galaxies";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lock, Crown, CheckCircle2, Flame, AlertTriangle, RotateCcw, Sparkles, Swords, Trophy } from "lucide-react";
import { formatNumber } from "../shared/format";
import { BackgroundLayerBadge } from "../shared/BackgroundLayerBadge";

const GRID_COLS = 8;
const GRID_ROWS = 4;
const GRID_SIZE = GRID_COLS * GRID_ROWS; // 32

/** Tailwind classes for each heresy severity tier (used on galaxy list borders). */
function severityBorderClass(sev: HeresySeverity): string {
  switch (sev) {
    case "red": return "border-rose-500/80 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]";
    case "orange": return "border-orange-500/80 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.35)]";
    case "yellow": return "border-yellow-500/80 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.3)]";
    default: return "border-border/40";
  }
}

function severityTextClass(sev: HeresySeverity): string {
  switch (sev) {
    case "red": return "text-rose-400";
    case "orange": return "text-orange-300";
    case "yellow": return "text-yellow-300";
    default: return "text-muted-foreground";
  }
}

export function ApotheosisModal() {
  const show = useGameStore((s) => s.showApotheosis);
  const setShow = useGameStore((s) => s.setShowApotheosis);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const faith = useGameStore((s) => s.faith);
  const divinity = useGameStore((s) => s.divinity);
  const heresy = useGameStore((s) => s.heresy);
  const enactedLaws = useGameStore((s) => s.enactedDivineLaws || {});
  const activeWorshipMode = useGameStore((s) => s.activeWorshipMode);
  const performedMiracles = useGameStore((s) => s.performedMiracles || {});
  const activeHeresyResponse = useGameStore((s) => s.activeHeresyResponse);

  // L5 redesign — per-galaxy state
  const galaxyRivalSystems = useGameStore((s) => s.galaxyRivalSystems || {});
  const galaxyHeresy = useGameStore((s) => s.galaxyHeresy || {});
  const galaxyFollowerGrid = useGameStore((s) => s.galaxyFollowerGrid || {});
  const conqueredGalaxies = useGameStore((s) => s.conqueredGalaxies || {});
  const selectedGalaxyId = useGameStore((s) => s.selectedGalaxyId || STARTER_GALAXY_ID);
  const heresySpreadTimer = useGameStore((s) => s.heresySpreadTimer || 0);
  const prophets = useGameStore((s) => s.prophets || []);
  const prophetConvertTimer = useGameStore((s) => s.prophetConvertTimer || 0);

  const enactDivineLaw = useGameStore((s) => s.enactDivineLaw);
  const setWorshipMode = useGameStore((s) => s.setWorshipMode);
  const performMiracle = useGameStore((s) => s.performMiracle);
  const setHeresyResponse = useGameStore((s) => s.setHeresyResponse);
  const convertFollower = useGameStore((s) => s.convertFollower);
  const purgeFollower = useGameStore((s) => s.purgeFollower);
  const initFollowerGrid = useGameStore((s) => s.initFollowerGrid);
  const placeProphet = useGameStore((s) => s.placeProphet);
  const removeProphet = useGameStore((s) => s.removeProphet);
  const attackGalaxy = useGameStore((s) => s.attackGalaxy);
  const setSelectedGalaxyId = useGameStore((s) => s.setSelectedGalaxyId);

  const [placingProphet, setPlacingProphet] = useState(false);

  const isUnlocked = !!unlockedLayers.apotheosis;
  const enactedCount = DIVINE_LAWS.filter((l) => enactedLaws[l.id]).length;
  const lawBonus = divineLawBonus(enactedLaws);
  const wMode = worshipModeBonus(activeWorshipMode);
  const hRateMult = heresyRateMult(activeHeresyResponse);

  // Aggregate L5 stats
  const claimedRivalSystems = countClaimedRivalSystems(galaxyRivalSystems);
  const conqueredCount = countConqueredGalaxies(galaxyRivalSystems);
  const worldBonus = claimedRivalSystems * WORLDS_PER_RIVAL_SYSTEM;

  // Selected galaxy info
  const selectedGalaxy = RIVAL_GALAXY_MAP[selectedGalaxyId] || RIVAL_GALAXIES[0];
  const selectedSystems = galaxyRivalSystems[selectedGalaxy.id] || [];
  const selectedClaimedCount = selectedSystems.filter((s) => s.claimed).length;
  const selectedIsStarter = selectedGalaxy.ownerId === "player";
  const selectedIsRival = !selectedIsStarter;
  const selectedIsOwned = selectedIsStarter || selectedClaimedCount > 0;
  const selectedHeresy = galaxyHeresy[selectedGalaxy.id] || 0;
  const selectedSeverity = heresySeverity(selectedHeresy);
  const selectedGrid = galaxyFollowerGrid[selectedGalaxy.id] || Array.from({ length: 32 }, () => ({ state: "faithful", type: "follower" }));
  const selectedAttackCost = selectedIsRival
    ? galaxyAttackCost(selectedClaimedCount, selectedGalaxy.defenseStrength)
    : 0;
  const selectedIsConquered = !!conqueredGalaxies[selectedGalaxy.id];

  // Grid stats for selected galaxy
  const faithfulCount = selectedGrid.filter((c) => c?.state === "faithful").length;
  const hereticalCount = selectedGrid.filter((c) => c?.state === "heretical").length;
  const emptyCount = selectedGrid.filter((c) => !c || c?.state === "empty").length;
  const heresyPct = (hereticalCount / GRID_SIZE) * 100;
  const webHeresyCritical = heresyPct >= 50;

  // Spread pattern description
  const spreadPattern = activeWorshipMode === "wm_chanting"
    ? "Chanting: spreads only horizontally"
    : activeWorshipMode === "wm_proselytizing"
      ? "Proselytizing: spreads only vertically"
      : activeWorshipMode === "wm_crusade"
        ? "Crusade: spreads 2× faster (every 5s)"
        : activeWorshipMode === "wm_ecstatic" || activeWorshipMode === "wm_silent"
          ? "Current mode active (see layer for effects)"
          : "Default: spreads to one random adjacent cell";

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg flex-wrap">
            <Crown className="w-5 h-5" />
            Layer 5 — Apotheosis (Galactic Conquest)
            <BackgroundLayerBadge layerId="apotheosis" />
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span>
                Conquer 3 rival galaxies to unlock Layer 6. Each claimed rival system grants +18 worlds.
              </span>
              <div className="flex gap-1 flex-wrap">
                <Badge variant="outline" className="text-amber-300 border-amber-400/40">
                  {formatNumber(faith, 0)} Faith
                </Badge>
                <Badge variant="outline" className="text-emerald-300 border-emerald-400/40">
                  <Trophy className="w-3 h-3 mr-1" />{conqueredCount}/{GALAXIES_REQUIRED_FOR_L6} Conquered
                </Badge>
                <Badge variant="outline" className="text-sky-300 border-sky-400/40">
                  {claimedRivalSystems}/{TOTAL_RIVAL_SYSTEMS} Rival Systems
                </Badge>
                <Badge variant="outline" className="text-violet-300 border-violet-400/40">
                  +{formatNumber(worldBonus, 0)} Worlds
                </Badge>
                <Badge variant="outline" className={heresy >= 75 ? "text-rose-400 border-rose-400/60" : "text-rose-300 border-rose-400/40"}>
                  {heresy.toFixed(1)} Avg Heresy
                </Badge>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Apotheosis is sealed.</p>
            <p className="text-xs mt-1">Author at least 1 Genesis world (Layer 4) to unlock Apotheosis.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Galaxy list sidebar + main panel */}
            <section className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-3">
              {/* Sidebar: Galaxy list */}
              <div className="space-y-1.5">
                <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground px-1">
                  Galaxies ({RIVAL_GALAXIES.length} total · {conqueredCount} conquered)
                </div>
                <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                  {RIVAL_GALAXIES.map((g) => {
                    const sys = galaxyRivalSystems[g.id] || [];
                    const claimed = sys.filter((s) => s.claimed).length;
                    const total = g.systemCount;
                    const hered = galaxyHeresy[g.id] || 0;
                    const sev = heresySeverity(hered);
                    const isConquered = !!conqueredGalaxies[g.id];
                    const isStarter = g.ownerId === "player";
                    const isSelected = selectedGalaxyId === g.id;
                    const isOwned = isStarter || claimed > 0;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGalaxyId(g.id)}
                        className={`w-full text-left p-2 rounded-md border bg-card/40 hover:bg-card/70 transition-colors ${
                          isSelected ? "ring-1 ring-amber-400/50" : ""
                        } ${severityBorderClass(sev)} ${isConquered ? "border-emerald-500/60" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-medium truncate">
                            {isStarter ? "🏠 " : isConquered ? "🏆 " : "🌌 "}{g.name}
                          </span>
                          {isConquered && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[0.6rem] text-muted-foreground">
                            {isStarter ? "Home galaxy" : isOwned ? `${claimed}/${total} systems` : `${total} systems`}
                          </span>
                          <span className={`text-[0.6rem] font-mono ${severityTextClass(sev)}`}>
                            {hered.toFixed(0)}% heresy
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main panel: selected galaxy details */}
              <div className="stat-card">
                {/* Galaxy header */}
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-1">
                      {selectedIsStarter ? "🏠 " : selectedIsConquered ? "🏆 " : "🌌 "}
                      {selectedGalaxy.name}
                      {selectedIsConquered && (
                        <Badge variant="outline" className="text-[0.55rem] text-emerald-300 border-emerald-400/40 ml-1">
                          Conquered
                        </Badge>
                      )}
                    </div>
                    <div className="text-[0.65rem] text-muted-foreground">{selectedGalaxy.tagline}</div>
                  </div>
                  <div className="flex gap-1 items-center flex-wrap">
                    {!selectedIsStarter && (
                      <Badge variant="outline" className="text-[0.6rem] text-sky-300 border-sky-400/40">
                        {selectedClaimedCount}/{selectedGalaxy.systemCount} systems
                      </Badge>
                    )}
                    <Badge variant="outline" className={`text-[0.6rem] ${severityTextClass(selectedSeverity)} border-current/40`}>
                      {selectedHeresy.toFixed(0)}% heresy
                    </Badge>
                  </div>
                </div>

                {/* Rival galaxy: Attack panel */}
                {selectedIsRival && (
                  <div className="rounded-md border border-amber-400/30 bg-amber-500/5 p-2 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[0.7rem] uppercase tracking-wide text-amber-300/80 flex items-center gap-1">
                        <Swords className="w-3 h-3" /> Attack {selectedGalaxy.name}
                      </div>
                      <Badge variant="outline" className="text-[0.6rem] text-amber-300 border-amber-400/40">
                        Defense ×{selectedGalaxy.defenseStrength.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="text-[0.65rem] text-muted-foreground mb-1">
                      {selectedGalaxy.rivalGodName ? `Rival god: ${selectedGalaxy.rivalGodName}. ` : ""}
                      Cost scales with claimed systems + defense strength.
                      Each attack claims the next unclaimed system (+18 worlds).
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-amber-300">
                        Cost: {formatNumber(selectedAttackCost, 0)} Faith
                      </span>
                      <Button
                        size="sm"
                        className="h-7"
                        disabled={
                          selectedIsConquered ||
                          faith < selectedAttackCost
                        }
                        onClick={() => attackGalaxy(selectedGalaxy.id)}
                      >
                        {selectedIsConquered ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" />Conquered</>
                        ) : faith < selectedAttackCost ? (
                          `Need ${formatNumber(selectedAttackCost - faith, 0)} Faith`
                        ) : (
                          <><Swords className="w-3 h-3 mr-1" />Attack</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Owned galaxy: Heresy grid */}
                {selectedIsOwned && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[0.7rem] uppercase tracking-wide text-rose-300/80 flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Heresy Web (8×4 = 32 followers)
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="outline" className={`text-[0.6rem] ${webHeresyCritical ? "text-rose-400 border-rose-400/60" : "text-muted-foreground"}`}>
                          ⏱ next spread {Math.ceil(heresySpreadTimer)}s
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => initFollowerGrid(selectedGalaxy.id)} className="h-7 text-[0.65rem]">
                          <RotateCcw className="w-3 h-3 mr-1" /> Restore Flock
                        </Button>
                      </div>
                    </div>

                    {/* Prophets panel */}
                    <div className="rounded-md border border-amber-400/30 bg-amber-500/5 p-2 mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[0.7rem] uppercase tracking-wide text-amber-300/80 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Prophets (max 2 · 50 Divinity each)
                        </div>
                        <Badge variant="outline" className="text-[0.6rem] text-amber-300 border-amber-400/40">
                          {prophets.length}/2 placed · converts in {Math.ceil(prophetConvertTimer)}s
                        </Badge>
                      </div>
                      <div className="text-[0.6rem] text-muted-foreground mb-1">
                        A Prophet converts ALL adjacent heretics to faithful every 10 seconds. Click "Place Prophet" then click any cell in this galaxy.
                      </div>
                      <Button
                        size="sm"
                        variant={placingProphet ? "default" : "outline"}
                        disabled={prophets.length >= 2 || divinity < 50}
                        onClick={() => setPlacingProphet(!placingProphet)}
                        className="h-6 text-[0.6rem]"
                      >
                        {placingProphet ? "Cancel Placement" : "Place Prophet (50 Div)"}
                      </Button>
                    </div>

                    {/* Web stats */}
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <div className="rounded-md bg-emerald-500/10 border border-emerald-400/20 p-1.5">
                        <div className="text-[0.55rem] uppercase text-emerald-300/80">Faithful</div>
                        <div className="text-lg font-mono text-emerald-300">{faithfulCount}</div>
                      </div>
                      <div className="rounded-md bg-rose-500/10 border border-rose-400/20 p-1.5">
                        <div className="text-[0.55rem] uppercase text-rose-300/80">Heretical</div>
                        <div className="text-lg font-mono text-rose-300">{hereticalCount}</div>
                      </div>
                      <div className="rounded-md bg-muted/30 border border-border p-1.5">
                        <div className="text-[0.55rem] uppercase text-muted-foreground">Purged</div>
                        <div className="text-lg font-mono text-muted-foreground">{emptyCount}</div>
                      </div>
                      <div className={`rounded-md p-1.5 border ${webHeresyCritical ? "bg-rose-500/20 border-rose-400/60" : "bg-amber-500/10 border-amber-400/20"}`}>
                        <div className={`text-[0.55rem] uppercase ${webHeresyCritical ? "text-rose-400" : "text-amber-300/80"}`}>Web Heresy</div>
                        <div className={`text-lg font-mono ${webHeresyCritical ? "text-rose-400" : "text-amber-300"}`}>{heresyPct.toFixed(0)}%</div>
                      </div>
                    </div>

                    {webHeresyCritical && (
                      <div className="rounded-md border border-rose-400/60 bg-rose-500/20 p-2 mb-2 text-[0.7rem] text-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Web heresy in {selectedGalaxy.name} is at {heresyPct.toFixed(0)}% — Convert or Purge heretics NOW!
                      </div>
                    )}

                    {/* The 8×4 grid */}
                    <div
                      className="grid gap-1"
                      style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)` }}
                    >
                      {Array.from({ length: GRID_SIZE }, (_, i) => {
                        const cell = selectedGrid[i] || { state: "faithful", type: "follower" };
                        const state = cell.state;
                        const isProphet = cell.type === "prophet" || prophets.some((p) => p.galaxyId === selectedGalaxy.id && p.cellIndex === i);
                        return (
                          <div
                            key={i}
                            onClick={() => {
                              if (placingProphet) {
                                placeProphet(selectedGalaxy.id, i);
                                setPlacingProphet(false);
                              }
                            }}
                            className={`relative aspect-square rounded-md border flex items-center justify-center text-lg cursor-${placingProphet ? "pointer" : "default"}
                              ${state === "faithful"
                                ? isProphet
                                  ? "border-amber-400/70 bg-amber-500/25 prophet-glow"
                                  : "border-emerald-400/40 bg-emerald-500/15"
                                : state === "heretical"
                                  ? "border-rose-400/60 bg-rose-500/25 animate-pulse"
                                  : "border-muted-foreground/15 bg-muted/5"
                              }
                              ${placingProphet ? "hover:ring-2 hover:ring-amber-400/60" : ""}
                            `}
                            title={`Cell ${i + 1} — ${state}${isProphet ? " (Prophet)" : ""}`}
                          >
                            <span>{isProphet ? "🌟" : state === "faithful" ? "🙏" : state === "heretical" ? "😈" : "·"}</span>
                            {isProphet && (
                              <button
                                onClick={(e) => { e.stopPropagation(); removeProphet(selectedGalaxy.id, i); }}
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500/80 text-white text-[0.55rem] flex items-center justify-center hover:bg-rose-400"
                                title="Remove Prophet"
                              >
                                ✕
                              </button>
                            )}
                            {state !== "empty" && !isProphet && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/60 transition-opacity">
                                <div className="flex gap-0.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={state === "faithful" || divinity < 5}
                                    onClick={(e) => { e.stopPropagation(); convertFollower(selectedGalaxy.id, i); }}
                                    className="h-5 w-5 p-0 text-[0.5rem] text-emerald-300"
                                    title={`Convert (5 Divinity)`}
                                  >
                                    ✚
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => { e.stopPropagation(); purgeFollower(selectedGalaxy.id, i); }}
                                    className="h-5 w-5 p-0 text-[0.5rem] text-rose-300"
                                    title="Purge (free, removes follower)"
                                  >
                                    ✕
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-[0.55rem] text-muted-foreground mt-2">
                      Hover a cell to reveal Convert (✚) and Purge (✕) actions. Each convert costs 5 Divinity; each purge removes the follower. Current spread pattern: <span className="text-amber-300">{spreadPattern}</span>.
                    </div>
                  </>
                )}

                {/* Rival galaxy NOT owned: no grid; show attack info only */}
                {selectedIsRival && !selectedIsOwned && (
                  <div className="text-center text-muted-foreground py-6">
                    <Swords className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">
                      Attack this galaxy to claim systems. Once you claim your first system, the heresy web for {selectedGalaxy.name} will become active.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Global Heresy meter (the run-ender) */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Avg Heresy (run ends at 75) · gain rate ×{hRateMult.toFixed(2)}
                </div>
                <div className="text-[0.65rem] text-muted-foreground">{heresy.toFixed(1)} global</div>
              </div>
              <div className="h-2 bg-rose-950/50 rounded-full overflow-hidden">
                <div className={`h-full transition-all ${heresy >= 75 ? "bg-rose-500" : "bg-rose-400/70"}`} style={{ width: `${Math.min(75, heresy) / 75 * 100}%` }} />
              </div>
              <div className="text-[0.6rem] text-muted-foreground mt-1">
                Enacted {enactedCount} laws. Active bonuses: +{(lawBonus.productionMult * 100).toFixed(0)}% prod, +{(lawBonus.capMult * 100).toFixed(0)}% cap, +{(lawBonus.epMult * 100).toFixed(0)}% EP, +{(lawBonus.popGrowthMult * 100).toFixed(0)}% pop
              </div>
            </div>

            {/* Divine Laws */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">Divine Laws ({enactedCount}/8 enacted)</div>
              <div className="space-y-1.5">
                {DIVINE_LAWS.map((l) => {
                  const enacted = !!enactedLaws[l.id];
                  const canAfford = faith >= l.faithCost;
                  return (
                    <div key={l.id} className={`stat-card flex items-center gap-3 py-2 ${enacted ? "border-emerald-400/40" : ""}`}>
                      <span className="text-xl shrink-0">{l.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{l.name}</div>
                        <div className="text-[0.65rem] text-muted-foreground leading-snug">{l.desc}</div>
                        {l.bonus.heresyRateMult !== undefined && (
                          <div className={`text-[0.6rem] mt-0.5 ${l.bonus.heresyRateMult > 1 ? "text-rose-300/80" : "text-emerald-300/80"}`}>
                            Heresy rate ×{l.bonus.heresyRateMult.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[0.6rem] text-amber-300/80">{l.faithCost} Faith</div>
                        <Button size="sm" className="h-7 mt-1" disabled={enacted || !canAfford} onClick={() => enactDivineLaw(l.id)}>
                          {enacted ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Enacted</> : "Enact"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Worship Modes */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">Worship Mode (generates Faith/sec, may accrue heresy; changes spread pattern)</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {WORSHIP_MODES.map((m) => {
                  const active = activeWorshipMode === m.id;
                  return (
                    <button key={m.id} onClick={() => setWorshipMode(active ? null : m.id)} className={`stat-card text-left p-2 ${active ? "border-amber-400/60 bg-amber-500/10" : ""}`}>
                      <div className="flex items-center gap-1">
                        <span className="text-base">{m.icon}</span>
                        <span className="text-xs font-medium">{m.name}</span>
                      </div>
                      <div className="text-[0.6rem] text-muted-foreground mt-0.5 leading-snug">{m.desc}</div>
                    </button>
                  );
                })}
              </div>
              <div className="text-[0.6rem] text-amber-300/80 mt-1">
                Active: +{wMode.faithPerSec.toFixed(1)} Faith/s, +{(wMode.productionMult * 100).toFixed(0)}% prod, +{wMode.heresyPerSec.toFixed(2)} heresy/s
              </div>
            </section>

            {/* Miracles */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">Miracles (one-shot, cost Faith)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {MIRACLES.map((m) => {
                  const canAfford = faith >= m.faithCost;
                  const used = performedMiracles[m.id] || 0;
                  return (
                    <div key={m.id} className="stat-card flex items-center gap-2 py-2">
                      <span className="text-lg shrink-0">{m.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold">{m.name}</div>
                        <div className="text-[0.6rem] text-muted-foreground leading-snug">{m.desc}</div>
                        {used > 0 && <div className="text-[0.55rem] text-amber-300/80">used {used}× this run</div>}
                      </div>
                      <Button size="sm" className="h-7" disabled={!canAfford} onClick={() => performMiracle(m.id)}>
                        {m.faithCost === 0 ? "Free" : `${m.faithCost} Faith`}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Heresy Responses */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">Heresy Response (policy — affects heresy rate)</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {HERESY_RESPONSES.map((h) => {
                  const active = activeHeresyResponse === h.id;
                  return (
                    <button key={h.id} onClick={() => setHeresyResponse(h.id)} className={`stat-card text-left p-2 ${active ? "border-amber-400/60 bg-amber-500/10" : ""}`}>
                      <div className="flex items-center gap-1">
                        <span className="text-base">{h.icon}</span>
                        <span className="text-[0.65rem] font-medium">{h.name}</span>
                      </div>
                      <div className="text-[0.55rem] text-muted-foreground mt-0.5 leading-tight">{h.desc}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1 flex items-center gap-1">
          <Flame className="w-3 h-3" />
          <span className="text-rose-300">Galactic Conquest</span> is the new L5 loop. Attack rival galaxies (each system = +18 worlds), manage per-galaxy heresy webs, conquer 3 galaxies to unlock Layer 6 (Singularity).
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShow(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
