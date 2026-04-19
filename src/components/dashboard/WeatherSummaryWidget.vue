<script setup lang="ts">
import { computed, onMounted } from "vue";

import WeatherGlyph from "@/components/common/WeatherGlyph.vue";
import WeatherEffects from "@/components/weather/WeatherEffects.vue";
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

const nextHours = computed(() => weatherState.weather.value?.hourly.slice(0, 4) ?? []);
const next3Hours = computed(() => weatherState.weather.value?.hourly.slice(0, 3) ?? []);
const today = computed(() => weatherState.weather.value?.daily[0] ?? null);

onMounted(() => {
  void weatherState.initialize();
});
</script>

<template>
  <div v-if="weatherState.isLoading.value && !weatherState.weather.value" class="flex h-full items-center justify-center">
    <div class="h-8 w-8 animate-pulse rounded-full bg-slate-200/80"></div>
  </div>

  <div v-else-if="weatherState.error.value && !weatherState.weather.value" class="flex h-full items-end">
    <p class="text-xs text-rose-500">{{ weatherState.error.value }}</p>
  </div>

  <div v-else-if="weatherState.weather.value" class="relative flex h-full flex-col">
    <!-- Weather effects background -->
    <WeatherEffects
      :weather-code="weatherState.weather.value.current.weatherCode"
      :is-day="weatherState.weather.value.current.isDay"
    />

    <!-- Content layer -->
    <div class="relative z-10 flex h-full flex-col">
      <!-- 1x1: mini temp + icon + label -->
      <template v-if="size === '1x1'">
        <div class="flex h-full flex-col items-center justify-center gap-0.5 text-center">
          <span :class="currentMeta.accent">
            <WeatherGlyph :name="currentMeta.icon" size-class="h-4 w-4" />
          </span>
          <p class="widget-value text-[1.25rem] leading-none">
            {{ weatherState.weather.value.current.temperature }}°
          </p>
          <p class="max-w-full truncate text-[9px] font-medium text-slate-600 drop-shadow-[0_0_3px_rgba(255,255,255,1)]">{{ currentMeta.label }}</p>
        </div>
      </template>

      <!-- 2x1: compact bar -->
      <template v-else-if="size === '2x1'">
        <div class="flex h-full items-center gap-3">
          <span :class="currentMeta.accent">
            <WeatherGlyph :name="currentMeta.icon" size-class="h-5 w-5" />
          </span>
          <p class="widget-value text-[1.5rem] leading-none">
            {{ weatherState.weather.value.current.temperature }}°
          </p>
          <span class="min-w-0 truncate text-xs text-slate-500">{{ currentMeta.label }}</span>
          <span class="ml-auto text-xs text-slate-400">{{ weatherState.location.value?.name ?? "..." }}</span>
        </div>
      </template>

      <!-- 2x2: enriched display -->
      <template v-else-if="size === '2x2'">
        <div class="flex items-center justify-between">
          <p class="line-clamp-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            {{ weatherState.location.value?.name ?? "..." }}
          </p>
          <span :class="currentMeta.accent">
            <WeatherGlyph :name="currentMeta.icon" size-class="h-5 w-5" />
          </span>
        </div>

        <!-- Main temp -->
        <div class="mt-1">
          <p class="widget-value text-[2.4rem] leading-none">
            {{ weatherState.weather.value.current.temperature }}°
          </p>
          <div class="mt-1 flex items-center gap-2 text-[11px]">
            <span class="text-slate-600">{{ currentMeta.label }}</span>
            <span v-if="today" class="text-slate-400">{{ today.max }}°/{{ today.min }}°</span>
          </div>
        </div>

        <!-- 3-hour mini forecast -->
        <div class="mt-auto grid grid-cols-3 gap-1">
          <div
            v-for="item in next3Hours"
            :key="item.time"
            class="flex items-center gap-1.5 rounded-lg bg-white/35 px-1.5 py-1"
          >
            <span :class="getWeatherMeta(item.weatherCode).accent">
              <WeatherGlyph :name="getWeatherMeta(item.weatherCode).icon" size-class="h-3.5 w-3.5" />
            </span>
            <span class="text-[11px] font-semibold text-slate-600">{{ item.temperature }}°</span>
          </div>
        </div>
      </template>

      <!-- 4x2: wide horizontal display -->
      <template v-else-if="size === '4x2'">
        <div class="flex h-full gap-4">
          <!-- Left: current conditions -->
          <div class="flex min-w-0 flex-1 flex-col">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-[11px] font-medium text-slate-400">{{ weatherState.location.value?.name ?? "..." }}</p>
                <div class="mt-1 flex items-baseline gap-2">
                  <p class="widget-value text-[2.8rem] leading-none">{{ weatherState.weather.value.current.temperature }}°</p>
                  <span class="text-sm text-slate-500">{{ currentMeta.label }}</span>
                </div>
              </div>
              <span class="flex-shrink-0 rounded-2xl bg-white/50 p-2" :class="currentMeta.accent">
                <WeatherGlyph :name="currentMeta.icon" size-class="h-8 w-8" />
              </span>
            </div>
            <div class="mt-auto flex items-center gap-3 text-xs text-slate-400">
              <span v-if="today">{{ today.max }}° / {{ today.min }}°</span>
              <span>{{ weatherState.weather.value.current.humidity }}%</span>
              <span>{{ weatherState.weather.value.current.windSpeed }} km/h</span>
            </div>
          </div>

          <!-- Right: hourly forecast -->
          <div class="flex flex-shrink-0 items-center gap-1.5">
            <div
              v-for="item in nextHours"
              :key="item.time"
              class="flex flex-col items-center gap-1 rounded-xl bg-white/40 px-2.5 py-2"
            >
              <p class="text-[10px] text-slate-400">{{ item.timeLabel }}</p>
              <span :class="getWeatherMeta(item.weatherCode).accent">
                <WeatherGlyph :name="getWeatherMeta(item.weatherCode).icon" size-class="h-4 w-4" />
              </span>
              <p class="text-[12px] font-semibold text-slate-700">{{ item.temperature }}°</p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
