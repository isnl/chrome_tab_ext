import type { User } from "./types";

export async function findOrCreateUser(db: D1Database, openId: string): Promise<User> {
  const existing = await db
    .prepare("SELECT * FROM users WHERE open_id = ?")
    .bind(openId)
    .first<User>();

  if (existing) {
    await db
      .prepare("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(existing.id)
      .run();
    return existing;
  }

  const result = await db
    .prepare("INSERT INTO users (open_id) VALUES (?) RETURNING *")
    .bind(openId)
    .first<User>();

  if (!result) throw new Error("Failed to create user");
  return result;
}

export async function getUserById(db: D1Database, userId: number): Promise<User | null> {
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first<User>();
}

export async function getUserByOpenId(db: D1Database, openId: string): Promise<User | null> {
  return db.prepare("SELECT * FROM users WHERE open_id = ?").bind(openId).first<User>();
}

export async function saveUserToken(
  db: D1Database,
  userId: number,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date
): Promise<void> {
  await db.prepare("DELETE FROM user_tokens WHERE user_id = ?").bind(userId).run();
  await db
    .prepare(
      "INSERT INTO user_tokens (user_id, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?)"
    )
    .bind(userId, accessToken, refreshToken, expiresAt.toISOString())
    .run();
}
