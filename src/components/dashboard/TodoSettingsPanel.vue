<script setup lang="ts">
import { useTodo } from "@/composables/useTodo";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const todo = useTodo();
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
              <h3 class="text-sm font-semibold text-slate-700">隐私设置</h3>
              <button
                class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                type="button"
                @click="emit('close')"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div class="mt-4">
              <div class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p class="text-xs font-medium text-slate-700">隐私模式</p>
                  <p class="mt-0.5 text-[10px] text-slate-400">开启后待办内容模糊显示，点击后可查看</p>
                </div>
                <button
                  class="toggle-switch"
                  :class="{ 'toggle-switch--on': todo.privacyModeEnabled.value }"
                  type="button"
                  @click="todo.setPrivacyMode(!todo.privacyModeEnabled.value)"
                >
                  <span class="toggle-knob" />
                </button>
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
  width: 340px;
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
  width: 36px;
  height: 20px;
  border-radius: 10px;
  border: none;
  background: #e2e8f0;
  cursor: pointer;
  transition: background 200ms ease;
  flex-shrink: 0;
}

.toggle-switch--on {
  background: #6366f1;
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 200ms ease;
}

.toggle-switch--on .toggle-knob {
  transform: translateX(16px);
}
</style>
