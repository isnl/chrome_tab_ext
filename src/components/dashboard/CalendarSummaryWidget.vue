<script setup lang="ts">
import { computed, onMounted } from "vue";

import { useCalendar } from "@/composables/useCalendar";
import type { WidgetSize } from "@/types/widget";
import { createRangeLabel } from "@/utils/date";

defineProps<{
  size: WidgetSize;
}>();

const calendar = useCalendar();

const todayCell = computed(() => calendar.monthGrid.value.find((item) => item.isToday) ?? calendar.monthGrid.value[0]);
const previewDays = computed(() => calendar.monthGrid.value);
const upcomingItems = computed(() => calendar.upcomingSegments.value.slice(0, 3));

onMounted(() => {
  void calendar.initialize();
});
</script>

<template>
  <div v-if="calendar.isLoading.value" class="grid h-full animate-pulse gap-3">
    <div class="rounded-[22px] bg-slate-100/90"></div>
    <div class="rounded-[22px] bg-slate-100/80"></div>
  </div>

  <div v-else-if="calendar.error.value" class="flex h-full items-end">
    <p class="text-sm leading-6 text-rose-600">{{ calendar.error.value }}</p>
  </div>

  <div v-else class="flex h-full flex-col">
    <template v-if="size === '1x1' && todayCell">
      <div class="flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Today</p>
        <p class="text-xs text-slate-500">{{ calendar.monthLabel.value }}</p>
      </div>

      <div
        class="tone-panel mt-auto p-3"
        style="--tone-bg: linear-gradient(145deg, rgba(255,247,242,0.92), rgba(255,236,226,0.82) 54%, rgba(244,250,247,0.74)); --tone-glow: radial-gradient(circle at top right, rgba(251,146,60,0.18), transparent 40%);"
      >
        <p class="widget-value text-[3.55rem] leading-none">
          {{ todayCell.date.getDate() }}
        </p>
        <p class="mt-3 text-sm font-semibold text-slate-700">{{ todayCell.subtitle }}</p>
        <p class="mt-1 text-sm text-slate-500">{{ calendar.selectedLunar.value.shortLabel }}</p>
      </div>
    </template>

    <template v-else-if="size === '2x2'">
      <div class="flex items-end justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{{ calendar.monthLabel.value }}</p>
          <p class="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            {{ calendar.selectedDate.value.getMonth() + 1 }}月{{ calendar.selectedDate.value.getDate() }}日
          </p>
        </div>
        <div class="rounded-full bg-orange-100/80 px-3 py-1 text-xs font-semibold text-orange-700">
          {{ calendar.selectedLunar.value.shortLabel }}
        </div>
      </div>

      <div class="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-500">
        <span>日</span>
        <span>一</span>
        <span>二</span>
        <span>三</span>
        <span>四</span>
        <span>五</span>
        <span>六</span>
      </div>

      <div class="mt-2 grid grid-cols-7 gap-1">
        <span
          v-for="item in previewDays"
          :key="item.date.toISOString()"
          class="flex h-9 items-center justify-center rounded-[14px] border text-xs font-medium transition duration-200"
          :class="
            item.isSelected
              ? 'border-orange-300 bg-orange-500 text-white shadow-[0_16px_28px_-20px_rgba(249,115,22,0.65)]'
              : item.isToday
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : item.inMonth
                  ? 'border-white/80 bg-white/68 text-slate-700'
                  : 'border-transparent text-slate-300'
          "
        >
          {{ item.date.getDate() }}
        </span>
      </div>

      <div class="stat-tile mt-auto">
        <p class="mini-kicker">近期放假</p>
        <p class="mt-2 text-sm font-semibold text-slate-900">
          {{ upcomingItems[0] ? `${upcomingItems[0].label} · ${upcomingItems[0].days} 天` : "近期暂无记录" }}
        </p>
        <p class="mt-1 text-sm text-slate-500">
          {{ upcomingItems[0] ? createRangeLabel(upcomingItems[0].start, upcomingItems[0].end) : "节假日数据将在这里显示" }}
        </p>
      </div>
    </template>

    <template v-else>
      <div class="grid h-full gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div class="flex min-h-0 flex-col">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{{ calendar.monthLabel.value }}</p>
              <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {{ calendar.selectedDate.value.getMonth() + 1 }}月{{ calendar.selectedDate.value.getDate() }}日
              </p>
              <p class="mt-2 text-sm text-slate-500">{{ calendar.selectedLunar.value.fullLabel }}</p>
            </div>
            <div class="flex flex-wrap justify-end gap-2">
              <span
                v-for="badge in calendar.selectedStatusBadges.value"
                :key="badge"
                class="rounded-full bg-orange-100/80 px-3 py-1 text-xs font-semibold text-orange-700"
              >
                {{ badge }}
              </span>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] font-medium text-slate-500">
            <span>日</span>
            <span>一</span>
            <span>二</span>
            <span>三</span>
            <span>四</span>
            <span>五</span>
            <span>六</span>
          </div>

          <div class="mt-2 grid flex-1 grid-cols-7 gap-2">
            <div
              v-for="item in previewDays"
              :key="item.date.toISOString()"
              class="flex min-h-[72px] min-w-0 flex-col items-start rounded-[18px] border px-2.5 py-2 text-left transition duration-200"
              :class="
                item.isSelected
                  ? 'border-orange-300 bg-orange-500 text-white shadow-[0_18px_32px_-24px_rgba(249,115,22,0.68)]'
                  : item.isToday
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : item.inMonth
                      ? 'border-white/80 bg-white/72 text-slate-700'
                      : 'border-transparent bg-slate-100/70 text-slate-300'
              "
            >
              <span class="text-sm font-semibold">{{ item.date.getDate() }}</span>
              <span
                class="mt-1 line-clamp-1 text-[10px]"
                :class="item.isSelected ? 'text-orange-100' : item.inMonth ? 'text-slate-500' : 'text-slate-300'"
              >
                {{ item.inMonth ? item.lunar.shortLabel : `${item.date.getMonth() + 1}/${item.date.getDate()}` }}
              </span>
            </div>
          </div>
        </div>

        <div class="grid gap-3">
          <div class="stat-tile">
            <p class="mini-kicker">选中日期</p>
            <p class="mt-2 text-lg font-semibold tracking-tight text-slate-900">
              {{ calendar.selectedDate.value.getMonth() + 1 }}月{{ calendar.selectedDate.value.getDate() }}日
            </p>
            <p class="mt-2 text-sm leading-6 text-slate-500">{{ calendar.selectedLunar.value.fullLabel }}</p>
          </div>

          <article
            v-for="item in upcomingItems"
            :key="`${item.start.toISOString()}-${item.end.toISOString()}`"
            class="stat-tile"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-slate-900">{{ item.label }}</p>
              <span class="rounded-full bg-orange-100/80 px-2.5 py-1 text-xs font-semibold text-orange-700">{{ item.days }} 天</span>
            </div>
            <p class="mt-3 text-sm text-slate-500">{{ createRangeLabel(item.start, item.end) }}</p>
          </article>
        </div>
      </div>
    </template>
  </div>
</template>
