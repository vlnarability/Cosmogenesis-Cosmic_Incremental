// ============================================================
// THEME SYSTEM
// Stage themes (7) — unlocked when reaching each stage.
// Layer overlay themes (10) — unlocked when each prestige layer unlocks.
// Special themes (3) — unlocked by special conditions.
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
// Aggregations & lookup
// ----------------------------------------------------------------

export const ALL_THEMES: ThemeDef[] = [
  ...STAGE_THEMES,
  ...LAYER_THEMES,
  ...SPECIAL_THEMES,
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
