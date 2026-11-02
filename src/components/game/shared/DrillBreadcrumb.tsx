"use client";

import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// C4 — DrillBreadcrumb
//
// A reusable breadcrumb bar for the cosmos + war drill-down
// families. Renders a horizontal trail of items separated by
// chevrons. The LAST item is the current location (no click
// handler). Items with `onClick` are clickable "back" targets.
//
// Visual design:
//   [Universe] › [Galaxy: Vega] › [System: Alpha Centauri]
//                          ^click    ^click             ^current
//
// The bar lives at the top of a layer modal (right under the
// layer header) so players always see where they are in the
// hierarchy. Clicking a higher item routes the player back via
// the store's drillBack* actions.
// ============================================================

export interface BreadcrumbItem {
  /** Stable id (used as React key). */
  id: string;
  /** Visible label. */
  label: string;
  /** Optional icon node rendered before the label. */
  icon?: React.ReactNode;
  /** Click handler — if absent, the item is "current" (no click).
   *  Ignored when `isCurrent` is true. */
  onClick?: () => void;
  /** Optional tooltip text shown on hover. */
  title?: string;
  /** Explicit "current location" flag. When true, the item is rendered as
   *  the active crumb (no click) regardless of position. Use this when the
   *  current location is NOT the last item in the trail — e.g. the war
   *  family on L8 has [Outpost (back) › Alliance (CURRENT) › Old Gods (forward)],
   *  so the current item is in the middle. */
  isCurrent?: boolean;
}

export interface DrillBreadcrumbProps {
  /** The breadcrumb items, in order from highest level to current. */
  items: BreadcrumbItem[];
  /** Optional className for the outer container. */
  className?: string;
  /** Tone affects the accent color of the chevrons + hover. */
  tone?: "cosmos" | "war";
}

export function DrillBreadcrumb({
  items,
  className,
  tone = "cosmos",
}: DrillBreadcrumbProps) {
  if (!items || items.length === 0) return null;

  const toneChevron =
    tone === "war"
      ? "text-rose-400/70"
      : "text-cyan-400/70";
  const toneHover =
    tone === "war"
      ? "hover:text-rose-200 hover:border-rose-400/40"
      : "hover:text-cyan-200 hover:border-cyan-400/40";
  const toneCurrent =
    tone === "war"
      ? "text-rose-200 border-rose-400/40 bg-rose-500/10"
      : "text-cyan-200 border-cyan-400/40 bg-cyan-500/10";

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-1 px-2 py-1.5 rounded-md border border-border/40 bg-muted/10 backdrop-blur-sm drill-breadcrumb-bar",
        className,
      )}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        // C4 — an item is "current" if either (a) isCurrent=true (explicit),
        // or (b) it's the last item AND has no onClick. The explicit flag
        // supports war-family layouts where the current item is in the
        // middle of the trail (forward targets appear after it).
        const isCurrent = item.isCurrent === true || (isLast && !item.onClick);
        const isClickable = !!item.onClick && !isCurrent;
        return (
          <Fragment key={item.id}>
            <button
              type="button"
              onClick={item.onClick}
              disabled={!isClickable}
              title={item.title}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded text-[0.65rem] font-medium border transition-colors duration-150",
                isCurrent
                  ? cn("cursor-default", toneCurrent)
                  : isClickable
                    ? cn("text-muted-foreground border-transparent bg-transparent cursor-pointer", toneHover)
                    : "text-muted-foreground/50 border-transparent bg-transparent cursor-default",
              )}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span className="truncate max-w-[12rem]">{item.label}</span>
            </button>
            {!isLast && (
              <ChevronRight className={cn("w-3 h-3 shrink-0", toneChevron)} aria-hidden />
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
