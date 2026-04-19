import { ref, watch } from "vue";

import { storageGet, storageSet } from "@/services/storage";

const STORAGE_KEY = "wallpaper";
const PICSUM_BASE = "https://picsum.photos/1920/1080";

interface WallpaperState {
  currentUrl: string | null;
}

function preloadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = reject;
    img.src = url;
  });
}

function randomPicsumUrl() {
  return `${PICSUM_BASE}?t=${Date.now()}`;
}

function createWallpaperStore() {
  const currentUrl = ref<string | null>(null);
  const nextUrl = ref<string | null>(null);
  const isTransitioning = ref(false);

  async function initialize() {
    const data = await storageGet<Record<string, WallpaperState | undefined>>({
      [STORAGE_KEY]: undefined,
    });
    const saved = data[STORAGE_KEY];
    if (saved?.currentUrl) {
      currentUrl.value = saved.currentUrl;
    }
    prefetchNext();
  }

  function prefetchNext() {
    const url = randomPicsumUrl();
    preloadImage(url)
      .then(() => {
        nextUrl.value = url;
      })
      .catch(() => {
        // silently ignore prefetch failures
      });
  }

  async function switchWallpaper() {
    if (isTransitioning.value) return;
    isTransitioning.value = true;

    try {
      let url: string;
      if (nextUrl.value) {
        url = nextUrl.value;
        nextUrl.value = null;
      } else {
        url = await preloadImage(randomPicsumUrl());
      }

      currentUrl.value = url;
      prefetchNext();
    } catch {
      // fetch failed, try again
      try {
        const url = await preloadImage(randomPicsumUrl());
        currentUrl.value = url;
        prefetchNext();
      } catch {
        // network issue, do nothing
      }
    } finally {
      isTransitioning.value = false;
    }
  }

  function clearWallpaper() {
    currentUrl.value = null;
    nextUrl.value = null;
  }

  watch(currentUrl, (url) => {
    void storageSet({ [STORAGE_KEY]: { currentUrl: url } satisfies WallpaperState });
  });

  return {
    currentUrl,
    isTransitioning,
    initialize,
    switchWallpaper,
    clearWallpaper,
  };
}

let store: ReturnType<typeof createWallpaperStore> | null = null;

export function useWallpaper() {
  if (!store) {
    store = createWallpaperStore();
  }
  return store;
}
