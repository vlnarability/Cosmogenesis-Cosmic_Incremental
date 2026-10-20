# Task ID: CONSTELLATION-REDESIGN-NOIRLAB — Star Map Redesign

## Agent: main (direct implementation)

## Task Summary
Major UI redesign of the L2 Enlightenment constellation star map to improve clarity, discoverability, and click-target accessibility. The user requested six concrete changes:

1. **Grey circles for stars** (not tiny 14px dots) — 18-20px grey circles with a subtle glow.
2. **More space between stars** — increase sky width from 3000px to 5000px and viewport height to `clamp(500px, 64vh, 900px)` (was `clamp(380px, 56vh, 700px)`) so stars at y=4 (top) and y=96 (bottom) are both reachable.
3. **NOIRLab constellation outlines** — when a constellation is fully lit, render the NOIRLab outline SVG from `/constellations/{cId}-outline.svg` as a subtle overlay (opacity 0.25, zIndex 1, behind the stars at zIndex 10+).
4. **Bring back the Expand button** — opens a full-screen overlay (fixed inset-0 z-[100]) with an even wider sky (EXPANDED_SKY_W = 8000px). Uses `Maximize2` / `Minimize2` icons from lucide-react.
5. **Every star must be clickable** — taller viewport (≥500px) ensures stars at y=4 and y=96 are both within the visible area.
6. **More visible constellation pattern lines** — thicker stroke (0.30 / 0.15 instead of 0.25 / 0.12) and higher opacity (1.0 / 0.45 instead of 0.9 / 0.35).

## Files Modified

### `src/components/game/modals/EnlightenmentModal.tsx`
- **Imports**: added `Maximize2`, `Minimize2` to the lucide-react import list.
- **Module-level constants**:
  - `SKY_W`: 3000 → 5000 (wider panorama for less star clustering)
  - Added `EXPANDED_SKY_W = 8000` (full-screen overlay uses an even wider sky)
  - Added `EXPANDED_SKY_H = 600` (documentary; actual height is `100%` of the flex-1 overlay body)
  - Added `EXPANDED_SKY_OFFSETS: number[] = [-EXPANDED_SKY_W, 0, EXPANDED_SKY_W]` (3-copy infinite-wrap trick for the expanded sky)
- **`wrapScrollX(x, w=SKY_W)`**: parameterized over the sky width so the same wrap helper drives both the standard and expanded skies.
- **Component state**: added `expanded: boolean` and `expandedScrollX: number` so opening/closing the Expand overlay doesn't jump the standard sky's scroll position.
- **Drag/pan handlers** (`onPointerDown`, `onPointerMove`, `handleScrollButton`, `panToConstellation`): each takes an `isExpanded = false` boolean parameter and dispatches to the correct scroll state (`scrollX` / `expandedScrollX`) and width (`SKY_W` / `EXPANDED_SKY_W`). The default `false` keeps existing call sites working.
- **`renderSkyInstance(offset, skyW)`**: refactored to take a `skyW` parameter so the same function renders both the standard sky (5000px) and the expanded sky (8000px). Key includes `skyW` so React can distinguish the two contexts.
- **NOIRLab outline overlay** (new, inside `renderSkyInstance`): for each `LABEL_ANCHORS` entry whose `cId` is in `constellationsCompleted`, compute the constellation's bounding box from its star coordinates (`minX/maxX/minY/maxY`), pad by 30% of width/height, and render `<img src="/constellations/{cId}-outline.svg" className="absolute pointer-events-none" style={{...opacity:0.25, objectFit:"contain", zIndex:1}}/>`. Horizontal positioning uses PIXELS (`(minX - padX) * skyW/100`), vertical positioning uses PERCENTAGE (`(minY - padY)%`) so the overlay scales with the viewport's height (same scheme as the star buttons).
- **SVG connection lines**: `strokeWidth` 0.25→0.30 (completed) / 0.12→0.15 (dim); `opacity` 0.9→1.0 (lit) / 0.35→0.45 (dim). The constellation pattern is now clearly visible.
- **Star button styling**: 14px → 18px grey circles with a subtle glow:
  - `background`: lit → accent (category color) / started → `#64748b` (slate-500, lighter grey) / unlit → `#475569` (slate-600, dark grey)
  - `boxShadow`: lit → `0 0 10px 3px ${accent}66, 0 0 4px 1px ${accent}` (double glow) / unlit → `0 0 4px 1px #94a3b855` (subtle grey glow on every star)
  - `border`: selected → `2px solid #fff` / lit → `1.5px solid ${accent}` / unlit → `1.5px solid #64748b` (visible grey ring on every star, so the star is always distinguishable from the background)
  - `cursor: pointer` and `zIndex: isSelected ? 20 : 10` preserved
- **Constellation name labels**: opacity bumped from 0.35/0.95 → 0.45/0.95 (dim labels slightly more visible).
- **Header**: added an Expand button (next to the Divinity badge) using `Maximize2` icon, `variant="outline" size="sm"`, violet border styling. Only rendered when `isUnlocked` is true. Calls `setExpanded(true)`.
- **Standard sky viewport**: height changed from `clamp(380px, 56vh, 700px)` to `clamp(500px, 64vh, 900px)`. Pointer handlers explicitly pass `false` as the `isExpanded` arg (`onPointerDown={(e) => onPointerDown(e, false)}` etc.). Scroll buttons pass `false` to `handleScrollButton`. Sidebar pan calls `panToConstellation(c.id, false)`.
- **`renderStarPopup()`** (new function, extracted from inline JSX): encapsulates the per-star purchase popup so it can be rendered in BOTH the standard view (when `!expanded`) AND the full-screen expanded overlay (when `expanded`). The function returns `null` if `selectedInfo` is null. The standard view now renders `{!expanded && renderStarPopup()}` and the expanded overlay renders `{expanded && renderStarPopup()}`. This avoids double-mounting the popup and ensures it appears in the correct stacking context (z-[80] inside the active view).
- **Full-screen expanded overlay** (new, rendered before the final `</>` of the component return): `fixed inset-0 z-[100] flex flex-col bg-[#020417]` containing:
  - **Top bar**: Eye icon, "Constellation Sky — Full Screen" title, progress subtitle (X/Y for L3, X/Y stars lit), Divinity badge, Exit button (Minimize2 icon, calls `setSelectedStar(null)` + `setExpanded(false)` to clear stray popup state).
  - **Sky viewport** (flex-1): same gradient as standard view; pointer handlers pass `true` as the `isExpanded` arg. Renders 3 sky instances via `EXPANDED_SKY_OFFSETS.map((off) => renderSkyInstance(off, EXPANDED_SKY_W))`. Arrow buttons are bigger (h-11 w-11 vs h-9 w-9) with larger icons (w-6 h-6 vs w-5 h-5). Legend and drag hint are also slightly larger.
  - **Per-star popup**: `{expanded && renderStarPopup()}` so clicks on stars in expanded mode pop up the purchase UI inside the overlay's stacking context.

## Files NOT modified (prerequisite assets already present)
- `public/constellations/*.svg` (176 files, 1.2MB total) — these NOIRLab outline + pattern SVGs were already in the public folder before this task started. They are not currently tracked in git (untracked, not gitignored); if the feature should work on a fresh clone, they need to be `git add`ed separately. They are 360×360 viewBox square SVGs with light-grey (`#bfbfbf`) strokes on transparent backgrounds.

## Verification
- `bun run lint`: 0 errors, 10 warnings (all pre-existing in unrelated files: `scripts/playtest-*.js`, `src/game/data/galaxies.ts`, `upload/logic.js`). No new warnings introduced by this change.
- Dev server log: file compiles cleanly (multiple `✓ Compiled in XXXms` entries after each save, no errors).
- Every star is reachable: with viewport height ≥500px and star coords in [0, 100], stars at y=0 are at pixel 0 (top edge) and stars at y=100 are at pixel 500 (bottom edge) — both within the visible area.

## Architecture Notes
- **Why `renderStarPopup()` is a function, not a variable**: calling the function from both the standard view (`{!expanded && renderStarPopup()}`) and the expanded overlay (`{expanded && renderStarPopup()}`) creates two separate React subtrees. The conditional rendering ensures only one is mounted at a time, so there's no double-backdrop issue. Using a function (vs `const starPopup = ...`) sidesteps the "can I render the same React element instance twice" question entirely.
- **Why the outline overlay mixes pixel/percentage positioning**: the constellation's bounding box is computed from normalized (0-100) star coords. Horizontal positioning uses PIXELS (`(minX - padX) * skyW / 100`) so the overlay stays aligned with the stars as the sky width changes (standard 5000px vs expanded 8000px). Vertical positioning uses PERCENTAGE (`(minY - padY)%`) so the overlay scales with the viewport's rendered height — same scheme as the star buttons themselves, which use `top: \`${fs.y}%\``.
- **Why object-fit: contain, not fill**: the NOIRLab outline SVGs have a 1:1 (360×360) viewBox. The constellation's bounding box is rarely square. `contain` preserves aspect ratio and fits the SVG inside the box; `fill` would stretch it anisotropically. The user explicitly asked for `contain`.
- **Why the popup z-index stays at 80 inside the expanded overlay**: the expanded overlay is `z-[100]` and creates a new stacking context. Inside that context, the popup at z-80 is the highest-stacked child (above the top bar and sky viewport, which are z-auto). The popup will appear above all other content within the overlay — exactly what we want.

## Follow-ups / Known Limitations
- The NOIRLab outline SVG is a 360×360 square bounding box approximation of the constellation's actual IAU shape — the outline won't pixel-perfectly align with the in-game star positions (which are packed for visual variety per category, not a literal equatorial projection). The opacity 0.25 + zIndex 1 (behind the stars at zIndex 10+) makes this acceptable as a "subtle overlay" per the user's spec.
- The expanded overlay's scroll position is independent of the standard view's scroll position (`expandedScrollX` vs `scrollX`). This is intentional — opening/closing Expand shouldn't jump the standard sky. But it also means the player has to re-pan to find their place when switching modes. Future enhancement: sync the two on expand/exit if desired.
