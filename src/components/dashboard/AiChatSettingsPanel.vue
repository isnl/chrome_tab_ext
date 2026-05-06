<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

import { useAiChat } from "@/composables/useAiChat";
import { testAiChatConnection } from "@/services/aiChat";
import { DEFAULT_AI_CHAT_MODEL, type AiChatConfig, type AiChatModelConfig } from "@/types/aiChat";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const aiChat = useAiChat();
const draftModels = ref<AiChatModelConfig[]>([]);
const draftActiveModelId = ref("");
const selectedModelId = ref("");
const showApiKey = ref(false);
const testMessage = ref("");
const testTone = ref<"info" | "success" | "error">("info");
const isTesting = ref(false);

let testController: AbortController | null = null;

const selectedModel = computed(() =>
  draftModels.value.find((model) => model.id === selectedModelId.value) ?? draftModels.value[0] ?? null
);
const canTest = computed(() => Boolean(selectedModel.value?.baseUrl.trim() && selectedModel.value?.model.trim()) && !isTesting.value);
const canRemove = computed(() => draftModels.value.length > 1);

function createDraftId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `model-${crypto.randomUUID()}`;
  }

  return `model-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneModel(model: AiChatModelConfig): AiChatModelConfig {
  return { ...model };
}

function syncDraft() {
  draftModels.value = aiChat.config.value.models.map(cloneModel);
  draftActiveModelId.value = aiChat.config.value.activeModelId;
  selectedModelId.value = draftActiveModelId.value || draftModels.value[0]?.id || "";
  testMessage.value = "";
  testTone.value = "info";
}

function normalizedDraftConfig(): AiChatConfig {
  const models = draftModels.value.length
    ? draftModels.value.map((model, index) => {
        const trimmedModel = model.model.trim() || DEFAULT_AI_CHAT_MODEL.model;
        return {
          id: model.id || createDraftId(),
          name: model.name.trim() || trimmedModel || `模型 ${index + 1}`,
          baseUrl: model.baseUrl.trim(),
          apiKey: model.apiKey.trim(),
          model: trimmedModel,
          supportsDeepThinking: model.supportsDeepThinking
        };
      })
    : [{ ...DEFAULT_AI_CHAT_MODEL }];

  const activeModelId = models.some((model) => model.id === draftActiveModelId.value)
    ? draftActiveModelId.value
    : models[0].id;

  return {
    models,
    activeModelId,
    deepThinking: aiChat.config.value.deepThinking && Boolean(models.find((model) => model.id === activeModelId)?.supportsDeepThinking)
  };
}

function saveDraft() {
  const nextConfig = normalizedDraftConfig();
  aiChat.updateConfig(nextConfig);
  draftModels.value = nextConfig.models.map(cloneModel);
  draftActiveModelId.value = nextConfig.activeModelId;
  selectedModelId.value = draftModels.value.some((model) => model.id === selectedModelId.value)
    ? selectedModelId.value
    : nextConfig.activeModelId;
}

function addModel() {
  const model: AiChatModelConfig = {
    ...DEFAULT_AI_CHAT_MODEL,
    id: createDraftId(),
    name: `模型 ${draftModels.value.length + 1}`,
    apiKey: ""
  };

  draftModels.value.push(model);
  selectedModelId.value = model.id;
  testMessage.value = "";
}

function removeSelectedModel() {
  if (!selectedModel.value || !canRemove.value) {
    return;
  }

  const removedId = selectedModel.value.id;
  draftModels.value = draftModels.value.filter((model) => model.id !== removedId);
  if (draftActiveModelId.value === removedId) {
    draftActiveModelId.value = draftModels.value[0]?.id ?? "";
  }
  selectedModelId.value = draftModels.value[0]?.id ?? "";
  testMessage.value = "";
}

function setSelectedAsActive() {
  if (selectedModel.value) {
    draftActiveModelId.value = selectedModel.value.id;
  }
}

async function handleTest() {
  if (!selectedModel.value) {
    return;
  }

  testController?.abort();
  testController = new AbortController();
  isTesting.value = true;
  testMessage.value = "正在测试接口...";
  testTone.value = "info";

  try {
    testMessage.value = await testAiChatConnection(selectedModel.value, testController.signal);
    testTone.value = "success";
  } catch (error) {
    const isAbortError = error instanceof DOMException && error.name === "AbortError";
    if (!isAbortError) {
      testMessage.value = error instanceof Error ? error.message : "测试失败，请检查配置。";
      testTone.value = "error";
    }
  } finally {
    isTesting.value = false;
    testController = null;
  }
}

function handleClose() {
  saveDraft();
  emit("close");
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      testController?.abort();
      return;
    }

    await aiChat.initialize();
    syncDraft();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  testController?.abort();
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
      <div v-if="open" class="ai-settings-overlay" @click.self="handleClose">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-4 scale-95 opacity-0"
          enter-to-class="translate-y-0 scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 scale-100 opacity-100"
          leave-to-class="translate-y-4 scale-95 opacity-0"
          appear
        >
          <section v-if="open" class="ai-settings-panel" @keydown.escape="handleClose">
            <header class="ai-settings-panel__header">
              <div>
                <h3 class="ai-settings-panel__title">接口配置</h3>
                <p class="ai-settings-panel__subtitle">配置多个 OpenAI 兼容 Chat Completions 模型</p>
              </div>

              <button class="ai-settings-panel__close" type="button" aria-label="关闭" @click="handleClose">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </header>

            <div class="ai-settings-layout">
              <aside class="ai-settings-models">
                <button
                  v-for="model in draftModels"
                  :key="model.id"
                  class="ai-settings-model"
                  :class="{ 'ai-settings-model--active': model.id === selectedModelId }"
                  type="button"
                  @click="selectedModelId = model.id; testMessage = ''"
                >
                  <span class="ai-settings-model__name">{{ model.name || model.model || "未命名模型" }}</span>
                  <span class="ai-settings-model__meta">
                    {{ model.model || "未填写模型" }}
                    <span v-if="model.id === draftActiveModelId">当前</span>
                  </span>
                </button>

                <button class="ai-settings-add" type="button" @click="addModel">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v14"/><path d="M5 12h14"/>
                  </svg>
                  <span>添加模型</span>
                </button>
              </aside>

              <form v-if="selectedModel" class="ai-settings-form" @submit.prevent="handleTest">
                <label class="ai-settings-field">
                  <span>显示名称</span>
                  <input
                    v-model="selectedModel.name"
                    class="ai-settings-input"
                    type="text"
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="例如 GPT-4.1"
                  />
                </label>

                <label class="ai-settings-field">
                  <span>Base URL</span>
                  <input
                    v-model="selectedModel.baseUrl"
                    class="ai-settings-input"
                    type="text"
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="https://api.openai.com/v1"
                  />
                </label>

                <label class="ai-settings-field">
                  <span>API Key</span>
                  <div class="ai-settings-secret">
                    <input
                      v-model="selectedModel.apiKey"
                      class="ai-settings-input ai-settings-input--secret"
                      :type="showApiKey ? 'text' : 'password'"
                      autocomplete="off"
                      spellcheck="false"
                      placeholder="sk-..."
                    />
                    <button
                      class="ai-settings-secret__toggle"
                      type="button"
                      :aria-label="showApiKey ? '隐藏 API Key' : '显示 API Key'"
                      @click="showApiKey = !showApiKey"
                    >
                      <svg v-if="!showApiKey" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 3l18 18"/>
                        <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.8"/>
                        <path d="M9.9 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.1 3.1"/>
                        <path d="M6.4 6.7C3.6 8.6 2 12 2 12s3.5 7 10 7a9.9 9.9 0 0 0 4.3-1"/>
                      </svg>
                    </button>
                  </div>
                </label>

                <label class="ai-settings-field">
                  <span>Model</span>
                  <input
                    v-model="selectedModel.model"
                    class="ai-settings-input"
                    type="text"
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="gpt-4o-mini"
                  />
                </label>

                <label class="ai-settings-check">
                  <input v-model="selectedModel.supportsDeepThinking" type="checkbox" />
                  <span>该模型支持深度思考</span>
                </label>

                <p
                  v-if="testMessage"
                  class="ai-settings-feedback"
                  :class="{
                    'ai-settings-feedback--success': testTone === 'success',
                    'ai-settings-feedback--error': testTone === 'error'
                  }"
                >
                  {{ testMessage }}
                </p>

                <div class="ai-settings-actions">
                  <button class="ai-settings-danger" type="button" :disabled="!canRemove" @click="removeSelectedModel">删除</button>
                  <button class="ai-settings-secondary" type="button" @click="setSelectedAsActive">设为当前</button>
                  <button class="ai-settings-secondary" type="button" @click="handleClose">保存</button>
                  <button class="ai-settings-primary" type="submit" :disabled="!canTest">
                    <span v-if="isTesting" class="ai-settings-spinner"></span>
                    <span>{{ isTesting ? "测试中" : "测试连接" }}</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ai-settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.2);
  backdrop-filter: blur(6px);
}

.ai-settings-panel {
  width: min(720px, 100%);
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.74);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(240, 253, 250, 0.9));
  box-shadow: 0 26px 72px -36px rgba(15, 23, 42, 0.46),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.ai-settings-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 20px 20px 14px;
}

.ai-settings-panel__title {
  color: #0f172a;
  font-size: 16px;
  font-weight: 750;
  line-height: 1.2;
}

.ai-settings-panel__subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 550;
}

.ai-settings-panel__close {
  display: flex;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 11px;
  background: transparent;
  color: #94a3b8;
  transition: background 140ms ease, color 140ms ease;
}

.ai-settings-panel__close:hover {
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
}

.ai-settings-layout {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 14px;
  padding: 0 20px 20px;
}

.ai-settings-models {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-height: 0;
}

.ai-settings-model {
  display: flex;
  min-height: 52px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 3px;
  border: 1px solid transparent;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.54);
  padding: 9px 10px;
  text-align: left;
  transition: background 140ms ease, border-color 140ms ease;
}

.ai-settings-model--active,
.ai-settings-model:hover {
  border-color: rgba(20, 184, 166, 0.2);
  background: rgba(255, 255, 255, 0.88);
}

.ai-settings-model__name {
  max-width: 100%;
  overflow: hidden;
  color: #0f172a;
  font-size: 13px;
  font-weight: 730;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-settings-model__meta {
  display: flex;
  max-width: 100%;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  color: #64748b;
  font-size: 11px;
  font-weight: 620;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-settings-model__meta span {
  flex: 0 0 auto;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.1);
  padding: 1px 6px;
  color: #0f766e;
  font-size: 10px;
  font-weight: 760;
}

.ai-settings-add {
  display: inline-flex;
  height: 36px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px dashed rgba(20, 184, 166, 0.28);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  color: #0f766e;
  font-size: 12px;
  font-weight: 760;
}

.ai-settings-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ai-settings-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-settings-field > span {
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.ai-settings-input {
  width: 100%;
  height: 40px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.74);
  padding: 0 12px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  outline: none;
  transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
}

.ai-settings-input:focus {
  border-color: rgba(20, 184, 166, 0.36);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1);
}

.ai-settings-input::placeholder {
  color: #94a3b8;
}

.ai-settings-secret {
  position: relative;
}

.ai-settings-input--secret {
  padding-right: 42px;
}

.ai-settings-secret__toggle {
  position: absolute;
  top: 4px;
  right: 5px;
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #94a3b8;
  transition: background 140ms ease, color 140ms ease;
}

.ai-settings-secret__toggle:hover {
  background: rgba(20, 184, 166, 0.08);
  color: #0f766e;
}

.ai-settings-check {
  display: inline-flex;
  grid-column: 1 / -1;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.ai-settings-check input {
  width: 15px;
  height: 15px;
  accent-color: #14b8a6;
}

.ai-settings-feedback {
  grid-column: 1 / -1;
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(14, 165, 233, 0.08);
  color: #0369a1;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.45;
}

.ai-settings-feedback--success {
  background: rgba(20, 184, 166, 0.1);
  color: #0f766e;
}

.ai-settings-feedback--error {
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
}

.ai-settings-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 2px;
}

.ai-settings-danger,
.ai-settings-secondary,
.ai-settings-primary {
  display: inline-flex;
  height: 36px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 12px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 750;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease, transform 140ms ease;
}

.ai-settings-danger {
  border: 1px solid rgba(239, 68, 68, 0.12);
  background: rgba(239, 68, 68, 0.06);
  color: #b91c1c;
}

.ai-settings-secondary {
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.72);
  color: #475569;
}

.ai-settings-secondary:hover {
  border-color: rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.92);
  color: #1e293b;
}

.ai-settings-primary {
  border: 1px solid rgba(20, 184, 166, 0.22);
  background: linear-gradient(145deg, #2563eb, #14b8a6);
  color: white;
  box-shadow: 0 16px 32px -24px rgba(37, 99, 235, 0.7);
}

.ai-settings-primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.ai-settings-spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  animation: ai-settings-spin 0.7s linear infinite;
}

@keyframes ai-settings-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .ai-settings-layout {
    grid-template-columns: 1fr;
  }

  .ai-settings-form {
    grid-template-columns: 1fr;
  }
}
</style>
