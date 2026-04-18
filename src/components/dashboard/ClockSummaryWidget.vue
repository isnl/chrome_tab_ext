<script setup lang="ts">
import type { WidgetSize } from "@/types/widget";

defineProps<{
  size: WidgetSize;
  dateLabel: string;
  timeLabel: string;
}>();
</script>

<template>
  <div v-if="size === '1x1'" class="flex h-full flex-col">
    <div class="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
      <span>Local</span>
      <span>Now</span>
    </div>
    <div
      class="tone-panel mt-auto p-3"
      style="--tone-bg: linear-gradient(145deg, rgba(255,250,244,0.9), rgba(255,243,229,0.78)); --tone-glow: radial-gradient(circle at top right, rgba(251,191,36,0.2), transparent 38%);"
    >
      <p class="widget-value text-[3.2rem] leading-none">
        {{ timeLabel }}
      </p>
      <p class="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">
        {{ dateLabel }}
      </p>
    </div>
  </div>

  <div v-else-if="size === '1x2'" class="flex h-full flex-col">
    <div
      class="tone-panel px-4 py-4"
      style="--tone-bg: linear-gradient(150deg, rgba(255,249,242,0.92), rgba(255,239,219,0.82) 60%, rgba(255,255,255,0.74)); --tone-glow: radial-gradient(circle at top right, rgba(251,191,36,0.22), transparent 40%);"
    >
      <p class="mini-kicker">Current Time</p>
      <p class="widget-value mt-4 text-5xl leading-none">
        {{ timeLabel }}
      </p>
      <p class="mt-3 text-sm leading-6 text-slate-600">
        {{ dateLabel }}
      </p>
    </div>

    <div class="mt-3 grid gap-2">
      <article class="stat-tile">
        <p class="mini-kicker">Focus</p>
        <p class="mt-2 text-sm font-semibold text-slate-900">/ 或 Ctrl/Cmd + K</p>
        <p class="mt-1 text-sm text-slate-500">快速回到搜索栏</p>
      </article>

      <article class="stat-tile">
        <p class="mini-kicker">Rhythm</p>
        <p class="mt-2 text-sm font-semibold text-slate-900">打开即用</p>
        <p class="mt-1 text-sm text-slate-500">不需要再找入口，也不用先点页面。</p>
      </article>
    </div>
  </div>

  <div v-else class="flex h-full flex-col">
    <div class="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
      <div
        class="tone-panel flex flex-col justify-between px-5 py-5"
        style="--tone-bg: linear-gradient(150deg, rgba(255,249,242,0.94), rgba(255,239,219,0.84) 60%, rgba(255,255,255,0.76)); --tone-glow: radial-gradient(circle at top right, rgba(251,191,36,0.22), transparent 42%);"
      >
        <div>
          <p class="mini-kicker">At A Glance</p>
          <p class="widget-value mt-4 text-6xl leading-none">
            {{ timeLabel }}
          </p>
          <p class="mt-4 max-w-[15rem] text-sm leading-6 text-slate-600">
            {{ dateLabel }}
          </p>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <span class="pill-tag">本地时间</span>
          <span class="pill-tag">随开随看</span>
        </div>
      </div>

      <div class="grid gap-3">
        <div class="stat-tile">
          <p class="mini-kicker">Search</p>
          <p class="mt-2 text-sm font-semibold text-slate-900">直接输入开始搜索</p>
          <p class="mt-1 text-sm leading-6 text-slate-500">打开新标签后，搜索框会自动准备好输入。</p>
        </div>

        <div class="stat-tile">
          <p class="mini-kicker">Shortcuts</p>
          <p class="mt-2 text-sm font-semibold text-slate-900">键盘直达</p>
          <p class="mt-1 text-sm leading-6 text-slate-500">按 `/` 或 `Ctrl/Cmd + K` 随时回到搜索。</p>
        </div>

        <div class="stat-tile">
          <p class="mini-kicker">Flow</p>
          <p class="mt-2 text-sm font-semibold text-slate-900">少一步切换</p>
          <p class="mt-1 text-sm leading-6 text-slate-500">看时间、查信息、回到工作，都集中在一个入口。</p>
        </div>
      </div>
    </div>
  </div>
</template>
