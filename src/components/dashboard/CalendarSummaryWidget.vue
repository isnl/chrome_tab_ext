<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import CalendarDayTooltip from "@/components/calendar/CalendarDayTooltip.vue";
import CalendarMonthPicker from "@/components/calendar/CalendarMonthPicker.vue";
import { useCalendar } from "@/composables/useCalendar";
import type { CalendarDayViewModel } from "@/types/calendar";
import type { WidgetSize } from "@/types/widget";

defineProps<{
  size: WidgetSize;
}>();

const calendar = useCalendar();

const todayCell = computed(() => calendar.monthGrid.value.find((item) => item.isToday) ?? calendar.monthGrid.value[0]);
const previewDays = computed(() => calendar.monthGrid.value);
const nextHoliday = computed(() => calendar.upcomingSegments.value.find((s) => s.label !== "周末") ?? null);

// Current week row for 2x2 (Monday-start)
const currentWeekDays = computed(() => {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday=0, Sunday=6
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return {
      day: d.getDate(),
      isToday: d.toDateString() === now.toDateString(),
      isWeekend: i === 5 || i === 6 // Saturday, Sunday
    };
  });
});

// Tooltip state for 4x4
const tooltipDay = ref<CalendarDayViewModel | null>(null);
const tooltipPos = ref({ x: 0, y: 0 });
const tooltipVisible = ref(false);

function showTooltip(day: CalendarDayViewModel, event: MouseEvent) {
  if (!day.inMonth) return;
  tooltipDay.value = day;
  tooltipPos.value = { x: event.clientX, y: event.clientY };
  tooltipVisible.value = true;
}

function hideTooltip() {
  tooltipVisible.value = false;
}

// Month picker state
const showMonthPicker = ref(false);

function handleMonthSelect(year: number, month: number) {
  void calendar.goToMonth(year, month);
}

const weekdays = ["一", "二", "三", "四", "五", "六", "日"];

onMounted(() => {
  void calendar.initialize();
});
</script>

<template>
  <div v-if="calendar.isLoading.value" class="flex h-full items-center justify-center">
    <div class="h-8 w-8 animate-pulse rounded-full bg-slate-200/80"></div>
  </div>

  <div v-else-if="calendar.error.value" class="flex h-full items-end">
    <p class="text-xs text-rose-500">{{ calendar.error.value }}</p>
  </div>

  <div v-else class="flex h-full flex-col">
    <!-- 1x1: mini day number -->
    <template v-if="size === '1x1' && todayCell">
      <div class="flex h-full flex-col items-center justify-center text-center">
        <p class="widget-value text-[1.6rem] leading-none">{{ todayCell.date.getDate() }}</p>
        <p class="mt-1 text-[10px] text-slate-400">{{ calendar.selectedLunar.value.shortLabel }}</p>
      </div>
    </template>

    <!-- 2x2: enhanced with week row + holiday -->
    <template v-else-if="size === '2x2' && todayCell">
      <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
        {{ calendar.monthLabel.value }}
      </p>
      <div class="mt-1">
        <p class="widget-value text-[2.4rem] leading-none">
          {{ todayCell.date.getDate() }}
        </p>
        <p class="mt-1 text-xs text-slate-500">{{ calendar.selectedLunar.value.fullLabel }}</p>
        <p v-if="todayCell.isNamedHoliday" class="mt-0.5 text-xs font-medium text-pink-600">{{ todayCell.subtitle }}</p>
      </div>

      <!-- Week row -->
      <div class="mt-auto flex justify-between gap-0.5">
        <div
          v-for="(d, i) in currentWeekDays"
          :key="i"
          class="flex flex-1 flex-col items-center rounded-md py-0.5"
          :class="{
            'text-pink-400': d.isWeekend && !d.isToday
          }"
        >
          <span class="text-[9px]" :class="d.isToday ? 'text-teal-600' : 'text-slate-400'">{{ weekdays[i] }}</span>
          <span class="text-[11px]" :class="d.isToday ? 'font-extrabold text-slate-900' : d.isWeekend ? 'font-semibold' : 'font-semibold text-slate-600'">{{ d.day }}</span>
          <span v-if="d.isToday" class="mt-0.5 h-1 w-1 rounded-full bg-teal-500"></span>
        </div>
      </div>

      <!-- Next holiday -->
      <div v-if="nextHoliday" class="mt-1 flex items-center justify-between rounded-md bg-white/35 px-2 py-1">
        <span class="text-[10px] font-medium text-slate-500">{{ nextHoliday.label }}</span>
        <span class="text-[10px] text-slate-400">{{ nextHoliday.days }}天</span>
      </div>
    </template>

    <!-- 4x4: standard calendar grid with tooltip + navigation -->
    <template v-else>
      <!-- header with navigation -->
      <div class="cal-header">
        <div class="cal-header-left relative">
          <button class="cal-nav-btn" type="button" @click="calendar.goToPreviousMonth()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button class="cal-month-btn" type="button" @click="showMonthPicker = !showMonthPicker">
            <span class="cal-month">{{ calendar.activeMonth.value.getMonth() + 1 }}</span>
            <span class="cal-month-unit">月</span>
            <span class="cal-year">{{ calendar.activeMonth.value.getFullYear() }}</span>
          </button>
          <button class="cal-nav-btn" type="button" @click="calendar.goToNextMonth()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <CalendarMonthPicker
            v-if="showMonthPicker"
            :year="calendar.activeMonth.value.getFullYear()"
            :month="calendar.activeMonth.value.getMonth()"
            @select="handleMonthSelect"
            @close="showMonthPicker = false"
          />
        </div>
        <div class="flex items-center gap-1.5">
          <span class="cal-lunar-tag">{{ calendar.selectedLunar.value.shortLabel }}</span>
          <button
            class="cal-nav-btn text-[9px] font-semibold"
            type="button"
            @click="calendar.goToToday()"
          >今</button>
        </div>
      </div>

      <!-- weekday row -->
      <div class="cal-weekdays">
        <span
          v-for="(day, i) in weekdays"
          :key="day"
          :class="['cal-wd', { 'cal-wd--we': i === 5 || i === 6 }]"
        >{{ day }}</span>
      </div>

      <!-- day grid with hover tooltip -->
      <div class="cal-grid">
        <div
          v-for="item in previewDays"
          :key="item.date.toISOString()"
          :class="['cal-cell', {
            'cal-cell--today': item.isToday,
            'cal-cell--hol': item.isNamedHoliday && !item.isToday,
            'cal-cell--comp': item.isCompensationWorkday && !item.isToday,
            'cal-cell--out': !item.inMonth && !item.isNamedHoliday,
            'cal-cell--we': item.inMonth && !item.isToday && !item.isNamedHoliday && (item.date.getDay() === 0 || item.date.getDay() === 6)
          }]"
          @mouseenter="showTooltip(item, $event)"
          @mouseleave="hideTooltip"
        >
          <span class="cal-num">{{ item.date.getDate() }}</span>
          <span v-if="item.isToday" class="cal-dot"></span>
          <span v-else-if="item.isNamedHoliday" class="cal-badge cal-badge--r">休</span>
          <span v-else-if="item.isCompensationWorkday && item.inMonth" class="cal-badge cal-badge--w">班</span>
          <span v-else-if="item.inMonth" class="cal-sub">{{ item.lunar.shortLabel }}</span>
        </div>
      </div>

      <!-- Tooltip -->
      <CalendarDayTooltip
        v-if="tooltipDay"
        :day="tooltipDay"
        :x="tooltipPos.x"
        :y="tooltipPos.y"
        :visible="tooltipVisible"
      />
    </template>
  </div>
</template>

<style scoped>
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.cal-header-left {
  display: flex;
  align-items: center;
  gap: 4px;
}
.cal-month-btn {
  display: flex;
  align-items: baseline;
  gap: 3px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 6px;
  transition: background 120ms ease;
}
.cal-month-btn:hover {
  background: rgba(99, 102, 241, 0.06);
}
.cal-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 120ms ease;
}
.cal-nav-btn:hover {
  background: rgba(99, 102, 241, 0.08);
  color: #4338ca;
}
.cal-month {
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1;
  color: #1e293b;
}
.cal-month-unit {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
}
.cal-year {
  font-size: 0.7rem;
  color: #b0adc0;
  margin-left: 2px;
}
.cal-lunar-tag {
  font-size: 10px;
  color: #94a3b8;
  background: rgba(0,0,0,0.03);
  padding: 2px 7px;
  border-radius: 5px;
}

/* weekday row */
.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 2px;
}
.cal-wd {
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  color: #b0adc0;
  padding: 3px 0;
}
.cal-wd--we {
  color: #f0a0b8;
}

/* day grid */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(auto-fill, 1fr);
  flex: 1;
  gap: 1px;
}
.cal-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0px;
  border-radius: 8px;
  min-height: 0;
  position: relative;
  cursor: pointer;
  transition: background 120ms ease;
}
.cal-cell:not(.cal-cell--out):not(.cal-cell--today):hover {
  background: rgba(99, 102, 241, 0.04);
}
.cal-num {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.1;
  color: #334155;
}
.cal-sub {
  font-size: 8px;
  line-height: 1;
  color: #c4c1d4;
  margin-top: 1px;
}

/* today */
.cal-cell--today .cal-num {
  color: #1e293b;
  font-weight: 800;
}

.cal-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #0d9488;
  margin-top: 2px;
}

/* named holiday */
.cal-cell--hol {
  background: rgba(225, 29, 72, 0.1);
  border-radius: 8px;
}
.cal-cell--hol .cal-num { color: #e11d48; }

/* compensation workday */
.cal-cell--comp .cal-num { color: #475569; }

/* weekend */
.cal-cell--we .cal-num { color: #f0a0b8; }

/* outside month */
.cal-cell--out .cal-num { color: #ddd8e8; }
.cal-cell--out .cal-sub { display: none; }

/* badges */
.cal-badge {
  font-size: 7px;
  font-weight: 700;
  line-height: 1;
  margin-top: 1px;
}
.cal-badge--r { color: #e11d48; }
.cal-badge--w { color: #475569; }

</style>
