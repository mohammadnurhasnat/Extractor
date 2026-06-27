import React, { useState } from 'react';
import { 
  X, Database, Search, Key, User, ShieldCheck, Download
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Smaller, high-contrast, beautiful black-and-white window */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative bg-white dark:bg-zinc-950 w-full max-w-md rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] border-2 border-black dark:border-zinc-800 flex flex-col overflow-hidden max-h-[80vh] text-black dark:text-white"
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-black dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-black dark:text-white" />
            <h3 className="font-extrabold text-sm tracking-tight">
              Profile Backup
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-lg transition-colors cursor-pointer border border-black dark:border-zinc-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Master Backup Section */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex flex-col gap-3">
          <button
            onClick={handleExportAllBackup}
            disabled={history.length === 0}
            className="relative overflow-hidden group w-full py-2 border border-black dark:border-white bg-transparent text-black dark:text-white font-extrabold text-xs rounded-xl shadow-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="absolute inset-0 w-full h-full bg-black dark:bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
            <span className="relative z-10 group-hover:text-white dark:group-hover:text-black transition-colors duration-300 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>Backup All ({history.length})</span>
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/55 dark:bg-zinc-900/20">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search profile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-8 pr-2.5 py-1.5 border border-black/20 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-black focus:outline-none focus:border-black dark:focus:border-white text-black dark:text-white transition-colors placeholder-zinc-400 font-medium"
            />
          </div>
        </div>

        {/* Profiles List */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[300px]">
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center">
              <Database className="w-6 h-6 text-zinc-400 mb-1.5" />
              <p className="text-xs font-bold text-zinc-500">No profiles found</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-black/20">
              {filteredProfiles.map((item, index) => {
                const p = item.data;
                const displayName = `${p.givenName || 'Unnamed'} ${p.surname || ''}`.trim();
                
                return (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {/* Serial Number */}
                      <span className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 text-zinc-500 text-[9px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      
                      {/* Info block */}
                      <div className="overflow-hidden">
                        <h5 className="font-extrabold text-xs text-black dark:text-zinc-200 truncate group-hover:text-zinc-650 dark:group-hover:text-white transition-colors">
                          {displayName}
                        </h5>
                        <p className="text-[9px] text-zinc-455 font-mono">
                          {p.passportNumber || 'No ID'}
                        </p>
                      </div>
                    </div>

                    {/* Single Backup Button with slide effect */}
                    <button
                      onClick={() => handleExportIndividualEncrypted(item)}
                      className="relative overflow-hidden group p-2 border border-black dark:border-white bg-transparent text-black dark:text-white rounded-lg transition-all duration-300 font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                    >
                      <span className="absolute inset-0 w-full h-full bg-black dark:bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
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
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-between text-[10px] text-zinc-500 font-bold">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>Secure Engine</span>
          </div>
          <div>
            <span>.pass / .enc</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
