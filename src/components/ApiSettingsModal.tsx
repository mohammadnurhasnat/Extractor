import React, { useState, useEffect } from 'react';
import { Key, X, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  userApiKey: string;
  onClose: () => void;
  onSave: (key: string) => void;
  onClear: () => void;
}

export function ApiSettingsModal({
  isOpen,
  userApiKey,
  onClose,
  onSave,
  onClear
}: ApiSettingsModalProps) {
  const [tempApiKey, setTempApiKey] = useState(userApiKey);
  const [showApiKeyChars, setShowApiKeyChars] = useState(false);

  // Sync temp key when modal opens or userApiKey changes
  useEffect(() => {
    if (isOpen) {
      setTempApiKey(userApiKey);
    }
  }, [isOpen, userApiKey]);

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Configure Gemini API Key</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
                Render Deployment এ API Key Error এড়াতে আপনি আপনার নিজস্ব <strong>Google Gemini API Key</strong> নিচে সেভ করতে পারেন। এটি আপনার ব্রাউজারের <strong>localStorage</strong> এ সম্পুর্ন নিরাপদে সংরক্ষিত থাকবে এবং প্রতিটা রিকুয়েস্টে সার্ভার হেডার হিসেবে পাস হবে।
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Gemini API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeyChars ? 'text' : 'password'}
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-zinc-100 transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKeyChars(!showApiKeyChars)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-400 cursor-pointer"
                    >
                      {showApiKeyChars ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 rounded-xl border border-blue-100/30 dark:border-blue-900/20 text-[11px] text-blue-600 dark:text-blue-400 leading-relaxed font-semibold">
                  🔑 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-blue-700 dark:hover:text-blue-300">Google AI Studio (aistudio.google.com)</a> থেকে একদম ফ্রিতে আপনার ব্যক্তিগত Gemini API Key তৈরি করে আনতে পারেন।
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-zinc-900/30 px-6 py-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => {
                  onClear();
                  setTempApiKey('');
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
              >
                Clear Key
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800/50 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onSave(tempApiKey.trim());
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
