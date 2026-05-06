import type { AiChatModelConfig } from "@/types/aiChat";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionRequest = {
  model: string;
  messages: ChatMessage[];
  temperature: number;
  stream: boolean;
  max_tokens?: number;
};

type ChatCompletionOptions = {
  deepThinking?: boolean;
  temperature?: number;
  maxTokens?: number;
};

const DEEP_THINKING_SYSTEM_PROMPT =
  "请更充分地分析用户意图、上下文和约束后再回答。保持结论清晰、步骤可靠，但不要展示隐藏推理过程。";

const TITLE_SYSTEM_PROMPT =
  "你是对话标题生成器。请根据对话内容生成一个简洁中文标题，最多 12 个汉字或 6 个英文词。只返回标题本身，不要引号、句号或解释。";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("请填写 Base URL。");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/+$/, "");
  } catch {
    throw new Error("Base URL 格式不正确。");
  }
}

function resolveChatCompletionsUrl(baseUrl: string) {
  const normalized = normalizeBaseUrl(baseUrl);

  if (/\/chat\/completions$/i.test(normalized)) {
    return normalized;
  }

  return `${normalized}/chat/completions`;
}

function assertConfig(config: AiChatModelConfig) {
  if (!config.baseUrl.trim()) {
    throw new Error("请先配置 Base URL。");
  }

  if (!config.model.trim()) {
    throw new Error("请先填写模型名称。");
  }
}

function buildHeaders(config: AiChatModelConfig) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  const apiKey = config.apiKey.trim();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

async function readApiError(response: Response) {
  const text = await response.text();

  if (!text) {
    return `${response.status} ${response.statusText}`;
  }

  try {
    const payload = JSON.parse(text) as unknown;
    if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === "string") {
      return payload.error.message;
    }
    if (isRecord(payload) && typeof payload.message === "string") {
      return payload.message;
    }
  } catch {
    // Use the raw response text below.
  }

  return text.slice(0, 500);
}

function firstChoice(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) {
    return null;
  }

  const [choice] = payload.choices;
  return isRecord(choice) ? choice : null;
}

function readContentValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (isRecord(item) && typeof item.text === "string") return item.text;
        return "";
      })
      .join("");
  }

  return "";
}

function extractDeltaContent(payload: unknown) {
  const choice = firstChoice(payload);
  if (!choice) {
    if (isRecord(payload) && typeof payload.delta === "string") {
      return payload.delta;
    }
    if (isRecord(payload) && typeof payload.output_text === "string") {
      return payload.output_text;
    }
    return "";
  }

  if (isRecord(choice.delta)) {
    const content = readContentValue(choice.delta.content);
    if (content) return content;
  }

  if (isRecord(choice.message)) {
    const content = readContentValue(choice.message.content);
    if (content) return content;
  }

  return readContentValue(choice.text);
}

function extractMessageContent(payload: unknown) {
  const content = extractDeltaContent(payload);
  if (content) {
    return content;
  }

  if (isRecord(payload) && typeof payload.output_text === "string") {
    return payload.output_text;
  }

  return "";
}

function normalizeMessages(messages: ChatMessage[]) {
  return messages
    .map((message) => ({
      role: message.role,
      content: message.content.trim()
    }))
    .filter((message) => Boolean(message.content));
}

function createChatBody(
  config: AiChatModelConfig,
  messages: ChatMessage[],
  stream: boolean,
  options: ChatCompletionOptions = {}
): ChatCompletionRequest {
  const normalizedMessages = normalizeMessages(messages);
  const shouldUseDeepThinking = Boolean(options.deepThinking && config.supportsDeepThinking);
  const requestMessages = shouldUseDeepThinking
    ? [{ role: "system" as const, content: DEEP_THINKING_SYSTEM_PROMPT }, ...normalizedMessages]
    : normalizedMessages;

  return {
    model: config.model.trim(),
    messages: requestMessages,
    temperature: options.temperature ?? 0.7,
    stream,
    ...(options.maxTokens ? { max_tokens: options.maxTokens } : {})
  };
}

async function ensureOk(response: Response) {
  if (response.ok) {
    return;
  }

  throw new Error(await readApiError(response));
}

async function parseJsonResponse(response: Response) {
  const payload = (await response.json()) as unknown;
  return extractMessageContent(payload);
}

function processSseLine(line: string, onDelta: (delta: string) => void) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith(":") || !trimmed.startsWith("data:")) {
    return false;
  }

  const data = trimmed.slice(5).trim();
  if (data === "[DONE]") {
    return true;
  }

  try {
    const payload = JSON.parse(data) as unknown;
    const delta = extractDeltaContent(payload);
    if (delta) {
      onDelta(delta);
    }
  } catch {
    // Ignore malformed keep-alive chunks from compatible providers.
  }

  return false;
}

export async function testAiChatConnection(config: AiChatModelConfig, signal?: AbortSignal) {
  assertConfig(config);

  const body = {
    ...createChatBody(config, [{ role: "user", content: "Reply with OK." }], false, {
      deepThinking: false,
      maxTokens: 6,
      temperature: 0
    })
  };

  const response = await fetch(resolveChatCompletionsUrl(config.baseUrl), {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify(body),
    signal
  });

  await ensureOk(response);
  const content = (await parseJsonResponse(response)).trim();

  return content ? `连接成功：${content.slice(0, 60)}` : "连接成功，接口已响应。";
}

export async function streamAiChatCompletion(
  config: AiChatModelConfig,
  messages: ChatMessage[],
  onDelta: (delta: string) => void,
  signal?: AbortSignal,
  options: ChatCompletionOptions = {}
) {
  assertConfig(config);

  if (!normalizeMessages(messages).length) {
    throw new Error("请输入对话内容。");
  }

  const response = await fetch(resolveChatCompletionsUrl(config.baseUrl), {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify(createChatBody(config, messages, true, options)),
    signal
  });

  await ensureOk(response);

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    const content = await parseJsonResponse(response);
    if (content) {
      onDelta(content);
    }
    return;
  }

  if (!response.body) {
    throw new Error("当前浏览器不支持流式读取响应。");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (processSseLine(line, onDelta)) {
        return;
      }
    }
  }

  buffer += decoder.decode();
  if (buffer) {
    processSseLine(buffer, onDelta);
  }
}

function cleanGeneratedTitle(value: string) {
  return value
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’。.!！?？]+$/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 36);
}

export async function generateAiChatTitle(
  config: AiChatModelConfig,
  messages: ChatMessage[],
  signal?: AbortSignal
) {
  assertConfig(config);

  const titleMessages: ChatMessage[] = [
    { role: "system", content: TITLE_SYSTEM_PROMPT },
    ...normalizeMessages(messages).slice(0, 8)
  ];

  const response = await fetch(resolveChatCompletionsUrl(config.baseUrl), {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify(
      createChatBody(config, titleMessages, false, {
        deepThinking: false,
        maxTokens: 32,
        temperature: 0.2
      })
    ),
    signal
  });

  await ensureOk(response);
  return cleanGeneratedTitle(await parseJsonResponse(response));
}
