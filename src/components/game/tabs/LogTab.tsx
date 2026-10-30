"use client";

import { useState, useMemo } from "react";
import { useGameStore } from "@/game/state/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListTree, Trash2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  logCategoryOf,
  LOG_CATEGORIES,
  LOG_CATEGORY_ORDER,
  type LogCategory,
} from "@/game/data/logCategories";

// LogTab — the run log with category filter chips + color-coded entries.
//
// Previously a flat undifferentiated wall of text. Now each entry gets a
// category-derived left-border accent (combat=rose, trade=emerald,
// diplomacy=violet, hunt=amber, story=cyan, system=muted), and a chip row
// at the top filters to one category. "All" shows everything. A clear
// button wipes the log (useful after a long run fills it with noise).
//
// The category is DERIVED from the message content (emoji prefix + keywords)
// via logCategoryOf — no migration needed, since the log is still a string[].

type Filter = "all" | LogCategory;

export function LogTab() {
  const log = useGameStore((s) => s.log);
  const addToLog = useGameStore((s) => s.addToLog);
  const [filter, setFilter] = useState<Filter>("all");
  // F6 — search query. Filters log entries by keyword (case-insensitive).
  // Combines with the category filter (both must match). An empty query = no
  // keyword filter.
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  // Categorize once per render; build per-category counts for the chips.
  // The filtered list applies BOTH the category filter + the search query.
  const { filtered, counts } = useMemo(() => {
    const counts: Record<LogCategory, number> = {
      combat: 0, trade: 0, diplomacy: 0, hunt: 0, story: 0, system: 0,
    };
    const filtered: string[] = [];
    for (const line of log) {
      const cat = logCategoryOf(line);
      counts[cat]++;
      const catOk = filter === "all" || cat === filter;
      const queryOk = !q || line.toLowerCase().includes(q);
      if (catOk && queryOk) filtered.push(line);
    }
    return { filtered, counts };
  }, [log, filter, q]);

  const clearLog = () => {
    // Use the store's log setter via a direct state set through addToLog
    // isn't right (it appends). Instead, set log to [] via the store.
    useGameStore.setState({ log: [] });
    addToLog("Log cleared.");
  };

  return (
    <Card className="glass-panel h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTree className="w-4 h-4" />
              Run Log
            </CardTitle>
            <CardDescription className="text-xs">
              Recent events from this run. Filter by category.
            </CardDescription>
          </div>
          {log.length > 0 && (
            <button
              onClick={clearLog}
              className="text-muted-foreground hover:text-rose-400 transition-colors p-1 rounded-md hover:bg-rose-500/10 shrink-0"
              title="Clear log"
              aria-label="Clear log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {/* F6 — search box. Filters log entries by keyword (case-insensitive),
            combined with the category filter. The clear (X) button resets the
            query. The result count shows how many entries match. */}
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search log…"
            className="w-full h-7 pl-7 pr-7 text-xs rounded-md bg-muted/30 border border-border/60 focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/60"
            aria-label="Search log entries"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {/* Filter chips — All + one per category, each with its count. */}
        <div className="flex flex-wrap gap-1 mt-2">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="All"
            count={q ? filtered.length : log.length}
            activeClass="bg-primary/15 border-primary/40 text-primary"
            inactiveClass="border-border/60 text-muted-foreground hover:text-foreground"
          />
          {LOG_CATEGORY_ORDER.map((cat) => (
            <FilterChip
              key={cat}
              active={filter === cat}
              onClick={() => setFilter(cat)}
              label={LOG_CATEGORIES[cat].label}
              count={counts[cat]}
              activeClass={LOG_CATEGORIES[cat].activeChipClass}
              inactiveClass="border-border/60 text-muted-foreground hover:text-foreground"
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* h-full + min-h-0 — fills the parent InfoModal's flex-1 area
            instead of growing with content. The scrollbar stays inside
            a stable-size container so the parent modal never resizes. */}
        <div className="font-mono text-xs space-y-0.5 h-full overflow-y-auto pr-1 custom-scroll">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {log.length === 0
                ? "No events yet."
                : q
                  ? `No entries match "${query}".`
                  : `No ${filter === "all" ? "" : LOG_CATEGORIES[filter as LogCategory]?.label.toLowerCase() || ""} events.`}
            </p>
          ) : (
            filtered.map((line, i) => {
              const cat = filter === "all" ? logCategoryOf(line) : (filter as LogCategory);
              const meta = LOG_CATEGORIES[cat];
              return (
                <div
                  key={i}
                  className={cn(
                    "leading-relaxed text-foreground/80 hover:text-foreground transition-colors border-l-2 pl-1.5 py-0.5",
                    meta.borderClass
                  )}
                >
                  {line}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  activeClass,
  inactiveClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  activeClass: string;
  inactiveClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-[0.6rem] px-1.5 py-0.5 rounded-full border font-medium transition-colors flex items-center gap-1",
        active ? activeClass : inactiveClass
      )}
      aria-pressed={active}
    >
      {label}
      <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );
}
