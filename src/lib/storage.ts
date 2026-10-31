export const STORAGE_PREFIX = 'modo_execucao_storage_';
export const SCHEMA_VERSION = 2;

/** Evento disparado a cada gravação local bem-sucedida; usado pela sincronização em nuvem. */
export const LOCAL_WRITE_EVENT = 'modo:local-write';

const warnedKeys = new Set<string>();

function warnOnce(key: string, operation: 'read' | 'write', error: unknown): void {
  const warnId = `${operation}:${key}`;
  if (!warnedKeys.has(warnId)) {
    warnedKeys.add(warnId);
    console.warn(`[storage] Failed to ${operation} key "${key}":`, error);
  }
}

/**
 * Safely reads and parses a JSON value from localStorage with a fallback.
 * Handles missing `window`, corrupted JSON, and storage access errors.
 * Logs a console warning at most once per key.
 */
export function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    warnOnce(key, 'read', error);
    return fallback;
  }
}

/**
 * Safely stringifies and writes a value to localStorage.
 * Handles missing `window`, quota errors, and circular references.
 * Logs a console warning at most once per key.
 */
export function safeWrite(key: string, value: unknown): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    try {
      window.dispatchEvent(new CustomEvent(LOCAL_WRITE_EVENT, { detail: { key } }));
    } catch {
      // ambientes sem CustomEvent: a sincronização apenas não é notificada
    }
    return true;
  } catch (error) {
    warnOnce(key, 'write', error);
    return false;
  }
}

/**
 * Reads the schema version from storage.
 * Missing version defaults to 1 as per requirements.
 */
export function readSchemaVersion(): number {
  const versionKey = `${STORAGE_PREFIX}schema_version`;
  return safeRead<number>(versionKey, 1);
}

/**
 * Writes the schema version to storage.
 */
export function writeSchemaVersion(v: number): void {
  const versionKey = `${STORAGE_PREFIX}schema_version`;
  safeWrite(versionKey, v);
}
