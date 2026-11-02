// ===========================================================================
// F12 — HARDMODE LEADERBOARD
//
// localStorage-based fastest-clear records for hardmode runs. Each entry
// captures the player's clear time for a stage in hardmode (difficultyMode
// === "hard"). Times are sorted ascending within each stage, capped at
// MAX_RECORDS_PER_STAGE entries per stage (50).
//
// The leaderboard is LOCAL ONLY for now — the architecture is designed to
// extend to an online leaderboard later by swapping the storage adapter
// (loadLeaderboard / saveLeaderboard) for a fetch-based one without
// touching the call sites.
//
// Records are keyed by stage (one record list per StageId). Each record
// captures:
//   - clearTimeSec: in-game seconds spent in the stage this run
//     (from stageRunTimes[stageId] at the moment of clear).
//   - realTimeSec: wall-clock seconds from Date.now() diff (run start
//     vs stage clear). May differ from clearTimeSec when offline progress
//     or pause mechanics apply.
//   - runTimestamp: Date.now() when the clear happened.
//   - nucleusChoice / ascensionPath / government: build identifiers so the
//     leaderboard can show "fastest Bio-Ascension run to Galactic", etc.
//   - totalSystemsBuilt / totalTechsResearched: economy context.
//
// The leaderboard storage is NAMESPACED per save slot — each slot gets its
// own records, mirroring the save-slot isolation for the main game state.
// The slot key is `cosmo_hardmode_lb_v1_slot{N}`.
// ===========================================================================

import type { StageId } from "../state/types";
import { STAGE_IDS, STAGE_MAP } from "../data/stages";

// ----- Storage constants -----
const STORAGE_VERSION = "v1";
const STORAGE_KEY_PREFIX = `cosmo_hardmode_lb_${STORAGE_VERSION}`;
const MAX_RECORDS_PER_STAGE = 50;

// ----- Record shape -----
export interface HardmodeClearRecord {
  /** Stable id (used as React key + deduplication). */
  id: string;
  stageId: StageId;
  stageName: string;
  /** In-game seconds spent in this stage this run (from stageRunTimes). */
  clearTimeSec: number;
  /** Wall-clock seconds (Date.now diff from run start to stage clear). */
  realTimeSec: number;
  /** Date.now() when the clear happened. */
  runTimestamp: number;
  /** Run identifier (run index at the time of clear). */
  runNumber: number;
  /** Build identifiers for cross-referencing runs. */
  nucleusChoice: string | null;
  ascensionPath: string | null;
  government: string | null;
  /** Economy context at clear time. */
  totalSystemsBuilt: number;
  totalTechsResearched: number;
}

export interface LeaderboardData {
  records: Record<StageId, HardmodeClearRecord[]>;
  /** Schema version — bumped if the record shape changes (forces a reset). */
  schemaVersion: number;
}

const SCHEMA_VERSION = 1;

// ----- Safe localStorage access (SSR-safe + try/catch) -----
function getStorageKey(slot: number): string {
  return `${STORAGE_KEY_PREFIX}_slot${slot}`;
}

function safeGetItem(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    // localStorage may be full or disabled (private browsing). Fail silently
    // — the leaderboard is a non-critical feature.
    return false;
  }
}

// ----- Current save-slot helper -----
// Mirrors the slotLocalStorage adapter's slotKey(getCurrentSlot()) pattern
// from the main store. We import getCurrentSlot lazily to avoid a circular
// dependency (store imports from this file).
let _getCurrentSlotFn: (() => number) | null = null;

/** Wire the slot lookup function (called once at store init). */
export function configureLeaderboardSlotLookup(fn: () => number): void {
  _getCurrentSlotFn = fn;
}

function getCurrentSlot(): number {
  if (_getCurrentSlotFn) return _getCurrentSlotFn();
  return 1;
}

// ----- Empty leaderboard factory -----
function emptyLeaderboard(): LeaderboardData {
  const records = {} as Record<StageId, HardmodeClearRecord[]>;
  for (const id of STAGE_IDS) {
    records[id] = [];
  }
  return { records, schemaVersion: SCHEMA_VERSION };
}

// ----- Public API -----

/** Load the leaderboard from localStorage for the current save slot. */
export function loadLeaderboard(): LeaderboardData {
  const key = getStorageKey(getCurrentSlot());
  const raw = safeGetItem(key);
  if (!raw) return emptyLeaderboard();
  try {
    const parsed = JSON.parse(raw) as LeaderboardData;
    if (!parsed || typeof parsed !== "object") return emptyLeaderboard();
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      // Schema changed — start fresh (don't try to migrate; the leaderboard
      // is non-critical and records rebuild quickly).
      return emptyLeaderboard();
    }
    // Ensure every stage has an array (handles stages added in a later update).
    const out = emptyLeaderboard();
    for (const id of STAGE_IDS) {
      const list = parsed.records?.[id];
      if (Array.isArray(list)) {
        out.records[id] = list.filter(isValidRecord);
      }
    }
    return out;
  } catch {
    return emptyLeaderboard();
  }
}

/** Persist the leaderboard to localStorage for the current save slot. */
export function saveLeaderboard(data: LeaderboardData): boolean {
  const key = getStorageKey(getCurrentSlot());
  return safeSetItem(key, JSON.stringify(data));
}

function isValidRecord(r: unknown): r is HardmodeClearRecord {
  if (!r || typeof r !== "object") return false;
  const rec = r as Record<string, unknown>;
  return (
    typeof rec.id === "string" &&
    typeof rec.stageId === "string" &&
    typeof rec.clearTimeSec === "number" &&
    typeof rec.realTimeSec === "number" &&
    typeof rec.runTimestamp === "number"
  );
}

/**
 * Add a hardmode stage-clear record. The record is inserted into the
 * per-stage list, then the list is sorted ascending by clearTimeSec and
 * trimmed to MAX_RECORDS_PER_STAGE. The updated LeaderboardData is
 * persisted to localStorage + returned.
 *
 * Returns the updated data so the caller can use it without a re-read.
 */
export function addHardmodeClearRecord(
  record: Omit<HardmodeClearRecord, "id">
): LeaderboardData {
  const data = loadLeaderboard();
  const fullRecord: HardmodeClearRecord = {
    ...record,
    id: `${record.stageId}_${record.runTimestamp}_${Math.random().toString(36).slice(2, 8)}`,
  };
  const list = data.records[record.stageId] ?? [];
  // Insert + sort ascending by clearTimeSec (fastest first).
  const next = [...list, fullRecord].sort((a, b) => a.clearTimeSec - b.clearTimeSec);
  data.records[record.stageId] = next.slice(0, MAX_RECORDS_PER_STAGE);
  saveLeaderboard(data);
  return data;
}

/** Get the top N records for a stage (sorted ascending by clearTimeSec). */
export function getTopClearsForStage(
  stageId: StageId,
  limit = 10
): HardmodeClearRecord[] {
  const data = loadLeaderboard();
  const list = data.records[stageId] ?? [];
  return list.slice(0, limit);
}

/** Get the fastest clear time for a stage (or null if no records). */
export function getFastestClearForStage(stageId: StageId): number | null {
  const data = loadLeaderboard();
  const list = data.records[stageId] ?? [];
  if (list.length === 0) return null;
  return list[0].clearTimeSec;
}

/** Get the player's rank for a given clear time on a stage
 *  (1-indexed; returns N+1 if not in the top N). */
export function getRankForClear(stageId: StageId, clearTimeSec: number): number {
  const data = loadLeaderboard();
  const list = data.records[stageId] ?? [];
  let rank = 1;
  for (const rec of list) {
    if (rec.clearTimeSec < clearTimeSec) rank++;
    else break;
  }
  return rank;
}

/** Total records across all stages (for the leaderboard header). */
export function totalRecordCount(): number {
  const data = loadLeaderboard();
  let n = 0;
  for (const id of STAGE_IDS) {
    n += data.records[id]?.length ?? 0;
  }
  return n;
}

/** Wipe the leaderboard for the current slot (debug / "reset records"). */
export function clearLeaderboard(): void {
  const key = getStorageKey(getCurrentSlot());
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

/** Pretty-print a stage name (Cell / Creature / etc.). */
export function stageDisplayName(stageId: StageId): string {
  return STAGE_MAP[stageId]?.name ?? stageId;
}

// Re-export STAGE_IDS so consumers don't need a separate import.
export { STAGE_IDS, MAX_RECORDS_PER_STAGE };
