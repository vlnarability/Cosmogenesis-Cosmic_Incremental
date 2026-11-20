"use client";

import { useState } from "react";
import { LandingPage } from "@/components/game/layout/LandingPage";
import { GameShell } from "@/components/game/layout/GameShell";
import { SolarGenesis } from "@/components/game/genesis/SolarGenesis";

// SOLAR-GENESIS-GATE — Solar Genesis shows AFTER the player clicks Descend
// on an empty slot, not before the LandingPage. Flow:
//   1. Page loads → LandingPage (unless descending flag → GameShell)
//   2. Player selects an empty slot → clicks Descend → SolarGenesis
//   3. SolarGenesis completes → GameShell
// If the slot has an existing save, Descend goes directly to GameShell.

export default function Home() {
  const [stage, setStage] = useState<"genesis" | "landing" | "game">(() => {
    if (typeof window === "undefined") return "landing";
    // If we just reloaded from a slot switch with an existing save,
    // skip to the game.
    if (sessionStorage.getItem("cosmogenesis_descending")) {
      sessionStorage.removeItem("cosmogenesis_descending");
      return "game";
    }
    // If SolarGenesis was just completed (from a slot switch on an empty
    // slot), go directly to the game.
    if (sessionStorage.getItem("cosmogenesis_genesis_done")) {
      sessionStorage.removeItem("cosmogenesis_genesis_done");
      return "game";
    }
    // If we're reloading from selecting an empty slot (new game),
    // show SolarGenesis.
    if (sessionStorage.getItem("cosmogenesis_new_game")) {
      sessionStorage.removeItem("cosmogenesis_new_game");
      return "genesis";
    }
    return "landing";
  });

  if (stage === "genesis") {
    return <SolarGenesis onComplete={() => setStage("game")} />;
  }

  if (stage === "landing") {
    return (
      <LandingPage
        onDescend={(isNewGame: boolean) => {
          if (isNewGame) setStage("genesis");
          else setStage("game");
        }}
      />
    );
  }

  return <GameShell />;
}
