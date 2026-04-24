<script setup lang="ts">
import { computed } from "vue";

import SiteAvatar from "@/components/sites/SiteAvatar.vue";
import { useSites } from "@/composables/useSites";
import type { WidgetSize } from "@/types/widget";

const props = defineProps<{
  size: WidgetSize;
}>();

const emit = defineEmits<{
  manage: [];
}>();

const sites = useSites();

const orderedSites = computed(() => [...sites.items.value].sort((left, right) => left.order - right.order));

const visibleLimit = computed(() => {
  if (props.size === "2x2") {
    return 9;
  }

  if (props.size === "4x2") {
    return 8;
  }

  return 16;
});

const visibleSites = computed(() => orderedSites.value.slice(0, visibleLimit.value));
const remainingCount = computed(() => Math.max(0, orderedSites.value.length - visibleLimit.value));
const showInlineAdd = computed(() => sites.canAddMore.value && visibleSites.value.length < visibleLimit.value);

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
        <p class="sites-empty__hint">右键卡片或点这里添加</p>
        <button class="sites-empty__button" type="button" @click.stop="emit('manage')">添加网站</button>
      </div>
    </template>

    <template v-else-if="size === '2x2'">
      <div class="sites-mini-grid">
        <a
          v-for="item in visibleSites"
          :key="item.id"
          class="sites-mini-link"
          :href="item.url"
          :title="item.name"
        >
          <SiteAvatar :url="item.url" :label="item.name" :size="28" :radius="11" />
        </a>

        <button
          v-if="showInlineAdd"
          class="sites-mini-link sites-mini-link--add"
          type="button"
          @click.stop="emit('manage')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14"/><path d="M5 12h14"/>
          </svg>
        </button>
      </div>
    </template>

    <template v-else-if="size === '4x2'">
      <div class="sites-header">
        <p class="sites-kicker">常用网站</p>
        <button class="sites-manage-btn" type="button" @click.stop="emit('manage')">
          {{ sites.itemCount.value }} / {{ sites.maxSites }}
        </button>
      </div>

      <div class="sites-wide-grid">
        <a
          v-for="item in visibleSites"
          :key="item.id"
          class="sites-tile"
          :href="item.url"
          :title="item.name"
        >
          <SiteAvatar :url="item.url" :label="item.name" :size="28" :radius="11" />
          <span class="sites-tile__name">{{ getShortLabel(item.name, item.hostname) }}</span>
        </a>

        <button
          v-if="showInlineAdd"
          class="sites-tile sites-tile--add"
          type="button"
          @click.stop="emit('manage')"
        >
          <span class="sites-tile__plus">+</span>
          <span class="sites-tile__name">添加</span>
        </button>
      </div>
    </template>

    <template v-else>
      <div class="sites-header">
        <div>
          <p class="sites-kicker">常用网站</p>
          <p class="sites-subtitle">已添加 {{ sites.itemCount.value }} 个常用入口</p>
        </div>
        <button class="sites-manage-btn" type="button" @click.stop="emit('manage')">管理</button>
      </div>

      <div class="sites-large-grid">
        <a
          v-for="item in visibleSites"
          :key="item.id"
          class="sites-card"
          :href="item.url"
          :title="item.name"
        >
          <SiteAvatar :url="item.url" :label="item.name" :size="30" :radius="12" />
          <div class="min-w-0">
            <p class="sites-card__title">{{ getShortLabel(item.name, item.hostname) }}</p>
            <p class="sites-card__meta">{{ item.hostname }}</p>
          </div>
        </a>

        <button
          v-if="showInlineAdd"
          class="sites-card sites-card--add"
          type="button"
          @click.stop="emit('manage')"
        >
          <span class="sites-card__plus">+</span>
          <div class="min-w-0">
            <p class="sites-card__title">添加网站</p>
            <p class="sites-card__meta">从历史或手动输入</p>
          </div>
        </button>
      </div>

      <p v-if="remainingCount" class="sites-footer">仅显示前 {{ visibleLimit }} 个，剩余 {{ remainingCount }} 个可在管理面板里删减。</p>
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

.sites-empty__button {
  margin-top: 12px;
  border: none;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.14);
  color: #0369a1;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 140ms ease;
}

.sites-empty__button:hover {
  background: rgba(14, 165, 233, 0.2);
}

.sites-mini-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  height: 100%;
  align-content: center;
}

.sites-mini-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  border: none;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.5);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
  transition: transform 160ms ease, background 160ms ease, box-shadow 160ms ease;
}

.sites-mini-link:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.72);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.72),
    0 8px 18px rgba(14, 165, 233, 0.1);
}

.sites-mini-link--add {
  color: #0f766e;
  cursor: pointer;
}

.sites-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.sites-kicker {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #64748b;
}

.sites-subtitle {
  margin-top: 3px;
  font-size: 11px;
  color: #64748b;
}

.sites-manage-btn {
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.54);
  color: #0f766e;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 140ms ease;
}

.sites-manage-btn:hover {
  background: rgba(255, 255, 255, 0.75);
}

.sites-wide-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  flex: 1;
  margin-top: 12px;
  align-content: start;
}

.sites-tile {
  display: flex;
  min-height: 58px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 16px;
  border: none;
  background: rgba(255, 255, 255, 0.48);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.58);
  padding: 8px 6px;
  transition: transform 160ms ease, background 160ms ease, box-shadow 160ms ease;
}

.sites-tile:hover,
.sites-card:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.72);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.75),
    0 10px 22px rgba(14, 165, 233, 0.1);
}

.sites-tile__name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 500;
  color: #334155;
}

.sites-tile--add {
  color: #0f766e;
  cursor: pointer;
}

.sites-tile__plus,
.sites-card__plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 12px;
  background: rgba(14, 165, 233, 0.12);
  font-size: 18px;
  line-height: 1;
}

.sites-large-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  flex: 1;
  margin-top: 14px;
  align-content: start;
}

.sites-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 10px;
  border-radius: 18px;
  border: none;
  background: rgba(255, 255, 255, 0.48);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.58);
  padding: 12px 10px;
  transition: transform 160ms ease, background 160ms ease, box-shadow 160ms ease;
}

.sites-card__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
}

.sites-card__meta {
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: #64748b;
}

.sites-card--add {
  color: #0f766e;
  cursor: pointer;
}

.sites-footer {
  margin-top: 10px;
  font-size: 10px;
  color: #64748b;
}
</style>
