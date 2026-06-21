-- Users table (authentication credentials)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table (public user data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_date_logged ON items(date_logged);
