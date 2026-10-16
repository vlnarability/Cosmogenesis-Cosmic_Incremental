"use client";

import { useEffect } from "react";
import { useGameStore } from "../state/store";
import type { TabId } from "../state/types";

// ============================================================
// DEBUG-SHORTCUTS — rebindable keyboard shortcuts.
//
// Reads the active keybinds from `state.keyboardShortcuts` (set in
// Settings → Shortcuts). Layer-gated actions (trials, constellations,
// market, galaxy, heresy, universal, creatures, diplomacy, war, genesis)
// only fire when their layer is unlocked — see SHORTCUT_LAYER_GATE for
// the layer-id mapping. Locked shortcuts silently no-op so the player
// doesn't accidentally open a modal they haven't unlocked yet.
//
// Non-layer shortcuts (pause, speed1-8, save, shop, prestige, close)
// always fire. close (Esc) is handled specially: it dismisses the active
// story popup, then closes Shop / Evolve / Settings modals.
// ============================================================

export function useKeyboardShortcuts() {
  const togglePause = useGameStore((s) => s.togglePause);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const setTab = useGameStore((s) => s.setTab);
  const setShowShop = useGameStore((s) => s.setShowShop);
  const setShowEvolve = useGameStore((s) => s.setShowEvolve);
  const setShowSettings = useGameStore((s) => s.setShowSettings);
  const openLayerModal = useGameStore((s) => s.openLayerModal);
  const dismissStory = useGameStore((s) => s.dismissStory);
  const saveGame = useGameStore((s) => s.saveGame);

  const activeStoryPopup = useGameStore((s) => s.activeStoryPopup);
  const activeEvent = useGameStore((s) => s.activeEvent);
  const unlockedChallenges = useGameStore((s) => s.unlockedChallenges);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  // Subscribe to keyboardShortcuts so the handler re-binds when the player
  // rebinds a key in Settings. (We don't read it inside the handler — we
  // pull the latest value via the selector each event.)
  const keyboardShortcuts = useGameStore((s) => s.keyboardShortcuts);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs/textareas
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (target.isContentEditable) return;

      const binds = keyboardShortcuts || {};
      const key = e.key;

      // Helper: returns true if `key` matches the bind for the given action.
      const matches = (actionId: string) => binds[actionId] === key;

      // === close (Escape) — handled before the modal-blocking gate ===
      // Always fires (regardless of story/event active state).
      if (matches("close")) {
        if (activeStoryPopup) {
          dismissStory(activeStoryPopup);
          return;
        }
        setShowShop(false);
        setShowEvolve(false);
        setShowSettings(false);
        return;
      }

      // If a story popup or event is active, don't process other shortcuts
      if (activeStoryPopup || activeEvent) return;

      // === Pause / speed ===
      if (matches("pause")) {
        e.preventDefault();
        togglePause();
        return;
      }
      if (matches("speed1")) { setSpeed(1); return; }
      if (matches("speed2")) { setSpeed(2); return; }
      if (matches("speed4")) { setSpeed(4); return; }
      if (matches("speed8")) { setSpeed(8); return; }

      // === Universal actions ===
      if (matches("save")) {
        saveGame();
        return;
      }
      if (matches("shop")) {
        setShowShop(true);
        return;
      }
      if (matches("prestige")) {
        setTab("prestige" as TabId);
        return;
      }

      // === Layer-gated actions ===
      // Walk each layer-action id. For each, check (a) the key matches the
      // bind, and (b) the layer is unlocked. Locked layers silently no-op so
      // the player doesn't accidentally open a modal they haven't unlocked yet.
      const layerActions: Record<string, string> = {
        trials: "challenges",
        constellations: "enlightenment",
        market: "transcendence",
        galaxy: "genesis",
        heresy: "apotheosis",
        universal: "singularity",
        creatures: "omnipotence",
        diplomacy: "divinity",
        war: "infinity",
        genesis: "eternity",
      };
      for (const actionId of Object.keys(layerActions)) {
        if (!matches(actionId)) continue;
        const layerId = layerActions[actionId];
        let unlocked = false;
        if (layerId === "challenges") {
          unlocked = !!unlockedChallenges;
        } else {
          unlocked = !!unlockedLayers?.[layerId as keyof typeof unlockedLayers];
        }
        if (!unlocked) return; // locked — silently no-op (don't fall through to other actions)
        openLayerModal(layerId);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    togglePause, setSpeed, setTab, setShowShop, setShowEvolve, setShowSettings,
    openLayerModal, dismissStory, saveGame,
    activeStoryPopup, activeEvent, unlockedChallenges, unlockedLayers,
    keyboardShortcuts,
  ]);
}
