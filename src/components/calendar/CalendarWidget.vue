<script setup lang="ts">
import { computed, onMounted } from "vue";

import WidgetCard from "@/components/common/WidgetCard.vue";
import { useCalendar } from "@/composables/useCalendar";
import { getChineseZodiac } from "@/utils/date";

import CalendarDayDetails from "./CalendarDayDetails.vue";
import CalendarMonthGrid from "./CalendarMonthGrid.vue";
import CalendarUpcomingList from "./CalendarUpcomingList.vue";

const calendar = useCalendar();

const selectedDateLabel = computed(() => `${calendar.selectedDate.value.getMonth() + 1}月${calendar.selectedDate.value.getDate()}日`);
const lunarSummary = computed(
  () =>
    `农历 ${calendar.selectedLunar.value.monthLabel}${calendar.selectedLunar.value.dayLabel} · ${calendar.selectedLunar.value.yearName}年 · 生肖${getChineseZodiac(calendar.selectedLunar.value.lunarYear)}`
);

onMounted(() => {
  void calendar.initialize();
});
</script>

<template>
  <WidgetCard>
    <div class="widget-heading">
      <div>
        <p class="section-kicker">Calendar</p>
        <h2 class="section-title">日历总览</h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          月历、农历、节假日、调休和近期放假安排都保留，但信息按照“先看今天，再看整月，再看假期”的顺序重新排过。
        </p>
      </div>

      <button class="soft-button" type="button" @click="calendar.goToToday()">
        回到今天
      </button>
    </div>

    <div v-if="calendar.isLoading.value" class="mt-5 grid gap-4">
      <div class="inner-panel h-[720px] animate-pulse bg-white/70"></div>
      <div class="inner-panel h-80 animate-pulse bg-white/70"></div>
      <div class="inner-panel h-72 animate-pulse bg-white/70"></div>
    </div>

    <div
      v-else-if="calendar.error.value"
      class="mt-5 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700"
    >
      {{ calendar.error.value }}
    </div>

    <div v-else class="mt-5 grid gap-4">
      <CalendarMonthGrid
        :month-label="calendar.monthLabel.value"
        :month-subtitle="calendar.monthSubtitle.value"
        :items="calendar.monthGrid.value"
        @prev="calendar.goToPreviousMonth"
        @next="calendar.goToNextMonth"
        @select="calendar.selectDate"
      />

      <CalendarDayDetails
        :selected-date-label="selectedDateLabel"
        :lunar-summary="lunarSummary"
        :badges="calendar.selectedStatusBadges.value"
        :detail-items="calendar.detailItems.value"
      />

      <CalendarUpcomingList
        :items="calendar.upcomingSegments.value"
        :selected-date="calendar.selectedDate.value"
      />
    </div>
  </WidgetCard>
</template>
