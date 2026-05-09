import { computed, ref } from "vue";

const BOOKMARK_PERMISSIONS: chrome.permissions.Permissions = {
  permissions: ["bookmarks"]
};

const DEFAULT_MESSAGE = "打开书签搜索后，会从浏览器收藏夹中检索相关链接。";

export interface BookmarkSearchItem {
  id: string;
  title: string;
  url: string;
  path: string[];
  parentFolder: string;
  folderPath: string;
  hostname: string;
  dateAdded?: number;
  score: number;
}

export interface BookmarkSearchResponse {
  query: string;
  items: BookmarkSearchItem[];
  total: number;
  matched: number;
  expanded: boolean;
  error?: string;
}

const GENERIC_QUERY_TOKENS = new Set([
  "帮我",
  "找一",
  "一下",
  "相关",
  "书签",
  "收藏",
  "网站",
  "链接",
  "资料",
  "看看",
  "有没有",
  "推荐",
  "关于",
  "这个",
  "那个",
  "里面",
  "浏览器"
]);

const QUERY_ALIASES: Record<string, string[]> = {
  ai: ["人工智能", "大模型", "llm", "gpt", "claude", "deepseek", "kimi", "豆包", "chat"],
  chat: ["聊天", "对话", "gpt", "chatgpt", "claude", "deepseek", "kimi"],
  聊天: ["chat", "对话", "gpt", "chatgpt", "claude", "deepseek", "kimi"],
  对话: ["chat", "聊天", "gpt", "chatgpt", "claude", "deepseek", "kimi"],
  模型: ["model", "llm", "gpt", "claude", "deepseek", "kimi"],
  画图: ["绘图", "绘画", "图像", "image", "midjourney", "stable", "diffusion"],
  绘画: ["画图", "绘图", "图像", "image", "midjourney", "stable", "diffusion"]
};

function hasRuntimeApi() {
  return Boolean(globalThis.chrome?.runtime?.id);
}

function hasPermissionsApi() {
  return Boolean(globalThis.chrome?.permissions);
}

function hasBookmarksApi() {
  return Boolean(globalThis.chrome?.bookmarks);
}

function canRequestBookmarkPermission() {
  return hasPermissionsApi();
}

function permissionsContains(permissions: chrome.permissions.Permissions) {
  if (!hasPermissionsApi()) {
    return Promise.resolve(false);
  }

  return new Promise<boolean>((resolve) => {
    chrome.permissions.contains(permissions, (granted) => {
      if (chrome.runtime?.lastError) {
        resolve(false);
        return;
      }

      resolve(Boolean(granted));
    });
  });
}

function permissionsRequest(permissions: chrome.permissions.Permissions) {
  if (!hasPermissionsApi()) {
    return Promise.resolve(false);
  }

  return new Promise<boolean>((resolve, reject) => {
    chrome.permissions.request(permissions, (granted) => {
      if (chrome.runtime?.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(Boolean(granted));
    });
  });
}

function describePermissionRequestError(message: string) {
  if (/Only permissions specified in the manifest may be requested/i.test(message)) {
    return "扩展清单尚未生效：请打开 chrome://extensions，点击“晴窗新标签”的重新加载，然后回到新标签页再开启书签搜索。";
  }

  return `书签权限请求失败：${message}`;
}

function chromeBookmarksGetTree() {
  if (!hasBookmarksApi()) {
    return Promise.reject(new Error("当前页面无法访问 Chrome 书签 API"));
  }

  return new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
    chrome.bookmarks.getTree((nodes) => {
      if (chrome.runtime?.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(nodes ?? []);
    });
  });
}

function normalizeText(value: string) {
  const trimmed = value.trim().toLowerCase();

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function tokenize(value: string) {
  const normalized = normalizeText(value);
  const splitTokens = normalized
    .split(/[\s/\\?&#=.:;,_+\-()[\]{}"'“”‘’|<>]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
  const asciiTokens = normalized.match(/[a-z0-9][a-z0-9.-]{1,}/g) ?? [];
  const cjkTokens = createCjkTokens(normalized);
  const tokens = [...new Set([...splitTokens, ...asciiTokens, ...cjkTokens])]
    .filter((token) => !GENERIC_QUERY_TOKENS.has(token))
    .slice(0, 48);

  return [...new Set(tokens.flatMap((token) => [token, ...(QUERY_ALIASES[token] ?? [])]))];
}

function createCjkTokens(value: string) {
  const segments = value.match(/[\u3400-\u9fff]+/g) ?? [];
  const tokens: string[] = [];

  for (const segment of segments) {
    if (segment.length <= 4) {
      tokens.push(segment);
      continue;
    }

    for (let length = 2; length <= 4; length += 1) {
      for (let index = 0; index <= segment.length - length; index += 1) {
        tokens.push(segment.slice(index, index + length));
      }
    }
  }

  return tokens;
}

function safeHostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function scoreField(field: string, query: string, tokens: string[], weight: number) {
  if (!field) {
    return 0;
  }

  const normalizedField = normalizeText(field);
  let score = 0;

  if (normalizedField === query) {
    score += weight * 2.4;
  } else if (normalizedField.includes(query)) {
    score += weight;
  }

  for (const token of tokens) {
    if (normalizedField === token) {
      score += weight * 0.9;
    } else if (normalizedField.includes(token)) {
      score += weight * 0.45;
    }
  }

  return score;
}

function recencyBoost(dateAdded?: number) {
  if (!dateAdded) {
    return 0;
  }

  const ageDays = Math.max(0, (Date.now() - dateAdded) / 86_400_000);
  return Math.max(0, 8 - Math.log2(ageDays + 1));
}

function scoreBookmark(item: Omit<BookmarkSearchItem, "score">, query: string) {
  const normalizedQuery = normalizeText(query);
  const tokens = tokenize(query);

  if (!normalizedQuery) {
    return recencyBoost(item.dateAdded);
  }

  const pathText = item.path.join(" / ");
  const combined = `${item.title} ${item.hostname} ${item.url} ${pathText}`;
  let score = 0;

  score += scoreField(item.title, normalizedQuery, tokens, 90);
  score += scoreField(item.hostname, normalizedQuery, tokens, 72);
  score += scoreField(item.url, normalizedQuery, tokens, 46);
  score += scoreField(pathText, normalizedQuery, tokens, 32);
  score += scoreField(combined, normalizedQuery, tokens, 10);

  if (score <= 0) {
    return 0;
  }

  return score + recencyBoost(item.dateAdded);
}

function flattenBookmarks(nodes: chrome.bookmarks.BookmarkTreeNode[], path: string[] = []) {
  const items: Omit<BookmarkSearchItem, "score">[] = [];

  for (const node of nodes) {
    const title = node.title?.trim() ?? "";
    const nextPath = title && !node.url ? [...path, title] : path;

    if (node.url) {
      items.push({
        id: node.id,
        title: title || node.url,
        url: node.url,
        path,
        parentFolder: path.at(-1) ?? "未分组",
        folderPath: path.join(" / ") || "未分组",
        hostname: safeHostname(node.url),
        dateAdded: node.dateAdded
      });
    }

    if (node.children?.length) {
      items.push(...flattenBookmarks(node.children, nextPath));
    }
  }

  return items;
}

function rankBookmarks(items: Omit<BookmarkSearchItem, "score">[], query: string) {
  return items
    .map((item) => ({
      ...item,
      score: scoreBookmark(item, query)
    }))
    .sort((left, right) => {
      const scoreDiff = right.score - left.score;
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return (right.dateAdded ?? 0) - (left.dateAdded ?? 0);
    });
}

function createBookmarkSearchStore() {
  const permissionGranted = ref(false);
  const isHydrated = ref(false);
  const isCheckingPermission = ref(false);
  const isRequestingPermission = ref(false);
  const isSearching = ref(false);
  const message = ref(DEFAULT_MESSAGE);
  const lastResults = ref<BookmarkSearchItem[]>([]);
  let hydrationPromise: Promise<void> | null = null;

  const supported = computed(() => canRequestBookmarkPermission());

  async function refreshPermission() {
    if (!canRequestBookmarkPermission()) {
      permissionGranted.value = false;
      return false;
    }

    isCheckingPermission.value = true;
    try {
      const granted = await permissionsContains(BOOKMARK_PERMISSIONS);
      permissionGranted.value = granted;
      return granted;
    } finally {
      isCheckingPermission.value = false;
    }
  }

  async function initialize() {
    if (hydrationPromise) {
      return hydrationPromise;
    }

    hydrationPromise = (async () => {
      await refreshPermission();
      isHydrated.value = true;
    })();

    return hydrationPromise;
  }

  async function ensurePermission() {
    if (!canRequestBookmarkPermission()) {
      message.value = hasRuntimeApi()
        ? "当前扩展环境无法请求书签权限，请重新加载扩展后重试。"
        : "当前页面不是 Chrome 扩展页，请在已加载的扩展新标签页中使用。";
      permissionGranted.value = false;
      return false;
    }

    if (permissionGranted.value) {
      return true;
    }

    isRequestingPermission.value = true;
    try {
      const granted = await permissionsRequest(BOOKMARK_PERMISSIONS);
      permissionGranted.value = granted;
      message.value = granted ? "已授权书签搜索。" : "未授予书签权限，书签搜索已关闭。";
      return granted;
    } catch (error) {
      const detail = error instanceof Error ? error.message : "未知错误";
      permissionGranted.value = false;
      message.value = describePermissionRequestError(detail);
      return false;
    } finally {
      isRequestingPermission.value = false;
    }
  }

  async function searchBookmarks(query: string): Promise<BookmarkSearchResponse> {
    const trimmed = query.trim();

    if (!permissionGranted.value) {
      message.value = "请先打开书签搜索并授权访问收藏夹。";
      lastResults.value = [];
      return {
        query: trimmed,
        items: [],
        total: 0,
        matched: 0,
        expanded: false,
        error: message.value
      };
    }

    isSearching.value = true;

    try {
      const tree = await chromeBookmarksGetTree();
      const flattened = flattenBookmarks(tree);
      const items = rankBookmarks(flattened, trimmed);
      const matched = items.filter((item) => item.score > 0).length;

      lastResults.value = items;
      message.value = items.length
        ? `已读取全部 ${items.length} 条书签，直接命中 ${matched} 条。`
        : "没有找到可用书签。";

      return {
        query: trimmed,
        items,
        total: flattened.length,
        matched,
        expanded: false
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "书签搜索失败，请稍后重试。";
      message.value = errorMessage;
      lastResults.value = [];

      return {
        query: trimmed,
        items: [],
        total: 0,
        matched: 0,
        expanded: false,
        error: errorMessage
      };
    } finally {
      isSearching.value = false;
    }
  }

  void initialize();

  return {
    supported,
    permissionGranted,
    isHydrated,
    isCheckingPermission,
    isRequestingPermission,
    isSearching,
    message,
    lastResults,
    initialize,
    refreshPermission,
    ensurePermission,
    searchBookmarks
  };
}

let bookmarkSearchStore: ReturnType<typeof createBookmarkSearchStore> | null = null;

export function useBookmarkSearch() {
  if (!bookmarkSearchStore) {
    bookmarkSearchStore = createBookmarkSearchStore();
  }

  return bookmarkSearchStore;
}
