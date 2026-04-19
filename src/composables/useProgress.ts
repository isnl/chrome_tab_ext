import { computed, onUnmounted, ref } from "vue";

import {
  calcDayProgress,
  calcMonthProgress,
  calcWeekProgress,
  calcYearProgress,
  PROGRESS_COLORS,
  PROGRESS_LABELS,
  type ProgressInfo,
  type ProgressType
} from "@/types/progress";

function createProgressStore() {
  const now = ref(new Date());

  const timer = setInterval(() => {
    now.value = new Date();
  }, 30_000); // 每30秒更新

  function getPercent(type: ProgressType): number {
    const d = now.value;
    switch (type) {
      case "day":
        return calcDayProgress(d);
      case "week":
        return calcWeekProgress(d);
      case "month":
        return calcMonthProgress(d);
      case "year":
        return calcYearProgress(d);
    }
  }

  const day = computed<ProgressInfo>(() => ({
    type: "day",
    label: PROGRESS_LABELS.day,
    percent: getPercent("day"),
    color: PROGRESS_COLORS.day
  }));

  const week = computed<ProgressInfo>(() => ({
    type: "week",
    label: PROGRESS_LABELS.week,
    percent: getPercent("week"),
    color: PROGRESS_COLORS.week
  }));

  const month = computed<ProgressInfo>(() => ({
    type: "month",
    label: PROGRESS_LABELS.month,
    percent: getPercent("month"),
    color: PROGRESS_COLORS.month
  }));

  const year = computed<ProgressInfo>(() => ({
    type: "year",
    label: PROGRESS_LABELS.year,
    percent: getPercent("year"),
    color: PROGRESS_COLORS.year
  }));

  const all = computed<ProgressInfo[]>(() => [day.value, week.value, month.value, year.value]);

  function cleanup() {
    clearInterval(timer);
  }

  return { now, day, week, month, year, all, cleanup };
}

let store: ReturnType<typeof createProgressStore> | null = null;

export function useProgress() {
  if (!store) {
    store = createProgressStore();
  }
  return store;
}
