import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/items', (req, res) => {
  const items = db.prepare('SELECT * FROM shop_items ORDER BY cost ASC').all();
  const owned = db.prepare('SELECT item_id FROM inventory WHERE user_id = ?').all(req.userId);
  const ownedIds = new Set(owned.map((o) => o.item_id));
  res.json({ items: items.map((it) => ({ ...it, owned: ownedIds.has(it.id) })) });
});

router.get('/inventory', (req, res) => {
  const rows = db
    .prepare(
      `SELECT inv.id, inv.equipped, inv.acquired_at, si.* FROM inventory inv
       JOIN shop_items si ON si.id = inv.item_id
       WHERE inv.user_id = ? ORDER BY inv.acquired_at DESC`
    )
    .all(req.userId);
  res.json({ inventory: rows });
});

router.post('/buy/:itemId', (req, res) => {
  const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found in Grid marketplace.' });

  const alreadyOwned = db
    .prepare('SELECT id FROM inventory WHERE user_id = ? AND item_id = ?')
    .get(req.userId, item.id);
  if (alreadyOwned) return res.status(409).json({ error: 'Item already in your inventory.' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const currentCredits = user.credits ?? user.gold ?? 0;
  if (currentCredits < item.cost) {
    const diff = item.cost - currentCredits;
    return res.status(400).json({
      error: `Insufficient Credits. You need ${diff} more Credits to authorize this transaction.`,
      missingCredits: diff,
    });
  }

  const newCredits = currentCredits - item.cost;

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET credits = ? WHERE id = ?').run(newCredits, req.userId);
    db.prepare('INSERT INTO inventory (id, user_id, item_id) VALUES (?, ?, ?)').run(uuid(), req.userId, item.id);
    db.prepare(
      `INSERT INTO activity_log (id, user_id, type, message, credit_delta) VALUES (?, ?, 'purchase', ?, ?)`
    ).run(uuid(), req.userId, `Acquired "${item.name}"`, -item.cost);
  });
  tx();

  res.json({
    success: true,
    remainingCredits: newCredits,
    remainingGold: newCredits,
    item,
  });
});

router.patch('/equip/:itemId', (req, res) => {
  const owned = db
    .prepare(
      `SELECT inv.*, si.category FROM inventory inv 
       JOIN shop_items si ON si.id = inv.item_id 
       WHERE inv.user_id = ? AND inv.item_id = ?`
    )
    .get(req.userId, req.params.itemId);
  if (!owned) return res.status(404).json({ error: 'Item not found in your inventory.' });

  const tx = db.transaction(() => {
    // Unequip others in the same category, then equip this one
    db.prepare(
      `UPDATE inventory SET equipped = 0 WHERE user_id = ? AND item_id IN (
         SELECT id FROM shop_items WHERE category = ?
       )`
    ).run(req.userId, owned.category);
    db.prepare('UPDATE inventory SET equipped = 1 WHERE user_id = ? AND item_id = ?').run(req.userId, req.params.itemId);
  });
  tx();

  res.json({ success: true, equippedItemId: req.params.itemId });
});

export default router;
