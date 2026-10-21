// Playtest automation script for 100 trials (10 challenges × 10 repeat levels).
// Run via: cat /home/z/my-project/scripts/playtest-trials.js | agent-browser eval --stdin
// Then: agent-browser eval "window.__startTrialsBatch()"

// Each challenge's completion condition (from src/game/data/challenges.ts):
//   pacifist_run  → reachGalactic (play through all 7 stages)
//   speed_demon   → reachStage civilization (reach stage 4)
//   hermit        → reachPopulation 100
//   hoarder       → stockpileResource gold 1000
//   technophobe   → reachPopulation 50
//   minimalist    → clearStage tribal (evolve past tribal → reach civilization)
//   warmonger     → clearStage empire (evolve past empire → reach solar)
//   time_trial    → reachGalactic
//   catalyst      → reachPopulation 200
//   endurance     → clearStage galactic (evolve past galactic → prestige)

const STAGE_IDS = ["cell","creature","tribal","civilization","empire","solar","galactic"];
const STAGE_REQS = [
  { name: "Cell",        pop: 8,    sys: 4,  tech: 2 },
  { name: "Creature",    pop: 30,   sys: 8,  tech: 3 },
  { name: "Tribal",      pop: 80,   sys: 10, tech: 4 },
  { name: "Civilization",pop: 200,  sys: 12, tech: 5 },
  { name: "Empire",      pop: 600,  sys: 14, tech: 7 },
  { name: "Solar",       pop: 1000, sys: 12, tech: 8 },
  { name: "Galactic",    pop: 2000, sys: 12, tech: 10 },
];

const CHALLENGES = [
  { id: "pacifist_run",  goal: { type: "reachGalactic" },                  stopStage: 6 },
  { id: "speed_demon",   goal: { type: "reachStage", stage: "civilization" }, stopStage: 3 },
  { id: "hermit",        goal: { type: "reachPopulation", value: 100 },    stopPop: 100 },
  { id: "hoarder",       goal: { type: "stockpileResource", resource: "gold", value: 1000 }, stopGold: 1000 },
  { id: "technophobe",   goal: { type: "reachPopulation", value: 50 },     stopPop: 50 },
  { id: "minimalist",    goal: { type: "clearStage", stage: "tribal" },    stopStage: 3 },  // evolve past tribal = reach civilization (stage 3)
  { id: "warmonger",     goal: { type: "clearStage", stage: "empire" },   stopStage: 5 },  // evolve past empire = reach solar (stage 5)
  { id: "time_trial",    goal: { type: "reachGalactic" },                  stopStage: 6 },
  { id: "catalyst",      goal: { type: "reachPopulation", value: 200 },   stopPop: 200 },
  { id: "endurance",     goal: { type: "clearStage", stage: "galactic" }, stopStage: 7 },  // evolve past galactic = prestige
];

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

// Check if the challenge's completion condition is met.
function isChallengeComplete(challenge, state) {
  const g = challenge.goal;
  if (g.type === "reachGalactic") return state.stageIndex >= 6;
  if (g.type === "reachStage") return state.stageIndex >= STAGE_IDS.indexOf(g.stage);
  if (g.type === "reachPopulation") return state.population >= g.value;
  if (g.type === "stockpileResource") return (state.resources[g.resource] || 0) >= g.value;
  if (g.type === "clearStage") {
    // "clearStage X" means evolve PAST X (i.e. reach the stage AFTER X)
    const stageIdx = STAGE_IDS.indexOf(g.stage);
    return state.stageIndex > stageIdx;
  }
  return false;
}

// Run a single trial: challenge + repeatLevel
async function runTrialPlaytest(challengeId, repeatLevel) {
  const store = window.__gameStore;
  if (!store) return { challengeId, repeatLevel, error: "no store" };

  const challenge = CHALLENGES.find(c => c.id === challengeId);
  if (!challenge) return { challengeId, repeatLevel, error: "unknown challenge" };

  // 1. Hard reset
  store.getState().hardReset();
  await new Promise(r => setTimeout(r, 200));

  // 2. Enable debug + 100× speed + free buy + grant resources
  if (!store.getState().debugFreeBuy) store.getState().toggleDebugFreeBuy();
  if (store.getState().speed !== 100) store.getState().debugToggle100x();
  store.getState().debugGrantResources();
  store.getState().debugGrantCurrency();

  // 3. Set up challenge state:
  //    - unlockedChallenges = true (so setActiveChallenge works)
  //    - completedChallenges[challengeId] = repeatLevel (so the next setActiveChallenge starts at this level)
  //    - upgrades.challenge_mastery = 1 (raises max repeats from 5 to 10)
  //    - challengeRepeatCounts = {} (clear any previous)
  store.setState({
    unlockedChallenges: true,
    completedChallenges: { [challengeId]: repeatLevel },
    challengeRepeatCounts: {},
    galacticWins: Math.max(store.getState().galacticWins, 0),
    upgrades: { ...store.getState().upgrades, challenge_mastery: 1 },
  });
  await new Promise(r => setTimeout(r, 100));

  // 4. Start the challenge
  store.getState().setActiveChallenge(challengeId);
  await new Promise(r => setTimeout(r, 200));

  // 5. Record start time
  const t0 = store.getState().time;

  // 6. Play until the completion condition is met
  //    - Build systems + techs to meet stage evolve reqs
  //    - Evolve through stages
  //    - For pop-based challenges, just wait
  //    - For gold-based (hoarder), build gold-producing systems
  //    - For stage-based, evolve through required stages
  let lastTransitionTime = t0;
  const transitionTimes = [];
  let attempts = 0;
  const maxAttempts = 6000; // 30s real time at 5ms/poll

  while (!isChallengeComplete(challenge, store.getState()) && attempts < maxAttempts) {
    attempts++;

    // Drive the tick loop manually (rAF doesn't fire in headless Chrome)
    try { store.getState().tick(0.1); } catch(e) {}

    // Build systems + techs at the current stage if we haven't already
    const stageIdx = store.getState().stageIndex;
    const curStageId = STAGE_IDS[stageIdx];
    const evolveReq = STAGE_REQS[stageIdx];

    // Build systems
    const systemsAtStage = getSystemsAtStage(curStageId);
    let totalSys = Object.values(store.getState().ownedSystems).reduce((a,b)=>a+b, 0);
    if (totalSys < evolveReq.sys) {
      for (const sysId of systemsAtStage) {
        if (totalSys >= evolveReq.sys) break;
        const before = totalSys;
        try { store.getState().buySystem(sysId, 1); } catch(e) {}
        totalSys = Object.values(store.getState().ownedSystems).reduce((a,b)=>a+b, 0);
      }
    }

    // Research techs
    const techsAtStage = getTechsAtStage(curStageId);
    let totalTech = Object.keys(store.getState().technologies).length;
    if (totalTech < evolveReq.tech) {
      for (const techId of techsAtStage) {
        if (totalTech >= evolveReq.tech) break;
        const before = totalTech;
        try { store.getState().buyTech(techId); } catch(e) {}
        totalTech = Object.keys(store.getState().technologies).length;
      }
    }

    // Wait for pop to meet evolve req
    const pop = store.getState().population;
    if (totalSys >= evolveReq.sys && totalTech >= evolveReq.tech && pop >= evolveReq.pop) {
      // Try to evolve
      const beforeStage = store.getState().stageIndex;
      try { store.getState().evolveStage(); } catch(e) {}
      await new Promise(r => setTimeout(r, 200));
      const afterStage = store.getState().stageIndex;
      if (afterStage > beforeStage) {
        // Evolved successfully
        const tNow = store.getState().time;
        transitionTimes.push({
          from: STAGE_IDS[beforeStage],
          to: STAGE_IDS[afterStage],
          time: tNow,
          duration: tNow - lastTransitionTime,
        });
        lastTransitionTime = tNow;
        // Grant more resources for next stage
        store.getState().debugGrantResources();
      }
    }

    await new Promise(r => setTimeout(r, 5));
  }

  const tEnd = store.getState().time;
  const completed = isChallengeComplete(challenge, store.getState());

  return {
    challengeId,
    challengeName: challenge.id,
    repeatLevel,
    completed,
    totalTime: Math.round(tEnd - t0),
    timeAtCompletion: Math.round(tEnd),
    stageDurations: transitionTimes.map(t => ({
      stage: t.from,
      durationSec: Math.round(t.duration),
    })),
    finalStage: store.getState().stageIndex,
    finalPop: store.getState().population,
  };
}

async function runAllTrials() {
  const results = [];
  for (const challenge of CHALLENGES) {
    for (let level = 0; level < 10; level++) {
      try {
        const r = await runTrialPlaytest(challenge.id, level);
        results.push(r);
        // Update progress
        window.__trialsProgress = {
          total: 100,
          completed: results.length,
          current: `${challenge.id} level ${level}`,
        };
      } catch (e) {
        results.push({ challengeId: challenge.id, repeatLevel: level, error: String(e) });
      }
    }
  }
  return results;
}

window.__runTrialPlaytest = runTrialPlaytest;
window.__runAllTrials = runAllTrials;
window.__trialsProgress = { total: 100, completed: 0, current: null };
window.__trialsResult = null;
window.__trialsRunning = false;

window.__startTrialsBatch = () => {
  window.__trialsRunning = true;
  window.__trialsResult = null;
  window.__trialsProgress = { total: 100, completed: 0, current: 'starting' };
  (async () => {
    try {
      const results = await runAllTrials();
      window.__trialsResult = results;
    } catch (e) {
      window.__trialsError = String(e);
    }
    window.__trialsRunning = false;
  })();
  return 'started';
};

"trials playtest script loaded";
