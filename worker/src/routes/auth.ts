import { Hono } from "hono";
import type { Env, WechatAuthResponse } from "../lib/types";
import { findOrCreateUser, getUserById, saveUserToken } from "../lib/db";
import { parseJwtPayload } from "../lib/jwt";
import { auth } from "../middleware/auth";

const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post("/login", async (c) => {
  try {
    const body = await c.req.json<{ code: string }>();
    if (!body.code) {
      return c.json({ success: false, error: "Code is required" }, 400);
    }

    const wechatAuthUrl = c.env.WECHAT_AUTH_URL || "https://ai.iiter.cn/auth/wechat";
    const authResponse = await fetch(wechatAuthUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: body.code }),
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error("Wechat auth failed:", authResponse.status, errorText);
      return c.json({ success: false, error: "Authentication failed", message: "Invalid code or authentication service unavailable" }, 401);
    }

    const authData = (await authResponse.json()) as WechatAuthResponse;
    const accessToken = authData.data?.accessToken || authData.accessToken;
    const refreshToken = authData.data?.refreshToken || authData.refreshToken || "";

    if (!accessToken) {
      console.error("Auth response:", JSON.stringify(authData));
      return c.json({ success: false, error: "Authentication failed", message: "No access token received" }, 401);
    }

    const payload = parseJwtPayload(accessToken);
    const openId = (payload?.openId as string) || null;
    if (!openId) {
      console.error("Failed to extract openId from token:", accessToken.substring(0, 50) + "...");
      return c.json({ success: false, error: "Invalid token", message: "Could not extract openId from token" }, 401);
    }

    const user = await findOrCreateUser(c.env.DB, openId);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await saveUserToken(c.env.DB, user.id, accessToken, refreshToken, expiresAt);

    return c.json({
      success: true,
      data: {
        token: accessToken,
        user: {
          id: user.id,
          openId: user.open_id,
          nickname: user.nickname,
          avatarUrl: user.avatar_url,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});

authRoutes.get("/me", auth, async (c) => {
  const { userId } = c.get("jwtPayload");
  const user = await getUserById(c.env.DB, userId);

  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        openId: user.open_id,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
      },
    },
  });
});

authRoutes.post("/logout", auth, async (c) => {
  const { userId } = c.get("jwtPayload");
  await c.env.DB.prepare("DELETE FROM user_tokens WHERE user_id = ?").bind(userId).run();
  return c.json({ success: true, message: "Logged out" });
});

export { authRoutes };
