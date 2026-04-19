<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

import { WIDGET_SIZE_META, type WidgetLayoutItem, type WidgetSize } from "@/types/widget";

import { getWidgetSpanClasses } from "./widgetSizing";

const GRID_COLS = 12;

const props = defineProps<{
  items: WidgetLayoutItem[];
}>();

const emit = defineEmits<{
  reorder: [fromIndex: number, toIndex: number];
  move: [id: string, col: number, row: number];
}>();

function getSize(size: WidgetSize) {
  return WIDGET_SIZE_META[size];
}

// Compute grid row count based on items
const gridRows = computed(() => {
  let maxRow = 4;
  for (const item of props.items) {
    const s = getSize(item.size);
    const row = item.row ?? 0;
    maxRow = Math.max(maxRow, row + s.rows);
  }
  return maxRow + 2; // extra space for dropping
});

// Build occupancy grid (excluding a specific widget id)
function buildOccupancy(excludeId?: string): Set<string> {
  const occupied = new Set<string>();
  for (const item of props.items) {
    if (item.id === excludeId) continue;
    const s = getSize(item.size);
    const col = item.col ?? 0;
    const row = item.row ?? 0;
    for (let c = col; c < col + s.cols; c++) {
      for (let r = row; r < row + s.rows; r++) {
        occupied.add(`${c},${r}`);
      }
    }
  }
  return occupied;
}

function canPlace(col: number, row: number, size: WidgetSize, excludeId?: string): boolean {
  const s = getSize(size);
  if (col < 0 || row < 0 || col + s.cols > GRID_COLS) return false;
  const occupied = buildOccupancy(excludeId);
  for (let c = col; c < col + s.cols; c++) {
    for (let r = row; r < row + s.rows; r++) {
      if (occupied.has(`${c},${r}`)) return false;
    }
  }
  return true;
}

function itemStyle(item: WidgetLayoutItem) {
  const col = (item.col ?? 0) + 1; // CSS grid is 1-based
  const row = (item.row ?? 0) + 1;
  const s = getSize(item.size);
  return {
    gridColumn: `${col} / span ${s.cols}`,
    gridRow: `${row} / span ${s.rows}`
  };
}

// ── Drag state ──
const draggingId = ref<string | null>(null);
const dragGhostCol = ref(-1);
const dragGhostRow = ref(-1);
const dragValid = ref(false);
const gridEl = ref<HTMLElement | null>(null);

function handleDragStart(event: DragEvent, item: WidgetLayoutItem) {
  draggingId.value = item.id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.id);
  }
  // Make drag image semi-transparent
  const target = event.currentTarget as HTMLElement;
  requestAnimationFrame(() => target.classList.add("drag-source"));
}

function handleGridDragOver(event: DragEvent) {
  if (!draggingId.value || !gridEl.value) return;
  event.preventDefault();

  const item = props.items.find((i) => i.id === draggingId.value);
  if (!item) return;

  const s = getSize(item.size);
  const rect = gridEl.value.getBoundingClientRect();
  const style = getComputedStyle(gridEl.value);
  const gap = parseFloat(style.gap) || 0;

  // Read actual cell size from computed grid tracks
  const colTracks = style.gridTemplateColumns.split(/\s+/);
  const rowTracks = style.gridTemplateRows.split(/\s+/);
  const colUnit = parseFloat(colTracks[0]) || 92;
  const rowUnit = parseFloat(rowTracks[0]) || colUnit;

  // Account for justify-content: center offset
  const contentWidth = GRID_COLS * colUnit + (GRID_COLS - 1) * gap;
  const offsetX = (rect.width - contentWidth) / 2;

  const colPitch = colUnit + gap;
  const rowPitch = rowUnit + gap;
  const x = event.clientX - rect.left - offsetX;
  const y = event.clientY - rect.top;

  // Clamp so the widget (including its full span) stays within grid bounds
  const col = Math.max(0, Math.min(GRID_COLS - s.cols, Math.floor(x / colPitch)));
  const row = Math.max(0, Math.floor(y / rowPitch));

  dragGhostCol.value = col;
  dragGhostRow.value = row;
  dragValid.value = canPlace(col, row, item.size, item.id);
}

function handleGridDrop(event: DragEvent) {
  event.preventDefault();
  if (!draggingId.value || !dragValid.value) {
    resetDrag();
    return;
  }
  emit("move", draggingId.value, dragGhostCol.value, dragGhostRow.value);
  resetDrag();
}

function handleDragEnd() {
  resetDrag();
}

function resetDrag() {
  draggingId.value = null;
  dragGhostCol.value = -1;
  dragGhostRow.value = -1;
  dragValid.value = false;
}

// Ghost preview style
const ghostStyle = computed(() => {
  if (!draggingId.value || dragGhostCol.value < 0) return null;
  const item = props.items.find((i) => i.id === draggingId.value);
  if (!item) return null;
  const s = getSize(item.size);
  return {
    gridColumn: `${dragGhostCol.value + 1} / span ${s.cols}`,
    gridRow: `${dragGhostRow.value + 1} / span ${s.rows}`
  };
});
</script>

<template>
  <section
    ref="gridEl"
    class="dashboard-grid"
    :style="{ gridTemplateRows: `repeat(${gridRows}, var(--dashboard-unit))` }"
    @dragover="handleGridDragOver"
    @drop="handleGridDrop"
  >
    <div
      v-for="item in items"
      :key="item.id"
      class="dashboard-grid-item min-w-0"
      :class="[
        getWidgetSpanClasses(item.size),
        {
          'drag-source': draggingId === item.id,
        }
      ]"
      :style="itemStyle(item)"
      draggable="true"
      @dragstart="handleDragStart($event, item)"
      @dragend="handleDragEnd"
    >
      <slot name="item" :item="item" />
    </div>

    <!-- Drop ghost preview -->
    <div
      v-if="draggingId && ghostStyle"
      class="drag-ghost"
      :class="{ 'drag-ghost--invalid': !dragValid }"
      :style="ghostStyle"
    />
  </section>
</template>

<style scoped>
.dashboard-grid {
  --dashboard-unit: 56px;
  display: grid;
  grid-template-columns: repeat(12, var(--dashboard-unit));
  grid-auto-rows: var(--dashboard-unit);
  justify-content: center;
  align-content: start;
  gap: 0.75rem;
  position: relative;
}

@media (min-width: 720px) {
  .dashboard-grid {
    --dashboard-unit: 60px;
  }
}

@media (min-width: 1180px) {
  .dashboard-grid {
    --dashboard-unit: 70px;
  }
}

@media (min-width: 1480px) {
  .dashboard-grid {
    --dashboard-unit: 80px;
  }
}

@media (min-width: 1700px) {
  .dashboard-grid {
    --dashboard-unit: 90px;
  }
}

/* ── drag base ── */
.dashboard-grid-item {
  transition: transform 320ms cubic-bezier(0.25, 1, 0.5, 1),
              opacity 200ms ease,
              box-shadow 200ms ease;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}

.dashboard-grid-item:active {
  cursor: grabbing;
}

/* ── dragged element ── */
.drag-source {
  opacity: 0.35;
  transform: scale(0.96);
}

/* ── drop ghost ── */
.drag-ghost {
  border-radius: 26px;
  border: 2px dashed rgba(99, 102, 241, 0.4);
  background: rgba(99, 102, 241, 0.06);
  pointer-events: none;
  animation: pulse-border 1.2s ease-in-out infinite;
}

.drag-ghost--invalid {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.06);
}

@keyframes pulse-border {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>
