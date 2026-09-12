import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { computeAchievements, ACHIEVEMENT_CATALOG } from '../src/utils/achievements.js';

describe('Achievements: computeAchievements', () => {
  test('all locked for a fresh character', () => {
    const result = computeAchievements({
      level: 1,
      longestStreak: 0,
      completedTasksCount: 0,
      inventoryCount: 0,
    });
    assert.equal(result.length, ACHIEVEMENT_CATALOG.length);
    assert.ok(result.every((a) => a.unlocked === false));
  });

  test('unlocks exactly the achievements a stat profile qualifies for', () => {
    const result = computeAchievements({
      level: 12,
      longestStreak: 8,
      completedTasksCount: 3,
      inventoryCount: 0,
    });
    const unlockedIds = result.filter((a) => a.unlocked).map((a) => a.id);
    assert.deepEqual(
      unlockedIds.sort(),
      ['first_blood', 'operative_lvl5', 'operative_lvl10', 'streak_week'].sort()
    );
  });

  test('threshold boundaries are inclusive, not exclusive', () => {
    const exact = computeAchievements({
      level: 5,
      longestStreak: 7,
      completedTasksCount: 10,
      inventoryCount: 1,
    });
    assert.ok(exact.find((a) => a.id === 'operative_lvl5').unlocked);
    assert.ok(exact.find((a) => a.id === 'streak_week').unlocked);
    assert.ok(exact.find((a) => a.id === 'grinder_10').unlocked);
    assert.ok(exact.find((a) => a.id === 'first_purchase').unlocked);

    const justBelow = computeAchievements({
      level: 4,
      longestStreak: 6,
      completedTasksCount: 9,
      inventoryCount: 0,
    });
    assert.equal(justBelow.find((a) => a.id === 'operative_lvl5').unlocked, false);
    assert.equal(justBelow.find((a) => a.id === 'streak_week').unlocked, false);
    assert.equal(justBelow.find((a) => a.id === 'grinder_10').unlocked, false);
    assert.equal(justBelow.find((a) => a.id === 'first_purchase').unlocked, false);
  });

  test('every catalog entry has the fields the frontend renders', () => {
    const result = computeAchievements({ level: 1, longestStreak: 0, completedTasksCount: 0, inventoryCount: 0 });
    for (const a of result) {
      assert.equal(typeof a.id, 'string');
      assert.equal(typeof a.name, 'string');
      assert.equal(typeof a.description, 'string');
      assert.equal(typeof a.icon, 'string');
      assert.equal(typeof a.unlocked, 'boolean');
    }
  });
});
