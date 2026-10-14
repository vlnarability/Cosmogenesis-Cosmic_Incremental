// ===========================================================================
// LAYER 10 — GENESIS ENGINE
// ===========================================================================
// Redesign of Layer 10 (Eternity). Instead of an 8-slot universe-rule picker
// with forbidden words and paradox, Layer 10 is now the **Genesis Engine** — a
// crucible + divine relic system. The player:
//
//   1. Collects Divine Relics (each affecting 1-5 of the 10 Universe Rules).
//   2. Reveals relic rule names + amounts by spending Divinity (1000 / 2000).
//   3. Loads 1-5 relics into the Crucible.
//   4. Triggers a Big Bang (30s simulation).
//   5. If the resulting rule combination is stable (no rule at 0 or 10+, total
//      = 50), an archetype emerges — discover 100 archetypes to win the game.
//   6. If unstable, lose relics based on instability level.
//
// The 10 Universe Rules (each 1-5 base, base 3 per rule = 30 total):
//   1. Spacetime Fluidity     — 1 rigid     → 5 chaotic time loops
//   2. Mythos & Mysticism     — 1 no magic   → 5 omnipresent magic
//   3. Entropy & Permanence   — 1 permanent  → 5 immortal cyclical
//   4. Cosmic Determinism     — 1 free will  → 5 absolute prophecy
//   5. Physical Fundamentalism— 1 realistic  → 5 rule of cool
//   6. Morality Materialisation — 1 subjective → 5 tangible good/evil
//   7. Consciousness Scope    — 1 biological  → 5 panpsychism
//   8. Meta-Sovereignty       — 1 no gods     → 5 gods walk the earth
//   9. Metamorphic Volatility — 1 static     → 5 instant mutation
//  10. Veil Permeability      — 1 sealed     → 5 portal storms
//
// Final rule levels (after relic sums + overflow normalization) always sum to
// 50. Stability requires all rules to be in [1..9] (no rule at 0 or 10+).
// ===========================================================================

// ----- Universe Rules (10) -----
export type UniverseRuleId =
  | "spacetime"
  | "mythos"
  | "entropy"
  | "determinism"
  | "physics"
  | "morality"
  | "consciousness"
  | "meta_sovereignty"
  | "metamorphic"
  | "veil";

export interface UniverseRule {
  id: UniverseRuleId;
  name: string;
  shortName: string;
  icon: string;
  desc: string;
  min: number; // always 1
  max: number; // always 5 (natural range — relic sums can push past)
}

export const UNIVERSE_RULES: UniverseRule[] = [
  {
    id: "spacetime",
    name: "Spacetime Fluidity",
    shortName: "Spacetime",
    icon: "🌀",
    desc: "1 (rigid) → 5 (chaotic, time loops). The shape of causality.",
    min: 1,
    max: 5,
  },
  {
    id: "mythos",
    name: "Mythos & Mysticism",
    shortName: "Mythos",
    icon: "📜",
    desc: "1 (no magic) → 5 (omnipresent magic). How much magic saturates reality.",
    min: 1,
    max: 5,
  },
  {
    id: "entropy",
    name: "Entropy & Permanence",
    shortName: "Entropy",
    icon: "🔥",
    desc: "1 (permanent death) → 5 (immortal, cyclical). The flow of decay.",
    min: 1,
    max: 5,
  },
  {
    id: "determinism",
    name: "Cosmic Determinism",
    shortName: "Determinism",
    icon: "🎯",
    desc: "1 (chaos, free will) → 5 (absolute prophecy). How fixed the future is.",
    min: 1,
    max: 5,
  },
  {
    id: "physics",
    name: "Physical Fundamentalism",
    shortName: "Physics",
    icon: "⚛️",
    desc: "1 (realistic physics) → 5 (rule of cool). How much physics bends to drama.",
    min: 1,
    max: 5,
  },
  {
    id: "morality",
    name: "Morality Materialisation",
    shortName: "Morality",
    icon: "⚖️",
    desc: "1 (subjective) → 5 (tangible good/evil). Whether morality has force.",
    min: 1,
    max: 5,
  },
  {
    id: "consciousness",
    name: "Consciousness Scope",
    shortName: "Consciousness",
    icon: "💭",
    desc: "1 (biological only) → 5 (panpsychism). What can hold a mind.",
    min: 1,
    max: 5,
  },
  {
    id: "meta_sovereignty",
    name: "Meta-Sovereignty",
    shortName: "Sovereignty",
    icon: "👑",
    desc: "1 (no gods) → 5 (gods walk the earth). The presence of higher beings.",
    min: 1,
    max: 5,
  },
  {
    id: "metamorphic",
    name: "Metamorphic Volatility",
    shortName: "Metamorphic",
    icon: "🧬",
    desc: "1 (static evolution) → 5 (instant mutation). How fast life reshapes itself.",
    min: 1,
    max: 5,
  },
  {
    id: "veil",
    name: "Veil Permeability",
    shortName: "Veil",
    icon: "🌫️",
    desc: "1 (sealed reality) → 5 (portal storms). How thin the boundaries are.",
    min: 1,
    max: 5,
  },
];

export const UNIVERSE_RULE_MAP: Record<UniverseRuleId, UniverseRule> = Object.fromEntries(
  UNIVERSE_RULES.map((r) => [r.id, r])
) as Record<UniverseRuleId, UniverseRule>;

export const RULE_IDS: UniverseRuleId[] = UNIVERSE_RULES.map((r) => r.id);

/** Crucible base level per rule (before relic sums). */
export const RULE_BASE = 3;
/** Final total across all 10 rules (post-overflow normalization). */
export const RULE_TOTAL_TARGET = 50;
/** Stability bounds (inclusive). */
export const RULE_STABLE_MIN = 1;
export const RULE_STABLE_MAX = 9;
/** Big Bang simulation duration in seconds (sped up — animation only). */
export const BIG_BANG_DURATION_SEC = 30;

// ----- Reveal costs (Divinity) -----
// The user spec: "Divinity should be in giant numbers at L10, so 10 and 20 is
// too low." Tune high — these can be adjusted later.
export const REVEAL_COST_RULE = 1000;
export const REVEAL_COST_AMOUNT = 2000;

// ----- Relic name fragments (ruleId → name fragment) -----
// The largest |amount| rule determines the relic's name suffix.
export const RELIC_NAME_HINTS: Record<UniverseRuleId, string> = {
  spacetime: "Chronos",
  mythos: "Mythweaver",
  entropy: "Ember",
  determinism: "Oracle",
  physics: "Foundation",
  morality: "Judicar",
  consciousness: "Dreamer",
  meta_sovereignty: "Sovereign",
  metamorphic: "Mutator",
  veil: "Veilkeeper",
};

// ----- Divine Relic -----
export interface DivineRelicRule {
  ruleId: UniverseRuleId;
  amount: number; // -5..+5, never 0 (so a hint always exists)
  revealed: {
    rule: boolean;   // has the rule name been revealed?
    amount: boolean;  // has the amount been revealed?
  };
}

export interface DivineRelic {
  id: string;
  name: string; // e.g. "Relic of the Dreamer"
  rules: DivineRelicRule[]; // 1-5 rules
  createdAt: number;
}

// ----- Seeded PRNG (deterministic for relic/archetype generation) -----
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let _relicCounter = 0;

/**
 * Generate a single random Divine Relic.
 * - 1-5 rules chosen at random.
 * - Each rule gets a non-zero amount between -5 and +5.
 * - The relic's name suffix is the rule with the largest |amount|.
 */
export function generateRandomRelic(seed?: number): DivineRelic {
  const rng = mulberry32(seed ?? (Date.now() + (++_relicCounter) * 9176));
  const ruleCount = 1 + Math.floor(rng() * 5); // 1..5
  // Pick `ruleCount` unique rules
  const pool = [...RULE_IDS];
  const chosenRules: UniverseRuleId[] = [];
  for (let i = 0; i < ruleCount && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    chosenRules.push(pool.splice(idx, 1)[0]);
  }
  // Assign each chosen rule a non-zero amount in [-5, +5]
  const relicRules: DivineRelicRule[] = chosenRules.map((ruleId) => {
    // amount in [-5, +5] \ {0} → roll 1..5, randomly negate
    const mag = 1 + Math.floor(rng() * 5); // 1..5
    const sign = rng() < 0.5 ? -1 : 1;
    const amount = sign * mag;
    return {
      ruleId,
      amount,
      revealed: { rule: false, amount: false },
    };
  });
  // Determine hint rule = rule with the largest |amount| (first wins on tie)
  let hintIdx = 0;
  let maxAbs = Math.abs(relicRules[0].amount);
  for (let i = 1; i < relicRules.length; i++) {
    const a = Math.abs(relicRules[i].amount);
    if (a > maxAbs) {
      maxAbs = a;
      hintIdx = i;
    }
  }
  const hintRuleId = relicRules[hintIdx].ruleId;
  const name = `Relic of the ${RELIC_NAME_HINTS[hintRuleId]}`;
  return {
    id: `relic_${Date.now().toString(36)}_${(_relicCounter).toString(36)}_${Math.floor(rng() * 1e6).toString(36)}`,
    name,
    rules: relicRules,
    createdAt: Date.now(),
  };
}

/**
 * Generate 3-5 random relics as a reward for a successful Big Bang.
 */
export function generateRelicReward(count?: number, seed?: number): DivineRelic[] {
  const n = count ?? (3 + Math.floor((seed ?? Date.now()) % 3)); // 3..5
  const out: DivineRelic[] = [];
  for (let i = 0; i < n; i++) {
    out.push(generateRandomRelic(seed !== undefined ? seed + i * 7919 : undefined));
  }
  return out;
}

// ----- Crucible computation -----

export interface CrucibleRuleView {
  ruleId: UniverseRuleId;
  /** Base level (3) + sum of REVEALED amounts. */
  revealedValue: number;
  /** True if at least one relic in the crucible affects this rule with an UNREVEALED amount. */
  hasMystery: boolean;
  /** Actual level (3 + sum of ALL amounts, before overflow). */
  rawValue: number;
  /** Final level after overflow normalization. */
  finalValue: number;
}

export interface CrucibleComputation {
  rules: CrucibleRuleView[];
  /** Sum of all finalValues (always = 50 after overflow normalization). */
  total: number;
  /** True if any rule's finalValue is < 1 or > 9. */
  unstable: boolean;
  /** Instability level = sum of overflow/underflow past [1..9]. */
  instability: number;
}

/**
 * Given relics in the crucible (full relic objects, including revealed state),
 * compute the per-rule view + final values + stability.
 *
 * - revealedValue = 3 + (sum of revealed amounts).
 * - hasMystery = true if any unrevealed amount affects the rule.
 * - rawValue = 3 + (sum of ALL amounts, revealed or not).
 * - finalValue = rawValue + overflow-distribution (total forced to 50).
 */
export function computeCrucibleRules(relics: DivineRelic[]): CrucibleComputation {
  const rawValues: number[] = RULE_IDS.map(() => RULE_BASE);
  const revealedValues: number[] = RULE_IDS.map(() => RULE_BASE);
  const hasMystery: boolean[] = RULE_IDS.map(() => false);

  for (const relic of relics) {
    for (const rr of relic.rules) {
      const idx = RULE_IDS.indexOf(rr.ruleId);
      if (idx < 0) continue;
      rawValues[idx] += rr.amount;
      if (rr.revealed.amount) {
        revealedValues[idx] += rr.amount;
      } else {
        hasMystery[idx] = true;
      }
    }
  }

  // Overflow normalization: bring total to RULE_TOTAL_TARGET (50).
  // Distribute the delta across all 10 rules evenly (with remainder spread
  // across the first N rules). Rules can end up < 1 or > 9 (instability).
  const rawTotal = rawValues.reduce((a, b) => a + b, 0);
  const delta = RULE_TOTAL_TARGET - rawTotal;
  const baseShare = Math.trunc(delta / 10);
  const remainder = delta - baseShare * 10;
  const finalValues = rawValues.map((v, i) => v + baseShare + (i < remainder ? 1 : 0));

  // Stability check: all rules in [1..9].
  let instability = 0;
  let unstable = false;
  for (const v of finalValues) {
    if (v < RULE_STABLE_MIN) {
      unstable = true;
      instability += RULE_STABLE_MIN - v;
    } else if (v > RULE_STABLE_MAX) {
      unstable = true;
      instability += v - RULE_STABLE_MAX;
    }
  }

  const total = finalValues.reduce((a, b) => a + b, 0);

  const rules: CrucibleRuleView[] = RULE_IDS.map((ruleId, i) => ({
    ruleId,
    revealedValue: revealedValues[i],
    hasMystery: hasMystery[i],
    rawValue: rawValues[i],
    finalValue: finalValues[i],
  }));

  return { rules, total, unstable, instability };
}

/**
 * Resolve overflow (alias for the overflow step). Returns final rule values
 * (total = 50). Same as `computeCrucibleRules(relics).rules.map(r => r.finalValue)`.
 */
export function resolveOverflow(rawValues: number[]): number[] {
  const rawTotal = rawValues.reduce((a, b) => a + b, 0);
  const delta = RULE_TOTAL_TARGET - rawTotal;
  const baseShare = Math.trunc(delta / 10);
  const remainder = delta - baseShare * 10;
  return rawValues.map((v, i) => v + baseShare + (i < remainder ? 1 : 0));
}

/**
 * Check stability of a final rule set (10 values, total = 50 expected).
 * Returns { stable, instability }.
 */
export function checkStability(finalValues: number[]): { stable: boolean; instability: number } {
  let instability = 0;
  let stable = true;
  const total = finalValues.reduce((a, b) => a + b, 0);
  if (total !== RULE_TOTAL_TARGET) {
    stable = false;
    instability += Math.abs(total - RULE_TOTAL_TARGET);
  }
  for (const v of finalValues) {
    if (v < RULE_STABLE_MIN) {
      stable = false;
      instability += RULE_STABLE_MIN - v;
    } else if (v > RULE_STABLE_MAX) {
      stable = false;
      instability += v - RULE_STABLE_MAX;
    }
  }
  return { stable, instability };
}

// ----- Archetypes (100) -----
export interface Archetype {
  id: string;
  name: string;
  /** 10 rule levels (one per RULE_IDS order). Sum = 50, each in [1..9]. */
  rules: number[];
  /** Bonus granted on discovery (+1% production per archetype). */
  bonus: {
    productionMult: number;
  };
  /** Short hint shown in the undiscovered list (cryptic, not full requirements). */
  hint: string;
}

const NAME_HIGH_FRAGMENT: Record<UniverseRuleId, string> = {
  spacetime: "Chronowoven",
  mythos: "Mythbound",
  entropy: "Everliving",
  determinism: "Prophesied",
  physics: "Realmbound",
  morality: "Righteous",
  consciousness: "Dreaming",
  meta_sovereignty: "Godsworn",
  metamorphic: "Shifting",
  veil: "Veilrent",
};

const NAME_LOW_FRAGMENT: Record<UniverseRuleId, string> = {
  spacetime: "Rigidworld",
  mythos: "Sundered",
  entropy: "Mortal",
  determinism: "Free",
  physics: "Cool",
  morality: "Subjective",
  consciousness: "Sleeping",
  meta_sovereignty: "Godless",
  metamorphic: "Still",
  veil: "Sealed",
};

function archetypeName(rules: number[]): string {
  // Find the rule with the highest value (first wins on tie).
  let maxIdx = 0;
  let minIdx = 0;
  for (let i = 1; i < rules.length; i++) {
    if (rules[i] > rules[maxIdx]) maxIdx = i;
    if (rules[i] < rules[minIdx]) minIdx = i;
  }
  // If all rules are 5, this is the balanced cosmos
  if (rules[maxIdx] === 5 && rules[minIdx] === 5) {
    return "The Balanced Cosmos";
  }
  const highPart = NAME_HIGH_FRAGMENT[RULE_IDS[maxIdx]];
  // If min and max are the same rule (all equal), use a balanced name
  if (maxIdx === minIdx) {
    return `The ${highPart} Realm`;
  }
  const lowPart = NAME_LOW_FRAGMENT[RULE_IDS[minIdx]];
  return `The ${highPart} ${lowPart}`;
}

function archetypeHint(rules: number[]): string {
  let maxIdx = 0;
  let minIdx = 0;
  for (let i = 1; i < rules.length; i++) {
    if (rules[i] > rules[maxIdx]) maxIdx = i;
    if (rules[i] < rules[minIdx]) minIdx = i;
  }
  if (rules[maxIdx] === 5 && rules[minIdx] === 5) {
    return "All rules balanced at 5. Pure equilibrium.";
  }
  const highRule = UNIVERSE_RULE_MAP[RULE_IDS[maxIdx]];
  const lowRule = UNIVERSE_RULE_MAP[RULE_IDS[minIdx]];
  return `High ${highRule.shortName}, low ${lowRule.shortName}.`;
}

/**
 * Deterministically generate 100 unique archetypes.
 * Each is a unique combination of rule levels that sums to 50 (all in [1..9]).
 */
function generateArchetypes(): Archetype[] {
  const archetypes: Archetype[] = [];
  const seen = new Set<string>();
  // First archetype: the perfectly balanced cosmos (all 5s).
  const base = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
  archetypes.push({
    id: "arch_000",
    name: archetypeName(base),
    rules: base.slice(),
    bonus: { productionMult: 0.01 },
    hint: archetypeHint(base),
  });
  seen.add(base.join(","));

  // Seeded PRNG for deterministic generation.
  const rng = mulberry32(0x5eed5eed);
  let attempts = 0;
  while (archetypes.length < 100 && attempts < 100000) {
    attempts++;
    const rules = base.slice();
    // Apply 3-5 random pair swaps (sum-conserving).
    const swapCount = 3 + Math.floor(rng() * 3);
    for (let k = 0; k < swapCount; k++) {
      let a = Math.floor(rng() * 10);
      let b = Math.floor(rng() * 10);
      let safety = 0;
      while (b === a && safety < 10) {
        b = Math.floor(rng() * 10);
        safety++;
      }
      if (b === a) continue;
      const delta = 1 + Math.floor(rng() * 4); // 1..4
      if (rules[a] + delta <= 9 && rules[b] - delta >= 1) {
        rules[a] += delta;
        rules[b] -= delta;
      }
    }
    const key = rules.join(",");
    if (seen.has(key)) continue;
    // Ensure still in [1..9]
    if (rules.some((v) => v < 1 || v > 9)) continue;
    // Ensure sum = 50
    if (rules.reduce((a, b) => a + b, 0) !== 50) continue;
    seen.add(key);
    const id = `arch_${String(archetypes.length).padStart(3, "0")}`;
    archetypes.push({
      id,
      name: archetypeName(rules),
      rules,
      bonus: { productionMult: 0.01 },
      hint: archetypeHint(rules),
    });
  }

  // Safety net: if we somehow didn't reach 100, fill remaining with deterministic
  // single-pair swaps (rule i +4, rule (i+1)%10 -4).
  let pairIdx = 0;
  while (archetypes.length < 100) {
    const rules = base.slice();
    const a = pairIdx % 10;
    const b = (a + 1) % 10;
    rules[a] += 4;
    rules[b] -= 4;
    pairIdx++;
    if (rules.some((v) => v < 1 || v > 9)) continue;
    const key = rules.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    const id = `arch_${String(archetypes.length).padStart(3, "0")}`;
    archetypes.push({
      id,
      name: archetypeName(rules),
      rules,
      bonus: { productionMult: 0.01 },
      hint: archetypeHint(rules),
    });
  }

  return archetypes;
}

export const ARCHETYPES: Archetype[] = generateArchetypes();
export const ARCHETYPE_MAP: Record<string, Archetype> = Object.fromEntries(
  ARCHETYPES.map((a) => [a.id, a])
);

/**
 * Total bonus from discovered archetypes (productionMult sum).
 * Each archetype grants +1% production.
 */
export function archetypeBonus(discovered: Record<string, boolean>): {
  productionMult: number;
  count: number;
} {
  let count = 0;
  for (const a of ARCHETYPES) {
    if (discovered[a.id]) count++;
  }
  return { productionMult: count * 0.01, count };
}

/**
 * Given final rule levels (10 values, total = 50), find the matching archetype.
 * Returns the archetype id if an exact match exists, otherwise null.
 */
export function matchArchetype(finalValues: number[]): string | null {
  for (const a of ARCHETYPES) {
    let match = true;
    for (let i = 0; i < 10; i++) {
      if (a.rules[i] !== finalValues[i]) {
        match = false;
        break;
      }
    }
    if (match) return a.id;
  }
  return null;
}

/**
 * Total count of archetypes (100). Used for the "all discovered?" check.
 */
export const ARCHETYPE_COUNT = ARCHETYPES.length;

/**
 * Has the player discovered all 100 archetypes? (Unlocks the ending screen.)
 */
export function isGenesisComplete(discovered: Record<string, boolean>): boolean {
  return Object.values(discovered || {}).filter(Boolean).length >= ARCHETYPES.length;
}

/**
 * Compute the relic-loss count for an unstable Big Bang.
 * - Lose `max(1, ceil(instability / 2))` relics from inventory.
 * - Capped at the available inventory (relics not in the crucible).
 */
export function relicLossCount(instability: number, availableInventory: number): number {
  const loss = Math.max(1, Math.ceil(instability / 2));
  return Math.min(loss, availableInventory);
}
