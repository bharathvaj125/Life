import test from 'node:test';
import assert from 'node:assert/strict';
import {
  xpForLevel,
  totalXpForLevel,
  computeLevelState,
  rewardsForDifficulty,
  computeStreak,
  streakBonus,
  BASE_XP,
} from '../src/utils/rpgEngine.js';

test('Leveling Curve: xpForLevel calculation', () => {
  assert.equal(BASE_XP, 25);
  // Level 1 -> 2: floor(25 * 1^1.5) = 25
  assert.equal(xpForLevel(1), 25);
  // Level 2 -> 3: floor(25 * 2^1.5) = floor(25 * 2.8284) = 70
  assert.equal(xpForLevel(2), 70);
  // Level 3 -> 4: floor(25 * 3^1.5) = floor(25 * 5.196) = 129
  assert.equal(xpForLevel(3), 129);
  // Level 10 -> 11: floor(25 * 10^1.5) = floor(25 * 31.6227) = 790
  assert.equal(xpForLevel(10), 790);
});

test('Leveling Curve: totalXpForLevel accumulation', () => {
  assert.equal(totalXpForLevel(1), 0);
  assert.equal(totalXpForLevel(2), 25);
  assert.equal(totalXpForLevel(3), 25 + 70); // 95
  assert.equal(totalXpForLevel(4), 25 + 70 + 129); // 224
});

test('Leveling Curve: computeLevelState returns correct level and progress', () => {
  // 0 XP -> Level 1, 0 into level, 25 needed, 0%
  const state0 = computeLevelState(0);
  assert.deepEqual(state0, {
    level: 1,
    xpIntoLevel: 0,
    xpForNextLevel: 25,
    totalXp: 0,
    progressPct: 0,
  });

  // 24 XP -> Level 1, 24 into level, 25 needed, 96%
  const state24 = computeLevelState(24);
  assert.equal(state24.level, 1);
  assert.equal(state24.xpIntoLevel, 24);
  assert.equal(state24.progressPct, 96);

  // Exactly 25 XP -> Level 2, 0 into level, 70 needed, 0%
  const state25 = computeLevelState(25);
  assert.equal(state25.level, 2);
  assert.equal(state25.xpIntoLevel, 0);
  assert.equal(state25.xpForNextLevel, 70);
  assert.equal(state25.progressPct, 0);

  // 94 XP -> Level 2, 69 into level, 70 needed, 99%
  const state94 = computeLevelState(94);
  assert.equal(state94.level, 2);
  assert.equal(state94.xpIntoLevel, 69);
  assert.equal(state94.progressPct, 99);

  // 95 XP -> Level 3, 0 into level, 129 needed, 0%
  const state95 = computeLevelState(95);
  assert.equal(state95.level, 3);
  assert.equal(state95.xpIntoLevel, 0);
  assert.equal(state95.xpForNextLevel, 129);
});

test('Difficulty-scaled rewards: 5 tiers strictly respected', () => {
  assert.deepEqual(rewardsForDifficulty('trivial'), { xp: 5, credits: 2 });
  assert.deepEqual(rewardsForDifficulty('easy'), { xp: 10, credits: 5 });
  assert.deepEqual(rewardsForDifficulty('medium'), { xp: 20, credits: 10 });
  assert.deepEqual(rewardsForDifficulty('hard'), { xp: 35, credits: 18 });
  assert.deepEqual(rewardsForDifficulty('epic'), { xp: 60, credits: 35 });
  // Fallback defaults to medium
  assert.deepEqual(rewardsForDifficulty('unknown'), { xp: 20, credits: 10 });
});

test('Streaks: computeStreak transitions', () => {
  // First time active
  const s1 = computeStreak({
    lastActiveDate: null,
    currentStreak: 0,
    longestStreak: 0,
    currentDate: '2026-09-12',
  });
  assert.equal(s1.currentStreak, 1);
  assert.equal(s1.longestStreak, 1);
  assert.equal(s1.lastActiveDate, '2026-09-12');
  assert.equal(s1.changed, true);

  // Same day -> no change
  const sSame = computeStreak({
    lastActiveDate: '2026-09-12',
    currentStreak: 1,
    longestStreak: 1,
    currentDate: '2026-09-12',
  });
  assert.equal(sSame.currentStreak, 1);
  assert.equal(sSame.changed, false);

  // Consecutive day (+1 day) -> increments streak
  const sConsecutive = computeStreak({
    lastActiveDate: '2026-09-12',
    currentStreak: 1,
    longestStreak: 1,
    currentDate: '2026-09-13',
  });
  assert.equal(sConsecutive.currentStreak, 2);
  assert.equal(sConsecutive.longestStreak, 2);
  assert.equal(sConsecutive.changed, true);

  // Broken streak (gap > 1 day) -> resets to 1
  const sBroken = computeStreak({
    lastActiveDate: '2026-09-10',
    currentStreak: 5,
    longestStreak: 10,
    currentDate: '2026-09-13',
  });
  assert.equal(sBroken.currentStreak, 1);
  assert.equal(sBroken.longestStreak, 10); // longest preserved
  assert.equal(sBroken.changed, true);
});

test('Streaks: milestone bonus credits', () => {
  assert.equal(streakBonus(1), 0);
  assert.equal(streakBonus(2), 0);
  assert.equal(streakBonus(3), 15);
  assert.equal(streakBonus(7), 40);
  assert.equal(streakBonus(14), 90);
  assert.equal(streakBonus(30), 200);
  assert.equal(streakBonus(60), 450);
  assert.equal(streakBonus(100), 1000);
  assert.equal(streakBonus(101), 0);
});
