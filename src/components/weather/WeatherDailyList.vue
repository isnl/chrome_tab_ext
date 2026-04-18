<script setup lang="ts">
import WeatherGlyph from "@/components/common/WeatherGlyph.vue";
import type { WeatherDailyItem } from "@/types/weather";
import { getWeatherMeta } from "@/utils/weather";

defineProps<{
  items: WeatherDailyItem[];
}>();
</script>

<template>
  <div class="grid gap-3">
    <article
      v-for="item in items"
      :key="item.date"
      class="tone-panel flex flex-col gap-3 px-4 py-4 transition duration-200 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
      style="--tone-bg: linear-gradient(148deg, rgba(255,255,255,0.88), rgba(248,246,255,0.72)); --tone-glow: radial-gradient(circle at top right, rgba(99,102,241,0.1), transparent 42%);"
    >
      <div class="flex items-center gap-4">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/72">
          <span :class="getWeatherMeta(item.weatherCode).accent">
            <WeatherGlyph :name="getWeatherMeta(item.weatherCode).icon" size-class="h-6 w-6" />
          </span>
        </div>
        <div>
          <p class="text-base font-semibold text-slate-900">
            {{
              new Date(item.date).toLocaleDateString("zh-CN", {
                month: "numeric",
                day: "numeric",
                weekday: "short"
              })
            }}
          </p>
          <p class="mt-1 text-sm text-slate-500">{{ getWeatherMeta(item.weatherCode).label }}</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span class="pill-tag normal-case tracking-normal">{{ item.max }}° / {{ item.min }}°</span>
        <span class="pill-tag normal-case tracking-normal">降水 {{ item.precipitationProbability }}%</span>
      </div>
    </article>
  </div>
</template>
