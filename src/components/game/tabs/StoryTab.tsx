"use client";

import { useGameStore } from "@/game/state/store";
import { STORY_ENTRIES } from "@/game/data/story";
import { STAGES } from "@/game/data/stages";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Lock } from "lucide-react";

export function StoryTab() {
  const storyUnlocked = useGameStore((s) => s.storyUnlocked);
  const stageIndex = useGameStore((s) => s.stageIndex);
  const currentStage = STAGES[stageIndex];

  // Sort: unlocked entries first (in chronological order), then locked entries by stage order
  const entries = STORY_ENTRIES.slice().sort((a, b) => {
    const aUnlocked = !!storyUnlocked[a.id];
    const bUnlocked = !!storyUnlocked[b.id];
    if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;
    // Within the same unlock status, preserve original chronological order
    return STORY_ENTRIES.indexOf(a) - STORY_ENTRIES.indexOf(b);
  });

  const unlockedCount = entries.filter((e) => storyUnlocked[e.id]).length;
  const totalCount = entries.length;

  return (
    <div className="space-y-4">
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Journal
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>The scripture of what creation has lived through so far.</span>
            <Badge variant="outline">{unlockedCount} / {totalCount}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bar-track mb-3">
            <div className="bar-fill" style={{ width: `${(unlockedCount / totalCount) * 100}%` }} />
          </div>
          <div className="space-y-3">
            {entries.map((entry) => {
              const unlocked = storyUnlocked[entry.id];
              const isCurrent = entry.stage === currentStage.id;
              return (
                <div
                  key={entry.id}
                  className={`stat-card transition-all ${!unlocked ? "opacity-50 stat-card-plain" : isCurrent ? "stat-card-accent ring-1 ring-accent" : "stat-card-plain"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {unlocked ? (
                        <BookOpen className="w-4 h-4 text-accent" aria-hidden />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className={`text-sm font-bold ${unlocked ? "" : "text-muted-foreground"}`}>
                          {unlocked ? entry.title : "??? undiscovered"}
                        </h3>
                        {unlocked && (
                          <>
                            <Badge variant="outline" className="text-[0.6rem]">{entry.layer}</Badge>
                            <Badge variant="secondary" className="text-[0.6rem]">{entry.category}</Badge>
                          </>
                        )}
                      </div>
                      {unlocked ? (
                        <>
                          <p className="text-sm leading-relaxed text-foreground/90 italic">
                            &ldquo;{entry.body}&rdquo;
                          </p>
                          <div className="text-xs text-muted-foreground mt-1.5">
                            {STAGES.find((s) => s.id === entry.stage)?.name || "Meta"} · {entry.trigger}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Trigger: {entry.trigger}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
