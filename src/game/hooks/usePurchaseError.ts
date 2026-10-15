"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/game/state/store";

// ============================================================
// usePurchaseError — P7.
//
// Subscribes to the store's `lastPurchaseError` field and returns the
// latest purchase-failure message (or null). The message is shown for
// ~2 seconds (configurable via `timeoutMs`), then auto-clears locally.
//
// The store's `lastPurchaseError` field stays set (it's only the local
// visibility that fades) — that way, if the user clicks the SAME
// unaffordable button again, the timestamp changes and this hook
// re-shows the message for another 2 seconds.
//
// Usage:
//   const errorMessage = usePurchaseError();
//   return errorMessage && <div className="text-red-400 text-xs">{errorMessage}</div>;
// ============================================================

export function usePurchaseError(timeoutMs = 2000): string | null {
  const lastPurchaseError = useGameStore((s) => s.lastPurchaseError);
  const [visibleMessage, setVisibleMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!lastPurchaseError) return;
    // Defer ALL setState calls to avoid sync setState-in-effect lint error.
    const showT = setTimeout(() => setVisibleMessage(lastPurchaseError.message), 0);
    const hideT = setTimeout(() => setVisibleMessage(null), timeoutMs);
    return () => {
      clearTimeout(showT);
      clearTimeout(hideT);
    };
  }, [lastPurchaseError, timeoutMs]);

  // Clear local visibility when the store error clears.
  useEffect(() => {
    if (!lastPurchaseError && visibleMessage) {
      const t = setTimeout(() => setVisibleMessage(null), 0);
      return () => clearTimeout(t);
    }
  }, [lastPurchaseError, visibleMessage]);

  return visibleMessage;
}
