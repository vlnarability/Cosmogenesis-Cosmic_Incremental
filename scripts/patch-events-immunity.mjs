// One-shot transformation script for FIX-EVENTS-IMMUNITY-POPUPS.
// Adds `requiredArchetype` to all 90 archetype-specific lineage events,
// and `immuneTech` to events blocked by immunity techs.
//
// Usage: node scripts/patch-events-immunity.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EVENTS_PATH = resolve(__dirname, "../src/game/data/events.ts");

const source = readFileSync(EVENTS_PATH, "utf8");

// ---------------------------------------------------------------------------
// 1) requiredArchetype — match the id line of every archetype-specific event.
//    Archetype prefixes are the 9 "basic" lineages that get affinityChange
//    drift events across the 5 stages (tribal, civ, empire, solar, galactic).
// ---------------------------------------------------------------------------
const ARCHETYPES = [
  "humanoid",
  "mammalian",
  "reptilian",
  "avian",
  "arthropoid",
  "molluscoid",
  "fungoid",
  "plantoid",
  "aquatic",
];
const SUFFIXES = ["tribal", "civ", "empire", "solar", "galactic"];
const archAlt = ARCHETYPES.join("|");
const sufAlt = SUFFIXES.join("|");
// Capture: 1=indent, 2=archetype prefix, 3=event id body, 4=stage suffix
const idRe = new RegExp(
  `^(\\s*)id: "(${archAlt})_([a-z0-9_]+)_(${sufAlt})",$`,
  "gm"
);

let requiredArchetypeCount = 0;
const patched1 = source.replace(idRe, (match, indent, arch, body, suf) => {
  requiredArchetypeCount += 1;
  return `${match}\n${indent}requiredArchetype: "${arch}",`;
});

// ---------------------------------------------------------------------------
// 2) immuneTech — block events whose tech immunity has been researched.
//    Each tuple is [eventId, techId]. Inserted after the `stages:` line so
//    it sits alongside the other top-level metadata fields.
// ---------------------------------------------------------------------------
const IMMUNE_TECH_MAP = {
  // dna_repair → mutation events
  mutation_drift: "dna_repair",
  // osmoregulation → water-balance events
  toxic_tide: "osmoregulation",
  toxic_spring: "osmoregulation",
  // camouflage → predator events
  predator_shadow: "camouflage",
  predatory_pursuit: "camouflage",
  predator_ambush: "camouflage",
  // immune_system → plague events
  plague_rumor: "immune_system",
  genetic_plague: "immune_system",
  // hibernation → resource droughts
  drought_year: "hibernation",
  resource_drought: "hibernation",
};

let immuneTechCount = 0;
let patched2 = patched1;
for (const [eventId, techId] of Object.entries(IMMUNE_TECH_MAP)) {
  // Insert immuneTech after the `stages: [...]` line of this specific event.
  // We anchor on the `id: "..."` line for this exact event, then capture the
  // optional `name:`/`desc:`/`icon:` lines (these always appear in that
  // order between `id:` and `stages:` for game events) so the replacement
  // can re-emit them and only adds the new `immuneTech:` line.
  const idLineRe = new RegExp(
    `^(\\s*)id: "${eventId}",(\\n(?:\\s*name:.*\\n\\s*desc:.*\\n\\s*icon:.*\\n)?)(\\s*)stages: (\\[[^\\]]+\\]),$`,
    "m"
  );
  patched2 = patched2.replace(idLineRe, (match, idIndent, middleLines, stagesIndent, stagesArr) => {
    immuneTechCount += 1;
    return `${idIndent}id: "${eventId}",${middleLines}${stagesIndent}stages: ${stagesArr},\n${stagesIndent}immuneTech: "${techId}",`;
  });
}

writeFileSync(EVENTS_PATH, patched2, "utf8");

console.log(`Patched ${requiredArchetypeCount} events with requiredArchetype.`);
console.log(`Patched ${immuneTechCount} events with immuneTech.`);
