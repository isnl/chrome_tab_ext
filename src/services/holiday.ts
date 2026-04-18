import type { HolidayCacheRecord, HolidayYearMap } from "@/types/calendar";

import { fetchJson } from "./http";

interface HolidayYearResponse {
  holiday?: HolidayYearMap;
}

export async function fetchHolidayYear(year: number) {
  const payload = await fetchJson<HolidayYearResponse>(`https://timor.tech/api/holiday/year/${year}?type=Y&week=Y`);
  return payload.holiday ?? {};
}

export function createHolidayCacheKey(year: number) {
  return `calendar.holiday.${year}`;
}

export function isHolidayCacheRecord(value: unknown): value is HolidayCacheRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "savedAt" in value && "payload" in value;
}
