import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import {
  computeLevelState,
  rewardsForDifficulty,
  computeStreak,
  streakBonus,
} from '../utils/rpgEngine.js';

const router = Router();
router.use(requireAuth);

const VALID_DIFFICULTIES = ['trivial', 'easy', 'medium', 'hard', 'epic'];

function mapTaskRow(row) {
  if (!row) return null;
  // Ensure credit_reward / gold_reward consistency
  const credits = row.credit_reward ?? row.gold_reward ?? 5;
  return {
    ...row,
    credit_reward: credits,
    gold_reward: credits, // backward compat
  };
}

router.get('/', (req, res) => {
  const { status } = req.query;
  let rows;
  if (status && ['active', 'completed', 'archived'].includes(status)) {
    rows = db
      .prepare('SELECT * FROM tasks WHERE user_id = ? AND status = ? ORDER BY created_at DESC')
      .all(req.userId, status);
  } else {
    rows = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  }
  res.json({ tasks: rows.map(mapTaskRow) });
});

router.post('/', (req, res) => {
  const { title, description = '', attribute = 'General', difficulty = 'medium', due_date = null } = req.body || {};

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'A mission requires a title.' });
  }
  if (title.trim().length > 120) {
    return res.status(400).json({ error: 'Title must be 120 characters or fewer.' });
  }
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ error: `Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}` });
  }

  const { xp, credits } = rewardsForDifficulty(difficulty);
  const id = uuid();

  db.prepare(
    `INSERT INTO tasks (id, user_id, title, description, attribute, difficulty, xp_reward, credit_reward, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.userId, title.trim(), description.trim(), attribute, difficulty, xp, credits, due_date);

  // Auto-create attribute category for user if custom
  const existingAttr = db.prepare('SELECT id FROM attributes WHERE user_id = ? AND name = ?').get(req.userId, attribute);
  if (!existingAttr) {
    db.prepare('INSERT INTO attributes (id, user_id, name) VALUES (?, ?, ?)').run(uuid(), req.userId, attribute);
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json({ task: mapTaskRow(task) });
});

router.patch('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: 'Mission not found.' });
  if (task.status === 'completed') {
    return res.status(400).json({ error: 'Completed missions cannot be edited.' });
  }

  const { title, description, attribute, difficulty, due_date } = req.body || {};
  const updates = {};
  if (title !== undefined) {
    if (!title.trim()) return res.status(400).json({ error: 'Title cannot be empty.' });
    updates.title = title.trim();
  }
  if (description !== undefined) updates.description = description.trim();
  if (attribute !== undefined) updates.attribute = attribute;
  if (due_date !== undefined) updates.due_date = due_date;
  if (difficulty !== undefined) {
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ error: `Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}` });
    }
    const { xp, credits } = rewardsForDifficulty(difficulty);
    updates.difficulty = difficulty;
    updates.xp_reward = xp;
    updates.credit_reward = credits;
  }

  const keys = Object.keys(updates);
  if (keys.length === 0) return res.status(400).json({ error: 'No valid fields to update.' });

  const setClause = keys.map((k) => `${k} = ?`).join(', ') + ", updated_at = datetime('now')";
  db.prepare(`UPDATE tasks SET ${setClause} WHERE id = ?`).run(...keys.map((k) => updates[k]), task.id);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
  res.json({ task: mapTaskRow(updated) });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Mission not found.' });
  res.json({ success: true });
});

/**
 * Complete a mission: the heart of the RPG engine.
 * Grants XP + Credits, updates attribute progress, evaluates streak, and returns
 * a rich payload describing exactly what changed for celebratory animations.
 */
router.post('/:id/complete', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: 'Mission not found.' });
  if (task.status === 'completed') return res.status(400).json({ error: 'Mission already completed.' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const currentCredits = user.credits ?? user.gold ?? 0;
  const beforeLevel = computeLevelState(user.xp).level;

  const streakResult = computeStreak({
    lastActiveDate: user.last_active_date,
    currentStreak: user.current_streak,
    longestStreak: user.longest_streak,
  });
  const bonusCredits = streakResult.changed ? streakBonus(streakResult.currentStreak) : 0;

  const taskCredits = task.credit_reward ?? task.gold_reward ?? 5;
  const newTotalXp = user.xp + task.xp_reward;
  const newCredits = currentCredits + taskCredits + bonusCredits;
  const afterLevel = computeLevelState(newTotalXp).level;
  const leveledUp = afterLevel > beforeLevel;

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE tasks SET status = 'completed', completed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
    ).run(task.id);

    db.prepare(
      `UPDATE users SET xp = ?, credits = ?, level = ?, current_streak = ?, longest_streak = ?, last_active_date = ? WHERE id = ?`
    ).run(newTotalXp, newCredits, afterLevel, streakResult.currentStreak, streakResult.longestStreak, streakResult.lastActiveDate, req.userId);

    // Attribute XP + leveling
    const attr = db.prepare('SELECT * FROM attributes WHERE user_id = ? AND name = ?').get(req.userId, task.attribute);
    if (attr) {
      const attrLevelState = computeLevelState(attr.xp + task.xp_reward);
      db.prepare('UPDATE attributes SET xp = ?, level = ? WHERE id = ?').run(
        attr.xp + task.xp_reward,
        attrLevelState.level,
        attr.id
      );
    }

    db.prepare(
      `INSERT INTO activity_log (id, user_id, type, message, xp_delta, credit_delta) VALUES (?, ?, 'mission_complete', ?, ?, ?)`
    ).run(uuid(), req.userId, `Completed "${task.title}"`, task.xp_reward, taskCredits);

    if (bonusCredits > 0) {
      db.prepare(
        `INSERT INTO activity_log (id, user_id, type, message, credit_delta) VALUES (?, ?, 'streak_bonus', ?, ?)`
      ).run(uuid(), req.userId, `${streakResult.currentStreak}-day uplink streak bonus!`, bonusCredits);
    }
    if (leveledUp) {
      db.prepare(
        `INSERT INTO activity_log (id, user_id, type, message) VALUES (?, ?, 'level_up', ?)`
      ).run(uuid(), req.userId, `Uplink Level ${afterLevel} unlocked!`);
    }
  });
  tx();

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const { password_hash, ...safeUser } = updatedUser;
  // Ensure both credits and gold are exposed
  safeUser.credits = safeUser.credits ?? safeUser.gold ?? 0;
  safeUser.gold = safeUser.credits;

  res.json({
    task: mapTaskRow(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id)),
    user: safeUser,
    levelState: computeLevelState(updatedUser.xp),
    leveledUp,
    streak: streakResult,
    bonusCredits,
    bonusGold: bonusCredits, // backward compat
    rewards: {
      xp: task.xp_reward,
      credits: taskCredits,
      gold: taskCredits,
    },
  });
});

export default router;
