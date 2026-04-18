<script setup lang="ts">
import WeatherGlyph from "@/components/common/WeatherGlyph.vue";
import type { WeatherHourlySlot } from "@/types/weather";
import { getWeatherMeta } from "@/utils/weather";

defineProps<{
  items: WeatherHourlySlot[];
}>();
</script>

<template>
  <div class="scroll-soft flex w-full max-w-full gap-3 overflow-x-auto pb-1 pr-1">
    <article
      v-for="item in items"
      :key="item.time"
      class="tone-panel min-w-[114px] shrink-0 p-4"
      style="--tone-bg: linear-gradient(148deg, rgba(248,246,255,0.88), rgba(237,233,254,0.72)); --tone-glow: radial-gradient(circle at top right, rgba(99,102,241,0.14), transparent 40%);"
    >
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm font-medium text-slate-500">{{ item.timeLabel }}</span>
        <span :class="getWeatherMeta(item.weatherCode).accent">
          <WeatherGlyph :name="getWeatherMeta(item.weatherCode).icon" size-class="h-5 w-5" />
        </span>
      </div>
      <p class="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{{ item.temperature }}°</p>
      <p class="mt-1 text-sm text-slate-500">{{ getWeatherMeta(item.weatherCode).label }}</p>
      <p class="mt-3 text-xs text-slate-400">降水概率 {{ item.precipitationProbability }}%</p>
    </article>
  </div>
</template>
