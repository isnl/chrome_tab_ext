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
  0: { label: "晴朗", icon: "sun", accent: "text-amber-500", panelTint: "from-amber-100 to-sky-100" },
  1: { label: "大部晴", icon: "sun-haze", accent: "text-amber-500", panelTint: "from-amber-100 to-sky-100" },
  2: { label: "局部多云", icon: "cloud-sun", accent: "text-sky-500", panelTint: "from-sky-100 to-cyan-100" },
  3: { label: "阴天", icon: "cloud", accent: "text-slate-500", panelTint: "from-slate-100 to-sky-100" },
  45: { label: "有雾", icon: "fog", accent: "text-slate-500", panelTint: "from-slate-100 to-slate-50" },
  48: { label: "冻雾", icon: "fog", accent: "text-slate-500", panelTint: "from-slate-100 to-slate-50" },
  51: { label: "小毛毛雨", icon: "drizzle", accent: "text-cyan-600", panelTint: "from-cyan-100 to-sky-100" },
  53: { label: "毛毛雨", icon: "drizzle", accent: "text-cyan-600", panelTint: "from-cyan-100 to-sky-100" },
  55: { label: "强毛毛雨", icon: "drizzle", accent: "text-cyan-700", panelTint: "from-cyan-100 to-sky-100" },
  56: { label: "冻毛毛雨", icon: "sleet", accent: "text-sky-600", panelTint: "from-sky-100 to-indigo-100" },
  57: { label: "强冻毛毛雨", icon: "sleet", accent: "text-sky-600", panelTint: "from-sky-100 to-indigo-100" },
  61: { label: "小雨", icon: "rain", accent: "text-sky-600", panelTint: "from-sky-100 to-cyan-100" },
  63: { label: "中雨", icon: "rain", accent: "text-sky-600", panelTint: "from-sky-100 to-cyan-100" },
  65: { label: "大雨", icon: "rain", accent: "text-sky-700", panelTint: "from-sky-100 to-cyan-100" },
  66: { label: "冻雨", icon: "sleet", accent: "text-indigo-600", panelTint: "from-sky-100 to-indigo-100" },
  67: { label: "强冻雨", icon: "sleet", accent: "text-indigo-600", panelTint: "from-sky-100 to-indigo-100" },
  71: { label: "小雪", icon: "snow", accent: "text-cyan-500", panelTint: "from-white to-sky-100" },
  73: { label: "中雪", icon: "snow", accent: "text-cyan-500", panelTint: "from-white to-sky-100" },
  75: { label: "大雪", icon: "snow", accent: "text-cyan-600", panelTint: "from-white to-sky-100" },
  77: { label: "雪粒", icon: "snow", accent: "text-cyan-500", panelTint: "from-white to-sky-100" },
  80: { label: "阵雨", icon: "rain", accent: "text-sky-600", panelTint: "from-sky-100 to-cyan-100" },
  81: { label: "强阵雨", icon: "rain", accent: "text-sky-700", panelTint: "from-sky-100 to-cyan-100" },
  82: { label: "暴雨", icon: "storm", accent: "text-violet-600", panelTint: "from-violet-100 to-sky-100" },
  85: { label: "阵雪", icon: "snow", accent: "text-cyan-500", panelTint: "from-white to-sky-100" },
  86: { label: "强阵雪", icon: "snow", accent: "text-cyan-600", panelTint: "from-white to-sky-100" },
  95: { label: "雷阵雨", icon: "storm", accent: "text-violet-600", panelTint: "from-violet-100 to-sky-100" },
  96: { label: "雷雨夹小冰雹", icon: "storm", accent: "text-violet-600", panelTint: "from-violet-100 to-sky-100" },
  99: { label: "雷雨夹大冰雹", icon: "storm", accent: "text-violet-600", panelTint: "from-violet-100 to-sky-100" }
};

export function getWeatherMeta(code: number): WeatherMeta {
  return WEATHER_MAP[code] ?? {
    label: "天气稳定",
    icon: "cloud",
    accent: "text-sky-500",
    panelTint: "from-sky-100 to-cyan-100"
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
