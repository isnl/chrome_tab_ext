import { ref, watch } from "vue";

import { storageGet, storageSet } from "@/services/storage";

const STORAGE_KEY = "wallpaper";
const PICSUM_BASE = "https://picsum.photos";
const MIN_WALLPAPER_WIDTH = 3840;
const MIN_WALLPAPER_HEIGHT = 2160;
const ULTRA_WALLPAPER_WIDTH = 4096;
const ULTRA_WALLPAPER_HEIGHT = 2304;
const MAX_DEVICE_PIXEL_RATIO = 2;

interface WallpaperState {
  currentUrl: string | null;
}

interface WallpaperCandidate {
  url: string;
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getViewportSize() {
  return {
    width: Math.max(globalThis.innerWidth || 0, globalThis.screen?.width || 0, 1920),
    height: Math.max(globalThis.innerHeight || 0, globalThis.screen?.height || 0, 1080),
  };
}

function getWallpaperDimensions() {
  const viewport = getViewportSize();
  const pixelRatio = clamp(globalThis.devicePixelRatio || 1, 1, MAX_DEVICE_PIXEL_RATIO);
  const targetWidth = Math.ceil(viewport.width * pixelRatio);
  const targetHeight = Math.ceil(viewport.height * pixelRatio);

  if (targetWidth > MIN_WALLPAPER_WIDTH || targetHeight > MIN_WALLPAPER_HEIGHT) {
    return {
      width: ULTRA_WALLPAPER_WIDTH,
      height: ULTRA_WALLPAPER_HEIGHT,
    };
  }

  return {
    width: MIN_WALLPAPER_WIDTH,
    height: MIN_WALLPAPER_HEIGHT,
  };
}

function createWallpaperSeed() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function createPicsumWallpaperCandidate(): WallpaperCandidate {
  const dimensions = getWallpaperDimensions();
  const seed = encodeURIComponent(createWallpaperSeed());

  return {
    ...dimensions,
    url: `${PICSUM_BASE}/seed/${seed}/${dimensions.width}/${dimensions.height}`,
  };
}

function createFallbackWallpaperCandidate(): WallpaperCandidate {
  const seed = encodeURIComponent(createWallpaperSeed());

  return {
    width: MIN_WALLPAPER_WIDTH,
    height: MIN_WALLPAPER_HEIGHT,
    url: `${PICSUM_BASE}/seed/${seed}/${MIN_WALLPAPER_WIDTH}/${MIN_WALLPAPER_HEIGHT}`,
  };
}

function getPicsumDimensions(url: string) {
  const match = url.match(/picsum\.photos\/(?:seed\/[^/]+\/)?(\d+)\/(\d+)/);
  if (!match) {
    return null;
  }

  return {
    width: Number(match[1]),
    height: Number(match[2]),
  };
}

function isLowResolutionWallpaper(url: string) {
  const dimensions = getPicsumDimensions(url);
  return Boolean(
    dimensions &&
      (dimensions.width < MIN_WALLPAPER_WIDTH || dimensions.height < MIN_WALLPAPER_HEIGHT)
  );
}

function preloadImage(candidate: WallpaperCandidate): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (img.naturalWidth < candidate.width || img.naturalHeight < candidate.height) {
        reject(new Error("Wallpaper image is smaller than requested."));
        return;
      }

      resolve(candidate.url);
    };
    img.onerror = reject;
    img.src = candidate.url;
  });
}

async function preloadWallpaper() {
  const candidates = [createPicsumWallpaperCandidate()];

  if (
    candidates[0].width !== MIN_WALLPAPER_WIDTH ||
    candidates[0].height !== MIN_WALLPAPER_HEIGHT
  ) {
    candidates.push(createFallbackWallpaperCandidate());
  }

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return await preloadImage(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function createWallpaperStore() {
  const currentUrl = ref<string | null>(null);
  const nextUrl = ref<string | null>(null);
  const isTransitioning = ref(false);
  let prefetchToken = 0;

  async function initialize() {
    const data = await storageGet<Record<string, WallpaperState | undefined>>({
      [STORAGE_KEY]: undefined,
    });
    const saved = data[STORAGE_KEY];
    if (saved?.currentUrl) {
      currentUrl.value = saved.currentUrl;
    }

    if (saved?.currentUrl && isLowResolutionWallpaper(saved.currentUrl)) {
      void switchWallpaper();
      return;
    }

    prefetchNext();
  }

  function prefetchNext() {
    const token = ++prefetchToken;

    preloadWallpaper()
      .then((url) => {
        if (token === prefetchToken) {
          nextUrl.value = url;
        }
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
        url = await preloadWallpaper();
      }

      currentUrl.value = url;
      prefetchNext();
    } catch {
      // fetch failed, try again
      try {
        const url = await preloadWallpaper();
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
