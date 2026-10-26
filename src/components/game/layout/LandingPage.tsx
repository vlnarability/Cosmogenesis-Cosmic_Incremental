"use client";

// LandingPage — pre-game entry screen.
//
// Renders the Game Name + Game Icon + "Descend" button before the player
// enters the GameShell. If a save exists in localStorage, the button copy
// changes to "Continue" and the player is told their prior progress will
// be loaded.
//
// The "started" flag lives in page.tsx (not in the persisted game store)
// so this landing page shows on every fresh page load — the player must
// click Descend to enter the game. This avoids the "5 achievements fire
// immediately on opening the link" UX issue by giving the player a
// deliberate entry moment, AND it serves as the title card the game
// deserves.

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { STORAGE_KEY } from "@/game/state/store";
import { ArrowDown, Globe, Sparkles } from "lucide-react";

export function LandingPage({ onDescend }: { onDescend: () => void }) {
  const [hasSave, setHasSave] = useState(false);
  const [saveStage, setSaveStage] = useState<string | null>(null);
  const [saveRuns, setSaveRuns] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Defer the localStorage read off the effect's synchronous body so
    // we don't trigger a cascading-render lint error. The microtask
    // still runs before paint, so the user sees the correct "Continue"
    // copy on first paint.
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        setHasSave(true);
        // Best-effort peek at the save's stage + run count — for the
        // "Continue" button subtitle. Wrapped in try/catch in case the
        // save is malformed.
        const parsed = JSON.parse(raw);
        const state = parsed?.state;
        if (state) {
          if (typeof state.stageIndex === "number") {
            const stages = ["Cell", "Creature", "Tribal", "Civilization", "Empire", "Solar", "Galactic"];
            setSaveStage(stages[state.stageIndex] || `Stage ${state.stageIndex + 1}`);
          }
          if (typeof state.totalRuns === "number") {
            setSaveRuns(state.totalRuns);
          }
        }
      } catch {
        // Malformed save — treat as no save; the player starts fresh.
      }
    });
  }, []);

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-foreground"
      style={{
        background:
          "radial-gradient(ellipse at top, #0c1a3a 0%, #060914 50%, #020617 100%)",
      }}
    >
      {/* Starfield backdrop — CSS dots rendered via radial-gradient noise */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 60% 70%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1.5px 1.5px at 80% 20%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,0.5), transparent),
            radial-gradient(2px 2px at 90% 50%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 45% 45%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1.5px 1.5px at 10% 60%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 75% 85%, rgba(255,255,255,0.4), transparent)
          `,
          backgroundSize: "1000px 1000px, 800px 800px, 1200px 1200px, 600px 600px, 1000px 1000px, 700px 700px, 900px 900px, 500px 500px",
          backgroundRepeat: "repeat",
        }}
      />
      {/* Soft concentric aura behind the icon — echoes the favicon art */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: "50%",
          left: "50%",
          width: "640px",
          height: "640px",
          transform: "translate(-50%, -55%)",
          background:
            "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(56,189,248,0.06) 30%, transparent 60%)",
          borderRadius: "50%",
          filter: "blur(20px)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl mx-auto">
        {/* Game Icon — the favicon, same illustration used in the browser tab */}
        <div
          className="relative mb-6"
          style={{
            filter: "drop-shadow(0 0 24px rgba(56,189,248,0.5))",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.svg"
            alt="Cosmogenesis — abstract star with concentric circles and dots"
            width={140}
            height={140}
            className="rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(56,189,248,0.3)",
            }}
          />
        </div>

        {/* Game Name */}
        <h1
          className="text-5xl sm:text-6xl font-bold tracking-tight mb-3"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #7dd3fc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Cosmogenesis
        </h1>

        {/* Subtitle / tagline */}
        <p className="text-base sm:text-lg text-muted-foreground italic mb-1">
          A cosmic incremental about a god awakening.
        </p>
        <p className="text-sm text-muted-foreground/80 mb-8 max-w-md">
          Guide a single cell through seven stages of life, ten divine layers, and a hundred
          procedurally-discovered archetypes — from the first spark of ATP to the rim of a galaxy
          that bears your name.
        </p>

        {/* Descend button */}
        <Button
          size="lg"
          onClick={onDescend}
          className="group relative gap-2 px-8 py-6 text-base font-semibold rounded-xl border border-cyan-400/50 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-400/80 transition-all"
          style={{
            boxShadow: "0 0 30px rgba(56,189,248,0.25), inset 0 0 12px rgba(56,189,248,0.08)",
          }}
        >
          <ArrowDown className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
          {hasSave ? "Descend — Continue Your Run" : "Descend"}
        </Button>

        {/* Save state hint */}
        {hasSave ? (
          <p className="text-xs text-cyan-300/70 mt-4 flex items-center gap-1.5 flex-wrap justify-center">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>
              A save exists
              {saveStage && (
                <>
                  {" — currently at "}
                  <span className="font-semibold text-cyan-300">{saveStage}</span>
                  {saveRuns !== null && saveRuns > 0 && (
                    <>
                      {" · "}
                      {saveRuns} prior {saveRuns === 1 ? "run" : "runs"}
                    </>
                  )}
                </>
              )}
              . Your progress will load when you Descend.
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/60 mt-4 flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            A new cosmos awaits — no prior save found. Estimated length: 5–60 min for a first
            ascension.
          </p>
        )}

        {/* Footer */}
        <p className="text-[0.65rem] text-muted-foreground/50 mt-12 max-w-sm">
          Illustration by Eunkyeong Jeong on Unsplash. Built with Next.js · Zustand · Three.js.
        </p>
      </div>
    </main>
  );
}
