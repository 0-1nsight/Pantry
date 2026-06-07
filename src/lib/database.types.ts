export type Source = 'MARKET' | 'SUPERMARKET';
export type Unit = 'lbs' | 'units' | '%';
export type CostType = 'PER_UNIT' | 'PER_LB' | 'FLAT';

export interface Item {
  id: string;
  name: string;
  barcode: string | null;
  source: Source;
  category: string;
  current_qty: number;
  initial_qty: number;
  unit: Unit;
  cost: number;
  cost_type: CostType;
  date_logged: string;
  shelf_life_days: number;
  alert_threshold: number;
  spoiled: boolean;
  created_at: string;
}

export type ItemInsert = Omit<Item, 'id' | 'created_at'>;
export type ItemUpdate = Partial<Omit<Item, 'id' | 'created_at'>>;

export interface Database {
  public: {
    Tables: {
      items: {
        Row: Item;
        Insert: ItemInsert;
        Update: ItemUpdate;
      };
    };
  };
}

export const MARKET_CATEGORIES = [
  { name: 'Vegetables', icon: '🥦', shelfDays: 5 },
  { name: 'Fruits', icon: '🍎', shelfDays: 7 },
  { name: 'Root Crops', icon: '🥕', shelfDays: 14 },
  { name: 'Herbs', icon: '🌿', shelfDays: 4 },
  { name: 'Fish & Seafood', icon: '🐟', shelfDays: 2 },
  { name: 'Meat', icon: '🥩', shelfDays: 3 },
  { name: 'Eggs & Dairy', icon: '🥚', shelfDays: 10 },
  { name: 'Grains', icon: '🌾', shelfDays: 60 },
];

export const SUPERMARKET_CATEGORIES = [
  'Canned Goods',
  'Beverages',
  'Condiments',
  'Snacks',
  'Frozen Foods',
  'Personal Care',
  'Cleaning',
  'Household',
];

export const SHELF_LIFE_DEFAULTS: Record<string, number> = {
  Vegetables: 5,
  Fruits: 7,
  'Root Crops': 14,
  Herbs: 4,
  'Fish & Seafood': 2,
  Meat: 3,
  'Eggs & Dairy': 10,
  Grains: 60,
  'Canned Goods': 730,
  Beverages: 180,
  Condiments: 365,
  Snacks: 90,
  'Frozen Foods': 90,
  'Personal Care': 365,
  Cleaning: 365,
  Household: 365,
  General: 30,
};

export const FRESH_CATEGORIES = new Set([
  'Vegetables', 'Fruits', 'Root Crops', 'Herbs', 'Fish & Seafood', 'Meat', 'Eggs & Dairy', 'Grains',
]);
