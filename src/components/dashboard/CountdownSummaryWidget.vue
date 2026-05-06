<script setup lang="ts">
import { ref } from "vue";

import { useCountdown } from "@/composables/useCountdown";
import type { WidgetSize } from "@/types/widget";

defineProps<{
  size: WidgetSize;
}>();

const countdown = useCountdown();

// Drag state for the scrollable card grid.
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

    <!-- 2x2 / 2x4: scrollable square card grid -->
    <template v-else-if="size === '2x2' || size === '2x4'">
      <div
        v-if="countdown.visibleItems.value.length"
        class="countdown-card-grid scroll-soft min-h-0 flex-1"
      >
        <div
          v-for="(item, index) in countdown.visibleItems.value"
          :key="item.id"
          class="countdown-card"
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
          <span class="countdown-card__label">{{ item.label }}</span>
          <div class="countdown-card__days">
            <span class="countdown-card__number">{{ countdown.getDaysLeft(item) }}</span>
            <span class="countdown-card__unit">天</span>
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
.countdown-card-grid {
  --countdown-card-gap: 6px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: max-content;
  align-content: start;
  gap: var(--countdown-card-gap);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;
}

.countdown-card {
  --countdown-card-accent: #059669;
  --countdown-card-soft: rgba(209, 250, 229, 0.56);
  display: flex;
  aspect-ratio: 1 / 1;
  position: relative;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  overflow: hidden;
  padding: 18px 7px 7px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.64);
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.78), var(--countdown-card-soft));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 10px 22px -20px color-mix(in srgb, var(--countdown-card-accent) 42%, transparent);
  cursor: grab;
  user-select: none;
  transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
}

.countdown-card:nth-child(4n + 2) {
  --countdown-card-accent: #0284c7;
  --countdown-card-soft: rgba(224, 242, 254, 0.66);
}

.countdown-card:nth-child(4n + 3) {
  --countdown-card-accent: #d97706;
  --countdown-card-soft: rgba(254, 243, 199, 0.7);
}

.countdown-card:nth-child(4n + 4) {
  --countdown-card-accent: #e11d48;
  --countdown-card-soft: rgba(255, 228, 230, 0.66);
}

.countdown-card::before {
  content: "";
  position: absolute;
  top: 7px;
  left: 50%;
  width: 22px;
  height: 3px;
  border-radius: 999px;
  background: var(--countdown-card-accent);
  opacity: 0.68;
  transform: translateX(-50%);
}

.countdown-card:hover {
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.9), var(--countdown-card-soft));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 12px 24px -20px color-mix(in srgb, var(--countdown-card-accent) 52%, transparent);
  transform: translateY(-1px);
}

.countdown-card:active {
  cursor: grabbing;
  transform: translateY(0);
}

.countdown-card__label {
  position: absolute;
  inset: 13px 8px auto;
  min-width: 0;
  overflow: hidden;
  color: #334155;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.countdown-card__days {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 3px;
  min-width: 0;
  line-height: 1;
}

.countdown-card__number {
  color: var(--countdown-card-accent);
  font-size: 19px;
  font-weight: 850;
  line-height: 1;
}

.countdown-card__unit {
  color: #64748b;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
}
</style>
