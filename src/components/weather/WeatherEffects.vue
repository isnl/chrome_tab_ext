<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  weatherCode: number;
  isDay?: boolean;
}>();

type EffectType = "sunny" | "cloudy" | "rain" | "snow" | "storm" | "fog" | "drizzle";

const effectType = computed<EffectType>(() => {
  const c = props.weatherCode;
  if (c >= 95) return "storm";
  if ([71, 73, 75, 77, 85, 86].includes(c)) return "snow";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(c)) return "rain";
  if ([51, 53, 55, 56, 57].includes(c)) return "drizzle";
  if ([45, 48].includes(c)) return "fog";
  if ([2, 3].includes(c)) return "cloudy";
  return "sunny";
});

// Generate rain/snow drops with seeded positions
const rainDrops = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 5.7 + 3) % 100}%`,
  delay: `${(i * 0.37) % 2.5}s`,
  duration: `${0.6 + (i % 5) * 0.15}s`,
  opacity: 0.2 + (i % 3) * 0.1
}));

const snowFlakes = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 7.3 + 5) % 100}%`,
  delay: `${(i * 0.5) % 3.5}s`,
  duration: `${2.5 + (i % 4) * 0.5}s`,
  size: `${3 + (i % 3)}px`,
  opacity: 0.3 + (i % 3) * 0.1
}));

const cloudPuffs = [
  { left: "10%", top: "15%", width: "45%", height: "35%", delay: "0s", duration: "12s" },
  { left: "50%", top: "25%", width: "40%", height: "30%", delay: "4s", duration: "15s" },
  { left: "25%", top: "55%", width: "35%", height: "25%", delay: "8s", duration: "10s" }
];
</script>

<template>
  <div class="weather-effects" aria-hidden="true">
    <!-- Sunny: pulsing radial glow -->
    <div v-if="effectType === 'sunny'" class="effect-sunny" />

    <!-- Cloudy: drifting soft shapes -->
    <template v-if="effectType === 'cloudy'">
      <div
        v-for="(c, i) in cloudPuffs"
        :key="'cloud-' + i"
        class="effect-cloud"
        :style="{
          left: c.left,
          top: c.top,
          width: c.width,
          height: c.height,
          animationDelay: c.delay,
          animationDuration: c.duration
        }"
      />
    </template>

    <!-- Rain / Drizzle -->
    <template v-if="effectType === 'rain' || effectType === 'drizzle' || effectType === 'storm'">
      <span
        v-for="(d, i) in rainDrops"
        :key="'rain-' + i"
        class="effect-rain-drop"
        :class="{ 'effect-rain-drop--light': effectType === 'drizzle' }"
        :style="{
          left: d.left,
          animationDelay: d.delay,
          animationDuration: d.duration,
          opacity: d.opacity
        }"
      />
    </template>

    <!-- Storm flash -->
    <div v-if="effectType === 'storm'" class="effect-lightning" />

    <!-- Snow -->
    <template v-if="effectType === 'snow'">
      <span
        v-for="(s, i) in snowFlakes"
        :key="'snow-' + i"
        class="effect-snowflake"
        :style="{
          left: s.left,
          width: s.size,
          height: s.size,
          animationDelay: s.delay,
          animationDuration: s.duration,
          opacity: s.opacity
        }"
      />
    </template>

    <!-- Fog -->
    <div v-if="effectType === 'fog'" class="effect-fog" />
  </div>
</template>

<style scoped>
.weather-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  border-radius: inherit;
}

/* ── Sunny ── */
.effect-sunny {
  position: absolute;
  top: -20%;
  right: -20%;
  width: 70%;
  height: 70%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.18), transparent 65%);
  animation: sun-pulse 4s ease-in-out infinite;
}

@keyframes sun-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.08); }
}

/* ── Cloudy ── */
.effect-cloud {
  position: absolute;
  border-radius: 50%;
  background: rgba(200, 205, 220, 0.12);
  filter: blur(8px);
  animation: cloud-drift linear infinite alternate;
}

@keyframes cloud-drift {
  0% { transform: translateX(-8%); }
  100% { transform: translateX(8%); }
}

/* ── Rain ── */
.effect-rain-drop {
  position: absolute;
  top: -8px;
  width: 1.5px;
  height: 14px;
  background: linear-gradient(to bottom, transparent, rgba(99, 130, 200, 0.35));
  border-radius: 0 0 2px 2px;
  animation: rain-fall linear infinite;
}

.effect-rain-drop--light {
  height: 10px;
  width: 1px;
  opacity: 0.15 !important;
}

@keyframes rain-fall {
  0% { transform: translateY(-14px); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: translateY(calc(100cqh + 14px)); opacity: 0; }
}

/* ── Storm flash ── */
.effect-lightning {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.08);
  animation: lightning-flash 4s ease-in-out infinite;
}

@keyframes lightning-flash {
  0%, 88%, 92%, 100% { opacity: 0; }
  89% { opacity: 1; }
  91% { opacity: 0.6; }
}

/* ── Snow ── */
.effect-snowflake {
  position: absolute;
  top: -6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  animation: snow-fall linear infinite;
}

@keyframes snow-fall {
  0% { transform: translateY(-6px) translateX(0); }
  33% { transform: translateY(33cqh) translateX(6px); }
  66% { transform: translateY(66cqh) translateX(-4px); }
  100% { transform: translateY(calc(100cqh + 6px)) translateX(2px); }
}

/* ── Fog ── */
.effect-fog {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(200, 200, 210, 0.1) 30%,
    rgba(200, 200, 210, 0.15) 50%,
    rgba(200, 200, 210, 0.1) 70%,
    transparent 100%
  );
  animation: fog-drift 6s ease-in-out infinite alternate;
}

@keyframes fog-drift {
  0% { opacity: 0.4; transform: translateX(-5%); }
  100% { opacity: 0.8; transform: translateX(5%); }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .effect-sunny,
  .effect-cloud,
  .effect-rain-drop,
  .effect-lightning,
  .effect-snowflake,
  .effect-fog {
    animation: none;
  }
}
</style>
