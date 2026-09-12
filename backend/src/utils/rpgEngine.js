/**
 * RPG Progression Engine
 * Pure, unit-testable functions for leveling, streaks, and difficulty rewards.
 *
 * Non-linear leveling curve:
 * XP required to advance from level N to N+1:
 *   xpForLevel(N) = floor(BASE * N^1.5) with BASE = 25.
 *
 * Level 1 -> 2: floor(25 * 1^1.5) = 25 XP
 * Level 2 -> 3: floor(25 * 2^1.5) = 70 XP
 * Level 3 -> 4: floor(25 * 3^1.5) = 129 XP
 */
export const BASE_XP = 25;

export function xpForLevel(level) {
  if (level < 1) return 0;
  return Math.floor(BASE_XP * Math.pow(level, 1.5));
}

/** Total cumulative XP required to REACH a given level from level 1. */
export function totalXpForLevel(level) {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

/**
 * Given a total lifetime XP count, derive the current level, xp progress into
 * that level, xp needed for the next level, and progress percentage.
 */
export function computeLevelState(totalXp = 0) {
  const safeXp = Math.max(0, Math.floor(totalXp || 0));
  let level = 1;
  let remaining = safeXp;

  while (true) {
    const needed = xpForLevel(level);
    if (remaining >= needed) {
      remaining -= needed;
      level += 1;
      if (level > 999) break; // safety
    } else {
      break;
    }
  }

  const xpForNext = xpForLevel(level);
  const progressPct = xpForNext > 0 ? Math.min(100, Math.round((remaining / xpForNext) * 100)) : 100;

  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: xpForNext,
    totalXp: safeXp,
    progressPct,
  };
}

export const DIFFICULTY_TABLE = {
  trivial: { xp: 5, credits: 2 },
  easy: { xp: 10, credits: 5 },
  medium: { xp: 20, credits: 10 },
  hard: { xp: 35, credits: 18 },
  epic: { xp: 60, credits: 35 },
};

export function rewardsForDifficulty(difficulty) {
  const norm = (difficulty || '').toLowerCase();
  return DIFFICULTY_TABLE[norm] || DIFFICULTY_TABLE.medium;
}

/**
 * Streak logic: compares the last active date (YYYY-MM-DD) to today.
 * - Same day: no-op (streak unchanged, changed = false).
 * - Exactly 1 day gap: streak increments by 1.
 * - More than 1 day gap (or no prior date): streak resets to 1.
 */
export function computeStreak({ lastActiveDate, currentStreak = 0, longestStreak = 0, currentDate } = {}) {
  const today = currentDate || new Date().toISOString().slice(0, 10);

  if (lastActiveDate === today) {
    return {
      currentStreak,
      longestStreak,
      lastActiveDate: today,
      changed: false,
    };
  }

  // Calculate day difference using UTC dates
  let newStreak = 1;
  if (lastActiveDate) {
    const lastTime = new Date(`${lastActiveDate}T00:00:00Z`).getTime();
    const currTime = new Date(`${today}T00:00:00Z`).getTime();
    const diffDays = Math.round((currTime - lastTime) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak = currentStreak + 1;
    } else {
      newStreak = 1;
    }
  }

  const newLongest = Math.max(longestStreak || 0, newStreak);
  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActiveDate: today,
    changed: true,
  };
}

/** Streak milestone bonus credits awarded at 3, 7, 14, 30, 60, 100 day marks. */
export const STREAK_MILESTONES = {
  3: 15,
  7: 40,
  14: 90,
  30: 200,
  60: 450,
  100: 1000,
};

export function streakBonus(streak) {
  return STREAK_MILESTONES[streak] || 0;
}
