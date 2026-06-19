import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastData {
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ToastNotificationProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          className={`fixed bottom-6 right-6 z-[100] w-[90%] max-w-md bg-white dark:bg-zinc-900 border ${
            toast.type === 'success'
              ? 'border-emerald-200 dark:border-emerald-800/60 shadow-lg shadow-emerald-500/5'
              : toast.type === 'error'
              ? 'border-rose-200 dark:border-rose-800/60 shadow-lg shadow-rose-500/5'
              : 'border-blue-200 dark:border-blue-800/60 shadow-lg shadow-blue-500/5'
          } rounded-xl shadow-xl flex items-start gap-3 p-4`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && (
              <div className="bg-emerald-50 dark:bg-emerald-900/30 p-1.5 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            {toast.type === 'error' && (
              <div className="bg-rose-50 dark:bg-rose-900/30 p-1.5 rounded-lg">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
            )}
            {toast.type === 'info' && (
              <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-lg flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-sans">
              {toast.type === 'success' ? 'Ready for print' : toast.type === 'error' ? 'Failed' : 'Document Engine'}
            </h4>
            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 leading-tight">
              {toast.message}
            </p>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
