<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { useDashboard } from "@/composables/useDashboard";
import { DASHBOARD_WIDGET_DEFINITIONS, type DashboardWidgetId } from "@/types/widget";

import CalendarWidget from "@/components/calendar/CalendarWidget.vue";
import WeatherWidget from "@/components/weather/WeatherWidget.vue";

import CalendarSummaryWidget from "./CalendarSummaryWidget.vue";
import ClockDetailPanel from "./ClockDetailPanel.vue";
import ClockSummaryWidget from "./ClockSummaryWidget.vue";
import DashboardGrid from "./DashboardGrid.vue";
import WeatherSummaryWidget from "./WeatherSummaryWidget.vue";
import WidgetContextMenu from "./WidgetContextMenu.vue";
import WidgetDetailModal from "./WidgetDetailModal.vue";
import WidgetShell from "./WidgetShell.vue";

const props = defineProps<{
  dateLabel: string;
  timeLabel: string;
}>();

const dashboard = useDashboard();
const activeWidgetId = ref<DashboardWidgetId | null>(null);
const menuState = ref<{
  id: DashboardWidgetId;
  x: number;
  y: number;
} | null>(null);

const orderedWidgets = computed(() => dashboard.orderedWidgets.value);
const widgetCount = computed(() => orderedWidgets.value.length);
const menuWidget = computed(() =>
  menuState.value ? orderedWidgets.value.find((item) => item.id === menuState.value?.id) ?? null : null
);

const detailMeta = computed(() => {
  if (!activeWidgetId.value) {
    return null;
  }

  switch (activeWidgetId.value) {
    case "clock":
      return {
        title: "时间",
        kicker: "Quick Glance",
        description: "先用紧凑卡片占住最少空间，需要更多上下文时再展开查看。"
      };
    case "weather":
      return {
        title: "天气",
        kicker: "Weather Detail",
        description: "默认只展示最关键的天气摘要，点击后再进入完整天气详情与城市设置。"
      };
    case "calendar":
      return {
        title: "日历",
        kicker: "Calendar Detail",
        description: "首页看迷你月历和重点日期，展开后查看完整节假日、农历与近期放假安排。"
      };
    default:
      return null;
  }
});

function runViewTransition(update: () => void) {
  const transitionDocument = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> };
  };

  if (!transitionDocument.startViewTransition) {
    update();
    return;
  }

  void transitionDocument.startViewTransition(update).finished.catch(() => undefined);
}

function openWidget(id: DashboardWidgetId) {
  menuState.value = null;
  runViewTransition(() => {
    activeWidgetId.value = id;
  });
}

function closeDetail() {
  runViewTransition(() => {
    activeWidgetId.value = null;
  });
}

function openWidgetMenu(id: DashboardWidgetId, position: { x: number; y: number }) {
  menuState.value = {
    id,
    ...position
  };
}

function closeWidgetMenu() {
  menuState.value = null;
}

onMounted(() => {
  void dashboard.initialize();
});
</script>

<template>
  <section class="grid gap-5">
    <div class="surface-card p-3 sm:p-4">
      <div
        class="grid gap-4 rounded-[30px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,250,244,0.94),rgba(244,250,247,0.86)_58%,rgba(241,245,249,0.82))] p-5 sm:p-6 xl:grid-cols-[1.12fr_0.88fr]"
      >
        <div>
          <p class="section-kicker">Workspace</p>
          <h2 class="section-title">今日面板</h2>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            摘要卡优先展示最关键的信息，点击进入完整上下文，右键直接切换卡片尺寸，让首页更轻、更稳。
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <article class="stat-tile">
            <p class="mini-kicker">Widgets</p>
            <p class="widget-value mt-3 text-[2.4rem] leading-none">{{ widgetCount }}</p>
            <p class="mt-1 text-sm text-slate-500">时间、天气、日历</p>
          </article>

          <article class="stat-tile">
            <p class="mini-kicker">Layout</p>
            <p class="mt-3 text-base font-semibold text-slate-900">4 档尺寸</p>
            <p class="mt-1 text-sm text-slate-500">从速览到完整展开</p>
          </article>

          <article class="stat-tile">
            <p class="mini-kicker">Control</p>
            <p class="mt-3 text-base font-semibold text-slate-900">点击或按 Enter</p>
            <p class="mt-1 text-sm text-slate-500">右键可直接调整布局</p>
          </article>
        </div>
      </div>
    </div>

    <DashboardGrid :items="orderedWidgets">
      <template #item="{ item }">
        <WidgetShell
          :title="DASHBOARD_WIDGET_DEFINITIONS[item.id].title"
          :subtitle="DASHBOARD_WIDGET_DEFINITIONS[item.id].subtitle"
          :kind="item.id"
          :kicker="item.id === 'clock' ? 'Quick Glance' : item.id === 'weather' ? 'Weather' : 'Calendar'"
          :size="item.size"
          :view-name="activeWidgetId === item.id ? '' : `widget-${item.id}`"
          @open="openWidget(item.id)"
          @menu="openWidgetMenu(item.id, $event)"
        >
          <ClockSummaryWidget
            v-if="item.id === 'clock'"
            :size="item.size"
            :date-label="dateLabel"
            :time-label="timeLabel"
          />

          <WeatherSummaryWidget v-else-if="item.id === 'weather'" :size="item.size" />

          <CalendarSummaryWidget v-else :size="item.size" />
        </WidgetShell>
      </template>
    </DashboardGrid>
  </section>

  <WidgetContextMenu
    v-if="menuState && menuWidget"
    :open="Boolean(menuState)"
    :x="menuState.x"
    :y="menuState.y"
    :title="DASHBOARD_WIDGET_DEFINITIONS[menuState.id].title"
    :current-size="menuWidget.size"
    :sizes="DASHBOARD_WIDGET_DEFINITIONS[menuState.id].supportedSizes"
    @close="closeWidgetMenu"
    @open-detail="openWidget(menuState.id)"
    @resize="dashboard.setWidgetSize(menuState.id, $event)"
  />

  <WidgetDetailModal
    v-if="detailMeta"
    :open="Boolean(activeWidgetId)"
    :title="detailMeta.title"
    :kicker="detailMeta.kicker"
    :description="detailMeta.description"
    :view-name="`widget-${activeWidgetId}`"
    :panel-class="activeWidgetId === 'clock' ? 'max-w-2xl' : 'max-w-6xl'"
    @close="closeDetail"
  >
    <ClockDetailPanel
      v-if="activeWidgetId === 'clock'"
      :date-label="dateLabel"
      :time-label="timeLabel"
    />

    <WeatherWidget v-else-if="activeWidgetId === 'weather'" />

    <CalendarWidget v-else-if="activeWidgetId === 'calendar'" />
  </WidgetDetailModal>
</template>
