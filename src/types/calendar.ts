export interface LunarInfo {
  lunarYear: number;
  yearName: string;
  monthLabel: string;
  dayNumber: number;
  dayLabel: string;
  shortLabel: string;
  fullLabel: string;
}

export interface HolidayRecord {
  holiday: boolean;
  name: string;
  wage: number;
  date: string;
  after?: boolean;
  target?: string;
  rest?: number;
}

export type HolidayYearMap = Record<string, HolidayRecord>;

export interface CalendarGridItem {
  date: Date;
  inMonth: boolean;
}

export interface CalendarDayViewModel extends CalendarGridItem {
  record: HolidayRecord | null;
  lunar: LunarInfo;
  isToday: boolean;
  isSelected: boolean;
  isHoliday: boolean;
  isNamedHoliday: boolean;
  isCompensationWorkday: boolean;
  subtitle: string;
}

export interface CalendarDetailItem {
  label: string;
  value: string;
  hint: string;
}

export interface UpcomingHolidaySegment {
  start: Date;
  end: Date;
  days: number;
  label: string;
  notes: string[];
}

export interface HolidayCacheRecord {
  savedAt: number;
  payload: HolidayYearMap;
}
