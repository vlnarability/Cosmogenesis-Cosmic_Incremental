"use client";

import { useState } from "react";
import { GameShell } from "@/components/game/layout/GameShell";
import { SolarGenesis } from "@/components/game/genesis/SolarGenesis";

// SOLAR-GENESIS-GATE — the game entry flow is now:
//   1. Title screen: "Cosmogenesis" + "Descend" button
//   2. Solar Genesis: the save screen — planets you've made persist
//      between sessions. Make new planets (new saves), select one to
//      Begin, or push a planet into the sun to delete it.
//   3. GameShell: the actual game

// Minimal title screen — just the game name + a single button.
function TitleScreen({ onPlay }: { onPlay: () => void }) {
  return (
    <main className="min-h-screen bg-[#03030c] flex flex-col items-center justify-center">
      <h1 className="text-5xl font-light tracking-wide text-amber-100/90 mb-2">
        Cosmogenesis
      </h1>
      <p className="text-sm text-slate-500/70 italic mb-8">
        Awaken as a single cell.
      </p>
      <button
        onClick={onPlay}
        className="px-8 py-3 text-base text-amber-100 border border-amber-400/30 rounded hover:bg-amber-400/10 hover:border-amber-400/50 transition-colors"
      >
        Descend
      </button>
    </main>
  );
}

export default function Home() {
  const [stage, setStage] = useState<"title" | "genesis" | "game">(() => {
    if (typeof window === "undefined") return "title";
    // If we just completed SolarGenesis (from a previous session that
    // was interrupted), skip to the game.
    if (sessionStorage.getItem("cosmogenesis_genesis_done")) {
      sessionStorage.removeItem("cosmogenesis_genesis_done");
      return "game";
    }
    return "title";
  });

  if (stage === "title") {
    return <TitleScreen onPlay={() => setStage("genesis")} />;
  }

  if (stage === "genesis") {
    return <SolarGenesis onComplete={() => setStage("game")} />;
  }

  return <GameShell />;
}
