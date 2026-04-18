import type { CalendarGridItem, LunarInfo } from "@/types/calendar";
import type { LocationOption } from "@/types/weather";

const LUNAR_DAY_LABELS = [
  "",
  "初一",
  "初二",
  "初三",
  "初四",
  "初五",
  "初六",
  "初七",
  "初八",
  "初九",
  "初十",
  "十一",
  "十二",
  "十三",
  "十四",
  "十五",
  "十六",
  "十七",
  "十八",
  "十九",
  "二十",
  "廿一",
  "廿二",
  "廿三",
  "廿四",
  "廿五",
  "廿六",
  "廿七",
  "廿八",
  "廿九",
  "三十"
] as const;

const CHINESE_ZODIAC = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"] as const;

const WESTERN_ZODIAC = [
  { month: 1, day: 20, name: "水瓶座" },
  { month: 2, day: 19, name: "双鱼座" },
  { month: 3, day: 21, name: "白羊座" },
  { month: 4, day: 20, name: "金牛座" },
  { month: 5, day: 21, name: "双子座" },
  { month: 6, day: 22, name: "巨蟹座" },
  { month: 7, day: 23, name: "狮子座" },
  { month: 8, day: 23, name: "处女座" },
  { month: 9, day: 23, name: "天秤座" },
  { month: 10, day: 24, name: "天蝎座" },
  { month: 11, day: 23, name: "射手座" },
  { month: 12, day: 22, name: "摩羯座" }
] as const;

const lunarFormatter = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
  year: "numeric",
  month: "long",
  day: "numeric"
});

const solarFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long"
});

export function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatMonthDay(date: Date) {
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function isToday(date: Date) {
  return isSameDay(date, new Date());
}

export function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function buildMonthGrid(activeMonth: Date): CalendarGridItem[] {
  const firstDay = startOfMonth(activeMonth);
  const firstOffset = firstDay.getDay();
  const gridStart = addDays(firstDay, -firstOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      inMonth: date.getMonth() === activeMonth.getMonth()
    };
  });
}

export function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000) + 1;
}

export function getWeekOfYear(date: Date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((getDayOfYear(date) + firstDay.getDay()) / 7);
}

export function getQuarter(date: Date) {
  return Math.floor(date.getMonth() / 3) + 1;
}

export function getWesternZodiac(date: Date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (let index = WESTERN_ZODIAC.length - 1; index >= 0; index -= 1) {
    const boundary = WESTERN_ZODIAC[index];
    if (month > boundary.month || (month === boundary.month && day >= boundary.day)) {
      return boundary.name;
    }
  }

  return "摩羯座";
}

export function getChineseZodiac(lunarYear: number) {
  return CHINESE_ZODIAC[(lunarYear - 4) % 12] ?? "未知";
}

export function getLunarInfo(date: Date): LunarInfo {
  const parts = lunarFormatter.formatToParts(date);
  const partMap = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  ) as Record<string, string>;
  const lunarDay = Number(partMap.day);
  const dayLabel = LUNAR_DAY_LABELS[lunarDay] ?? "";

  return {
    lunarYear: Number(partMap.relatedYear),
    yearName: partMap.yearName,
    monthLabel: partMap.month,
    dayNumber: lunarDay,
    dayLabel,
    shortLabel: lunarDay === 1 ? partMap.month : dayLabel,
    fullLabel: `${partMap.yearName}年 ${partMap.month}${dayLabel}`
  };
}

export function formatFullSolarDate(date: Date) {
  return solarFormatter.format(date);
}

export function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long"
  }).format(date);
}

export function formatShortTime(date: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone
  }).format(date);
}

export function formatShortDate(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function differenceInDays(startDate: Date, endDate: Date) {
  const left = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const right = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.round((right.getTime() - left.getTime()) / 86400000);
}

export function createRangeLabel(startDate: Date, endDate: Date) {
  if (isSameDay(startDate, endDate)) {
    return formatShortDate(startDate);
  }

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDate.getMonth() + 1}月${startDate.getDate()}日 - ${endDate.getDate()}日`;
  }

  return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
}

export function getLocationLabel(location: LocationOption) {
  const parts = [location.name, location.admin1, location.country].filter(Boolean);
  return [...new Set(parts)].join(" · ");
}
