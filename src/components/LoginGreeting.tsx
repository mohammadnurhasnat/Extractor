import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface LoginGreetingProps {
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const LoginGreeting: React.FC<LoginGreetingProps> = ({ userName, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500); // 2.5 seconds to be safe
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl px-8 py-6 rounded-[24px] border border-white dark:border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center gap-4 text-center max-w-[320px] pointer-events-auto"
          >
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 rounded-[18px] bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_10px_20px_rgba(16,185,129,0.3)] border-b-4 border-emerald-600 active:scale-95 transition-transform"
              >
                <CheckCircle2 className="w-9 h-9 text-white drop-shadow-md" />
              </motion.div>
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.3, 0, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-[18px] bg-emerald-400 -z-10"
              />
            </div>

            <div className="space-y-1">
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em]"
              >
                <Sparkles className="w-3 h-3" />
                <span>Verification Success</span>
                <Sparkles className="w-3 h-3" />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight"
              >
                {userName}
              </motion.h2>
            </div>

            {/* Success Bar */}
            <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.2, ease: "linear" }}
                className="h-full bg-emerald-500"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
