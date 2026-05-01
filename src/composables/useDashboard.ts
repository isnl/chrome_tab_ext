import { computed, ref, toRaw, watch } from "vue";

import { storageGet, storageSet } from "@/services/storage";
import {
  DASHBOARD_WIDGET_DEFINITIONS,
  DEFAULT_DASHBOARD_LAYOUT,
  WIDGET_SIZE_META,
  type DashboardWidgetId,
  type DashboardWidgetState,
  type WidgetSize
} from "@/types/widget";

const STORAGE_KEY = "dashboard.layout";
const GRID_COLS = 12;

function cloneLayout(widgets: DashboardWidgetState[]): DashboardWidgetState[] {
  return toRaw(widgets).map((item) => ({ ...toRaw(item) }));
}

function buildOccupancy(widgets: DashboardWidgetState[], excludeId?: string): Set<string> {
  const occupied = new Set<string>();
  for (const item of widgets) {
    if (item.id === excludeId) continue;
    if (item.col == null || item.row == null) continue;
    const s = WIDGET_SIZE_META[item.size];
    for (let c = item.col; c < item.col + s.cols; c++) {
      for (let r = item.row; r < item.row + s.rows; r++) {
        occupied.add(`${c},${r}`);
      }
    }
  }
  return occupied;
}

function canPlace(widgets: DashboardWidgetState[], col: number, row: number, size: WidgetSize, excludeId?: string): boolean {
  const s = WIDGET_SIZE_META[size];
  if (col < 0 || row < 0 || col + s.cols > GRID_COLS) return false;
  const occupied = buildOccupancy(widgets, excludeId);
  for (let c = col; c < col + s.cols; c++) {
    for (let r = row; r < row + s.rows; r++) {
      if (occupied.has(`${c},${r}`)) return false;
    }
  }
  return true;
}

function autoAssignPositions(widgets: DashboardWidgetState[]): DashboardWidgetState[] {
  const result: DashboardWidgetState[] = [];
  const placed: DashboardWidgetState[] = [];

  // Keep widgets that already have valid positions
  for (const widget of widgets) {
    if (widget.col != null && widget.row != null) {
      placed.push({ ...widget });
      result.push({ ...widget });
    }
  }

  // Auto-place remaining widgets
  const unplaced = widgets.filter((w) => w.col == null || w.row == null);
  for (const widget of unplaced) {
    const s = WIDGET_SIZE_META[widget.size];
    let found = false;
    for (let r = 0; r < 50 && !found; r++) {
      for (let c = 0; c <= GRID_COLS - s.cols && !found; c++) {
        if (canPlace(placed, c, r, widget.size)) {
          const positioned = { ...widget, col: c, row: r };
          placed.push(positioned);
          result.push(positioned);
          found = true;
        }
      }
    }
    if (!found) {
      result.push({ ...widget, col: 0, row: 0 });
    }
  }

  return result;
}

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
      const savedSize = item.id === "countdown" && item.size === "4x2" ? "2x4" : item.size;
      const size = definition.supportedSizes.includes(savedSize as WidgetSize)
        ? (savedSize as WidgetSize)
        : definition.defaultSize;

      return {
        id: item.id,
        size,
        order: typeof item.order === "number" ? item.order : index,
        col: typeof item.col === "number" ? item.col : undefined,
        row: typeof item.row === "number" ? item.row : undefined
      } satisfies DashboardWidgetState;
    });

  const fallback = DEFAULT_DASHBOARD_LAYOUT.filter((item) => !incoming.some((entry) => entry.id === item.id)).map((item, index) => ({
    ...item,
    order: incoming.length + index
  }));

  return autoAssignPositions([...incoming, ...fallback].sort((left, right) => left.order - right.order));
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
        [STORAGE_KEY]: null
      });

      const raw = stored[STORAGE_KEY];
      widgets.value = sanitizeLayout(raw);
      isHydrated.value = true;
    })();

    return hydrationPromise;
  }

  function setWidgetSize(id: DashboardWidgetId, size: WidgetSize) {
    const updated = widgets.value.map((item) => (item.id === id ? { ...item, size, col: undefined, row: undefined } : item));
    widgets.value = autoAssignPositions(updated);
  }

  function moveWidget(id: string, col: number, row: number) {
    widgets.value = widgets.value.map((item) =>
      item.id === id ? { ...item, col, row } : item
    );
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

  function reorderWidgets(fromIndex: number, toIndex: number) {
    const sorted = [...widgets.value].sort((left, right) => left.order - right.order);
    const [moved] = sorted.splice(fromIndex, 1);
    if (!moved) return;
    sorted.splice(toIndex, 0, moved);
    widgets.value = sorted.map((item, index) => ({ ...item, order: index }));
  }

  watch(
    widgets,
    (value) => {
      if (!isHydrated.value) {
        return;
      }

      const plain = cloneLayout(value);
      storageSet({ [STORAGE_KEY]: plain }).catch((error) => {
        console.warn("[dashboard] 布局保存失败:", error);
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
    moveWidget,
    cycleWidgetSize,
    reorderWidgets
  };
}

let dashboardStore: ReturnType<typeof createDashboardStore> | null = null;

export function useDashboard() {
  if (!dashboardStore) {
    dashboardStore = createDashboardStore();
  }

  return dashboardStore;
}
