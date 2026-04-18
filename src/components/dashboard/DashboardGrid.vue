<script setup lang="ts">
import type { WidgetLayoutItem } from "@/types/widget";

import { getWidgetSpanClasses } from "./widgetSizing";

defineProps<{
  items: WidgetLayoutItem[];
}>();
</script>

<template>
  <section class="dashboard-grid">
    <div
      v-for="item in items"
      :key="item.id"
      class="dashboard-grid-item min-w-0"
      :class="getWidgetSpanClasses(item.size)"
    >
      <slot name="item" :item="item" />
    </div>
  </section>
</template>

<style scoped>
.dashboard-grid {
  --dashboard-unit: 184px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--dashboard-unit), var(--dashboard-unit)));
  grid-auto-rows: var(--dashboard-unit);
  grid-auto-flow: dense;
  justify-content: center;
  align-content: start;
  gap: 1.15rem;
}

.widget-span-1x1 {
  grid-column: span 1;
  grid-row: span 1;
}

.widget-span-1x2 {
  grid-column: span 1;
  grid-row: span 2;
}

.widget-span-2x2 {
  grid-column: span 1;
  grid-row: span 2;
}

.widget-span-4x4 {
  grid-column: span 1;
  grid-row: span 4;
}

@media (min-width: 720px) {
  .dashboard-grid {
    --dashboard-unit: 194px;
  }

  .widget-span-2x2 {
    grid-column: span 2;
    grid-row: span 2;
  }

  .widget-span-4x4 {
    grid-column: span 2;
    grid-row: span 4;
  }
}

@media (min-width: 1180px) {
  .dashboard-grid {
    --dashboard-unit: 210px;
  }
}

@media (min-width: 1480px) {
  .dashboard-grid {
    --dashboard-unit: 220px;
  }

  .widget-span-4x4 {
    grid-column: span 4;
    grid-row: span 4;
  }
}
</style>
