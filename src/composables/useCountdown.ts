import { computed, ref, watch } from "vue";

import { storageGet, storageSet } from "@/services/storage";
import type { CountdownItem } from "@/types/countdown";

const STORAGE_KEY = "countdown.items";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getDefaultHolidays(year: number): CountdownItem[] {
  return [
    { id: "builtin-yuandan", label: "元旦", targetDate: `${year}-01-01`, enabled: true, order: 0, isBuiltIn: true },
    { id: "builtin-chunjie", label: "春节", targetDate: `${year}-01-29`, enabled: true, order: 1, isBuiltIn: true },
    { id: "builtin-qingming", label: "清明节", targetDate: `${year}-04-05`, enabled: true, order: 2, isBuiltIn: true },
    { id: "builtin-laodong", label: "劳动节", targetDate: `${year}-05-01`, enabled: true, order: 3, isBuiltIn: true },
    { id: "builtin-duanwu", label: "端午节", targetDate: `${year}-05-31`, enabled: true, order: 4, isBuiltIn: true },
    { id: "builtin-zhongqiu", label: "中秋节", targetDate: `${year}-09-28`, enabled: true, order: 5, isBuiltIn: true },
    { id: "builtin-guoqing", label: "国庆节", targetDate: `${year}-10-01`, enabled: true, order: 6, isBuiltIn: true }
  ];
}

function daysBetween(from: Date, to: Date): number {
  const msPerDay = 86400000;
  const fromStart = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toStart = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.ceil((toStart.getTime() - fromStart.getTime()) / msPerDay);
}

function createCountdownStore() {
  const items = ref<CountdownItem[]>([]);
  const isHydrated = ref(false);

  async function initialize() {
    const stored = await storageGet<Record<string, unknown>>({ [STORAGE_KEY]: null });
    const raw = stored[STORAGE_KEY];

    if (Array.isArray(raw) && raw.length > 0) {
      items.value = raw as CountdownItem[];
    } else {
      items.value = getDefaultHolidays(new Date().getFullYear());
    }

    isHydrated.value = true;
  }

  watch(
    items,
    (value) => {
      if (!isHydrated.value) return;
      void storageSet({ [STORAGE_KEY]: JSON.parse(JSON.stringify(value)) });
    },
    { deep: true }
  );

  const visibleItems = computed(() => {
    const now = new Date();
    return items.value
      .filter((item) => item.enabled && daysBetween(now, new Date(item.targetDate)) >= 0)
      .sort((a, b) => a.order - b.order);
  });

  const nearestItem = computed(() => {
    const now = new Date();
    const upcoming = items.value
      .filter((item) => item.enabled && daysBetween(now, new Date(item.targetDate)) >= 0)
      .map((item) => ({ ...item, daysLeft: daysBetween(now, new Date(item.targetDate)) }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
    return upcoming[0] ?? null;
  });

  function toggleItem(id: string) {
    const item = items.value.find((i) => i.id === id);
    if (item) item.enabled = !item.enabled;
  }

  function reorderItems(fromIndex: number, toIndex: number) {
    const sorted = [...items.value].sort((a, b) => a.order - b.order);
    const [moved] = sorted.splice(fromIndex, 1);
    if (!moved) return;
    sorted.splice(toIndex, 0, moved);
    items.value = sorted.map((item, index) => ({ ...item, order: index }));
  }

  function addItem(label: string, targetDate: string) {
    items.value.push({
      id: generateId(),
      label,
      targetDate,
      enabled: true,
      order: items.value.length,
      isBuiltIn: false
    });
  }

  function removeItem(id: string) {
    items.value = items.value.filter((i) => i.id !== id);
  }

  function getDaysLeft(item: CountdownItem): number {
    return daysBetween(new Date(), new Date(item.targetDate));
  }

  void initialize();

  return {
    items,
    visibleItems,
    nearestItem,
    isHydrated,
    initialize,
    toggleItem,
    reorderItems,
    addItem,
    removeItem,
    getDaysLeft
  };
}

let countdownStore: ReturnType<typeof createCountdownStore> | null = null;

export function useCountdown() {
  if (!countdownStore) {
    countdownStore = createCountdownStore();
  }
  return countdownStore;
}
