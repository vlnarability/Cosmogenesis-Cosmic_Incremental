"use client";

import { useState } from "react";
import { LandingPage } from "@/components/game/layout/LandingPage";
import { GameShell } from "@/components/game/layout/GameShell";

// LANDING-PAGE-GATE — the game now opens on a LandingPage (title card)
// instead of immediately entering the GameShell. The `started` flag lives
// in component state (NOT persisted) so it shows on every fresh page
// load. Clicking Descend enters the GameShell; any existing save is
// loaded automatically by the zustand persist middleware on store
// init (the LandingPage just gates rendering, not state hydration).
//
// SAVE-SLOT-RELOAD — when the player switches slots on the LandingPage,
// we set the new slot + reload the page so the persist middleware
// re-hydrates from the correct slot key. A sessionStorage flag
// ("cosmogenesis_descending") tells the reloaded page to skip the
// LandingPage and go directly into the game.
export default function Home() {
  const [started, setStarted] = useState(() => {
    if (typeof window === "undefined") return false;
    // If we just reloaded from a slot switch, skip the LandingPage.
    if (sessionStorage.getItem("cosmogenesis_descending")) {
      sessionStorage.removeItem("cosmogenesis_descending");
      return true;
    }
    return false;
  });
  if (!started) return <LandingPage onDescend={() => setStarted(true)} />;
  return <GameShell />;
}
