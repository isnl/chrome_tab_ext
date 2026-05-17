import { Hono } from "hono";
import type { Env, SettingRow } from "../lib/types";
import { auth } from "../middleware/auth";

const ALLOWED_KEYS = [
  "todo.privacyMode",
  "clock.hour12",
  "wallpaper.currentUrl",
  "weather.location",
  "weather.noticeDismissed",
  "ai-chat.activeConversationId",
] as const;

const settingsRoutes = new Hono<{ Bindings: Env }>();
settingsRoutes.use("/*", auth);

settingsRoutes.get("/", async (c) => {
  const { userId } = c.get("jwtPayload");
  const rows = await c.env.DB
    .prepare("SELECT * FROM settings WHERE user_id = ?")
    .bind(userId)
    .all<SettingRow>();

  const data: Record<string, unknown> = {};
  for (const row of rows.results) {
    try {
      data[row.key] = JSON.parse(row.value);
    } catch {
      data[row.key] = row.value;
    }
  }

  return c.json({ success: true, data });
});

settingsRoutes.get("/:key", async (c) => {
  const { userId } = c.get("jwtPayload");
  const key = c.req.param("key");

  const row = await c.env.DB
    .prepare("SELECT * FROM settings WHERE user_id = ? AND key = ?")
    .bind(userId, key)
    .first<SettingRow>();

  if (!row) {
    return c.json({ success: true, data: null });
  }

  let value: unknown;
  try {
    value = JSON.parse(row.value);
  } catch {
    value = row.value;
  }

  return c.json({ success: true, data: value });
});

settingsRoutes.put("/:key", async (c) => {
  const { userId } = c.get("jwtPayload");
  const key = c.req.param("key");

  if (!ALLOWED_KEYS.includes(key as any)) {
    return c.json({ success: false, error: "Invalid setting key" }, 400);
  }

  const body = await c.req.json<{ value: unknown }>();
  const valueStr = JSON.stringify(body.value);

  await c.env.DB
    .prepare(
      "INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value"
    )
    .bind(userId, key, valueStr)
    .run();

  return c.json({ success: true });
});

settingsRoutes.delete("/:key", async (c) => {
  const { userId } = c.get("jwtPayload");
  const key = c.req.param("key");

  await c.env.DB
    .prepare("DELETE FROM settings WHERE user_id = ? AND key = ?")
    .bind(userId, key)
    .run();

  return c.json({ success: true });
});

export { settingsRoutes };
