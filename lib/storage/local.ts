const PREFIX = 'tm:v1:';

const listeners = new Map<string, Set<() => void>>();
const snapshots = new Map<string, { raw: string; value: unknown }>();
const memoryStore = new Map<string, string>();
let crossTabListenerAttached = false;

function getRaw(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

function setRaw(key: string, raw: string) {
  try {
    localStorage.setItem(PREFIX + key, raw);
  } catch {
    memoryStore.set(key, raw);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

export function readStored<T>(key: string, fallback: T): T {
  const raw = getRaw(key);
  if (raw === null) return fallback;

  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value: T;
  try {
    const parsed: unknown = JSON.parse(raw);
    value = (isPlainObject(fallback) && isPlainObject(parsed) ? { ...fallback, ...parsed } : parsed) as T;
  } catch {
    value = fallback;
  }
  snapshots.set(key, { raw, value });
  return value;
}

export function writeStored<T>(key: string, value: T) {
  const raw = JSON.stringify(value);
  setRaw(key, raw);
  snapshots.set(key, { raw, value });
  notify(key);
}

export function subscribeStored(key: string, listener: () => void) {
  if (!crossTabListenerAttached) {
    crossTabListenerAttached = true;
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith(PREFIX)) notify(event.key.slice(PREFIX.length));
    });
  }

  let keyListeners = listeners.get(key);
  if (!keyListeners) {
    keyListeners = new Set();
    listeners.set(key, keyListeners);
  }
  keyListeners.add(listener);
  return () => {
    keyListeners.delete(listener);
  };
}
