export const WIDGET_SIZES = ["1x1", "1x2", "2x2", "4x4"] as const;

export type WidgetSize = (typeof WIDGET_SIZES)[number];

export type DashboardWidgetId = "clock" | "weather" | "calendar";

export interface WidgetSizeMeta {
  cols: number;
  rows: number;
  label: string;
}

export interface DashboardWidgetState {
  id: DashboardWidgetId;
  size: WidgetSize;
  order: number;
}

export type WidgetLayoutItem = DashboardWidgetState;

export interface DashboardWidgetDefinition {
  id: DashboardWidgetId;
  title: string;
  subtitle: string;
  supportedSizes: WidgetSize[];
  defaultSize: WidgetSize;
}

export type WidgetDefinition = DashboardWidgetDefinition;

export interface WidgetDetailState {
  id: DashboardWidgetId | null;
}

export const WIDGET_SIZE_META: Record<WidgetSize, WidgetSizeMeta> = {
  "1x1": { cols: 1, rows: 1, label: "1 x 1" },
  "1x2": { cols: 1, rows: 2, label: "1 x 2" },
  "2x2": { cols: 2, rows: 2, label: "2 x 2" },
  "4x4": { cols: 4, rows: 4, label: "4 x 4" }
};

export const WIDGET_SIZE_LABELS: Record<WidgetSize, string> = Object.fromEntries(
  Object.entries(WIDGET_SIZE_META).map(([size, meta]) => [size, meta.label])
) as Record<WidgetSize, string>;

export const DASHBOARD_WIDGET_DEFINITIONS: Record<DashboardWidgetId, DashboardWidgetDefinition> = {
  clock: {
    id: "clock",
    title: "时间",
    subtitle: "一眼看到当前状态",
    supportedSizes: ["1x1", "1x2", "2x2"],
    defaultSize: "1x1"
  },
  weather: {
    id: "weather",
    title: "天气",
    subtitle: "从摘要进入完整详情",
    supportedSizes: ["1x1", "1x2", "2x2"],
    defaultSize: "1x2"
  },
  calendar: {
    id: "calendar",
    title: "日历",
    subtitle: "迷你月历 + 详细展开",
    supportedSizes: ["1x1", "2x2", "4x4"],
    defaultSize: "2x2"
  }
};

export const DEFAULT_DASHBOARD_LAYOUT: DashboardWidgetState[] = [
  {
    id: "clock",
    size: DASHBOARD_WIDGET_DEFINITIONS.clock.defaultSize,
    order: 0
  },
  {
    id: "weather",
    size: DASHBOARD_WIDGET_DEFINITIONS.weather.defaultSize,
    order: 1
  },
  {
    id: "calendar",
    size: DASHBOARD_WIDGET_DEFINITIONS.calendar.defaultSize,
    order: 2
  }
];

export function resolveSupportedWidgetSizes(sizes?: WidgetSize[]) {
  if (!sizes?.length) {
    return [...WIDGET_SIZES];
  }

  return WIDGET_SIZES.filter((size) => sizes.includes(size));
}

export function createWidgetTransitionName(id: string) {
  return `widget-${id}`;
}
