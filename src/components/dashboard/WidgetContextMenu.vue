<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from "vue";

import { WIDGET_SIZE_LABELS, type DashboardWidgetId, type WidgetSize } from "@/types/widget";

const props = defineProps<{
  open: boolean;
  x: number;
  y: number;
  widgetId: DashboardWidgetId;
  title: string;
  currentSize: WidgetSize;
  sizes: WidgetSize[];
}>();

const emit = defineEmits<{
  close: [];
  resize: [value: WidgetSize];
  settings: [];
  history: [];
}>();

const hasSettings = computed(() =>
  props.widgetId === "weather" || props.widgetId === "clock" || props.widgetId === "countdown" || props.widgetId === "todo" || props.widgetId === "sites" || props.widgetId === "aiChat"
);

const hasHistory = computed(() => props.widgetId === "todo" || props.widgetId === "aiChat");

const settingsLabel = computed(() => {
  switch (props.widgetId) {
    case "weather": return "切换城市";
    case "clock": return "时间格式";
    case "countdown": return "管理倒计时";
    case "todo": return "隐私设置";
    case "sites": return "添加网站";
    case "aiChat": return "接口配置";
    default: return "";
  }
});

const historyLabel = computed(() => (props.widgetId === "aiChat" ? "历史对话" : "历史记录"));

const menuStyle = computed(() => {
  const width = 200;
  const itemHeight = 38;
  const extraHeight = (hasSettings.value ? 48 : 0) + (hasHistory.value ? 48 : 0);
  const height = 52 + props.sizes.length * itemHeight + extraHeight;
  const left = Math.min(props.x, window.innerWidth - width - 12);
  const top = Math.min(props.y, window.innerHeight - height - 12);

  return {
    left: `${Math.max(12, left)}px`,
    top: `${Math.max(12, top)}px`
  };
});

function handlePointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest("[data-widget-context-menu='true']")) return;
  emit("close");
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === "Escape") emit("close");
}

function handleViewportChange() {
  emit("close");
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      window.addEventListener("pointerdown", handlePointerDown);
      window.addEventListener("keydown", handleEscape);
      window.addEventListener("resize", handleViewportChange);
      window.addEventListener("scroll", handleViewportChange, true);
      return;
    }

    window.removeEventListener("pointerdown", handlePointerDown);
    window.removeEventListener("keydown", handleEscape);
    window.removeEventListener("resize", handleViewportChange);
    window.removeEventListener("scroll", handleViewportChange, true);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", handlePointerDown);
  window.removeEventListener("keydown", handleEscape);
  window.removeEventListener("resize", handleViewportChange);
  window.removeEventListener("scroll", handleViewportChange, true);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="translate-y-1 scale-95 opacity-0"
      enter-to-class="translate-y-0 scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="translate-y-0 scale-100 opacity-100"
      leave-to-class="translate-y-1 scale-95 opacity-0"
    >
      <section
        v-if="open"
        data-widget-context-menu="true"
        class="context-menu"
        :style="menuStyle"
        @contextmenu.prevent
      >
        <div class="context-menu-inner">
          <p class="context-menu-title">{{ title }}</p>

          <!-- size options -->
          <div class="context-menu-group">
            <button
              v-for="size in sizes"
              :key="size"
              class="context-menu-btn"
              :class="{ 'context-menu-btn--active': size === currentSize }"
              type="button"
              @click="emit('resize', size); emit('close')"
            >
              <span>{{ WIDGET_SIZE_LABELS[size] }}</span>
              <span v-if="size === currentSize" class="context-menu-check">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
            </button>
          </div>

          <!-- settings -->
          <div v-if="hasSettings" class="context-menu-divider"></div>
          <div v-if="hasSettings" class="context-menu-group">
            <button
              class="context-menu-btn"
              type="button"
              @click="emit('settings'); emit('close')"
            >
              <span>{{ settingsLabel }}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>

          <!-- history -->
          <div v-if="hasHistory" class="context-menu-divider"></div>
          <div v-if="hasHistory" class="context-menu-group">
            <button
              class="context-menu-btn"
              type="button"
              @click="emit('history'); emit('close')"
            >
              <span>{{ historyLabel }}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </button>
          </div>
        </div>
      </section>
    </Transition>
  </Teleport>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 70;
  width: 200px;
  padding: 4px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24px) saturate(1.6);
  box-shadow:
    0 8px 32px -8px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06);
}

.context-menu-inner {
  padding: 6px 4px;
}

.context-menu-title {
  padding: 4px 12px 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}

.context-menu-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.context-menu-divider {
  height: 1px;
  margin: 4px 12px;
  background: rgba(0, 0, 0, 0.06);
}

.context-menu-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 7px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 120ms ease;
}

.context-menu-btn:hover {
  background: rgba(99, 102, 241, 0.06);
  color: #4338ca;
}

.context-menu-btn--active {
  background: rgba(99, 102, 241, 0.08);
  color: #4338ca;
  font-weight: 600;
}

.context-menu-check {
  display: flex;
  align-items: center;
  color: #6366f1;
}
</style>
