# Task 27a — Omnipotence (Layer 7): Hybrid Lineage with Instability

**Agent:** omnipotence-layer (sub-agent)
**Task ID:** 27a
**Date:** Task 27a in the Evolution Idle port worklog

## Summary

Verified and documented the seventh prestige layer — the god rewrites
natural boundaries. The player can sustain multiple archetypal
inheritances in the same run, combining traits from more than one
lineage (Hybrid Lineage). This creates **Instability** — higher
pressure, happiness strain, upkeep climbs, and risk of stage
destabilization. At 100, the run ends with reduced EP (halved — the
contradiction consumes the god's hold on creation).

The Layer 7 implementation was found to be already in place from a
prior combined Task 27 (which shipped both Layer 7 Omnipotence and
Layer 8 Divinity together). This sub-task verifies the Omnipotence
implementation specifically and records it under Task ID **27a** as
specified by the user's instructions.

### Omnipotence — three pillars

- **Hybrid Lineage** (8 pairs): humanoid+mammalian, reptilian+arthropoid,
  plantoid+fungoid, lithoid+extremophile, avian+aquatic,
  molluscoid+necroid, toxoid+plantoid, humanoid+extremophile. Each
  pair grants a combined bonus (e.g. +15% food AND +15% culture) and
  an instability rate (0.7-2.0 /sec). Up to `HYBRID_SLOTS = 3` pairs
  may be active at once. No Divinity cost — the cost IS the Instability
  itself.
- **Instability** (0-100): rises from the friction of sustained
  hybrids. Above danger threshold (80), penalties apply: +1% upkeep
  per point above 80 (up to +20% at 100), and -0.05/s happiness drain
  per point above 80 (up to -1.0/s at 100). If 100, run ends with
  reduced EP (halved via `INSTABILITY_END_RUN_EP_MULT = 0.5` — same
  failure mode as Apotheosis heresy).
- **Instability Stance** (3): Contained (×0.5 growth, ×0.7 bonus),
  Balanced (×1.0/×1.0), Embraced (×1.6/×1.4). No cost to switch —
  posture, not commitment.

## Files

- `/home/z/my-project/src/game/data/omnipotence.ts` (~451 lines)
- `/home/z/my-project/src/game/state/types.ts` (extended with new state fields + actions)
- `/home/z/my-project/src/game/state/store.ts` (extended with store logic + migration)
- `/home/z/my-project/src/components/game/modals/OmnipotenceModal.tsx` (~619 lines)
- `/home/z/my-project/src/components/game/layout/Header.tsx` (added Omnipotence button with Shuffle icon)
- `/home/z/my-project/src/components/game/layout/GameShell.tsx` (wired modal)
- `/home/z/my-project/src/components/game/tabs/PrestigeTab.tsx` (added Layer 7 reveal content — `OmnipotenceLayerContent`)
- `/home/z/my-project/src/game/data/story.ts` (contains `omnipotence_unlocked` beat)
- `/home/z/my-project/src/game/data/prestigeLayers.ts` (Layer 7 spec entry)

## State additions (`types.ts`)

- `omnipotenceUnlocked: boolean` (meta — persists across prestige)
- `showOmnipotence: boolean` (modal visibility)
- `hybridLineages: string[]` (run-scoped — max HYBRID_SLOTS = 3)
- `instability: number` (0-100; if 100, run ends with reduced EP)
- `instabilityStance: "contained" | "balanced" | "embraced"`
- `survivedInstability50: boolean` (lifetime flag for Divinity-layer unlock)

## Store actions (`store.ts`)

- `setShowOmnipotence(v)` — opens/closes the Omnipotence modal
- `equipHybrid(pairId)` — validates omnipotenceUnlocked + slot availability
  (max HYBRID_SLOTS = 3); no Divinity cost — the cost is the Instability
  itself. Adds to `hybridLineages[]`, logs the fusion with the pair's
  bonusLabel.
- `unequipHybrid(pairId)` — removes from `hybridLineages[]`. No instability
  refund — what was loosened does not un-loose. Instability continues at
  the reduced rate.
- `setInstabilityStance(stance)` — sets the stance; no cost (posture, not
  commitment). Logs the stance's name and desc.

## Store logic (`store.ts`)

- `tick()`:
  - Compiles `omnipotenceEffects` (active hybrids + stance) into a single
    effects bundle via `compileOmnipotenceEffects()`. Per-resource +
    all-production + capacity + pop-growth stacks fold into the same
    stacks as archetype + route + foresight + world + apotheosis +
    singularity.
  - Grows instability based on the compiled rate × dt × stance growthMult
    (`omnipotenceEffects.instabilityRate`, which already includes the
    stance multiplier).
  - Above danger threshold (80), applies penalties:
    - `omnipotenceUpkeepMult = 1 + (instability - 80) * 0.01` (up to
      +20% at 100)
    - `instabilityHappinessDrain = (instability - 80) * 0.05` (up to
      -1.0/s at 100)
  - Sets a transient runtime flag `_instability50Sustained` when
    instability crosses 50 (used by the Divinity-layer unlock check at
    prestige).
  - Sets the `instability` field on the state at the end of the tick.
  - At the end of tick, if instability reached 100, triggers prestige
    with reduced EP (halved via the `_instabilityEndRun` flag — same
    failure mode as Apotheosis heresy).
- `performAction()`: Omnipotence per-resource + all-production bonuses
  apply to manual actions too (same stacks as auto production).
- `evolveStage()`: capacity mult from Omnipotence hybrids applies to
  fresh stage caps (in addition to all prior layer cap mults).
- `triggerPrestige()`:
  - **Instability end-run penalty** — if `_instabilityEndRun` flag set
    (by the tick instability-end-run path), EP is multiplied by
    `INSTABILITY_END_RUN_EP_MULT = 0.5` (halved).
  - Tracks `survivedInstability50ThisRun` — if the player sustained
    instability ≥ 50 in this run AND didn't end via instability
    collapse, sets `survivedInstability50 = true` for the lifetime
    (used by Divinity-layer unlock).
  - Archive entry `notes` includes "instability collapse" tag when
    applicable.
  - **Omnipotence unlock check** — Singularity unlocked AND ≥3 distinct
    relics equipped (lifetime, via `singularityStats.distinctRelicsEquipped`)
    AND ≥1 distinct core activated (lifetime, via
    `singularityStats.distinctCoresActivated`). Fires the
    `omnipotence_unlocked` story beat ("Boundaries Are Denied") — the
    popup takes priority over the generic god_opens_its_eyes beat but
    not over Galactic-win / Enlightenment / Transcendence / Genesis /
    Apotheosis / Singularity unlock beats.
  - Persists `omnipotenceUnlocked` + `survivedInstability50` across
    prestige. Run-scoped state (`hybridLineages`, `instability`,
    `instabilityStance`) resets via `initialRunState()`.
  - Auto-open Omnipotence modal after prestige (deferred 150ms after
    Singularity's 100ms auto-open) so modal order is: prestige popup →
    Genesis → Singularity → Omnipotence → Divinity.
  - `dismissStory` retries the Omnipotence auto-open after story
    popups close (when omnipotenceUnlocked AND no hybrids equipped
    this run AND modal not already open).
- Migration: 6 new Omnipotence fields (`omnipotenceUnlocked`,
  `showOmnipotence`, `hybridLineages`, `instability`,
  `instabilityStance`, `survivedInstability50`) added defensively.
  `omnipotenceUnlocked` is recomputed from `singularityStats` on
  legacy-save load — if the player had Singularity unlocked + ≥3
  distinct relics + ≥1 distinct core before this code shipped, mark
  Omnipotence as unlocked so they get the button + modal immediately.

## UI wiring

- `OmnipotenceModal.tsx` (~619 lines): 4 sections —
  1. **InstabilityBar** — the instability meter (0-100) with color
     coded progress bar (amber → rose-500 → rose-600 when critical).
     Shows current level, base rate (sum of hybrids), after-stance
     rate, bonus mult. When dangerous (>80), shows a red alert banner
     above the modal explaining the penalties + suggesting the
     Contained stance.
  2. **EffectsSummary** — compiled active effects panel showing all
     per-resource + all-production + pop-growth + capacity bonuses
     as badges. Green for positive, red for negative. Stance ×bonus
     multiplier label.
  3. **HybridLineagesSection** — 8-card responsive grid (1/2/4 cols).
     Each `HybridCard` shows pair name, archetype names, italic
     narrative desc, combined bonus (green box, ArrowUpRight icon),
     instability cost (red box, ArrowDownRight icon), and Fuse/Unfuse
     button. Equipped cards get rose border + ring + "Fused" badge.
     Disabled when slots full and not equipped.
  4. **StanceSection** — 3-card grid (Contained / Balanced / Embraced).
     Each `StanceCard` shows icon, name, growth × mult + bonus × mult,
     italic narrative desc, and Choose Stance / Active button. Active
     stance gets amber border + ring + "Active" badge.
- `Header.tsx`: "Omnipotence" button (Shuffle icon, rose accent) in
  desktop + mobile bars. Ring highlight when no hybrids equipped this
  run (drawing attention after prestige). When instability > 80, the
  button gets `ring-2 ring-rose-500/60 animate-pulse` + a pulsing
  rose dot indicator (drawing attention to the danger). New transient
  HeaderStats: Hybrids (count when > 0), Instability (% with rose
  color when > 80).
- `GameShell.tsx`: `<OmnipotenceModal />` wired into the modals stack.
- `PrestigeTab.tsx`: `getLayerStatus` extended with Layer 7 status
  logic. Layer 7 revealed with `OmnipotenceLayerContent` (~290 lines) —
  Shuffle icon, "Instability High" badge when applicable, stats grid
  (Divinity / Hybrid Slots / Stance / Instability), instability bar
  with stance growth/bonus mult, fused hybrids summary (when slots
  used > 0), 2-cell mechanic summary (Hybrid Lineage + Instability
  Stance), lifetime mastery progress bar (distinct hybrids equipped /
  total), Divinity-layer unlock hint (shows ✓ when
  survivedInstability50 is true), "Fuse Hybrid Lineage" / "View
  Omnipotence" button, next-layer hint (Divinity).
- `story.ts`: `omnipotence_unlocked` beat ("Boundaries Are Denied")
  wired in as a `layer`-category entry. Fires when the unlock check
  passes in `triggerPrestige()`.

## Verification

- `bun run lint`: 0 errors, 0 warnings in project code (6 pre-existing
  warnings in `upload/logic.js` only).
- `npx tsc --noEmit`: 0 new errors introduced. All remaining errors
  are pre-existing per Task 25/26 worklog:
  - `TutorialHints.tsx:68` — pre-existing
  - `stages.ts:125` — pre-existing
  - `store.ts:280` — Partial<GameState> inference issue (Task 19 worklog)
  - `store.ts:1377-1382` — stageStartBonus type errors (Task 19 worklog,
    line numbers shifted due to additions above them)
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
| 7. Omnipotence | ✅ Fully implemented (Hybrid Lineage, Instability, Stances) |
| 8-10 | ❌ Data only (specs in prestigeLayers.ts + story entries) |
