<script setup lang="ts">
import { ref } from "vue";

import { useCountdown } from "@/composables/useCountdown";
import type { WidgetSize } from "@/types/widget";

defineProps<{
  size: WidgetSize;
}>();

const countdown = useCountdown();

// Drag state for the scrollable list.
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
  <div class="flex h-full min-h-0 flex-col">
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

    <!-- 2x2 / 2x4: scrollable list -->
    <template v-else-if="size === '2x2' || size === '2x4'">
      <p class="countdown-title">倒计时</p>
      <div
        v-if="countdown.visibleItems.value.length"
        class="countdown-list scroll-soft mt-1.5 min-h-0 flex-1"
        :class="{ 'countdown-list--fit-four': size === '2x2' }"
      >
        <div
          v-for="(item, index) in countdown.visibleItems.value"
          :key="item.id"
          class="countdown-row"
          :class="{
            'opacity-40': isDragging && dragFrom === index,
            'ring-1 ring-emerald-300': isDragging && dragOver === index && dragFrom !== index
          }"
          draggable="true"
          @dragstart="handleDragStart($event, index)"
          @dragover="handleDragOver($event, index)"
          @drop="handleDrop(index)"
          @dragend="resetDrag"
        >
          <span class="countdown-row__label">{{ item.label }}</span>
          <div class="countdown-row__days">
            <span class="countdown-row__number">{{ countdown.getDaysLeft(item) }}</span>
            <span class="countdown-row__unit">天</span>
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
.countdown-title {
  flex: none;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.24em;
  line-height: 1;
  text-transform: uppercase;
}

.countdown-list {
  --countdown-list-gap: 4px;
  display: grid;
  grid-auto-rows: 24px;
  align-content: start;
  gap: var(--countdown-list-gap);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;
}

.countdown-list--fit-four {
  grid-auto-rows: calc((100% - (var(--countdown-list-gap) * 3)) / 4);
}

.countdown-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  overflow: hidden;
  padding: 0 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.36);
  cursor: grab;
  user-select: none;
  transition: background 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
}

.countdown-row:hover {
  background: rgba(255, 255, 255, 0.56);
}

.countdown-row:active {
  cursor: grabbing;
}

.countdown-row__label {
  min-width: 0;
  overflow: hidden;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.countdown-row__days {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-shrink: 0;
  line-height: 1;
}

.countdown-row__number {
  color: #059669;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.countdown-row__unit {
  color: #94a3b8;
  font-size: 9px;
  line-height: 1;
}
</style>
