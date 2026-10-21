"use client";

import { useGameStore, TRIAL_REALMS_REQUIRED_FOR_LAYER_2 } from "@/game/state/store";
import { useActiveDimension } from "@/game/state/useDimension";
import { PRESTIGE_LAYERS, isLayerUnlocked, countChallengesCompleted, type PrestigeLayer } from "@/game/data/prestigeLayers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Lock, CheckCircle2, ChevronRight, Eye, Triangle, Egg, Sparkles, Circle, Atom, Church, Infinity as InfinityIcon, Star, ArrowRight, RefreshCw } from "lucide-react";
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
import { OLD_GODS } from "@/game/data/infinity";
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
  const dim = useActiveDimension();
  const galacticWins = useGameStore((s) => s.galacticWins);
  const totalRuns = useGameStore((s) => s.totalRuns);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const completedChallenges = useGameStore((s) => s.completedChallenges || {});
  const unlockedChallenges = useGameStore((s) => s.unlockedChallenges);
  const upgrades = useGameStore((s) => s.upgrades);
  // P6 — Modal Consolidation: replaced per-layer setShow* setters with the
  // single openLayerModal(layerId) action. The LayerModal component reads
  // `activeLayerModal` to decide which layer's content to render.
  const openLayerModal = useGameStore((s) => s.openLayerModal);
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

  const bloodPactsUsed = useGameStore((s) => s.bloodPactsUsed || {});

  const authoredWorlds = useGameStore((s) => s.authoredWorlds || []);

  const faith = useGameStore((s) => s.faith);
  const heresy = useGameStore((s) => s.heresy);
  const enactedDivineLaws = useGameStore((s) => s.enactedDivineLaws || {});

  const singularityCores = useGameStore((s) => s.singularityCores);
  // L6 Universal Map progression — rifts closed + anchors placed (lifetime).
  const riftsClosed = useGameStore((s) => s.riftsClosed || 0);
  const anchorsPlaced = useGameStore((s) => s.anchorsPlaced || 0);

  // Layer 7-10 state (new narrative)
  const creatures = useGameStore((s) => s.creatures || []);
  const legions = useGameStore((s) => s.legions || []);
  const instability = useGameStore((s) => s.instability || 0);
  const raidsRepelled = useGameStore((s) => s.raidsRepelled || 0);

  const godRelationships = useGameStore((s) => s.godRelationships || {});
  const alliances = useGameStore((s) => s.alliances || {});

  const divineFragments = useGameStore((s) => s.divineFragments || 0);
  const oldGodBattles = useGameStore((s) => s.oldGodBattles || {});

  const discoveredArchetypes = useGameStore((s) => s.discoveredArchetypes || {});
  const chosenEnding = useGameStore((s) => s.chosenEnding);
  const cosmicBoonStacks = useGameStore((s) => s.cosmicBoonStacks || 0);

  // QUICK WIN 5 — Prestige Points (universal currency)
  const prestigePoints = useGameStore((s) => s.prestigePoints);

  const challengesCompletedCount = countChallengesCompleted(completedChallenges);
  const totalRepeats = Object.values(completedChallenges).reduce((a, b) => a + (b || 0), 0);
  const hasMastery = (upgrades["challenge_mastery"] || 0) > 0;
  const maxRepeats = getMaxRepeats(hasMastery);

  // ===== FIX-PRESTIGE-DIVINE-CONSTELLATIONS — Layer decluttering =====
  // Determine the player's CURRENT layer (highest unlocked) and PREVIOUS
  // layer (one below the current). The PrestigeTab now shows only those two
  // LayerCards — all other layers are hidden to reduce clutter. The "What
  // Lies Beyond" teaser remains to hint at the next 1-2 locked layers.
  //
  // Layer unlock flags are stored in `unlockedLayers` keyed by layer id:
  //   evolution (L1) — implicit via `unlockedChallenges` after first prestige
  //   enlightenment (L2) → eternity (L10) — `unlockedLayers[id]`
  const LAYER_ORDER: { order: number; key: string | null }[] = [
    { order: 1, key: null },                // evolution — always unlocked in this tab
    { order: 2, key: "enlightenment" },
    { order: 3, key: "transcendence" },
    { order: 4, key: "genesis" },
    { order: 5, key: "apotheosis" },
    { order: 6, key: "singularity" },
    { order: 7, key: "omnipotence" },
    { order: 8, key: "divinity" },
    { order: 9, key: "infinity" },
    { order: 10, key: "eternity" },
  ];
  const isLayerOrderUnlocked = (entry: { key: string | null }): boolean => {
    if (entry.key === null) return !!unlockedChallenges;
    return !!unlockedLayers?.[entry.key];
  };
  const currentLayerOrder = LAYER_ORDER.reduce(
    (max, entry) => (isLayerOrderUnlocked(entry) ? entry.order : max),
    1
  );
  const previousLayerOrder = currentLayerOrder > 1 ? currentLayerOrder - 1 : null;
  // Only render LayerCards for the current + previous layer.
  const isVisibleLayer = (order: number): boolean =>
    order === currentLayerOrder || order === previousLayerOrder;

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

  if (!galacticWins || galacticWins < 1) {
    return (
      <Card className="glass-panel">
        <CardContent className="py-12 text-center">
          <Crown className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Reach the Galactic stage and prestige for the first time to unlock the prestige layer roadmap.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Auto-running banner — shown when the player owns any auto-buyer upgrade */}
      {(upgrades["auto_system_buyer"] || upgrades["auto_tech_buyer"] || upgrades["auto_evolver"]) && (
        <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 flex items-start gap-3 stat-card-accent-emerald">
          <RefreshCw className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0 animate-spin" style={{ animationDuration: "4s" }} aria-hidden />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-emerald-300">
              {galacticWins} {galacticWins === 1 ? "win" : "wins"} · {totalRuns} {totalRuns === 1 ? "run" : "runs"} auto-progressing
            </div>
            <div className="text-xs text-emerald-200/80 mt-0.5 leading-relaxed">
              The base game (Cell → Galactic) auto-runs via your purchased auto-buyer upgrades.
              Each run adds +50% prestige speed bonus. Focus on the prestige layers below.
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
            10 layers. Each unlocks a new prestige currency and a new system. Layer 1 (Evolution) is the base game; later layers unlock as you prove your lineage.
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

      {/* Layer progress cards — decluttered to only show the CURRENT layer
          (the highest unlocked one) and the PREVIOUS layer (the one before).
          The "What Lies Beyond" teaser below hints at the next 1-2 locked
          layers, so the player still gets a sense of progression without
          scrolling through all 10 LayerCards every visit. */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Prestige Layer Progress</CardTitle>
          <CardDescription>
            Showing your current layer (L{currentLayerOrder}) and the one you just finished{previousLayerOrder ? ` (L${previousLayerOrder})` : ""}. Older layers are hidden to reduce clutter.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Layer 1 — Evolution (Challenges) — only shown when it's the current or previous layer */}
          {isVisibleLayer(1) && (
          <LayerCard
            order={1}
            name={dim.layerName("evolution", "Evolution")}
            tagline={dim.layerTagline("evolution", "The first spark learns to climb")}
            icon="🌱"
            unlocked={!!unlockedChallenges}
            unlockText="First Galactic win"
            currencyName="Evolution Points"
            onView={() => openLayerModal("challenges")}
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
          )}

          {/* Layer 2 — Enlightenment (Foresight) — only shown when current/previous */}
          {isVisibleLayer(2) && (
          <LayerCard
            order={2}
            name={dim.layerName("enlightenment", "Enlightenment")}
            tagline="The first truth is remembered"
            icon="👁️"
            unlocked={!!unlockedLayers.enlightenment}
            unlockText="3 trials mastered"
            currencyName={`Divinity: ${formatNumber(divinity, 0)}`}
            onView={() => openLayerModal("enlightenment")}
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
          )}

          {/* Layer 3 — Transcendence — only shown when current/previous */}
          {isVisibleLayer(3) && (
          <LayerCard
            order={3}
            name={dim.layerName("transcendence", "Transcendence")}
            tagline={dim.layerTagline("transcendence", "Form becomes optional")}
            icon="🔺"
            unlocked={!!unlockedLayers.transcendence}
            unlockText="10 Foresight nodes purchased"
            currencyName={`Divinity: ${formatNumber(divinity, 0)}`}
            onView={() => openLayerModal("transcendence")}
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
          )}

          {/* Layer 4 — Genesis — only shown when current/previous */}
          {isVisibleLayer(4) && (
          <LayerCard
            order={4}
            name={dim.layerName("genesis", "Genesis")}
            tagline={dim.layerTagline("genesis", "A new universe, seeded")}
            icon="🥚"
            unlocked={!!unlockedLayers.genesis}
            unlockText="All 4 Blood Pacts performed"
            onView={() => openLayerModal("genesis")}
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
          )}

          {/* Layer 5 — Apotheosis — only shown when current/previous */}
          {isVisibleLayer(5) && (
          <LayerCard
            order={5}
            name={dim.layerName("apotheosis", "Apotheosis")}
            tagline="The god of gods"
            icon="👑"
            unlocked={!!unlockedLayers.apotheosis}
            unlockText="Author 1 Genesis world"
            currencyName={`Faith: ${formatNumber(faith, 0)} · Heresy: ${heresy.toFixed(0)}/75`}
            onView={() => openLayerModal("apotheosis")}
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
          )}

          {/* Layer 6 — Singularity — only shown when current/previous */}
          {isVisibleLayer(6) && (
          <LayerCard
            order={6}
            name={dim.layerName("singularity", "Singularity")}
            tagline={dim.layerTagline("singularity", "All paths converge")}
            icon="🌀"
            unlocked={!!unlockedLayers.singularity}
            unlockText="Enact 3+ Divine Laws"
            currencyName={`Singularity Cores: ${formatNumber(singularityCores, 0)}`}
            onView={() => openLayerModal("singularity")}
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
          )}

          {/* Layer 7 — Omnipotence (Bio-engineering) — only shown when current/previous */}
          {isVisibleLayer(7) && (
          <LayerCard
            order={7}
            name={dim.layerName("omnipotence", "Omnipotence")}
            tagline="Create life; forge legions"
            icon="⚛️"
            unlocked={!!unlockedLayers.omnipotence}
            unlockText={`${RIFTS_REQUIRED_FOR_L7} rifts closed + ${ANCHORS_REQUIRED_FOR_L7} anchors placed`}
            currencyName={`Instability: ${instability.toFixed(1)}/100`}
            onView={() => openLayerModal("omnipotence")}
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
          )}

          {/* Layer 8 — Divinity (Divine Alliance) — only shown when current/previous */}
          {isVisibleLayer(8) && (
          <LayerCard
            order={8}
            name={dim.layerName("divinity", "Divinity")}
            tagline="Alliances with minor gods"
            icon="⛪"
            unlocked={!!unlockedLayers.divinity}
            unlockText={`${OUTPOST_RAID_COUNT_FOR_L8} outpost raids repelled`}
            currencyName={`Alliances: ${alliedCount}/${MINOR_GODS.length}`}
            onView={() => openLayerModal("divinity")}
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
          )}

          {/* Layer 9 — Infinity (Divine War) — only shown when current/previous */}
          {isVisibleLayer(9) && (
          <LayerCard
            order={9}
            name={dim.layerName("infinity", "Infinity")}
            tagline="War against the Old Gods"
            icon="∞"
            unlocked={!!unlockedLayers.infinity}
            unlockText="2+ alliances formed"
            currencyName={`Divine Fragments: ${divineFragments}`}
            onView={() => openLayerModal("infinity")}
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
          )}

          {/* Layer 10 — Eternity (Genesis Engine) — only shown when current/previous */}
          {isVisibleLayer(10) && (
          <LayerCard
            order={10}
            name={dim.layerName("eternity", "Eternity")}
            tagline="Forge universes in the Genesis Engine"
            icon="🌠"
            unlocked={!!unlockedLayers.eternity}
            unlockText="All 3 Old Gods defeated"
            currencyName={`Archetypes: ${archetypesDiscovered}/100 · Boons: ${cosmicBoonStacks}`}
            onView={() => openLayerModal("eternity")}
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
          )}
        </CardContent>
      </Card>

      {/* Locked layers — show as ??? teasers (only next 1-2, not all) */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">What Lies Beyond</CardTitle>
          <CardDescription>
            The next layers await. Unlock conditions hidden until discovered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {PRESTIGE_LAYERS
              .filter((layer) => {
                // Show only the next 1-2 locked layers (not all 10)
                const unlocked = isLayerUnlocked(layer, {
                  galacticWins,
                  totalRuns,
                  unlockedLayers,
                  challengesCompletedCount,
                });
                if (unlocked) return false;
                // Show only layers whose previous layer is unlocked
                const idx = PRESTIGE_LAYERS.findIndex((l) => l.id === layer.id);
                if (idx === 0) return false;
                const prev = PRESTIGE_LAYERS[idx - 1];
                const prevUnlocked = isLayerUnlocked(prev, {
                  galacticWins,
                  totalRuns,
                  unlockedLayers,
                  challengesCompletedCount,
                });
                return prevUnlocked;
              })
              .slice(0, 2) // max 2 teasers
              .map((layer) => (
                <div key={layer.id} className="flex items-center gap-2 p-2 rounded-md border border-border/40 bg-muted/20">
                  <span className="text-lg opacity-30">?</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-muted-foreground">??? — Locked</div>
                    <div className="text-[0.65rem] text-muted-foreground/60">Unlock by progressing through the current layer</div>
                  </div>
                </div>
              ))}
            {PRESTIGE_LAYERS.every((l) => isLayerUnlocked(l, { galacticWins, totalRuns, unlockedLayers, challengesCompletedCount })) && (
              <div className="text-xs text-muted-foreground italic text-center py-2">
                All layers unlocked.
              </div>
            )}
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base shrink-0" aria-hidden>{unlocked ? icon : null}</span>
            <span className="text-sm font-semibold">
              <span className="text-muted-foreground mr-1">#{order}</span>
              {name}
            </span>
            <Badge variant="outline" className="text-[0.6rem]">{currencyName}</Badge>
            {unlocked ? (
              <Badge className="text-[0.6rem] bg-emerald-500/20 text-emerald-300 border-emerald-400/40">Unlocked</Badge>
            ) : (
              <Badge variant="outline" className="text-[0.6rem] text-muted-foreground flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                {unlockText}
              </Badge>
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
  dim,
}: {
  layer: PrestigeLayer;
  unlocked: boolean;
  isLast: boolean;
  dim?: ReturnType<typeof useActiveDimension>;
}) {
  const fallbackDim = useActiveDimension();
  const d = dim || fallbackDim;
  return (
    <div className={`relative flex items-start gap-3 p-3 rounded-lg border ${unlocked ? "border-border bg-muted/20" : "border-border/40 opacity-60"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base shrink-0" aria-hidden>{unlocked ? layer.icon : null}</span>
          <span className="text-sm font-semibold">
            <span className="text-muted-foreground mr-1">#{layer.order}</span>
            {d.layerName(layer.id, layer.name)}
          </span>
          <Badge variant="outline" className="text-[0.6rem]">{layer.currencyName}</Badge>
          {unlocked ? (
            <Badge className="text-[0.6rem] bg-emerald-500/20 text-emerald-300 border-emerald-400/40">Unlocked</Badge>
          ) : (
            <Badge variant="outline" className="text-[0.6rem] text-muted-foreground flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              {formatUnlock(layer)}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground italic mt-0.5">{d.layerTagline(layer.id, layer.tagline)}</p>
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
