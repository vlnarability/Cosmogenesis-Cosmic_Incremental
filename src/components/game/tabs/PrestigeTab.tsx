"use client";

import { useGameStore, TRIAL_REALMS_REQUIRED_FOR_LAYER_2 } from "@/game/state/store";
import { PRESTIGE_LAYERS, isLayerUnlocked, countChallengesCompleted, type PrestigeLayer } from "@/game/data/prestigeLayers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Lock, CheckCircle2, ChevronRight, Eye, Triangle, Egg, Sparkles, Circle, Atom, Church, Infinity as InfinityIcon, Star, ArrowRight } from "lucide-react";
import { CHALLENGES, getMaxRepeats } from "@/game/data/challenges";
import { countForesightNodes } from "@/game/data/foresight";
import {
  CONSTELLATIONS,
  CONSTELLATIONS_REQUIRED_FOR_LAYER_3,
  countCompletedConstellations,
  countLitStars,
  type ConstellationState,
} from "@/game/data/constellations";
import { BLOOD_PACTS } from "@/game/data/transcendence";
import { DIVINE_LAWS } from "@/game/data/apotheosis";
import { CREATURE_BODY_TYPES, LEGION_MAX_CREATURES, OUTPOST_RAID_COUNT_FOR_L8 } from "@/game/data/omnipotence";
import { MINOR_GODS, RELATIONSHIP_ALLIANCE_THRESHOLD } from "@/game/data/divinity_layer";
import { OLD_GODS, ECHO_TYPES, FORK_SCENARIOS, FUTURE_DEBT_TIERS } from "@/game/data/infinity";
import { ENDING_CHOICES, TESTAMENT_CLAUSES, CANONIZATIONS, PERMANENCE_WEAVES } from "@/game/data/eternity";
import { RIFTS_REQUIRED_FOR_L7, ANCHORS_REQUIRED_FOR_L7 } from "@/game/data/universalMap";
import { formatNumber } from "../shared/format";

// ===== Part 6 — Layer-progress helpers =====
// Per-layer (L_n → L_n+1) unlock progress. Returns the current count and the max (target) count.
// nextLayerKey uses the runtime unlockedLayers keys (e.g. "enlightenment" for L2).
interface NextLayerProgressDef {
  currentLayerName: string; // L_n name (the layer the player needs to have unlocked to progress)
  nextLayerName: string;    // L_n+1 name (the layer the progress bar points toward)
  nextLayerKey: string;     // key in unlockedLayers (or "evolution" for L1)
  current: number;
  max: number;
  metricLabel: string;      // description of the metric (e.g. "Trials completed")
}

// ===== Part 6 — Layer-next-progress component =====
// Renders a progress bar showing how close the player is to unlocking the NEXT layer (L_(n+1)).
// - If next layer is already unlocked: "✓ {nextLayerName} Unlocked"
// - If current layer (prereq for next) is NOT unlocked: "Requires {currentLayerName}"
// - Otherwise: progress bar with the layer-unlock metric (e.g. "5/10 Foresight nodes").
function LayerNextProgress({
  progress,
  currentLayerUnlocked,
  nextLayerUnlocked,
}: {
  progress: NextLayerProgressDef;
  currentLayerUnlocked: boolean;
  nextLayerUnlocked: boolean;
}) {
  if (nextLayerUnlocked) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[0.65rem] text-emerald-300">
        <CheckCircle2 className="w-3 h-3" />
        <span className="font-semibold">{progress.nextLayerName} Unlocked</span>
      </div>
    );
  }
  if (!currentLayerUnlocked) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
        <Lock className="w-3 h-3" />
        <span>Requires <span className="font-semibold text-foreground/80">{progress.currentLayerName}</span> to be unlocked first</span>
      </div>
    );
  }
  const pct = progress.max > 0 ? Math.min(100, (progress.current / progress.max) * 100) : 0;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[0.6rem] text-muted-foreground">
        <span className="flex items-center gap-1">
          <ArrowRight className="w-2.5 h-2.5" />
          Toward {progress.nextLayerName}
          <span className="text-muted-foreground/70">· {progress.metricLabel}</span>
        </span>
        <span className="tabular-nums">{progress.current}/{progress.max}</span>
      </div>
      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden mt-0.5">
        <div className="h-full bg-emerald-400/70 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function PrestigeTab() {
  const galacticWins = useGameStore((s) => s.galacticWins);
  const totalRuns = useGameStore((s) => s.totalRuns);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const completedChallenges = useGameStore((s) => s.completedChallenges || {});
  const unlockedChallenges = useGameStore((s) => s.unlockedChallenges);
  const upgrades = useGameStore((s) => s.upgrades);
  const setShowChallenges = useGameStore((s) => s.setShowChallenges);
  const setShowShop = useGameStore((s) => s.setShowShop);

  // Layer 2-6 state
  const divinity = useGameStore((s) => s.divinity);
  const foresightNodes = useGameStore((s) => s.foresightNodes || {});
  // L2 — Constellation Map (new design)
  const constellationStars = useGameStore((s) => s.constellationStars || {});
  const constellationProgress = useGameStore((s) => s.constellationProgress || {});
  const constellationsStarted = useGameStore((s) => s.constellationsStarted || {});
  const constellationsCompleted = useGameStore((s) => s.constellationsCompleted || {});
  const activeForesightRoute = useGameStore((s) => s.activeForesightRoute);
  const setShowEnlightenment = useGameStore((s) => s.setShowEnlightenment);

  const bloodPactsUsed = useGameStore((s) => s.bloodPactsUsed || {});
  const setShowTranscendence = useGameStore((s) => s.setShowTranscendence);

  const genesisSeeds = useGameStore((s) => s.genesisSeeds);
  const authoredWorlds = useGameStore((s) => s.authoredWorlds || []);
  const setShowGenesis = useGameStore((s) => s.setShowGenesis);

  const faith = useGameStore((s) => s.faith);
  const heresy = useGameStore((s) => s.heresy);
  const enactedDivineLaws = useGameStore((s) => s.enactedDivineLaws || {});
  const setShowApotheosis = useGameStore((s) => s.setShowApotheosis);

  const singularityCores = useGameStore((s) => s.singularityCores);
  // L6 Universal Map progression — rifts closed + anchors placed (lifetime).
  const riftsClosed = useGameStore((s) => s.riftsClosed || 0);
  const anchorsPlaced = useGameStore((s) => s.anchorsPlaced || 0);
  const setShowSingularity = useGameStore((s) => s.setShowSingularity);

  // Layer 7-10 state (new narrative)
  const creatures = useGameStore((s) => s.creatures || []);
  const legions = useGameStore((s) => s.legions || []);
  const instability = useGameStore((s) => s.instability || 0);
  const peakInstability = useGameStore((s) => s.peakInstability || 0);
  const raidsRepelled = useGameStore((s) => s.raidsRepelled || 0);
  const setShowOmnipotence = useGameStore((s) => s.setShowOmnipotence);

  const prayer = useGameStore((s) => s.prayer);
  const godRelationships = useGameStore((s) => s.godRelationships || {});
  const alliances = useGameStore((s) => s.alliances || {});
  const setShowDivinityLayer = useGameStore((s) => s.setShowDivinityLayer);

  const divineFragments = useGameStore((s) => s.divineFragments || 0);
  const oldGodBattles = useGameStore((s) => s.oldGodBattles || {});
  const setShowInfinity = useGameStore((s) => s.setShowInfinity);

  const discoveredArchetypes = useGameStore((s) => s.discoveredArchetypes || {});
  const chosenEnding = useGameStore((s) => s.chosenEnding);
  const cosmicBoonStacks = useGameStore((s) => s.cosmicBoonStacks || 0);
  const setShowEternity = useGameStore((s) => s.setShowEternity);

  // Legacy state (kept for migration; unused by new logic)
  const echoes = useGameStore((s) => s.echoes);
  const testamentClauses = useGameStore((s) => s.testamentClauses);

  // QUICK WIN 5 — Prestige Points (universal currency)
  const prestigePoints = useGameStore((s) => s.prestigePoints);

  const challengesCompletedCount = countChallengesCompleted(completedChallenges);
  const totalRepeats = Object.values(completedChallenges).reduce((a, b) => a + (b || 0), 0);
  const hasMastery = (upgrades["challenge_mastery"] || 0) > 0;
  const maxRepeats = getMaxRepeats(hasMastery);

  // Part 6 — L1→L2 progress: 3+ distinct challenges OR 5+ total challenge
  // repeats. (Legacy trialRealm mini-games removed in CLEANUP-LEGACY.)
  const l1ProgressCurrent = Math.max(
    Math.min(3, challengesCompletedCount),
    totalRepeats >= TRIAL_REALMS_REQUIRED_FOR_LAYER_2
      ? TRIAL_REALMS_REQUIRED_FOR_LAYER_2
      : Math.ceil(challengesCompletedCount * TRIAL_REALMS_REQUIRED_FOR_LAYER_2 / 3),
  );

  const foresightCount = countForesightNodes(foresightNodes);
  // L2 — Constellation Map counts
  const constellationState: ConstellationState = {
    constellationStars,
    constellationProgress,
    constellationsStarted,
    constellationsCompleted,
  };
  const constellationsCompletedCount = countCompletedConstellations(constellationState);
  const litStarsCount = countLitStars(constellationState);
  const constellationsStartedCount = Object.values(constellationsStarted).filter(Boolean).length;
  const pactsUsedCount = BLOOD_PACTS.filter((p) => bloodPactsUsed[p.id]).length;
  const lawsEnactedCount = DIVINE_LAWS.filter((l) => enactedDivineLaws[l.id]).length;
  // L6 Universal Map progress counts (rifts closed + anchors placed — both
  // lifetime counters that persist across prestiges). Used by the L6→L7
  // progress metric in the Singularity card.
  const l6RiftsClosedCount = riftsClosed;
  const l6AnchorsPlacedCount = anchorsPlaced;
  // NEW: Layer 7-10 derived counts
  const creaturesCount = creatures.length;
  const legionsCount = legions.length;
  const alliedCount = Object.values(alliances).filter(Boolean).length;
  const godsAtThreshold = MINOR_GODS.filter((g) => (godRelationships[g.id] || 0) >= RELATIONSHIP_ALLIANCE_THRESHOLD).length;
  const oldGodsDefeated = OLD_GODS.filter((g) => oldGodBattles[g.id]?.status === "won").length;
  const archetypesDiscovered = Object.values(discoveredArchetypes).filter(Boolean).length;
  // Legacy counts (kept for backwards compat — all 0 in new logic)
  const hybridsCount = 0;
  const channelsLeveled = 0;
  const totalChannelLevels = 0;
  const purchasedEchoCount = 0;
  const resolvedForkCount = 0;
  const debtTakenCount = 0;
  const debtRepaidCount = 0;
  const purchasedClauseCount = 0;
  const canonCount = 0;
  const weaveCount = 0;

  return (
    <div className="space-y-4">
      {/* Auto-running banner — shown when the player owns any auto-buyer upgrade */}
      {(upgrades["auto_system_buyer"] || upgrades["auto_tech_buyer"] || upgrades["auto_evolver"]) && (
        <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 flex items-start gap-3">
          <div className="text-2xl shrink-0">🌌</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-emerald-300">
              Your civilization runs itself now. Focus on your next trial.
            </div>
            <div className="text-xs text-emerald-200/80 mt-0.5 leading-relaxed">
              The base game (Cell → Galactic) auto-progresses via your purchased auto-buyer upgrades.
              Prestige speed bonus scales with each run (+50% per run). Direct your attention to the prestige layers below.
            </div>
          </div>
        </div>
      )}

      {/* Header card */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-300" />
            The Ten Ages of Becoming
          </CardTitle>
          <CardDescription>
            Each layer is a long saga of cosmic ascent. Layer 1 (Evolution) is the base game; later layers unlock as you prove your lineage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-violet-300 border-violet-400/40">
              {galacticWins} Galactic wins
            </Badge>
            <Badge variant="outline" className="text-cyan-300 border-cyan-400/40">
              {totalRuns} total runs
            </Badge>
            <Badge variant="outline" className="text-amber-300 border-amber-400/40">
              {challengesCompletedCount}/{CHALLENGES.length} trials mastered
            </Badge>
            <Badge variant="outline" className="text-emerald-300 border-emerald-400/40">
              {totalRepeats} total repeats
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Layer progress cards (1 per layer) */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Prestige Layer Progress</CardTitle>
          <CardDescription>
            Each layer has its own unlock condition, currency, and bonuses. View a layer to interact with its systems.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Layer 1 — Evolution (Challenges) */}
          <LayerCard
            order={1}
            name="Evolution"
            tagline="The first spark learns to climb"
            icon="🌱"
            unlocked={!!unlockedChallenges}
            unlockText="First Galactic win"
            currencyName="Evolution Points"
            onView={() => setShowChallenges(true)}
            viewLabel="View Trials"
          >
            <ProgressRow label="Trials mastered" value={challengesCompletedCount} max={CHALLENGES.length} />
            <ProgressRow label="Total repeats" value={totalRepeats} max={maxRepeats * CHALLENGES.length} />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 mt-1">
              {CHALLENGES.map((ch) => {
                const done = (completedChallenges[ch.id] || 0) > 0;
                const count = completedChallenges[ch.id] || 0;
                return (
                  <div key={ch.id} className={`stat-card py-1 px-1.5 ${done ? "border-emerald-400/40" : ""}`}>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{ch.icon}</span>
                      {done ? (
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      ) : (
                        <Lock className="w-2.5 h-2.5 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="text-[0.55rem] text-muted-foreground mt-0.5">{count}/{maxRepeats}</div>
                  </div>
                );
              })}
            </div>
            <LayerNextProgress
              progress={{
                currentLayerName: "Evolution",
                nextLayerName: "Enlightenment",
                nextLayerKey: "enlightenment",
                current: l1ProgressCurrent,
                max: TRIAL_REALMS_REQUIRED_FOR_LAYER_2,
                metricLabel: `${challengesCompletedCount}/3 distinct trials · or ${totalRepeats}/${TRIAL_REALMS_REQUIRED_FOR_LAYER_2} total repeats`,
              }}
              currentLayerUnlocked={!!unlockedChallenges}
              nextLayerUnlocked={!!unlockedLayers?.enlightenment}
            />
          </LayerCard>

          {/* Layer 2 — Enlightenment (Foresight) */}
          <LayerCard
            order={2}
            name="Enlightenment"
            tagline="The first truth is remembered"
            icon="👁️"
            unlocked={!!unlockedLayers.enlightenment}
            unlockText="3 trials mastered"
            currencyName={`Divinity: ${formatNumber(divinity, 0)}`}
            onView={() => setShowEnlightenment(true)}
            viewLabel="View Foresight"
            viewIcon={<Eye className="w-3 h-3 mr-1" />}
          >
            <ProgressRow label="Constellations completed" value={constellationsCompletedCount} max={CONSTELLATIONS_REQUIRED_FOR_LAYER_3} />
            <ProgressRow label="Stars illuminated" value={litStarsCount} max={CONSTELLATIONS.reduce((a, c) => a + c.stars.length, 0)} />
            <ProgressRow label="Constellations started" value={constellationsStartedCount} max={CONSTELLATIONS.length} />
            <div className="text-[0.6rem] text-amber-300/80 mt-1">
              Route: {activeForesightRoute || "none chosen"}
            </div>
            <LayerNextProgress
              progress={{
                currentLayerName: "Enlightenment",
                nextLayerName: "Transcendence",
                nextLayerKey: "transcendence",
                current: constellationsCompletedCount,
                max: CONSTELLATIONS_REQUIRED_FOR_LAYER_3,
                metricLabel: "constellations completed",
              }}
              currentLayerUnlocked={!!unlockedLayers?.enlightenment}
              nextLayerUnlocked={!!unlockedLayers?.transcendence}
            />
          </LayerCard>

          {/* Layer 3 — Transcendence */}
          <LayerCard
            order={3}
            name="Transcendence"
            tagline="Form becomes optional"
            icon="🔺"
            unlocked={!!unlockedLayers.transcendence}
            unlockText="10 Foresight nodes purchased"
            currencyName={`Divinity: ${formatNumber(divinity, 0)}`}
            onView={() => setShowTranscendence(true)}
            viewLabel="View Sacrifice"
            viewIcon={<Triangle className="w-3 h-3 mr-1" />}
          >
            <ProgressRow label="Blood Pacts used (toward Genesis)" value={pactsUsedCount} max={BLOOD_PACTS.length} />
            <div className="text-[0.6rem] text-muted-foreground mt-1">
              Offerings + rituals + scripts + blood pacts available.
            </div>
            <LayerNextProgress
              progress={{
                currentLayerName: "Transcendence",
                nextLayerName: "Genesis",
                nextLayerKey: "genesis",
                current: pactsUsedCount,
                max: BLOOD_PACTS.length,
                metricLabel: "Blood pacts performed",
              }}
              currentLayerUnlocked={!!unlockedLayers?.transcendence}
              nextLayerUnlocked={!!unlockedLayers?.genesis}
            />
          </LayerCard>

          {/* Layer 4 — Genesis */}
          <LayerCard
            order={4}
            name="Genesis"
            tagline="A new universe, seeded"
            icon="🥚"
            unlocked={!!unlockedLayers.genesis}
            unlockText="All 4 Blood Pacts performed"
            currencyName={`Genesis Seeds: ${formatNumber(genesisSeeds, 0)}`}
            onView={() => setShowGenesis(true)}
            viewLabel="View Genesis"
            viewIcon={<Egg className="w-3 h-3 mr-1" />}
          >
            <ProgressRow label="Authored worlds" value={authoredWorlds.length} max={99} />
            <div className="text-[0.6rem] text-muted-foreground mt-1">
              Each authored world grants permanent production / capacity / EP / pop bonuses.
            </div>
            <LayerNextProgress
              progress={{
                currentLayerName: "Genesis",
                nextLayerName: "Apotheosis",
                nextLayerKey: "apotheosis",
                current: authoredWorlds.length,
                max: 1,
                metricLabel: "Worlds authored (1 needed)",
              }}
              currentLayerUnlocked={!!unlockedLayers?.genesis}
              nextLayerUnlocked={!!unlockedLayers?.apotheosis}
            />
          </LayerCard>

          {/* Layer 5 — Apotheosis */}
          <LayerCard
            order={5}
            name="Apotheosis"
            tagline="The god of gods"
            icon="👑"
            unlocked={!!unlockedLayers.apotheosis}
            unlockText="Author 1 Genesis world"
            currencyName={`Faith: ${formatNumber(faith, 0)} · Heresy: ${heresy.toFixed(0)}/75`}
            onView={() => setShowApotheosis(true)}
            viewLabel="View Divine"
            viewIcon={<Sparkles className="w-3 h-3 mr-1" />}
          >
            <ProgressRow label="Divine Laws enacted (toward Singularity)" value={lawsEnactedCount} max={DIVINE_LAWS.length} />
            <div className="text-[0.6rem] text-muted-foreground mt-1">
              Watch heresy — at average 75 across owned galaxies, the run ends.
            </div>
            <LayerNextProgress
              progress={{
                currentLayerName: "Apotheosis",
                nextLayerName: "Singularity",
                nextLayerKey: "singularity",
                current: lawsEnactedCount,
                max: 3,
                metricLabel: "Divine laws enacted (3 needed)",
              }}
              currentLayerUnlocked={!!unlockedLayers?.apotheosis}
              nextLayerUnlocked={!!unlockedLayers?.singularity}
            />
          </LayerCard>

          {/* Layer 6 — Singularity */}
          <LayerCard
            order={6}
            name="Singularity"
            tagline="All paths converge"
            icon="🌀"
            unlocked={!!unlockedLayers.singularity}
            unlockText="Enact 3+ Divine Laws"
            currencyName={`Singularity Cores: ${formatNumber(singularityCores, 0)}`}
            onView={() => setShowSingularity(true)}
            viewLabel="View System"
            viewIcon={<Circle className="w-3 h-3 mr-1" />}
          >
            <ProgressRow label="Rifts closed (lifetime)" value={l6RiftsClosedCount} max={RIFTS_REQUIRED_FOR_L7} />
            <ProgressRow label="Reality Anchors placed (lifetime)" value={l6AnchorsPlacedCount} max={ANCHORS_REQUIRED_FOR_L7} />
            <LayerNextProgress
              progress={{
                currentLayerName: "Singularity",
                nextLayerName: "Omnipotence",
                nextLayerKey: "omnipotence",
                current: Math.min(l6RiftsClosedCount, RIFTS_REQUIRED_FOR_L7) + Math.min(l6AnchorsPlacedCount, ANCHORS_REQUIRED_FOR_L7),
                max: RIFTS_REQUIRED_FOR_L7 + ANCHORS_REQUIRED_FOR_L7,
                metricLabel: `${l6RiftsClosedCount}/${RIFTS_REQUIRED_FOR_L7} rifts closed + ${l6AnchorsPlacedCount}/${ANCHORS_REQUIRED_FOR_L7} anchors placed`,
              }}
              currentLayerUnlocked={!!unlockedLayers?.singularity}
              nextLayerUnlocked={!!unlockedLayers?.omnipotence}
            />
          </LayerCard>

          {/* Layer 7 — Omnipotence (Bio-engineering) */}
          <LayerCard
            order={7}
            name="Omnipotence"
            tagline="Create life; forge legions"
            icon="⚛️"
            unlocked={!!unlockedLayers.omnipotence}
            unlockText={`${RIFTS_REQUIRED_FOR_L7} rifts closed + ${ANCHORS_REQUIRED_FOR_L7} anchors placed`}
            currencyName={`Instability: ${instability.toFixed(1)}/100 (peak ${peakInstability.toFixed(1)})`}
            onView={() => setShowOmnipotence(true)}
            viewLabel="View Lab"
            viewIcon={<Atom className="w-3 h-3 mr-1" />}
          >
            <ProgressRow label="Creatures designed" value={creaturesCount} max={20} />
            <ProgressRow label="Legions formed" value={legionsCount} max={5} />
            <ProgressRow label="Outpost raids repelled" value={raidsRepelled} max={OUTPOST_RAID_COUNT_FOR_L8} />
            <div className="text-[0.6rem] text-muted-foreground mt-1">
              Design creatures → combine into Legions → repel outpost raids. At instability 100, legions go rogue. Repel {OUTPOST_RAID_COUNT_FOR_L8} raids to unlock Divinity.
            </div>
            <LayerNextProgress
              progress={{
                currentLayerName: "Omnipotence",
                nextLayerName: "Divinity",
                nextLayerKey: "divinity",
                current: Math.min(OUTPOST_RAID_COUNT_FOR_L8, raidsRepelled),
                max: OUTPOST_RAID_COUNT_FOR_L8,
                metricLabel: `Outpost raids repelled (${OUTPOST_RAID_COUNT_FOR_L8} needed)`,
              }}
              currentLayerUnlocked={!!unlockedLayers?.omnipotence}
              nextLayerUnlocked={!!unlockedLayers?.divinity}
            />
          </LayerCard>

          {/* Layer 8 — Divinity (Divine Alliance) */}
          <LayerCard
            order={8}
            name="Divinity"
            tagline="Alliances with minor gods"
            icon="⛪"
            unlocked={!!unlockedLayers.divinity}
            unlockText={`${OUTPOST_RAID_COUNT_FOR_L8} outpost raids repelled`}
            currencyName={`Alliances: ${alliedCount}/${MINOR_GODS.length}`}
            onView={() => setShowDivinityLayer(true)}
            viewLabel="View Diplomacy"
            viewIcon={<Church className="w-3 h-3 mr-1" />}
          >
            <ProgressRow label="Alliances formed (toward Infinity)" value={alliedCount} max={2} />
            <ProgressRow label="Gods at alliance threshold" value={godsAtThreshold} max={MINOR_GODS.length} />
            <div className="text-[0.6rem] text-muted-foreground mt-1">
              Negotiate, trade, and form alliances. 2+ alliances unlocks Divine War.
            </div>
            <LayerNextProgress
              progress={{
                currentLayerName: "Divinity",
                nextLayerName: "Infinity",
                nextLayerKey: "infinity",
                current: alliedCount,
                max: 2,
                metricLabel: `Alliances formed (2 of ${MINOR_GODS.length} possible)`,
              }}
              currentLayerUnlocked={!!unlockedLayers?.divinity}
              nextLayerUnlocked={!!unlockedLayers?.infinity}
            />
          </LayerCard>

          {/* Layer 9 — Infinity (Divine War) */}
          <LayerCard
            order={9}
            name="Infinity"
            tagline="War against the Old Gods"
            icon="∞"
            unlocked={!!unlockedLayers.infinity}
            unlockText="2+ alliances formed"
            currencyName={`Divine Fragments: ${divineFragments}`}
            onView={() => setShowInfinity(true)}
            viewLabel="View Battles"
            viewIcon={<InfinityIcon className="w-3 h-3 mr-1" />}
          >
            <ProgressRow label="Old Gods defeated (toward Eternity)" value={oldGodsDefeated} max={OLD_GODS.length} />
            <div className="text-[0.6rem] text-muted-foreground mt-1">
              Deploy Legions, call Allies, defeat all 3 Old Gods to ascend.
            </div>
            <LayerNextProgress
              progress={{
                currentLayerName: "Infinity",
                nextLayerName: "Eternity",
                nextLayerKey: "eternity",
                current: oldGodsDefeated,
                max: OLD_GODS.length,
                metricLabel: "Old Gods defeated (all 3 needed)",
              }}
              currentLayerUnlocked={!!unlockedLayers?.infinity}
              nextLayerUnlocked={!!unlockedLayers?.eternity}
            />
          </LayerCard>

          {/* Layer 10 — Eternity (Genesis Engine) */}
          <LayerCard
            order={10}
            name="Eternity"
            tagline="Forge universes in the Genesis Engine"
            icon="🌠"
            unlocked={!!unlockedLayers.eternity}
            unlockText="All 3 Old Gods defeated"
            currencyName={`Archetypes: ${archetypesDiscovered}/100 · Boons: ${cosmicBoonStacks}`}
            onView={() => setShowEternity(true)}
            viewLabel="View Genesis Engine"
            viewIcon={<Star className="w-3 h-3 mr-1" />}
          >
            <ProgressRow label="Archetypes discovered" value={archetypesDiscovered} max={100} />
            <ProgressRow label="Cosmic Boon stacks" value={cosmicBoonStacks} max={Math.max(10, cosmicBoonStacks)} />
            <div className="text-[0.6rem] text-muted-foreground mt-1">
              {chosenEnding ? `Ending chosen: ${chosenEnding}` : "Discover all 100 archetypes to unlock the ending screen."}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[0.65rem] text-amber-300">
              <Star className="w-3 h-3" />
              <span className="font-semibold">Max layer reached — end-game ascension content.</span>
            </div>
          </LayerCard>
        </CardContent>
      </Card>

      {/* Layer roadmap (full 10-layer overview) */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Prestige Roadmap (Long-term)</CardTitle>
          <CardDescription>
            Ten ages, from the first spark to Eternity. Each layer unlocks a new prestige currency and a new saga.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {PRESTIGE_LAYERS.map((layer, idx) => {
              const unlocked = isLayerUnlocked(layer, {
                galacticWins,
                totalRuns,
                unlockedLayers,
                challengesCompletedCount,
              });
              return (
                <LayerRow
                  key={layer.id}
                  layer={layer}
                  unlocked={unlocked}
                  isLast={idx === PRESTIGE_LAYERS.length - 1}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setShowShop(true)}>
          Open Evolution Shop
        </Button>
      </div>
    </div>
  );
}

function LayerCard({
  order,
  name,
  tagline,
  icon,
  unlocked,
  unlockText,
  currencyName,
  onView,
  viewLabel,
  viewIcon,
  children,
}: {
  order: number;
  name: string;
  tagline: string;
  icon: string;
  unlocked: boolean;
  unlockText: string;
  currencyName: string;
  onView: () => void;
  viewLabel: string;
  viewIcon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className={`stat-card p-3 ${unlocked ? "" : "opacity-70"}`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${unlocked ? "" : "grayscale"}`}
          style={{ background: unlocked ? "rgba(252, 211, 77, 0.1)" : "rgba(115, 115, 115, 0.05)" }}
        >
          {unlocked ? icon : <Lock className="w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">
              <span className="text-muted-foreground mr-1">#{order}</span>
              {name}
            </span>
            <Badge variant="outline" className="text-[0.6rem]">{currencyName}</Badge>
            {unlocked ? (
              <Badge className="text-[0.6rem] bg-emerald-500/20 text-emerald-300 border-emerald-400/40">Unlocked</Badge>
            ) : (
              <Badge variant="outline" className="text-[0.6rem] text-muted-foreground">{unlockText}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground italic mt-0.5">{tagline}</p>
          {children}
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" disabled={!unlocked} onClick={onView}>
          {viewIcon}
          {viewLabel}
        </Button>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="mt-1">
      <div className="flex items-center justify-between text-[0.6rem] text-muted-foreground">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-1 bg-muted/40 rounded-full overflow-hidden mt-0.5">
        <div className="h-full bg-amber-400/70 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LayerRow({
  layer,
  unlocked,
  isLast,
}: {
  layer: PrestigeLayer;
  unlocked: boolean;
  isLast: boolean;
}) {
  return (
    <div className={`relative flex items-start gap-3 p-3 rounded-lg border ${unlocked ? "border-border bg-muted/20" : "border-border/40 opacity-60"}`}>
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${unlocked ? "" : "grayscale"}`}
        style={{ background: unlocked ? "rgba(252, 211, 77, 0.1)" : "rgba(115, 115, 115, 0.05)" }}
      >
        {unlocked ? layer.icon : <Lock className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold">
            <span className="text-muted-foreground mr-1">#{layer.order}</span>
            {layer.name}
          </span>
          <Badge variant="outline" className="text-[0.6rem]">{layer.currencyName}</Badge>
          {unlocked ? (
            <Badge className="text-[0.6rem] bg-emerald-500/20 text-emerald-300 border-emerald-400/40">Unlocked</Badge>
          ) : (
            <Badge variant="outline" className="text-[0.6rem] text-muted-foreground">{formatUnlock(layer)}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground italic mt-0.5">{layer.tagline}</p>
        <p className="text-xs text-foreground/80 leading-snug mt-1">{layer.story}</p>
      </div>
      {!isLast && (
        <ChevronRight className="w-3 h-3 text-muted-foreground/40 absolute -bottom-2 left-7 rotate-90" />
      )}
    </div>
  );
}

function formatUnlock(layer: PrestigeLayer): string {
  switch (layer.unlockCondition.type) {
    case "default":
      return "Default";
    case "galacticWins":
      return `${layer.unlockCondition.value} wins`;
    case "challengesCompleted":
      return `${layer.unlockCondition.value} trials`;
    case "totalRuns":
      return `${layer.unlockCondition.value} runs`;
    default:
      return "Locked";
  }
}
