import React from 'react';
import { LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.35 }}
        className="relative bg-white dark:bg-zinc-950 shadow-[0_32px_64px_rgba(30,41,59,0.25)] border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden w-full max-w-xs rounded-[5px] text-black dark:text-white"
      >
        {/* Top Accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />

        {/* Header */}
        <div className="p-3 border-b border-slate-100 dark:border-zinc-900/80 flex items-center gap-2 bg-white/60 dark:bg-zinc-950/60 relative z-10">
          <div className="p-1.5 bg-rose-500/10 rounded-[3px] text-rose-600 dark:text-rose-400">
            <LogOut className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-extrabold text-xs tracking-tight text-black dark:text-white uppercase">
            Confirm Logout
          </h3>
        </div>

        {/* Content */}
        <div className="p-4 text-center relative z-10">
          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            Do you want to log out?
          </p>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
            You will need to sign in again to access the portal.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex border-t border-slate-100 dark:border-zinc-900/80 p-3 pt-4 gap-2">
          <button
            onClick={onClose}
            className="slide-btn slide-btn-slate flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider"
          >
            <span className="relative z-10">No</span>
          </button>
          <button
            onClick={onConfirm}
            className="slide-btn slide-btn-orange flex-1 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider"
          >
            <span className="relative z-10">Yes</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

