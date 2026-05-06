<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

import type { AiChatModelConfig } from "@/types/aiChat";

const props = defineProps<{
  models: AiChatModelConfig[];
  modelValue: string;
  compact?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const buttonEl = ref<HTMLButtonElement | null>(null);
const open = ref(false);
const menuStyle = ref<Record<string, string>>({});

const activeModel = computed(() =>
  props.models.find((model) => model.id === props.modelValue) ?? props.models[0] ?? null
);

function updateMenuPosition() {
  const rect = buttonEl.value?.getBoundingClientRect();
  if (!rect) {
    return;
  }

  const anchorRect = props.compact
    ? buttonEl.value?.closest(".dashboard-widget")?.getBoundingClientRect() ?? rect
    : rect;
  const width = Math.max(rect.width, props.compact ? 220 : 190);
  const menuHeight = Math.min(260, Math.max(48, props.models.length * 40 + 10));
  const left = props.compact
    ? Math.min(Math.max(anchorRect.left + 18, 10), window.innerWidth - width - 10)
    : Math.min(rect.left, window.innerWidth - width - 10);
  const preferredTop = props.compact ? anchorRect.bottom + 8 : rect.bottom + 6;
  const fallbackTop = props.compact ? anchorRect.top - menuHeight - 8 : rect.top - menuHeight - 6;
  const top = preferredTop + menuHeight <= window.innerHeight - 10
    ? preferredTop
    : Math.max(10, fallbackTop);

  menuStyle.value = {
    left: `${Math.max(10, left)}px`,
    top: `${top}px`,
    width: `${width}px`
  };
}

async function toggleMenu() {
  open.value = !open.value;
  if (open.value) {
    await nextTick();
    updateMenuPosition();
  }
}

function selectModel(id: string) {
  emit("update:modelValue", id);
  open.value = false;
}

function closeFromOutside(event: PointerEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest("[data-ai-model-picker='true']")) {
    return;
  }

  open.value = false;
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === "Escape") {
    open.value = false;
  }
}

watch(
  open,
  (value) => {
    if (value) {
      window.addEventListener("pointerdown", closeFromOutside);
      window.addEventListener("keydown", handleEscape);
      window.addEventListener("resize", updateMenuPosition);
      window.addEventListener("scroll", updateMenuPosition, true);
      return;
    }

    window.removeEventListener("pointerdown", closeFromOutside);
    window.removeEventListener("keydown", handleEscape);
    window.removeEventListener("resize", updateMenuPosition);
    window.removeEventListener("scroll", updateMenuPosition, true);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", closeFromOutside);
  window.removeEventListener("keydown", handleEscape);
  window.removeEventListener("resize", updateMenuPosition);
  window.removeEventListener("scroll", updateMenuPosition, true);
});
</script>

<template>
  <div data-ai-model-picker="true" class="ai-model-picker" :class="{ 'ai-model-picker--compact': compact }">
    <button
      ref="buttonEl"
      class="ai-model-picker__button"
      type="button"
      :aria-expanded="open"
      title="选择模型"
      @click.stop="toggleMenu"
    >
      <span class="ai-model-picker__dot"></span>
      <span class="ai-model-picker__label">{{ activeModel?.name || activeModel?.model || "选择模型" }}</span>
      <svg class="ai-model-picker__chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>

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
          data-ai-model-picker="true"
          class="ai-model-picker__menu"
          :style="menuStyle"
        >
          <button
            v-for="model in models"
            :key="model.id"
            class="ai-model-picker__option"
            :class="{ 'ai-model-picker__option--active': model.id === modelValue }"
            type="button"
            @click.stop="selectModel(model.id)"
          >
            <span class="ai-model-picker__option-name">{{ model.name || model.model }}</span>
            <span v-if="model.supportsDeepThinking" class="ai-model-picker__option-thinking" title="支持深度思考">
              thinking
            </span>
          </button>
        </section>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.ai-model-picker {
  min-width: 0;
}

.ai-model-picker__button {
  display: inline-flex;
  max-width: 190px;
  height: 32px;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 11px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.72));
  padding: 0 9px;
  color: #475569;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
  transition: border-color 140ms ease, background 140ms ease, color 140ms ease;
}

.ai-model-picker__button:hover {
  border-color: rgba(20, 184, 166, 0.2);
  background: rgba(255, 255, 255, 0.94);
  color: #0f766e;
}

.ai-model-picker__dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1);
}

.ai-model-picker__label {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 720;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-model-picker__chevron {
  flex: 0 0 auto;
  color: #94a3b8;
}

.ai-model-picker--compact .ai-model-picker__button {
  max-width: min(220px, 48vw);
  height: 20px;
  gap: 5px;
  border-radius: 8px;
  padding: 0 6px;
  background: rgba(255, 255, 255, 0.56);
}

.ai-model-picker--compact .ai-model-picker__label {
  font-size: 10.5px;
  font-weight: 680;
}

.ai-model-picker--compact .ai-model-picker__dot {
  width: 6px;
  height: 6px;
}

.ai-model-picker__menu {
  position: fixed;
  z-index: 120;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(18px) saturate(1.4);
  box-shadow: 0 18px 54px -30px rgba(15, 23, 42, 0.44),
    inset 0 1px 0 rgba(255, 255, 255, 0.86);
  padding: 5px;
}

.ai-model-picker__option {
  display: flex;
  width: 100%;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 10px;
  background: transparent;
  padding: 7px 8px;
  text-align: left;
  transition: background 120ms ease, color 120ms ease;
}

.ai-model-picker__option:hover,
.ai-model-picker__option--active {
  background: rgba(20, 184, 166, 0.09);
}

.ai-model-picker__option-name {
  min-width: 0;
  flex: 1;
  max-width: 100%;
  overflow: hidden;
  color: #0f172a;
  font-size: 12.5px;
  font-weight: 720;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-model-picker__option-thinking {
  display: inline-flex;
  min-width: 48px;
  height: 18px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.13);
  padding: 0 5px;
  color: #0f766e;
  font-size: 8px;
  font-weight: 820;
  letter-spacing: 0.01em;
}
</style>
