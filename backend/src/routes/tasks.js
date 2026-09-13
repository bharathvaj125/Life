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

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let rows;
    if (status && ['active', 'completed', 'archived'].includes(status)) {
      rows = await db.all(
        'SELECT * FROM tasks WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
        req.userId,
        status
      );
    } else {
      rows = await db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', req.userId);
    }
    res.json({ tasks: rows.map(mapTaskRow) });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
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

    await db.run(
      `INSERT INTO tasks (id, user_id, title, description, attribute, difficulty, xp_reward, credit_reward, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      req.userId,
      title.trim(),
      description.trim(),
      attribute,
      difficulty,
      xp,
      credits,
      due_date
    );

    // Auto-create attribute category for user if custom
    const existingAttr = await db.get('SELECT id FROM attributes WHERE user_id = ? AND name = ?', req.userId, attribute);
    if (!existingAttr) {
      await db.run('INSERT INTO attributes (id, user_id, name) VALUES (?, ?, ?)', uuid(), req.userId, attribute);
    }

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', id);
    res.status(201).json({ task: mapTaskRow(task) });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', req.params.id, req.userId);
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

    const setClause = keys.map((k) => `${k} = ?`).join(', ') + ', updated_at = NOW()';
    await db.run(`UPDATE tasks SET ${setClause} WHERE id = ?`, ...keys.map((k) => updates[k]), task.id);

    const updated = await db.get('SELECT * FROM tasks WHERE id = ?', task.id);
    res.json({ task: mapTaskRow(updated) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', req.params.id, req.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Mission not found.' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * Complete a mission: the heart of the RPG engine.
 * Grants XP + Credits, updates attribute progress, evaluates streak, and returns
 * a rich payload describing exactly what changed for celebratory animations.
 */
router.post('/:id/complete', async (req, res, next) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', req.params.id, req.userId);
    if (!task) return res.status(404).json({ error: 'Mission not found.' });
    if (task.status === 'completed') return res.status(400).json({ error: 'Mission already completed.' });

    const user = await db.get('SELECT * FROM users WHERE id = ?', req.userId);
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

    await db.transaction(async (tx) => {
      await tx.run(
        `UPDATE tasks SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = ?`,
        task.id
      );

      await tx.run(
        `UPDATE users SET xp = ?, credits = ?, level = ?, current_streak = ?, longest_streak = ?, last_active_date = ? WHERE id = ?`,
        newTotalXp,
        newCredits,
        afterLevel,
        streakResult.currentStreak,
        streakResult.longestStreak,
        streakResult.lastActiveDate,
        req.userId
      );

      // Attribute XP + leveling
      const attr = await tx.get('SELECT * FROM attributes WHERE user_id = ? AND name = ?', req.userId, task.attribute);
      if (attr) {
        const attrLevelState = computeLevelState(attr.xp + task.xp_reward);
        await tx.run(
          'UPDATE attributes SET xp = ?, level = ? WHERE id = ?',
          attr.xp + task.xp_reward,
          attrLevelState.level,
          attr.id
        );
      }

      await tx.run(
        `INSERT INTO activity_log (id, user_id, type, message, xp_delta, credit_delta) VALUES (?, ?, 'mission_complete', ?, ?, ?)`,
        uuid(),
        req.userId,
        `Completed "${task.title}"`,
        task.xp_reward,
        taskCredits
      );

      if (bonusCredits > 0) {
        await tx.run(
          `INSERT INTO activity_log (id, user_id, type, message, credit_delta) VALUES (?, ?, 'streak_bonus', ?, ?)`,
          uuid(),
          req.userId,
          `${streakResult.currentStreak}-day uplink streak bonus!`,
          bonusCredits
        );
      }
      if (leveledUp) {
        await tx.run(
          `INSERT INTO activity_log (id, user_id, type, message) VALUES (?, ?, 'level_up', ?)`,
          uuid(),
          req.userId,
          `Uplink Level ${afterLevel} unlocked!`
        );
      }
    });

    const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', req.userId);
    const { password_hash, ...safeUser } = updatedUser;
    // Ensure both credits and gold are exposed
    safeUser.credits = safeUser.credits ?? safeUser.gold ?? 0;
    safeUser.gold = safeUser.credits;

    res.json({
      task: mapTaskRow(await db.get('SELECT * FROM tasks WHERE id = ?', task.id)),
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
  } catch (err) {
    next(err);
  }
});

export default router;
