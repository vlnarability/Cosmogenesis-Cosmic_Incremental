// ============================================================
// THEME SYSTEM
// Stage themes (7) — unlocked when reaching each stage.
// Layer overlay themes (10) — unlocked when each prestige layer unlocks.
// Special themes (3) — unlocked by special conditions.
// Mini themes (20) — ORGANELLES-THEMES: 7 base + 13 archetype.
// ============================================================

export interface ThemeDef {
  id: string;
  name: string;
  desc: string;
  // CSS variable overrides (applied as `.theme-<id>` class)
  vars: {
    "--background"?: string;
    "--foreground"?: string;
    "--card"?: string;
    "--card-foreground"?: string;
    "--primary"?: string;
    "--primary-foreground"?: string;
    "--accent"?: string;
    "--accent-foreground"?: string;
    "--border"?: string;
    "--muted"?: string;
    "--muted-foreground"?: string;
    "--ring"?: string;
    "--secondary"?: string;
    "--secondary-foreground"?: string;
    "--popover"?: string;
    "--popover-foreground"?: string;
    "--input"?: string;
    "--destructive"?: string;
    "--chart-1"?: string;
    "--chart-2"?: string;
    "--chart-3"?: string;
    "--chart-4"?: string;
    "--chart-5"?: string;
    [key: `--${string}`]: string | undefined;
  };
  // Optional background gradient (CSS value)
  bgGradient?: string;
  // Category — controls how the theme is layered on top of others
  kind: "stage" | "layer" | "special";
  // ORGANELLES-THEMES — optional extra CSS class applied alongside the
  // `theme-<id>` class. The "AI" mini-theme uses this to opt into extra
  // glassmorphism / glow / icon-in-box styling.
  extraClass?: string;
}

// ----------------------------------------------------------------
// 7 STAGE THEMES
// ----------------------------------------------------------------

export const STAGE_THEMES: ThemeDef[] = [
  {
    id: "stage-cell",
    name: "Primordial",
    desc: "Cyan/teal on deep ocean blue. The first spark in the dark.",
    kind: "stage",
    vars: {
      "--background": "oklch(0.14 0.015 260)",
      "--foreground": "oklch(0.88 0.012 80)",
      "--card": "oklch(0.17 0.018 260)",
      "--card-foreground": "oklch(0.90 0.012 80)",
      "--primary": "oklch(0.70 0.14 195)",   // cyan
      "--primary-foreground": "oklch(0.10 0.02 200)",
      "--accent": "oklch(0.65 0.12 200)",
      "--accent-foreground": "oklch(0.10 0.02 200)",
      "--border": "oklch(0.28 0.015 260)",
      "--muted": "oklch(0.21 0.012 260)",
      "--muted-foreground": "oklch(0.62 0.015 260)",
      "--ring": "oklch(0.55 0.12 195)",
    },
    bgGradient: "radial-gradient(ellipse at top, #0c4a6e 0%, #082f49 40%, #020617 100%)",
  },
  {
    id: "stage-creature",
    name: "Wilderness",
    desc: "Green/amber on forest dark. The first body learns to move.",
    kind: "stage",
    vars: {
      "--background": "oklch(0.12 0.02 150)",
      "--foreground": "oklch(0.88 0.02 120)",
      "--card": "oklch(0.15 0.025 150)",
      "--card-foreground": "oklch(0.90 0.02 120)",
      "--primary": "oklch(0.68 0.15 120)",   // green
      "--primary-foreground": "oklch(0.10 0.02 120)",
      "--accent": "oklch(0.65 0.10 60)",     // amber
      "--accent-foreground": "oklch(0.10 0.02 60)",
      "--border": "oklch(0.25 0.02 150)",
      "--muted": "oklch(0.20 0.018 150)",
      "--muted-foreground": "oklch(0.62 0.02 150)",
      "--ring": "oklch(0.55 0.12 120)",
    },
    bgGradient: "radial-gradient(ellipse at top, #365314 0%, #1a2e05 40%, #0a0f02 100%)",
  },
  {
    id: "stage-tribal",
    name: "Hearth",
    desc: "Warm orange/red on dark brown. Fire is remembered.",
    kind: "stage",
    vars: {
      "--background": "oklch(0.13 0.025 40)",
      "--foreground": "oklch(0.88 0.02 50)",
      "--card": "oklch(0.16 0.03 40)",
      "--card-foreground": "oklch(0.90 0.02 50)",
      "--primary": "oklch(0.68 0.16 45)",   // orange
      "--primary-foreground": "oklch(0.10 0.02 40)",
      "--accent": "oklch(0.62 0.18 25)",   // red
      "--accent-foreground": "oklch(0.95 0.01 50)",
      "--border": "oklch(0.26 0.025 40)",
      "--muted": "oklch(0.20 0.022 40)",
      "--muted-foreground": "oklch(0.62 0.025 40)",
      "--ring": "oklch(0.55 0.14 45)",
    },
    bgGradient: "radial-gradient(ellipse at top, #7c2d12 0%, #431407 40%, #1c0701 100%)",
  },
  {
    id: "stage-civilization",
    name: "Empire",
    desc: "Gold/white on dark stone. Cities learn to dream.",
    kind: "stage",
    vars: {
      "--background": "oklch(0.13 0.018 70)",
      "--foreground": "oklch(0.90 0.015 80)",
      "--card": "oklch(0.16 0.02 70)",
      "--card-foreground": "oklch(0.92 0.015 80)",
      "--primary": "oklch(0.78 0.14 80)",   // gold
      "--primary-foreground": "oklch(0.12 0.02 70)",
      "--accent": "oklch(0.70 0.10 50)",
      "--accent-foreground": "oklch(0.12 0.02 70)",
      "--border": "oklch(0.27 0.02 70)",
      "--muted": "oklch(0.20 0.018 70)",
      "--muted-foreground": "oklch(0.62 0.02 70)",
      "--ring": "oklch(0.62 0.12 80)",
    },
    bgGradient: "radial-gradient(ellipse at top, #713f12 0%, #422006 40%, #1a1003 100%)",
  },
  {
    id: "stage-empire",
    name: "Conquest",
    desc: "Crimson/steel on dark grey. Distance begins to obey.",
    kind: "stage",
    vars: {
      "--background": "oklch(0.13 0.018 270)",
      "--foreground": "oklch(0.88 0.012 70)",
      "--card": "oklch(0.16 0.02 270)",
      "--card-foreground": "oklch(0.90 0.012 70)",
      "--primary": "oklch(0.62 0.18 25)",   // crimson
      "--primary-foreground": "oklch(0.95 0.01 70)",
      "--accent": "oklch(0.65 0.10 250)",   // steel
      "--accent-foreground": "oklch(0.12 0.02 250)",
      "--border": "oklch(0.27 0.02 270)",
      "--muted": "oklch(0.20 0.018 270)",
      "--muted-foreground": "oklch(0.62 0.015 270)",
      "--ring": "oklch(0.55 0.14 25)",
    },
    bgGradient: "radial-gradient(ellipse at top, #581c87 0%, #3b0764 40%, #1a0335 100%)",
  },
  {
    id: "stage-solar",
    name: "Cosmos",
    desc: "Violet/blue on deep space black. The sky stops being a wall.",
    kind: "stage",
    vars: {
      "--background": "oklch(0.10 0.025 280)",
      "--foreground": "oklch(0.88 0.02 250)",
      "--card": "oklch(0.13 0.03 280)",
      "--card-foreground": "oklch(0.90 0.02 250)",
      "--primary": "oklch(0.65 0.16 280)",   // violet
      "--primary-foreground": "oklch(0.10 0.02 280)",
      "--accent": "oklch(0.65 0.14 230)",   // blue
      "--accent-foreground": "oklch(0.10 0.02 230)",
      "--border": "oklch(0.24 0.025 280)",
      "--muted": "oklch(0.18 0.022 280)",
      "--muted-foreground": "oklch(0.60 0.02 280)",
      "--ring": "oklch(0.55 0.14 280)",
    },
    bgGradient: "radial-gradient(ellipse at top, #312e81 0%, #1e1b4b 30%, #030712 100%)",
  },
  {
    id: "stage-galactic",
    name: "Galaxy",
    desc: "Iridescent/rainbow on pure black. The galaxy takes a shape.",
    kind: "stage",
    vars: {
      "--background": "oklch(0.08 0.03 300)",
      "--foreground": "oklch(0.92 0.02 280)",
      "--card": "oklch(0.12 0.035 300)",
      "--card-foreground": "oklch(0.92 0.02 280)",
      "--primary": "oklch(0.70 0.18 320)",   // magenta
      "--primary-foreground": "oklch(0.10 0.02 300)",
      "--accent": "oklch(0.70 0.18 200)",   // cyan accent
      "--accent-foreground": "oklch(0.10 0.02 200)",
      "--border": "oklch(0.24 0.03 300)",
      "--muted": "oklch(0.18 0.025 300)",
      "--muted-foreground": "oklch(0.62 0.025 300)",
      "--ring": "oklch(0.60 0.16 320)",
    },
    bgGradient: "radial-gradient(ellipse at top, #312e81 0%, #1e1b4b 30%, #030712 100%)",
  },
];

// ----------------------------------------------------------------
// 10 LAYER OVERLAY THEMES (subtle — only adjust primary/ring/accent)
// ----------------------------------------------------------------

export const LAYER_THEMES: ThemeDef[] = [
  {
    id: "layer-evolution",
    name: "Trial",
    desc: "Amber overlay. Warm glow of the first trial.",
    kind: "layer",
    vars: {
      "--primary": "oklch(0.72 0.15 55)",   // amber
      "--accent": "oklch(0.68 0.12 55)",
      "--ring": "oklch(0.60 0.12 55)",
    },
  },
  {
    id: "layer-enlightenment",
    name: "Awakening",
    desc: "Violet overlay. Psychic glow of foresight.",
    kind: "layer",
    vars: {
      "--primary": "oklch(0.70 0.15 285)",  // violet
      "--accent": "oklch(0.66 0.13 285)",
      "--ring": "oklch(0.58 0.13 285)",
    },
  },
  {
    id: "layer-transcendence",
    name: "Sacrifice",
    desc: "Rose overlay. Blood-tinged remembrance.",
    kind: "layer",
    vars: {
      "--primary": "oklch(0.68 0.16 15)",   // rose
      "--accent": "oklch(0.64 0.14 15)",
      "--ring": "oklch(0.58 0.14 15)",
    },
  },
  {
    id: "layer-genesis",
    name: "Genesis",
    desc: "Cyan overlay. World-shaping radiance.",
    kind: "layer",
    vars: {
      "--primary": "oklch(0.72 0.15 195)",
      "--accent": "oklch(0.68 0.13 195)",
      "--ring": "oklch(0.58 0.13 195)",
    },
  },
  {
    id: "layer-apotheosis",
    name: "Worship",
    desc: "Gold overlay. Divine radiance.",
    kind: "layer",
    vars: {
      "--primary": "oklch(0.80 0.14 80)",   // gold
      "--accent": "oklch(0.72 0.12 70)",
      "--ring": "oklch(0.65 0.12 80)",
    },
  },
  {
    id: "layer-singularity",
    name: "System",
    desc: "Emerald overlay. Digital matrix glow.",
    kind: "layer",
    vars: {
      "--primary": "oklch(0.72 0.16 165)",  // emerald
      "--accent": "oklch(0.66 0.14 165)",
      "--ring": "oklch(0.58 0.14 165)",
    },
  },
  {
    id: "layer-omnipotence",
    name: "Hybrid",
    desc: "Orange overlay. Fusion energy of two archetypes.",
    kind: "layer",
    vars: {
      "--primary": "oklch(0.72 0.16 55)",   // orange
      "--accent": "oklch(0.66 0.14 35)",
      "--ring": "oklch(0.58 0.14 55)",
    },
  },
  {
    id: "layer-divinity",
    name: "Prayer",
    desc: "Pink overlay. Devotional warmth.",
    kind: "layer",
    vars: {
      "--primary": "oklch(0.74 0.16 5)",   // pink
      "--accent": "oklch(0.68 0.14 15)",
      "--ring": "oklch(0.60 0.14 5)",
    },
  },
  {
    id: "layer-infinity",
    name: "Echo",
    desc: "Teal overlay. Temporal shimmer of past selves.",
    kind: "layer",
    vars: {
      "--primary": "oklch(0.72 0.14 180)", // teal
      "--accent": "oklch(0.66 0.12 180)",
      "--ring": "oklch(0.58 0.13 180)",
    },
  },
  {
    id: "layer-eternity",
    name: "Testament",
    desc: "White/gold overlay. Final radiance of the eternal.",
    kind: "layer",
    vars: {
      "--primary": "oklch(0.92 0.04 80)",  // near-white gold
      "--primary-foreground": "oklch(0.15 0.02 80)",
      "--accent": "oklch(0.85 0.08 80)",
      "--ring": "oklch(0.78 0.10 80)",
    },
  },
];

// ----------------------------------------------------------------
// 3 SPECIAL THEMES — unlocked by special conditions
// ----------------------------------------------------------------

export const SPECIAL_THEMES: ThemeDef[] = [
  {
    id: "special-void",
    name: "Void",
    desc: "Pure black/white. Minimal monochrome. Reach Galactic to unlock.",
    kind: "special",
    vars: {
      "--background": "oklch(0.06 0 0)",
      "--foreground": "oklch(0.95 0 0)",
      "--card": "oklch(0.10 0 0)",
      "--card-foreground": "oklch(0.95 0 0)",
      "--popover": "oklch(0.11 0 0)",
      "--popover-foreground": "oklch(0.95 0 0)",
      "--primary": "oklch(0.88 0 0)",
      "--primary-foreground": "oklch(0.08 0 0)",
      "--secondary": "oklch(0.16 0 0)",
      "--secondary-foreground": "oklch(0.95 0 0)",
      "--muted": "oklch(0.14 0 0)",
      "--muted-foreground": "oklch(0.62 0 0)",
      "--accent": "oklch(0.78 0 0)",
      "--accent-foreground": "oklch(0.08 0 0)",
      "--border": "oklch(0.22 0 0)",
      "--input": "oklch(0.18 0 0)",
      "--ring": "oklch(0.65 0 0)",
    },
    bgGradient: "radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)",
  },
  {
    id: "special-retro",
    name: "Terminal",
    desc: "Green-on-black CRT aesthetic. Earn 10 achievements to unlock.",
    kind: "special",
    vars: {
      "--background": "oklch(0.10 0.012 150)",
      "--foreground": "oklch(0.86 0.14 150)",
      "--card": "oklch(0.12 0.012 150)",
      "--card-foreground": "oklch(0.86 0.14 150)",
      "--popover": "oklch(0.13 0.012 150)",
      "--popover-foreground": "oklch(0.86 0.14 150)",
      "--primary": "oklch(0.78 0.17 150)",  // phosphor green
      "--primary-foreground": "oklch(0.08 0.02 150)",
      "--secondary": "oklch(0.18 0.015 150)",
      "--secondary-foreground": "oklch(0.80 0.12 150)",
      "--muted": "oklch(0.16 0.012 150)",
      "--muted-foreground": "oklch(0.55 0.10 150)",
      "--accent": "oklch(0.72 0.13 150)",
      "--accent-foreground": "oklch(0.08 0.02 150)",
      "--border": "oklch(0.24 0.015 150)",
      "--input": "oklch(0.18 0.012 150)",
      "--ring": "oklch(0.62 0.14 150)",
    },
    bgGradient: "radial-gradient(ellipse at center, #0a1a0a 0%, #000500 100%)",
  },
  {
    id: "special-cosmic",
    name: "Cosmic Prism",
    desc: "Animated rainbow shimmer. Unlock all 10 prestige layers.",
    kind: "special",
    vars: {
      "--background": "oklch(0.10 0.04 300)",
      "--foreground": "oklch(0.92 0.04 280)",
      "--card": "oklch(0.14 0.045 300)",
      "--card-foreground": "oklch(0.92 0.04 280)",
      "--popover": "oklch(0.15 0.045 300)",
      "--popover-foreground": "oklch(0.92 0.04 280)",
      "--primary": "oklch(0.72 0.18 320)",   // animated: magenta
      "--primary-foreground": "oklch(0.10 0.02 300)",
      "--secondary": "oklch(0.18 0.04 280)",
      "--secondary-foreground": "oklch(0.92 0.04 280)",
      "--muted": "oklch(0.18 0.035 300)",
      "--muted-foreground": "oklch(0.66 0.04 280)",
      "--accent": "oklch(0.72 0.18 195)",   // animated: cyan
      "--accent-foreground": "oklch(0.10 0.02 200)",
      "--border": "oklch(0.26 0.04 300)",
      "--input": "oklch(0.20 0.04 300)",
      "--ring": "oklch(0.62 0.16 320)",
    },
    bgGradient: "linear-gradient(135deg, #1a0033 0%, #003366 50%, #330033 100%)",
  },
];

// ----------------------------------------------------------------
// 20 MINI THEMES (ORGANELLES-THEMES)
// 7 base + 13 archetype themes, unlocked by milestones / discoveries.
// Each is a self-contained override with `kind: "special"` so it slots
// into the same unlock pipeline as the other special themes.
// ----------------------------------------------------------------

export const MINI_THEMES: ThemeDef[] = [
  // ===== 7 BASE MINI THEMES =====

  // 1. mini-terminal — green CRT (overlaps with special-retro by intent,
  //    but uses a punchier phosphor + scanline gradient). Unlock at 10
  //    achievements.
  {
    id: "mini-terminal",
    name: "Terminal Plus",
    desc: "Phosphor-green CRT aesthetic with scanlines. Unlock 10 achievements.",
    kind: "special",
    vars: {
      "--background": "oklch(0.08 0.014 150)",
      "--foreground": "oklch(0.84 0.16 150)",
      "--card": "oklch(0.11 0.014 150)",
      "--card-foreground": "oklch(0.84 0.16 150)",
      "--popover": "oklch(0.12 0.014 150)",
      "--popover-foreground": "oklch(0.84 0.16 150)",
      "--primary": "oklch(0.80 0.18 150)",
      "--primary-foreground": "oklch(0.08 0.02 150)",
      "--secondary": "oklch(0.17 0.02 150)",
      "--secondary-foreground": "oklch(0.82 0.14 150)",
      "--muted": "oklch(0.15 0.014 150)",
      "--muted-foreground": "oklch(0.55 0.10 150)",
      "--accent": "oklch(0.74 0.15 150)",
      "--accent-foreground": "oklch(0.08 0.02 150)",
      "--border": "oklch(0.26 0.02 150)",
      "--input": "oklch(0.20 0.015 150)",
      "--ring": "oklch(0.64 0.15 150)",
    },
    bgGradient: "repeating-linear-gradient(0deg, rgba(0,255,120,0.04) 0 1px, transparent 1px 3px), radial-gradient(ellipse at center, #0a1a0a 0%, #000500 100%)",
  },

  // 2. mini-void — explicit alias of the existing Void special theme.
  //    Listed so it shows up in the mini-themes column too. Points at the
  //    same color set.
  {
    id: "mini-void",
    name: "Void (Mini)",
    desc: "Pure monochrome. Reach 1 Galactic win.",
    kind: "special",
    vars: {
      "--background": "oklch(0.06 0 0)",
      "--foreground": "oklch(0.95 0 0)",
      "--card": "oklch(0.10 0 0)",
      "--card-foreground": "oklch(0.95 0 0)",
      "--popover": "oklch(0.11 0 0)",
      "--popover-foreground": "oklch(0.95 0 0)",
      "--primary": "oklch(0.88 0 0)",
      "--primary-foreground": "oklch(0.08 0 0)",
      "--secondary": "oklch(0.16 0 0)",
      "--secondary-foreground": "oklch(0.95 0 0)",
      "--muted": "oklch(0.14 0 0)",
      "--muted-foreground": "oklch(0.62 0 0)",
      "--accent": "oklch(0.78 0 0)",
      "--accent-foreground": "oklch(0.08 0 0)",
      "--border": "oklch(0.22 0 0)",
      "--input": "oklch(0.18 0 0)",
      "--ring": "oklch(0.65 0 0)",
    },
    bgGradient: "radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)",
  },

  // 3. mini-solar-flare — orange/red on dark. Unlock at 3 Galactic wins.
  {
    id: "mini-solar-flare",
    name: "Solar Flare",
    desc: "Burning orange on black. Reach 3 Galactic wins.",
    kind: "special",
    vars: {
      "--background": "oklch(0.10 0.03 35)",
      "--foreground": "oklch(0.90 0.04 45)",
      "--card": "oklch(0.14 0.035 35)",
      "--card-foreground": "oklch(0.92 0.04 45)",
      "--popover": "oklch(0.15 0.035 35)",
      "--popover-foreground": "oklch(0.92 0.04 45)",
      "--primary": "oklch(0.72 0.18 40)",
      "--primary-foreground": "oklch(0.10 0.02 35)",
      "--secondary": "oklch(0.18 0.04 35)",
      "--secondary-foreground": "oklch(0.92 0.04 45)",
      "--muted": "oklch(0.18 0.03 35)",
      "--muted-foreground": "oklch(0.66 0.04 45)",
      "--accent": "oklch(0.68 0.20 25)",
      "--accent-foreground": "oklch(0.95 0.02 45)",
      "--border": "oklch(0.26 0.04 35)",
      "--input": "oklch(0.20 0.035 35)",
      "--ring": "oklch(0.62 0.16 40)",
    },
    bgGradient: "radial-gradient(ellipse at top, #7c2d12 0%, #431407 40%, #0a0301 100%)",
  },

  // 4. mini-forest — green/brown on dark. Unlock at 5 Galactic wins.
  {
    id: "mini-forest",
    name: "Deep Forest",
    desc: "Verdant greens on loam brown. Reach 5 Galactic wins.",
    kind: "special",
    vars: {
      "--background": "oklch(0.11 0.025 150)",
      "--foreground": "oklch(0.88 0.03 100)",
      "--card": "oklch(0.15 0.028 150)",
      "--card-foreground": "oklch(0.90 0.03 100)",
      "--popover": "oklch(0.16 0.028 150)",
      "--popover-foreground": "oklch(0.90 0.03 100)",
      "--primary": "oklch(0.70 0.16 140)",
      "--primary-foreground": "oklch(0.10 0.02 140)",
      "--secondary": "oklch(0.18 0.03 80)",
      "--secondary-foreground": "oklch(0.92 0.03 100)",
      "--muted": "oklch(0.18 0.022 150)",
      "--muted-foreground": "oklch(0.62 0.03 100)",
      "--accent": "oklch(0.66 0.12 70)",
      "--accent-foreground": "oklch(0.10 0.02 70)",
      "--border": "oklch(0.25 0.025 150)",
      "--input": "oklch(0.20 0.022 150)",
      "--ring": "oklch(0.58 0.14 140)",
    },
    bgGradient: "radial-gradient(ellipse at top, #365314 0%, #1a2e05 40%, #0a0f02 100%)",
  },

  // 5. mini-ice — cyan/white on dark blue. Unlock at 10 Galactic wins.
  {
    id: "mini-ice",
    name: "Glacial",
    desc: "Cyan-white frost on deep navy. Reach 10 Galactic wins.",
    kind: "special",
    vars: {
      "--background": "oklch(0.12 0.025 230)",
      "--foreground": "oklch(0.92 0.02 200)",
      "--card": "oklch(0.16 0.028 230)",
      "--card-foreground": "oklch(0.94 0.02 200)",
      "--popover": "oklch(0.17 0.028 230)",
      "--popover-foreground": "oklch(0.94 0.02 200)",
      "--primary": "oklch(0.82 0.10 200)",
      "--primary-foreground": "oklch(0.10 0.02 220)",
      "--secondary": "oklch(0.20 0.025 220)",
      "--secondary-foreground": "oklch(0.92 0.02 200)",
      "--muted": "oklch(0.18 0.022 230)",
      "--muted-foreground": "oklch(0.66 0.025 200)",
      "--accent": "oklch(0.76 0.14 210)",
      "--accent-foreground": "oklch(0.10 0.02 210)",
      "--border": "oklch(0.28 0.03 220)",
      "--input": "oklch(0.22 0.025 220)",
      "--ring": "oklch(0.70 0.14 200)",
    },
    bgGradient: "radial-gradient(ellipse at top, #0c4a6e 0%, #082f49 50%, #020617 100%)",
  },

  // 6. mini-volcanic — red/black. Unlock at all 10 layers.
  {
    id: "mini-volcanic",
    name: "Volcanic",
    desc: "Ember red on basalt black. Unlock all 10 prestige layers.",
    kind: "special",
    vars: {
      "--background": "oklch(0.09 0.025 25)",
      "--foreground": "oklch(0.86 0.04 35)",
      "--card": "oklch(0.13 0.028 25)",
      "--card-foreground": "oklch(0.88 0.04 35)",
      "--popover": "oklch(0.14 0.028 25)",
      "--popover-foreground": "oklch(0.88 0.04 35)",
      "--primary": "oklch(0.62 0.22 25)",
      "--primary-foreground": "oklch(0.95 0.02 35)",
      "--secondary": "oklch(0.18 0.03 25)",
      "--secondary-foreground": "oklch(0.88 0.04 35)",
      "--muted": "oklch(0.16 0.025 25)",
      "--muted-foreground": "oklch(0.60 0.035 35)",
      "--accent": "oklch(0.72 0.18 50)",
      "--accent-foreground": "oklch(0.10 0.02 35)",
      "--border": "oklch(0.24 0.03 25)",
      "--input": "oklch(0.20 0.025 25)",
      "--ring": "oklch(0.58 0.18 25)",
    },
    bgGradient: "radial-gradient(ellipse at bottom, #7c1d1d 0%, #3b0a0a 40%, #050000 100%)",
  },

  // 7. mini-ai — MAXIMALLY AI-looking. Indigo gradients, glass blur,
  //    glow shadows, low-contrast borders, icon-in-box, rainbow dots,
  //    curly quotes, aspirational copy. Easter-egg unlock.
  {
    id: "mini-ai",
    name: "\u201CIntelligence\u201D",
    desc: "\u201CElevate your idle journey with a next-generation, deeply-integrated experience.\u201D An easter egg.",
    kind: "special",
    extraClass: "ai-cringe-mode",
    vars: {
      "--background": "oklch(0.13 0.045 280)",
      "--foreground": "oklch(0.92 0.03 270)",
      "--card": "oklch(0.17 0.05 275)",
      "--card-foreground": "oklch(0.93 0.025 270)",
      "--popover": "oklch(0.18 0.05 275)",
      "--popover-foreground": "oklch(0.93 0.025 270)",
      "--primary": "oklch(0.62 0.20 285)",
      "--primary-foreground": "oklch(0.95 0.02 280)",
      "--secondary": "oklch(0.20 0.045 270)",
      "--secondary-foreground": "oklch(0.92 0.03 270)",
      "--muted": "oklch(0.19 0.04 280)",
      "--muted-foreground": "oklch(0.72 0.04 270)",
      "--accent": "oklch(0.66 0.18 320)",
      "--accent-foreground": "oklch(0.95 0.02 320)",
      "--border": "oklch(0.28 0.025 275)",   // deliberately low-contrast
      "--input": "oklch(0.22 0.045 280)",
      "--ring": "oklch(0.66 0.18 285)",
    },
    bgGradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 70%, #1e1b4b 100%)",
  },

  // ===== 13 ARCHETYPE MINI THEMES =====

  // 8. arch-humanoid — warm amber/earth tones
  {
    id: "arch-humanoid",
    name: "Humanoid",
    desc: "Warm amber and earth tones. Unlock the Humanoid lineage.",
    kind: "special",
    vars: {
      "--background": "oklch(0.13 0.025 65)",
      "--foreground": "oklch(0.90 0.022 70)",
      "--card": "oklch(0.17 0.028 65)",
      "--card-foreground": "oklch(0.92 0.022 70)",
      "--popover": "oklch(0.18 0.028 65)",
      "--popover-foreground": "oklch(0.92 0.022 70)",
      "--primary": "oklch(0.74 0.13 60)",
      "--primary-foreground": "oklch(0.10 0.02 60)",
      "--secondary": "oklch(0.20 0.028 55)",
      "--secondary-foreground": "oklch(0.92 0.022 70)",
      "--muted": "oklch(0.19 0.022 65)",
      "--muted-foreground": "oklch(0.64 0.025 60)",
      "--accent": "oklch(0.68 0.10 40)",
      "--accent-foreground": "oklch(0.10 0.02 40)",
      "--border": "oklch(0.27 0.025 65)",
      "--input": "oklch(0.21 0.025 65)",
      "--ring": "oklch(0.62 0.12 60)",
    },
    bgGradient: "radial-gradient(ellipse at top, #713f12 0%, #422006 40%, #1a1003 100%)",
  },

  // 9. arch-mammalian — warm browns + oranges
  {
    id: "arch-mammalian",
    name: "Mammalian",
    desc: "Warm browns and burnt orange. Unlock the Mammalian lineage.",
    kind: "special",
    vars: {
      "--background": "oklch(0.13 0.028 45)",
      "--foreground": "oklch(0.90 0.025 50)",
      "--card": "oklch(0.17 0.03 45)",
      "--card-foreground": "oklch(0.92 0.025 50)",
      "--popover": "oklch(0.18 0.03 45)",
      "--popover-foreground": "oklch(0.92 0.025 50)",
      "--primary": "oklch(0.70 0.15 45)",
      "--primary-foreground": "oklch(0.10 0.02 45)",
      "--secondary": "oklch(0.20 0.03 40)",
      "--secondary-foreground": "oklch(0.92 0.025 50)",
      "--muted": "oklch(0.19 0.025 45)",
      "--muted-foreground": "oklch(0.62 0.03 45)",
      "--accent": "oklch(0.66 0.16 30)",
      "--accent-foreground": "oklch(0.95 0.02 40)",
      "--border": "oklch(0.27 0.028 45)",
      "--input": "oklch(0.21 0.028 45)",
      "--ring": "oklch(0.58 0.14 45)",
    },
    bgGradient: "radial-gradient(ellipse at top, #7c2d12 0%, #431407 40%, #1c0701 100%)",
  },

  // 10. arch-reptilian — greens + yellows
  {
    id: "arch-reptilian",
    name: "Reptilian",
    desc: "Basking greens and sun-yellow. Unlock the Reptilian lineage.",
    kind: "special",
    vars: {
      "--background": "oklch(0.12 0.03 140)",
      "--foreground": "oklch(0.90 0.03 95)",
      "--card": "oklch(0.16 0.032 140)",
      "--card-foreground": "oklch(0.92 0.03 95)",
      "--popover": "oklch(0.17 0.032 140)",
      "--popover-foreground": "oklch(0.92 0.03 95)",
      "--primary": "oklch(0.70 0.16 135)",
      "--primary-foreground": "oklch(0.10 0.02 135)",
      "--secondary": "oklch(0.20 0.032 90)",
      "--secondary-foreground": "oklch(0.92 0.03 95)",
      "--muted": "oklch(0.18 0.028 140)",
      "--muted-foreground": "oklch(0.62 0.03 95)",
      "--accent": "oklch(0.78 0.16 90)",
      "--accent-foreground": "oklch(0.10 0.02 90)",
      "--border": "oklch(0.26 0.03 140)",
      "--input": "oklch(0.20 0.028 140)",
      "--ring": "oklch(0.58 0.14 135)",
    },
    bgGradient: "radial-gradient(ellipse at top, #365314 0%, #1a2e05 40%, #0a0f02 100%)",
  },

  // 11. arch-necroid — dark purple + sickly green
  {
    id: "arch-necroid",
    name: "Necroid",
    desc: "Bruise purple and sickly green. Unlock the Necroid lineage.",
    kind: "special",
    vars: {
      "--background": "oklch(0.10 0.04 295)",
      "--foreground": "oklch(0.86 0.04 140)",
      "--card": "oklch(0.14 0.045 295)",
      "--card-foreground": "oklch(0.88 0.04 140)",
      "--popover": "oklch(0.15 0.045 295)",
      "--popover-foreground": "oklch(0.88 0.04 140)",
      "--primary": "oklch(0.55 0.18 295)",
      "--primary-foreground": "oklch(0.92 0.04 295)",
      "--secondary": "oklch(0.18 0.035 280)",
      "--secondary-foreground": "oklch(0.86 0.04 140)",
      "--muted": "oklch(0.17 0.035 295)",
      "--muted-foreground": "oklch(0.58 0.05 140)",
      "--accent": "oklch(0.62 0.16 145)",
      "--accent-foreground": "oklch(0.10 0.02 145)",
      "--border": "oklch(0.24 0.04 295)",
      "--input": "oklch(0.20 0.04 295)",
      "--ring": "oklch(0.50 0.16 295)",
    },
    bgGradient: "radial-gradient(ellipse at top, #2e1065 0%, #1a0033 50%, #050008 100%)",
  },

  // 12. arch-arthropoid — amber + chitin brown
  {
    id: "arch-arthropoid",
    name: "Arthropoid",
    desc: "Amber shell over chitin brown. Unlock the Arthropoid lineage.",
    kind: "special",
    vars: {
      "--background": "oklch(0.12 0.028 55)",
      "--foreground": "oklch(0.88 0.028 65)",
      "--card": "oklch(0.16 0.032 55)",
      "--card-foreground": "oklch(0.90 0.028 65)",
      "--popover": "oklch(0.17 0.032 55)",
      "--popover-foreground": "oklch(0.90 0.028 65)",
      "--primary": "oklch(0.72 0.15 55)",
      "--primary-foreground": "oklch(0.10 0.02 55)",
      "--secondary": "oklch(0.20 0.028 45)",
      "--secondary-foreground": "oklch(0.90 0.028 65)",
      "--muted": "oklch(0.18 0.025 55)",
      "--muted-foreground": "oklch(0.62 0.028 60)",
      "--accent": "oklch(0.62 0.14 35)",
      "--accent-foreground": "oklch(0.95 0.02 45)",
      "--border": "oklch(0.26 0.028 55)",
      "--input": "oklch(0.20 0.025 55)",
      "--ring": "oklch(0.60 0.14 55)",
    },
    bgGradient: "radial-gradient(ellipse at top, #5c2e0a 0%, #2c1605 40%, #0a0501 100%)",
  },

  // 13. arch-plantoid — emerald + leaf green
  {
    id: "arch-plantoid",
    name: "Plantoid",
    desc: "Emerald green on leafy dark. Unlock the Plantoid lineage.",
    kind: "special",
    vars: {
      "--background": "oklch(0.11 0.03 155)",
      "--foreground": "oklch(0.90 0.03 130)",
      "--card": "oklch(0.15 0.032 155)",
      "--card-foreground": "oklch(0.92 0.03 130)",
      "--popover": "oklch(0.16 0.032 155)",
      "--popover-foreground": "oklch(0.92 0.03 130)",
      "--primary": "oklch(0.70 0.16 155)",
      "--primary-foreground": "oklch(0.10 0.02 155)",
      "--secondary": "oklch(0.20 0.03 140)",
      "--secondary-foreground": "oklch(0.92 0.03 130)",
      "--muted": "oklch(0.18 0.028 155)",
      "--muted-foreground": "oklch(0.62 0.03 140)",
      "--accent": "oklch(0.74 0.15 130)",
      "--accent-foreground": "oklch(0.10 0.02 130)",
      "--border": "oklch(0.26 0.028 155)",
      "--input": "oklch(0.20 0.025 155)",
      "--ring": "oklch(0.58 0.14 155)",
    },
    bgGradient: "radial-gradient(ellipse at top, #064e3b 0%, #022c22 40%, #001a10 100%)",
  },

  // 14. arch-fungoid — purple + spore violet
  {
    id: "arch-fungoid",
    name: "Fungoid",
    desc: "Muted purple with spore-violet accents. Unlock the Fungoid lineage.",
    kind: "special",
    vars: {
      "--background": "oklch(0.11 0.032 310)",
      "--foreground": "oklch(0.88 0.03 290)",
      "--card": "oklch(0.15 0.035 310)",
      "--card-foreground": "oklch(0.90 0.03 290)",
      "--popover": "oklch(0.16 0.035 310)",
      "--popover-foreground": "oklch(0.90 0.03 290)",
      "--primary": "oklch(0.62 0.18 310)",
      "--primary-foreground": "oklch(0.92 0.03 310)",
      "--secondary": "oklch(0.20 0.032 300)",
      "--secondary-foreground": "oklch(0.90 0.03 290)",
      "--muted": "oklch(0.18 0.028 310)",
      "--muted-foreground": "oklch(0.60 0.04 290)",
      "--accent": "oklch(0.66 0.16 330)",
      "--accent-foreground": "oklch(0.10 0.02 330)",
      "--border": "oklch(0.26 0.03 310)",
      "--input": "oklch(0.20 0.03 310)",
      "--ring": "oklch(0.56 0.16 310)",
    },
    bgGradient: "radial-gradient(ellipse at top, #4a044e 0%, #2a0033 50%, #0a000d 100%)",
  },

  // 15. arch-molluscoid — teal + ocean blue
  {
    id: "arch-molluscoid",
    name: "Molluscoid",
    desc: "Teal-on-ocean blue. Unlock the Molluscoid lineage.",
    kind: "special",
    vars: {
      "--background": "oklch(0.11 0.03 220)",
      "--foreground": "oklch(0.90 0.025 190)",
      "--card": "oklch(0.15 0.032 220)",
      "--card-foreground": "oklch(0.92 0.025 190)",
      "--popover": "oklch(0.16 0.032 220)",
      "--popover-foreground": "oklch(0.92 0.025 190)",
      "--primary": "oklch(0.68 0.14 190)",
      "--primary-foreground": "oklch(0.10 0.02 200)",
      "--secondary": "oklch(0.20 0.03 230)",
      "--secondary-foreground": "oklch(0.92 0.025 190)",
      "--muted": "oklch(0.18 0.028 220)",
      "--muted-foreground": "oklch(0.62 0.025 200)",
      "--accent": "oklch(0.66 0.16 240)",
      "--accent-foreground": "oklch(0.92 0.02 240)",
      "--border": "oklch(0.26 0.03 220)",
      "--input": "oklch(0.20 0.028 220)",
      "--ring": "oklch(0.56 0.14 190)",
    },
    bgGradient: "radial-gradient(ellipse at top, #0e7490 0%, #0c4a6e 40%, #020617 100%)",
  },

  // 16. arch-lithoid — stone gray + crystal cyan
  {
    id: "arch-lithoid",
    name: "Lithoid",
    desc: "Stone gray with crystal-cyan accents. Unlock the Lithoid lineage.",
    kind: "special",
    vars: {
      "--background": "oklch(0.14 0.012 240)",
      "--foreground": "oklch(0.86 0.025 200)",
      "--card": "oklch(0.18 0.014 240)",
      "--card-foreground": "oklch(0.88 0.025 200)",
      "--popover": "oklch(0.19 0.014 240)",
      "--popover-foreground": "oklch(0.88 0.025 200)",
      "--primary": "oklch(0.66 0.10 240)",
      "--primary-foreground": "oklch(0.95 0.02 240)",
      "--secondary": "oklch(0.22 0.012 240)",
      "--secondary-foreground": "oklch(0.88 0.025 200)",
      "--muted": "oklch(0.20 0.012 240)",
      "--muted-foreground": "oklch(0.62 0.025 200)",
      "--accent": "oklch(0.74 0.14 195)",
      "--accent-foreground": "oklch(0.10 0.02 200)",
      "--border": "oklch(0.28 0.015 240)",
      "--input": "oklch(0.22 0.012 240)",
      "--ring": "oklch(0.58 0.12 195)",
    },
    bgGradient: "radial-gradient(ellipse at top, #475569 0%, #1e293b 50%, #020617 100%)",
  },

  // 17. arch-toxoid — toxic green + hazard yellow
  {
    id: "arch-toxoid",
    name: "Toxoid",
    desc: "Toxic green with hazard-yellow accents. Unlock the Toxoid lineage.",
    kind: "special",
    vars: {
      "--background": "oklch(0.12 0.035 125)",
      "--foreground": "oklch(0.90 0.04 95)",
      "--card": "oklch(0.16 0.038 125)",
      "--card-foreground": "oklch(0.92 0.04 95)",
      "--popover": "oklch(0.17 0.038 125)",
      "--popover-foreground": "oklch(0.92 0.04 95)",
      "--primary": "oklch(0.74 0.20 125)",
      "--primary-foreground": "oklch(0.10 0.02 125)",
      "--secondary": "oklch(0.20 0.035 90)",
      "--secondary-foreground": "oklch(0.92 0.04 95)",
      "--muted": "oklch(0.18 0.03 125)",
      "--muted-foreground": "oklch(0.62 0.04 95)",
      "--accent": "oklch(0.82 0.18 95)",
      "--accent-foreground": "oklch(0.10 0.02 95)",
      "--border": "oklch(0.26 0.035 125)",
      "--input": "oklch(0.20 0.032 125)",
      "--ring": "oklch(0.62 0.18 125)",
    },
    bgGradient: "radial-gradient(ellipse at top, #3f6212 0%, #1a2e05 40%, #0a0f02 100%)",
  },

  // 18. arch-avian — sky blue + white
  {
    id: "arch-avian",
    name: "Avian",
    desc: "Sky-blue with bright white accents. Unlock the Avian lineage.",
    kind: "special",
    vars: {
      "--background": "oklch(0.13 0.03 230)",
      "--foreground": "oklch(0.92 0.015 220)",
      "--card": "oklch(0.17 0.032 230)",
      "--card-foreground": "oklch(0.94 0.015 220)",
      "--popover": "oklch(0.18 0.032 230)",
      "--popover-foreground": "oklch(0.94 0.015 220)",
      "--primary": "oklch(0.72 0.13 230)",
      "--primary-foreground": "oklch(0.10 0.02 230)",
      "--secondary": "oklch(0.20 0.028 240)",
      "--secondary-foreground": "oklch(0.94 0.015 220)",
      "--muted": "oklch(0.18 0.025 230)",
      "--muted-foreground": "oklch(0.66 0.022 220)",
      "--accent": "oklch(0.90 0.02 220)",
      "--accent-foreground": "oklch(0.10 0.02 220)",
      "--border": "oklch(0.28 0.03 230)",
      "--input": "oklch(0.20 0.028 230)",
      "--ring": "oklch(0.62 0.12 230)",
    },
    bgGradient: "radial-gradient(ellipse at top, #0284c7 0%, #0369a1 40%, #0c4a6e 100%)",
  },

  // 19. arch-aquatic — deep blue + coral
  {
    id: "arch-aquatic",
    name: "Aquatic",
    desc: "Deep blue with coral accents. Unlock the Aquatic lineage.",
    kind: "special",
    vars: {
      "--background": "oklch(0.10 0.035 245)",
      "--foreground": "oklch(0.88 0.03 200)",
      "--card": "oklch(0.14 0.038 245)",
      "--card-foreground": "oklch(0.90 0.03 200)",
      "--popover": "oklch(0.15 0.038 245)",
      "--popover-foreground": "oklch(0.90 0.03 200)",
      "--primary": "oklch(0.62 0.16 245)",
      "--primary-foreground": "oklch(0.92 0.02 245)",
      "--secondary": "oklch(0.18 0.035 220)",
      "--secondary-foreground": "oklch(0.90 0.03 200)",
      "--muted": "oklch(0.17 0.03 245)",
      "--muted-foreground": "oklch(0.60 0.03 200)",
      "--accent": "oklch(0.70 0.18 25)",
      "--accent-foreground": "oklch(0.10 0.02 25)",
      "--border": "oklch(0.24 0.035 245)",
      "--input": "oklch(0.20 0.032 245)",
      "--ring": "oklch(0.54 0.14 245)",
    },
    bgGradient: "radial-gradient(ellipse at top, #1e3a8a 0%, #172554 50%, #020617 100%)",
  },

  // 20. arch-extremophile — orange + volcanic red
  {
    id: "arch-extremophile",
    name: "Extremophile",
    desc: "Volcanic red on orange. Unlock the Extremophile lineage.",
    kind: "special",
    vars: {
      "--background": "oklch(0.12 0.035 40)",
      "--foreground": "oklch(0.90 0.035 30)",
      "--card": "oklch(0.16 0.038 40)",
      "--card-foreground": "oklch(0.92 0.035 30)",
      "--popover": "oklch(0.17 0.038 40)",
      "--popover-foreground": "oklch(0.92 0.035 30)",
      "--primary": "oklch(0.74 0.18 50)",
      "--primary-foreground": "oklch(0.10 0.02 50)",
      "--secondary": "oklch(0.20 0.035 30)",
      "--secondary-foreground": "oklch(0.92 0.035 30)",
      "--muted": "oklch(0.18 0.03 40)",
      "--muted-foreground": "oklch(0.62 0.035 30)",
      "--accent": "oklch(0.60 0.22 20)",
      "--accent-foreground": "oklch(0.95 0.02 40)",
      "--border": "oklch(0.26 0.035 40)",
      "--input": "oklch(0.20 0.032 40)",
      "--ring": "oklch(0.58 0.18 30)",
    },
    bgGradient: "radial-gradient(ellipse at top, #9a3412 0%, #7c2d12 40%, #1c0701 100%)",
  },
];

// ----------------------------------------------------------------
// Aggregations & lookup
// ----------------------------------------------------------------

export const ALL_THEMES: ThemeDef[] = [
  ...STAGE_THEMES,
  ...LAYER_THEMES,
  ...SPECIAL_THEMES,
  ...MINI_THEMES,
];

export const THEME_MAP: Record<string, ThemeDef> = Object.fromEntries(
  ALL_THEMES.map((t) => [t.id, t])
);

export function getThemeById(id: string): ThemeDef | undefined {
  return THEME_MAP[id];
}

// Mapping from stage index → stage theme id
export const STAGE_INDEX_TO_THEME: string[] = [
  "stage-cell",
  "stage-creature",
  "stage-tribal",
  "stage-civilization",
  "stage-empire",
  "stage-solar",
  "stage-galactic",
];

// Mapping from layer id → overlay theme id
export const LAYER_ID_TO_THEME: Record<string, string> = {
  evolution: "layer-evolution",
  enlightenment: "layer-enlightenment",
  transcendence: "layer-transcendence",
  genesis: "layer-genesis",
  apotheosis: "layer-apotheosis",
  singularity: "layer-singularity",
  omnipotence: "layer-omnipotence",
  divinity: "layer-divinity",
  infinity: "layer-infinity",
  eternity: "layer-eternity",
};
