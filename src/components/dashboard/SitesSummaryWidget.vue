<script setup lang="ts">
import { computed } from "vue";

import SiteAvatar from "@/components/sites/SiteAvatar.vue";
import { useSites } from "@/composables/useSites";
import type { WidgetSize } from "@/types/widget";

const props = defineProps<{
  size: WidgetSize;
}>();

const sites = useSites();

const orderedSites = computed(() => [...sites.items.value].sort((left, right) => left.order - right.order));
const visibleLimit = computed(() => 16);
const visibleSites = computed(() => orderedSites.value.slice(0, visibleLimit.value));
const gridClass = computed(() => `sites-grid--${props.size.replace("x", "-")}`);

function getShortLabel(name: string, hostname: string) {
  const cleanedHostname = hostname.replace(/^www\./i, "");
  const cleanedName = name.trim();
  if (!cleanedName) {
    return cleanedHostname;
  }

  return cleanedName.length > 12 ? cleanedName.slice(0, 11) : cleanedName;
}
</script>

<template>
  <div class="flex h-full flex-col">
    <template v-if="!orderedSites.length">
      <div class="sites-empty">
        <div class="sites-empty__icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14"/><path d="M5 12h14"/>
          </svg>
        </div>
        <p class="sites-empty__title">还没有常用网站</p>
        <p class="sites-empty__hint">右键卡片添加网站</p>
      </div>
    </template>

    <template v-else>
      <div class="sites-grid" :class="gridClass">
        <a
          v-for="item in visibleSites"
          :key="item.id"
          class="sites-link"
          :href="item.url"
          :title="item.name"
        >
          <SiteAvatar
            :url="item.url"
            :label="item.name"
            :size="size === '2x2' ? 30 : size === '4x2' ? 30 : 38"
            :radius="size === '4x4' ? 14 : 11"
          />
          <span v-if="size === '4x4'" class="sites-link__name">{{ getShortLabel(item.name, item.hostname) }}</span>
        </a>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sites-empty {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.sites-empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 18px;
  color: #0284c7;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.65);
}

.sites-empty__title {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.sites-empty__hint {
  margin-top: 4px;
  font-size: 11px;
  color: #64748b;
}

.sites-grid {
  display: grid;
  height: 100%;
  min-height: 0;
  gap: 8px;
  align-items: start;
}

.sites-grid--2-2 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
}

.sites-grid--4-2 {
  grid-template-columns: repeat(8, minmax(0, 1fr));
  grid-template-rows: repeat(2, auto);
  align-content: start;
}

.sites-grid--4-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.sites-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  width: 100%;
  aspect-ratio: 1;
  align-self: start;
  border: none;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.5);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
  transition: transform 160ms ease, background 160ms ease, box-shadow 160ms ease;
}

.sites-link:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.72);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.72),
    0 8px 18px rgba(14, 165, 233, 0.1);
}

.sites-grid--2-2 .sites-link {
  background: transparent;
  box-shadow: none;
}

.sites-grid--2-2 .sites-link:hover {
  background: transparent;
  box-shadow: none;
}

.sites-grid--4-4 .sites-link {
  height: 100%;
  align-self: stretch;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

.sites-link__name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}
</style>
