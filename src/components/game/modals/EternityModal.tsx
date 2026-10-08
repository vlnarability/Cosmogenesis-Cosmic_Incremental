"use client";

import { useGameStore } from "@/game/state/store";
import {
  UNIVERSE_SLOTS,
  ENDING_CHOICES,
  universeSlotBonus,
  keptGodsBonus,
  cosmicBoonBonus,
  isEternityComplete,
} from "@/game/data/eternity";
import { MINOR_GODS, MINOR_GOD_MAP } from "@/game/data/divinity_layer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lock, Sparkles, CheckCircle2, Star, RefreshCw, AlertTriangle } from "lucide-react";

export function EternityModal() {
  const show = useGameStore((s) => s.showEternity);
  const setShow = useGameStore((s) => s.setShowEternity);
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const universeRules = useGameStore((s) => s.universeRules || Array(UNIVERSE_SLOTS.length).fill(null));
  const keptGods = useGameStore((s) => s.keptGods || []);
  const alliances = useGameStore((s) => s.alliances || {});
  const chosenEnding = useGameStore((s) => s.chosenEnding);
  const cosmicBoonStacks = useGameStore((s) => s.cosmicBoonStacks || 0);

  const setUniverseRule = useGameStore((s) => s.setUniverseRule);
  const toggleKeptGod = useGameStore((s) => s.toggleKeptGod);
  const chooseEnding = useGameStore((s) => s.chooseEnding);
  // FEATURE 10 — Forbidden Words (paradox tracking + resolve action)
  const universeParadox = useGameStore((s) => s.universeParadox || 0);
  const divinity = useGameStore((s) => s.divinity || 0);
  const resolveParadox = useGameStore((s) => s.resolveParadox);

  const isUnlocked = !!unlockedLayers.eternity;
  const universeB = universeSlotBonus(universeRules);
  const keptB = keptGodsBonus(keptGods);
  const boon = cosmicBoonBonus(cosmicBoonStacks);
  const alliedGods = MINOR_GODS.filter((g) => alliances[g.id]);
  const canReset = universeB.filledCount >= UNIVERSE_SLOTS.length;

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Star className="w-5 h-5" />
            Layer 10 — Eternity (Ascension)
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>
              Define the rules of your new universe. Choose your pantheon. Pick an ending to ascend.
            </span>
            <Badge variant="outline" className="text-amber-300 border-amber-400/40">
              {universeB.filledCount}/{UNIVERSE_SLOTS.length} slots filled
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          <div className="text-center text-muted-foreground py-10">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Universe Creation is sealed.</p>
            <p className="text-xs mt-1">Defeat all 3 Old Gods (Layer 9 — Divine War) to unlock Ascension.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bonuses */}
            <div className="stat-card">
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1">
                {universeB.filledCount}/8 slots filled · {keptGods.length} gods kept · {cosmicBoonStacks} Cosmic Boon stack(s)
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-cyan-300 border-cyan-400/40">+{((universeB.productionMult + keptB.productionMult + boon) * 100).toFixed(0)}% prod</Badge>
                <Badge variant="outline" className="text-amber-300 border-amber-400/40">+{((universeB.capMult + keptB.capMult) * 100).toFixed(0)}% cap</Badge>
                <Badge variant="outline" className="text-emerald-300 border-emerald-400/40">+{((universeB.epMult + keptB.epMult) * 100).toFixed(0)}% EP</Badge>
                <Badge variant="outline" className="text-violet-300 border-violet-400/40">+{((universeB.popGrowthMult + keptB.popGrowthMult) * 100).toFixed(0)}% pop</Badge>
              </div>
            </div>

            {/* Universe Creation Slots */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1 justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Universe Creation — define the rules of your new cosmos
                </span>
                {/* FEATURE 10 — Paradox counter + Resolve button */}
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className={`text-[0.6rem] ${universeParadox >= 2 ? "text-rose-400 border-rose-400/60 animate-pulse" : universeParadox > 0 ? "text-rose-300 border-rose-400/40" : "text-muted-foreground"}`}>
                    <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Paradox: {universeParadox}/3
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-5 text-[0.55rem] text-amber-300 border-amber-400/40"
                    disabled={universeParadox <= 0 || divinity < 100}
                    onClick={() => resolveParadox()}
                    title="Resolve Paradox (costs 100 Divinity, reduces paradox by 1)"
                  >
                    ✦ Resolve (100 Div)
                  </Button>
                </div>
              </div>
              {/* FEATURE 10 — Paradox warning */}
              {universeParadox >= 2 && (
                <div className="rounded-md border border-rose-400/60 bg-rose-500/15 p-1.5 text-[0.65rem] text-rose-200 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span className="flex-1">⚠ PARADOX OVERLOAD imminent — at 3, the universe creation fails and all rules reset. Resolve a paradox or avoid Forbidden options.</span>
                </div>
              )}
              <div className="space-y-2">
                {UNIVERSE_SLOTS.map((slot, idx) => {
                  const chosenId = universeRules[idx];
                  const chosen = slot.options.find((o) => o.id === chosenId);
                  return (
                    <div key={slot.id} className={`stat-card p-2 ${chosen ? (chosen.forbidden ? "border-rose-400/50" : "border-emerald-400/40") : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{slot.icon}</span>
                        <span className="text-xs font-semibold">{slot.name}</span>
                        {chosen && !chosen.forbidden && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 ml-auto" />}
                        {chosen?.forbidden && (
                          <Badge variant="outline" className="ml-auto text-[0.55rem] text-rose-300 border-rose-400/60">
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Forbidden
                          </Badge>
                        )}
                      </div>
                      <div className="text-[0.6rem] text-muted-foreground mb-1.5">{slot.desc}</div>
                      <div className="grid grid-cols-2 gap-1">
                        {slot.options.map((opt) => {
                          const selected = chosenId === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setUniverseRule(idx, opt.id)}
                              className={`stat-card text-left p-1.5
                                ${selected
                                  ? opt.forbidden
                                    ? "border-rose-400/70 bg-rose-500/15 forbidden-pulse"
                                    : "border-amber-400/60 bg-amber-500/10"
                                  : opt.forbidden
                                    ? "border-rose-400/40 bg-rose-500/5 hover:border-rose-400/70"
                                    : "hover:border-amber-400/40"
                                }`}
                            >
                              <div className={`text-[0.65rem] font-medium ${opt.forbidden ? "text-rose-200" : ""}`}>{opt.label}{opt.forbidden ? " ⚠" : ""}</div>
                              <div className="text-[0.55rem] text-muted-foreground mt-0.5 leading-tight">{opt.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Pantheon — Keep / Absorb Allied Gods */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                <Star className="w-3 h-3" /> Your Pantheon — choose which allied gods to keep
              </div>
              {alliedGods.length === 0 ? (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  No allied gods. Form alliances in Layer 8 to choose a pantheon.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {alliedGods.map((g) => {
                    const kept = keptGods.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        onClick={() => toggleKeptGod(g.id)}
                        className={`stat-card text-left p-2 ${kept ? "border-amber-400/60 bg-amber-500/10" : "hover:border-amber-400/40"}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-base">{g.icon}</span>
                          <span className="text-xs font-medium truncate">{g.name}</span>
                          {kept && <CheckCircle2 className="w-2.5 h-2.5 text-amber-300 ml-auto" />}
                        </div>
                        <div className="text-[0.55rem] text-muted-foreground mt-0.5 leading-snug">
                          {kept ? "Keep in new pantheon" : "Click to keep (others absorbed)"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {keptGods.length > 0 && (
                <div className="text-[0.6rem] text-amber-300/80 mt-1">
                  {keptGods.length} god(s) will be kept. {alliedGods.length - keptGods.length} will be absorbed (their followers bring peace).
                </div>
              )}
            </section>

            {/* Ending Choices */}
            <section>
              <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                <Star className="w-3 h-3" /> Ending Choice (completes Layer 10)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {ENDING_CHOICES.map((e) => {
                  const chosen = chosenEnding === e.id;
                  const disabled = !!chosenEnding || (e.id === "reset" && !canReset);
                  return (
                    <button
                      key={e.id}
                      onClick={() => !disabled && !chosen && chooseEnding(e.id)}
                      disabled={disabled}
                      className={`stat-card text-left p-2 ${chosen ? "border-amber-400/60 bg-amber-500/10" : disabled ? "opacity-50" : "hover:border-amber-400/40"}`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-base">{e.icon}</span>
                        <span className="text-xs font-medium">{e.name}</span>
                        {chosen && <CheckCircle2 className="w-2.5 h-2.5 text-amber-300 ml-auto" />}
                      </div>
                      <div className="text-[0.6rem] text-muted-foreground mt-0.5 leading-snug">{e.desc}</div>
                      {e.id === "reset" && !canReset && !chosen && (
                        <div className="text-[0.55rem] text-rose-300/80 mt-1">
                          Requires all 8 universe slots filled ({universeB.filledCount}/8).
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {chosenEnding && (
                <div className="text-[0.6rem] text-amber-300/80 mt-1">
                  Ending chosen: {ENDING_CHOICES.find((e) => e.id === chosenEnding)?.name}.{" "}
                  {cosmicBoonStacks > 0 && `Cosmic Boon stacks: ${cosmicBoonStacks} (+${(boon * 100).toFixed(0)}% production).`}
                </div>
              )}
            </section>
          </div>
        )}

        <Separator className="my-2" />
        <div className="text-[0.65rem] text-muted-foreground px-1 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          Fill all 8 universe slots to enable "Reset Universe". Each reset grants a permanent +10% production Cosmic Boon that stacks.
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShow(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mark unused imports as used (for tree-shaking safety)
void MINOR_GOD_MAP;
void isEternityComplete;
