import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OfflineBannerProps {
  isOnline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline }) => {
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-400 font-medium text-sm overflow-hidden sticky top-[73px] z-10 print:hidden shadow-inner backdrop-blur-md"
        >
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-bold tracking-tight">Offline Mode:</span>
              <span className="text-xs opacity-90 leading-tight">
                You have lost your network connection. Data extraction is temporarily disabled.
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
              Waiting for link
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
