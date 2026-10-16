import type { UpgradeDef } from "../state/types";

// Prestige shop upgrades — persist across runs.
// "manual_mult" / "manual" category removed (dead — no manual actions scale this way anymore).
// Added "acceleration" category for time-warping upgrades.
export const UPGRADES: UpgradeDef[] = [
  // ===== AUTOMATION =====
  {
    id: "inherited_efficiency",
    name: "Inherited Efficiency",
    desc: (l) => `Passive production +${l * 15}%`,
    baseCost: 3,
    maxLevel: 20,
    costGrowth: 1.5,
    category: "automation",
    effect: { type: "auto_mult", value: 0.15 },
  },
  {
    id: "auto_balancer",
    name: "Auto-Balancer",
    desc: (l) => l ? "Systems auto-pause when their output is at capacity, and auto-resume when headroom returns. No wasted upkeep, no overflow." : "Automatically idles systems whose output is full",
    baseCost: 12,
    maxLevel: 1,
    costGrowth: 1.0,
    requiresWins: 1,
    category: "automation",
    effect: { type: "auto_mult", value: 0.0 },
  },
  {
    id: "temporal_reserves",
    name: "Temporal Reserves",
    desc: (l) => `Offline time bank +${l * 24} hours`,
    baseCost: 10,
    maxLevel: 10,
    costGrowth: 1.9,
    requiresWins: 2,
    category: "automation",
    effect: { type: "auto_mult", value: 0.0 },
  },
  {
    id: "auto_system_buyer",
    name: "Auto-Builder",
    desc: (l) => l ? "Every 8 seconds, the cheapest affordable system in your current stage is auto-purchased. Recommended first purchase — frees you to focus on strategy." : "Auto-buys the cheapest affordable system every 8s. Recommended first buy after your first prestige.",
    baseCost: 8,
    maxLevel: 1,
    costGrowth: 1.0,
    category: "automation",
    effect: { type: "auto_system_buyer", value: 8 },
  },
  {
    id: "auto_tech_buyer",
    name: "Auto-Researcher",
    desc: (l) => l ? "Every 12 seconds, the cheapest affordable tech in your current stage is auto-researched." : "Auto-researches the cheapest affordable tech every 12s",
    baseCost: 10,
    maxLevel: 1,
    costGrowth: 1.0,
    category: "automation",
    effect: { type: "auto_tech_buyer", value: 12 },
  },
  {
    id: "auto_evolver",
    name: "Auto-Evolver",
    desc: (l) => l ? `Auto-evolves at ${(100 + l * 20)}% of requirements (level ${l}). Higher levels trigger evolve EARLIER. No more clicking the Evolve button.` : "Auto-evolves when requirements are exceeded (threshold scales per level)",
    baseCost: 15,
    maxLevel: 5,
    costGrowth: 1.8,
    category: "automation",
    effect: { type: "auto_evolver", value: 0.2 },
  },

  // ===== ECONOMY =====
  {
    id: "frugality",
    name: "Frugality",
    desc: (l) => `System and tech costs -${l * 4}%`,
    baseCost: 4,
    maxLevel: 15,
    costGrowth: 1.6,
    category: "economy",
    effect: { type: "cost_reduction", value: 0.04 },
  },
  {
    id: "warm_start",
    name: "Warm Start",
    desc: (l) => `Start each run with +${l * 5} early resources`,
    baseCost: 5,
    maxLevel: 10,
    costGrowth: 1.7,
    category: "economy",
    effect: { type: "start_bonus", value: 5 },
  },
  {
    id: "expansive_vaults",
    name: "Expansive Vaults",
    desc: (l) => `Resource capacity +${l * 20}%`,
    baseCost: 4,
    maxLevel: 10,
    costGrowth: 1.6,
    category: "economy",
    effect: { type: "cap_boost", value: 0.20 },
  },
  {
    id: "frontier_spirit",
    name: "Frontier Spirit",
    desc: (l) => `+${l * 10} starting population per level`,
    baseCost: 6,
    maxLevel: 10,
    costGrowth: 1.6,
    requiresWins: 1,
    category: "economy",
    effect: { type: "frontier_spirit", value: 10 },
  },
  {
    id: "ancestral_bounty",
    name: "Ancestral Bounty",
    desc: (l) => `+${l * 10} of every resource at the start of each run`,
    baseCost: 12,
    maxLevel: 10,
    costGrowth: 1.7,
    requiresWins: 2,
    category: "economy",
    effect: { type: "ancestral_bounty", value: 10 },
  },

  // ===== ACCELERATION =====
  {
    id: "temporal_acceleration",
    name: "Temporal Acceleration",
    desc: (l) => `+${(l * 0.5).toFixed(1)}× effective game speed per level (stacks with speed control)`,
    baseCost: 20,
    maxLevel: 10,
    costGrowth: 2.0,
    requiresWins: 3,
    category: "acceleration",
    effect: { type: "temporal_acceleration", value: 0.5 },
  },

  // ===== PRESTIGE =====
  {
    id: "evolutionary_momentum",
    name: "Evolutionary Momentum",
    desc: (l) => `Evolve requirements -${Math.min(l * 5, 30)}%`,
    baseCost: 6,
    maxLevel: 6,
    costGrowth: 2.0,
    category: "prestige",
    effect: { type: "evolve_boost", value: 0.05 },
  },
  {
    id: "archetype_insight",
    name: "Archetype Insight",
    desc: (l) => l ? "Rare archetypes (Lithoid, Necroid, Toxoid, Extremophile) unlock from your first Galactic win" : "Unlocks rare archetypes after first Galactic win",
    baseCost: 8,
    maxLevel: 1,
    costGrowth: 1.0,
    category: "prestige",
    effect: { type: "auto_mult", value: 0.0 },
  },
  {
    id: "challenge_mastery",
    name: "Challenge Mastery",
    desc: (l) => l ? "Each challenge can be repeated up to 10 times (instead of 5) for greater mastery bonuses." : "Raises the max challenge repeats from 5 to 10",
    baseCost: 14,
    maxLevel: 1,
    costGrowth: 1.0,
    requiresWins: 2,
    category: "prestige",
    effect: { type: "challenge_mastery", value: 10 },
  },
  {
    id: "deep_memory",
    name: "Deep Memory",
    desc: (l) => `+${l * 5}% production per prestige (per level), based on your total runs`,
    baseCost: 15,
    maxLevel: 20,
    costGrowth: 1.8,
    requiresWins: 2,
    category: "prestige",
    effect: { type: "deep_memory", value: 0.05 },
  },
  {
    id: "cosmic_understanding",
    name: "Cosmic Understanding",
    desc: (l) => `+${l * 25}% Evolution Points earned per prestige`,
    baseCost: 18,
    maxLevel: 10,
    costGrowth: 1.9,
    requiresWins: 3,
    category: "prestige",
    effect: { type: "cosmic_understanding", value: 0.25 },
  },

  // ===== UNIVERSAL (Quick Wins — purchased with Prestige Points) =====
  {
    id: "universal_boost",
    name: "Universal Boost",
    desc: (l) => `+${l * 5}% all production, permanently (costs PP).`,
    baseCost: 5,
    maxLevel: 20,
    costGrowth: 1.5,
    category: "universal",
    effect: { type: "universal_boost", value: 0.05 },
  },
  {
    id: "universal_speed",
    name: "Universal Speed",
    desc: (l) => `+${l * 10}% effective game speed, permanently (costs PP).`,
    baseCost: 10,
    maxLevel: 10,
    costGrowth: 1.8,
    category: "universal",
    effect: { type: "universal_speed", value: 0.10 },
  },
  // FIX-STORE-BUGS Bug 4: Simulation Amplifier moved here from `automation` (EP shop)
  // to `universal` (PP shop). It now costs Prestige Points and only appears in the
  // shop after L2 (Enlightenment) is unlocked. The DivineEnginePanel still reads
  // the upgrade level — the only thing that changed is which shop tab it shows in.
  {
    id: "simulation_amplifier",
    name: "Simulation Amplifier",
    desc: (l) => l === 0
      ? "Background simulations: ×1 (base). Purchase to multiply sims per star. Costs PP."
      : `Background simulations: ×${l + 1} (each star gives ${(l + 1).toFixed(0)} sims instead of 1). No cap — keep leveling for infinite scaling.`,
    baseCost: 20,
    maxLevel: 20,
    costGrowth: 1.5,
    requiresLayer: "enlightenment",  // visible once L2 (Enlightenment) is unlocked
    category: "universal",
    effect: { type: "auto_mult", value: 0.0 },  // effect applied via upgrades lookup in tick
  },
  // FIX-STORE-BUGS Bug 5: Auto-Ascend autobuyer — PP shop. Triggers prestige
  // automatically when the player reaches the Galactic stage. Owned-only check
  // + stage-index check in the tick fires triggerPrestige() (deferred via setTimeout).
  {
    id: "auto_ascend",
    name: "Auto-Ascend",
    desc: (l) => l ? "Automatically triggers prestige when Galactic is reached. Your civilization ascends on its own." : "Auto-prestiges at Galactic stage",
    baseCost: 20,
    maxLevel: 1,
    costGrowth: 1.0,
    category: "universal",
    effect: { type: "auto_mult", value: 0.0 },
  },

  // ===== UNIVERSAL AUTO-BUYERS (PP-SHOP-TABS) =====
  // Each auto-buyer is a permanent upgrade purchased with Prestige Points.
  // The auto-buyer for layer N unlocks in the shop once layer N+1 is unlocked
  // (per the automation unlock chain spec). All are maxLevel:1 — single
  // purchase, permanently enabled. Effect value = period in seconds.
  //
  // NOTE: The `requiresLayer` field on each is the layer that must be
  // UNLOCKED before the upgrade appears in the shop (i.e. the next layer).
  // The tick logic checks both the upgrade ownership AND the layer's
  // prerequisite before firing.

  // L2→L3 — auto_light_stars: illuminates the cheapest affordable star every 20s.
  {
    id: "auto_light_stars",
    name: "Auto-Light Stars",
    desc: (l) => l
      ? "Every 20s, illuminates the cheapest affordable constellation star automatically. Set & forget L2."
      : "Auto-illuminates the cheapest affordable constellation star every 20s",
    baseCost: 25,
    maxLevel: 1,
    costGrowth: 1.0,
    requiresLayer: "transcendence",  // visible once L3 (Transcendence) is unlocked
    category: "universal",
    effect: { type: "auto_light_stars", value: 20 },
  },

  // L3→L4 — auto_invest_market: invests Divinity in best L3 portfolio every 30s.
  {
    id: "auto_invest_market",
    name: "Auto-Invest Market",
    desc: (l) => l
      ? "Every 30s, invests Divinity into the best-priced Divine Market resource automatically."
      : "Auto-invests Divinity into the best L3 portfolio every 30s",
    baseCost: 30,
    maxLevel: 1,
    costGrowth: 1.0,
    requiresLayer: "genesis",  // visible once L4 (Genesis) is unlocked
    category: "universal",
    effect: { type: "auto_invest_market", value: 30 },
  },

  // L4→L5 — auto_claim_systems: auto-claims cheapest star system every 15s.
  {
    id: "auto_claim_systems",
    name: "Auto-Claim Systems",
    desc: (l) => l
      ? "Every 15s, claims the cheapest affordable star system across all galaxies automatically."
      : "Auto-claims cheapest star system across all galaxies every 15s",
    baseCost: 35,
    maxLevel: 1,
    costGrowth: 1.0,
    requiresLayer: "apotheosis",  // visible once L5 (Apotheosis) is unlocked
    category: "universal",
    effect: { type: "auto_claim_systems", value: 15 },
  },

  // L6→L7 — auto_manage_heresy: auto-converts heretics every 15s.
  {
    id: "auto_manage_heresy",
    name: "Auto-Manage Heresy",
    desc: (l) => l
      ? "Every 15s, converts heretics back to the faithful in all galaxies automatically. Keeps heresy under control."
      : "Auto-converts heretics in all galaxies every 15s",
    baseCost: 30,
    maxLevel: 1,
    costGrowth: 1.0,
    requiresLayer: "omnipotence",  // visible once L7 (Bio-Engineering) is unlocked
    category: "universal",
    effect: { type: "auto_manage_heresy", value: 15 },
  },

  // L6→L7 — auto_place_anchors: places reality anchors every 60s.
  {
    id: "auto_place_anchors",
    name: "Auto-Place Anchors",
    desc: (l) => l
      ? "Every 60s, places a Reality Anchor on a random unanchored galaxy automatically. Rift defense on autopilot."
      : "Auto-places reality anchors on unanchored galaxies every 60s",
    baseCost: 40,
    maxLevel: 1,
    costGrowth: 1.0,
    requiresLayer: "omnipotence",  // visible once L7 (Bio-Engineering) is unlocked
    category: "universal",
    effect: { type: "auto_place_anchors", value: 60 },
  },

  // L8→L9 — auto_negotiate: auto-negotiates with available minor gods every 30s.
  {
    id: "auto_negotiate",
    name: "Auto-Negotiate",
    desc: (l) => l
      ? "Every 30s, negotiates with an available minor god automatically (cooldown permitting). Diplomacy without the clicks."
      : "Auto-negotiates with available minor gods every 30s",
    baseCost: 35,
    maxLevel: 1,
    costGrowth: 1.0,
    requiresLayer: "infinity",  // visible once L9 (Divine War) is unlocked
    category: "universal",
    effect: { type: "auto_negotiate", value: 30 },
  },

  // L9→L10 — auto_attack_old_gods: auto-attacks active Old God battles every 10s.
  {
    id: "auto_attack_old_gods",
    name: "Auto-Attack Old Gods",
    desc: (l) => l
      ? "Every 10s, attacks every active Old God battle automatically. End the divine war on cruise control."
      : "Auto-attacks active Old God battles every 10s",
    baseCost: 50,
    maxLevel: 1,
    costGrowth: 1.0,
    requiresLayer: "eternity",  // visible once L10 (Ascension) is unlocked
    category: "universal",
    effect: { type: "auto_attack_old_gods", value: 10 },
  },

  // L10 finished — auto_author_universes (re-purposed for Genesis Engine):
  // every 120s, reveals a random unrevealed rule name on a random owned relic
  // for free (if Divinity is available to cover the cost).
  {
    id: "auto_author_universes",
    name: "Auto-Reveal Relic Rules",
    desc: (l) => l
      ? "Every 120s, reveals a random unrevealed rule name on a random owned relic automatically (costs 1000 Divinity). Crucible research on autopilot."
      : "Auto-reveals a relic rule name every 120s (costs 1000 Divinity)",
    baseCost: 100,
    maxLevel: 1,
    costGrowth: 1.0,
    requiresLayer: "eternity",  // visible once L10 is unlocked
    category: "universal",
    effect: { type: "auto_author_universes", value: 120 },
  },

  // L2+ — ep_auto_converter: converts EP to PP at 1:1 every tick.
  // Once owned, the EP resource is hidden from the UI (Header + ResourceBar).
  // EP becomes internal-only (still accrued from background sims, but auto-converted).
  {
    id: "ep_auto_converter",
    name: "EP Auto-Converter",
    desc: (l) => l
      ? "Every tick, converts ALL Evolution Points to Prestige Points at 1:1. EP becomes internal-only and is hidden from the UI."
      : "Converts EP to PP at 1:1 every tick. Hides EP from the UI.",
    baseCost: 50,
    maxLevel: 1,
    costGrowth: 1.0,
    requiresLayer: "enlightenment",  // visible once L2 is unlocked
    category: "universal",
    effect: { type: "ep_auto_converter", value: 1 },
  },

  // ===== LAYER-SPECIFIC (L2–L10) =====
  // Each upgrade only appears in the shop once its `requiresLayer` is unlocked.
  // Effects are wired into the matching layer's tick / bonus / action logic in store.ts.
  // Costs scale with layer depth (L2 baseCost 8 → L10 baseCost 40).

  // ---- L2 — Enlightenment (Constellation Map) ----
  {
    id: "foresight_discount",
    name: "Foresight Discount",
    desc: (l) => `Foresight node costs -${(l * 20)}% (multiplicative, max 5 levels).`,
    baseCost: 8,
    maxLevel: 5,
    costGrowth: 1.7,
    requiresLayer: "enlightenment",
    category: "layer",
    effect: { type: "foresight_discount", value: 0.20 },
  },
  {
    id: "constellation_boost",
    name: "Constellation Boost",
    desc: (l) => `Constellation illumination grants +${l * 25}% Prestige Points per node (max 4).`,
    baseCost: 8,
    maxLevel: 4,
    costGrowth: 1.7,
    requiresLayer: "enlightenment",
    category: "layer",
    effect: { type: "constellation_boost", value: 0.25 },
  },

  // ---- L3 — Transcendence (Divine Market + Rituals) ----
  {
    id: "ritual_extension",
    name: "Ritual Extension",
    desc: (l) => `Temporary ritual duration +${l * 20}% per level (max 5).`,
    baseCost: 12,
    maxLevel: 5,
    costGrowth: 1.7,
    requiresLayer: "transcendence",
    category: "layer",
    effect: { type: "ritual_extension", value: 0.20 },
  },
  {
    id: "market_savvy",
    name: "Market Savvy",
    desc: (l) => `Divine Market sell profits +${l * 30}% per level (max 5).`,
    baseCost: 12,
    maxLevel: 5,
    costGrowth: 1.7,
    requiresLayer: "transcendence",
    category: "layer",
    effect: { type: "market_savvy", value: 0.30 },
  },

  // ---- L4 — Genesis (Sacred Grid + Authored Worlds) ----
  {
    id: "world_blueprint",
    name: "World Blueprint",
    desc: (l) => `Authored world bonuses (production/cap/pop) +${l * 50}% per level (max 4).`,
    baseCost: 15,
    maxLevel: 4,
    costGrowth: 1.7,
    requiresLayer: "genesis",
    category: "layer",
    effect: { type: "world_blueprint", value: 0.50 },
  },
  {
    id: "disaster_shield",
    name: "Disaster Shield",
    desc: (l) => `Sacred Grid disaster chance -${l * 25}% per level (max 4 → 0% chance).`,
    baseCost: 15,
    maxLevel: 4,
    costGrowth: 1.7,
    requiresLayer: "genesis",
    category: "layer",
    effect: { type: "disaster_shield", value: 0.25 },
  },

  // ---- L5 — Apotheosis (Heresy Web + Prophets) ----
  {
    id: "prophet_inspiration",
    name: "Prophet Inspiration",
    desc: (l) => `Prophet conversion radius +${l} cell layer(s) per level (max 2 — adds diagonals at L1, 2-step reach at L2).`,
    baseCost: 18,
    maxLevel: 2,
    costGrowth: 1.7,
    requiresLayer: "apotheosis",
    category: "layer",
    effect: { type: "prophet_inspiration", value: 1 },
  },
  {
    id: "heresy_ward",
    name: "Heresy Ward",
    desc: (l) => `Heresy spread rate -${l * 30}% per level (max 4 → heresy cannot spread).`,
    baseCost: 18,
    maxLevel: 4,
    costGrowth: 1.7,
    requiresLayer: "apotheosis",
    category: "layer",
    effect: { type: "heresy_ward", value: 0.30 },
  },

  // ---- L6 — Singularity (Dimension Engine) ----
  {
    id: "rift_redirect",
    name: "Rift Redirect",
    desc: (l) => l ? "Dimension rifts always transfer from the richest to the poorest dimension (always beneficial)." : "Toggle: rifts no longer drain your rich dimensions",
    baseCost: 22,
    maxLevel: 1,
    costGrowth: 1.0,
    requiresLayer: "singularity",
    category: "layer",
    effect: { type: "rift_redirect", value: 1 },
  },
  {
    id: "dimension_boost",
    name: "Dimension Boost",
    desc: (l) => `Dimension accrual speed +${l * 20}% per level (max 5).`,
    baseCost: 22,
    maxLevel: 5,
    costGrowth: 1.7,
    requiresLayer: "singularity",
    category: "layer",
    effect: { type: "dimension_boost", value: 0.20 },
  },

  // ---- L7 — Omnipotence (Bio-Engineering / Creature Lab) ----
  {
    id: "mutation_master",
    name: "Mutation Master",
    desc: (l) => `Creature mutation chance +${l * 10}% per level (max 5, baseline 10%).`,
    baseCost: 25,
    maxLevel: 5,
    costGrowth: 1.7,
    requiresLayer: "omnipotence",
    category: "layer",
    effect: { type: "mutation_master", value: 0.10 },
  },
  {
    id: "genetic_stabilizer",
    name: "Genetic Stabilizer",
    desc: (l) => `Genetic instability gain -${l * 25}% per level (max 4 → no instability gain).`,
    baseCost: 25,
    maxLevel: 4,
    costGrowth: 1.7,
    requiresLayer: "omnipotence",
    category: "layer",
    effect: { type: "genetic_stabilizer", value: 0.25 },
  },

  // ---- L8 — Divinity / Divine Alliance (Minor Gods + Amplifiers) ----
  {
    id: "diplomatic_gift",
    name: "Diplomatic Gift",
    desc: (l) => `Relationship gain from Negotiate & Trade ×${1 + l} per level (max 3 → ×4).`,
    baseCost: 28,
    maxLevel: 3,
    costGrowth: 1.7,
    requiresLayer: "divinity",
    category: "layer",
    effect: { type: "diplomatic_gift", value: 1 },
  },
  {
    id: "amplifier_overcharge",
    name: "Amplifier Overcharge",
    desc: (l) => `Amplifier negotiate bonus +${l * 50}% per level (max 3 → ×3.5 amplifier).`,
    baseCost: 28,
    maxLevel: 3,
    costGrowth: 1.7,
    requiresLayer: "divinity",
    category: "layer",
    effect: { type: "amplifier_overcharge", value: 0.50 },
  },

  // ---- L9 — Infinity / Divine War (Old God Battles) ----
  {
    id: "war_preparation",
    name: "War Preparation",
    desc: (l) => `Legion attack damage +${l * 20}% per level (max 5).`,
    baseCost: 33,
    maxLevel: 5,
    costGrowth: 1.7,
    requiresLayer: "infinity",
    category: "layer",
    effect: { type: "war_preparation", value: 0.20 },
  },
  {
    id: "temporal_shield",
    name: "Temporal Shield",
    desc: (l) => `Temporal storm acceleration effect halved per level (max 2 — storms mostly delayed/blocked).`,
    baseCost: 33,
    maxLevel: 2,
    costGrowth: 1.7,
    requiresLayer: "infinity",
    category: "layer",
    effect: { type: "temporal_shield", value: 0.50 },
  },

  // ---- L10 — Eternity / Genesis Engine ----
  // paradox_insight (LEGACY): the Genesis Engine redesign removed the paradox
  // mechanic. The upgrade remains for save-compat; purchasing it does nothing.
  {
    id: "paradox_insight",
    name: "Crucible Insight (Legacy)",
    desc: (_l) => `Legacy upgrade — the Genesis Engine redesign removed the paradox mechanic. Purchasing this has no effect; kept for save-compat.`,
    baseCost: 40,
    maxLevel: 1,
    costGrowth: 1.7,
    requiresLayer: "eternity",
    category: "layer",
    effect: { type: "paradox_insight", value: 1 },
  },
  {
    id: "universe_foundation",
    name: "Crucible Mastery",
    desc: (l) => `Archetype production bonus +${l * 25}% per level (max 4). Each discovered archetype grants +1% production; this multiplies that bonus.`,
    baseCost: 40,
    maxLevel: 4,
    costGrowth: 1.7,
    requiresLayer: "eternity",
    category: "layer",
    effect: { type: "universe_foundation", value: 0.25 },
  },
];

export const UPGRADE_MAP: Record<string, UpgradeDef> = Object.fromEntries(
  UPGRADES.map((u) => [u.id, u])
);

export function upgradeCost(u: UpgradeDef, owned: number): number {
  return Math.ceil(u.baseCost * Math.pow(u.costGrowth, owned));
}
