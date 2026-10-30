// Log categorization — derives a category from a log message's content.
//
// The log is a flat string[] (addToLog prepends "[timestamp] msg"). Rather
// than migrate to {msg, category, ts} objects (persist risk + churn), we
// derive the category at render time from the message's emoji prefix +
// keywords. Every log line already carries an emoji tag from its source
// action (🎁 rare, 📦 shipment, 🤝 treaty, ⚔️ combat, 🏹/🦁 hunt, 🔗 event,
// ✨ achievement, etc.), so the derivation is robust.
//
// Categories (single source of truth for the LogTab filter chips):
//   combat    — raids, counter-attacks, assimilation, defense
//   trade     — shipments, rare drops, reputation tier-ups
//   diplomacy — treaties signed/broken
//   hunt      — normal + deep hunts
//   story     — events, event chains, trials, story beats
//   system    — everything else (evolve, build, research, save, settings)

export type LogCategory =
  | "combat"
  | "trade"
  | "diplomacy"
  | "hunt"
  | "story"
  | "system";

export interface LogCategoryMeta {
  label: string;
  /** Tailwind text color for the chip + the entry's left border. */
  colorClass: string;
  /** Tailwind bg + border for the filter chip when active. */
  activeChipClass: string;
  /** Left-border accent color class for the log entry. */
  borderClass: string;
}

export const LOG_CATEGORIES: Record<LogCategory, LogCategoryMeta> = {
  combat: {
    label: "Combat",
    colorClass: "text-rose-300",
    activeChipClass: "bg-rose-500/15 border-rose-500/40 text-rose-200",
    borderClass: "border-l-rose-500/60",
  },
  trade: {
    label: "Trade",
    colorClass: "text-emerald-300",
    activeChipClass: "bg-emerald-500/15 border-emerald-500/40 text-emerald-200",
    borderClass: "border-l-emerald-500/60",
  },
  diplomacy: {
    label: "Diplomacy",
    colorClass: "text-violet-300",
    activeChipClass: "bg-violet-500/15 border-violet-500/40 text-violet-200",
    borderClass: "border-l-violet-500/60",
  },
  hunt: {
    label: "Hunt",
    colorClass: "text-amber-300",
    activeChipClass: "bg-amber-500/15 border-amber-500/40 text-amber-200",
    borderClass: "border-l-amber-500/60",
  },
  story: {
    label: "Story",
    colorClass: "text-cyan-300",
    activeChipClass: "bg-cyan-500/15 border-cyan-500/40 text-cyan-200",
    borderClass: "border-l-cyan-500/60",
  },
  system: {
    label: "System",
    colorClass: "text-muted-foreground",
    activeChipClass: "bg-muted/30 border-border text-foreground",
    borderClass: "border-l-border/60",
  },
};

// Ordered list for the filter chip row (All first, then categories).
export const LOG_CATEGORY_ORDER: LogCategory[] = [
  "combat",
  "trade",
  "diplomacy",
  "hunt",
  "story",
  "system",
];

/**
 * Derive the category of a log line from its content. Checks the leading
 * emoji + keyword tokens. Falls back to "system" for generic build/research/
 * evolve/save messages.
 */
export function logCategoryOf(line: string): LogCategory {
  // The line is "[timestamp] msg" — strip the timestamp prefix for matching.
  const msg = line.replace(/^\[.*?\]\s*/, "");
  // Combat — raids, counter-attacks, assimilation, defense outcomes.
  if (
    msg.startsWith("⚔️") ||
    msg.startsWith("🛡️") ||
    /raid|counter-attack|counter raid|defense (against|successful|failed)|assimilat|Counter-attack on|is raiding/i.test(msg)
  ) {
    return "combat";
  }
  // Diplomacy — treaties signed/broken + relation changes from treaties.
  if (
    msg.startsWith("🤝") ||
    /treaty (signed|broken|changed)|signed with|broken!|non-aggression|mutual defense|research pact|trade agreement/i.test(msg)
  ) {
    return "diplomacy";
  }
  // Hunt — normal + deep hunts (the action log lines + cooldown notices).
  if (
    msg.startsWith("🏹") ||
    msg.startsWith("🦁") ||
    /^Hunt!|^Deep Hunt!/i.test(msg) ||
    /Deep Hunt is still recovering|Deep Hunt needs/i.test(msg)
  ) {
    return "hunt";
  }
  // Trade — shipments, rare drops from trade, reputation tier-ups.
  if (
    msg.startsWith("📦") ||
    msg.startsWith("🎁") ||
    /shipment|arrived|trade (route|caravan|partner)|reputation|regards you as|First shipment/i.test(msg)
  ) {
    return "trade";
  }
  // Story — events, event chains, trials, story beats, achievements.
  if (
    msg.startsWith("🔗") ||
    msg.startsWith("🎲") ||
    msg.startsWith("✨") ||
    msg.startsWith("🎉") ||
    /event|trial|story|follow-up|chain/i.test(msg)
  ) {
    return "story";
  }
  return "system";
}
