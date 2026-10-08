# Task ID: 16 — Variant System Choice UI

## Agent: general-purpose (sub-agent)

## Task Summary
Implement mutually-exclusive system variant groups (mirroring the existing `exclusiveWith` mechanism on TechDef) for systems like cell wall variants, creature movement, and galactic ascension spires. Present them as an explicit "Choose Your Path" picker UI rather than 3 separate cards.

## Files Modified
1. `src/game/state/types.ts` — Added `exclusiveWith?: string[]` to SystemDef, `lockedSystems: Record<string, boolean>` to GameState.
2. `src/game/state/store.ts` — Initialized `lockedSystems: {}` in `initialRunState()`; added locked-check + sibling-locking logic to `buySystem()`; added migration entry `if (!persisted.lockedSystems) persisted.lockedSystems = {};`.
3. `src/game/data/systems.ts` — Added `exclusiveWith` arrays to 9 variant systems across 3 groups:
   - Cell wall (cell stage): `cell_wall_rigid`, `cell_wall_flexible`, `cell_wall_photosynthetic`
   - Creature movement (creature stage): `flagellum`, `pseudopod`, `cilia`
   - Galactic ascension spires (galactic stage): `ascension_spire_biological`, `ascension_spire_synthetic`, `ascension_spire_psionic`

## Files Created
1. `src/components/game/tabs/VariantPicker.tsx` — New component presenting an exclusive group as a card with a "Choose Your Path" header. Renders each variant in a responsive grid with state-aware buttons (Choose This / Build More / Locked).
2. (Updated) `src/components/game/tabs/SystemsTab.tsx` — Now partitions stage systems into exclusive groups vs. regular systems, renders groups via `<VariantPicker>`, and renders remaining systems in the normal grid. Locked (non-group) systems render disabled with "Locked" text.

## Implementation Notes
- `triggerPrestige()` automatically resets `lockedSystems` because `initialRunState()` includes `lockedSystems: {}` and `metaState` doesn't override it.
- The first purchase of a variant locks all its siblings. Subsequent purchases of the chosen variant still scale up to `maxOwned`.
- The chosen variant's card allows buying more (qty 1/10/100 buttons like SystemCard) — only the *first* purchase is the "decision point".
- `partitionVariantGroups()` is order-preserving: groups appear in the order their first member appears in the `SYSTEMS` array.
- `deriveGroupName()` extracts the common prefix from variant names (e.g. "Cell Wall (Rigid)" → "Cell Wall Variants"), falling back to category name.
- VariantPicker visually distinct: amber accent strip, ring border, "Choose Your Path" header with GitMerge icon, status badges (Decision pending / Path chosen / Requires tech).
- Defensive `isLocked()` falls back to checking `ownedSystems` for resilience against partially-migrated saves.

## Verification
- `bun run lint`: **0 errors, 0 warnings** in project code (6 pre-existing warnings in `upload/logic.js` only).
- `npx tsc --noEmit`: All TypeScript errors in `store.ts` are pre-existing (lines 93, 557-562, 888) and unrelated to this task — they were already documented in Task 15's worklog entry. No new type errors introduced.
- No new files outside the specified scope.

## What I Deliberately Did NOT Change
- The `lockedSystems` reset in `triggerPrestige()` works through the `fresh = initialRunState()` spread — no explicit reset was needed because `metaState` doesn't touch `lockedSystems`. This mirrors the existing pattern for `lockedTechs`.
- Did NOT add locked-systems to the tick function. Locked systems can't be bought (early return in `buySystem`), so they're never in `ownedSystems`, so the tick function naturally skips them.
- Did NOT change how variant systems produce resources. Once chosen, the variant produces normally. The lock only prevents new purchases of siblings.
- Did NOT remove the existing "OR" pattern from TechTab — that's a separate, already-working system for techs.
