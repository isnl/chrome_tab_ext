<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import WeatherGlyph from "@/components/common/WeatherGlyph.vue";
import WeatherEffects from "@/components/weather/WeatherEffects.vue";
import { useWeather } from "@/composables/useWeather";
import type { WeatherDailyItem } from "@/types/weather";
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
const dailyForecast = computed(() => weatherState.weather.value?.daily.slice(0, 7) ?? []);
const selectedDailyIndex = ref(0);
const selectedDaily = computed(() => dailyForecast.value[selectedDailyIndex.value] ?? dailyForecast.value[0] ?? null);
const selectedDailyMeta = computed(() =>
  selectedDaily.value ? getWeatherMeta(selectedDaily.value.weatherCode) : getWeatherMeta(0)
);
const canSelectPreviousDay = computed(() => selectedDailyIndex.value > 0);
const canSelectNextDay = computed(() => selectedDailyIndex.value < dailyForecast.value.length - 1);

function createLocalDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDailyTabLabel(item: WeatherDailyItem, index: number) {
  if (index === 0) return "今天";
  if (index === 1) return "明天";

  return createLocalDate(item.date).toLocaleDateString("zh-CN", {
    weekday: "short"
  });
}

function formatDailyDetailDate(item: WeatherDailyItem, index: number) {
  const label = index === 0 ? "今天" : index === 1 ? "明天" : formatDailyTabLabel(item, index);
  const date = createLocalDate(item.date).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric"
  });

  return `${label} · ${date}`;
}

function selectDailyIndex(index: number) {
  if (index < 0 || index >= dailyForecast.value.length) {
    return;
  }

  selectedDailyIndex.value = index;
}

function stepDaily(direction: -1 | 1) {
  selectDailyIndex(selectedDailyIndex.value + direction);
}

watch(
  () => dailyForecast.value.length,
  (length) => {
    if (selectedDailyIndex.value >= length) {
      selectedDailyIndex.value = Math.max(0, length - 1);
    }
  }
);

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

      <!-- 4x4: seven-day interactive forecast -->
      <template v-else-if="size === '4x4'">
        <div class="flex h-full min-h-0 flex-col gap-2">
          <div class="flex flex-none items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-[11px] font-semibold text-slate-400">
                {{ weatherState.location.value?.name ?? "..." }}
              </p>
              <div class="mt-1 flex items-end gap-2">
                <p class="widget-value text-[2.35rem] leading-none">
                  {{ weatherState.weather.value.current.temperature }}°
                </p>
                <div class="min-w-0 pb-0.5">
                  <p class="truncate text-[12px] font-semibold text-slate-600">{{ currentMeta.label }}</p>
                  <p v-if="today" class="text-[10px] text-slate-400">
                    今日 {{ today.max }}°/{{ today.min }}°
                  </p>
                </div>
              </div>
            </div>

            <span class="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-white/55" :class="currentMeta.accent">
              <WeatherGlyph :name="currentMeta.icon" size-class="h-6 w-6" />
            </span>
          </div>

          <div
            v-if="selectedDaily"
            class="relative min-h-0 flex-1 overflow-hidden rounded-[18px] border border-white/70 bg-gradient-to-br p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
            :class="selectedDailyMeta.panelTint"
          >
            <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.38),transparent_42%)]"></div>
            <div class="relative z-10 flex h-full min-h-0 flex-col justify-between gap-2">
              <div class="flex items-center justify-between gap-2">
                <button
                  class="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-white/70 bg-white/54 text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-800 disabled:opacity-35"
                  type="button"
                  aria-label="查看前一天预报"
                  :disabled="!canSelectPreviousDay"
                  @pointerdown.stop
                  @click.stop="stepDaily(-1)"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>

                <div class="min-w-0 text-center">
                  <p class="truncate text-[11px] font-semibold text-slate-500">
                    {{ formatDailyDetailDate(selectedDaily, selectedDailyIndex) }}
                  </p>
                  <p class="truncate text-[13px] font-semibold text-slate-800">
                    {{ selectedDailyMeta.label }}
                  </p>
                </div>

                <button
                  class="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-white/70 bg-white/54 text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-800 disabled:opacity-35"
                  type="button"
                  aria-label="查看后一天预报"
                  :disabled="!canSelectNextDay"
                  @pointerdown.stop
                  @click.stop="stepDaily(1)"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>

              <div class="flex min-h-0 items-end justify-between gap-3">
                <div class="flex min-w-0 items-center gap-2">
                  <span class="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-white/58" :class="selectedDailyMeta.accent">
                    <WeatherGlyph :name="selectedDailyMeta.icon" size-class="h-6 w-6" />
                  </span>
                  <div class="min-w-0">
                    <p class="text-[1.6rem] font-semibold leading-none text-slate-900">
                      {{ selectedDaily.max }}° / {{ selectedDaily.min }}°
                    </p>
                    <p class="mt-1 truncate text-[10px] text-slate-500">
                      降水 {{ selectedDaily.precipitationProbability }}%
                    </p>
                  </div>
                </div>

                <p class="flex-none text-right text-[10px] leading-4 text-slate-500">
                  第 {{ selectedDailyIndex + 1 }}/{{ dailyForecast.length }} 天
                </p>
              </div>
            </div>
          </div>

          <div class="grid flex-none grid-cols-7 gap-1">
            <button
              v-for="(item, index) in dailyForecast"
              :key="item.date"
              class="min-w-0 rounded-xl border px-1 py-1 text-center transition-colors"
              :class="index === selectedDailyIndex
                ? 'border-indigo-200 bg-white/80 text-indigo-700 shadow-[0_8px_18px_-16px_rgba(79,70,229,0.42)]'
                : 'border-white/50 bg-white/36 text-slate-500 hover:bg-white/62 hover:text-slate-700'"
              type="button"
              :aria-label="`选择 ${formatDailyDetailDate(item, index)} 天气`"
              :aria-pressed="index === selectedDailyIndex"
              @pointerdown.stop
              @click.stop="selectDailyIndex(index)"
            >
              <span class="block truncate text-[9px] font-semibold leading-3">
                {{ formatDailyTabLabel(item, index) }}
              </span>
              <span class="mt-0.5 flex justify-center" :class="getWeatherMeta(item.weatherCode).accent">
                <WeatherGlyph :name="getWeatherMeta(item.weatherCode).icon" size-class="h-3.5 w-3.5" />
              </span>
              <span class="mt-0.5 block text-[10px] font-semibold leading-3">
                {{ item.max }}°
              </span>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
