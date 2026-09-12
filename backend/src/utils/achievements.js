/**
 * Achievement catalog. Each achievement is derived purely from server-authoritative
 * stats (level, streak, completed mission count, inventory count) — nothing is
 * stored client-side or settable by the user directly, so it can't be gamed the
 * way a client-tracked "unlocked" flag could.
 */
export const ACHIEVEMENT_CATALOG = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Complete your first mission.',
    icon: 'target',
    check: (stats) => stats.completedTasksCount >= 1,
  },
  {
    id: 'operative_lvl5',
    name: 'Rising Operative',
    description: 'Reach character level 5.',
    icon: 'zap',
    check: (stats) => stats.level >= 5,
  },
  {
    id: 'operative_lvl10',
    name: 'Veteran Netrunner',
    description: 'Reach character level 10.',
    icon: 'zap',
    check: (stats) => stats.level >= 10,
  },
  {
    id: 'operative_lvl20',
    name: 'Grid Legend',
    description: 'Reach character level 20.',
    icon: 'crown',
    check: (stats) => stats.level >= 20,
  },
  {
    id: 'streak_week',
    name: 'Uplink Discipline',
    description: 'Hit a 7-day streak.',
    icon: 'flame',
    check: (stats) => stats.longestStreak >= 7,
  },
  {
    id: 'streak_month',
    name: 'Unbreakable',
    description: 'Hit a 30-day streak.',
    icon: 'flame',
    check: (stats) => stats.longestStreak >= 30,
  },
  {
    id: 'streak_century',
    name: 'Neural Marathon',
    description: 'Hit a 100-day streak.',
    icon: 'flame',
    check: (stats) => stats.longestStreak >= 100,
  },
  {
    id: 'grinder_10',
    name: 'Directive Crusher',
    description: 'Complete 10 missions total.',
    icon: 'award',
    check: (stats) => stats.completedTasksCount >= 10,
  },
  {
    id: 'grinder_50',
    name: 'Mission Machine',
    description: 'Complete 50 missions total.',
    icon: 'award',
    check: (stats) => stats.completedTasksCount >= 50,
  },
  {
    id: 'first_purchase',
    name: 'Black Market Regular',
    description: 'Acquire your first item from the shop.',
    icon: 'shopping-bag',
    check: (stats) => stats.inventoryCount >= 1,
  },
];

/**
 * Returns the full catalog annotated with each entry's unlocked state for the
 * given stats, in catalog order.
 */
export function computeAchievements(stats) {
  return ACHIEVEMENT_CATALOG.map(({ id, name, description, icon, check }) => ({
    id,
    name,
    description,
    icon,
    unlocked: check(stats),
  }));
}
