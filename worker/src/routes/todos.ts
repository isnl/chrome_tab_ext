import { Hono } from "hono";
import type { Env, TodoRow } from "../lib/types";
import { auth } from "../middleware/auth";

const todosRoutes = new Hono<{ Bindings: Env }>();
todosRoutes.use("/*", auth);

todosRoutes.get("/", async (c) => {
  const { userId } = c.get("jwtPayload");
  const rows = await c.env.DB
    .prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY "order" ASC')
    .bind(userId)
    .all<TodoRow>();

  const items = rows.results.map((r) => ({
    id: r.id,
    text: r.text,
    completed: r.completed === 1,
    createdAt: r.created_at,
    completedAt: r.completed_at,
    dueDate: r.due_date,
    dueTime: r.due_time,
    importance: r.importance,
    order: r.order,
  }));

  return c.json({ success: true, data: items });
});

todosRoutes.post("/", async (c) => {
  const { userId } = c.get("jwtPayload");
  const body = await c.req.json();

  await c.env.DB
    .prepare(
      'INSERT INTO todos (id, user_id, text, completed, created_at, completed_at, due_date, due_time, importance, "order") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      body.id,
      userId,
      body.text,
      body.completed ? 1 : 0,
      body.createdAt,
      body.completedAt || null,
      body.dueDate || null,
      body.dueTime || null,
      body.importance || "low",
      body.order ?? 0
    )
    .run();

  return c.json({ success: true, data: { id: body.id } }, 201);
});

todosRoutes.put("/:id", async (c) => {
  const { userId } = c.get("jwtPayload");
  const id = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB
    .prepare(
      'UPDATE todos SET text = ?, completed = ?, completed_at = ?, due_date = ?, due_time = ?, importance = ?, "order" = ? WHERE user_id = ? AND id = ?'
    )
    .bind(
      body.text,
      body.completed ? 1 : 0,
      body.completedAt || null,
      body.dueDate || null,
      body.dueTime || null,
      body.importance || "low",
      body.order ?? 0,
      userId,
      id
    )
    .run();

  return c.json({ success: true });
});

todosRoutes.delete("/:id", async (c) => {
  const { userId } = c.get("jwtPayload");
  const id = c.req.param("id");

  await c.env.DB
    .prepare("DELETE FROM todos WHERE user_id = ? AND id = ?")
    .bind(userId, id)
    .run();

  return c.json({ success: true });
});

// Batch reorder
todosRoutes.put("/", async (c) => {
  const { userId } = c.get("jwtPayload");
  const body = await c.req.json<Array<{ id: string; order: number }>>();

  const stmt = c.env.DB.prepare('UPDATE todos SET "order" = ? WHERE user_id = ? AND id = ?');
  await c.env.DB.batch(body.map((item) => stmt.bind(item.order, userId, item.id)));

  return c.json({ success: true });
});

export { todosRoutes };
