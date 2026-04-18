import { computed, ref, watch } from "vue";

import { storageGet, storageSet } from "@/services/storage";
import {
  DASHBOARD_WIDGET_DEFINITIONS,
  DEFAULT_DASHBOARD_LAYOUT,
  type DashboardWidgetId,
  type DashboardWidgetState,
  type WidgetSize
} from "@/types/widget";

const STORAGE_KEY = "dashboard.layout";

function sanitizeLayout(payload: unknown) {
  if (!Array.isArray(payload)) {
    return DEFAULT_DASHBOARD_LAYOUT.map((item) => ({ ...item }));
  }

  const validIds = new Set<DashboardWidgetId>(Object.keys(DASHBOARD_WIDGET_DEFINITIONS) as DashboardWidgetId[]);
  const incoming = payload
    .filter((item): item is Partial<DashboardWidgetState> & { id: DashboardWidgetId } => {
      return typeof item === "object" && item !== null && validIds.has((item as { id?: DashboardWidgetId }).id as DashboardWidgetId);
    })
    .map((item, index) => {
      const definition = DASHBOARD_WIDGET_DEFINITIONS[item.id];
      const size = definition.supportedSizes.includes(item.size as WidgetSize)
        ? (item.size as WidgetSize)
        : definition.defaultSize;

      return {
        id: item.id,
        size,
        order: typeof item.order === "number" ? item.order : index
      } satisfies DashboardWidgetState;
    });

  const fallback = DEFAULT_DASHBOARD_LAYOUT.filter((item) => !incoming.some((entry) => entry.id === item.id)).map((item, index) => ({
    ...item,
    order: incoming.length + index
  }));

  return [...incoming, ...fallback].sort((left, right) => left.order - right.order);
}

function createDashboardStore() {
  const widgets = ref<DashboardWidgetState[]>(DEFAULT_DASHBOARD_LAYOUT.map((item) => ({ ...item })));
  const isHydrated = ref(false);
  let hydrationPromise: Promise<void> | null = null;

  async function initialize() {
    if (hydrationPromise) {
      return hydrationPromise;
    }

    hydrationPromise = (async () => {
      const stored = await storageGet<Record<string, unknown>>({
        [STORAGE_KEY]: DEFAULT_DASHBOARD_LAYOUT
      });

      widgets.value = sanitizeLayout(stored[STORAGE_KEY]);
      isHydrated.value = true;
    })();

    return hydrationPromise;
  }

  function setWidgetSize(id: DashboardWidgetId, size: WidgetSize) {
    widgets.value = widgets.value.map((item) => (item.id === id ? { ...item, size } : item));
  }

  function cycleWidgetSize(id: DashboardWidgetId) {
    const current = widgets.value.find((item) => item.id === id);
    if (!current) {
      return;
    }

    const supportedSizes = DASHBOARD_WIDGET_DEFINITIONS[id].supportedSizes;
    const currentIndex = supportedSizes.indexOf(current.size);
    const nextSize = supportedSizes[(currentIndex + 1) % supportedSizes.length] ?? supportedSizes[0];
    setWidgetSize(id, nextSize);
  }

  const orderedWidgets = computed(() => [...widgets.value].sort((left, right) => left.order - right.order));

  watch(
    widgets,
    async (value) => {
      if (!isHydrated.value) {
        return;
      }

      await storageSet({
        [STORAGE_KEY]: value
      });
    },
    { deep: true }
  );

  void initialize();

  return {
    widgets,
    orderedWidgets,
    isHydrated,
    initialize,
    setWidgetSize,
    cycleWidgetSize
  };
}

let dashboardStore: ReturnType<typeof createDashboardStore> | null = null;

export function useDashboard() {
  if (!dashboardStore) {
    dashboardStore = createDashboardStore();
  }

  return dashboardStore;
}
