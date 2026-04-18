import type { WeatherPayload } from "@/types/weather";

export interface WeatherMeta {
  label: string;
  icon: WeatherIconName;
  accent: string;
  panelTint: string;
}

export type WeatherIconName =
  | "sun"
  | "sun-haze"
  | "cloud-sun"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "sleet"
  | "snow"
  | "storm";

const WEATHER_MAP: Record<number, WeatherMeta> = {
  0: { label: "晴朗", icon: "sun", accent: "text-amber-500", panelTint: "from-amber-50 to-violet-50" },
  1: { label: "大部晴", icon: "sun-haze", accent: "text-amber-500", panelTint: "from-amber-50 to-violet-50" },
  2: { label: "局部多云", icon: "cloud-sun", accent: "text-indigo-500", panelTint: "from-indigo-50 to-violet-50" },
  3: { label: "阴天", icon: "cloud", accent: "text-slate-500", panelTint: "from-slate-100 to-violet-50" },
  45: { label: "有雾", icon: "fog", accent: "text-slate-500", panelTint: "from-slate-100 to-slate-50" },
  48: { label: "冻雾", icon: "fog", accent: "text-slate-500", panelTint: "from-slate-100 to-slate-50" },
  51: { label: "小毛毛雨", icon: "drizzle", accent: "text-indigo-500", panelTint: "from-indigo-50 to-violet-50" },
  53: { label: "毛毛雨", icon: "drizzle", accent: "text-indigo-500", panelTint: "from-indigo-50 to-violet-50" },
  55: { label: "强毛毛雨", icon: "drizzle", accent: "text-indigo-600", panelTint: "from-indigo-50 to-violet-50" },
  56: { label: "冻毛毛雨", icon: "sleet", accent: "text-violet-600", panelTint: "from-violet-50 to-indigo-50" },
  57: { label: "强冻毛毛雨", icon: "sleet", accent: "text-violet-600", panelTint: "from-violet-50 to-indigo-50" },
  61: { label: "小雨", icon: "rain", accent: "text-indigo-600", panelTint: "from-indigo-50 to-blue-50" },
  63: { label: "中雨", icon: "rain", accent: "text-indigo-600", panelTint: "from-indigo-50 to-blue-50" },
  65: { label: "大雨", icon: "rain", accent: "text-indigo-700", panelTint: "from-indigo-100 to-blue-50" },
  66: { label: "冻雨", icon: "sleet", accent: "text-violet-600", panelTint: "from-violet-50 to-indigo-50" },
  67: { label: "强冻雨", icon: "sleet", accent: "text-violet-600", panelTint: "from-violet-50 to-indigo-50" },
  71: { label: "小雪", icon: "snow", accent: "text-blue-400", panelTint: "from-white to-indigo-50" },
  73: { label: "中雪", icon: "snow", accent: "text-blue-400", panelTint: "from-white to-indigo-50" },
  75: { label: "大雪", icon: "snow", accent: "text-blue-500", panelTint: "from-white to-indigo-50" },
  77: { label: "雪粒", icon: "snow", accent: "text-blue-400", panelTint: "from-white to-indigo-50" },
  80: { label: "阵雨", icon: "rain", accent: "text-indigo-600", panelTint: "from-indigo-50 to-blue-50" },
  81: { label: "强阵雨", icon: "rain", accent: "text-indigo-700", panelTint: "from-indigo-100 to-blue-50" },
  82: { label: "暴雨", icon: "storm", accent: "text-violet-600", panelTint: "from-violet-100 to-indigo-50" },
  85: { label: "阵雪", icon: "snow", accent: "text-blue-400", panelTint: "from-white to-indigo-50" },
  86: { label: "强阵雪", icon: "snow", accent: "text-blue-500", panelTint: "from-white to-indigo-50" },
  95: { label: "雷阵雨", icon: "storm", accent: "text-violet-600", panelTint: "from-violet-100 to-indigo-50" },
  96: { label: "雷雨夹小冰雹", icon: "storm", accent: "text-violet-600", panelTint: "from-violet-100 to-indigo-50" },
  99: { label: "雷雨夹大冰雹", icon: "storm", accent: "text-violet-600", panelTint: "from-violet-100 to-indigo-50" }
};

export function getWeatherMeta(code: number): WeatherMeta {
  return WEATHER_MAP[code] ?? {
    label: "天气稳定",
    icon: "cloud",
    accent: "text-indigo-500",
    panelTint: "from-indigo-50 to-violet-50"
  };
}

export function normalizeWeatherUpdatedAt(weather: WeatherPayload) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: weather.timezone
  }).format(new Date(weather.current.updatedAt));
}
