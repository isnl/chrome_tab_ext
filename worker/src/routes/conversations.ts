import { Hono } from "hono";
import type { Env, ConversationRow } from "../lib/types";
import { auth } from "../middleware/auth";

const conversationsRoutes = new Hono<{ Bindings: Env }>();
conversationsRoutes.use("/*", auth);

conversationsRoutes.get("/", async (c) => {
  const { userId } = c.get("jwtPayload");
  const rows = await c.env.DB
    .prepare("SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC")
    .bind(userId)
    .all<ConversationRow>();

  const items = rows.results.map((r) => ({
    id: r.id,
    title: r.title,
    messages: JSON.parse(r.messages),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    titleEdited: r.title_edited === 1,
    titleGenerated: r.title_generated === 1,
  }));

  return c.json({ success: true, data: items });
});

conversationsRoutes.get("/:id", async (c) => {
  const { userId } = c.get("jwtPayload");
  const id = c.req.param("id");

  const row = await c.env.DB
    .prepare("SELECT * FROM conversations WHERE user_id = ? AND id = ?")
    .bind(userId, id)
    .first<ConversationRow>();

  if (!row) {
    return c.json({ success: false, error: "Not found" }, 404);
  }

  return c.json({
    success: true,
    data: {
      id: row.id,
      title: row.title,
      messages: JSON.parse(row.messages),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      titleEdited: row.title_edited === 1,
      titleGenerated: row.title_generated === 1,
    },
  });
});

conversationsRoutes.post("/", async (c) => {
  const { userId } = c.get("jwtPayload");
  const body = await c.req.json();

  await c.env.DB
    .prepare(
      "INSERT INTO conversations (id, user_id, title, messages, created_at, updated_at, title_edited, title_generated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      body.id,
      userId,
      body.title || "",
      JSON.stringify(body.messages || []),
      body.createdAt,
      body.updatedAt,
      body.titleEdited ? 1 : 0,
      body.titleGenerated ? 1 : 0
    )
    .run();

  return c.json({ success: true, data: { id: body.id } }, 201);
});

conversationsRoutes.put("/:id", async (c) => {
  const { userId } = c.get("jwtPayload");
  const id = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB
    .prepare(
      "UPDATE conversations SET title = ?, messages = ?, updated_at = ?, title_edited = ?, title_generated = ? WHERE user_id = ? AND id = ?"
    )
    .bind(
      body.title || "",
      JSON.stringify(body.messages || []),
      body.updatedAt,
      body.titleEdited ? 1 : 0,
      body.titleGenerated ? 1 : 0,
      userId,
      id
    )
    .run();

  return c.json({ success: true });
});

conversationsRoutes.delete("/:id", async (c) => {
  const { userId } = c.get("jwtPayload");
  const id = c.req.param("id");

  await c.env.DB
    .prepare("DELETE FROM conversations WHERE user_id = ? AND id = ?")
    .bind(userId, id)
    .run();

  return c.json({ success: true });
});

export { conversationsRoutes };
