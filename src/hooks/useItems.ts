import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Item, ItemInsert, ItemUpdate } from '../lib/database.types';

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('items')
        .select('*')
        .order('date_logged', { ascending: false });
      if (err) throw err;
      setItems(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = useCallback(async (item: ItemInsert): Promise<Item | null> => {
    try {
      const { data, error: err } = await supabase
        .from('items')
        .insert(item)
        .select()
        .single();
      if (err) throw err;
      setItems(prev => [data, ...prev]);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add item');
      return null;
    }
  }, []);

  const updateItem = useCallback(async (id: string, updates: ItemUpdate): Promise<boolean> => {
    try {
      const { data, error: err } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (err) throw err;
      setItems(prev => prev.map(i => i.id === id ? data : i));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update item');
      return false;
    }
  }, []);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: err } = await supabase.from('items').delete().eq('id', id);
      if (err) throw err;
      setItems(prev => prev.filter(i => i.id !== id));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete item');
      return false;
    }
  }, []);

  const markFinished = useCallback((id: string) => updateItem(id, { current_qty: 0 }), [updateItem]);
  const markSpoiled = useCallback((id: string) => updateItem(id, { spoiled: true, current_qty: 0 }), [updateItem]);

  return { items, loading, error, addItem, updateItem, deleteItem, markFinished, markSpoiled, refetch: fetchItems };
}

export function daysRemaining(item: Item): number {
  const logged = new Date(item.date_logged).getTime();
  const expiry = logged + item.shelf_life_days * 24 * 60 * 60 * 1000;
  return Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000));
}

export function depletionPercent(item: Item): number {
  if (item.initial_qty === 0) return 0;
  return Math.max(0, Math.min(100, (item.current_qty / item.initial_qty) * 100));
}

export function preciseQty(value: number, increment = 0.25): number {
  return Math.round(value / increment) * increment;
}

export function formatQty(value: number, unit: string): string {
  if (unit === 'lbs') return `${value.toFixed(2)} lbs`;
  if (unit === '%') return `${Math.round(value)}%`;
  return `${Math.round(value)} units`;
}
