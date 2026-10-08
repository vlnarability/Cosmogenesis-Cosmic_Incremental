"use client";

import { useState, useCallback } from "react";
import { useGameStore } from "@/game/state/store";
import {
  FORESIGHT_NODES,
  FORESIGHT_ROUTES,
  foresightBonus,
  routeBonus,
  countForesightNodes,
  FORESIGHT_NODES_REQUIRED_FOR_LAYER_3,
} from "@/game/data/foresight";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lock, Eye, Sparkles, Star, Sun, Disc3 } from "lucide-react";
import { formatNumber } from "../shared/format";

// 5×4 grid layout — node index = row*5 + col
const GRID_COLS = 5;
const GRID_ROWS = 4;

// Compute adjacency for the 5×4 grid (orthogonal only — no diagonals).
function neighborIndices(idx: number): number[] {
  const row = Math.floor(idx / GRID_COLS);
  const col = idx % GRID_COLS;
  const result: number[] = [];
  if (col > 0) result.push(idx - 1);
  if (col < GRID_COLS - 1) result.push(idx + 1);
  if (row > 0) result.push(idx - GRID_COLS);
  if (row < GRID_ROWS - 1) result.push(idx + GRID_COLS);
  return result;
}

// Group illuminated nodes into connected constellations (BFS over illuminated adjacency).
function findConstellations(illuminated: Record<string, boolean>): { nodeIds: string[] }[] {
  const visited = new Set<string>();
  const result: { nodeIds: string[] }[] = [];
  for (let i = 0; i < FORESIGHT_NODES.length; i++) {
    const node = FORESIGHT_NODES[i];
    if (!illuminated[node.id] || visited.has(node.id)) continue;
    // BFS this component
    const comp: string[] = [];
    const queue = [i];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      const cn = FORESIGHT_NODES[cur];
      if (!illuminated[cn.id] || visited.has(cn.id)) continue;
      visited.add(cn.id);
      comp.push(cn.id);
      for (const ni of neighborIndices(cur)) {
        const nn = FORESIGHT_NODES[ni];
        if (illuminated[nn.id] && !visited.has(nn.id)) queue.push(ni);
      }
    }
    if (comp.length > 0) result.push({ nodeIds: comp });
  }
  return result;
}

export function EnlightenmentModal() {
  const show = useGameStore((s) => s.showEnlightenment);
  const setShow = useGameStore((s) => s.setShowEnlightenment);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const divinity = useGameStore((s) => s.divinity);
  const foresightNodes = useGameStore((s) => s.foresightNodes || {});
  const activeRoute = useGameStore((s) => s.activeForesightRoute);
  const constellationRevealed = useGameStore((s) => s.constellationRevealed || {});

  const illuminate = useGameStore((s) => s.illuminateConstellationNode);
  const stargazeReveal = useGameStore((s) => s.stargazeReveal);
  const supernovaIlluminate = useGameStore((s) => s.supernovaIlluminate);
  const blackHoleReset = useGameStore((s) => s.blackHoleReset);
  const setForesightRoute = useGameStore((s) => s.setForesightRoute);

  // FEATURE 2 — Visual effect state for Supernova (flash) and Black Hole (collapse)
  const [flashedNodes, setFlashedNodes] = useState<Set<string>>(new Set());
  const [collapsingNodes, setCollapsingNodes] = useState<Set<string>>(new Set());

  const triggerSupernova = useCallback(() => {
    // Compute affected nodes (target + orthogonal neighbors) BEFORE the store action
    const targetId = FORESIGHT_NODES[0]?.id;
    if (!targetId) return;
    const idx = FORESIGHT_NODES.findIndex((n) => n.id === targetId);
    const affected = new Set<string>([targetId]);
    if (idx >= 0) {
      const row = Math.floor(idx / GRID_COLS);
      const col = idx % GRID_COLS;
      if (col > 0) affected.add(FORESIGHT_NODES[idx - 1].id);
      if (col < GRID_COLS - 1) affected.add(FORESIGHT_NODES[idx + 1].id);
      if (row > 0) affected.add(FORESIGHT_NODES[idx - GRID_COLS].id);
      if (row < GRID_ROWS - 1) affected.add(FORESIGHT_NODES[idx + GRID_COLS].id);
    }
    supernovaIlluminate(targetId);
    setFlashedNodes(affected);
    setTimeout(() => setFlashedNodes(new Set()), 500);
  }, [supernovaIlluminate]);

  const triggerBlackHole = useCallback(() => {
    // Capture all currently-illuminated nodes for the collapse animation, then fire the reset
    const collapsing = new Set<string>(Object.keys(foresightNodes || {}));
    setCollapsingNodes(collapsing);
    blackHoleReset();
    // The reset will clear `foresightNodes` from the store; the collapse animation runs locally for 500ms
    setTimeout(() => setCollapsingNodes(new Set()), 550);
  }, [blackHoleReset, foresightNodes]);

  const isUnlocked = !!unlockedLayers.enlightenment;
  const purchasedCount = countForesightNodes(foresightNodes);
  const fs = foresightBonus(foresightNodes);
  const rb = routeBonus(activeRoute);
  const constellations = findConstellations(foresightNodes);
  const bigConstellations = constellations.filter((c) => c.nodeIds.length >= 3);
  const constellationBonusPct = bigConstellations.length * 2;

  // Build list of SVG line segments for illuminated-adjacent pairs
  const svgLines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
  for (let i = 0; i < FORESIGHT_NODES.length; i++) {
    const a = FORESIGHT_NODES[i];
    if (!foresightNodes[a.id]) continue;
    for (const j of neighborIndices(i)) {
      if (j <= i) continue;
      const b = FORESIGHT_NODES[j];
      if (!foresightNodes[b.id]) continue;
      const r1 = Math.floor(i / GRID_COLS);
      const c1 = i % GRID_COLS;
      const r2 = Math.floor(j / GRID_COLS);
      const c2 = j % GRID_COLS;
      svgLines.push({
        x1: c1 * 100 + 50, y1: r1 * 100 + 50,
        x2: c2 * 100 + 50, y2: r2 * 100 + 50,
        key: `${a.id}-${b.id}`,
      });
    }
  }

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Eye className="w-5 h-5" />
            Layer 2 — Enlightenment (Constellation Map)
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>
              Illuminate nodes to form constellations. Connected groups of 3+ grant combo bonuses.
            </span>
            <Badge variant="outline" className="text-violet-300 border-violet-400/40">
              {formatNumber(divinity, 0)} Divinity
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Enlightenment is sealed.</p>
            <p className="text-xs mt-1">Master 3 distinct Layer 1 trials to unlock Foresight.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress / stats */}
            <div className="stat-card">
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">
                Constellation progress — {purchasedCount}/{FORESIGHT_NODES.length} nodes illuminated · {bigConstellations.length} constellations (3+)
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-cyan-300 border-cyan-400/40">+{(fs.productionMult * 100).toFixed(0)}% prod</Badge>
                <Badge variant="outline" className="text-amber-300 border-amber-400/40">+{(fs.capMult * 100).toFixed(0)}% cap</Badge>
                <Badge variant="outline" className="text-emerald-300 border-emerald-400/40">+{(fs.epMult * 100).toFixed(0)}% EP</Badge>
                <Badge variant="outline" className="text-violet-300 border-violet-400/40">+{(fs.popGrowthMult * 100).toFixed(0)}% pop</Badge>
                <Badge variant="outline" className="text-pink-300 border-pink-400/40">
                  ✦ Constellation combo: +{constellationBonusPct}% prod
                </Badge>
                <Badge variant="outline" className={purchasedCount >= FORESIGHT_NODES_REQUIRED_FOR_LAYER_3 ? "text-emerald-300 border-emerald-400/40" : "text-muted-foreground"}>
                  {purchasedCount >= FORESIGHT_NODES_REQUIRED_FOR_LAYER_3
                    ? "Transcendence unlocked!"
                    : `${FORESIGHT_NODES_REQUIRED_FOR_LAYER_3 - purchasedCount} more to advance`}
                </Badge>
              </div>
            </div>

            {/* Active abilities */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={divinity < 25}
                onClick={stargazeReveal}
                className="h-auto py-2 flex flex-col items-center gap-0.5"
              >
                <Star className="w-4 h-4 text-cyan-300" />
                <span className="text-xs">Stargaze</span>
                <span className="text-[0.55rem] text-muted-foreground">25 Div — reveal connections</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={divinity < 50}
                onClick={triggerSupernova}
                className="h-auto py-2 flex flex-col items-center gap-0.5"
                title="Supernova illuminates a target node AND its adjacent neighbors"
              >
                <Sun className="w-4 h-4 text-amber-300" />
                <span className="text-xs">Supernova</span>
                <span className="text-[0.55rem] text-muted-foreground">50 Div — ignite a cluster</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={triggerBlackHole}
                className="h-auto py-2 flex flex-col items-center gap-0.5"
              >
                <Disc3 className="w-4 h-4 text-rose-300" />
                <span className="text-xs">Black Hole</span>
                <span className="text-[0.55rem] text-muted-foreground">Refund 50% & reset</span>
              </Button>
            </div>

            {/* Constellation Map — SVG + node grid */}
            <div className="stat-card">
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-2">The Constellation Map (5×4 grid — click an unlit node to illuminate)</div>
              <div className="relative w-full" style={{ aspectRatio: "5 / 4" }}>
                {/* SVG layer for connecting lines */}
                <svg
                  viewBox="0 0 500 400"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  preserveAspectRatio="none"
                >
                  {svgLines.map((l) => (
                    <line
                      key={l.key}
                      x1={l.x1}
                      y1={l.y1}
                      x2={l.x2}
                      y2={l.y2}
                      stroke="rgba(168,85,247,0.55)"
                      strokeWidth={2.5}
                    />
                  ))}
                </svg>
                {/* Node grid */}
                <div
                  className="absolute inset-0 grid gap-1.5"
                  style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)` }}
                >
                  {FORESIGHT_NODES.map((n) => {
                    const lit = !!foresightNodes[n.id];
                    const prereqMet = !n.requires || foresightNodes[n.requires];
                    const canAfford = divinity >= n.cost;
                    const revealed = !!constellationRevealed[n.id];
                    // Highlight nodes in big constellations
                    const inBig = bigConstellations.some((c) => c.nodeIds.includes(n.id));
                    // FEATURE 2 — Supernova flash + Black Hole collapse visual effects
                    const isFlashing = flashedNodes.has(n.id);
                    const isCollapsing = collapsingNodes.has(n.id);
                    return (
                      <button
                        key={n.id}
                        disabled={lit || !prereqMet || !canAfford}
                        onClick={() => illuminate(n.id)}
                        title={`${n.name}\n${n.desc}\nCost: ${n.cost} Divinity${n.requires ? `\nRequires: ${FORESIGHT_NODES.find((x) => x.id === n.requires)?.name}` : ""}`}
                        className={`relative rounded-md border transition-all flex items-center justify-center
                          ${lit
                            ? `border-violet-400/60 bg-violet-500/20 ${inBig ? "ring-2 ring-amber-400/50" : ""} ${isFlashing ? "supernova-flash" : ""}`
                            : prereqMet && canAfford
                              ? "border-cyan-400/30 bg-cyan-950/20 hover:border-cyan-400/70 hover:bg-cyan-500/10"
                              : prereqMet
                                ? "border-muted-foreground/20 bg-muted/10 opacity-50"
                                : "border-rose-400/20 bg-rose-950/10 opacity-40"
                          }
                          ${isCollapsing ? "black-hole-collapse" : ""}
                        `}
                      >
                        <span className={`text-xl ${lit ? "" : "grayscale opacity-70"}`}>{n.icon}</span>
                        {lit && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-300 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                        )}
                        {!lit && (
                          <span className="absolute bottom-0.5 right-1 text-[0.5rem] text-muted-foreground font-mono">{n.cost}</span>
                        )}
                        {!lit && !prereqMet && !revealed && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs">🔒</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Route picker (preserved from classic foresight) */}
            <div>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">Route (choose one — applies bonus to all illuminated nodes)</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {FORESIGHT_ROUTES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setForesightRoute(activeRoute === r.id ? null : r.id)}
                    className={`stat-card text-left p-2 ${activeRoute === r.id ? "border-amber-400/60 bg-amber-500/10" : ""}`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-base">{r.icon}</span>
                      <span className="text-xs font-medium">{r.name}</span>
                    </div>
                    <div className="text-[0.6rem] text-muted-foreground mt-0.5 leading-snug">{r.blurb}</div>
                  </button>
                ))}
              </div>
              <div className="text-[0.6rem] text-amber-300/80 mt-1">
                Route bonus: +{(rb.productionMult * 100).toFixed(0)}% prod, +{(rb.capMult * 100).toFixed(0)}% cap, +{(rb.epMult * 100).toFixed(0)}% EP, +{(rb.popGrowthMult * 100).toFixed(0)}% pop
              </div>
            </div>

            {/* Node reference list (collapsed details) */}
            <details className="stat-card">
              <summary className="text-[0.7rem] uppercase tracking-wide text-muted-foreground cursor-pointer">All 20 Foresight Nodes (reference)</summary>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-2">
                {FORESIGHT_NODES.map((n) => {
                  const purchased = !!foresightNodes[n.id];
                  return (
                    <div key={n.id} className={`text-[0.6rem] p-1.5 rounded border ${purchased ? "border-emerald-400/30 bg-emerald-500/5" : "border-muted-foreground/15"}`}>
                      <div className="flex items-center gap-1">
                        <span>{n.icon}</span>
                        <span className="font-medium truncate">{n.name}</span>
                        {purchased && <Sparkles className="w-2.5 h-2.5 text-emerald-300 ml-auto" />}
                      </div>
                      <div className="text-muted-foreground mt-0.5">{n.desc}</div>
                    </div>
                  );
                })}
              </div>
            </details>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1">
          Illuminated nodes connect to adjacent illuminated nodes automatically (orthogonal only). Each constellation of 3+ connected nodes grants <span className="text-pink-300">+2% production</span> as a combo bonus. Master 10 nodes to advance to Layer 3 (Transcendence).
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShow(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
