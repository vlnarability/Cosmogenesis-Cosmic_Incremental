// Playtest automation script for Evolution Idle - v2 (robust).
// Run via: agent-browser eval "$(cat /home/z/my-project/scripts/playtest-archetypes.js)"
// Then: agent-browser eval "(async()=>{window.__playtestResult = await window.__playtestBatch(['humanoid']); return 'started';})()"
// Poll: agent-browser eval "JSON.stringify({running: window.__playtestRunning, result: window.__playtestResult})"

const STAGE_REQS = [
  { name: "Cell",        pop: 8,    sys: 4,  tech: 2 },
  { name: "Creature",    pop: 30,   sys: 8,  tech: 3 },
  { name: "Tribal",      pop: 80,   sys: 10, tech: 4 },
  { name: "Civilization",pop: 200,  sys: 12, tech: 5 },
  { name: "Empire",      pop: 600,  sys: 14, tech: 7 },
  { name: "Solar",       pop: 1000, sys: 12, tech: 8 },
  { name: "Galactic",    pop: 2000, sys: 12, tech: 10 },
];

const AFFINITY_SYSTEMS = {
  humanoid: ["nucleus"],
  mammalian: ["den"],
  arthropoid: ["sawmill"],
  reptilian: ["barracks"],
  necroid: ["temple"],
  plantoid: ["solar_array"],
};
const AFFINITY_TECHS = {
  fungoid: ["enzymatic_pathways"],
  plantoid: ["photosynthesis"],
  molluscoid: ["language"],
  mammalian: ["domestication"],
  reptilian: ["warcraft"],
};

const STAGE_IDS = ["cell","creature","tribal","civilization","empire","solar","galactic"];

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

async function runArchetypePlaytest(archetype) {
  const store = window.__gameStore;
  if (!store) return { archetype, error: "no store" };

  // 1. Hard reset
  store.getState().hardReset();
  await new Promise(r => setTimeout(r, 200));

  // 2. Enable debug + 100× speed + free buy + grant resources
  if (!store.getState().debugFreeBuy) store.getState().toggleDebugFreeBuy();
  if (store.getState().speed !== 100) store.getState().debugToggle100x();
  store.getState().debugGrantResources();
  store.getState().debugGrantCurrency();

  const affinitySystem = AFFINITY_SYSTEMS[archetype]?.[0];
  const affinityTech = AFFINITY_TECHS[archetype]?.[0];

  const transitionTimes = [];
  let t0 = store.getState().time;
  let lastTransitionTime = t0;

  for (let stageIdx = 0; stageIdx < 6; stageIdx++) {
    const curStageId = STAGE_IDS[stageIdx];
    const nextStageId = STAGE_IDS[stageIdx + 1];
    const evolveReq = STAGE_REQS[stageIdx];

    // Build systems: try each system at this stage until we have enough.
    // Skip systems that fail to buy (maxed out or prereq issue).
    const systemsAtStage = getSystemsAtStage(curStageId);

    // Helper: count total systems owned
    const totalSystems = () => Object.values(store.getState().ownedSystems).reduce((a,b)=>a+b, 0);

    // Try affinity system first
    if (affinitySystem && systemsAtStage.includes(affinitySystem)) {
      const before = totalSystems();
      try { store.getState().buySystem(affinitySystem, 1); } catch(e) {}
      // If we can buy it multiple times, do so (up to 5 attempts)
      for (let i = 0; i < 5 && totalSystems() < evolveReq.sys; i++) {
        const before2 = totalSystems();
        try { store.getState().buySystem(affinitySystem, 1); } catch(e) {}
        if (totalSystems() === before2) break; // maxed out, stop
      }
    }

    // Build other systems until we hit evolveReq.sys
    let attempts = 0;
    while (totalSystems() < evolveReq.sys && attempts < 100) {
      attempts++;
      let built = false;
      for (const sysId of systemsAtStage) {
        if (totalSystems() >= evolveReq.sys) break;
        const before = totalSystems();
        try { store.getState().buySystem(sysId, 1); } catch(e) {}
        if (totalSystems() > before) { built = true; }
      }
      if (!built) break; // no system could be bought, stop
    }

    // Research techs: try each tech at this stage
    const techsAtStage = getTechsAtStage(curStageId);
    const totalTechs = () => Object.keys(store.getState().technologies).length;

    // Try affinity tech first
    if (affinityTech && techsAtStage.includes(affinityTech)) {
      try { store.getState().buyTech(affinityTech); } catch(e) {}
    }

    // Research other techs until we hit evolveReq.tech
    attempts = 0;
    while (totalTechs() < evolveReq.tech && attempts < 100) {
      attempts++;
      let researched = false;
      for (const techId of techsAtStage) {
        if (totalTechs() >= evolveReq.tech) break;
        const before = totalTechs();
        try { store.getState().buyTech(techId); } catch(e) {}
        if (totalTechs() > before) { researched = true; }
      }
      if (!researched) break;
    }

    // Wait for population
    // agent-browser uses headless Chrome where requestAnimationFrame
    // doesn't fire reliably. So we manually drive the tick loop here.
    let pop = store.getState().population;
    attempts = 0;
    const maxAttempts = 2400; // 120s real time at 50ms/poll
    while (pop < evolveReq.pop && attempts < maxAttempts) {
      attempts++;
      // Manually call tick with a 0.1s dt — at 100× speed that's 10s of
      // game time per call. Pop grows over time, so this advances the
      // simulation even without rAF running.
      try { store.getState().tick(0.1); } catch(e) {}
      await new Promise(r => setTimeout(r, 5));
      pop = store.getState().population;
      if (store.getState().paused) break;
    }

    // Force lockedArchetype at Creature→Tribal transition
    if (stageIdx === 1) {
      store.setState({ lockedArchetype: archetype });
    }

    // Evolve
    store.getState().evolveStage();
    await new Promise(r => setTimeout(r, 300));

    const tNow = store.getState().time;
    transitionTimes.push({
      from: curStageId,
      to: nextStageId,
      time: tNow,
      duration: tNow - lastTransitionTime,
      popAtTransition: store.getState().population,
      systemsAtTransition: totalSystems(),
      techsAtTransition: totalTechs(),
    });
    lastTransitionTime = tNow;

    // Grant more resources for the next stage
    store.getState().debugGrantResources();
  }

  return {
    archetype,
    totalTime: Math.round(lastTransitionTime - t0),
    stageDurations: transitionTimes.map(t => ({
      stage: t.from,
      durationSec: Math.round(t.duration),
      popAtTransition: t.popAtTransition,
      systemsAtTransition: t.systemsAtTransition,
      techsAtTransition: t.techsAtTransition,
    })),
  };
}

async function runBatch(archetypes) {
  const results = [];
  for (const arch of archetypes) {
    try {
      const result = await runArchetypePlaytest(arch);
      results.push(result);
    } catch (e) {
      results.push({ archetype: arch, error: String(e) });
    }
  }
  return results;
}

window.__playtestArchetypes = runArchetypePlaytest;
window.__playtestBatch = runBatch;
window.__playtestRunning = false;
window.__playtestResult = null;
window.__playtestError = null;

// Helper for background execution
window.__startPlaytestBatch = (archetypes) => {
  window.__playtestRunning = true;
  window.__playtestResult = null;
  window.__playtestError = null;
  window.__playtestProgress = { started: Date.now(), total: archetypes.length, completed: 0, current: archetypes[0] };
  (async () => {
    try {
      const results = [];
      for (const arch of archetypes) {
        window.__playtestProgress.current = arch;
        try {
          const r = await runArchetypePlaytest(arch);
          results.push(r);
        } catch (e) {
          results.push({ archetype: arch, error: String(e) });
        }
        window.__playtestProgress.completed++;
      }
      window.__playtestResult = results;
    } catch (e) {
      window.__playtestError = String(e);
    }
    window.__playtestRunning = false;
  })();
  return 'started';
};

"playtest script v2 loaded";
