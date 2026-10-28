# Task ID: RESTORE-BULK-FORGE-FUSE
# Agent: Z.ai Code (main)

## Task Summary
Restore three features lost in a repo reset:
1. Bulk Forge/Fuse on the Divine Engine screen (6 shop upgrades + 2 store actions + UI sections).
2. Forge Max cost formula fix (capture `initialForged` before the loop so the cost curve is `1.5^(initialForged + i)` instead of the buggy `1.5^(forged + i)` which doubled the exponent growth).
3. Debug spawn relic option (new `debugSpawnRelic` action + button in SettingsModal).

## Files Modified

### src/game/data/upgrades.ts (+77 lines)
- Added 6 new bulk forge/fuse shop upgrades in a new "BULK FORGE / FUSE" section:
  - `bulk_forge_10x` (100 Div) — unlocks Forge ×10 button
  - `bulk_forge_100x` (1000 Div) — unlocks Forge ×100 button
  - `bulk_forge_max` (10000 Div) — unlocks Forge Max button
  - `bulk_fuse_10x` (150 Div) — unlocks Fuse ×10 per tier
  - `bulk_fuse_100x` (1500 Div) — unlocks Fuse ×100 per tier
  - `bulk_fuse_max` (15000 Div) — unlocks Fuse Max per tier
- All L3+/transcendence-gated (`requiresLayer: "transcendence"`), `universal` category, `maxLevel: 1`, `costGrowth: 1.0`.
- Effect type `auto_mult` with `value: 0.0` — pure flag (matches `auto_balancer`, `auto_ascend`, `archetype_insight` precedent). The actual gating is done by checking `(s.upgrades[id] || 0) > 0` in the store/UI.

### src/game/state/types.ts (+15 lines)
- Added `forgeWorldBulk: (count: number) => void;` — JSDoc explains the `initialForged` capture fix.
- Added `fuseWorldsBulk: (targetTierId: string, count: number) => void;`.
- Added `debugSpawnRelic: () => void;` between `debugGenerateBoon` and `debugForcePrestige`.

### src/game/state/store.ts (~+155 lines)
- Added `forgeWorldBulk(count)` action:
  - Gating: `bulk_forge_10x` for any bulk (count > 1), `bulk_forge_100x` for count ≥ 100, `bulk_forge_max` for count === -1 ("forge max"). `debugFreeBuy` bypasses ALL upgrade gates (but NOT the layer gate).
  - count === 1 delegates to the single-forge path (`forgeWorld()`).
  - CRITICAL FIX: captures `initialForged = s.worldsForged` BEFORE the loop, then uses `initialForged + i` in the cost formula `ceil(50 × 1.5^(initialForged + i))`. The old version incremented `forged` each iteration, making the effective exponent `forged_initial + 2i` instead of `forged_initial + i` (cost curve doubled).
  - Stops early if Divinity runs out (unless debugFreeBuy).
  - Safety cap: 10000 per click.
  - Updates `divinity`, `worldsForged` (= initialForged + forged), and `worldTiers["1"]` in one `set()` call.
- Added `fuseWorldsBulk(targetTierId, count)` action:
  - Gating mirrors `forgeWorldBulk` (`bulk_fuse_10x`, `bulk_fuse_100x`, `bulk_fuse_max`).
  - count === 1 delegates to `fuseWorlds(targetTierId)`.
  - Layer-locked tier check (Void World requires L7+ / omnipotence).
  - Computes `maxBySource = floor(sourceAvailable / tier.sourceCount)` and caps at it AND 10000.
  - Single `set()` call to update `worldTiers` (subtracts `requested × sourceCount` from source, adds `requested` to target).
- Updated `debugUnlockAll`:
  - Was: only seeded 3 relics when the player had 0 relics (otherwise 0).
  - Now: if player has 0 relics, seed 3; if player has ≥1 relic, seed 1 more.
  - Log message reflects the actual count: `"{N} relic(s) seeded."`.
- Added `debugSpawnRelic` action:
  - Generates 1 fresh relic via `generateRelicReward(1)[0]` (already imported from genesisEngine).
  - Appends to `s.divineRelics` in a single `set()` call.
  - Logs `"DEBUG: Spawned 1 relic (rule: X, +Y)."` where X is the first rule's id and Y is the signed amount.
- Added persist migration backfill at the end of `migrate()`:
  - Loops through the 6 new bulk upgrade ids and sets them to 0 if missing. Idempotent — runs on every load.
  - Persists version stays at 18 (no schema change — just new keys).

### src/components/game/layout/DivineEngineFullTab.tsx (~+165 lines)
- Added imports: `Hammer`, `Merge`, `ChevronsRight` from lucide-react.
- Added store selectors: `worldsForged`, `upgrades`, `debugFreeBuy`, `forgeWorld`, `forgeWorldBulk`, `fuseWorlds`, `fuseWorldsBulk`.
- Computed bulk upgrade ownership flags (`hasBulkForge10`, `hasBulkForge100`, `hasBulkForgeMax`, `hasBulkFuse10`, `hasBulkFuse100`, `hasBulkFuseMax`) — each `true` if owned OR `debugFreeBuy` is on.
- Computed `nextForgeCost = ceil(50 × 1.5^worldsForged)`.
- Computed `maxForgeable` (number of affordable worlds from current divinity, capped at 10000) via a `useMemo` loop — exponential cost growth ensures the loop terminates quickly even with very large divinity.
- Computed `maxFusableByTier` — for each fusion tier with a source, `floor(sourceAvailable / sourceCount)` capped at 10000.
- **World Forge section** (between 3D visualization and World Archetype):
  - Header: "World Forge" with Hammer icon + "N forged lifetime" badge.
  - Description: "Each forged world costs ceil(50 × 1.5^forged) Divinity. Next: N Divinity → +1 Tier 1 world."
  - Buttons: Forge ×1 (always, disabled when can't afford), Forge ×10 (if `hasBulkForge10`), Forge ×100 (if `hasBulkForge100`), Forge Max (if `hasBulkForgeMax`) — Max button shows actual affordable count.
  - Footer hint: "Buy Bulk Forge ×10 in the shop to unlock bulk forging." (shows when not owned).
- **World Fusion section**:
  - Header: "World Fusion" with Merge icon.
  - For each fusion tier where `sourceTier !== null`:
    - Row: tier emoji, tier name, "N × Source → 1 (×M prod)", owned count badge, source count badge.
    - Buttons: ×1 (always), ×10 (if `hasBulkFuse10`), ×100 (if `hasBulkFuse100`), Max (if `hasBulkFuseMax`) — Max button shows actual count like "Max (362)".
    - Disabled when source count < sourceCount.
  - Footer hint: "Buy Bulk Fuse ×10 in the shop to unlock bulk fusing." (shows when not owned).
  - Long list handling: `max-h-96 overflow-y-auto` on the tier rows container.

### src/components/game/modals/SettingsModal.tsx (+9 lines)
- Added `debugSpawnRelic` selector near the existing debug action selectors.
- Added "Spawn Relic" button between "Generate Cosmic Boon" and "Force Prestige":
  - Button text: "Spawn Relic"
  - Title: "Spawn 1 fresh relic into the inventory (L10 Genesis Engine)"
  - Same styling as sibling debug buttons (amber border, hover bg).

## Verification
- `bun run lint`: 0 errors, 10 pre-existing warnings (all in unrelated files: scripts/playtest-*.js, upload/logic.js, src/game/data/galaxies.ts).
- Dev server: clean compiles, HTTP 200 on `/`.
- Persist version stays at 18 (no schema change). Existing saves auto-backfill the 6 new upgrade keys to 0 on next load.
- `debugFreeBuy` correctly bypasses upgrade gates in both the store actions AND the UI ownership checks (so debug testers can use all bulk buttons without buying the upgrades).

## Stage Summary
All three lost features are restored. The Forge Max cost formula bug is fixed (the `initialForged` capture is the canonical fix). The Divine Engine full tab now has interactive World Forge + World Fusion sections with bulk buttons gated by 6 new shop upgrades. The Settings modal has a Spawn Relic button for L10 Genesis Engine testing, and `debugUnlockAll` always tops up the relic inventory by at least 1.
