<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch, type CSSProperties } from "vue";

import { useDashboard } from "@/composables/useDashboard";
import {
  DASHBOARD_WIDGET_DEFINITIONS,
  WIDGET_SIZE_LABELS,
  type DashboardWidgetId
} from "@/types/widget";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const dashboard = useDashboard();
const drawerRef = ref<HTMLElement | null>(null);

type WidgetToneStyle = CSSProperties & Record<`--${string}`, string>;

const widgetTones: Record<DashboardWidgetId, WidgetToneStyle> = {
  clock: {
    "--component-accent": "#f59e0b",
    "--component-accent-soft": "rgba(245, 158, 11, 0.14)",
    "--component-accent-line": "rgba(245, 158, 11, 0.28)",
    "--component-shadow": "rgba(245, 158, 11, 0.24)"
  },
  weather: {
    "--component-accent": "#6366f1",
    "--component-accent-soft": "rgba(99, 102, 241, 0.14)",
    "--component-accent-line": "rgba(99, 102, 241, 0.28)",
    "--component-shadow": "rgba(99, 102, 241, 0.24)"
  },
  calendar: {
    "--component-accent": "#ec4899",
    "--component-accent-soft": "rgba(236, 72, 153, 0.13)",
    "--component-accent-line": "rgba(236, 72, 153, 0.26)",
    "--component-shadow": "rgba(236, 72, 153, 0.22)"
  },
  countdown: {
    "--component-accent": "#22c55e",
    "--component-accent-soft": "rgba(34, 197, 94, 0.14)",
    "--component-accent-line": "rgba(34, 197, 94, 0.26)",
    "--component-shadow": "rgba(34, 197, 94, 0.22)"
  },
  todo: {
    "--component-accent": "#3b82f6",
    "--component-accent-soft": "rgba(59, 130, 246, 0.14)",
    "--component-accent-line": "rgba(59, 130, 246, 0.26)",
    "--component-shadow": "rgba(59, 130, 246, 0.22)"
  },
  progress: {
    "--component-accent": "#f97316",
    "--component-accent-soft": "rgba(249, 115, 22, 0.14)",
    "--component-accent-line": "rgba(249, 115, 22, 0.26)",
    "--component-shadow": "rgba(249, 115, 22, 0.22)"
  },
  sites: {
    "--component-accent": "#0ea5e9",
    "--component-accent-soft": "rgba(14, 165, 233, 0.14)",
    "--component-accent-line": "rgba(14, 165, 233, 0.26)",
    "--component-shadow": "rgba(14, 165, 233, 0.22)"
  },
  aiChat: {
    "--component-accent": "#14b8a6",
    "--component-accent-soft": "rgba(20, 184, 166, 0.14)",
    "--component-accent-line": "rgba(20, 184, 166, 0.28)",
    "--component-shadow": "rgba(20, 184, 166, 0.22)"
  }
};

const widgetItems = computed(() =>
  dashboard.orderedWidgets.value.map((widget) => ({
    id: widget.id,
    title: DASHBOARD_WIDGET_DEFINITIONS[widget.id].title,
    sizeLabel: WIDGET_SIZE_LABELS[widget.size],
    enabled: dashboard.isWidgetVisible(widget.id),
    style: widgetTones[widget.id]
  }))
);

const enabledCount = computed(() => widgetItems.value.filter((item) => item.enabled).length);
const hiddenCount = computed(() => widgetItems.value.length - enabledCount.value);
const enabledPercent = computed(() => `${widgetItems.value.length ? (enabledCount.value / widgetItems.value.length) * 100 : 0}%`);
const allWidgetsEnabled = computed(() => enabledCount.value === widgetItems.value.length);
const allWidgetsHidden = computed(() => enabledCount.value === 0);

function handleVisibilityChange(id: DashboardWidgetId, event: Event) {
  dashboard.setWidgetVisible(id, (event.target as HTMLInputElement).checked);
}

function setAllWidgetsVisible(visible: boolean) {
  widgetItems.value.forEach((item) => {
    dashboard.setWidgetVisible(item.id, visible);
  });
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === "Escape") {
    emit("close");
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      void nextTick(() => drawerRef.value?.focus({ preventScroll: true }));
      return;
    }

    window.removeEventListener("keydown", handleEscape);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleEscape);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="component-drawer-fade">
      <div v-if="open" class="component-drawer-overlay" @click.self="emit('close')">
        <Transition name="component-drawer-slide">
          <aside
            v-if="open"
            id="component-visibility-drawer"
            ref="drawerRef"
            class="component-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="组件显示设置"
            tabindex="-1"
          >
            <header class="component-drawer__header">
              <span class="component-drawer__mark" aria-hidden="true">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.05" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
                  <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
                  <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
                  <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
                </svg>
              </span>

              <div class="component-drawer__heading">
                <p class="component-drawer__eyebrow">组件</p>
                <h2 class="component-drawer__title">显示管理</h2>
              </div>

              <button class="component-drawer__close" type="button" aria-label="关闭组件设置" @click="emit('close')">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </header>

            <section class="component-drawer__overview" aria-label="组件显示概览">
              <div class="component-drawer__meter">
                <div class="component-drawer__meter-text">
                  <span>已开启</span>
                  <strong>{{ enabledCount }} / {{ widgetItems.length }}</strong>
                </div>
                <div class="component-drawer__progress" aria-hidden="true">
                  <span :style="{ width: enabledPercent }"></span>
                </div>
                <p>{{ hiddenCount ? `${hiddenCount} 个已隐藏` : "全部组件显示中" }}</p>
              </div>

              <div class="component-drawer__actions">
                <button
                  class="component-drawer__action"
                  type="button"
                  :disabled="allWidgetsEnabled"
                  title="全部显示"
                  aria-label="全部显示"
                  @click="setAllWidgetsVisible(true)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>

                <button
                  class="component-drawer__action"
                  type="button"
                  :disabled="allWidgetsHidden"
                  title="全部隐藏"
                  aria-label="全部隐藏"
                  @click="setAllWidgetsVisible(false)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 5.2A9.9 9.9 0 0 1 12 5c6 0 9.5 7 9.5 7a16 16 0 0 1-2.2 3.1" />
                    <path d="M6.5 6.5C3.9 8.2 2.5 12 2.5 12s3.5 7 9.5 7a9.3 9.3 0 0 0 4.1-.9" />
                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  </svg>
                </button>
              </div>
            </section>

            <div class="component-drawer__list scroll-soft">
              <label
                v-for="item in widgetItems"
                :key="item.id"
                class="component-toggle"
                :class="{ 'component-toggle--enabled': item.enabled }"
                :style="item.style"
              >
                <input
                  class="component-toggle__input"
                  type="checkbox"
                  :checked="item.enabled"
                  :aria-label="`${item.title}显示开关`"
                  @change="handleVisibilityChange(item.id, $event)"
                />

                <span class="component-toggle__icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.05" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="4" y="4" width="16" height="16" rx="4" />
                    <path d="M8 9.5h8" />
                    <path d="M8 14.5h5" />
                  </svg>
                </span>

                <span class="component-toggle__copy">
                  <span class="component-toggle__title">{{ item.title }}</span>
                  <span class="component-toggle__meta">
                    <span>{{ item.sizeLabel }}</span>
                    <span>{{ item.enabled ? "显示中" : "已隐藏" }}</span>
                  </span>
                </span>

                <span class="component-switch" aria-hidden="true">
                  <span class="component-switch__thumb"></span>
                </span>
              </label>
            </div>
          </aside>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.component-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  justify-content: flex-end;
  padding: 14px;
  background:
    radial-gradient(circle at 78% 18%, rgba(139, 92, 246, 0.11), transparent 28%),
    linear-gradient(90deg, rgba(15, 10, 40, 0.02), rgba(15, 10, 40, 0.18));
  backdrop-filter: blur(7px);
}

.component-drawer-fade-enter-active,
.component-drawer-fade-leave-active {
  transition: opacity 180ms ease;
}

.component-drawer-fade-enter-from,
.component-drawer-fade-leave-to {
  opacity: 0;
}

.component-drawer-slide-enter-active {
  transition: opacity 220ms ease, transform 260ms cubic-bezier(0.2, 0.85, 0.2, 1);
}

.component-drawer-slide-leave-active {
  transition: opacity 140ms ease, transform 170ms ease;
}

.component-drawer-slide-enter-from,
.component-drawer-slide-leave-to {
  opacity: 0;
  transform: translate3d(22px, 0, 0) scale(0.988);
}

.component-drawer {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(390px, calc(100vw - 28px));
  height: calc(100dvh - 28px);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.74);
  border-radius: 24px;
  background:
    linear-gradient(152deg, rgba(255, 255, 255, 0.94), rgba(245, 243, 255, 0.88) 48%, rgba(240, 248, 255, 0.86));
  box-shadow:
    0 28px 82px -40px rgba(15, 10, 40, 0.48),
    0 10px 34px -28px rgba(124, 58, 237, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(26px) saturate(1.45);
  outline: none;
}

.component-drawer::before,
.component-drawer::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.component-drawer::before {
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.45), transparent 26%),
    radial-gradient(circle at 85% 4%, rgba(124, 58, 237, 0.15), transparent 34%);
}

.component-drawer::after {
  right: -26%;
  bottom: -20%;
  width: 72%;
  height: 44%;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(20, 184, 166, 0.12), transparent 62%);
  filter: blur(4px);
}

.component-drawer__header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 22px 15px;
}

.component-drawer__mark {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 15px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(237, 233, 254, 0.72));
  color: var(--accent-600);
  box-shadow:
    0 18px 34px -26px rgba(124, 58, 237, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.88);
}

.component-drawer__heading {
  min-width: 0;
  flex: 1 1 auto;
}

.component-drawer__eyebrow {
  margin: 0 0 4px;
  font-size: 10px;
  font-weight: 760;
  letter-spacing: 0.26em;
  color: var(--accent-600);
}

.component-drawer__title {
  margin: 0;
  font-size: 20px;
  font-weight: 760;
  line-height: 1.15;
  color: var(--ink-950);
}

.component-drawer__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.34);
  color: var(--muted-500);
  transition: background 150ms ease, color 150ms ease, box-shadow 150ms ease;
}

.component-drawer__close:hover {
  background: rgba(139, 92, 246, 0.08);
  color: var(--accent-700);
  box-shadow: 0 14px 26px -24px rgba(124, 58, 237, 0.3);
}

.component-drawer__overview {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  gap: 10px;
  margin: 0 18px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.62), rgba(248, 246, 255, 0.48));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 18px 42px -36px rgba(15, 10, 40, 0.32);
}

.component-drawer__meter {
  min-width: 0;
}

.component-drawer__meter-text {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--muted-600);
  font-size: 12px;
  font-weight: 650;
}

.component-drawer__meter strong {
  color: var(--ink-950);
  font-size: 14px;
  font-weight: 780;
}

.component-drawer__progress {
  height: 5px;
  margin-top: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(110, 107, 133, 0.14);
}

.component-drawer__progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent-600), #14b8a6);
  transition: width 180ms ease;
}

.component-drawer__meter p {
  margin: 8px 0 0;
  color: var(--muted-500);
  font-size: 11px;
  font-weight: 620;
}

.component-drawer__actions {
  display: flex;
  gap: 6px;
}

.component-drawer__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 100%;
  min-height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.54);
  color: var(--muted-600);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  transition: background 150ms ease, color 150ms ease, transform 150ms ease, box-shadow 150ms ease;
}

.component-drawer__action:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.86);
  color: var(--accent-700);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 16px 28px -24px rgba(124, 58, 237, 0.38);
}

.component-drawer__list {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 9px;
  margin: 12px 0 0;
  overflow-y: auto;
  padding: 5px 18px 18px;
}

.component-toggle {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 66px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: 17px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.62), rgba(248, 246, 255, 0.48));
  padding: 11px 12px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 16px 36px -34px rgba(15, 10, 40, 0.3);
  transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.component-toggle::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--component-accent, var(--accent-600));
  opacity: 0;
  transition: opacity 160ms ease;
}

.component-toggle:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.86);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.82), rgba(248, 246, 255, 0.62));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 20px 40px -34px var(--component-shadow, rgba(124, 58, 237, 0.22));
}

.component-toggle--enabled {
  border-color: var(--component-accent-line, rgba(124, 58, 237, 0.24));
  background:
    radial-gradient(circle at 12% 0%, var(--component-accent-soft, rgba(124, 58, 237, 0.12)), transparent 40%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.78), rgba(248, 246, 255, 0.58));
}

.component-toggle--enabled::before {
  opacity: 1;
}

.component-toggle:has(.component-toggle__input:focus-visible) {
  outline: 2px solid rgba(124, 58, 237, 0.28);
  outline-offset: 3px;
}

.component-toggle__input {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.component-toggle__icon {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 14px;
  background: var(--component-accent-soft, rgba(124, 58, 237, 0.12));
  color: var(--component-accent, var(--accent-600));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.64);
}

.component-toggle__copy {
  position: relative;
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 5px;
}

.component-toggle__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 740;
  color: var(--ink-950);
}

.component-toggle__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 12px;
  font-weight: 620;
  color: var(--muted-600);
}

.component-toggle__meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.component-toggle__meta span + span {
  position: relative;
  padding-left: 8px;
}

.component-toggle__meta span + span::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: rgba(110, 107, 133, 0.42);
  transform: translateY(-50%);
}

.component-switch {
  position: relative;
  display: inline-flex;
  z-index: 1;
  flex: 0 0 auto;
  align-items: center;
  width: 46px;
  height: 28px;
  padding: 3px;
  border-radius: 999px;
  background: rgba(110, 107, 133, 0.18);
  box-shadow:
    inset 0 1px 2px rgba(15, 10, 40, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.48);
  transition: background 180ms ease, box-shadow 180ms ease;
}

.component-switch__thumb {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #fff;
  box-shadow:
    0 4px 10px rgba(15, 10, 40, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
  transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.component-toggle__input:checked ~ .component-switch {
  background:
    linear-gradient(135deg, var(--component-accent, var(--accent-600)), var(--accent-600));
  box-shadow:
    inset 0 1px 2px rgba(15, 10, 40, 0.08),
    0 14px 26px -20px var(--component-shadow, rgba(124, 58, 237, 0.38));
}

.component-toggle__input:checked ~ .component-switch .component-switch__thumb {
  transform: translateX(18px);
}

@media (max-width: 520px) {
  .component-drawer-overlay {
    padding: 8px;
  }

  .component-drawer {
    width: calc(100vw - 16px);
    height: calc(100dvh - 16px);
    border-radius: 22px;
  }

  .component-drawer__header {
    padding: 18px 16px 13px;
  }

  .component-drawer__overview {
    margin: 0 12px;
    grid-template-columns: 1fr;
  }

  .component-drawer__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .component-drawer__action {
    width: 100%;
    min-height: 38px;
  }

  .component-drawer__list {
    padding-right: 12px;
    padding-left: 12px;
  }

  .component-toggle {
    min-height: 62px;
    border-radius: 16px;
  }

  .component-toggle__icon {
    width: 38px;
    height: 38px;
  }
}
</style>
