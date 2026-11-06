# Task 3 — L3 Engine visual fixes (WebGL fallback + archetype cards + fuse disabled UX)

**Agent**: Z.ai Code (main)
**Task ID**: 3
**Scope**: edit ONLY two files
- `src/components/game/layout/WorldVisualization3D.tsx` (was 649 lines → now 711 lines)
- `src/components/game/layout/DivineEngineFullTab.tsx` (was 513 lines → now 588 lines)

No other files touched. `DivineEnginePanel.tsx`, the game store, and the
archetypes data file are unchanged.

---

## What was fixed and where

### Blocker 1 — WebGL fallback (WorldVisualization3D.tsx)

A headless browser (or any browser with WebGL disabled) used to crash the
entire `DivineEngineFullTab` because `new THREE.WebGLRenderer({ antialias: true })`
at line ~213 was unguarded and would throw. Now there are two layers of
protection:

1. **Pre-flight probe** — a new `useEffect` runs once on mount and calls
   `detectWebGL()` (canvas `getContext("webgl") || getContext("experimental-webgl")`,
   wrapped in try/catch). Sets the new `webglAvailable` state (`null` =
   unknown / probing, `true` = available, `false` = unavailable).
2. **Defensive try/catch on the renderer init itself** — if a browser
   reports WebGL support but then fails at `WebGLRenderer` construction
   (driver crash, context loss, etc.), the catch flips `webglAvailable`
   to `false` and the effect returns early instead of throwing.

When `webglAvailable === false`, the component renders an empty-state
panel instead of the canvas:

```tsx
<div className="rounded-md border border-violet-400/20 bg-violet-500/5 p-4 text-center text-xs text-muted-foreground">
  <Layers className="w-6 h-6 mx-auto mb-2 opacity-60" />
  <div className="font-medium text-violet-200 mb-1">3D visualization unavailable</div>
  <div className="text-[0.65rem] leading-snug">
    WebGL is not available in this browser (or is disabled). The Divine Engine still works —
    you just can't see the 3D world mesh. {rawCount > 0 && <>Your {rawCount} worlds are still producing Divinity.</>}
  </div>
</div>
```

The panel respects the parent's `{rawCount > 0 && (...)}` gate in
DivineEngineFullTab — `WorldVisualization3D` is only mounted when there are
worlds to show, so reaching this branch means the player has worlds but
can't see the mesh. The defensive `rawCount > 0` check inside the panel is
for the case where the prop wasn't passed (back-compat).

**Exact edit locations in WorldVisualization3D.tsx:**

| Line | Edit |
|------|------|
| 35 | Added `Layers` to the lucide-react imports. |
| 166-172 | Extended `WorldVisualization3DProps` with optional `rawCount?: number`. |
| 174 | Destructured `rawCount` in the component signature. |
| 192-195 | Added `const [webglAvailable, setWebglAvailable] = useState<boolean \| null>(null);`. |
| 202-220 | Added the WebGL-detection `useEffect` with the `detectWebGL()` helper. |
| 227-231 | Added `if (!webglAvailable) return;` guard at the top of the setup `useEffect`. |
| 246-256 | Wrapped `new THREE.WebGLRenderer({ antialias: true })` in `try { ... } catch { setWebglAvailable(false); return; }`. |
| 431 | Added `webglAvailable` to the setup `useEffect` dependency array (was `[dots]`, now `[dots, webglAvailable]`). |
| 563-580 | Inserted the `if (webglAvailable === false) { return <fallback panel/>; }` block immediately before the main `return (`. |

### Blocker 2 — archetype dropdown → visual card grid (DivineEngineFullTab.tsx)

The old shadcn `<Select>` dropdown (lines 373-388 of the original file)
hid every archetype's glyph + bonus behind a single closed dropdown. It's
been replaced with a horizontal-scrolling row of cards so each archetype's
glyph + bonus hint is visible at a glance.

- **Removed import**: `Select, SelectContent, SelectItem, SelectTrigger, SelectValue`
  from `@/components/ui/select` (verified `Select` was used nowhere else in
  the file).
- **Added imports**: `Check` from lucide-react (for the active-state ✓ badge),
  `cn` from `@/lib/utils` (for conditional card classes).
- **New sub-components** at the bottom of the file:
  - `SelectArchetypeGrid` — renders the flex/overflow-x-auto container plus
    the "None" card plus one card per archetype.
  - `ArchetypeCard` — single card: `<button>` with `aria-pressed`, the glyph
    at `text-xl`, the name at `text-[0.65rem] font-medium truncate`, the
    hint at `text-[0.55rem] text-muted-foreground truncate`, active state
    `border-amber-400/60 bg-amber-500/10` + a ✓ badge in the top-right,
    inactive hover `hover:border-violet-400/40 hover:bg-violet-500/5`.
- **Bonus hint source**: `a.bonus.buffs[0]` (the first structured buff
  description — short and summarizes the playstyle). Falls back to
  `a.blurb` if `buffs` is empty (defensive).
- **"None" card**: glyph `∅`, name `None`, hint `no bonus`,
  `onClick={() => setWorldArchetype(null)}`.
- **Archetype card**: `onClick={() => setWorldArchetype(isActive ? null : a.id)}`
  — clicking the active card again clears it (toggle behavior).
- Card container uses `role="radiogroup" aria-label="World archetype"` and
  each card has `aria-pressed={isActive}` for a11y.

**Exact edit locations in DivineEngineFullTab.tsx:**

| Line | Edit |
|------|------|
| 8 | Removed the `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` import line. |
| 10-13 | Added `Check` to the lucide-react imports. |
| 15 | Added `import { cn } from "@/lib/utils";`. |
| 193 | Passed `rawCount={rawCount}` to `WorldVisualization3D` (for Blocker 1's fallback panel). |
| 381-384 | Replaced the `<Select>...</Select>` block with `<SelectArchetypeGrid activeWorldArchetype={...} setWorldArchetype={...} />`. |
| 475-553 | Added the new `SelectArchetypeGrid` + `ArchetypeCard` sub-component definitions (above the existing `SliderRow`). |

### Blocker 3 — better disabled state for unaffordable fuse buttons (DivineEngineFullTab.tsx)

The World Fusion card's ×1 / ×10 / ×100 / Max buttons used to rely on
shadcn's default `disabled:` styling (just opacity reduction). The player
couldn't tell at a glance why a button was greyed out. Now:

- Every fuse button gets `disabled:opacity-40 disabled:cursor-not-allowed disabled:saturate-0`
  — drains color saturation (greyscale look) AND makes the cursor explicitly
  not-allowed.
- The `title` attribute is now conditional and explains the threshold:
  - ×1: `Need ${tier.sourceCount} more ${sourceTier?.name} worlds to fuse (have ${sourceAvail})`
  - ×10: `Need ${tier.sourceCount * 10} ${sourceTier?.name} worlds to fuse 10× (have ${sourceAvail})`
  - ×100: `Need ${tier.sourceCount * 100} ${sourceTier?.name} worlds to fuse 100× (have ${sourceAvail})`
  - Max: `Need at least ${tier.sourceCount} ${sourceTier?.name} worlds to fuse (have ${sourceAvail})`
- The "Need X" inline hint was skipped — on a 28px (`h-7`) button the
  second line of text would either truncate or push the button height
  out and break the row alignment with the Owned/Src badges. The
  greyscale + cursor + title tooltip combination is sufficient at-a-glance
  signal per the spec ("If too cluttered, just rely on the title tooltip").

**Exact edit locations in DivineEngineFullTab.tsx:**

| Line | Edit |
|------|------|
| 312 | ×1 fuse button: added `disabled:opacity-40 disabled:cursor-not-allowed disabled:saturate-0` to className. |
| 313-315 | ×1 fuse button: made `title` conditional — explains the missing threshold when disabled. |
| 325 | ×10 fuse button: added the disabled visual treatment. |
| 326-328 | ×10 fuse button: conditional `title` with `tier.sourceCount * 10` threshold. |
| 339 | ×100 fuse button: added the disabled visual treatment. |
| 340-342 | ×100 fuse button: conditional `title` with `tier.sourceCount * 100` threshold. |
| 353 | Max fuse button: added the disabled visual treatment. |
| 354-356 | Max fuse button: conditional `title` with the minimum-threshold explanation. |

---

## Verification

### `bun run lint`

```
✖ 10 problems (0 errors, 10 warnings)
```

The 10 warnings are all in pre-existing files I did NOT touch
(`public/sw.js`, `scripts/playtest-*.js`, `upload/logic.js`). Neither
`WorldVisualization3D.tsx` nor `DivineEngineFullTab.tsx` produced any
errors or warnings.

### `npx tsc --noEmit`

Exit code 0. No output. Zero type errors.

### WebGL fallback code path

Manually traced the code path for the `webglAvailable === false` case:

1. On mount, the detection `useEffect` calls `detectWebGL()`. If it
   returns `false` (e.g. headless Chromium without `--use-gl=swiftshader`),
   `setWebglAvailable(false)` is called.
2. The state change re-renders the component. The new render hits
   `if (webglAvailable === false) return <fallback panel/>;` BEFORE the
   main `return (...)`, so the canvas wrapper + Three.js setup never
   mounts.
3. The setup `useEffect` also re-runs (because `webglAvailable` is in
   its dep array) and hits `if (!webglAvailable) return;` at line 231 —
   no `THREE.WebGLRenderer` is constructed, no crash.
4. If somehow the probe returned `true` but `new THREE.WebGLRenderer`
   throws anyway, the try/catch at line 251-256 catches it,
   `setWebglAvailable(false)`, returns — next render shows the fallback.

The fallback panel renders the `Layers` lucide icon, the headline
"3D visualization unavailable", and (when `rawCount > 0`) the reassurance
"Your N worlds are still producing Divinity." — all without WebGL.

### Dev server log

`dev.log` shows no errors related to `WorldVisualization3D` or
`DivineEngineFullTab`. The only `Module not found` warning in the log is
in `src/components/game/modals/TranscendenceModal.tsx` (line 55,
`import { cn } from "lib/utils"` — should be `@/lib/utils`), which is a
pre-existing issue in a file I'm forbidden to touch. The dev server still
compiles and serves `/` with 200 responses.

---

## Files NOT touched (constraint check)

- `src/components/game/layout/DivineEnginePanel.tsx` — unchanged.
- `src/game/state/store.ts` — unchanged.
- `src/game/data/archetypes.ts` — unchanged (read-only, for the
  `bonus.buffs[0]` hint source).
- `src/game/data/worldFusion.ts` — unchanged.
- No store actions, no data file changes, no other layout components.

## Imports preserved / cleaned

- In `DivineEngineFullTab.tsx`: removed the unused `Select` family import
  (was only used for the archetype picker); kept all other imports intact.
- In `WorldVisualization3D.tsx`: added `Layers` to lucide imports (needed
  by the fallback panel); all other imports preserved.
