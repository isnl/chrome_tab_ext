import type {
  LocationOption,
  WeatherCacheRecord,
  WeatherDailyItem,
  WeatherHourlySlot,
  WeatherPayload
} from "@/types/weather";
import { formatShortTime } from "@/utils/date";

import { fetchJson } from "./http";

interface OpenMeteoSearchResult {
  name: string;
  admin1?: string;
  admin2?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

interface OpenMeteoSearchResponse {
  results?: OpenMeteoSearchResult[];
}

interface IpPayload {
  city?: string;
  cityName?: string;
  region?: string;
  regionName?: string;
  country?: string;
  countryName?: string;
  latitude: number | string;
  longitude: number | string;
  timezone?: string;
}

interface OpenMeteoForecastResponse {
  timezone?: string;
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: Array<number | null>;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max: Array<number | null>;
  };
}

function normalizeIpLocation(payload: IpPayload): LocationOption {
  return {
    name: payload.city || payload.cityName || payload.region || "当前城市",
    admin1: payload.region || payload.regionName || "",
    country: payload.country || payload.countryName || "中国",
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    timezone: payload.timezone || "Asia/Shanghai",
    source: "ip"
  };
}

function isNearbyLocation(source: LocationOption, candidate: LocationOption) {
  const latDelta = Math.abs(source.latitude - candidate.latitude);
  const lonDelta = Math.abs(source.longitude - candidate.longitude);
  return latDelta < 1 && lonDelta < 1;
}

function findUpcomingHourlySlots(hourly: OpenMeteoForecastResponse["hourly"], currentTime: string): WeatherHourlySlot[] {
  const currentIndex = hourly.time.findIndex((item) => item === currentTime);
  const startIndex = currentIndex >= 0 ? currentIndex : 0;
  const slots: WeatherHourlySlot[] = [];

  for (let index = startIndex; index < hourly.time.length && slots.length < 6; index += 3) {
    slots.push({
      time: hourly.time[index],
      timeLabel: formatShortTime(new Date(hourly.time[index])),
      temperature: Math.round(hourly.temperature_2m[index]),
      weatherCode: hourly.weather_code[index],
      precipitationProbability: Math.round(hourly.precipitation_probability[index] ?? 0)
    });
  }

  return slots;
}

export async function detectIpLocation() {
  const endpoints = ["https://api.ip.sb/geoip", "https://freeipapi.com/api/json"];
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const payload = await fetchJson<IpPayload>(endpoint);
      const normalized = normalizeIpLocation(payload);

      if (Number.isFinite(normalized.latitude) && Number.isFinite(normalized.longitude)) {
        return normalized;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to resolve location");
}

export async function searchLocations(keyword: string) {
  const query = keyword.trim();
  if (query.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    name: query,
    count: "8",
    language: "zh",
    format: "json"
  });

  const payload = await fetchJson<OpenMeteoSearchResponse>(
    `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`
  );

  return (payload.results ?? []).map<LocationOption>((item) => ({
    name: item.name,
    admin1: item.admin1 || item.admin2 || "",
    country: item.country || "",
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone || "Asia/Shanghai",
    source: "custom"
  }));
}

export async function resolveLocalizedIpLocation(ipLocation: LocationOption) {
  const candidates = await searchLocations(ipLocation.name.replaceAll("'", ""));
  return candidates.find((item) => isNearbyLocation(ipLocation, item)) ?? ipLocation;
}

export async function fetchWeatherForecast(location: LocationOption): Promise<WeatherPayload> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "is_day"
    ].join(","),
    hourly: ["temperature_2m", "weather_code", "precipitation_probability"].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "precipitation_probability_max"
    ].join(","),
    forecast_days: "7",
    timezone: "auto"
  });

  const payload = await fetchJson<OpenMeteoForecastResponse>(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );

  const daily: WeatherDailyItem[] = payload.daily.time.slice(0, 6).map((date, index) => ({
    date,
    weatherCode: payload.daily.weather_code[index],
    max: Math.round(payload.daily.temperature_2m_max[index]),
    min: Math.round(payload.daily.temperature_2m_min[index]),
    sunrise: payload.daily.sunrise[index],
    sunset: payload.daily.sunset[index],
    precipitationProbability: Math.round(payload.daily.precipitation_probability_max[index] ?? 0)
  }));

  return {
    generatedAt: Date.now(),
    timezone: payload.timezone || location.timezone,
    current: {
      temperature: Math.round(payload.current.temperature_2m),
      apparentTemperature: Math.round(payload.current.apparent_temperature),
      humidity: Math.round(payload.current.relative_humidity_2m),
      precipitation: Number(payload.current.precipitation ?? 0).toFixed(1),
      weatherCode: payload.current.weather_code,
      windSpeed: Math.round(payload.current.wind_speed_10m),
      isDay: Boolean(payload.current.is_day),
      updatedAt: payload.current.time
    },
    hourly: findUpcomingHourlySlots(payload.hourly, payload.current.time),
    daily
  };
}

export function createWeatherCacheKey(location: LocationOption) {
  return `weather.cache.${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}`;
}

export function isWeatherCacheRecord(value: unknown): value is WeatherCacheRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "savedAt" in value && "payload" in value;
}
