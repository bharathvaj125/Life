import React from 'react';
import { Brain, Dumbbell, Shield, Palette, Sparkles, Zap, Flame, Coins, Trophy } from 'lucide-react';

const ICON_MAP = { brain: Brain, dumbbell: Dumbbell, shield: Shield, palette: Palette, sparkles: Sparkles };

const ACHIEVEMENT_ICON_MAP = {
  target: Trophy,
  zap: Zap,
  crown: Trophy,
  flame: Flame,
  award: Trophy,
  'shopping-bag': Trophy,
};

const ROLE_TITLES = {
  netrunner: 'CYBER-OPERATIVE // NETRUNNER',
  street_samurai: 'SOLO // STREET SAMURAI',
  techie: 'GRID ARCHITECT // TECHIE',
  corpo: 'ARASAKA LIQUIDATOR // CORPO',
  fixer: 'UNDERGROUND BROKER // FIXER',
};

/**
 * A purpose-built "trading card" summary of a character, rendered for export
 * to PNG via html-to-image. Kept visually self-contained (no hover states,
 * no interactivity) since it's captured as a static image.
 */
export const OperativeCard = React.forwardRef(function OperativeCard(
  { user, levelState, attributes, achievements },
  ref
) {
  const unlockedAchievements = (achievements || []).filter((a) => a.unlocked);
  const topAttributes = [...(attributes || [])].sort((a, b) => b.level - a.level).slice(0, 4);
  const generatedOn = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      ref={ref}
      className="relative w-[420px] bg-[#07090E] border-2 border-[#00F0FF]/50 p-6 space-y-5 font-sans overflow-hidden"
      style={{ boxShadow: '0 0 40px rgba(0,240,255,0.15) inset' }}
    >
      {/* Decorative corner ticks */}
      <span className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#00F0FF]/60 pointer-events-none" />
      <span className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#00F0FF]/60 pointer-events-none" />
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#00F0FF 1px, transparent 1px), linear-gradient(90deg, #00F0FF 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-[#223254] pb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00F0FF]" />
          </div>
          <span className="font-display font-black text-base tracking-wider text-white">
            LIFE<span className="text-[#00F0FF]">RPG</span>
          </span>
        </div>
        <span className="text-[9px] font-telemetry tracking-widest text-[#64748B] uppercase">
          Operative Dossier // {generatedOn}
        </span>
      </div>

      {/* Identity */}
      <div className="relative space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-2xl font-black tracking-wide text-white uppercase truncate">
            {user?.username}
          </h2>
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 text-xs font-telemetry tracking-wide uppercase font-semibold border bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40">
            Rank {levelState?.level ?? 1}
          </span>
        </div>
        <p className="text-[11px] font-telemetry tracking-widest text-[#00F0FF]">
          {ROLE_TITLES[user?.avatar_theme] || 'OPERATIVE // NETRUNNER'}
        </p>
      </div>

      {/* XP Bar */}
      <div className="relative space-y-1.5">
        <div className="flex justify-between text-[10px] font-telemetry uppercase tracking-wider text-[#94A3B8]">
          <span>Uplink XP Progress</span>
          <span className="text-[#E2E8F0] font-mono-cyber font-semibold">
            {levelState?.xpIntoLevel ?? 0} / {levelState?.xpForNextLevel ?? 25} XP
          </span>
        </div>
        <div className="w-full bg-[#0D121F] border border-[#223254] p-0.5 h-2.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00F0FF] to-[#38E1FF]"
            style={{ width: `${Math.min(100, Math.max(0, levelState?.progressPct ?? 0))}%` }}
          />
        </div>
      </div>

      {/* Stat Grid */}
      <div className="relative grid grid-cols-3 gap-2">
        <div className="bg-[#0D121F] border border-[#223254] p-2 text-center">
          <Flame className="w-3.5 h-3.5 text-[#FF0055] mx-auto mb-1" />
          <span className="block text-sm font-mono-cyber font-bold text-[#FF0055]">
            {user?.current_streak ?? 0}
          </span>
          <span className="block text-[8px] font-telemetry uppercase text-[#64748B]">Streak</span>
        </div>
        <div className="bg-[#0D121F] border border-[#223254] p-2 text-center">
          <Coins className="w-3.5 h-3.5 text-[#FFB800] mx-auto mb-1" />
          <span className="block text-sm font-mono-cyber font-bold text-[#FFB800]">
            {user?.credits ?? 0}
          </span>
          <span className="block text-[8px] font-telemetry uppercase text-[#64748B]">Credits</span>
        </div>
        <div className="bg-[#0D121F] border border-[#223254] p-2 text-center">
          <Trophy className="w-3.5 h-3.5 text-[#00FF9D] mx-auto mb-1" />
          <span className="block text-sm font-mono-cyber font-bold text-[#00FF9D]">
            {unlockedAchievements.length}/{(achievements || []).length || 10}
          </span>
          <span className="block text-[8px] font-telemetry uppercase text-[#64748B]">Badges</span>
        </div>
      </div>

      {/* Top Attributes */}
      {topAttributes.length > 0 && (
        <div className="relative space-y-1.5">
          <span className="text-[10px] font-telemetry uppercase tracking-wider text-[#94A3B8]">
            Neural Attributes
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {topAttributes.map((attr) => {
              const Icon = ICON_MAP[attr.icon] || Sparkles;
              return (
                <div
                  key={attr.id || attr.name}
                  className="flex items-center justify-between gap-1 bg-[#0D121F]/70 border border-[#223254] px-2 py-1"
                >
                  <span className="flex items-center gap-1 text-[10px] font-telemetry text-[#E2E8F0] truncate">
                    <Icon className="w-3 h-3 text-[#00F0FF] shrink-0" />
                    {attr.name}
                  </span>
                  <span className="text-[10px] font-mono-cyber text-[#64748B] shrink-0">
                    Lv{attr.level}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievement Icons */}
      {unlockedAchievements.length > 0 && (
        <div className="relative space-y-1.5">
          <span className="text-[10px] font-telemetry uppercase tracking-wider text-[#94A3B8]">
            Commendations Earned
          </span>
          <div className="flex flex-wrap gap-1.5">
            {unlockedAchievements.map((a) => {
              const Icon = ACHIEVEMENT_ICON_MAP[a.icon] || Trophy;
              return (
                <div
                  key={a.id}
                  title={a.name}
                  className="w-7 h-7 flex items-center justify-center bg-[#FFB800]/10 border border-[#FFB800]/50 text-[#FFB800]"
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer watermark */}
      <div className="relative pt-3 border-t border-[#223254] text-center">
        <span className="text-[9px] font-telemetry tracking-widest text-[#64748B] uppercase">
          Night City Grid Terminal // Tech Zephyr 4.0
        </span>
      </div>
    </div>
  );
});
