"use client";

import { useState } from "react";
import { useGameStore } from "@/game/state/store";
import {
  CRADLE_WORLDS,
  PRIME_CONDITIONS,
  SACRED_GEOGRAPHIES,
  DORMANT_SEEDS,
  DIFFICULTY_TIERS,
  CRADLE_WORLD_MAP,
  PRIME_CONDITION_MAP,
  SACRED_GEOGRAPHY_MAP,
  DORMANT_SEED_MAP,
  DIFFICULTY_TIER_MAP,
  worldProductionMult,
  worldCapMult,
  worldEpMultiplier,
  worldPopGrowthMult,
} from "@/game/data/genesis";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lock, Egg, CheckCircle2, RotateCcw } from "lucide-react";
import { formatNumber } from "../shared/format";

const GRID_COLS = 5;
const GRID_ROWS = 4;
const GRID_SIZE = GRID_COLS * GRID_ROWS; // 20

const TILE_TYPES = [
  { id: "forest", name: "Forest", icon: "🌲", bonus: "+5% food production", color: "text-emerald-300 border-emerald-400/40 bg-emerald-500/10" },
  { id: "mountain", name: "Mountain", icon: "⛰️", bonus: "+5% materials & stone production", color: "text-stone-300 border-stone-400/40 bg-stone-500/10" },
  { id: "ocean", name: "Ocean", icon: "🌊", bonus: "+5% water production", color: "text-sky-300 border-sky-400/40 bg-sky-500/10" },
  { id: "desert", name: "Desert", icon: "🏜️", bonus: "+5% gold production", color: "text-amber-300 border-amber-400/40 bg-amber-500/10" },
  { id: "plains", name: "Plains", icon: "🌾", bonus: "+2% to all production", color: "text-yellow-300 border-yellow-400/40 bg-yellow-500/10" },
];

const TILE_MAP: Record<string, typeof TILE_TYPES[number]> = Object.fromEntries(
  TILE_TYPES.map((t) => [t.id, t])
);

// Adjacency helpers
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

// Find groups of 3+ same-type connected tiles
function findCombos(grid: Array<string | null>): { tileId: string; cells: number[] }[] {
  const visited = new Set<number>();
  const combos: { tileId: string; cells: number[] }[] = [];
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === null || visited.has(i)) continue;
    const tileId = grid[i]!;
    const comp: number[] = [];
    const queue = [i];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (visited.has(cur) || grid[cur] !== tileId) continue;
      visited.add(cur);
      comp.push(cur);
      for (const ni of neighborIndices(cur)) {
        if (grid[ni] === tileId && !visited.has(ni)) queue.push(ni);
      }
    }
    if (comp.length >= 3) combos.push({ tileId, cells: comp });
  }
  return combos;
}

// Count adjacency bonuses (each tile adjacent to another tile of any type)
function countAdjacencyBonuses(grid: Array<string | null>): number {
  let count = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === null) continue;
    for (const ni of neighborIndices(i)) {
      if (grid[ni] !== null && grid[ni] !== grid[i]) count++;
    }
  }
  return count;
}

export function GenesisModal() {
  const show = useGameStore((s) => s.showGenesis);
  const setShow = useGameStore((s) => s.setShowGenesis);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const genesisSeeds = useGameStore((s) => s.genesisSeeds);
  const authoredWorlds = useGameStore((s) => s.authoredWorlds || []);
  const pending = useGameStore((s) => s.pendingWorldConfig || {});
  const setPendingWorldConfig = useGameStore((s) => s.setPendingWorldConfig);
  const authorWorld = useGameStore((s) => s.authorWorld);

  // REBUILD L4 — Sacred Grid state
  const worldGrid = useGameStore((s) => s.worldGrid || Array(GRID_SIZE).fill(null));
  const worldGridSeeds = useGameStore((s) => s.worldGridSeeds || Array(GRID_SIZE).fill(null));
  const placeGridTile = useGameStore((s) => s.placeGridTile);
  const resetWorldGrid = useGameStore((s) => s.resetWorldGrid);
  // FEATURE 4 — Natural Disasters
  const lastDisasterCell = useGameStore((s) => s.lastDisasterCell ?? null);
  const lastDisasterAt = useGameStore((s) => s.lastDisasterAt || 0);
  const gameTime = useGameStore((s) => s.time);
  const disasterTimer = useGameStore((s) => s.disasterTimer || 0);
  const disasterRecentlyHit = lastDisasterCell !== null && (gameTime - lastDisasterAt) < 0.7;

  const isUnlocked = !!unlockedLayers.genesis;
  const wProd = worldProductionMult(authoredWorlds);
  const wCap = worldCapMult(authoredWorlds);
  const wEp = worldEpMultiplier(authoredWorlds);
  const wPop = worldPopGrowthMult(authoredWorlds);

  const canAuthor = !!(pending.cradleWorldId && pending.primeConditionId && pending.sacredGeographyId && pending.dormantSeedId && pending.difficultyTierId);

  const filledTiles = worldGrid.filter((t) => t !== null).length;
  const combos = findCombos(worldGrid);
  const adjacencyCount = countAdjacencyBonuses(worldGrid);
  // Grid bonus: each filled tile +1% production, each combo +5%, each adjacency +0.5%
  const gridProductionBonus = filledTiles * 0.01 + combos.length * 0.05 + adjacencyCount * 0.005;

  // Active tile type to place (local React state)
  const [activeTile, setActiveTile] = useState<string>("forest");

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Egg className="w-5 h-5" />
            Layer 4 — Genesis (Sacred Grid)
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>
              Place sacred tiles on a 5×4 grid. Adjacent tiles amplify each other; 3+ matching tiles form a combo.
            </span>
            <Badge variant="outline" className="text-emerald-300 border-emerald-400/40">
              {formatNumber(genesisSeeds, 0)} Seeds
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Genesis is sealed.</p>
            <p className="text-xs mt-1">Perform all 4 Blood Pacts (Layer 3) to unlock Genesis.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sacred Grid — the new mini-game */}
            <section className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[0.7rem] uppercase tracking-wide text-emerald-300/80">Sacred Grid (5×4 = 20 cells)</div>
                <Button size="sm" variant="ghost" onClick={resetWorldGrid} className="h-7 text-[0.65rem]">
                  <RotateCcw className="w-3 h-3 mr-1" /> Reset Grid
                </Button>
              </div>
              <div className="text-[0.65rem] text-muted-foreground mb-2">
                Pick a tile type, then click an empty cell. Placing next to dormant seeds may reveal them.
                Each tile gives <span className="text-cyan-300">+1% prod</span>; each adjacency <span className="text-amber-300">+0.5%</span>; each 3+ combo <span className="text-pink-300">+5%</span>.
              </div>

              {/* Tile picker */}
              <TilePicker
                activeTileId={activeTile}
                onSelect={(id) => setActiveTile(id)}
              />

              {/* Grid stats */}
              <div className="flex flex-wrap gap-1 mt-2 mb-2">
                <Badge variant="outline" className="text-[0.6rem] text-cyan-300 border-cyan-400/40">{filledTiles}/20 tiles placed</Badge>
                <Badge variant="outline" className="text-[0.6rem] text-amber-300 border-amber-400/40">{adjacencyCount} adjacencies (+{(adjacencyCount * 0.5).toFixed(1)}% prod)</Badge>
                <Badge variant="outline" className="text-[0.6rem] text-pink-300 border-pink-400/40">{combos.length} combos (+{(combos.length * 5).toFixed(0)}% prod)</Badge>
                <Badge variant="outline" className="text-[0.6rem] text-emerald-300 border-emerald-400/40">Grid total: +{(gridProductionBonus * 100).toFixed(1)}% prod</Badge>
                {/* FEATURE 4 — Disaster countdown */}
                <Badge variant="outline" className={`text-[0.6rem] ${disasterTimer < 10 ? "text-rose-300 border-rose-400/60" : "text-muted-foreground"}`}>
                  🌋 next disaster roll in {Math.ceil(disasterTimer)}s
                </Badge>
              </div>

              {disasterRecentlyHit && lastDisasterCell !== null && (
                <div className="rounded-md border border-rose-400/60 bg-rose-500/15 p-1.5 text-[0.65rem] text-rose-200 mb-2">
                  ⚠ A natural disaster destroyed the tile on cell {lastDisasterCell + 1}. Rebuild it (click the empty cell to place a new tile).
                </div>
              )}

              {/* The 5×4 grid */}
              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)` }}
              >
                {Array.from({ length: GRID_SIZE }, (_, i) => {
                  const tileId = worldGrid[i];
                  const seed = worldGridSeeds[i];
                  const tile = tileId ? TILE_MAP[tileId] : null;
                  const inCombo = combos.some((c) => c.cells.includes(i));
                  // FEATURE 4 — disaster flash on the recently-destroyed cell
                  const isDisasterFlash = disasterRecentlyHit && lastDisasterCell === i;
                  return (
                    <button
                      key={i}
                      disabled={tileId !== null}
                      onClick={() => placeGridTile(i, activeTile)}
                      className={`relative aspect-square rounded-md border flex items-center justify-center transition-all
                        ${isDisasterFlash
                          ? "border-rose-400/60 bg-rose-500/20 disaster-flash"
                          : tile
                            ? `${tile.color} ${inCombo ? "ring-2 ring-pink-400/60" : ""}`
                            : seed
                              ? "border-violet-400/40 bg-violet-500/10 hover:border-violet-400/70"
                              : "border-muted-foreground/20 bg-muted/10 hover:border-emerald-400/40 hover:bg-emerald-500/5"
                        }
                      `}
                      title={isDisasterFlash ? "Disaster struck here — rebuild!" : tile ? `${tile.name} — ${tile.bonus}` : seed ? "Dormant seed — place next to it" : "Empty — click to place"}
                    >
                      <span className="text-2xl">
                        {isDisasterFlash ? "💥" : tile ? tile.icon : seed ? "✨" : ""}
                      </span>
                      {inCombo && !isDisasterFlash && (
                        <span className="absolute -top-1 -right-1 text-[0.6rem] text-pink-300">★</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Aggregated world bonuses */}
            <div className="stat-card">
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">Aggregated bonuses from {authoredWorlds.length} authored world(s)</div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-cyan-300 border-cyan-400/40">+{(wProd * 100).toFixed(0)}% prod</Badge>
                <Badge variant="outline" className="text-amber-300 border-amber-400/40">+{(wCap * 100).toFixed(0)}% cap</Badge>
                <Badge variant="outline" className="text-emerald-300 border-emerald-400/40">+{(wEp * 100).toFixed(0)}% EP</Badge>
                <Badge variant="outline" className="text-violet-300 border-violet-400/40">+{(wPop * 100).toFixed(0)}% pop</Badge>
              </div>
            </div>

            {/* Author UI (preserved) */}
            <section className="stat-card">
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">Author a new world (costs 1 Genesis Seed)</div>
              <ConfigPicker
                label="Cradle World"
                items={CRADLE_WORLDS.map((c) => ({ id: c.id, name: c.name, icon: c.icon, blurb: c.blurb }))}
                selected={pending.cradleWorldId}
                onSelect={(id) => setPendingWorldConfig({ cradleWorldId: id })}
              />
              <ConfigPicker
                label="Prime Condition"
                items={PRIME_CONDITIONS.map((c) => ({ id: c.id, name: c.name, icon: c.icon, blurb: c.blurb }))}
                selected={pending.primeConditionId}
                onSelect={(id) => setPendingWorldConfig({ primeConditionId: id })}
              />
              <ConfigPicker
                label="Sacred Geography"
                items={SACRED_GEOGRAPHIES.map((c) => ({ id: c.id, name: c.name, icon: c.icon, blurb: c.blurb }))}
                selected={pending.sacredGeographyId}
                onSelect={(id) => setPendingWorldConfig({ sacredGeographyId: id })}
              />
              <ConfigPicker
                label="Dormant Seed"
                items={DORMANT_SEEDS.map((c) => ({ id: c.id, name: c.name, icon: c.icon, blurb: c.blurb }))}
                selected={pending.dormantSeedId}
                onSelect={(id) => setPendingWorldConfig({ dormantSeedId: id })}
              />
              <ConfigPicker
                label="Difficulty Tier"
                items={DIFFICULTY_TIERS.map((c) => ({ id: c.id, name: c.name, icon: c.icon, blurb: c.blurb }))}
                selected={pending.difficultyTierId}
                onSelect={(id) => setPendingWorldConfig({ difficultyTierId: id })}
              />
              <div className="flex justify-end mt-2">
                <Button size="sm" disabled={!canAuthor || genesisSeeds < 1} onClick={() => authorWorld()}>
                  Author World (1 Seed)
                </Button>
              </div>
            </section>

            {/* Authored Worlds */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">Authored worlds ({authoredWorlds.length})</div>
              {authoredWorlds.length === 0 ? (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  No worlds authored yet. Author 1 to unlock Layer 5 (Apotheosis).
                </div>
              ) : (
                <div className="space-y-1.5">
                  {authoredWorlds.map((w) => {
                    const cr = CRADLE_WORLD_MAP[w.cradleWorldId];
                    const pc = PRIME_CONDITION_MAP[w.primeConditionId];
                    const sg = SACRED_GEOGRAPHY_MAP[w.sacredGeographyId];
                    const ds = DORMANT_SEED_MAP[w.dormantSeedId];
                    const dt = DIFFICULTY_TIER_MAP[w.difficultyTierId];
                    return (
                      <div key={w.id} className="stat-card flex items-center gap-2 py-2">
                        <span className="text-xl">{cr?.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold">{cr?.name}</span>
                            <Badge variant="outline" className="text-[0.6rem]">{pc?.name}</Badge>
                            <Badge variant="outline" className="text-[0.6rem]">{sg?.name}</Badge>
                            <Badge variant="outline" className="text-[0.6rem]">{ds?.name}</Badge>
                            <Badge variant="outline" className="text-[0.6rem]">{dt?.name}</Badge>
                          </div>
                          <div className="text-[0.6rem] text-muted-foreground mt-0.5">
                            +{((cr?.productionMult || 0) + (dt?.productionMult || 0)) * 100}% prod, +{(pc?.capMult || 0) * 100}% cap, +{((sg?.epMult || 0) + (dt?.epMult || 0)) * 100}% EP, +{(ds?.popGrowthMult || 0) * 100}% pop
                          </div>
                        </div>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1">
          The <span className="text-emerald-300">Sacred Grid</span> is the new gameplay loop — place tiles strategically to maximize combos and adjacency bonuses.
          Author at least 1 world to unlock Layer 5 (Apotheosis).
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShow(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TilePicker({ activeTileId, onSelect }: { activeTileId: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {TILE_TYPES.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`stat-card text-left p-1.5 flex items-center gap-1 ${activeTileId === t.id ? "border-amber-400/60 bg-amber-500/10" : ""}`}
        >
          <span className="text-lg">{t.icon}</span>
          <div className="min-w-0">
            <div className="text-[0.65rem] font-medium leading-none">{t.name}</div>
            <div className="text-[0.55rem] text-muted-foreground mt-0.5 leading-tight">{t.bonus}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function ConfigPicker({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string;
  items: { id: string; name: string; icon: string; blurb: string }[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mb-2">
      <div className="text-[0.65rem] text-muted-foreground mb-1">{label}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onSelect(it.id)}
            className={`stat-card text-left p-1.5 ${selected === it.id ? "border-amber-400/60 bg-amber-500/10" : ""}`}
          >
            <div className="flex items-center gap-1">
              <span className="text-sm">{it.icon}</span>
              <span className="text-[0.65rem] font-medium truncate">{it.name}</span>
            </div>
            <div className="text-[0.55rem] text-muted-foreground mt-0.5 leading-tight line-clamp-2">{it.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
