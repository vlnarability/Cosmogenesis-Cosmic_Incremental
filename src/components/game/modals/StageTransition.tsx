"use client";

import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// Shows a celebratory animation when the player evolves to a new stage.
// ONLY on first playthrough (galacticWins === 0). After first prestige, evolution is silent
// (just a log entry) since the base game runs in the background.
export function StageTransition() {
  const stageIndex = useGameStore((s) => s.stageIndex);
  const galacticWins = useGameStore((s) => s.galacticWins);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionStage, setTransitionStage] = useState<number | null>(null);
  const [prevStage, setPrevStage] = useState(stageIndex);

  useEffect(() => {
    // Only show the full-screen transition on the first playthrough (no prestige yet).
    // After the player's first Galactic win, stage transitions happen silently in the background.
    if (galacticWins > 0) {
      // Keep prevStage synced (deferred to avoid setState-in-effect cascades).
      const t = setTimeout(() => setPrevStage(stageIndex), 0);
      return () => clearTimeout(t);
    }
    if (stageIndex > prevStage) {
      const t1 = setTimeout(() => {
        setTransitionStage(stageIndex);
        setShowTransition(true);
      }, 0);
      const t2 = setTimeout(() => setPrevStage(stageIndex), 0);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    if (stageIndex !== prevStage) {
      const t = setTimeout(() => setPrevStage(stageIndex), 0);
      return () => clearTimeout(t);
    }
  }, [stageIndex, prevStage, galacticWins]);

  if (!showTransition || transitionStage === null) return null;
  const stage = STAGES[transitionStage];
  if (!stage) return null;

  const prevStageDef = STAGES[transitionStage - 1];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop with stage gradient */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: stage.bgGradient,
          opacity: 0.95,
        }}
      />
      {/* Radial glow burst */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${stage.accent}40 0%, transparent 60%)`,
          animation: "transition-glow 1.5s ease-out",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg animate-[transition-slide 0.8s_ease-out]">
        {/* "Evolved" label */}
        <div className="text-[0.7rem] uppercase tracking-[0.3em] text-white/60 font-mono mb-3">
          {prevStageDef ? `${prevStageDef.name} → ${stage.name}` : "Stage Unlocked"}
        </div>

        {/* Stage icon with burst */}
        <div className="relative inline-block mb-4">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: stage.accent,
              filter: "blur(40px)",
              animation: "transition-burst 1.5s ease-out",
            }}
          />
          <div
            className="relative text-7xl mb-2"
            style={{
              filter: `drop-shadow(0 0 30px ${stage.accent})`,
              animation: "transition-icon 1s ease-out",
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
            textShadow: `0 0 20px ${stage.accent}80`,
          }}
        >
          {stage.name}
        </h1>

        {/* Tagline */}
        <p className="text-lg text-white/80 italic mb-4">{stage.tagline}</p>

        {/* Story intro */}
        <p className="text-sm text-white/70 leading-relaxed mb-6 max-w-md mx-auto">
          {stage.storyIntro}
        </p>

        {/* Duration badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/5 mb-6">
          <span className="text-xs text-white/60 font-mono uppercase tracking-wider">
            {stage.name} Era · {stage.duration}
          </span>
        </div>

        {/* Continue button */}
        <div className="pointer-events-auto">
          <Button
            size="lg"
            onClick={() => {
              setShowTransition(false);
              setTransitionStage(null);
            }}
            style={{
              background: stage.accent,
              color: "#0a0a1a",
              boxShadow: `0 0 20px ${stage.accent}60`,
            }}
            className="px-8"
          >
            Begin {stage.name} Era →
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes transition-glow {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; }
          100% { opacity: 0.6; transform: scale(1); }
        }
        @keyframes transition-burst {
          0% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1.5); }
          100% { opacity: 0.3; transform: scale(1); }
        }
        @keyframes transition-icon {
          0% { opacity: 0; transform: scale(0.3) rotate(-180deg); }
          60% { opacity: 1; transform: scale(1.2) rotate(10deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes transition-slide {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
