import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import { CyberButton } from '../ui/CyberComponents';
import { OperativeCard } from './OperativeCard';

export function ShareCardModal({ isOpen, onClose, user, levelState, attributes, achievements }) {
  const cardRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'exporting' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const exportCard = async () => {
    if (!cardRef.current) return;
    setStatus('exporting');
    setErrorMsg('');
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#07090E',
      });

      const link = document.createElement('a');
      link.download = `${(user?.username || 'operative').toLowerCase()}-operative-card.png`;
      link.href = dataUrl;
      link.click();
      setStatus('idle');
    } catch (err) {
      console.warn('Card export failed:', err);
      setErrorMsg('Failed to render the card image. Try again.');
      setStatus('error');
    }
  };

  const shareCard = async () => {
    if (!cardRef.current) return;
    setStatus('exporting');
    setErrorMsg('');
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: '#07090E' });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${(user?.username || 'operative').toLowerCase()}-operative-card.png`, {
        type: 'image/png',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Life RPG Operative Card',
          text: `Level ${levelState?.level ?? 1} Operative — Life RPG`,
        });
      } else {
        // Fall back to a plain download when the Web Share API isn't available
        const link = document.createElement('a');
        link.download = file.name;
        link.href = dataUrl;
        link.click();
      }
      setStatus('idle');
    } catch (err) {
      if (err?.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      console.warn('Card share failed:', err);
      setErrorMsg('Sharing failed. Try downloading instead.');
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-card-heading"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -12 }}
          transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          className="relative w-full max-w-md my-8"
        >
          <div className="bg-[#0D121F] border-2 border-[#00F0FF]/40 cyber-cut p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="share-card-heading" className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Export Operative Card
              </h2>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close export dialog"
                className="text-[#94A3B8] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center overflow-x-auto py-2">
              <OperativeCard
                ref={cardRef}
                user={user}
                levelState={levelState}
                attributes={attributes}
                achievements={achievements}
              />
            </div>

            {errorMsg && (
              <div role="alert" className="p-2.5 bg-[#FF0055]/15 border border-[#FF0055]/40 text-xs text-[#FF85A2] font-telemetry">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-3">
              <CyberButton
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={shareCard}
                disabled={status === 'exporting'}
                icon={status === 'exporting' ? Loader2 : Share2}
              >
                Share
              </CyberButton>
              <CyberButton
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={exportCard}
                disabled={status === 'exporting'}
                icon={status === 'exporting' ? Loader2 : Download}
              >
                {status === 'exporting' ? 'Rendering...' : 'Download PNG'}
              </CyberButton>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
