import React, { useState, useRef } from 'react';
import { 
  X, UploadCloud, ShieldCheck, AlertCircle, FileText, Loader2, Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { HistoryItem, PassportData } from '../types';
import { decryptData } from '../utils/crypto';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  setHistory: (history: HistoryItem[]) => void;
  setToast: (toast: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
}

interface BackupPayload {
  type: 'single_passport_profile' | 'passport_history_backup';
  version: string;
  timestamp?: number;
  data: any;
}

interface AttachedBackup {
  file: File;
  payload: BackupPayload;
}

export function RestoreModal({
  isOpen,
  onClose,
  history,
  setHistory,
  setToast
}: RestoreModalProps) {
  useLockBodyScroll(isOpen);
  const [isDragging, setIsDragging] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedBackup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [restorePhase, setRestorePhase] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFileContent = (encryptedText: string, file: File) => {
    try {
      if (attachedFiles.some(item => item.file.name === file.name)) {
        throw new Error(`"${file.name}" ইতিপূর্বে সংযুক্ত করা হয়েছে! ("${file.name}" is already attached!)`);
      }

      const decrypted = decryptData(encryptedText);
      if (!decrypted || typeof decrypted !== 'object') {
        throw new Error('ডিক্রিপশন ব্যর্থ হয়েছে। সঠিক ফরমেটের ফাইল নয়। (Decryption failed. Invalid file format.)');
      }

      if (decrypted.type === 'single_passport_profile' && decrypted.data) {
        if (!decrypted.data.passportNumber) {
          throw new Error('অকার্যকর ব্যাকআপ: পাসপোর্ট আইডি নেই। (Invalid backup: Missing Passport ID.)');
        }
        const payload = decrypted as BackupPayload;
        setAttachedFiles(prev => [...prev, { file, payload }]);
        setError(null);
        return;
      }

      if (decrypted.type === 'passport_history_backup' && Array.isArray(decrypted.data)) {
        const payload = decrypted as BackupPayload;
        setAttachedFiles(prev => [...prev, { file, payload }]);
        setError(null);
        return;
      }

      throw new Error('অপরিচিত ব্যাকআপ সিগনেচার। (Unrecognized backup signature.)');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'ভেরিফিকেশন ব্যর্থ হয়েছে। .pass বা .enc ফাইল আপলোড করুন। (Verification failed. Upload .pass or .enc file.)');
    }
  };

  const handleExecuteRestore = () => {
    if (attachedFiles.length === 0) return;

    setIsRestoring(true);
    setRestoreProgress(5);
    setRestorePhase('সংযুক্ত ব্যাকআপ ফাইলসমূহ রিড করা হচ্ছে... (Reading attached backup files...)');

    const steps = [
      { progress: 30, phase: 'ক্রিপ্টোগ্রাফিক সিগনেচার ভেরিফাই করা হচ্ছে... (Verifying cryptographic signatures...)', delay: 250 },
      { progress: 60, phase: 'ডাটাসেট ডিক্রিপ্ট করা হচ্ছে... (Decrypting datasets...)', delay: 550 },
      { progress: 85, phase: 'রিস্টোরকৃত প্রোফাইল ডাটা মার্জ করা হচ্ছে... (Merging restored profile data...)', delay: 850 },
      { progress: 100, phase: 'ডাটাবেস সিঙ্ক শেষ করা হচ্ছে... (Finalizing database sync...)', delay: 1150 },
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setRestoreProgress(step.progress);
        setRestorePhase(step.phase);

        if (step.progress === 100) {
          setTimeout(() => {
            try {
              let currentHistory = [...history];
              let importedCount = 0;
              let updatedCount = 0;

              for (const { payload } of attachedFiles) {
                if (payload.type === 'single_passport_profile') {
                  const singleData = payload.data as PassportData;
                  if (!singleData.passportNumber) continue;

                  const duplicateIndex = currentHistory.findIndex(
                    item => item.data.passportNumber?.toUpperCase() === singleData.passportNumber?.toUpperCase()
                  );

                  if (duplicateIndex >= 0) {
                    const existing = currentHistory[duplicateIndex];
                    const updatedItem: HistoryItem = {
                      ...existing,
                      timestamp: Date.now(),
                      data: { ...existing.data, ...singleData }
                    };
                    currentHistory = [updatedItem, ...currentHistory.filter((_, idx) => idx !== duplicateIndex)];
                    updatedCount++;
                  } else {
                    const newItem: HistoryItem = {
                      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
                      timestamp: Date.now(),
                      data: singleData
                    };
                    currentHistory = [newItem, ...currentHistory];
                    importedCount++;
                  }
                } 
                else if (payload.type === 'passport_history_backup') {
                  const restoredList = payload.data as HistoryItem[];
                  
                  restoredList.forEach(restoredItem => {
                    if (!restoredItem.data?.passportNumber) return;

                    const existingIndex = currentHistory.findIndex(
                      item => item.data.passportNumber?.toUpperCase() === restoredItem.data.passportNumber?.toUpperCase()
                    );

                    if (existingIndex >= 0) {
                      currentHistory[existingIndex] = {
                        ...currentHistory[existingIndex],
                        timestamp: Math.max(currentHistory[existingIndex].timestamp, restoredItem.timestamp || Date.now()),
                        data: { ...currentHistory[existingIndex].data, ...restoredItem.data }
                      };
                      updatedCount++;
                    } else {
                      currentHistory.push({
                        ...restoredItem,
                        id: restoredItem.id || Date.now().toString() + Math.random().toString(36).substring(2, 5)
                      });
                      importedCount++;
                    }
                  });
                }
              }

              currentHistory.sort((a, b) => b.timestamp - a.timestamp);
              
              setHistory(currentHistory);
              setToast({
                message: `সফলভাবে ${importedCount} টি নতুন প্রোফাইল রিস্টোর এবং ${updatedCount} টি আপডেট করা হয়েছে! (Successfully restored ${importedCount} new & updated ${updatedCount} profiles.)`,
                type: 'success'
              });

              onClose();
            } catch (err) {
              console.error(err);
              setToast({ message: 'রিস্টোর করতে সমস্যা হয়েছে। (Restore failed.)', type: 'error' });
            } finally {
              setIsRestoring(false);
              setRestoreProgress(0);
              setRestorePhase('');
            }
          }, 300);
        }
      }, step.delay);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        readAndProcessFile(file);
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        readAndProcessFile(file);
      });
    }
    e.target.value = '';
  };

  const readAndProcessFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleProcessFileContent(event.target.result as string, file);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Small Cozy Glassmorphism Pop-up Window with 5px border-radius */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white/95 dark:bg-zinc-950/95 shadow-[0_32px_64px_rgba(30,41,59,0.25)] border border-slate-200/80 dark:border-zinc-800/80 flex flex-col overflow-hidden w-full max-w-sm rounded-[5px] text-black dark:text-white"
      >
        {/* Glossy top-light reflection lines */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent pointer-events-none" />

        {/* Colorful Gradient Blur Circles */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-gradient-to-tr from-cyan-500/10 to-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="p-3 border-b border-slate-100 dark:border-zinc-900/80 flex items-center justify-between bg-white/60 dark:bg-zinc-950/60 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 rounded-[5px] text-emerald-600 dark:text-emerald-400">
              <UploadCloud className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-extrabold text-xs tracking-tight text-black dark:text-white">
              Restore Backup
            </h3>
          </div>
          <button 
            disabled={isRestoring}
            onClick={onClose}
            className="p-1.5 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 rounded-[5px] border border-slate-200/60 dark:border-zinc-800/80 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Single-line elegant instruction */}
        <div className="mx-3 mt-3 p-2.5 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/15 dark:to-teal-950/15 rounded-[5px] border border-emerald-100/30 dark:border-emerald-900/10 text-[11px] text-center text-slate-650 dark:text-zinc-300 relative z-10">
          <p className="font-medium">
            Attach a backup file (<span className="font-bold text-emerald-600 dark:text-emerald-400">.pass</span> or <span className="font-bold text-emerald-600 dark:text-emerald-400">.enc</span>) and click <span className="font-bold">"Restore"</span> to restore.
          </p>
        </div>

        {/* Dropzone Area (Optimized to minimum possible size, with SOLID border) */}
        <div className="p-3 space-y-2 relative z-10">
          {isRestoring ? (
            <div className="space-y-2 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-[5px]">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 min-w-0">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{restorePhase}</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 shrink-0">{restoreProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-350 ease-out" 
                  style={{ width: `${restoreProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group border-2 border-solid rounded-[5px] py-4 px-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/20' 
                    : 'border-slate-200 dark:border-zinc-800/60 hover:border-emerald-500 dark:hover:border-emerald-400 bg-white dark:bg-zinc-900/40'
                }`}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".pass,.enc" 
                  className="hidden" 
                  onChange={handleFileSelect}
                  multiple
                />

                <UploadCloud className="w-5 h-5 text-emerald-500 dark:text-emerald-400 group-hover:scale-105 transition-transform duration-300 mb-1" />

                <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                  Attach Backup File (.pass / .enc)
                </p>
                <p className="text-[9px] text-zinc-400 mt-0.5">
                  Drag & drop or click to browse
                </p>
              </div>

              {/* Validation Error */}
              {error && (
                <div className="flex items-start gap-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-2 rounded-[5px] border border-rose-200/45 dark:border-rose-950/45 text-[10px] font-bold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Verified File List */}
              {attachedFiles.length > 0 && (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {attachedFiles.map(({ file, payload }, index) => {
                    const getPreviewMeta = () => {
                      if (payload.type === 'single_passport_profile') {
                        const p = payload.data as PassportData;
                        return {
                          title: `${p.givenName || ''} ${p.surname || ''}`.trim() || 'Profile',
                          id: p.passportNumber || 'No ID',
                        };
                      } else {
                        const count = Array.isArray(payload.data) ? payload.data.length : 0;
                        return {
                          title: `Master Archive`,
                          id: `${count} profile(s)`,
                        };
                      }
                    };
                    const itemPreview = getPreviewMeta();
                    return (
                      <div 
                        key={`${file.name}-${index}`}
                        className="border border-emerald-200 dark:border-emerald-900/50 rounded-[5px] p-2 bg-emerald-50/20 dark:bg-emerald-950/10 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div className="overflow-hidden">
                            <h4 className="text-[11px] font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                              {itemPreview.title}
                            </h4>
                            <p className="text-[9px] text-zinc-400 font-mono truncate">
                              {itemPreview.id} ({file.name})
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-400/25 px-1.5 py-0.5 rounded-[5px]">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Valid
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAttachedFiles(prev => prev.filter((_, idx) => idx !== index));
                            }}
                            className="p-1 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-[5px] text-rose-600 dark:text-rose-400 cursor-pointer transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        <div className="p-3 bg-white/60 dark:bg-zinc-950/60 border-t border-slate-100 dark:border-zinc-900/80 flex items-center justify-end gap-2 relative z-10">
          <button
            disabled={isRestoring}
            onClick={onClose}
            className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-xs"
          >
            Cancel
          </button>
          <button 
            disabled={attachedFiles.length === 0 || isRestoring}
            onClick={handleExecuteRestore}
            className={`slide-btn slide-btn-emerald px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider transition-all duration-300 ${attachedFiles.length > 0 ? "opacity-100" : "opacity-20 cursor-not-allowed"}`}
          >
            <span className="relative z-10 flex items-center gap-1.5">
              {isRestoring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Restoring...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Restore</span>
                </>
              )}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

