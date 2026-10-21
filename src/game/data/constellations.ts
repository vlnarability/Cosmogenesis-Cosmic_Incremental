// ===========================================================================
// LAYER 2 — ENLIGHTENMENT (CONSTELLATION MAP)
// ===========================================================================
// After 3 trials are mastered, the god opens its eyes. The Enlightenment layer
// is a star map: the player illuminates individual stars within real IAU
// constellations. Completing a constellation grants a permanent bonus.
// Currency = Divinity (earned at prestige while this layer is unlocked).
// Complete CONSTELLATIONS_REQUIRED_FOR_LAYER_3 constellations to advance to
// Layer 3 (Transcendence).
//
// ===========================================================================
// ARCHITECTURE NOTE — The full IAU list has 88 constellations. This file ships
// ALL 88 (12 zodiac + 23 northern + 23 equatorial + 30 southern, grouped by
// approximate declination). Star positions are normalized 0-100 and packed for
// visual variety per category — they're NOT a literal equatorial projection.
// The data shape (`ConstellationDef`) is constellation-count-agnostic, so
// adding/removing entries requires no other code changes.
// ===========================================================================

export type ConstellationCategory =
  | "zodiac"
  | "northern"
  | "southern"
  | "equatorial";

export interface ConstellationStar {
  /** Globally-unique star id, e.g. "orion_alpha". */
  id: string;
  /** Normalized X coordinate on the star map, 0-100 (left → right). */
  x: number;
  /** Normalized Y coordinate on the star map, 0-100 (top → bottom). */
  y: number;
}

export interface ConstellationBonus {
  /** Additive production multiplier (0.05 = +5%). Boosts resource output → feeds peakProductionRate → more Divinity/s. */
  productionMult?: number;
  /** Additive capacity multiplier. Higher caps = more resource headroom → higher peak production. */
  capMult?: number;
  /** @deprecated EP is gone (merged with Divinity). Folded into divinityMult. Kept for save-compat. */
  epMult?: number;
  /** @deprecated Population growth doesn't matter at L2+ (base game is backgrounded). Folded into productionMult. Kept for save-compat. */
  popGrowthMult?: number;
  /** Cost reduction (negative = cheaper systems/techs). */
  costMult?: number;
  /** Bonus Divinity multiplier (additive). Directly boosts Divinity generation from background worlds. */
  divinityMult?: number;
}

export interface ConstellationDef {
  /** Slug id, e.g. "orion". */
  id: string;
  /** Display name, e.g. "Orion". */
  name: string;
  /** IAU designation (Latin), e.g. "Orion". */
  i18nName: string;
  /** Stars with normalized 0-100 coordinates on the star map. */
  stars: ConstellationStar[];
  /** Pairs of star ids that form the constellation's connecting lines. */
  connections: [string, string][];
  /** Permanent reward for completing this constellation. */
  bonus: ConstellationBonus;
  /** Flavor grouping. */
  category: ConstellationCategory;
}

// ---------------------------------------------------------------------------
// COST MODEL CONSTANTS
// ---------------------------------------------------------------------------
// **Critical**: matches the user-supplied spec exactly.
//   baseCost = 10 Divinity.
//   withinConstellationGrowth = 1.5 — each subsequent star in the SAME
//     constellation multiplies the cost by 1.5 (cumulative).
//   costGrowth = 2.0 — multiplier per OTHER started constellation (i.e. any
//     constellation the player has already begun illuminating that isn't the
//     one being illuminated right now).
//
// Concretely (baseCost = 10):
//   A·star1:  10 × 1.5^0 × 2.0^0 = 10       (A is the first started → N=0)
//   A·star2:  10 × 1.5^1 × 2.0^0 = 15        (A is the only started, N=0 still)
//   A·star3:  10 × 1.5^2 × 2.0^0 = 22.5
//   B·star1:  10 × 1.5^0 × 2.0^1 = 20        (A is started, B is new → N=1)
//   B·star2:  10 × 1.5^1 × 2.0^1 = 30        (A+B started, B excluded → N=1)
//   Cass·star1: 10 × 1.5^0 × 2.0^2 = 40      (A+B started, Cass is new → N=2)
//
// Where N = (# of started constellations) - (1 if THIS constellation is
// already started, else 0). I.e. N counts OTHER started constellations.
//
// The "new constellation penalty" the user describes is the costGrowth^N
// term: it only kicks in when this is a brand-new constellation (because at
// that point every other started constellation counts toward N). For
// already-started constellations, N stays fixed at the count when you began
// that constellation, which means subsequent stars in a "penalized"
// constellation inherit the same N multiplier — encouraging the player to
// finish a constellation before starting a new one.
// ---------------------------------------------------------------------------
export const CONSTELLATION_BASE_COST = 10;
export const WITHIN_CONSTELLATION_GROWTH = 1.5;
export const COST_GROWTH_PER_STARTED = 2.0;
export const NEW_CONSTELLATION_PENALTY = 2.0;

// Number of constellations the player must COMPLETE to advance to Layer 3.
// 88 constellations total — completing 20 (~23%) unlocks Transcendence.
export const CONSTELLATIONS_REQUIRED_FOR_LAYER_3 = 20;

// Per-star production bonus (additive across all lit stars).
export const PER_STAR_PRODUCTION_BONUS = 0.005; // +0.5% per lit star

// ---------------------------------------------------------------------------
// L2 ACTIVE ABILITY CONSTANTS (the four EnlightenmentModal abilities)
// ---------------------------------------------------------------------------
// These four abilities live alongside the constellation map; they each cost
// Divinity AND have a cooldown (tracked in `activeAbilityCooldowns` under the
// ids below). Cosmic Bridge additionally has a duration timer tracked in
// `cosmicBridgeLink.remaining`.
export const STARGAZE_COST = 25;
export const STARGAZE_COOLDOWN_SEC = 60;

export const SUPERNOVA_COST = 100;
export const SUPERNOVA_COOLDOWN_SEC = 300;

export const BLACK_HOLE_COST = 50;
export const BLACK_HOLE_COOLDOWN_SEC = 120;
// Black Hole refunds this fraction of the recomputed base cost per lit star.
export const BLACK_HOLE_REFUND_FRACTION = 0.75;

export const COSMIC_BRIDGE_COST = 200;
export const COSMIC_BRIDGE_COOLDOWN_SEC = 600;
// When activated, the bridge stays active for this many seconds.
export const COSMIC_BRIDGE_DURATION_SEC = 60;

// Cooldown keys used inside `activeAbilityCooldowns` (shared with the
// generic per-layer `useActiveAbility` system so cooldowns decay uniformly).
export const STARGAZE_CD_KEY = "ability_stargaze";
export const SUPERNOVA_CD_KEY = "ability_supernova";
export const BLACK_HOLE_CD_KEY = "ability_black_hole";
export const COSMIC_BRIDGE_CD_KEY = "ability_cosmic_bridge";

/** Shape of the active Cosmic Bridge link (one of `from`/`to` matches the
 *  constellation the player just illuminated; the OTHER side gets a free
 *  cheapest-star illumination). */
export interface CosmicBridgeLink {
  from: string; // constellationId of the first endpoint
  to: string;   // constellationId of the second endpoint
  remaining: number; // seconds remaining (decayed by tick)
}

// ---------------------------------------------------------------------------
// THE 88 IAU CONSTELLATIONS
// ---------------------------------------------------------------------------
// Star positions are normalized 0-100 on a stylized sky map (NOT a literal
// equatorial projection — they're packed for visual variety per category).
// Star counts per constellation range 3-15; connecting lines follow the
// canonical IAU stick figures (simplified). All 12 zodiac + the most
// prominent northern/southern asterisms are hand-positioned for recognition;
// the rest use Wikipedia-derived approximate positions.
export const CONSTELLATIONS: ConstellationDef[] = [
  // ===== ZODIAC (12) =====
  {
    id: "aries",
    name: "Aries",
    i18nName: "Aries",
    category: "zodiac",
    stars: [
      { id: "aries_alpha", x: 12, y: 30 },
      { id: "aries_beta", x: 16, y: 28 },
      { id: "aries_gamma", x: 20, y: 32 },
      { id: "aries_delta", x: 24, y: 35 },
    ],
    connections: [
      ["aries_alpha", "aries_beta"],
      ["aries_beta", "aries_gamma"],
      ["aries_gamma", "aries_delta"],
    ],
    bonus: { productionMult: 0.07 },
  },
  {
    id: "taurus",
    name: "Taurus",
    i18nName: "Taurus",
    category: "zodiac",
    stars: [
      { id: "taurus_alpha", x: 30, y: 28 }, // Aldebaran
      { id: "taurus_beta", x: 28, y: 24 },
      { id: "taurus_gamma", x: 26, y: 30 },
      { id: "taurus_delta", x: 34, y: 22 },
      { id: "taurus_eps", x: 32, y: 18 },
      { id: "taurus_zeta", x: 36, y: 18 },
      { id: "taurus_eta", x: 38, y: 22 },
    ],
    connections: [
      ["taurus_alpha", "taurus_beta"],
      ["taurus_alpha", "taurus_gamma"],
      ["taurus_beta", "taurus_delta"],
      ["taurus_delta", "taurus_eps"],
      ["taurus_eps", "taurus_zeta"],
      ["taurus_zeta", "taurus_eta"],
      ["taurus_eta", "taurus_delta"],
    ],
    bonus: { productionMult: 0.06, capMult: 0.03 },
  },
  {
    id: "gemini",
    name: "Gemini",
    i18nName: "Gemini",
    category: "zodiac",
    stars: [
      { id: "gemini_alpha", x: 44, y: 22 }, // Castor
      { id: "gemini_beta", x: 46, y: 26 },  // Pollux
      { id: "gemini_gamma", x: 42, y: 24 },
      { id: "gemini_delta", x: 40, y: 30 },
      { id: "gemini_eps", x: 43, y: 34 },
      { id: "gemini_zeta", x: 47, y: 32 },
      { id: "gemini_eta", x: 49, y: 28 },
      { id: "gemini_theta", x: 51, y: 24 },
    ],
    connections: [
      ["gemini_alpha", "gemini_gamma"],
      ["gemini_gamma", "gemini_delta"],
      ["gemini_delta", "gemini_eps"],
      ["gemini_beta", "gemini_zeta"],
      ["gemini_zeta", "gemini_eta"],
      ["gemini_eta", "gemini_theta"],
    ],
    bonus: { productionMult: 0.05, divinityMult: 0.04 },
  },
  {
    id: "cancer",
    name: "Cancer",
    i18nName: "Cancer",
    category: "zodiac",
    stars: [
      { id: "cancer_alpha", x: 56, y: 22 },
      { id: "cancer_beta", x: 54, y: 26 },
      { id: "cancer_gamma", x: 58, y: 28 },
      { id: "cancer_delta", x: 56, y: 32 },
      { id: "cancer_eps", x: 60, y: 24 },
    ],
    connections: [
      ["cancer_alpha", "cancer_beta"],
      ["cancer_alpha", "cancer_gamma"],
      ["cancer_gamma", "cancer_delta"],
      ["cancer_alpha", "cancer_eps"],
    ],
    bonus: { capMult: 0.05, productionMult: 0.02 },
  },
  {
    id: "leo",
    name: "Leo",
    i18nName: "Leo",
    category: "zodiac",
    stars: [
      { id: "leo_alpha", x: 65, y: 28 }, // Regulus
      { id: "leo_beta", x: 70, y: 22 },  // Denebola
      { id: "leo_gamma", x: 62, y: 22 },
      { id: "leo_delta", x: 60, y: 26 },
      { id: "leo_eps", x: 68, y: 30 },
      { id: "leo_zeta", x: 72, y: 26 },
      { id: "leo_eta", x: 74, y: 24 },
    ],
    connections: [
      ["leo_alpha", "leo_delta"],
      ["leo_delta", "leo_gamma"],
      ["leo_gamma", "leo_alpha"],
      ["leo_alpha", "leo_eps"],
      ["leo_eps", "leo_zeta"],
      ["leo_zeta", "leo_beta"],
      ["leo_beta", "leo_eta"],
    ],
    bonus: { productionMult: 0.06, divinityMult: 0.03 },
  },
  {
    id: "virgo",
    name: "Virgo",
    i18nName: "Virgo",
    category: "zodiac",
    stars: [
      { id: "virgo_alpha", x: 80, y: 30 }, // Spica
      { id: "virgo_beta", x: 76, y: 22 },
      { id: "virgo_gamma", x: 84, y: 22 },
      { id: "virgo_delta", x: 78, y: 26 },
      { id: "virgo_eps", x: 82, y: 24 },
      { id: "virgo_zeta", x: 86, y: 28 },
      { id: "virgo_eta", x: 88, y: 26 },
    ],
    connections: [
      ["virgo_alpha", "virgo_delta"],
      ["virgo_delta", "virgo_beta"],
      ["virgo_delta", "virgo_eps"],
      ["virgo_eps", "virgo_gamma"],
      ["virgo_alpha", "virgo_zeta"],
      ["virgo_zeta", "virgo_eta"],
    ],
    bonus: { productionMult: 0.05, capMult: 0.04 },
  },
  {
    id: "libra",
    name: "Libra",
    i18nName: "Libra",
    category: "zodiac",
    stars: [
      { id: "libra_alpha", x: 88, y: 40 },
      { id: "libra_beta", x: 92, y: 38 },
      { id: "libra_gamma", x: 86, y: 44 },
      { id: "libra_delta", x: 90, y: 46 },
    ],
    connections: [
      ["libra_alpha", "libra_beta"],
      ["libra_alpha", "libra_gamma"],
      ["libra_beta", "libra_delta"],
      ["libra_gamma", "libra_delta"],
    ],
    bonus: { costMult: -0.05 },
  },
  {
    id: "scorpius",
    name: "Scorpius",
    i18nName: "Scorpius",
    category: "zodiac",
    stars: [
      { id: "scorpius_alpha", x: 82, y: 50 }, // Antares
      { id: "scorpius_beta", x: 78, y: 48 },
      { id: "scorpius_gamma", x: 80, y: 54 },
      { id: "scorpius_delta", x: 84, y: 56 },
      { id: "scorpius_eps", x: 86, y: 60 },
      { id: "scorpius_zeta", x: 88, y: 62 },
      { id: "scorpius_eta", x: 90, y: 60 },
      { id: "scorpius_theta", x: 92, y: 56 },
      { id: "scorpius_iota", x: 86, y: 52 },
    ],
    connections: [
      ["scorpius_beta", "scorpius_alpha"],
      ["scorpius_alpha", "scorpius_iota"],
      ["scorpius_alpha", "scorpius_gamma"],
      ["scorpius_gamma", "scorpius_delta"],
      ["scorpius_delta", "scorpius_eps"],
      ["scorpius_eps", "scorpius_zeta"],
      ["scorpius_zeta", "scorpius_eta"],
      ["scorpius_eta", "scorpius_theta"],
    ],
    bonus: { productionMult: 0.11000000000000001 },
  },
  {
    id: "sagittarius",
    name: "Sagittarius",
    i18nName: "Sagittarius",
    category: "zodiac",
    stars: [
      { id: "sag_alpha", x: 70, y: 60 },
      { id: "sag_beta", x: 66, y: 58 },
      { id: "sag_gamma", x: 74, y: 62 },
      { id: "sag_delta", x: 72, y: 66 },
      { id: "sag_eps", x: 68, y: 64 },
      { id: "sag_zeta", x: 76, y: 68 },
      { id: "sag_eta", x: 78, y: 64 },
      { id: "sag_theta", x: 64, y: 62 },
    ],
    connections: [
      ["sag_beta", "sag_alpha"],
      ["sag_alpha", "sag_gamma"],
      ["sag_gamma", "sag_zeta"],
      ["sag_zeta", "sag_eta"],
      ["sag_alpha", "sag_eps"],
      ["sag_eps", "sag_delta"],
      ["sag_eps", "sag_beta"],
      ["sag_beta", "sag_theta"],
    ],
    bonus: { productionMult: 0.05, divinityMult: 0.10 },
  },
  {
    id: "capricornus",
    name: "Capricornus",
    i18nName: "Capricornus",
    category: "zodiac",
    stars: [
      { id: "cap_alpha", x: 56, y: 64 },
      { id: "cap_beta", x: 60, y: 62 },
      { id: "cap_gamma", x: 52, y: 60 },
      { id: "cap_delta", x: 64, y: 60 },
      { id: "cap_eps", x: 50, y: 58 },
      { id: "cap_zeta", x: 66, y: 56 },
    ],
    connections: [
      ["cap_gamma", "cap_alpha"],
      ["cap_alpha", "cap_beta"],
      ["cap_beta", "cap_delta"],
      ["cap_gamma", "cap_eps"],
      ["cap_delta", "cap_zeta"],
    ],
    bonus: { capMult: 0.06, divinityMult: 0.03 },
  },
  {
    id: "aquarius",
    name: "Aquarius",
    i18nName: "Aquarius",
    category: "zodiac",
    stars: [
      { id: "aqua_alpha", x: 42, y: 58 },
      { id: "aqua_beta", x: 38, y: 60 },
      { id: "aqua_gamma", x: 46, y: 56 },
      { id: "aqua_delta", x: 34, y: 58 },
      { id: "aqua_eps", x: 30, y: 60 },
      { id: "aqua_zeta", x: 44, y: 64 },
      { id: "aqua_eta", x: 40, y: 66 },
    ],
    connections: [
      ["aqua_beta", "aqua_alpha"],
      ["aqua_alpha", "aqua_gamma"],
      ["aqua_beta", "aqua_delta"],
      ["aqua_delta", "aqua_eps"],
      ["aqua_alpha", "aqua_zeta"],
      ["aqua_zeta", "aqua_eta"],
    ],
    bonus: { productionMult: 0.04, capMult: 0.04 },
  },
  {
    id: "pisces",
    name: "Pisces",
    i18nName: "Pisces",
    category: "zodiac",
    stars: [
      { id: "pis_alpha", x: 22, y: 60 },
      { id: "pis_beta", x: 26, y: 62 },
      { id: "pis_gamma", x: 18, y: 58 },
      { id: "pis_delta", x: 14, y: 56 },
      { id: "pis_eps", x: 28, y: 58 },
      { id: "pis_zeta", x: 24, y: 56 },
      { id: "pis_eta", x: 20, y: 54 },
    ],
    connections: [
      ["pis_gamma", "pis_alpha"],
      ["pis_alpha", "pis_beta"],
      ["pis_gamma", "pis_delta"],
      ["pis_alpha", "pis_zeta"],
      ["pis_zeta", "pis_eps"],
      ["pis_zeta", "pis_eta"],
    ],
    bonus: { productionMult: 0.08 },
  },

  // ===== NORTHERN (8) =====
  {
    id: "ursa_major",
    name: "Ursa Major",
    i18nName: "Ursa Major",
    category: "northern",
    stars: [
      { id: "um_alpha", x: 10, y: 8 },  // Dubhe
      { id: "um_beta", x: 14, y: 10 },  // Merak
      { id: "um_gamma", x: 18, y: 8 },  // Phecda
      { id: "um_delta", x: 22, y: 12 }, // Megrez
      { id: "um_eps", x: 26, y: 8 },    // Alioth
      { id: "um_zeta", x: 30, y: 10 },  // Mizar
      { id: "um_eta", x: 34, y: 14 },   // Alkaid
    ],
    connections: [
      ["um_alpha", "um_beta"],
      ["um_beta", "um_gamma"],
      ["um_gamma", "um_delta"],
      ["um_delta", "um_eps"],
      ["um_eps", "um_zeta"],
      ["um_zeta", "um_eta"],
      ["um_delta", "um_alpha"],
    ],
    bonus: { productionMult: 0.06, divinityMult: 0.05 },
  },
  {
    id: "ursa_minor",
    name: "Ursa Minor",
    i18nName: "Ursa Minor",
    category: "northern",
    stars: [
      { id: "umi_alpha", x: 8, y: 4 },   // Polaris
      { id: "umi_beta", x: 6, y: 8 },
      { id: "umi_gamma", x: 10, y: 10 },
      { id: "umi_delta", x: 12, y: 6 },
      { id: "umi_eps", x: 14, y: 8 },
      { id: "umi_zeta", x: 4, y: 6 },
      { id: "umi_eta", x: 2, y: 8 },
    ],
    connections: [
      ["umi_alpha", "umi_delta"],
      ["umi_delta", "umi_eps"],
      ["umi_eps", "umi_gamma"],
      ["umi_gamma", "umi_beta"],
      ["umi_beta", "umi_zeta"],
      ["umi_zeta", "umi_eta"],
    ],
    bonus: { capMult: 0.05, divinityMult: 0.04 },
  },
  {
    id: "cassiopeia",
    name: "Cassiopeia",
    i18nName: "Cassiopeia",
    category: "northern",
    stars: [
      { id: "cas_alpha", x: 40, y: 6 },
      { id: "cas_beta", x: 44, y: 10 },
      { id: "cas_gamma", x: 48, y: 6 },
      { id: "cas_delta", x: 52, y: 10 },
      { id: "cas_eps", x: 56, y: 6 },
    ],
    connections: [
      ["cas_alpha", "cas_beta"],
      ["cas_beta", "cas_gamma"],
      ["cas_gamma", "cas_delta"],
      ["cas_delta", "cas_eps"],
    ],
    bonus: { productionMult: 0.04, divinityMult: 0.06 },
  },
  {
    id: "cygnus",
    name: "Cygnus",
    i18nName: "Cygnus",
    category: "northern",
    stars: [
      { id: "cyg_alpha", x: 64, y: 8 },  // Deneb
      { id: "cyg_beta", x: 68, y: 12 },
      { id: "cyg_gamma", x: 72, y: 8 },
      { id: "cyg_delta", x: 76, y: 14 },
      { id: "cyg_eps", x: 60, y: 12 },
      { id: "cyg_zeta", x: 66, y: 16 },
    ],
    connections: [
      ["cyg_alpha", "cyg_beta"],
      ["cyg_beta", "cyg_delta"],
      ["cyg_beta", "cyg_zeta"],
      ["cyg_zeta", "cyg_eps"],
      ["cyg_alpha", "cyg_gamma"],
    ],
    bonus: { productionMult: 0.09 },
  },
  {
    id: "lyra",
    name: "Lyra",
    i18nName: "Lyra",
    category: "northern",
    stars: [
      { id: "lyr_alpha", x: 80, y: 8 }, // Vega
      { id: "lyr_beta", x: 82, y: 12 },
      { id: "lyr_gamma", x: 84, y: 10 },
      { id: "lyr_delta", x: 78, y: 12 },
      { id: "lyr_eps", x: 80, y: 14 },
    ],
    connections: [
      ["lyr_alpha", "lyr_beta"],
      ["lyr_beta", "lyr_gamma"],
      ["lyr_gamma", "lyr_alpha"],
      ["lyr_beta", "lyr_eps"],
      ["lyr_eps", "lyr_delta"],
      ["lyr_delta", "lyr_alpha"],
    ],
    bonus: { productionMult: 0.04, divinityMult: 0.11 },
  },
  {
    id: "draco",
    name: "Draco",
    i18nName: "Draco",
    category: "northern",
    stars: [
      { id: "dra_alpha", x: 90, y: 4 },
      { id: "dra_beta", x: 86, y: 6 },
      { id: "dra_gamma", x: 82, y: 4 },
      { id: "dra_delta", x: 78, y: 8 },
      { id: "dra_eps", x: 74, y: 4 },
      { id: "dra_zeta", x: 70, y: 6 },
      { id: "dra_eta", x: 66, y: 4 },
      { id: "dra_theta", x: 62, y: 8 },
    ],
    connections: [
      ["dra_alpha", "dra_beta"],
      ["dra_beta", "dra_gamma"],
      ["dra_gamma", "dra_delta"],
      ["dra_delta", "dra_eps"],
      ["dra_eps", "dra_zeta"],
      ["dra_zeta", "dra_eta"],
      ["dra_eta", "dra_theta"],
    ],
    bonus: { capMult: 0.04, costMult: -0.03, divinityMult: 0.05 },
  },
  {
    id: "pegasus",
    name: "Pegasus",
    i18nName: "Pegasus",
    category: "northern",
    stars: [
      { id: "peg_alpha", x: 38, y: 18 },
      { id: "peg_beta", x: 42, y: 16 },
      { id: "peg_gamma", x: 42, y: 22 },
      { id: "peg_delta", x: 38, y: 24 },
      { id: "peg_eps", x: 34, y: 18 },
      { id: "peg_zeta", x: 46, y: 20 },
    ],
    connections: [
      ["peg_alpha", "peg_beta"],
      ["peg_beta", "peg_gamma"],
      ["peg_gamma", "peg_delta"],
      ["peg_delta", "peg_alpha"],
      ["peg_alpha", "peg_eps"],
      ["peg_beta", "peg_zeta"],
    ],
    bonus: { productionMult: 0.05, capMult: 0.05 },
  },
  {
    id: "andromeda",
    name: "Andromeda",
    i18nName: "Andromeda",
    category: "northern",
    stars: [
      { id: "and_alpha", x: 48, y: 18 },
      { id: "and_beta", x: 52, y: 20 },
      { id: "and_gamma", x: 56, y: 22 },
      { id: "and_delta", x: 60, y: 18 },
      { id: "and_eps", x: 50, y: 24 },
      { id: "and_zeta", x: 54, y: 26 },
    ],
    connections: [
      ["and_alpha", "and_beta"],
      ["and_beta", "and_gamma"],
      ["and_gamma", "and_delta"],
      ["and_beta", "and_eps"],
      ["and_eps", "and_zeta"],
    ],
    bonus: { productionMult: 0.05, divinityMult: 0.09 },
  },

  // ===== EQUATORIAL (4) =====
  {
    id: "orion",
    name: "Orion",
    i18nName: "Orion",
    category: "equatorial",
    stars: [
      { id: "ori_alpha", x: 12, y: 40 }, // Betelgeuse
      { id: "ori_beta", x: 8, y: 36 },  // Rigel
      { id: "ori_gamma", x: 16, y: 38 }, // Bellatrix
      { id: "ori_delta", x: 14, y: 44 }, // Saiph
      { id: "ori_eps", x: 10, y: 42 },  // belt
      { id: "ori_zeta", x: 12, y: 42 },
      { id: "ori_eta", x: 14, y: 42 },
      { id: "ori_theta", x: 11, y: 40 }, // sword
      { id: "ori_iota", x: 13, y: 40 },
    ],
    connections: [
      ["ori_alpha", "ori_gamma"],
      ["ori_alpha", "ori_zeta"],
      ["ori_gamma", "ori_eta"],
      ["ori_eta", "ori_zeta"],
      ["ori_zeta", "ori_eps"],
      ["ori_beta", "ori_eps"],
      ["ori_eps", "ori_theta"],
      ["ori_theta", "ori_iota"],
      ["ori_iota", "ori_delta"],
    ],
    bonus: { productionMult: 0.13 },
  },
  {
    id: "perseus",
    name: "Perseus",
    i18nName: "Perseus",
    category: "equatorial",
    stars: [
      { id: "per_alpha", x: 28, y: 40 },
      { id: "per_beta", x: 32, y: 42 },
      { id: "per_gamma", x: 26, y: 44 },
      { id: "per_delta", x: 30, y: 46 },
      { id: "per_eps", x: 34, y: 44 },
      { id: "per_zeta", x: 32, y: 38 },
    ],
    connections: [
      ["per_alpha", "per_beta"],
      ["per_beta", "per_eps"],
      ["per_alpha", "per_zeta"],
      ["per_alpha", "per_gamma"],
      ["per_gamma", "per_delta"],
      ["per_delta", "per_beta"],
    ],
    bonus: { productionMult: 0.05, divinityMult: 0.05 },
  },
  {
    id: "hercules",
    name: "Hercules",
    i18nName: "Hercules",
    category: "equatorial",
    stars: [
      { id: "her_alpha", x: 60, y: 38 },
      { id: "her_beta", x: 64, y: 36 },
      { id: "her_gamma", x: 64, y: 42 },
      { id: "her_delta", x: 60, y: 44 },
      { id: "her_eps", x: 56, y: 36 },
      { id: "her_zeta", x: 68, y: 40 },
      { id: "her_eta", x: 56, y: 44 },
      { id: "her_theta", x: 68, y: 44 },
    ],
    connections: [
      ["her_alpha", "her_beta"],
      ["her_beta", "her_gamma"],
      ["her_gamma", "her_delta"],
      ["her_delta", "her_alpha"],
      ["her_alpha", "her_eps"],
      ["her_beta", "her_zeta"],
      ["her_delta", "her_eta"],
      ["her_gamma", "her_theta"],
    ],
    bonus: { productionMult: 0.11, capMult: 0.03 },
  },
  {
    id: "aquila",
    name: "Aquila",
    i18nName: "Aquila",
    category: "equatorial",
    stars: [
      { id: "aql_alpha", x: 76, y: 40 }, // Altair
      { id: "aql_beta", x: 78, y: 36 },
      { id: "aql_gamma", x: 74, y: 44 },
      { id: "aql_delta", x: 80, y: 42 },
      { id: "aql_eps", x: 72, y: 38 },
    ],
    connections: [
      ["aql_beta", "aql_alpha"],
      ["aql_alpha", "aql_gamma"],
      ["aql_alpha", "aql_delta"],
      ["aql_alpha", "aql_eps"],
    ],
    bonus: { productionMult: 0.05, divinityMult: 0.04 },
  },

  // ===== SOUTHERN (4) =====
  {
    id: "crux",
    name: "Crux",
    i18nName: "Crux",
    category: "southern",
    stars: [
      { id: "crux_alpha", x: 50, y: 78 },
      { id: "crux_beta", x: 48, y: 82 },
      { id: "crux_gamma", x: 52, y: 82 },
      { id: "crux_delta", x: 50, y: 86 },
    ],
    connections: [
      ["crux_alpha", "crux_delta"],
      ["crux_beta", "crux_gamma"],
    ],
    bonus: { productionMult: 0.06, divinityMult: 0.08 },
  },
  {
    id: "centaurus",
    name: "Centaurus",
    i18nName: "Centaurus",
    category: "southern",
    stars: [
      { id: "cen_alpha", x: 42, y: 80 }, // Rigil Kentaurus
      { id: "cen_beta", x: 38, y: 84 },  // Hadar
      { id: "cen_gamma", x: 44, y: 86 },
      { id: "cen_delta", x: 46, y: 82 },
      { id: "cen_eps", x: 36, y: 80 },
      { id: "cen_zeta", x: 40, y: 88 },
    ],
    connections: [
      ["cen_alpha", "cen_beta"],
      ["cen_alpha", "cen_delta"],
      ["cen_beta", "cen_eps"],
      ["cen_beta", "cen_zeta"],
      ["cen_delta", "cen_gamma"],
    ],
    bonus: { productionMult: 0.06, capMult: 0.04 },
  },
  {
    id: "carina",
    name: "Carina",
    i18nName: "Carina",
    category: "southern",
    stars: [
      { id: "car_alpha", x: 30, y: 80 }, // Canopus
      { id: "car_beta", x: 26, y: 84 },
      { id: "car_gamma", x: 34, y: 84 },
      { id: "car_delta", x: 28, y: 88 },
      { id: "car_eps", x: 32, y: 88 },
    ],
    connections: [
      ["car_alpha", "car_beta"],
      ["car_alpha", "car_gamma"],
      ["car_beta", "car_delta"],
      ["car_gamma", "car_eps"],
    ],
    bonus: { productionMult: 0.05, capMult: 0.05 },
  },
  {
    id: "bootes",
    name: "Boötes",
    i18nName: "Boötes",
    category: "equatorial",
    stars: [
      { id: "boo_alpha", x: 62, y: 64 }, // Arcturus
      { id: "boo_beta", x: 66, y: 60 },
      { id: "boo_gamma", x: 64, y: 70 },
      { id: "boo_delta", x: 68, y: 66 },
      { id: "boo_eps", x: 60, y: 60 },
    ],
    connections: [
      ["boo_alpha", "boo_beta"],
      ["boo_alpha", "boo_gamma"],
      ["boo_beta", "boo_eps"],
      ["boo_beta", "boo_delta"],
    ],
    bonus: { productionMult: 0.1 },
  },

  // ===== ADDITIONAL NORTHERN (15) =====
  // Prominent hand-positioned (Cepheus, Corona Borealis, Canes Venatici,
  // Delphinus, Sagitta, Lynx, Auriga) + faint/lesser pack (Camelopardalis,
  // Coma Berenices, Leo Minor, Vulpecula, Lacerta, Equuleus, Scutum, Canis Minor).
  {
    id: "cepheus",
    name: "Cepheus",
    i18nName: "Cepheus",
    category: "northern",
    stars: [
      { id: "cep_alpha", x: 88, y: 18 },
      { id: "cep_beta", x: 92, y: 14 },
      { id: "cep_gamma", x: 86, y: 12 },
      { id: "cep_delta", x: 90, y: 20 },
      { id: "cep_eps", x: 94, y: 18 },
      { id: "cep_zeta", x: 88, y: 22 },
    ],
    connections: [
      ["cep_alpha", "cep_beta"],
      ["cep_beta", "cep_gamma"],
      ["cep_gamma", "cep_delta"],
      ["cep_alpha", "cep_eps"],
      ["cep_eps", "cep_zeta"],
      ["cep_zeta", "cep_delta"],
    ],
    bonus: { capMult: 0.03, divinityMult: 0.01 },
  },
  {
    id: "corona_borealis",
    name: "Corona Borealis",
    i18nName: "Corona Borealis",
    category: "northern",
    stars: [
      { id: "crb_alpha", x: 70, y: 30 }, // Alphecca
      { id: "crb_beta", x: 68, y: 28 },
      { id: "crb_gamma", x: 72, y: 28 },
      { id: "crb_delta", x: 66, y: 30 },
      { id: "crb_eps", x: 74, y: 30 },
      { id: "crb_zeta", x: 64, y: 32 },
    ],
    connections: [
      ["crb_zeta", "crb_delta"],
      ["crb_delta", "crb_beta"],
      ["crb_beta", "crb_alpha"],
      ["crb_alpha", "crb_gamma"],
      ["crb_gamma", "crb_eps"],
    ],
    bonus: { productionMult: 0.02, divinityMult: 0.02 },
  },
  {
    id: "canes_venatici",
    name: "Canes Venatici",
    i18nName: "Canes Venatici",
    category: "northern",
    stars: [
      { id: "cvn_alpha", x: 30, y: 28 }, // Cor Caroli
      { id: "cvn_beta", x: 26, y: 30 },
      { id: "cvn_gamma", x: 32, y: 32 },
      { id: "cvn_delta", x: 28, y: 34 },
    ],
    connections: [
      ["cvn_alpha", "cvn_beta"],
      ["cvn_alpha", "cvn_gamma"],
      ["cvn_gamma", "cvn_delta"],
    ],
    bonus: { productionMult: 0.02 },
  },
  {
    id: "delphinus",
    name: "Delphinus",
    i18nName: "Delphinus",
    category: "northern",
    stars: [
      { id: "del_alpha", x: 76, y: 28 },
      { id: "del_beta", x: 78, y: 26 },
      { id: "del_gamma", x: 80, y: 28 },
      { id: "del_delta", x: 78, y: 30 },
      { id: "del_eps", x: 82, y: 30 },
    ],
    connections: [
      ["del_alpha", "del_beta"],
      ["del_beta", "del_gamma"],
      ["del_gamma", "del_delta"],
      ["del_delta", "del_alpha"],
      ["del_gamma", "del_eps"],
    ],
    bonus: { productionMult: 0.02, divinityMult: 0.01 },
  },
  {
    id: "sagitta",
    name: "Sagitta",
    i18nName: "Sagitta",
    category: "northern",
    stars: [
      { id: "sge_alpha", x: 72, y: 24 },
      { id: "sge_beta", x: 74, y: 22 },
      { id: "sge_gamma", x: 70, y: 22 },
      { id: "sge_delta", x: 76, y: 24 },
    ],
    connections: [
      ["sge_gamma", "sge_beta"],
      ["sge_beta", "sge_alpha"],
      ["sge_alpha", "sge_delta"],
    ],
    bonus: { productionMult: 0.02 },
  },
  {
    id: "vulpecula",
    name: "Vulpecula",
    i18nName: "Vulpecula",
    category: "northern",
    stars: [
      { id: "vul_alpha", x: 68, y: 26 },
      { id: "vul_beta", x: 70, y: 24 },
      { id: "vul_gamma", x: 66, y: 24 },
      { id: "vul_delta", x: 64, y: 26 },
      { id: "vul_eps", x: 68, y: 28 },
    ],
    connections: [
      ["vul_alpha", "vul_beta"],
      ["vul_beta", "vul_gamma"],
      ["vul_gamma", "vul_delta"],
      ["vul_alpha", "vul_eps"],
    ],
    bonus: { productionMult: 0.01, capMult: 0.01 },
  },
  {
    id: "equuleus",
    name: "Equuleus",
    i18nName: "Equuleus",
    category: "northern",
    stars: [
      { id: "equ_alpha", x: 84, y: 28 },
      { id: "equ_beta", x: 86, y: 26 },
      { id: "equ_gamma", x: 82, y: 26 },
      { id: "equ_delta", x: 84, y: 30 },
    ],
    connections: [
      ["equ_alpha", "equ_beta"],
      ["equ_beta", "equ_gamma"],
      ["equ_alpha", "equ_delta"],
    ],
    bonus: { productionMult: 0.01 },
  },
  {
    id: "lacerta",
    name: "Lacerta",
    i18nName: "Lacerta",
    category: "northern",
    stars: [
      { id: "lac_alpha", x: 90, y: 24 },
      { id: "lac_beta", x: 88, y: 22 },
      { id: "lac_gamma", x: 92, y: 22 },
      { id: "lac_delta", x: 86, y: 24 },
      { id: "lac_eps", x: 90, y: 26 },
    ],
    connections: [
      ["lac_delta", "lac_beta"],
      ["lac_beta", "lac_alpha"],
      ["lac_alpha", "lac_gamma"],
      ["lac_alpha", "lac_eps"],
    ],
    bonus: { productionMult: 0.01 },
  },
  {
    id: "auriga",
    name: "Auriga",
    i18nName: "Auriga",
    category: "northern",
    stars: [
      { id: "aur_alpha", x: 56, y: 30 }, // Capella
      { id: "aur_beta", x: 60, y: 32 },
      { id: "aur_gamma", x: 54, y: 34 },
      { id: "aur_delta", x: 58, y: 36 },
      { id: "aur_eps", x: 62, y: 34 },
      { id: "aur_zeta", x: 60, y: 30 },
    ],
    connections: [
      ["aur_alpha", "aur_beta"],
      ["aur_beta", "aur_eps"],
      ["aur_eps", "aur_delta"],
      ["aur_delta", "aur_gamma"],
      ["aur_gamma", "aur_alpha"],
      ["aur_beta", "aur_zeta"],
    ],
    bonus: { productionMult: 0.03, capMult: 0.01 },
  },
  {
    id: "lynx",
    name: "Lynx",
    i18nName: "Lynx",
    category: "northern",
    stars: [
      { id: "lyn_alpha", x: 44, y: 20 },
      { id: "lyn_beta", x: 40, y: 18 },
      { id: "lyn_gamma", x: 48, y: 22 },
      { id: "lyn_delta", x: 52, y: 20 },
      { id: "lyn_eps", x: 36, y: 16 },
      { id: "lyn_zeta", x: 32, y: 14 },
      { id: "lyn_eta", x: 28, y: 16 },
    ],
    connections: [
      ["lyn_eps", "lyn_beta"],
      ["lyn_beta", "lyn_alpha"],
      ["lyn_alpha", "lyn_gamma"],
      ["lyn_gamma", "lyn_delta"],
      ["lyn_eps", "lyn_zeta"],
      ["lyn_zeta", "lyn_eta"],
    ],
    bonus: { productionMult: 0.02, divinityMult: 0.01 },
  },
  {
    id: "leo_minor",
    name: "Leo Minor",
    i18nName: "Leo Minor",
    category: "northern",
    stars: [
      { id: "lm_alpha", x: 58, y: 24 },
      { id: "lm_beta", x: 56, y: 22 },
      { id: "lm_gamma", x: 60, y: 22 },
      { id: "lm_delta", x: 62, y: 24 },
    ],
    connections: [
      ["lm_beta", "lm_alpha"],
      ["lm_alpha", "lm_gamma"],
      ["lm_gamma", "lm_delta"],
    ],
    bonus: { productionMult: 0.01 },
  },
  {
    id: "coma_berenices",
    name: "Coma Berenices",
    i18nName: "Coma Berenices",
    category: "northern",
    stars: [
      { id: "com_alpha", x: 76, y: 32 },
      { id: "com_beta", x: 78, y: 30 },
      { id: "com_gamma", x: 74, y: 30 },
      { id: "com_delta", x: 80, y: 32 },
      { id: "com_eps", x: 76, y: 34 },
    ],
    connections: [
      ["com_gamma", "com_beta"],
      ["com_beta", "com_alpha"],
      ["com_alpha", "com_delta"],
      ["com_alpha", "com_eps"],
    ],
    bonus: { productionMult: 0.01, divinityMult: 0.01 },
  },
  {
    id: "camelopardalis",
    name: "Camelopardalis",
    i18nName: "Camelopardalis",
    category: "northern",
    stars: [
      { id: "cam_alpha", x: 22, y: 22 },
      { id: "cam_beta", x: 18, y: 20 },
      { id: "cam_gamma", x: 26, y: 24 },
      { id: "cam_delta", x: 20, y: 26 },
      { id: "cam_eps", x: 24, y: 20 },
    ],
    connections: [
      ["cam_beta", "cam_alpha"],
      ["cam_alpha", "cam_gamma"],
      ["cam_beta", "cam_delta"],
      ["cam_alpha", "cam_eps"],
    ],
    bonus: { capMult: 0.02 },
  },
  {
    id: "scutum",
    name: "Scutum",
    i18nName: "Scutum",
    category: "northern",
    stars: [
      { id: "sct_alpha", x: 60, y: 56 },
      { id: "sct_beta", x: 62, y: 54 },
      { id: "sct_gamma", x: 58, y: 54 },
      { id: "sct_delta", x: 60, y: 58 },
    ],
    connections: [
      ["sct_gamma", "sct_beta"],
      ["sct_beta", "sct_alpha"],
      ["sct_alpha", "sct_delta"],
    ],
    bonus: { productionMult: 0.02 },
  },
  {
    id: "canis_minor",
    name: "Canis Minor",
    i18nName: "Canis Minor",
    category: "northern",
    stars: [
      { id: "cma_alpha", x: 56, y: 36 }, // Procyon
      { id: "cma_beta", x: 54, y: 34 },
      { id: "cma_gamma", x: 58, y: 38 },
    ],
    connections: [
      ["cma_beta", "cma_alpha"],
      ["cma_alpha", "cma_gamma"],
    ],
    bonus: { productionMult: 0.02 },
  },

  // ===== ADDITIONAL EQUATORIAL (18) =====
  // Includes the largest constellations (Hydra, Eridanus, Serpens,
  // Ophiuchus, Cetus, Puppis, Vela) + several smaller patterns.
  {
    id: "hydra",
    name: "Hydra",
    i18nName: "Hydra",
    category: "equatorial",
    stars: [
      { id: "hya_alpha", x: 60, y: 50 }, // Alphard
      { id: "hya_beta", x: 56, y: 48 },
      { id: "hya_gamma", x: 52, y: 50 },
      { id: "hya_delta", x: 48, y: 52 },
      { id: "hya_eps", x: 44, y: 54 },
      { id: "hya_zeta", x: 40, y: 56 },
      { id: "hya_eta", x: 36, y: 58 },
      { id: "hya_theta", x: 32, y: 60 },
      { id: "hya_iota", x: 28, y: 62 },
      { id: "hya_kappa", x: 24, y: 64 },
      { id: "hya_lambda", x: 20, y: 66 },
      { id: "hya_mu", x: 64, y: 48 },
      { id: "hya_nu", x: 68, y: 46 },
      { id: "hya_xi", x: 72, y: 48 },
      { id: "hya_pi", x: 76, y: 50 },
    ],
    connections: [
      ["hya_pi", "hya_xi"],
      ["hya_xi", "hya_nu"],
      ["hya_nu", "hya_mu"],
      ["hya_mu", "hya_alpha"],
      ["hya_alpha", "hya_beta"],
      ["hya_beta", "hya_gamma"],
      ["hya_gamma", "hya_delta"],
      ["hya_delta", "hya_eps"],
      ["hya_eps", "hya_zeta"],
      ["hya_zeta", "hya_eta"],
      ["hya_eta", "hya_theta"],
      ["hya_theta", "hya_iota"],
      ["hya_iota", "hya_kappa"],
      ["hya_kappa", "hya_lambda"],
    ],
    bonus: { productionMult: 0.07, capMult: 0.07 },
  },
  {
    id: "eridanus",
    name: "Eridanus",
    i18nName: "Eridanus",
    category: "equatorial",
    stars: [
      { id: "eri_alpha", x: 8, y: 56 }, // Achernar (south end)
      { id: "eri_beta", x: 10, y: 52 },
      { id: "eri_gamma", x: 14, y: 54 },
      { id: "eri_delta", x: 18, y: 52 },
      { id: "eri_eps", x: 22, y: 50 },
      { id: "eri_zeta", x: 26, y: 48 },
      { id: "eri_eta", x: 30, y: 46 },
      { id: "eri_theta", x: 34, y: 44 },
      { id: "eri_iota", x: 38, y: 42 },
      { id: "eri_kappa", x: 42, y: 40 },
      { id: "eri_lambda", x: 46, y: 38 },
      { id: "eri_mu", x: 50, y: 36 },
    ],
    connections: [
      ["eri_alpha", "eri_beta"],
      ["eri_beta", "eri_gamma"],
      ["eri_gamma", "eri_delta"],
      ["eri_delta", "eri_eps"],
      ["eri_eps", "eri_zeta"],
      ["eri_zeta", "eri_eta"],
      ["eri_eta", "eri_theta"],
      ["eri_theta", "eri_iota"],
      ["eri_iota", "eri_kappa"],
      ["eri_kappa", "eri_lambda"],
      ["eri_lambda", "eri_mu"],
    ],
    bonus: { productionMult: 0.05, capMult: 0.03 },
  },
  {
    id: "cetus",
    name: "Cetus",
    i18nName: "Cetus",
    category: "equatorial",
    stars: [
      { id: "cet_alpha", x: 18, y: 48 }, // Menkar
      { id: "cet_beta", x: 24, y: 50 },  // Deneb Kaitos (Diphda)
      { id: "cet_gamma", x: 22, y: 44 },
      { id: "cet_delta", x: 28, y: 46 },
      { id: "cet_eps", x: 14, y: 46 },
      { id: "cet_zeta", x: 30, y: 52 },
      { id: "cet_eta", x: 26, y: 54 },
      { id: "cet_theta", x: 20, y: 52 },
    ],
    connections: [
      ["cet_eps", "cet_alpha"],
      ["cet_alpha", "cet_gamma"],
      ["cet_gamma", "cet_delta"],
      ["cet_delta", "cet_beta"],
      ["cet_beta", "cet_zeta"],
      ["cet_zeta", "cet_eta"],
      ["cet_eta", "cet_theta"],
      ["cet_theta", "cet_beta"],
    ],
    bonus: { capMult: 0.04, costMult: -0.01 },
  },
  {
    id: "ophiuchus",
    name: "Ophiuchus",
    i18nName: "Ophiuchus",
    category: "equatorial",
    stars: [
      { id: "oph_alpha", x: 70, y: 48 }, // Rasalhague
      { id: "oph_beta", x: 74, y: 52 },
      { id: "oph_gamma", x: 66, y: 52 },
      { id: "oph_delta", x: 72, y: 56 },
      { id: "oph_eps", x: 68, y: 56 },
      { id: "oph_zeta", x: 76, y: 48 },
      { id: "oph_eta", x: 62, y: 50 },
      { id: "oph_theta", x: 78, y: 54 },
    ],
    connections: [
      ["oph_alpha", "oph_beta"],
      ["oph_alpha", "oph_gamma"],
      ["oph_alpha", "oph_zeta"],
      ["oph_gamma", "oph_eps"],
      ["oph_eps", "oph_delta"],
      ["oph_delta", "oph_beta"],
      ["oph_gamma", "oph_eta"],
      ["oph_beta", "oph_theta"],
    ],
    bonus: { productionMult: 0.04, capMult: 0.04 },
  },
  {
    id: "serpens",
    name: "Serpens",
    i18nName: "Serpens",
    category: "equatorial",
    stars: [
      { id: "ser_alpha", x: 64, y: 50 }, // Unukalhai (Caput head)
      { id: "ser_beta", x: 62, y: 48 },
      { id: "ser_gamma", x: 66, y: 52 },
      { id: "ser_delta", x: 80, y: 54 }, // Cauda tail
      { id: "ser_eps", x: 76, y: 56 },
      { id: "ser_zeta", x: 72, y: 54 },
      { id: "ser_eta", x: 84, y: 52 },
      { id: "ser_theta", x: 86, y: 56 },
      { id: "ser_iota", x: 88, y: 54 },
      { id: "ser_kappa", x: 82, y: 58 },
    ],
    connections: [
      ["ser_beta", "ser_alpha"],
      ["ser_alpha", "ser_gamma"],
      ["ser_gamma", "ser_zeta"],
      ["ser_zeta", "ser_eps"],
      ["ser_eps", "ser_delta"],
      ["ser_delta", "ser_eta"],
      ["ser_eta", "ser_theta"],
      ["ser_theta", "ser_iota"],
      ["ser_delta", "ser_kappa"],
    ],
    bonus: { productionMult: 0.04, capMult: 0.03 },
  },
  {
    id: "canis_major",
    name: "Canis Major",
    i18nName: "Canis Major",
    category: "equatorial",
    stars: [
      { id: "cma2_alpha", x: 40, y: 64 }, // Sirius
      { id: "cma2_beta", x: 38, y: 62 },  // Mirzam
      { id: "cma2_gamma", x: 44, y: 66 },
      { id: "cma2_delta", x: 42, y: 70 },
      { id: "cma2_eps", x: 46, y: 68 },
      { id: "cma2_zeta", x: 36, y: 68 },
      { id: "cma2_eta", x: 48, y: 70 },
    ],
    connections: [
      ["cma2_beta", "cma2_alpha"],
      ["cma2_alpha", "cma2_gamma"],
      ["cma2_gamma", "cma2_eps"],
      ["cma2_eps", "cma2_delta"],
      ["cma2_alpha", "cma2_zeta"],
      ["cma2_eps", "cma2_eta"],
    ],
    bonus: { productionMult: 0.03, divinityMult: 0.03 },
  },
  {
    id: "monoceros",
    name: "Monoceros",
    i18nName: "Monoceros",
    category: "equatorial",
    stars: [
      { id: "mon_alpha", x: 46, y: 50 },
      { id: "mon_beta", x: 44, y: 48 },
      { id: "mon_gamma", x: 48, y: 52 },
      { id: "mon_delta", x: 42, y: 52 },
      { id: "mon_eps", x: 50, y: 50 },
    ],
    connections: [
      ["mon_beta", "mon_alpha"],
      ["mon_alpha", "mon_gamma"],
      ["mon_alpha", "mon_eps"],
      ["mon_delta", "mon_beta"],
    ],
    bonus: { productionMult: 0.02 },
  },
  {
    id: "lepus",
    name: "Lepus",
    i18nName: "Lepus",
    category: "equatorial",
    stars: [
      { id: "lep_alpha", x: 14, y: 50 },
      { id: "lep_beta", x: 12, y: 52 },
      { id: "lep_gamma", x: 16, y: 52 },
      { id: "lep_delta", x: 14, y: 54 },
      { id: "lep_eps", x: 18, y: 50 },
    ],
    connections: [
      ["lep_beta", "lep_alpha"],
      ["lep_alpha", "lep_gamma"],
      ["lep_beta", "lep_delta"],
      ["lep_alpha", "lep_eps"],
    ],
    bonus: { capMult: 0.02 },
  },
  {
    id: "corvus",
    name: "Corvus",
    i18nName: "Corvus",
    category: "equatorial",
    stars: [
      { id: "crv_alpha", x: 56, y: 56 },
      { id: "crv_beta", x: 60, y: 54 },
      { id: "crv_gamma", x: 58, y: 58 },
      { id: "crv_delta", x: 62, y: 56 },
      { id: "crv_eps", x: 54, y: 54 },
    ],
    connections: [
      ["crv_eps", "crv_alpha"],
      ["crv_alpha", "crv_gamma"],
      ["crv_gamma", "crv_delta"],
      ["crv_delta", "crv_beta"],
      ["crv_beta", "crv_alpha"],
    ],
    bonus: { capMult: 0.02 },
  },
  {
    id: "crater",
    name: "Crater",
    i18nName: "Crater",
    category: "equatorial",
    stars: [
      { id: "crt_alpha", x: 52, y: 60 },
      { id: "crt_beta", x: 50, y: 58 },
      { id: "crt_gamma", x: 54, y: 62 },
      { id: "crt_delta", x: 48, y: 62 },
      { id: "crt_eps", x: 52, y: 64 },
    ],
    connections: [
      ["crt_beta", "crt_alpha"],
      ["crt_alpha", "crt_gamma"],
      ["crt_gamma", "crt_eps"],
      ["crt_eps", "crt_delta"],
      ["crt_delta", "crt_beta"],
    ],
    bonus: { capMult: 0.02, costMult: -0.01 },
  },
  {
    id: "sextans",
    name: "Sextans",
    i18nName: "Sextans",
    category: "equatorial",
    stars: [
      { id: "sex_alpha", x: 64, y: 56 },
      { id: "sex_beta", x: 66, y: 54 },
      { id: "sex_gamma", x: 62, y: 58 },
      { id: "sex_delta", x: 64, y: 60 },
      { id: "sex_eps", x: 60, y: 56 },
    ],
    connections: [
      ["sex_eps", "sex_alpha"],
      ["sex_alpha", "sex_beta"],
      ["sex_alpha", "sex_gamma"],
      ["sex_gamma", "sex_delta"],
    ],
    bonus: { costMult: -0.02 },
  },
  {
    id: "pyxis",
    name: "Pyxis",
    i18nName: "Pyxis",
    category: "equatorial",
    stars: [
      { id: "pyx_alpha", x: 36, y: 60 },
      { id: "pyx_beta", x: 38, y: 58 },
      { id: "pyx_gamma", x: 34, y: 62 },
      { id: "pyx_delta", x: 38, y: 62 },
    ],
    connections: [
      ["pyx_beta", "pyx_alpha"],
      ["pyx_alpha", "pyx_gamma"],
      ["pyx_gamma", "pyx_delta"],
    ],
    bonus: { capMult: 0.01 },
  },
  {
    id: "puppis",
    name: "Puppis",
    i18nName: "Puppis",
    category: "equatorial",
    stars: [
      { id: "pup_alpha", x: 38, y: 70 },
      { id: "pup_beta", x: 36, y: 72 },
      { id: "pup_gamma", x: 40, y: 74 },
      { id: "pup_delta", x: 34, y: 68 },
      { id: "pup_eps", x: 42, y: 76 },
      { id: "pup_zeta", x: 32, y: 70 },
      { id: "pup_eta", x: 38, y: 76 },
    ],
    connections: [
      ["pup_delta", "pup_zeta"],
      ["pup_zeta", "pup_beta"],
      ["pup_beta", "pup_alpha"],
      ["pup_alpha", "pup_gamma"],
      ["pup_gamma", "pup_eps"],
      ["pup_gamma", "pup_eta"],
    ],
    bonus: { productionMult: 0.04 },
  },
  {
    id: "vela",
    name: "Vela",
    i18nName: "Vela",
    category: "equatorial",
    stars: [
      { id: "vel_alpha", x: 46, y: 72 },
      { id: "vel_beta", x: 44, y: 70 },
      { id: "vel_gamma", x: 48, y: 74 },
      { id: "vel_delta", x: 42, y: 74 },
      { id: "vel_eps", x: 50, y: 76 },
      { id: "vel_zeta", x: 40, y: 76 },
      { id: "vel_eta", x: 52, y: 74 },
      { id: "vel_theta", x: 46, y: 78 },
    ],
    connections: [
      ["vel_zeta", "vel_delta"],
      ["vel_delta", "vel_beta"],
      ["vel_beta", "vel_alpha"],
      ["vel_alpha", "vel_gamma"],
      ["vel_gamma", "vel_eps"],
      ["vel_eps", "vel_eta"],
      ["vel_gamma", "vel_theta"],
    ],
    bonus: { capMult: 0.05, divinityMult: 0.02 },
  },
  {
    id: "fornax",
    name: "Fornax",
    i18nName: "Fornax",
    category: "equatorial",
    stars: [
      { id: "for_alpha", x: 16, y: 56 },
      { id: "for_beta", x: 14, y: 58 },
      { id: "for_gamma", x: 18, y: 58 },
      { id: "for_delta", x: 16, y: 60 },
    ],
    connections: [
      ["for_beta", "for_alpha"],
      ["for_alpha", "for_gamma"],
      ["for_alpha", "for_delta"],
    ],
    bonus: { costMult: -0.02 },
  },
  {
    id: "piscis_austrinus",
    name: "Piscis Austrinus",
    i18nName: "Piscis Austrinus",
    category: "equatorial",
    stars: [
      { id: "psa_alpha", x: 72, y: 60 }, // Fomalhaut
      { id: "psa_beta", x: 70, y: 62 },
      { id: "psa_gamma", x: 74, y: 62 },
      { id: "psa_delta", x: 76, y: 60 },
      { id: "psa_eps", x: 72, y: 64 },
    ],
    connections: [
      ["psa_beta", "psa_alpha"],
      ["psa_alpha", "psa_gamma"],
      ["psa_gamma", "psa_delta"],
      ["psa_alpha", "psa_eps"],
    ],
    bonus: { capMult: 0.03 },
  },
  {
    id: "triangulum",
    name: "Triangulum",
    i18nName: "Triangulum",
    category: "equatorial",
    stars: [
      { id: "tri_alpha", x: 84, y: 24 },
      { id: "tri_beta", x: 86, y: 22 },
      { id: "tri_gamma", x: 82, y: 22 },
    ],
    connections: [
      ["tri_alpha", "tri_beta"],
      ["tri_beta", "tri_gamma"],
      ["tri_gamma", "tri_alpha"],
    ],
    bonus: { productionMult: 0.02, divinityMult: 0.01 },
  },
  {
    id: "antlia",
    name: "Antlia",
    i18nName: "Antlia",
    category: "equatorial",
    stars: [
      { id: "ant_alpha", x: 44, y: 66 },
      { id: "ant_beta", x: 42, y: 64 },
      { id: "ant_gamma", x: 46, y: 64 },
    ],
    connections: [
      ["ant_beta", "ant_alpha"],
      ["ant_alpha", "ant_gamma"],
    ],
    bonus: { productionMult: 0.02 },
  },

  // ===== ADDITIONAL SOUTHERN (27) =====
  // Small faint patterns + prominent southern sky (Phoenix, Pavo,
  // Octans near pole, Triangulum Australe, Lupus).
  {
    id: "phoenix",
    name: "Phoenix",
    i18nName: "Phoenix",
    category: "southern",
    stars: [
      { id: "phe_alpha", x: 22, y: 78 },
      { id: "phe_beta", x: 20, y: 76 },
      { id: "phe_gamma", x: 24, y: 80 },
      { id: "phe_delta", x: 18, y: 82 },
      { id: "phe_eps", x: 22, y: 84 },
      { id: "phe_zeta", x: 26, y: 82 },
    ],
    connections: [
      ["phe_beta", "phe_alpha"],
      ["phe_alpha", "phe_gamma"],
      ["phe_gamma", "phe_zeta"],
      ["phe_gamma", "phe_eps"],
      ["phe_eps", "phe_delta"],
    ],
    bonus: { divinityMult: 0.02, costMult: -0.01 },
  },
  {
    id: "pavo",
    name: "Pavo",
    i18nName: "Pavo",
    category: "southern",
    stars: [
      { id: "pav_alpha", x: 70, y: 88 },
      { id: "pav_beta", x: 68, y: 86 },
      { id: "pav_gamma", x: 72, y: 86 },
      { id: "pav_delta", x: 66, y: 90 },
      { id: "pav_eps", x: 74, y: 90 },
      { id: "pav_zeta", x: 70, y: 92 },
      { id: "pav_eta", x: 76, y: 88 },
    ],
    connections: [
      ["pav_beta", "pav_alpha"],
      ["pav_alpha", "pav_gamma"],
      ["pav_gamma", "pav_eta"],
      ["pav_beta", "pav_delta"],
      ["pav_delta", "pav_zeta"],
      ["pav_zeta", "pav_eps"],
      ["pav_eps", "pav_gamma"],
    ],
    bonus: { divinityMult: 0.02 },
  },
  {
    id: "octans",
    name: "Octans",
    i18nName: "Octans",
    category: "southern",
    stars: [
      { id: "oct_alpha", x: 50, y: 96 }, // Sigma Octantis (south pole star)
      { id: "oct_beta", x: 48, y: 94 },
      { id: "oct_gamma", x: 52, y: 94 },
      { id: "oct_delta", x: 46, y: 96 },
      { id: "oct_eps", x: 54, y: 96 },
    ],
    connections: [
      ["oct_delta", "oct_beta"],
      ["oct_beta", "oct_alpha"],
      ["oct_alpha", "oct_gamma"],
      ["oct_gamma", "oct_eps"],
    ],
    bonus: { divinityMult: 0.03 },
  },
  {
    id: "triangulum_australe",
    name: "Triangulum Australe",
    i18nName: "Triangulum Australe",
    category: "southern",
    stars: [
      { id: "tra_alpha", x: 62, y: 84 },
      { id: "tra_beta", x: 60, y: 88 },
      { id: "tra_gamma", x: 64, y: 88 },
      { id: "tra_delta", x: 62, y: 90 },
    ],
    connections: [
      ["tra_alpha", "tra_beta"],
      ["tra_beta", "tra_delta"],
      ["tra_delta", "tra_gamma"],
      ["tra_gamma", "tra_alpha"],
    ],
    bonus: { divinityMult: 0.02 },
  },
  {
    id: "lupus",
    name: "Lupus",
    i18nName: "Lupus",
    category: "southern",
    stars: [
      { id: "lup_alpha", x: 54, y: 78 },
      { id: "lup_beta", x: 52, y: 76 },
      { id: "lup_gamma", x: 56, y: 80 },
      { id: "lup_delta", x: 50, y: 80 },
      { id: "lup_eps", x: 58, y: 78 },
      { id: "lup_zeta", x: 56, y: 82 },
    ],
    connections: [
      ["lup_beta", "lup_alpha"],
      ["lup_alpha", "lup_gamma"],
      ["lup_gamma", "lup_eps"],
      ["lup_gamma", "lup_zeta"],
      ["lup_beta", "lup_delta"],
    ],
    bonus: { productionMult: 0.03, capMult: 0.01 },
  },
  {
    id: "ara",
    name: "Ara",
    i18nName: "Ara",
    category: "southern",
    stars: [
      { id: "ara_alpha", x: 78, y: 78 },
      { id: "ara_beta", x: 76, y: 76 },
      { id: "ara_gamma", x: 80, y: 80 },
      { id: "ara_delta", x: 78, y: 82 },
      { id: "ara_eps", x: 82, y: 78 },
    ],
    connections: [
      ["ara_beta", "ara_alpha"],
      ["ara_alpha", "ara_gamma"],
      ["ara_gamma", "ara_delta"],
      ["ara_alpha", "ara_eps"],
    ],
    bonus: { capMult: 0.02, divinityMult: 0.02 },
  },
  {
    id: "dorado",
    name: "Dorado",
    i18nName: "Dorado",
    category: "southern",
    stars: [
      { id: "dor_alpha", x: 78, y: 88 },
      { id: "dor_beta", x: 76, y: 86 },
      { id: "dor_gamma", x: 80, y: 90 },
      { id: "dor_delta", x: 82, y: 88 },
      { id: "dor_eps", x: 78, y: 92 },
    ],
    connections: [
      ["dor_beta", "dor_alpha"],
      ["dor_alpha", "dor_delta"],
      ["dor_delta", "dor_gamma"],
      ["dor_gamma", "dor_eps"],
    ],
    bonus: { divinityMult: 0.02 },
  },
  {
    id: "grus",
    name: "Grus",
    i18nName: "Grus",
    category: "southern",
    stars: [
      { id: "gru_alpha", x: 88, y: 82 }, // Alnair
      { id: "gru_beta", x: 86, y: 80 },
      { id: "gru_gamma", x: 92, y: 84 },
      { id: "gru_delta", x: 90, y: 86 },
      { id: "gru_eps", x: 94, y: 82 },
    ],
    connections: [
      ["gru_beta", "gru_alpha"],
      ["gru_alpha", "gru_gamma"],
      ["gru_gamma", "gru_delta"],
      ["gru_gamma", "gru_eps"],
    ],
    bonus: { divinityMult: 0.02 },
  },
  {
    id: "tucana",
    name: "Tucana",
    i18nName: "Tucana",
    category: "southern",
    stars: [
      { id: "tuc_alpha", x: 90, y: 92 },
      { id: "tuc_beta", x: 92, y: 90 },
      { id: "tuc_gamma", x: 88, y: 94 },
      { id: "tuc_delta", x: 86, y: 90 },
    ],
    connections: [
      ["tuc_delta", "tuc_alpha"],
      ["tuc_alpha", "tuc_beta"],
      ["tuc_alpha", "tuc_gamma"],
    ],
    bonus: { divinityMult: 0.02 },
  },
  {
    id: "indus",
    name: "Indus",
    i18nName: "Indus",
    category: "southern",
    stars: [
      { id: "ind_alpha", x: 84, y: 86 },
      { id: "ind_beta", x: 82, y: 84 },
      { id: "ind_gamma", x: 86, y: 88 },
      { id: "ind_delta", x: 80, y: 88 },
      { id: "ind_eps", x: 84, y: 90 },
    ],
    connections: [
      ["ind_beta", "ind_alpha"],
      ["ind_alpha", "ind_gamma"],
      ["ind_beta", "ind_delta"],
      ["ind_gamma", "ind_eps"],
    ],
    bonus: { divinityMult: 0.02 },
  },
  {
    id: "pictor",
    name: "Pictor",
    i18nName: "Pictor",
    category: "southern",
    stars: [
      { id: "pic_alpha", x: 60, y: 84 },
      { id: "pic_beta", x: 58, y: 82 },
      { id: "pic_gamma", x: 62, y: 86 },
      { id: "pic_delta", x: 64, y: 84 },
    ],
    connections: [
      ["pic_beta", "pic_alpha"],
      ["pic_alpha", "pic_delta"],
      ["pic_alpha", "pic_gamma"],
    ],
    bonus: { costMult: -0.01 },
  },
  {
    id: "reticulum",
    name: "Reticulum",
    i18nName: "Reticulum",
    category: "southern",
    stars: [
      { id: "ret_alpha", x: 76, y: 82 },
      { id: "ret_beta", x: 74, y: 80 },
      { id: "ret_gamma", x: 78, y: 84 },
      { id: "ret_delta", x: 74, y: 84 },
    ],
    connections: [
      ["ret_beta", "ret_alpha"],
      ["ret_alpha", "ret_gamma"],
      ["ret_gamma", "ret_delta"],
      ["ret_delta", "ret_beta"],
    ],
    bonus: { divinityMult: 0.02 },
  },
  {
    id: "horologium",
    name: "Horologium",
    i18nName: "Horologium",
    category: "southern",
    stars: [
      { id: "hor_alpha", x: 70, y: 82 },
      { id: "hor_beta", x: 68, y: 80 },
      { id: "hor_gamma", x: 72, y: 84 },
      { id: "hor_delta", x: 70, y: 86 },
      { id: "hor_eps", x: 66, y: 84 },
    ],
    connections: [
      ["hor_beta", "hor_alpha"],
      ["hor_alpha", "hor_gamma"],
      ["hor_gamma", "hor_delta"],
      ["hor_beta", "hor_eps"],
    ],
    bonus: { capMult: 0.01, costMult: -0.01 },
  },
  {
    id: "sculptor",
    name: "Sculptor",
    i18nName: "Sculptor",
    category: "southern",
    stars: [
      { id: "scl_alpha", x: 66, y: 76 },
      { id: "scl_beta", x: 64, y: 74 },
      { id: "scl_gamma", x: 68, y: 78 },
      { id: "scl_delta", x: 62, y: 78 },
      { id: "scl_eps", x: 66, y: 80 },
    ],
    connections: [
      ["scl_beta", "scl_alpha"],
      ["scl_alpha", "scl_gamma"],
      ["scl_gamma", "scl_eps"],
      ["scl_eps", "scl_delta"],
      ["scl_delta", "scl_beta"],
    ],
    bonus: { costMult: -0.02 },
  },
  {
    id: "telescopium",
    name: "Telescopium",
    i18nName: "Telescopium",
    category: "southern",
    stars: [
      { id: "tel_alpha", x: 80, y: 78 },
      { id: "tel_beta", x: 78, y: 76 },
      { id: "tel_gamma", x: 82, y: 80 },
      { id: "tel_delta", x: 84, y: 78 },
      { id: "tel_eps", x: 80, y: 82 },
    ],
    connections: [
      ["tel_beta", "tel_alpha"],
      ["tel_alpha", "tel_gamma"],
      ["tel_gamma", "tel_eps"],
      ["tel_gamma", "tel_delta"],
    ],
    bonus: { costMult: -0.02 },
  },
  {
    id: "microscopium",
    name: "Microscopium",
    i18nName: "Microscopium",
    category: "southern",
    stars: [
      { id: "mic_alpha", x: 86, y: 78 },
      { id: "mic_beta", x: 84, y: 76 },
      { id: "mic_gamma", x: 88, y: 80 },
      { id: "mic_delta", x: 86, y: 82 },
    ],
    connections: [
      ["mic_beta", "mic_alpha"],
      ["mic_alpha", "mic_gamma"],
      ["mic_gamma", "mic_delta"],
    ],
    bonus: { costMult: -0.01 },
  },
  {
    id: "norma",
    name: "Norma",
    i18nName: "Norma",
    category: "southern",
    stars: [
      { id: "nor_alpha", x: 66, y: 80 },
      { id: "nor_beta", x: 64, y: 78 },
      { id: "nor_gamma", x: 68, y: 82 },
      { id: "nor_delta", x: 70, y: 80 },
      { id: "nor_eps", x: 66, y: 84 },
    ],
    connections: [
      ["nor_beta", "nor_alpha"],
      ["nor_alpha", "nor_gamma"],
      ["nor_gamma", "nor_delta"],
      ["nor_alpha", "nor_eps"],
    ],
    bonus: { capMult: 0.01, costMult: -0.01 },
  },
  {
    id: "circinus",
    name: "Circinus",
    i18nName: "Circinus",
    category: "southern",
    stars: [
      { id: "cir_alpha", x: 60, y: 78 },
      { id: "cir_beta", x: 58, y: 76 },
      { id: "cir_gamma", x: 62, y: 80 },
      { id: "cir_delta", x: 60, y: 82 },
    ],
    connections: [
      ["cir_beta", "cir_alpha"],
      ["cir_alpha", "cir_gamma"],
      ["cir_alpha", "cir_delta"],
    ],
    bonus: { costMult: -0.01, divinityMult: 0.01 },
  },
  {
    id: "mensa",
    name: "Mensa",
    i18nName: "Mensa",
    category: "southern",
    stars: [
      { id: "men_alpha", x: 82, y: 88 },
      { id: "men_beta", x: 80, y: 86 },
      { id: "men_gamma", x: 84, y: 90 },
      { id: "men_delta", x: 86, y: 88 },
    ],
    connections: [
      ["men_beta", "men_alpha"],
      ["men_alpha", "men_gamma"],
      ["men_gamma", "men_delta"],
    ],
    bonus: { divinityMult: 0.01 },
  },
  {
    id: "chamaeleon",
    name: "Chamaeleon",
    i18nName: "Chamaeleon",
    category: "southern",
    stars: [
      { id: "cha_alpha", x: 64, y: 92 },
      { id: "cha_beta", x: 62, y: 90 },
      { id: "cha_gamma", x: 66, y: 94 },
      { id: "cha_delta", x: 64, y: 96 },
    ],
    connections: [
      ["cha_beta", "cha_alpha"],
      ["cha_alpha", "cha_gamma"],
      ["cha_gamma", "cha_delta"],
    ],
    bonus: { divinityMult: 0.01 },
  },
  {
    id: "musca",
    name: "Musca",
    i18nName: "Musca",
    category: "southern",
    stars: [
      { id: "mus_alpha", x: 60, y: 86 },
      { id: "mus_beta", x: 58, y: 84 },
      { id: "mus_gamma", x: 62, y: 88 },
      { id: "mus_delta", x: 60, y: 90 },
    ],
    connections: [
      ["mus_beta", "mus_alpha"],
      ["mus_alpha", "mus_gamma"],
      ["mus_gamma", "mus_delta"],
    ],
    bonus: { divinityMult: 0.01 },
  },
  {
    id: "volans",
    name: "Volans",
    i18nName: "Volans",
    category: "southern",
    stars: [
      { id: "vol_alpha", x: 78, y: 92 },
      { id: "vol_beta", x: 76, y: 90 },
      { id: "vol_gamma", x: 80, y: 94 },
      { id: "vol_delta", x: 82, y: 92 },
      { id: "vol_eps", x: 78, y: 96 },
    ],
    connections: [
      ["vol_beta", "vol_alpha"],
      ["vol_alpha", "vol_delta"],
      ["vol_alpha", "vol_gamma"],
      ["vol_gamma", "vol_eps"],
    ],
    bonus: { divinityMult: 0.01 },
  },
  {
    id: "apus",
    name: "Apus",
    i18nName: "Apus",
    category: "southern",
    stars: [
      { id: "aps_alpha", x: 74, y: 92 },
      { id: "aps_beta", x: 72, y: 90 },
      { id: "aps_gamma", x: 76, y: 94 },
      { id: "aps_delta", x: 74, y: 96 },
    ],
    connections: [
      ["aps_beta", "aps_alpha"],
      ["aps_alpha", "aps_gamma"],
      ["aps_gamma", "aps_delta"],
    ],
    bonus: { divinityMult: 0.01 },
  },
  {
    id: "caelum",
    name: "Caelum",
    i18nName: "Caelum",
    category: "southern",
    stars: [
      { id: "cae_alpha", x: 84, y: 84 },
      { id: "cae_beta", x: 82, y: 82 },
      { id: "cae_gamma", x: 86, y: 86 },
      { id: "cae_delta", x: 84, y: 88 },
    ],
    connections: [
      ["cae_beta", "cae_alpha"],
      ["cae_alpha", "cae_gamma"],
      ["cae_gamma", "cae_delta"],
    ],
    bonus: { costMult: -0.01 },
  },
  {
    id: "columba",
    name: "Columba",
    i18nName: "Columba",
    category: "southern",
    stars: [
      { id: "col_alpha", x: 88, y: 88 },
      { id: "col_beta", x: 86, y: 86 },
      { id: "col_gamma", x: 90, y: 90 },
      { id: "col_delta", x: 88, y: 92 },
      { id: "col_eps", x: 92, y: 88 },
    ],
    connections: [
      ["col_beta", "col_alpha"],
      ["col_alpha", "col_gamma"],
      ["col_gamma", "col_delta"],
      ["col_alpha", "col_eps"],
    ],
    bonus: { divinityMult: 0.01 },
  },
  {
    id: "corona_australis",
    name: "Corona Australis",
    i18nName: "Corona Australis",
    category: "southern",
    stars: [
      { id: "cra_alpha", x: 76, y: 70 },
      { id: "cra_beta", x: 74, y: 68 },
      { id: "cra_gamma", x: 78, y: 72 },
      { id: "cra_delta", x: 72, y: 70 },
      { id: "cra_eps", x: 80, y: 70 },
    ],
    connections: [
      ["cra_delta", "cra_beta"],
      ["cra_beta", "cra_alpha"],
      ["cra_alpha", "cra_gamma"],
      ["cra_gamma", "cra_eps"],
    ],
    bonus: { capMult: 0.01, divinityMult: 0.01 },
  },
  {
    id: "hydrus",
    name: "Hydrus",
    i18nName: "Hydrus",
    category: "southern",
    stars: [
      { id: "hyi_alpha", x: 44, y: 86 }, // Beta Hyi (near south pole region)
      { id: "hyi_beta", x: 42, y: 84 },
      { id: "hyi_gamma", x: 46, y: 88 },
      { id: "hyi_delta", x: 48, y: 86 },
      { id: "hyi_eps", x: 50, y: 90 },
    ],
    connections: [
      ["hyi_beta", "hyi_alpha"],
      ["hyi_alpha", "hyi_gamma"],
      ["hyi_gamma", "hyi_delta"],
      ["hyi_delta", "hyi_eps"],
    ],
    bonus: { divinityMult: 0.02 },
  },
];

export const CONSTELLATION_MAP: Record<string, ConstellationDef> = Object.fromEntries(
  CONSTELLATIONS.map((c) => [c.id, c])
);

// Build a star id → constellation id lookup.
export const STAR_TO_CONSTELLATION: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const c of CONSTELLATIONS) {
    for (const s of c.stars) m[s.id] = c.id;
  }
  return m;
})();

// ---------------------------------------------------------------------------
// COST MODEL
// ---------------------------------------------------------------------------

/**
 * Shape of the constellation-related state used by the cost model and bonus
 * aggregation. Matches the GameState subset, but parameterized for testing.
 */
export interface ConstellationState {
  constellationStars: Record<string, boolean>;
  constellationProgress: Record<string, number>;
  constellationsStarted: Record<string, boolean>;
  constellationsCompleted: Record<string, boolean>;
}

/**
 * Compute the Divinity cost of illuminating the next star in a constellation.
 *
 * Formula:
 *   baseCost × (withinConstellationGrowth ^ litInThisConstellation)
 *             × (costGrowth ^ N)
 *
 * Where:
 *   `litInThisConstellation` = count of already-lit stars in `constellationId`.
 *   `N` = number of OTHER started constellations (i.e. startedCount minus 1 if
 *        this constellation is already started). This is the "new constellation
 *        penalty" — it kicks in when starting a brand-new constellation
 *        (because every other started constellation counts toward N) and STICKS
 *        for every subsequent star within that constellation, encouraging the
 *        player to finish a constellation before starting a new one.
 *
 * Concrete example (baseCost = 10):
 *   A·star1 (no started):        10 × 1.5^0 × 2.0^0 = 10
 *   A·star2 (A started):          10 × 1.5^1 × 2.0^0 = 15
 *   A·star3 (A started):          10 × 1.5^2 × 2.0^0 = 22.5
 *   B·star1 (A started, B new):   10 × 1.5^0 × 2.0^1 = 20  (new constellation)
 *   B·star2 (A+B started):         10 × 1.5^1 × 2.0^1 = 30  (penalty sticks!)
 *   Cass·star1 (A+B started):      10 × 1.5^0 × 2.0^2 = 40  (two others)
 */
export function starCost(
  constellationId: string,
  state: ConstellationState,
  starId?: string,
  opts?: { baseCost?: number; foresightDiscountMult?: number }
): number {
  const baseCost = opts?.baseCost ?? CONSTELLATION_BASE_COST;
  const litInThis = state.constellationProgress?.[constellationId] || 0;
  // N = number of OTHER started constellations (exclude the current one if
  // already started). This is the "new constellation penalty" — it sticks
  // for every star within a started constellation, so switching to B before
  // finishing A makes EVERY B star cost 2× more, not just the first.
  const startedCount = Object.keys(state.constellationsStarted || {}).filter(
    (k) => state.constellationsStarted[k]
  ).length;
  const thisStarted = !!state.constellationsStarted?.[constellationId];
  const N = Math.max(0, startedCount - (thisStarted ? 1 : 0));
  let cost =
    baseCost *
    Math.pow(WITHIN_CONSTELLATION_GROWTH, litInThis) *
    Math.pow(COST_GROWTH_PER_STARTED, N);
  // LAYER UPGRADE — foresight_discount: multiplicative -20% per level (max 5).
  if (opts?.foresightDiscountMult && opts.foresightDiscountMult < 1) {
    cost *= opts.foresightDiscountMult;
  }
  return Math.ceil(cost);
}

// ---------------------------------------------------------------------------
// BONUS AGGREGATION
// ---------------------------------------------------------------------------

export interface ConstellationAggregateBonus {
  productionMult: number;
  capMult: number;
  epMult: number;
  popGrowthMult: number;
  costMult: number;
  divinityMult: number;
}

/**
 * Sum of:
 *   - per-star production bonus (+0.5% per lit star).
 *   - per-completed-constellation bonus (defined in `bonus` field).
 *
 * The first argument is the constellation subset of GameState. Pass the L2
 * store state directly to compute the live bonus.
 */
export function constellationBonus(state: ConstellationState): ConstellationAggregateBonus {
  const out: ConstellationAggregateBonus = {
    productionMult: 0,
    capMult: 0,
    epMult: 0,
    popGrowthMult: 0,
    costMult: 0,
    divinityMult: 0,
  };
  // Per-star production bonus (cumulative across all lit stars).
  const litStars = Object.values(state.constellationStars || {}).filter(Boolean).length;
  out.productionMult += litStars * PER_STAR_PRODUCTION_BONUS;
  // Per-completed-constellation bonus.
  // EP-MERGER: epMult bonuses folded into divinityMult (EP is gone).
  // POP-MERGER: popGrowthMult bonuses folded into productionMult.
  for (const c of CONSTELLATIONS) {
    if (!state.constellationsCompleted?.[c.id]) continue;
    out.productionMult += (c.bonus.productionMult || 0) + (c.bonus.popGrowthMult || 0);
    out.capMult += c.bonus.capMult || 0;
    out.divinityMult += (c.bonus.divinityMult || 0) + (c.bonus.epMult || 0);
    out.costMult += c.bonus.costMult || 0;
  }
  return out;
}

/** Count how many constellations are fully completed. */
export function countCompletedConstellations(state: ConstellationState): number {
  return CONSTELLATIONS.filter((c) => state.constellationsCompleted?.[c.id]).length;
}

/** Count total lit stars across all constellations. */
export function countLitStars(state: ConstellationState): number {
  return Object.values(state.constellationStars || {}).filter(Boolean).length;
}

/**
 * Returns true if the player has completed enough constellations to advance
 * to Layer 3 (Transcendence).
 */
export function canAdvanceToTranscendence(state: ConstellationState): boolean {
  return countCompletedConstellations(state) >= CONSTELLATIONS_REQUIRED_FOR_LAYER_3;
}

// ---------------------------------------------------------------------------
// STATIC LOOKUPS (kept for compatibility with old UIs / logs)
// ---------------------------------------------------------------------------

export const CONSTELLATION_CATEGORIES: ConstellationCategory[] = [
  "zodiac",
  "northern",
  "southern",
  "equatorial",
];

export const CATEGORY_LABEL: Record<ConstellationCategory, string> = {
  zodiac: "Zodiac",
  northern: "Northern Sky",
  southern: "Southern Sky",
  equatorial: "Equatorial",
};

export const CATEGORY_ACCENT: Record<ConstellationCategory, string> = {
  zodiac: "#f59e0b",      // amber
  northern: "#22d3ee",    // cyan
  southern: "#a855f7",   // purple
  equatorial: "#10b981",  // emerald
};
