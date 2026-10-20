// Government playtest automation script.
// Runs 20 government playthroughs (Cell→Galactic) with each government forced.
// Run via: cat /home/z/my-project/scripts/playtest-governments.js | agent-browser eval --stdin
// Then: agent-browser eval "window.__startGovBatch()"

const STAGE_REQS = [
  { name: "Cell",        pop: 8,    sys: 4,  tech: 2 },
  { name: "Creature",    pop: 30,   sys: 8,  tech: 3 },
  { name: "Tribal",      pop: 80,   sys: 10, tech: 4 },
  { name: "Civilization",pop: 200,  sys: 12, tech: 5 },
  { name: "Empire",      pop: 600,  sys: 14, tech: 7 },
  { name: "Solar",       pop: 1000, sys: 12, tech: 8 },
  { name: "Galactic",    pop: 2000, sys: 12, tech: 10 },
];

const STAGE_IDS = ["cell","creature","tribal","civilization","empire","solar","galactic"];

// All 20 governments (from src/game/data/governments.ts)
const ALL_GOVERNMENTS = [
  "totalitarian","technocracy","cultural_republic","merchant_oligarchy","democracy",
  "socialist_collective","industrial_juggernaut",
  "necrocracy","venom_council","gaia_communion","crystal_hegemony","aerie_senate",
  "tidal_federation","pack_dominion","reptilian_junta","hive_collective",
  "fungal_network","mollusc_syndicate","human_republic","extremophile_regime",
];

// Map government → archetype (for archetype-specific governments)
const GOV_TO_ARCHETYPE = {
  necrocracy: "necroid", venom_council: "toxoid", gaia_communion: "plantoid",
  crystal_hegemony: "lithoid", aerie_senate: "avian", tidal_federation: "aquatic",
  pack_dominion: "mammalian", reptilian_junta: "reptilian", hive_collective: "arthropoid",
  fungal_network: "fungoid", mollusc_syndicate: "molluscoid", human_republic: "humanoid",
  extremophile_regime: "extremophile",
};

// Map archetype → affinity-granting system (for drift targeting)
const AFFINITY_SYSTEMS = {
  humanoid: ["nucleus"], mammalian: ["den"], arthropoid: ["sawmill"],
  reptilian: ["barracks"], necroid: ["temple"], plantoid: ["solar_array"],
};
const AFFINITY_TECHS = {
  fungoid: ["enzymatic_pathways"], plantoid: ["photosynthesis"],
  molluscoid: ["language"], mammalian: ["domestication"], reptilian: ["warcraft"],
};

function getSystemsAtStage(stageId) {
  const BY_STAGE = {
    cell: ["membrane_pump","ribosome","vacuole","mitochondria","organelle_forge","nucleus","mitochondrial_bloom"],
    creature: ["grazing_grounds","watering_hole","den","tool_cache","memory_mound","brood_chamber"],
    tribal: ["farm","well","sawmill","quarry","hut","totem","hearth_circle"],
    civilization: ["workshop","market","granary","academy","barracks","temple","sanitation_grid"],
    empire: ["provincial_capital","trade_route","legion_camp","fertility_program"],
    solar: ["solar_array","orbital_forge","colony_ship","orbital_habitats"],
    galactic: ["stellar_heart","data_sanctum","ascension_gate","genetic_synthesizer"],
  };
  return BY_STAGE[stageId] || [];
}
function getTechsAtStage(stageId) {
  const BY_STAGE = {
    cell: ["membrane_reinforcement","enzymatic_pathways","organelle_specialization","photosynthesis","cellular_division"],
    creature: ["pack_instinct","tool_use","language","domestication","mating_seasons"],
    tribal: ["agriculture","masonry","writing","warcraft","midwifery"],
    civilization: ["urban_planning","currency_system","scientific_method","standing_army","public_health"],
    empire: ["bureaucracy","imperial_roads","cloning_vats"],
    solar: ["fusion_power","orbital_industry","generation_ships"],
    galactic: ["quantum_computing","stellar_engineering","ascension_theory","cosmic_nursery"],
  };
  return BY_STAGE[stageId] || [];
}

async function runGovernmentPlaytest(govId) {
  const store = window.__gameStore;
  if (!store) return { govId, error: "no store" };

  // 1. Hard reset
  store.getState().hardReset();
  await new Promise(r => setTimeout(r, 200));

  // 2. Enable debug + 100× speed + free buy + grant resources
  if (!store.getState().debugFreeBuy) store.getState().toggleDebugFreeBuy();
  if (store.getState().speed !== 100) store.getState().debugToggle100x();
  store.getState().debugGrantResources();
  store.getState().debugGrantCurrency();

  // 3. Set preferredGovernment for this run
  const archetype = GOV_TO_ARCHETYPE[govId];
  store.setState({
    autoBuyerSettings: {
      ...store.getState().autoBuyerSettings,
      preferredGovernment: govId,
    },
  });

  // 4. If this is an archetype government, also set the lockedArchetype
  //    (so the archetype's bonuses apply for the run)
  if (archetype) {
    const affinitySystem = AFFINITY_SYSTEMS[archetype]?.[0];
    const affinityTech = AFFINITY_TECHS[archetype]?.[0];
    // We'll set lockedArchetype after the Creature→Tribal transition
    // (same as the archetype playtest)
  }

  const transitionTimes = [];
  let t0 = store.getState().time;
  let lastTransitionTime = t0;

  for (let stageIdx = 0; stageIdx < 6; stageIdx++) {
    const curStageId = STAGE_IDS[stageIdx];
    const evolveReq = STAGE_REQS[stageIdx];

    // Build systems
    const systemsAtStage = getSystemsAtStage(curStageId);
    let totalSys = Object.values(store.getState().ownedSystems).reduce((a,b)=>a+b, 0);
    let attempts = 0;
    while (totalSys < evolveReq.sys && attempts < 100) {
      attempts++;
      for (const sysId of systemsAtStage) {
        if (totalSys >= evolveReq.sys) break;
        const before = totalSys;
        try { store.getState().buySystem(sysId, 1); } catch(e) {}
        totalSys = Object.values(store.getState().ownedSystems).reduce((a,b)=>a+b, 0);
      }
      if (totalSys === Object.values(store.getState().ownedSystems).reduce((a,b)=>a+b, 0)) break;
    }

    // Research techs
    const techsAtStage = getTechsAtStage(curStageId);
    let totalTech = Object.keys(store.getState().technologies).length;
    attempts = 0;
    while (totalTech < evolveReq.tech && attempts < 100) {
      attempts++;
      for (const techId of techsAtStage) {
        if (totalTech >= evolveReq.tech) break;
        const before = totalTech;
        try { store.getState().buyTech(techId); } catch(e) {}
        totalTech = Object.keys(store.getState().technologies).length;
      }
      if (totalTech === Object.keys(store.getState().technologies).length) break;
    }

    // Wait for population (drive tick manually)
    let pop = store.getState().population;
    attempts = 0;
    const maxAttempts = 6000;
    while (pop < evolveReq.pop && attempts < maxAttempts) {
      attempts++;
      try { store.getState().tick(0.1); } catch(e) {}
      await new Promise(r => setTimeout(r, 5));
      pop = store.getState().population;
      if (store.getState().paused) break;
    }

    // Force lockedArchetype at Creature→Tribal (for archetype governments)
    if (stageIdx === 1 && archetype) {
      store.setState({ lockedArchetype: archetype });
    }

    // Evolve
    store.getState().evolveStage();
    await new Promise(r => setTimeout(r, 300));

    const tNow = store.getState().time;
    transitionTimes.push({
      from: curStageId,
      to: STAGE_IDS[stageIdx + 1],
      time: tNow,
      duration: tNow - lastTransitionTime,
    });
    lastTransitionTime = tNow;
    store.getState().debugGrantResources();
  }

  return {
    govId,
    archetype: archetype || "playstyle",
    totalTime: Math.round(lastTransitionTime - t0),
    stageDurations: transitionTimes.map(t => ({
      stage: t.from,
      durationSec: Math.round(t.duration),
    })),
  };
}

async function runGovBatch() {
  const results = [];
  for (const gov of ALL_GOVERNMENTS) {
    try {
      const r = await runGovernmentPlaytest(gov);
      results.push(r);
    } catch (e) {
      results.push({ govId: gov, error: String(e) });
    }
    window.__govProgress = {
      total: ALL_GOVERNMENTS.length,
      completed: results.length,
      current: gov,
    };
  }
  return results;
}

window.__runGovPlaytest = runGovernmentPlaytest;
window.__runGovBatch = runGovBatch;
window.__govProgress = { total: 20, completed: 0, current: null };
window.__govResult = null;
window.__govRunning = false;

window.__startGovBatch = () => {
  window.__govRunning = true;
  window.__govResult = null;
  window.__govProgress = { total: 20, completed: 0, current: 'starting' };
  (async () => {
    try {
      window.__govResult = await runGovBatch();
    } catch (e) {
      window.__govError = String(e);
    }
    window.__govRunning = false;
  })();
  return 'started';
};

"government playtest script loaded";
