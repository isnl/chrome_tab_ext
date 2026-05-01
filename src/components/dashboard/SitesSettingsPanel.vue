<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

import SiteAvatar from "@/components/sites/SiteAvatar.vue";
import { getNormalizedSiteHostname, useSites } from "@/composables/useSites";
import type { SiteShortcut } from "@/types/sites";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const sites = useSites();

type SiteEditDraft = {
  name: string;
  url: string;
};

const manualName = ref("");
const manualUrl = ref("");
const historyQuery = ref("");
const feedbackText = ref("");
const feedbackTone = ref<"success" | "error" | "info">("info");
const editDrafts = ref<Record<string, SiteEditDraft>>({});

let searchTimer: number | null = null;

const orderedSites = computed(() => [...sites.items.value].sort((left, right) => left.order - right.order));
const existingHostnames = computed(() => new Set(orderedSites.value.map((item) => item.hostname.toLowerCase())));

function setFeedback(message: string, tone: "success" | "error" | "info" = "info") {
  feedbackText.value = message;
  feedbackTone.value = tone;
}

function syncEditDrafts(force = false) {
  const nextDrafts = { ...editDrafts.value };
  const validIds = new Set<string>();

  orderedSites.value.forEach((item) => {
    validIds.add(item.id);
    if (force || !nextDrafts[item.id]) {
      nextDrafts[item.id] = {
        name: item.name,
        url: item.url
      };
    }
  });

  Object.keys(nextDrafts).forEach((id) => {
    if (!validIds.has(id)) {
      delete nextDrafts[id];
    }
  });

  editDrafts.value = nextDrafts;
}

function clearSearchTimer() {
  if (searchTimer !== null) {
    window.clearTimeout(searchTimer);
    searchTimer = null;
  }
}

function formatVisitTime(value?: number) {
  if (!value) {
    return "最近访问时间未知";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function isExistingHistoryItem(url: string) {
  const hostname = getNormalizedSiteHostname(url);
  return hostname ? existingHostnames.value.has(hostname.toLowerCase()) : false;
}

function handleManualAdd() {
  const result = sites.addSite(manualUrl.value, manualName.value || undefined);

  if (!result.ok) {
    if (result.reason === "invalid-url") {
      setFeedback("请输入有效的网址，支持直接写域名，例如 github.com。", "error");
      return;
    }

    if (result.reason === "duplicate") {
      setFeedback("这个网站已经在导航里了。", "error");
      return;
    }

    setFeedback(`最多添加 ${sites.maxSites} 个网站，删掉一些再继续。`, "error");
    return;
  }

  manualName.value = "";
  manualUrl.value = "";
  setFeedback(`已添加 ${result.item.name}`, "success");
  syncEditDrafts(true);
}

function handleHistoryAdd(url: string, title: string) {
  const result = sites.addHistorySite({
    url,
    title,
    hostname: getNormalizedSiteHostname(url) ?? "",
    sourceUrl: url
  });

  if (!result.ok) {
    if (result.reason === "duplicate") {
      setFeedback("这个网站已经在导航里了。", "error");
      return;
    }

    if (result.reason === "limit") {
      setFeedback(`最多添加 ${sites.maxSites} 个网站。`, "error");
      return;
    }

    setFeedback("这个历史记录网址暂时无法添加。", "error");
    return;
  }

  setFeedback(`已添加 ${result.item.name}`, "success");
  syncEditDrafts(true);
}

function handleEditCommit(item: SiteShortcut) {
  const draft = editDrafts.value[item.id];
  if (!draft) {
    return;
  }

  const result = sites.updateSite(item.id, {
    name: draft.name,
    url: draft.url
  });

  if (!result.ok) {
    if (result.reason === "invalid-url") {
      setFeedback("网址无效，支持直接写域名，例如 github.com。", "error");
      return;
    }

    if (result.reason === "duplicate") {
      setFeedback("这个网站已经在导航里了。", "error");
      return;
    }

    setFeedback("这个网站已经不存在。", "error");
    return;
  }

  editDrafts.value = {
    ...editDrafts.value,
    [item.id]: {
      name: result.item.name,
      url: result.item.url
    }
  };
  setFeedback(`已更新 ${result.item.name}`, "success");
}

function handleRemove(item: SiteShortcut) {
  sites.removeSite(item.id);
  setFeedback(`已删除 ${item.name}`, "info");
}

async function handleRequestPermission() {
  const granted = await sites.ensureHistoryPermission();
  if (granted) {
    await sites.searchHistory(historyQuery.value);
  }
}

watch(
  () => props.open,
  async (open) => {
    clearSearchTimer();

    if (!open) {
      return;
    }

    syncEditDrafts(true);
    await sites.refreshHistoryPermission();
    if (sites.historyPermissionGranted.value) {
      await sites.searchHistory(historyQuery.value);
    }
  },
  { immediate: true }
);

watch(orderedSites, () => {
  syncEditDrafts();
});

watch(historyQuery, (value) => {
  clearSearchTimer();

  if (!props.open || !sites.historyPermissionGranted.value) {
    return;
  }

  searchTimer = window.setTimeout(() => {
    void sites.searchHistory(value);
  }, value.trim() ? 220 : 120);
});

onBeforeUnmount(() => {
  clearSearchTimer();
});
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
      <div v-if="open" class="sites-overlay" @click.self="emit('close')">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-4 scale-95 opacity-0"
          enter-to-class="translate-y-0 scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 scale-100 opacity-100"
          leave-to-class="translate-y-4 scale-95 opacity-0"
          appear
        >
          <section v-if="open" class="sites-panel" @keydown.escape="emit('close')">
            <div class="sites-panel__header">
              <div>
                <h3 class="sites-panel__title">添加常用网站</h3>
                <p class="sites-panel__subtitle">支持手动输入网址，或直接从浏览历史里快速搜索添加。</p>
              </div>
              <button class="sites-panel__close" type="button" aria-label="关闭" @click="emit('close')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            <p
              v-if="feedbackText"
              class="sites-panel__feedback"
              :class="{
                'sites-panel__feedback--success': feedbackTone === 'success',
                'sites-panel__feedback--error': feedbackTone === 'error'
              }"
            >
              {{ feedbackText }}
            </p>

            <section class="sites-block sites-block--manual">
              <div class="sites-block__header">
                <div>
                  <p class="sites-block__kicker">手动添加</p>
                  <p class="sites-block__title">输入网址</p>
                </div>
              </div>

              <form class="manual-form" @submit.prevent="handleManualAdd">
                <label class="manual-form__field">
                  <span>网站名称</span>
                  <input
                    v-model="manualName"
                    class="manual-form__input"
                    type="text"
                    autocomplete="off"
                    placeholder="可选，留空自动取站点名"
                  />
                </label>

                <label class="manual-form__field manual-form__field--url">
                  <span>网址</span>
                  <input
                    v-model="manualUrl"
                    class="manual-form__input"
                    type="text"
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="例如 github.com"
                  />
                </label>

                <button
                  class="manual-form__submit"
                  type="submit"
                  :disabled="!manualUrl.trim() || !sites.canAddMore.value"
                >
                  添加到导航
                </button>
              </form>
            </section>

            <div class="sites-panel__columns">
              <section class="sites-block sites-block--list">
                <div class="sites-block__header">
                  <div>
                    <p class="sites-block__kicker">已添加</p>
                    <p class="sites-block__title">{{ sites.itemCount.value }} / {{ sites.maxSites }}</p>
                  </div>
                </div>

                <div class="sites-list">
                  <div
                    v-for="item in orderedSites"
                    :key="item.id"
                    class="sites-list__item"
                  >
                    <SiteAvatar :url="item.url" :label="item.name" :size="32" :radius="12" />

                    <div v-if="editDrafts[item.id]" class="sites-list__fields">
                      <label class="site-edit-field">
                        <span>标题</span>
                        <input
                          v-model="editDrafts[item.id].name"
                          class="site-edit-field__input"
                          type="text"
                          autocomplete="off"
                          @blur="handleEditCommit(item)"
                          @keydown.enter.prevent="handleEditCommit(item)"
                        />
                      </label>

                      <label class="site-edit-field site-edit-field--url">
                        <span>地址</span>
                        <input
                          v-model="editDrafts[item.id].url"
                          class="site-edit-field__input"
                          type="text"
                          autocomplete="off"
                          spellcheck="false"
                          @blur="handleEditCommit(item)"
                          @keydown.enter.prevent="handleEditCommit(item)"
                        />
                      </label>
                    </div>

                    <button
                      class="sites-list__remove"
                      type="button"
                      @click="handleRemove(item)"
                    >
                      删除
                    </button>
                  </div>

                  <div v-if="!orderedSites.length" class="sites-list__empty">
                    添加后会出现在这里。
                  </div>
                </div>
              </section>

              <section class="sites-block sites-block--history">
                <div class="sites-block__header">
                  <div>
                    <p class="sites-block__kicker">浏览历史</p>
                    <p class="sites-block__title">快速搜索网站</p>
                  </div>
                  <button
                    v-if="sites.historyPermissionGranted.value"
                    class="history-refresh"
                    type="button"
                    :disabled="sites.isSearchingHistory.value"
                    @click="sites.searchHistory(historyQuery)"
                  >
                    刷新
                  </button>
                </div>

                <template v-if="!sites.historySupported.value">
                  <div class="history-state">
                    当前环境不支持浏览历史搜索。打包成扩展后，在新标签页里就能使用这个能力。
                  </div>
                </template>

                <template v-else-if="!sites.historyPermissionGranted.value">
                  <div class="history-state">
                    <p>{{ sites.historyMessage.value }}</p>
                    <button
                      class="history-authorize"
                      type="button"
                      :disabled="sites.isRequestingPermission.value"
                      @click="handleRequestPermission"
                    >
                      {{ sites.isRequestingPermission.value ? "请求授权中..." : "授权读取浏览历史" }}
                    </button>
                  </div>
                </template>

                <template v-else>
                  <input
                    v-model="historyQuery"
                    class="history-search"
                    type="search"
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="搜索站点标题或域名，留空可看最近访问"
                  />

                  <p class="history-message">
                    {{ sites.isSearchingHistory.value ? "搜索中..." : sites.historyMessage.value }}
                  </p>

                  <div class="history-results">
                    <button
                      v-for="item in sites.historyResults.value"
                      :key="item.hostname"
                      class="history-result"
                      type="button"
                      :disabled="isExistingHistoryItem(item.url) || !sites.canAddMore.value"
                      @click="handleHistoryAdd(item.url, item.title)"
                    >
                      <div class="history-result__main">
                        <SiteAvatar :url="item.url" :label="item.title" :size="32" :radius="12" />
                        <div class="history-result__text">
                          <p class="history-result__title">{{ item.title }}</p>
                          <p class="history-result__meta">{{ item.hostname }}</p>
                          <p class="history-result__time">{{ formatVisitTime(item.lastVisitTime) }}</p>
                        </div>
                      </div>

                      <span
                        class="history-result__badge"
                        :class="{ 'history-result__badge--muted': isExistingHistoryItem(item.url) || !sites.canAddMore.value }"
                      >
                        {{ isExistingHistoryItem(item.url) ? "已添加" : sites.canAddMore.value ? "添加" : "已满" }}
                      </span>
                    </button>
                  </div>
                </template>
              </section>
            </div>
          </section>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sites-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(4px);
}

.sites-panel {
  width: min(1180px, 94vw);
  max-height: min(88vh, 900px);
  overflow: auto;
  padding: 22px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px) saturate(1.5);
  box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.16);
}

.sites-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.sites-panel__title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.sites-panel__subtitle {
  margin-top: 5px;
  font-size: 13px;
  color: #64748b;
}

.sites-panel__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 140ms ease;
}

.sites-panel__close:hover {
  background: rgba(15, 23, 42, 0.05);
  color: #475569;
}

.sites-panel__feedback {
  margin-top: 14px;
  border-radius: 14px;
  padding: 10px 12px;
  font-size: 12px;
  color: #0f766e;
  background: rgba(16, 185, 129, 0.08);
}

.sites-panel__feedback--error {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.1);
}

.sites-panel__feedback--success {
  color: #047857;
  background: rgba(16, 185, 129, 0.1);
}

.sites-panel__columns {
  display: grid;
  grid-template-columns: minmax(360px, 0.92fr) minmax(420px, 1.18fr);
  gap: 16px;
  margin-top: 16px;
}

.sites-block {
  border-radius: 20px;
  background: rgba(248, 250, 252, 0.72);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.72);
  padding: 16px;
}

.sites-block--manual {
  margin-top: 16px;
}

.sites-block--history,
.sites-block--list {
  min-height: 520px;
}

.sites-block__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.sites-block__kicker {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #64748b;
}

.sites-block__title {
  margin-top: 4px;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.manual-form {
  display: grid;
  grid-template-columns: minmax(180px, 0.7fr) minmax(280px, 1fr) auto;
  align-items: end;
  gap: 12px;
  margin-top: 14px;
}

.manual-form__field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #475569;
}

.manual-form__input,
.history-search,
.site-edit-field__input {
  width: 100%;
  height: 42px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.82);
  padding: 0 14px;
  font-size: 14px;
  color: #0f172a;
  outline: none;
  transition: all 150ms ease;
}

.site-edit-field__input {
  height: 34px;
  border-radius: 11px;
  padding: 0 10px;
  font-size: 12px;
}

.manual-form__input:focus,
.history-search:focus,
.site-edit-field__input:focus {
  border-color: rgba(14, 165, 233, 0.34);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.08);
}

.manual-form__submit,
.history-authorize,
.history-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  border: none;
  border-radius: 13px;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: white;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease, opacity 140ms ease;
  box-shadow: 0 12px 24px -12px rgba(37, 99, 235, 0.55);
}

.manual-form__submit:hover,
.history-authorize:hover,
.history-refresh:hover {
  transform: translateY(-1px);
}

.manual-form__submit:disabled,
.history-authorize:disabled,
.history-refresh:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.sites-list {
  display: flex;
  max-height: 462px;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
  overflow: auto;
  padding-right: 2px;
}

.sites-list__item {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  padding: 10px;
}

.sites-list__fields {
  display: grid;
  grid-template-columns: minmax(92px, 0.52fr) minmax(140px, 1fr);
  gap: 8px;
  min-width: 0;
}

.site-edit-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
}

.sites-list__remove {
  flex-shrink: 0;
  white-space: nowrap;
  border: none;
  border-radius: 11px;
  background: rgba(254, 226, 226, 0.64);
  color: #b91c1c;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 140ms ease;
}

.sites-list__remove:hover {
  background: rgba(254, 202, 202, 0.8);
}

.sites-list__empty {
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.56);
  padding: 18px 14px;
  font-size: 12px;
  color: #64748b;
  text-align: center;
}

.history-refresh {
  padding: 8px 12px;
  font-size: 12px;
}

.history-state {
  display: flex;
  min-height: 180px;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.62);
  padding: 18px;
  margin-top: 14px;
  font-size: 13px;
  color: #475569;
}

.history-search {
  margin-top: 14px;
}

.history-message {
  margin-top: 10px;
  font-size: 12px;
  color: #64748b;
}

.history-results {
  display: flex;
  max-height: 416px;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  overflow: auto;
  padding-right: 2px;
}

.history-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  gap: 12px;
  border: none;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  padding: 12px;
  cursor: pointer;
  text-align: left;
  transition: transform 140ms ease, background 140ms ease, opacity 140ms ease;
}

.history-result:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.88);
}

.history-result:disabled {
  opacity: 0.72;
  cursor: default;
  transform: none;
}

.history-result__main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.history-result__text {
  min-width: 0;
}

.history-result__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.history-result__meta,
.history-result__time {
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: #64748b;
}

.history-result__badge {
  flex-shrink: 0;
  white-space: nowrap;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.14);
  color: #0369a1;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 700;
}

.history-result__badge--muted {
  background: rgba(226, 232, 240, 0.85);
  color: #64748b;
}

@media (max-width: 1020px) {
  .manual-form,
  .sites-panel__columns {
    grid-template-columns: 1fr;
  }

  .sites-block--history,
  .sites-block--list {
    min-height: auto;
  }

  .sites-list,
  .history-results {
    max-height: 360px;
  }
}

@media (max-width: 640px) {
  .sites-panel {
    padding: 18px;
  }

  .sites-list__item {
    grid-template-columns: 32px minmax(0, 1fr);
  }

  .sites-list__fields {
    grid-column: 2;
    grid-template-columns: 1fr;
  }

  .sites-list__remove {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
