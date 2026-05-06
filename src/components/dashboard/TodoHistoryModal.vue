<script setup lang="ts">
import { ref } from "vue";

import { useTodo } from "@/composables/useTodo";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const todo = useTodo();
const deleteConfirmId = ref<string | null>(null);

function handleDeleteClick(id: string) {
  if (deleteConfirmId.value === id) {
    todo.deleteTodo(id);
    deleteConfirmId.value = null;
    return;
  }

  deleteConfirmId.value = id;
}

function resetDeleteConfirm(id: string) {
  if (deleteConfirmId.value === id) {
    deleteConfirmId.value = null;
  }
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
              <h3 class="text-sm font-semibold text-slate-700">历史待办</h3>
              <button
                class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                type="button"
                @click="emit('close')"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div class="mt-3 max-h-[400px] overflow-y-auto">
              <div v-if="!todo.historicalItems.value.length" class="py-8 text-center text-xs text-slate-400">
                暂无历史待办
              </div>
              <div v-for="group in todo.historicalItems.value" :key="group.date" class="mb-4">
                <p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{{ group.date }}</p>
                <div class="space-y-1">
                  <div
                    v-for="item in group.todos"
                    :key="item.id"
                    class="history-row flex items-center gap-2 px-2.5 py-1.5 transition hover:bg-slate-50"
                  >
                    <span
                      class="h-3.5 w-3.5 flex-shrink-0 rounded-full border-2"
                      :class="item.completed ? 'border-emerald-400 bg-emerald-400' : 'border-slate-300'"
                    />
                    <span
                      class="flex-1 text-xs"
                      :class="item.completed ? 'text-slate-300 line-through' : 'text-slate-600'"
                    >{{ item.text }}</span>
                    <button
                      class="history-delete-btn"
                      :class="{ 'history-delete-btn--confirm': deleteConfirmId === item.id }"
                      type="button"
                      :aria-label="deleteConfirmId === item.id ? '确认删除待办' : '删除待办'"
                      @click.stop="handleDeleteClick(item.id)"
                      @mouseleave="resetDeleteConfirm(item.id)"
                    >
                      <span v-if="deleteConfirmId === item.id">确定</span>
                      <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
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
  width: 400px;
  max-width: 90vw;
  padding: 20px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px) saturate(1.6);
  box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
}

.history-delete-btn {
  display: flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #cbd5e1;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  transition: all 160ms ease;
}

.history-row {
  border-radius: 4px;
}

.history-delete-btn:hover,
.history-delete-btn--confirm {
  background: rgba(244, 63, 94, 0.1);
  color: #e11d48;
}

.history-delete-btn--confirm {
  width: 34px;
}
</style>
