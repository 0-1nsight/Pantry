import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pantry',
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
