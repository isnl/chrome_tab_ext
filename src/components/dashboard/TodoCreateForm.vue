<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from "vue";

import { useTodo } from "@/composables/useTodo";
import type { TodoImportance } from "@/types/todo";

const props = withDefaults(defineProps<{
  compact?: boolean;
}>(), {
  compact: false
});

const todo = useTodo();

const quickDateOptions = [
  { label: "今天", offset: 0 },
  { label: "明天", offset: 1 },
  { label: "3天", offset: 3 },
  { label: "7天", offset: 7 }
];

const quickTimeOptions = [
  { label: "09:00", hint: "上午", value: "09:00" },
  { label: "12:00", hint: "中午", value: "12:00" },
  { label: "18:00", hint: "傍晚", value: "18:00" },
  { label: "21:00", hint: "晚上", value: "21:00" }
];

const hourOptions = Array.from({ length: 24 }, (_, index) => pad2(index));
const minuteOptions = Array.from({ length: 12 }, (_, index) => pad2(index * 5));

const importanceOptions: Array<{
  value: TodoImportance;
  title: string;
  description: string;
}> = [
  { value: "low", title: "普通", description: "顺手处理" },
  { value: "medium", title: "留意", description: "需要关注" },
  { value: "high", title: "重要", description: "优先完成" }
];

const composeRef = ref<HTMLElement | null>(null);
const popoverRef = ref<HTMLElement | null>(null);
const infoButtonRef = ref<HTMLButtonElement | null>(null);
const textInputRef = ref<HTMLInputElement | null>(null);

const text = ref("");
const dueDate = ref("");
const dueTime = ref("");
const importance = ref<TodoImportance>("low");
const detailsOpen = ref(false);
const timePanelOpen = ref(false);
const popoverStyle = ref<CSSProperties>({});
const datePickerMonth = ref(startOfMonth(new Date()));

let blurTimer: number | null = null;
let lastInsidePointerAt = 0;

const datePickerLabel = computed(() => formatDateLabel(dueDate.value));
const timePickerLabel = computed(() => dueTime.value || "不提醒时间");
const hasDetails = computed(() => Boolean(dueDate.value || dueTime.value || importance.value !== "low"));
const detailsSummary = computed(() => {
  const parts = [
    dueDate.value ? datePickerLabel.value : null,
    dueTime.value ? dueTime.value : null
  ].filter(Boolean);

  if (parts.length) return parts.join(" · ");
  return hasDetails.value ? "已设详情" : "详情";
});
const calendarWeekdays = ["一", "二", "三", "四", "五", "六", "日"];
const calendarMonthLabel = computed(() => `${datePickerMonth.value.getFullYear()}年${datePickerMonth.value.getMonth() + 1}月`);
const calendarDays = computed(() => {
  const monthStart = datePickerMonth.value;
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);
  const todayValue = toDateInputValue(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const value = toDateInputValue(date);

    return {
      date,
      value,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isSelected: dueDate.value === value,
      isToday: todayValue === value,
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    };
  });
});

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDateInputValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return date;
}

function parseTimeInputValue(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;

  return { hour: match[1], minute: match[2] };
}

function currentTimeParts() {
  return parseTimeInputValue(dueTime.value) ?? { hour: "09", minute: "00" };
}

function formatDateLabel(value: string) {
  if (!value) return "选择日期";

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((dateStart - todayStart) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "明天";
  if (diffDays === -1) return "昨天";
  return date.getFullYear() === today.getFullYear() ? `${month}月${day}日` : `${year}年${month}月${day}日`;
}

function isInsideCreateForm(target: EventTarget | null) {
  const node = target as Node | null;
  if (!node) return false;
  return Boolean(composeRef.value?.contains(node) || popoverRef.value?.contains(node));
}

function clearBlurTimer() {
  if (blurTimer != null) {
    window.clearTimeout(blurTimer);
    blurTimer = null;
  }
}

function resetDraft() {
  text.value = "";
  dueDate.value = "";
  dueTime.value = "";
  importance.value = "low";
  detailsOpen.value = false;
  timePanelOpen.value = false;
}

function commitDraft() {
  const trimmedText = text.value.trim();
  if (!trimmedText) {
    resetDraft();
    return;
  }

  todo.addTodo(trimmedText, {
    dueDate: dueDate.value || undefined,
    dueTime: dueDate.value ? dueTime.value || undefined : undefined,
    importance: importance.value
  });

  resetDraft();
}

function scheduleCommitCheck() {
  clearBlurTimer();
  blurTimer = window.setTimeout(() => {
    if (Date.now() - lastInsidePointerAt < 180) {
      return;
    }

    if (!isInsideCreateForm(document.activeElement)) {
      commitDraft();
    }
  }, 0);
}

function markInsidePointer() {
  lastInsidePointerAt = Date.now();
  clearBlurTimer();
}

function syncCalendarToDueDate() {
  datePickerMonth.value = startOfMonth(parseDateInputValue(dueDate.value) ?? new Date());
}

function setQuickDue(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  dueDate.value = toDateInputValue(date);
  datePickerMonth.value = startOfMonth(date);
}

function isQuickDueActive(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return dueDate.value === toDateInputValue(date);
}

function clearDue() {
  dueDate.value = "";
  dueTime.value = "";
  timePanelOpen.value = false;
}

function shiftCalendarMonth(offset: number) {
  const source = datePickerMonth.value;
  datePickerMonth.value = new Date(source.getFullYear(), source.getMonth() + offset, 1);
}

function selectCalendarDate(value: string) {
  const date = parseDateInputValue(value);
  if (!date) return;

  dueDate.value = value;
  datePickerMonth.value = startOfMonth(date);
}

function selectToday() {
  const today = new Date();
  dueDate.value = toDateInputValue(today);
  datePickerMonth.value = startOfMonth(today);
}

function setDueTime(hour: string, minute: string) {
  if (!dueDate.value) return;
  dueTime.value = `${hour}:${minute}`;
  timePanelOpen.value = true;
}

function setQuickTime(value: string) {
  const parts = parseTimeInputValue(value);
  if (!parts) return;
  setDueTime(parts.hour, parts.minute);
}

function setTimeHour(hour: string) {
  setDueTime(hour, currentTimeParts().minute);
}

function setTimeMinute(minute: string) {
  setDueTime(currentTimeParts().hour, minute);
}

function isTimeHourSelected(hour: string) {
  return parseTimeInputValue(dueTime.value)?.hour === hour;
}

function isTimeMinuteSelected(minute: string) {
  return parseTimeInputValue(dueTime.value)?.minute === minute;
}

function clearTime() {
  dueTime.value = "";
}

function updatePopoverPosition() {
  if (!detailsOpen.value || !infoButtonRef.value) return;

  const anchorRect = infoButtonRef.value.getBoundingClientRect();
  const width = props.compact ? 278 : 316;
  const popoverHeight = popoverRef.value?.offsetHeight ?? 398;
  const gutter = 12;
  const idealLeft = anchorRect.right + 12;
  const maxLeft = window.innerWidth - width - gutter;
  const left = Math.min(Math.max(idealLeft, gutter), Math.max(gutter, maxLeft));
  const top = Math.min(
    Math.max(anchorRect.top + anchorRect.height / 2 - popoverHeight / 2, gutter),
    window.innerHeight - popoverHeight - gutter
  );

  const arrowTop = Math.min(
    Math.max(anchorRect.top + anchorRect.height / 2 - top, 20),
    Math.max(20, popoverHeight - 20)
  );

  popoverStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    "--todo-popover-arrow-top": `${arrowTop}px`
  } as CSSProperties;
}

async function openDetails() {
  detailsOpen.value = true;
  syncCalendarToDueDate();
  timePanelOpen.value = Boolean(dueTime.value);
  await nextTick();
  updatePopoverPosition();
}

function toggleDetails() {
  if (detailsOpen.value) {
    detailsOpen.value = false;
    return;
  }

  void openDetails();
}

function openTimePicker() {
  if (!dueDate.value) return;
  timePanelOpen.value = true;
  void nextTick(updatePopoverPosition);
}

function handleWindowChange() {
  if (detailsOpen.value) {
    updatePopoverPosition();
  }
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!detailsOpen.value || isInsideCreateForm(event.target)) return;
  commitDraft();
}

watch(detailsOpen, (isOpen) => {
  if (!isOpen) return;
  void nextTick(updatePopoverPosition);
});

watch(dueDate, (value) => {
  if (!value) {
    dueTime.value = "";
    timePanelOpen.value = false;
  }
});

onMounted(() => {
  window.addEventListener("resize", handleWindowChange);
  window.addEventListener("scroll", handleWindowChange, true);
  window.addEventListener("pointerdown", handleDocumentPointerDown, true);
});

onBeforeUnmount(() => {
  clearBlurTimer();
  window.removeEventListener("resize", handleWindowChange);
  window.removeEventListener("scroll", handleWindowChange, true);
  window.removeEventListener("pointerdown", handleDocumentPointerDown, true);
});

function importanceToneClass(value: TodoImportance) {
  return `todo-tone--${value}`;
}
</script>

<template>
  <div
    ref="composeRef"
    class="todo-compose"
    :class="{ 'todo-compose--compact': compact, 'todo-compose--details-open': detailsOpen }"
    @keydown.esc.stop.prevent="detailsOpen = false"
    @pointerdown.capture="markInsidePointer"
    @focusout="scheduleCommitCheck"
  >
    <div class="todo-compose__main">
      <input
        ref="textInputRef"
        v-model="text"
        class="todo-compose__input"
        placeholder="+ 新建待办..."
        @keydown.enter.prevent="commitDraft"
      />

      <button
        ref="infoButtonRef"
        class="todo-info-btn"
        :class="[
          { 'todo-info-btn--active': detailsOpen || hasDetails },
          importanceToneClass(importance)
        ]"
        type="button"
        aria-label="待办详情"
        :aria-expanded="detailsOpen"
        :title="detailsSummary"
        @click.stop="toggleDetails"
      >
        <span v-if="hasDetails" class="todo-info-btn__dot" />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="10.5" x2="12" y2="16" />
          <circle cx="12" cy="7.6" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </div>

    <Teleport to="body">
      <Transition name="todo-details">
        <div
          v-if="detailsOpen"
          ref="popoverRef"
          class="todo-details-popover"
          :style="popoverStyle"
          @pointerdown.capture="markInsidePointer"
          @click.stop
          @focusout="scheduleCommitCheck"
        >
          <div class="todo-details__header">
            <p class="todo-details__title">{{ detailsSummary }}</p>
            <button v-if="dueDate" class="todo-details__clear" type="button" @click="clearDue">清除</button>
          </div>

          <div class="todo-quick-dates" aria-label="快速日期">
            <button
              v-for="option in quickDateOptions"
              :key="option.offset"
              class="todo-quick-date"
              :class="{ 'todo-quick-date--active': isQuickDueActive(option.offset) }"
              type="button"
              @click="setQuickDue(option.offset)"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="todo-picker-grid">
            <button class="todo-picker-card" type="button" @click="syncCalendarToDueDate">
              <span class="todo-picker-card__icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3.5" y="4.5" width="17" height="16" rx="3" />
                  <line x1="8" y1="2.8" x2="8" y2="6.5" />
                  <line x1="16" y1="2.8" x2="16" y2="6.5" />
                  <line x1="4.2" y1="9" x2="19.8" y2="9" />
                </svg>
              </span>
              <span class="todo-picker-card__copy">
                <span class="todo-picker-card__label">日期</span>
                <strong>{{ datePickerLabel }}</strong>
              </span>
            </button>

            <button
              class="todo-picker-card"
              :class="{ 'todo-picker-card--disabled': !dueDate }"
              type="button"
              :disabled="!dueDate"
              @click="openTimePicker"
            >
              <span class="todo-picker-card__icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="8.5" />
                  <line x1="12" y1="7" x2="12" y2="12.3" />
                  <line x1="12" y1="12.3" x2="15.5" y2="14.2" />
                </svg>
              </span>
              <span class="todo-picker-card__copy">
                <span class="todo-picker-card__label">时间</span>
                <strong>{{ timePickerLabel }}</strong>
              </span>
            </button>
          </div>

          <div class="todo-calendar" aria-label="选择日期">
            <div class="todo-calendar__header">
              <button class="todo-calendar__nav" type="button" aria-label="上个月" @click="shiftCalendarMonth(-1)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button class="todo-calendar__today" type="button" @click="selectToday">今天</button>
              <p class="todo-calendar__month">{{ calendarMonthLabel }}</p>
              <button class="todo-calendar__nav" type="button" aria-label="下个月" @click="shiftCalendarMonth(1)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <div class="todo-calendar__weekdays">
              <span v-for="day in calendarWeekdays" :key="day">{{ day }}</span>
            </div>

            <div class="todo-calendar__grid">
              <button
                v-for="day in calendarDays"
                :key="day.value"
                class="todo-calendar__day"
                :class="{
                  'todo-calendar__day--muted': !day.inMonth,
                  'todo-calendar__day--today': day.isToday,
                  'todo-calendar__day--selected': day.isSelected,
                  'todo-calendar__day--weekend': day.isWeekend
                }"
                type="button"
                @click="selectCalendarDate(day.value)"
              >
                {{ day.day }}
              </button>
            </div>
          </div>

          <Transition name="todo-time">
            <div v-if="dueDate && timePanelOpen" class="todo-time-picker" aria-label="选择时间">
              <div class="todo-time-picker__header">
                <span>提醒时间</span>
                <button v-if="dueTime" class="todo-time-picker__clear" type="button" @click="clearTime">不提醒</button>
              </div>

              <div class="todo-time-quick" aria-label="快捷时间">
                <button
                  v-for="option in quickTimeOptions"
                  :key="option.value"
                  class="todo-time-quick__item"
                  :class="{ 'todo-time-quick__item--active': dueTime === option.value }"
                  type="button"
                  @click="setQuickTime(option.value)"
                >
                  <strong>{{ option.label }}</strong>
                  <span>{{ option.hint }}</span>
                </button>
              </div>

              <div class="todo-time-columns">
                <div class="todo-time-column">
                  <span class="todo-time-column__label">小时</span>
                  <div class="todo-time-column__grid todo-time-column__grid--hours">
                    <button
                      v-for="hour in hourOptions"
                      :key="hour"
                      class="todo-time-chip"
                      :class="{ 'todo-time-chip--active': isTimeHourSelected(hour) }"
                      type="button"
                      @click="setTimeHour(hour)"
                    >
                      {{ hour }}
                    </button>
                  </div>
                </div>

                <div class="todo-time-column">
                  <span class="todo-time-column__label">分钟</span>
                  <div class="todo-time-column__grid todo-time-column__grid--minutes">
                    <button
                      v-for="minute in minuteOptions"
                      :key="minute"
                      class="todo-time-chip"
                      :class="{ 'todo-time-chip--active': isTimeMinuteSelected(minute) }"
                      type="button"
                      @click="setTimeMinute(minute)"
                    >
                      {{ minute }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>

          <div class="todo-priority-swatches" aria-label="重要程度">
            <button
              v-for="option in importanceOptions"
              :key="option.value"
              class="todo-priority-swatch"
              :class="[importanceToneClass(option.value), { 'todo-priority-swatch--active': importance === option.value }]"
              type="button"
              :aria-label="`${option.title}：${option.description}`"
              :title="`${option.title}：${option.description}`"
              @click="importance = option.value"
            >
              <span class="todo-priority-swatch__dot" />
              <span class="todo-priority-swatch__label">{{ option.title }}</span>
              <span class="todo-priority-swatch__hint">{{ option.description }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.todo-compose {
  position: relative;
  z-index: 6;
  flex-shrink: 0;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.38);
  padding: 4px;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.52);
}

.todo-compose__main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.todo-compose__input {
  min-width: 0;
  flex: 1;
  height: 24px;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 11px;
  outline: none;
}

.todo-compose__input::placeholder {
  color: #94a3b8;
}

.todo-info-btn {
  position: relative;
  display: inline-flex;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #64748b;
  box-shadow: none;
  transition: all 160ms ease;
}

.todo-info-btn:hover,
.todo-info-btn--active {
  background: transparent;
  color: var(--todo-accent, #2563eb);
  box-shadow: none;
}

.todo-info-btn__dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: var(--todo-accent, #2563eb);
  box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.92);
}

.todo-details-popover {
  position: fixed;
  z-index: 120;
  max-height: calc(100vh - 24px);
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  padding: 11px;
  backdrop-filter: blur(22px) saturate(1.55);
  box-shadow: 0 22px 58px -26px rgba(15, 23, 42, 0.42), 0 8px 22px -18px rgba(37, 99, 235, 0.4), inset 0 1px rgba(255, 255, 255, 0.8);
}

.todo-details-popover::before {
  content: "";
  position: absolute;
  left: 0;
  top: var(--todo-popover-arrow-top, 24px);
  width: 3px;
  height: 28px;
  border-radius: 999px;
  background: linear-gradient(180deg, #2563eb, #0ea5e9);
  transform: translateY(-50%);
}

.todo-details-enter-active,
.todo-details-leave-active {
  transition: opacity 160ms ease, transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.todo-details-enter-from,
.todo-details-leave-to {
  opacity: 0;
  transform: translateX(14px) scale(0.98);
}

.todo-details__header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.todo-details__title {
  min-width: 0;
  overflow: hidden;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-details__clear {
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  padding: 3px 7px;
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.todo-quick-dates {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 5px;
  margin-bottom: 7px;
}

.todo-quick-date {
  min-width: 0;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 9px;
  background: rgba(248, 250, 252, 0.84);
  padding: 6px 0;
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  transition: all 160ms ease;
}

.todo-quick-date:hover,
.todo-quick-date--active {
  border-color: rgba(37, 99, 235, 0.24);
  background: rgba(219, 234, 254, 0.82);
  color: #2563eb;
}

.todo-picker-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}

.todo-picker-card {
  position: relative;
  display: grid;
  min-width: 0;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(248, 250, 252, 0.95), rgba(255, 255, 255, 0.72));
  padding: 7px;
  color: #475569;
  text-align: left;
  transition: all 160ms ease;
}

.todo-picker-card:hover {
  border-color: rgba(59, 130, 246, 0.28);
  box-shadow: 0 10px 22px -18px rgba(37, 99, 235, 0.8);
}

.todo-picker-card--disabled {
  opacity: 0.52;
}

.todo-picker-card__icon {
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}

.todo-picker-card__copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.todo-picker-card__label {
  color: #94a3b8;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
}

.todo-picker-card strong {
  overflow: hidden;
  color: #334155;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-calendar {
  margin-top: 8px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.78));
  padding: 8px;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.78);
}

.todo-calendar__header {
  display: grid;
  grid-template-columns: 26px auto minmax(0, 1fr) 26px;
  align-items: center;
  gap: 6px;
  margin-bottom: 7px;
}

.todo-calendar__nav,
.todo-calendar__today {
  display: inline-flex;
  height: 26px;
  min-width: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.78);
  color: #64748b;
  transition: all 160ms ease;
}

.todo-calendar__nav {
  width: 26px;
}

.todo-calendar__today {
  padding: 0 8px;
  color: #2563eb;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

.todo-calendar__nav:hover,
.todo-calendar__today:hover {
  border-color: rgba(37, 99, 235, 0.22);
  background: rgba(219, 234, 254, 0.68);
  color: #2563eb;
}

.todo-calendar__month {
  min-width: 0;
  overflow: hidden;
  color: #334155;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-calendar__weekdays,
.todo-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.todo-calendar__weekdays {
  margin-bottom: 4px;
}

.todo-calendar__weekdays span {
  color: #94a3b8;
  font-size: 9px;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
}

.todo-calendar__grid {
  gap: 4px;
}

.todo-calendar__day {
  display: inline-flex;
  aspect-ratio: 1;
  min-width: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: #475569;
  font-size: 10px;
  font-weight: 750;
  line-height: 1;
  transition: all 150ms ease;
}

.todo-calendar__day:focus,
.todo-calendar__day:focus-visible {
  outline: none;
}

.todo-calendar__day:hover {
  border-color: rgba(37, 99, 235, 0.18);
  background: rgba(219, 234, 254, 0.56);
  color: #1d4ed8;
}

.todo-calendar__day--weekend:not(.todo-calendar__day--selected) {
  color: #be123c;
}

.todo-calendar__day--muted:not(.todo-calendar__day--selected) {
  color: #cbd5e1;
}

.todo-calendar__day--today:not(.todo-calendar__day--selected) {
  border-color: rgba(16, 185, 129, 0.28);
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.todo-calendar__day--selected {
  border-color: rgba(37, 99, 235, 0.64);
  background: linear-gradient(145deg, #2563eb, #0ea5e9);
  color: #fff;
  box-shadow: 0 10px 18px -14px rgba(37, 99, 235, 0.9);
}

.todo-time-enter-active,
.todo-time-leave-active {
  transition: opacity 150ms ease, transform 170ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.todo-time-enter-from,
.todo-time-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.todo-time-picker {
  margin-top: 8px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.78));
  padding: 8px;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.78);
}

.todo-time-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 7px;
  color: #334155;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}

.todo-time-picker__clear {
  border: none;
  border-radius: 4px;
  background: rgba(148, 163, 184, 0.12);
  padding: 4px 7px;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  transition: all 150ms ease;
}

.todo-time-picker__clear:hover {
  background: rgba(244, 63, 94, 0.1);
  color: #e11d48;
}

.todo-time-quick {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 5px;
}

.todo-time-quick__item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 6px;
  background: rgba(248, 250, 252, 0.84);
  padding: 6px 3px 5px;
  color: #64748b;
  transition: all 150ms ease;
}

.todo-time-quick__item:hover,
.todo-time-quick__item--active {
  border-color: rgba(37, 99, 235, 0.26);
  background: rgba(219, 234, 254, 0.72);
  color: #2563eb;
}

.todo-time-quick__item strong {
  font-size: 10px;
  font-weight: 850;
  line-height: 1;
}

.todo-time-quick__item span {
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
  opacity: 0.72;
}

.todo-time-columns {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(80px, 0.7fr);
  gap: 8px;
  margin-top: 8px;
}

.todo-time-column {
  min-width: 0;
}

.todo-time-column__label {
  display: block;
  margin-bottom: 5px;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
}

.todo-time-column__grid {
  display: grid;
  gap: 3px;
}

.todo-time-column__grid--hours {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.todo-time-column__grid--minutes {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.todo-time-chip {
  display: inline-flex;
  min-width: 0;
  height: 23px;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.62);
  color: #475569;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  transition: all 140ms ease;
}

.todo-time-chip:hover {
  border-color: rgba(37, 99, 235, 0.18);
  background: rgba(219, 234, 254, 0.58);
  color: #1d4ed8;
}

.todo-time-chip:focus,
.todo-time-chip:focus-visible {
  outline: none;
}

.todo-time-chip--active {
  border-color: rgba(37, 99, 235, 0.58);
  background: linear-gradient(145deg, #2563eb, #0ea5e9);
  color: #fff;
  box-shadow: 0 8px 14px -12px rgba(37, 99, 235, 0.85);
}

.todo-priority-swatches {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  margin-top: 8px;
}

.todo-priority-swatch {
  --todo-accent: #0ea5e9;
  --todo-accent-soft: rgba(14, 165, 233, 0.12);
  --todo-accent-line: rgba(14, 165, 233, 0.32);
  display: inline-flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 10px;
  background:
    radial-gradient(circle at 50% 25%, var(--todo-accent-soft), transparent 70%),
    rgba(248, 250, 252, 0.82);
  padding: 7px 4px 6px;
  transition: all 170ms ease;
}

.todo-priority-swatch:hover,
.todo-priority-swatch--active {
  border-color: var(--todo-accent-line);
  background:
    radial-gradient(circle at 50% 25%, var(--todo-accent-soft), transparent 72%),
    rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 28px -22px color-mix(in srgb, var(--todo-accent) 70%, transparent);
  transform: translateY(-1px);
}

.todo-priority-swatch--active {
  box-shadow: inset 0 0 0 1px var(--todo-accent-line), 0 12px 28px -22px color-mix(in srgb, var(--todo-accent) 70%, transparent);
}

.todo-priority-swatch__dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--todo-accent);
  box-shadow: 0 0 0 4px var(--todo-accent-soft);
}

.todo-priority-swatch__label,
.todo-priority-swatch__hint {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-priority-swatch__label {
  color: #334155;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

.todo-priority-swatch__hint {
  color: #94a3b8;
  font-size: 8px;
  font-weight: 650;
  line-height: 1;
}

.todo-tone--low {
  --todo-accent: #0ea5e9;
  --todo-accent-soft: rgba(14, 165, 233, 0.12);
  --todo-accent-line: rgba(14, 165, 233, 0.32);
}

.todo-tone--medium {
  --todo-accent: #d97706;
  --todo-accent-soft: rgba(245, 158, 11, 0.14);
  --todo-accent-line: rgba(245, 158, 11, 0.38);
}

.todo-tone--high {
  --todo-accent: #e11d48;
  --todo-accent-soft: rgba(244, 63, 94, 0.14);
  --todo-accent-line: rgba(244, 63, 94, 0.42);
}

.todo-compose--compact .todo-details-popover {
  padding: 9px;
}

.todo-compose--compact .todo-picker-grid {
  gap: 5px;
}

.todo-compose--compact .todo-picker-card {
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 5px;
  padding: 6px;
}

.todo-compose--compact .todo-picker-card__icon {
  width: 18px;
  height: 18px;
  border-radius: 7px;
}

.todo-compose--compact .todo-priority-swatches {
  gap: 5px;
}

.todo-compose--compact .todo-calendar {
  padding: 7px;
}

.todo-compose--compact .todo-calendar__grid {
  gap: 3px;
}

.todo-compose--compact .todo-calendar__day {
  border-radius: 8px;
  font-size: 9px;
}

.todo-compose--compact .todo-time-picker {
  padding: 7px;
}

.todo-compose--compact .todo-time-columns {
  grid-template-columns: minmax(0, 1fr);
  gap: 7px;
}

.todo-compose--compact .todo-time-column__grid--minutes {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.todo-compose--compact .todo-time-quick__item span {
  display: none;
}

.todo-compose--compact .todo-priority-swatch {
  padding: 6px 3px 5px;
}

.todo-compose--compact .todo-priority-swatch__dot {
  width: 10px;
  height: 10px;
}

.todo-compose--compact .todo-priority-swatch__hint {
  display: none;
}
</style>
