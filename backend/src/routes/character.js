import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { computeLevelState } from '../utils/rpgEngine.js';
import { computeAchievements } from '../utils/achievements.js';

const router = Router();
router.use(requireAuth);

router.get('/me', async (req, res, next) => {
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const { password_hash, ...safeUser } = user;
    safeUser.credits = safeUser.credits ?? safeUser.gold ?? 0;
    safeUser.gold = safeUser.credits;

    const levelState = computeLevelState(user.xp);
    const attributes = await db.all('SELECT * FROM attributes WHERE user_id = ? ORDER BY name', req.userId);

    const completedRow = await db.get(
      "SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'completed'",
      req.userId
    );
    const inventoryRow = await db.get('SELECT COUNT(*) as count FROM inventory WHERE user_id = ?', req.userId);

    const achievements = computeAchievements({
      level: levelState.level,
      longestStreak: user.longest_streak || 0,
      completedTasksCount: Number(completedRow.count),
      inventoryCount: Number(inventoryRow.count),
    });

    res.json({ user: safeUser, levelState, attributes, achievements });
  } catch (err) {
    next(err);
  }
});

router.get('/activity', async (req, res, next) => {
  try {
    const logs = await db.all(
      'SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      req.userId
    );
    res.json({
      logs: logs.map((log) => ({
        ...log,
        credit_delta: log.credit_delta ?? log.gold_delta ?? 0,
        gold_delta: log.credit_delta ?? log.gold_delta ?? 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/theme', async (req, res, next) => {
  try {
    const { theme } = req.body || {};
    const allowed = ['netrunner', 'street_samurai', 'techie', 'corpo', 'fixer', 'cyberpunk', 'knight', 'mage'];
    if (!allowed.includes(theme)) {
      return res.status(400).json({ error: `Avatar theme must be one of: ${allowed.join(', ')}` });
    }
    await db.run('UPDATE users SET avatar_theme = ? WHERE id = ?', theme, req.userId);
    res.json({ success: true, theme });
  } catch (err) {
    next(err);
  }
});

export default router;
