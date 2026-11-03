"use client";

import { useState } from "react";
import { useGameStore } from "@/game/state/store";
import {
  ALL_COSMETICS,
  COSMETIC_MAP,
  COSMETIC_CATEGORIES,
  type CosmeticCategory,
} from "@/game/data/cosmetics";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gem, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const RARITY_COLORS: Record<string, string> = {
  common: "text-muted-foreground border-border",
  uncommon: "text-emerald-400 border-emerald-500/40",
  rare: "text-cyan-400 border-cyan-500/40",
  epic: "text-violet-400 border-violet-500/40",
  legendary: "text-amber-400 border-amber-500/40",
  mythic: "text-rose-400 border-rose-500/40",
};

export function CosmeticsModal() {
  const show = useGameStore((s) => s.showCosmetics);
  const setShow = useGameStore((s) => s.setShowCosmetics);
  const aetherShards = useGameStore((s) => s.aetherShards || 0);
  const ownedCosmetics = useGameStore((s) => s.ownedCosmetics || {});
  const activeCosmetics = useGameStore((s) => s.activeCosmetics || {});
  const purchaseCosmetic = useGameStore((s) => s.purchaseCosmetic);
  const equipCosmetic = useGameStore((s) => s.equipCosmetic);

  const [activeCategory, setActiveCategory] = useState<CosmeticCategory>("theme");

  const activeCatDef = COSMETIC_CATEGORIES.find((c) => c.id === activeCategory)!;

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Gem className="w-5 h-5 text-fuchsia-400" />
            Cosmetics
          </DialogTitle>
          <DialogDescription>
            Visual customization. Earn Aether Shards by prestiging (1 per 100 EP per run, max 50/run).
          </DialogDescription>
        </DialogHeader>

        {/* Top bar: Aether Shard balance + owned count */}
        <div className="flex items-center gap-3 stat-card mb-3">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Aether Shards</div>
            <div className="text-xl font-bold tabular-nums text-fuchsia-300">
              ◈ {Math.floor(aetherShards)}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Collection</div>
            <div className="text-xs mt-1">
              <span className="font-semibold">
                {Object.values(ownedCosmetics).filter(Boolean).length}/{ALL_COSMETICS.length}
              </span>{" "}
              cosmetics owned
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 mb-3 border-b border-border/40 pb-2 overflow-x-auto">
          {COSMETIC_CATEGORIES.map((cat) => {
            const ownedInCat = cat.items.filter((c) => ownedCosmetics[c.id]).length;
            return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                activeCategory === cat.id
                  ? "bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
              )}
            >
              <span className="text-sm">{cat.icon}</span>
              {cat.label}
              <Badge variant="outline" className="text-[0.55rem] ml-1">
                {ownedInCat}/{cat.items.length}
              </Badge>
            </button>
            );
          })}
        </div>

        {/* Items grid for active category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {activeCatDef.items.map((cos) => {
            const owned = !!ownedCosmetics[cos.id];
            const active = activeCosmetics[cos.category] === cos.id;
            const canAfford = aetherShards >= cos.cost;
            const rarityClass = RARITY_COLORS[cos.rarity || "common"];

            return (
              <div
                key={cos.id}
                className={cn(
                  "stat-card transition-all relative",
                  active && "border-fuchsia-500/60 ring-1 ring-fuchsia-500/30",
                  !owned && cos.cost > 0 && "opacity-90"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded flex items-center justify-center text-lg shrink-0 border",
                    rarityClass,
                    "bg-muted/30"
                  )}>
                    {cos.icon || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold truncate">{cos.name}</span>
                      {cos.rarity && cos.rarity !== "common" && (
                        <Badge variant="outline" className={cn("text-[0.55rem] capitalize", rarityClass)}>
                          {cos.rarity}
                        </Badge>
                      )}
                      {active && (
                        <Badge variant="outline" className="text-[0.55rem] text-fuchsia-300 border-fuchsia-500/40">
                          ✓ Equipped
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{cos.desc}</div>
                    <div className="text-[0.65rem] text-fuchsia-300 mt-1">
                      {cos.cost === 0 ? "Free" : `◈ ${cos.cost}`}
                    </div>
                    <div className="mt-2">
                      {owned ? (
                        active ? (
                          <Badge variant="outline" className="text-[0.65rem] text-emerald-400 border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Equipped
                          </Badge>
                        ) : (
                          <Button size="sm" className="h-7 text-xs" onClick={() => equipCosmetic(cos.id)}>
                            <Sparkles className="w-3 h-3 mr-1" /> Equip
                          </Button>
                        )
                      ) : (
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={!canAfford}
                          onClick={() => {
                            if (purchaseCosmetic(cos.id)) equipCosmetic(cos.id);
                          }}
                        >
                          {!canAfford ? `Need ◈${cos.cost}` : `Buy (◈${cos.cost})`}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShow(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
