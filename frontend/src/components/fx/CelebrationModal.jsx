import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CyberCard, CyberButton } from '../ui/CyberComponents';
import { Zap, Flame, Award, ArrowRight, X } from 'lucide-react';

export function CelebrationModal({ celebration, onClose }) {
  const acknowledgeRef = useRef(null);

  useEffect(() => {
    if (celebration && acknowledgeRef.current) {
      acknowledgeRef.current.focus();
    }
  }, [celebration]);

  useEffect(() => {
    if (!celebration) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [celebration, onClose]);

  if (!celebration) return null;

  const isLevelUp = celebration.type === 'level_up';
  const data = celebration.data;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-heading"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative max-w-md w-full"
        >
          <CyberCard
            glow
            glowColor={isLevelUp ? 'cyan' : 'amber'}
            className="p-8 text-center space-y-6 border-2"
          >
            <div className="sr-only" role="status" aria-live="assertive">
              {isLevelUp
                ? `Level up! You reached level ${data.newLevel}.`
                : `${data.streak} day streak milestone reached. Bonus credits awarded.`}
            </div>
            {/* Holographic Header Icon */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full blur-xl opacity-60 ${
                  isLevelUp ? 'bg-[#00F0FF]' : 'bg-[#FFB800]'
                }`}
              />
              <div
                className={`relative w-16 h-16 bg-[#07090E] border-2 cyber-cut flex items-center justify-center ${
                  isLevelUp ? 'border-[#00F0FF] text-[#00F0FF]' : 'border-[#FFB800] text-[#FFB800]'
                }`}
              >
                {isLevelUp ? <Zap className="w-8 h-8 animate-bounce" /> : <Flame className="w-8 h-8 animate-pulse" />}
              </div>
            </div>

            {/* Announcement Text */}
            <div className="space-y-2">
              <span
                className={`text-xs font-telemetry tracking-widest uppercase font-bold px-3 py-1 border ${
                  isLevelUp
                    ? 'border-[#00F0FF]/40 text-[#00F0FF] bg-[#00F0FF]/10'
                    : 'border-[#FFB800]/40 text-[#FFB800] bg-[#FFB800]/10'
                }`}
              >
                {isLevelUp ? 'NEURAL UPLINK OVERCLOCK' : 'UPLINK STREAK MILESTONE'}
              </span>

              <h2 id="celebration-heading" className="font-display text-3xl font-black tracking-wide text-white uppercase mt-2">
                {isLevelUp ? `LEVEL ${data.newLevel} REACHED` : `${data.streak}-DAY STREAK`}
              </h2>

              <p className="text-xs text-[#94A3B8] font-sans max-w-xs mx-auto">
                {isLevelUp
                  ? 'Your cybernetic cognitive capacity has expanded. New mission yields unlocked.'
                  : `Operative discipline verified across ${data.streak} consecutive cycles. Bonus bounty transferred.`}
              </p>
            </div>

            {/* Reward Box */}
            <div className="bg-[#07090E] border border-[#223254] p-4 cyber-cut-sm flex items-center justify-around font-mono-cyber">
              {isLevelUp ? (
                <>
                  <div>
                    <span className="text-[10px] font-telemetry uppercase text-[#64748B] block">XP BUMP</span>
                    <span className="text-base font-bold text-[#00F0FF]">+{data.rewards?.xp || 20} XP</span>
                  </div>
                  <div className="h-8 w-px bg-[#223254]" />
                  <div>
                    <span className="text-[10px] font-telemetry uppercase text-[#64748B] block">CREDITS</span>
                    <span className="text-base font-bold text-[#FFB800]">+{data.rewards?.credits || 10} C</span>
                  </div>
                </>
              ) : (
                <div>
                  <span className="text-[10px] font-telemetry uppercase text-[#64748B] block">BOUNTY CREDITS</span>
                  <span className="text-lg font-bold text-[#FFB800]">+{data.bonusCredits} CREDITS</span>
                </div>
              )}
            </div>

            {/* Acknowledge Button */}
            <CyberButton
              ref={acknowledgeRef}
              variant={isLevelUp ? 'primary' : 'amber'}
              size="lg"
              className="w-full"
              onClick={onClose}
            >
              Jack In & Continue
            </CyberButton>
          </CyberCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
