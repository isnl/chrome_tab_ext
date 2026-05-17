import { Hono } from "hono";
import type { Env, SiteRow } from "../lib/types";
import { auth } from "../middleware/auth";

const sitesRoutes = new Hono<{ Bindings: Env }>();
sitesRoutes.use("/*", auth);

sitesRoutes.get("/", async (c) => {
  const { userId } = c.get("jwtPayload");
  const rows = await c.env.DB
    .prepare('SELECT * FROM sites WHERE user_id = ? ORDER BY "order" ASC')
    .bind(userId)
    .all<SiteRow>();

  const items = rows.results.map((r) => ({
    id: r.id,
    name: r.name,
    url: r.url,
    hostname: r.hostname,
    addedAt: r.added_at,
    order: r.order,
  }));

  return c.json({ success: true, data: items });
});

sitesRoutes.post("/", async (c) => {
  const { userId } = c.get("jwtPayload");
  const body = await c.req.json();

  await c.env.DB
    .prepare(
      'INSERT INTO sites (id, user_id, name, url, hostname, added_at, "order") VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(body.id, userId, body.name, body.url, body.hostname, body.addedAt, body.order ?? 0)
    .run();

  return c.json({ success: true, data: { id: body.id } }, 201);
});

sitesRoutes.put("/:id", async (c) => {
  const { userId } = c.get("jwtPayload");
  const id = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB
    .prepare(
      'UPDATE sites SET name = ?, url = ?, hostname = ?, "order" = ? WHERE user_id = ? AND id = ?'
    )
    .bind(body.name, body.url, body.hostname, body.order ?? 0, userId, id)
    .run();

  return c.json({ success: true });
});

sitesRoutes.delete("/:id", async (c) => {
  const { userId } = c.get("jwtPayload");
  const id = c.req.param("id");

  await c.env.DB
    .prepare("DELETE FROM sites WHERE user_id = ? AND id = ?")
    .bind(userId, id)
    .run();

  return c.json({ success: true });
});

sitesRoutes.put("/", async (c) => {
  const { userId } = c.get("jwtPayload");
  const body = await c.req.json<Array<{ id: string; order: number }>>();

  const stmt = c.env.DB.prepare('UPDATE sites SET "order" = ? WHERE user_id = ? AND id = ?');
  await c.env.DB.batch(body.map((item) => stmt.bind(item.order, userId, item.id)));

  return c.json({ success: true });
});

export { sitesRoutes };
