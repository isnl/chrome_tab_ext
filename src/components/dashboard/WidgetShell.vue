<script setup lang="ts">
import { computed, type CSSProperties } from "vue";

import type { DashboardWidgetId, WidgetSize } from "@/types/widget";

const props = defineProps<{
  title: string;
  kind: DashboardWidgetId;
  size: WidgetSize;
}>();

const emit = defineEmits<{
  menu: [value: { x: number; y: number }];
}>();

const isCompact = computed(() => props.size === "1x1" || props.size === "2x1");

type WidgetThemeStyle = CSSProperties & Record<`--${string}`, string>;

const themeStyle = computed<WidgetThemeStyle>(() => {
  switch (props.kind) {
    case "clock":
      return {
        "--surface-radius": props.size === "2x1" ? "16px" : props.size === "2x2" ? "18px" : "16px",
        "--widget-shell-bg": "linear-gradient(160deg, rgba(255,252,248,0.92), rgba(254,243,199,0.72) 58%, rgba(255,255,255,0.74))",
        "--widget-shell-glow": "radial-gradient(circle at top right, rgba(245,158,11,0.2), transparent 40%)"
      };
    case "weather":
      return {
        "--surface-radius": "20px",
        "--widget-shell-bg": "linear-gradient(160deg, rgba(248,246,255,0.94), rgba(237,233,254,0.78) 52%, rgba(240,248,255,0.76))",
        "--widget-shell-glow": "radial-gradient(circle at top right, rgba(99,102,241,0.18), transparent 42%)"
      };
    case "calendar":
      return {
        "--surface-radius": "20px",
        "--widget-shell-bg": "linear-gradient(160deg, rgba(255,248,250,0.94), rgba(252,231,243,0.76) 48%, rgba(248,246,255,0.74))",
        "--widget-shell-glow": "radial-gradient(circle at top right, rgba(236,72,153,0.16), transparent 40%)"
      };
    case "countdown":
      return {
        "--surface-radius": "20px",
        "--widget-shell-bg": "linear-gradient(160deg, rgba(248,255,248,0.92), rgba(187,247,208,0.72) 58%, rgba(255,255,255,0.74))",
        "--widget-shell-glow": "radial-gradient(circle at top right, rgba(34,197,94,0.2), transparent 40%)"
      };
    case "todo":
      return {
        "--surface-radius": "20px",
        "--widget-shell-bg": "linear-gradient(160deg, rgba(248,250,255,0.94), rgba(191,219,254,0.76) 52%, rgba(240,248,255,0.76))",
        "--widget-shell-glow": "radial-gradient(circle at top right, rgba(59,130,246,0.18), transparent 42%)"
      };
    case "progress":
      return {
        "--surface-radius": "20px",
        "--widget-shell-bg": "linear-gradient(160deg, rgba(255,250,245,0.94), rgba(254,215,170,0.72) 50%, rgba(255,237,213,0.76))",
        "--widget-shell-glow": "radial-gradient(circle at top right, rgba(249,115,22,0.2), transparent 42%)"
      };
    default:
      return {
        "--surface-radius": "20px",
        "--widget-shell-bg": "linear-gradient(160deg, rgba(255,248,250,0.94), rgba(252,231,243,0.76) 48%, rgba(248,246,255,0.74))",
        "--widget-shell-glow": "radial-gradient(circle at top right, rgba(236,72,153,0.16), transparent 40%)"
      };
  }
});

function handleContextMenu(event: MouseEvent) {
  event.preventDefault();
  emit("menu", { x: event.clientX, y: event.clientY });
}
</script>

<template>
  <article
    class="surface-card dashboard-widget relative h-full overflow-hidden"
    :style="themeStyle"
    @contextmenu="handleContextMenu"
  >
    <div class="dashboard-widget__grain"></div>

    <div class="relative flex h-full min-h-0 flex-col" :class="size === '1x1' ? 'p-2' : isCompact ? 'p-3.5' : 'p-4'">
      <div class="min-h-0 flex-1">
        <slot />
      </div>
    </div>
  </article>
</template>

<style scoped>
.dashboard-widget {
  background: var(--widget-shell-bg);
  transition: transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 280ms ease-out;
}

.dashboard-widget::before {
  background: var(--widget-shell-glow);
}

.dashboard-widget::after {
  inset: auto -12% -42% 42%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.06), transparent 60%);
}

.dashboard-widget__grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent 28%),
    radial-gradient(
      circle at 14% 18%,
      rgba(255, 255, 255, 0.16),
      transparent 16%
    );
  opacity: 0.85;
}
</style>
