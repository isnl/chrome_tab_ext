<script setup lang="ts">
import type { WidgetSize } from "@/types/widget";

import { useProgress } from "@/composables/useProgress";

import ProgressRing from "./ProgressRing.vue";

defineProps<{ size: WidgetSize }>();

const progress = useProgress();
</script>

<template>
  <!-- 1x1: 仅今日进度 -->
  <div v-if="size === '1x1'" class="flex h-full items-center justify-center">
    <ProgressRing
      :percent="progress.day.value.percent"
      :color="progress.day.value.color"
      :label="progress.day.value.label"
      :view-size="100"
      :stroke="7"
      class="ring-1x1"
    />
  </div>

  <!-- 2x2: 四个进度环 -->
  <div v-else class="grid h-full grid-cols-2 grid-rows-2 place-items-center gap-1">
    <ProgressRing
      v-for="item in progress.all.value"
      :key="item.type"
      :percent="item.percent"
      :color="item.color"
      :label="item.label"
      :view-size="100"
      :stroke="6"
      class="ring-2x2"
    />
  </div>
</template>

<style scoped>
.ring-1x1 {
  width: min(88%, 100px);
  height: min(88%, 100px);
}

.ring-1x1 :deep(.progress-ring__percent) {
  font-size: 0.8rem;
}

.ring-1x1 :deep(.progress-ring__label) {
  font-size: 0.55rem;
}

.ring-2x2 {
  width: min(90%, 110px);
  height: min(90%, 110px);
}

.ring-2x2 :deep(.progress-ring__percent) {
  font-size: 1rem;
}

.ring-2x2 :deep(.progress-ring__label) {
  font-size: 0.65rem;
}
</style>
