<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

import MarkdownRenderer from "@/components/common/MarkdownRenderer.vue";
import {
  createBookmarkContextStats,
  formatTokenCount,
  useBookmarkSearch,
  type BookmarkContextStats,
  type BookmarkFolderOption,
  type BookmarkSearchSourceItem
} from "@/composables/useBookmarkSearch";
import { useAiChat } from "@/composables/useAiChat";
import type { AiChatConversation } from "@/types/aiChat";

import AiModelPicker from "./AiModelPicker.vue";

const props = defineProps<{
  open: boolean;
  loading: boolean;
  streamingConversationId: string | null;
  streamingMessageId: string | null;
  titleGeneratingConversationId: string | null;
}>();

const emit = defineEmits<{
  close: [];
  abort: [];
  send: [prompt: string];
}>();

const aiChat = useAiChat();
const bookmarkSearch = useBookmarkSearch();
const scrollEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLTextAreaElement | null>(null);
const draftMessage = ref("");
const searchText = ref("");
const editingId = ref<string | null>(null);
const editingTitle = ref("");
const pendingDeleteId = ref<string | null>(null);
const bookmarkNotice = ref("");
const bookmarkContextOpen = ref(false);
const bookmarkInventoryLoading = ref(false);
const bookmarkInventoryError = ref("");
const bookmarkFolders = ref<BookmarkFolderOption[]>([]);
const bookmarkItems = ref<BookmarkSearchSourceItem[]>([]);
const bookmarkStats = ref<BookmarkContextStats | null>(null);
const bookmarkFolderFilter = ref("");
let bookmarkNoticeTimer = 0;
let bookmarkInventoryRequestId = 0;

const activeConversation = computed(() => aiChat.activeConversation.value);
const activeModelId = computed({
  get: () => aiChat.config.value.activeModelId,
  set: (value: string) => aiChat.setActiveModel(value)
});
const activeModelSupportsDeepThinking = computed(() => Boolean(aiChat.activeModel.value?.supportsDeepThinking));
const deepThinkingEnabled = computed({
  get: () => aiChat.config.value.deepThinking && activeModelSupportsDeepThinking.value,
  set: (value: boolean) => aiChat.setDeepThinking(value)
});
const bookmarkSearchEnabled = computed(() => aiChat.config.value.bookmarkSearch);
const bookmarkSearchScope = computed(() => aiChat.config.value.bookmarkSearchScope);
const selectedBookmarkFolderIds = computed(() => aiChat.config.value.bookmarkFolderIds);
const selectedBookmarkFolderIdSet = computed(() => new Set(selectedBookmarkFolderIds.value));
const activeBookmarkFolderIdSet = computed(() => {
  if (bookmarkSearchScope.value === "custom") {
    return selectedBookmarkFolderIdSet.value;
  }

  return new Set(bookmarkFolders.value.map((folder) => folder.id));
});
const bookmarkSearchSwitchTitle = computed(() => {
  if (!bookmarkSearch.supported.value) {
    return "点击查看书签搜索不可用原因";
  }

  if (bookmarkSearch.isRequestingPermission.value) {
    return "正在请求书签权限";
  }

  return bookmarkSearchEnabled.value ? "关闭书签搜索" : "开启书签搜索";
});
const bookmarkContextSummary = computed(() => {
  if (!bookmarkSearchEnabled.value) {
    return "书签上下文";
  }

  if (bookmarkInventoryLoading.value && !bookmarkStats.value) {
    return "估算中";
  }

  if (!bookmarkStats.value) {
    return "估算上下文";
  }

  return `约 ${formatTokenCount(bookmarkStats.value.estimatedTokens)} tokens`;
});
const bookmarkContextDetail = computed(() => {
  if (bookmarkInventoryError.value) {
    return bookmarkInventoryError.value;
  }

  if (!bookmarkStats.value) {
    return bookmarkInventoryLoading.value ? "正在读取书签目录" : "打开后读取书签目录";
  }

  const stats = bookmarkStats.value;
  const scopeText =
    bookmarkSearchScope.value === "custom"
      ? `自选 ${stats.selectedFolderCount} 个文件夹`
      : `全部 ${stats.folderCount} 个文件夹`;

  return `${scopeText}，${stats.includedBookmarks}/${stats.totalBookmarks} 条书签，约 ${formatTokenCount(stats.estimatedTokens)} tokens`;
});
const bookmarkContextButtonTitle = computed(() =>
  bookmarkStats.value
    ? `书签上下文：${bookmarkContextDetail.value}`
    : "查看书签上下文占用并选择文件夹"
);
const filteredBookmarkFolders = computed(() => {
  const keyword = bookmarkFolderFilter.value.trim().toLowerCase();
  if (!keyword) {
    return bookmarkFolders.value;
  }

  return bookmarkFolders.value.filter((folder) =>
    `${folder.title} ${folder.folderPath}`.toLowerCase().includes(keyword)
  );
});

const sortedConversations = computed(() =>
  [...aiChat.conversations.value].sort((left, right) => right.updatedAt - left.updatedAt)
);

const filteredConversations = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  if (!keyword) {
    return sortedConversations.value;
  }

  return sortedConversations.value.filter((conversation) => conversation.title.toLowerCase().includes(keyword));
});

const conversationGroups = computed(() => {
  const groups: { label: string; conversations: AiChatConversation[] }[] = [];
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const conversation of filteredConversations.value) {
    const updatedAt = conversation.updatedAt;
    let label = "更早";

    if (updatedAt >= startOfToday) {
      label = "今天";
    } else if (updatedAt >= startOfToday - dayMs) {
      label = "昨天";
    } else if (updatedAt >= startOfToday - 7 * dayMs) {
      label = "过去 7 天";
    } else if (updatedAt >= startOfToday - 30 * dayMs) {
      label = "过去 30 天";
    } else {
      const date = new Date(updatedAt);
      label = date.getFullYear() === now.getFullYear()
        ? `${date.getMonth() + 1} 月`
        : `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
    }

    const group = groups.find((item) => item.label === label);
    if (group) {
      group.conversations.push(conversation);
    } else {
      groups.push({ label, conversations: [conversation] });
    }
  }

  return groups;
});

const canSend = computed(() => Boolean(draftMessage.value.trim()) && !props.loading);

const statusText = computed(() => {
  if (props.loading) {
    return bookmarkSearchEnabled.value ? "正在检索书签并生成回复" : "正在生成回复";
  }

  if (props.titleGeneratingConversationId === activeConversation.value?.id) {
    return "正在生成标题";
  }

  const count = activeConversation.value?.messages.length ?? 0;
  return count ? `${count} 条消息` : "可以开始新话题";
});

function closeModal() {
  emit("close");
}

function toggleDeepThinking() {
  if (!activeModelSupportsDeepThinking.value) {
    return;
  }

  deepThinkingEnabled.value = !deepThinkingEnabled.value;
}

function showBookmarkNotice(message: string) {
  window.clearTimeout(bookmarkNoticeTimer);
  bookmarkNotice.value = message;
  bookmarkNoticeTimer = window.setTimeout(() => {
    bookmarkNotice.value = "";
  }, 3200);
}

function bookmarkScopeFolderIds() {
  return aiChat.config.value.bookmarkSearchScope === "custom" ? aiChat.config.value.bookmarkFolderIds : null;
}

function updateBookmarkStats(scope = aiChat.config.value.bookmarkSearchScope, folderIds = aiChat.config.value.bookmarkFolderIds) {
  const selectedFolderIds = scope === "custom" ? folderIds : null;
  bookmarkStats.value = createBookmarkContextStats(bookmarkItems.value, selectedFolderIds, bookmarkFolders.value.length);
}

async function refreshBookmarkInventory() {
  const requestId = bookmarkInventoryRequestId + 1;
  bookmarkInventoryRequestId = requestId;

  if (!bookmarkSearchEnabled.value) {
    bookmarkItems.value = [];
    bookmarkStats.value = null;
    bookmarkInventoryError.value = "";
    bookmarkInventoryLoading.value = false;
    return;
  }

  bookmarkInventoryLoading.value = true;
  bookmarkInventoryError.value = "";

  try {
    await bookmarkSearch.initialize();
    const granted = bookmarkSearch.permissionGranted.value || (await bookmarkSearch.refreshPermission());
    if (!granted) {
      throw new Error("需要授权访问收藏夹后才能估算书签上下文。");
    }

    const inventory = await bookmarkSearch.loadBookmarkInventory(bookmarkScopeFolderIds());
    if (requestId !== bookmarkInventoryRequestId) {
      return;
    }

    bookmarkFolders.value = inventory.folders;
    bookmarkItems.value = inventory.items;
    bookmarkStats.value = inventory.stats;
  } catch (error) {
    if (requestId !== bookmarkInventoryRequestId) {
      return;
    }

    bookmarkInventoryError.value = error instanceof Error ? error.message : "书签上下文估算失败。";
    bookmarkStats.value = null;
  } finally {
    if (requestId === bookmarkInventoryRequestId) {
      bookmarkInventoryLoading.value = false;
    }
  }
}

function toggleBookmarkContextPanel() {
  if (!bookmarkSearchEnabled.value) {
    return;
  }

  bookmarkContextOpen.value = !bookmarkContextOpen.value;
  if (bookmarkContextOpen.value) {
    void refreshBookmarkInventory();
  }
}

function setBookmarkScope(scope: "all" | "custom") {
  let nextFolderIds = selectedBookmarkFolderIds.value;

  if (scope === "custom" && bookmarkSearchScope.value !== "custom" && !selectedBookmarkFolderIds.value.length) {
    nextFolderIds = bookmarkFolders.value.map((folder) => folder.id);
    aiChat.setBookmarkFolderIds(nextFolderIds);
  }

  aiChat.setBookmarkSearchScope(scope);
  updateBookmarkStats(scope, nextFolderIds);
}

function toggleBookmarkFolder(folderId: string) {
  const currentIds =
    bookmarkSearchScope.value === "custom"
      ? selectedBookmarkFolderIds.value
      : bookmarkFolders.value.map((folder) => folder.id);
  const nextIds = currentIds.includes(folderId)
    ? currentIds.filter((id) => id !== folderId)
    : [...currentIds, folderId];

  aiChat.setBookmarkSearchScope("custom");
  aiChat.setBookmarkFolderIds(nextIds);
  updateBookmarkStats("custom", nextIds);
}

function selectAllBookmarkFolders() {
  const nextIds = bookmarkFolders.value.map((folder) => folder.id);
  aiChat.setBookmarkSearchScope("custom");
  aiChat.setBookmarkFolderIds(nextIds);
  updateBookmarkStats("custom", nextIds);
}

function invertBookmarkFolderSelection() {
  const activeIds = activeBookmarkFolderIdSet.value;
  const nextIds = bookmarkFolders.value.map((folder) => folder.id).filter((id) => !activeIds.has(id));
  aiChat.setBookmarkSearchScope("custom");
  aiChat.setBookmarkFolderIds(nextIds);
  updateBookmarkStats("custom", nextIds);
}

async function toggleBookmarkSearch() {
  if (bookmarkSearchEnabled.value) {
    aiChat.setBookmarkSearch(false);
    bookmarkContextOpen.value = false;
    showBookmarkNotice("书签搜索已关闭");
    return;
  }

  const granted = await bookmarkSearch.ensurePermission();
  aiChat.setBookmarkSearch(granted);
  showBookmarkNotice(granted ? "书签搜索已开启" : bookmarkSearch.message.value);
  if (granted) {
    bookmarkContextOpen.value = true;
  }
}

function createConversation() {
  pendingDeleteId.value = null;
  editingId.value = null;
  aiChat.createConversation();
}

function selectConversation(id: string) {
  pendingDeleteId.value = null;
  editingId.value = null;
  aiChat.setActiveConversation(id);
}

function startRename(conversation: AiChatConversation) {
  pendingDeleteId.value = null;
  editingId.value = conversation.id;
  editingTitle.value = conversation.title;
}

function commitRename() {
  if (!editingId.value) {
    return;
  }

  aiChat.renameConversation(editingId.value, editingTitle.value);
  editingId.value = null;
  editingTitle.value = "";
}

function cancelRename() {
  editingId.value = null;
  editingTitle.value = "";
}

function requestDelete(id: string) {
  if (pendingDeleteId.value === id) {
    aiChat.deleteConversation(id);
    pendingDeleteId.value = null;
    return;
  }

  pendingDeleteId.value = id;
}

function submitDraft() {
  const prompt = draftMessage.value.trim();
  if (!prompt || props.loading) {
    return;
  }

  draftMessage.value = "";
  emit("send", prompt);
  void nextTick(() => {
    inputEl.value?.focus();
  });
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submitDraft();
  }
}

function isMessageStreaming(messageId: string) {
  return props.loading && props.streamingMessageId === messageId;
}

function isConversationBusy(conversationId: string) {
  return props.loading && props.streamingConversationId === conversationId;
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      draftMessage.value = "";
      searchText.value = "";
      editingId.value = null;
      pendingDeleteId.value = null;
      return;
    }

    await Promise.all([aiChat.initialize(), bookmarkSearch.initialize()]);
    if (aiChat.config.value.bookmarkSearch && !bookmarkSearch.permissionGranted.value) {
      aiChat.setBookmarkSearch(false);
    }
    await nextTick();
    scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight });
  },
  { immediate: true }
);

watch(
  () => [props.open, bookmarkSearchEnabled.value],
  () => {
    if (props.open && bookmarkSearchEnabled.value) {
      void refreshBookmarkInventory();
      return;
    }

    bookmarkContextOpen.value = false;
  }
);

watch(
  () => [aiChat.config.value.bookmarkSearchScope, aiChat.config.value.bookmarkFolderIds.join("|")],
  () => {
    if (!props.open || !bookmarkSearchEnabled.value) {
      return;
    }

    if (bookmarkItems.value.length || bookmarkFolders.value.length || bookmarkStats.value) {
      updateBookmarkStats();
      return;
    }

    void refreshBookmarkInventory();
  }
);

watch(
  () =>
    activeConversation.value?.messages
      .map((message) => `${message.id}:${message.content.length}:${message.error ?? ""}`)
      .join("|"),
  async () => {
    await nextTick();
    scrollEl.value?.scrollTo({
      top: scrollEl.value.scrollHeight,
      behavior: "smooth"
    });
  }
);

onBeforeUnmount(() => {
  window.clearTimeout(bookmarkNoticeTimer);
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
      <div v-if="open" class="ai-dialog-overlay">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-5 scale-[0.98] opacity-0"
          enter-to-class="translate-y-0 scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 scale-100 opacity-100"
          leave-to-class="translate-y-4 scale-[0.98] opacity-0"
          appear
        >
          <section v-if="open" class="ai-dialog" aria-modal="true" role="dialog">
            <aside class="ai-dialog__sidebar">
              <div class="ai-history__header">
                <div>
                  <h3 class="ai-history__title">对话记录</h3>
                  <p class="ai-history__count">{{ aiChat.conversations.value.length }} 个会话</p>
                </div>

                <button class="ai-history__new" type="button" aria-label="新建对话" title="新建对话" @click="createConversation">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v14"/><path d="M5 12h14"/>
                  </svg>
                </button>
              </div>

              <label class="ai-history__search">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <input v-model="searchText" type="search" placeholder="搜索标题" />
              </label>

              <div class="ai-history__list scroll-soft">
                <section v-for="group in conversationGroups" :key="group.label" class="ai-history-group">
                  <p class="ai-history-group__title">{{ group.label }}</p>
                  <button
                    v-for="conversation in group.conversations"
                    :key="conversation.id"
                    class="ai-history-item"
                    :class="{ 'ai-history-item--active': conversation.id === aiChat.activeConversationId.value }"
                    type="button"
                    @click="selectConversation(conversation.id)"
                  >
                    <div v-if="editingId === conversation.id" class="ai-history-item__edit" @click.stop>
                      <input
                        v-model="editingTitle"
                        class="ai-history-item__input"
                        type="text"
                        autocomplete="off"
                        autofocus
                        @keydown.enter.prevent="commitRename"
                        @keydown.escape.prevent="cancelRename"
                      />
                      <button type="button" class="ai-history-item__mini" aria-label="保存标题" @click="commitRename">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </button>
                    </div>

                    <template v-else>
                      <span class="ai-history-item__title">{{ conversation.title }}</span>
                      <span class="ai-history-item__actions">
                        <span v-if="props.titleGeneratingConversationId === conversation.id" class="ai-history-item__saving">生成中</span>
                        <button
                          class="ai-history-item__icon"
                          type="button"
                          aria-label="编辑标题"
                          title="编辑标题"
                          :disabled="isConversationBusy(conversation.id)"
                          @click.stop="startRename(conversation)"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                          </svg>
                        </button>
                        <button
                          class="ai-history-item__icon ai-history-item__icon--danger"
                          type="button"
                          :aria-label="pendingDeleteId === conversation.id ? '确认删除' : '删除对话'"
                          :title="pendingDeleteId === conversation.id ? '确认删除' : '删除对话'"
                          :disabled="isConversationBusy(conversation.id)"
                          @click.stop="requestDelete(conversation.id)"
                        >
                          <span v-if="pendingDeleteId === conversation.id" class="ai-history-item__confirm">确认</span>
                          <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                          </svg>
                        </button>
                      </span>
                    </template>
                  </button>
                </section>

                <p v-if="!conversationGroups.length" class="ai-history__empty">没有匹配的对话</p>
              </div>
            </aside>

            <main class="ai-dialog__main">
              <header class="ai-dialog__header">
                <div class="ai-dialog__mark">AI</div>

                <div class="min-w-0 flex-1">
                  <h3 class="ai-dialog__title">{{ activeConversation?.title ?? "AI 对话" }}</h3>
                  <p class="ai-dialog__status">{{ statusText }}</p>
                </div>

                <button class="ai-dialog__close" type="button" aria-label="close" title="close" @click="closeModal">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              </header>

              <div ref="scrollEl" class="ai-dialog__body scroll-soft">
                <div v-if="activeConversation?.messages.length" class="ai-message-list">
                  <section
                    v-for="message in activeConversation.messages"
                    :key="message.id"
                    class="ai-message-row"
                    :class="{
                      'ai-message-row--user': message.role === 'user',
                      'ai-message-row--assistant': message.role === 'assistant'
                    }"
                  >
                    <div v-if="message.role === 'assistant'" class="ai-message-avatar ai-message-avatar--assistant">AI</div>

                    <div class="ai-message-content">
                      <div class="ai-message-bubble">
                        <MarkdownRenderer
                          v-if="message.role === 'assistant' && message.content"
                          :content="message.content"
                        />
                        <p v-else-if="message.content" class="ai-message-text">{{ message.content }}</p>
                        <div v-else-if="isMessageStreaming(message.id)" class="ai-message-loading" aria-label="生成中">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <p v-if="message.error" class="ai-message-error">{{ message.error }}</p>
                        <span v-if="isMessageStreaming(message.id) && message.content" class="ai-message-cursor"></span>
                      </div>
                    </div>

                    <div v-if="message.role === 'user'" class="ai-message-avatar ai-message-avatar--user">你</div>
                  </section>
                </div>

                <section v-else class="ai-dialog__empty">
                  <div class="ai-dialog__empty-mark">AI</div>
                  <h4>开始一段新对话</h4>
                  <p>从下方输入问题，左侧会自动沉淀为可搜索、可改名的会话记录。</p>
                </section>
              </div>

              <footer class="ai-dialog__composer">
                <div class="ai-dialog__composer-shell">
                  <textarea
                    ref="inputEl"
                    v-model="draftMessage"
                    class="ai-dialog__input"
                    placeholder="继续追问..."
                    autocomplete="off"
                    spellcheck="true"
                    @keydown="handleKeydown"
                  ></textarea>

                  <Transition
                    enter-active-class="transition duration-150 ease-out"
                    enter-from-class="opacity-0 -translate-y-1"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition duration-100 ease-in"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 -translate-y-1"
                  >
                    <section v-if="bookmarkContextOpen && bookmarkSearchEnabled" class="ai-bookmark-panel">
                      <header class="ai-bookmark-panel__header">
                        <div>
                          <p class="ai-bookmark-panel__title">书签上下文</p>
                          <p class="ai-bookmark-panel__meta">{{ bookmarkContextDetail }}</p>
                        </div>

                        <span v-if="bookmarkInventoryLoading" class="ai-bookmark-panel__loading"></span>
                      </header>

                      <div class="ai-bookmark-panel__modes">
                        <button
                          class="ai-bookmark-panel__mode"
                          :class="{ 'ai-bookmark-panel__mode--active': bookmarkSearchScope === 'all' }"
                          type="button"
                          @click="setBookmarkScope('all')"
                        >
                          全部文件夹
                        </button>
                        <button
                          class="ai-bookmark-panel__mode"
                          :class="{ 'ai-bookmark-panel__mode--active': bookmarkSearchScope === 'custom' }"
                          type="button"
                          @click="setBookmarkScope('custom')"
                        >
                          自选文件夹
                        </button>
                      </div>

                      <div class="ai-bookmark-panel__actions">
                        <button
                          class="ai-bookmark-panel__action"
                          type="button"
                          :disabled="!bookmarkFolders.length"
                          @click="selectAllBookmarkFolders"
                        >
                          全选
                        </button>
                        <button
                          class="ai-bookmark-panel__action"
                          type="button"
                          :disabled="!bookmarkFolders.length"
                          @click="invertBookmarkFolderSelection"
                        >
                          反选
                        </button>
                      </div>

                      <label class="ai-bookmark-panel__search">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                        <input v-model="bookmarkFolderFilter" type="search" placeholder="筛选书签文件夹" />
                      </label>

                      <p v-if="bookmarkInventoryError" class="ai-bookmark-panel__error">{{ bookmarkInventoryError }}</p>

                      <div v-else class="ai-bookmark-panel__folders scroll-soft">
                        <label
                          v-for="folder in filteredBookmarkFolders"
                          :key="folder.id"
                          class="ai-bookmark-folder"
                          :style="{ paddingLeft: `${7 + folder.depth * 12}px` }"
                        >
                          <input
                            type="checkbox"
                            :checked="activeBookmarkFolderIdSet.has(folder.id)"
                            @change="toggleBookmarkFolder(folder.id)"
                          />
                          <span class="ai-bookmark-folder__name">{{ folder.title }}</span>
                          <span class="ai-bookmark-folder__path">{{ folder.folderPath }}</span>
                          <span class="ai-bookmark-folder__count">{{ folder.bookmarkCount }}</span>
                        </label>

                        <p v-if="!bookmarkInventoryLoading && !filteredBookmarkFolders.length" class="ai-bookmark-panel__empty">
                          没有匹配的书签文件夹
                        </p>
                      </div>
                    </section>
                  </Transition>

                  <div class="ai-dialog__tools">
                    <div class="ai-dialog__switches">
                      <AiModelPicker
                        v-model="activeModelId"
                        :models="aiChat.config.value.models"
                      />

                      <button
                        class="ai-bookmark-switch"
                        :class="{ 'ai-bookmark-switch--on': bookmarkSearchEnabled }"
                        type="button"
                        role="switch"
                        :aria-checked="bookmarkSearchEnabled"
                        :disabled="bookmarkSearch.isRequestingPermission.value || props.loading"
                        :title="bookmarkSearchSwitchTitle"
                        @click="toggleBookmarkSearch"
                      >
                        <span class="ai-bookmark-switch__track">
                          <span class="ai-bookmark-switch__thumb"></span>
                        </span>
                        <span class="ai-bookmark-switch__label">书签搜索</span>
                      </button>
                      <span v-if="bookmarkNotice" class="ai-bookmark-notice" :title="bookmarkNotice">{{ bookmarkNotice }}</span>

                      <button
                        v-if="bookmarkSearchEnabled"
                        class="ai-bookmark-context"
                        :class="{ 'ai-bookmark-context--open': bookmarkContextOpen }"
                        type="button"
                        :title="bookmarkContextButtonTitle"
                        @click="toggleBookmarkContextPanel"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M4 5h6l2 2h8v12H4z"/>
                          <path d="M4 10h16"/>
                        </svg>
                        <span>{{ bookmarkContextSummary }}</span>
                      </button>

                      <button
                        v-if="activeModelSupportsDeepThinking"
                        class="ai-thinking-switch"
                        :class="{ 'ai-thinking-switch--on': deepThinkingEnabled }"
                        type="button"
                        role="switch"
                        :aria-checked="deepThinkingEnabled"
                        @click="toggleDeepThinking"
                      >
                        <span class="ai-thinking-switch__track">
                          <span class="ai-thinking-switch__thumb"></span>
                        </span>
                        <span class="ai-thinking-switch__label">深度思考</span>
                      </button>
                    </div>

                    <div class="ai-dialog__actions">
                      <button v-if="props.loading" class="ai-dialog__abort" type="button" @click="emit('abort')">停止</button>
                      <button
                        class="ai-dialog__send"
                        type="button"
                        :disabled="!canSend"
                        aria-label="发送"
                        @click="submitDraft"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round">
                          <path d="m22 2-7 20-4-9-9-4Z"/>
                          <path d="M22 2 11 13"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </footer>
            </main>
          </section>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ai-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.24);
  backdrop-filter: blur(10px) saturate(1.2);
}

.ai-dialog {
  display: grid;
  width: min(1080px, 100%);
  height: min(760px, 88vh);
  min-height: 520px;
  overflow: hidden;
  grid-template-columns: 280px minmax(0, 1fr);
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.74);
  background: rgba(245, 247, 251, 0.96);
  box-shadow: 0 34px 90px -36px rgba(15, 23, 42, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.ai-dialog__sidebar {
  display: flex;
  min-height: 0;
  flex-direction: column;
  border-right: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(241, 245, 249, 0.58));
}

.ai-history__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 16px 12px;
}

.ai-history__title {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  font-weight: 780;
  line-height: 1.2;
}

.ai-history__count {
  margin: 3px 0 0;
  color: #64748b;
  font-size: 11px;
  font-weight: 650;
}

.ai-history__new {
  display: flex;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(20, 184, 166, 0.2);
  border-radius: 12px;
  background: linear-gradient(145deg, #2f80ed, #19b58f);
  color: white;
  box-shadow: 0 14px 30px -22px rgba(47, 128, 237, 0.72);
  transition: filter 140ms ease, transform 140ms ease;
}

.ai-history__new:hover {
  filter: brightness(1.04) saturate(1.08);
  transform: translateY(-1px);
}

.ai-history__search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 14px 12px;
  height: 38px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.78);
  padding: 0 11px;
  color: #94a3b8;
}

.ai-history__search input {
  min-width: 0;
  flex: 1;
  border: none;
  background: transparent;
  caret-color: #0f172a;
  color: #0f172a;
  font-size: 12px;
  font-weight: 650;
  outline: none;
}

.ai-history__search input::placeholder {
  color: #94a3b8;
}

.ai-history__list {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding: 0 10px 14px;
}

.ai-history-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ai-history-group__title {
  margin: 0;
  padding: 0 8px 3px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 760;
}

.ai-history-item {
  display: flex;
  width: 100%;
  min-height: 34px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  padding: 7px 8px;
  color: #334155;
  text-align: left;
  transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
}

.ai-history-item:hover {
  background: rgba(255, 255, 255, 0.74);
}

.ai-history-item--active {
  border-color: rgba(47, 128, 237, 0.22);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 38px -34px rgba(15, 23, 42, 0.34);
}

.ai-history-item__actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  opacity: 0;
  transition: opacity 120ms ease;
}

.ai-history-item:hover .ai-history-item__actions,
.ai-history-item--active .ai-history-item__actions {
  opacity: 1;
}

.ai-history-item__title {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: #0f172a;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-history-item__time {
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
}

.ai-history-item__preview {
  display: -webkit-box;
  overflow: hidden;
  min-height: 32px;
  color: #64748b;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.38;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.ai-history-item__saving {
  min-width: 0;
  flex: 1;
  color: #0f766e;
  font-size: 10px;
  font-weight: 760;
}

.ai-history-item__icon,
.ai-history-item__mini {
  display: inline-flex;
  width: 25px;
  height: 25px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 9px;
  background: rgba(15, 23, 42, 0.04);
  color: #64748b;
  transition: background 140ms ease, color 140ms ease;
}

.ai-history-item__icon:hover,
.ai-history-item__mini:hover {
  background: rgba(47, 128, 237, 0.1);
  color: #2563eb;
}

.ai-history-item__icon--danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.ai-history-item__confirm {
  color: #dc2626;
  font-size: 10px;
  font-weight: 800;
}

.ai-history-item__edit {
  display: flex;
  align-items: center;
  gap: 7px;
}

.ai-history-item__input {
  min-width: 0;
  flex: 1;
  height: 32px;
  border: 1px solid rgba(47, 128, 237, 0.24);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 0 10px;
  caret-color: #0f172a;
  color: #0f172a;
  font-size: 12px;
  font-weight: 700;
  outline: none;
}

.ai-history__empty {
  margin: 18px 8px 0;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 650;
  text-align: center;
}

.ai-dialog__main {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.9), rgba(239, 244, 248, 0.76));
}

.ai-dialog__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 17px 20px 13px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.56);
}

.ai-dialog__mark {
  display: flex;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(145deg, #2f80ed, #19b58f);
  color: white;
  font-size: 12px;
  font-weight: 850;
  box-shadow: 0 16px 34px -24px rgba(47, 128, 237, 0.65);
}

.ai-dialog__title {
  overflow: hidden;
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 780;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-dialog__status {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.ai-dialog__close {
  display: flex;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #94a3b8;
  transition: background 140ms ease, color 140ms ease;
}

.ai-dialog__close:hover {
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
}

.ai-dialog__body {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px 24px;
}

.ai-message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.ai-message-row--user {
  justify-content: flex-end;
}

.ai-message-avatar {
  display: flex;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 850;
}

.ai-message-avatar--assistant {
  background: #f8fafc;
  color: #0f766e;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
}

.ai-message-avatar--user {
  background: linear-gradient(145deg, #21c56d, #15a66b);
  color: white;
}

.ai-message-content {
  min-width: 0;
  max-width: min(660px, 78%);
}

.ai-message-row--user .ai-message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.ai-message-name {
  margin: 0 0 5px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 750;
}

.ai-message-bubble {
  min-width: 0;
  border-radius: 18px 18px 18px 6px;
  background: rgba(255, 255, 255, 0.95);
  padding: 11px 13px;
  color: #1f2937;
  box-shadow: 0 16px 44px -36px rgba(15, 23, 42, 0.34);
}

.ai-message-row--user .ai-message-bubble {
  border-radius: 18px 18px 6px 18px;
  background: #95ec69;
  color: #263b24;
  box-shadow: 0 16px 34px -32px rgba(22, 163, 74, 0.55);
}

.ai-message-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
}

.ai-message-loading {
  display: inline-flex;
  gap: 5px;
  padding: 4px 0;
}

.ai-message-loading span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #19b58f;
  animation: ai-dot 1s infinite ease-in-out;
}

.ai-message-loading span:nth-child(2) {
  animation-delay: 120ms;
}

.ai-message-loading span:nth-child(3) {
  animation-delay: 240ms;
}

.ai-message-error {
  margin: 8px 0 0;
  padding: 9px 11px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.45;
}

.ai-message-cursor {
  display: inline-block;
  width: 7px;
  height: 1.2em;
  margin-left: 3px;
  vertical-align: text-bottom;
  border-radius: 999px;
  background: #19b58f;
  animation: ai-cursor 0.9s infinite;
}

.ai-dialog__empty {
  display: grid;
  height: 100%;
  min-height: 260px;
  place-items: center;
  align-content: center;
  color: #64748b;
  text-align: center;
}

.ai-dialog__empty-mark {
  display: flex;
  width: 58px;
  height: 58px;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  color: #0f766e;
  font-size: 16px;
  font-weight: 860;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
}

.ai-dialog__empty h4 {
  margin: 14px 0 4px;
  color: #0f172a;
  font-size: 16px;
  font-weight: 780;
}

.ai-dialog__empty p {
  max-width: 340px;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.6;
}

.ai-dialog__composer {
  padding: 14px 18px 18px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.74);
}

.ai-dialog__composer-shell {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  padding: 12px 12px 10px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 18px 42px -36px rgba(15, 23, 42, 0.32);
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.ai-dialog__composer-shell:focus-within {
  border-color: rgba(20, 184, 166, 0.28);
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.88);
}

.ai-dialog__input {
  width: 100%;
  height: 80px;
  resize: none;
  border: none;
  background: transparent;
  caret-color: #0f172a;
  padding: 0 2px;
  color: #334155;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.48;
  outline: none;
}

.ai-dialog__input::placeholder {
  color: #94a3b8;
}

.ai-dialog__tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ai-dialog__switches {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.ai-dialog__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-bookmark-switch,
.ai-thinking-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 760;
}

.ai-bookmark-switch:disabled,
.ai-thinking-switch:disabled {
  color: #94a3b8;
  cursor: default;
}

.ai-bookmark-switch__track,
.ai-thinking-switch__track {
  position: relative;
  width: 38px;
  height: 22px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.32);
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.16);
  transition: background 160ms ease;
}

.ai-bookmark-switch__thumb,
.ai-thinking-switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 7px rgba(15, 23, 42, 0.24);
  transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ai-bookmark-switch--on,
.ai-thinking-switch--on {
  color: #0f766e;
}

.ai-bookmark-switch--on .ai-bookmark-switch__track,
.ai-thinking-switch--on .ai-thinking-switch__track {
  background: linear-gradient(145deg, #2f80ed, #19b58f);
}

.ai-bookmark-switch--on .ai-bookmark-switch__thumb,
.ai-thinking-switch--on .ai-thinking-switch__thumb {
  transform: translateX(16px);
}

.ai-bookmark-notice {
  min-width: 0;
  overflow: hidden;
  color: #0f766e;
  font-size: 11px;
  font-weight: 720;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-bookmark-context {
  display: inline-flex;
  max-width: 180px;
  height: 24px;
  align-items: center;
  gap: 5px;
  border: 1px solid rgba(20, 184, 166, 0.14);
  border-radius: 999px;
  background: rgba(240, 253, 250, 0.78);
  padding: 0 8px;
  color: #0f766e;
  font-size: 11px;
  font-weight: 760;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
}

.ai-bookmark-context svg {
  flex: 0 0 auto;
}

.ai-bookmark-context span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-bookmark-context:hover,
.ai-bookmark-context--open {
  border-color: rgba(37, 99, 235, 0.22);
  background: rgba(239, 246, 255, 0.9);
  color: #2563eb;
}

.ai-bookmark-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(240, 253, 250, 0.72));
  padding: 10px;
}

.ai-bookmark-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.ai-bookmark-panel__title {
  margin: 0;
  color: #0f172a;
  font-size: 12px;
  font-weight: 790;
  line-height: 1.2;
}

.ai-bookmark-panel__meta {
  margin: 3px 0 0;
  color: #64748b;
  font-size: 11px;
  font-weight: 650;
  line-height: 1.4;
}

.ai-bookmark-panel__loading {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  border-radius: 50%;
  border: 2px solid rgba(20, 184, 166, 0.18);
  border-top-color: #14b8a6;
  animation: ai-settings-spin 0.7s linear infinite;
}

.ai-bookmark-panel__modes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.ai-bookmark-panel__mode {
  height: 30px;
  border: 1px solid rgba(15, 23, 42, 0.07);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.68);
  color: #475569;
  font-size: 11px;
  font-weight: 760;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
}

.ai-bookmark-panel__mode--active {
  border-color: rgba(20, 184, 166, 0.24);
  background: rgba(20, 184, 166, 0.1);
  color: #0f766e;
}

.ai-bookmark-panel__actions {
  display: flex;
  gap: 6px;
}

.ai-bookmark-panel__action {
  display: inline-flex;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(37, 99, 235, 0.12);
  border-radius: 10px;
  background: rgba(239, 246, 255, 0.72);
  padding: 0 11px;
  color: #2563eb;
  font-size: 11px;
  font-weight: 760;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
}

.ai-bookmark-panel__action:hover:not(:disabled) {
  border-color: rgba(37, 99, 235, 0.22);
  background: rgba(219, 234, 254, 0.88);
}

.ai-bookmark-panel__action:disabled {
  color: #94a3b8;
  cursor: default;
  background: rgba(241, 245, 249, 0.72);
}

.ai-bookmark-panel__search {
  display: flex;
  height: 32px;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(15, 23, 42, 0.07);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.78);
  padding: 0 9px;
  color: #94a3b8;
}

.ai-bookmark-panel__search input {
  min-width: 0;
  flex: 1;
  border: none;
  background: transparent;
  color: #0f172a;
  font-size: 12px;
  font-weight: 650;
  outline: none;
}

.ai-bookmark-panel__search input::placeholder {
  color: #94a3b8;
}

.ai-bookmark-panel__folders {
  display: flex;
  max-height: 154px;
  min-height: 58px;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  padding-right: 2px;
}

.ai-bookmark-folder {
  display: grid;
  grid-template-columns: 17px minmax(88px, 0.9fr) minmax(0, 1.4fr) auto;
  align-items: center;
  gap: 7px;
  min-height: 30px;
  border-radius: 10px;
  padding: 5px 7px;
  color: #334155;
  transition: background 120ms ease;
}

.ai-bookmark-folder:hover {
  background: rgba(255, 255, 255, 0.76);
}

.ai-bookmark-folder input {
  width: 14px;
  height: 14px;
  accent-color: #14b8a6;
}

.ai-bookmark-folder__name,
.ai-bookmark-folder__path {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-bookmark-folder__name {
  color: #0f172a;
  font-size: 12px;
  font-weight: 720;
}

.ai-bookmark-folder__path {
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
}

.ai-bookmark-folder__count {
  min-width: 24px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  padding: 1px 7px;
  color: #64748b;
  font-size: 10px;
  font-weight: 780;
  text-align: center;
}

.ai-bookmark-panel__error,
.ai-bookmark-panel__empty {
  margin: 0;
  border-radius: 11px;
  padding: 9px 10px;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.45;
}

.ai-bookmark-panel__error {
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
}

.ai-bookmark-panel__empty {
  background: rgba(15, 23, 42, 0.04);
  color: #64748b;
  text-align: center;
}

.ai-dialog__abort,
.ai-dialog__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  transition: background 140ms ease, color 140ms ease, transform 140ms ease;
}

.ai-dialog__abort {
  height: 34px;
  border: 1px solid rgba(239, 68, 68, 0.16);
  background: rgba(239, 68, 68, 0.08);
  padding: 0 13px;
  color: #b91c1c;
}

.ai-dialog__send {
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  background: linear-gradient(145deg, #2f80ed, #19b58f);
  color: white;
  box-shadow: 0 14px 28px -20px rgba(47, 128, 237, 0.68);
}

.ai-dialog__send:hover:not(:disabled),
.ai-dialog__abort:hover:not(:disabled) {
  transform: translateY(-1px);
}

@keyframes ai-dot {
  0%, 80%, 100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@keyframes ai-cursor {
  0%, 100% {
    opacity: 0.15;
  }
  50% {
    opacity: 1;
  }
}

@media (max-width: 820px) {
  .ai-dialog-overlay {
    align-items: flex-end;
    padding: 10px;
  }

  .ai-dialog {
    height: 92vh;
    min-height: 0;
    grid-template-columns: 1fr;
    grid-template-rows: 184px minmax(0, 1fr);
    border-radius: 20px;
  }

  .ai-dialog__sidebar {
    border-right: none;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  }

  .ai-history__list {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 12px;
  }

  .ai-history-item {
    width: 230px;
    min-width: 230px;
  }

  .ai-dialog__body {
    padding: 16px 14px 18px;
  }

  .ai-message-content {
    max-width: min(560px, 76%);
  }
}

@media (max-width: 560px) {
  .ai-dialog__composer {
    padding: 12px;
  }

  .ai-dialog__header {
    padding-left: 14px;
    padding-right: 14px;
  }

  .ai-message-avatar {
    width: 30px;
    height: 30px;
    border-radius: 11px;
  }

  .ai-message-content {
    max-width: 78%;
  }

  .ai-bookmark-switch__label,
  .ai-thinking-switch__label {
    display: none;
  }
}
</style>
