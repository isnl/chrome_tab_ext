<script setup lang="ts">
defineProps<{
  dateLabel: string;
  timeLabel: string;
}>();

const shortcuts = [
  { label: "搜索", value: "按 / 或 Ctrl/Cmd + K" },
  { label: "天气", value: "轻点小组件打开完整天气卡片" },
  { label: "日历", value: "从迷你月历一键展开详细月视图" }
];
</script>

<template>
  <section class="grid gap-4">
    <div
      class="tone-panel overflow-hidden p-5 sm:p-6"
      style="--tone-bg: linear-gradient(150deg, rgba(255,249,242,0.96), rgba(255,239,219,0.86) 58%, rgba(255,255,255,0.78)); --tone-glow: radial-gradient(circle at top right, rgba(251,191,36,0.2), transparent 42%);"
    >
      <p class="section-kicker">Current Time</p>
      <p class="widget-value mt-4 text-5xl leading-none sm:text-6xl">{{ timeLabel }}</p>
      <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">{{ dateLabel }}</p>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      <article v-for="item in shortcuts" :key="item.label" class="stat-tile">
        <p class="mini-kicker">{{ item.label }}</p>
        <p class="mt-3 text-base font-semibold text-slate-900">{{ item.value }}</p>
      </article>
    </div>
  </section>
</template>
