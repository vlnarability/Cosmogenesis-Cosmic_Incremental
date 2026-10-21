"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ============================================================
// EmptyState — P7.
//
// Centered "no items yet" block with subtle icon + message +
// optional call-to-action button. Used across the layer modals
// to communicate "you have nothing here yet — here's how to
// start" instead of showing an empty list/grid.
//
// Visually: subtle muted text on a transparent panel, with an
// oversized muted icon above. The CTA button (if provided) is
// rendered below the message.
// ============================================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Optional call-to-action button or hint. */
  action?: ReactNode;
  /** Compact mode — smaller padding for inline use inside cards. */
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-2",
        compact ? "py-4" : "py-8",
        className
      )}
      role="status"
    >
      {icon && (
        <div
          className={cn(
            "text-muted-foreground/60 select-none",
            compact ? "text-2xl" : "text-4xl"
          )}
          aria-hidden
        >
          {icon}
        </div>
      )}
      <p className={cn("font-medium text-foreground/90", compact ? "text-xs" : "text-sm")}>
        {title}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
