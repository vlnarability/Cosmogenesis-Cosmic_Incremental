"use client";

import { useGameStore } from "@/game/state/store";
import { techsForStage, TECH_MAP, TECHS } from "@/game/data/techs";
import { STAGES } from "@/game/data/stages";
import { useActiveLayer } from "@/game/state/layerHelpers";
import { ARCHETYPE_MAP } from "@/game/data/archetypes";
import { formatNumber, resourceColor, resourceIcon } from "../shared/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Lock, GitBranch, History, Layers } from "lucide-react";
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
  const currentTechs = useMemo(
    () =>
      techsForStage(stage.id).filter((t) => {
        if (t.hiddenFromTechTab) return false;
        if (t.requiredArchetype && lockedArchetype !== t.requiredArchetype) return false;
        // Hide techs whose prereqs aren't met AND aren't already researched.
        const prereqMet = !t.requires || t.requires.every((r) => technologies[r]);
        if (!prereqMet && !technologies[t.id]) return false;
        return true;
      }),
    [stage.id, lockedArchetype, technologies]
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

  return (
    <div className="space-y-4">
      {/* P7 — Inline purchase error banner (auto-fades after 2s). */}
      <PurchaseErrorBanner />
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                {stage.name} Technology
              </CardTitle>
              <CardDescription>
                Research permanent bonuses. Prerequisites must be met before higher tiers unlock.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current stage techs — always shown */}
      {Object.keys(currentBranches).length === 0 ? (
        <Card className="glass-panel">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No techs for this stage yet.
          </CardContent>
        </Card>
      ) : (
        <BranchList branches={currentBranches} />
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
