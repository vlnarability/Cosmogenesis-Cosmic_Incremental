# Task: UI-STREAMLINE-P2-P5

**Agent**: main (single-agent run)
**Date**: 2025 streamlining pass
**Scope**: Reduce UI clutter at L10 + remove AI-generated visual tells across the Evolution Idle Next.js game.

## Mandatory reads completed
1. `src/components/game/layout/Header.tsx` — old 14-button header
2. `src/components/game/layout/DivineEnginePanel.tsx` — old 5-stat-card panel
3. `src/components/game/layout/ResourceBar.tsx` — old resource bar with stage + meta chips
4. `src/app/globals.css` — theme tokens + component classes
5. `src/components/game/layout/GameShell.tsx` — composition root
6. `src/game/state/layerHelpers.ts` — `useActiveLayer()` hook
7. `src/game/state/store.ts` — verified `unlockedLayers`, `backgroundSimulations`, `peakProductionRate`, `divinity`, `evolutionPoints`, `prestigePoints`, `divinityFromBackground`, all `setShow*` setters exist

## Summary of changes

### Header (P2) — `src/components/game/layout/Header.tsx` (full rewrite)
- 3-zone command bar: Navigation (left) · Status (center) · Actions (right)
- Layer buttons moved into single "Layers" dropdown
- At L1–L3: most-recently-unlocked 2 layers also show as standalone buttons
- At L4+: everything in dropdown
- Mobile: layers dropdown moves into gear menu
- Gear menu: Prestige Roadmap, Shop, Save, Settings (+ Layers list on mobile)
- Removed: EP/PP/Wins chips, `ActiveEffectsRow` (entire function + RITUAL_MAP import gone), tinted-box stat styling

### DivineEnginePanel (P3) — `src/components/game/layout/DivineEnginePanel.tsx` (full rewrite)
- One big number: Worlds (text-3xl) + Div/s (text-lg) + EP/s (text-sm, L4+ only)
- Quick-access buttons: current layer's modal + next layer's modal (locked state for unrevealed next layer)
- Formula hidden behind `?` tooltip (HelpCircle + radix Tooltip)
- Removed: cosmic viz, 5 stat cards, progress bars, hint card, formula breakdown, gradient-text title

### ResourceBar (P4) — `src/components/game/layout/ResourceBar.tsx` (full rewrite)
- L1: stage-resource chips kept (matches current behavior)
- L2+: only meta-currency pills, max 5. Priority list: Divinity · EP · PP · Faith · Genesis Seeds
- Removed: "📚 N resources X% avg" summary chip, archetype badge, L3+ "top 3 + expand" collapse mode, "🌌 Divine Engine" label text

### AI Visual Tells (P5)
1. **Icon-in-box clichés** removed from: `StoryTab.tsx`, `AchievementsTab.tsx`, `PrestigeTab.tsx` (`LayerCard` + `LayerRow`), `Header.tsx` (logo wrapper)
2. **Rainbow status dots** replaced with left-border accent:
   - `ApotheosisModal.tsx` `severityBorderClass` now returns `border-l-2 border-l-{amber|orange|red}` (red tier gets `heresy-pulse-red` subtle animation)
   - Header's pulsing-amber/rose `extra` status dots gone with the dropdown refactor
3. **Emoji in layer button labels** removed — buttons say "Trials"/"Foresight"/"Sacrifice" etc. (emoji kept for resources per task spec)
4. **Curly quotes**: verified none exist (ripgrep for `\u201c\u201d\u2018\u2019` returns zero matches)
5. **Generic aspirational copy** rewritten in `PrestigeTab.tsx` (3 instances) and `prestigeLayers.ts` (3 instances) — "saga" → "system/age"
6. **Monotonous card borders** varied via 5 new CSS variants in `globals.css`: `.stat-card-accent`, `.stat-card-accent-{amber,emerald,violet}`, `.stat-card-plain`. Applied in `StoryTab.tsx`, `AchievementsTab.tsx`
7. **Gradient-text cliché** (`bg-clip-text` with violet→fuchsia→indigo gradient) removed from Header, ResourceBar, DivineEnginePanel

## Files modified (9)
- `src/components/game/layout/Header.tsx` — full rewrite
- `src/components/game/layout/DivineEnginePanel.tsx` — full rewrite
- `src/components/game/layout/ResourceBar.tsx` — full rewrite
- `src/components/game/modals/ApotheosisModal.tsx` — `severityBorderClass` refactor
- `src/components/game/tabs/PrestigeTab.tsx` — copy + LayerCard/LayerRow box removal
- `src/components/game/tabs/AchievementsTab.tsx` — box removal + accent variant
- `src/components/game/tabs/StoryTab.tsx` — box removal + accent variants
- `src/game/data/prestigeLayers.ts` — copy rewrites (saga → system/age)
- `src/app/globals.css` — added `heresy-pulse-red` animation + 5 stat-card variants

## Verification
- **Lint**: `bun run lint` → 0 errors, 7 warnings (all pre-existing in unrelated files)
- **TypeScript**: `bunx tsc --noEmit` → 0 errors in any touched file (pre-existing errors in EnlightenmentModal, sidebar, stages, store remain untouched)
- **Dev server**: Next.js 16 compiles cleanly, page loads 200 OK
- **No tests written** (per instructions)
- **No functionality removed** — every layer modal still accessible, all stat info still visible (consolidated into DivineEnginePanel), all controls (pause/speed/save/settings/shop) work

## Worklog
Appended to `/home/z/my-project/worklog.md` as task ID `UI-STREAMLINE-P2-P5`.
