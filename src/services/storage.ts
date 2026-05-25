// In-memory fallback for non-extension environments (dev). Only used for auth keys.
const memoryStore: Record<string, unknown> = {};

function hasChromeStorage() {
  return Boolean(globalThis.chrome?.storage?.local);
}

type StorageKeys = string | string[] | Record<string, unknown> | null | undefined;

export function storageGet<T = Record<string, unknown>>(keys: StorageKeys) {
  if (!hasChromeStorage()) {
    if (keys == null) return Promise.resolve(memoryStore as T);
    if (typeof keys === "string") return Promise.resolve({ [keys]: memoryStore[keys] } as T);
    if (Array.isArray(keys)) return Promise.resolve(Object.fromEntries(keys.map((k) => [k, memoryStore[k]])) as T);
    return Promise.resolve(
      Object.fromEntries(
        Object.entries(keys).map(([k, fallback]) => [k, k in memoryStore ? memoryStore[k] : fallback])
      ) as T
    );
  }

  return new Promise<T>((resolve, reject) => {
    chrome.storage.local.get(keys as never, (result) => {
      if (chrome.runtime?.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result as T);
    });
  });
}

export function storageSet(items: Record<string, unknown>) {
  if (!hasChromeStorage()) {
    Object.assign(memoryStore, items);
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      if (chrome.runtime?.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}
