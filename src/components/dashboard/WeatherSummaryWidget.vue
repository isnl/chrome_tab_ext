<script setup lang="ts">
import { computed, onMounted } from "vue";

import WeatherGlyph from "@/components/common/WeatherGlyph.vue";
import { useWeather } from "@/composables/useWeather";
import type { WidgetSize } from "@/types/widget";
import { getWeatherMeta } from "@/utils/weather";

defineProps<{
  size: WidgetSize;
}>();

const weatherState = useWeather();

const currentMeta = computed(() =>
  weatherState.weather.value ? getWeatherMeta(weatherState.weather.value.current.weatherCode) : getWeatherMeta(0)
);

const nextHours = computed(() => weatherState.weather.value?.hourly.slice(0, 3) ?? []);
const today = computed(() => weatherState.weather.value?.daily[0] ?? null);

onMounted(() => {
  void weatherState.initialize();
});
</script>

<template>
  <div v-if="weatherState.isLoading.value && !weatherState.weather.value" class="grid h-full animate-pulse gap-3">
    <div class="rounded-[22px] bg-slate-100/90"></div>
    <div v-if="size !== '1x1'" class="rounded-[22px] bg-slate-100/80"></div>
  </div>

  <div v-else-if="weatherState.error.value && !weatherState.weather.value" class="flex h-full items-end">
    <p class="text-sm leading-6 text-rose-600">{{ weatherState.error.value }}</p>
  </div>

  <div v-else-if="weatherState.weather.value" class="flex h-full flex-col">
    <template v-if="size === '1x1'">
      <div class="flex items-center justify-between">
        <p class="line-clamp-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {{ weatherState.location.value?.name ?? "定位中" }}
        </p>
        <span
          class="inline-flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/70"
          :class="currentMeta.accent"
        >
          <WeatherGlyph :name="currentMeta.icon" size-class="h-7 w-7" />
        </span>
      </div>

      <div
        class="tone-panel mt-auto p-3"
        style="--tone-bg: linear-gradient(145deg, rgba(243,249,255,0.92), rgba(226,242,255,0.82) 56%, rgba(240,253,250,0.76)); --tone-glow: radial-gradient(circle at top right, rgba(56,189,248,0.24), transparent 40%);"
      >
        <p class="widget-value text-[3.25rem] leading-none">
          {{ weatherState.weather.value.current.temperature }}°
        </p>
        <div class="mt-3 flex items-center justify-between gap-3">
          <p class="text-sm font-medium text-slate-700">{{ currentMeta.label }}</p>
          <p class="text-xs text-slate-500">体感 {{ weatherState.weather.value.current.apparentTemperature }}°</p>
        </div>
      </div>
    </template>

    <template v-else-if="size === '1x2'">
      <div
        class="tone-panel px-4 py-4"
        style="--tone-bg: linear-gradient(150deg, rgba(243,249,255,0.94), rgba(226,242,255,0.84) 54%, rgba(240,253,250,0.78)); --tone-glow: radial-gradient(circle at top right, rgba(56,189,248,0.22), transparent 42%);"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="line-clamp-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {{ weatherState.locationLabel.value }}
            </p>
            <p class="widget-value mt-3 text-5xl leading-none">
              {{ weatherState.weather.value.current.temperature }}°
            </p>
            <p class="mt-3 text-sm font-medium text-slate-700">{{ currentMeta.label }}</p>
          </div>
          <span class="rounded-[20px] bg-white/72 p-2.5" :class="currentMeta.accent">
            <WeatherGlyph :name="currentMeta.icon" size-class="h-10 w-10" />
          </span>
        </div>
      </div>

      <div class="mt-3 grid gap-2">
        <div class="stat-tile">
          <p class="mini-kicker">今日摘要</p>
          <p class="mt-2 text-sm font-semibold text-slate-900">
            体感 {{ weatherState.weather.value.current.apparentTemperature }}° · 湿度 {{ weatherState.weather.value.current.humidity }}%
          </p>
          <p v-if="today" class="mt-1 text-sm text-slate-500">最高 {{ today.max }}° / 最低 {{ today.min }}°</p>
        </div>

        <div class="stat-tile">
          <p class="mini-kicker">Wind</p>
          <p class="mt-2 text-sm font-semibold text-slate-900">{{ weatherState.weather.value.current.windSpeed }} km/h</p>
          <p class="mt-1 text-sm text-slate-500">降水 {{ weatherState.weather.value.current.precipitation }} mm</p>
        </div>
      </div>
    </template>

    <template v-else>
      <div
        class="tone-panel px-5 py-5"
        style="--tone-bg: linear-gradient(150deg, rgba(243,249,255,0.94), rgba(226,242,255,0.84) 54%, rgba(240,253,250,0.78)); --tone-glow: radial-gradient(circle at top right, rgba(56,189,248,0.2), transparent 42%);"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="line-clamp-1 text-sm font-medium text-slate-500">{{ weatherState.locationLabel.value }}</p>
            <p class="widget-value mt-3 text-6xl leading-none">
              {{ weatherState.weather.value.current.temperature }}°
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                {{ currentMeta.label }}
              </span>
              <span class="text-sm text-slate-500">体感 {{ weatherState.weather.value.current.apparentTemperature }}°</span>
            </div>
          </div>
          <span class="rounded-[22px] bg-white/72 p-3" :class="currentMeta.accent">
            <WeatherGlyph :name="currentMeta.icon" size-class="h-12 w-12" />
          </span>
        </div>
      </div>

      <div class="mt-3 grid grid-cols-3 gap-2">
        <article
          v-for="item in nextHours"
          :key="item.time"
          class="stat-tile px-3 py-3"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{{ item.timeLabel }}</p>
            <span :class="getWeatherMeta(item.weatherCode).accent">
              <WeatherGlyph :name="getWeatherMeta(item.weatherCode).icon" size-class="h-4 w-4" />
            </span>
          </div>
          <p class="mt-3 text-xl font-semibold tracking-tight text-slate-900">{{ item.temperature }}°</p>
          <p class="mt-1 line-clamp-1 text-xs text-slate-500">{{ getWeatherMeta(item.weatherCode).label }}</p>
        </article>
      </div>

      <div class="mt-auto grid grid-cols-2 gap-2">
        <div class="stat-tile">
          <p class="mini-kicker">风速</p>
          <p class="mt-2 text-lg font-semibold text-slate-900">{{ weatherState.weather.value.current.windSpeed }} km/h</p>
        </div>
        <div class="stat-tile">
          <p class="mini-kicker">降水</p>
          <p class="mt-2 text-lg font-semibold text-slate-900">{{ weatherState.weather.value.current.precipitation }} mm</p>
        </div>
      </div>
    </template>
  </div>
</template>
