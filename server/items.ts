import { Router } from 'express';
import { authMiddleware } from './auth.js';
import { query, queryOne } from './db.js';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// Get all items for user
router.get('/', async (req: any, res) => {
  try {
    const items = await query(
      `SELECT id, user_id, name, barcode, source, category, current_qty, initial_qty, unit, cost, cost_type, date_logged, shelf_life_days, alert_threshold, spoiled, created_at
       FROM items WHERE user_id = $1 ORDER BY date_logged DESC`,
      [req.user.id]
    );
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Create item
router.post('/', async (req: any, res) => {
  const { name, barcode, source, category, current_qty, initial_qty, unit, cost, cost_type, date_logged, shelf_life_days, alert_threshold } = req.body;
  if (!name || !source) {
    return res.status(400).json({ error: 'Name and source required' });
  }

  try {
    const item = await queryOne(
      `INSERT INTO items (user_id, name, barcode, source, category, current_qty, initial_qty, unit, cost, cost_type, date_logged, shelf_life_days, alert_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, user_id, name, barcode, source, category, current_qty, initial_qty, unit, cost, cost_type, date_logged, shelf_life_days, alert_threshold, spoiled, created_at`,
      [req.user.id, name, barcode || null, source, category || 'General', current_qty ?? 0, initial_qty ?? 0, unit || 'units', cost ?? 0, cost_type || 'FLAT', date_logged || new Date().toISOString(), shelf_life_days ?? 7, alert_threshold ?? 1]
    );
    res.status(201).json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update item
router.patch('/:id', async (req: any, res) => {
  const { id } = req.params;
  const { name, barcode, source, category, current_qty, initial_qty, unit, cost, cost_type, shelf_life_days, alert_threshold, spoiled } = req.body;

  try {
    const existing = await queryOne<{ user_id: string }>(`SELECT user_id FROM items WHERE id = $1`, [id]);
    if (!existing) return res.status(404).json({ error: 'Item not found' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const addField = (col: string, val: unknown) => {
      if (val !== undefined) { fields.push(`${col} = $${idx}`); values.push(val); idx++; }
    };

    addField('name', name);
    addField('barcode', barcode);
    addField('source', source);
    addField('category', category);
    addField('current_qty', current_qty);
    addField('initial_qty', initial_qty);
    addField('unit', unit);
    addField('cost', cost);
    addField('cost_type', cost_type);
    addField('shelf_life_days', shelf_life_days);
    addField('alert_threshold', alert_threshold);
    addField('spoiled', spoiled);

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);
    const item = await queryOne(
      `UPDATE items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, user_id, name, barcode, source, category, current_qty, initial_qty, unit, cost, cost_type, date_logged, shelf_life_days, alert_threshold, spoiled, created_at`,
      values
    );
    res.json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item
router.delete('/:id', async (req: any, res) => {
  const { id } = req.params;

  try {
    const existing = await queryOne<{ user_id: string }>(`SELECT user_id FROM items WHERE id = $1`, [id]);
    if (!existing) return res.status(404).json({ error: 'Item not found' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await query(`DELETE FROM items WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
