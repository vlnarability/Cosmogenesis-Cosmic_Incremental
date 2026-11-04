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
import { STORAGE_KEY, useGameStore, getCurrentSlot, setCurrentSlot, readSlotInfo, NUM_SLOTS } from "@/game/state/store";
import { Pencil, Check, X } from "lucide-react";

// Slot names are stored separately in localStorage (not in the save data)
// so renaming doesn't trigger a save re-serialization.
const SLOT_NAMES_KEY = "cosmogenesis_slot_names";

function readSlotNames(): Record<number, string> {
  try {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(SLOT_NAMES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeSlotName(slot: number, name: string) {
  try {
    if (typeof window === "undefined") return;
    const names = readSlotNames();
    if (name.trim()) names[slot] = name.trim().slice(0, 24);
    else delete names[slot];
    localStorage.setItem(SLOT_NAMES_KEY, JSON.stringify(names));
  } catch { /* ignore */ }
}

export function LandingPage({ onDescend }: { onDescend: () => void }) {
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [slotInfos, setSlotInfos] = useState<(ReturnType<typeof readSlotInfo> | null)[]>([null, null, null]);
  const [slotNames, setSlotNames] = useState<Record<number, string>>({});
  const [renamingSlot, setRenamingSlot] = useState<number | null>(null);
  const [renameText, setRenameText] = useState("");
  const difficultyMode = useGameStore((s) => s.difficultyMode);
  const setDifficultyMode = useGameStore((s) => s.setDifficultyMode);

  useEffect(() => {
    if (typeof window === "undefined") return;
    queueMicrotask(() => {
      const current = getCurrentSlot();
      setSelectedSlot(current);
      const infos = Array.from({ length: NUM_SLOTS }, (_, i) => readSlotInfo(i + 1));
      setSlotInfos(infos);
      setSlotNames(readSlotNames());
    });
  }, []);

  const selectedInfo = slotInfos[selectedSlot - 1];
  const selectedHasSave = !!selectedInfo;
  const buttonVerb = selectedInfo?.layerName ? "Return" : "Descend";

  const handleDescend = () => {
    const currentSlot = getCurrentSlot();
    // Flush any pending write to the CURRENT slot before switching.
    useGameStore.getState().flushSave();
    setCurrentSlot(selectedSlot);
    if (selectedSlot !== currentSlot) {
      // SAVE-SLOT-FIX — the Zustand persist middleware hydrates from
      // localStorage ONCE on page load. When the player switches slots,
      // we must reload the page so the store re-hydrates from the
      // correct slot key. Without this, the in-memory store still has
      // the old slot's data + writes it to the new slot (corrupting
      // both). The sessionStorage flag tells the reloaded page to skip
      // the LandingPage and go directly into the game.
      sessionStorage.setItem("cosmogenesis_descending", "1");
      window.location.reload();
      return;
    }
    onDescend();
  };

  const startRename = (slot: number) => {
    setRenamingSlot(slot);
    setRenameText(slotNames[slot] || "");
  };
  const confirmRename = () => {
    if (renamingSlot !== null) {
      writeSlotName(renamingSlot, renameText);
      setSlotNames(readSlotNames());
    }
    setRenamingSlot(null);
    setRenameText("");
  };
  const cancelRename = () => {
    setRenamingSlot(null);
    setRenameText("");
  };

  return (
    <main className="min-h-screen bg-[#060814] text-[#e8e2d4] flex flex-col selection:bg-[#7dd3fc]/30 selection:text-white">
      {/* F13 — Animated starfield background. Two fixed layers drift slowly
          across the page (240s + 360s loops) with subtle twinkle. Opacity
          is intentionally low so the page stays "intentionally sparse" per
          the design rationale. The foreground content sits above via z-index. */}
      <div className="lp-starfield" aria-hidden />
      <div className="lp-starfield-layer-2" aria-hidden />

      <div className="lp-content flex flex-col flex-1">
      {/* Manuscript-style header — tiny, monospace, upper-cased tracking.
          Gives the page a "title page" feel without competing with the title. */}
      <header className="px-6 sm:px-10 py-6 flex justify-between items-baseline">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-[#e8e2d4]/40">
          Cosmogenesis · v0.9
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
        { }
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
        <p className="text-sm text-[#e8e2d4]/45 max-w-md leading-relaxed mb-8">
          Seven stages of life separate the first spark of ATP from the rim
          of a galaxy that bears your name.
        </p>

        {/* ROUND F2 — Save slot picker. 3 slots, each showing save info or
            "Empty". Clicking a slot selects it. The Descend button loads the
            selected slot. */}
        <div className="mb-8">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#e8e2d4]/35 block mb-2">
            Save Slots
          </span>
          <div className="flex gap-3">
            {slotInfos.map((info, i) => {
              const slotNum = i + 1;
              const isSelected = selectedSlot === slotNum;
              const slotName = slotNames[slotNum];
              const isRenaming = renamingSlot === slotNum;
              return (
                <div
                  key={slotNum}
                  onClick={() => !isRenaming && setSelectedSlot(slotNum)}
                  className={`text-left p-2 rounded border transition-all min-w-[120px] cursor-pointer relative ${
                    isSelected
                      ? "border-[#7dd3fc]/50 bg-[#7dd3fc]/5"
                      : "border-[#e8e2d4]/10 hover:border-[#e8e2d4]/25"
                  }`}
                >
                  <div className={`font-mono text-[0.55rem] uppercase tracking-wide ${isSelected ? "text-[#7dd3fc]" : "text-[#e8e2d4]/30"}`}>
                    Slot {slotNum}
                  </div>
                  {/* Custom slot name (if set) + rename UI */}
                  {isRenaming ? (
                    <div className="mt-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmRename();
                          if (e.key === "Escape") cancelRename();
                        }}
                        autoFocus
                        maxLength={24}
                        placeholder="Name this slot…"
                        className="flex-1 min-w-0 bg-[#060814] border border-[#7dd3fc]/40 rounded px-1.5 py-0.5 text-[0.65rem] text-[#e8e2d4] placeholder:text-[#e8e2d4]/30 focus:outline-none focus:border-[#7dd3fc]"
                      />
                      <button onClick={confirmRename} className="text-[#7dd3fc] hover:text-white shrink-0" title="Confirm">
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={cancelRename} className="text-[#e8e2d4]/40 hover:text-white shrink-0" title="Cancel">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {slotName && (
                        <div className="text-[0.7rem] font-semibold text-[#e8e2d4]/80 mt-0.5 truncate">
                          {slotName}
                        </div>
                      )}
                      {info && (
                        <button
                          onClick={(e) => { e.stopPropagation(); startRename(slotNum); }}
                          className="absolute top-1 right-1 text-[#e8e2d4]/20 hover:text-[#7dd3fc] transition-colors"
                          title="Rename slot"
                          aria-label={`Rename slot ${slotNum}`}
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </>
                  )}
                  {!info ? (
                    <div className="text-[0.65rem] text-[#e8e2d4]/25 italic mt-0.5">
                      Empty
                    </div>
                  ) : !isRenaming ? (
                    <div className="mt-0.5">
                      <div className="text-xs text-[#e8e2d4]/70">
                        {info.stageName}
                      </div>
                      {info.layerName && (
                        <div className="text-[0.6rem] text-[#e8e2d4]/40">
                          {info.layerName}
                        </div>
                      )}
                      {/* S3 — Mini stage-progress bar (7 segments: Cell→Galactic) */}
                      <div className="flex gap-0.5 mt-1">
                        {["Cell", "Creature", "Tribal", "Civ", "Empire", "Solar", "Galactic"].map((s, si) => {
                          const stages = ["Cell", "Creature", "Tribal", "Civilization", "Empire", "Solar", "Galactic"];
                          const saveStageIdx = stages.indexOf(info.stageName);
                          const filled = si <= saveStageIdx;
                          const isCurrent = si === saveStageIdx;
                          return (
                            <div
                              key={s}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                filled ? "bg-[#7dd3fc]/60" : "bg-[#e8e2d4]/10"
                              } ${isCurrent ? "ring-1 ring-[#7dd3fc]/40" : ""}`}
                              title={s}
                            />
                          );
                        })}
                      </div>
                      {info.totalRuns > 0 && (
                        <div className="text-[0.55rem] text-[#e8e2d4]/30 mt-0.5">
                          {info.totalRuns} run{info.totalRuns === 1 ? "" : "s"}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* ROUND E — Hardmode toggle. Only shows when the selected slot is
            empty (fresh game). Existing saves keep their difficulty mode. */}
        {!selectedHasSave && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-1">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#e8e2d4]/35">
                Difficulty
              </span>
              <button
                onClick={() => setDifficultyMode("normal")}
                className={`font-mono text-xs uppercase tracking-[0.2em] border-b pb-1 transition-all ${
                  difficultyMode === "normal"
                    ? "text-[#7dd3fc] border-[#7dd3fc]/60"
                    : "text-[#e8e2d4]/30 border-transparent hover:text-[#e8e2d4]/50"
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setDifficultyMode("hard")}
                className={`font-mono text-xs uppercase tracking-[0.2em] border-b pb-1 transition-all ${
                  difficultyMode === "hard"
                    ? "text-[#fbbf24] border-[#fbbf24]/60"
                    : "text-[#e8e2d4]/30 border-transparent hover:text-[#e8e2d4]/50"
                }`}
              >
                Hard
              </button>
            </div>
            {difficultyMode === "hard" && (
              <p className="text-[0.7rem] text-[#fbbf24]/50 italic max-w-md leading-relaxed">
                Techs take time to research (tier × 15s). System costs × 1.5.
                Rival threat growth × 1.5. Only one tech researches at a time.
              </p>
            )}
          </div>
        )}

        {/* Descend — quiet text link with underline, not a glowing CTA.
            Shows the selected slot's save info inline. */}
        <button
          onClick={handleDescend}
          className="group inline-flex items-baseline gap-3 text-left w-fit cursor-pointer"
        >
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#7dd3fc] border-b border-[#7dd3fc]/40 pb-1 group-hover:border-[#7dd3fc] group-hover:pb-1.5 transition-all">
            {buttonVerb}
          </span>
          {selectedHasSave ? (
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[#e8e2d4]/45">
              {slotNames[selectedSlot] || selectedInfo?.layerName || selectedInfo?.stageName || "· continue"}
            </span>
          ) : (
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[#e8e2d4]/30">
              · slot {selectedSlot} · begin anew
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
      </div>{/* /lp-content */}
    </main>
  );
}
