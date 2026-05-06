<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { useAiChat } from "@/composables/useAiChat";
import { generateAiChatTitle, streamAiChatCompletion } from "@/services/aiChat";
import type { AiChatMessage, AiChatModelConfig } from "@/types/aiChat";
import type { WidgetSize } from "@/types/widget";

import AiChatConversationModal from "./AiChatConversationModal.vue";
import AiModelPicker from "./AiModelPicker.vue";

defineProps<{
  size: WidgetSize;
}>();

const aiChat = useAiChat();
const promptText = ref("");
const modalOpen = ref(false);
const isStreaming = ref(false);
const abortRequested = ref(false);
const streamingConversationId = ref<string | null>(null);
const streamingMessageId = ref<string | null>(null);
const titleGeneratingConversationId = ref<string | null>(null);

let streamController: AbortController | null = null;

const canSend = computed(() => Boolean(promptText.value.trim()) && !isStreaming.value);
const placeholderText = computed(() =>
  aiChat.isConfigured.value ? "问点什么..." : "右键配置接口"
);
const activeModelId = computed({
  get: () => aiChat.config.value.activeModelId,
  set: (value: string) => aiChat.setActiveModel(value)
});
const activeModelSupportsDeepThinking = computed(() => Boolean(aiChat.activeModel.value?.supportsDeepThinking));
const deepThinkingEnabled = computed({
  get: () => aiChat.config.value.deepThinking && activeModelSupportsDeepThinking.value,
  set: (value: boolean) => aiChat.setDeepThinking(value)
});

function toggleDeepThinking() {
  if (!activeModelSupportsDeepThinking.value) {
    return;
  }

  deepThinkingEnabled.value = !deepThinkingEnabled.value;
}

function stopStreaming() {
  abortRequested.value = true;
  streamController?.abort();
}

function closeModal() {
  if (isStreaming.value) {
    stopStreaming();
  }

  modalOpen.value = false;
}

function buildApiMessages(messages: AiChatMessage[], pendingAssistantId: string) {
  return messages
    .filter((message) => message.id !== pendingAssistantId && !message.error && message.content.trim())
    .map((message) => ({
      role: message.role,
      content: message.content
    }));
}

function fallbackTitleFromPrompt(prompt: string) {
  const trimmed = prompt.trim().replace(/\s+/g, " ");
  return trimmed.length > 18 ? `${trimmed.slice(0, 18)}...` : trimmed || "新对话";
}

async function refreshGeneratedTitle(conversationId: string, configSnapshot: AiChatModelConfig) {
  if (!aiChat.shouldGenerateTitle(conversationId)) {
    return;
  }

  titleGeneratingConversationId.value = conversationId;

  try {
    const messages = aiChat
      .getConversationMessages(conversationId)
      .filter((message) => !message.error && message.content.trim())
      .slice(0, 8)
      .map((message) => ({
        role: message.role,
        content: message.content
      }));

    const generatedTitle = await generateAiChatTitle(configSnapshot, messages);
    aiChat.updateGeneratedTitle(conversationId, generatedTitle || fallbackTitleFromPrompt(messages[0]?.content ?? ""));
  } catch {
    const firstMessage = aiChat.getConversationMessages(conversationId).find((message) => message.role === "user");
    aiChat.updateGeneratedTitle(conversationId, fallbackTitleFromPrompt(firstMessage?.content ?? ""));
  } finally {
    titleGeneratingConversationId.value = null;
  }
}

async function sendPrompt(prompt: string, mode: "new" | "active") {
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt || isStreaming.value) {
    return;
  }

  await aiChat.initialize();

  const conversationId =
    mode === "new"
      ? aiChat.createConversation().id
      : aiChat.activeConversationId.value ?? aiChat.createConversation().id;

  aiChat.setActiveConversation(conversationId);
  modalOpen.value = true;

  aiChat.appendMessage(conversationId, "user", trimmedPrompt);
  const assistantMessage = aiChat.appendMessage(conversationId, "assistant", "");
  const shouldGenerateTitle = aiChat.shouldGenerateTitle(conversationId);

  if (!assistantMessage) {
    return;
  }

  if (!aiChat.isConfigured.value) {
    aiChat.updateMessageError(
      conversationId,
      assistantMessage.id,
      "请先右键打开“接口配置”，填写 Base URL 和模型名称。"
    );
    if (shouldGenerateTitle) {
      aiChat.updateGeneratedTitle(conversationId, fallbackTitleFromPrompt(trimmedPrompt));
    }
    return;
  }

  const activeModel = aiChat.activeModel.value;
  if (!activeModel) {
    aiChat.updateMessageError(conversationId, assistantMessage.id, "请先添加模型配置。");
    if (shouldGenerateTitle) {
      aiChat.updateGeneratedTitle(conversationId, fallbackTitleFromPrompt(trimmedPrompt));
    }
    return;
  }

  const configSnapshot = { ...activeModel };
  const requestMessages = buildApiMessages(aiChat.getConversationMessages(conversationId), assistantMessage.id);

  isStreaming.value = true;
  abortRequested.value = false;
  streamingConversationId.value = conversationId;
  streamingMessageId.value = assistantMessage.id;
  streamController = new AbortController();

  let assistantContent = "";

  try {
    await streamAiChatCompletion(
      configSnapshot,
      requestMessages,
      (delta) => {
        assistantContent += delta;
        aiChat.updateMessageContent(conversationId, assistantMessage.id, assistantContent);
      },
      streamController.signal,
      {
        deepThinking: aiChat.config.value.deepThinking
      }
    );

    if (shouldGenerateTitle) {
      void refreshGeneratedTitle(conversationId, configSnapshot);
    }
  } catch (error) {
    const isAbortError = error instanceof DOMException && error.name === "AbortError";
    if (!isAbortError || !abortRequested.value) {
      aiChat.updateMessageError(
        conversationId,
        assistantMessage.id,
        error instanceof Error ? error.message : "请求失败，请检查接口配置。"
      );
      if (shouldGenerateTitle) {
        aiChat.updateGeneratedTitle(conversationId, fallbackTitleFromPrompt(trimmedPrompt));
      }
    }
  } finally {
    isStreaming.value = false;
    abortRequested.value = false;
    streamingConversationId.value = null;
    streamingMessageId.value = null;
    streamController = null;
  }
}

function sendFromWidget() {
  const prompt = promptText.value.trim();
  if (!prompt) {
    return;
  }

  promptText.value = "";
  void sendPrompt(prompt, "new");
}

function sendFromModal(prompt: string) {
  void sendPrompt(prompt, "active");
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendFromWidget();
  }
}

onMounted(() => {
  void aiChat.initialize();
});

watch(
  () => aiChat.modalRequestToken.value,
  () => {
    modalOpen.value = true;
  }
);

onBeforeUnmount(() => {
  stopStreaming();
});
</script>

<template>
  <div class="ai-chat-widget" @pointerdown.stop @dragstart.prevent>
    <textarea
      v-model="promptText"
      class="ai-chat-widget__input"
      :placeholder="placeholderText"
      autocomplete="off"
      spellcheck="true"
      @keydown="handleKeydown"
    ></textarea>

    <div class="ai-chat-widget__bottom">
      <AiModelPicker
        v-model="activeModelId"
        :models="aiChat.config.value.models"
        compact
      />

      <button
        v-if="activeModelSupportsDeepThinking"
        class="ai-chat-widget__thinking"
        :class="{ 'ai-chat-widget__thinking--on': deepThinkingEnabled }"
        type="button"
        role="switch"
        :aria-checked="deepThinkingEnabled"
        title="深度思考"
        @click="toggleDeepThinking"
      >
        <span class="ai-chat-widget__thinking-track">
          <span class="ai-chat-widget__thinking-thumb"></span>
        </span>
        <span class="ai-chat-widget__thinking-label">深度思考</span>
      </button>
    </div>

    <button
      class="ai-chat-widget__send"
      type="button"
      :disabled="!canSend"
      :title="isStreaming ? '生成中' : '发送'"
      aria-label="发送"
      @click="sendFromWidget"
    >
      <svg v-if="!isStreaming" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z"/>
        <path d="M22 2 11 13"/>
      </svg>
      <span v-else class="ai-chat-widget__sending"></span>
    </button>

    <AiChatConversationModal
      :open="modalOpen"
      :loading="isStreaming"
      :streaming-conversation-id="streamingConversationId"
      :streaming-message-id="streamingMessageId"
      :title-generating-conversation-id="titleGeneratingConversationId"
      @abort="stopStreaming"
      @close="closeModal"
      @send="sendFromModal"
    />
  </div>
</template>

<style scoped>
.ai-chat-widget {
  position: relative;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) 20px;
  gap: 1px;
  min-width: 0;
  overflow: hidden;
  border-radius: inherit;
  padding: 9px 54px 7px 17px;
  transition: box-shadow 160ms ease;
}

.ai-chat-widget::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.46), transparent 55%),
    linear-gradient(90deg, rgba(25, 181, 143, 0.08), transparent 42%);
}

.ai-chat-widget__input {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  resize: none;
  border: none;
  background: transparent;
  padding: 0;
  color: #334155;
  font-size: 13.5px;
  font-weight: 640;
  line-height: 1.44;
  outline: none;
  scrollbar-width: none;
}

.ai-chat-widget__input::-webkit-scrollbar {
  display: none;
}

.ai-chat-widget__input::placeholder {
  color: #64748b;
  font-weight: 760;
}

.ai-chat-widget__bottom {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 7px;
  height: 20px;
  min-height: 20px;
  overflow: hidden;
  pointer-events: none;
}

.ai-chat-widget__bottom :deep(.ai-model-picker) {
  min-width: 0;
  flex: 0 1 220px;
  pointer-events: auto;
}

.ai-chat-widget__thinking {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 11px;
  font-weight: 740;
  pointer-events: auto;
}

.ai-chat-widget__thinking:disabled {
  color: #94a3b8;
  cursor: default;
}

.ai-chat-widget__thinking-track {
  position: relative;
  width: 30px;
  height: 17px;
  flex: 0 0 auto;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  background: rgba(148, 163, 184, 0.26);
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.14),
    0 4px 12px -10px rgba(15, 23, 42, 0.35);
  transition: background 160ms ease, border-color 160ms ease;
}

.ai-chat-widget__thinking-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.24);
  transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ai-chat-widget__thinking--on {
  color: #0f766e;
}

.ai-chat-widget__thinking--on .ai-chat-widget__thinking-track {
  border-color: rgba(255, 255, 255, 0.8);
  background: linear-gradient(145deg, #2f80ed, #19b58f);
}

.ai-chat-widget__thinking--on .ai-chat-widget__thinking-thumb {
  transform: translateX(13px);
}

.ai-chat-widget__thinking-label {
  overflow: hidden;
  max-width: 64px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-chat-widget__send {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 3;
  display: flex;
  width: 39px;
  height: 39px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 44%),
    linear-gradient(145deg, #2f80ed, #19b58f);
  color: white;
  box-shadow: 0 14px 28px -20px rgba(47, 128, 237, 0.68),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
}

.ai-chat-widget__send:hover:not(:disabled) {
  filter: saturate(1.08) brightness(1.02);
  transform: translateY(-1px);
  box-shadow: 0 18px 34px -22px rgba(25, 181, 143, 0.72),
    inset 0 1px 0 rgba(255, 255, 255, 0.32);
}

.ai-chat-widget__send:active:not(:disabled) {
  transform: translateY(0);
}

.ai-chat-widget__sending {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  animation: ai-chat-spin 0.7s linear infinite;
}

@keyframes ai-chat-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
