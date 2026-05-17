import { Hono } from "hono";
import type { Env, DashboardWidgetRow } from "../lib/types";
import { auth } from "../middleware/auth";

const dashboardRoutes = new Hono<{ Bindings: Env }>();
dashboardRoutes.use("/*", auth);

dashboardRoutes.get("/", async (c) => {
  const { userId } = c.get("jwtPayload");
  const rows = await c.env.DB
    .prepare('SELECT * FROM dashboard_widgets WHERE user_id = ? ORDER BY "order" ASC')
    .bind(userId)
    .all<DashboardWidgetRow>();

  const items = rows.results.map((r) => ({
    id: r.widget_id,
    size: r.size,
    order: r.order,
    col: r.col,
    row: r.row,
    visible: r.visible === 1,
  }));

  return c.json({ success: true, data: items });
});

// Batch save (replace all)
dashboardRoutes.put("/", async (c) => {
  try {
    const { userId } = c.get("jwtPayload");
    const body = await c.req.json<
      Array<{ id: string; size: string; order: number; col?: number; row?: number; visible?: boolean }>
    >();

    if (!Array.isArray(body)) {
      return c.json({ success: false, error: "Invalid payload", message: "Expected an array" }, 400);
    }

    await c.env.DB
      .prepare("DELETE FROM dashboard_widgets WHERE user_id = ?")
      .bind(userId)
      .run();

    if (body.length > 0) {
      const stmt = c.env.DB.prepare(
        'INSERT INTO dashboard_widgets (widget_id, user_id, size, "order", col, row, visible) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      await c.env.DB.batch(
        body.map((item) =>
          stmt.bind(
            item.id,
            userId,
            item.size,
            item.order,
            item.col ?? null,
            item.row ?? null,
            item.visible !== false ? 1 : 0
          )
        )
      );
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Dashboard save error:", error);
    return c.json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});

export { dashboardRoutes };
