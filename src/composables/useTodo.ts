import { computed, ref, watch } from "vue";

import { storageGet, storageSet } from "@/services/storage";
import type { TodoImportance, TodoItem, TodoTimeGroup } from "@/types/todo";

const ITEMS_KEY = "todo.items";
const SETTINGS_KEY = "todo.settings";
const DAY_MS = 24 * 60 * 60 * 1000;

export const TODO_IMPORTANCE_OPTIONS: Array<{
  value: TodoImportance;
  label: string;
}> = [
  { value: "low", label: "普通" },
  { value: "medium", label: "留意" },
  { value: "high", label: "重要" }
];

export const TODO_TIME_BUCKETS: Array<Omit<TodoTimeGroup, "todos">> = [
  { key: "within1", label: "1天内" },
  { key: "within3", label: "3天内" },
  { key: "within7", label: "7天内" },
  { key: "later", label: "7天以上" }
];

type AddTodoOptions = {
  dueDate?: string;
  dueTime?: string;
  importance?: TodoImportance;
};

const IMPORTANCE_SORT_RANK: Record<TodoImportance, number> = {
  high: 0,
  medium: 1,
  low: 2
};

const BUCKET_SORT_RANK: Record<TodoTimeGroup["key"], number> = {
  within1: 0,
  within3: 1,
  within7: 2,
  later: 3
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isValidTimeString(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizeImportance(value: unknown): TodoImportance {
  return value === "high" || value === "medium" || value === "low" ? value : "low";
}

function parseTodoDate(item: Pick<TodoItem, "dueDate" | "dueTime">) {
  if (!item.dueDate || !isValidDateString(item.dueDate)) return null;

  const [year, month, day] = item.dueDate.split("-").map(Number);
  const [hour, minute] = item.dueTime && isValidTimeString(item.dueTime)
    ? item.dueTime.split(":").map(Number)
    : [23, 59];

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function isSameLocalDate(isoDate: string | undefined, date: Date): boolean {
  if (!isoDate) return false;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return toLocalDateKey(parsed) === toLocalDateKey(date);
}

function getDueDayDiff(item: TodoItem) {
  const dueDate = parseTodoDate(item);
  if (!dueDate) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  return Math.floor((dueStart.getTime() - todayStart.getTime()) / DAY_MS);
}

function getTodoBucketKey(item: TodoItem): TodoTimeGroup["key"] {
  const dayDiff = getDueDayDiff(item);

  if (dayDiff === null) return "later";
  if (dayDiff <= 1) return "within1";
  if (dayDiff <= 3) return "within3";
  if (dayDiff <= 7) return "within7";
  return "later";
}

function getDueSortValue(item: TodoItem) {
  return parseTodoDate(item)?.getTime() ?? Number.POSITIVE_INFINITY;
}

function compareTodos(a: TodoItem, b: TodoItem) {
  const bucketDiff = BUCKET_SORT_RANK[getTodoBucketKey(a)] - BUCKET_SORT_RANK[getTodoBucketKey(b)];
  if (bucketDiff !== 0) return bucketDiff;

  const importanceDiff = IMPORTANCE_SORT_RANK[a.importance] - IMPORTANCE_SORT_RANK[b.importance];
  if (importanceDiff !== 0) return importanceDiff;

  const dueDiff = getDueSortValue(a) - getDueSortValue(b);
  if (dueDiff !== 0) return dueDiff;

  return a.order - b.order;
}

function compareCompletedTodos(a: TodoItem, b: TodoItem) {
  return (new Date(b.completedAt ?? b.createdAt).getTime() || 0) - (new Date(a.completedAt ?? a.createdAt).getTime() || 0);
}

function extractStoredDue(source: Record<string, unknown>) {
  const dueDate = typeof source.dueDate === "string" && isValidDateString(source.dueDate)
    ? source.dueDate
    : undefined;
  const dueTime = dueDate && typeof source.dueTime === "string" && isValidTimeString(source.dueTime)
    ? source.dueTime
    : undefined;

  if (dueDate) {
    return { dueDate, dueTime };
  }

  if (typeof source.dueAt === "string") {
    const date = new Date(source.dueAt);
    if (!Number.isNaN(date.getTime())) {
      return {
        dueDate: toLocalDateKey(date),
        dueTime: `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
      };
    }
  }

  return {};
}

function sanitizeTodo(raw: unknown, index: number): TodoItem | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;

  if (typeof source.text !== "string" || !source.text.trim()) return null;

  const createdAt = typeof source.createdAt === "string" && !Number.isNaN(new Date(source.createdAt).getTime())
    ? source.createdAt
    : new Date().toISOString();
  const completedAt = typeof source.completedAt === "string" && !Number.isNaN(new Date(source.completedAt).getTime())
    ? source.completedAt
    : undefined;
  const due = extractStoredDue(source);

  return {
    id: typeof source.id === "string" && source.id ? source.id : generateId(),
    text: source.text.trim(),
    completed: Boolean(source.completed),
    createdAt,
    completedAt,
    dueDate: due.dueDate,
    dueTime: due.dueTime,
    importance: normalizeImportance(source.importance),
    order: typeof source.order === "number" ? source.order : index
  };
}

function buildDueLabel(item: TodoItem) {
  const dueDate = parseTodoDate(item);
  if (!dueDate || !item.dueDate) return "";

  const dayDiff = getDueDayDiff(item);
  const [year, month, day] = item.dueDate.split("-").map(Number);
  const dateLabel = dayDiff != null && dayDiff < 0
    ? `逾期 ${month}/${day}`
    : dayDiff === 0
      ? "今天"
      : dayDiff === 1
        ? "明天"
        : dueDate.getFullYear() === new Date().getFullYear()
          ? `${month}/${day}`
          : `${year}/${month}/${day}`;

  return item.dueTime ? `${dateLabel} ${item.dueTime}` : dateLabel;
}

function createTodoStore() {
  const items = ref<TodoItem[]>([]);
  const privacyModeEnabled = ref(true);
  const isPrivacyRevealed = ref(false);
  const isHydrated = ref(false);

  const isBlurred = computed(() => privacyModeEnabled.value && !isPrivacyRevealed.value);

  async function initialize() {
    const stored = await storageGet<Record<string, unknown>>({
      [ITEMS_KEY]: null,
      [SETTINGS_KEY]: null
    });

    const rawItems = stored[ITEMS_KEY];
    if (Array.isArray(rawItems)) {
      items.value = rawItems.map(sanitizeTodo).filter((item): item is TodoItem => Boolean(item));
    }

    const rawSettings = stored[SETTINGS_KEY];
    if (rawSettings && typeof rawSettings === "object" && "privacyMode" in rawSettings) {
      privacyModeEnabled.value = Boolean((rawSettings as { privacyMode: boolean }).privacyMode);
    }

    isHydrated.value = true;
  }

  watch(
    items,
    (value) => {
      if (!isHydrated.value) return;
      void storageSet({ [ITEMS_KEY]: JSON.parse(JSON.stringify(value)) });
    },
    { deep: true }
  );

  const activeItems = computed(() => items.value.filter((item) => !item.completed).sort(compareTodos));
  const completedItems = computed(() => items.value.filter((item) => item.completed).sort(compareCompletedTodos));

  const activeGroups = computed<TodoTimeGroup[]>(() => {
    return TODO_TIME_BUCKETS.map((bucket) => ({
      ...bucket,
      todos: activeItems.value.filter((item) => getTodoBucketKey(item) === bucket.key)
    }));
  });

  const todayItems = computed(() => {
    const now = new Date();
    return items.value
      .filter((item) => isSameLocalDate(item.createdAt, now))
      .sort(compareTodos);
  });

  const todayActive = computed(() => activeItems.value);
  const todayCompleted = computed(() => {
    const now = new Date();
    return completedItems.value.filter((item) => isSameLocalDate(item.completedAt ?? item.createdAt, now));
  });

  const historicalItems = computed(() => {
    const groups: Record<string, TodoItem[]> = {};
    completedItems.value.forEach((item) => {
      const dateKey = (item.completedAt ?? item.createdAt).slice(0, 10);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, todos]) => ({ date, todos: todos.sort(compareCompletedTodos) }));
  });

  function addTodo(text: string, options: AddTodoOptions = {}) {
    if (!text.trim()) return;

    const dueDate = options.dueDate && isValidDateString(options.dueDate) ? options.dueDate : undefined;
    const dueTime = dueDate && options.dueTime && isValidTimeString(options.dueTime) ? options.dueTime : undefined;
    const maxOrder = items.value.reduce((max, item) => Math.max(max, item.order), -1);

    items.value.push({
      id: generateId(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate,
      dueTime,
      importance: options.importance ?? "low",
      order: maxOrder + 1
    });
  }

  function toggleTodo(id: string) {
    const item = items.value.find((i) => i.id === id);
    if (!item) return;
    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date().toISOString() : undefined;
  }

  function deleteTodo(id: string) {
    items.value = items.value.filter((i) => i.id !== id);
  }

  function editTodo(id: string, text: string) {
    const item = items.value.find((i) => i.id === id);
    if (item && text.trim()) {
      item.text = text.trim();
    }
  }

  function reorderTodos(fromId: string, toId: string) {
    const sorted = [...activeItems.value];
    const fromIndex = sorted.findIndex((item) => item.id === fromId);
    const toIndex = sorted.findIndex((item) => item.id === toId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

    const [moved] = sorted.splice(fromIndex, 1);
    if (!moved) return;
    sorted.splice(toIndex, 0, moved);
    sorted.forEach((item, index) => {
      const original = items.value.find((i) => i.id === item.id);
      if (original) original.order = index;
    });
  }

  function revealPrivacy() {
    isPrivacyRevealed.value = true;
  }

  async function setPrivacyMode(enabled: boolean) {
    privacyModeEnabled.value = enabled;
    await storageSet({ [SETTINGS_KEY]: { privacyMode: enabled } });
  }

  function getImportanceLabel(importance: TodoImportance) {
    return TODO_IMPORTANCE_OPTIONS.find((option) => option.value === importance)?.label ?? "普通";
  }

  void initialize();

  return {
    items,
    activeItems,
    completedItems,
    activeGroups,
    todayItems,
    todayActive,
    todayCompleted,
    historicalItems,
    privacyModeEnabled,
    isPrivacyRevealed,
    isBlurred,
    isHydrated,
    initialize,
    addTodo,
    toggleTodo,
    editTodo,
    deleteTodo,
    reorderTodos,
    revealPrivacy,
    setPrivacyMode,
    formatDueLabel: buildDueLabel,
    getImportanceLabel
  };
}

let todoStore: ReturnType<typeof createTodoStore> | null = null;

export function useTodo() {
  if (!todoStore) {
    todoStore = createTodoStore();
  }
  return todoStore;
}
