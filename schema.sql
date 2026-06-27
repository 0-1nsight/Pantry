-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS home;

-- Users table (authentication credentials)
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table (public user data)
CREATE TABLE IF NOT EXISTS auth.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items table
CREATE TABLE IF NOT EXISTS home.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_auth_profiles_username ON auth.profiles(username);
CREATE INDEX IF NOT EXISTS idx_home_items_user_id ON home.items(user_id);
CREATE INDEX IF NOT EXISTS idx_home_items_date_logged ON home.items(date_logged);
CREATE INDEX IF NOT EXISTS idx_home_items_category ON home.items(category);
