<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

const props = defineProps<{
  /** 0 – 1 */
  percent: number;
  /** SVG viewport size */
  viewSize?: number;
  /** ring stroke width */
  stroke?: number;
  /** progress color */
  color?: string;
  /** center label text */
  label?: string;
  /** show percent number */
  showPercent?: boolean;
}>();

const viewSize = computed(() => props.viewSize ?? 100);
const stroke = computed(() => props.stroke ?? 8);
const radius = computed(() => (viewSize.value - stroke.value) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const center = computed(() => viewSize.value / 2);

// 动画：组件挂载后才展示进度
const mounted = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
});

const offset = computed(() => {
  const p = mounted.value ? Math.min(Math.max(props.percent, 0), 1) : 0;
  return circumference.value * (1 - p);
});

const displayPercent = computed(() => Math.round(props.percent * 100));
</script>

<template>
  <div class="progress-ring">
    <svg
      :width="viewSize"
      :height="viewSize"
      :viewBox="`0 0 ${viewSize} ${viewSize}`"
      class="progress-ring__svg"
    >
      <!-- 渐变定义 -->
      <defs>
        <linearGradient :id="`ring-grad-${label}`" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="color ?? '#f97316'" stop-opacity="1" />
          <stop offset="100%" :stop-color="color ?? '#f97316'" stop-opacity="0.5" />
        </linearGradient>
      </defs>

      <!-- 背景轨道 -->
      <circle
        class="progress-ring__track"
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke-width="stroke"
      />

      <!-- 进度弧 -->
      <circle
        class="progress-ring__bar"
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke="`url(#ring-grad-${label})`"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
      />
    </svg>

    <!-- 中心文字 -->
    <div class="progress-ring__content">
      <span class="progress-ring__percent" :style="{ color: color }">
        {{ displayPercent }}%
      </span>
      <span v-if="label" class="progress-ring__label">{{ label }}</span>
    </div>
  </div>
</template>

<style scoped>
.progress-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-ring__svg {
  transform: rotate(-90deg);
  display: block;
  width: 100%;
  height: 100%;
}

.progress-ring__track {
  stroke: rgba(0, 0, 0, 0.06);
}

.progress-ring__bar {
  transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-ring__content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  pointer-events: none;
}

.progress-ring__percent {
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.progress-ring__label {
  color: rgba(0, 0, 0, 0.45);
  line-height: 1;
  font-weight: 500;
}
</style>
