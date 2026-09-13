import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CyberCard, CyberButton } from '../components/ui/CyberComponents';
import { Terminal, Lock, User, Mail, ShieldCheck, Cpu } from 'lucide-react';

export function AuthPage() {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await signup(username.trim(), email.trim(), password);
      } else {
        await login(emailOrUsername.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen cyber-grid-bg scanline flex flex-col justify-center items-center p-4">
      {/* Glow Orbs */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00F0FF]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Terminal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0D121F] border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-telemetry tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
            Neural Uplink Access Terminal
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-wider text-white">
            LIFE<span className="text-[#00F0FF]">RPG</span>
          </h1>
          <p className="text-xs text-[#94A3B8] font-sans">
            Gamified Productivity Protocol // Night City Edition
          </p>
        </div>

        {/* Auth Form Card */}
        <CyberCard glow glowColor="cyan" className="p-8 space-y-6">
          <div className="flex border-b border-[#223254] pb-4">
            <button
              type="button"
              aria-pressed={!isSignup}
              onClick={() => {
                setIsSignup(false);
                setError('');
              }}
              className={`flex-1 text-center py-2 text-xs font-telemetry uppercase tracking-wider font-bold transition-colors cursor-pointer ${
                !isSignup
                  ? 'text-[#00F0FF] border-b-2 border-[#00F0FF] -mb-[17px]'
                  : 'text-[#64748B] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              aria-pressed={isSignup}
              onClick={() => {
                setIsSignup(true);
                setError('');
              }}
              className={`flex-1 text-center py-2 text-xs font-telemetry uppercase tracking-wider font-bold transition-colors cursor-pointer ${
                isSignup
                  ? 'text-[#00F0FF] border-b-2 border-[#00F0FF] -mb-[17px]'
                  : 'text-[#64748B] hover:text-white'
              }`}
            >
              Register Operative
            </button>
          </div>

          {error && (
            <div role="alert" className="p-3 bg-[#FF0055]/15 border border-[#FF0055]/40 text-xs text-[#FF85A2] font-telemetry flex items-start gap-2">
              <span className="font-bold text-[#FF0055]">[DENIED]</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup ? (
              <>
                <div>
                  <label htmlFor="auth-username" className="block text-xs font-telemetry uppercase tracking-wider text-[#94A3B8] mb-1">
                    Operative Codename (Username) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                    <input
                      id="auth-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. V_Netrunner"
                      className="w-full bg-[#07090E] border border-[#223254] focus:border-[#00F0FF] pl-9 pr-3 py-2 text-sm text-[#E2E8F0] outline-none font-sans"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-email" className="block text-xs font-telemetry uppercase tracking-wider text-[#94A3B8] mb-1">
                    Uplink Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operative@nightcity.grid"
                      className="w-full bg-[#07090E] border border-[#223254] focus:border-[#00F0FF] pl-9 pr-3 py-2 text-sm text-[#E2E8F0] outline-none font-sans"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="auth-identifier" className="block text-xs font-telemetry uppercase tracking-wider text-[#94A3B8] mb-1">
                  Codename or Uplink Email *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                  <input
                    id="auth-identifier"
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="Username or email"
                    className="w-full bg-[#07090E] border border-[#223254] focus:border-[#00F0FF] pl-9 pr-3 py-2 text-sm text-[#E2E8F0] outline-none font-sans"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-password" className="block text-xs font-telemetry uppercase tracking-wider text-[#94A3B8] mb-1">
                Access Encryption Key (Password) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-[#07090E] border border-[#223254] focus:border-[#00F0FF] pl-9 pr-3 py-2 text-sm text-[#E2E8F0] outline-none font-sans"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <CyberButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full mt-2"
            >
              {loading ? 'Decrypting...' : isSignup ? 'Initialize Neural Uplink' : 'Authenticate Session'}
            </CyberButton>
          </form>

          {/* Quick Demo Credentials info */}
          <div className="text-center pt-2 border-t border-[#223254]">
            <p className="text-[11px] font-telemetry text-[#64748B]">
              DATA PROTOCOL: Isolated SQLite Node. All mission state persisted server-side.
            </p>
          </div>
        </CyberCard>
      </div>
    </main>
  );
}
