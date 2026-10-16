"use client";

import { RESOURCES, RESOURCE_MAP } from "@/game/data/resources";

// Format a number for display. Shows decimals for small/partial values
// so that fractional production (e.g. +0.3/s) is always visible.
export function formatNumber(n: number, digits = 1): string {
  if (n === undefined || n === null || isNaN(n)) return "0";
  const abs = Math.abs(n);
  // Very small non-zero values: show with enough precision to be visible
  if (abs > 0 && abs < 0.01) return n.toFixed(3);
  if (abs < 1) return n.toFixed(digits + 1);
  if (abs < 10) return n.toFixed(digits);
  if (abs < 1000) {
    // Show one decimal if there's a fractional part, else integer
    return Number.isInteger(n) ? n.toFixed(0) : n.toFixed(digits);
  }
  if (abs < 1e6) return (n / 1e3).toFixed(digits) + "K";
  if (abs < 1e9) return (n / 1e6).toFixed(digits) + "M";
  if (abs < 1e12) return (n / 1e9).toFixed(digits) + "B";
  if (abs < 1e15) return (n / 1e12).toFixed(digits) + "T";
  return n.toExponential(2);
}

// Compact format for headers (always 1 decimal under 1K, no decimals above)
export function formatCompact(n: number): string {
  if (n === undefined || n === null || isNaN(n)) return "0";
  const abs = Math.abs(n);
  if (abs < 1) return n.toFixed(2);
  if (abs < 100) return n.toFixed(1);
  if (abs < 1e3) return Math.floor(n).toString();
  if (abs < 1e6) return (n / 1e3).toFixed(1) + "K";
  if (abs < 1e9) return (n / 1e6).toFixed(1) + "M";
  if (abs < 1e12) return (n / 1e9).toFixed(1) + "B";
  return n.toExponential(1);
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h < 24) return `${h}h ${mm}m`;
  const d = Math.floor(h / 24);
  const hh = h % 24;
  return `${d}d ${hh}h`;
}

export function resourceColor(id: string): string {
  return RESOURCE_MAP[id]?.color || "#cbd5e1";
}

export function resourceIcon(id: string): string {
  return RESOURCE_MAP[id]?.icon || "❓";
}

export function resourceName(id: string): string {
  return RESOURCE_MAP[id]?.name || id;
}
// IMPORTANT: If you use formatCompact, formatNumber, or formatTime in any component,
// you MUST import them from this file: import { formatCompact } from '../shared/format';
// Do NOT use these functions without importing — it will cause a runtime crash.

