# RESTORE-UI-CHANGES — L3 subtabs + top bar layout + tab consolidation

**Task ID**: RESTORE-UI-CHANGES
**Agent**: Z.ai Code (main)
**Branch**: main
**Quality gate**: `bun run lint` — 0 errors, 10 pre-existing warnings (all in unrelated files)

## Summary

Restored three lost UI features in the Evolution Idle game:

1. **L3 Market subtabs** — `TranscendenceModal.tsx` now has a 3-button subtab nav bar (Worlds / Boosts / Investments) that splits the previously 8-section-stacked modal into 3 navigable panes.

2. **Top bar layout** — `Header.tsx` now shows Trials + Shop as standalone top-bar buttons (between the Speed button and the gear dropdown). Shop is removed from the gear dropdown menu (it's now a top-bar button); Trials was already a top-bar button conceptually but lived inside the gear dropdown — now it's a real top-bar button when L1 is unlocked. Story was added to the gear dropdown (moved off the tab bar). Mobile gear dropdown gained a mobile-only Trials + Shop section (since mobile has no top bar).

3. **Tab consolidation** — `TabNav.tsx` collapsed from a two-row layout to a single row (main tabs + layer tabs only — no Shop, no Divine Engine, no Story). Layer merging: L4 Galaxy hides when L5 unlocks (content merged into the Universe tab); L5 Conquest (renamed to "Galactic Cluster") hides when L6 unlocks (merged into Universe); L9 War removed entirely (merged into the L7 Lab tab, which is renamed "War" with `<Swords>` icon); L10 Genesis Engine removed (merged into the Divine Engine sidebar/tab). Mobile bottom nav now shows ALL visible layer tabs (instead of just the "latest" one) and drops the standalone Shop + Story buttons. `GameShell.tsx` renders the merged content: `currentTab === "universe"` stacks GenesisContent + ApotheosisContent + SingularityContent; `currentTab === "lab"` stacks InfinityContent (if L9 unlocked) + OmnipotenceContent; `currentTab === "divine_engine"` stacks DivineEngineFullTab + EternityContent (if L10 unlocked). Back-compat preserved: `currentTab === "galaxy" | "conquest" | "war" | "genesis_engine"` still renders the single-layer content for old saves.

## Files modified

### 1. `src/components/game/modals/TranscendenceModal.tsx`

- **Imports**: added `import { cn } from "@/lib/utils";` (was not previously imported).
- **State**: added `const [subtab, setSubtab] = useState<"worlds" | "boosts" | "investments">("worlds");` near the existing `flameInvestAmount` state declaration.
- **Subtab nav bar**: inserted a 3-button nav bar (🌍 Worlds / ✨ Boosts / 📊 Investments) directly inside the unlocked-conditional `<div className="space-y-4">` wrapper. Each button uses `cn(...)` for active vs inactive styling (amber for active, muted for inactive).
- **Section wrapping**: wrapped each of the 8 `<section>` blocks in `{subtab === "..." && (...)}`:
  - Section 1 (Divine Engine Overview) → `worlds`
  - Section 2 (World Fusion) → `worlds`
  - Section 3 (Eternal Flame) → `boosts`
  - Section 4 (World Forge) → `worlds`
  - Section 5 (Convergence Catalysts) → `boosts`
  - Section 6 (World Templates) → `boosts`
  - Section 7 (Genesis Seeds) → `boosts`
  - Section 8 (Investment Portfolios) → `investments`
- The "ASTRAL RESONANCE REMOVED" comment marker between sections 7 and 8 is left outside any conditional (it's an informational comment with no content).
- The closing `</div>` for the `<div className="space-y-4">` wrapper now sits after the section-8 `)}` close.

### 2. `src/components/game/layout/Header.tsx`

- **Imports**: added `import { Badge } from "@/components/ui/badge";` (was not previously imported — needed for the Shop Divinity badge). Added `BookOpen` to the `lucide-react` import list (for the new Story menuitem in the gear dropdown).
- **State subscription**: added `const divinity = useGameStore((s) => s.divinity || 0);` after the existing `upgrades` selector.
- **Top-bar Trials button** (desktop only): added between the Speed cycle button and the Layers dropdown. Visible only when `unlockedChallenges` is truthy (i.e., L1 is unlocked). Uses `<Skull>` icon + "Trials" text label. `onClick={() => openLayerModal("challenges")}` (which flips `currentTab` to `"trials"` via `LAYER_TO_TAB`). `className="h-8 hidden sm:flex text-xs"` ensures desktop-only display.
- **Top-bar Shop button** (desktop only): added between the Trials button and the Layers dropdown. Always visible. Uses `<Store>` icon + "Shop" text label + amber Divinity badge (`<Badge variant="outline" className="ml-1 text-[0.6rem] text-amber-300 border-amber-400/40">{formatCompact(divinity)}</Badge>`). `onClick={() => setShowShop(true)}`.
- **Removed** the `Shop` menuitem from the gear dropdown (it's now a top-bar button).
- **Removed** any Trials menuitem from the gear dropdown (wasn't actually present, but the L1 entry used to live in the Layers section — kept as-is for mobile via the new mobile-only Trials + Shop section below).
- **Added Story menuitem** to the gear dropdown (right after Save), calling `setTab("story")`. Uses `<BookOpen>` icon.
- **Reordered Reference section** per task spec: order is now Codex → Archive → Awards → Log (was Log → Archive → Codex → Awards).
- **Mobile-only Trials + Shop section** in the gear dropdown: added inside `<span className="sm:hidden">` block, placed right after the existing mobile-only Layers section. Contains a Trials menuitem (gated by `unlockedChallenges`) and a Shop menuitem (with amber Divinity badge). Closes with a `<DropdownMenuSeparator />` for visual separation from the Save menuitem below.
- The gear dropdown's final structure (top to bottom): (mobile-only Layers section) → (mobile-only Trials + Shop section) → Save → Story → (separator + Reference label) → Codex → Archive → Awards → Log → (separator) → Settings. NO Shop, NO Trials outside the mobile-only section.

### 3. `src/components/game/layout/TabNav.tsx` (full rewrite)

- **Imports**: trimmed to only what's still used. Added `Swords` (for the renamed "War" / L7+L9 merged tab). Removed `BookOpen`, `Store`, `Skull`, `Atom`, `Infinity as InfinityIcon`, `Star`, `Globe` (no longer used — Story moved to gear dropdown, Shop moved to top bar, Trials moved to top bar, Atom was for the old "Lab" label, InfinityIcon was for the old "War" L9 tab, Star was for the old "Genesis Engine" L10 tab, Globe was for the old Divine Engine tab-bar button). Removed `formatCompact` import (no longer used — the Shop Divinity badge is now in the top bar, not the tab bar). Kept `Hand`, `Building2`, `FlaskConical` (for MAIN_TABS), `Eye`, `Triangle`, `Egg`, `Sparkles`, `Circle`, `Church` (for the surviving LAYER_TABS entries).
- **Removed** state selectors no longer used: `setShowShop`, `showShop`, `divinity` (all were for the Shop button).
- **MAIN_TABS**: unchanged (Actions, Systems, Tech).
- **REFERENCE_TABS**: set to empty array (Story moved to gear dropdown; Log/Archive/Codex/Awards already live in gear dropdown).
- **LAYER_TABS**: trimmed from 10 entries to 7:
  - `trials` (L1 challenges) → REMOVED (moved to top bar).
  - `constellations` (L2 enlightenment) → kept.
  - `market` (L3 transcendence) → kept.
  - `galaxy` (L4 genesis) → kept (HIDDEN when L5 unlocks).
  - `conquest` (L5 apotheosis) → kept, **renamed label** from "Conquest" to "Galactic Cluster" (HIDDEN when L6 unlocks).
  - `universe` (L6 singularity) → kept.
  - `lab` (L7 omnipotence) → kept, **renamed label** from "Lab" to "War", **icon changed** from `<Atom>` to `<Swords>`. Handles BOTH L7 (Omnipotence) AND L9 (Infinity) content (merged).
  - `diplomacy` (L8 divinity) → kept.
  - `war` (L9 infinity) → REMOVED (merged into `lab`).
  - `genesis-engine` (L10 eternity) → REMOVED (merged into `divine_engine` tab/sidebar button).
- **Visibility filter**: added two L4/L5 hiding rules — `galaxy` hides when `unlockedLayers.apotheosis` is true (L5 unlocks); `conquest` hides when `unlockedLayers.singularity` is true (L6 unlocks). The standard "shown when their layer is unlocked" rule applies to all others.
- **Desktop tab bar**: collapsed from two rows to a SINGLE ROW (main tabs + layer tabs, left-aligned, scrollable). Removed Row 2 entirely (no Divine Engine, no Story, no Shop). Removed the `ml-auto` Shop right-alignment (no Shop button).
- **Mobile bottom nav**: replaced the single "latest layer" button with the full `visibleLayerTabs.map(...)` (shows ALL visible layer tabs). Removed the standalone Story button. Removed the standalone Shop button.

### 4. `src/components/game/layout/GameShell.tsx`

- **`currentTab === "divine_engine"`**: changed from `{currentTab === "divine_engine" && <DivineEngineFullTab />}` to a Fragment that renders `<DivineEngineFullTab />` followed by `<EternityContent />` (only if `unlockedLayers?.eternity` is truthy). The EternityContent is wrapped in its own nested `<Suspense fallback={<InlineLayerLoading />}>` because DivineEngineFullTab is statically imported (not lazy) while EternityContent is lazy-loaded.
- **`currentTab === "universe"`** (RESTORE-UI-CHANGES — merged tab): now renders a Fragment with `<GenesisContent />` (if `unlockedLayers?.genesis`), `<ApotheosisContent />` (if `unlockedLayers?.apotheosis`), and `<SingularityContent />` (always — the tab is only visible at L6+).
- **`currentTab === "lab"`** (RESTORE-UI-CHANGES — merged "War" tab): now renders a Fragment with `<InfinityContent />` (if `unlockedLayers?.infinity`, rendered FIRST) and `<OmnipotenceContent />` (always — the tab is only visible at L7+).
- **Back-compat preserved**: `{currentTab === "galaxy" && <GenesisContent />}`, `{currentTab === "conquest" && <ApotheosisContent />}`, `{currentTab === "war" && <InfinityContent />}`, `{currentTab === "genesis_engine" && <EternityContent />}` all still render the single-layer content for old saves that have those tab ids stored in localStorage. Added inline comments documenting the back-compat intent.
- Did NOT add `useState` to GameShell — the task said "Add `useState` import to GameShell (for UniverseSubtabs if you implement subtabs)". I did not implement UniverseSubtabs (the merged content simply stacks vertically, no subtab switching), so `useState` is not needed and would have triggered an unused-import lint warning.

## Verification

- **`bun run lint`**: 0 errors, 10 pre-existing warnings (all in unrelated files: `scripts/playtest-*.js`, `upload/logic.js`, `src/game/data/galaxies.ts` — same baseline documented in prior worklog entries).
- **`bunx tsc --noEmit`**: Pre-existing TypeScript errors in unrelated files (`EnlightenmentModal`, `GenesisModal`, `PrestigeTab`, `store.ts`, `stages.ts`, etc.) remain — none introduced by this task. The single TS error in `TranscendenceModal.tsx(86,49)` (`cosmicFragments` on `GameStore`) is pre-existing code on a line I did not touch.

## Architecture notes

### Why L4/L5 merge into the Universe tab (not vice versa)

The task spec says L4 Galaxy → HIDDEN when L5 unlocks, L5 Conquest → HIDDEN when L6 unlocks. So the merging direction is UPWARD: lower layers fold into the next-higher visible tab. The Universe tab (L6 Singularity) is the "highest" of the three (Galaxy/Conquest/Universe) and absorbs the other two. This is consistent with the way prestige layers stack — by the time L6 unlocks, the L4 + L5 content is still meaningful (the player still has those systems running in the background) but doesn't need its own tab.

### Why L9 merges into L7 (not the other way around)

The task spec says L9 War → HIDDEN when L9 unlocks + L7 already unlocked (merged into Lab). Since L7 must be unlocked before L9 (prestige progression is strictly hierarchical), the condition "L9 unlocks + L7 already unlocked" is just "L9 unlocks". So when L9 unlocks, the standalone L9 War tab disappears, and the L7 Lab tab (now renamed "War" with `<Swords>`) absorbs the L9 content. The merged tab's `layerId` is still `"omnipotence"` (L7) because that's the lower layer — the tab is shown as soon as L7 unlocks, and L9 content appears inside it once L9 unlocks too. The display order is L9 FIRST then L7 (per task spec) so the player's most-recently-unlocked content is at the top.

### Why L10 merges into the Divine Engine tab (not a separate tab)

The task spec says L10 Genesis Engine → REMOVED from tab bar entirely (merges into Divine Engine sidebar). The Divine Engine sidebar already has an "Enter Divine Engine" button (`DivineEnginePanel.tsx` line 240-251) that calls `setTab("divine_engine")`. So L10 Eternity content is now accessible via that sidebar button (which leads to the `divine_engine` tab). GameShell renders `DivineEngineFullTab` + (if L10 unlocked) `EternityContent` in the `divine_engine` tab. This frees up tab-bar space (was getting crowded at L7+).

### Why mobile bottom nav shows ALL visible layer tabs (not just the latest)

The old behavior showed only the single "latest" layer tab in the mobile bottom nav (to save horizontal space). But with the layer merging (L4 + L5 hidden at L6+, L9 hidden, L10 hidden), the total number of visible layer tabs is much smaller now — at most 7 (constellations, market, galaxy, conquest, universe, lab, diplomacy) and usually 4-5 after merging kicks in. That fits comfortably in a mobile bottom nav with horizontal scroll. So we show all visible layer tabs instead of just the latest, giving mobile players direct access to every layer they've unlocked.

## Files modified

- `src/components/game/modals/TranscendenceModal.tsx` (+30 lines: cn import, subtab state, 3-button nav bar, 8 section conditional wrappers)
- `src/components/game/layout/Header.tsx` (+70 lines, -25 lines net: Badge + BookOpen imports, divinity subscription, top-bar Trials + Shop buttons, mobile-only Trials + Shop gear section, Story menuitem, reordered Reference section, removed Shop menuitem)
- `src/components/game/layout/TabNav.tsx` (full rewrite, ~225 lines: single-row layout, trimmed LAYER_TABS, renamed "Galactic Cluster" + "War" with Swords, layer-merging visibility filter, mobile bottom nav shows all visible layer tabs)
- `src/components/game/layout/GameShell.tsx` (+45 lines, -7 lines net: divine_engine tab now renders DivineEngineFullTab + EternityContent, universe tab renders merged L4+L5+L6, lab tab renders merged L9+L7, back-compat comments for galaxy/conquest/war/genesis_engine)
