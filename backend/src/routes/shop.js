import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/items', async (req, res, next) => {
  try {
    const items = await db.all('SELECT * FROM shop_items ORDER BY cost ASC');
    const owned = await db.all('SELECT item_id FROM inventory WHERE user_id = ?', req.userId);
    const ownedIds = new Set(owned.map((o) => o.item_id));
    res.json({ items: items.map((it) => ({ ...it, owned: ownedIds.has(it.id) })) });
  } catch (err) {
    next(err);
  }
});

router.get('/inventory', async (req, res, next) => {
  try {
    const rows = await db.all(
      `SELECT inv.id, inv.equipped, inv.acquired_at, si.* FROM inventory inv
       JOIN shop_items si ON si.id = inv.item_id
       WHERE inv.user_id = ? ORDER BY inv.acquired_at DESC`,
      req.userId
    );
    res.json({ inventory: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/buy/:itemId', async (req, res, next) => {
  try {
    const item = await db.get('SELECT * FROM shop_items WHERE id = ?', req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found in Grid marketplace.' });

    const alreadyOwned = await db.get(
      'SELECT id FROM inventory WHERE user_id = ? AND item_id = ?',
      req.userId,
      item.id
    );
    if (alreadyOwned) return res.status(409).json({ error: 'Item already in your inventory.' });

    const user = await db.get('SELECT * FROM users WHERE id = ?', req.userId);
    const currentCredits = user.credits ?? user.gold ?? 0;
    if (currentCredits < item.cost) {
      const diff = item.cost - currentCredits;
      return res.status(400).json({
        error: `Insufficient Credits. You need ${diff} more Credits to authorize this transaction.`,
        missingCredits: diff,
      });
    }

    const newCredits = currentCredits - item.cost;

    await db.transaction(async (tx) => {
      await tx.run('UPDATE users SET credits = ? WHERE id = ?', newCredits, req.userId);
      await tx.run('INSERT INTO inventory (id, user_id, item_id) VALUES (?, ?, ?)', uuid(), req.userId, item.id);
      await tx.run(
        `INSERT INTO activity_log (id, user_id, type, message, credit_delta) VALUES (?, ?, 'purchase', ?, ?)`,
        uuid(),
        req.userId,
        `Acquired "${item.name}"`,
        -item.cost
      );
    });

    res.json({
      success: true,
      remainingCredits: newCredits,
      remainingGold: newCredits,
      item,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/equip/:itemId', async (req, res, next) => {
  try {
    const owned = await db.get(
      `SELECT inv.*, si.category FROM inventory inv
       JOIN shop_items si ON si.id = inv.item_id
       WHERE inv.user_id = ? AND inv.item_id = ?`,
      req.userId,
      req.params.itemId
    );
    if (!owned) return res.status(404).json({ error: 'Item not found in your inventory.' });

    await db.transaction(async (tx) => {
      // Unequip others in the same category, then equip this one
      await tx.run(
        `UPDATE inventory SET equipped = 0 WHERE user_id = ? AND item_id IN (
           SELECT id FROM shop_items WHERE category = ?
         )`,
        req.userId,
        owned.category
      );
      await tx.run('UPDATE inventory SET equipped = 1 WHERE user_id = ? AND item_id = ?', req.userId, req.params.itemId);
    });

    res.json({ success: true, equippedItemId: req.params.itemId });
  } catch (err) {
    next(err);
  }
});

export default router;
