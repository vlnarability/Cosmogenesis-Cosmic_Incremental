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
  const applyOfflineProgressRef = useRef(applyOfflineProgress);
  tickRef.current = tick;
  saveRef.current = saveGame;
  applyOfflineProgressRef.current = applyOfflineProgress;

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

  // Save on unmount / page hide + apply background progression on return.
  // When the tab becomes hidden, we save the game. When it becomes visible
  // again, we apply offline progress for the elapsed gap (same as returning
  // to the page after closing it). This prevents lost progression when the
  // browser throttles/suspends RAF callbacks in background tabs.
  useEffect(() => {
    const handler = () => saveRef.current();
    const hiddenAtRef = { value: 0 };
    const visibilityHandler = () => {
      if (document.visibilityState === "hidden") {
        saveRef.current();
        hiddenAtRef.value = Date.now();
      } else if (document.visibilityState === "visible" && hiddenAtRef.value > 0) {
        // Tab returned to foreground — apply offline progress for the gap.
        // The save was done when the tab was hidden, so applyOfflineProgress
        // will compute elapsed time from lastSaved (which was just set).
        const gapSec = Math.floor((Date.now() - hiddenAtRef.value) / 1000);
        hiddenAtRef.value = 0;
        // Reset frame timestamp so the next tick starts fresh (not a huge dt)
        lastFrame.current = performance.now();
        // Only apply if the gap was >30s (shorter gaps are negligible)
        if (gapSec >= 30) {
          const result = applyOfflineProgressRef.current();
          if (result?.applied) {
            setOfflineSummary({
              elapsed: result.elapsed,
              resourcesGained: result.resourcesGained,
            });
          }
        }
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
