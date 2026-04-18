<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from "vue";

import { WIDGET_SIZE_LABELS, type WidgetSize } from "@/types/widget";

const props = defineProps<{
  open: boolean;
  x: number;
  y: number;
  title: string;
  currentSize: WidgetSize;
  sizes: WidgetSize[];
}>();

const emit = defineEmits<{
  close: [];
  resize: [value: WidgetSize];
  openDetail: [];
}>();

const menuStyle = computed(() => {
  const width = 236;
  const itemHeight = 38;
  const height = 84 + props.sizes.length * itemHeight;
  const left = Math.min(props.x, window.innerWidth - width - 12);
  const top = Math.min(props.y, window.innerHeight - height - 12);

  return {
    left: `${Math.max(12, left)}px`,
    top: `${Math.max(12, top)}px`
  };
});

function closeMenu() {
  emit("close");
}

function handlePointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest("[data-widget-context-menu='true']")) {
    return;
  }

  emit("close");
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === "Escape") {
    emit("close");
  }
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
      enter-from-class="translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-1 opacity-0"
    >
      <section
        v-if="open"
        data-widget-context-menu="true"
        class="surface-card fixed z-[70] w-[236px] overflow-hidden p-2.5"
        :style="menuStyle"
        @contextmenu.prevent
      >
        <div class="rounded-[24px] border border-white/80 bg-[linear-gradient(160deg,rgba(255,252,247,0.96),rgba(243,248,246,0.92)_58%,rgba(242,246,251,0.9))] p-2.5">
          <div class="border-b border-white/70 px-3 pb-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Widget Menu</p>
            <p class="mt-1 text-sm font-semibold text-slate-900">{{ title }}</p>
          </div>

          <div class="pt-2">
            <button
              class="flex w-full items-center justify-between rounded-[18px] px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition duration-150 hover:bg-white/70 hover:text-teal-700"
              type="button"
              @click="emit('openDetail'); closeMenu()"
            >
              <span>打开详情</span>
              <span class="text-xs text-slate-400">Enter</span>
            </button>
          </div>

          <div class="mt-2 border-t border-white/70 pt-2">
            <p class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">切换尺寸</p>

            <button
              v-for="size in sizes"
              :key="size"
              class="flex w-full items-center justify-between rounded-[18px] px-3 py-2.5 text-left text-sm font-medium transition duration-150"
              :class="
                size === currentSize
                  ? 'bg-[linear-gradient(135deg,#0f766e,#115e59)] text-white shadow-[0_16px_32px_-22px_rgba(15,118,110,0.62)]'
                  : 'text-slate-700 hover:bg-white/70 hover:text-teal-700'
              "
              type="button"
              @click="emit('resize', size); closeMenu()"
            >
              <span>{{ WIDGET_SIZE_LABELS[size] }}</span>
              <span
                class="text-xs"
                :class="size === currentSize ? 'text-teal-50' : 'text-slate-400'"
              >
                {{ size === currentSize ? "当前" : "切换" }}
              </span>
            </button>
          </div>
        </div>
      </section>
    </Transition>
  </Teleport>
</template>
