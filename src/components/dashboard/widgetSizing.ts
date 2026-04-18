import type { WidgetSize } from "@/types/widget";

export function getWidgetSpanClasses(size: WidgetSize) {
  switch (size) {
    case "1x1":
      return "widget-span-1x1";
    case "1x2":
      return "widget-span-1x2";
    case "2x2":
      return "widget-span-2x2";
    case "4x4":
      return "widget-span-4x4";
    default:
      return "widget-span-1x1";
  }
}
