/**
 * Logging Service
 *
 * Structured logging with levels, error tracking, and performance markers.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_KEY = "ramesh-logs";
const MAX_LOG_ENTRIES = 200;

interface LogEntry {
  ts: string;
  level: LogLevel;
  message: string;
  data?: any;
}

const logs: LogEntry[] = [];

// In-memory cache of the persisted error/warn log so we don't re-read and
// re-parse localStorage on every log entry (avoiding synchronous storage I/O
// in the error hot path).
let persistedCache: { ts: string; level: string; message: string }[] | null = null;

function loadPersisted(): { ts: string; level: string; message: string }[] {
  if (persistedCache) return persistedCache;
  let loaded: { ts: string; level: string; message: string }[];
  try {
    loaded = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {
    loaded = [];
  }
  persistedCache = loaded;
  return loaded;
}

function addEntry(level: LogLevel, message: string, data?: any) {
  const entry: LogEntry = { ts: new Date().toISOString(), level, message, data };
  logs.push(entry);
  if (logs.length > MAX_LOG_ENTRIES) logs.shift();

  // Console output
  const prefix = `[${level.toUpperCase()}]`;
  switch (level) {
    case "debug": console.debug(prefix, message, data || ""); break;
    case "info":  console.info(prefix, message, data || ""); break;
    case "warn":  console.warn(prefix, message, data || ""); break;
    case "error": console.error(prefix, message, data || ""); break;
  }

  // Persist errors and warnings to localStorage for crash analysis
  if (level === "error" || level === "warn") {
    const stored = loadPersisted();
    stored.push({ ts: entry.ts, level, message });
    persistedCache = stored.slice(-50);
    try { localStorage.setItem(LOG_KEY, JSON.stringify(persistedCache)); } catch {}
  }
}

export function logDebug(message: string, data?: any) { addEntry("debug", message, data); }
export function logInfo(message: string, data?: any) { addEntry("info", message, data); }
export function logWarn(message: string, data?: any) { addEntry("warn", message, data); }
export function logError(message: string, data?: any) { addEntry("error", message, data); }

/** Get all entries for this session */
export function getLogs(): LogEntry[] { return [...logs]; }

/** Get persisted errors from previous sessions */
export function getPersistedErrors(): { ts: string; level: string; message: string }[] {
  return [...loadPersisted()];
}

/** Clear all logs */
export function clearLogs() {
  logs.length = 0;
  persistedCache = null;
  try { localStorage.removeItem(LOG_KEY); } catch {}
}

/** Create a performance marker */
export function perfMark(name: string) {
  if (typeof performance === "undefined") return;
  performance.mark(name);
}

/** Measure between two marks and log */
export function perfMeasure(name: string, startMark: string, endMark: string) {
  if (typeof performance === "undefined") return;
  try {
    performance.measure(name, startMark, endMark);
    const entries = performance.getEntriesByName(name);
    const last = entries[entries.length - 1];
    if (last) logDebug(`PERF: ${name}`, `${last.duration.toFixed(1)}ms`);
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(name);
  } catch {}
}
