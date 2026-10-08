"use client";

import { useGameStore } from "@/game/state/store";
import {
  MINOR_GODS,
  MINOR_GOD_MAP,
  RELATIONSHIP_NEGOTIATE_GAIN,
  RELATIONSHIP_TRADE_GAIN,
  RELATIONSHIP_ALLIANCE_THRESHOLD,
  RELATIONSHIP_MAX,
  allianceBonus,
  canFormAlliance,
  isDivinityComplete,
} from "@/game/data/divinity_layer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lock, Handshake, CheckCircle2, Sparkles, Radio } from "lucide-react";
import { formatNumber } from "../shared/format";

const PERSONALITY_COLORS: Record<string, string> = {
  warm: "text-amber-300 border-amber-400/40",
  cunning: "text-violet-300 border-violet-400/40",
  mystic: "text-cyan-300 border-cyan-400/40",
  warlike: "text-rose-300 border-rose-400/40",
  patient: "text-emerald-300 border-emerald-400/40",
  chaotic: "text-pink-300 border-pink-400/40",
};

const RESOURCE_ICON: Record<string, string> = {
  divinity: "💎",
  prayer: "🕯️",
  faith: "✨",
};

export function DivinityLayerModal() {
  const show = useGameStore((s) => s.showDivinityLayer);
  const setShow = useGameStore((s) => s.setShowDivinityLayer);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const minorGods = useGameStore((s) => s.minorGods || MINOR_GODS);
  const godRelationships = useGameStore((s) => s.godRelationships || {});
  const alliances = useGameStore((s) => s.alliances || {});
  const divinity = useGameStore((s) => s.divinity || 0);
  const prayer = useGameStore((s) => s.prayer || 0);
  const faith = useGameStore((s) => s.faith || 0);

  const negotiateWithGod = useGameStore((s) => s.negotiateWithGod);
  const tradeWithGod = useGameStore((s) => s.tradeWithGod);
  const formAlliance = useGameStore((s) => s.formAlliance);
  // FEATURE 8 — Amplifiers
  const amplifiers = useGameStore((s) => s.amplifiers || []);
  const placeAmplifier = useGameStore((s) => s.placeAmplifier);
  const removeAmplifier = useGameStore((s) => s.removeAmplifier);

  const isUnlocked = !!unlockedLayers.divinity;
  const bonus = allianceBonus(alliances, minorGods);
  const alliedCount = bonus.allianceCount;

  const getResourceAmount = (res: string): number => {
    if (res === "divinity") return divinity;
    if (res === "prayer") return prayer;
    if (res === "faith") return faith;
    return 0;
  };

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Handshake className="w-5 h-5" />
            Layer 8 — Divinity (Divine Alliance)
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>
              Negotiate with minor gods, trade resources, and form alliances. 2+ alliances unlocks Divine War.
            </span>
            <Badge variant="outline" className="text-amber-300 border-amber-400/40">
              {alliedCount}/{MINOR_GODS.length} alliances
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">The Diplomacy Network is sealed.</p>
            <p className="text-xs mt-1">Reach peak instability ≥ 80 (Layer 7 — Omnipotence) to unlock Divinity.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Diplomacy Network overview */}
            <div className="stat-card">
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1 flex items-center justify-between">
                <span>{alliedCount}/6 alliances · {Object.keys(godRelationships).length} minor gods</span>
                <span className="text-amber-300/80">
                  💎 {formatNumber(divinity, 0)} · 🕯️ {formatNumber(prayer, 0)} · ✨ {formatNumber(faith, 0)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-cyan-300 border-cyan-400/40">+{(bonus.productionMult * 100).toFixed(0)}% prod</Badge>
                <Badge variant="outline" className="text-amber-300 border-amber-400/40">+{(bonus.capMult * 100).toFixed(0)}% cap</Badge>
                <Badge variant="outline" className="text-emerald-300 border-emerald-400/40">+{(bonus.epMult * 100).toFixed(0)}% EP</Badge>
                <Badge variant="outline" className="text-violet-300 border-violet-400/40">+{(bonus.popGrowthMult * 100).toFixed(0)}% pop</Badge>
              </div>
            </div>

            {/* Relationship Web — minor god cards */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1 justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Relationship Web — negotiate, trade, ally
                </span>
                {/* FEATURE 8 — Amplifier summary */}
                <Badge variant="outline" className="text-[0.6rem] text-sky-300 border-sky-400/40">
                  <Radio className="w-2.5 h-2.5 mr-0.5" /> {amplifiers.length}/3 amplifiers
                </Badge>
              </div>
              <div className="text-[0.6rem] text-sky-300/80 mb-2">
                FEATURE 8 — Place Amplifiers (30 Divinity each, max 3) on minor gods to double Negotiate gains with them.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {MINOR_GODS.map((g) => {
                  const relationship = godRelationships[g.id] ?? g.startingRelationship;
                  const allied = !!alliances[g.id];
                  const canAlly = canFormAlliance(godRelationships, alliances, g.id);
                  const haveDemand = getResourceAmount(g.demand.resource);
                  const canTrade = haveDemand >= g.demand.amount;
                  // FEATURE 8 — Amplifier check
                  const hasAmplifier = amplifiers.some((a) => a.godId === g.id);
                  return (
                    <div key={g.id} className={`stat-card p-2 ${allied ? "border-amber-400/60 bg-amber-500/5" : ""} ${hasAmplifier ? "amplifier-pulse ring-1 ring-sky-400/50" : ""}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-2xl shrink-0">{g.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold">{g.name}</span>
                            <Badge variant="outline" className={`text-[0.55rem] ${PERSONALITY_COLORS[g.personality]}`}>
                              {g.personality}
                            </Badge>
                            {allied && (
                              <Badge className="text-[0.55rem] bg-amber-500/20 text-amber-300 border-amber-400/40">
                                <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Allied
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[0.55rem] text-muted-foreground">
                              Power {g.powerLevel}
                            </Badge>
                          </div>
                          <div className="text-[0.6rem] text-muted-foreground italic mt-0.5">{g.title}</div>
                          <div className="text-[0.6rem] text-muted-foreground leading-snug mt-0.5">{g.desc}</div>

                          {/* Relationship meter */}
                          <div className="mt-1.5">
                            <div className="flex items-center justify-between text-[0.55rem] text-muted-foreground mb-0.5">
                              <span>Relationship</span>
                              <span>{relationship}/100 {relationship >= RELATIONSHIP_ALLIANCE_THRESHOLD ? "(ally-ready)" : `(${RELATIONSHIP_ALLIANCE_THRESHOLD - relationship} to ally)`}</span>
                            </div>
                            <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${allied ? "bg-amber-400" : relationship >= RELATIONSHIP_ALLIANCE_THRESHOLD ? "bg-emerald-400" : relationship >= 30 ? "bg-cyan-400/70" : "bg-muted-foreground/50"}`}
                                style={{ width: `${(relationship / RELATIONSHIP_MAX) * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* Trade info */}
                          <div className="text-[0.55rem] text-muted-foreground mt-1.5">
                            Trade: {RESOURCE_ICON[g.demand.resource]} -{g.demand.amount} → {RESOURCE_ICON[g.reward.resource]} +{g.reward.amount}
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-1 mt-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[0.6rem] flex-1"
                              disabled={relationship >= RELATIONSHIP_MAX}
                              onClick={() => negotiateWithGod(g.id)}
                            >
                              Negotiate (+{hasAmplifier ? RELATIONSHIP_NEGOTIATE_GAIN * 2 : RELATIONSHIP_NEGOTIATE_GAIN}{hasAmplifier ? " ×2" : ""})
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[0.6rem] flex-1"
                              disabled={!canTrade}
                              onClick={() => tradeWithGod(g.id)}
                            >
                              Trade (+{RELATIONSHIP_TRADE_GAIN})
                            </Button>
                            <Button
                              size="sm"
                              variant={allied ? "outline" : "default"}
                              className="h-6 text-[0.6rem] flex-1"
                              disabled={allied || !canAlly}
                              onClick={() => formAlliance(g.id)}
                            >
                              {allied ? "Allied" : "Ally"}
                            </Button>
                          </div>
                          {/* FEATURE 8 — Amplifier place/remove button */}
                          <div className="flex gap-1 mt-1">
                            {hasAmplifier ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-5 text-[0.55rem] text-sky-300 border-sky-400/40 w-full"
                                onClick={() => removeAmplifier(g.id)}
                              >
                                <Radio className="w-2.5 h-2.5 mr-0.5" /> Remove Amplifier
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-5 text-[0.55rem] text-sky-300 border-sky-400/40 w-full"
                                disabled={amplifiers.length >= 3 || divinity < 30}
                                onClick={() => placeAmplifier(g.id)}
                              >
                                <Radio className="w-2.5 h-2.5 mr-0.5" /> Place Amplifier (30 Div)
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Form 2+ alliances to unlock Layer 9 (Divine War). Allied gods grant passive bonuses and can be called into battle against the Old Gods.
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShow(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Unused import to satisfy tree-shaking linter when MINOR_GOD_MAP is referenced indirectly.
void MINOR_GOD_MAP;
void isDivinityComplete;
