<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

import { useDashboard } from "@/composables/useDashboard";
import { useSparkBurst } from "@/composables/useSparkBurst";
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
const { sparkBursts, triggerSparkBurstFromElement } = useSparkBurst();

const widgetItems = computed(() =>
  dashboard.orderedWidgets.value.map((widget) => ({
    id: widget.id,
    title: DASHBOARD_WIDGET_DEFINITIONS[widget.id].title,
    sizeLabel: WIDGET_SIZE_LABELS[widget.size],
    enabled: dashboard.isWidgetVisible(widget.id)
  }))
);

const enabledCount = computed(() => widgetItems.value.filter((item) => item.enabled).length);
const hiddenCount = computed(() => widgetItems.value.length - enabledCount.value);
const allWidgetsEnabled = computed(() => enabledCount.value === widgetItems.value.length);
const allWidgetsHidden = computed(() => enabledCount.value === 0);

function handleVisibilityChange(id: DashboardWidgetId, event: Event) {
  const input = event.target as HTMLInputElement;
  dashboard.setWidgetVisible(id, input.checked);

  if (input.checked) {
    triggerSparkBurstFromElement(input.closest(".component-toggle"), 0.88);
  }
}

function setAllWidgetsVisible(visible: boolean, event?: MouseEvent) {
  const shouldCelebrate = visible && !allWidgetsEnabled.value;
  widgetItems.value.forEach((item) => {
    dashboard.setWidgetVisible(item.id, visible);
  });

  if (shouldCelebrate) {
    triggerSparkBurstFromElement(event?.currentTarget as Element | null);
  }
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
                <div class="component-drawer__progress">
                  <div
                    class="component-drawer__progress-fill"
                    :style="{ width: `${(enabledCount / widgetItems.length) * 100}%` }"
                  ></div>
                </div>
                <p>{{ hiddenCount ? `${hiddenCount} 个已隐藏` : "全部组件显示中" }}</p>
              </div>

              <div class="component-drawer__actions">
                <button
                  class="component-drawer__action"
                  :class="allWidgetsEnabled ? 'component-drawer__action--hide' : 'component-drawer__action--show'"
                  type="button"
                  :aria-label="allWidgetsEnabled ? '全部隐藏' : '全部显示'"
                  @click="allWidgetsEnabled ? setAllWidgetsVisible(false) : setAllWidgetsVisible(true, $event)"
                >
                  <template v-if="allWidgetsEnabled">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.05" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M10.7 5.1A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7a14.4 14.4 0 0 1-1.9 2.9" />
                      <path d="M6.6 6.6C3.7 8.6 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.7" />
                      <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2" />
                      <path d="M3 3l18 18" />
                    </svg>
                    <span>全部隐藏</span>
                  </template>
                  <template v-else>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.05" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>全部显示</span>
                  </template>
                </button>
              </div>
            </section>

            <div class="component-drawer__list scroll-soft">
              <label
                v-for="item in widgetItems"
                :key="item.id"
                class="component-toggle"
                :class="{ 'component-toggle--enabled': item.enabled }"
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

  <Teleport to="body">
    <div class="component-spark-layer" aria-hidden="true">
      <span
        v-for="burst in sparkBursts"
        :key="burst.id"
        class="component-spark-burst"
        :style="{ left: `${burst.x}px`, top: `${burst.y}px` }"
      >
        <span
          v-for="particle in burst.particles"
          :key="particle.id"
          class="component-spark"
          :style="{
            '--spark-x': `${particle.x}px`,
            '--spark-y': `${particle.y}px`,
            '--spark-size': `${particle.size}px`,
            '--spark-color': particle.color,
            '--spark-delay': `${particle.delay}ms`,
            '--spark-rotate': particle.rotate
          }"
        ></span>
      </span>
    </div>
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
  padding: 24px 22px 16px;
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
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.38);
  color: var(--muted-500);
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease, box-shadow 150ms ease, border-color 150ms ease;
}

.component-drawer__close:hover {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.18);
  color: var(--accent-700);
  box-shadow: 0 14px 26px -24px rgba(124, 58, 237, 0.3);
}

.component-drawer__overview {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin: 0 18px;
  overflow: hidden;
  padding: 14px 14px 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 18px;
  background:
    radial-gradient(circle at 14% 0%, rgba(124, 58, 237, 0.09), transparent 38%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.74), rgba(248, 246, 255, 0.52));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 16px 34px -30px rgba(15, 10, 40, 0.28);
}

.component-drawer__overview::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.34), transparent 48%),
    linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2) 50%, transparent 76%);
}

.component-drawer__meter {
  position: relative;
  z-index: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
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

.component-drawer__meter-text span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.component-drawer__meter-text span::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
}

.component-drawer__meter strong {
  padding: 1px 7px;
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.58);
  color: var(--ink-950);
  font-size: 14px;
  font-weight: 780;
  font-variant-numeric: tabular-nums;
  line-height: 1.35;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.component-drawer__meter p {
  margin: 0;
  color: var(--muted-500);
  font-size: 11px;
  font-weight: 620;
}

.component-drawer__progress {
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: rgba(110, 107, 133, 0.1);
  overflow: hidden;
  box-shadow: inset 0 1px 1px rgba(15, 10, 40, 0.04);
}

.component-drawer__progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #14b8a6, #06b6d4);
  box-shadow: 0 0 8px rgba(20, 184, 166, 0.4);
  transition: width 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.component-drawer__actions {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 7px;
}

.component-drawer__action {
  --action-accent: var(--accent-600);
  --action-soft: rgba(124, 58, 237, 0.1);
  --action-line: rgba(124, 58, 237, 0.16);
  --action-shadow: rgba(124, 58, 237, 0.3);
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  overflow: hidden;
  border: 1px solid var(--action-line);
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.92), transparent 42%),
    linear-gradient(155deg, rgba(255, 255, 255, 0.9), var(--action-soft));
  color: var(--action-accent);
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    inset 0 -12px 26px rgba(255, 255, 255, 0.24),
    0 16px 28px -24px var(--action-shadow);
  transition: border-color 160ms ease, background 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
}

.component-drawer__action::before {
  content: "";
  position: absolute;
  inset: 6px 7px auto;
  height: 1px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
}

.component-drawer__action svg {
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.62));
}

.component-drawer__action--show {
  --action-accent: #14b8a6;
  --action-soft: rgba(20, 184, 166, 0.12);
  --action-line: rgba(20, 184, 166, 0.2);
  --action-shadow: rgba(20, 184, 166, 0.38);
}

.component-drawer__action--hide {
  --action-accent: #64748b;
  --action-soft: rgba(100, 116, 139, 0.12);
  --action-line: rgba(100, 116, 139, 0.18);
  --action-shadow: rgba(71, 85, 105, 0.3);
}

.component-drawer__action:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--action-accent) 42%, white);
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.96), transparent 42%),
    linear-gradient(155deg, rgba(255, 255, 255, 0.96), color-mix(in srgb, var(--action-accent) 16%, white));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -12px 26px rgba(255, 255, 255, 0.26),
    0 18px 30px -22px var(--action-shadow);
}

.component-drawer__action:active:not(:disabled) {
  transform: translateY(0);
  box-shadow:
    inset 0 1px 3px rgba(15, 10, 40, 0.1),
    0 10px 18px -18px var(--action-shadow);
}

.component-drawer__action:disabled {
  opacity: 1;
  border-color: rgba(255, 255, 255, 0.58);
  background:
    linear-gradient(155deg, rgba(255, 255, 255, 0.66), rgba(245, 243, 255, 0.38));
  color: rgba(85, 82, 112, 0.58);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    inset 0 -10px 22px rgba(255, 255, 255, 0.18);
}

.component-drawer__list {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  margin: 14px 0 0;
  overflow-y: auto;
  padding: 6px 18px 20px;
  mask-image: linear-gradient(to bottom, transparent, black 6px, black calc(100% - 20px), transparent);
}

.component-drawer__list::-webkit-scrollbar {
  width: 5px;
}

.component-drawer__list::-webkit-scrollbar-track {
  background: transparent;
}

.component-drawer__list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.15);
}

.component-drawer__list::-webkit-scrollbar-thumb:hover {
  background: rgba(124, 58, 237, 0.28);
}

.component-toggle {
  --switch-active-color: #14b8a6;
  --switch-active-soft: rgba(20, 184, 166, 0.13);
  --switch-active-line: rgba(20, 184, 166, 0.28);
  --switch-active-shadow: rgba(20, 184, 166, 0.28);
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.62), rgba(248, 246, 255, 0.48));
  padding: 12px 14px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 12px 28px -28px rgba(15, 10, 40, 0.26);
  transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.component-toggle::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 16px;
  border-radius: 14px 0 0 14px;
  background:
    linear-gradient(90deg, var(--switch-active-color) 0 4px, rgba(20, 184, 166, 0.18) 4px, rgba(20, 184, 166, 0.06) 72%, transparent);
  opacity: 0;
  transition: opacity 160ms ease;
}

.component-toggle:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.86);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.82), rgba(248, 246, 255, 0.62));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 20px 40px -34px var(--switch-active-shadow);
}

.component-toggle--enabled {
  border-color: var(--switch-active-line);
  background:
    radial-gradient(circle at 12% 0%, var(--switch-active-soft), transparent 40%),
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
  border-radius: 12px;
  background: var(--switch-active-soft);
  color: var(--switch-active-color);
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
  background: var(--switch-active-color);
  box-shadow:
    inset 0 1px 2px rgba(15, 10, 40, 0.08),
    0 14px 26px -20px var(--switch-active-shadow);
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
  }

  .component-drawer__actions {
    gap: 7px;
  }

  .component-drawer__action {
    height: 34px;
    padding: 0 12px;
    font-size: 12px;
  }

  .component-drawer__list {
    padding-right: 12px;
    padding-left: 12px;
  }

  .component-toggle {
    min-height: 60px;
    border-radius: 14px;
  }

  .component-toggle__icon {
    width: 38px;
    height: 38px;
  }
}
</style>

<style>
.component-spark-layer {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  overflow: visible;
}

.component-spark-burst {
  position: absolute;
  width: 0;
  height: 0;
  overflow: visible;
}

.component-spark {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--spark-size);
  height: var(--spark-size);
  border-radius: 2px;
  background: var(--spark-color);
  box-shadow: 0 0 4px var(--spark-color), 0 0 0 1px rgba(255, 255, 255, 0.58);
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.35) rotate(var(--spark-rotate));
  animation: component-spark-pop 660ms cubic-bezier(0.17, 0.84, 0.3, 1) var(--spark-delay) forwards !important;
  animation-duration: 660ms !important;
}

.component-spark:nth-child(3n) {
  border-radius: 999px;
}

.component-spark:nth-child(4n) {
  clip-path: polygon(50% 0, 62% 35%, 100% 50%, 62% 65%, 50% 100%, 38% 65%, 0 50%, 38% 35%);
}

@keyframes component-spark-pop {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2) rotate(var(--spark-rotate));
  }

  16% {
    opacity: 1;
  }

  72% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--spark-x)), calc(-50% + var(--spark-y))) scale(1) rotate(calc(var(--spark-rotate) + 155deg));
  }
}
</style>
