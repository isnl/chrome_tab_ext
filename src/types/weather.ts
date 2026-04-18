export type LocationSource = "ip" | "custom";

export interface LocationOption {
  name: string;
  admin1: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  source: LocationSource;
}

export interface WeatherCurrent {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: string;
  weatherCode: number;
  windSpeed: number;
  isDay: boolean;
  updatedAt: string;
}

export interface WeatherHourlySlot {
  time: string;
  timeLabel: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
}

export interface WeatherDailyItem {
  date: string;
  weatherCode: number;
  max: number;
  min: number;
  sunrise: string;
  sunset: string;
  precipitationProbability: number;
}

export interface WeatherPayload {
  generatedAt: number;
  timezone: string;
  current: WeatherCurrent;
  hourly: WeatherHourlySlot[];
  daily: WeatherDailyItem[];
}

export interface WeatherCacheRecord {
  savedAt: number;
  payload: WeatherPayload;
}
