<script setup lang="ts">
import { computed, type CSSProperties } from "vue";

import type { DashboardWidgetId, WidgetSize } from "@/types/widget";

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    kind: DashboardWidgetId;
    kicker?: string;
    size: WidgetSize;
    interactive?: boolean;
    viewName?: string;
  }>(),
  {
    subtitle: "",
    kicker: "",
    interactive: true,
    viewName: ""
  }
);

const emit = defineEmits<{
  open: [];
  menu: [value: { x: number; y: number }];
}>();

const isCompact = computed(() => props.size === "1x1");
const isTall = computed(() => props.size === "1x2");
const isExpanded = computed(() => props.size === "4x4");

type WidgetThemeStyle = CSSProperties & Record<`--${string}`, string>;

const themeStyle = computed<WidgetThemeStyle>(() => {
  switch (props.kind) {
    case "clock":
      return {
        "--widget-shell-bg": "linear-gradient(160deg, rgba(255,250,244,0.92), rgba(255,242,226,0.82) 58%, rgba(255,255,255,0.74))",
        "--widget-shell-glow": "radial-gradient(circle at top right, rgba(251,191,36,0.24), transparent 38%)",
        "--widget-chip-bg": "rgba(217,119,6,0.12)",
        "--widget-chip-text": "#9a3412"
      };
    case "weather":
      return {
        "--widget-shell-bg": "linear-gradient(160deg, rgba(243,249,255,0.94), rgba(226,242,255,0.82) 52%, rgba(240,253,250,0.76))",
        "--widget-shell-glow": "radial-gradient(circle at top right, rgba(56,189,248,0.22), transparent 42%)",
        "--widget-chip-bg": "rgba(2,132,199,0.12)",
        "--widget-chip-text": "#0369a1"
      };
    case "calendar":
    default:
      return {
        "--widget-shell-bg": "linear-gradient(160deg, rgba(253,247,244,0.94), rgba(252,234,227,0.82) 48%, rgba(244,250,247,0.74))",
        "--widget-shell-glow": "radial-gradient(circle at top right, rgba(251,146,60,0.18), transparent 38%)",
        "--widget-chip-bg": "rgba(234,88,12,0.12)",
        "--widget-chip-text": "#c2410c"
      };
  }
});

const rootStyle = computed<WidgetThemeStyle>(() => ({
  ...(props.viewName ? { viewTransitionName: props.viewName } : {}),
  ...themeStyle.value
}));

function openDetails() {
  if (!props.interactive) {
    return;
  }

  emit("open");
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.interactive) {
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    emit("open");
    return;
  }

  if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement | null;
    const rect = target?.getBoundingClientRect();
    emit("menu", {
      x: rect ? rect.left + rect.width - 20 : window.innerWidth / 2,
      y: rect ? rect.top + 20 : window.innerHeight / 2
    });
  }
}

function handleContextMenu(event: MouseEvent) {
  if (!props.interactive) {
    return;
  }

  event.preventDefault();
  emit("menu", {
    x: event.clientX,
    y: event.clientY
  });
}
</script>

<template>
  <article
    class="surface-card dashboard-widget group relative h-full overflow-hidden transition duration-300"
    :class="interactive ? 'hover:-translate-y-1 hover:shadow-[0_32px_85px_-40px_rgba(15,23,42,0.34)]' : ''"
    :style="rootStyle"
    :tabindex="interactive ? 0 : -1"
    @click="openDetails"
    @contextmenu="handleContextMenu"
    @keydown="handleKeydown"
  >
    <div class="dashboard-widget__grain"></div>

    <div class="relative flex h-full min-h-0 flex-col" :class="isCompact ? 'p-4' : isExpanded ? 'p-5 sm:p-6' : 'p-4 sm:p-5'">
      <div :class="isCompact ? 'mb-3' : isTall ? 'mb-4' : 'mb-5'">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p
              class="font-semibold uppercase"
              :class="isCompact || isTall ? 'text-[10px] tracking-[0.28em] text-slate-500' : 'section-kicker'"
            >
              {{ isCompact ? title : kicker || title }}
            </p>
            <h3
              v-if="!isCompact"
              class="mt-2 truncate font-display font-semibold tracking-tight text-slate-900"
              :class="isExpanded ? 'text-[2rem]' : isTall ? 'text-xl' : 'text-[1.65rem]'"
            >
              {{ title }}
            </h3>
            <p v-if="!isCompact && subtitle" class="mt-2 max-w-[18rem] text-sm leading-6 text-slate-500">
              {{ subtitle }}
            </p>
          </div>

          <span v-if="!isCompact" class="dashboard-widget__action">
            {{ isTall ? "Open" : "Enter" }}
          </span>
        </div>
      </div>

      <div class="min-h-0 flex-1">
        <slot />
      </div>

      <div
        v-if="!isCompact"
        class="mt-4 flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400"
      >
        <span>点击展开</span>
        <span>右键改尺寸</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.dashboard-widget {
  background: var(--widget-shell-bg);
}

.dashboard-widget::before {
  background: var(--widget-shell-glow);
}

.dashboard-widget::after {
  inset: auto -12% -42% 42%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.42), transparent 62%);
}

.dashboard-widget__grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.24), transparent 30%),
    radial-gradient(circle at 14% 18%, rgba(255, 255, 255, 0.2), transparent 18%);
  opacity: 0.9;
}

.dashboard-widget__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.75rem;
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  background: var(--widget-chip-bg);
  color: var(--widget-chip-text);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
</style>
