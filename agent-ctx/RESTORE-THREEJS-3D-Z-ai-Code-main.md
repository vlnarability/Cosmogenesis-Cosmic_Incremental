# Task RESTORE-THREEJS-3D — Agent Work Record

**Agent**: Z.ai Code (main)
**Task ID**: RESTORE-THREEJS-3D
**Goal**: Replace the CSS 3D-transforms world visualization in the Divine Engine tab with a real Three.js renderer. CSS 3D transforms only position flat 2D billboards in 3D space (they always face the camera regardless of rotation); the user explicitly asked for actual 3D sphere meshes that rotate in 360°.

## What changed

### 1. Installed Three.js
- `bun add three` (three@0.186.1)
- `bun add -d @types/three` (@types/three@0.186.0)

### 2. New file: `src/components/game/layout/WorldVisualization3D.tsx` (407 lines)

Real Three.js renderer. Exports:
- `WorldVisualization3D` component (default export of the file)
- `computeWorldDots(worldTiers)` — deterministic 3D position generator (mulberry32 PRNG, sqrt-radius distribution for galaxy-look, radius range 60..380)
- `WorldDot` interface (x, y, z, tier, color, size)
- `TIER_COLORS` and `TIER_RADII` const maps (also exported for future use)

Scene graph:
- `THREE.Scene` with dark background color `0x050518`
- `THREE.PerspectiveCamera` (50° FOV, near 0.1, far 5000, position (400, 200, 500) → distance from origin ≈ 670.8)
- `THREE.WebGLRenderer` with antialiasing, devicePixelRatio scaling, ResizeObserver for responsive resize

3-light setup (creates real specular highlights + shadow gradients that rotate with the scene — proving the geometry is real 3D, not billboards):
- `AmbientLight(0x404060, 0.6)` — cool ambient fill
- `DirectionalLight(0xffffff, 1.2)` at (300, 400, 300) — key light from upper-front-right
- `DirectionalLight(0x6080ff, 0.4)` at (-200, -100, -200) — blue rim light from lower-back-left

World spheres:
- `THREE.InstancedMesh` of `SphereGeometry(1, 16, 12)` + `MeshStandardMaterial({ metalness: 0.3, roughness: 0.5 })`
- All worlds drawn in **1 draw call** regardless of count (200+ spheres → 1 draw call). GPU memory is tiny because material + geometry are shared.
- Per-instance transform matrix (position + uniform scale via `setMatrixAt`) and per-instance color (via `setColorAt` + `instanceColor`).
- `instanceMatrix.setUsage(THREE.StaticDrawUsage)` since positions don't change between re-renders.

Background starfield:
- `THREE.Points` with 200 vertices at radius 500–700 (mulberry32 seeded with 0x12345678)
- `THREE.PointsMaterial({ color: 0xffffff, size: 2.5, transparent: true, opacity: 0.5, sizeAttenuation: true, depthWrite: false })`

Controls:
- `OrbitControls` from `three/examples/jsm/controls/OrbitControls.js`
- `enableDamping = true`, `dampingFactor = 0.08`, `enablePan = false`
- `minDistance = 200`, `maxDistance = 1500`
- `rotateSpeed = 0.6`, `zoomSpeed = 0.8`
- Drag to rotate 360° in any direction; wheel to zoom; no panning.

Auto-rotate:
- 6°/s (= 0.1047 rad/s) on Y axis, applied to both `instMesh.rotation.y` and `stars.rotation.y` so the entire scene rotates together.
- `autoRotateRef` (useRef) — disabled on `pointerdown` event (user started dragging), re-enabled on Reset button click. Stored as a ref so the animation loop reads the latest value without re-creating the loop.
- Animation loop is `requestAnimationFrame`-driven with dt clamped to 0.1s to avoid jumps after tab switches.

UI overlay (matches the previous CSS version exactly):
- Top-left: "Drag · scroll to zoom" badge + zoom controls (ZoomOut button + display "X.XX×" + ZoomIn button) + Reset button. All `pointer-events-auto` so the user can click them while the canvas is below.
- Bottom-left: tier legend (filtered to non-zero tiers), `pointer-events-none`.
- Zoom display is computed as `DEFAULT_CAM_DIST / currentCamDistance` (1.00× baseline = 670.8 units). Range: 0.45× (max distance 1500) to 3.35× (min distance 200) — matches the old CSS zoom factor range (0.4 to 3.0).
- Reset button: restores `camera.position` to `(400, 200, 500)`, `controls.target` to `(0, 0, 0)`, calls `controls.update()`, sets `autoRotateRef.current = true`, resets display to "1.00×".
- Zoom buttons: move the camera radially toward/away from the target (multiply position by `newDist/dist`), 100 units per click.

Cleanup (in useEffect return):
- `cancelAnimationFrame(raf)`
- `ro.disconnect()` (ResizeObserver)
- `removeEventListener("pointerdown", onPointerDown)` on the canvas
- `removeEventListener("end", updateZoomDisplay)` on controls
- `controls.dispose()`
- `sphereGeo.dispose()` + `worldMat.dispose()` + `stars.geometry.dispose()` + `stars.material.dispose()`
- `renderer.dispose()` + remove canvas from mount if still attached
- Set `controlsRef.current = null`

### 3. Updated `src/components/game/layout/DivineEngineFullTab.tsx`

Before: 856 lines (inline CSS-3D `WorldVisualization3D` component + helper functions).
After: 515 lines (visualizer extracted).

Changes:
- Removed the inline `WorldVisualization3D` function (~252 lines).
- Removed helper functions: `mulberry32`, `computeStarfield`, the `computeWorldDots` redefinition, the `WorldDot` interface redefinition, `TIER_SIZES` const, `ZOOM_MIN/ZOOM_MAX/ZOOM_STEP` consts.
- Trimmed React hook imports to just `useMemo` (the inline component used `useEffect`, `useRef`, `useState`, `useCallback` — no longer needed).
- Trimmed lucide-react imports: removed `RotateCcw, Orbit, ZoomIn, ZoomOut` (only used by the now-extracted visualization).
- Added: `import { WorldVisualization3D, computeWorldDots, type WorldDot } from "./WorldVisualization3D";`
- Updated header docstring to describe the new Three.js renderer.
- Kept `TIER_COLORS` const at the top of the file (per task instruction — for future use by World Fusion row accents).
- Re-exported `WorldDot` type from this module so external consumers that import via `DivineEngineFullTab` can still reach it.
- The `dots` variable remains `useMemo(() => computeWorldDots(worldTiers), [worldTiers])` (now from the imported function).
- The visualization block at the bottom is now `<WorldVisualization3D dots={dots} />`.
- Updated the section subtitle text from "each dot is a world, colored by fusion tier" to "each sphere is a 3D world mesh, lit by ambient + key + rim directional lights" so users know what they're seeing.

## Verification

- **`bun run lint`**: 0 errors, 10 pre-existing warnings (all in unrelated files: scripts/playtest-*.js, upload/logic.js, src/game/data/galaxies.ts).
- **`bun build --target=browser src/components/game/layout/WorldVisualization3D.tsx`**: Bundled 66 modules in 70ms, output 2.27 MB. Three.js classes (WebGLRenderer, InstancedMesh, OrbitControls) appear 72 times in the output — confirming the Three.js dependency is correctly bundled.
- **`bun build --target=browser src/components/game/layout/DivineEngineFullTab.tsx`**: Bundled 145 modules in 75ms, output 2.55 MB. Confirms the import path resolves and all transitive imports are valid.
- **`bunx tsc --noEmit`** on the full project: no errors in either of my files. Pre-existing errors in other files (EnlightenmentModal, GenesisModal, store.ts, etc.) are unrelated.
- **Dev server log**: Next.js 16.1.3 Turbopack starts cleanly, ready in 684 ms. Earlier successful run: `GET / 200 in 6.7s (compile: 6.3s, render: 397ms)` — compile time grew from 4.8s to 6.3s due to Three.js being added to the bundle graph, but no errors.

## Why this is a real 3D fix

The old CSS 3D-transforms approach positioned flat 2D `<div>` elements in 3D space using `translate3d(x, y, z)` + `rotateX/rotateY` on the parent. The dots themselves had no rotation — they were billboards that always faced the camera. When the user dragged to rotate the scene, the dots translated in 3D space but never showed their "back side" because there was no back side. There were no specular highlights, no shadow gradients, no actual 3D geometry.

The new Three.js renderer:
- Renders actual `SphereGeometry` (16 latitude segments × 12 longitude segments) — true 3D meshes with front + back surfaces.
- Uses `MeshStandardMaterial` (metalness 0.3, roughness 0.5) — physically-based shading that responds to the 3-light setup.
- Lit by ambient + key directional + rim directional lights — specular highlights form on the side facing the key light, shadow gradients form on the opposite side. When the user drags to rotate, these highlights + shadows rotate with the scene (the lights stay world-space, the spheres rotate). This is impossible with CSS 3D transforms.
- Background starfield is also a real `THREE.Points` geometry that rotates with the world spheres — proper parallax depth.
- `OrbitControls` provides professional camera controls: damping, no panning, zoom limits, drag-to-rotate from any angle including the bottom (looking up at the spheres from below).
