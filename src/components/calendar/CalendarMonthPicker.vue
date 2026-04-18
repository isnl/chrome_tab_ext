<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  year: number;
  month: number;
}>();

const emit = defineEmits<{
  select: [year: number, month: number];
  close: [];
}>();

const displayYear = ref(props.year);

const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

const now = new Date();
const isCurrentMonth = computed(() => (m: number) => {
  return displayYear.value === props.year && m === props.month;
});
const isTodayMonth = computed(() => (m: number) => {
  return displayYear.value === now.getFullYear() && m === now.getMonth();
});

function prevYear() {
  displayYear.value -= 1;
}

function nextYear() {
  displayYear.value += 1;
}

function handleSelect(monthIndex: number) {
  emit("select", displayYear.value, monthIndex);
  emit("close");
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="translate-y-1 scale-95 opacity-0"
    enter-to-class="translate-y-0 scale-100 opacity-100"
    leave-active-class="transition duration-100 ease-in"
    leave-from-class="translate-y-0 scale-100 opacity-100"
    leave-to-class="translate-y-1 scale-95 opacity-0"
  >
    <div class="month-picker" @click.stop>
      <!-- Year nav -->
      <div class="month-picker__year-row">
        <button class="month-picker__arrow" type="button" @click="prevYear">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="month-picker__year">{{ displayYear }}</span>
        <button class="month-picker__arrow" type="button" @click="nextYear">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <!-- Month grid -->
      <div class="month-picker__grid">
        <button
          v-for="(label, i) in months"
          :key="i"
          class="month-picker__cell"
          :class="{ 'month-picker__cell--active': isCurrentMonth(i) }"
          type="button"
          @click="handleSelect(i)"
        >
          {{ label }}
          <span v-if="isTodayMonth(i)" class="month-picker__dot" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.month-picker {
  position: absolute;
  z-index: 10;
  top: 100%;
  left: 0;
  margin-top: 4px;
  padding: 10px;
  min-width: 200px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px) saturate(1.5);
  box-shadow: 0 6px 24px -6px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.05);
}

.month-picker__year-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.month-picker__year {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.month-picker__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: all 120ms ease;
}

.month-picker__arrow:hover {
  background: rgba(99, 102, 241, 0.08);
  color: #4338ca;
}

.month-picker__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.month-picker__cell {
  position: relative;
  padding: 6px 4px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 120ms ease;
}

.month-picker__dot {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #6366f1;
}

.month-picker__cell--active .month-picker__dot {
  background: rgba(255, 255, 255, 0.8);
}

.month-picker__cell:hover {
  background: rgba(99, 102, 241, 0.06);
  color: #4338ca;
}

.month-picker__cell--active {
  background: #6366f1;
  color: #fff;
  font-weight: 700;
}

.month-picker__cell--active:hover {
  background: #4f46e5;
  color: #fff;
}
</style>
