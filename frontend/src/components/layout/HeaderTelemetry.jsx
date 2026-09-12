import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { CyberButton, CyberBadge } from '../ui/CyberComponents';
import {
  ShieldAlert,
  Zap,
  Coins,
  Flame,
  LogOut,
  Radio,
  ShoppingBag,
  Terminal,
  Activity,
} from 'lucide-react';

export function HeaderTelemetry({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const { levelState, networkError, setNetworkError, refreshMissions } = useGame();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 bg-[#07090E]/95 border-b border-[#223254] backdrop-blur-md">
      {/* Network Alert Banner */}
      {networkError && (
        <div role="alert" className="bg-[#FF0055]/15 border-b border-[#FF0055]/40 px-4 py-2 flex items-center justify-between text-xs text-[#FF85A2] font-telemetry">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#FF0055] animate-pulse" />
            <span>CRITICAL ALERT: {networkError}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNetworkError(null);
                refreshMissions();
              }}
              className="underline hover:text-white font-bold cursor-pointer"
            >
              Reconnect to Grid
            </button>
            <button
              onClick={() => setNetworkError(null)}
              className="px-1.5 py-0.5 border border-[#FF0055]/40 hover:bg-[#FF0055]/20 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Uplink Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00F0FF]"></span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-lg tracking-wider text-white">
                LIFE<span className="text-[#00F0FF]">RPG</span>
              </span>
              <span className="text-[10px] font-telemetry tracking-widest text-[#64748B] -mt-1 uppercase">
                GRID TERMINAL v2.5
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 border-l border-[#223254] pl-4">
            <button
              onClick={() => setActiveTab('missions')}
              aria-current={activeTab === 'missions' ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-telemetry uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'missions'
                  ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-b-2 border-[#00F0FF]'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#131B2E]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Missions
            </button>
            <button
              onClick={() => setActiveTab('shop')}
              aria-current={activeTab === 'shop' ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-telemetry uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'shop'
                  ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-b-2 border-[#00F0FF]'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#131B2E]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Black Market
            </button>
          </nav>
        </div>

        {/* Live Operative Telemetry Bar */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Level Stat */}
          <div className="flex items-center gap-2 bg-[#0D121F] border border-[#223254] px-2.5 py-1 cyber-cut-sm">
            <Zap className="w-4 h-4 text-[#00F0FF]" />
            <div className="flex flex-col">
              <span className="text-[9px] font-telemetry uppercase text-[#64748B]">LEVEL</span>
              <span className="font-display text-sm font-bold text-[#E2E8F0] leading-none">
                {levelState.level}
              </span>
            </div>
          </div>

          {/* Credits Stat */}
          <div className="flex items-center gap-2 bg-[#0D121F] border border-[#223254] px-2.5 py-1 cyber-cut-sm">
            <Coins className="w-4 h-4 text-[#FFB800]" />
            <div className="flex flex-col">
              <span className="text-[9px] font-telemetry uppercase text-[#64748B]">CREDITS</span>
              <span className="font-mono-cyber text-sm font-bold text-[#FFB800] leading-none">
                {user.credits ?? 0}
              </span>
            </div>
          </div>

          {/* Uplink Streak Stat */}
          <div className="flex items-center gap-2 bg-[#0D121F] border border-[#223254] px-2.5 py-1 cyber-cut-sm">
            <Flame className="w-4 h-4 text-[#FF0055]" />
            <div className="flex flex-col">
              <span className="text-[9px] font-telemetry uppercase text-[#64748B]">STREAK</span>
              <span className="font-mono-cyber text-sm font-bold text-[#FF0055] leading-none">
                {user.current_streak ?? 0}d
              </span>
            </div>
          </div>

          {/* User profile identifier & Logout */}
          <div className="flex items-center gap-2 border-l border-[#223254] pl-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-telemetry font-bold text-white uppercase">{user.username}</span>
              <span className="text-[10px] text-[#00FF9D] font-mono-cyber">ONLINE</span>
            </div>
            <CyberButton
              variant="ghost"
              size="sm"
              onClick={logout}
              title="Terminate Uplink Session"
              aria-label="Logout"
              className="px-2"
            >
              <LogOut className="w-4 h-4 text-[#94A3B8] hover:text-[#FF0055]" />
            </CyberButton>
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden border-t border-[#223254] bg-[#0D121F]">
        <button
          onClick={() => setActiveTab('missions')}
          aria-current={activeTab === 'missions' ? 'page' : undefined}
          className={`flex-1 py-2 text-xs font-telemetry uppercase tracking-wider text-center ${
            activeTab === 'missions' ? 'text-[#00F0FF] border-b-2 border-[#00F0FF] bg-[#00F0FF]/10' : 'text-[#94A3B8]'
          }`}
        >
          Missions
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          aria-current={activeTab === 'shop' ? 'page' : undefined}
          className={`flex-1 py-2 text-xs font-telemetry uppercase tracking-wider text-center ${
            activeTab === 'shop' ? 'text-[#00F0FF] border-b-2 border-[#00F0FF] bg-[#00F0FF]/10' : 'text-[#94A3B8]'
          }`}
        >
          Black Market
        </button>
      </div>
    </header>
  );
}
