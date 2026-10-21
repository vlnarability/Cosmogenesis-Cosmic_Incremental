"use client";

import { AlertCircle } from "lucide-react";
import { usePurchaseError } from "@/game/hooks/usePurchaseError";
import { cn } from "@/lib/utils";

// ============================================================
// PurchaseErrorBanner — P7.
//
// Inline red banner that surfaces the latest purchase-failure message
// ("Not enough [resource]") from buySystem / buyTech / buyUpgrade /
// buyUniversalUpgrade. The message is auto-cleared after ~2 seconds
// via the usePurchaseError hook (which manages local visibility).
//
// Renders `null` when there's no active error — so it can be dropped
// into any layout without affecting the layout when no error is set.
// ============================================================

interface PurchaseErrorBannerProps {
  /** Extra classes for the banner container. */
  className?: string;
}

export function PurchaseErrorBanner({ className }: PurchaseErrorBannerProps) {
  const errorMessage = usePurchaseError();
  if (!errorMessage) return null;
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-red-400/40 bg-red-500/10 text-red-300 text-xs",
        "animate-in fade-in-0 zoom-in-95 duration-150",
        className
      )}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
      <span className="font-medium">{errorMessage}</span>
    </div>
  );
}
