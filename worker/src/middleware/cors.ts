import type { Context, Next } from "hono";
import type { Env } from "../lib/types";

export async function cors(c: Context<{ Bindings: Env }>, next: Next) {
  const origin = c.req.header("Origin") || "";
  const allowedOrigin = c.env.ALLOWED_EXTENSION_ID
    ? `chrome-extension://${c.env.ALLOWED_EXTENSION_ID}`
    : "*";

  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  await next();

  c.header("Access-Control-Allow-Origin", allowedOrigin);
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
}
