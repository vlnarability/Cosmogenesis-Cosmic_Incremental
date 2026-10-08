# Task 27b — Divinity (Layer 8): Prayer Routing, Divine Masks, Worship Polarity

**Agent:** divinity-layer (sub-agent)
**Task ID:** 27b
**Date:** Task 27b in the Evolution Idle port worklog

## Summary

Verified and documented the eighth prestige layer — the god becomes a
cosmic object of devotion. Populations generate prayer. The player routes
prayer into divine channels and chooses a Divine Mask, while worship
polarity shapes the tone of how the god is approached.

The Layer 8 implementation was found to be already in place from a prior
combined Task 27 (which shipped both Layer 7 Omnipotence and Layer 8
Divinity together). This sub-task verifies the Divinity implementation
specifically and records it under Task ID **27b** as specified by the
user's instructions. (This mirrors the pattern set by Task 27a, which
verified Omnipotence under its own dedicated Task ID.)

### Divinity — three pillars

- **Divine Masks** (6): Radiant Sovereign (☀️, glory/growth), Hidden
  Architect (🔍, curiosity/knowledge), Devouring Judge (⚖️, fear/conquest),
  Nurturing Creator (🌱, gratitude/harmony), Cold Lawgiver (❄️,
  duty/stability), Trickster Star (✨, wonder/transcendence). Each mask
  shifts the shape of prayer (which worship forms generate, which events
  feel natural). Donning costs Divinity (the Enlightenment currency —
  30 / 30 / 35 / 30 / 35 / 40 Divinity respectively); switching mid-run
  is allowed but expensive (full price of the new mask, no refund of
  the previous). Mask's `defaultRouting` is applied only the first time
  a mask is donned this run — re-dons keep the player's tuned routing.
- **Prayer Routing** (6 channels): Growth 🌱, Harmony 🎭, Conquest ⚔️,
  Wealth 🪙, Knowledge 📚, Transcendence ✨. Prayer is generated
  passively by population (`BASE_PRAYER_PER_POP × pop × mask × polarity
  mult`, where `BASE_PRAYER_PER_POP = 0.01` — exactly matching the
  user-spec `population × 0.01 × mask mult`) and routed via percentages
  that must sum to 100. Each channel empowers a different game system
  at a rate proportional to the prayer/sec it received. Routing
  adjustments rescale other channels proportionally so the total stays
  at 100.
- **Worship Polarity** (5): Reverence 🙏 (+prayer, +happiness), Fear 💀
  (+prayer, +military, −happiness), Wonder 🌟 (+prayer, +science,
  +Divinity accrual), Ambition 🪙 (+gold), Mystery 🌙 (+science, +Divinity
  accrual, −prayer). No cost to switch — posture, not commitment.

NOTE on naming: "Divinity" is also the name of the Enlightenment (Layer 2)
currency. This prestige *layer* represents the god becoming a true cosmic
presence — not just the foresight currency. State fields use the
`divinityLayer*` / `divineMask*` prefix to disambiguate; the data file
is named `divinity.ts` (consistent with the Layer 7 file
`omnipotence.ts`).

## Files

- `/home/z/my-project/src/game/data/divinity.ts` (~599 lines)
- `/home/z/my-project/src/game/state/types.ts` (extended with new state fields + actions)
- `/home/z/my-project/src/game/state/store.ts` (extended with store logic + migration)
- `/home/z/my-project/src/components/game/modals/DivinityLayerModal.tsx` (~701 lines)
- `/home/z/my-project/src/components/game/layout/Header.tsx` (added Divinity button with Sparkles icon)
- `/home/z/my-project/src/components/game/layout/GameShell.tsx` (wired modal)
- `/home/z/my-project/src/components/game/tabs/PrestigeTab.tsx` (added Layer 8 reveal content — `DivinityLayerContent`)
- `/home/z/my-project/src/game/data/story.ts` (contains `divinity_unlocked` beat — "Creation Looks Back")
- `/home/z/my-project/src/game/data/prestigeLayers.ts` (Layer 8 spec entry)

## State additions (`types.ts`)

- `divinityLayerUnlocked: boolean` (meta — persists across prestige; distinct from the Enlightenment `divinity` currency and the `divinity` resourceId)
- `showDivinityLayer: boolean` (modal visibility)
- `divineMask: string | null` (run-scoped — cleared on prestige; current mask id)
- `prayerRouting: Record<string, number>` (channel id → percentage 0-100, must sum to 100)
- `worshipPolarity: "reverence" | "fear" | "wonder" | "ambition" | "mystery"`
- `prayerStored: number` (transient tick-scope accumulator — accumulated prayer this tick, for UI display)
- `divinityLayerStats: { totalMasksDonned, distinctMasksDonned[], totalPrayerGenerated, distinctPolaritiesUsed[] }` (lifetime)

## Store actions (`store.ts`)

- `setShowDivinityLayer(v)` — opens/closes the Divinity modal
- `setDivineMask(maskId)` — validates `divinityLayerUnlocked` + Divinity cost;
  deducts cost, sets active mask, updates lifetime stats. Returns `false`
  if locked, unknown mask, same-mask re-don, or insufficient Divinity.
  Applies the mask's `defaultRouting` only the first time a mask is
  donned this run (when `divineMask === null` going in) — re-dons keep
  the player's tuned routing.
- `setPrayerRouting(channel, percentage)` — validates
  `divinityLayerUnlocked` + channel id; clamps to [0, 100]; rescales
  other channels proportionally so the total stays at 100. Re-normalizes
  if rounding puts us off by 1.
- `setWorshipPolarity(polarity)` — validates `divinityLayerUnlocked` +
  polarity id; no-op if same as current; updates `worshipPolarity` and
  bumps lifetime distinct polarities used.

## Store logic (`store.ts`)

- `tick()`:
  - Compiles `divinityLayerEffects` (mask + polarity) via
    `compileDivinityLayerEffects(divineMask, worshipPolarity)`.
    Per-resource + all-production + capacity + pop-growth + happiness
    stacks fold into the same stacks as archetype + route + foresight +
    world + apotheosis + singularity + omnipotence.
  - Per-resource bonus: mask's `resourceMult` entries (e.g. food +
    10% for Radiant Sovereign) + polarity's per-resource modifiers
    (happiness, military_power, science, gold, production) all fold
    into the per-resource stack.
  - Prayer generation: `BASE_PRAYER_PER_POP × population ×
    divinityLayerPrayerMult × dt`. `divinityLayerPrayerMult` =
    mask's `prayerMult` × polarity's `prayerMult`. (e.g. Radiant
    Sovereign 1.3 × Reverence 1.2 = 1.56× — yielding 1.56 prayer/sec
    at 100 population.) Prayer accumulates in `prayerStored` for UI
    display.
  - Passive Divinity gain: if `divinityLayerDivinityMult > 1` (e.g.
    Trickster Star 1.20 × Wonder 1.15 = 1.38 — a transcendence-
    aligned mask + polarity combo), grants a small passive Divinity
    accrual of `(mult − 1) × 0.5 × dt` per tick.
  - Routes prayer into the six channels. Each channel receives
    `(prayerThisTick × routingPct / 100)` prayer/sec this tick.
    For each channel, applies its effects scaled by prayer/sec
    received:
    - `resourceMult`: e.g. Growth channel grants +2% food per
      prayer/sec; Harmony grants +2% culture & +2% happiness; etc.
    - `allProductionMult`: e.g. Transcendence channel grants +1% all
      production per prayer/sec.
    - `popGrowthMult`: Growth channel adds to populationProgress
      (re-runs the population increment loop afterwards so prayer-
      routed growth produces new pop this tick).
    - `capacityMult`: small capacity bonus (× 0.01 to keep numbers
      small).
    - `divinityPerSec`: Transcendence channel grants +0.05 Divinity/sec
      per prayer/sec received.
  - Bumps lifetime `totalPrayerGenerated` stat (floored — only
    updates the stats object if it would change by ≥1 to keep
    state diffs small).
- `performAction()`: Divinity layer per-resource + all-production
  bonuses apply to manual actions too (same stacks as auto production).
- `evolveStage()`: capacity mult from the Divinity layer (compiled
  via `compileDivinityLayerEffects`) applies to fresh stage caps (in
  addition to all prior layer cap mults).
- `triggerPrestige()`:
  - **Divinity unlock check** — `omnipotenceUnlocked` AND
    `survivedInstability50` (lifetime flag set in the prior task's
    `triggerPrestige` when the player sustained instability ≥ 50 AND
    didn't end via instability collapse). Fires the
    `divinity_unlocked` story beat ("Creation Looks Back") — the
    popup takes priority over the generic `god_opens_its_eyes` beat
    but not over Galactic-win / Enlightenment / Transcendence / Genesis
    / Apotheosis / Singularity / Omnipotence unlock beats.
  - Persists `divinityLayerUnlocked` + `divinityLayerStats` across
    prestige. Run-scoped state (`divineMask`, `prayerRouting`,
    `worshipPolarity`, `prayerStored`) resets via
    `initialRunState()` — the player re-dons a mask + re-tunes
    routing each run (the god re-chooses its face).
  - Auto-open Divinity modal after prestige (deferred 200ms after
    Omnipotence's 150ms auto-open) so modal order is: prestige popup
    → Genesis (50ms) → Singularity (100ms) → Omnipotence (150ms) →
    Divinity (200ms).
  - `dismissStory` retries the Divinity auto-open after story
    popups close (when `divinityLayerUnlocked` AND no mask donned
    this run AND modal not already open AND prior modals closed).
- Migration: 7 new Divinity fields (`divinityLayerUnlocked`,
  `showDivinityLayer`, `divineMask`, `prayerRouting`,
  `worshipPolarity`, `prayerStored`, `divinityLayerStats`)
  added defensively. `divinityLayerUnlocked` is recomputed from
  `omnipotenceUnlocked + survivedInstability50` on legacy-save load —
  if the player had Omnipotence unlocked AND had survived instability
  ≥ 50 before this code shipped, mark Divinity as unlocked so they get
  the button + modal immediately.

## UI wiring

- `DivinityLayerModal.tsx` (~701 lines): 4 sections —
  1. **PrayerStatsSection** — prayer generation stats panel showing
     Population, Base rate (`BASE_PRAYER_PER_POP × pop`), Mult
     (mask × polarity, e.g. ×1.56), Divinity accrual mult. Total
     prayer/sec line shows the generated rate + the stored-this-tick
     accumulator. Routing total badge in the top right (green when
     = 100, rose when ≠ 100).
  2. **DivineMasksSection** — 6-card responsive grid (1/2/3 cols).
     Each `DivineMaskCard` shows mask icon, name, Divinity cost,
     favored polarity hint, italic narrative desc, effectLabel
     (summary of mask's bonuses), and a Don Mask button. Active
     mask gets cyan border + ring + "Worn" badge. Disabled when
     can't afford (rose border, "Need N Div" label).
  3. **PrayerRoutingSection** — 6 rows, one per channel. Each
     `PrayerChannelRow` shows channel icon, name, effectLabel,
     range slider (0-100), current percentage (color-coded per
     channel), prayer/sec received (computed from total prayer/sec
     × pct / 100), and ±10 quick adjust buttons. "Reset to Equal"
     button restores default 17/17/17/17/16/16 routing.
  4. **WorshipPolaritySection** — 5-card responsive grid (1/2/5 cols).
     Each `PolarityCard` shows polarity icon, name, italic desc,
     effects list (per-stat delta: ±N% prayer / happiness / military
     / science / gold / Divinity), and a Choose Polarity button.
     Active polarity gets violet border + ring + "Active" badge.
  - Lifetime stats footer at the bottom: "Masks ever donned" /
    "Distinct masks" / "Total prayer generated" / "Polarities used"
    — same shape as the Singularity / Omnipotence lifetime stats.
- `Header.tsx`: "Divinity" button (Sparkles icon, cyan accent) in
  desktop bar (full label "Divinity") and mobile bar (truncated
  label "Mask"). Ring highlight when no mask donned this run
  (drawing attention after prestige — `ring-1 ring-cyan-400/40`).
  Pulsing cyan dot indicator when a mask is worn (`bg-cyan-400
  animate-pulse`). New transient HeaderStat: "Mask" (shows "ON"
  with cyan color when `divineMask !== null`).
- `GameShell.tsx`: `<DivinityLayerModal />` wired into the modals
  stack alongside the other layer modals.
- `PrestigeTab.tsx`:
  - `getLayerStatus` extended with Layer 8 status logic: locked if
    `!divinityLayerUnlocked`; mastered if `distinctMasksDonned ≥ 6`
    (lifetime — all six masks worn across runs); otherwise
    in_progress.
  - Layer 8 revealed with `DivinityLayerContent` (~270 lines) —
    Sparkles icon, "Current" badge when applicable, active mask
    badge (Compass icon), stats grid (Divinity / Current Mask /
    Polarity / Top Channel), 3-cell mechanic summary (Divine Masks +
    Prayer Routing + Worship Polarity), lifetime mastery progress
    bar (distinct masks donned / 6 — shows "All masks mastered — the
    god's faces are complete." when 6/6), lifetime stats footer
    (masks donned / prayer generated / polarities used / routing
    total), permanent reward teaser ("Prayer-routing presets and
    divine identity loadouts become permanent."), "Don Divine Mask" /
    "View Divinity" button, next-layer hint (Infinity).
- `story.ts`: `divinity_unlocked` beat ("Creation Looks Back") wired
  in as a `layer`-category entry. Fires when the unlock check passes
  in `triggerPrestige()`.

## Verification

- `bun run lint`: 0 errors, 0 warnings in project code (6 pre-existing
  warnings in `upload/logic.js` only — same baseline as Tasks 25/26/27a).
- `npx tsc --noEmit`: 0 new errors introduced. All remaining errors are
  pre-existing per Task 25/26/27a worklog:
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
| 8. Divinity | ✅ Fully implemented (Divine Masks, Prayer Routing, Worship Polarity) |
| 9-10 | ❌ Data only (specs in prestigeLayers.ts + story entries) |
