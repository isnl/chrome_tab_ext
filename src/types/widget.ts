export const WIDGET_SIZES = ["1x1", "2x1", "2x2", "4x2", "4x4"] as const;

export type WidgetSize = (typeof WIDGET_SIZES)[number];

export type DashboardWidgetId = "clock" | "weather" | "calendar" | "countdown" | "todo" | "progress" | "sites";

export interface WidgetSizeMeta {
  cols: number;
  rows: number;
  label: string;
}

export interface DashboardWidgetState {
  id: DashboardWidgetId;
  size: WidgetSize;
  order: number;
  col?: number;
  row?: number;
}

export type WidgetLayoutItem = DashboardWidgetState;

export interface DashboardWidgetDefinition {
  id: DashboardWidgetId;
  title: string;
  supportedSizes: WidgetSize[];
  defaultSize: WidgetSize;
}

export type WidgetDefinition = DashboardWidgetDefinition;

export const WIDGET_SIZE_META: Record<WidgetSize, WidgetSizeMeta> = {
  "1x1": { cols: 1, rows: 1, label: "1 x 1" },
  "2x1": { cols: 2, rows: 1, label: "2 x 1" },
  "2x2": { cols: 2, rows: 2, label: "2 x 2" },
  "4x2": { cols: 4, rows: 2, label: "4 x 2" },
  "4x4": { cols: 4, rows: 4, label: "4 x 4" }
};

export const WIDGET_SIZE_LABELS: Record<WidgetSize, string> = Object.fromEntries(
  Object.entries(WIDGET_SIZE_META).map(([size, meta]) => [size, meta.label])
) as Record<WidgetSize, string>;

export const DASHBOARD_WIDGET_DEFINITIONS: Record<DashboardWidgetId, DashboardWidgetDefinition> = {
  clock: {
    id: "clock",
    title: "时间",
    supportedSizes: ["1x1", "2x1", "2x2"],
    defaultSize: "2x2"
  },
  weather: {
    id: "weather",
    title: "天气",
    supportedSizes: ["1x1", "2x1", "2x2", "4x2"],
    defaultSize: "2x2"
  },
  calendar: {
    id: "calendar",
    title: "日历",
    supportedSizes: ["1x1", "2x2", "4x4"],
    defaultSize: "4x4"
  },
  countdown: {
    id: "countdown",
    title: "倒计时",
    supportedSizes: ["2x1", "2x2", "4x2"],
    defaultSize: "2x2"
  },
  todo: {
    id: "todo",
    title: "待办",
    supportedSizes: ["1x1", "2x1", "2x2", "4x2", "4x4"],
    defaultSize: "2x2"
  },
  progress: {
    id: "progress",
    title: "进度条",
    supportedSizes: ["1x1", "2x2"],
    defaultSize: "2x2"
  },
  sites: {
    id: "sites",
    title: "常用网站",
    supportedSizes: ["2x2", "4x2", "4x4"],
    defaultSize: "4x2"
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
  },
  {
    id: "countdown",
    size: DASHBOARD_WIDGET_DEFINITIONS.countdown.defaultSize,
    order: 3
  },
  {
    id: "todo",
    size: DASHBOARD_WIDGET_DEFINITIONS.todo.defaultSize,
    order: 4
  },
  {
    id: "progress",
    size: DASHBOARD_WIDGET_DEFINITIONS.progress.defaultSize,
    order: 5
  },
  {
    id: "sites",
    size: DASHBOARD_WIDGET_DEFINITIONS.sites.defaultSize,
    order: 6
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
