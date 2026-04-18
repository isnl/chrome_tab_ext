<script setup lang="ts">
import { computed } from "vue";

import type { CalendarDayViewModel } from "@/types/calendar";

const props = defineProps<{
  day: CalendarDayViewModel;
  x: number;
  y: number;
  visible: boolean;
}>();

const style = computed(() => {
  const pad = 12;
  let left = props.x + 10;
  let top = props.y + 10;

  if (left + 200 > window.innerWidth - pad) {
    left = props.x - 210;
  }
  if (top + 160 > window.innerHeight - pad) {
    top = props.y - 160;
  }

  return {
    left: `${Math.max(pad, left)}px`,
    top: `${Math.max(pad, top)}px`
  };
});

const dateStr = computed(() =>
  props.day.date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })
);

const lunarStr = computed(() => {
  const l = props.day.lunar;
  return `${l.yearName}年 ${l.monthLabel}${l.dayLabel}`;
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-120 ease-out"
      enter-from-class="scale-95 opacity-0"
      enter-to-class="scale-100 opacity-100"
      leave-active-class="transition duration-80 ease-in"
      leave-from-class="scale-100 opacity-100"
      leave-to-class="scale-95 opacity-0"
    >
      <div v-if="visible" class="cal-tooltip" :style="style">
        <p class="cal-tooltip__date">{{ dateStr }}</p>
        <p class="cal-tooltip__lunar">{{ lunarStr }}</p>

        <div v-if="day.isNamedHoliday && day.record" class="cal-tooltip__tag cal-tooltip__tag--hol">
          {{ day.record.name }}
        </div>
        <div v-else-if="day.isCompensationWorkday && day.record" class="cal-tooltip__tag cal-tooltip__tag--comp">
          补班 · {{ day.record.target }}
        </div>

        <p v-if="day.isToday" class="cal-tooltip__hint">今天</p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cal-tooltip {
  position: fixed;
  z-index: 80;
  min-width: 160px;
  max-width: 220px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(20px) saturate(1.5);
  box-shadow: 0 6px 24px -6px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.04);
  pointer-events: none;
}

.cal-tooltip__date {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  line-height: 1.4;
}

.cal-tooltip__lunar {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.cal-tooltip__tag {
  display: inline-block;
  margin-top: 6px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
}

.cal-tooltip__tag--hol {
  background: rgba(225, 29, 72, 0.08);
  color: #e11d48;
}

.cal-tooltip__tag--comp {
  background: rgba(217, 119, 6, 0.08);
  color: #d97706;
}

.cal-tooltip__hint {
  margin-top: 4px;
  font-size: 10px;
  color: #6366f1;
  font-weight: 600;
}
</style>
