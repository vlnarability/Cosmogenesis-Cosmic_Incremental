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
import { CheckCircle2, Lock, GitBranch, History, Layers, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import type { TechDef } from "@/game/state/types";

// Determine which stage indices are "legacy" (collapsed into the Legacy accordion).
function legacyStageRange(stageIndex: number, isL2Plus: boolean, isL5Plus: boolean): { start: number; end: number } {
  if (isL5Plus) return { start: 0, end: Math.min(5, stageIndex) }; // Stages 1-5
  if (isL2Plus) return { start: 0, end: Math.min(2, stageIndex) }; // Stages 1-2
  return { start: 0, end: 0 };
}

export function TechTab() {
  const stageIndex = useGameStore((s) => s.stageIndex);
  const technologies = useGameStore((s) => s.technologies);

  const { isAtLeast } = useActiveLayer();
  const isL2Plus = isAtLeast("enlightenment");
  const isL5Plus = isAtLeast("apotheosis");

  const stage = STAGES[stageIndex];
  const currentTechs = techsForStage(stage.id);

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

  const [onlyCurrent, setOnlyCurrent] = useState(false);
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
            {(hasLegacy || hasMiddle) && (
              <Button
                size="sm"
                variant={onlyCurrent ? "default" : "outline"}
                className="h-7 text-xs"
                onClick={() => setOnlyCurrent((v) => !v)}
                title="Hide all legacy/past-stage techs"
              >
                <Filter className="w-3 h-3 mr-1" />
                Current only
              </Button>
            )}
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

      {/* Middle stages (between legacy and current) — open by default */}
      {hasMiddle && !onlyCurrent && (
        <Accordion type="multiple" defaultValue={middleStages.map((s) => `mid-${s.id}`)}>
          {middleStages.map((st) => {
            const techs = techsForStage(st.id);
            const branches = groupByBranch(techs);
            return (
              <AccordionItem key={`mid-${st.id}`} value={`mid-${st.id}`} className="glass-panel rounded-lg px-3 mb-2 border-border/40">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold">{st.name} Technology</span>
                    <Badge variant="outline" className="text-[0.6rem]">
                      {techs.filter((t) => technologies[t.id]).length}/{techs.length} researched
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <BranchList branches={branches} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Legacy accordion — closed by default */}
      {hasLegacy && !onlyCurrent && (
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <Accordion type="single" collapsible value={legacyOpen ? "legacy" : ""} onValueChange={(v) => setLegacyOpen(v === "legacy")}>
              <AccordionItem value="legacy" className="border-b-0">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-400/80" />
                    <span className="text-sm font-semibold">
                      Legacy Technology
                    </span>
                    <Badge variant="outline" className="text-[0.6rem] text-amber-300 border-amber-400/40">
                      {legacyStages.length} stages · {legacyTechsResearched}/{legacyTechsTotal} researched
                    </Badge>
                    {isL5Plus && (
                      <span className="text-[0.6rem] text-muted-foreground">
                        (Stages 1-{Math.min(5, stageIndex)} — collapsed for higher-layer play)
                      </span>
                    )}
                    {isL2Plus && !isL5Plus && (
                      <span className="text-[0.6rem] text-muted-foreground">
                        (Stages 1-{Math.min(2, stageIndex)} — collapsed at Enlightenment+)
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {legacyStages.map((st) => {
                      const techs = techsForStage(st.id);
                      const branches = groupByBranch(techs);
                      return (
                        <div key={st.id} className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
                            <span>{st.icon}</span>
                            {st.name} ({techs.filter((t) => technologies[t.id]).length}/{techs.length})
                          </div>
                          <BranchList branches={branches} />
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardHeader>
        </Card>
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

// Render a list of branch sections with their techs.
function BranchList({ branches }: { branches: Record<string, TechDef[]> }) {
  return (
    <>
      {Object.entries(branches).map(([branch, list]) => (
        <Card key={branch} className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-accent" />
              {branch} Path
              <BranchBadge list={list} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {list
                .sort((a, b) => a.tier - b.tier)
                .map((tech) => (
                  <TechCard key={tech.id} tech={tech} />
                ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
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

  const owned = !!technologies[tech.id];
  const prereqMet = !tech.requires || tech.requires.every((r) => technologies[r]);
  const canAfford = Object.entries(tech.cost).every(([r, v]) => (resources[r] || 0) >= (v as number));

  return (
    <div className={`stat-card transition-opacity ${owned ? "opacity-60" : !prereqMet ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          {owned ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
      {/* Affinity grant */}
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
          {ARCHETYPE_MAP[tech.grantsAffinity.archetype].glyph} {ARCHETYPE_MAP[tech.grantsAffinity.archetype].name} drift +{tech.grantsAffinity.amount}
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
          disabled={owned || !prereqMet || !canAfford}
          onClick={() => buyTech(tech.id)}
        >
          {owned ? "Researched" : !prereqMet ? "Locked" : "Research"}
        </Button>
      </div>
    </div>
  );
}
