import React, { useState, useEffect } from 'react';
import { 
  Key, X, Eye, EyeOff, Database, Sparkles, 
  UploadCloud, Download, Loader2, Cloud, CheckCircle2,
  FileText, ShieldCheck, HelpCircle, HardDrive, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  userApiKey: string;
  onClose: () => void;
  onSave: (key: string) => void;
  onClear: () => void;
  
  // Google Drive cloud integration
  user: any;
  isSyncingDrive: boolean;
  driveSyncStatus: string;
  handleRestoreFromDrive: () => Promise<void>;
  handleBackupToDrive: () => Promise<void>;
  localHistoryCount: number;
  driveBackupSize?: number | null;
  lastSyncTime?: Date | null;
}

export function ApiSettingsModal({
  isOpen,
  userApiKey,
  onClose,
  onSave,
  onClear,
  
  // Google Drive props
  user,
  isSyncingDrive,
  driveSyncStatus,
  handleRestoreFromDrive,
  handleBackupToDrive,
  localHistoryCount,
  driveBackupSize = null,
  lastSyncTime = null
}: ApiSettingsModalProps) {
  const formatBytes = (bytes: number | null | undefined): string => {
    if (bytes === undefined || bytes === null) return '0 B';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDateString = (date: Date | null): string => {
    if (!date) return 'কখনো নয়';
    try {
      return date.toLocaleTimeString('bn-BD', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 text-slate-800 dark:text-zinc-100 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-950/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 font-sans">
                  <Database className="w-4.5 h-4.5 text-blue-500" /> Settings Dashboard
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-450">Cloud backup parameters and synchronization status.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="space-y-5 animate-fadeIn text-xs">
                {user ? (
                  <div className="space-y-4">
                    {/* Connected Account status */}
                    <div className="p-3.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl flex items-center justify-between font-sans">
                      <div className="flex items-center gap-2.5">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={user.displayName || 'Google'} 
                            className="w-8 h-8 rounded-full border border-slate-200" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-550 text-white flex items-center justify-center font-bold text-xs uppercase">
                            {user.displayName ? user.displayName.charAt(0) : 'G'}
                          </div>
                        )}
                        <div>
                          <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-none">
                            {user.displayName || 'Authorized Account'}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-bold">
                        কানেক্টেড
                      </span>
                    </div>

                    {/* Display Telemetry values directly in a clean summary way */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-150 dark:border-zinc-805 rounded-xl space-y-1">
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider block font-sans">লোকাল পাসপোর্ট সংখ্যা</span>
                        <span className="text-sm font-bold font-mono text-slate-800 dark:text-zinc-200 block">{localHistoryCount} টি</span>
                      </div>
                      <div className="p-3 bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-150 dark:border-zinc-805 rounded-xl space-y-1">
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider block font-sans">ক্লাউড ড্রাইভ সাইজ</span>
                        <span className="text-sm font-bold font-mono text-slate-800 dark:text-zinc-200 block">{formatBytes(driveBackupSize)}</span>
                      </div>
                    </div>

                    {/* Manual Cloud controllers */}
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800 rounded-xl space-y-3">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-slate-150 dark:border-zinc-800 font-sans">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-slate-800 dark:text-zinc-200">ম্যানুয়াল সিঙ্ক্রোনাইজেশন</span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans leading-relaxed">
                        পাসপোর্ট হিস্টোরি ডেটা গুগল ড্রাইভে ব্যাকআপ রাখতে অথবা পূর্বের ব্যাকআপ ফাইল থেকে সম্পূর্ণ রিস্টোর করতে নিচের অপশন ব্যবহার করুন:
                      </p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isSyncingDrive}
                          onClick={handleBackupToDrive}
                          className="flex-1 py-2 bg-blue-650 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-white rounded-lg font-bold flex items-center justify-center gap-1 text-[11px] cursor-pointer shadow-sm transition-all"
                        >
                          {isSyncingDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                          ব্যাকআপ পাঠান
                        </button>

                        <button
                          type="button"
                          disabled={isSyncingDrive}
                          onClick={handleRestoreFromDrive}
                          className="flex-1 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 text-slate-700 dark:text-zinc-300 rounded-lg font-bold flex items-center justify-center gap-1 text-[11px] cursor-pointer transition-all"
                        >
                          {isSyncingDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                          রিস্টোর করুন
                        </button>
                      </div>

                      {/* Last sync time check */}
                      <div className="text-[10px] text-slate-450 dark:text-zinc-500 font-sans mt-1">
                        সর্বশেষ ড্রাইভ ব্যাকআপ সিঙ্ক্রোনাইজেশন: <strong className="text-slate-605 dark:text-zinc-305">{formatDateString(lastSyncTime)}</strong>
                      </div>
                    </div>

                    {/* Live Sync Status message bar */}
                    {driveSyncStatus && (
                      <div className="p-2.5 bg-emerald-500/5 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[10px] rounded-lg border border-emerald-500/10 flex items-center gap-2 font-sans transition-all">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-medium">{driveSyncStatus}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-5 text-center space-y-3 pb-2 font-sans">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-500 col-span-2">
                      <AlertTriangle className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Google Account Connected নয়</h4>
                      <p className="text-[10.5px] text-slate-400 dark:text-zinc-450 max-w-sm mx-auto leading-normal">
                        গুগল ড্রাইভ ব্যাকআপ সিঙ্ক্রোনাইজেশন অ্যাক্টিভ করতে অনুগ্রহ করে প্রধান পেজের উপরের ডানদিকের <strong>"Sign In"</strong> বাটনে ক্লিক করে গুগল একাউন্ট যুক্ত করুন।
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="bg-slate-50 dark:bg-zinc-900/40 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800 font-sans">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
