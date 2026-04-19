export type ProgressType = "day" | "week" | "month" | "year";

export interface ProgressInfo {
  type: ProgressType;
  label: string;
  percent: number;
  color: string;
}

export const PROGRESS_COLORS: Record<ProgressType, string> = {
  day: "#f97316",
  week: "#3b82f6",
  month: "#a855f7",
  year: "#22c55e"
};

export const PROGRESS_LABELS: Record<ProgressType, string> = {
  day: "今日",
  week: "本周",
  month: "本月",
  year: "今年"
};

export function calcDayProgress(now: Date): number {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return (hours * 60 + minutes) / (24 * 60);
}

export function calcWeekProgress(now: Date): number {
  // 周一为起始 (getDay(): 0=Sun, 1=Mon, ..., 6=Sat)
  const dayOfWeek = now.getDay();
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0 ... Sun=6
  const dayFraction = calcDayProgress(now);
  return (adjustedDay + dayFraction) / 7;
}

export function calcMonthProgress(now: Date): number {
  const day = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayFraction = calcDayProgress(now);
  return (day - 1 + dayFraction) / daysInMonth;
}

export function calcYearProgress(now: Date): number {
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = now.getTime() - start.getTime();
  return elapsedMs / totalMs;
}
