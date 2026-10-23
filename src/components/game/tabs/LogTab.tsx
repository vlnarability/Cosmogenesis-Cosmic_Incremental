"use client";

import { useGameStore } from "@/game/state/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListTree } from "lucide-react";

export function LogTab() {
  const log = useGameStore((s) => s.log);

  return (
    <Card className="glass-panel h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ListTree className="w-4 h-4" />
          Run Log
        </CardTitle>
        <CardDescription>Recent events from this run.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* h-full + min-h-0 — fills the parent InfoModal's flex-1 area
            instead of growing with content. The scrollbar stays inside
            a stable-size container so the parent modal never resizes. */}
        <div className="font-mono text-xs space-y-1 h-full overflow-y-auto pr-1">
          {log.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No events yet.</p>
          ) : (
            log.map((line, i) => (
              <div
                key={i}
                className="leading-relaxed text-foreground/80 hover:text-foreground transition-colors"
              >
                {line}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
