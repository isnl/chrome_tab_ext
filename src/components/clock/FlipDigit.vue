<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  digit: string;
}>();

const currentDigit = ref(props.digit);
const previousDigit = ref(props.digit);
const isFlipping = ref(false);

watch(
  () => props.digit,
  (newVal, oldVal) => {
    if (newVal === oldVal) return;
    previousDigit.value = oldVal;
    isFlipping.value = true;
    // After animation, update current
    setTimeout(() => {
      currentDigit.value = newVal;
      isFlipping.value = false;
    }, 400);
  }
);
</script>

<template>
  <span class="flip-digit" aria-label="digit">
    <!-- Static bottom (new digit, revealed by flap) -->
    <span class="flip-digit__panel flip-digit__bottom-static">
      <span class="flip-digit__text">{{ props.digit }}</span>
    </span>

    <!-- Static top (new digit, shown after flip) -->
    <span class="flip-digit__panel flip-digit__top-static">
      <span class="flip-digit__text">{{ isFlipping ? previousDigit : props.digit }}</span>
    </span>

    <!-- Animated top flap (flips down) -->
    <span
      v-if="isFlipping"
      class="flip-digit__panel flip-digit__top-flap flip-digit__top-flap--active"
    >
      <span class="flip-digit__text">{{ previousDigit }}</span>
    </span>

    <!-- Animated bottom flap (flips up) -->
    <span
      v-if="isFlipping"
      class="flip-digit__panel flip-digit__bottom-flap flip-digit__bottom-flap--active"
    >
      <span class="flip-digit__text">{{ props.digit }}</span>
    </span>
  </span>
</template>

<style scoped>
.flip-digit {
  position: relative;
  display: inline-flex;
  width: 1.1em;
  height: 1.5em;
  perspective: 200px;
  overflow: hidden;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
}

.flip-digit__panel {
  position: absolute;
  left: 0;
  right: 0;
  height: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flip-digit__text {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 0;
  user-select: none;
}

/* Top panels - show upper half of digit */
.flip-digit__top-static,
.flip-digit__top-flap {
  top: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.flip-digit__top-static .flip-digit__text,
.flip-digit__top-flap .flip-digit__text {
  transform: translateY(50%);
}

/* Bottom panels - show lower half of digit */
.flip-digit__bottom-static,
.flip-digit__bottom-flap {
  bottom: 0;
}

.flip-digit__bottom-static .flip-digit__text,
.flip-digit__bottom-flap .flip-digit__text {
  transform: translateY(-50%);
}

/* Animated top flap - flips down to reveal new digit */
.flip-digit__top-flap {
  z-index: 3;
  transform-origin: bottom center;
  backface-visibility: hidden;
}

.flip-digit__top-flap--active {
  animation: flip-top-down 0.3s ease-in forwards;
}

/* Animated bottom flap - flips up to show new digit */
.flip-digit__bottom-flap {
  z-index: 2;
  transform-origin: top center;
  transform: rotateX(90deg);
  backface-visibility: hidden;
}

.flip-digit__bottom-flap--active {
  animation: flip-bottom-up 0.3s 0.15s ease-out forwards;
}

/* Static layers z-index */
.flip-digit__top-static {
  z-index: 1;
}

.flip-digit__bottom-static {
  z-index: 1;
}

@keyframes flip-top-down {
  0% {
    transform: rotateX(0deg);
  }
  100% {
    transform: rotateX(-90deg);
  }
}

@keyframes flip-bottom-up {
  0% {
    transform: rotateX(90deg);
  }
  100% {
    transform: rotateX(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .flip-digit__top-flap--active,
  .flip-digit__bottom-flap--active {
    animation: none;
  }
}
</style>
