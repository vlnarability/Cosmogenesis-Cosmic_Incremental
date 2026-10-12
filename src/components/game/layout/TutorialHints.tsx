"use client";

import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { SYSTEMS } from "@/game/data/systems";
import { useState } from "react";
import { X, Lightbulb, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Hint {
  id: string;
  title: string;
  body: string;
  cta: string;
  // Condition: when to show this hint
  show: (s: any) => boolean;
  // Action: what to do when CTA clicked (e.g., switch tab)
  action?: (setTab: (t: any) => void) => void;
}

const HINTS: Hint[] = [
  {
    id: "first_action",
    title: "Tap to gather",
    body: "Click \"Absorb Glucose\" to gather resources. Manual actions bootstrap your civilization — keep clicking to build up a stockpile.",
    cta: "Got it",
    show: (s) => s.time < 5 && Object.values(s.ownedSystems).reduce((a: number, b: any) => a + (b || 0), 0) === 0,
  },
  {
    id: "first_system",
    title: "Build your first system",
    body: "Systems produce resources automatically. Open the Systems tab and build a Membrane Pump — it generates glucose over time, even when you're not clicking.",
    cta: "Open Systems",
    action: (setTab) => setTab("systems"),
    show: (s) => Object.values(s.ownedSystems).reduce((a: number, b: any) => a + (b || 0), 0) === 0 && s.time > 5,
  },
  {
    id: "research_tech",
    title: "Research technology",
    body: "Techs give permanent bonuses for the rest of this stage. Open the Tech tab to research your first upgrade — Membrane Reinforcement boosts ATP production by 25%.",
    cta: "Open Tech",
    action: (setTab) => setTab("tech"),
    show: (s) => Object.keys(s.technologies).length === 0 && Object.values(s.ownedSystems).reduce((a: number, b: any) => a + (b || 0), 0) >= 1,
  },
  {
    id: "lineage_drift",
    title: "Your lineage is forming",
    body: "Some systems and techs grant archetype affinity. Watch the Lineage panel — your dominant archetype will lock in when you evolve from Creature to Tribal, granting a permanent bonus.",
    cta: "Understood",
    show: (s) => Object.values(s.archetypeAffinity || {}).reduce((a: number, b: any) => a + (b || 0), 0) >= 1 && !s.lockedArchetype,
  },
  {
    id: "evolve_ready",
    title: "Ready to evolve",
    body: "Your Evolve button is now active! Evolving to the next stage unlocks new systems, techs, and resources. Score carries forward — bigger scores mean more Evolution Points when you prestige.",
    cta: "Evolve now",
    action: (setTab) => setTab("actions"),
    show: (s) => {
      const stage = STAGES[s.stageIndex];
      if (!stage) return false;
      const totalSystems = Object.values(s.ownedSystems).reduce((a: number, b: any) => a + (b || 0), 0);
      const totalTech = Object.keys(s.technologies).length;
      const evolveBoost = 1 - Math.min(0.30, (s.upgrades["evolutionary_momentum"] || 0) * 0.05);
      return s.population >= stage.evolveRequires.minPopulation * evolveBoost &&
             totalSystems >= stage.evolveRequires.minSystems * evolveBoost &&
             totalTech >= stage.evolveRequires.minTech * evolveBoost;
    },
  },
  {
    id: "first_prestige_shop",
    title: "Spend your Evolution Points",
    body: "You've earned Evolution Points (EP)! Open the Shop (top-right) and buy \"Auto-Builder\" first (8 EP) — it auto-purchases systems every 8s so you can focus on strategy instead of clicking. Then grab Auto-Researcher and Auto-Evolver to fully automate the base game.",
    cta: "Open Shop",
    action: () => useGameStore.getState().setShowShop(true),
    show: (s) =>
      (s.evolutionPoints || 0) >= 8 &&
      (s.upgrades["auto_system_buyer"] || 0) === 0 &&
      (s.galacticWins || 0) >= 1,
  },
  {
    id: "auto_builder_running",
    title: "Auto-Builder is running!",
    body: "Your Auto-Builder is now purchasing systems automatically. You'll see new buildings appear every 8 seconds. Consider Auto-Researcher next to automate techs, then Auto-Evolver to auto-advance stages.",
    cta: "Nice",
    show: (s) => (s.upgrades["auto_system_buyer"] || 0) > 0 && (s.upgrades["auto_tech_buyer"] || 0) === 0,
  },
];

export function TutorialHints() {
  const gameStore = useGameStore();
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());
  const [minimized, setMinimized] = useState(false);

  // Don't show hints when a modal is open (avoids overlap with Evolve button etc.)
  if (gameStore.tutorialDismissed) return null;
  if (gameStore.showEvolve || gameStore.showShop || gameStore.showSettings) return null;
  if (gameStore.activeStoryPopup) return null;

  // Find the first hint that should show and hasn't been dismissed
  const activeHint = HINTS.find((h) =>
    h.show(gameStore) && !dismissedHints.has(h.id)
  );

  if (!activeHint) return null;

  const dismiss = () => {
    setDismissedHints((prev) => new Set(prev).add(activeHint.id));
    setMinimized(false);
  };

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 left-4 z-40 glass-strong rounded-full px-3 py-2 border border-primary/40 flex items-center gap-1.5 text-xs hover:bg-primary/10 transition-colors"
        title="Show hint"
      >
        <Lightbulb className="w-3.5 h-3.5 text-primary" />
        <span className="text-primary font-semibold">Hint</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-xs glass-strong rounded-lg border border-primary/40 overflow-hidden shadow-xl animate-[slideUp_0.3s_ease]">
      {/* Header */}
      <div className="bg-primary/15 px-3 py-1.5 flex items-center gap-2 border-b border-primary/30">
        <Lightbulb className="w-3.5 h-3.5 text-primary" />
        <span className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-primary">
          Guide
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="text-muted-foreground hover:text-foreground text-[0.65rem] px-1"
            title="Minimize"
          >
            –
          </button>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground"
            title="Dismiss hint"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* Body */}
      <div className="p-3">
        <h3 className="text-sm font-bold leading-tight mb-1">{activeHint.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{activeHint.body}</p>
      </div>
      {/* Footer */}
      <div className="px-3 pb-3 flex gap-2">
        {activeHint.action && (
          <button
            onClick={() => {
              activeHint.action?.(gameStore.setTab);
              dismiss();
            }}
            className="flex-1 text-xs py-1.5 rounded border border-primary bg-primary/15 text-primary font-semibold hover:bg-primary/25 transition-colors flex items-center justify-center gap-1"
          >
            {activeHint.cta}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
        {!activeHint.action && (
          <button
            onClick={dismiss}
            className="flex-1 text-xs py-1.5 rounded border border-primary bg-primary/15 text-primary font-semibold hover:bg-primary/25 transition-colors"
          >
            {activeHint.cta}
          </button>
        )}
        <button
          onClick={() => useGameStore.getState().dismissTutorial()}
          className="text-[0.65rem] text-muted-foreground hover:text-foreground px-1"
          title="Disable all hints"
        >
          Disable
        </button>
      </div>
    </div>
  );
}
