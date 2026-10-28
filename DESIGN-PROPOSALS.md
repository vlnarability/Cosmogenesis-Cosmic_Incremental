# Design Proposals — Stage Progression + Military/Trade/Treaties

Status: **Confirmed with modifications.** User has signed off on both parts
with specific changes (see "User Confirmed Changes" sections below).
Implementation will begin in the next round, starting with the highest-priority
layer (Trade — Layer A).

---

## Part 1 — Unique per-stage progression requirements

### User Confirmed Changes (from sign-off)

The original proposed requirements + user's confirmed modifications:

#### Cell → Creature — *"The First Division"*
- **Requirement**: Build a Nucleus + reach population 8.
- **Status**: ✅ Already shipped (since commit 9129079).
- **User verdict**: "Good."

#### Creature → Tribal — *"The First Conquest"*
- **Original proposal**: Build Memory Mound + complete first event choice.
- **User verdict**: ❌ Rejected — *"Not an event choice as that's so easy to do and random."*
- **Confirmed requirement**: Require interaction with rival creatures — either **conquering** OR **merging with** another creature to develop your tribe.
- **Implementation**: Add 2-3 NPC rival creature packs at creature stage. Player can:
  - **Conquer**: build military_power + defeat the rival (gives resources + the rival's territory).
  - **Merge**: meet relation threshold + sign a merger pact (gives the rival's lineage drift + population boost).
  - Either path satisfies the evolution requirement.
- **Theme**: A pack becomes a tribe by absorbing or defeating its neighbors — the first political act.

#### Tribal → Civilization — *"The First Law"*
- **Requirement**: Choose a government + recover happiness to ≥50% after the disruption.
- **User verdict**: "Good."
- **Implementation**: Remove the auto-government assignment. Add a `chooseGovernment(govId)` action. Choosing causes `happiness -= 25%`. Evolve-to-Civ gated on `pendingGovernment !== null AND happiness >= 50%`.

#### Civilization → Empire — *"The First Frontier"*
- **Original proposal**: Build Capitol + 1 Trade Route.
- **User verdict**: Modified — *"Require multiple trade routes."*
- **Confirmed requirement**: Build Capitol + establish **multiple Trade Routes** (probably 3, representing connections to multiple city-states — not just one).
- **Implementation**: `requiresSystems: ["capitol", "trade_route_1", "trade_route_2", "trade_route_3"]` OR a counter `tradeRoutesEstablished >= 3`.

#### Empire → Solar — *"The First Skybreak"*
- **Original proposal**: Choose 1 of 3 FTL methods + matching infrastructure.
- **User correction**: ❌ You don't learn FTL before you go to space. The FTL choice happens IN Solar to unlock the galaxy (Solar→Galactic). Empire→Solar should just be about resolving rivals on the homeworld.
- **Confirmed requirement**: Either **ally with** OR **wipe out** all rival empires before breaking the sky.
- **Implementation**: Track NPC rival empires. Each rival has a `state: "active" | "allied" | "conquered"` field. Evolve-to-Solar gated on `rivals.every(r => r.state !== "active")`. Player can:
  - **Ally**: relation >= +75, sign a treaty (gives permanent bonuses + frees the rivalry threat).
  - **Conquer**: military_power sufficient, launch a conquest campaign (gives territory + resources, removes the rival).
- **Theme**: An empire can't reach for the stars while wars rage at home. Resolve all rivals before ascending.

#### Solar → Galactic — *"The First Light"*
- **Requirement**: Choose 1 of 3 mutually-exclusive FTL methods (Warp Drive / Hyperdrive / Jump Gates) + build matching infrastructure system. **THIS is where the FTL choice happens** — you develop FTL IN the Solar stage to unlock the galaxy.
- **User correction**: FTL choice moved here from Empire→Solar (you don't learn FTL before you go to space).
- **Implementation**: 3 mutually-exclusive techs (`warp_theory`, `hyperlanes`, `jump_theory` — use `exclusiveWith` field) + 3 corresponding systems. New `requiresOneOfTechs` field on StageDef. UI shows a "Choose your FTL path" picker when the player first reaches Solar stage.

#### Galactic → Prestige — *"The First Ascension"*
- **Requirement**: Choose 1 of 3 mutually-exclusive ascension paths (Technological Singularity / Biological Transcendence / Psionic Awakening) + complete Ascension Project system.
- **User verdict**: "Good."
- **Implementation**: 3 mutually-exclusive techs. New Ascension Project system (long build, requires chosen path tech). Stage 7 evolution gated on `requiresOneOfTechs` + `ownedSystems.ascension_project >= 1`.

### New StageDef fields needed (confirmed)

```typescript
interface StageDef {
  // ... existing fields
  evolveRequires: {
    minPopulation: number;
    minSystems: number;
    minTech: number;
    requiresSystems?: string[];           // already exists (used by Cell→Creature for Nucleus)
    requiresTechs?: string[];             // NEW — all listed techs must be researched
    requiresOneOfTechs?: string[];          // NEW — at least one must be researched (for either/or paths)
    requiresEventChoices?: number;        // NEW (REJECTED by user — too random)
    requiresRivalsResolved?: boolean;      // NEW (Creature→Tribal + Empire→Solar) — all rivals must be conquered/merged/allied
    requiresGovernmentChosen?: boolean;    // NEW (Tribal→Civ)
    requiresHappinessThreshold?: number;   // NEW (Tribal→Civ — happiness must be ≥ this)
    requiresTradeRoutes?: number;          // NEW (Civ→Empire — minimum count of trade routes established)
  };
}
```

---

## Part 2 — Military / Trade / Treaties overhaul

### User Confirmed Changes (from sign-off)

User said: *"Part 2 (love it)"* — approved all 4 layers with two specific additions:

#### Layer A — Trade (Kittens Game-inspired)
- **User verdict**: "Good."
- **Implementation**: NPC trade partners per stage, trade caravans produce bonus + rare resources. ~1-2 days.

#### Layer B — Hunting (Kittens Game-inspired)
- **User verdict**: "Good, **but also add a hunt button on actions that spends military and/or pop to trigger immediately**."
- **Confirmed addition**: New `hunt` action on the Actions tab. Spends `military_power` AND/OR `population` to trigger a hunt immediately (instead of waiting for the periodic tick).
- **Implementation**: Existing periodic hunt mechanics (rare drops, encounters) + a manual action button on ActionsTab. The manual hunt has higher drop rates (premium for proactive play) but costs resources.
- **Estimated effort**: ~1 day (same as before, just adds an Actions button).

#### Layer C — Rivals (Evolve Incremental-inspired)
- **User verdict**: "Good, **add a rival tab so the player can view each easily**."
- **Confirmed addition**: New "Rivals" tab in the main tab bar. Lists all NPC rivals with their threat level, relation, state (active/allied/conquered), and buttons to interact (raid, counter-raid, sign treaty, propose merger).
- **Implementation**: Same rival mechanics as proposed + a dedicated tab UI. The tab is unlocked at creature stage (when the first rival appears) and persists through all later stages.
- **Estimated effort**: ~2-3 days (same as before, just adds a tab UI).

#### Layer D — Treaties
- **User verdict**: "Great."
- **Implementation**: Diplomatic layer with trade agreements, non-aggression pacts, mutual defense, research pacts. ~2 days.

### Recommended implementation order (confirmed)

1. **Layer A — Trade** (highest immediate value, easiest). Provides the rare-resource pipeline that Layers B + C feed into.
2. **Layer B — Hunting** (medium value, ties to events). Adds variety + feeds rare drops into Trade. **Includes the manual hunt button on Actions.**
3. **Layer C — Rivals** (gives military its purpose). The biggest "why does military exist" fix. **Includes the dedicated Rivals tab.**
4. **Layer D — Treaties** (depth). Optional polish for players who want diplomacy.

### Estimated total effort

- Stage progression (Part 1, confirmed): ~3-4 days (mostly data + UI for the FTL/Ascension pickers + the rival-resolved gate for Creature→Tribal + Empire→Solar).
- Trade (Layer A): ~1-2 days.
- Hunting (Layer B + manual hunt action): ~1 day.
- Rivals (Layer C + Rivals tab): ~2-3 days.
- Treaties (Layer D): ~2 days.

**Total: ~9-12 days of work.** Staged over multiple rounds — each layer is independently shippable. Implementation begins next round with Trade (Layer A) as the highest-priority foundation.

---

## What's been done so far (this round)

Concrete fixes already shipped in commit `2140584`:
1. ✅ Removed `divinity` resource from being a galactic-stage resource (changed category to "meta", firstStage to "cell" — matches the other meta currencies evolution_points / enlightenment_points / transcendence_points).
2. ✅ Tech-locked 167 systems that previously had no `requiredTech` (cell Drift systems → dna_repair, creature Habitat → Survival tech, tribal Industry → Crafts tech, etc.). Total `requiredTech` occurrences: 82 → 249.
3. ✅ Hide tech-locked systems in SystemsTab (unowned + tech-locked → hidden). Cell stage went from 5 visible categories to 2 (Production + Core) on a fresh save.
4. ✅ Hide prereq-locked techs in TechTab (unresearched + prereq-not-met → hidden). Tech tab now shows only the tier-1 techs of each branch on a fresh save.
5. ✅ Landing page button uses Layer NAME not L-number ("Return · resume at Enlightenment" instead of "Return · resume at L2").

