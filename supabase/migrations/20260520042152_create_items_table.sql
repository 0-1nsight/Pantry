/*
  # Create Items Table for FindYourItems Inventory App

  ## Overview
  Creates the core items table that stores all pantry/inventory items for the FindYourItems app.

  ## New Tables

  ### `items`
  Stores individual inventory items from market or supermarket runs.
  - `id` (uuid, pk) - Unique identifier
  - `name` (text) - Item name
  - `barcode` (text, nullable) - Barcode for supermarket items
  - `source` (text) - Either 'MARKET' or 'SUPERMARKET'
  - `category` (text) - Item category (Vegetables, Fruits, Dairy, etc.)
  - `current_qty` (decimal) - Current remaining quantity
  - `initial_qty` (decimal) - Original logged quantity
  - `unit` (text) - Unit of measurement: lbs, units, %
  - `cost` (decimal) - Price paid
  - `cost_type` (text) - PER_UNIT, PER_LB, or FLAT
  - `date_logged` (timestamptz) - When the item was added
  - `shelf_life_days` (int) - How many days until expiry
  - `alert_threshold` (decimal) - Qty at which to alert for restock
  - `spoiled` (boolean) - Whether item was marked spoiled

  ## Security
  - RLS enabled
  - Public read/write allowed for MVP (no auth required)

  ## Notes
  - Uses gen_random_uuid() for ID generation
  - Defaults set for boolean and numeric fields
*/

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  barcode text,
  source text NOT NULL DEFAULT 'MARKET' CHECK (source IN ('MARKET', 'SUPERMARKET')),
  category text NOT NULL DEFAULT 'General',
  current_qty decimal(10,2) NOT NULL DEFAULT 0,
  initial_qty decimal(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'units' CHECK (unit IN ('lbs', 'units', '%')),
  cost decimal(10,2) NOT NULL DEFAULT 0,
  cost_type text NOT NULL DEFAULT 'FLAT' CHECK (cost_type IN ('PER_UNIT', 'PER_LB', 'FLAT')),
  date_logged timestamptz NOT NULL DEFAULT now(),
  shelf_life_days int NOT NULL DEFAULT 7,
  alert_threshold decimal(10,2) NOT NULL DEFAULT 1,
  spoiled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to items"
  ON items FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to items"
  ON items FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access to items"
  ON items FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to items"
  ON items FOR DELETE
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_items_source ON items(source);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_date_logged ON items(date_logged);
