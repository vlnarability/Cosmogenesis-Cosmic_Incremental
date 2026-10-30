"use client";

import { useGameStore } from "@/game/state/store";
import { techsForStage, TECH_MAP, TECHS } from "@/game/data/techs";
import { STAGES, STAGE_IDS } from "@/game/data/stages";
import { useActiveLayer } from "@/game/state/layerHelpers";
import { ARCHETYPE_MAP } from "@/game/data/archetypes";
import { formatNumber, resourceColor, resourceIcon } from "../shared/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Lock, GitBranch, History, Layers, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import type { TechDef } from "@/game/state/types";
import { PurchaseErrorBanner } from "../shared/PurchaseErrorBanner";

// Determine which stage indices are "legacy" (collapsed into the Legacy accordion).
function legacyStageRange(stageIndex: number, isL2Plus: boolean, isL5Plus: boolean): { start: number; end: number } {
  if (isL5Plus) return { start: 0, end: Math.min(5, stageIndex) }; // Stages 1-5
  if (isL2Plus) return { start: 0, end: Math.min(2, stageIndex) }; // Stages 1-2
  return { start: 0, end: 0 };
}

export function TechTab() {
  const stageIndex = useGameStore((s) => s.stageIndex);
  const technologies = useGameStore((s) => s.technologies);
  const lockedArchetype = useGameStore((s) => s.lockedArchetype);

  const { isAtLeast } = useActiveLayer();
  const isL2Plus = isAtLeast("enlightenment");
  const isL5Plus = isAtLeast("apotheosis");

  const stage = STAGES[stageIndex];
  // FIX-ARCHETYPE-LOCKED — hide techs whose requiredArchetype doesn't
  // match the player's locked archetype. They aren't visible at all.
  // HIDE-PREREQ-LOCKED — per user request: 'Hide all Systems that are not
  // unlocked yet. That will heavily reduce early stage clutter.' Same
  // principle for techs: hide techs whose prerequisites are NOT met AND
  // that the player hasn't already researched. Already-researched techs
  // stay visible (player owns them). Tier-1 techs (no requires) stay
  // visible (always available).
  // HIDE-MODAL-CHOICE-TECHS — the 6 modal-choice techs (3 FTL methods +
  // 3 ascension paths) are hiddenFromTechTab — they're only obtainable
  // via the choice modal that fires when the prerequisite tech
  // (ftl_theory / ascension_theory) is researched. Never show them in
  // the Tech tab itself (player would be confused — they can't research
  // them directly).
  // RARE-RESOURCE-UNLOCK — techs with requiresRareResource are only visible
  // when the player has discovered that rare resource.
  const rareResources = useGameStore((s) => s.rareResources || {});
  const reliquary = useGameStore((s) => s.reliquary || {});
  const currentTechs = useMemo(
    () =>
      techsForStage(stage.id).filter((t) => {
        if (t.hiddenFromTechTab) return false;
        if (t.requiredArchetype && lockedArchetype !== t.requiredArchetype) return false;
        // Rare-resource-unlocked techs: show only when discovered.
        // F1 RELIQUARY: discovery = (stockpiled + consumed) >= 1.
        if (t.requiresRareResource && ((rareResources[t.requiresRareResource] || 0) + (reliquary[t.requiresRareResource] || 0)) <= 0) return false;
        // Hide techs whose prereqs aren't met AND aren't already researched.
        const prereqMet = !t.requires || t.requires.every((r) => technologies[r]);
        if (!prereqMet && !technologies[t.id]) return false;
        return true;
      }),
    [stage.id, lockedArchetype, technologies, rareResources, reliquary]
  );

  const legacyRange = useMemo(
    () => legacyStageRange(stageIndex, isL2Plus, isL5Plus),
    [stageIndex, isL2Plus, isL5Plus]
  );
  const middleStages = useMemo(() => {
    const list: typeof STAGES = [];
    for (let i = legacyRange.end; i < stageIndex; i++) {
      list.push(STAGES[i]);
    }
    return list;
  }, [legacyRange.end, stageIndex]);
  const legacyStages = useMemo(() => STAGES.slice(legacyRange.start, legacyRange.end), [legacyRange]);

  const [legacyOpen, setLegacyOpen] = useState(false);

  // Counts for legacy summary
  const legacyTechsTotal = useMemo(() => {
    return legacyStages.reduce((sum, st) => sum + techsForStage(st.id).length, 0);
  }, [legacyStages]);
  const legacyTechsResearched = useMemo(() => {
    return legacyStages.reduce((sum, st) => {
      const tech = techsForStage(st.id);
      return sum + tech.filter((t) => technologies[t.id]).length;
    }, 0);
  }, [legacyStages, technologies]);

  const hasLegacy = legacyStages.length > 0;
  const hasMiddle = middleStages.length > 0;

  // Group current stage techs by branch
  const currentBranches = groupByBranch(currentTechs);

  // ROUND D2 — Tree view toggle. The giant tech tree spans Tribal→Galactic.
  // At Cell/Creature (Mutations/Discoveries), only list view is available.
  const isTreeStage = stageIndex >= 2; // Tribal (index 2) onward
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");

  return (
    <div className="space-y-4">
      {/* P7 — Inline purchase error banner (auto-fades after 2s). */}
      <PurchaseErrorBanner />
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {viewMode === "tree" ? <Network className="w-4 h-4" /> : <GitBranch className="w-4 h-4" />}
                {stage.name} {stage.techLabel || "Technology"}
              </CardTitle>
              <CardDescription>
                {viewMode === "tree"
                  ? "The full tech tree — research across stages. Earlier-stage techs stay researchable; later stages unlock as you advance."
                  : "Research permanent bonuses. Prerequisites must be met before higher tiers unlock."}
              </CardDescription>
            </div>
            {/* ROUND D2 — List/Tree view toggle (Tree only at Tribal+). */}
            {isTreeStage && (
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md border transition-colors flex items-center gap-1",
                    viewMode === "list"
                      ? "border-primary bg-primary/15 text-primary font-semibold"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <GitBranch className="w-3 h-3" /> List
                </button>
                <button
                  onClick={() => setViewMode("tree")}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md border transition-colors flex items-center gap-1",
                    viewMode === "tree"
                      ? "border-primary bg-primary/15 text-primary font-semibold"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Network className="w-3 h-3" /> Tree
                </button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* ROUND D2 — Tree view: horizontally-scrolling stage columns. */}
      {viewMode === "tree" && isTreeStage ? (
        <TechTreeCanvas stageIndex={stageIndex} />
      ) : (
        /* Current stage techs — list view (always shown when not in tree mode). */
        Object.keys(currentBranches).length === 0 ? (
          <Card className="glass-panel">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No techs for this stage yet.
            </CardContent>
          </Card>
        ) : (
          <BranchList branches={currentBranches} />
        )
      )}
    </div>
  );
}

// Group techs by branch.
function groupByBranch(techs: TechDef[]): Record<string, TechDef[]> {
  return techs.reduce((acc, t) => {
    (acc[t.branch] = acc[t.branch] || []).push(t);
    return acc;
  }, {} as Record<string, TechDef[]>);
}

// Render tech branches as SUBTABS — only the selected branch's techs are shown.
function BranchList({ branches }: { branches: Record<string, TechDef[]> }) {
  const branchNames = Object.keys(branches);
  const [activeBranch, setActiveBranch] = useState(branchNames[0] || "");
  const currentBranch = branches[activeBranch] ? activeBranch : branchNames[0] || "";
  const list = branches[currentBranch] || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 border-b border-border pb-2 flex-wrap">
        {branchNames.map((branch) => {
          const blist = branches[branch] || [];
          const researched = blist.filter((t) => useGameStore.getState().technologies[t.id]).length;
          return (
            <button
              key={branch}
              onClick={() => setActiveBranch(branch)}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5",
                branch === currentBranch
                  ? "bg-primary/15 border border-primary text-primary font-semibold"
                  : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              {branch}
              <span className="text-[0.55rem] opacity-70">{researched}/{blist.length}</span>
            </button>
          );
        })}
      </div>
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-accent" />
            {currentBranch} Path
            <BranchBadge list={list} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {list.sort((a, b) => a.tier - b.tier).map((tech) => (
              <TechCard key={tech.id} tech={tech} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BranchBadge({ list }: { list: TechDef[] }) {
  const technologies = useGameStore((s) => s.technologies);
  return (
    <Badge variant="outline" className="text-xs ml-auto">
      {list.filter((t) => technologies[t.id]).length}/{list.length} researched
    </Badge>
  );
}

function TechCard({ tech }: { tech: typeof TECHS[number] }) {
  const resources = useGameStore((s) => s.resources);
  const technologies = useGameStore((s) => s.technologies);
  const buyTech = useGameStore((s) => s.buyTech);
  const debugFreeBuy = useGameStore((s) => s.debugFreeBuy);
  // HIDE-UNKNOWN-LINEAGE — drives ??? masking of the affinity-grant badge.
  const revealedAffinity = useGameStore((s) => s.revealedLineageArchetypes || {});

  const owned = !!technologies[tech.id];
  const prereqMet = !tech.requires || tech.requires.every((r) => technologies[r]);
  const canAfford = debugFreeBuy || Object.entries(tech.cost).every(([r, v]) => (resources[r] || 0) >= (v as number));
  // EITHER-OR — check if an exclusive tech is already researched
  const lockedByExclusive = tech.exclusiveWith?.find((exclId) => technologies[exclId]);
  const lockedByExclusiveName = lockedByExclusive ? TECH_MAP[lockedByExclusive]?.name : undefined;
  const disabled = owned || !prereqMet || !canAfford || !!lockedByExclusive;

  return (
    <div className={`stat-card transition-opacity ${owned ? "opacity-60" : !prereqMet ? "opacity-50" : lockedByExclusive ? "opacity-40 border-red-500/30" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          {owned ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : lockedByExclusive ? (
            <Lock className="w-4 h-4 text-red-400 shrink-0" />
          ) : !prereqMet ? (
            <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <span className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight truncate">
              {tech.name}
            </div>
            <div className="flex items-center flex-wrap gap-1 mt-0.5">
              <Badge variant="outline" className="text-[0.6rem]">Tier {tech.tier} · {tech.branch}</Badge>
              {tech.multiplier?.target === "population" && (
                <Badge
                  variant="outline"
                  className="text-[0.6rem]"
                  style={{ borderColor: "#10b98180", color: "#10b981" }}
                  title="Boosts population growth"
                >
                  👶 Pop Growth
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-2 leading-snug">{tech.desc}</p>
      {/* Prerequisite list */}
      {!owned && tech.requires && tech.requires.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-2 text-xs">
          <span className="text-muted-foreground">Requires:</span>
          {tech.requires.map((req) => {
            const met = technologies[req];
            const reqTech = TECH_MAP[req];
            return (
              <span
                key={req}
                className={cn(
                  "px-1.5 py-0.5 rounded border text-[0.65rem]",
                  met
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                    : "border-red-500/30 text-red-400 bg-red-500/5"
                )}
              >
                {met ? "✓" : "✗"} {reqTech?.name || req}
              </span>
            );
          })}
        </div>
      )}
      {/* Affinity grant — HIDE-UNKNOWN-LINEAGE: mask the archetype name + glyph
          as ??? until the player has locked this lineage in at least once.
          They can still see the drift amount to plan their affinity strategy. */}
      {tech.grantsAffinity && (
        <Badge
          variant="outline"
          className="text-[0.6rem] mb-2"
          style={{
            borderColor: `${ARCHETYPE_MAP[tech.grantsAffinity.archetype].color}50`,
            color: ARCHETYPE_MAP[tech.grantsAffinity.archetype].color,
          }}
          title={`Shifts lineage toward ${ARCHETYPE_MAP[tech.grantsAffinity.archetype].name}`}
        >
          {revealedAffinity[tech.grantsAffinity.archetype]
            ? `${ARCHETYPE_MAP[tech.grantsAffinity.archetype].glyph} ${ARCHETYPE_MAP[tech.grantsAffinity.archetype].name} drift +${tech.grantsAffinity.amount}`
            : `??? drift +${tech.grantsAffinity.amount}`}
        </Badge>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {!owned && (
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(tech.cost).map(([r, v]) => {
              const have = (resources[r] || 0);
              const enough = have >= (v as number);
              return (
                <span
                  key={r}
                  className={enough ? "" : "text-red-400"}
                  style={enough ? { color: resourceColor(r) } : undefined}
                >
                  {resourceIcon(r)}{formatNumber(v as number, 0)}
                </span>
              );
            })}
          </div>
        )}
        <Button
          size="sm"
          variant={owned ? "outline" : "default"}
          className="h-7 ml-auto"
          disabled={disabled}
          onClick={() => buyTech(tech.id)}
        >
          {owned ? "Researched" : lockedByExclusive ? `Locked by ${lockedByExclusiveName}` : !prereqMet ? "Locked" : !canAfford ? "Can't afford" : "Research"}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// ROUND D2 — TechTreeCanvas
// The horizontally-scrolling tech tree. Columns = stages (Tribal → Galactic),
// rows = branches within each stage. Each tech is a compact node card.
// The current stage's column is highlighted; earlier stages are researchable
// (you can catch up on missed techs); later stages are locked ("advance first").
// Per user spec: "horizontally-scrolling columns by stage, with vertical
// position = branch."
// ============================================================

// The stages that form the giant tech tree (Tribal onward).
const TREE_STAGES = STAGE_IDS.slice(2); // ["tribal", "civilization", "empire", "solar", "galactic"]

function TechTreeCanvas({ stageIndex }: { stageIndex: number }) {
  const technologies = useGameStore((s) => s.technologies);
  const lockedArchetype = useGameStore((s) => s.lockedArchetype);
  const rareResources = useGameStore((s) => s.rareResources || {});
  const reliquary = useGameStore((s) => s.reliquary || {});

  // For each tree stage, compute the visible techs (same filter as list view).
  const stageColumns = useMemo(() => {
    return TREE_STAGES.map((stageId) => {
      const stageIdx = STAGE_IDS.indexOf(stageId as any);
      const stageDef = STAGES[stageIdx];
      const techs = techsForStage(stageId).filter((t) => {
        if (t.hiddenFromTechTab) return false;
        if (t.requiredArchetype && lockedArchetype !== t.requiredArchetype) return false;
        if (t.requiresRareResource && ((rareResources[t.requiresRareResource] || 0) + (reliquary[t.requiresRareResource] || 0)) <= 0) return false;
        const prereqMet = !t.requires || t.requires.every((r) => technologies[r]);
        if (!prereqMet && !technologies[t.id]) return false;
        return true;
      });
      const branches = groupByBranch(techs);
      const researched = techs.filter((t) => technologies[t.id]).length;
      return { stageId, stageIdx, stageDef, branches, total: techs.length, researched };
    });
  }, [technologies, lockedArchetype, rareResources, reliquary]);

  return (
    <div className="overflow-x-auto custom-scroll pb-2">
      <div className="flex gap-3 min-w-max">
        {stageColumns.map(({ stageId, stageIdx, stageDef, branches, total, researched }) => {
          const isCurrent = stageIdx === stageIndex;
          const isPast = stageIdx < stageIndex;
          // ROUND D3 — the NEXT stage (stageIdx === stageIndex + 1) is
          // researchable (researching ≥30% of its techs triggers evolution).
          // Only stages 2+ ahead are locked.
          const isNext = stageIdx === stageIndex + 1;
          const isLocked = stageIdx > stageIndex + 1;
          return (
            <div
              key={stageId}
              className={cn(
                "shrink-0 w-[240px] rounded-lg border p-2 space-y-2",
                isCurrent ? "border-primary/40 bg-primary/5" :
                isNext ? "border-amber-500/30 bg-amber-500/5" :
                "border-border/40 bg-muted/10",
                isLocked && "opacity-50"
              )}
            >
              {/* Column header */}
              <div className="sticky top-0 z-10 -mx-2 -mt-2 px-2 py-1.5 bg-inherit border-b border-border/40 mb-1">
                <div className="flex items-center justify-between gap-1">
                  <span className={cn("text-xs font-bold flex items-center gap-1", isCurrent ? "text-primary" : isNext ? "text-amber-400" : "text-muted-foreground")}>
                    <span>{stageDef.icon}</span>
                    {stageDef.name}
                  </span>
                  <span className="text-[0.55rem] text-muted-foreground tabular-nums">
                    {researched}/{total}
                  </span>
                </div>
                <div className="text-[0.5rem] text-muted-foreground/70 uppercase tracking-wide">
                  {stageDef.techLabel || "Technology"}
                  {isNext && <span className="text-amber-400/90 normal-case ml-1">— research to evolve</span>}
                </div>
              </div>
              {/* Branch sections */}
              {Object.keys(branches).length === 0 ? (
                <p className="text-[0.6rem] text-muted-foreground/50 italic text-center py-2">No techs visible.</p>
              ) : (
                Object.entries(branches).map(([branch, techs]) => (
                  <div key={branch} className="space-y-1">
                    <div className="text-[0.55rem] font-semibold uppercase tracking-wide text-muted-foreground/80 border-b border-border/20 pb-0.5">
                      {branch}
                    </div>
                    {techs.sort((a, b) => a.tier - b.tier).map((tech) => (
                      <TreeTechNode
                        key={tech.id}
                        tech={tech}
                        isFutureStage={isLocked}
                        futureStageName={isLocked ? stageDef.name : undefined}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// A compact tech node for the tree canvas. Smaller than the list-view TechCard.
function TreeTechNode({
  tech,
  isFutureStage,
  futureStageName,
}: {
  tech: TechDef;
  isFutureStage: boolean;
  futureStageName?: string;
}) {
  const technologies = useGameStore((s) => s.technologies);
  const resources = useGameStore((s) => s.resources);
  const buyTech = useGameStore((s) => s.buyTech);
  const debugFreeBuy = useGameStore((s) => s.debugFreeBuy);

  const owned = !!technologies[tech.id];
  const prereqMet = !tech.requires || tech.requires.every((r) => technologies[r]);
  const canAfford = debugFreeBuy || Object.entries(tech.cost).every(([r, v]) => (resources[r] || 0) >= (v as number));
  const lockedByExclusive = tech.exclusiveWith?.find((exclId) => technologies[exclId]);
  const stageLocked = isFutureStage; // can't research future-stage techs
  const disabled = owned || stageLocked || !prereqMet || !canAfford || !!lockedByExclusive;

  return (
    <div
      className={cn(
        "rounded-md border p-1.5 transition-all",
        owned ? "border-emerald-500/40 bg-emerald-500/5 opacity-70" :
        stageLocked ? "border-border/30 bg-muted/5 opacity-40" :
        !prereqMet ? "border-border/30 opacity-50" :
        lockedByExclusive ? "border-red-500/20 opacity-40" :
        "border-border/50 hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
      )}
      onClick={() => !disabled && buyTech(tech.id)}
    >
      <div className="flex items-center gap-1.5">
        {owned ? (
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
        ) : stageLocked ? (
          <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
        ) : !prereqMet ? (
          <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
        ) : (
          <span className="w-3 h-3 rounded-full border border-muted-foreground/40 shrink-0" />
        )}
        <span className={cn("text-[0.7rem] font-semibold leading-tight truncate flex-1", owned && "text-emerald-300")}>
          {tech.name}
        </span>
        <span className="text-[0.5rem] text-muted-foreground/60 tabular-nums shrink-0">T{tech.tier}</span>
      </div>
      {/* Cost (only if not owned + not stage-locked) */}
      {!owned && !stageLocked && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {Object.entries(tech.cost).slice(0, 3).map(([r, v]) => {
            const enough = (resources[r] || 0) >= (v as number);
            return (
              <span
                key={r}
                className={cn("text-[0.55rem] tabular-nums", enough ? "" : "text-red-400")}
                style={enough ? { color: resourceColor(r) } : undefined}
              >
                {resourceIcon(r)}{formatNumber(v as number, 0)}
              </span>
            );
          })}
        </div>
      )}
      {/* Stage-locked label */}
      {stageLocked && (
        <div className="text-[0.5rem] text-muted-foreground/60 italic mt-0.5">
          Advance to {futureStageName} first
        </div>
      )}
      {/* Prereq indicator (cross-stage) */}
      {!owned && !stageLocked && tech.requires && tech.requires.length > 0 && !prereqMet && (
        <div className="text-[0.5rem] text-amber-400/70 italic mt-0.5">
          ← requires {tech.requires.map((r) => TECH_MAP[r]?.name || r).join(", ")}
        </div>
      )}
    </div>
  );
}
