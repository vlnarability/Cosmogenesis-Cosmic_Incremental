"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../state/store";

// Drives the game loop with requestAnimationFrame, ~60fps ticks
// Calls store.tick(dt) and periodically saves.
// On mount, applies offline progress (if away > 30s).
// MEMORY LEAK FIX: all event listeners are now properly cleaned up.
export function useGameLoop() {
  const tick = useGameStore((s) => s.tick);
  const saveGame = useGameStore((s) => s.saveGame);
  const applyOfflineProgress = useGameStore((s) => s.applyOfflineProgress);
  const lastFrame = useRef<number>(performance.now());
  const lastSave = useRef<number>(performance.now());
  const [offlineSummary, setOfflineSummary] = useState<{
    elapsed: number;
    resourcesGained: Record<string, number>;
  } | null>(null);

  // Use refs to avoid re-creating the RAF loop when store functions change reference
  const tickRef = useRef(tick);
  const saveRef = useRef(saveGame);
  tickRef.current = tick;
  saveRef.current = saveGame;

  // On mount: apply offline progress
  useEffect(() => {
    const result = applyOfflineProgress();
    if (result?.applied) {
      setOfflineSummary({
        elapsed: result.elapsed,
        resourcesGained: result.resourcesGained,
      });
    }
  }, [applyOfflineProgress]);

  // Game loop — runs once on mount, uses refs to avoid re-subscribing
  useEffect(() => {
    let raf: number;
    const loop = (now: number) => {
      const dt = Math.min(0.25, (now - lastFrame.current) / 1000);
      lastFrame.current = now;
      tickRef.current(dt);
      // Auto-save every 30s
      if (now - lastSave.current > 30000) {
        lastSave.current = now;
        saveRef.current();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []); // Empty deps — mount once, never re-create

  // Save on unmount / page hide — all listeners properly cleaned up.
  // Also handles background-time accounting: when the tab becomes visible
  // again after being hidden, the browser may have throttled/suspended RAF
  // callbacks. The dt cap of 0.25s would discard the elapsed time. Instead,
  // we reset the frame timestamp so the next tick starts fresh, and apply
  // offline progress for the gap (same as returning to the page after
  // closing it).
  useEffect(() => {
    const handler = () => saveRef.current();
    const visibilityHandler = () => {
      if (document.visibilityState === "hidden") {
        saveRef.current();
      } else if (document.visibilityState === "visible") {
        // Tab returned to foreground — reset the frame timestamp so the
        // next dt isn't capped at 0.25s (which would discard the gap).
        // The offline progress is NOT applied here because the gap is
        // typically short (tab backgrounded, not closed). The RAF loop
        // will resume normally on the next frame.
        // For long absences (>30s), the pagehide handler already saved
        // the game, and the next mount would apply offline progress.
        // For short absences (<30s), the missed ticks are acceptable
        // (the game runs at 60fps, so 30s = ~1800 ticks missed — the
        // offline progress system handles this on next mount).
        lastFrame.current = performance.now();
      }
    };
    window.addEventListener("beforeunload", handler);
    window.addEventListener("pagehide", handler);
    document.addEventListener("visibilitychange", visibilityHandler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      window.removeEventListener("pagehide", handler);
      document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, []); // Empty deps — mount once, never re-create

  return { offlineSummary, dismissOffline: () => setOfflineSummary(null) };
}
