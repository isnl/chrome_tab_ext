<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{
  pull: [];
}>();

const isPulling = ref(false);

function handleClick() {
  if (isPulling.value) return;
  isPulling.value = true;
  // Pull down animation, then emit after the pull reaches bottom
  setTimeout(() => {
    emit("pull");
  }, 280);
  // Bounce back
  setTimeout(() => {
    isPulling.value = false;
  }, 600);
}
</script>

<template>
  <div class="pull-cord" :class="{ 'pull-cord--pulling': isPulling }" @click="handleClick">
    <!-- Knob -->
    <div class="pull-cord__knob">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Image/wallpaper icon -->
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="2" fill="none" />
        <circle cx="8.5" cy="9" r="2" fill="currentColor" />
        <path d="M3 17 L8 12 L12 16 L16 11 L21 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.pull-cord {
  position: fixed;
  top: 12px;
  right: 16px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pull-cord--pulling {
  transform: scale(0.85);
  transition: transform 0.28s cubic-bezier(0.4, 0, 1, 1);
}

.pull-cord__knob {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.2s ease;
  opacity: 0.6;
}

.pull-cord:hover .pull-cord__knob {
  opacity: 1;
  background: rgba(0, 0, 0, 0.25);
  border-color: rgba(255, 255, 255, 0.25);
  transform: scale(1.08);
}

.pull-cord--pulling .pull-cord__knob {
  opacity: 1;
  background: rgba(0, 0, 0, 0.35);
}
</style>
