import { computed, ref, toRaw, watch } from "vue";

import { testAiChatConnection } from "@/services/aiChat";
import { storageGet, storageSet } from "@/services/storage";
import {
  DEFAULT_AI_CHAT_CONFIG,
  DEFAULT_AI_CHAT_MODEL,
  type AiChatConfig,
  type AiChatConversation,
  type AiChatMessage,
  type AiChatMessageRole,
  type AiChatModelConfig
} from "@/types/aiChat";

const CONFIG_STORAGE_KEY = "ai-chat.config";
const CONVERSATIONS_STORAGE_KEY = "ai-chat.conversations";
const ACTIVE_CONVERSATION_STORAGE_KEY = "ai-chat.activeConversationId";
const UNTITLED_CONVERSATION_TITLE = "新对话";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeModelConfig(payload: unknown, index = 0): AiChatModelConfig {
  if (!isRecord(payload)) {
    return {
      ...DEFAULT_AI_CHAT_MODEL,
      id: index === 0 ? DEFAULT_AI_CHAT_MODEL.id : createId("model")
    };
  }

  const id = typeof payload.id === "string" && payload.id.trim()
    ? payload.id.trim()
    : index === 0
      ? DEFAULT_AI_CHAT_MODEL.id
      : createId("model");
  const model = typeof payload.model === "string" && payload.model.trim()
    ? payload.model.trim()
    : DEFAULT_AI_CHAT_MODEL.model;

  return {
    id,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : model,
    baseUrl: typeof payload.baseUrl === "string" ? payload.baseUrl : DEFAULT_AI_CHAT_MODEL.baseUrl,
    apiKey: typeof payload.apiKey === "string" ? payload.apiKey : DEFAULT_AI_CHAT_MODEL.apiKey,
    model,
    supportsDeepThinking:
      typeof payload.supportsDeepThinking === "boolean"
        ? payload.supportsDeepThinking
        : typeof payload.deepThinking === "boolean"
          ? payload.deepThinking
          : DEFAULT_AI_CHAT_MODEL.supportsDeepThinking
  };
}

function sanitizeConfig(payload: unknown): AiChatConfig {
  if (!isRecord(payload)) {
    return {
      ...DEFAULT_AI_CHAT_CONFIG,
      models: DEFAULT_AI_CHAT_CONFIG.models.map((model) => ({ ...model }))
    };
  }

  const migratedModel = isRecord(payload) && ("baseUrl" in payload || "model" in payload)
    ? sanitizeModelConfig({
        id: DEFAULT_AI_CHAT_MODEL.id,
        name: typeof payload.model === "string" && payload.model.trim() ? payload.model.trim() : DEFAULT_AI_CHAT_MODEL.name,
        baseUrl: payload.baseUrl,
        apiKey: payload.apiKey,
        model: payload.model,
        supportsDeepThinking: payload.deepThinking
      })
    : null;
  const incomingModels = Array.isArray(payload.models)
    ? payload.models.map(sanitizeModelConfig)
    : migratedModel
      ? [migratedModel]
      : [];
  const models = incomingModels.length
    ? incomingModels
    : DEFAULT_AI_CHAT_CONFIG.models.map((model) => ({ ...model }));
  const activeModelId =
    typeof payload.activeModelId === "string" && models.some((model) => model.id === payload.activeModelId)
      ? payload.activeModelId
      : models[0]?.id ?? DEFAULT_AI_CHAT_MODEL.id;

  return {
    models,
    activeModelId,
    deepThinking: typeof payload.deepThinking === "boolean" ? payload.deepThinking : DEFAULT_AI_CHAT_CONFIG.deepThinking
  };
}

function sanitizeMessage(payload: unknown): AiChatMessage | null {
  if (!isRecord(payload)) {
    return null;
  }

  const role = payload.role === "user" || payload.role === "assistant" ? payload.role : null;
  if (!role) {
    return null;
  }

  return {
    id: typeof payload.id === "string" && payload.id ? payload.id : createId("msg"),
    role,
    content: typeof payload.content === "string" ? payload.content : "",
    createdAt: typeof payload.createdAt === "number" ? payload.createdAt : Date.now(),
    error: typeof payload.error === "string" && payload.error ? payload.error : undefined
  };
}

function deriveFallbackTitle(messages: AiChatMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user" && message.content.trim());
  const fallback = firstUserMessage?.content.trim() || UNTITLED_CONVERSATION_TITLE;
  return fallback.length > 18 ? `${fallback.slice(0, 18)}...` : fallback;
}

function sanitizeConversation(payload: unknown): AiChatConversation | null {
  if (!isRecord(payload)) {
    return null;
  }

  const messages = Array.isArray(payload.messages)
    ? payload.messages.map(sanitizeMessage).filter((message): message is AiChatMessage => Boolean(message))
    : [];

  const title = typeof payload.title === "string" && payload.title.trim()
    ? payload.title.trim()
    : deriveFallbackTitle(messages);
  const createdAt = typeof payload.createdAt === "number" ? payload.createdAt : Date.now();
  const updatedAt = typeof payload.updatedAt === "number" ? payload.updatedAt : createdAt;

  return {
    id: typeof payload.id === "string" && payload.id ? payload.id : createId("conv"),
    title,
    messages,
    createdAt,
    updatedAt,
    titleEdited: payload.titleEdited === true,
    titleGenerated: payload.titleGenerated === true
  };
}

function sanitizeConversations(payload: unknown) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map(sanitizeConversation)
    .filter((conversation): conversation is AiChatConversation => Boolean(conversation))
    .sort((left, right) => right.updatedAt - left.updatedAt);
}

function cloneConfig(config: AiChatConfig): AiChatConfig {
  return {
    ...toRaw(config),
    models: config.models.map((model) => ({ ...toRaw(model) }))
  };
}

function cloneConversations(conversations: AiChatConversation[]): AiChatConversation[] {
  return toRaw(conversations).map((conversation) => ({
    ...toRaw(conversation),
    messages: conversation.messages.map((message) => ({ ...toRaw(message) }))
  }));
}

function createAiChatStore() {
  const config = ref<AiChatConfig>({
    ...DEFAULT_AI_CHAT_CONFIG,
    models: DEFAULT_AI_CHAT_CONFIG.models.map((model) => ({ ...model }))
  });
  const conversations = ref<AiChatConversation[]>([]);
  const activeConversationId = ref<string | null>(null);
  const modalRequestToken = ref(0);
  const isHydrated = ref(false);
  let hydrationPromise: Promise<void> | null = null;
  let conversationSaveTimer = 0;

  const activeConversation = computed(() =>
    activeConversationId.value
      ? conversations.value.find((conversation) => conversation.id === activeConversationId.value) ?? null
      : null
  );

  const activeModel = computed(() =>
    config.value.models.find((model) => model.id === config.value.activeModelId) ?? config.value.models[0] ?? null
  );

  const isConfigured = computed(() => Boolean(activeModel.value?.baseUrl.trim() && activeModel.value?.model.trim()));

  async function initialize() {
    if (hydrationPromise) {
      return hydrationPromise;
    }

    hydrationPromise = (async () => {
      const stored = await storageGet<Record<string, unknown>>({
        [CONFIG_STORAGE_KEY]: null,
        [CONVERSATIONS_STORAGE_KEY]: [],
        [ACTIVE_CONVERSATION_STORAGE_KEY]: null
      });

      config.value = sanitizeConfig(stored[CONFIG_STORAGE_KEY]);
      conversations.value = sanitizeConversations(stored[CONVERSATIONS_STORAGE_KEY]);

      const storedActiveId =
        typeof stored[ACTIVE_CONVERSATION_STORAGE_KEY] === "string"
          ? (stored[ACTIVE_CONVERSATION_STORAGE_KEY] as string)
          : null;
      activeConversationId.value =
        storedActiveId && conversations.value.some((conversation) => conversation.id === storedActiveId)
          ? storedActiveId
          : conversations.value[0]?.id ?? null;

      isHydrated.value = true;
    })();

    return hydrationPromise;
  }

  function updateConfig(nextConfig: AiChatConfig) {
    const models = nextConfig.models.length
      ? nextConfig.models.map((model, index) => sanitizeModelConfig(model, index))
      : DEFAULT_AI_CHAT_CONFIG.models.map((model) => ({ ...model }));
    const activeModelId = models.some((model) => model.id === nextConfig.activeModelId)
      ? nextConfig.activeModelId
      : models[0]?.id ?? DEFAULT_AI_CHAT_MODEL.id;

    config.value = {
      models,
      activeModelId,
      deepThinking: nextConfig.deepThinking && Boolean(models.find((model) => model.id === activeModelId)?.supportsDeepThinking)
    };
  }

  function setDeepThinking(value: boolean) {
    config.value.deepThinking = value && Boolean(activeModel.value?.supportsDeepThinking);
  }

  function setActiveModel(id: string) {
    if (!config.value.models.some((model) => model.id === id)) {
      return;
    }

    config.value.activeModelId = id;
    if (!activeModel.value?.supportsDeepThinking) {
      config.value.deepThinking = false;
    }
  }

  function requestConversationModal() {
    modalRequestToken.value += 1;
  }

  function touchConversation(id: string) {
    const conversation = conversations.value.find((item) => item.id === id);
    if (conversation) {
      conversation.updatedAt = Date.now();
    }
  }

  function setActiveConversation(id: string | null) {
    activeConversationId.value = id && conversations.value.some((conversation) => conversation.id === id) ? id : null;
  }

  function createConversation(title = UNTITLED_CONVERSATION_TITLE) {
    const now = Date.now();
    const conversation: AiChatConversation = {
      id: createId("conv"),
      title,
      messages: [],
      createdAt: now,
      updatedAt: now
    };

    conversations.value = [conversation, ...conversations.value];
    activeConversationId.value = conversation.id;
    return conversation;
  }

  function deleteConversation(id: string) {
    const previousIndex = conversations.value.findIndex((conversation) => conversation.id === id);
    conversations.value = conversations.value.filter((conversation) => conversation.id !== id);

    if (activeConversationId.value === id) {
      activeConversationId.value =
        conversations.value[Math.max(0, previousIndex - 1)]?.id ?? conversations.value[0]?.id ?? null;
    }
  }

  function renameConversation(id: string, title: string) {
    const nextTitle = title.trim() || UNTITLED_CONVERSATION_TITLE;
    conversations.value = conversations.value.map((conversation) =>
      conversation.id === id
        ? {
            ...conversation,
            title: nextTitle,
            titleEdited: true,
            updatedAt: Date.now()
          }
        : conversation
    );
  }

  function updateGeneratedTitle(id: string, title: string) {
    const nextTitle = title.trim();

    conversations.value = conversations.value.map((conversation) => {
      if (conversation.id !== id || conversation.titleEdited) {
        return conversation;
      }

      return {
        ...conversation,
        title: nextTitle || conversation.title,
        titleGenerated: true,
        updatedAt: Date.now()
      };
    });
  }

  function markTitleGenerated(id: string) {
    conversations.value = conversations.value.map((conversation) =>
      conversation.id === id
        ? {
            ...conversation,
            titleGenerated: true,
            updatedAt: Date.now()
          }
        : conversation
    );
  }

  function appendMessage(conversationId: string, role: AiChatMessageRole, content: string, error?: string) {
    const message: AiChatMessage = {
      id: createId("msg"),
      role,
      content,
      createdAt: Date.now(),
      error
    };

    const conversation = conversations.value.find((item) => item.id === conversationId);
    if (!conversation) {
      return null;
    }

    conversation.messages.push(message);
    touchConversation(conversationId);
    return message;
  }

  function updateMessageContent(conversationId: string, messageId: string, content: string) {
    const conversation = conversations.value.find((item) => item.id === conversationId);
    const message = conversation?.messages.find((item) => item.id === messageId);
    if (!conversation || !message) {
      return;
    }

    message.content = content;
    message.error = undefined;
    touchConversation(conversationId);
  }

  function updateMessageError(conversationId: string, messageId: string, error: string) {
    const conversation = conversations.value.find((item) => item.id === conversationId);
    const message = conversation?.messages.find((item) => item.id === messageId);
    if (!conversation || !message) {
      return;
    }

    message.error = error;
    touchConversation(conversationId);
  }

  function getConversationMessages(conversationId: string) {
    const conversation = conversations.value.find((item) => item.id === conversationId);
    return conversation?.messages ?? [];
  }

  function shouldGenerateTitle(conversationId: string) {
    const conversation = conversations.value.find((item) => item.id === conversationId);
    if (!conversation || conversation.titleEdited || conversation.titleGenerated) {
      return false;
    }

    return conversation.messages.filter((message) => message.role === "user").length === 1;
  }

  async function testConnection(signal?: AbortSignal) {
    await initialize();
    if (!activeModel.value) {
      throw new Error("请先添加模型配置。");
    }

    return testAiChatConnection(activeModel.value, signal);
  }

  function saveConversations() {
    if (!isHydrated.value) {
      return;
    }

    window.clearTimeout(conversationSaveTimer);
    conversationSaveTimer = window.setTimeout(() => {
      storageSet({
        [CONVERSATIONS_STORAGE_KEY]: cloneConversations(conversations.value),
        [ACTIVE_CONVERSATION_STORAGE_KEY]: activeConversationId.value
      }).catch((error) => {
        console.warn("[ai-chat] 对话记录保存失败:", error);
      });
    }, 180);
  }

  watch(
    config,
    (value) => {
      if (!isHydrated.value) {
        return;
      }

      storageSet({ [CONFIG_STORAGE_KEY]: cloneConfig(value) }).catch((error) => {
        console.warn("[ai-chat] 配置保存失败:", error);
      });
    },
    { deep: true }
  );

  watch(conversations, saveConversations, { deep: true });
  watch(activeConversationId, saveConversations);

  void initialize();

  return {
    config,
    activeModel,
    conversations,
    activeConversationId,
    modalRequestToken,
    activeConversation,
    isConfigured,
    isHydrated,
    initialize,
    updateConfig,
    setDeepThinking,
    setActiveModel,
    requestConversationModal,
    setActiveConversation,
    createConversation,
    deleteConversation,
    renameConversation,
    updateGeneratedTitle,
    markTitleGenerated,
    appendMessage,
    updateMessageContent,
    updateMessageError,
    getConversationMessages,
    shouldGenerateTitle,
    testConnection
  };
}

let aiChatStore: ReturnType<typeof createAiChatStore> | null = null;

export function useAiChat() {
  if (!aiChatStore) {
    aiChatStore = createAiChatStore();
  }

  return aiChatStore;
}
