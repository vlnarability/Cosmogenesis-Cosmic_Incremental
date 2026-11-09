"use client";

// ============================================================
// F4 — ShortcutsOverlay
//
// A lightweight quick-reference overlay showing the current keyboard
// shortcut bindings. Toggled by pressing "?" (or Shift+/). Closes on
// Escape, backdrop click, or the Close button.
//
// Reads the bindings from `state.keyboardShortcuts` (which fall back to
// DEFAULT_KEYBOARD_SHORTCUTS when unset). The overlay is read-only —
// rebinding is done in Settings → Shortcuts.
//
// The bindings are grouped into categories (Universal / Layers / Actions)
// using the SHORTCUT_LABELS map from SettingsModal (re-imported here to
// avoid duplication).
// ============================================================

import { useGameStore, DEFAULT_KEYBOARD_SHORTCUTS, SHORTCUT_LAYER_GATE } from "@/game/state/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Re-use the SHORTCUT_LABELS from SettingsModal. They're module-scoped
// there, so we re-declare here (same content). Kept in sync manually.
const SHORTCUT_LABELS: Record<string, string> = {
  pause: "Pause / Resume",
  speed1: "Speed 1×",
  speed2: "Speed 2×",
  speed4: "Speed 4×",
  speed8: "Speed 8×",
  save: "Save Game",
  shop: "Open Shop",
  prestige: "Prestige Roadmap",
  trials: "Trials",
  constellations: "Constellations",
  market: "Divine Market",
  galaxy: "Galaxy Claim",
  heresy: "Galactic Conquest",
  universal: "Universal Map",
  creatures: "Bio-engineering",
  diplomacy: "Divine Alliance",
  war: "Divine War",
  genesis: "Genesis Engine",
  close: "Close Modal / Dismiss Popup",
};

// Categories for grouping in the overlay.
const CATEGORIES: { id: string; label: string; actionIds: string[] }[] = [
  {
    id: "universal",
    label: "Universal",
    actionIds: ["pause", "speed1", "speed2", "speed4", "speed8", "save", "shop", "close"],
  },
  {
    id: "layers",
    label: "Prestige Layers",
    actionIds: ["trials", "constellations", "market", "galaxy", "heresy", "universal", "creatures", "diplomacy", "war", "genesis"],
  },
];

export function ShortcutsOverlay() {
  const show = useGameStore((s) => s.showShortcuts);
  const setShow = useGameStore((s) => s.setShowShortcuts);
  const shortcuts = useGameStore((s) => s.keyboardShortcuts) || {};
  const unlockedLayers = useGameStore((s) => s.unlockedLayers || {});

  const getKey = (actionId: string): string => {
    return shortcuts[actionId] ?? DEFAULT_KEYBOARD_SHORTCUTS[actionId] ?? "—";
  };

  const isLayerUnlocked = (actionId: string): boolean => {
    const layerId = SHORTCUT_LAYER_GATE[actionId];
    if (!layerId) return true; // universal action
    return !!unlockedLayers[layerId];
  };

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Keyboard className="w-4 h-4 text-cyan-300" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-xs">
            Press <kbd className="px-1 py-0.5 rounded border border-border/60 bg-muted/30 text-[0.6rem] font-mono">?</kbd> anytime to show this reference. Rebind keys in Settings → Shortcuts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const visibleActions = cat.actionIds.filter((id) => isLayerUnlocked(id));
            if (visibleActions.length === 0) return null;
            return (
              <div key={cat.id}>
                <div className="text-[0.6rem] uppercase tracking-wide text-muted-foreground mb-1.5">
                  {cat.label}
                </div>
                <div className="space-y-1">
                  {visibleActions.map((actionId) => {
                    const key = getKey(actionId);
                    const label = SHORTCUT_LABELS[actionId] ?? actionId;
                    return (
                      <div
                        key={actionId}
                        className="flex items-center justify-between gap-2 px-2 py-1 rounded-md hover:bg-muted/20 transition-colors"
                      >
                        <span className="text-xs text-foreground/80 truncate">{label}</span>
                        <kbd
                          className="px-1.5 py-0.5 rounded border border-border/60 bg-muted/30 text-[0.6rem] font-mono font-semibold text-cyan-200 min-w-[1.8rem] text-center"
                        >
                          {key === " " ? "Space" : key === "Escape" ? "Esc" : key}
                        </kbd>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[0.6rem] text-muted-foreground/70 italic mt-2 pt-2 border-t border-border/40">
          Tip: layer shortcuts only work once their layer is unlocked.
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShow(false)}>
            <X className="w-3 h-3 mr-1" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mark cn as used (retained for future conditional styling).
void cn;
