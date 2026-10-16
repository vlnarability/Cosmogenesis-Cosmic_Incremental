"use client";

import { useGameStore } from "@/game/state/store";
import { EVENT_MAP } from "@/game/data/events";
import { AlertTriangle, Clock } from "lucide-react";

// Auto-resolve timeout (seconds). Must match the store's `eventTimer`
// initial value (set in the game loop when an event fires).
const EVENT_TIMEOUT_SECONDS = 60;

export function EventModal() {
  const activeEvent = useGameStore((s) => s.activeEvent);
  const resolveEvent = useGameStore((s) => s.resolveEvent);
  // EVENT-TIMEOUT-BAR — store-side timer that counts down from 60 → 0.
  // The bar fills to 100% when full (60s) and shrinks to 0% as time runs out.
  const eventTimer = useGameStore((s) => s.eventTimer || 0);

  if (!activeEvent) return null;
  const ev = EVENT_MAP[activeEvent];
  if (!ev) return null;

  // Default choice = the first choice (matches the store's auto-resolve logic).
  const defaultChoice = ev.choices[0];
  const pct = Math.max(0, Math.min(100, (eventTimer / EVENT_TIMEOUT_SECONDS) * 100));
  // Round up so the bar hits 0 only when the timer is truly expired.
  const secondsLeft = Math.max(0, Math.ceil(eventTimer));

  return (
    <div className="story-popup-overlay" onClick={(e) => { /* don't dismiss on backdrop click — require a choice */ }}>
      <div className="story-popup-card glass-strong rounded-xl overflow-hidden border border-amber-500/40 max-w-md">
        {/* Header */}
        <div className="relative p-4 border-b border-border/60 bg-amber-500/10">
          <div className="text-[0.65rem] uppercase tracking-[0.25em] text-amber-400 font-mono mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Event
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0 bg-amber-500/15 border border-amber-500/30">
              {ev.icon}
            </div>
            <h2 className="text-lg font-bold leading-tight">{ev.name}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-sm leading-relaxed text-foreground/95">{ev.desc}</p>
        </div>

        {/* EVENT-TIMEOUT-BAR — countdown progress + default-choice hint.
            The bar shrinks from 100% → 0% as the 60s timer counts down.
            When it hits 0, the store auto-resolves with `defaultChoice`. */}
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground mb-1.5 gap-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Auto-resolves in {secondsLeft}s with:
            </span>
            <span className="text-amber-400/90 font-medium truncate">
              {defaultChoice?.label ?? "—"}
            </span>
          </div>
          <div
            className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden"
            role="progressbar"
            aria-label="Time remaining before auto-resolve"
            aria-valuenow={secondsLeft}
            aria-valuemin={0}
            aria-valuemax={EVENT_TIMEOUT_SECONDS}
          >
            <div
              className="h-full rounded-full bg-amber-500/80 transition-[width] duration-200 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Choices */}
        <div className="px-5 pb-5 space-y-2">
          {ev.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => resolveEvent(ev.id, choice.id)}
              className="w-full text-left p-3 rounded-lg border border-border bg-muted/30 hover:border-amber-500/50 hover:bg-amber-500/10 transition-colors group"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold group-hover:text-amber-400 transition-colors">
                    {choice.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{choice.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
