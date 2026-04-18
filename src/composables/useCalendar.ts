import { computed, ref } from "vue";

import { createHolidayCacheKey, fetchHolidayYear, isHolidayCacheRecord } from "@/services/holiday";
import { storageGet, storageSet } from "@/services/storage";
import type { HolidayRecord, HolidayYearMap, UpcomingHolidaySegment } from "@/types/calendar";
import {
  addDays,
  buildMonthGrid,
  createRangeLabel,
  differenceInDays,
  formatDateKey,
  formatFullSolarDate,
  formatMonthDay,
  formatMonthTitle,
  formatShortDate,
  getChineseZodiac,
  getDayOfYear,
  getLunarInfo,
  getQuarter,
  getWeekOfYear,
  getWesternZodiac,
  isSameDay,
  isToday,
  isWeekend,
  startOfMonth
} from "@/utils/date";

const HOLIDAY_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const HOLIDAY_PRIORITY = ["元旦", "春节", "除夕", "清明节", "劳动节", "端午节", "中秋节", "国庆节"];

function isNamedHoliday(record: HolidayRecord | null) {
  if (!record?.holiday) {
    return false;
  }

  return !/^周[六日天]$/.test(record.name);
}

function describeHolidayStatus(date: Date, record: HolidayRecord | null) {
  if (record?.holiday && isNamedHoliday(record)) {
    return `休假中 · ${record.name}`;
  }

  if (record?.holiday) {
    return "周末休息";
  }

  if (record && record.holiday === false && record.target) {
    return `${record.after ? "节后" : "节前"}补班 · ${record.target}`;
  }

  return isWeekend(date) ? "普通周末" : "正常工作日";
}

function pickSegmentLabel(entries: HolidayRecord[]) {
  for (const holidayName of HOLIDAY_PRIORITY) {
    if (entries.some((entry) => entry.name === holidayName || entry.target === holidayName)) {
      return holidayName;
    }
  }

  const namedEntry = entries.find((entry) => !/^周[六日天]$/.test(entry.name));
  return namedEntry?.name || "周末";
}

export function useCalendar() {
  return getCalendarStore();
}

function createCalendarStore() {
  const today = ref(new Date());
  const selectedDate = ref(new Date());
  const activeMonth = ref(startOfMonth(today.value));
  const holidayYears = ref<Record<number, HolidayYearMap>>({});
  const isLoading = ref(true);
  const error = ref("");

  function getHolidayRecord(date: Date) {
    return holidayYears.value[date.getFullYear()]?.[formatMonthDay(date)] ?? null;
  }

  async function ensureHolidayYear(year: number) {
    if (holidayYears.value[year]) {
      return holidayYears.value[year];
    }

    const cacheKey = createHolidayCacheKey(year);
    const cached = (await storageGet<Record<string, unknown>>(cacheKey))[cacheKey];

    if (isHolidayCacheRecord(cached) && Date.now() - cached.savedAt < HOLIDAY_CACHE_TTL) {
      holidayYears.value = {
        ...holidayYears.value,
        [year]: cached.payload
      };
      return cached.payload;
    }

    const payload = await fetchHolidayYear(year);
    holidayYears.value = {
      ...holidayYears.value,
      [year]: payload
    };

    await storageSet({
      [cacheKey]: {
        savedAt: Date.now(),
        payload
      }
    });

    return payload;
  }

  async function ensureYearBundle(baseDate = activeMonth.value) {
    const years = [baseDate.getFullYear() - 1, baseDate.getFullYear(), baseDate.getFullYear() + 1];
    await Promise.all(years.map((year) => ensureHolidayYear(year)));
  }

  function syncSelectedDateWithMonth() {
    const maxDay = new Date(activeMonth.value.getFullYear(), activeMonth.value.getMonth() + 1, 0).getDate();
    const safeDay = Math.min(selectedDate.value.getDate(), maxDay);
    selectedDate.value = new Date(activeMonth.value.getFullYear(), activeMonth.value.getMonth(), safeDay);
  }

  async function initialize() {
    isLoading.value = true;
    error.value = "";

    try {
      await ensureYearBundle(activeMonth.value);
    } catch (caughtError) {
      error.value = "节假日接口暂时不可用，请稍后刷新重试。";
    } finally {
      isLoading.value = false;
    }
  }

  async function goToPreviousMonth() {
    activeMonth.value = new Date(activeMonth.value.getFullYear(), activeMonth.value.getMonth() - 1, 1);
    syncSelectedDateWithMonth();
    await ensureYearBundle(activeMonth.value);
  }

  async function goToNextMonth() {
    activeMonth.value = new Date(activeMonth.value.getFullYear(), activeMonth.value.getMonth() + 1, 1);
    syncSelectedDateWithMonth();
    await ensureYearBundle(activeMonth.value);
  }

  async function goToToday() {
    selectedDate.value = new Date(today.value);
    activeMonth.value = startOfMonth(today.value);
    await ensureYearBundle(activeMonth.value);
  }

  async function selectDate(date: Date) {
    selectedDate.value = new Date(date);

    if (
      selectedDate.value.getMonth() !== activeMonth.value.getMonth() ||
      selectedDate.value.getFullYear() !== activeMonth.value.getFullYear()
    ) {
      activeMonth.value = startOfMonth(selectedDate.value);
      await ensureYearBundle(activeMonth.value);
    }
  }

  function getCompensationNotes(startDate: Date, endDate: Date, label: string) {
    const notes: string[] = [];
    const surrounding: Date[] = [];

    for (let index = 1; index <= 3; index += 1) {
      surrounding.push(addDays(startDate, -index), addDays(endDate, index));
    }

    surrounding.forEach((date) => {
      const record = getHolidayRecord(date);
      if (record && record.holiday === false && record.target === label) {
        notes.push(`${formatShortDate(date)} ${record.name}`);
      }
    });

    return notes;
  }

  function collectUpcomingSegments(fromDate: Date, limit = 4) {
    const segments: UpcomingHolidaySegment[] = [];
    let currentSegment: { start: Date; end: Date; entries: HolidayRecord[] } | null = null;

    for (let offset = 0; offset < 420 && segments.length < limit; offset += 1) {
      const date = addDays(fromDate, offset);
      const record = getHolidayRecord(date);

      if (record?.holiday) {
        if (!currentSegment) {
          currentSegment = {
            start: new Date(date),
            end: new Date(date),
            entries: [{ ...record }]
          };
        } else {
          currentSegment.end = new Date(date);
          currentSegment.entries.push({ ...record });
        }
        continue;
      }

      if (currentSegment) {
        const label = pickSegmentLabel(currentSegment.entries);
        segments.push({
          start: currentSegment.start,
          end: currentSegment.end,
          days: differenceInDays(currentSegment.start, currentSegment.end) + 1,
          label,
          notes: getCompensationNotes(currentSegment.start, currentSegment.end, label)
        });
        currentSegment = null;
      }
    }

    if (currentSegment && segments.length < limit) {
      const label = pickSegmentLabel(currentSegment.entries);
      segments.push({
        start: currentSegment.start,
        end: currentSegment.end,
        days: differenceInDays(currentSegment.start, currentSegment.end) + 1,
        label,
        notes: getCompensationNotes(currentSegment.start, currentSegment.end, label)
      });
    }

    return segments;
  }

  const monthGrid = computed(() =>
    buildMonthGrid(activeMonth.value).map((item) => {
      const record = getHolidayRecord(item.date);
      const lunar = getLunarInfo(item.date);

      return {
        ...item,
        record,
        lunar,
        isToday: isToday(item.date),
        isSelected: isSameDay(item.date, selectedDate.value),
        isHoliday: Boolean(record?.holiday),
        isNamedHoliday: isNamedHoliday(record),
        isCompensationWorkday: Boolean(record && record.holiday === false && record.target),
        subtitle:
          record?.holiday && isNamedHoliday(record)
            ? record.name
            : record && record.holiday === false && record.target
              ? record.name
              : lunar.shortLabel
      };
    })
  );

  const selectedLunar = computed(() => getLunarInfo(selectedDate.value));
  const selectedRecord = computed(() => getHolidayRecord(selectedDate.value));
  const monthLabel = computed(() => formatMonthTitle(activeMonth.value));
  const monthSubtitle = computed(() => `本月 ${monthGrid.value.filter((item) => item.inMonth).length} 天 · 支持节假日与调休`);
  const selectedStatusBadges = computed(() => {
    const badges: string[] = [];

    if (isToday(selectedDate.value)) {
      badges.push("今天");
    }

    if (selectedRecord.value?.holiday && isNamedHoliday(selectedRecord.value)) {
      badges.push(selectedRecord.value.name);
    } else if (selectedRecord.value?.holiday) {
      badges.push("周末");
    }

    if (selectedRecord.value && selectedRecord.value.holiday === false && selectedRecord.value.target) {
      badges.push("补班");
    }

    return badges;
  });

  const upcomingSegments = computed(() => collectUpcomingSegments(selectedDate.value, 4));
  const nextUpcoming = computed(() => upcomingSegments.value[0] ?? null);

  const detailItems = computed(() => [
    {
      label: "公历",
      value: formatFullSolarDate(selectedDate.value),
      hint: "完整阳历日期"
    },
    {
      label: "农历",
      value: `${selectedLunar.value.yearName}年 ${selectedLunar.value.monthLabel}${selectedLunar.value.dayLabel}`,
      hint: "农历月相与干支"
    },
    {
      label: "生肖 / 星座",
      value: `${getChineseZodiac(selectedLunar.value.lunarYear)} / ${getWesternZodiac(selectedDate.value)}`,
      hint: "传统生肖与西方星座"
    },
    {
      label: "季度 / 周次",
      value: `Q${getQuarter(selectedDate.value)} · 第${getWeekOfYear(selectedDate.value)}周`,
      hint: `本年第 ${getDayOfYear(selectedDate.value)} 天`
    },
    {
      label: "假期状态",
      value: describeHolidayStatus(selectedDate.value, selectedRecord.value),
      hint: selectedRecord.value?.target ? `关联节日：${selectedRecord.value.target}` : "已结合节假日和周末规则"
    },
    {
      label: "下次休息",
      value: nextUpcoming.value
        ? differenceInDays(selectedDate.value, nextUpcoming.value.start) === 0
          ? `正在 ${nextUpcoming.value.label}`
          : `${differenceInDays(selectedDate.value, nextUpcoming.value.start)} 天后 · ${nextUpcoming.value.label}`
        : "近期无更多记录",
      hint: nextUpcoming.value
        ? `${createRangeLabel(nextUpcoming.value.start, nextUpcoming.value.end)} · 共 ${nextUpcoming.value.days} 天`
        : "当前缓存范围内未找到"
    }
  ]);

  return {
    activeMonth,
    selectedDate,
    selectedLunar,
    selectedRecord,
    selectedStatusBadges,
    monthGrid,
    monthLabel,
    monthSubtitle,
    detailItems,
    upcomingSegments,
    nextUpcoming,
    isLoading,
    error,
    initialize,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectDate,
    formatDateKey,
    formatShortDate,
    formatMonthTitle
  };
}

let calendarStore: ReturnType<typeof createCalendarStore> | null = null;

function getCalendarStore() {
  if (!calendarStore) {
    calendarStore = createCalendarStore();
  }

  return calendarStore;
}
