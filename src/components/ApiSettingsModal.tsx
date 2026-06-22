import React, { useState, useEffect } from 'react';
import { 
  Key, X, Eye, EyeOff, Database, Sparkles, 
  UploadCloud, Download, Loader2, Cloud 
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
  localHistoryCount
}: ApiSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'gemini' | 'drive'>('gemini');
  const [tempApiKey, setTempApiKey] = useState(userApiKey);
  const [showApiKeyChars, setShowApiKeyChars] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTempApiKey(userApiKey);
    }
  }, [isOpen, userApiKey]);

  const handleSaveAll = () => {
    onSave(tempApiKey.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-950/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 font-sans">
                  <Database className="w-4 h-4 text-blue-500" /> Settings Dashboard
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500">API keys and credentials are securely configured on your device.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selectors */}
            <div className="flex border-b border-slate-100 dark:border-zinc-800/60 px-4 bg-slate-50/20 dark:bg-zinc-950/20">
              <button
                type="button"
                onClick={() => setActiveTab('gemini')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all text-slate-600 dark:text-zinc-400 cursor-pointer ${
                  activeTab === 'gemini' 
                    ? 'border-amber-500 text-slate-900 dark:text-zinc-100' 
                    : 'border-transparent hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Gemini AI Key
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('drive')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all text-slate-600 dark:text-zinc-400 cursor-pointer ${
                  activeTab === 'drive' 
                    ? 'border-blue-500 text-slate-900 dark:text-zinc-100' 
                    : 'border-transparent hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-blue-500" /> Google Drive Cloud
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {activeTab === 'gemini' ? (
                <div className="space-y-4 animate-fadeIn">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-sans">
                    To avoid Gemini API Key limit issues or errors, save your own <strong>Google Gemini API Key</strong> below. It is stored safely in your browser's <strong>localStorage</strong> and sent securely in server-side headers for each request.
                  </p>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-450 uppercase tracking-wider mb-1.5 font-sans">
                      Gemini API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKeyChars ? 'text' : 'password'}
                        value={tempApiKey || ''}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/25 text-slate-800 dark:text-zinc-100 transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKeyChars(!showApiKeyChars)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-550 hover:text-slate-600 cursor-pointer"
                      >
                        {showApiKeyChars ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn text-xs">
                  <div className="p-4 bg-blue-50/30 dark:bg-zinc-900/60 border border-blue-550/10 dark:border-zinc-800 rounded-xl space-y-3 font-sans">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="font-bold text-slate-800 dark:text-zinc-200">ক্লাউড সিঙ্ক্রোনাইজেশন সেটিংস (Google Drive Sync)</span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-sans">
                      আপনার লোকাল ব্রাউজারে বর্তমানে <strong>{localHistoryCount} টি</strong> নিষ্কাশিত পাসপোর্ট হিস্টোরি রয়েছে। আপনি যেকোনো সময় নিচের বোতামগুলো দিয়ে ম্যানুয়ালি ইনস্ট্যান্ট ব্যাকআপ তৈরি করতে বা Google Drive থেকে আগের হিস্টোরি রিস্টোর করে আনতে পারেন।
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isSyncingDrive || !user}
                        onClick={handleBackupToDrive}
                        className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-50 cursor-pointer shadow-sm text-xs cursor-pointer"
                      >
                        {isSyncingDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                        ম্যানুয়ালি ব্যাকআপ করুন
                      </button>

                      <button
                        type="button"
                        disabled={isSyncingDrive || !user}
                        onClick={handleRestoreFromDrive}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg font-bold flex items-center gap-1.5 transition-all duration-150 disabled:opacity-50 cursor-pointer text-xs border border-slate-200/50 dark:border-zinc-700/50"
                      >
                        {isSyncingDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        ড্রাইভ থেকে রিস্টোর করুন
                      </button>
                    </div>

                    {/* Display Sync Status Text */}
                    {driveSyncStatus && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-2 bg-blue-600/5 dark:bg-zinc-950/40 text-blue-700 dark:text-blue-400 text-[10px] rounded border border-blue-500/10 flex items-center gap-1.5 font-sans"
                      >
                        {isSyncingDrive && <Loader2 className="w-3 h-3 text-blue-500 animate-spin shrink-0" />}
                        <span>{driveSyncStatus}</span>
                      </motion.div>
                    )}
                  </div>

                  {user ? (
                    <div className="p-3.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-xl flex items-center justify-between font-sans">
                      <div className="flex items-center gap-2.5">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={user.displayName || 'Google'} 
                            className="w-8 h-8 rounded-full border border-slate-200" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs uppercase">
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
                      <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-bold">
                        কানেক্টেড
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-xl font-sans">
                      গুগল ড্রাইভ ব্যাকআপ সিঙ্ক্রোনাইজেশনের সুবিধা উপভোগ করতে দয়া করে প্রধান ইন্টারফেসে লগইন করুন।
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="bg-slate-50 dark:bg-zinc-900/40 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800 font-sans">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800/50 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
