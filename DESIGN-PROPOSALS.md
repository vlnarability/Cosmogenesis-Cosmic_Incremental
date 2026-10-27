# Design Proposals — Stage Progression + Military/Trade/Treaties

Status: **Awaiting sign-off.** This doc proposes design directions for two big
features you raised. Nothing here is implemented yet — pick what you like,
reject what you don't, and I'll execute in the next round.

---

## Part 1 — Unique per-stage progression requirements

### Current state

All 7 stages use the same evolve formula: `minPopulation + minSystems + minTech`
plus the `requiresSystems: ["nucleus"]` I added for Cell. Boring — every stage
feels like a stat-check rather than a moment of transformation.

### Design principle

Each stage transition should feel like a **threshold moment** tied to the
theme of the next stage — not just "you have enough stuff". The requirement
should foreshadow what the next stage is about.

### Proposed requirements (one per stage transition)

#### Cell → Creature — *"The First Division"*
- **Requirement**: Build a Nucleus (already implemented via `requiresSystems`) + reach population 8.
- **Theme**: The cell has organized DNA + enough mass to divide into multicellular.
- **Status**: ✅ Already shipped. No change needed.

#### Creature → Tribal — *"The First Story"*
- **Requirement**: Build a `Memory Mound` system (the first cultural landmark) AND have completed at least one **event choice** (representing the first social learning).
- **Theme**: A pack becomes a tribe when it remembers its past — the first shared story is the line between animal and people.
- **Implementation**: Add `requiresSystems: ["memory_mound"]` + new `requiresEventChoice: true` field on StageDef. Track `eventChoicesResolved: number` on GameState, increment in `resolveEvent`. The "first event choice" naturally emerges from gameplay (events fire periodically).
- **Trade-off**: The "first event choice" gate means the player can't rush through creature in 30 seconds — they need to actually engage with at least one event. Events fire every ~60-120s, so this adds ~1-2 min to a fast creature clear.

#### Tribal → Civilization — *"The First Law"*
- **Requirement**: Choose a government (new `chooseGovernment` action — no longer auto-assigned) AND recover happiness to >= 50% (the disruption of new governance drops happiness by 25%, must be recovered before evolving).
- **Theme**: A tribe becomes a civilization when it codifies power. New governance always disrupts — the test is whether the new order can stabilize.
- **Implementation**:
  - Remove the auto-government assignment in `evolveStage` (currently fires at stageIndex 4 / Empire — needs to move to stageIndex 3 / entering Civ).
  - Add a `chooseGovernment(govId)` action that sets `pendingGovernment` (not active until evolve). Choosing causes `happiness -= 25%`.
  - Evolve-to-Civ is gated on `pendingGovernment !== null AND happiness >= 50%`.
  - Player must wait for happiness recovery (passive drift up via the existing happiness mechanics) OR build happiness-boosting systems (fire_pit, scent_marker, etc.) to accelerate.
- **Player agency**: The player chooses the government (Empire's `preferredGovernment` auto-buyer setting still works for auto-pickers). The unhappiness setback creates a meaningful 1-2 min recovery phase that makes the transition feel weighty.

#### Civilization → Empire — *"The First Frontier"*
- **Requirement**: Build a `Capitol` system (new — a signature civ-stage building) AND establish at least 1 `Trade Route` system (representing expansion beyond city limits).
- **Theme**: A civilization becomes an empire when it projects power beyond its borders — the first trade route is the moment a city becomes a regional force.
- **Implementation**: Add `requiresSystems: ["capitol", "trade_route"]`. Both are new systems (capitol is a high-cost civ building; trade_route already exists at empire stage — needs to be moved/duplicated to civ). The Capitol requires the `civics` tech (new). The Trade Route requires the `caravan_logistics` tech (new).

#### Empire → Solar — *"The First Skybreak"*
- **Requirement**: Choose 1 of 3 mutually-exclusive FTL methods (research the corresponding tech) AND build the matching FTL infrastructure system.
- **Theme**: An empire becomes a solar civilization when it breaks the sky — the FTL choice is permanent and defines the civ's flavor.
- **3 FTL methods**:
  - **Warp Drive** (`warp_theory` tech + `warp_gate` system) — fast, expensive, high-energy. +50% travel speed, +25% energy upkeep.
  - **Hyperdrive** (`hyperlanes` tech + `hyperlane_network` system) — medium speed, medium cost, reliable. +25% travel speed, +10% data.
  - **Jump Gates** (`jump_theory` tech + `jump_array` system) — slow to build, instant once built, low upkeep. +100% colonist throughput, no speed boost.
- **Implementation**: Add 3 mutually-exclusive techs (use `exclusiveWith` field) + 3 corresponding systems. Add `requiresTechs: ["warp_theory"] | ["hyperlanes"] | ["jump_theory"]` (one-of-three check) on StageDef. UI shows a "Choose your FTL path" picker when the player first reaches stage 6.
- **Permanence**: The choice carries forward to galactic stage — different FTL methods give different bonuses to colonization, military, and trade in later stages.

#### Solar → Galactic — *"The First Ascension"*
- **Requirement**: Choose 1 of 3 ascension paths AND complete an `Ascension Project` system (a long-construction megastructure).
- **3 ascension paths**:
  - **Technological Singularity** (`tech_ascension` tech) — science-focused. +100% science, unlocks the digital-mind path.
  - **Biological Transcendence** (`bio_ascension` tech) — population-focused. +100% pop growth, unlocks the genetic-mastery path.
  - **Psionic Awakening** (`psionic_ascension` tech) — happiness-focused. +100% happiness, unlocks the consciousness path.
- **Implementation**: 3 mutually-exclusive techs. Add `Ascension Project` system (long build, requires chosen path tech). Stage 7 evolution gated on `technologies[one_of_three_ascension_techs]` AND `ownedSystems.ascension_project >= 1`.
- **Permanence**: The ascension path defines the player's galactic-stage flavor — different events, different systems, different prestige bonuses.

#### Galactic → Prestige — *"The First Reckoning"*
- **Requirement**: Already implemented — triggers `triggerPrestige` at the end of galactic stage. Could be enhanced to require building a `Galactic Council` system (representing federating the galaxy) before prestige is available.
- **Status**: Optional polish. Current behavior is fine.

### New StageDef fields needed

```typescript
interface StageDef {
  // ... existing fields
  evolveRequires: {
    minPopulation: number;
    minSystems: number;
    minTech: number;
    requiresSystems?: string[];        // already exists
    requiresTechs?: string[];            // NEW — all listed techs must be researched
    requiresOneOfTechs?: string[];       // NEW — at least one must be researched (for either/or paths)
    requiresEventChoices?: number;       // NEW — count of resolved event choices
    requiresGovernmentChosen?: boolean;  // NEW — must have chosen (not auto-assigned) a government
    requiresHappinessThreshold?: number; // NEW — happiness must be >= this to evolve
  };
}
```

---

## Part 2 — Military / Trade / Treaties overhaul

### Current state

- `military_power` is a resource with no purpose — no rivals to fight, no treaties to sign, no trade to protect.
- 38 military-themed systems exist (barracks, legions, defense platforms, etc.) that produce military_power to no end.
- Events occasionally reference military (raids, raidsRepelled) but it's all background — player has no agency.

### Design inspiration (per your references)

- **Kittens Game**: Trade routes with NPC civs, hunting for rare drops, treaties with bonuses + obligations.
- **Evolve Incremental**: Rivals that grow in parallel, periodic threats, military used for defense + expansion.

### Proposed system: 3 layers, incremental implementation

#### Layer A — Trade (Kittens Game-inspired) — easiest to implement, highest immediate value

**Concept**: Add NPC trade partners (small static civs) at each stage starting Tribal. Player builds Trade Caravans / Trade Routes to establish trade agreements. Trade passively generates bonus resources + gives access to rare resources you can't produce otherwise.

**Per-stage trade partners** (each stage has 2-3 partners):
- **Tribal**: neighboring tribes (Bone Clan, Hill Folk, River Runners). Trade wood/stone for gold/rare furs.
- **Civilization**: neighboring city-states (Marble Republic, Iron Horde, Silk Concord). Trade production for influence/rare artifacts.
- **Empire**: neighboring empires (Stellar Hegemony, Crystal Compact, Tide Dominion). Trade science for energy/rare alloys.
- **Solar**: neighboring systems (inner worlds, outer belt, gas giants). Trade alloys for data/rare isotopes.
- **Galactic**: neighboring star nations (3 archetypes — Conquerors, Diplomats, Scientists). Trade divinity for ascension materials.

**Mechanics**:
- Build `trade_caravan` system (cheap, low pop-growth). Each caravan picks a partner (player choice) and starts generating the trade resource.
- Trade agreements give +X% of one resource per tick, capped per partner.
- Some partners offer **rare resources** (furs, artifacts, isotopes) that unlock special systems or techs (e.g., `ancient_artifact` unlocks `archive` system; `stellar_isotope` unlocks `antimatter_collection`).
- Trade can be broken (player choice) — partner relation drops, no immediate penalty but they won't trade for X time.

**Implementation effort**: ~3-5 systems per stage + a `TradePartner` data module + UI in the existing Systems tab. ~1-2 days.

#### Layer B — Hunting (Kittens Game-inspired) — adds variety + rare drops

**Concept**: Add `hunting_grounds` system per stage (creature+). Each "hunt" (periodic tick) has a chance to produce:
- Common drops (food, materials, organic_matter — small bonus).
- Rare drops (bone, hide, venom, etc.) — used in special crafting or trade.
- **Encounters** (mini-events) — treasure, predator, lost traveler, mystical beast. Player chooses to engage or avoid.

**Mechanics**:
- `hunting_grounds` produces base food per tick.
- Every N ticks, a "hunt" fires — rolls for drops + chance of encounter.
- Encounters are 1-choice events (engage / avoid). Engaging costs some resource (military, food) but gives better drops.
- Rare drops feed into Trade (Layer A) — partners trade for them.

**Implementation effort**: 1 system per stage + 5-10 encounter events + small UI. ~1 day.

#### Layer C — Rivals (Evolve Incremental-inspired) — gives military a purpose

**Concept**: Add NPC rival civilizations that grow in parallel to the player. Each stage has 1-3 rivals that scale with the player's progress. Rivals periodically threaten (raids, demands) and the player uses military to defend or counterattack.

**Per-stage rivals**:
- **Tribal**: rival tribes (Bone Clan reappears as rival if trade agreement broken, etc.).
- **Civilization**: rival city-states (competing for territory).
- **Empire**: rival empires (cold war, border skirmishes).
- **Solar**: rival stellar nations (pirate fleets, territorial disputes).
- **Galactic**: rival galactic councils (ideological conflicts).

**Mechanics**:
- A `Threat` meter per rival grows over time (faster if player neglects military).
- When threat hits 100%, a **raid event** fires: rival attacks. Player's military_power defends automatically (defense roll), losing some military + resources if unsuccessful.
- Player can build `defense_tower` / `garrison` / `orbital_defense` systems to boost defense.
- Player can launch **counter-raids** (offensive military action): spend military_power to raid the rival, gaining resources + reducing their threat.
- Long-term: player can **assimilate** a rival (after X successful counter-raids) — rival joins your civ, giving permanent bonuses.

**Implementation effort**: Rival data module + threat decay tick + raid events + counter-raid action + assimilation logic. ~2-3 days.

#### Layer D — Treaties (Kittens Game-inspired) — diplomatic layer, optional polish

**Concept**: Sign treaties with NPC partners (trade partners from Layer A OR rivals from Layer C). Treaties give bonuses but also obligations.

**Treaty types**:
- **Trade Agreement**: +X% trade income for both parties. Breakable.
- **Non-Aggression Pact**: rival threat growth -50%. Breakable (causes permanent hostility).
- **Mutual Defense**: if either party is raided, the other joins the defense. Requires active military.
- **Research Pact**: +X% science for both parties. Breakable.

**Mechanics**:
- Each partner has a `relation` meter (-100 hostile → +100 allied).
- Treaties require minimum relation + sometimes a resource gift.
- Treaties can be broken — relation drops, possible hostility.

**Implementation effort**: Treaties data module + relation decay tick + UI panel in Diplomacy tab. ~2 days. **Low priority** — Layers A-C give the bulk of the value; Layer D is depth for players who want it.

### Recommended implementation order

1. **Layer A — Trade** (highest immediate value, easiest). Provides the rare-resource pipeline that Layers B + C feed into.
2. **Layer B — Hunting** (medium value, ties to events). Adds variety + feeds rare drops into Trade.
3. **Layer C — Rivals** (gives military its purpose). The biggest "why does military exist" fix.
4. **Layer D — Treaties** (depth). Optional polish for players who want diplomacy.

### Estimated total effort

- Stage progression (Part 1): ~3-4 days (mostly data + UI for the FTL/Ascension pickers).
- Trade (Layer A): ~1-2 days.
- Hunting (Layer B): ~1 day.
- Rivals (Layer C): ~2-3 days.
- Treaties (Layer D): ~2 days.

**Total: ~9-12 days of work.** Can be staged over multiple rounds — each layer is independently shippable.

---

## What I need from you

For **Part 1 (stage progression)**:
- Do the per-stage requirements feel right? Any you'd swap or simplify?
- The government-choice-with-happiness-recovery for Tribal→Civ is the most novel mechanic — does that sound good, or too punishing?
- The 3-FTL-choice for Empire→Solar and 3-Ascension-choice for Solar→Galactic are the centerpiece asks — confirm you want me to implement these as I described?

For **Part 2 (military/trade/treaties)**:
- Confirm the 4-layer breakdown (Trade → Hunting → Rivals → Treaties) and the recommended order.
- Any layers you'd skip or merge?
- Any specific mechanics from Kittens Game / Evolve that you want me to make sure I include?

Once you sign off, I'll start with the highest-priority layer in the next round.
