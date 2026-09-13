import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import db from '../db/index.js';

const router = Router();

const DEFAULT_ATTRIBUTES = [
  { name: 'Intellect', icon: 'brain' },
  { name: 'Strength', icon: 'dumbbell' },
  { name: 'Discipline', icon: 'shield' },
  { name: 'Creativity', icon: 'palette' },
];

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'dev-secret-cyberpunk-rpg', { expiresIn: '30d' });
}

function sanitizeUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  rest.credits = rest.credits ?? rest.gold ?? 50;
  rest.gold = rest.credits;
  return rest;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/signup', async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are all required.' });
    }
    if (username.trim().length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ? OR username = ?', email, username);
    if (existing) {
      return res.status(409).json({ error: 'An operative with that codename or uplink email already exists.' });
    }

    const id = uuid();
    const hash = bcrypt.hashSync(password, 10);

    await db.transaction(async (tx) => {
      await tx.run(
        `INSERT INTO users (id, username, email, password_hash, credits, avatar_theme) VALUES (?, ?, ?, ?, 50, 'netrunner')`,
        id,
        username.trim(),
        email.toLowerCase().trim(),
        hash
      );

      for (const attr of DEFAULT_ATTRIBUTES) {
        await tx.run(`INSERT INTO attributes (id, user_id, name, icon) VALUES (?, ?, ?, ?)`, uuid(), id, attr.name, attr.icon);
      }

      await tx.run(
        `INSERT INTO activity_log (id, user_id, type, message) VALUES (?, ?, 'system', 'Neural Uplink Initialized. Welcome to Night City Grid.')`,
        uuid(),
        id
      );
    });

    const user = await db.get('SELECT * FROM users WHERE id = ?', id);
    const token = signToken(id);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body || {};
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/username and password are required.' });
    }
    const user = await db.get(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      emailOrUsername.toLowerCase().trim(),
      emailOrUsername.trim()
    );

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Access Denied: Invalid credentials.' });
    }

    const token = signToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

export default router;
