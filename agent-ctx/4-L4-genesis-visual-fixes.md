# Task 4 — L4 Genesis visual fixes

**Agent**: Z.ai Code
**Date**: 2025
**Files touched** (only these two):
- `src/components/game/modals/GenesisModal.tsx`
- `src/components/game/shared/HexMap.tsx`

## Blockers addressed

### Blocker 1 — No explicit Scan/Claim action buttons
Added an explicit action button row below `<HexMap />` showing the
selected system's name + status (Unexplored / Scanned / Claimed) and a
primary action button:
- Unexplored → violet "🔍 Scan — {GALAXY_SCAN_COST} Divinity" button,
  disabled when `!canScan`.
- Scanned (explored, not claimed) → emerald "✓ Claim — {formatNumber(nextClaimCost, 0)} Divinity"
  button, disabled when `!canClaim`.
- Claimed → disabled secondary "✓ Claimed" badge-button.
- No selection → muted "Select a star system on the map above" hint.

### Blocker 2 — No visual feedback on scan/claim success
- Added `flashHexId` local state in `GenesisContent`.
- Added `handleScan` / `handleClaim` wrappers that call the store action
  and then set `flashHexId` for 600ms (with a conditional setter so a
  second flash on a different hex doesn't get prematurely cleared).
- `onHexClick` now calls `handleScan` / `handleClaim` instead of the raw
  store actions.
- New explicit buttons also route through `handleScan` / `handleClaim`.
- Passed `flashId={flashHexId}` to `<HexMap>`.
- In `HexMap.tsx`, added optional `flashId?: string | null` prop. When
  `cell.id === flashId`, renders (on top of the selected ring) a
  `<polygon className="fill-cyan-400/30 pointer-events-none" />` tint
  plus an expanding `<circle r={hexRadius * 1.5}
  className="animate-ping fill-cyan-400 pointer-events-none" />`.
  Both are `pointer-events-none` so subsequent clicks pass through.

## Exact edit locations

### `src/components/game/modals/GenesisModal.tsx`
- **Line 68-71**: added `flashHexId` state after `selectedId` state.
- **Line 119-136**: added `handleScan` / `handleClaim` after
  `selectedState` declaration (before `cosmosBreadcrumbItems` useMemo).
- **Line 234-235**: `onHexClick` now calls `handleScan(id)` /
  `handleClaim(id)` instead of the raw store actions.
- **Line 248**: added `flashId={flashHexId}` prop on `<HexMap>`.
- **Line 250-288**: inserted the explicit action button row between the
  `<HexMap />` closing tag and the existing hint `<div>` (comment for
  the hint is now at line 289, hint div at line 290).

### `src/components/game/shared/HexMap.tsx`
- **Line 145-148**: added `flashId?: string | null` to `HexMapProps`.
- **Line 160**: added `flashId` to the destructured props of `HexMap`.
- **Line 250-270**: added the transient flash overlay (cyan polygon tint
  + animate-ping circle) inside the per-cell `<g>`, after the
  selected-ring block and before `</g>`.

## Preserved behavior
- `hexTooltip` prop and `<title>`-based hover tooltips: untouched.
- Selected-hex yellow ring overlay (lines 240-249 in edited HexMap.tsx):
  untouched; flash renders on top of it but does not remove it.
- Existing click-to-scan/claim implicit behavior in `onHexClick`:
  preserved (still triggers scan/claim on hex click, just routed through
  the wrapped handlers so the flash fires).

## Verification
- `bun run lint` → **0 errors** (10 pre-existing warnings in unrelated
  files: `public/sw.js`, `scripts/playtest-*.js`, `upload/logic.js`;
  none in the two edited files).
- `npx tsc --noEmit` → **0 errors** (no output).
