import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Converts positional `?` placeholders (the better-sqlite3 style the rest of
// this codebase was written against) into Postgres's `$1, $2, ...` style, in
// order. Keeps every call site below identical to the pre-migration code.
function toPgParams(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function get(sql, ...params) {
  const { rows } = await pool.query(toPgParams(sql), params);
  return rows[0];
}

async function all(sql, ...params) {
  const { rows } = await pool.query(toPgParams(sql), params);
  return rows;
}

async function run(sql, ...params) {
  const result = await pool.query(toPgParams(sql), params);
  return { changes: result.rowCount };
}

/**
 * Runs `fn` against a single dedicated connection wrapped in BEGIN/COMMIT, so
 * the writes inside it are atomic — mirrors better-sqlite3's db.transaction().
 * `fn` receives a { get, all, run } bound to that connection.
 */
async function transaction(fn) {
  const client = await pool.connect();
  const tx = {
    get: async (sql, ...params) => (await client.query(toPgParams(sql), params)).rows[0],
    all: async (sql, ...params) => (await client.query(toPgParams(sql), params)).rows,
    run: async (sql, ...params) => {
      const result = await client.query(toPgParams(sql), params);
      return { changes: result.rowCount };
    },
  };
  try {
    await client.query('BEGIN');
    const result = await fn(tx);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function initSchema() {
  await pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  credits INTEGER NOT NULL DEFAULT 50,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,
  avatar_theme TEXT NOT NULL DEFAULT 'netrunner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attributes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  icon TEXT NOT NULL DEFAULT 'sparkles',
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  attribute TEXT NOT NULL DEFAULT 'General',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  xp_reward INTEGER NOT NULL DEFAULT 10,
  credit_reward INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'active',
  due_date TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  xp_delta INTEGER DEFAULT 0,
  credit_delta INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  cost INTEGER NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'gift'
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES shop_items(id),
  equipped INTEGER NOT NULL DEFAULT 0,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_attributes_user ON attributes(user_id);
CREATE INDEX IF NOT EXISTS idx_log_user ON activity_log(user_id);
  `);
}

const db = { get, all, run, transaction, pool };
export default db;
