export interface Env {
  DB: D1Database;
  WECHAT_AUTH_URL: string;
  ALLOWED_EXTENSION_ID: string;
  ENVIRONMENT: string;
}

export interface User {
  id: number;
  open_id: string;
  nickname: string | null;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WechatAuthResponse {
  success?: boolean;
  data?: { accessToken: string; refreshToken?: string };
  accessToken?: string;
  refreshToken?: string;
}

// DB row types
export interface TodoRow {
  id: string;
  user_id: number;
  text: string;
  completed: number;
  created_at: string;
  completed_at: string | null;
  due_date: string | null;
  due_time: string | null;
  importance: string;
  order: number;
}

export interface SiteRow {
  id: string;
  user_id: number;
  name: string;
  url: string;
  hostname: string;
  added_at: string;
  order: number;
}

export interface CountdownRow {
  id: string;
  user_id: number;
  label: string;
  target_date: string;
  enabled: number;
  order: number;
  is_built_in: number;
}

export interface ConversationRow {
  id: string;
  user_id: number;
  title: string;
  messages: string;
  created_at: number;
  updated_at: number;
  title_edited: number;
  title_generated: number;
}

export interface DashboardWidgetRow {
  widget_id: string;
  user_id: number;
  size: string;
  order: number;
  col: number | null;
  row: number | null;
  visible: number;
}

export interface SettingRow {
  user_id: number;
  key: string;
  value: string;
}
