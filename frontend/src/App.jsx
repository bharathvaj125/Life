import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useGame, GameProvider } from './context/GameContext';
import { HeaderTelemetry } from './components/layout/HeaderTelemetry';
import { CharacterProfile } from './components/character/CharacterProfile';
import { MissionHub } from './components/missions/MissionHub';
import { BlackMarketShop } from './components/shop/BlackMarketShop';
import { CelebrationModal } from './components/fx/CelebrationModal';
import { AchievementToast } from './components/fx/AchievementToast';
import { AuthPage } from './pages/AuthPage';

function DashboardView() {
  const [activeTab, setActiveTab] = useState('missions');
  const { celebration, closeCelebration, achievementToast, dismissAchievementToast } = useGame();

  return (
    <div className="min-h-screen bg-[#07090E] cyber-grid-bg text-[#E2E8F0] flex flex-col selection:bg-[#00F0FF]/25 selection:text-[#00F0FF]">
      <HeaderTelemetry activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Character Profile, Level, Attributes, Activity (4 cols) */}
          <section className="lg:col-span-4 space-y-6" aria-label="Operative Telemetry and Attributes">
            <CharacterProfile />
          </section>

          {/* Right Column: Mission Control Terminal or Black Market (8 cols) */}
          <section className="lg:col-span-8" aria-label="Command Center Operations">
            {activeTab === 'missions' ? <MissionHub /> : <BlackMarketShop />}
          </section>
        </div>
      </main>

      {/* Fullscreen Cyber Celebration Modal for Level Up & Streak Milestones */}
      <CelebrationModal celebration={celebration} onClose={closeCelebration} />

      {/* Corner toast for achievement unlocks */}
      <AchievementToast achievement={achievementToast} onDismiss={dismissAchievementToast} />

      {/* Cyberpunk Status Footer */}
      <footer className="border-t border-[#223254] py-4 bg-[#07090E]/90 text-center text-xs font-telemetry text-[#64748B]">
        <p>LIFE RPG // CYBERNETIC PRODUCTIVITY MATRIX // PRODUCTION GRADE DEPLOYMENT</p>
      </footer>
    </div>
  );
}

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center space-y-4 font-telemetry text-[#00F0FF]">
        <div className="relative flex h-8 w-8">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-8 w-8 bg-[#00F0FF]/30 border border-[#00F0FF]"></span>
        </div>
        <p className="text-xs uppercase tracking-widest animate-pulse">Initializing Cyberpunk Terminal Uplink...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <GameProvider>
      <DashboardView />
    </GameProvider>
  );
}

export default App;
