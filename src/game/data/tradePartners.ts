// Trade Partners — PART-2-LAYER-A foundation.
//
// NPC trade partners per stage. Each stage has 2-3 partners. Player builds
// trade caravan systems to establish agreements; trade passively generates
// bonus resources + gives access to rare resources you can't produce otherwise.
//
// Per DESIGN-PROPOSALS.md:
//   Tribal: neighboring tribes (Bone Clan, Hill Folk, River Runners).
//   Civilization: neighboring city-states (Marble Republic, Iron Horde, Silk Concord).
//   Empire: neighboring empires (Stellar Hegemony, Crystal Compact, Tide Dominion).
//   Solar: neighboring systems (Inner Worlds, Outer Belt, Gas Giants).
//   Galactic: neighboring star nations (Conquerors, Diplomats, Scientists).
//
// NOTE: this module is the DATA foundation. The store actions
// (establishTrade, breakTrade) + UI panel are implemented in subsequent rounds.

import type { StageId } from "../state/types";

export interface TradePartner {
  id: string;
  name: string;
  stage: StageId;
  icon: string;
  desc: string;
  /** Resource the partner gives as a bonus (passive generation while
   * trade agreement is active). */
  givesResource: string;
  /** Nominal per-second bonus rate. Long-run income = bonusPerTick × all
   * multipliers — but it arrives in SHIPMENTS (see shipmentInterval), not a
   * continuous drip, so every delivery is visible and cause→effect. */
  bonusPerTick: number;
  /** Seconds between shipments at base speed (no caravans / treaty).
   * Each shipment delivers bonusPerTick × shipmentInterval of the resource.
   * Caravans + trade treaties SHORTEN the interval (deliveries arrive
   * faster) while the per-shipment amount stays constant — more caravans
   * visibly means busier routes, not abstract numbers. */
  shipmentInterval: number;
  /** Rare resource the partner can offer (unlocks special systems/techs
   * once trade is established). Optional. */
  rareDrop?: {
    resource: string;
    /** 0-1 chance PER SHIPMENT — rolled once when a shipment arrives.
     * Shown to the player verbatim on the partner card, so a rare arriving
     * is an understood mechanic instead of a slot-machine jackpot. */
    chance: number;
  };
  /** Cost to establish the trade (one-time, paid in the partner's stage
   * currency). */
  establishCost: Record<string, number>;
}

// ============================================================
// SHIPMENT HELPERS — shared by the tick, the World tab cards, and the
// resource-breakdown tooltip so all three agree on delivery math.
// ============================================================

/** The five caravan systems that speed up trade shipments (one per era,
 * including the tribal one). */
const CARAVAN_SYSTEM_IDS = [
  "tribal_trade_caravan",
  "trade_caravan",
  "empire_trade_caravan",
  "solar_trade_caravan",
  "galactic_trade_caravan",
] as const;

/** Total caravan systems owned across all eras. */
export function caravanCountOf(ownedSystems: Record<string, number> | undefined | null): number {
  if (!ownedSystems) return 0;
  let n = 0;
  for (const id of CARAVAN_SYSTEM_IDS) n += ownedSystems[id] || 0;
  return n;
}

/** Shipment-speed multiplier from caravans (×1.0 → ×2.0, +10% each). */
export function caravanMultOf(ownedSystems: Record<string, number> | undefined | null): number {
  return 1 + Math.min(10, caravanCountOf(ownedSystems)) * 0.1;
}

/** Effective seconds between shipments for a partner given caravans + treaty. */
export function shipmentIntervalEff(
  partner: TradePartner,
  caravanMult: number,
  treatyMult: number
): number {
  return partner.shipmentInterval / (caravanMult * treatyMult);
}

/** Per-shipment delivery amount (CONSTANT — caravans speed cadence, not size). */
export function shipmentAmount(partner: TradePartner): number {
  return partner.bonusPerTick * partner.shipmentInterval;
}

export const TRADE_PARTNERS: TradePartner[] = [
  // ===== TRIBAL =====
  {
    id: "bone_clan",
    name: "Bone Clan",
    stage: "tribal",
    icon: "🦴",
    desc: "A harsh mountain tribe. They trade furs and bone tools for wood.",
    givesResource: "gold",
    bonusPerTick: 0.3,
    shipmentInterval: 75,
    rareDrop: { resource: "rare_furs", chance: 0.08 },
    establishCost: { wood: 50, stone: 30 },
  },
  {
    id: "hill_folk",
    name: "Hill Folk",
    stage: "tribal",
    icon: "⛰️",
    desc: "Goat-herders and weavers. They trade cloth for clay.",
    givesResource: "culture",
    bonusPerTick: 0.4,
    shipmentInterval: 75,
    establishCost: { clay: 40, wood: 20 },
  },
  {
    id: "river_runners",
    name: "River Runners",
    stage: "tribal",
    icon: "🛶",
    desc: "River traders. They trade fish and pearls for lumber.",
    givesResource: "food",
    bonusPerTick: 0.5,
    shipmentInterval: 75,
    rareDrop: { resource: "river_pearls", chance: 0.1 },
    establishCost: { lumber: 30, stone: 20 },
  },

  // ===== CIVILIZATION =====
  {
    id: "marble_republic",
    name: "Marble Republic",
    stage: "civilization",
    icon: "🏛️",
    desc: "A city-state of sculptors and senators. They trade influence for production.",
    givesResource: "influence",
    bonusPerTick: 0.4,
    shipmentInterval: 70,
    rareDrop: { resource: "marble_blocs", chance: 0.1 },
    establishCost: { production: 200, gold: 100 },
  },
  {
    id: "iron_horde",
    name: "Iron Horde",
    stage: "civilization",
    icon: "⚔️",
    desc: "A nomadic military society. They trade military_power for gold.",
    givesResource: "military_power",
    bonusPerTick: 0.6,
    shipmentInterval: 70,
    rareDrop: { resource: "iron_ore", chance: 0.12 },
    establishCost: { gold: 150, production: 100 },
  },
  {
    id: "silk_concord",
    name: "Silk Concord",
    stage: "civilization",
    icon: "🧵",
    desc: "Weavers of silk and secrets. They trade culture for science.",
    givesResource: "culture",
    bonusPerTick: 0.5,
    shipmentInterval: 70,
    rareDrop: { resource: "silk_bolt", chance: 0.1 },
    establishCost: { gold: 120, science: 80 },
  },

  // ===== EMPIRE =====
  {
    id: "stellar_hegemony",
    name: "Stellar Hegemony",
    stage: "empire",
    icon: "🌟",
    desc: "A sprawling multi-system empire. They trade science for energy.",
    givesResource: "science",
    bonusPerTick: 0.8,
    shipmentInterval: 65,
    rareDrop: { resource: "stellar_isotope", chance: 0.1 },
    establishCost: { energy: 500, data: 200 },
  },
  {
    id: "crystal_compact",
    name: "Crystal Compact",
    stage: "empire",
    icon: "💎",
    desc: "Miners of crystalline worlds. They trade data for alloys.",
    givesResource: "data",
    bonusPerTick: 0.7,
    shipmentInterval: 65,
    rareDrop: { resource: "crystal_shard", chance: 0.12 },
    establishCost: { energy: 400, gold: 300 },
  },
  {
    id: "tide_dominion",
    name: "Tide Dominion",
    stage: "empire",
    icon: "🌊",
    desc: "An ocean-empire. They trade influence for energy.",
    givesResource: "influence",
    bonusPerTick: 0.6,
    shipmentInterval: 65,
    establishCost: { energy: 450, science: 250 },
  },

  // ===== SOLAR =====
  {
    id: "inner_worlds",
    name: "Inner Worlds",
    stage: "solar",
    icon: "🌍",
    desc: "The dense inner-system planets. They trade food for alloys.",
    givesResource: "food",
    bonusPerTick: 1.0,
    shipmentInterval: 60,
    establishCost: { alloys: 300, energy: 400 },
  },
  {
    id: "outer_belt",
    name: "Outer Belt",
    stage: "solar",
    icon: "🪨",
    desc: "Asteroid-belt miners. They trade alloys for data.",
    givesResource: "alloys",
    bonusPerTick: 1.2,
    shipmentInterval: 60,
    rareDrop: { resource: "rare_element", chance: 0.14 },
    establishCost: { energy: 500, data: 200 },
  },
  {
    id: "gas_giants",
    name: "Gas Giants",
    stage: "solar",
    icon: "🪐",
    desc: "Atmosphere-skimmers. They trade energy for science.",
    givesResource: "energy",
    bonusPerTick: 1.5,
    shipmentInterval: 60,
    establishCost: { alloys: 400, science: 300 },
  },

  // ===== GALACTIC =====
  {
    id: "conquerors",
    name: "The Conquerors",
    stage: "galactic",
    icon: "🗡️",
    desc: "A warlike star nation. They trade military_power for data.",
    givesResource: "military_power",
    bonusPerTick: 2.0,
    shipmentInterval: 55,
    establishCost: { data: 1000, energy: 800 },
  },
  {
    id: "diplomats",
    name: "The Diplomats",
    stage: "galactic",
    icon: "🤝",
    desc: "A league of peaceful systems. They trade influence for science.",
    givesResource: "influence",
    bonusPerTick: 1.8,
    shipmentInterval: 55,
    establishCost: { data: 800, science: 600 },
  },
  {
    id: "scientists",
    name: "The Scientists",
    stage: "galactic",
    icon: "🔬",
    desc: "A research-focused star nation. They trade science for data.",
    givesResource: "science",
    bonusPerTick: 2.2,
    shipmentInterval: 55,
    rareDrop: { resource: "ancient_relic", chance: 0.12 },
    establishCost: { data: 1200, energy: 1000 },
  },
];

export const TRADE_PARTNER_MAP: Record<string, TradePartner> = Object.fromEntries(
  TRADE_PARTNERS.map((p) => [p.id, p])
);

export function tradePartnersForStage(stage: StageId): TradePartner[] {
  return TRADE_PARTNERS.filter((p) => p.stage === stage);
}
