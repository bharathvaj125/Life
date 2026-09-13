import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { CyberCard, CyberBadge, CyberProgressBar, CyberButton } from '../ui/CyberComponents';
import { AchievementsPanel } from './AchievementsPanel';
import {
  Brain,
  Dumbbell,
  Shield,
  Palette,
  Sparkles,
  Activity,
  Award,
  Cpu,
  Share2,
} from 'lucide-react';

// html-to-image is only needed if the user actually opens the export dialog —
// keep it out of the dashboard's main chunk.
const ShareCardModal = lazy(() => import('./ShareCardModal').then((m) => ({ default: m.ShareCardModal })));

const ICON_MAP = {
  brain: Brain,
  dumbbell: Dumbbell,
  shield: Shield,
  palette: Palette,
  sparkles: Sparkles,
  cpu: Cpu,
};

export function CharacterProfile() {
  const { user } = useAuth();
  const { levelState, attributes, activityLogs, achievements, loadingCharacter } = useGame();
  const [shareOpen, setShareOpen] = useState(false);

  if (loadingCharacter) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-44 bg-[#0D121F] border border-[#223254] cyber-cut" />
        <div className="h-64 bg-[#0D121F] border border-[#223254] cyber-cut" />
      </div>
    );
  }

  const roleTitles = {
    netrunner: 'CYBER-OPERATIVE // NETRUNNER',
    street_samurai: 'SOLO // STREET SAMURAI',
    techie: 'GRID ARCHITECT // TECHIE',
    corpo: 'ARASAKA LIQUIDATOR // CORPO',
    fixer: 'UNDERGROUND BROKER // FIXER',
  };

  return (
    <div className="space-y-6">
      {/* Operative Card */}
      <CyberCard glow glowColor="cyan" className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-black tracking-wide text-white uppercase">
                {user?.username}
              </h2>
              <CyberBadge variant="cyan">Rank {levelState.level}</CyberBadge>
            </div>
            <p className="text-xs font-telemetry tracking-widest text-[#00F0FF] mt-0.5">
              {roleTitles[user?.avatar_theme] || 'OPERATIVE // NETRUNNER'}
            </p>
          </div>
          <div className="w-12 h-12 bg-[#07090E] border border-[#00F0FF]/40 cyber-cut flex items-center justify-center relative overflow-hidden group">
            <Cpu className="w-6 h-6 text-[#00F0FF] transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-[#00F0FF]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Level & XP Telemetry */}
        <div className="space-y-2 pt-2 border-t border-[#223254]">
          <CyberProgressBar
            progressPct={levelState.progressPct}
            label={`Uplink XP Progress (Level ${levelState.level})`}
            sublabel={`${levelState.xpIntoLevel} / ${levelState.xpForNextLevel} XP`}
            color="cyan"
            height="h-3"
          />
          <div className="flex justify-between text-[11px] font-telemetry text-[#64748B]">
            <span>Total Lifetime Data:</span>
            <span className="text-[#E2E8F0] font-mono-cyber">{levelState.totalXp} XP</span>
          </div>
        </div>

        {/* Uplink Streak Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#223254]">
          <div className="bg-[#07090E] p-2.5 border border-[#223254]">
            <span className="text-[10px] font-telemetry uppercase text-[#64748B] block">Current Streak</span>
            <span className="font-mono-cyber text-lg font-bold text-[#00F0FF]">
              {user?.current_streak ?? 0} <span className="text-xs font-normal text-[#64748B]">DAYS</span>
            </span>
          </div>
          <div className="bg-[#07090E] p-2.5 border border-[#223254]">
            <span className="text-[10px] font-telemetry uppercase text-[#64748B] block">Longest Record</span>
            <span className="font-mono-cyber text-lg font-bold text-[#FFB800]">
              {user?.longest_streak ?? 0} <span className="text-xs font-normal text-[#64748B]">DAYS</span>
            </span>
          </div>
        </div>

        <CyberButton
          variant="secondary"
          size="sm"
          icon={Share2}
          className="w-full"
          onClick={() => setShareOpen(true)}
        >
          Export Operative Card
        </CyberButton>
      </CyberCard>

      {/* Uplink Commendations (Achievements) */}
      <AchievementsPanel achievements={achievements} />

      {shareOpen && (
        <Suspense fallback={null}>
          <ShareCardModal
            isOpen={shareOpen}
            onClose={() => setShareOpen(false)}
            user={user}
            levelState={levelState}
            attributes={attributes}
            achievements={achievements}
          />
        </Suspense>
      )}

      {/* Attribute Matrix */}
      <CyberCard className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#223254] pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#00F0FF]" />
            <h3 className="font-display text-sm font-bold tracking-wider uppercase text-white">
              Neural Attributes
            </h3>
          </div>
          <span className="text-[10px] font-telemetry text-[#64748B] uppercase">Dynamic Growth</span>
        </div>

        <div className="space-y-3">
          {attributes.map((attr) => {
            const Icon = ICON_MAP[attr.icon] || Sparkles;
            return (
              <div key={attr.id || attr.name} className="space-y-1 bg-[#07090E]/60 p-2.5 border border-[#223254]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span className="font-telemetry font-bold text-[#E2E8F0] tracking-wide">
                      {attr.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#64748B] font-mono-cyber">{attr.xp} XP</span>
                    <CyberBadge variant="slate" className="text-[10px] py-0 px-1.5">
                      LVL {attr.level}
                    </CyberBadge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CyberCard>

      {/* Live Activity Feed */}
      <CyberCard className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#223254] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FF0055]" />
            <h3 className="font-display text-sm font-bold tracking-wider uppercase text-white">
              Grid Telemetry Feed
            </h3>
          </div>
          <span className="text-[10px] font-telemetry text-[#00FF9D] font-mono-cyber uppercase">
            LIVE UPLINK
          </span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {activityLogs.length === 0 ? (
            <p className="text-xs text-[#64748B] font-telemetry italic">No transmission logs detected.</p>
          ) : (
            activityLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="text-xs p-2 bg-[#07090E]/70 border-l-2 border-[#00F0FF] flex items-start justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <p className="text-[#E2E8F0] font-sans leading-tight">{log.message}</p>
                  <span className="text-[9px] text-[#64748B] font-mono-cyber">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {(log.xp_delta > 0 || log.credit_delta !== 0) && (
                  <div className="text-right whitespace-nowrap font-mono-cyber text-[10px]">
                    {log.xp_delta > 0 && <span className="text-[#00F0FF] block">+{log.xp_delta} XP</span>}
                    {log.credit_delta > 0 && (
                      <span className="text-[#FFB800] block">+{log.credit_delta} C</span>
                    )}
                    {log.credit_delta < 0 && (
                      <span className="text-[#FF0055] block">{log.credit_delta} C</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CyberCard>
    </div>
  );
}
