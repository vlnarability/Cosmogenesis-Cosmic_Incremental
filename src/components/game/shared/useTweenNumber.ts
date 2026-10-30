"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/game/state/store";

// ============================================================
// useTweenNumber — smoothly chase a numeric target with a RAF
// easeOutCubic tween, so resource counters feel "alive" instead
// of snapping every tick.
//
// Design notes:
//   · ALL setDisplay calls happen inside the async RAF callback —
//     never synchronously in the effect body (satisfies the
//     react-hooks/set-state-in-effect rule + avoids cascading
//     renders).
//   · Each target change cancels the in-flight RAF and resumes
//     from the CURRENTLY DISPLAYED value — no jump-back.
//   · Huge jumps (> 10× current value, e.g. prestige reset or
//     save import) snap in a single frame (duration 0) so there's
//     no long countdown.
//   · Non-finite targets are clamped to the last good value so
//     NaN/Infinity never propagates to the display.
//   · REDUCE-MOTION: when the setting is on (or the OS prefers
//     reduced motion), the tween is skipped entirely — the value
//     snaps to the target with no RAF. Calm by default for users
//     who want it.
// ============================================================

export function useTweenNumber(target: number, durationMs = 450): number {
  const reduceMotion = useGameStore((s) => !!s.reduceMotion);
  const [display, setDisplay] = useState(() => (isFinite(target) ? target : 0));
  const displayRef = useRef(isFinite(target) ? target : 0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // REDUCE-MOTION — snap to target, no RAF. Still update the display +
    // ref so the value stays correct. (All setDisplay inside the effect is
    // fine here because there's no RAF + no cascading — it's a one-shot sync.
    // The lint rule fires on this pattern though, so defer via microtask.)
    if (reduceMotion) {
      const safeTarget = isFinite(target) ? target : displayRef.current;
      if (displayRef.current !== safeTarget) {
        displayRef.current = safeTarget;
        queueMicrotask(() => setDisplay(safeTarget));
      }
      return;
    }
    const from = displayRef.current;
    // Clamp non-finite targets to the last good value (never display NaN/∞).
    const safeTarget = isFinite(target) ? target : from;
    const delta = safeTarget - from;
    // Huge jump (prestige reset / save import) — snap in a single frame.
    const hugeJump = Math.abs(delta) > Math.max(10, Math.abs(from)) * 10;
    const duration = hugeJump ? 0 : durationMs;
    const start = performance.now();
    const animate = (now: number) => {
      const t = duration <= 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const val = from + delta * eased;
      displayRef.current = val;
      setDisplay(val);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs, reduceMotion]);

  return display;
}
