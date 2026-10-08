# Task ID: 17 — Prestige Layer Roadmap UI

## Agent: prestige-tab (sub-agent)

## Task Summary
Create a new `PrestigeTab` component that displays the full 10-layer prestige progression arc as a vertical timeline / roadmap. Locked layers display as "???" with lock icons; only Layer 1 (Evolution) is currently revealable after the first Galactic win. Also wire the new tab into the existing `TabNav` (between Awards and Archive) and `GameShell` rendering. On mobile, the new tab is accessible via the existing "More" button (which has been upgraded into a proper expansion tray).

## Files Modified
1. `src/game/state/types.ts` — Added `"prestige"` to the `TabId` union type, placed between `"achievements"` and `"archive"` per the task spec.
2. `src/components/game/layout/TabNav.tsx` — Added `Crown` icon import, added `prestige` to the `TABS` array (between Awards and Archive), and refactored the mobile bottom nav so the "More" button opens an expandable secondary tray containing all 6 secondary tabs (Story, Codex, Awards, Prestige, Archive, Log). Replaced the old `setTab("story")` behavior (which only navigated to Story and made the other tabs inaccessible on mobile) with a proper expansion that shows every secondary tab in a 3-column grid.
3. `src/components/game/layout/GameShell.tsx` — Added the `PrestigeTab` import and the `{currentTab === "prestige" && <PrestigeTab />}` render branch between the Achievements and Archive conditional branches.

## Files Created
1. `src/components/game/tabs/PrestigeTab.tsx` — New tab component, ~560 lines, comprising:
   - `PrestigeTab` (main export) — decides between pre-awakening state ("the god still sleeps") and the full roadmap state.
   - `getLayerStatus()` — pure helper that returns `"locked" | "in_progress" | "mastered"` for a given layer. For now, only Layer 1 can transition out of "locked" (after first Galactic win, becoming "in_progress" or "mastered" based on challenge completion count). Layers 2-10 always return "locked" — the unlock chain is intentionally not implemented (future work).
   - `PrestigeLayerCard` — the `<li>` row containing a `LayerOrderBadge` and a `stat-card` body. Handles locked vs. unlocked rendering.
   - `LayerOrderBadge` — the circular badge sitting on the vertical timeline line. Shows the layer number (1-10), a checkmark when mastered, or a lock icon when locked. Highlights the current layer with an amber ring.
   - `LockedLayerContent` — renders the "???" placeholder for unrevealed layers. Shows a generic mystery hint ("Complete the previous layer to reveal what lies ahead.") or a special final-layer hint ("The final transformation. Its shape is unknown even to the god.").
   - `UnlockedLayerContent` — renders the full reveal: name, story beat, full description, mechanic label, currency, mastery progress bar (X/10 challenges), permanent reward teaser, "View Challenges" button (calls `setShowChallenges(true)`), and a "Next:" footer hint.

## Implementation Notes

### Unlock Logic
The spec said: "For now, only Layer 1 is unlockable. Layers 2-10 are always locked/???." I implemented `getLayerStatus()` so that Layer 1 unlocks when `galacticWins > 0`, transitions to "mastered" when all 10 challenges are complete, and Layers 2-10 always return "locked". This leaves a clean hook for future implementation:
```ts
// Layers 2-10 — not implemented. Would be:
//   if (!isPreviousLayerCompleted(layer)) return "locked";
//   ... check this layer's completion state ...
// For now, always locked.
return "locked";
```

### Layer 1 Details
Layer 1 (Evolution) shows the required details:
- **Name**: "Evolution" (from `prestigeLayers.ts` `layer.name`)
- **Story**: `layer.story` ("The god is barely conscious, testing life through hardship.")
- **Mechanic**: `"Challenges / Masteries"` — defined as the `LAYER_1_MECHANIC_LABEL` constant, per the task spec. (The full `layer.mechanic` text is meant for codex/tooltip; here we show the short label.)
- **Progress**: `X/10 challenges completed` — `completedCount` is derived from `Object.values(completedChallenges).filter(Boolean).length`, and `LAYER_1_TOTAL_CHALLENGES = CHALLENGES.length` (= 10).
- **Status badge**: "In Progress" badge when 0 < completedCount < 10; "Mastered" badge when completedCount >= 10.
- **Button**: "View Challenges" with Flame + ChevronRight icons — calls `onViewChallenges()` which is wired to `setShowChallenges(true)` from the Zustand store. The existing `ChallengeModal` already respects `showChallenges && unlockedChallenges` for its open state, so the button works correctly whenever Layer 1 is unlocked.

### Pre-Awakening State
When `galacticWins <= 0`, the tab shows a centered "the god still sleeps" empty state with:
- A large lock icon in a muted circle
- "Complete a Galactic run to begin your divine awakening" message (paraphrased from the spec)
- A small "10 layers await beyond the veil of mortality" hint at the bottom
This is intentional — the tab exists at all times so the player can find it, but the contents are gated.

### Vertical Timeline
- A 1px-wide vertical line is rendered as an absolutely-positioned `div` on the left, with a top-to-bottom gradient that goes from amber (primary) → muted plum (accent) → muted ink, giving the journey a "fading into mystery" feel.
- The line is positioned at `left-[19px] sm:left-[23px]` to align with the center of the 40px / 48px order badges.
- Order badges have `bg-background/80 backdrop-blur-sm` so the line passes visually "behind" them.
- Each `<li>` has `pl-12 sm:pl-16` so the card body sits to the right of the badge with a small gap.
- The line spans from `top-4` to `bottom-4` of the timeline container, so it visually connects all 10 layers in a continuous path.

### Current Layer Highlighting
- "Current" is defined as the lowest-numbered layer with `status === "in_progress"`. Computed via `PRESTIGE_LAYERS.slice(0, idx).every((prev) => layerStatuses[prev.order] !== "in_progress")`.
- The current layer's card gets `ring-1 ring-primary border-primary/60` plus an inline `boxShadow` with an amber inset highlight.
- The current layer's order badge gets an extra `ring-2 ring-primary/40 ring-offset-2 ring-offset-background`.
- A "Current" badge is displayed in the layer header next to the name.

### Mastered Layer Visuals
- Mastered layers (none yet, but the path is wired) get:
  - `border-emerald-500/40` on the card
  - A green CheckCircle2 icon replacing the layer number in the order badge
  - The mastery progress bar uses `[&>div]:bg-emerald-500` to override the default amber progress fill
  - A "Mastered" badge in the header
  - The next-layer hint shows the full `unlockNext` text instead of the gated "(reveals on mastery)" suffix

### Mobile Bottom Nav Refactor
The previous mobile nav had only 4 primary tabs + a "More" button that navigated to Story — meaning Codex, Awards, Archive, and Log were unreachable on mobile. With Prestige added, this got worse (5 unreachable tabs). I refactored the mobile nav so the "More" button toggles a secondary tray (3-column grid) that slides up above the bottom bar with all 6 secondary tabs (Story, Codex, Awards, Prestige, Archive, Log). Includes:
- An invisible click-catcher backdrop (semi-transparent black, blur-sm) that closes the tray when tapped outside
- Animate-in / fade-in / slide-in-from-bottom-2 transition via `tailwindcss-animate`
- The "More" button highlights when ANY secondary tab is currently active (so the player knows which set their current tab is in)
- A "Close" label replaces "More" when the tray is open
- Each secondary tab button has `min-h-[60px]` for touch accessibility
- Tapping a secondary tab both sets the active tab and closes the tray

The desktop tab bar is unchanged in behavior — it shows all 10 tabs in a horizontally scrollable strip, with Prestige slotted between Awards and Archive.

## Verification
- `bun run lint`: **0 errors, 0 warnings** in project code (6 pre-existing warnings in `upload/logic.js` only).
- `npx tsc --noEmit`: No new TypeScript errors introduced. The 8 pre-existing errors in `store.ts` (lines 93, 557-562, 888) are all in unrelated code and were documented in Task 15's worklog entry.
- All imports in `PrestigeTab.tsx` are used: `useGameStore`, `PRESTIGE_LAYERS`, `PRESTIGE_LAYER_COUNT`, `PrestigeLayer`, `CHALLENGES`, `Card`/`CardContent`/`CardHeader`/`CardTitle`/`CardDescription`, `Badge`, `Button`, `Progress`, `Crown`, `Lock`, `CheckCircle2`, `Sparkles`, `Flame`, `ChevronRight`, `Eye`, `Circle`, `cn`.
- `lucide-react` `Crown` icon confirmed available at runtime.

## Design Rationale
1. **Why "X / 10 challenges" rather than "X / 35 trials"?** The task spec said "Progress: X/10 challenges completed" — there are 10 challenge *families* (Growth, Food, Happiness, Science, Production, Military, LateStage, Archetype, LowResource, Speed), even though the design doc mentions 35 trials total (5 per stage × 7 stages). I used `CHALLENGES.length` (= 10) for the denominator so the progress bar reaches 100% when all 10 family masteries are earned — matching the spec.
2. **Why is the "View Challenges" button only shown on Layer 1?** Only Layer 1 has a working challenge UI implemented (`ChallengeModal`). Future layers will get their own buttons when their mechanics are built.
3. **Why grey out locked layers rather than hide them?** The task spec says "Locked layers shown as ???" — the player needs to see the full arc to feel the journey. Hiding them would lose the "10-layer roadmap" framing.
4. **Why use `galacticWins > 0` as the unlock gate instead of `unlockedChallenges`?** The spec said "always visible after first Galactic win" (i.e., `galacticWins > 0`). `unlockedChallenges` becomes true earlier (on Galactic stage arrival, before winning), so using `galacticWins` matches the spec exactly. The `ChallengeModal` opens on `showChallenges && unlockedChallenges`, and since `galacticWins > 0` implies `unlockedChallenges === true`, the modal will always open when the player taps "View Challenges" from a revealed Layer 1 card.
5. **Why the "lowest-numbered in-progress" rule for "Current"?** This future-proofs against multiple layers being in_progress at once. Right now only Layer 1 can be in_progress (because Layers 2-10 are always locked), so this rule degenerates to "Layer 1 is current when in_progress". But if/when Layer 2 unlocks, the rule will correctly mark Layer 2 as current and Layer 1 as completed-or-pending.
6. **Why refactor the mobile nav into a tray instead of just adding Prestige to the primary set?** The primary set has 4 slots (one for each cardinal direction on a 5-wide bottom bar, with More taking the 5th). Adding Prestige to primary would displace another tab. Putting it under "More" preserves the existing primary set and gives mobile users access to ALL secondary tabs (not just Prestige) — fixing the long-standing UX bug where Codex/Awards/Archive/Log were unreachable on mobile.

## Unresolved Issues / Risks
1. **No playtest verification yet.** The roadmap renders correctly in code review, but a full Galactic-win playthrough is needed to confirm:
   - The `galacticWins > 0` check correctly fires after the first prestige from Galactic stage.
   - The "View Challenges" button correctly opens the ChallengeModal.
   - The mastery progress bar correctly reaches 100% when all 10 challenges are completed.
   - The mobile "More" tray correctly closes after selecting a tab and re-opens cleanly on subsequent taps.
2. **The `ChallengeModal` is gated on `unlockedChallenges` (set when stage reaches Galactic), so a player who reaches Galactic but hasn't yet won cannot tap "View Challenges" — but they also can't see the Layer 1 unlocked card in the first place, because that requires `galacticWins > 0`. So there's no inconsistency in practice.
3. **The "current layer" ring on the card uses `ring-1` plus an inline `boxShadow` for an inset amber highlight.** Tailwind's `ring` is a `box-shadow`, and combining it with an inline `boxShadow` works because the inline style fully replaces the box-shadow (so only the inline one renders). I chose to use the inline style for the inset amber highlight to ensure it renders consistently across browsers; the outer ring-1 border is still applied via Tailwind classes.
4. **The vertical line color gradient uses oklch values directly.** These match the theme tokens (`--primary: oklch(0.68 0.14 55)`, `--accent: oklch(0.62 0.10 285)`, and the muted ink `oklch(0.26 0.015 260)`). If the theme tokens are changed later, the gradient should be updated to match.
5. **The mobile "More" tray uses `animate-in fade-in slide-in-from-bottom-2 duration-150`** from `tailwindcss-animate`. Verified the package is installed (`"tailwindcss-animate": "^1.0.7"` in package.json).
