"use client";

// IDEA-8 — DIVINE PANTHEON (L8 sub-system UI)
// 5 avatar slots; the player unlocks each with scaling Divinity, picks a
// Domain for the avatar (free), and upgrades its Power Level (1-10) with
// Divinity. Each Domain gives a global Divine Engine bonus that stacks
// additively across all occupied slots.

import { useGameStore } from "@/game/state/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  PANTHEON_SLOTS,
  MAX_AVATAR_POWER,
  PANHEON_SLOT_UNLOCK_COSTS,
  AVATAR_UPGRADE_BASE_COST,
  ALL_DOMAINS,
  DOMAIN_META,
  avatarUpgradeCost,
  makeInitialPantheon,
  pantheonBonus,
  type AvatarDomain,
} from "@/game/data/divinePantheon";
import { formatNumber } from "../shared/format";
import {
  Lock, Sparkles, Plus, Minus, Wand2, Shield, Crown, FlaskConical, Triangle,
  CheckCircle2, Pencil, X,
} from "lucide-react";
import { useState } from "react";

const DOMAIN_ICON: Record<AvatarDomain, typeof Sparkles> = {
  ascendant: Crown,
  harvester: FlaskConical,
  sentinel: Shield,
  architect: Triangle,
  voidborn: Wand2,
};

export function DivinePantheonPanel() {
  const unlockedLayers = useGameStore((s) => s.unlockedLayers);
  const pantheon = useGameStore((s) => s.divinePantheon || makeInitialPantheon());
  const divinity = useGameStore((s) => s.divinity || 0);

  const unlockSlot = useGameStore((s) => s.unlockPantheonSlot);
  const createAvatar = useGameStore((s) => s.createPantheonAvatar);
  const upgradeAvatar = useGameStore((s) => s.upgradePantheonAvatar);
  const renameAvatar = useGameStore((s) => s.renamePantheonAvatar);
  const dismissAvatar = useGameStore((s) => s.dismissPantheonAvatar);

  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const isUnlocked = !!unlockedLayers?.divinity;
  const bonus = pantheonBonus(pantheon);
  const slots = (pantheon.length === PANTHEON_SLOTS
    ? pantheon
    : makeInitialPantheon());

  if (!isUnlocked) {
    return (
      <div className="stat-card text-center text-muted-foreground py-6">
        <Lock className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">Divine Pantheon is sealed.</p>
        <p className="text-xs mt-1">Reach Layer 8 (Divinity) to fragment your essence into Avatars.</p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* Header + summary */}
      <div className="stat-card">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Idea 8 — Divine Pantheon
            </div>
            <h3 className="text-sm font-semibold mt-0.5">Avatar of the God</h3>
            <p className="text-[0.65rem] text-muted-foreground mt-0.5 leading-snug max-w-md">
              Fragment your essence into Avatars. Each Avatar picks a Domain that grants a global
              Divine Engine bonus. Slots and Power Levels persist across prestiges.
            </p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <Badge variant="outline" className="text-amber-300 border-amber-400/40">
              {bonus.totalAvatars}/{PANTHEON_SLOTS} avatars · Σ L{bonus.totalPower}
            </Badge>
            <Badge variant="outline" className="text-[0.55rem] text-muted-foreground">
              💎 {formatNumber(divinity, 0)} Divinity
            </Badge>
          </div>
        </div>

        {/* Active bonuses summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 mt-2">
          <BonusChip icon="🌅" label="Divinity" value={`+${(bonus.divinityMult * 100).toFixed(0)}%`} accent="text-amber-300" />
          <BonusChip icon="🌾" label="Faith" value={`+${(bonus.faithMult * 100).toFixed(0)}%`} accent="text-emerald-300" />
          <BonusChip icon="🛡️" label="Crash" value={`-${(bonus.crashReduction * 100).toFixed(0)}%`} accent="text-sky-300" />
          <BonusChip icon="📐" label="Peak" value={`+${(bonus.peakMult * 100).toFixed(0)}%`} accent="text-violet-300" />
          <BonusChip icon="🕳️" label="Void" value={`+${(bonus.voidShardsMult * 100).toFixed(0)}%`} accent="text-fuchsia-300" />
        </div>
      </div>

      {/* Slots grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {slots.map((slot, idx) => {
          if (!slot.unlocked) {
            // Locked slot
            const prevUnlocked = idx === 0 || slots[idx - 1]?.unlocked;
            const cost = PANHEON_SLOT_UNLOCK_COSTS[idx];
            const canAfford = divinity >= cost;
            return (
              <div key={idx} className="stat-card p-3 flex flex-col items-center text-center gap-1.5">
                <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground/60">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">Slot {idx + 1}</div>
                {prevUnlocked ? (
                  <>
                    <div className="text-[0.65rem] text-muted-foreground">Unlocks a new Pantheon Avatar slot.</div>
                    <Button
                      size="sm"
                      className="h-7 text-[0.65rem] mt-1"
                      disabled={!canAfford}
                      onClick={() => unlockSlot(idx)}
                    >
                      Unlock — 💎 {cost.toLocaleString()}
                    </Button>
                  </>
                ) : (
                  <div className="text-[0.6rem] text-muted-foreground italic">Unlock slot {idx} first</div>
                )}
              </div>
            );
          }
          if (!slot.avatar) {
            // Unlocked but no Avatar — Domain picker
            return (
              <div key={idx} className="stat-card p-3 flex flex-col items-center text-center gap-1.5">
                <div className="w-10 h-10 rounded-full border border-dashed border-amber-400/40 flex items-center justify-center text-amber-300/80">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">Slot {idx + 1}</div>
                <div className="text-[0.65rem] text-muted-foreground">Pick a Domain to summon an Avatar.</div>
                <div className="grid grid-cols-2 gap-1 mt-1 w-full">
                  {ALL_DOMAINS.map((d) => {
                    const Meta = DOMAIN_META[d];
                    const Icon = DOMAIN_ICON[d];
                    return (
                      <Button
                        key={d}
                        size="sm"
                        variant="outline"
                        className={`h-7 text-[0.6rem] flex items-center justify-center gap-1 ${Meta.accent}`}
                        onClick={() => createAvatar(idx, d)}
                        title={Meta.blurb}
                      >
                        <Icon className="w-3 h-3" />
                        {Meta.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          }
          // Occupied slot — show Avatar details + upgrade/dismiss buttons
          const av = slot.avatar!;
          const Meta = DOMAIN_META[av.domain];
          const Icon = DOMAIN_ICON[av.domain];
          const nextCost = avatarUpgradeCost(idx, av.powerLevel);
          const atMax = av.powerLevel >= MAX_AVATAR_POWER;
          const canUpgrade = !atMax && divinity >= nextCost;
          const isEditing = editingSlot === idx;
          return (
            <div key={idx} className={`stat-card p-3 ${Meta.accent}`}>
              <div className="flex items-start gap-2">
                <div className="text-2xl shrink-0 mt-0.5">{Meta.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    {isEditing ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-6 text-xs px-1"
                        maxLength={24}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            renameAvatar(idx, editName);
                            setEditingSlot(null);
                          } else if (e.key === "Escape") {
                            setEditingSlot(null);
                          }
                        }}
                      />
                    ) : (
                      <span className="text-xs font-semibold truncate">{av.name}</span>
                    )}
                    <Badge variant="outline" className={`text-[0.55rem] shrink-0 ${Meta.accent}`}>
                      <Icon className="w-2.5 h-2.5 mr-0.5" />
                      {Meta.label}
                    </Badge>
                  </div>
                  <div className="text-[0.55rem] text-muted-foreground italic mt-0.5 leading-snug">{Meta.blurb}</div>

                  {/* Power level bar */}
                  <div className="mt-1.5">
                    <div className="flex items-center justify-between text-[0.55rem] text-muted-foreground mb-0.5">
                      <span>Power Level</span>
                      <span>{av.powerLevel}/{MAX_AVATAR_POWER}</span>
                    </div>
                    <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all"
                        style={{ width: `${(av.powerLevel / MAX_AVATAR_POWER) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Current bonus */}
                  <div className="text-[0.6rem] mt-1.5 text-amber-300">
                    {Meta.bonusLabel(av.powerLevel)}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-1 mt-1.5">
                    {!atMax && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={`h-6 text-[0.6rem] flex-1 ${Meta.accent}`}
                        disabled={!canUpgrade}
                        onClick={() => upgradeAvatar(idx)}
                      >
                        +1 Power (💎 {nextCost.toLocaleString()})
                      </Button>
                    )}
                    {atMax && (
                      <div className="h-6 text-[0.6rem] flex-1 flex items-center justify-center gap-1 text-amber-300">
                        <CheckCircle2 className="w-3 h-3" /> Max Power
                      </div>
                    )}
                  </div>

                  {/* Rename + Dismiss row */}
                  {!isEditing ? (
                    <div className="flex gap-1 mt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 text-[0.55rem] flex-1 text-muted-foreground"
                        onClick={() => {
                          setEditName(av.name);
                          setEditingSlot(idx);
                        }}
                      >
                        <Pencil className="w-2.5 h-2.5 mr-0.5" /> Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 text-[0.55rem] flex-1 text-rose-300 hover:text-rose-200"
                        onClick={() => dismissAvatar(idx)}
                      >
                        <X className="w-2.5 h-2.5 mr-0.5" /> Dismiss
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1 mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-5 text-[0.55rem] flex-1"
                        onClick={() => {
                          renameAvatar(idx, editName);
                          setEditingSlot(null);
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 text-[0.55rem] flex-1 text-muted-foreground"
                        onClick={() => setEditingSlot(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="text-[0.6rem] text-muted-foreground italic px-1 flex items-center gap-1">
        <Minus className="w-2.5 h-2.5" />
        Dismissed Avatars free the slot — re-summon with any Domain. Slot unlocks + Power Levels persist across prestiges.
      </div>
    </section>
  );
}

// Small presentation component for the bonus summary chips at the top.
function BonusChip({
  icon, label, value, accent,
}: { icon: string; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-md border border-muted-foreground/20 bg-muted/10 px-1.5 py-1 text-center">
      <div className="text-[0.55rem] text-muted-foreground flex items-center justify-center gap-0.5">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className={`text-[0.7rem] font-mono ${accent}`}>{value}</div>
    </div>
  );
}

void AVATAR_UPGRADE_BASE_COST;
