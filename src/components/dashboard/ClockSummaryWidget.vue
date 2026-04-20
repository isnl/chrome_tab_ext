<script setup lang="ts">
import type { WidgetSize } from "@/types/widget";
import { useClock } from "@/composables/useClock";

defineProps<{
  size: WidgetSize;
}>();

const clock = useClock();
</script>

<template>
  <!-- 1x1: mini time + date -->
  <div v-if="size === '1x1'" class="flex h-full flex-col items-center justify-center gap-0.5 text-center">
    <p class="widget-value text-[1.3rem] leading-none tracking-tight">{{ clock.timeLabel.value }}</p>
    <p class="text-[9px] font-medium text-slate-500">{{ clock.dateLabel.value }}</p>
  </div>

  <!-- 2x1: compact bar -->
  <div v-else-if="size === '2x1'" class="clock-strip">
    <div class="clock-strip__left">
      <div class="clock-strip__time">
        <span class="clock-strip__hm">{{ clock.hours.value }}:{{ clock.minutes.value }}</span>
        <span class="clock-strip__sec">{{ clock.seconds.value }}</span>
      </div>
      <p class="clock-strip__date">{{ clock.dateLabel.value }}</p>
    </div>
    <span class="clock-strip__badge">{{ clock.periodLabel.value }}</span>
  </div>

  <!-- 2x2: hero time card -->
  <div v-else-if="size === '2x2'" class="clock-card">
    <div class="clock-card__head">
      <p class="clock-card__greeting">{{ clock.greetingText.value }}</p>
    </div>

    <div class="clock-card__body">
      <div class="clock-card__digits">
        <span class="clock-card__hm">{{ clock.hours.value }}</span>
        <span class="clock-card__colon">:</span>
        <span class="clock-card__hm">{{ clock.minutes.value }}</span>
      </div>
      <div class="clock-card__sub">
        <span class="clock-card__sec">{{ clock.seconds.value }}</span>
        <span class="clock-card__period">{{ clock.periodLabel.value }}</span>
      </div>
    </div>

    <div class="clock-card__foot">
      <p class="clock-card__date">{{ clock.dateLabel.value }}</p>
    </div>
  </div>
</template>

<style scoped>
/* ── 2x1: strip ── */
.clock-strip {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.clock-strip__left {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.clock-strip__time {
  display: flex;
  align-items: baseline;
  gap: 0.18rem;
  line-height: 1;
}

.clock-strip__hm {
  font-family: "IBM Plex Mono", "SF Mono", "Menlo", monospace;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--ink-950);
  font-variant-numeric: tabular-nums;
}

.clock-strip__sec {
  font-family: "IBM Plex Mono", "SF Mono", "Menlo", monospace;
  font-size: 0.72rem;
  font-weight: 600;
  color: rgb(100 116 139 / 0.5);
  font-variant-numeric: tabular-nums;
}

.clock-strip__date {
  margin: 0;
  font-size: 9px;
  font-weight: 500;
  color: rgb(100 116 139 / 0.6);
}

.clock-strip__badge {
  flex-shrink: 0;
  padding: 0.2rem 0.42rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.15);
  font-size: 9px;
  font-weight: 600;
  color: rgb(100 116 139 / 0.78);
  line-height: 1;
}

/* ── 2x2: card ── */
.clock-card {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.clock-card__head {
  min-height: 0;
}

.clock-card__greeting {
  margin: 0;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.3;
  color: rgb(100 116 139 / 0.76);
}

.clock-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.24rem;
}

.clock-card__digits {
  display: flex;
  align-items: center;
  line-height: 1;
}

.clock-card__hm {
  font-family: "IBM Plex Mono", "SF Mono", "Menlo", monospace;
  font-size: 2.6rem;
  font-weight: 750;
  letter-spacing: -0.05em;
  color: var(--ink-950);
  font-variant-numeric: tabular-nums;
}

.clock-card__colon {
  font-family: "IBM Plex Mono", "SF Mono", "Menlo", monospace;
  font-size: 2.2rem;
  font-weight: 400;
  color: rgb(148 163 184 / 0.45);
  margin: 0 -0.05em;
  transform: translateY(-0.06em);
}

.clock-card__sub {
  display: flex;
  align-items: center;
  gap: 0.42rem;
}

.clock-card__sec {
  font-family: "IBM Plex Mono", "SF Mono", "Menlo", monospace;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgb(100 116 139 / 0.42);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.clock-card__period {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: rgb(100 116 139 / 0.55);
}

.clock-card__foot {
  padding-top: 0.38rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.clock-card__date {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgb(71 85 105 / 0.72);
}
</style>
