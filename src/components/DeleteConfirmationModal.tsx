import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, User } from 'lucide-react';
import { HistoryItem } from '../types';

interface DeleteConfirmationModalProps {
  itemToDelete: string | null;
  history: HistoryItem[];
  cancelDelete: (e: React.MouseEvent) => void;
  executeDelete: (e: React.MouseEvent, id?: string) => void;
}

export function DeleteConfirmationModal({
  itemToDelete,
  history,
  cancelDelete,
  executeDelete,
}: DeleteConfirmationModalProps) {
  const deleteBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (itemToDelete && deleteBtnRef.current) {
      deleteBtnRef.current.focus();
    }
    
    // Scroll lock
    if (itemToDelete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [itemToDelete]);

  if (!itemToDelete) return null;

  const isDeleteAll = itemToDelete === 'ALL';
  const targetItem = !isDeleteAll ? history.find(h => h.id === itemToDelete) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md"
          onClick={cancelDelete}
        />
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
                    {isDeleteAll ? "Delete Profile" : "Delete Profile Confirmation"}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-0.5">
                    {isDeleteAll ? "Managing all extracted passport records" : "Remove individual record from archive"}
                  </p>
                </div>
              </div>

              {isDeleteAll && history.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Profiles to be deleted ({history.length})</p>
                  <div className="max-h-[220px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                    {history.map((item, idx) => (
                      <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800/60 rounded-xl group transition-all hover:border-rose-500/30">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-black flex items-center justify-center text-slate-700 dark:text-zinc-300 shrink-0 shadow-sm group-hover:bg-rose-500/10 group-hover:text-rose-600 group-hover:border-rose-500/20 transition-all">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div className="truncate">
                            <h5 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 truncate">
                              {item.data.givenName} {item.data.surname}
                            </h5>
                            <p className="text-[9px] font-mono text-slate-400 dark:text-zinc-500">
                              {item.data.passportNumber || 'No Passport ID'}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => executeDelete(e, item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all cursor-pointer"
                          title="Delete this item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : !isDeleteAll && targetItem ? (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-extrabold text-xs text-slate-800 dark:text-zinc-100 truncate">
                      {targetItem.data.givenName} {targetItem.data.surname}
                    </h5>
                    <p className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 mt-0.5">
                      {targetItem.data.passportNumber || 'N/A'}
                    </p>
                  </div>
                </div>
              ) : null}

              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-5 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>This action is permanent and cannot be undone. Please verify before proceeding.</span>
              </p>
            </div>
            <div className="bg-slate-50/80 dark:bg-zinc-900/60 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-900/80 backdrop-blur-sm">
              <button
                onClick={cancelDelete}
                className="px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                ref={deleteBtnRef}
                onClick={executeDelete}
                className="px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-lg shadow-rose-500/20 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleteAll ? "Delete All" : "Delete Record"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
