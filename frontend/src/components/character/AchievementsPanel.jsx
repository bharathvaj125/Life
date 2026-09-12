import React from 'react';
import { CyberCard, CyberBadge } from '../ui/CyberComponents';
import { Trophy, Target, Zap, Crown, Flame, Award, ShoppingBag, Lock } from 'lucide-react';

const ICON_MAP = {
  target: Target,
  zap: Zap,
  crown: Crown,
  flame: Flame,
  award: Award,
  'shopping-bag': ShoppingBag,
};

export function AchievementsPanel({ achievements }) {
  if (!achievements || achievements.length === 0) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <CyberCard className="p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#223254] pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#FFB800]" />
          <h3 className="font-display text-sm font-bold tracking-wider uppercase text-white">
            Uplink Commendations
          </h3>
        </div>
        <CyberBadge variant="amber">
          {unlockedCount} / {achievements.length}
        </CyberBadge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {achievements.map((achievement) => {
          const Icon = ICON_MAP[achievement.icon] || Award;
          return (
            <div
              key={achievement.id}
              role="group"
              aria-label={`${achievement.name}: ${achievement.unlocked ? 'unlocked' : 'locked'} — ${achievement.description}`}
              title={achievement.description}
              className={`relative flex flex-col items-center text-center gap-1.5 p-3 border transition-all duration-200 ${
                achievement.unlocked
                  ? 'border-[#FFB800]/50 bg-[#FFB800]/10 shadow-[0_0_12px_rgba(255,184,0,0.15)]'
                  : 'border-[#223254] bg-[#07090E]/60 opacity-50'
              }`}
            >
              <div
                className={`w-9 h-9 flex items-center justify-center border ${
                  achievement.unlocked
                    ? 'border-[#FFB800] text-[#FFB800]'
                    : 'border-[#334155] text-[#64748B]'
                }`}
              >
                {achievement.unlocked ? <Icon className="w-4.5 h-4.5" /> : <Lock className="w-4 h-4" />}
              </div>
              <span
                className={`text-[10px] font-telemetry uppercase tracking-wide leading-tight ${
                  achievement.unlocked ? 'text-[#E2E8F0]' : 'text-[#64748B]'
                }`}
              >
                {achievement.name}
              </span>
            </div>
          );
        })}
      </div>
    </CyberCard>
  );
}
