<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { useDashboard } from "@/composables/useDashboard";
import { DASHBOARD_WIDGET_DEFINITIONS, type DashboardWidgetId } from "@/types/widget";

import CalendarSummaryWidget from "./CalendarSummaryWidget.vue";
import ClockSettingsPanel from "./ClockSettingsPanel.vue";
import ClockSummaryWidget from "./ClockSummaryWidget.vue";
import CountdownSettingsPanel from "./CountdownSettingsPanel.vue";
import CountdownSummaryWidget from "./CountdownSummaryWidget.vue";
import DashboardGrid from "./DashboardGrid.vue";
import ProgressSummaryWidget from "./ProgressSummaryWidget.vue";
import SitesSettingsPanel from "./SitesSettingsPanel.vue";
import SitesSummaryWidget from "./SitesSummaryWidget.vue";
import TodoHistoryModal from "./TodoHistoryModal.vue";
import TodoSettingsPanel from "./TodoSettingsPanel.vue";
import TodoSummaryWidget from "./TodoSummaryWidget.vue";
import WeatherSettingsPanel from "./WeatherSettingsPanel.vue";
import WeatherSummaryWidget from "./WeatherSummaryWidget.vue";
import WidgetContextMenu from "./WidgetContextMenu.vue";
import WidgetShell from "./WidgetShell.vue";

const dashboard = useDashboard();
const orderedWidgets = computed(() => dashboard.orderedWidgets.value);

const menuState = ref<{
  id: DashboardWidgetId;
  x: number;
  y: number;
} | null>(null);

const settingsPanel = ref<DashboardWidgetId | null>(null);
const todoHistoryOpen = ref(false);

const menuWidget = computed(() =>
  menuState.value ? orderedWidgets.value.find((item) => item.id === menuState.value?.id) ?? null : null
);

function openWidgetMenu(id: DashboardWidgetId, position: { x: number; y: number }) {
  menuState.value = { id, ...position };
}

function handleResize(size: import("@/types/widget").WidgetSize) {
  if (menuState.value) {
    dashboard.setWidgetSize(menuState.value.id, size);
  }
}

function handleSettings() {
  if (menuState.value) {
    settingsPanel.value = menuState.value.id;
  }
}

function handleHistory() {
  todoHistoryOpen.value = true;
}

onMounted(() => {
  void dashboard.initialize();
});
</script>

<template>
  <section>
    <DashboardGrid :items="orderedWidgets" @reorder="dashboard.reorderWidgets" @move="dashboard.moveWidget">
      <template #item="{ item }">
        <WidgetShell
          :title="DASHBOARD_WIDGET_DEFINITIONS[item.id].title"
          :kind="item.id"
          :size="item.size"
          @menu="openWidgetMenu(item.id, $event)"
        >
          <ClockSummaryWidget
            v-if="item.id === 'clock'"
            :size="item.size"
          />

          <WeatherSummaryWidget v-else-if="item.id === 'weather'" :size="item.size" />

          <CalendarSummaryWidget v-else-if="item.id === 'calendar'" :size="item.size" />

          <CountdownSummaryWidget v-else-if="item.id === 'countdown'" :size="item.size" />

          <TodoSummaryWidget v-else-if="item.id === 'todo'" :size="item.size" />

          <ProgressSummaryWidget v-else-if="item.id === 'progress'" :size="item.size" />

          <SitesSummaryWidget
            v-else-if="item.id === 'sites'"
            :size="item.size"
          />
        </WidgetShell>
      </template>
    </DashboardGrid>
  </section>

  <WidgetContextMenu
    v-if="menuState && menuWidget"
    :open="Boolean(menuState)"
    :x="menuState.x"
    :y="menuState.y"
    :widget-id="menuState.id"
    :title="DASHBOARD_WIDGET_DEFINITIONS[menuState.id].title"
    :current-size="menuWidget.size"
    :sizes="DASHBOARD_WIDGET_DEFINITIONS[menuState.id].supportedSizes"
    @close="menuState = null"
    @resize="handleResize"
    @settings="handleSettings"
    @history="handleHistory"
  />

  <WeatherSettingsPanel
    :open="settingsPanel === 'weather'"
    @close="settingsPanel = null"
  />

  <ClockSettingsPanel
    :open="settingsPanel === 'clock'"
    @close="settingsPanel = null"
  />

  <CountdownSettingsPanel
    :open="settingsPanel === 'countdown'"
    @close="settingsPanel = null"
  />

  <TodoSettingsPanel
    :open="settingsPanel === 'todo'"
    @close="settingsPanel = null"
  />

  <SitesSettingsPanel
    :open="settingsPanel === 'sites'"
    @close="settingsPanel = null"
  />

  <TodoHistoryModal
    :open="todoHistoryOpen"
    @close="todoHistoryOpen = false"
  />
</template>
