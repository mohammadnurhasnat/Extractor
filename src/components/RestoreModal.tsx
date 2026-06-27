import React, { useState, useRef } from 'react';
import { 
  X, UploadCloud, ShieldCheck, AlertCircle, CheckCircle2, FileText, Database, Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import { HistoryItem, PassportData } from '../types';
import { decryptData } from '../utils/crypto';

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

export function RestoreModal({
  isOpen,
  onClose,
  history,
  setHistory,
  setToast
}: RestoreModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<BackupPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process and decrypt the file text content
  const handleProcessFileContent = (encryptedText: string, file: File) => {
    try {
      const decrypted = decryptData(encryptedText);
      if (!decrypted || typeof decrypted !== 'object') {
        throw new Error('Could not decrypt secure file. Check file contents.');
      }

      // Validate single profile payload
      if (decrypted.type === 'single_passport_profile' && decrypted.data) {
        if (!decrypted.data.passportNumber) {
          throw new Error('Invalid signature structure: Missing Passport ID.');
        }
        setParsedData(decrypted as BackupPayload);
        setAttachedFile(file);
        setError(null);
        return;
      }

      // Validate master backup history payload
      if (decrypted.type === 'passport_history_backup' && Array.isArray(decrypted.data)) {
        setParsedData(decrypted as BackupPayload);
        setAttachedFile(file);
        setError(null);
        return;
      }

      throw new Error('Unrecognized cryptographic backup signature.');
    } catch (err: any) {
      console.error('Decryption parse error:', err);
      setError(err.message || 'File verification failed. Please upload a valid .pass or .enc file.');
      setAttachedFile(null);
      setParsedData(null);
    }
  };

  // Perform the actual database restoration upon clicking OK
  const handleExecuteRestore = () => {
    if (!parsedData) return;

    try {
      // 1. Restore Single Profile
      if (parsedData.type === 'single_passport_profile') {
        const singleData = parsedData.data as PassportData;
        
        const duplicateIndex = history.findIndex(
          item => item.data.passportNumber?.toUpperCase() === singleData.passportNumber?.toUpperCase()
        );

        let updatedHistory: HistoryItem[];
        if (duplicateIndex >= 0) {
          const existing = history[duplicateIndex];
          const updatedItem: HistoryItem = {
            ...existing,
            timestamp: Date.now(),
            data: { ...existing.data, ...singleData }
          };
          updatedHistory = [updatedItem, ...history.filter((_, idx) => idx !== duplicateIndex)];
        } else {
          const newItem: HistoryItem = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            data: singleData
          };
          updatedHistory = [newItem, ...history];
        }

        setHistory(updatedHistory);
        setToast({
          message: `Successfully imported and restored profile for ${singleData.givenName || 'Passport Holder'}.`,
          type: 'success'
        });
      } 
      // 2. Restore Master Backup (All Profiles)
      else if (parsedData.type === 'passport_history_backup') {
        const restoredList = parsedData.data as HistoryItem[];
        
        const merged = [...history];
        let importedCount = 0;
        let updatedCount = 0;

        restoredList.forEach(restoredItem => {
          if (!restoredItem.data?.passportNumber) return;

          const existingIndex = merged.findIndex(
            item => item.data.passportNumber?.toUpperCase() === restoredItem.data.passportNumber?.toUpperCase()
          );

          if (existingIndex >= 0) {
            merged[existingIndex] = {
              ...merged[existingIndex],
              timestamp: Math.max(merged[existingIndex].timestamp, restoredItem.timestamp || Date.now()),
              data: { ...merged[existingIndex].data, ...restoredItem.data }
            };
            updatedCount++;
          } else {
            merged.push({
              ...restoredItem,
              id: restoredItem.id || Date.now().toString() + Math.random().toString(36).substring(2, 5)
            });
            importedCount++;
          }
        });

        // Sort by timestamp descending
        merged.sort((a, b) => b.timestamp - a.timestamp);
        
        setHistory(merged);
        setToast({
          message: `Master Restore Complete! Imported ${importedCount} new & updated ${updatedCount} profiles.`,
          type: 'success'
        });
      }

      onClose();
    } catch (err) {
      console.error('Restore execution failed:', err);
      setToast({ message: 'Failed to restore dataset.', type: 'error' });
    }
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readAndProcessFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readAndProcessFile(e.target.files[0]);
    }
  };

  const readAndProcessFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleProcessFileContent(event.target.result as string, file);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file from filesystem.');
    };
    reader.readAsText(file);
  };

  // Extract info from parsed backup to preview before restoring
  const getPreviewMetadata = () => {
    if (!parsedData) return null;
    if (parsedData.type === 'single_passport_profile') {
      const p = parsedData.data as PassportData;
      return {
        title: `${p.givenName || ''} ${p.surname || ''}`.trim() || 'Individual Profile',
        badge: 'Single Profile',
        badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        id: p.passportNumber || 'No ID',
        count: 1
      };
    } else {
      const count = Array.isArray(parsedData.data) ? parsedData.data.length : 0;
      return {
        title: `Master Backup Database`,
        badge: 'Master Archive',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        id: `Contains ${count} profile(s)`,
        count
      };
    }
  };

  const preview = getPreviewMetadata();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/45 backdrop-blur-md flex items-center justify-center p-4">
      {/* Small Cozy Glassmorphism Pop-up Window */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white/75 dark:bg-zinc-900/75 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-[0_24px_50px_rgba(59,130,246,0.12)] border border-white/50 dark:border-zinc-800/50 flex flex-col overflow-hidden"
      >
        {/* Colorful Gradient Blur Circles */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 border-b border-white/25 dark:border-zinc-800/40 flex items-center justify-between relative">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/15 shadow-sm">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800 dark:text-zinc-100 tracking-tight">
                Secure Data Restore
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-400 mt-0.5 font-semibold">
                Upload decrypted profiles to sync with your database.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Restore Content & Dropzone */}
        <div className="p-5 space-y-4.5 relative">
          
          {/* Custom Human-Designed Attachment Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-350 ${
              isDragging 
                ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                : 'border-slate-200/80 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-900 bg-white/40 dark:bg-black/10'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pass,.enc" 
              className="hidden" 
              onChange={handleFileSelect}
            />

            {/* Glowing Cloud Graphic */}
            <div className={`p-3 bg-gradient-to-br rounded-2xl mb-3 border transition-all duration-350 ${
              isDragging
                ? 'from-emerald-500/20 to-teal-500/20 text-emerald-600 border-emerald-500/30 scale-105 shadow-sm'
                : 'from-slate-50 to-slate-100 dark:from-zinc-800 dark:to-zinc-850 text-slate-400 border-slate-200/50 dark:border-zinc-700/50 group-hover:from-emerald-500/10 group-hover:to-teal-500/10 group-hover:text-emerald-500 group-hover:border-emerald-500/20 group-hover:scale-102'
            }`}>
              <UploadCloud className="w-6 h-6 animate-pulse" />
            </div>

            <p className="text-xs font-extrabold text-slate-700 dark:text-zinc-200">
              Drag & Drop or Click to Attach Backup
            </p>
            <p className="text-[9px] text-slate-400 dark:text-zinc-550 mt-1 font-medium max-w-[240px] leading-relaxed">
              Supports encrypted files with <span className="font-mono bg-slate-200/40 dark:bg-zinc-850/60 px-1 py-0.5 rounded">.pass</span> or <span className="font-mono bg-slate-200/40 dark:bg-zinc-850/60 px-1 py-0.5 rounded">.enc</span> extensions.
            </p>
          </div>

          {/* Validation & Live Preview Container */}
          {error && (
            <div className="flex items-start gap-2 bg-rose-500/5 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3.5 py-3 rounded-xl border border-rose-500/15 text-xs font-bold shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {attachedFile && preview && (
            <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-500/15 dark:border-emerald-500/20 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Secure Backup File Verified
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Valid Signature
                </span>
              </div>

              {/* Preview Box */}
              <div className="flex items-center gap-3 bg-white/70 dark:bg-zinc-900/60 p-3 rounded-xl border border-white/50 dark:border-zinc-800/50">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 truncate">
                    {preview.title}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-450 dark:text-zinc-500 font-semibold">
                    <span className="font-mono">{preview.id}</span>
                  </div>
                </div>
              </div>

              {/* Info Detail */}
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                Clicking <span className="font-extrabold text-emerald-600 dark:text-emerald-400">OK</span> will restore this item and automatically arrange the profiles in the history database without losing any data fields.
              </p>
            </div>
          )}

        </div>

        {/* Action Controls */}
        <div className="px-5 py-4 bg-slate-50/40 dark:bg-black/10 border-t border-white/20 dark:border-zinc-800/40 flex items-center justify-end gap-2.5 relative">
          <button 
            onClick={onClose}
            className="px-4 py-2 hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 border border-slate-200/50 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button 
            disabled={!attachedFile}
            onClick={handleExecuteRestore}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-[0_8px_15px_-3px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>OK</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
