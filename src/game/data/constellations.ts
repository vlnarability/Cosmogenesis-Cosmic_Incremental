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
// a curated subset of 28 prominent constellations (all 12 zodiac + 16 of the
// brightest northern / southern / equatorial patterns). The data shape
// (`ConstellationDef`) supports all 88 unchanged — to extend, just append more
// entries to `CONSTELLATIONS`. Cost model, UI, and bonus aggregation are
// constellation-count-agnostic.
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
  /** Additive production multiplier (0.05 = +5%). */
  productionMult?: number;
  /** Additive capacity multiplier. */
  capMult?: number;
  /** Additive EP multiplier (applied at prestige). */
  epMult?: number;
  /** Additive population growth multiplier. */
  popGrowthMult?: number;
  /** Cost reduction (negative = cheaper systems/techs). */
  costMult?: number;
  /** Bonus Divinity earned on prestige. */
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
export const CONSTELLATIONS_REQUIRED_FOR_LAYER_3 = 10;

// Per-star production bonus (additive across all lit stars).
export const PER_STAR_PRODUCTION_BONUS = 0.005; // +0.5% per lit star

// ---------------------------------------------------------------------------
// THE 28 CURATED CONSTELLATIONS
// ---------------------------------------------------------------------------
// Star positions are normalized 0-100 on a stylized sky map (NOT a literal
// equatorial projection — they're packed for visual variety per category).
// Star counts per constellation range 4-12; connecting lines follow the
// canonical IAU stick figures (simplified).
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
    bonus: { productionMult: 0.04, popGrowthMult: 0.03 },
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
    bonus: { productionMult: 0.05, epMult: 0.04 },
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
    bonus: { capMult: 0.05, popGrowthMult: 0.02 },
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
    bonus: { productionMult: 0.06, epMult: 0.03 },
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
    bonus: { productionMult: 0.07, popGrowthMult: 0.04 },
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
    bonus: { capMult: 0.06, epMult: 0.03 },
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
    bonus: { productionMult: 0.05, popGrowthMult: 0.03 },
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
    bonus: { productionMult: 0.06, epMult: 0.05 },
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
    bonus: { capMult: 0.05, epMult: 0.04 },
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
    bonus: { productionMult: 0.04, epMult: 0.06 },
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
    bonus: { productionMult: 0.05, popGrowthMult: 0.04 },
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
    bonus: { productionMult: 0.04, epMult: 0.06, divinityMult: 0.05 },
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
    bonus: { capMult: 0.04, epMult: 0.05, costMult: -0.03 },
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
    bonus: { productionMult: 0.05, epMult: 0.04, divinityMult: 0.05 },
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
    bonus: { productionMult: 0.08, popGrowthMult: 0.05 },
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
    bonus: { productionMult: 0.05, epMult: 0.05 },
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
    bonus: { productionMult: 0.06, popGrowthMult: 0.05, capMult: 0.03 },
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
    bonus: { productionMult: 0.05, epMult: 0.04 },
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
    bonus: { productionMult: 0.05, popGrowthMult: 0.05 },
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
  for (const c of CONSTELLATIONS) {
    if (!state.constellationsCompleted?.[c.id]) continue;
    out.productionMult += c.bonus.productionMult || 0;
    out.capMult += c.bonus.capMult || 0;
    out.epMult += c.bonus.epMult || 0;
    out.popGrowthMult += c.bonus.popGrowthMult || 0;
    out.costMult += c.bonus.costMult || 0;
    out.divinityMult += c.bonus.divinityMult || 0;
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
