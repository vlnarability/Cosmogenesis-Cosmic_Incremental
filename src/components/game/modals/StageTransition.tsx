"use client";

import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { ChevronRight } from "lucide-react";

// ============================================================
// StageTransition — cinematic full-screen evolution overlay.
//
// Shows on EVERY stage evolution (not just first playthrough).
// The old stage icon fades + shrinks while starfield particles
// drift across the screen, then the new stage icon bursts in
// with its accent color glow.
//
// Auto-dismisses after 4 seconds (or on click/keypress) so
// experienced players aren't slowed down. First playthrough
// gets a longer, more dramatic version (story intro shown).
//
// Design language: matches the project's cosmic theme —
// glass panels, stage accent colors, monospace labels, no
// generic gradients or drop-shadows.
// ============================================================

export function StageTransition() {
  const stageIndex = useGameStore((s) => s.stageIndex);
  const galacticWins = useGameStore((s) => s.galacticWins);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionStage, setTransitionStage] = useState<number | null>(null);
  const [prevStage, setPrevStage] = useState(stageIndex);
  const [phase, setPhase] = useState<"fade-out" | "particles" | "burst-in">("fade-out");

  const dismiss = useCallback(() => {
    setShowTransition(false);
    setTransitionStage(null);
    setPhase("fade-out");
  }, []);

  useEffect(() => {
    // GAME-FLOW — Show the transition on EVERY evolution (not just first
    // playthrough). The galacticWins check was removed per user request
    // ("important addition"). Experienced players get a shorter version
    // (no story intro, auto-dismiss after 3s vs 5s for first playthrough).
    if (stageIndex > prevStage) {
      const t1 = setTimeout(() => {
        setTransitionStage(stageIndex);
        setShowTransition(true);
        setPhase("fade-out");
        // Phase progression: fade-out (0.8s) → particles (0.6s) → burst-in (rest)
        const t2 = setTimeout(() => setPhase("particles"), 800);
        const t3 = setTimeout(() => setPhase("burst-in"), 1400);
        return () => { clearTimeout(t2); clearTimeout(t3); };
      }, 100);
      const t4 = setTimeout(() => setPrevStage(stageIndex), 0);
      return () => { clearTimeout(t1); clearTimeout(t4); };
    }
    if (stageIndex !== prevStage) {
      const t = setTimeout(() => setPrevStage(stageIndex), 0);
      return () => clearTimeout(t);
    }
  }, [stageIndex, prevStage]);

  // Auto-dismiss: 5s for first playthrough (shows story intro), 3s for
  // experienced players (faster, less intrusive).
  useEffect(() => {
    if (!showTransition) return;
    const delay = galacticWins === 0 ? 5000 : 3000;
    const t = setTimeout(dismiss, delay);
    // Also dismiss on any keypress.
    const onKey = () => dismiss();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [showTransition, galacticWins, dismiss]);

  if (!showTransition || transitionStage === null) return null;
  const stage = STAGES[transitionStage];
  if (!stage) return null;

  const prevStageDef = STAGES[transitionStage - 1];
  const isFirstPlaythrough = galacticWins === 0;
  const oldAccent = prevStageDef?.accent || "#64748b";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 overflow-hidden cursor-pointer"
      onClick={dismiss}
    >
      {/* Backdrop — stage gradient at 95% opacity, fades in */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: stage.bgGradient,
          opacity: 0.95,
          animation: "st-overlay-fade 0.7s ease-out",
        }}
      />

      {/* Starfield particles — CSS-only, drift across the screen.
          12 particles with randomized positions + animation delays.
          Each particle is a small dot that drifts from one edge to
          the other, colored with the new stage's accent. */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => {
          const left = (i * 37 + 13) % 100;
          const top = (i * 53 + 7) % 100;
          const delay = (i * 0.15) % 1.5;
          const size = 1 + (i % 3);
          const fromLeft = i % 2 === 0;
          return (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}px`,
                height: `${size}px`,
                background: i % 3 === 0 ? "#ffffff" : stage.accent,
                opacity: 0,
                animation: `st-particle-drift ${1.5 + (i % 3) * 0.5}s ease-out ${delay}s forwards`,
                "--from-x": fromLeft ? "-20vw" : "20vw",
                "--to-x": fromLeft ? "20vw" : "-20vw",
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      {/* Radial glow burst from center — new stage accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${stage.accent}30 0%, transparent 50%)`,
          animation: "st-glow-burst 2s ease-out",
        }}
      />

      {/* Content — centered, animates in based on phase */}
      <div className="relative z-10 text-center max-w-lg">
        {/* Phase 1: fade-out old stage icon */}
        {phase === "fade-out" && prevStageDef && (
          <div
            className="text-6xl mb-4"
            style={{
              color: oldAccent,
              filter: `drop-shadow(0 0 20px ${oldAccent}60)`,
              animation: "st-old-fade 0.8s ease-out forwards",
            }}
          >
            {prevStageDef.icon}
          </div>
        )}

        {/* Phase 2: particles (brief gap — starfield does the work) */}
        {phase === "particles" && (
          <div className="text-[0.7rem] uppercase tracking-[0.3em] text-white/40 font-mono mb-4 animate-pulse">
            evolving…
          </div>
        )}

        {/* Phase 3: burst-in new stage */}
        {phase === "burst-in" && (
          <div className="animate-[st-content-slide 0.6s_ease-out]">
            {/* "Evolved" label */}
            <div className="text-[0.7rem] uppercase tracking-[0.3em] text-white/50 font-mono mb-3">
              {prevStageDef ? `${prevStageDef.name} → ${stage.name}` : "Stage Unlocked"}
            </div>

            {/* Stage icon with burst glow */}
            <div className="relative inline-block mb-4">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: stage.accent,
                  filter: "blur(30px)",
                  animation: "st-burst 1.2s ease-out",
                }}
              />
              <div
                className="relative text-7xl mb-2"
                style={{
                  filter: `drop-shadow(0 0 25px ${stage.accent}80)`,
                  animation: "st-icon-pop 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {stage.icon}
              </div>
            </div>

            {/* Stage name */}
            <h1
              className="text-4xl font-bold mb-2"
              style={{
                color: stage.accent,
                textShadow: `0 0 15px ${stage.accent}60`,
              }}
            >
              {stage.name}
            </h1>

            {/* Tagline */}
            <p className="text-lg text-white/70 italic mb-4">{stage.tagline}</p>

            {/* Story intro — only on first playthrough */}
            {isFirstPlaythrough && (
              <p className="text-sm text-white/60 leading-relaxed mb-4 max-w-md mx-auto">
                {stage.storyIntro}
              </p>
            )}

            {/* Duration + new systems count */}
            <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 mb-4">
              <span className="text-xs text-white/50 font-mono uppercase tracking-wider">
                {stage.duration}
              </span>
            </div>

            {/* Continue button */}
            <div className="pointer-events-auto">
              <Button
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                }}
                style={{
                  background: stage.accent,
                  color: "#0a0a1a",
                  boxShadow: `0 0 15px ${stage.accent}50`,
                }}
                className="px-8"
              >
                Begin {stage.name} Era
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Skip hint for experienced players */}
            {!isFirstPlaythrough && (
              <p className="text-[0.6rem] text-white/30 mt-3 font-mono">
                click anywhere or press any key to skip
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes st-overlay-fade {
          from { opacity: 0; }
          to { opacity: 0.95; }
        }
        @keyframes st-old-fade {
          0% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 20px ${oldAccent}60); }
          100% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0 ${oldAccent}); }
        }
        @keyframes st-particle-drift {
          0% { opacity: 0; transform: translateX(var(--from-x)) translateY(0); }
          20% { opacity: 1; }
          80% { opacity: 0.6; }
          100% { opacity: 0; transform: translateX(var(--to-x)) translateY(-30px); }
        }
        @keyframes st-glow-burst {
          0% { opacity: 0; transform: scale(0.3); }
          40% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0.4; transform: scale(1); }
        }
        @keyframes st-burst {
          0% { opacity: 0; transform: scale(0); }
          50% { opacity: 0.8; transform: scale(1.4); }
          100% { opacity: 0.3; transform: scale(1); }
        }
        @keyframes st-icon-pop {
          0% { opacity: 0; transform: scale(0.2) rotate(-90deg); }
          60% { opacity: 1; transform: scale(1.15) rotate(5deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes st-content-slide {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
