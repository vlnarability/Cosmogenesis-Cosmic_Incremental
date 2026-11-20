"use client";

import { useState } from "react";
import { LandingPage } from "@/components/game/layout/LandingPage";
import { GameShell } from "@/components/game/layout/GameShell";
import { SolarGenesis } from "@/components/game/genesis/SolarGenesis";
import { readSlotInfo, NUM_SLOTS } from "@/game/state/store";

// SOLAR-GENESIS-GATE — the game now opens with a cosmic dust simulation
// (inspired by Aurora, 2011) the very first time the player visits the
// page with NO save in any slot. The player accumulates dust into
// planets, guides one into the habitable zone to seed life, then clicks
// Begin to start the cell->galactic loop. After the first save is
// created, SolarGenesis never shows again (it's a one-time intro).
//
// LANDING-PAGE-GATE — returning players (with a save) see the LandingPage
// title card instead. The `started` flag is component state (NOT persisted)
// so the LandingPage shows on every fresh page load. Clicking Descend
// enters the GameShell.
//
// SAVE-SLOT-RELOAD — when the player switches slots on the LandingPage,
// a sessionStorage flag ("cosmogenesis_descending") tells the reloaded
// page to skip the LandingPage and go directly into the game.

// Check if ANY slot has a save (returns true if at least one save exists).
function anySaveExists(): boolean {
  if (typeof window === "undefined") return false;
  for (let i = 1; i <= NUM_SLOTS; i++) {
    if (readSlotInfo(i) !== null) return true;
  }
  return false;
}

export default function Home() {
  const [stage, setStage] = useState<"genesis" | "landing" | "game">(() => {
    if (typeof window === "undefined") return "landing";
    // If we just reloaded from a slot switch, skip everything.
    if (sessionStorage.getItem("cosmogenesis_descending")) {
      sessionStorage.removeItem("cosmogenesis_descending");
      return "game";
    }
    // If SolarGenesis was just completed, skip to the game.
    if (sessionStorage.getItem("cosmogenesis_genesis_done")) {
      sessionStorage.removeItem("cosmogenesis_genesis_done");
      return "landing";
    }
    // If no save exists in any slot, show SolarGenesis (first-time intro).
    if (!anySaveExists()) return "genesis";
    return "landing";
  });

  if (stage === "genesis") {
    return (
      <SolarGenesis
        onComplete={() => {
          sessionStorage.setItem("cosmogenesis_genesis_done", "1");
          setStage("landing");
        }}
      />
    );
  }

  if (stage === "landing") {
    return <LandingPage onDescend={() => setStage("game")} />;
  }

  return <GameShell />;
}
