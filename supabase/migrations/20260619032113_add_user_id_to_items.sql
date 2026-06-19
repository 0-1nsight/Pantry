/*
  # Add User ID and Multi-Tenant RLS

  ## Overview
  Adds user_id column to items table for multi-tenant support.
  Updates RLS policies to enforce data isolation per authenticated user.

  ## Changes
  - Add user_id column (uuid, references auth.users)
  - Create index on user_id for query performance
  - Drop existing public policies
  - Add authenticated user policies using auth.uid()
*/

-- Add user_id column
ALTER TABLE items ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);

-- Drop old public policies
DROP POLICY IF EXISTS "Allow public read access to items" ON items;
DROP POLICY IF EXISTS "Allow public insert access to items" ON items;
DROP POLICY IF EXISTS "Allow public update access to items" ON items;
DROP POLICY IF EXISTS "Allow public delete access to items" ON items;

-- New RLS policies for authenticated users
CREATE POLICY "Users can view own items" ON items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items" ON items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own items" ON items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
