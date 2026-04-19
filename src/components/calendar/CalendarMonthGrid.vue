<script setup lang="ts">
import type { CalendarDayViewModel } from "@/types/calendar";

defineProps<{
  monthLabel: string;
  monthSubtitle: string;
  items: CalendarDayViewModel[];
}>();

const emit = defineEmits<{
  prev: [];
  next: [];
  select: [value: Date];
}>();

function cellClasses(item: CalendarDayViewModel) {
  return [
    "group relative flex aspect-[0.88] min-w-0 flex-col rounded-[22px] border px-3 py-3 text-left transition duration-200",
    item.inMonth || item.isNamedHoliday ? "border-white/80 bg-white/84" : "border-transparent bg-slate-100/55 text-slate-400",
    item.isSelected
      ? "border-violet-300 bg-violet-500 shadow-[0_20px_40px_-24px_rgba(139,92,246,0.65)] ring-2 ring-violet-200/90 ring-offset-2 ring-offset-white"
      : "",
    item.isToday && !item.isSelected ? "" : "",
    item.isNamedHoliday && !item.isSelected ? "border-rose-300 bg-rose-100/90 shadow-[0_2px_8px_-2px_rgba(225,29,72,0.18)]" : "",
    item.isCompensationWorkday && !item.isSelected ? "" : "",
    item.isSelected ? "" : item.isToday ? "hover:-translate-y-0.5" : "hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/70"
  ];
}
</script>

<template>
  <section class="inner-panel p-4 sm:p-5">
    <div class="flex items-center justify-between gap-3">
      <button class="soft-button h-11 w-11 rounded-2xl px-0" type="button" @click="emit('prev')">
        ‹
      </button>

      <div class="text-center">
        <h3 class="font-display text-3xl font-semibold tracking-tight text-slate-900">{{ monthLabel }}</h3>
        <p class="mt-2 text-sm text-slate-500">{{ monthSubtitle }}</p>
      </div>

      <button class="soft-button h-11 w-11 rounded-2xl px-0" type="button" @click="emit('next')">
        ›
      </button>
    </div>

    <div class="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
      <span>一</span>
      <span>二</span>
      <span>三</span>
      <span>四</span>
      <span>五</span>
      <span>六</span>
      <span>日</span>
    </div>

    <div class="mt-3 grid grid-cols-7 gap-2">
      <button
        v-for="item in items"
        :key="item.date.toISOString()"
        :class="cellClasses(item)"
        :aria-pressed="item.isSelected"
        type="button"
        @click="emit('select', item.date)"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span
              class="text-lg tracking-tight"
              :class="[
                item.isSelected ? 'text-violet-50 font-semibold' : item.isToday ? 'text-slate-900 font-extrabold' : item.inMonth || item.isNamedHoliday ? 'text-slate-900 font-semibold' : 'text-slate-400 font-semibold'
              ]"
            >
              {{ item.date.getDate() }}
            </span>
            <span v-if="item.isToday && !item.isSelected" class="h-2 w-2 rounded-full bg-teal-500"></span>
          </div>
          <div class="flex flex-wrap justify-end gap-1">
            <span
              v-if="item.isNamedHoliday"
              class="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500/12 px-2 text-[11px] font-semibold text-rose-700"
            >
              休
            </span>
            <span
              v-if="item.isCompensationWorkday"
              class="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-500/12 px-2 text-[11px] font-semibold text-slate-700"
            >
              班
            </span>
          </div>
        </div>

        <div class="mt-auto">
          <p
            class="line-clamp-1 text-sm font-medium"
            :class="item.isSelected ? 'text-violet-50' : item.inMonth || item.isNamedHoliday ? 'text-slate-700' : 'text-slate-400'"
          >
            {{ item.subtitle }}
          </p>
          <p class="mt-1 text-xs" :class="item.isSelected ? 'text-violet-200' : item.inMonth ? 'text-slate-400' : 'text-slate-300'">
            {{ item.inMonth ? item.lunar.shortLabel : `${item.date.getMonth() + 1}/${item.date.getDate()}` }}
          </p>
        </div>
      </button>
    </div>
  </section>
</template>
