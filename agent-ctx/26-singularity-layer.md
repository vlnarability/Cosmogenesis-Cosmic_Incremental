# Task 26 — Singularity (Layer 6)

**Agent:** singularity-layer (sub-agent)
**Task ID:** 26
**Date:** see worklog

## Summary
Implemented the sixth prestige layer — the god enters the system; reality
thinks in the shape of the god's will. Three systems now live:

- **Relic Loadouts** (8): pre-run choices, each with one large upside, one
  meaningful downside, and one special interaction with a stage or
  subsystem. Equipped BEFORE a run starts (up to `relicSlots`, default 3).
  Costs Divinity; unequipping is free mid-run but does not refund.
- **Compression** (6 stages): mark mastered stages as auto-skip on future
  runs. The skip grants a "what would have been" build (resources +
  population) and clears the stage. Permanent QoL feature once unlocked.
  Galactic cannot be compressed (it triggers prestige).
- **Logic Cores** (6): advanced automation priorities — Growth, Stability,
  Conquest, Science, Trade, Faith. Only one may be active at a time.
  Setting / switching costs Divinity.

## Files Created / Modified

### New files
- `src/game/data/singularity.ts` — Relic defs (8), Logic Core defs (6),
  Compression profiles per stage, compiled-effects helper, unlock-condition
  helper.
- `src/components/game/modals/SingularityModal.tsx` — modal with three
  sections (Relics grid, Compression list, Logic Cores grid) + header
  showing Divinity / relic slots / compression count + lifetime stats
  footer.

### Modified files
- `src/game/state/types.ts` — added 6 new GameState fields + 5 new
  GameStore actions.
- `src/game/state/store.ts`:
  - Imported singularity data.
  - Added `singularity*` fields to `initialMetaState()` and
    `initialRunState()`.
  - Wired `singularityEffects` into `tick()` (per-resource + all-production
    + capacity + upkeep + event-freq stacks).
  - Wired `singularityEffects` into `performAction()` (manual + per-resource
    + all-production stacks).
  - Added Compression auto-skip block to `evolveStage()`: marks compressed
    stage as cleared, grants resource+population bump, advances to stage
    after, increments lifetime `compressedStagesSkipped`.
  - Added `singularityCapMultForEvolve` to the evolve-time capacity
    recompute so relic capacity bonuses apply to the fresh stage's caps.
  - Added `singularityEventFreqMult` to event cooldown calc (Silent Bell
    relic: −50% event frequency).
  - Added Singularity state persistence + unlock check to
    `triggerPrestige()`.
  - Added Singularity auto-open logic (deferred via setTimeout after
    Genesis modal closes; also retried in `dismissStory` and
    `setShowGenesis(false)`).
  - Updated `setShowGenesis` to chain into Singularity auto-open when
    Genesis closes.
  - Added 5 new actions: `setShowSingularity`, `equipRelic`,
    `unequipRelic`, `toggleCompression`, `setLogicCore`.
  - Added migration for 6 new fields; recomputed `singularityUnlocked`
    defensively from `apotheosisStats` on legacy-save load.
- `src/components/game/layout/Header.tsx` — added "Singularity" button
  (Cpu icon, cyan accent) in desktop + mobile bars. Pulsing cyan dot
  when a logic core is active. Transient HeaderStats: Relics (count when
  > 0), Core (ON when active).
- `src/components/game/layout/GameShell.tsx` — wired `SingularityModal`
  into the modal stack.
- `src/components/game/tabs/PrestigeTab.tsx`:
  - Imported `RELICS`, `LOGIC_CORES`, `COMPRESSION_PROFILES`,
    `LOGIC_CORE_MAP`, `totalRelicCount`, `totalLogicCoreCount`.
  - Imported new icons: `Cpu`, `Layers`, `Gauge`.
  - Extended `getLayerStatus()` to compute Layer 6 status (locked /
    in_progress / mastered based on `singularityUnlocked` + lifetime
    distinct relics equipped count).
  - Added Singularity state hooks + passed through to
    `PrestigeLayerCard`.
  - Added `SingularityLayerContent` (~310 lines) — Cpu icon, stats grid
    (Divinity / Relic Slots / Active Core / Compressed Stages), equipped
    relics summary, 3-cell mechanic summary, lifetime mastery progress
    bar, "Bind Relic Loadout" / "View Singularity" button, next-layer
    hint (Omnipotence).

## State additions (`types.ts`)
- `singularityUnlocked: boolean` (meta — persists across prestige)
- `showSingularity: boolean` (modal visibility)
- `equippedRelics: string[]` (run-scoped — cleared on prestige)
- `relicSlots: number` (starts at 3, persists across runs — could be
  expanded by future shop upgrades)
- `compressedStages: string[]` (permanent QoL — persists across runs)
- `activeLogicCore: string | null` (run-scoped — cleared on prestige)
- `singularityStats: { totalRelicsEquipped, totalCoresActivated,
  distinctRelicsEquipped[], distinctCoresActivated[],
  compressedStagesSkipped }` (lifetime stats — persist across runs)

## Store actions (`store.ts`)
- `setShowSingularity(v)`
- `equipRelic(relicId)`: checks slot availability + Divinity cost, deducts,
  adds to `equippedRelics[]`, updates lifetime stats.
- `unequipRelic(relicId)`: removes from `equippedRelics[]` (no Divinity
  refund — equipping is a per-run commitment, but unequipping lets the
  player swap mid-run if their strategy shifts).
- `toggleCompression(stageId)`: validates the stage can be compressed
  (cleared at least once AND not Galactic), adds/removes from
  `compressedStages[]`.
- `setLogicCore(coreId | null)`: validates Divinity cost, deducts, sets
  active core. Passing `null` deactivates the current core (free).

## Store logic

### Relics
- `equipRelic()` validates: Singularity unlocked, relic exists, not
  already equipped, slot available (≤ `relicSlots`), Divinity ≥ cost.
- Deducts Divinity, adds to `equippedRelics`, updates lifetime stats.
- `unequipRelic()` removes from `equippedRelics[]` (no refund).

### Compression
- `toggleCompression()` validates: Singularity unlocked, stage cleared at
  least once (`stageClearCounts[id] >= 1`), not Galactic (the final stage
  that triggers prestige).
- Adds/removes the stage from `compressedStages[]`.
- In `evolveStage()`, BEFORE the rest of the evolve logic:
  - If the next stage is compressed AND there's a stage after it,
    advance `nextStageIdx` by 2 (to the stage after the compressed one).
  - Apply the "what would have been" build: resources from the
    `COMPRESSION_PROFILES` entry, population bump.
  - Mark the compressed stage as cleared in `stageClearCounts`.
  - Increment lifetime `compressedStagesSkipped`.
- Tradeoff: if the planted dormant seed would awaken at the compressed
  stage, the awakening is forfeit (compression trades content for QoL).
  The seed awakening check only operates on the DESTINATION stage.

### Logic Cores
- `setLogicCore(null)` deactivates the current core (free, logs a
  "deactivated" message).
- `setLogicCore(coreId)` validates: Singularity unlocked, core exists,
  not the SAME core as currently active, Divinity ≥ cost.
- Deducts Divinity, sets `activeLogicCore`, updates lifetime stats.
- Switching cores costs the NEW core's full Divinity price. The previous
  core is NOT refunded (the god reconfigures the system at the new cost).

### Compiled effects (`compileSingularityEffects`)
- Combines `equippedRelics` + `activeLogicCore` into a single
  `CompiledSingularityEffects` bundle.
- Per-resource production bonuses fold into the same stack as archetype +
  route + foresight + world + apotheosis (additive).
- All-production bonuses fold into the same stack too.
- Relic penalties (e.g. −10% pop/s, −20% happiness, −50% event freq,
  −15% capacity, −25% gold) subtract from the same stacks.
- `upkeepMult` is multiplicative (stacks with the world upkeep mult).
- `eventFreqMult` is multiplicative (stacks with the world event freq
  mult — Silent Bell's −50% multiplies the world's event freq mult).
- `manualMult` is additive to the manual action multiplier (relics of
  type `manual`).
- `evolveRequirementReduction` is multiplicative on evolve thresholds
  (relics of type `evolve`; not used by any current relic but supported
  for future expansion).

### Unlock
- Fires inside `triggerPrestige()` (defensive — catches legacy saves).
- Condition: Apotheosis unlocked AND `apotheosisStats.totalLawsEnacted >= 2`
  AND `apotheosisStats.totalHeresiesResolved >= 1`.
- Sets `singularityUnlocked = true`, marks `singularity_unlocked` story
  beat, fires `singularity_unlocked` story popup (priority over the
  generic `god_opens_its_eyes` beat but not over Galactic-win /
  Enlightenment / Transcendence / Genesis / Apotheosis unlock beats).
- Singularity unlock popup is logged explicitly even if the player
  dismisses the story popup.

### Auto-open after prestige
- Singularity auto-opens after prestige (deferred 100ms after Genesis's
  50ms auto-open) so the modal order is: prestige popup → Genesis →
  Singularity.
- If Genesis opens first (because the player hadn't authored a world),
  Singularity waits. When the player closes Genesis (`setShowGenesis(false)`),
  the Singularity modal auto-opens.
- `dismissStory` also retries Singularity after story popups close.
- All retries check: Singularity unlocked, no relics equipped this run,
  no Genesis modal open, no story popup active.

### Migration
- 6 new fields + `singularityStats` reconstruction added defensively.
- `singularityUnlocked` is recomputed from `apotheosisStats` on legacy-
  save load: if the player already had Apotheosis unlocked AND ≥2
  laws enacted AND ≥1 heresy resolved before this code shipped, mark
  Singularity as unlocked so they get the button + modal immediately.

## UI wiring

### SingularityModal.tsx (~770 lines)
- Three sections: Relics grid (8 cards, 4-col on lg), Compression list
  (6 stages, 3-col on lg), Logic Cores grid (6 cards, 3-col on lg).
- Relic cards: name + cost, description (italic), upside (green box,
  ArrowUpRight icon), downside (red box, ArrowDownRight icon), special
  interaction (violet box, Sparkles icon), Equip/Unequip button
  (disabled when slots full or insufficient Divinity).
- Compression cards: stage name + icon, clear count, "Skip grants:"
  summary (resources + pop), enable/disable button. Locked if stage
  not yet cleared (Lock icon + amber italic hint). Galactic is locked
  (cannot be compressed).
- Logic Core cards: priority icon (color-coded), name + cost,
  description (italic), effects list (cyan chevron bullets), Activate
  button (disabled if active or insufficient Divinity). "Active Core"
  panel above the grid shows the current core's effects + a Deactivate
  button.
- Header: Divinity balance, relic slots (X / 3 used), compression count.
- Footer: lifetime stats (relics ever bound, cores ever activated,
  distinct relics, stages compressed).

### Header.tsx
- "Singularity" button (Cpu icon, cyan accent) in desktop + mobile bars.
- Ring highlight when no relics are equipped this run (draws attention
  after prestige).
- Pulsing cyan dot indicator when a logic core is active.
- New transient HeaderStats: Relics (count when > 0), Core (ON when
  active).

### GameShell.tsx
- SingularityModal wired into the modals stack (after ApotheosisModal).

### PrestigeTab.tsx
- Layer 6 revealed with `SingularityLayerContent` (~310 lines) — Cpu
  icon, "Core Active" badge when applicable, stats grid (Divinity /
  Relic Slots / Active Core / Compressed Stages), equipped relics
  summary (badges), 3-cell mechanic summary, lifetime mastery progress
  bar (distinct relics equipped / total), "Bind Relic Loadout" /
  "View Singularity" button, next-layer hint (Omnipotence).

## Verification
- `bun run lint`: 0 errors, 0 warnings in project code (6 pre-existing
  warnings in `upload/logic.js` only).
- `npx tsc --noEmit`: 0 new errors introduced (all errors are
  pre-existing per Task 25 worklog — TutorialHints.tsx:68, stages.ts:125,
  store.ts:220 Partial<GameState> inference issue, store.ts:1093-1098
  stageStartBonus type errors — line numbers shifted due to additions
  above them).
- Dev server: HTTP 200 on `/` — page compiles cleanly.

## Prestige Layer Status Update

| Layer | Status |
|-------|--------|
| 1. Evolution | ✅ Fully implemented (10 challenges, mastery) |
| 2. Enlightenment | ✅ Fully implemented (Divinity, routes, foresight nodes) |
| 3. Transcendence | ✅ Fully implemented (Offerings, Rituals, Scripts) |
| 4. Genesis | ✅ Fully implemented (Cradle Worlds, Prime Conditions, Sacred Geography, Dormant Seeds) |
| 5. Apotheosis | ✅ Fully implemented (Divine Laws, Worship Modes, Miracles, Heresy Management) |
| 6. Singularity | ✅ Fully implemented (Relic Loadouts, Compression, Logic Cores) |
| 7-10 | ❌ Data only (specs in prestigeLayers.ts + story entries) |
