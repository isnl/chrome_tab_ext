import { Hono } from "hono";
import type { Env } from "./lib/types";
import { cors } from "./middleware/cors";
import { authRoutes } from "./routes/auth";
import { todosRoutes } from "./routes/todos";
import { sitesRoutes } from "./routes/sites";
import { countdownsRoutes } from "./routes/countdowns";
import { conversationsRoutes } from "./routes/conversations";
import { dashboardRoutes } from "./routes/dashboard";
import { settingsRoutes } from "./routes/settings";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors);

app.route("/api/auth", authRoutes);
app.route("/api/todos", todosRoutes);
app.route("/api/sites", sitesRoutes);
app.route("/api/countdowns", countdownsRoutes);
app.route("/api/conversations", conversationsRoutes);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/settings", settingsRoutes);

app.get("/", (c) => c.json({ status: "ok", service: "fresh-tab-sync" }));

export default app;
