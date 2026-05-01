<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { createSiteFaviconUrl } from "@/composables/useSites";

const props = withDefaults(
  defineProps<{
    url: string;
    label: string;
    size?: number;
    radius?: number;
  }>(),
  {
    size: 26,
    radius: 10
  }
);

const imageFailed = ref(false);

const avatarStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: `${props.radius}px`
}));

const faviconUrl = computed(() => createSiteFaviconUrl(props.url));

const monogram = computed(() => {
  const text = props.label.trim();
  return (text[0] ?? "•").toUpperCase();
});

watch(
  () => props.url,
  () => {
    imageFailed.value = false;
  }
);
</script>

<template>
  <span class="site-avatar" :style="avatarStyle">
    <img
      v-if="faviconUrl && !imageFailed"
      :src="faviconUrl"
      :alt="label"
      class="site-avatar__img"
      @error="imageFailed = true"
    />
    <span v-else class="site-avatar__fallback">{{ monogram }}</span>
  </span>
</template>

<style scoped>
.site-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0) 58%),
    linear-gradient(145deg, rgba(14, 165, 233, 0.16), rgba(59, 130, 246, 0.26));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.65),
    0 4px 12px rgba(14, 165, 233, 0.12);
}

.site-avatar__img {
  width: 72%;
  height: 72%;
  object-fit: contain;
  border-radius: inherit;
}

.site-avatar__fallback {
  font-size: 12px;
  font-weight: 700;
  color: #0369a1;
}
</style>
