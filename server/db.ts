import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Production settings
  max: 20, // max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export default pool;

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const { rows } = await pool.query(text, params);
  return rows;
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const { rows } = await pool.query(text, params);
  return rows[0] ?? null;
}

// Graceful shutdown
export async function closePool() {
  await pool.end();
}
