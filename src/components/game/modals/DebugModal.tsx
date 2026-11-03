"use client";

import { useGameStore } from "@/game/state/store";
import { STAGES } from "@/game/data/stages";
import { CHALLENGES } from "@/game/data/challenges";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bug, Coins, Zap, Users, Rocket, Eye, Flame, Star, Ghost, Globe } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const DEBUG_PASSWORD = "Coco";

export function DebugModal() {
  const showDebug = useGameStore((s) => s.showDebug);
  const setShowDebug = useGameStore((s) => s.setShowDebug);
  const debugActive = useGameStore((s) => s.debugActive);
  const debugFreeBuy = useGameStore((s) => s.debugFreeBuy);
  const debugInstantEvolve = useGameStore((s) => s.debugInstantEvolve);
  const debugPopControl = useGameStore((s) => s.debugPopControl);
  const stageIndex = useGameStore((s) => s.stageIndex);
  const population = useGameStore((s) => s.population);
  const evolutionPoints = useGameStore((s) => s.evolutionPoints);
  const divinity = useGameStore((s) => s.divinity);
  const aetherShards = useGameStore((s) => s.aetherShards || 0);
  const unlockedChallenges = useGameStore((s) => s.unlockedChallenges);
  const enlightenmentUnlocked = useGameStore((s) => s.enlightenmentUnlocked);
  const transcendenceUnlocked = useGameStore((s) => s.transcendenceUnlocked);
  const genesisUnlocked = useGameStore((s) => s.genesisUnlocked);
  const completedChallenges = useGameStore((s) => s.completedChallenges || {});

  const toggleDebugFreeBuy = useGameStore((s) => s.toggleDebugFreeBuy);
  const toggleDebugInstantEvolve = useGameStore((s) => s.toggleDebugInstantEvolve);
  const toggleDebugPopControl = useGameStore((s) => s.toggleDebugPopControl);
  const debugSetPopulation = useGameStore((s) => s.debugSetPopulation);
  const debugUnlockLayer = useGameStore((s) => s.debugUnlockLayer);
  const debugAddDivinity = useGameStore((s) => s.debugAddDivinity);
  const debugAddEP = useGameStore((s) => s.debugAddEP);
  const debugAddAether = useGameStore((s) => s.debugAddAether);
  const debugCompleteAllChallenges = useGameStore((s) => s.debugCompleteAllChallenges);
  const debugJumpToStage = useGameStore((s) => s.debugJumpToStage);

  const [passwordInput, setPasswordInput] = useState("");
  const [unlocked, setUnlocked] = useState(debugActive);

  const handlePassword = () => {
    if (passwordInput === DEBUG_PASSWORD) {
      setUnlocked(true);
      useGameStore.setState({ debugActive: true });
    } else {
      setPasswordInput("");
    }
  };

  return (
    <Dialog open={showDebug} onOpenChange={setShowDebug}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Bug className="w-5 h-5 text-red-400" />
            Debug Console
          </DialogTitle>
          <DialogDescription>Testing tools. Use with caution.</DialogDescription>
        </DialogHeader>

        {!unlocked ? (
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">Enter password to access debug tools.</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePassword()}
                placeholder="Password..."
                className="flex-1 px-3 py-2 rounded-md bg-muted/40 border border-border text-sm"
              />
              <Button size="sm" onClick={handlePassword}>Unlock</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Toggles */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Toggles
              </h3>
              <div className="space-y-2">
                <ToggleRow
                  label="Free Buy"
                  desc="Buy systems/techs with no resource cost"
                  checked={debugFreeBuy}
                  onToggle={toggleDebugFreeBuy}
                />
                <ToggleRow
                  label="Instant Evolve"
                  desc="Evolve without meeting requirements"
                  checked={debugInstantEvolve}
                  onToggle={toggleDebugInstantEvolve}
                />
                <ToggleRow
                  label="Pop Control"
                  desc="Manually set population"
                  checked={debugPopControl}
                  onToggle={toggleDebugPopControl}
                />
              </div>
            </div>

            <Separator />

            {/* Population control */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Population
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Current: {Math.floor(population)}</span>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugSetPopulation(population + 10)}>+10</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugSetPopulation(population + 100)}>+100</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugSetPopulation(population + 1000)}>+1000</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugSetPopulation(8)}>Reset</Button>
              </div>
            </div>

            <Separator />

            {/* Stage jump */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5" /> Stage Jump
              </h3>
              <div className="flex flex-wrap gap-1">
                {STAGES.map((stage, i) => (
                  <Button
                    key={stage.id}
                    size="sm"
                    variant={i === stageIndex ? "default" : "outline"}
                    className="h-7 text-xs"
                    onClick={() => debugJumpToStage(i)}
                  >
                    {stage.icon} {stage.name}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Prestige layer unlock */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" /> Prestige Layers
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Evolution (Layer 1)</span>
                  <div className="flex items-center gap-2">
                    {unlockedChallenges ? (
                      <Badge variant="outline" className="text-[0.6rem] text-emerald-400">Unlocked</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugUnlockLayer("evolution")}>
                        <Flame className="w-3 h-3 mr-1" /> Unlock
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Enlightenment (Layer 2)</span>
                  <div className="flex items-center gap-2">
                    {enlightenmentUnlocked ? (
                      <Badge variant="outline" className="text-[0.6rem] text-emerald-400">Unlocked</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugUnlockLayer("enlightenment")}>
                        <Eye className="w-3 h-3 mr-1" /> Unlock
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Transcendence (Layer 3)</span>
                  <div className="flex items-center gap-2">
                    {transcendenceUnlocked ? (
                      <Badge variant="outline" className="text-[0.6rem] text-emerald-400">Unlocked</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugUnlockLayer("transcendence")}>
                        <Ghost className="w-3 h-3 mr-1" /> Unlock
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Genesis (Layer 4)</span>
                  <div className="flex items-center gap-2">
                    {genesisUnlocked ? (
                      <Badge variant="outline" className="text-[0.6rem] text-emerald-400">Unlocked</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugUnlockLayer("genesis")}>
                        <Globe className="w-3 h-3 mr-1" /> Unlock
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Complete All Challenges</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugCompleteAllChallenges()}>
                    Complete All
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Currency controls */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" /> Currency
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24">EP: {Math.floor(evolutionPoints)}</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugAddEP(10)}>+10</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugAddEP(100)}>+100</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugAddEP(1000)}>+1000</Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24">Divinity: {Math.floor(divinity)}</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugAddDivinity(50)}>+50</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugAddDivinity(500)}>+500</Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24">Aether: {Math.floor(aetherShards)}</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugAddAether(50)}>+50</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => debugAddAether(500)}>+500</Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Status info */}
            <div className="text-[0.65rem] text-muted-foreground">
              Stage: {STAGES[stageIndex].name} · Pop: {Math.floor(population)} · EP: {Math.floor(evolutionPoints)} · Div: {Math.floor(divinity)} · Challenges: {Object.values(completedChallenges).filter(Boolean).length}/10
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setShowDebug(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({ label, desc, checked, onToggle }: { label: string; desc: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[0.65rem] text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}
