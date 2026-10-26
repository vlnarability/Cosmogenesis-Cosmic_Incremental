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
export default function Home() {
  const [started, setStarted] = useState(false);
  if (!started) return <LandingPage onDescend={() => setStarted(true)} />;
  return <GameShell />;
}
