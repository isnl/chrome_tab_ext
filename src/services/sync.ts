import { storageGet, storageSet } from "./storage";

const API_BASE = "https://fresh-tab-sync.htmljs.workers.dev";
const TOKEN_KEY = "sync.token";
const USER_KEY = "sync.user";

export interface SyncUser {
  id: number;
  openId: string;
  nickname: string | null;
  avatarUrl: string | null;
}

async function getToken(): Promise<string | null> {
  const result = await storageGet<{ [TOKEN_KEY]: string | null }>({ [TOKEN_KEY]: null });
  return result[TOKEN_KEY];
}

async function setToken(token: string | null): Promise<void> {
  await storageSet({ [TOKEN_KEY]: token });
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401) {
    await setToken(null);
    await storageSet({ [USER_KEY]: null });
    throw new Error("Unauthorized");
  }

  return response.json() as Promise<{ success: boolean; data?: T; error?: string }>;
}

// Auth
export async function login(code: string): Promise<{ user: SyncUser; token: string } | null> {
  const result = await request<{ user: SyncUser; token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ code }),
  });

  if (result.success && result.data) {
    await setToken(result.data.token);
    await storageSet({ [USER_KEY]: result.data.user });
    return result.data;
  }
  return null;
}

export async function getMe(): Promise<SyncUser | null> {
  const result = await request<{ user: SyncUser }>("/api/auth/me");
  return result.success && result.data ? result.data.user : null;
}

export async function logout(): Promise<void> {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } finally {
    await setToken(null);
    await storageSet({ [USER_KEY]: null });
  }
}

export async function isLoggedIn(): Promise<boolean> {
  return (await getToken()) !== null;
}

export async function getSavedUser(): Promise<SyncUser | null> {
  const result = await storageGet<{ [USER_KEY]: SyncUser | null }>({ [USER_KEY]: null });
  return result[USER_KEY];
}

// Todos
export const todos = {
  list: () => request<Array<Record<string, unknown>>>("/api/todos"),
  create: (item: object) =>
    request("/api/todos", { method: "POST", body: JSON.stringify(item) }),
  update: (id: string, item: object) =>
    request(`/api/todos/${id}`, { method: "PUT", body: JSON.stringify(item) }),
  delete: (id: string) =>
    request(`/api/todos/${id}`, { method: "DELETE" }),
  reorder: (items: Array<{ id: string; order: number }>) =>
    request("/api/todos", { method: "PUT", body: JSON.stringify(items) }),
};

// Sites
export const sites = {
  list: () => request<Array<Record<string, unknown>>>("/api/sites"),
  create: (item: object) =>
    request("/api/sites", { method: "POST", body: JSON.stringify(item) }),
  update: (id: string, item: object) =>
    request(`/api/sites/${id}`, { method: "PUT", body: JSON.stringify(item) }),
  delete: (id: string) =>
    request(`/api/sites/${id}`, { method: "DELETE" }),
  reorder: (items: Array<{ id: string; order: number }>) =>
    request("/api/sites", { method: "PUT", body: JSON.stringify(items) }),
};

// Countdowns
export const countdowns = {
  list: () => request<Array<Record<string, unknown>>>("/api/countdowns"),
  create: (item: object) =>
    request("/api/countdowns", { method: "POST", body: JSON.stringify(item) }),
  update: (id: string, item: object) =>
    request(`/api/countdowns/${id}`, { method: "PUT", body: JSON.stringify(item) }),
  delete: (id: string) =>
    request(`/api/countdowns/${id}`, { method: "DELETE" }),
};

// Conversations
export const conversations = {
  list: () => request<Array<Record<string, unknown>>>("/api/conversations"),
  get: (id: string) => request<Record<string, unknown>>(`/api/conversations/${id}`),
  create: (item: object) =>
    request("/api/conversations", { method: "POST", body: JSON.stringify(item) }),
  update: (id: string, item: object) =>
    request(`/api/conversations/${id}`, { method: "PUT", body: JSON.stringify(item) }),
  delete: (id: string) =>
    request(`/api/conversations/${id}`, { method: "DELETE" }),
};

// Dashboard
export const dashboard = {
  get: () => request<Array<Record<string, unknown>>>("/api/dashboard"),
  save: (items: Array<object>) =>
    request("/api/dashboard", { method: "PUT", body: JSON.stringify(items) }),
};

// Settings
export const settings = {
  getAll: () => request<Record<string, unknown>>("/api/settings"),
  get: (key: string) => request<unknown>(`/api/settings/${encodeURIComponent(key)}`),
  set: (key: string, value: unknown) =>
    request(`/api/settings/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),
  delete: (key: string) =>
    request(`/api/settings/${encodeURIComponent(key)}`, { method: "DELETE" }),
};
