"use client";

// AscensionChoiceModal — Galactic stage's ascension path picker.
//
// FIRES WHEN: player researches the `ascension_theory` prerequisite tech.
// Same pattern as FTLChoiceModal — 3 mutually-exclusive paths, player
// picks one, the chosen tech is auto-researched, others hidden.
//
// GATE: Galactic→Prestige evolveRequires.requiresOneOfTechs checks that
// one of the 3 ascension techs is researched. The Ascension Project
// megastructure must also be built (requiresSystems: ["ascension_project"]).

import { useGameStore } from "@/game/state/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Brain, Dna, Eye, ArrowRight } from "lucide-react";

interface AscensionPath {
  id: string;
  name: string;
  icon: React.ReactNode;
  tagline: string;
  description: string;
  effects: string[];
  color: string;
}

const ASCENSION_PATHS: AscensionPath[] = [
  {
    id: "tech_ascension",
    name: "Technological Singularity",
    icon: <Brain className="w-5 h-5" />,
    tagline: "Mind becomes machine.",
    description:
      "Upload consciousness into a substrate that does not age, does not forget, does not die. The civilization transcends biology — it becomes pure thought, replicated across a thousand servers.",
    effects: ["+100% science", "Unlocks the digital-mind path", "Best for science-focused runs"],
    color: "#22d3ee",
  },
  {
    id: "bio_ascension",
    name: "Biological Transcendence",
    icon: <Dna className="w-5 h-5" />,
    tagline: "Life becomes optional.",
    description:
      "Master genetics so completely that form itself becomes clay. Shape new bodies for new worlds, evolve past hunger and fear, become a lineage that outlives stars.",
    effects: ["+100% population growth", "Unlocks the genetic-mastery path", "Best for pop-focused runs"],
    color: "#84cc16",
  },
  {
    id: "psionic_ascension",
    name: "Psionic Awakening",
    icon: <Eye className="w-5 h-5" />,
    tagline: "Consciousness unbound.",
    description:
      "Awaken the latent psionic potential of every mind. Thought bends matter; will shapes reality; the civilization transcends the physical altogether — it becomes a single dreaming god.",
    effects: ["+100% happiness", "Unlocks the consciousness path", "Best for happiness-focused runs"],
    color: "#a78bfa",
  },
];

export function AscensionChoiceModal() {
  const showAscensionChoice = useGameStore((s) => s.showAscensionChoice);
  const setShowAscensionChoice = useGameStore((s) => s.setShowAscensionChoice);
  const chooseAscensionPath = useGameStore((s) => s.chooseAscensionPath);
  const ascensionChoice = useGameStore((s) => s.ascensionChoice);

  if (ascensionChoice) return null;

  return (
    <Dialog open={showAscensionChoice} onOpenChange={(v) => !v && setShowAscensionChoice(false)}>
      <DialogContent className="max-w-2xl glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Eye className="w-5 h-5 text-violet-400" />
            Ascension Theory Proven
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            The theoretical framework is sound — transcendence is possible. Your civilization must now <span className="font-semibold text-foreground">choose its final form</span>. Three paths lead beyond mortality, but they are mutually exclusive. Once chosen, the others cannot be pursued. The god your civilization becomes is shaped by this decision.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {ASCENSION_PATHS.map((path) => (
            <button
              key={path.id}
              onClick={() => chooseAscensionPath(path.id)}
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
                Become {path.name}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-[0.65rem] text-muted-foreground/70 italic text-center">
          The choice is permanent. After this, you must also construct the Ascension Project to ascend.
        </div>
      </DialogContent>
    </Dialog>
  );
}
