// ===========================================================================
// DIMENSION SYSTEM — file-based, drop-in extensible
// ===========================================================================
// Each dimension is a self-contained file in this folder. The index.ts
// loader auto-discovers all dimensions. To add a new dimension, just create
// a new file (e.g. norse.ts) and export a `dimension: DimensionDef`.
//
// Dimensions override the PRESENTATION layer only — resource names, stage
// names, system names, theme colors, story text. The game LOGIC stays
// identical across all dimensions. A Toxoid in Fantasy is still a Toxoid
// mechanically — it just calls them "Venom Weavers" instead.
// ===========================================================================

export interface DimensionDef {
  /** Unique dimension id (e.g. "mundane", "fantasy", "cyberpunk") */
  id: string;
  /** Display name shown in the dimension picker */
  name: string;
  /** Short description shown in the picker */
  desc: string;
  /** Emoji icon */
  icon: string;
  /** Whether this is the default/base dimension (always available) */
  isBase: boolean;

  /** CSS variable overrides — applied as a `.dimension-{id}` class on root */
  theme: Record<string, string>;

  /** Resource name overrides — key = resource id, value = dimension-specific name */
  resources: Record<string, string>;

  /** Resource icon overrides — key = resource id, value = dimension-specific emoji */
  resourceIcons: Record<string, string>;

  /** Stage name overrides — key = stage id, value = dimension-specific name */
  stages: Record<string, { name: string; tagline: string; }>;

  /** System name overrides — key = system id, value = dimension-specific name */
  systemNames: Record<string, string>;

  /** System icon overrides — key = system id, value = dimension-specific emoji */
  systemIcons: Record<string, string>;

  /** Tech name overrides — key = tech id, value = dimension-specific name */
  techNames: Record<string, string>;

  /** Tech branch name overrides — key = branch name, value = dimension-specific name */
  branchNames: Record<string, string>;

  /** Story text overrides — key = story id, value = { title, body } */
  storyOverrides: Record<string, { title: string; body: string; }>;

  /** Archetype name overrides — key = archetype id, value = dimension-specific name */
  archetypeNames: Record<string, string>;

  /** Archetype glyph overrides — key = archetype id, value = dimension-specific glyph */
  archetypeGlyphs: Record<string, string>;
}

// The base dimension (Mundane Realm) — no overrides, uses the game's default names.
// This is always available and is the default for new saves.
export const mundaneDimension: DimensionDef = {
  id: "mundane",
  name: "Mundane Realm",
  desc: "The standard evolutionary saga. From cell to galactic god.",
  icon: "🌌",
  isBase: true,
  theme: {}, // No overrides — use the game's default CSS variables
  resources: {}, // No overrides — use the game's default resource names
  resourceIcons: {},
  stages: {},
  systemNames: {},
  systemIcons: {},
  techNames: {},
  branchNames: {},
  storyOverrides: {},
  archetypeNames: {},
  archetypeGlyphs: {},
};
