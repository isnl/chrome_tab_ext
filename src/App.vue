<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import DashboardBoard from "@/components/dashboard/DashboardBoard.vue";
import SearchBar from "@/components/search/StickySearchBar.vue";
import WallpaperPullCord from "@/components/wallpaper/WallpaperPullCord.vue";
import { useWallpaper } from "@/composables/useWallpaper";

const wallpaper = useWallpaper();

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
  <WallpaperPullCord @pull="handlePull" />

  <div class="page-shell min-h-screen">
    <div class="mx-auto flex min-h-screen w-full max-w-[1540px] flex-col px-4 pb-10 pt-5 sm:px-6 lg:px-8">
      <header>
        <SearchBar />
      </header>

      <main class="mt-6 flex-1">
        <DashboardBoard />
      </main>
    </div>
  </div>
</template>

<style scoped>
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
