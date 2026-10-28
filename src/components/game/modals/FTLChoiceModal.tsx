"use client";

// FTLChoiceModal — Solar stage's FTL path picker.
//
// FIRES WHEN: player researches the `ftl_theory` prerequisite tech.
// The modal opens automatically (state: showFtlChoice=true) and blocks
// further interaction until the player picks one of 3 mutually-exclusive
// FTL methods. Per user: 'Should only appear after researching an
// expensive prerequisite tech "FTL Technologies — Investigate potential
// ways to breach the lightspeed barrier" and then the modal appears with
// a brief description of the discovery, that there's three ideas and
// your research team needs you to make a choice on which one to follow.'
//
// ON PICK: the chosen tech (warp_theory / hyperlanes / jump_theory) is
// auto-researched. The other 2 are hiddenFromTechTab — never appear in
// the Tech tab. The choice is permanent (one-shot; can't re-pick).
//
// GATE: Solar→Galactic evolveRequires.requiresOneOfTechs checks that one
// of the 3 FTL techs is researched. The matching FTL infrastructure
// system (warp_gate / hyperlane_network / jump_array) must also be built
// (it has requiredTech = the chosen FTL tech).

import { useGameStore } from "@/game/state/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Rocket, Sparkles, Zap, ArrowRight } from "lucide-react";

interface FtlPath {
  id: string;
  name: string;
  icon: React.ReactNode;
  tagline: string;
  description: string;
  effects: string[];
  color: string;
}

const FTL_PATHS: FtlPath[] = [
  {
    id: "warp_theory",
    name: "Warp Drive",
    icon: <Zap className="w-5 h-5" />,
    tagline: "Bend space itself.",
    description:
      "Fold the fabric of space so a ship can ride the crease. Fast, expensive, high-energy — but the fastest way between two points in the galaxy.",
    effects: ["+50% production", "+25% energy upkeep", "Fastest FTL transit"],
    color: "#f43f5e",
  },
  {
    id: "hyperlanes",
    name: "Hyperdrive",
    icon: <Sparkles className="w-5 h-5" />,
    tagline: "Ride the cosmic currents.",
    description:
      "Slip between the seams of space where the cosmic currents run. Medium speed, medium cost, reliable — the balanced path, favored by traders and diplomats.",
    effects: ["+25% production", "+10% data", "Balanced cost + speed"],
    color: "#22d3ee",
  },
  {
    id: "jump_theory",
    name: "Jump Gates",
    icon: <Rocket className="w-5 h-5" />,
    tagline: "Step between constructed gates.",
    description:
      "Build a constellation of paired gates; ships step from one to the next instantaneously. Slow to construct, instant once built, low upkeep — the patient path.",
    effects: ["+100% population growth", "Instant transit once built", "Lowest upkeep"],
    color: "#a78bfa",
  },
];

export function FTLChoiceModal() {
  const showFtlChoice = useGameStore((s) => s.showFtlChoice);
  const setShowFtlChoice = useGameStore((s) => s.setShowFtlChoice);
  const chooseFtlPath = useGameStore((s) => s.chooseFtlPath);
  const ftlChoice = useGameStore((s) => s.ftlChoice);

  // If the player has already chosen, don't show the modal (defensive —
  // the trigger only fires when ftlChoice is null, but a hot-reload or
  // stale state could resurrect it).
  if (ftlChoice) return null;

  return (
    <Dialog open={showFtlChoice} onOpenChange={(v) => !v && setShowFtlChoice(false)}>
      <DialogContent className="max-w-2xl glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Rocket className="w-5 h-5 text-cyan-400" />
            FTL Research Breakthrough
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            The lightspeed barrier yields. Your research team has identified <span className="font-semibold text-foreground">three viable paths</span> to faster-than-light travel — but the approaches are mutually exclusive. Once a path is chosen, the others cannot be pursued. Your team awaits your decision.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {FTL_PATHS.map((path) => (
            <button
              key={path.id}
              onClick={() => {
                chooseFtlPath(path.id);
              }}
              className="group text-left rounded-lg border p-4 transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{
                borderColor: `${path.color}40`,
                background: `${path.color}08`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${path.color}18`, color: path.color }}
                >
                  {path.icon}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-sm" style={{ color: path.color }}>
                    {path.name}
                  </div>
                  <div className="text-[0.65rem] text-muted-foreground italic truncate">
                    {path.tagline}
                  </div>
                </div>
              </div>
              <p className="text-[0.7rem] text-muted-foreground leading-relaxed mb-3">
                {path.description}
              </p>
              <div className="space-y-1">
                {path.effects.map((eff) => (
                  <div
                    key={eff}
                    className="text-[0.65rem] flex items-center gap-1.5"
                    style={{ color: path.color }}
                  >
                    <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                    <span className="font-medium">{eff}</span>
                  </div>
                ))}
              </div>
              <div
                className="mt-3 text-[0.65rem] font-mono uppercase tracking-wide text-center py-1.5 rounded border transition-colors"
                style={{
                  borderColor: `${path.color}40`,
                  color: path.color,
                }}
              >
                Choose {path.name}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-[0.65rem] text-muted-foreground/70 italic text-center">
          The choice is permanent. The other paths will be abandoned — they cannot be researched later.
        </div>
      </DialogContent>
    </Dialog>
  );
}
