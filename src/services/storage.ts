const STORAGE_PREFIX = "fresh-new-tab:";

type StorageKeys = string | string[] | Record<string, unknown> | null | undefined;

function hasChromeStorage() {
  return Boolean(globalThis.chrome?.storage?.local);
}

function readLocalStorageValue(key: string) {
  const rawValue = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  if (rawValue === null) {
    return undefined;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

function fallbackGet(keys: StorageKeys) {
  if (keys == null) {
    const values: Record<string, unknown> = {};

    for (let index = 0; index < localStorage.length; index += 1) {
      const localKey = localStorage.key(index);
      if (!localKey || !localKey.startsWith(STORAGE_PREFIX)) {
        continue;
      }

      const storageKey = localKey.slice(STORAGE_PREFIX.length);
      values[storageKey] = readLocalStorageValue(storageKey);
    }

    return values;
  }

  if (typeof keys === "string") {
    return { [keys]: readLocalStorageValue(keys) };
  }

  if (Array.isArray(keys)) {
    return Object.fromEntries(keys.map((key) => [key, readLocalStorageValue(key)]));
  }

  return Object.fromEntries(
    Object.entries(keys).map(([key, fallbackValue]) => {
      const storedValue = readLocalStorageValue(key);
      return [key, storedValue === undefined ? fallbackValue : storedValue];
    })
  );
}

export function storageGet<T = Record<string, unknown>>(keys: StorageKeys) {
  if (!hasChromeStorage()) {
    return Promise.resolve(fallbackGet(keys) as T);
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
    Object.entries(items).forEach(([key, value]) => {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    });
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
