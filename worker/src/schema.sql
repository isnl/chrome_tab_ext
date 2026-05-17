CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  open_id TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT DEFAULT '',
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Todo items
CREATE TABLE IF NOT EXISTS todos (
  id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  due_date TEXT,
  due_time TEXT,
  importance TEXT NOT NULL DEFAULT 'low',
  "order" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sites
CREATE TABLE IF NOT EXISTS sites (
  id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  hostname TEXT NOT NULL,
  added_at TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Countdown items
CREATE TABLE IF NOT EXISTS countdowns (
  id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  target_date TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_built_in INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- AI chat conversations
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  messages TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  title_edited INTEGER NOT NULL DEFAULT 0,
  title_generated INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Dashboard layout
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  widget_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  size TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  col INTEGER,
  row INTEGER,
  visible INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, widget_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User settings (key-value for simple scalar settings)
CREATE TABLE IF NOT EXISTS settings (
  user_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (user_id, key),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_open_id ON users(open_id);
CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_user ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_countdowns_user ON countdowns(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
