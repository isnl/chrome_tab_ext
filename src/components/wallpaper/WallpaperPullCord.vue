<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

const props = withDefaults(defineProps<{
  loading?: boolean;
}>(), {
  loading: false,
});

const emit = defineEmits<{
  pull: [];
}>();

const PULL_TRIGGER_DISTANCE = 46;
const MAX_PULL_DISTANCE = 70;
const TAP_DISTANCE = 6;

const isPulling = ref(false);
const isDragging = ref(false);
const pullOffset = ref(0);
let startY = 0;
let pullTimer: number | null = null;
let resetTimer: number | null = null;

const cordStyle = computed(() => ({
  "--pull-offset": `${pullOffset.value}px`,
}));

const isBusy = computed(() => isPulling.value || props.loading);

function clearTimers() {
  if (pullTimer) {
    window.clearTimeout(pullTimer);
    pullTimer = null;
  }
  if (resetTimer) {
    window.clearTimeout(resetTimer);
    resetTimer = null;
  }
}

function triggerPull() {
  if (isBusy.value) return;

  clearTimers();
  isDragging.value = false;
  isPulling.value = true;
  pullOffset.value = PULL_TRIGGER_DISTANCE;

  pullTimer = window.setTimeout(() => {
    emit("pull");
  }, 180);

  resetTimer = window.setTimeout(() => {
    pullOffset.value = 0;
    isPulling.value = false;
  }, 560);
}

function releasePointer(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement;
  if (target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId);
  }
}

function handlePointerDown(event: PointerEvent) {
  if (event.button !== 0 || isBusy.value) return;

  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture(event.pointerId);
  clearTimers();
  startY = event.clientY;
  pullOffset.value = 0;
  isDragging.value = true;
}

function handlePointerMove(event: PointerEvent) {
  if (!isDragging.value) return;

  const distance = Math.max(event.clientY - startY, 0);
  pullOffset.value = Math.min(distance, MAX_PULL_DISTANCE);
}

function handlePointerUp(event: PointerEvent) {
  if (!isDragging.value) return;

  releasePointer(event);
  isDragging.value = false;

  if (
    pullOffset.value >= PULL_TRIGGER_DISTANCE ||
    Math.abs(event.clientY - startY) <= TAP_DISTANCE
  ) {
    triggerPull();
    return;
  }

  pullOffset.value = 0;
}

function handlePointerCancel(event: PointerEvent) {
  if (!isDragging.value) return;

  releasePointer(event);
  isDragging.value = false;
  pullOffset.value = 0;
}

onBeforeUnmount(clearTimers);
</script>

<template>
  <button
    class="pull-cord"
    :class="{
      'pull-cord--pulling': isPulling,
      'pull-cord--dragging': isDragging,
      'pull-cord--loading': loading,
    }"
    :style="cordStyle"
    type="button"
    aria-label="切换壁纸"
    :aria-busy="loading"
    title="切换壁纸"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerCancel"
    @keydown.enter.prevent="triggerPull"
    @keydown.space.prevent="triggerPull"
  >
    <span class="pull-cord__track" aria-hidden="true">
      <span class="pull-cord__line"></span>
      <span class="pull-cord__glint"></span>
    </span>
    <span class="pull-cord__knob" aria-hidden="true">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="4"
          stroke="currentColor"
          stroke-width="2.2"
          fill="none"
        />
        <circle cx="8.4" cy="9" r="1.9" fill="currentColor" />
        <path
          d="M3.8 17.4 L8.1 12.9 L12.2 16.5 L16.4 11.3 L20.5 17.4"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
        />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.pull-cord {
  --pull-offset: 0px;
  position: fixed;
  top: 0;
  right: 34px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 8px 10px;
  border: 0;
  color: rgba(255, 255, 255, 0.92);
  background: transparent;
  cursor: pointer;
  user-select: none;
  touch-action: none;
  transform: translate3d(0, var(--pull-offset), 0);
  filter: drop-shadow(0 10px 18px rgba(15, 23, 42, 0.16));
  transition: transform 0.34s cubic-bezier(0.2, 0.9, 0.25, 1.18),
    filter 0.2s ease;
}

.pull-cord--dragging {
  transition: none;
}

.pull-cord:hover,
.pull-cord:focus-visible {
  filter: drop-shadow(0 14px 24px rgba(15, 23, 42, 0.22));
}

.pull-cord__track {
  position: relative;
  display: flex;
  justify-content: center;
  width: 26px;
  height: 48px;
}

.pull-cord__line {
  width: 3px;
  height: 100%;
  border-radius: 0 0 999px 999px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255, 255, 255, 0.36) 16%,
    rgba(255, 255, 255, 0.86)
  );
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.05),
    0 0 12px rgba(255, 255, 255, 0.34);
}

.pull-cord__glint {
  position: absolute;
  right: 9px;
  bottom: -3px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 0 14px rgba(125, 211, 252, 0.45);
  opacity: 0.45;
  transform: scale(0.72);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.pull-cord__knob {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin-top: -1px;
  overflow: hidden;
  border-radius: 999px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.5), rgba(224, 242, 254, 0.2)),
    rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.58);
  box-shadow:
    0 12px 30px rgba(15, 23, 42, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.55),
    inset 0 -10px 18px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px) saturate(1.18);
  -webkit-backdrop-filter: blur(14px) saturate(1.18);
  opacity: 0.78;
  transition: transform 0.22s ease, opacity 0.22s ease, background 0.22s ease,
    border-color 0.22s ease;
}

.pull-cord__knob::before {
  content: "";
  position: absolute;
  inset: 4px 6px auto 6px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.72), transparent);
  opacity: 0.58;
}

.pull-cord__knob svg {
  position: relative;
  z-index: 1;
}

.pull-cord:hover .pull-cord__knob {
  opacity: 1;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.64), rgba(207, 250, 254, 0.28)),
    rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.72);
  transform: translateY(2px) scale(1.06);
}

.pull-cord:hover .pull-cord__line {
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255, 255, 255, 0.5) 16%,
    rgba(255, 255, 255, 0.94)
  );
}

.pull-cord:hover .pull-cord__glint,
.pull-cord:focus-visible .pull-cord__glint {
  opacity: 0.85;
  transform: scale(1);
}

.pull-cord--pulling .pull-cord__knob {
  opacity: 1;
  transform: translateY(4px) scale(0.94);
}

.pull-cord--pulling .pull-cord__glint {
  opacity: 1;
  transform: scale(1.14);
}

.pull-cord--loading .pull-cord__line {
  animation: pull-cord-flow 1s ease-in-out infinite;
}

.pull-cord--loading .pull-cord__knob {
  opacity: 1;
  animation: pull-cord-pulse 1.15s ease-in-out infinite;
}

@keyframes pull-cord-flow {
  50% {
    box-shadow:
      0 0 0 1px rgba(15, 23, 42, 0.05),
      0 0 18px rgba(125, 211, 252, 0.62);
  }
}

@keyframes pull-cord-pulse {
  50% {
    transform: translateY(2px) scale(1.04);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pull-cord,
  .pull-cord__knob,
  .pull-cord__glint {
    transition-duration: 0.01ms;
  }
}
</style>
