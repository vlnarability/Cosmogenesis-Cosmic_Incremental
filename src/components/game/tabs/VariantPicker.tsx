"use client";

import { useGameStore, isSystemCapped } from "@/game/state/store";
import { systemCost } from "@/game/data/systems";
import { TECH_MAP } from "@/game/data/techs";
import { ARCHETYPE_MAP } from "@/game/data/archetypes";
import { formatNumber, resourceColor, resourceIcon } from "../shared/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Lock,
  Power,
  PowerOff,
  AlertCircle,
  GitMerge,
  CheckCircle2,
  Sparkles,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemDef } from "@/game/state/types";

interface VariantPickerProps {
  groupName: string;
  /** Tagline shown next to the group name (e.g. "Cell Wall" / "Movement"). */
  groupTag?: string;
  /** All systems belonging to this mutually-exclusive group. */
  variants: SystemDef[];
}

/**
 * VariantPicker renders a group of mutually-exclusive systems as an explicit
 * "choose one of three" picker. The player picks ONE variant; the others lock
 * for the rest of the run.
 *
 * Visual states per variant:
 *  - CHOSEN   — bought at least once. Shows "✓ Chosen" badge, can still buy more
 *               (up to maxOwned) so the player can scale their chosen path.
 *  - LOCKED   — a different variant was chosen. Greyed out, button disabled,
 *               shows "Locked — chose X instead".
 *  - AVAILABLE — no variant chosen yet, or this is the chosen one. Shows full
 *               cost/production info with a prominent "Choose This" button.
 */
export function VariantPicker({ groupName, groupTag, variants }: VariantPickerProps) {
  const ownedSystems = useGameStore((s) => s.ownedSystems);
  const lockedSystems = useGameStore((s) => s.lockedSystems);
  const technologies = useGameStore((s) => s.technologies);

  // Determine which variant (if any) has been chosen this run.
  const chosenId = variants.find((v) => (ownedSystems[v.id] || 0) > 0)?.id ?? null;
  const anyChosen = chosenId !== null;
  const chosenVariant = chosenId ? variants.find((v) => v.id === chosenId) : null;

  // Sanity check: lockedSystems should match chosenId's siblings. We trust the
  // store, but fall back to checking ownedSystems for resilience against
  // partially-migrated saves.
  const isLocked = (sys: SystemDef) =>
    (lockedSystems && !!lockedSystems[sys.id]) ||
    (anyChosen && sys.id !== chosenId);

  // Count how many variants have their tech prereq met (for the header badge)
  const techAvailableCount = variants.filter(
    (v) => !v.requiredTech || technologies[v.requiredTech]
  ).length;

  return (
    <Card className="glass-panel border-amber-500/40 ring-1 ring-amber-500/10">
      {/* Top accent strip — distinct from regular system cards */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{
          background:
            "linear-gradient(90deg, #f59e0b 0%, #f97316 50%, transparent 100%)",
        }}
      />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-amber-300">Choose Your Path</span>
              <span className="text-muted-foreground/70">·</span>
              <span className="text-foreground">{groupName}</span>
            </CardTitle>
            <CardDescription className="mt-1 leading-snug">
              These variants are mutually exclusive. Pick ONE — the others will
              be locked for the rest of this run. The choice shapes your
              lineage drift and late-game economy, so choose with intent.
              {groupTag && (
                <span className="block text-[0.7rem] mt-0.5 text-muted-foreground/70">
                  Category: {groupTag}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "text-[0.6rem] flex items-center gap-1",
                anyChosen
                  ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                  : "border-amber-500/50 text-amber-400 bg-amber-500/10"
              )}
            >
              {anyChosen ? (
                <>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Path chosen
                </>
              ) : (
                <>
                  <Sparkles className="w-2.5 h-2.5" />
                  Decision pending
                </>
              )}
            </Badge>
            {techAvailableCount < variants.length && (
              <Badge
                variant="outline"
                className="text-[0.55rem] border-red-500/40 text-red-400/80 bg-red-500/5 flex items-center gap-1"
                title="Some variants require a tech you haven't researched yet"
              >
                <Lock className="w-2.5 h-2.5" />
                {techAvailableCount}/{variants.length} unlocked
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {variants.map((sys) => (
            <VariantCard
              key={sys.id}
              sys={sys}
              chosen={sys.id === chosenId}
              locked={isLocked(sys)}
              chosenVariantName={chosenVariant?.name}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface VariantCardProps {
  sys: SystemDef;
  chosen: boolean;
  locked: boolean;
  chosenVariantName?: string;
}

function VariantCard({ sys, chosen, locked, chosenVariantName }: VariantCardProps) {
  const resources = useGameStore((s) => s.resources);
  const capacities = useGameStore((s) => s.capacities);
  const ownedSystems = useGameStore((s) => s.ownedSystems);
  const systemEnabled = useGameStore((s) => s.systemEnabled);
  const technologies = useGameStore((s) => s.technologies);
  const upgrades = useGameStore((s) => s.upgrades);
  const buySystem = useGameStore((s) => s.buySystem);
  const toggleSystem = useGameStore((s) => s.toggleSystem);
  const [qty, setQty] = useState(1);

  const costReduction = (upgrades["frugality"] || 0) * 0.04;
  const owned = ownedSystems[sys.id] || 0;
  const cost = systemCost(sys, owned, costReduction);
  const canAfford = Object.entries(cost).every(
    ([r, v]) => (resources[r] || 0) >= (v as number)
  );
  const atMax = sys.maxOwned ? owned >= sys.maxOwned : false;
  const techLocked = !!sys.requiredTech && !technologies[sys.requiredTech];
  const enabled = systemEnabled[sys.id] !== false;
  const capped = owned > 0 && isSystemCapped(sys.id, resources, capacities);
  const archDef = sys.grantsAffinity ? ARCHETYPE_MAP[sys.grantsAffinity.archetype] : null;

  // The variant is "available to be chosen" if:
  //  - no variant in the group has been chosen yet, AND
  //  - this variant's tech prereq is satisfied.
  // Once a variant has been chosen, the chosen one can still be bought more
  // (up to maxOwned) — handled by the regular buy button.
  const availableToChoose = !locked && !chosen && !techLocked;
  const canChooseNow = availableToChoose && canAfford && !atMax;
  const canBuyMore = chosen && !atMax && !techLocked && canAfford;

  return (
    <Card
      className={cn(
        "glass-panel relative overflow-hidden transition-all",
        chosen && "ring-2 ring-emerald-500/40 border-emerald-500/40",
        locked && "opacity-50 grayscale-[40%]",
        !chosen && !locked && "hover:border-amber-500/40 hover:ring-1 hover:ring-amber-500/20"
      )}
    >
      {/* Top accent strip — green if chosen, red if locked, amber if available */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: chosen
            ? "linear-gradient(90deg, #10b981 0%, transparent 100%)"
            : locked
            ? "linear-gradient(90deg, #6b7280 0%, transparent 100%)"
            : "linear-gradient(90deg, #f59e0b 0%, transparent 100%)",
        }}
      />

      {/* State badge */}
      <div className="absolute top-2 right-2 z-10">
        {chosen ? (
          <Badge
            variant="outline"
            className="text-[0.6rem] border-emerald-500/50 text-emerald-400 bg-emerald-500/10 flex items-center gap-1"
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
            Chosen
          </Badge>
        ) : locked ? (
          <Badge
            variant="outline"
            className="text-[0.6rem] border-muted-foreground/40 text-muted-foreground bg-muted/20 flex items-center gap-1"
          >
            <Ban className="w-2.5 h-2.5" />
            Locked
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-[0.6rem] border-amber-500/50 text-amber-400 bg-amber-500/10 flex items-center gap-1"
          >
            <Sparkles className="w-2.5 h-2.5" />
            Available
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2 pr-12">
        <div className="flex items-start gap-2 min-w-0">
          <div className="text-2xl shrink-0">{sys.icon}</div>
          <div className="min-w-0">
            <CardTitle className="text-sm leading-tight">{sys.name}</CardTitle>
            <CardDescription className="text-xs mt-0.5 leading-snug">
              {sys.desc}
            </CardDescription>
            {archDef && (
              <Badge
                variant="outline"
                className="text-[0.6rem] mt-1"
                style={{ borderColor: `${archDef.color}50`, color: archDef.color }}
                title={`Grants ${archDef.name} lineage affinity`}
              >
                {archDef.glyph} {archDef.name} drift +{sys.grantsAffinity!.amount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Locked-due-to-variant-choice notice */}
        {locked && chosenVariantName && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 border border-border rounded px-2 py-1">
            <Ban className="w-3 h-3 shrink-0" />
            <span>
              Locked — chose <span className="font-semibold">{chosenVariantName}</span> instead
            </span>
          </div>
        )}

        {/* Tech prereq notice (still shown even when chosen, if tech somehow lost) */}
        {techLocked && !locked && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-1">
            <Lock className="w-3 h-3 shrink-0" />
            <span>
              Requires tech: <span className="font-semibold">{TECH_MAP[sys.requiredTech!]?.name}</span>
            </span>
          </div>
        )}

        {/* Capped warning — only relevant for the chosen variant after purchase */}
        {chosen && capped && owned > 0 && enabled && (
          <div className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Output at capacity — idling to save upkeep</span>
          </div>
        )}

        {/* Disabled notice — only relevant for the chosen variant */}
        {chosen && !enabled && owned > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 border border-border rounded px-2 py-1">
            <PowerOff className="w-3 h-3 shrink-0" />
            <span>Disabled — no production, no upkeep</span>
          </div>
        )}

        {/* Production */}
        {Object.keys(sys.produces).length > 0 && (
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="text-muted-foreground">Produces:</span>
            {Object.entries(sys.produces).map(([r, v]) => (
              <span key={r} className="font-semibold" style={{ color: resourceColor(r) }}>
                +{formatNumber((v as number) * Math.max(1, owned), 2)}/s {resourceIcon(r)}
              </span>
            ))}
          </div>
        )}

        {/* Capacity boost */}
        {sys.capacityBoost && Object.keys(sys.capacityBoost).length > 0 && owned > 0 && (
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="text-muted-foreground">Capacity:</span>
            {Object.entries(sys.capacityBoost).map(([r, v]) => (
              <span key={r} style={{ color: resourceColor(r) }}>
                +{(v as number) * owned}
              </span>
            ))}
          </div>
        )}

        {/* Upkeep */}
        {sys.upkeep && Object.keys(sys.upkeep).length > 0 && owned > 0 && (
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="text-muted-foreground">Upkeep:</span>
            {Object.entries(sys.upkeep).map(([r, v]) => (
              <span key={r} className="text-red-400">
                −{formatNumber((v as number) * owned, 2)}/s {resourceIcon(r)}
              </span>
            ))}
          </div>
        )}

        {/* Cost */}
        {!locked && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(cost).map(([r, v]) => {
                const have = resources[r] || 0;
                const enough = have >= (v as number);
                return (
                  <span
                    key={r}
                    className={enough ? "" : "text-red-400"}
                    style={enough ? { color: resourceColor(r) } : undefined}
                  >
                    {resourceIcon(r)}
                    {formatNumber(v as number)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Action area */}
        {locked ? (
          <Button size="sm" variant="ghost" className="h-8 w-full" disabled>
            <Ban className="w-3.5 h-3.5 mr-1" />
            Locked
          </Button>
        ) : chosen ? (
          /* Already chosen — allow buying more (up to maxOwned) */
          <div className="pt-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary" className="text-xs">×{owned} owned</Badge>
              {owned > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleSystem(sys.id)}
                  title={enabled ? "Disable (idle this system)" : "Enable"}
                >
                  {enabled ? (
                    <Power className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <PowerOff className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </Button>
              )}
            </div>
            {/* Show buy-more UI when the variant has no maxOwned cap (infinite
                scaling) OR a maxOwned > 1. When maxOwned === 1 (e.g. ascension
                spires), there's nothing more to buy after the first purchase. */}
            {!sys.maxOwned || sys.maxOwned > 1 ? (
              <>
                <div className="flex items-center gap-1">
                  {[1, 10, 100].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setQty(preset)}
                      className={cn(
                        "flex-1 text-xs py-1 rounded border transition-colors tabular-nums",
                        qty === preset
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-semibold"
                          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-foreground/40"
                      )}
                    >
                      ×{preset}
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="h-8 w-full"
                  disabled={!canBuyMore}
                  onClick={() => buySystem(sys.id, qty)}
                >
                  {atMax ? "Max owned" : `Build ${qty > 1 ? `×${qty}` : "more"}`}
                </Button>
              </>
            ) : (
              <Button size="sm" className="h-8 w-full" disabled>
                {atMax ? "Max owned" : "Already built"}
              </Button>
            )}
          </div>
        ) : (
          /* Available to choose — prominent "Choose This" button */
          <Button
            size="sm"
            className="h-9 w-full bg-amber-600 hover:bg-amber-600/90 text-white border border-amber-400/30"
            disabled={!canChooseNow}
            onClick={() => buySystem(sys.id, 1)}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            {techLocked
              ? "Requires tech"
              : !canAfford
              ? "Too costly"
              : "Choose This Path"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
