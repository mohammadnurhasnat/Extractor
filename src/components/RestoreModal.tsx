import React, { useState, useRef, useEffect } from 'react';
import { 
  X, UploadCloud, ShieldCheck, AlertCircle, CheckCircle2, FileText
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

  const handleProcessFileContent = (encryptedText: string, file: File) => {
    try {
      const decrypted = decryptData(encryptedText);
      if (!decrypted || typeof decrypted !== 'object') {
        throw new Error('Decryption failed. Invalid format.');
      }

      if (decrypted.type === 'single_passport_profile' && decrypted.data) {
        if (!decrypted.data.passportNumber) {
          throw new Error('Invalid backup: Missing Passport ID.');
        }
        setParsedData(decrypted as BackupPayload);
        setAttachedFile(file);
        setError(null);
        return;
      }

      if (decrypted.type === 'passport_history_backup' && Array.isArray(decrypted.data)) {
        setParsedData(decrypted as BackupPayload);
        setAttachedFile(file);
        setError(null);
        return;
      }

      throw new Error('Unrecognized backup signature.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Verification failed. Upload .pass or .enc.');
      setAttachedFile(null);
      setParsedData(null);
    }
  };

  const handleExecuteRestore = () => {
    if (!parsedData) return;

    try {
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
          message: `${singleData.givenName || 'Profile'} restored successfully.`,
          type: 'success'
        });
      } 
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

        merged.sort((a, b) => b.timestamp - a.timestamp);
        
        setHistory(merged);
        setToast({
          message: `Restored ${importedCount} new & updated ${updatedCount} profiles.`,
          type: 'success'
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
      setToast({ message: 'Restore failed.', type: 'error' });
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
      readAndProcessFile(e.dataTransfer.files[0]);
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
    reader.readAsText(file);
  };

  const getPreviewMetadata = () => {
    if (!parsedData) return null;
    if (parsedData.type === 'single_passport_profile') {
      const p = parsedData.data as PassportData;
      return {
        title: `${p.givenName || ''} ${p.surname || ''}`.trim() || 'Profile',
        id: p.passportNumber || 'No ID',
      };
    } else {
      const count = Array.isArray(parsedData.data) ? parsedData.data.length : 0;
      return {
        title: `Master Archive`,
        id: `${count} profile(s)`,
      };
    }
  };

  const preview = getPreviewMetadata();

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
            onClick={onClose}
            className="p-1.5 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 rounded-[5px] border border-slate-200/60 dark:border-zinc-800/80 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Single-line elegant instruction */}
        <div className="mx-3 mt-3 p-2.5 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/15 dark:to-teal-950/15 rounded-[5px] border border-emerald-100/30 dark:border-emerald-900/10 text-[11px] text-center text-slate-650 dark:text-zinc-300 relative z-10">
          <p className="font-medium">
            Attach a backup file (<span className="font-bold text-emerald-600 dark:text-emerald-400">.pass</span> or <span className="font-bold text-emerald-600 dark:text-emerald-400">.enc</span>) and click <span className="font-bold">"OK"</span> to restore.
          </p>
        </div>

        {/* Dropzone Area (Optimized to minimum possible size, with SOLID border) */}
        <div className="p-3 space-y-2 relative z-10">
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

          {/* Verified File Preview (Super Compact to keep height minimal) */}
          {attachedFile && preview && (
            <div className="border border-emerald-200 dark:border-emerald-900/50 rounded-[5px] p-2 bg-emerald-50/20 dark:bg-emerald-950/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="overflow-hidden">
                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                    {preview.title}
                  </h4>
                  <p className="text-[9px] text-zinc-400 font-mono">
                    {preview.id}
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-400/25 px-1.5 py-0.5 rounded-[5px] shrink-0">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Valid
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons (More compact py-2.5 with dynamic light/pure premium colors) */}
        <div className="p-3 bg-white/60 dark:bg-zinc-950/60 border-t border-slate-100 dark:border-zinc-900/80 flex items-center justify-end gap-2 relative z-10">
          <button 
            onClick={onClose}
            className="relative overflow-hidden group px-3 py-1.5 border border-red-500/30 dark:border-red-500/20 bg-red-500/10 transition-all duration-300 font-bold text-[11px] shadow-sm active:scale-95 cursor-pointer shrink-0 rounded-[5px]"
          >
            <span className="absolute inset-0 w-full h-full bg-red-600 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
            <span className="relative z-10 text-black dark:text-zinc-200 group-hover:text-white dark:group-hover:text-white transition-colors duration-300">
              Cancel
            </span>
          </button>

          <button 
            disabled={!attachedFile}
            onClick={handleExecuteRestore}
            className={`relative overflow-hidden group px-4 py-1.5 border rounded-[5px] transition-all duration-300 font-bold text-[11px] shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shrink-0 ${
              attachedFile 
                ? 'border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/10' 
                : 'border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80'
            }`}
          >
            {attachedFile && (
              <span className="absolute inset-0 w-full h-full bg-emerald-600 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
            )}
            <span className={`relative z-10 transition-colors duration-300 flex items-center gap-1 ${
              attachedFile 
                ? 'text-black dark:text-zinc-200 group-hover:text-white dark:group-hover:text-white' 
                : 'text-slate-400 dark:text-zinc-500'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>OK</span>
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
