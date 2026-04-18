<script setup lang="ts">
import { ref } from "vue";

import { useCountdown } from "@/composables/useCountdown";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const countdown = useCountdown();

const newLabel = ref("");
const newDate = ref("");

function handleAdd() {
  if (!newLabel.value.trim() || !newDate.value) return;
  countdown.addItem(newLabel.value.trim(), newDate.value);
  newLabel.value = "";
  newDate.value = "";
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="settings-overlay" @click.self="emit('close')">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-3 scale-95 opacity-0"
          enter-to-class="translate-y-0 scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 scale-100 opacity-100"
          leave-to-class="translate-y-3 scale-95 opacity-0"
          appear
        >
          <section class="settings-panel">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-slate-700">管理倒计时</h3>
              <button
                class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                type="button"
                @click="emit('close')"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <!-- Item list -->
            <div class="mt-3 max-h-[240px] space-y-1 overflow-y-auto">
              <div
                v-for="item in countdown.items.value"
                :key="item.id"
                class="flex items-center gap-2 rounded-lg px-2.5 py-2 transition hover:bg-slate-50"
              >
                <span class="text-[10px] text-slate-400">{{ item.targetDate }}</span>
                <span class="flex-1"></span>
                <span class="truncate text-xs" :class="item.enabled ? 'text-slate-700' : 'text-slate-400'">
                  {{ item.label }}
                </span>
                <!-- Toggle switch -->
                <button
                  class="toggle-switch"
                  :class="{ 'toggle-switch--on': item.enabled }"
                  type="button"
                  @click="countdown.toggleItem(item.id)"
                >
                  <span class="toggle-knob" />
                </button>
                <button
                  v-if="!item.isBuiltIn"
                  class="flex h-5 w-5 items-center justify-center rounded text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                  type="button"
                  @click="countdown.removeItem(item.id)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <!-- Add new -->
            <div class="mt-3 border-t border-slate-100 pt-3">
              <p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">新增倒计时</p>
              <div class="flex gap-2">
                <input
                  v-model="newLabel"
                  class="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                  placeholder="名称"
                />
                <input
                  v-model="newDate"
                  type="date"
                  class="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                />
                <button
                  class="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-600 disabled:opacity-40"
                  type="button"
                  :disabled="!newLabel.trim() || !newDate"
                  @click="handleAdd"
                >添加</button>
              </div>
            </div>
          </section>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(4px);
}

.settings-panel {
  width: 380px;
  max-width: 90vw;
  padding: 20px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px) saturate(1.6);
  box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
}

.toggle-switch {
  position: relative;
  width: 32px;
  height: 18px;
  border-radius: 9px;
  border: none;
  background: #e2e8f0;
  cursor: pointer;
  transition: background 200ms ease;
  flex-shrink: 0;
}

.toggle-switch--on {
  background: #34d399;
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 200ms ease;
}

.toggle-switch--on .toggle-knob {
  transform: translateX(14px);
}
</style>
