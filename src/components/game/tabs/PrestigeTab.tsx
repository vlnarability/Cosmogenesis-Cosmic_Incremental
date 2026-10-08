"use client";

import { useGameStore } from "@/game/state/store";
import { PRESTIGE_LAYERS, isLayerUnlocked, countChallengesCompleted, type PrestigeLayer } from "@/game/data/prestigeLayers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Lock, CheckCircle2, ChevronRight, Eye, Triangle, Egg, Sparkles, Circle, Atom, Church, Infinity as InfinityIcon, Star, Zap } from "lucide-react";
import { CHALLENGES, getMaxRepeats } from "@/game/data/challenges";
import { FORESIGHT_NODES, countForesightNodes, FORESIGHT_NODES_REQUIRED_FOR_LAYER_3 } from "@/game/data/foresight";
import { BLOOD_PACTS } from "@/game/data/transcendence";
import { DIVINE_LAWS } from "@/game/data/apotheosis";
import { CREATURE_BODY_TYPES, LEGION_MAX_CREATURES } from "@/game/data/omnipotence";
import { MINOR_GODS, RELATIONSHIP_ALLIANCE_THRESHOLD } from "@/game/data/divinity_layer";
import { OLD_GODS, ECHO_TYPES, FORK_SCENARIOS, FUTURE_DEBT_TIERS } from "@/game/data/infinity";
import { UNIVERSE_SLOTS, ENDING_CHOICES, TESTAMENT_CLAUSES, CANONIZATIONS, PERMANENCE_WEAVES } from "@/game/data/eternity";
import { ACTIVE_ABILITIES } from "@/game/data/activeAbilities";
import { formatNumber } from "../shared/format";

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
  const equippedRelics = useGameStore((s) => s.equippedRelics || {});
  const activeLogicCores = useGameStore((s) => s.activeLogicCores || {});
  const setShowSingularity = useGameStore((s) => s.setShowSingularity);

  // Layer 7-10 state (new narrative)
  const creatures = useGameStore((s) => s.creatures || []);
  const legions = useGameStore((s) => s.legions || []);
  const instability = useGameStore((s) => s.instability || 0);
  const peakInstability = useGameStore((s) => s.peakInstability || 0);
  const setShowOmnipotence = useGameStore((s) => s.setShowOmnipotence);

  const prayer = useGameStore((s) => s.prayer);
  const godRelationships = useGameStore((s) => s.godRelationships || {});
  const alliances = useGameStore((s) => s.alliances || {});
  const setShowDivinityLayer = useGameStore((s) => s.setShowDivinityLayer);

  const divineFragments = useGameStore((s) => s.divineFragments || 0);
  const oldGodBattles = useGameStore((s) => s.oldGodBattles || {});
  const setShowInfinity = useGameStore((s) => s.setShowInfinity);

  const universeRules = useGameStore((s) => s.universeRules || Array(UNIVERSE_SLOTS.length).fill(null));
  const keptGods = useGameStore((s) => s.keptGods || []);
  const chosenEnding = useGameStore((s) => s.chosenEnding);
  const cosmicBoonStacks = useGameStore((s) => s.cosmicBoonStacks || 0);
  const setShowEternity = useGameStore((s) => s.setShowEternity);

  // Legacy state (kept for migration; unused by new logic)
  const echoes = useGameStore((s) => s.echoes);
  const testamentClauses = useGameStore((s) => s.testamentClauses);

  // QUICK WIN 2 — Active abilities state
  const activeAbilityCooldowns = useGameStore((s) => s.activeAbilityCooldowns || {});
  const triggerActiveAbility = useGameStore((s) => s.useActiveAbility);
  // QUICK WIN 5 — Prestige Points (universal currency)
  const prestigePoints = useGameStore((s) => s.prestigePoints);

  const challengesCompletedCount = countChallengesCompleted(completedChallenges);
  const totalRepeats = Object.values(completedChallenges).reduce((a, b) => a + (b || 0), 0);
  const hasMastery = (upgrades["challenge_mastery"] || 0) > 0;
  const maxRepeats = getMaxRepeats(hasMastery);

  const foresightCount = countForesightNodes(foresightNodes);
  const pactsUsedCount = BLOOD_PACTS.filter((p) => bloodPactsUsed[p.id]).length;
  const lawsEnactedCount = DIVINE_LAWS.filter((l) => enactedDivineLaws[l.id]).length;
  const relicsCount = Object.values(equippedRelics).filter(Boolean).length;
  const coresCount = Object.values(activeLogicCores).filter(Boolean).length;
  // NEW: Layer 7-10 derived counts
  const creaturesCount = creatures.length;
  const legionsCount = legions.length;
  const alliedCount = Object.values(alliances).filter(Boolean).length;
  const godsAtThreshold = MINOR_GODS.filter((g) => (godRelationships[g.id] || 0) >= RELATIONSHIP_ALLIANCE_THRESHOLD).length;
  const oldGodsDefeated = OLD_GODS.filter((g) => oldGodBattles[g.id]?.status === "won").length;
  const universeSlotsFilled = universeRules.filter((r) => r !== null).length;
  const keptGodsCount = keptGods.length;
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
      {/* Auto-running banner (Part 2d) — shown once the player has prestiged at least once */}
      {unlockedChallenges && (
        <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 flex items-start gap-3">
          <div className="text-2xl shrink-0">🌌</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-emerald-300">
              Your civilization runs itself now. Focus on your next trial.
            </div>
            <div className="text-xs text-emerald-200/80 mt-0.5 leading-relaxed">
              The base game (Cell → Galactic) auto-progresses — auto-buyer, auto-researcher, and auto-evolver all run free.
              Prestige speed bonus scales with each run (+50% per run). Direct your attention to the prestige layers below.
            </div>
          </div>
        </div>
      )}

      {/* QUICK WIN 2 — Active Abilities (one per unlocked layer) */}
      {unlockedChallenges && (
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-300" />
              Active Abilities
            </CardTitle>
            <CardDescription>
              Click an ability to trigger its effect. Each ability then enters a cooldown. Earned from each unlocked prestige layer.
              <span className="ml-2 text-amber-300/90 font-medium">Prestige Points: {formatNumber(prestigePoints, 0)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ACTIVE_ABILITIES.map((ab) => {
                // Layer 1 (Evolution) requires unlockedChallenges; others require unlockedLayers
                const isUnlocked = ab.layerId === "evolution"
                  ? !!unlockedChallenges
                  : !!unlockedLayers?.[ab.layerId];
                if (!isUnlocked) return null;
                const cd = activeAbilityCooldowns[ab.id] || 0;
                const onCooldown = cd > 0;
                const pct = onCooldown ? ((ab.cooldownSec - cd) / ab.cooldownSec) * 100 : 100;
                return (
                  <div key={ab.id} className="stat-card p-2.5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg shrink-0">{ab.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{ab.name}</div>
                        <div className="text-[0.6rem] text-muted-foreground truncate">{ab.layerId}</div>
                      </div>
                    </div>
                    <p className="text-[0.65rem] text-muted-foreground leading-snug">{ab.desc}</p>
                    {onCooldown ? (
                      <div>
                        <div className="flex items-center justify-between text-[0.6rem] text-amber-300/80 mb-0.5">
                          <span>Cooldown</span>
                          <span>{Math.ceil(cd)}s / {ab.cooldownSec}s</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                          <div className="h-full bg-amber-400/70 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <Button size="sm" className="h-7 w-full mt-1.5" disabled>
                          Cooldown…
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" className="h-7 w-full mt-auto" onClick={() => triggerActiveAbility(ab.layerId)}>
                        Activate
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            {ACTIVE_ABILITIES.every((ab) => ab.layerId !== "evolution" && !unlockedLayers?.[ab.layerId]) && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Unlock prestige layers to gain active abilities.
              </p>
            )}
          </CardContent>
        </Card>
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
            <ProgressRow label="Foresight nodes" value={foresightCount} max={FORESIGHT_NODES.length} />
            <ProgressRow label="Toward Transcendence" value={foresightCount} max={FORESIGHT_NODES_REQUIRED_FOR_LAYER_3} />
            <div className="text-[0.6rem] text-amber-300/80 mt-1">
              Route: {activeForesightRoute || "none chosen"}
            </div>
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
          </LayerCard>

          {/* Layer 5 — Apotheosis */}
          <LayerCard
            order={5}
            name="Apotheosis"
            tagline="The god of gods"
            icon="👑"
            unlocked={!!unlockedLayers.apotheosis}
            unlockText="Author 1 Genesis world"
            currencyName={`Faith: ${formatNumber(faith, 0)} · Heresy: ${heresy.toFixed(0)}/100`}
            onView={() => setShowApotheosis(true)}
            viewLabel="View Divine"
            viewIcon={<Sparkles className="w-3 h-3 mr-1" />}
          >
            <ProgressRow label="Divine Laws enacted (toward Singularity)" value={lawsEnactedCount} max={DIVINE_LAWS.length} />
            <div className="text-[0.6rem] text-muted-foreground mt-1">
              Watch heresy — at 100 the run ends.
            </div>
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
            <ProgressRow label="Relics equipped" value={relicsCount} max={8} />
            <ProgressRow label="Logic Cores active" value={coresCount} max={6} />
          </LayerCard>

          {/* Layer 7 — Omnipotence (Bio-engineering) */}
          <LayerCard
            order={7}
            name="Omnipotence"
            tagline="Create life; forge legions"
            icon="⚛️"
            unlocked={!!unlockedLayers.omnipotence}
            unlockText="3+ Logic Cores active"
            currencyName={`Instability: ${instability.toFixed(1)}/100 (peak ${peakInstability.toFixed(1)})`}
            onView={() => setShowOmnipotence(true)}
            viewLabel="View Lab"
            viewIcon={<Atom className="w-3 h-3 mr-1" />}
          >
            <ProgressRow label="Creatures designed" value={creaturesCount} max={20} />
            <ProgressRow label="Legions formed" value={legionsCount} max={5} />
            <div className="text-[0.6rem] text-muted-foreground mt-1">
              Design creatures → combine into Legions. At instability 100, they go rogue. Peak ≥ 80 unlocks Divinity.
            </div>
          </LayerCard>

          {/* Layer 8 — Divinity (Divine Alliance) */}
          <LayerCard
            order={8}
            name="Divinity"
            tagline="Alliances with minor gods"
            icon="⛪"
            unlocked={!!unlockedLayers.divinity}
            unlockText="Peak instability ≥ 80"
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
          </LayerCard>

          {/* Layer 10 — Eternity (Ascension) */}
          <LayerCard
            order={10}
            name="Eternity"
            tagline="Create a new universe"
            icon="🌠"
            unlocked={!!unlockedLayers.eternity}
            unlockText="All 3 Old Gods defeated"
            currencyName={`Universe slots: ${universeSlotsFilled}/${UNIVERSE_SLOTS.length} · Boons: ${cosmicBoonStacks}`}
            onView={() => setShowEternity(true)}
            viewLabel="View Ascension"
            viewIcon={<Star className="w-3 h-3 mr-1" />}
          >
            <ProgressRow label="Universe slots filled" value={universeSlotsFilled} max={UNIVERSE_SLOTS.length} />
            <ProgressRow label="Gods kept in pantheon" value={keptGodsCount} max={alliedCount} />
            <div className="text-[0.6rem] text-muted-foreground mt-1">
              {chosenEnding ? `Ending chosen: ${chosenEnding}` : "Fill all 8 slots and choose Preserve or Reset to ascend."}
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
