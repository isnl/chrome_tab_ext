<script setup lang="ts">
import { useClock } from "@/composables/useClock";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const clock = useClock();
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
              <h3 class="settings-title">时间格式</h3>
              <button class="settings-close" type="button" @click="emit('close')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            <div class="format-options">
              <button
                class="format-btn"
                :class="{ 'format-btn--active': !clock.hour12.value }"
                type="button"
                @click="clock.hour12.value ? clock.toggleFormat() : undefined"
              >
                <span class="format-example">14:30</span>
                <span class="format-label">24 小时制</span>
              </button>

              <button
                class="format-btn"
                :class="{ 'format-btn--active': clock.hour12.value }"
                type="button"
                @click="!clock.hour12.value ? clock.toggleFormat() : undefined"
              >
                <span class="format-example">2:30 PM</span>
                <span class="format-label">12 小时制</span>
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
  max-width: 320px;
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
  margin-bottom: 16px;
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

.format-options {
  display: flex;
  gap: 10px;
}

.format-btn {
  flex: 1;
  padding: 16px 12px;
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.6);
  text-align: center;
  cursor: pointer;
  transition: all 150ms ease;
}

.format-btn:hover {
  border-color: rgba(99, 102, 241, 0.2);
}

.format-btn--active {
  border-color: rgba(99, 102, 241, 0.4);
  background: rgba(99, 102, 241, 0.06);
}

.format-example {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.format-btn--active .format-example {
  color: #4338ca;
}

.format-label {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
}
</style>
