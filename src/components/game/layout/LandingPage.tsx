"use client";

// LandingPage — pre-game entry screen.
//
// Design rationale: title screens for cosmic / incremental games earn
// their weight through RESTRAINT, not glow. The previous version hit
// every AI-template tell (gradient text, drop-shadow glow on the icon,
// glassmorphism card, CSS-gradient starfield, centered everything,
// verbose marketing copy, tech-stack footer flex, glowing CTA button).
//
// This version is intentionally sparse:
//   - Solid dark background, no gradient soup
//   - Solid cream title color (no background-clip:text gradient)
//   - Small icon sitting on the page, no card / no glow
//   - Asymmetric left-aligned layout — confident, not "centered for safety"
//   - Short, declarative copy — one tagline, one context sentence
//   - "Descend" as a quiet text link with underline, not a glowing CTA
//   - Save hint appended inline, no separate paragraph
//   - No tech-stack flex; just the illustration attribution
//
// The `started` flag lives in page.tsx (not in the persisted game store)
// so this landing page shows on every fresh page load — the player must
// click Descend to enter the game. This avoids the "5 achievements fire
// immediately on opening the link" UX issue by giving the player a
// deliberate entry moment.

import { useEffect, useState } from "react";
import { STORAGE_KEY } from "@/game/state/store";

export function LandingPage({ onDescend }: { onDescend: () => void }) {
  const [hasSave, setHasSave] = useState(false);
  const [saveStage, setSaveStage] = useState<string | null>(null);
  const [saveLayer, setSaveLayer] = useState<string | null>(null); // layer NAME (e.g. "Enlightenment") or null for L1

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Defer the localStorage read off the effect's synchronous body so
    // we don't trigger a cascading-render lint error. The microtask
    // still runs before paint, so the user sees the correct "continue"
    // copy on first paint.
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        setHasSave(true);
        const parsed = JSON.parse(raw);
        const state = parsed?.state;
        if (state) {
          if (typeof state.stageIndex === "number") {
            const stages = ["Cell", "Creature", "Tribal", "Civilization", "Empire", "Solar", "Galactic"];
            setSaveStage(stages[state.stageIndex] || `Stage ${state.stageIndex + 1}`);
          }
          // Determine the highest unlocked prestige layer (L2-L10).
          // L1 (Evolution) is the base game — always unlocked, doesn't count
          // as a prestige layer for the button-verb logic. Only L2+
          // (Enlightenment and above) counts as "prestige layer active".
          // Per user: 'use the name of the Layer rather than the number.'
          const ul = state.unlockedLayers || {};
          // Layer order + display names. L1 (evolution) is excluded — it's
          // the base game, not a prestige layer.
          const layerOrder: [string, string][] = [
            ["enlightenment", "Enlightenment"],
            ["transcendence", "Transcendence"],
            ["genesis", "Genesis"],
            ["apotheosis", "Apotheosis"],
            ["singularity", "Singularity"],
            ["omnipotence", "Omnipotence"],
            ["divinity", "Divinity"],
            ["infinity", "Infinity"],
            ["eternity", "Eternity"],
          ];
          let highestName: string | null = null;
          for (const [key, name] of layerOrder) {
            if (ul[key]) highestName = name;
          }
          setSaveLayer(highestName);
        }
      } catch {
        // Malformed save — treat as no save; the player starts fresh.
      }
    });
  }, []);

  // LAYER-AWARE-BUTTON-COPY: the "Descend" verb implies starting from
  // outside the cosmos. For L2+ prestige-layer saves, the player is
  // resuming a Divine Engine run — "Return" fits better. The button
  // glyph (↓) stays the same.
  const buttonVerb = saveLayer ? "Return" : "Descend";

  return (
    <main className="min-h-screen bg-[#060814] text-[#e8e2d4] flex flex-col selection:bg-[#7dd3fc]/30 selection:text-white">
      {/* Manuscript-style header — tiny, monospace, upper-cased tracking.
          Gives the page a "title page" feel without competing with the title. */}
      <header className="px-6 sm:px-10 py-6 flex justify-between items-baseline">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-[#e8e2d4]/40">
          Cosmogenesis · v0.2
        </span>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-[#e8e2d4]/40 hidden sm:inline">
          An incremental game
        </span>
      </header>

      {/* Main composition — left-aligned, vertically centered, bounded width.
          Empty space to the right is intentional — confident, not "centered for safety". */}
      <div className="flex-1 flex flex-col justify-center max-w-2xl w-full px-6 sm:px-10 mx-auto">
        {/* Icon — extracted from the favicon's dark-icon variant, with the
            dark blue background <rect> stripped out so it sits cleanly on
            the page (no "container card" effect). The original icon.svg has
            the blue background baked in (good for browser tab favicons, bad
            for a landing page). The transparent version lives at
            /icon-transparent.svg. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-transparent.svg"
          alt="Cosmogenesis — abstract star with concentric circles"
          width={96}
          height={96}
          className="mb-10 opacity-95"
        />

        {/* Title — large solid color, no gradient. tracking-tight for weight.
            leading-[0.95] keeps the cap-line tight; pb-2 + leading avoid the
            "g" descender clipping issue we hit with background-clip:text. */}
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight leading-[0.95] pb-2 mb-4 text-[#e8e2d4]">
          Cosmogenesis
        </h1>

        {/* Tagline — one short declarative sentence. Italic, slightly muted. */}
        <p className="text-base sm:text-lg italic text-[#e8e2d4]/60 mb-2">
          Awaken as a single cell.
        </p>

        {/* Context — one sentence, evocative. No marketing adjectives. */}
        <p className="text-sm text-[#e8e2d4]/45 max-w-md leading-relaxed mb-12">
          Seven stages of life separate the first spark of ATP from the rim
          of a galaxy that bears your name.
        </p>

        {/* Descend — quiet text link with underline, not a glowing CTA.
            Save state appended inline (no separate paragraph). */}
        <button
          onClick={onDescend}
          className="group inline-flex items-baseline gap-3 text-left w-fit cursor-pointer"
        >
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#7dd3fc] border-b border-[#7dd3fc]/40 pb-1 group-hover:border-[#7dd3fc] group-hover:pb-1.5 transition-all">
            {buttonVerb}
          </span>
          {hasSave ? (
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[#e8e2d4]/45">
              {saveLayer
                ? `· resume at ${saveLayer}`
                : saveStage
                  ? `· continue at ${saveStage}`
                  : "· continue your run"}
            </span>
          ) : (
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[#e8e2d4]/30">
              · begin anew
            </span>
          )}
        </button>
      </div>

      {/* Footer — just the illustration attribution. No tech-stack flex. */}
      <footer className="px-6 sm:px-10 py-6">
        <span className="font-mono text-[0.6rem] text-[#e8e2d4]/25 tracking-wide">
          Illustration · Eunkyeong Jeong / Unsplash
        </span>
      </footer>
    </main>
  );
}
