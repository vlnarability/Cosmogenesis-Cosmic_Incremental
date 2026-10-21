# Task: FIX-UI-TABS

**Agent**: UI/UX fixes agent
**Scope**: Five UI bug fixes in the Evolution Idle Next.js game
  1. ShopModal — make `debugFreeBuy` skip affordability checks (enable buttons, show "FREE")
  2. TabNav — add `shrink-0` to Shop button so it isn't clipped when tabs overflow
  3. EventModal — add a 60s countdown progress bar + "Auto-resolves in Xs with: {default choice}"
  4. Tab restructure — layer-aware main bar + move Log/Archive/Codex/Awards into the gear dropdown as modals
  5. Themes — make `.bg-layer-2` dots + `.bg-vignette` use `color-mix` with `var(--background)` / `var(--foreground)` so they shift with the active theme

## Mandatory reads completed
1. `src/components/game/modals/ShopModal.tsx` — full file (flat list + tabbed layout)
2. `src/components/game/layout/TabNav.tsx` — old 10-tab flat bar with Shop button (EP-gated)
3. `src/components/game/modals/EventModal.tsx` — no timer UI
4. `src/components/game/layout/Header.tsx` — gear dropdown already had Prestige/Shop/Save/Settings
5. `src/components/game/layout/GameShell.tsx` — three bg-layer divs + tab rendering switch + modals in Suspense
6. `src/app/globals.css` — `.bg-layer-1` already used `var(--background)`; `.bg-layer-2` dots and `.bg-vignette` were hardcoded oklch ink-blue
7. `src/game/state/store.ts` — `eventTimer`, `debugFreeBuy`, `activeLayerModal`, `openLayerModal` confirmed
8. `src/game/state/types.ts` — `TabId`, `showShop`, `setShowShop`, etc.
9. `src/game/state/layerHelpers.ts` — `useActiveLayer().isAtLeast(targetLayerId)`
10. `src/components/game/modals/SettingsModal.tsx` — confirmed `debugFreeBuy` toggle exists in the Settings UI
11. `src/components/game/tabs/{Log,Archive,Codex,Achievements}Tab.tsx` — confirmed all are self-contained client components that can be re-used inside a Dialog
12. `src/components/game/modals/LayerModal.tsx` — confirmed `openLayerModal(layerId)` pattern + 10 layer modal ids ("challenges" = L1 Trials, "enlightenment" = L2 Constellations, etc.)

## Summary of changes

### Fix 1 — `src/components/game/modals/ShopModal.tsx`
- Subscribed to `debugFreeBuy = useGameStore((s) => s.debugFreeBuy)`.
- Both layouts (tabbed + flat pre-PP-unlock) now:
  - Compute `canAfford = debugFreeBuy || currency >= cost`.
  - Render cost as `"FREE"` (emerald) when `debugFreeBuy` is true; otherwise the original `"✦ N PP"` / `"🌱 N EP"`.
  - `disabled` becomes `maxed || requiresWins || !(debugFreeBuy || canAfford)`.
  - Button label becomes `"Free Upgrade"` when `debugFreeBuy` is on.
- `FlatUpgradeList` now takes `debugFreeBuy: boolean` prop.

### Fix 2 — `src/components/game/layout/TabNav.tsx` (rewritten)
- All tab buttons (main + layer + Shop) now have `shrink-0` so the row scrolls horizontally without clipping the Shop button.
- Shop button is ALWAYS rendered (was `evolutionPoints > 0`-gated before).

### Fix 3 — `src/components/game/modals/EventModal.tsx`
- Subscribed to `eventTimer` from the store.
- Added an `EVENT_TIMEOUT_SECONDS = 60` constant matching the store's timer initial value.
- Renders a 1.5px progress bar that shrinks 100% → 0% as the timer counts down. Above it:
  `"Auto-resolves in {ceil(eventTimer)}s with: {ev.choices[0].label}"`.
- Bar has `role="progressbar"` + ARIA `aria-valuenow/min/max` for accessibility.
- Removed unused `Button` import (the choices are native `<button>`s).

### Fix 4 — Tab restructure (3 files)
- **`src/game/state/types.ts`**: added `activeInfoModal: "log" | "archive" | "codex" | "achievements" | null` field + `openInfoModal(target)` / `closeInfoModal()` actions.
- **`src/game/state/store.ts`**: implemented the two actions, seeded `activeInfoModal: null` in the initial state, and added a migration entry `if (persisted.activeInfoModal === undefined) persisted.activeInfoModal = null;` for old saves.
- **`src/components/game/layout/TabNav.tsx`**: full rewrite —
  - `MAIN_TABS` array: Actions, Systems, Tech, Story, Prestige (Production intentionally omitted per spec).
  - `LAYER_TABS` array: Trials / Constellations / Market / Galaxy / Conquest / Universe / Lab / Diplomacy / War / Genesis Engine — each maps a layer modal id (`challenges`, `enlightenment`, `transcendence`, `genesis`, `apotheosis`, `singularity`, `omnipotence`, `divinity`, `infinity`, `eternity`).
  - `visibleMainTabs` filter: at L2+ (`isAtLeast("enlightenment")`), hide Actions/Systems/Tech.
  - `visibleLayerTabs` filter: each shown when its layer is unlocked (`unlockedChallenges` for Trials, `unlockedLayers.<layerId>` for L2-L10).
  - Layer tabs call `openLayerModal(tab.layerId)` and highlight when `activeLayerModal === tab.layerId`.
  - Shop button is always on the desktop main bar (per spec), colored amber.
  - Mobile bottom nav: horizontal-scrollable row of all visible main tabs + latest unlocked layer tab + Shop. Replaces the old "top 4 + More → Prestige" pattern.
  - Fallback "Back to Prestige" button shown when the current tab was hidden at a higher layer.
- **`src/components/game/layout/Header.tsx`**: imported `ListTree`, `Archive`, `ScrollText`, `Trophy` icons; subscribed to `openInfoModal`; added a "Reference" group in the gear dropdown containing Log / Archive / Codex / Awards (calling `openInfoModal("…")`) with a separator before Settings.
- **`src/components/game/layout/GameShell.tsx`**: imported `Dialog*` + the four info icons; added a new `InfoModal` component that wraps `LogTab` / `ArchiveTab` / `CodexTab` / `AchievementsTab` in a shared Dialog driven by `activeInfoModal`. The component is added to the existing `<Suspense>` block alongside `LayerModal`.

### Fix 5 — `src/app/globals.css`
- `.bg-layer-1`: unchanged (already uses `var(--background)`).
- `.bg-layer-2`: dot color changed from hardcoded `oklch(0.35 0.015 260 / 0.4)` to `color-mix(in oklab, var(--foreground) 35%, transparent)` so the dots adapt to every theme.
- `.bg-vignette`: edge color changed from hardcoded `oklch(0.08 0.02 260 / 0.5)` to `color-mix(in oklab, var(--background) 50%, black)` so the vignette darkens the edges with a theme-aware color instead of always looking ink-blue.

### Bonus fix — `src/components/game/modals/EnlightenmentModal.tsx`
- `react-hooks/set-state-in-effect` was firing on the existing `useEffect(() => { if (scrollX < -SKY_W) setScrollX(…) }, [scrollX])` block (the only lint error blocking the 0-error gate).
- Extracted `wrapScrollX(x)` to module level and applied it inside the two `setScrollX()` call sites (`onPointerMove` + `handleScrollButton`). Removed the `useEffect` and the now-unused `useEffect` import.
- Behaviour is identical — the wrap still fires on every scrollX change — but it's now applied at the update site, not as a cascading-render trigger.

## Files modified (8)
- `src/components/game/modals/ShopModal.tsx`
- `src/components/game/modals/EventModal.tsx`
- `src/components/game/modals/EnlightenmentModal.tsx`
- `src/components/game/layout/TabNav.tsx`
- `src/components/game/layout/Header.tsx`
- `src/components/game/layout/GameShell.tsx`
- `src/app/globals.css`
- `src/game/state/types.ts`
- `src/game/state/store.ts`

## Verification
- **Lint**: `bun run lint` → **0 errors**, 7 warnings (all pre-existing in `src/game/data/galaxies.ts` and `upload/logic.js`, neither touched here).
- **Dev server**: Next.js 16.1.3 (Turbopack) compiles cleanly; `GET / 200 in 64ms` after the edits.
- **No tests written** (per instructions).
- **No functionality removed** — every existing tab is still reachable (Log/Archive/Codex/Awards via gear dropdown, Production via `setTab("production")` programmatic path or saved state).
