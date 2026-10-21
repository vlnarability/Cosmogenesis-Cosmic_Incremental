# TODO — Alternative Dimension Reskins (Stretch Goals)

These are full visual reskins of the entire game (Cell→Galactic + L1-L10). Each changes the visual identity, resource names, system names, and narrative flavor. They unlock after finishing L10 once and choosing "Explore another Dimension" during the cosmic boon reset.

## Unlock Flow
1. Player finishes L10 (all 100 archetypes discovered) → ending screen
2. Player clicks "Explore another Dimension" → dimension picker
3. First time: only "Mundane Realm" (the base game) is available
4. After finishing any dimension once, it appears in the picker for future runs
5. The picker shows: "Start again in this Dimension (current)" + "Random Dimension" + list of visited dimensions (excluding current)

## Dimensions

### 1. Mundane Realm (base game — always available)
- Standard sci-fi evolutionary theme
- Cell → Galactic progression
- 10 prestige layers as designed
- This is what we've been building

### 2. Fantasy Realm
- Cell → "Spirit" (mana instead of ATP)
- Creature → "Familiar" (magical beasts)
- Tribal → "Clan" (medieval tribes)
- Civilization → "Kingdom" (castles, knights)
- Empire → "Empire" (renaissance/industrial fantasy)
- Solar → "Celestial" (planar travel)
- Galactic → "Cosmic" (multiverse)
- Systems → magical constructs (Crystal Tower, Enchanted Grove, Runeforge)
- Archetypes → fantasy races (Elf, Dwarf, Orc, Undead, Dragon, Fairy, etc.)
- Theme: parchment textures, illuminated manuscript borders, gold filigree, medieval fonts

### 3. Cyberpunk Neon
- Cell → "Process" (CPU cycles instead of ATP)
- Creature → "Subroutine" (evolved code)
- Tribal → "Cell" (hacker collectives)
- Civilization → "Network" (corporate arcologies)
- Empire → "Megastructure" (cyberpunk mega-city)
- Solar → "Orbital" (satellite networks)
- Galactic → "Singularity" (AI ascension)
- Systems → cyber-decks, server farms, ICE breakers, data mines
- Archetypes → factions (Corpo, Netrunner, Nomad, AI, Synth, etc.)
- Theme: neon green/pink on black, terminal fonts, glitch effects, scanlines

### 4. Ancient Egypt
- Cell → "Scarab" (sacred beetle)
- Creature → "Sphinx" (mythical creature)
- Tribal → "Nome" (Egyptian districts)
- Civilization → "Dynasty" (pharaonic Egypt)
- Empire → "New Kingdom" (imperial Egypt)
- Solar → "Barque of Ra" (solar journey)
- Galactic → "Duat" (underworld/cosmos)
- Systems → pyramids, obelisks, canals, temples, mortuary complexes
- Archetypes → Egyptian gods (Ra, Anubis, Osiris, Bastet, Thoth, etc.)
- Theme: gold on sandstone, hieroglyph borders, papyrus textures

### 5. Norse Mythology
- Cell → "Ymir's Blood" (primordial)
- Creature → "Jotun" (frost giant spawn)
- Tribal → "Clan" (Viking tribes)
- Civilization → "Jarldom" (Norse civilization)
- Empire → "Empire" (imperial Norse)
- Solar → "Bifrost" (rain bridge)
- Galactic → "Yggdrasil" (world tree)
- Systems → longhouses, runestones, mead halls, shipyards, shrines
- Archetypes → Norse gods (Thor, Odin, Loki, Freya, Tyr, etc.)
- Theme: wood and stone textures, runic fonts, snow/frost effects

### 6. Greek Mythology
- Cell → "Chaos" (primordial)
- Creature → "Nymph" (nature spirit)
- Tribal → "Polis" (Greek city-state)
- Civilization → "Civilization" (classical Greece)
- Empire → "Hellenistic" (Alexander's empire)
- Solar → "Olympus" (mountain of gods)
- Galactic → "Cosmos" (Greek cosmos)
- Systems → temples, agoras, academies, theaters, triremes
- Archetypes → Greek gods (Zeus, Poseidon, Hades, Athena, Ares, etc.)
- Theme: marble textures, Ionic/Doric column borders, classical fonts

### 7. Post-Apocalyptic
- Cell → "Spore" (mutated cell)
- Creature → "Mutant" (evolved mutant)
- Tribal → "Tribe" (wasteland survivors)
- Civilization → "Settlement" (rebuilt civilization)
- Empire → "Warlord State" (post-apoc empire)
- Solar → "Orbital Cache" (salvaged tech)
- Galactic → "Wasteland Earth" (rebuilt planet)
- Systems → scrap yards, water pumps, mutant farms, raid outposts, bunkers
- Archetypes → mutant strains (Glowing, Feral, Regenerated, Synthetic, etc.)
- Theme: rust on concrete, hazard stripes, survival-journal aesthetic

## Implementation Notes
- Each reskin is a complete theme override (CSS variables + fonts + emoji/icon mappings)
- Resource names, system names, tech names, story text all change per dimension
- The game logic (formulas, progression, layers) stays the same — only the presentation changes
- Unlocked dimensions persist in save data across runs
- The dimension picker UI lives in the L10 ending screen

## FTL Branch Ideas (Steam Release Expansion)
Considered for the Solar stage — 3 branching FTL tech choices. Skip for now; revisit for the Steam release.

| FTL Type | Pros | Cons | Theme |
|---|---|---|---|
| Warp Drive | +50% production, +30% pop growth | -20% happiness, -15% military | "Fold space, collapse distance" |
| Wormhole Network | +100% trade value, +50% science | -30% stability, -20% military | "Bend the universe into a loop" |
| Jump Drive | +80% all production, immune to distance | -40% pop growth, -25% capacity | "Skip space entirely" |
