<script setup lang="ts">
import { computed, nextTick, ref } from "vue";

import { useTodo } from "@/composables/useTodo";
import type { TodoImportance, TodoItem } from "@/types/todo";
import type { WidgetSize } from "@/types/widget";

import TodoCreateForm from "./TodoCreateForm.vue";

defineProps<{
  size: WidgetSize;
}>();

const todo = useTodo();
const showCompleted = ref(false);
const editingId = ref<string | null>(null);
const editText = ref("");
const editInput = ref<HTMLInputElement | null>(null);
const deleteConfirmId = ref<string | null>(null);

const activeCount = computed(() => todo.activeItems.value.length);
const primaryItem = computed(() => todo.activeItems.value[0] ?? null);
const visibleGroups = computed(() => todo.activeGroups.value.filter((group) => group.todos.length));
const urgentCount = computed(() => todo.activeItems.value.filter((item) => item.importance === "high").length);

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

const draggingId = ref<string | null>(null);
const dragOverId = ref<string | null>(null);
const isDragging = ref(false);

function handleDragStart(event: DragEvent, id: string) {
  event.stopPropagation();
  isDragging.value = true;
  draggingId.value = id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

function handleDragOver(event: DragEvent, id: string) {
  event.preventDefault();
  dragOverId.value = id;
}

function handleDrop(id: string) {
  if (draggingId.value && draggingId.value !== id) {
    todo.reorderTodos(draggingId.value, id);
  }
  resetDrag();
}

function resetDrag() {
  isDragging.value = false;
  draggingId.value = null;
  dragOverId.value = null;
}

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

function importanceToneClass(importance: TodoImportance) {
  return `todo-tone--${importance}`;
}

function itemToneClass(item: TodoItem) {
  return importanceToneClass(item.importance);
}
</script>

<template>
  <div class="todo-widget flex h-full min-h-0 flex-col">
    <!-- 1x1: count only -->
    <template v-if="size === '1x1'">
      <div class="todo-mini h-full">
        <p class="widget-value text-[1.4rem] leading-none">
          {{ todo.isBlurred.value ? "***" : activeCount }}
        </p>
        <p class="mt-1 text-[10px] text-slate-400">项待办</p>
        <p v-if="!todo.isBlurred.value && urgentCount" class="todo-mini__urgent">
          <span class="todo-priority-mark todo-priority-mark--tiny todo-tone--high" />
          {{ urgentCount }}
        </p>
      </div>
    </template>

    <!-- 2x1: count + next task -->
    <template v-else-if="size === '2x1'">
      <div class="relative flex h-full items-center gap-3 overflow-hidden">
        <div class="flex items-baseline gap-1">
          <p class="widget-value text-[1.5rem] leading-none">{{ activeCount }}</p>
          <span class="text-[10px] text-slate-400">待办</span>
        </div>
        <div
          class="todo-blur-wrap min-w-0 flex-1"
          :class="{ 'todo-blur-wrap--blurred': todo.isBlurred.value }"
          @click="todo.isBlurred.value && todo.revealPrivacy()"
        >
          <div v-if="primaryItem" class="todo-preview" :class="itemToneClass(primaryItem)">
            <span class="todo-priority-mark todo-priority-mark--lead" :class="itemToneClass(primaryItem)" :title="todo.getImportanceLabel(primaryItem.importance)" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs text-slate-600">{{ primaryItem.text }}</p>
              <p v-if="todo.formatDueLabel(primaryItem)" class="mt-0.5 truncate text-[9px] text-slate-400">{{ todo.formatDueLabel(primaryItem) }}</p>
            </div>
          </div>
          <p v-else class="text-xs text-slate-400">暂无待办</p>
        </div>
      </div>
    </template>

    <!-- 2x2: compact create + top groups -->
    <template v-else-if="size === '2x2'">
      <div class="flex items-center justify-between">
        <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">待办</p>
        <span class="text-[10px] text-slate-400">{{ activeCount }} 项</span>
      </div>
      <div class="relative mt-1.5 flex-1 overflow-hidden">
        <div
          class="todo-blur-wrap flex h-full flex-col gap-1.5"
          :class="{ 'todo-blur-wrap--blurred': todo.isBlurred.value }"
          @click="todo.isBlurred.value && todo.revealPrivacy()"
        >
          <TodoCreateForm compact />

          <div v-if="visibleGroups.length" class="todo-groups todo-groups--compact">
            <section v-for="group in visibleGroups.slice(0, 3)" :key="group.key" class="todo-group todo-group--compact">
              <div class="todo-group__title">
                <span>{{ group.label }}</span>
                <span>{{ group.todos.length }}</span>
              </div>
              <div
                v-for="item in group.todos.slice(0, 2)"
                :key="item.id"
                class="todo-row todo-row--compact"
                :class="itemToneClass(item)"
              >
                <button class="todo-check" type="button" @click="todo.toggleTodo(item.id)" aria-label="完成待办">
                  <svg class="todo-check__icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.5"/></svg>
                </button>
                <span class="todo-priority-mark todo-priority-mark--tiny" :class="itemToneClass(item)" :title="todo.getImportanceLabel(item.importance)" />
                <span class="todo-row__text" @dblclick="startEditing(item.id, item.text)">
                  <template v-if="editingId === item.id">
                    <input
                      ref="editInput"
                      v-model="editText"
                      class="todo-edit-input"
                      @blur="finishEditing"
                      @keydown.enter="finishEditing"
                    />
                  </template>
                  <template v-else>{{ item.text }}</template>
                </span>
              </div>
            </section>
          </div>
          <p v-else class="todo-empty">暂无待办</p>
        </div>
      </div>
    </template>

    <!-- 4x2: wider grouped list -->
    <template v-else-if="size === '4x2'">
      <div class="flex items-center justify-between">
        <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">待办</p>
        <span class="text-[10px] text-slate-400">{{ activeCount }} 项待办</span>
      </div>
      <div class="relative mt-2 flex-1 overflow-hidden">
        <div
          class="todo-blur-wrap flex h-full gap-3"
          :class="{ 'todo-blur-wrap--blurred': todo.isBlurred.value }"
          @click="todo.isBlurred.value && todo.revealPrivacy()"
        >
          <div class="flex min-w-0 flex-1 flex-col gap-2 overflow-y-auto">
            <TodoCreateForm />

            <div v-if="visibleGroups.length" class="todo-groups">
              <section v-for="group in visibleGroups" :key="group.key" class="todo-group">
                <div class="todo-group__title">
                  <span>{{ group.label }}</span>
                  <span>{{ group.todos.length }}</span>
                </div>
                <div
                  v-for="item in group.todos"
                  :key="item.id"
                  class="todo-row todo-row--dense group"
                  :class="[
                    itemToneClass(item),
                    {
                      'opacity-40': isDragging && draggingId === item.id,
                      'ring-1 ring-indigo-300': isDragging && dragOverId === item.id && draggingId !== item.id
                    }
                  ]"
                  draggable="true"
                  @dragstart="handleDragStart($event, item.id)"
                  @dragover="handleDragOver($event, item.id)"
                  @drop="handleDrop(item.id)"
                  @dragend="resetDrag"
                >
                  <button class="todo-check" type="button" @click="todo.toggleTodo(item.id)" aria-label="完成待办">
                    <svg class="todo-check__icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.5"/></svg>
                  </button>
                  <div class="todo-row__body" @dblclick="startEditing(item.id, item.text)">
                    <template v-if="editingId === item.id">
                      <input
                        ref="editInput"
                        v-model="editText"
                        class="todo-edit-input"
                        @blur="finishEditing"
                        @keydown.enter="finishEditing"
                      />
                    </template>
                    <template v-else>
                      <p class="todo-row__text">{{ item.text }}</p>
                      <p v-if="todo.formatDueLabel(item)" class="todo-row__meta">{{ todo.formatDueLabel(item) }}</p>
                    </template>
                  </div>
                  <button
                    class="todo-delete-btn"
                    :class="{ 'todo-delete-btn--confirm': deleteConfirmId === item.id }"
                    type="button"
                    :aria-label="deleteConfirmId === item.id ? '确认删除待办' : '删除待办'"
                    @pointerdown.stop
                    @click.stop="handleDeleteClick(item.id)"
                    @mouseleave="resetDeleteConfirm(item.id)"
                  >
                    <span v-if="deleteConfirmId === item.id" class="todo-delete-btn__confirm">确定</span>
                    <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </section>
            </div>
            <p v-else class="todo-empty">暂无待办</p>
          </div>

          <div v-if="todo.todayCompleted.value.length" class="todo-completed-side">
            <p class="mb-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">已完成 {{ todo.todayCompleted.value.length }}</p>
            <div class="flex flex-col gap-0.5">
              <div
                v-for="item in todo.todayCompleted.value"
                :key="item.id"
                class="todo-completed-row flex items-center gap-1.5 px-1.5 py-0.5"
              >
                <button class="todo-check todo-check--done" type="button" @click="todo.toggleTodo(item.id)" aria-label="恢复待办">
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

    <!-- 4x4: full grouped view -->
    <template v-else>
      <div class="flex items-center justify-between">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">待办</p>
        <span class="text-[10px] text-slate-400">{{ activeCount }} 项进行中 · {{ todo.todayCompleted.value.length }} 已完成</span>
      </div>

      <div class="relative mt-2 flex-1 overflow-hidden">
        <div
          class="todo-blur-wrap flex h-full flex-col gap-2 overflow-y-auto"
          :class="{ 'todo-blur-wrap--blurred': todo.isBlurred.value }"
          @click="todo.isBlurred.value && todo.revealPrivacy()"
        >
          <TodoCreateForm />

          <div v-if="visibleGroups.length" class="todo-groups">
            <section v-for="group in visibleGroups" :key="group.key" class="todo-group">
              <div class="todo-group__title">
                <span>{{ group.label }}</span>
                <span>{{ group.todos.length }}</span>
              </div>
              <div
                v-for="item in group.todos"
                :key="item.id"
                class="todo-row todo-row--dense group"
                :class="[
                  itemToneClass(item),
                  {
                    'opacity-40': isDragging && draggingId === item.id,
                    'ring-1 ring-indigo-300': isDragging && dragOverId === item.id && draggingId !== item.id
                  }
                ]"
                draggable="true"
                @dragstart="handleDragStart($event, item.id)"
                @dragover="handleDragOver($event, item.id)"
                @drop="handleDrop(item.id)"
                @dragend="resetDrag"
              >
                <button class="todo-check" type="button" @click="todo.toggleTodo(item.id)" aria-label="完成待办">
                  <svg class="todo-check__icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.5"/></svg>
                </button>
                <div class="todo-row__body" @dblclick="startEditing(item.id, item.text)">
                  <template v-if="editingId === item.id">
                    <input
                      ref="editInput"
                      v-model="editText"
                      class="todo-edit-input"
                      @blur="finishEditing"
                      @keydown.enter="finishEditing"
                    />
                  </template>
                  <template v-else>
                    <p class="todo-row__text">{{ item.text }}</p>
                    <p v-if="todo.formatDueLabel(item)" class="todo-row__meta">{{ todo.formatDueLabel(item) }}</p>
                  </template>
                </div>
                <button
                  class="todo-delete-btn opacity-0 group-hover:opacity-100"
                  :class="{ 'todo-delete-btn--confirm': deleteConfirmId === item.id }"
                  type="button"
                  :aria-label="deleteConfirmId === item.id ? '确认删除待办' : '删除待办'"
                  @pointerdown.stop
                  @click.stop="handleDeleteClick(item.id)"
                  @mouseleave="resetDeleteConfirm(item.id)"
                >
                  <span v-if="deleteConfirmId === item.id" class="todo-delete-btn__confirm">确定</span>
                  <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </section>
          </div>
          <p v-else class="todo-empty">暂无待办</p>

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
                class="todo-completed-row flex items-center gap-2 px-2.5 py-1.5"
              >
                <button class="todo-check todo-check--done" type="button" @click="todo.toggleTodo(item.id)" aria-label="恢复待办">
                  <svg class="todo-check__icon" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M6.5 10.5L9 13L14 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <span class="flex-1 truncate text-xs text-slate-400 line-through">{{ item.text }}</span>
                <button
                  class="todo-delete-btn"
                  :class="{ 'todo-delete-btn--confirm': deleteConfirmId === item.id }"
                  type="button"
                  :aria-label="deleteConfirmId === item.id ? '确认删除待办' : '删除待办'"
                  @pointerdown.stop
                  @click.stop="handleDeleteClick(item.id)"
                  @mouseleave="resetDeleteConfirm(item.id)"
                >
                  <span v-if="deleteConfirmId === item.id" class="todo-delete-btn__confirm">确定</span>
                  <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
.todo-widget {
  min-width: 0;
}

.todo-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.todo-mini__urgent {
  margin-top: 5px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  background: rgba(244, 63, 94, 0.08);
  padding: 2px 7px;
  color: #be123c;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
}

.todo-blur-wrap {
  transition: filter 300ms ease;
}

.todo-blur-wrap--blurred {
  filter: blur(8px);
  user-select: none;
  pointer-events: auto;
  cursor: pointer;
}

.todo-groups {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
}

.todo-groups--compact {
  flex: 1;
  min-height: 0;
  gap: 5px;
  overflow-y: auto;
  padding-right: 2px;
}

.todo-group {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.todo-group--compact {
  gap: 3px;
}

.todo-group__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 0;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
}

.todo-row {
  --todo-accent: #38bdf8;
  --todo-accent-soft: rgba(14, 165, 233, 0.11);
  --todo-accent-line: rgba(14, 165, 233, 0.32);
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  border-left: 3px solid var(--todo-accent-line);
  border-radius: 5px;
  background: linear-gradient(90deg, var(--todo-accent-soft), rgba(255, 255, 255, 0.42));
  padding: 7px 8px;
  cursor: grab;
  user-select: none;
  transition: all 200ms ease;
}

.todo-row:hover {
  background: linear-gradient(90deg, var(--todo-accent-soft), rgba(255, 255, 255, 0.64));
}

.todo-row:active {
  cursor: grabbing;
}

.todo-row--compact {
  gap: 5px;
  padding: 4px 6px;
  border-radius: 4px;
}

.todo-row--dense {
  gap: 6px;
  border-radius: 4px;
  padding: 5px 7px;
}

.todo-row--dense .todo-check {
  width: 13px;
  height: 13px;
}

.todo-row--dense .todo-delete-btn {
  width: 16px;
  height: 16px;
}

.todo-row__body {
  min-width: 0;
  flex: 1;
}

.todo-row__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
}

.todo-row__body .todo-row__text {
  font-size: 12px;
}

.todo-row--dense .todo-row__text,
.todo-row--dense .todo-row__body .todo-row__text {
  font-size: 11px;
  line-height: 1.15;
}

.todo-row__meta {
  margin-top: 2px;
  overflow: hidden;
  color: #94a3b8;
  font-size: 9px;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-row--dense .todo-row__meta {
  margin-top: 1px;
  font-size: 8px;
}

.todo-preview {
  --todo-accent: #38bdf8;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}

.todo-priority-mark {
  --todo-accent: #38bdf8;
  --todo-accent-soft: rgba(14, 165, 233, 0.12);
  display: inline-flex;
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--todo-accent);
  box-shadow: 0 0 0 4px var(--todo-accent-soft);
}

.todo-priority-mark--tiny {
  width: 8px;
  height: 8px;
  box-shadow: 0 0 0 3px var(--todo-accent-soft);
}

.todo-priority-mark--lead {
  width: 11px;
  height: 11px;
  box-shadow: 0 0 0 5px var(--todo-accent-soft);
}

.todo-tone--low {
  --todo-accent: #0ea5e9;
  --todo-accent-soft: rgba(14, 165, 233, 0.11);
  --todo-accent-line: rgba(14, 165, 233, 0.3);
}

.todo-tone--medium {
  --todo-accent: #d97706;
  --todo-accent-soft: rgba(245, 158, 11, 0.13);
  --todo-accent-line: rgba(245, 158, 11, 0.36);
}

.todo-tone--high {
  --todo-accent: #e11d48;
  --todo-accent-soft: rgba(244, 63, 94, 0.13);
  --todo-accent-line: rgba(244, 63, 94, 0.4);
}

.todo-edit-input {
  width: 100%;
  border: none;
  background: transparent;
  color: #334155;
  font-size: 11px;
  outline: none;
}

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

.todo-delete-btn {
  display: flex;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
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

.todo-delete-btn:hover {
  background: rgba(244, 63, 94, 0.08);
  color: #e11d48;
}

.todo-delete-btn--confirm {
  width: 34px;
  background: rgba(244, 63, 94, 0.12);
  color: #e11d48;
}

.todo-row--dense .todo-delete-btn--confirm {
  width: 34px;
}

.todo-delete-btn__confirm {
  display: block;
  white-space: nowrap;
}

.todo-completed-side {
  width: 140px;
  flex-shrink: 0;
  overflow-y: auto;
}

.todo-completed-row {
  border-radius: 4px;
}

.todo-empty {
  padding: 10px 0;
  text-align: center;
  color: #94a3b8;
  font-size: 11px;
}
</style>
