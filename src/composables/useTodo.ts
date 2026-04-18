import { computed, ref, watch } from "vue";

import { storageGet, storageSet } from "@/services/storage";
import type { TodoItem } from "@/types/todo";

const ITEMS_KEY = "todo.items";
const SETTINGS_KEY = "todo.settings";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function isSameDate(a: string, b: Date): boolean {
  return a.slice(0, 10) === b.toISOString().slice(0, 10);
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
      items.value = rawItems as TodoItem[];
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

  const todayItems = computed(() => {
    const now = new Date();
    return items.value
      .filter((item) => isSameDate(item.createdAt, now))
      .sort((a, b) => a.order - b.order);
  });

  const todayActive = computed(() => todayItems.value.filter((i) => !i.completed));
  const todayCompleted = computed(() => todayItems.value.filter((i) => i.completed));

  const historicalItems = computed(() => {
    const now = new Date();
    const past = items.value.filter((item) => !isSameDate(item.createdAt, now) || item.completed);

    const groups: Record<string, TodoItem[]> = {};
    past.forEach((item) => {
      const dateKey = item.completed && item.completedAt
        ? item.completedAt.slice(0, 10)
        : item.createdAt.slice(0, 10);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, todos]) => ({ date, todos: todos.sort((a, b) => a.order - b.order) }));
  });

  function addTodo(text: string) {
    if (!text.trim()) return;
    items.value.push({
      id: generateId(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      order: todayItems.value.length
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

  function reorderTodos(fromIndex: number, toIndex: number) {
    const today = todayActive.value;
    const sorted = [...today];
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

  void initialize();

  return {
    items,
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
    setPrivacyMode
  };
}

let todoStore: ReturnType<typeof createTodoStore> | null = null;

export function useTodo() {
  if (!todoStore) {
    todoStore = createTodoStore();
  }
  return todoStore;
}
