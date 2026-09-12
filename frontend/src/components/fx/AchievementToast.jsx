import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

export function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] pointer-events-none"
    >
      <AnimatePresence>
        {achievement && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            className="pointer-events-auto flex items-center gap-3 bg-[#0D121F]/95 border border-[#FFB800]/50 shadow-[0_0_20px_rgba(255,184,0,0.25)] cyber-cut px-4 py-3 max-w-xs backdrop-blur-md"
          >
            <div className="w-9 h-9 shrink-0 flex items-center justify-center bg-[#07090E] border border-[#FFB800] text-[#FFB800]">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-telemetry uppercase tracking-widest text-[#FFB800] block">
                Commendation Unlocked
              </span>
              <span className="text-sm font-bold text-white truncate block">{achievement.name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
