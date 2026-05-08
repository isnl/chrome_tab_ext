<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import ComponentVisibilityDrawer from "@/components/dashboard/ComponentVisibilityDrawer.vue";
import DashboardBoard from "@/components/dashboard/DashboardBoard.vue";
import SearchBar from "@/components/search/StickySearchBar.vue";
import WallpaperPullCord from "@/components/wallpaper/WallpaperPullCord.vue";
import { useWallpaper } from "@/composables/useWallpaper";

const wallpaper = useWallpaper();
const settingsDrawerOpen = ref(false);

// Two-layer crossfade
const layerA = ref<string | null>(null);
const layerB = ref<string | null>(null);
const showB = ref(false);

const isWallpaperActive = computed(() => !!wallpaper.currentUrl.value);

onMounted(() => {
  void wallpaper.initialize().then(() => {
    if (wallpaper.currentUrl.value) {
      layerA.value = wallpaper.currentUrl.value;
    }
  });
});

watch(() => wallpaper.currentUrl.value, (url) => {
  if (!url) {
    layerA.value = null;
    layerB.value = null;
    showB.value = false;
    document.body.classList.remove("wallpaper-active");
    return;
  }

  document.body.classList.add("wallpaper-active");

  if (!layerA.value) {
    layerA.value = url;
    return;
  }

  // Crossfade: put new image on layer B, fade in, then swap
  layerB.value = url;
  showB.value = true;

  setTimeout(() => {
    layerA.value = url;
    showB.value = false;
    layerB.value = null;
  }, 800);
});

function handlePull() {
  void wallpaper.switchWallpaper();
}
</script>

<template>
  <!-- Wallpaper layers -->
  <div v-if="isWallpaperActive" class="wallpaper-container">
    <img v-if="layerA" :src="layerA" class="wallpaper-img" alt="" />
    <img
      v-if="layerB"
      :src="layerB"
      class="wallpaper-img wallpaper-img--top"
      :class="{ 'wallpaper-img--visible': showB }"
      alt=""
    />
    <div class="wallpaper-overlay"></div>
  </div>

  <!-- Pull cord -->
  <WallpaperPullCord :loading="wallpaper.isTransitioning.value" @pull="handlePull" />

  <div class="page-shell min-h-screen">
    <div class="mx-auto flex min-h-screen w-full max-w-[1540px] flex-col px-4 pb-10 pt-5 sm:px-6 lg:px-8">
      <header
        class="sticky top-0 z-50"
      >
        <div class="top-toolbar">
          <SearchBar class="top-toolbar__search" />

          <button
            class="component-settings-trigger"
            :class="{ 'component-settings-trigger--active': settingsDrawerOpen }"
            type="button"
            aria-controls="component-visibility-drawer"
            :aria-expanded="settingsDrawerOpen"
            aria-label="打开组件设置"
            title="组件显示"
            @click="settingsDrawerOpen = true"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.05" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
              <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
              <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
              <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
            </svg>
          </button>
        </div>
      </header>

      <main class="mt-6 flex-1">
        <DashboardBoard />
      </main>
    </div>
  </div>

  <ComponentVisibilityDrawer
    :open="settingsDrawerOpen"
    @close="settingsDrawerOpen = false"
  />
</template>

<style scoped>
.top-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 0 16px;
}

.top-toolbar__search {
  flex: 1 1 680px;
  max-width: 680px;
  min-width: 0;
  padding-right: 0;
  padding-left: 0;
}

.component-settings-trigger {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  margin-top: 36px;
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 16px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(248, 246, 255, 0.7));
  color: var(--muted-600);
  box-shadow:
    0 16px 32px -26px rgba(15, 10, 40, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(18px) saturate(1.4);
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease;
}

.component-settings-trigger:hover,
.component-settings-trigger--active {
  transform: translateY(-1px);
  border-color: rgba(124, 58, 237, 0.2);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(237, 233, 254, 0.78));
  color: var(--accent-700);
  box-shadow:
    0 20px 38px -26px rgba(124, 58, 237, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.96);
}

.component-settings-trigger:active {
  transform: translateY(0);
  box-shadow:
    0 12px 24px -24px rgba(124, 58, 237, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

@media (max-width: 520px) {
  .top-toolbar {
    gap: 8px;
    padding: 0;
  }

  .component-settings-trigger {
    margin-top: 36px;
  }
}

.wallpaper-container {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.wallpaper-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wallpaper-img--top {
  opacity: 0;
  transition: opacity 0.7s ease;
}

.wallpaper-img--visible {
  opacity: 1;
}

.wallpaper-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(1px);
  pointer-events: none;
}
</style>
