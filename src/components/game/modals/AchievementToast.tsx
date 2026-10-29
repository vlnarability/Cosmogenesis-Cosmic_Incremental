"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/game/state/store";
import { ACHIEVEMENT_MAP } from "@/game/data/achievements";
import { Button } from "@/components/ui/button";
import { Trophy, X } from "lucide-react";

// AUTO-DISMISS: the toast closes itself after 12s so unattended queues can't
// pile up on screen. Hovering pauses the countdown (player is reading it);
// the progress bar shows the remaining time.
//
// TOAST-QUEUE: with multiple achievements queued, each one plays for its own
// 12s window, then ADVANCES to the next (front-of-queue pop) — the queue is
// never nuked wholesale by a timeout. A "+N QUEUED" badge in the header
// counts the rest. Buttons:
//   X       → clear the ENTIRE queue (dismissAchievementToast)
//   Dismiss → advance to the next queued achievement
//   View All→ clear queue + jump to the achievements tab
// All dismissals animate out (slideOutRight) before applying.

const AUTO_DISMISS_MS = 12_000;
const EXIT_MS = 220;

export function AchievementToast() {
  const newAchievements = useGameStore((s) => s.newAchievements || []);
  const dismissAchievementToast = useGameStore((s) => s.dismissAchievementToast);
  const advanceAchievementToast = useGameStore((s) => s.advanceAchievementToast);
  const setTab = useGameStore((s) => s.setTab);
  const activeStoryPopup = useGameStore((s) => s.activeStoryPopup);
  const showEvolve = useGameStore((s) => s.showEvolve);
  const showSettings = useGameStore((s) => s.showSettings);

  const [remaining, setRemaining] = useState(AUTO_DISMISS_MS);
  const [hovered, setHovered] = useState(false);
  const [closing, setClosing] = useState(false);
  const hoveredRef = useRef(false);
  const lastTsRef = useRef<number | null>(null);
  // Absolute deadline for the CURRENT queue front. The countdown effect
  // (below) re-arms it every time firstId changes — one loop lifetime per
  // queued achievement, so a popped front always gets a fresh countdown
  // (the previous implementation kept one long-lived RAF loop that died
  // after the first expiry and left later toasts frozen at 0%).
  const deadlineRef = useRef<number>(0);

  // Don't show toast when a story popup or modal is open (avoids overlap).
  // NOTE: all hooks run BEFORE these early returns (Rules of Hooks).
  const hidden =
    newAchievements.length === 0 ||
    !!activeStoryPopup ||
    !!showEvolve ||
    !!showSettings;

  const firstId = newAchievements[0];
  const ach = firstId ? ACHIEVEMENT_MAP[firstId] : undefined;

  const queuedCount = Math.max(0, newAchievements.length - 1);

  // Countdown loop — one lifetime PER queue front (firstId in deps).
  // When the front expires, advanceAchievementToast() pops it; firstId
  // changes; this effect cleans up and starts a fresh 12s countdown for
  // the next achievement. Hovering freezes the countdown by pushing the
  // deadline forward. All setState happens inside the RAF callback.
  useEffect(() => {
    if (hidden) return;
    // Fresh deadline for this queue front.
    deadlineRef.current = performance.now() + AUTO_DISMISS_MS;
    lastTsRef.current = null;
    let raf = 0;
    let cancelled = false;
    const step = (now: number) => {
      if (cancelled) return;
      if (lastTsRef.current != null && hoveredRef.current) {
        // Hovering: push the deadline out by exactly the time spent paused,
        // so the countdown resumes where it left off.
        deadlineRef.current += now - lastTsRef.current;
      }
      lastTsRef.current = now;
      const rem = Math.max(0, deadlineRef.current - now);
      setRemaining(rem);
      if (rem <= 0) {
        // Front expired — pop it. firstId changes → effect restarts with a
        // fresh countdown for the next achievement (or hidden=true cleans
        // up entirely when the queue empties).
        advanceAchievementToast();
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [advanceAchievementToast, hidden, firstId]);

  // Animated exit: play slideOutRight, THEN apply the store mutation.
  // While `closing` is true the countdown keeps whatever value it had.
  const exitThen = (fn: () => void) => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => {
      fn();
      setClosing(false);
    }, EXIT_MS);
  };

  if (hidden || !ach) return null;

  const progress = Math.max(0, Math.min(1, remaining / AUTO_DISMISS_MS));

  return (
    <div
      key={firstId}
      className={
        closing
          ? "fixed bottom-4 right-4 z-50 max-w-sm animate-[slideOutRight_0.22s_ease_forwards]"
          : "fixed bottom-4 right-4 z-50 max-w-sm animate-[slideUp_0.3s_ease]"
      }
      onMouseEnter={() => { hoveredRef.current = true; setHovered(true); }}
      onMouseLeave={() => { hoveredRef.current = false; lastTsRef.current = null; setHovered(false); }}
    >
      <div className="glass-strong rounded-lg border border-primary/50 overflow-hidden shadow-2xl">
        {/* Header bar */}
        <div className="bg-primary/20 px-3 py-1.5 flex items-center gap-2 border-b border-primary/30">
          <Trophy className="w-3.5 h-3.5 text-primary" />
          <span className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-primary">
            Achievement Unlocked
          </span>
          {/* +N QUEUED badge — counts the achievements still waiting behind
              this one. Calmer than a pile of separate toasts. */}
          {queuedCount > 0 && (
            <span
              className="text-[0.55rem] px-1.5 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary font-bold tabular-nums"
              aria-label={`${queuedCount} more achievements queued`}
            >
              +{queuedCount} QUEUED
            </span>
          )}
          <button
            onClick={() => exitThen(dismissAchievementToast)}
            aria-label="Dismiss all achievement toasts"
            title={queuedCount > 0 ? "Clear all queued achievements" : "Dismiss"}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Body */}
        <div className="p-3 flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0 bg-primary/15 border border-primary/40">
            {ach.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold leading-tight">{ach.name}</h3>
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">{ach.desc}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[0.6rem] px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400 font-semibold">
                +{(ach.bonus.value * 100).toFixed(1)}% {ach.bonus.type}
              </span>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="px-3 pb-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs flex-1"
            onClick={() => exitThen(() => {
              setTab("achievements");
              dismissAchievementToast();
            })}
          >
            View All
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={() => exitThen(advanceAchievementToast)}
            title={queuedCount > 0 ? "Show the next queued achievement" : "Dismiss"}
          >
            {queuedCount > 0 ? "Next" : "Dismiss"}
          </Button>
        </div>
        {/* Auto-dismiss countdown — pauses on hover */}
        <div
          className="h-0.5 bg-primary/25"
          role="timer"
          aria-label={`Auto-dismisses in ${Math.ceil(remaining / 1000)} seconds`}
        >
          <div
            className="h-full bg-primary transition-[width] duration-100 ease-linear"
            style={{ width: `${progress * 100}%`, opacity: hovered ? 0.3 : 0.7 }}
          />
        </div>
      </div>
    </div>
  );
}
