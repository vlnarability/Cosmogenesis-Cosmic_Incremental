# Task: LAYER-AS-TAB

**Agent**: layer-as-tab subagent
**Scope**: Convert the 10 prestige-layer modals (L1–L10) from `<LayerModal>` (shared Dialog wrapper) into inline tab pages that render in the main `<main>` panel alongside Actions/Systems/Tech/Story.

## Mandatory reads completed
1. `/home/z/my-project/worklog.md` — project context (Next.js 16 + Zustand + shadcn/ui port of an incremental game with 7 stages + 10 prestige layers).
2. `src/game/state/types.ts` — `TabId` union (`actions | systems | production | tech | story | codex | achievements | archive | log | shop | prestige`).
3. `src/game/state/store.ts` — `openLayerModal(layerId)` set `activeLayerModal` + the per-layer `show*` flag; `setTab(tab)` sets `currentTab`; the legacy `show*` flag map lived inside `openLayerModal`.
4. `src/components/game/layout/GameShell.tsx` — `<LayerModal />` was lazy-loaded inside the Suspense block; the main panel switch was based on `currentTab`.
5. `src/components/game/layout/TabNav.tsx` — layer-tab buttons call `openLayerModal(tab.layerId)` and highlight via `activeLayerModal === tab.layerId`.
6. `src/components/game/modals/LayerModal.tsx` — the shared Dialog wrapper that lazy-loaded each layer content component (kept for back-compat; no longer rendered).
7. All 10 layer modal content files — each used `<DialogHeader>/<DialogTitle>/<DialogDescription>` (Radix primitives requiring a `<Dialog>` parent) + subscribed to `closeLayerModal` + rendered a bottom "Close" button.

## Summary of changes

### 1. `src/game/state/types.ts`
- Extended `TabId` with 10 layer-tab ids: `"trials" | "constellations" | "market" | "galaxy" | "conquest" | "universe" | "lab" | "diplomacy" | "war" | "genesis_engine"`.

### 2. `src/game/state/store.ts`
- Added module-scope `LAYER_TO_TAB: Record<string, TabId>` map: `{ challenges: "trials", enlightenment: "constellations", transcendence: "market", genesis: "galaxy", apotheosis: "conquest", singularity: "universe", omnipotence: "lab", divinity: "diplomacy", infinity: "war", eternity: "genesis_engine" }`.
- `openLayerModal(layerId)` — in addition to the legacy patch (closing all `show*` flags, opening the requested one, setting `activeLayerModal: layerId`), now also sets `currentTab = LAYER_TO_TAB[layerId]`. The legacy fields stay for back-compat (Header chip highlight, PrestigeTab.onView, useKeyboardShortcuts all still read them).
- `closeLayerModal()` unchanged — still clears the legacy flags. The tab switching is how the player exits now.

### 3. `src/components/game/layout/GameShell.tsx`
- Lazy-loaded all 10 layer content components at module scope (preserving the memory optimization that motivated the original `<LayerModal/>` wrapper).
- Added an `InlineLayerLoading` Suspense fallback (centered ⏳ spinner + "Loading layer…" text).
- Rendered the 10 layer components INLINE in the main tab panel via a guarded Suspense block: `currentTab === "trials" && <ChallengeContent />`, etc. The guard ensures the Suspense boundary is only entered when a layer tab is active.
- Removed `<LayerModal />` from the main Suspense block. The LayerModal.tsx file is kept in `modals/` for back-compat (no longer rendered).
- ShopModal stays in the Suspense block (still a modal — separate task).

### 4. `src/components/game/layout/TabNav.tsx`
- Desktop layer-tab buttons now use `cn("tab-btn shrink-0", (currentTab === tab.id || activeLayerModal === tab.layerId) && "active")` so the highlight fires under either the new inline-tab model OR the legacy flag.
- Mobile "latest layer tab" button got the same OR-condition (refactored to an IIFE so the `latest` const can be reused for both the click handler and the highlight check).

### 5. 10 layer modal content files
For each of: ChallengeModal, EnlightenmentModal, TranscendenceModal, GenesisModal, ApotheosisModal, SingularityModal, OmnipotenceModal, DivinityLayerModal, InfinityModal, EternityModal:
- Removed `import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"`.
- Removed `const closeLayerModal = useGameStore((s) => s.closeLayerModal)`.
- Replaced:
  - `<DialogHeader>` → `<div className="flex flex-col gap-2 text-center sm:text-left mb-3">`
  - `<DialogTitle className="X">...</DialogTitle>` → `<h2 className="text-lg leading-none font-semibold X">...</h2>`
  - `<DialogDescription asChild>` → `<div className="text-sm text-muted-foreground">` (with the original child unchanged inside)
  - `<DialogDescription className="X">` → `<p className="text-sm text-muted-foreground X">`
- Removed the bottom Close button (`<Button variant="outline" onClick={() => closeLayerModal()}>Close</Button>`).
- EternityModal.tsx: also removed the secondary post-ending Close button (line 220). Preserved the `AlertDialog` import (still used for the ending-confirmation dialog) — only the Dialog-related import was removed.
- Left the `Separator` and `Button` imports alone (Button still used inside layer bodies, e.g. for "Begin Trial", "Illuminate", "Attack", etc.).

## Files edited
- `src/game/state/types.ts`
- `src/game/state/store.ts`
- `src/components/game/layout/GameShell.tsx`
- `src/components/game/layout/TabNav.tsx`
- `src/components/game/modals/ChallengeModal.tsx`
- `src/components/game/modals/EnlightenmentModal.tsx`
- `src/components/game/modals/TranscendenceModal.tsx`
- `src/components/game/modals/GenesisModal.tsx`
- `src/components/game/modals/ApotheosisModal.tsx`
- `src/components/game/modals/SingularityModal.tsx`
- `src/components/game/modals/OmnipotenceModal.tsx`
- `src/components/game/modals/DivinityLayerModal.tsx`
- `src/components/game/modals/InfinityModal.tsx`
- `src/components/game/modals/EternityModal.tsx`

## Lint
- `bun run lint` → **0 errors**, 9 pre-existing warnings (all in `scripts/playtest-*.js`, `src/game/data/galaxies.ts`, `upload/logic.js` — unchanged by this task).

## Verification (agent-browser)
1. Opened `http://localhost:3000`, paused the game loop via `window.__gameStore.getState().togglePause()` (events kept spawning otherwise).
2. Dismissed the active story popup + active event via `window.__gameStore.getState().dismissStory()` + `resolveEvent(...)`.
3. Opened the gear dropdown → Settings menu item.
4. Clicked "Evolution Idle · v1.0" 5× to enable debug mode → "Debug Tools" section appeared.
5. Clicked "Unlock All Layers" → all 10 layer tabs appeared (Trials, Constellations, Market, Galaxy, Conquest, Universe, Lab, Diplomacy, War, Genesis Engine).
6. Closed the Settings modal.
7. Clicked the "Constellations" tab.
8. Verified `document.querySelector('[role=dialog]')` returns `null` and `document.querySelectorAll('[role=dialog]').length === 0`. (Also zero `[role=alertdialog]`.)
9. Snapshot confirmed the constellation sky renders inline: `<h2>Layer 2 — Enlightenment (Constellation Sky)</h2>` + "Drag the wide sky or use ◀ ▶ to pan. Click a star to inspect it and illuminate." + all 88 constellation stars visible as buttons (`α Aries in Aries constellation (unlit)`, `β Aries …`, etc.).
10. Switched to the Trials tab — same inline behavior: `<h2>Layer 1 — Trials</h2>` + description + the 4 trial cards with "Begin Trial (repeat 1)" buttons. `dialogCount: 0` confirmed.
11. Store state during the Constellations check: `{ tab: "constellations", activeLayerModal: "enlightenment", dialogCount: 0 }` — confirming `openLayerModal` correctly flipped BOTH the new `currentTab` and the legacy `activeLayerModal` flag (for back-compat), while NO `<Dialog>` was opened.

## Git
- Commit: `12d4a75` — "LAYER-AS-TAB: convert 10 layer modals into inline tab pages. openLayerModal now calls setTab. Layer content renders inline in GameShell based on currentTab. DialogHeader/DialogTitle/DialogDescription replaced with plain HTML (Radix requires Dialog parent)."
- Pushed to `origin/main` (remote `https://github.com/vlnarability/GLM_Playground.git`).

## Stage Summary
- The 10 prestige-layer modals (L1–L10) are now inline tab pages rendered in the same `<main>` panel as Actions/Systems/Tech/Story. The shared `<LayerModal />` wrapper is no longer rendered (file kept for back-compat).
- The legacy `activeLayerModal` + `show*` flags stay in `openLayerModal()` so existing code paths (Header chip highlighting, PrestigeTab.onView buttons, useKeyboardShortcuts) continue to work — they now also flip `currentTab` to the layer's tab id via `LAYER_TO_TAB`.
- Each layer content file is now plain HTML (no Radix Dialog primitives) so it can render standalone outside a `<Dialog>`.
- Verified zero `[role=dialog]` elements on the Constellations tab — the constellation sky renders inline with all 88 stars visible + clickable.
- ShopModal stays a modal (shop conversion is a separate task per the spec — ShopModal.tsx untouched).
