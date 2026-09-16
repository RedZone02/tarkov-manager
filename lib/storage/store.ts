import { CLOUD_CACHE_PREFIX } from './defaults';
import { readStored, removeStoredByPrefix, subscribeStored, writeStored } from './local';

export type SyncStatus = 'idle' | 'loading' | 'saving' | 'error';

export type StoreSnapshot<T> = { value: T; status: SyncStatus; error: string | null };

export type ProgressStore<T> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => StoreSnapshot<T>;
  getServerSnapshot: () => StoreSnapshot<T>;
  update: (apply: (prev: T) => T, persist?: () => Promise<void>) => void;
};

type CloudStore<T> = ProgressStore<T> & {
  refresh: (force: boolean) => void;
  isActive: () => boolean;
  clearError: () => void;
  dispose: () => void;
};

const REFRESH_INTERVAL_MS = 15_000;

const localStores = new Map<string, ProgressStore<unknown>>();
const cloudStores = new Map<string, CloudStore<unknown>>();
const syncListeners = new Set<() => void>();
let windowListenersAttached = false;

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Something went wrong while syncing.';
}

function notifySync() {
  syncListeners.forEach((listener) => listener());
}

export function getLocalStore<T>(key: string, fallback: T): ProgressStore<T> {
  const existing = localStores.get(key) as ProgressStore<T> | undefined;
  if (existing) return existing;

  const serverSnapshot: StoreSnapshot<T> = { value: fallback, status: 'idle', error: null };
  let last = serverSnapshot;
  const store: ProgressStore<T> = {
    subscribe: (listener) => subscribeStored(key, listener),
    getSnapshot() {
      const value = readStored(key, fallback);
      if (value !== last.value) last = { value, status: 'idle', error: null };
      return last;
    },
    getServerSnapshot: () => serverSnapshot,
    update: (apply) => writeStored(key, apply(readStored(key, fallback))),
  };
  localStores.set(key, store as ProgressStore<unknown>);
  return store;
}

function createCloudStore<T>(key: string, fallback: T, load: () => Promise<T>): CloudStore<T> {
  const listeners = new Set<() => void>();
  const serverSnapshot: StoreSnapshot<T> = { value: fallback, status: 'loading', error: null };
  let base = readStored(key, fallback);
  let pending: { apply: (prev: T) => T }[] = [];
  let disposed = false;
  let loaded = false;
  let loadError: string | null = null;
  let saveError: string | null = null;
  let lastLoadedAt = 0;
  let refreshQueued = false;
  let queue: Promise<void> = Promise.resolve();

  function computeSnapshot(): StoreSnapshot<T> {
    const error = saveError ?? loadError;
    let status: SyncStatus = 'idle';
    if (error) status = 'error';
    else if (!loaded) status = 'loading';
    else if (pending.length > 0) status = 'saving';
    return { value: pending.reduce((value, op) => op.apply(value), base), status, error };
  }

  let snapshot = computeSnapshot();

  function emit() {
    snapshot = computeSnapshot();
    listeners.forEach((listener) => listener());
    notifySync();
  }

  function enqueue(task: () => Promise<void>) {
    queue = queue.then(task).catch((error) => console.error(error));
  }

  function refresh(force: boolean) {
    if (refreshQueued || disposed) return;
    if (!force && Date.now() - lastLoadedAt < REFRESH_INTERVAL_MS) return;
    refreshQueued = true;
    enqueue(async () => {
      refreshQueued = false;
      try {
        const value = await load();
        if (disposed) return;
        base = value;
        loaded = true;
        loadError = null;
        lastLoadedAt = Date.now();
        writeStored(key, base);
      } catch (error) {
        loadError = toErrorMessage(error);
      }
      emit();
    });
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      refresh(false);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    update(apply, persist) {
      const op = { apply };
      pending = [...pending, op];
      emit();
      enqueue(async () => {
        try {
          await persist?.();
          base = apply(base);
          saveError = null;
          if (!disposed) writeStored(key, base);
          if (!loaded) refresh(true);
        } catch (error) {
          saveError = `Couldn't save your last change: ${toErrorMessage(error)}`;
          refresh(true);
        } finally {
          pending = pending.filter((p) => p !== op);
          emit();
        }
      });
    },
    refresh,
    isActive: () => listeners.size > 0 || pending.length > 0,
    clearError() {
      saveError = null;
      loadError = null;
      emit();
    },
    dispose() {
      disposed = true;
      listeners.clear();
    },
  };
}

function refreshActiveStores() {
  cloudStores.forEach((store) => {
    if (store.isActive()) store.refresh(false);
  });
}

function attachWindowListeners() {
  if (windowListenersAttached) return;
  windowListenersAttached = true;
  window.addEventListener('focus', refreshActiveStores);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshActiveStores();
  });
}

export function getCloudStore<T>(key: string, fallback: T, load: () => Promise<T>): ProgressStore<T> {
  if (typeof window === 'undefined') {
    const serverSnapshot: StoreSnapshot<T> = { value: fallback, status: 'loading', error: null };
    return {
      subscribe: () => () => {},
      getSnapshot: () => serverSnapshot,
      getServerSnapshot: () => serverSnapshot,
      update: () => {},
    };
  }

  const existing = cloudStores.get(key) as CloudStore<T> | undefined;
  if (existing) return existing;

  attachWindowListeners();
  const store = createCloudStore(key, fallback, load);
  cloudStores.set(key, store as CloudStore<unknown>);
  return store;
}

export function refreshCloudStores() {
  cloudStores.forEach((store) => {
    store.clearError();
    store.refresh(true);
  });
}

export function resetCloudStores() {
  cloudStores.forEach((store) => store.dispose());
  cloudStores.clear();
  removeStoredByPrefix(CLOUD_CACHE_PREFIX);
  notifySync();
}

export type OverallSyncStatus = 'idle' | 'syncing' | 'error';

export function subscribeSyncStatus(listener: () => void) {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
}

export function getOverallSyncStatus(): OverallSyncStatus {
  let status: OverallSyncStatus = 'idle';
  for (const store of cloudStores.values()) {
    if (!store.isActive()) continue;
    const current = store.getSnapshot().status;
    if (current === 'error') return 'error';
    if (current !== 'idle') status = 'syncing';
  }
  return status;
}

export function getSyncErrorMessage(): string | null {
  for (const store of cloudStores.values()) {
    if (!store.isActive()) continue;
    const { error } = store.getSnapshot();
    if (error) return error;
  }
  return null;
}
