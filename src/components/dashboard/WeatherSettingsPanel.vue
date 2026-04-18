<script setup lang="ts">
import { ref } from "vue";

import { useWeather } from "@/composables/useWeather";
import type { LocationOption } from "@/types/weather";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const weatherState = useWeather();
const localQuery = ref(weatherState.searchQuery.value);
const quickCities = ["北京", "上海", "杭州", "广州", "深圳", "西安", "成都", "武汉"];

let searchTimer: number | null = null;

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  localQuery.value = value;

  if (searchTimer !== null) window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    weatherState.searchQuery.value = value;
  }, 300);
}

function handleQuickCity(city: string) {
  localQuery.value = city;
  weatherState.searchQuery.value = city;
}

async function selectCity(option: LocationOption) {
  await weatherState.chooseLocation(option);
  emit("close");
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
          enter-from-class="translate-y-4 scale-95 opacity-0"
          enter-to-class="translate-y-0 scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 scale-100 opacity-100"
          leave-to-class="translate-y-4 scale-95 opacity-0"
        >
          <section v-if="open" class="settings-panel" @keydown.escape="emit('close')">
            <div class="settings-header">
              <h3 class="settings-title">切换城市</h3>
              <button class="settings-close" type="button" @click="emit('close')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            <p v-if="weatherState.location.value" class="settings-current">
              {{ weatherState.location.value.name }}
              <span v-if="weatherState.location.value.admin1"> · {{ weatherState.location.value.admin1 }}</span>
            </p>

            <input
              :value="localQuery"
              class="settings-input"
              type="search"
              autocomplete="off"
              spellcheck="false"
              placeholder="搜索城市..."
              @input="handleInput"
            />

            <div class="settings-quick">
              <button
                v-for="city in quickCities"
                :key="city"
                class="settings-quick-btn"
                type="button"
                @click="handleQuickCity(city)"
              >{{ city }}</button>
            </div>

            <p class="settings-msg">
              {{ weatherState.isSearching.value ? "搜索中..." : weatherState.searchMessage.value }}
            </p>

            <div class="settings-results">
              <button
                v-for="item in weatherState.searchResults.value"
                :key="`${item.latitude}-${item.longitude}`"
                class="settings-result-btn"
                type="button"
                @click="selectCity(item)"
              >
                <div>
                  <p class="settings-result-name">{{ item.name }}</p>
                  <p class="settings-result-info">{{ [item.admin1, item.country].filter(Boolean).join(" · ") }}</p>
                </div>
              </button>
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
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
}

.settings-panel {
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 20px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px) saturate(1.5);
  box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.15);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.settings-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.settings-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 120ms ease;
}

.settings-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #475569;
}

.settings-current {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 12px;
}

.settings-input {
  width: 100%;
  height: 42px;
  padding: 0 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  color: #1e293b;
  outline: none;
  transition: all 150ms ease;
}

.settings-input:focus {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
}

.settings-input::placeholder {
  color: #b0adc0;
}

.settings-input::-webkit-search-cancel-button {
  display: none;
}

.settings-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.settings-quick-btn {
  padding: 4px 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 120ms ease;
}

.settings-quick-btn:hover {
  background: rgba(99, 102, 241, 0.06);
  border-color: rgba(99, 102, 241, 0.2);
  color: #4338ca;
}

.settings-msg {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 10px;
}

.settings-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.settings-result-btn {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  text-align: left;
  cursor: pointer;
  transition: all 120ms ease;
}

.settings-result-btn:hover {
  background: rgba(99, 102, 241, 0.05);
  border-color: rgba(99, 102, 241, 0.15);
}

.settings-result-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.settings-result-info {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}
</style>
