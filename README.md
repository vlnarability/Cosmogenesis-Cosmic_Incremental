# Cosmogenesis — A Cosmic Incremental

A narrative-driven incremental game about a god awakening. Guide civilization from single-cell organisms to galactic transcendence across 7 stages and 10 divine layers.

## Tech Stack

- **Framework**: Next.js 16 with App Router (Turbopack)
- **Language**: TypeScript 5
- **State**: Zustand with localStorage persistence
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York style)
- **3D**: Three.js (world visualization)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (package manager + runtime)
- Node.js 18+

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```

The dev server starts on `http://localhost:3000`.

### Build

```bash
bun run build
```

### Lint

```bash
bun run lint
```

## Game Architecture

```
src/
  app/                    # Next.js App Router
    page.tsx              # Game entry — renders <GameShell/>
    layout.tsx            # Root layout + metadata
    globals.css           # Theme tokens + cosmic styling
  game/
    data/                 # Game data (systems, techs, archetypes, etc.)
    state/
      store.ts            # Zustand store with persist (8K+ lines)
      types.ts            # TypeScript types for game state
    hooks/
      useGameLoop.ts       # requestAnimationFrame game loop driver
  components/
    game/
      layout/             # Header, TabNav, ResourceBar, etc.
      tabs/               # Actions, Systems, Tech, Story, etc.
      modals/             # Shop, Settings, layer modals
      shared/             # Format helpers, EmptyState, etc.
```

## Game Features

- **7 Stages**: Cell → Creature → Tribal → Civilization → Empire → Solar → Galactic
- **10 Prestige Layers**: Trials → Constellations → Transcendence → Genesis → Apotheosis → Singularity → Omnipotence → Divinity → Infinity → Eternity
- **13 Archetypes** with either/or tech paths
- **88 IAU Constellations** with NOIRLab star maps
- **Divine Engine** with 3D world visualization (Three.js)
- **Divine Pantheon** with 5 avatar slots + domains
- **Evolution Sliders** (10-point shared pool across 4 sliders)
- **Bulk Forge/Fuse** with shop-unlockable multipliers
- **Save System**: localStorage with versioned migrations (v1→v18)

## Deployment

This project deploys to Vercel as a standard Next.js app. The `vercel.json` specifies the Next.js framework. No additional services are needed.

```bash
# Deploy via Vercel CLI
vercel --prod
```

## Save Data

All game state is stored in `localStorage` under the key `evolution_idle_v2`. The save system includes versioned migrations that handle upgrades from older save formats. Saves persist across browser sessions.

## License

All rights reserved.
