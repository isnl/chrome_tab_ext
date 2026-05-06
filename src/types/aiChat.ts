export interface AiChatModelConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  supportsDeepThinking: boolean;
}

export interface AiChatConfig {
  models: AiChatModelConfig[];
  activeModelId: string;
  deepThinking: boolean;
}

export type AiChatMessageRole = "user" | "assistant";

export interface AiChatMessage {
  id: string;
  role: AiChatMessageRole;
  content: string;
  createdAt: number;
  error?: string;
}

export interface AiChatConversation {
  id: string;
  title: string;
  messages: AiChatMessage[];
  createdAt: number;
  updatedAt: number;
  titleEdited?: boolean;
  titleGenerated?: boolean;
}

export const DEFAULT_AI_CHAT_MODEL: AiChatModelConfig = {
  id: "default",
  name: "默认模型",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  supportsDeepThinking: false
};

export const DEFAULT_AI_CHAT_CONFIG: AiChatConfig = {
  models: [{ ...DEFAULT_AI_CHAT_MODEL }],
  activeModelId: DEFAULT_AI_CHAT_MODEL.id,
  deepThinking: false
};
