// Nucleus Alternatives — the 4 mutually-exclusive Cell-stage nucleus systems.
//
// Per user spec: choosing one of the 4 nucleus types is the FIRST archetype-
// changing decision the player makes. It locks the other 3 + restricts all
// organelle (cell system) purchases + mutation (cell tech) drift to the
// chosen pool's archetypes. The choice is purely a GATE — no bonuses between
// them; it determines which archetype pool the player can drift toward.
//
// Pool assignment (per user's spec, 25 archetypes total):
//   Nucleus (Eukaryotes)       — 9 archetypes (all existing/basic)
//   Nucleoid Region (Prokaryotes) — 5 (Extremophile existing + 4 new)
//   Nucleomorph (Endosymbionts/Synthetics) — 5 (Lithoid+Toxoid existing + 3 new)
//   Nuclear Body (Viral/Compartmentalized) — 6 (Necroid existing + 5 new)
//
// The 12 new archetypes (Plasmold, Crystal, Radiotrophic, Aerosol, Mechanoid,
// Symbiote, Voidborn, Viruloid, Photonic, Myceloid, Prionoid, Gelatinous) get
// full defs + drift systems in Round B. For Round A, the pool mapping
// references them as strings so the lock logic resolves; the archetype defs
// themselves are added later.

export interface NucleusPoolDef {
  /** The nucleus system id (matches the SystemDef id). */
  id: "nucleus" | "nucleoid_region" | "nucleomorph" | "nuclear_body";
  /** Display name. */
  name: string;
  /** Subtitle (the biological category). */
  subtitle: string;
  /** Icon for the modal card. */
  icon: string;
  /** Tagline (one line). */
  tagline: string;
  /** Longer description for the modal. */
  description: string;
  /** Accent color (hex) for the modal card. */
  color: string;
  /** The archetype ids in this pool (drift restricted to these). */
  archetypes: string[];
  /** The flagship archetype — the one the nucleus system grants initial drift toward. */
  flagship: string;
}

export const NUCLEUS_POOLS: NucleusPoolDef[] = [
  {
    id: "nucleus",
    name: "Nucleus",
    subtitle: "The Eukaryotes",
    icon: "🟣",
    tagline: "Complex life — the galactic mainstream.",
    description:
      "A true membrane-bound nucleus. The foundation of complex cellular life — " +
      "every Eukaryote lineage traces back here. The most populous path: humanoids, " +
      "arthropods, and their kin dominate the galaxy.",
    color: "#22d3ee",
    archetypes: [
      "humanoid", "mammalian", "reptilian", "avian", "arthropoid",
      "aquatic", "molluscoid", "fungoid", "plantoid",
    ],
    flagship: "humanoid",
  },
  {
    id: "nucleoid_region",
    name: "Nucleoid Region",
    subtitle: "The Prokaryotes",
    icon: "🔵",
    tagline: "Life without a nucleus — the extremophiles.",
    description:
      "No membrane-bound nucleus; genetic material floats in a nucleoid region. " +
      "The path of life that never needed complexity — it thrived in the extremes. " +
      "Rarer, stranger, hardened by the places nothing else could survive.",
    color: "#84cc16",
    archetypes: [
      "extremophile", "plasmold", "crystal", "radiotrophic", "aerosol",
    ],
    flagship: "extremophile",
  },
  {
    id: "nucleomorph",
    name: "Nucleomorph",
    subtitle: "The Endosymbionts / Synthetics",
    icon: "🟠",
    tagline: "Multi-membrane chimeras — the rare ones.",
    description:
      "A multi-membrane relic of endosymbiosis — cells within cells, where the " +
      "sub-compartments became their own organisms. The rarest path: lithoid, " +
      "mechanoid, voidborn — life that bent the rules of what 'alive' even means.",
    color: "#a855f7",
    archetypes: [
      "lithoid", "toxoid", "mechanoid", "symbiote", "voidborn",
    ],
    flagship: "lithoid",
  },
  {
    id: "nuclear_body",
    name: "Nuclear Body",
    subtitle: "The Viral / Compartmentalized",
    icon: "🟢",
    tagline: "Life at the edge — the viral + the alien.",
    description:
      "No true nucleus — a compartmentalized nuclear body, the architecture of " +
      "viruses + the alien. Life that replicates by hijacking, by light, by " +
      "geometric protein alignment. The strangest pool — necroid, viruloid, photonic.",
    color: "#10b981",
    archetypes: [
      "necroid", "viruloid", "photonic", "myceloid", "prionoid", "gelatinous",
    ],
    flagship: "necroid",
  },
];

export const NUCLEUS_POOL_MAP: Record<string, NucleusPoolDef> = Object.fromEntries(
  NUCLEUS_POOLS.map((p) => [p.id, p])
);

/** The archetype ids that belong to the chosen nucleus pool (or null if no choice yet). */
export function poolArchetypesFor(nucleusChoice: string | null | undefined): string[] | null {
  if (!nucleusChoice) return null;
  const pool = NUCLEUS_POOL_MAP[nucleusChoice];
  return pool ? pool.archetypes : null;
}

/** The nucleus system ids (used for the Cell→Creature evolve gate + the
 *  exclusiveWith / pool-lock checks). Typed as string[] so `.includes(sysId)`
 *  accepts any system id without TS narrowing complaints. */
export const NUCLEUS_SYSTEM_IDS: string[] = NUCLEUS_POOLS.map((p) => p.id);
