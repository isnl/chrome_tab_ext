<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{
  pull: [];
}>();

const isPulling = ref(false);

function handleClick() {
  if (isPulling.value) return;
  isPulling.value = true;
  setTimeout(() => {
    emit("pull");
  }, 280);
  setTimeout(() => {
    isPulling.value = false;
  }, 600);
}
</script>

<template>
  <div class="pull-cord" :class="{ 'pull-cord--pulling': isPulling }" @click="handleClick">
    <!-- Vertical line -->
    <div class="pull-cord__line"></div>
    <!-- Knob -->
    <div class="pull-cord__knob">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="2.5" fill="none" />
        <circle cx="8.5" cy="9" r="2" fill="currentColor" />
        <path d="M3 17 L8 12 L12 16 L16 11 L21 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.pull-cord {
  position: fixed;
  top: 0;
  right: 38px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pull-cord--pulling {
  transform: translateY(30px);
  transition: transform 0.28s cubic-bezier(0.4, 0, 1, 1);
}

.pull-cord__line {
  width: 2px;
  height: 44px;
  border-radius: 0 0 1px 1px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255, 255, 255, 0.25) 20%,
    rgba(255, 255, 255, 0.5)
  );
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}

.pull-cord__knob {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  opacity: 0.7;
}

.pull-cord:hover .pull-cord__knob {
  opacity: 1;
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.pull-cord:hover .pull-cord__line {
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255, 255, 255, 0.35) 20%,
    rgba(255, 255, 255, 0.65)
  );
}

.pull-cord--pulling .pull-cord__knob {
  opacity: 1;
  background: rgba(255, 255, 255, 0.35);
  transform: scale(0.92);
}
</style>
