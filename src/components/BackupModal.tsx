import React, { useState, useEffect } from 'react';
import { 
  X, Database, Search, Key, ShieldCheck, Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { HistoryItem } from '../types';
import { encryptData } from '../utils/crypto';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  setToast: (toast: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
}

export function BackupModal({
  isOpen,
  onClose,
  history,
  setToast
}: BackupModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProfiles = history.filter(item => {
    const fullName = `${item.data.givenName || ''} ${item.data.surname || ''}`.toLowerCase();
    const passportNo = (item.data.passportNumber || '').toLowerCase();
    const query = searchTerm.toLowerCase().trim();
    return fullName.includes(query) || passportNo.includes(query);
  });

  const handleExportIndividualEncrypted = (item: HistoryItem) => {
    try {
      const exportObject = {
        type: 'single_passport_profile',
        version: '1.0',
        timestamp: Date.now(),
        data: item.data
      };

      const encryptedString = encryptData(exportObject);
      const blob = new Blob([encryptedString], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeName = `${item.data.givenName || 'Profile'}_${item.data.surname || ''}`.replace(/\s+/g, '_');
      link.download = `SECURE_PROFILE_${safeName}_${item.data.passportNumber || 'NoPassport'}.pass`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setToast({
        message: `${item.data.givenName || 'Profile'} backed up successfully.`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Backup failed.', type: 'error' });
    }
  };

  const handleExportAllBackup = () => {
    if (history.length === 0) {
      setToast({ message: 'No profiles to backup.', type: 'error' });
      return;
    }

    try {
      const backupObject = {
        type: 'passport_history_backup',
        version: '1.0',
        timestamp: Date.now(),
        data: history
      };

      const encryptedString = encryptData(backupObject);
      const blob = new Blob([encryptedString], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MASTER_BACKUP_${new Date().toISOString().split('T')[0]}.enc`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToast({
        message: `All ${history.length} profiles backed up.`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Backup failed.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Small Cozy Glassmorphism Pop-up Window */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white/95 dark:bg-zinc-950/95 shadow-[0_32px_64px_rgba(30,41,59,0.25)] border border-slate-200/80 dark:border-zinc-800/80 flex flex-col overflow-hidden max-h-[90vh] w-full max-w-sm rounded-[5px] text-black dark:text-white"
      >
        {/* Glossy top-light reflection lines */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent pointer-events-none" />
        
        {/* Colorful Gradient Blur Circles for a modern vibrant touch */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-gradient-to-tr from-pink-500/10 to-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="p-3 border-b border-slate-100 dark:border-zinc-900/80 flex items-center justify-between bg-white/60 dark:bg-zinc-950/60 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 rounded-[5px] text-indigo-600 dark:text-indigo-400">
              <Database className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <h3 className="font-extrabold text-xs tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 font-black">
                Backup Manager
              </span>
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 rounded-[5px] border border-slate-200/60 dark:border-zinc-800/80 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Thinner single line English text */}
        <div className="px-4 pt-3 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 text-center relative z-10">
          Backup your data
        </div>

        {/* Backup All Control (Raised below the English instruction) */}
        <div className="p-4 pt-1.5 pb-3 border-b border-slate-100 dark:border-zinc-900/50 relative z-10">
          <button
            onClick={handleExportAllBackup}
            disabled={history.length === 0}
            className="relative overflow-hidden group w-full py-2 border border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 text-indigo-700 dark:text-indigo-450 font-bold text-xs rounded-[5px] shadow-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
            <span className="relative z-10 group-hover:text-white transition-colors duration-300 flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              <span>Backup your all data</span>
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-900/50 bg-slate-50/20 dark:bg-zinc-950/10 relative z-10">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-indigo-400 dark:text-indigo-500" />
            </div>
            <input
              type="text"
              placeholder="Search profile by name or passport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-8 pr-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-[5px] text-xs bg-white dark:bg-black/40 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-500 text-black dark:text-white font-medium transition-colors placeholder-zinc-400"
            />
          </div>
        </div>

        {/* List of profiles (Taking up ~70% to ensure highly visible) */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[380px] space-y-2 relative z-10">
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 dark:border-zinc-800 rounded-[5px] flex flex-col items-center justify-center">
              <Database className="w-6 h-6 text-zinc-400 mb-1.5" />
              <p className="text-xs font-bold text-zinc-500">No profiles found</p>
            </div>
          ) : (
            <div className="border border-slate-100 dark:border-zinc-900 rounded-[5px] overflow-hidden divide-y divide-slate-100 dark:divide-zinc-900 bg-white/40 dark:bg-black/10">
              {filteredProfiles.map((item, index) => {
                const p = item.data;
                const displayName = `${p.givenName || 'Unnamed'} ${p.surname || ''}`.trim();
                
                return (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-2.5 hover:bg-white/60 dark:hover:bg-zinc-900/30 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {/* Serial Number */}
                      <span className="w-5 h-5 rounded-full border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-450 text-[10px] font-bold flex items-center justify-center shrink-0 bg-indigo-50/50 dark:bg-indigo-950/25">
                        {index + 1}
                      </span>
                      
                      {/* Info block */}
                      <div className="overflow-hidden">
                        <h5 className="font-extrabold text-xs text-slate-850 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {displayName}
                        </h5>
                        <p className="text-[10px] text-zinc-400 font-mono font-medium mt-0.5">
                          {p.passportNumber || 'No ID'}
                        </p>
                      </div>
                    </div>

                    {/* Single Backup Button with slide effect */}
                    <button
                      onClick={() => handleExportIndividualEncrypted(item)}
                      className="relative overflow-hidden group px-2.5 py-1 border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-[5px] transition-all duration-300 font-bold text-[10px] cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-purple-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
                      <span className="relative z-10 group-hover:text-white transition-colors duration-300 flex items-center gap-1">
                        <Key className="w-3 h-3" />
                        <span>Backup</span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-zinc-900/80 bg-white/60 dark:bg-zinc-950/60 relative z-10 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
            <span>SECURE CRYPTO ENGINE</span>
          </div>
          <div>
            <span>.pass / .enc</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
