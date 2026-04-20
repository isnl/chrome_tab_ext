<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    hours: string;
    minutes: string;
    seconds: string;
    variant?: "compact" | "feature";
    modeLabel?: string;
  }>(),
  {
    variant: "compact",
    modeLabel: ""
  }
);

const primaryGroups = computed(() => [
  { key: "hours", label: "HRS", value: props.hours },
  { key: "minutes", label: "MIN", value: props.minutes }
]);

const secondsDigits = computed(() => props.seconds.split(""));
const ariaLabel = computed(() => `${props.hours}:${props.minutes}:${props.seconds}`);

function splitDigits(value: string) {
  return value.split("");
}
</script>

<template>
  <div class="clock-readout" :class="`clock-readout--${variant}`" :aria-label="ariaLabel" role="text">
    <div class="clock-readout__main">
      <template v-for="(group, index) in primaryGroups" :key="group.key">
        <div class="clock-readout__group">
          <span v-if="variant === 'feature'" class="clock-readout__group-label">{{ group.label }}</span>
          <span class="clock-readout__pair">
            <span
              v-for="(digit, digitIndex) in splitDigits(group.value)"
              :key="`${group.key}-${digitIndex}`"
              class="clock-readout__digit"
            >
              {{ digit }}
            </span>
          </span>
        </div>

        <span v-if="index < primaryGroups.length - 1" class="clock-readout__divider" aria-hidden="true">
          <span></span>
          <span></span>
        </span>
      </template>
    </div>

    <div class="clock-readout__trail">
      <div class="clock-readout__seconds-row">
        <span class="clock-readout__trail-divider" aria-hidden="true">
          <span></span>
          <span></span>
        </span>

        <div class="clock-readout__seconds">
          <span v-if="variant === 'feature'" class="clock-readout__seconds-label">SEC</span>
          <span class="clock-readout__pair clock-readout__pair--secondary">
            <span
              v-for="(digit, digitIndex) in secondsDigits"
              :key="`seconds-${digitIndex}`"
              class="clock-readout__digit clock-readout__digit--secondary"
            >
              {{ digit }}
            </span>
          </span>
        </div>
      </div>

      <span v-if="variant === 'feature' && modeLabel" class="clock-readout__mode-chip">
        {{ modeLabel }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.clock-readout {
  --clock-cell-border: rgba(148, 163, 184, 0.28);
  --clock-cell-shadow: 0 10px 14px -14px rgba(15, 23, 42, 0.28);
  --clock-cell-highlight: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.82),
    rgba(255, 251, 245, 0.58) 48%,
    rgba(241, 245, 249, 0.44)
  );
  --clock-cell-highlight-secondary: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.76),
    rgba(255, 252, 248, 0.48) 48%,
    rgba(241, 245, 249, 0.36)
  );
  --clock-divider-color: rgba(100, 116, 139, 0.68);
  --clock-label-gap: 0.22rem;

  min-width: 0;
  color: var(--ink-950);
}

.clock-readout--compact {
  --clock-digit-size: 1.52rem;
  --clock-digit-width: 0.62em;
  --clock-digit-gap: 0.18rem;
  --clock-pair-padding-x: 0;
  --clock-pair-padding-y: 0;
  --clock-secondary-digit-size: 1.02rem;
  --clock-secondary-digit-width: 0.56em;
  --clock-secondary-gap: 0.14rem;
  --clock-secondary-padding-x: 0;
  --clock-secondary-padding-y: 0;
  --clock-cell-height: 1.72em;
  --clock-secondary-cell-height: 1.58em;
  --clock-cell-radius: 10px;
  --clock-secondary-cell-radius: 9px;
  --clock-dot-width: 0.16rem;
  --clock-dot-height: 0.36rem;
  --clock-dot-gap: 0.18rem;

  display: inline-flex;
  align-items: flex-end;
  gap: 0.42rem;
}

.clock-readout--feature {
  --clock-digit-size: 1.82rem;
  --clock-digit-width: 0.62em;
  --clock-digit-gap: 0.22rem;
  --clock-pair-padding-x: 0;
  --clock-pair-padding-y: 0;
  --clock-secondary-digit-size: 1.14rem;
  --clock-secondary-digit-width: 0.58em;
  --clock-secondary-gap: 0.15rem;
  --clock-secondary-padding-x: 0;
  --clock-secondary-padding-y: 0;
  --clock-cell-height: 1.78em;
  --clock-secondary-cell-height: 1.62em;
  --clock-cell-radius: 11px;
  --clock-secondary-cell-radius: 9px;
  --clock-dot-width: 0.17rem;
  --clock-dot-height: 0.38rem;
  --clock-dot-gap: 0.2rem;

  display: grid;
  width: 100%;
  gap: 0.62rem;
}

.clock-readout__main {
  display: inline-flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.3rem;
}

.clock-readout__group,
.clock-readout__seconds {
  display: flex;
  flex-direction: column;
  gap: var(--clock-label-gap);
  min-width: 0;
}

.clock-readout__pair {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--clock-digit-gap);
  min-width: 0;
  padding: var(--clock-pair-padding-y) var(--clock-pair-padding-x);
}

.clock-readout__pair--secondary {
  gap: var(--clock-secondary-gap);
  padding: var(--clock-secondary-padding-y) var(--clock-secondary-padding-x);
}

.clock-readout__digit {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--clock-digit-width);
  min-height: var(--clock-cell-height);
  padding-inline: 0.18rem;
  border-radius: var(--clock-cell-radius);
  border: 1px solid var(--clock-cell-border);
  background: var(--clock-cell-highlight);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92), var(--clock-cell-shadow);
  font-size: var(--clock-digit-size);
  font-weight: 760;
  line-height: 1;
  letter-spacing: -0.08em;
  color: var(--ink-950);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.46);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  font-family: "IBM Plex Mono", "JetBrains Mono", "SF Mono", "Menlo", monospace;
  overflow: hidden;
}

.clock-readout__digit::before {
  content: "";
  position: absolute;
  left: 0.28rem;
  right: 0.28rem;
  top: 50%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(100, 116, 139, 0.26), transparent);
}

.clock-readout__digit::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.24), transparent 40%);
}

.clock-readout__digit--secondary {
  width: var(--clock-secondary-digit-width);
  min-height: var(--clock-secondary-cell-height);
  border-radius: var(--clock-secondary-cell-radius);
  background: var(--clock-cell-highlight-secondary);
  font-size: var(--clock-secondary-digit-size);
  color: rgb(51 65 85 / 0.86);
}

.clock-readout__divider,
.clock-readout__trail-divider {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--clock-dot-gap);
}

.clock-readout__divider span,
.clock-readout__trail-divider span {
  width: var(--clock-dot-width);
  height: var(--clock-dot-height);
  border-radius: 999px;
  background: linear-gradient(180deg, var(--clock-divider-color), rgba(100, 116, 139, 0.36));
}

.clock-readout__group-label,
.clock-readout__seconds-label {
  font-size: 0.52rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  text-align: center;
  color: rgb(100 116 139 / 0.78);
}

.clock-readout__trail {
  min-width: 0;
}

.clock-readout__seconds-row {
  display: inline-flex;
  align-items: flex-end;
  gap: 0.28rem;
}

.clock-readout__mode-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.5rem;
  border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.4);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 12px 20px -18px rgba(15, 23, 42, 0.2);
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.12em;
  white-space: nowrap;
  color: rgb(71 85 105 / 0.9);
}

.clock-readout--compact .clock-readout__trail {
  display: inline-flex;
  align-items: center;
}

.clock-readout--compact .clock-readout__trail-divider {
  transform: translateY(-0.02rem);
}

.clock-readout--feature .clock-readout__trail {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.65rem;
  width: 100%;
}

.clock-readout--feature .clock-readout__trail-divider {
  transform: translateY(-0.08rem);
}
</style>
