import { computed, ref, watch } from "vue";

import { storageGet, storageSet } from "@/services/storage";
import type { AddSiteResult, SiteHistoryResult, SiteShortcut } from "@/types/sites";

const ITEMS_KEY = "sites.items";
const MAX_SITES = 16;
const HISTORY_PERMISSIONS: chrome.permissions.Permissions = {
  permissions: ["history", "favicon"]
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function hasPermissionsApi() {
  return Boolean(globalThis.chrome?.permissions);
}

function hasHistoryApi() {
  return Boolean(globalThis.chrome?.history);
}

function hasRuntimeApi() {
  return Boolean(globalThis.chrome?.runtime?.id && globalThis.chrome?.runtime?.getURL);
}

function stripWww(hostname: string) {
  return hostname.replace(/^www\./i, "");
}

function toHttpUrl(value: string) {
  const input = value.trim();
  if (!input) {
    return null;
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(input) ? input : `https://${input}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function toSiteRoot(url: URL) {
  return new URL("/", url).toString();
}

function deriveSiteName(url: URL, preferred?: string) {
  const cleaned = preferred?.trim();
  if (cleaned) {
    return cleaned;
  }

  const hostname = stripWww(url.hostname);
  const primary = hostname.split(".")[0] ?? hostname;
  if (!primary) {
    return hostname;
  }

  return primary.charAt(0).toUpperCase() + primary.slice(1);
}

function getHostKey(value: string) {
  const parsed = toHttpUrl(value);
  return parsed ? stripWww(parsed.hostname.toLowerCase()) : null;
}

function sanitizeStoredItems(payload: unknown) {
  if (!Array.isArray(payload)) {
    return [] as SiteShortcut[];
  }

  return payload
    .filter((item): item is Partial<SiteShortcut> => typeof item === "object" && item !== null)
    .map((item, index) => {
      const parsed = toHttpUrl(item.url ?? "");
      if (!parsed) {
        return null;
      }

      return {
        id: typeof item.id === "string" ? item.id : generateId(),
        name: deriveSiteName(parsed, typeof item.name === "string" ? item.name : undefined),
        url: parsed.toString(),
        hostname: stripWww(parsed.hostname),
        addedAt: typeof item.addedAt === "string" ? item.addedAt : new Date().toISOString(),
        order: typeof item.order === "number" ? item.order : index
      } satisfies SiteShortcut;
    })
    .filter((item): item is SiteShortcut => Boolean(item))
    .sort((left, right) => left.order - right.order)
    .slice(0, MAX_SITES)
    .map((item, index) => ({ ...item, order: index }));
}

function permissionsContains(permissions: chrome.permissions.Permissions) {
  if (!hasPermissionsApi()) {
    return Promise.resolve(false);
  }

  return new Promise<boolean>((resolve) => {
    chrome.permissions.contains(permissions, (granted) => {
      resolve(Boolean(granted));
    });
  });
}

function permissionsRequest(permissions: chrome.permissions.Permissions) {
  if (!hasPermissionsApi()) {
    return Promise.resolve(false);
  }

  return new Promise<boolean>((resolve) => {
    chrome.permissions.request(permissions, (granted) => {
      resolve(Boolean(granted));
    });
  });
}

function chromeHistorySearch(options: chrome.history.HistoryQuery) {
  if (!hasHistoryApi()) {
    return Promise.resolve([] as chrome.history.HistoryItem[]);
  }

  return new Promise<chrome.history.HistoryItem[]>((resolve, reject) => {
    chrome.history.search(options, (items) => {
      if (chrome.runtime?.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(items ?? []);
    });
  });
}

function preferHistoryResult(next: SiteHistoryResult, current: SiteHistoryResult) {
  const nextHttps = Number(next.url.startsWith("https://"));
  const currentHttps = Number(current.url.startsWith("https://"));
  if (nextHttps !== currentHttps) {
    return nextHttps > currentHttps;
  }

  const nextVisits = next.visitCount ?? 0;
  const currentVisits = current.visitCount ?? 0;
  if (nextVisits !== currentVisits) {
    return nextVisits > currentVisits;
  }

  const nextTime = next.lastVisitTime ?? 0;
  const currentTime = current.lastVisitTime ?? 0;
  if (nextTime !== currentTime) {
    return nextTime > currentTime;
  }

  return next.sourceUrl.length < current.sourceUrl.length;
}

function sortHistoryResults(items: SiteHistoryResult[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  return [...items].sort((left, right) => {
    if (normalizedQuery) {
      const leftExact = Number(left.hostname.toLowerCase().includes(normalizedQuery) || left.title.toLowerCase().includes(normalizedQuery));
      const rightExact = Number(right.hostname.toLowerCase().includes(normalizedQuery) || right.title.toLowerCase().includes(normalizedQuery));
      if (leftExact !== rightExact) {
        return rightExact - leftExact;
      }

      const visitDiff = (right.visitCount ?? 0) - (left.visitCount ?? 0);
      if (visitDiff !== 0) {
        return visitDiff;
      }
    }

    const recencyDiff = (right.lastVisitTime ?? 0) - (left.lastVisitTime ?? 0);
    if (recencyDiff !== 0) {
      return recencyDiff;
    }

    return (right.visitCount ?? 0) - (left.visitCount ?? 0);
  });
}

function toHistoryResult(item: chrome.history.HistoryItem) {
  if (!item.url) {
    return null;
  }

  const parsed = toHttpUrl(item.url);
  if (!parsed) {
    return null;
  }

  if (
    (parsed.hostname.includes("google.") && parsed.pathname === "/search") ||
    (parsed.hostname.includes("bing.com") && parsed.pathname === "/search")
  ) {
    return null;
  }

  return {
    url: toSiteRoot(parsed),
    sourceUrl: parsed.toString(),
    hostname: stripWww(parsed.hostname),
    title: deriveSiteName(parsed, item.title),
    lastVisitTime: item.lastVisitTime,
    visitCount: item.visitCount
  } satisfies SiteHistoryResult;
}

export function createSiteFaviconUrl(url: string) {
  if (!hasRuntimeApi()) {
    return "";
  }

  const favicon = new URL(chrome.runtime.getURL("/_favicon/"));
  favicon.searchParams.set("pageUrl", url);
  favicon.searchParams.set("size", "64");
  return favicon.toString();
}

function createSitesStore() {
  const items = ref<SiteShortcut[]>([]);
  const isHydrated = ref(false);
  const historyPermissionGranted = ref(false);
  const isCheckingPermission = ref(false);
  const isRequestingPermission = ref(false);
  const historyResults = ref<SiteHistoryResult[]>([]);
  const isSearchingHistory = ref(false);
  const historyMessage = ref("输入站点名或域名，快速从浏览历史里添加。");

  async function initialize() {
    const stored = await storageGet<Record<string, unknown>>({
      [ITEMS_KEY]: null
    });

    items.value = sanitizeStoredItems(stored[ITEMS_KEY]);
    historyPermissionGranted.value = await refreshHistoryPermission();
    isHydrated.value = true;
  }

  async function refreshHistoryPermission() {
    if (!hasPermissionsApi() || !hasHistoryApi()) {
      historyPermissionGranted.value = false;
      return false;
    }

    isCheckingPermission.value = true;
    try {
      const granted = await permissionsContains(HISTORY_PERMISSIONS);
      historyPermissionGranted.value = granted;
      return granted;
    } finally {
      isCheckingPermission.value = false;
    }
  }

  async function ensureHistoryPermission() {
    if (!hasPermissionsApi() || !hasHistoryApi()) {
      historyMessage.value = "当前环境不支持浏览历史搜索，请在扩展页面中使用。";
      historyPermissionGranted.value = false;
      return false;
    }

    if (historyPermissionGranted.value) {
      return true;
    }

    isRequestingPermission.value = true;
    try {
      const granted = await permissionsRequest(HISTORY_PERMISSIONS);
      historyPermissionGranted.value = granted;
      historyMessage.value = granted
        ? "已授权浏览历史访问。"
        : "未授予浏览历史权限，仍可手动输入网址添加。";
      return granted;
    } finally {
      isRequestingPermission.value = false;
    }
  }

  function addSite(urlValue: string, preferredName?: string): AddSiteResult {
    const parsed = toHttpUrl(urlValue);
    if (!parsed) {
      return { ok: false, reason: "invalid-url" };
    }

    const normalizedHostname = stripWww(parsed.hostname.toLowerCase());
    const hasDuplicate = items.value.some((item) => item.hostname.toLowerCase() === normalizedHostname);
    if (hasDuplicate) {
      return { ok: false, reason: "duplicate" };
    }

    if (items.value.length >= MAX_SITES) {
      return { ok: false, reason: "limit" };
    }

    const nextItem: SiteShortcut = {
      id: generateId(),
      name: deriveSiteName(parsed, preferredName),
      url: parsed.toString(),
      hostname: stripWww(parsed.hostname),
      addedAt: new Date().toISOString(),
      order: items.value.length
    };

    items.value = [...items.value, nextItem];
    return { ok: true, item: nextItem };
  }

  function addHistorySite(item: SiteHistoryResult) {
    return addSite(item.url, item.title);
  }

  function removeSite(id: string) {
    items.value = items.value
      .filter((item) => item.id !== id)
      .map((item, index) => ({ ...item, order: index }));
  }

  async function searchHistory(query: string) {
    const trimmed = query.trim();

    if (!historyPermissionGranted.value) {
      historyResults.value = [];
      historyMessage.value = hasPermissionsApi()
        ? "点击授权后即可从浏览历史中搜索网站。"
        : "当前环境不支持浏览历史搜索。";
      return;
    }

    isSearchingHistory.value = true;

    try {
      const rawItems = await chromeHistorySearch({
        text: trimmed,
        startTime: 0,
        maxResults: trimmed ? 160 : 80
      });

      const deduped = new Map<string, SiteHistoryResult>();

      rawItems.forEach((item) => {
        const result = toHistoryResult(item);
        if (!result) {
          return;
        }

        const key = result.hostname.toLowerCase();
        const existing = deduped.get(key);
        if (!existing || preferHistoryResult(result, existing)) {
          deduped.set(key, result);
        }
      });

      const filtered = sortHistoryResults([...deduped.values()], trimmed).slice(0, 24);
      historyResults.value = filtered;
      historyMessage.value = filtered.length
        ? `找到 ${filtered.length} 个可添加的网站`
        : trimmed
          ? "没有找到匹配的网站，试试域名关键词，或者直接手动添加。"
          : "这里会显示最近访问过的网站。";
    } catch (error) {
      historyResults.value = [];
      historyMessage.value = error instanceof Error
        ? `历史记录搜索失败：${error.message}`
        : "历史记录搜索失败，请稍后重试。";
    } finally {
      isSearchingHistory.value = false;
    }
  }

  const itemCount = computed(() => items.value.length);
  const canAddMore = computed(() => items.value.length < MAX_SITES);
  const historySupported = computed(() => hasPermissionsApi() && hasHistoryApi());

  watch(
    items,
    (value) => {
      if (!isHydrated.value) {
        return;
      }

      const plain = value.map((item) => ({ ...item }));
      void storageSet({ [ITEMS_KEY]: plain });
    },
    { deep: true }
  );

  void initialize();

  return {
    items,
    itemCount,
    isHydrated,
    canAddMore,
    historySupported,
    historyPermissionGranted,
    isCheckingPermission,
    isRequestingPermission,
    historyResults,
    isSearchingHistory,
    historyMessage,
    maxSites: MAX_SITES,
    initialize,
    refreshHistoryPermission,
    ensureHistoryPermission,
    searchHistory,
    addSite,
    addHistorySite,
    removeSite,
    createFaviconUrl: createSiteFaviconUrl
  };
}

let sitesStore: ReturnType<typeof createSitesStore> | null = null;

export function useSites() {
  if (!sitesStore) {
    sitesStore = createSitesStore();
  }

  return sitesStore;
}

export function getNormalizedSiteHostname(value: string) {
  return getHostKey(value);
}
