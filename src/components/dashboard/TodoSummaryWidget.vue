<script setup lang="ts">
import { ref, nextTick } from "vue";

import { useTodo } from "@/composables/useTodo";
import type { WidgetSize } from "@/types/widget";

defineProps<{
  size: WidgetSize;
}>();

const todo = useTodo();
const newText = ref("");
const showCompleted = ref(false);
const editingId = ref<string | null>(null);
const editText = ref("");
const editInput = ref<HTMLInputElement | null>(null);

function handleAddBlur() {
  if (newText.value.trim()) {
    todo.addTodo(newText.value);
    newText.value = "";
  }
}

async function startEditing(id: string, text: string) {
  editingId.value = id;
  editText.value = text;
  await nextTick();
  editInput.value?.focus();
}

function finishEditing() {
  if (editingId.value && editText.value.trim()) {
    todo.editTodo(editingId.value, editText.value);
  }
  editingId.value = null;
  editText.value = "";
}

// Drag state
const dragFrom = ref(-1);
const dragOver = ref(-1);
const isDragging = ref(false);

function handleDragStart(event: DragEvent, index: number) {
  event.stopPropagation();
  isDragging.value = true;
  dragFrom.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

function handleDragOver(event: DragEvent, index: number) {
  event.preventDefault();
  dragOver.value = index;
}

function handleDrop(index: number) {
  if (dragFrom.value !== index) {
    todo.reorderTodos(dragFrom.value, index);
  }
  resetDrag();
}

function resetDrag() {
  isDragging.value = false;
  dragFrom.value = -1;
  dragOver.value = -1;
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- 1x1: count only -->
    <template v-if="size === '1x1'">
      <div class="flex h-full flex-col items-center justify-center text-center">
        <p class="widget-value text-[1.4rem] leading-none">
          {{ todo.isBlurred.value ? "***" : todo.todayActive.value.length }}
        </p>
        <p class="mt-1 text-[10px] text-slate-400">项待办</p>
      </div>
    </template>

    <!-- 2x1: count + preview -->
    <template v-else-if="size === '2x1'">
      <div class="relative flex h-full items-center gap-3 overflow-hidden">
        <div class="flex items-baseline gap-1">
          <p class="widget-value text-[1.5rem] leading-none">{{ todo.todayActive.value.length }}</p>
          <span class="text-[10px] text-slate-400">待办</span>
        </div>
        <div class="todo-blur-wrap min-w-0 flex-1" :class="{ 'todo-blur-wrap--blurred': todo.isBlurred.value }" @click="todo.isBlurred.value && todo.revealPrivacy()">
          <p v-if="todo.todayActive.value.length" class="truncate text-xs text-slate-500">
            {{ todo.todayActive.value[0].text }}
          </p>
          <p v-else class="text-xs text-slate-400">暂无待办</p>
        </div>
      </div>
    </template>

    <!-- 2x2: list + add -->
    <template v-else-if="size === '2x2'">
      <div class="flex items-center justify-between">
        <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">待办</p>
      </div>
      <div class="relative mt-1.5 flex-1 overflow-hidden">
        <div class="todo-blur-wrap h-full" :class="{ 'todo-blur-wrap--blurred': todo.isBlurred.value }" @click="todo.isBlurred.value && todo.revealPrivacy()">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 rounded-lg px-2 py-1">
              <input
                v-model="newText"
                class="flex-1 bg-transparent text-[11px] text-slate-500 outline-none placeholder:text-slate-400"
                placeholder="+ 新建待办..."
                @blur="handleAddBlur"
                @keydown.enter="($event.target as HTMLInputElement).blur()"
              />
            </div>
            <div
              v-for="item in todo.todayActive.value.slice(0, 4)"
              :key="item.id"
              class="flex items-center gap-2 rounded-lg bg-white/35 px-2 py-1"
            >
              <button class="todo-check" type="button" @click="todo.toggleTodo(item.id)">
                <svg class="todo-check__icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.5"/></svg>
              </button>
              <span class="flex-1 truncate text-[11px] text-slate-600" @dblclick="startEditing(item.id, item.text)">
                <template v-if="editingId === item.id">
                  <input
                    ref="editInput"
                    v-model="editText"
                    class="w-full bg-transparent text-[11px] text-slate-700 outline-none"
                    @blur="finishEditing"
                    @keydown.enter="finishEditing"
                  />
                </template>
                <template v-else>{{ item.text }}</template>
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 4x2: wider list -->
    <template v-else-if="size === '4x2'">
      <div class="flex items-center justify-between">
        <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">待办</p>
        <span class="text-[10px] text-slate-400">{{ todo.todayActive.value.length }} 项待办</span>
      </div>
      <div class="relative mt-2 flex-1 overflow-hidden">
        <div class="todo-blur-wrap flex h-full gap-3" :class="{ 'todo-blur-wrap--blurred': todo.isBlurred.value }" @click="todo.isBlurred.value && todo.revealPrivacy()">
          <div class="flex flex-1 flex-col gap-1 overflow-y-auto">
            <div class="flex items-center gap-2 rounded-lg px-2.5 py-1.5">
              <input
                v-model="newText"
                class="flex-1 bg-transparent text-[11px] text-slate-500 outline-none placeholder:text-slate-400"
                placeholder="+ 新建待办..."
                @blur="handleAddBlur"
                @keydown.enter="($event.target as HTMLInputElement).blur()"
              />
            </div>
            <div
              v-for="(item, index) in todo.todayActive.value"
              :key="item.id"
              class="flex items-center gap-2 rounded-lg bg-white/35 px-2.5 py-1.5"
              :class="{
                'opacity-40': isDragging && dragFrom === index,
                'ring-1 ring-indigo-300': isDragging && dragOver === index && dragFrom !== index
              }"
              draggable="true"
              @dragstart="handleDragStart($event, index)"
              @dragover="handleDragOver($event, index)"
              @drop="handleDrop(index)"
              @dragend="resetDrag"
            >
              <button class="todo-check" type="button" @click="todo.toggleTodo(item.id)">
                <svg class="todo-check__icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.5"/></svg>
              </button>
              <span class="flex-1 truncate text-[11px] text-slate-600" @dblclick="startEditing(item.id, item.text)">
                <template v-if="editingId === item.id">
                  <input
                    ref="editInput"
                    v-model="editText"
                    class="w-full bg-transparent text-[11px] text-slate-700 outline-none"
                    @blur="finishEditing"
                    @keydown.enter="finishEditing"
                  />
                </template>
                <template v-else>{{ item.text }}</template>
              </span>
              <button
                class="flex h-4 w-4 items-center justify-center rounded text-slate-300 transition hover:text-rose-500"
                type="button"
                @click="todo.deleteTodo(item.id)"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <div v-if="todo.todayCompleted.value.length" class="w-[140px] flex-shrink-0 overflow-y-auto">
            <p class="mb-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">已完成 {{ todo.todayCompleted.value.length }}</p>
            <div class="flex flex-col gap-0.5">
              <div
                v-for="item in todo.todayCompleted.value"
                :key="item.id"
                class="flex items-center gap-1.5 rounded px-1.5 py-0.5"
              >
                <button class="todo-check todo-check--done" type="button" @click="todo.toggleTodo(item.id)">
                  <svg class="todo-check__icon" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M6.5 10.5L9 13L14 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <span class="flex-1 truncate text-[10px] text-slate-400 line-through">{{ item.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 4x4: full view -->
    <template v-else>
      <div class="flex items-center justify-between">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">今日待办</p>
        <span class="text-[10px] text-slate-400">{{ todo.todayActive.value.length }} 项进行中 · {{ todo.todayCompleted.value.length }} 已完成</span>
      </div>

      <div class="relative mt-2 flex-1 overflow-hidden">
        <div class="todo-blur-wrap flex h-full flex-col gap-2 overflow-y-auto" :class="{ 'todo-blur-wrap--blurred': todo.isBlurred.value }" @click="todo.isBlurred.value && todo.revealPrivacy()">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 rounded-[10px] px-2.5 py-1.5">
              <input
                v-model="newText"
                class="flex-1 bg-transparent text-xs text-slate-500 outline-none placeholder:text-slate-400"
                placeholder="+ 新建待办..."
                @blur="handleAddBlur"
                @keydown.enter="($event.target as HTMLInputElement).blur()"
              />
            </div>
            <div
              v-for="(item, index) in todo.todayActive.value"
              :key="item.id"
              class="todo-item group"
              :class="{
                'opacity-40': isDragging && dragFrom === index,
                'ring-1 ring-indigo-300': isDragging && dragOver === index && dragFrom !== index
              }"
              draggable="true"
              @dragstart="handleDragStart($event, index)"
              @dragover="handleDragOver($event, index)"
              @drop="handleDrop(index)"
              @dragend="resetDrag"
            >
              <button class="todo-check" type="button" @click="todo.toggleTodo(item.id)">
                <svg class="todo-check__icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.5"/></svg>
              </button>
              <span class="flex-1 text-xs text-slate-600" @dblclick="startEditing(item.id, item.text)">
                <template v-if="editingId === item.id">
                  <input
                    ref="editInput"
                    v-model="editText"
                    class="w-full bg-transparent text-xs text-slate-700 outline-none"
                    @blur="finishEditing"
                    @keydown.enter="finishEditing"
                  />
                </template>
                <template v-else>{{ item.text }}</template>
              </span>
              <button
                class="flex h-4 w-4 items-center justify-center rounded text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-rose-500"
                type="button"
                @click="todo.deleteTodo(item.id)"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <div v-if="todo.todayCompleted.value.length">
            <button
              class="flex w-full items-center gap-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 transition hover:text-slate-500"
              type="button"
              @click="showCompleted = !showCompleted"
            >
              <svg
                width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                class="transition-transform" :class="{ 'rotate-90': showCompleted }"
              ><polyline points="9 18 15 12 9 6"/></svg>
              已完成 ({{ todo.todayCompleted.value.length }})
            </button>
            <div v-if="showCompleted" class="mt-0.5 flex flex-col gap-0.5">
              <div
                v-for="item in todo.todayCompleted.value"
                :key="item.id"
                class="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
              >
                <button class="todo-check todo-check--done" type="button" @click="todo.toggleTodo(item.id)">
                  <svg class="todo-check__icon" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M6.5 10.5L9 13L14 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <span class="flex-1 truncate text-xs text-slate-400 line-through">{{ item.text }}</span>
                <button
                  class="flex h-4 w-4 items-center justify-center rounded text-slate-300 transition hover:text-rose-400"
                  type="button"
                  @click="todo.deleteTodo(item.id)"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.todo-blur-wrap {
  transition: filter 300ms ease;
}

.todo-blur-wrap--blurred {
  filter: blur(8px);
  user-select: none;
  pointer-events: auto;
  cursor: pointer;
}

/* ── Custom check icon ── */
.todo-check {
  position: relative;
  width: 14px;
  height: 14px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  color: #c4c1d4;
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.todo-check:hover {
  color: #6366f1;
  transform: scale(1.15);
}

.todo-check__icon {
  width: 100%;
  height: 100%;
}

.todo-check--done {
  color: #34d399;
}

.todo-check--done:hover {
  color: #10b981;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.4);
  cursor: grab;
  user-select: none;
  transition: all 200ms ease;
}

.todo-item:hover {
  background: rgba(255, 255, 255, 0.6);
}

.todo-item:active {
  cursor: grabbing;
}
</style>
