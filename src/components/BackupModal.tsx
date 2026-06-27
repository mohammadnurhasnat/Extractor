import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      {/* Small Cozy Glassmorphism Pop-up Window */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl w-full max-w-sm rounded-3xl shadow-[0_24px_50px_rgba(59,130,246,0.12)] border border-white/50 dark:border-zinc-850/50 flex flex-col overflow-hidden max-h-[80vh] text-black dark:text-white"
      >
        {/* Colorful Gradient Blur Circles */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="p-4.5 border-b border-white/30 dark:border-zinc-800/40 flex items-center justify-between bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-800 dark:text-zinc-200" />
            <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
              Profile Backup
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Backup All Control */}
        <div className="p-4 border-b border-zinc-100/50 dark:border-zinc-800/30 bg-white/20 dark:bg-zinc-900/20 relative z-10">
          <button
            onClick={handleExportAllBackup}
            disabled={history.length === 0}
            className="relative overflow-hidden group w-full py-2 border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 text-slate-800 dark:text-zinc-200 font-bold text-xs rounded-xl shadow-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="absolute inset-0 w-full h-full bg-slate-900 dark:bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
            <span className="relative z-10 group-hover:text-white dark:group-hover:text-black transition-colors duration-300 flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              <span>Backup All ({history.length})</span>
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-zinc-100/50 dark:border-zinc-800/30 bg-slate-50/30 dark:bg-zinc-950/20 relative z-10">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-550" />
            </div>
            <input
              type="text"
              placeholder="Search by name or passport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-8 pr-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-white/50 dark:bg-black/30 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700 text-black dark:text-white font-medium transition-colors placeholder-zinc-400"
            />
          </div>
        </div>

        {/* List of profiles */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[250px] space-y-2 relative z-10">
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center">
              <Database className="w-6 h-6 text-zinc-400 mb-1.5" />
              <p className="text-xs font-bold text-zinc-500">No profiles found</p>
            </div>
          ) : (
            <div className="border border-slate-200/60 dark:border-zinc-800/60 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/40 bg-white/30 dark:bg-black/10">
              {filteredProfiles.map((item, index) => {
                const p = item.data;
                const displayName = `${p.givenName || 'Unnamed'} ${p.surname || ''}`.trim();
                
                return (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-2.5 hover:bg-white/40 dark:hover:bg-zinc-800/20 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {/* Serial Number */}
                      <span className="w-5 h-5 rounded-full border border-slate-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      
                      {/* Info block */}
                      <div className="overflow-hidden">
                        <h5 className="font-extrabold text-xs text-slate-850 dark:text-zinc-200 truncate group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
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
                      className="relative overflow-hidden group px-2.5 py-1 border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-200 rounded-xl transition-all duration-300 font-bold text-[10px] cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <span className="absolute inset-0 w-full h-full bg-slate-900 dark:bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
                      <span className="relative z-10 group-hover:text-white dark:group-hover:text-black transition-colors duration-300 flex items-center gap-1">
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
        <div className="px-4 py-3 border-t border-white/30 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md relative z-10 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
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
