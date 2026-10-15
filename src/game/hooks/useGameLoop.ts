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

  // Save on unmount / page hide — all listeners properly cleaned up
  useEffect(() => {
    const handler = () => saveRef.current();
    const visibilityHandler = () => {
      if (document.visibilityState === "hidden") saveRef.current();
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
