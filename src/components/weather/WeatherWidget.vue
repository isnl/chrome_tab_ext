<script setup lang="ts">
import { computed, onMounted } from "vue";

import WidgetCard from "@/components/common/WidgetCard.vue";
import WeatherGlyph from "@/components/common/WeatherGlyph.vue";
import { useWeather } from "@/composables/useWeather";
import { getWeatherMeta, normalizeWeatherUpdatedAt } from "@/utils/weather";

import WeatherDailyList from "./WeatherDailyList.vue";
import WeatherHourlyList from "./WeatherHourlyList.vue";
import WeatherLocationPicker from "./WeatherLocationPicker.vue";

const weatherState = useWeather();

const currentMeta = computed(() =>
  weatherState.weather.value ? getWeatherMeta(weatherState.weather.value.current.weatherCode) : getWeatherMeta(0)
);
const todayForecast = computed(() => weatherState.weather.value?.daily[0] ?? null);

const statItems = computed(() => {
  const weather = weatherState.weather.value;
  if (!weather) {
    return [];
  }

  const today = weather.daily[0];

  return [
    {
      label: "体感温度",
      value: `${weather.current.apparentTemperature}°`,
      hint: "结合湿度与风速计算"
    },
    {
      label: "空气湿度",
      value: `${weather.current.humidity}%`,
      hint: "当前相对湿度"
    },
    {
      label: "风速",
      value: `${weather.current.windSpeed} km/h`,
      hint: "10 米高度实测"
    },
    {
      label: "降水",
      value: `${weather.current.precipitation} mm`,
      hint: "当前时段降水量"
    },
    {
      label: "日出",
      value: new Date(today.sunrise).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit"
      }),
      hint: "今天的日出时间"
    },
    {
      label: "日落",
      value: new Date(today.sunset).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit"
      }),
      hint: "今天的日落时间"
    }
  ];
});

function refreshWeather() {
  void weatherState.loadWeather(true);
}

onMounted(() => {
  void weatherState.initialize();
});
</script>

<template>
  <WidgetCard>
    <div class="widget-heading">
      <div>
        <p class="section-kicker">Weather</p>
        <h2 class="section-title">天气总览</h2>
        <p class="mt-3 max-w-sm text-sm leading-6 text-slate-500">
          首次打开按 IP 自动定位，同时支持改成固定城市。首页先看摘要，展开后把小时与多日趋势放在一张更干净的面板里。
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button class="soft-button" type="button" :disabled="weatherState.isRefreshing.value" @click="refreshWeather">
          {{ weatherState.isRefreshing.value ? "刷新中..." : "刷新" }}
        </button>
        <button class="soft-button" type="button" @click="weatherState.openEditor()">
          修改城市
        </button>
      </div>
    </div>

    <div
      v-if="weatherState.showNotice.value"
      class="tone-panel mt-5 flex flex-col gap-3 px-4 py-4 text-sm leading-6 text-amber-950"
      style="--tone-bg: linear-gradient(148deg, rgba(255,251,235,0.94), rgba(254,243,199,0.84)); --tone-glow: radial-gradient(circle at top right, rgba(245,158,11,0.16), transparent 42%);"
    >
      <div>
        已按当前 IP 为你定位到 <span class="font-semibold">{{ weatherState.location.value?.name }}</span>，如果你常驻其他城市，建议改成固定城市。
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="soft-button border-amber-200 bg-white/80 text-amber-900 hover:bg-white" type="button" @click="weatherState.openEditor()">
          去修改
        </button>
        <button class="ghost-button text-amber-900" type="button" @click="weatherState.dismissNotice()">
          先这样
        </button>
      </div>
    </div>

    <div class="mt-5">
      <WeatherLocationPicker
        :open="weatherState.editorOpen.value"
        :query="weatherState.searchQuery.value"
        :results="weatherState.searchResults.value"
        :message="weatherState.searchMessage.value"
        :searching="weatherState.isSearching.value"
        @update:query="weatherState.searchQuery.value = $event"
        @select="weatherState.chooseLocation"
        @close="weatherState.closeEditor"
        @quick="weatherState.useQuickCity"
      />
    </div>

    <div v-if="weatherState.isLoading.value && !weatherState.weather.value" class="mt-5 grid gap-4">
      <div class="inner-panel h-52 animate-pulse bg-white/70"></div>
      <div class="inner-panel h-36 animate-pulse bg-white/70"></div>
      <div class="inner-panel h-48 animate-pulse bg-white/70"></div>
    </div>

    <div
      v-else-if="weatherState.error.value && !weatherState.weather.value"
      class="mt-5 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700"
    >
      {{ weatherState.error.value }}
    </div>

    <div v-else-if="weatherState.weather.value" class="mt-5 grid gap-4">
      <section class="inner-panel overflow-hidden p-4 sm:p-5">
        <div class="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div class="relative overflow-hidden rounded-[28px] bg-gradient-to-br p-5 sm:p-6" :class="currentMeta.panelTint">
            <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.36),transparent_36%)]"></div>
            <div class="relative flex flex-col gap-6">
              <div class="min-w-0">
                <p class="section-kicker">Current Weather</p>
                <div class="mt-4 flex items-start gap-4">
                  <div class="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white/80 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.36)]">
                    <span :class="currentMeta.accent">
                      <WeatherGlyph :name="currentMeta.icon" size-class="h-9 w-9" />
                    </span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-end gap-3">
                      <p class="widget-value text-5xl sm:text-6xl">{{ weatherState.weather.value.current.temperature }}°</p>
                      <span class="pill-tag normal-case tracking-normal">{{ currentMeta.label }}</span>
                    </div>
                    <p class="mt-2 break-words text-base font-medium text-slate-700">{{ weatherState.locationLabel.value }}</p>
                    <p class="mt-1 break-words text-sm leading-6 text-slate-500">
                      {{ weatherState.sourceLabel.value }} · 更新于 {{ normalizeWeatherUpdatedAt(weatherState.weather.value) }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="stat-tile bg-white/74">
                  <p class="mini-kicker">体感温度</p>
                  <p class="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {{ weatherState.weather.value.current.apparentTemperature }}°
                  </p>
                  <p class="mt-1 text-sm text-slate-500">结合湿度与风速计算</p>
                </div>

                <div class="stat-tile bg-white/74">
                  <p class="mini-kicker">空气湿度</p>
                  <p class="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {{ weatherState.weather.value.current.humidity }}%
                  </p>
                  <p class="mt-1 text-sm text-slate-500">当前相对湿度</p>
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-3">
            <article v-for="item in statItems.slice(2)" :key="item.label" class="stat-tile">
              <p class="mini-kicker">{{ item.label }}</p>
              <p class="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{{ item.value }}</p>
              <p class="mt-1 text-sm text-slate-500">{{ item.hint }}</p>
            </article>
          </div>
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <article class="stat-tile">
            <p class="mini-kicker">今日温差</p>
            <p class="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              {{ todayForecast ? `${todayForecast.max}° / ${todayForecast.min}°` : "--" }}
            </p>
            <p class="mt-1 text-sm text-slate-500">最高温与最低温的快速对比</p>
          </article>

          <article class="stat-tile">
            <p class="mini-kicker">降水概率</p>
            <p class="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              {{ todayForecast ? `${todayForecast.precipitationProbability}%` : "--" }}
            </p>
            <p class="mt-1 text-sm text-slate-500">今天最值得提前留意的变化</p>
          </article>
        </div>
      </section>

      <section class="inner-panel overflow-hidden p-5">
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="section-kicker">Hourly Outlook</p>
            <h3 class="mt-2 text-xl font-semibold text-slate-900">接下来 18 小时</h3>
          </div>
          <span class="pill-tag normal-case tracking-normal">每 3 小时</span>
        </div>
        <WeatherHourlyList :items="weatherState.weather.value.hourly" />
      </section>

      <section class="inner-panel p-5">
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="section-kicker">Daily Forecast</p>
            <h3 class="mt-2 text-xl font-semibold text-slate-900">未来 7 日趋势</h3>
          </div>
          <span class="text-sm text-slate-500">更适合快速扫一眼</span>
        </div>
        <WeatherDailyList :items="weatherState.weather.value.daily" />
      </section>
    </div>
  </WidgetCard>
</template>
