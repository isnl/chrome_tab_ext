import { Hono } from "hono";
import type { Env, CountdownRow } from "../lib/types";
import { auth } from "../middleware/auth";

const countdownsRoutes = new Hono<{ Bindings: Env }>();
countdownsRoutes.use("/*", auth);

countdownsRoutes.get("/", async (c) => {
  const { userId } = c.get("jwtPayload");
  const rows = await c.env.DB
    .prepare('SELECT * FROM countdowns WHERE user_id = ? ORDER BY "order" ASC')
    .bind(userId)
    .all<CountdownRow>();

  const items = rows.results.map((r) => ({
    id: r.id,
    label: r.label,
    targetDate: r.target_date,
    enabled: r.enabled === 1,
    order: r.order,
    isBuiltIn: r.is_built_in === 1,
  }));

  return c.json({ success: true, data: items });
});

countdownsRoutes.post("/", async (c) => {
  const { userId } = c.get("jwtPayload");
  const body = await c.req.json();

  await c.env.DB
    .prepare(
      'INSERT INTO countdowns (id, user_id, label, target_date, enabled, "order", is_built_in) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      body.id,
      userId,
      body.label,
      body.targetDate,
      body.enabled ? 1 : 0,
      body.order ?? 0,
      body.isBuiltIn ? 1 : 0
    )
    .run();

  return c.json({ success: true, data: { id: body.id } }, 201);
});

countdownsRoutes.put("/:id", async (c) => {
  const { userId } = c.get("jwtPayload");
  const id = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB
    .prepare(
      'UPDATE countdowns SET label = ?, target_date = ?, enabled = ?, "order" = ?, is_built_in = ? WHERE user_id = ? AND id = ?'
    )
    .bind(
      body.label,
      body.targetDate,
      body.enabled ? 1 : 0,
      body.order ?? 0,
      body.isBuiltIn ? 1 : 0,
      userId,
      id
    )
    .run();

  return c.json({ success: true });
});

countdownsRoutes.delete("/:id", async (c) => {
  const { userId } = c.get("jwtPayload");
  const id = c.req.param("id");

  await c.env.DB
    .prepare("DELETE FROM countdowns WHERE user_id = ? AND id = ?")
    .bind(userId, id)
    .run();

  return c.json({ success: true });
});

export { countdownsRoutes };
