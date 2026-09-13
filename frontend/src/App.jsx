import React, { Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';

// Code-split: none of the dashboard (missions, shop, achievements, the
// Operative Card export which pulls in html-to-image) is needed until a
// visitor is authenticated, so keep it out of the bundle the auth page loads.
const Dashboard = lazy(() => import('./Dashboard'));

function LoadingScreen({ message }) {
  return (
    <main className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center space-y-4 font-telemetry text-[#00F0FF]">
      <div className="relative flex h-8 w-8">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-8 w-8 bg-[#00F0FF]/30 border border-[#00F0FF]"></span>
      </div>
      <p className="text-xs uppercase tracking-widest animate-pulse">{message}</p>
    </main>
  );
}

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Initializing Cyberpunk Terminal Uplink..." />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Suspense fallback={<LoadingScreen message="Loading Command Terminal..." />}>
      <Dashboard />
    </Suspense>
  );
}

export default App;
