import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  itemToDelete: string | null;
  cancelDelete: (e: React.MouseEvent) => void;
  executeDelete: (e: React.MouseEvent) => void;
}

export function DeleteConfirmationModal({
  itemToDelete,
  cancelDelete,
  executeDelete,
}: DeleteConfirmationModalProps) {
  const deleteBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (itemToDelete && deleteBtnRef.current) {
      deleteBtnRef.current.focus();
    }
  }, [itemToDelete]);

  if (!itemToDelete) return null;

  const isDeleteAll = itemToDelete === 'ALL';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
          onClick={cancelDelete}
        />
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-2">
                {isDeleteAll ? "Delete All History?" : "Delete History Item?"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                {isDeleteAll
                  ? "Are you sure you want to delete all extracted passports from your history? This action cannot be undone."
                  : "Are you sure you want to delete this extracted passport from your history? This action cannot be undone."}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-900/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800/50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                ref={deleteBtnRef}
                onClick={executeDelete}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-red-500 focus:outline-none focus:ring-offset-2 dark:focus:ring-offset-zinc-900 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
