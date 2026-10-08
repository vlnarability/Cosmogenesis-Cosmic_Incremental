# Task ID: 19 — Enlightenment (Layer 2): Divinity Foresight System

## Agent: enlightenment-layer (sub-agent)

## Task Summary
Implement the second prestige layer (Enlightenment) — the Divinity foresight system with route templates. Enlightenment unlocks once the player has mastered all 10 Evolution challenges. Divinity is earned on prestige (alongside EP) once Enlightenment is unlocked, and is spent on:
- 6 route templates (free to choose, persistent bonus)
- 20 foresight nodes (5-25 Divinity each, organized into 6 categories: route, pressure, conflict, continuity, solar, synergy)

## Files Created

### `src/game/data/foresight.ts` (new, ~340 lines)
- Exports `ForesightCategory` type (6 categories)
- Exports `ForesightPassive` interface — what a node passively does when purchased:
  `target: "production" | "manual" | "capacity" | "popGrowth" | "resource"`, `value`, optional `resourceId`
- Exports `ForesightNode` interface (with `id`, `name`, `desc`, `category`, `cost`, `requires?`, `effect`, `implemented?`, `passive?`)
- Exports `RouteDef` interface (id, name, desc, icon, color, effectLabel, bonus: { allProductionMult?, populationGrowthMult?, productionMult? })
- Exports `ROUTES` (6 routes) and `ROUTE_MAP`:
  | ID | Name | Effect |
  | -- | ---- | ------ |
  | growth | Growth | +15% population growth |
  | conquest | Conquest | +20% military power |
  | harmony | Harmony | +15% happiness stabilization |
  | wealth | Wealth | +20% gold & production |
  | knowledge | Knowledge | +20% science & research |
  | transcendence | Transcendence | +10% all production |
- Exports `FORESIGHT_NODES` (20 nodes) + `FORESIGHT_NODE_MAP` + `FORESIGHT_CATEGORIES`:
  - Route (4): route_templates, seed_bias, template_priority, destiny_lock (locked/coming-soon)
  - Pressure (4): pressure_omens, resource_threads, bottleneck_index, fate_weaving
  - Conflict (4): rival_prophecy, counterplay_network, bloc_blueprints, institutional_memory
  - Continuity (4): continuity_engine, chronicle_lens, compressed_frontiers (coming-soon), cosmic_relay
  - Solar (2): ftl_primers, proof_scaffolds
  - Synergy (2): synergy_visions, deep_threads
- Exports `foresightBonus()` (function-overloaded: returns production/manual/capacity/popGrowth sum, OR per-resource sum)
- Exports `purchasedForesightCount()`, `totalImplementedForesightCount()` helpers

### `src/components/game/modals/EnlightenmentModal.tsx` (new, ~430 lines)
- Dialog-based modal gated on `showEnlightenment && enlightenmentUnlocked`
- Header: Eye icon, "Enlightenment" title, "the god opens its eyes" subtitle, Divinity badge, X/Y Foresight progress badge
- **RouteSelection**: 6-card responsive grid (2 cols mobile, 6 cols lg), each route shows icon + name + effectLabel. Selected route highlighted with violet ring and route color boxShadow. Click again to unbind.
- **ForesightTree**: nodes grouped by category, each category has icon + label + blurb
- **ForesightNodeCard**: shows name, category · cost, italic mythic-tone description, effect panel (with passive label), prerequisites as ✓/✗ chips, action button:
  - Purchased → green "Mastered" + check
  - Coming soon → muted "Coming soon" + hourglass
  - Locked prereq → red "Prereq needed" + lock
  - Affordable → violet "Purchase · N" + sparkles
  - Too expensive → red "Need X more" + X

## Files Modified

### `src/game/state/types.ts`
- Added to `GameState`: `divinity: number`, `enlightenmentUnlocked: boolean`, `selectedRoute: string | null`, `foresightNodes: Record<string, boolean>`, `showEnlightenment: boolean`
- Added to `GameStore`: `setShowEnlightenment`, `spendDivinity(amount, nodeId) => boolean`, `selectRoute(route) => void`, `purchaseForesightNode(nodeId) => boolean`

### `src/game/state/store.ts`
- Imports: `FORESIGHT_NODES`, `FORESIGHT_NODE_MAP`, `ROUTE_MAP`, `foresightBonus` from `@/game/data/foresight`
- `initialMetaState()`: initialize `divinity: 0`, `enlightenmentUnlocked: false`, `selectedRoute: null`, `foresightNodes: {}`, `showEnlightenment: false`
- `tick()`:
  - Compute route + foresight bonuses (routeAllMult, routePopMult, foresightAllMult, foresightPopMult)
  - System production `mult` now multiplies by `(1 + archAllMult + routeAllMult + foresightAllMult)`
  - Per-resource rate adds `routeResBonus + foresightResBonus` to the existing `archResBonus`
  - Population growth rate multiplied by `(1 + archPopMult + routePopMult + foresightPopMult)`
- `performAction()`: manual action multiplier now includes route + foresight bonuses (both all-production and per-resource)
- `triggerPrestige()`:
  - Computes `completedChallengesCount` and checks if Enlightenment just unlocked (defensive check — primary unlock fires inside `checkChallengeCompletion`)
  - Computes `divinityEarned = Math.floor(score / 500 * stageMult)` (only awarded if Enlightenment is unlocked)
  - Persists `divinity`, `enlightenmentUnlocked`, `selectedRoute`, `foresightNodes` across prestige
  - Story popup priority: first Galactic win → evolution_layer_unveiled; first Enlightenment unlock → enlightenment_unlocked; otherwise god_opens_its_eyes
  - Sets `showEnlightenment: false` on fresh run
- `checkChallengeCompletion()`: After marking challenge complete, checks if all 10 are done. If so AND enlightenment not yet unlocked:
  - Sets `enlightenmentUnlocked: true`
  - Marks `enlightenment_unlocked` story as unlocked
  - Fires `enlightenment_unlocked` popup (priority over `challenge_mastered`)
  - Logs "Enlightenment unlocked — the god opens its eyes fully. Divinity awakens."
- New actions:
  - `setShowEnlightenment(v)` — toggle modal
  - `spendDivinity(amount, nodeId)` — deduct amount if affordable, return true/false. (Currently unused by UI; `purchaseForesightNode` is the high-level API. Kept for future ritual/transaction uses per the spec.)
  - `selectRoute(routeId)` — toggle route on/off (free, requires Enlightenment)
  - `purchaseForesightNode(nodeId)` — validates Enlightenment unlocked, implemented !== false, not already purchased, prereqs met, divinity ≥ cost; then deducts and marks purchased; logs the acquisition
- `techMultiplier()`: adds `foresightBonus(s.foresightNodes, "production" | "manual")` to the multiplier — stacks with tech, achievement, and challenge-mastery bonuses
- Migration: 5 new lines for `divinity`, `enlightenmentUnlocked` (with defensive legacy-save check — if 10 challenges already done, mark unlocked), `selectedRoute`, `foresightNodes`, `showEnlightenment`

### `src/components/game/layout/Header.tsx`
- Imports: `Eye` from lucide-react
- New selectors: `enlightenmentUnlocked`, `divinity`, `selectedRoute`, `setShowEnlightenment`
- New "Divinity" `HeaderStat` (violet) appears between EP and Wins when `enlightenmentUnlocked === true`
- New "Divinity" Button appears in the actions row (desktop + mobile) — Eye icon, violet accent when route is chosen. Tooltip: "Enlightenment — Divinity foresight, route templates, and pressure omens". Only renders when `enlightenmentUnlocked === true`.

### `src/components/game/layout/GameShell.tsx`
- Imports `EnlightenmentModal`
- Adds `<EnlightenmentModal />` next to `<ChallengeModal />` in the modals stack

### `src/components/game/tabs/PrestigeTab.tsx`
- Imports `ROUTE_MAP` + `totalImplementedForesightCount` from foresight, `formatNumber` from shared format
- `getLayerStatus()` extended: now takes `enlightenmentUnlocked`, `purchasedForesightCount`, `totalForesightCount`, `selectedRoute` and returns "in_progress" for Layer 2 when enlightenment is unlocked; returns "mastered" when all implemented foresight nodes purchased AND route chosen
- New selectors: `setShowEnlightenment`, `enlightenmentUnlocked`, `divinity`, `selectedRoute`, `foresightNodes`
- `PrestigeLayerCard` extended: passes Enlightenment props to the new `EnlightenmentLayerContent` (rendered when `layer.order === 2` and not locked)
- New `EnlightenmentLayerContent` component (~210 lines): full Layer 2 reveal — Eye icon, Enlightenment badge, story beat, description, 3-cell stats grid (Divinity / Chosen Route / Foresight), route bonus label (if chosen), foresight progress bar, permanent reward teaser, "View Foresight" button (calls `setShowEnlightenment(true)`), next-layer hint

### `src/game/data/story.ts`
- New entry `enlightenment_unlocked`: "The God Opens Its Eyes Fully" — meta layer, Enlightenment. Fires when the 10th Evolution challenge is mastered. Tells the player that Divinity has awakened and the foresight system is open.

## Design Decisions

1. **Enlightenment unlock moment fires from `checkChallengeCompletion`**, not from `triggerPrestige`. This means the popup fires the instant the 10th challenge is mastered (during gameplay), not on the next prestige. The `triggerPrestige` path is a defensive fallback for legacy saves that already had 10 challenges done before this code shipped.

2. **Divinity is only earned after Enlightenment unlocks.** The spec said "Award Divinity based on run performance (e.g., `Math.floor(score / 500 * stageMult)`)". I followed the formula literally. For a Galactic run with score ~5000 and stageMult=64, that's ~640 Divinity per prestige. With nodes costing 5-25 each, a player who has done the work to unlock Enlightenment can buy most nodes in 1-2 prestiges. This is intentional — Divinity is the currency for layers 2-8 (Transcendence, Genesis, Apotheosis, Singularity, Omnipotence, Divinity layers), so accumulating it now seeds those future layers.

3. **Route bonus stacks additively with archetype + challenge-mastery + foresight bonuses.** All four are independent additive multipliers applied to the production rate. This keeps the math simple and avoids multiplicative explosion.

4. **Route bonus applies to BOTH system production (tick) AND manual actions (performAction).** Same pattern as the existing archetype bonus — both auto and manual gain the route's benefit.

5. **Foresight nodes provide passive bonuses that stack with achievements + challenge mastery.** Most nodes grant +2-5% production (target: "production"), some grant per-resource bonuses (target: "resource" with resourceId). The `foresightBonus()` helper is function-overloaded so the same call works for both `production`/`manual`/`capacity`/`popGrowth` targets (no resourceId arg) and `resource` target (with resourceId arg).

6. **3 nodes are `implemented: false` (coming soon):** destiny_lock, compressed_frontiers, cosmic_relay. These represent future systems that would require more substantial implementation (route binding, stage skipping, auto-carry forward). They show in the tree but can't be purchased — gives the player a sense of the full Enlightenment arc.

7. **`spendDivinity(amount, nodeId)` is a low-level primitive.** The UI uses `purchaseForesightNode` (high-level) which does the full validation + deduction. The low-level `spendDivinity` is kept for future ritual/transaction uses (e.g., Transcendence layer's Offerings) per the design doc spec.

8. **Route selection is a toggle.** Click a route to bind it; click again to unbind. This lets the player change their mind mid-run. Re-selecting a different route swaps the bonus (only one route active at a time, since `selectedRoute` is a single string).

9. **Layer 2 "mastered" status** requires both: (a) all *implemented* foresight nodes purchased AND (b) a route chosen. This way the player can't skip the route choice — it's the central mechanic of the layer.

10. **Migration is defensive.** Old saves (pre-Task-19) load with `divinity: 0`, `selectedRoute: null`, `foresightNodes: {}`. If the player had all 10 challenges done before this code shipped, `enlightenmentUnlocked` is set to `true` immediately on load — so they get the button + modal without having to re-prestige.

## Verification Results
- `bun run lint`: **0 errors, 0 warnings** in project code (6 pre-existing warnings in `upload/logic.js` only, unrelated to this task).
- `npx tsc --noEmit`: **0 new errors introduced**. All 10 errors in `src/` are pre-existing (TutorialHints.tsx:68, stages.ts:125, store.ts:105/588-593/1024). Note: store.ts line numbers shifted because my additions inserted ~12 lines above them (was 93/557-562/888 in Task 15's worklog; now 105/574-593/945). Same errors, different line numbers.
- `bunx next dev --port 3000`: **HTTP 200** on `/` — page compiles and serves correctly with all my changes.

## Unresolved Issues / Risks
1. **No playtest verification yet.** Reaching the state where all 10 Evolution challenges are mastered is impractical in the dev environment (would require ~10 full Cell→Galactic playthroughs with voluntary debuffs). The unlock logic, story popup, modal opening, route selection, and node purchase are all unit-verifiable, but a full playtest is recommended.

2. **Divinity balance is unverified.** The formula `Math.floor(score / 500 * stageMult)` may be too generous — 640 Divinity per Galactic prestige buys most nodes in 1-2 runs. If this turns out to be too fast, the divisor can be bumped to 1000 or 2000. The currency is also intended to be spent in future layers (3-8), so accumulating it now is intentional — but the rate should be validated once layer 3 (Transcendence) is implemented.

3. **`destiny_lock` node is "coming soon" but its description says "Bind your chosen route — its bonus is doubled."** This implies a route-doubling mechanic. If implemented, the tick loop would need to detect this node and multiply the route bonus by 2. Currently the node is `implemented: false`, so the doubling does NOT occur. A future task should either implement it or remove the promise.

4. **`compressed_frontiers` node promises "Skip mastered stages on subsequent runs."** This would require a substantial new mechanic (similar to the Singularity layer's Compression, per the design doc). Marked as "coming soon" for now.

5. **Layer 3 (Transcendence) is still locked.** Per the design doc, Transcendence unlocks when "all Divinity foresight nodes + all required route archetypes" are completed. My Layer 2 "mastered" status checks "all implemented foresight nodes purchased AND route chosen" — this is a reasonable proxy but doesn't strictly match the design doc. A future task should refine this when Transcendence is implemented.

## Files Changed Summary
1. `src/game/data/foresight.ts` — NEW (~340 lines, 6 routes + 20 nodes + helpers)
2. `src/game/state/types.ts` — 5 new GameState fields + 4 new GameStore actions
3. `src/game/state/store.ts` — tick() route bonus, performAction() route bonus, triggerPrestige() Divinity award + Enlightenment unlock, checkChallengeCompletion() unlock detection, new actions (setShowEnlightenment, spendDivinity, selectRoute, purchaseForesightNode), techMultiplier() foresight bonus, migration
4. `src/game/data/story.ts` — new `enlightenment_unlocked` entry
5. `src/components/game/modals/EnlightenmentModal.tsx` — NEW (~430 lines)
6. `src/components/game/layout/GameShell.tsx` — EnlightenmentModal wired in
7. `src/components/game/layout/Header.tsx` — Divinity HeaderStat + Divinity button (desktop + mobile)
8. `src/components/game/tabs/PrestigeTab.tsx` — Layer 2 reveal with EnlightenmentLayerContent component
