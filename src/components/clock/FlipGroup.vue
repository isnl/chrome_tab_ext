<script setup lang="ts">
import { computed } from "vue";

import FlipDigit from "./FlipDigit.vue";

const props = defineProps<{
  value: string;
  fontSize?: string;
}>();

const digits = computed(() => props.value.split(""));
</script>

<template>
  <span class="flip-group" :style="{ fontSize: fontSize || 'inherit' }">
    <FlipDigit v-for="(d, i) in digits" :key="i" :digit="d" />
  </span>
</template>

<style scoped>
.flip-group {
  display: inline-flex;
  gap: 2px;
  align-items: center;
}
</style>
