"use client";

import { useGameStore } from "@/game/state/store";
import { UNIVERSAL_GALAXY_MAP, WORLDS_PER_NEW_SYSTEM_L6 } from "@/game/data/universalMap";
import { GALAXY_SYSTEM_MAP } from "@/game/data/galaxyMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Star as StarIcon, Telescope, Swords, ChevronRight,
  Crosshair, CheckCircle2,
} from "lucide-react";

// ============================================================
// C4 — SystemDrillView
//
// Renders the detail panel for a single star system drilled
// into from the galaxy hex map. Two cases:
//
//  1. Starter galaxy (galaxy_starter): the system id matches
//     a real L4 GALAXY_SYSTEM (sys_01..sys_50) — show its
//     name, bonus, rare resource, and scan/claim actions.
//
//  2. Non-starter galaxy (L6 universal): the system id is a
//     synthesized index `${galaxyId}#${i}`. Show the system's
//     index within the galaxy, owner, and (for new-L6 neutral
//     galaxies) an "Attack this system" action that calls the
//     L6 attackUniversalGalaxy store action (which advances
//     systemsClaimed by 1).
// ============================================================

export interface SystemDrillViewProps {
  galaxyId: string;
  systemId: string;
}

export function SystemDrillView({ galaxyId, systemId }: SystemDrillViewProps) {
  const galaxy = UNIVERSAL_GALAXY_MAP[galaxyId];
  const universalGalaxies = useGameStore((s) => s.universalGalaxies || []);
  const galaxySystems = useGameStore((s) => s.galaxySystems || []);
  const scanGalaxySystem = useGameStore((s) => s.scanGalaxySystem);
  const claimGalaxySystem = useGameStore((s) => s.claimGalaxySystem);
  const attackUniversalGalaxy = useGameStore((s) => s.attackUniversalGalaxy);
  const divinity = useGameStore((s) => s.divinity || 0);
  const faith = useGameStore((s) => s.faith || 0);
  const drillBackCosmos = useGameStore((s) => s.drillBackCosmos);
  const debugFreeBuy = useGameStore((s) => s.debugFreeBuy);

  if (!galaxy) return null;
  const uState = universalGalaxies.find((g) => g.id === galaxyId);

  // ----- Case 1: starter galaxy (real L4 system) -----
  // The starter's systems are the L4 GALAXY_SYSTEMS (ids "sys_01".."sys_50").
  // When the user drills into the starter galaxy from L6, we route them to
  // the L4 Genesis modal, which has its own per-system interaction. So this
  // branch only fires when systemId matches a real L4 system id (defensive —
  // the modal normally intercepts the click first).
  if (systemId.startsWith("sys_")) {
    const sys = GALAXY_SYSTEM_MAP[systemId];
    if (!sys) return null;
    const st = galaxySystems.find((g) => g.id === systemId);
    const explored = st?.explored ?? sys.explored;
    const claimed = st?.claimed ?? false;
    return (
      <div className="stat-card drill-system-detail">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xl">{claimed ? "⭐" : explored ? "·" : "?"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-cyan-200 truncate">{sys.name}</span>
              <Badge variant="outline" className="text-[0.55rem] text-muted-foreground">
                System #{systemId.replace("sys_", "")}
              </Badge>
            </div>
            <div className="text-[0.6rem] text-muted-foreground mt-0.5">
              Starter galaxy · {galaxy.name}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[0.65rem] font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bonus</span>
            <span className="text-amber-300">{sys.bonus.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Value</span>
            <span className="text-amber-300">
              {sys.bonus.value > 0 ? "+" : ""}{Math.round(sys.bonus.value * 100)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Void Shards</span>
            <span className={sys.hasVoidShards ? "text-violet-300" : "text-muted-foreground/60"}>
              {sys.hasVoidShards ? "✓ Present" : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className={claimed ? "text-emerald-300" : explored ? "text-cyan-300" : "text-muted-foreground"}>
              {claimed ? "Claimed" : explored ? "Explored" : "Unknown"}
            </span>
          </div>
        </div>

        {!explored && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-full mt-2 text-[0.65rem] border-violet-400/40 text-violet-200"
            disabled={!debugFreeBuy && divinity < 5}
            onClick={() => scanGalaxySystem(systemId)}
          >
            <Telescope className="w-3 h-3 mr-1" /> Scan (5 Divinity)
          </Button>
        )}
        {explored && !claimed && (
          <Button
            size="sm"
            variant="default"
            className="h-7 w-full mt-2 text-[0.65rem]"
            disabled={!debugFreeBuy && divinity < 10}
            onClick={() => claimGalaxySystem(systemId)}
          >
            <StarIcon className="w-3 h-3 mr-1" /> Claim (10 Divinity)
          </Button>
        )}
        {claimed && (
          <div className="mt-2 rounded-md border border-emerald-400/40 bg-emerald-500/10 p-1.5 text-[0.6rem] text-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Claimed — contributes +10 worlds to the Divine Engine.
          </div>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-full mt-2 text-[0.6rem] text-muted-foreground"
          onClick={() => drillBackCosmos("galaxy")}
        >
          <ChevronRight className="w-3 h-3 rotate-180 mr-1" /> Back to galaxy map
        </Button>
      </div>
    );
  }

  // ----- Case 2: non-starter galaxy (synthesized system id `${galaxyId}#${i}`) -----
  const idxMatch = systemId.match(/#(\d+)$/);
  const idx = idxMatch ? parseInt(idxMatch[1], 10) : -1;
  if (idx < 0 || !uState) return null;

  const systemCount = Math.max(1, Math.min(120, galaxy.systemCount));
  const claimedCount = Math.min(systemCount, uState.systemsClaimed);
  const isClaimed = idx < claimedCount;
  const owner = uState.ownerId;

  // Cost to claim the next system on this galaxy (matches GalaxyDrillView's formula).
  const newSystemsClaimedAcrossUniverse = universalGalaxies
    .filter((g) => UNIVERSAL_GALAXY_MAP[g.id]?.isNewL6)
    .reduce((sum, g) => sum + Math.max(0, Math.min(UNIVERSAL_GALAXY_MAP[g.id]?.systemCount || 0, g.systemsClaimed)), 0);
  const attackCost = Math.ceil(50 * Math.pow(1.05, newSystemsClaimedAcrossUniverse));

  // Can the player attack this specific system right now?
  // Only if it's the NEXT unclaimed one (idx === claimedCount) on a new-L6 galaxy.
  const canAttack = galaxy.isNewL6 && owner === "neutral" && idx === claimedCount;
  const canAffordAttack = debugFreeBuy || faith >= attackCost;

  return (
    <div className="stat-card drill-system-detail">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xl">{isClaimed ? "⭐" : "·"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-cyan-200 truncate">
              System #{idx + 1}
            </span>
            <Badge variant="outline" className="text-[0.55rem] text-muted-foreground">
              of {systemCount}
            </Badge>
          </div>
          <div className="text-[0.6rem] text-muted-foreground mt-0.5">
            {galaxy.name}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[0.65rem] font-mono">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Owner</span>
          <span className={owner === "player" ? "text-amber-300" : owner.startsWith("rival_") ? "text-pink-300" : "text-slate-300"}>
            {owner === "player" ? "You" : owner.startsWith("rival_") ? `Rival ${owner.replace("rival_", "")}` : "Neutral"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className={isClaimed ? "text-emerald-300" : "text-cyan-300"}>
            {isClaimed ? "Claimed" : "Unclaimed"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Heresy</span>
          <span className={uState.heresy > 50 ? "text-red-300" : "text-slate-300"}>
            {Math.floor(uState.heresy)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Reward</span>
          <span className="text-amber-300">+{WORLDS_PER_NEW_SYSTEM_L6} worlds</span>
        </div>
      </div>

      {canAttack && (
        <Button
          size="sm"
          variant="default"
          className="h-7 w-full mt-2 text-[0.65rem] bg-amber-600/70 hover:bg-amber-600"
          disabled={!canAffordAttack}
          onClick={() => attackUniversalGalaxy(galaxyId)}
          title={`Launch attack — cost ${attackCost} Faith`}
        >
          <Swords className="w-3 h-3 mr-1" /> Attack ({attackCost} Faith)
        </Button>
      )}
      {!canAttack && !isClaimed && (
        <div className="mt-2 rounded-md border border-amber-400/20 bg-amber-500/5 p-1.5 text-[0.6rem] text-amber-200/80 flex items-center gap-1">
          <Crosshair className="w-3 h-3" />
          {idx < claimedCount
            ? "This system will be claimed in order — claim the next available one."
            : `Claim systems in order — next is #${claimedCount + 1}.`}
        </div>
      )}
      {isClaimed && (
        <div className="mt-2 rounded-md border border-emerald-400/40 bg-emerald-500/10 p-1.5 text-[0.6rem] text-emerald-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Claimed — contributed +{WORLDS_PER_NEW_SYSTEM_L6} worlds.
        </div>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-full mt-2 text-[0.6rem] text-muted-foreground"
        onClick={() => drillBackCosmos("galaxy")}
      >
        <ChevronRight className="w-3 h-3 rotate-180 mr-1" /> Back to galaxy map
      </Button>
    </div>
  );
}
