import { computed, ref, watch } from "vue";

import { storageGet, storageSet } from "@/services/storage";
import {
  createWeatherCacheKey,
  detectIpLocation,
  fetchWeatherForecast,
  isWeatherCacheRecord,
  resolveLocalizedIpLocation,
  searchLocations
} from "@/services/weather";
import type { LocationOption, WeatherPayload } from "@/types/weather";
import { getLocationLabel } from "@/utils/date";

const STORAGE_KEYS = {
  location: "weather.location",
  noticeDismissed: "weather.noticeDismissed"
} as const;

const WEATHER_CACHE_TTL = 10 * 60 * 1000;

function createWeatherStore() {
  const location = ref<LocationOption | null>(null);
  const weather = ref<WeatherPayload | null>(null);
  const isLoading = ref(true);
  const isRefreshing = ref(false);
  const error = ref("");
  const noticeDismissed = ref(false);
  const editorOpen = ref(false);
  const searchQuery = ref("");
  const searchResults = ref<LocationOption[]>([]);
  const searchMessage = ref("输入 2 个字以上即可开始搜索。");
  const isSearching = ref(false);
  const isInitialized = ref(false);

  let searchTimer: number | null = null;

  const locationLabel = computed(() =>
    location.value ? getLocationLabel(location.value) : "正在定位当前城市"
  );

  const sourceLabel = computed(() => (location.value?.source === "ip" ? "按当前 IP 自动定位" : "固定城市天气"));
  const showNotice = computed(() => location.value?.source === "ip" && !noticeDismissed.value);

  async function initialize() {
    if (isInitialized.value) {
      return;
    }

    isLoading.value = true;
    error.value = "";

    try {
      const stored = await storageGet<Record<string, unknown>>([
        STORAGE_KEYS.location,
        STORAGE_KEYS.noticeDismissed
      ]);

      location.value = (stored[STORAGE_KEYS.location] as LocationOption | undefined) ?? null;
      noticeDismissed.value = Boolean(stored[STORAGE_KEYS.noticeDismissed]);

      if (!location.value) {
        const detected = await detectIpLocation();
        location.value = await resolveLocalizedIpLocation(detected);
        await storageSet({
          [STORAGE_KEYS.location]: location.value,
          [STORAGE_KEYS.noticeDismissed]: false
        });
        noticeDismissed.value = false;
      }

      await loadWeather();
      isInitialized.value = true;
    } catch (caughtError) {
      error.value = "天气服务暂时不可用，请稍后刷新重试。";
    } finally {
      isLoading.value = false;
    }
  }

  async function loadWeather(force = false) {
    if (!location.value) {
      return;
    }

    const cacheKey = createWeatherCacheKey(location.value);
    if (force) {
      isRefreshing.value = true;
    }

    try {
      const cached = force
        ? undefined
        : (await storageGet<Record<string, unknown>>(cacheKey))[cacheKey];

      if (isWeatherCacheRecord(cached) && Date.now() - cached.savedAt < WEATHER_CACHE_TTL) {
        weather.value = cached.payload;
        error.value = "";
        return;
      }

      if (isWeatherCacheRecord(cached)) {
        weather.value = cached.payload;
      }

      const payload = await fetchWeatherForecast(location.value);
      weather.value = payload;
      error.value = "";

      await storageSet({
        [cacheKey]: {
          savedAt: Date.now(),
          payload
        }
      });
    } catch (caughtError) {
      if (!weather.value) {
        error.value = "天气数据加载失败，请检查网络后再试。";
      }
    } finally {
      isRefreshing.value = false;
    }
  }

  async function dismissNotice() {
    noticeDismissed.value = true;
    await storageSet({
      [STORAGE_KEYS.noticeDismissed]: true
    });
  }

  function openEditor() {
    editorOpen.value = true;
  }

  function closeEditor() {
    editorOpen.value = false;
  }

  async function chooseLocation(option: LocationOption) {
    location.value = {
      ...option,
      source: "custom"
    };
    noticeDismissed.value = true;
    editorOpen.value = false;

    await storageSet({
      [STORAGE_KEYS.location]: location.value,
      [STORAGE_KEYS.noticeDismissed]: true
    });

    await loadWeather(true);
  }

  async function performSearch(keyword: string) {
    const query = keyword.trim();

    if (query.length < 2) {
      searchResults.value = [];
      searchMessage.value = "输入 2 个字以上即可开始搜索。";
      return;
    }

    isSearching.value = true;
    searchMessage.value = "正在搜索城市...";

    try {
      const results = await searchLocations(query);
      searchResults.value = results;

      if (results.length === 0) {
        searchMessage.value = "没有找到匹配结果，可以换个更完整的地名再试。";
      } else {
        searchMessage.value = `找到 ${results.length} 个结果，点击即可切换。`;
      }
    } catch (caughtError) {
      searchResults.value = [];
      searchMessage.value = "城市搜索失败，请稍后再试。";
    } finally {
      isSearching.value = false;
    }
  }

  function useQuickCity(city: string) {
    searchQuery.value = city;
  }

  watch(searchQuery, (value) => {
    if (searchTimer !== null) {
      window.clearTimeout(searchTimer);
    }

    searchTimer = window.setTimeout(() => {
      void performSearch(value);
    }, 260);
  });

  return {
    location,
    locationLabel,
    sourceLabel,
    weather,
    isLoading,
    isRefreshing,
    error,
    showNotice,
    editorOpen,
    searchQuery,
    searchResults,
    searchMessage,
    isSearching,
    initialize,
    loadWeather,
    dismissNotice,
    openEditor,
    closeEditor,
    chooseLocation,
    useQuickCity
  };
}

let weatherStore: ReturnType<typeof createWeatherStore> | null = null;

export function useWeather() {
  if (!weatherStore) {
    weatherStore = createWeatherStore();
  }

  return weatherStore;
}
