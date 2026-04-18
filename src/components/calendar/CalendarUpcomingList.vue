<script setup lang="ts">
import type { UpcomingHolidaySegment } from "@/types/calendar";
import { createRangeLabel, differenceInDays } from "@/utils/date";

const props = defineProps<{
  items: UpcomingHolidaySegment[];
  selectedDate: Date;
}>();

function dayOffset(date: Date) {
  return differenceInDays(props.selectedDate, date);
}

function toneClass(label: string) {
  return label === "周末"
    ? "bg-slate-100 text-slate-600"
    : "bg-rose-100 text-rose-700";
}
</script>

<template>
  <section class="inner-panel p-5">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="section-kicker">Upcoming Breaks</p>
        <h3 class="mt-2 text-xl font-semibold text-slate-900">近期放假安排</h3>
      </div>
      <span class="text-sm text-slate-500">
        {{ items[0] ? (dayOffset(items[0].start) === 0 ? `${items[0].label} 进行中` : `${dayOffset(items[0].start)} 天后开始`) : "近期暂无记录" }}
      </span>
    </div>

    <div class="mt-4 grid gap-3">
      <article
        v-for="item in items"
        :key="`${item.start.toISOString()}-${item.end.toISOString()}`"
        class="tone-panel p-4 transition duration-200 hover:-translate-y-0.5"
        style="--tone-bg: linear-gradient(148deg, rgba(255,255,255,0.88), rgba(255,248,250,0.76)); --tone-glow: radial-gradient(circle at top right, rgba(236,72,153,0.1), transparent 42%);"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" :class="toneClass(item.label)">
                {{ item.label }}
              </span>
              <span class="text-sm text-slate-400">{{ item.days }} 天</span>
            </div>
            <p class="mt-3 text-base font-semibold text-slate-900">{{ createRangeLabel(item.start, item.end) }}</p>
            <p class="mt-1 text-sm text-slate-500">
              {{ dayOffset(item.start) === 0 ? "今天开始/正在进行" : `还有 ${dayOffset(item.start)} 天` }}
            </p>
          </div>

          <p class="max-w-[18rem] text-sm leading-6 text-slate-500">
            {{ item.notes.length ? `调休提示：${item.notes.join("，")}` : "暂无补班提醒" }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>
