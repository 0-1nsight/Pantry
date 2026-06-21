import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth.js';
import itemsRoutes from './items.js';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/items', itemsRoutes);

// Initialize database tables
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      barcode TEXT,
      source TEXT NOT NULL DEFAULT 'MARKET' CHECK (source IN ('MARKET', 'SUPERMARKET')),
      category TEXT NOT NULL DEFAULT 'General',
      current_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
      initial_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'units' CHECK (unit IN ('lbs', 'units', '%')),
      cost DECIMAL(10,2) NOT NULL DEFAULT 0,
      cost_type TEXT NOT NULL DEFAULT 'FLAT' CHECK (cost_type IN ('PER_UNIT', 'PER_LB', 'FLAT')),
      date_logged TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      shelf_life_days INT NOT NULL DEFAULT 7,
      alert_threshold DECIMAL(10,2) NOT NULL DEFAULT 1,
      spoiled BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
    CREATE INDEX IF NOT EXISTS idx_items_date_logged ON items(date_logged);
  `);

  console.log('Database initialized');
}

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
