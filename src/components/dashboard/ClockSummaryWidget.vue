<script setup lang="ts">
import type { WidgetSize } from "@/types/widget";
import { useClock } from "@/composables/useClock";
import FlipGroup from "@/components/clock/FlipGroup.vue";

defineProps<{
  size: WidgetSize;
}>();

const clock = useClock();
</script>

<template>
  <!-- 1x1: mini time only -->
  <div v-if="size === '1x1'" class="flex h-full flex-col items-center justify-center text-center">
    <p class="widget-value text-[1.4rem] leading-none tracking-tight">{{ clock.timeLabel.value }}</p>
    <p class="mt-1 truncate text-[10px] text-slate-400">{{ clock.dateLabel.value }}</p>
  </div>

  <!-- 2x1: vertical layout with flip seconds -->
  <div v-else-if="size === '2x1'" class="flex h-full flex-col items-center justify-center gap-1">
    <p class="widget-value text-[1.5rem] leading-none tracking-tight">{{ clock.timeLabel.value }}</p>
    <div class="flex items-center gap-1">
      <FlipGroup :value="clock.seconds.value" font-size="0.9rem" />
      <span class="text-[9px] font-medium uppercase tracking-wider text-slate-400">sec</span>
    </div>
  </div>

  <!-- 2x2: time + date + greeting -->
  <div v-else-if="size === '2x2'" class="flex h-full flex-col justify-between">
    <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Local</p>
    <div>
      <p class="widget-value text-[2.6rem] leading-none tracking-tight">{{ clock.timeLabel.value }}</p>
      <p class="mt-2 line-clamp-1 text-xs text-slate-500">{{ clock.dateLabel.value }}</p>
      <p class="mt-1 text-[11px] font-medium text-slate-400/80">{{ clock.greetingText.value }}</p>
    </div>
  </div>
</template>
