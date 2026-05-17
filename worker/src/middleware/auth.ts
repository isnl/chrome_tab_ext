import type { Context, Next } from "hono";
import type { Env } from "../lib/types";
import { parseJwtPayload, isTokenExpired } from "../lib/jwt";
import { getUserByOpenId } from "../lib/db";

declare module "hono" {
  interface ContextVariableMap {
    jwtPayload: { openId: string; userId: number };
  }
}

export async function auth(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Unauthorized", message: "No token provided" }, 401);
  }

  const token = authHeader.slice(7);

  if (isTokenExpired(token)) {
    return c.json({ success: false, error: "Token expired", message: "Please login again" }, 401);
  }

  const payload = parseJwtPayload(token);
  const openId = (payload?.openId as string) || null;

  if (!openId) {
    return c.json({ success: false, error: "Invalid token", message: "Could not extract user info from token" }, 401);
  }

  const user = await getUserByOpenId(c.env.DB, openId);
  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  c.set("jwtPayload", { openId, userId: user.id });
  await next();
}
