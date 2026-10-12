"use client";

import { useIsBackgroundLayer, layerName } from "@/game/state/layerHelpers";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

// BackgroundLayerBadge — shows "🔄 Running in background" when the player's active
// prestige layer is higher than the modal's layer. This communicates that lower-layer
// mechanics (e.g. trial realms, market, dimension engine) continue to tick in the
// background even though the player has progressed beyond them.
//
// Usage: pass the layerId that corresponds to the modal (e.g. "enlightenment" for L2).
export function BackgroundLayerBadge({ layerId }: { layerId: string }) {
  const isBackground = useIsBackgroundLayer(layerId);
  if (!isBackground) return null;
  const layerLabel = layerName(layerId);
  return (
    <Badge
      variant="outline"
      className="text-[0.6rem] text-cyan-300 border-cyan-400/40 bg-cyan-500/10 ml-2"
      title={`${layerLabel} mechanics continue to tick automatically in the background while you focus on higher layers.`}
    >
      <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" style={{ animationDuration: "3s" }} />
      Running in background
    </Badge>
  );
}
