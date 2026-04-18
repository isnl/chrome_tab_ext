<script setup lang="ts">
import type { CalendarDetailItem } from "@/types/calendar";

defineProps<{
  selectedDateLabel: string;
  lunarSummary: string;
  badges: string[];
  detailItems: CalendarDetailItem[];
}>();
</script>

<template>
  <section class="inner-panel p-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="section-kicker">Selected Day</p>
        <h3 class="mt-2 font-display text-[2.25rem] font-semibold tracking-tight text-slate-900">
          {{ selectedDateLabel }}
        </h3>
      </div>

      <div class="flex flex-wrap gap-2 sm:justify-end">
        <span v-for="badge in badges" :key="badge" class="pill-tag normal-case tracking-normal">
          {{ badge }}
        </span>
      </div>
    </div>

    <p class="mt-3 text-base leading-7 text-slate-600">{{ lunarSummary }}</p>

    <div class="mt-5 grid gap-3 sm:grid-cols-2">
      <article v-for="item in detailItems" :key="item.label" class="stat-tile">
        <p class="mini-kicker">{{ item.label }}</p>
        <p class="mt-3 text-lg font-semibold tracking-tight text-slate-900">{{ item.value }}</p>
        <p class="mt-1 text-sm text-slate-500">{{ item.hint }}</p>
      </article>
    </div>
  </section>
</template>
