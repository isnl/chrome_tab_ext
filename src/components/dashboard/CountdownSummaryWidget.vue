<script setup lang="ts">
import { ref } from "vue";

import { useCountdown } from "@/composables/useCountdown";
import type { WidgetSize } from "@/types/widget";

defineProps<{
  size: WidgetSize;
}>();

const countdown = useCountdown();

// Drag state for 4x2
const dragFrom = ref(-1);
const dragOver = ref(-1);
const isDragging = ref(false);

function handleDragStart(event: DragEvent, index: number) {
  event.stopPropagation();
  isDragging.value = true;
  dragFrom.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

function handleDragOver(event: DragEvent, index: number) {
  event.preventDefault();
  dragOver.value = index;
}

function handleDrop(index: number) {
  if (dragFrom.value !== index) {
    countdown.reorderItems(dragFrom.value, index);
  }
  resetDrag();
}

function resetDrag() {
  isDragging.value = false;
  dragFrom.value = -1;
  dragOver.value = -1;
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- 2x1: compact centered layout -->
    <template v-if="size === '2x1'">
      <div v-if="countdown.nearestItem.value" class="flex h-full items-center justify-center gap-4">
        <div class="flex items-baseline gap-1">
          <span class="widget-value text-[1.8rem] leading-none tracking-tight text-emerald-600">
            {{ countdown.getDaysLeft(countdown.nearestItem.value) }}
          </span>
          <span class="text-[10px] font-medium text-slate-400">天</span>
        </div>
        <div class="h-5 w-px bg-slate-200/60"></div>
        <span class="truncate text-xs font-medium text-slate-600">{{ countdown.nearestItem.value.label }}</span>
      </div>
      <div v-else class="flex h-full items-center justify-center">
        <p class="text-xs text-slate-400">暂无倒计时</p>
      </div>
    </template>

    <!-- 2x2: top items list -->
    <template v-else-if="size === '2x2'">
      <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">倒计时</p>
      <div v-if="countdown.visibleItems.value.length" class="mt-2 flex flex-1 flex-col gap-1.5 overflow-hidden">
        <div
          v-for="item in countdown.visibleItems.value.slice(0, 4)"
          :key="item.id"
          class="flex items-center justify-between rounded-lg bg-white/35 px-2.5 py-1.5"
        >
          <span class="truncate text-[11px] font-medium text-slate-600">{{ item.label }}</span>
          <div class="flex items-baseline gap-1">
            <span class="text-sm font-bold text-emerald-600">{{ countdown.getDaysLeft(item) }}</span>
            <span class="text-[9px] text-slate-400">天</span>
          </div>
        </div>
      </div>
      <div v-else class="flex flex-1 items-center justify-center">
        <p class="text-xs text-slate-400">暂无倒计时</p>
      </div>
    </template>

    <!-- 4x2: full list with centered card layout -->
    <template v-else-if="size === '4x2'">
      <div class="flex items-center justify-between">
        <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">倒计时</p>
        <span v-if="countdown.nearestItem.value" class="text-[10px] text-slate-400">
          最近: {{ countdown.nearestItem.value.label }}
        </span>
      </div>
      <div v-if="countdown.visibleItems.value.length" class="mt-2 grid flex-1 grid-cols-2 gap-2 overflow-hidden">
        <div
          v-for="(item, index) in countdown.visibleItems.value"
          :key="item.id"
          class="countdown-card"
          :class="{
            'opacity-40': isDragging && dragFrom === index,
            'ring-1 ring-indigo-300': isDragging && dragOver === index && dragFrom !== index
          }"
          draggable="true"
          @dragstart="handleDragStart($event, index)"
          @dragover="handleDragOver($event, index)"
          @drop="handleDrop(index)"
          @dragend="resetDrag"
        >
          <div class="flex h-full flex-col items-center justify-center text-center">
            <div class="flex items-baseline gap-0.5">
              <span class="text-xl font-bold leading-none text-emerald-600">{{ countdown.getDaysLeft(item) }}</span>
              <span class="text-[9px] text-slate-400">天</span>
            </div>
            <div class="mt-1.5 flex items-center gap-1.5">
              <span class="countdown-dot"></span>
              <span class="truncate text-[11px] font-medium text-slate-600">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="flex flex-1 items-center justify-center">
        <p class="text-xs text-slate-400">暂无倒计时</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.countdown-card {
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.4);
  cursor: grab;
  user-select: none;
  transition: all 200ms ease;
}

.countdown-card:hover {
  background: rgba(255, 255, 255, 0.6);
}

.countdown-card:active {
  cursor: grabbing;
}

.countdown-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #34d399;
  flex-shrink: 0;
}
</style>
