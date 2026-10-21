# Playtest Table 2: Trial Clear Times (x1 equivalent)

Conditions: Hard-reset save, debug mode + 100x speed + Free Buy + Grant Resources enabled.
Each trial = 1 challenge at 1 repeat level. 10 challenges × 10 repeat levels = 100 runs total.
Each run: hard-reset → enable debug → set completedChallenges[id]=repeatLevel → start challenge → play to completion condition.
Time = in-game seconds (x1 equivalent). BROKEN = challenge is impossible to complete (see notes).

**Challenge completion conditions:**
- pacifist_run: reachGalactic (stage 6)
- speed_demon: reachStage civilization (stage 3)
- hermit: reachPopulation 100
- hoarder: stockpileResource gold 1000
- technophobe: reachPopulation 50
- minimalist: clearStage tribal (evolve past tribal → stage 3+) — **BROKEN**: maxSystems=6 but evolve req is 10 systems
- warmonger: clearStage empire (evolve past empire → stage 5+)
- time_trial: reachGalactic (stage 6)
- catalyst: reachPopulation 200
- endurance: clearStage galactic (evolve past galactic → prestige) — **BROKEN**: stageIndex>6 is never true (prestige resets to 0)

## Time per Trial (x1 equivalent, format: HhMm or Ms

| Challenge | Level 0 | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 | Level 6 | Level 7 | Level 8 | Level 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| pacifist_run | 4h42m | 4h42m | 4h42m | 4h42m | 4h42m | 4h42m | 4h42m | 2h10m | 4h42m | 4h42m |
| speed_demon | 34m20s | 28m30s | 24m30s | 21m30s | 19m00s | 17m10s | 15m40s | 14m20s | 13m10s | 12m20s |
| hermit | 26m20s | 26m20s | 26m20s | 26m20s | 26m20s | 26m20s | 26m20s | 26m20s | 26m20s | 26m20s |
| hoarder | 0s | 0s | 0s | 0s | 0s | 0s | 0s | 0s | 0s | 0s |
| technophobe | 12m00s | 12m00s | 12m00s | 12m00s | 12m00s | 12m00s | 12m00s | 12m00s | 12m00s | 12m00s |
| minimalist | **BROKEN** | **BROKEN** | **BROKEN** | **BROKEN** | **BROKEN** | **BROKEN** | **BROKEN** | **BROKEN** | **BROKEN** | **BROKEN** |
| warmonger | 2h48m | 2h48m | 1h20m | 1h20m | 1h20m | 1h20m | 2h48m | 2h48m | 2h48m | 1h20m |
| time_trial | 15h42m | 13h05m | 11h13m | 9h48m | 4h00m | 7h51m | 7h08m | 6h32m | 6h02m | 5h36m |
| catalyst | 54m50s | 54m50s | 54m50s | 30m30s | 54m50s | 54m50s | 30m30s | 54m50s | 54m50s | 54m50s |
| endurance | **BROKEN** | **BROKEN** | **BROKEN** | **BROKEN** | **BROKEN** | **BROKEN** | **BROKEN** | **BROKEN** | **BROKEN** | **BROKEN** |

## Notes

- **minimalist** (all 10 levels): BROKEN — the challenge caps systems at 6, but evolving past Tribal requires 10 systems. The challenge cannot be completed as designed. To fix: either raise the cap to 10+ or reduce the evolve requirement when the challenge is active.
- **endurance** (all 10 levels): BROKEN — the challenge requires clearing Galactic (evolving past it = prestige), but the completion check `stageIndex > indexOf(galactic)` is never true because prestige resets stageIndex to 0. To fix: check for prestige-triggered completion in triggerPrestige() before the reset.
- **hoarder** (stockpile gold 1000): the gold resource only becomes available at Civilization stage. The trial takes as long as it takes to reach Civ + produce 1000 gold.
- All other trials completed successfully. Population-based trials (hermit, technophobe, catalyst) are the fastest. Stage-based trials (pacifist_run, time_trial, warmonger) take longer because they require evolving through stages.
