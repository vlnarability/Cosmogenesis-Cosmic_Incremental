"use client";

import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Archive as ArchiveIcon, Star, Clock, Dice5 } from "lucide-react";
import { formatNumber, formatTime } from "../shared/format";
import { useState } from "react";

export function ArchiveTab() {
  const archive = useGameStore((s) => s.archive);
  const eventHistory = useGameStore((s) => s.eventHistory || []);
  const [filter, setFilter] = useState<string>("all");

  const stages = Array.from(new Set(archive.map((a) => a.stage)));
  const filtered = filter === "all" ? archive : archive.filter((a) => a.stage === filter);

  return (
    <div className="space-y-4">
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ArchiveIcon className="w-4 h-4" />
            Run Archive
          </CardTitle>
          <CardDescription>
            Every run you've completed. {archive.length} {archive.length === 1 ? "entry" : "entries"} total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {archive.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <ArchiveIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No completed runs yet.</p>
              <p className="text-xs mt-1">Evolve through stages or prestige to record your first run here.</p>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex flex-wrap gap-1 mb-3">
                <Button
                  size="sm"
                  variant={filter === "all" ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => setFilter("all")}
                >
                  All ({archive.length})
                </Button>
                {stages.map((s) => {
                  const stg = STAGES.find((x) => x.id === s);
                  const count = archive.filter((a) => a.stage === s).length;
                  return (
                    <Button
                      key={s}
                      size="sm"
                      variant={filter === s ? "default" : "outline"}
                      className="h-7 text-xs"
                      onClick={() => setFilter(s)}
                    >
                      {stg?.icon} {stg?.name} ({count})
                    </Button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
                {filtered.map((entry) => {
                  const stage = STAGES.find((s) => s.id === entry.stage);
                  return (
                    <div key={entry.runId} className="stat-card">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl">{stage?.icon}</span>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{entry.ending}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-amber-400 font-bold">+{entry.epEarned} Div</div>
                          <div className="text-[0.65rem] text-muted-foreground">Score: {formatNumber(entry.score, 0)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[0.6rem]">{stage?.name}</Badge>
                        <span>{formatTime(entry.duration)}</span>
                        <span>·</span>
                        <span>Archetype: {entry.archetype}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Event History */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Dice5 className="w-4 h-4 text-amber-400" />
              Event Chronicle
            </span>
            <Badge variant="outline" className="text-xs">{eventHistory.length}</Badge>
          </CardTitle>
          <CardDescription>Choices made during random events this run.</CardDescription>
        </CardHeader>
        <CardContent>
          {eventHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-6 text-sm">
              <Dice5 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No events encountered yet.</p>
              <p className="text-xs mt-1">Events fire randomly during play — keep going.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
              {eventHistory.map((eh, i) => (
                <div key={i} className="stat-card flex items-center gap-2 py-1.5">
                  <span className="text-lg shrink-0">{eh.eventIcon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{eh.eventName}</div>
                    <div className="text-[0.65rem] text-muted-foreground truncate">
                      → {eh.choiceLabel}
                    </div>
                  </div>
                  <div className="text-[0.6rem] text-muted-foreground shrink-0 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTime(eh.gameTime)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
