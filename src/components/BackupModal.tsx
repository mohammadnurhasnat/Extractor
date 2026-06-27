import React, { useState } from 'react';
import { 
  X, Download, Database, ShieldCheck, Search, Key, User, Calendar, FileText
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

  // Filter profiles based on search term
  const filteredProfiles = history.filter(item => {
    const fullName = `${item.data.givenName || ''} ${item.data.surname || ''}`.toLowerCase();
    const passportNo = (item.data.passportNumber || '').toLowerCase();
    const query = searchTerm.toLowerCase().trim();
    return fullName.includes(query) || passportNo.includes(query);
  });

  // Export an individual profile as a secure encrypted (.pass) file
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
        message: `${item.data.givenName || 'Profile'} exported securely as encrypted file.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Individual encrypted export failed:', err);
      setToast({ message: 'Failed to export profile.', type: 'error' });
    }
  };

  // Export ALL profiles as a single master encrypted (.enc) backup file
  const handleExportAllBackup = () => {
    if (history.length === 0) {
      setToast({ message: 'No profiles available to export.', type: 'error' });
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
      link.download = `SECURE_MASTER_BACKUP_${new Date().toISOString().split('T')[0]}.enc`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToast({
        message: `All ${history.length} profiles backed up securely in a single encrypted file.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Master export failed:', err);
      setToast({ message: 'Master backup export failed.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      {/* Outer Glassmorphism Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white/75 dark:bg-zinc-900/75 backdrop-blur-xl w-full max-w-3xl rounded-3xl shadow-[0_32px_64px_-15px_rgba(59,130,246,0.15)] border border-white/50 dark:border-zinc-800/50 flex flex-col overflow-hidden max-h-[85vh]"
      >
        {/* Soft Decorative Ambient Lights */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-6 border-b border-white/20 dark:border-zinc-800/40 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/20 shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100 tracking-tight">
                Cryptographic Profile Backup
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
                Select specific profiles for local encrypted backup, or download the entire secure archive.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer border border-transparent hover:border-slate-150 dark:hover:border-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Backup Section */}
        <div className="mx-6 mt-6 p-5 bg-gradient-to-r from-blue-500/5 via-teal-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-2xl border border-blue-500/10 dark:border-blue-500/15 flex flex-col sm:flex-row items-center justify-between gap-4 relative">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 flex items-center justify-center sm:justify-start gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-500" /> Export All Profiles Securely
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-lg leading-relaxed font-medium">
              Create a single encrypted master backup file containing all <span className="font-extrabold text-blue-600 dark:text-blue-400">{history.length} profiles</span>. Perfect for a safe restore later.
            </p>
          </div>
          <button
            onClick={handleExportAllBackup}
            disabled={history.length === 0}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-[0_10px_20px_rgba(59,130,246,0.15)] transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Backup All Profiles
          </button>
        </div>

        {/* Search Controls */}
        <div className="px-6 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-450 dark:text-zinc-500">
            Select Individual Profile for Backup
          </h4>
          
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search by name or passport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-1.5 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs bg-slate-50/50 dark:bg-black/20 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-zinc-100 transition-colors"
            />
          </div>
        </div>

        {/* Serialized Profiles List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 relative min-h-[250px]">
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-12 bg-white/40 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-slate-200/60 dark:border-zinc-800 flex flex-col items-center justify-center p-4">
              <Database className="w-8 h-8 text-slate-350 dark:text-zinc-600 mb-2.5" />
              <p className="text-xs font-extrabold text-slate-550 dark:text-zinc-400">No profiles found to backup</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-medium">Add new passport scans or clear search query.</p>
            </div>
          ) : (
            <div className="border border-slate-100 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white/40 dark:bg-zinc-950/20 backdrop-blur-sm divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredProfiles.map((item, index) => {
                const p = item.data;
                const displayName = `${p.givenName || 'Unnamed'} ${p.surname || ''}`.trim();
                
                return (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* Serial Number Bubble */}
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200/40 dark:border-zinc-700/40 text-slate-500 dark:text-zinc-400 flex items-center justify-center text-[10px] font-extrabold font-mono shrink-0">
                        {index + 1}
                      </span>
                      
                      {/* Avatar Icon */}
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>

                      {/* Info block */}
                      <div className="overflow-hidden">
                        <h5 className="font-extrabold text-xs text-slate-800 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {displayName || 'Anonymous Holder'}
                        </h5>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                          <span className="font-bold font-mono text-slate-650 dark:text-zinc-400">{p.passportNumber || 'No ID'}</span>
                          <span>•</span>
                          <span>{p.gender || 'Unknown'}</span>
                          <span>•</span>
                          <span>{p.dob || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Single Backup Button */}
                    <button
                      onClick={() => handleExportIndividualEncrypted(item)}
                      className="p-2.5 bg-white/80 dark:bg-zinc-900/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 border border-slate-150 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-900 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 text-[10px] font-bold"
                      title={`Backup ${displayName}`}
                    >
                      <Key className="w-3.5 h-3.5 text-blue-500/80 group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">Encrypted Backup</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4.5 border-t border-white/20 dark:border-zinc-800/40 flex items-center justify-between bg-slate-50/40 dark:bg-black/10 relative text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Local AES-256 Crypto Engine Active</span>
          </div>
          <div>
            <span>Format: <span className="font-mono bg-slate-200/50 dark:bg-zinc-850 px-1 py-0.5 rounded text-[9.5px]">.pass / .enc</span></span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
