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
      <span class="clock-card__period">{{ clock.periodLabel.value }}</span>
    </div>

    <div class="clock-card__body">
      <div class="clock-card__digits">
        <span class="clock-card__hm">{{ clock.hours.value }}</span>
        <span class="clock-card__colon">:</span>
        <span class="clock-card__hm">{{ clock.minutes.value }}</span>
        <span class="clock-card__colon clock-card__colon--soft">:</span>
        <span class="clock-card__sec">{{ clock.seconds.value }}</span>
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
  letter-spacing: 0;
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
  container-type: inline-size;
  display: flex;
  height: 100%;
  flex-direction: column;
  position: relative;
  isolation: isolate;
}

.clock-card__head {
  display: flex;
  min-height: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.clock-card__greeting {
  min-width: 0;
  margin: 0;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.3;
  color: rgb(100 116 139 / 0.76);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clock-card__body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 0.24rem 0;
}

.clock-card__digits {
  --clock-card-time-size: 1.18rem;
  --clock-card-second-size: 0.96rem;
  --clock-card-colon-size: 1rem;

  display: flex;
  width: 100%;
  min-width: 0;
  align-items: baseline;
  justify-content: center;
  gap: 0.03rem;
  padding: 0.46rem 0.32rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.46), rgba(255, 255, 255, 0.16));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 14px 28px -24px rgba(15, 10, 40, 0.24);
  line-height: 1;
}

.clock-card__hm {
  font-family: "IBM Plex Mono", "SF Mono", "Menlo", monospace;
  font-size: var(--clock-card-time-size);
  font-weight: 750;
  letter-spacing: 0;
  color: var(--ink-950);
  font-variant-numeric: tabular-nums;
}

.clock-card__colon {
  font-family: "IBM Plex Mono", "SF Mono", "Menlo", monospace;
  font-size: var(--clock-card-colon-size);
  font-weight: 650;
  color: rgb(148 163 184 / 0.62);
  transform: translateY(-0.03em);
}

.clock-card__colon--soft {
  color: rgb(148 163 184 / 0.44);
}

.clock-card__sec {
  font-family: "IBM Plex Mono", "SF Mono", "Menlo", monospace;
  font-size: var(--clock-card-second-size);
  font-weight: 700;
  color: rgb(71 85 105 / 0.72);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}

.clock-card__period {
  flex-shrink: 0;
  padding: 0.18rem 0.42rem;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.34);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0;
  color: rgb(71 85 105 / 0.68);
  line-height: 1;
}

.clock-card__foot {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 1.32rem;
  padding-top: 0.2rem;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.clock-card__date {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.2;
  color: rgb(71 85 105 / 0.66);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@container (min-width: 108px) {
  .clock-card__digits {
    --clock-card-time-size: 1.46rem;
    --clock-card-second-size: 1.12rem;
    --clock-card-colon-size: 1.2rem;
    gap: 0.04rem;
  }
}

@container (min-width: 132px) {
  .clock-card__digits {
    --clock-card-time-size: 1.74rem;
    --clock-card-second-size: 1.32rem;
    --clock-card-colon-size: 1.42rem;
    padding-inline: 0.42rem;
  }
}

@container (min-width: 154px) {
  .clock-card__digits {
    --clock-card-time-size: 1.96rem;
    --clock-card-second-size: 1.48rem;
    --clock-card-colon-size: 1.6rem;
  }
}
</style>
