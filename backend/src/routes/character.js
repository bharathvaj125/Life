import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { computeLevelState } from '../utils/rpgEngine.js';
import { computeAchievements } from '../utils/achievements.js';

const router = Router();
router.use(requireAuth);

router.get('/me', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const { password_hash, ...safeUser } = user;
  safeUser.credits = safeUser.credits ?? safeUser.gold ?? 0;
  safeUser.gold = safeUser.credits;

  const levelState = computeLevelState(user.xp);
  const attributes = db.prepare('SELECT * FROM attributes WHERE user_id = ? ORDER BY name').all(req.userId);

  const { count: completedTasksCount } = db
    .prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'completed'")
    .get(req.userId);
  const { count: inventoryCount } = db
    .prepare('SELECT COUNT(*) as count FROM inventory WHERE user_id = ?')
    .get(req.userId);

  const achievements = computeAchievements({
    level: levelState.level,
    longestStreak: user.longest_streak || 0,
    completedTasksCount,
    inventoryCount,
  });

  res.json({ user: safeUser, levelState, attributes, achievements });
});

router.get('/activity', (req, res) => {
  const logs = db
    .prepare('SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
    .all(req.userId);
  res.json({
    logs: logs.map((log) => ({
      ...log,
      credit_delta: log.credit_delta ?? log.gold_delta ?? 0,
      gold_delta: log.credit_delta ?? log.gold_delta ?? 0,
    })),
  });
});

router.patch('/theme', (req, res) => {
  const { theme } = req.body || {};
  const allowed = ['netrunner', 'street_samurai', 'techie', 'corpo', 'fixer', 'cyberpunk', 'knight', 'mage'];
  if (!allowed.includes(theme)) {
    return res.status(400).json({ error: `Avatar theme must be one of: ${allowed.join(', ')}` });
  }
  db.prepare('UPDATE users SET avatar_theme = ? WHERE id = ?').run(theme, req.userId);
  res.json({ success: true, theme });
});

export default router;
