import React, { useState, useRef } from 'react';
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      {/* Small Cozy Glassmorphism Pop-up Window */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl w-full max-w-sm rounded-3xl shadow-[0_24px_50px_rgba(59,130,246,0.12)] border border-white/50 dark:border-zinc-850/50 flex flex-col overflow-hidden text-black dark:text-white"
      >
        {/* Colorful Gradient Blur Circles */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="p-4.5 border-b border-white/30 dark:border-zinc-800/40 flex items-center justify-between bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-slate-800 dark:text-zinc-200" />
            <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
              Restore Backup
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dropzone Area */}
        <div className="p-4 space-y-3 relative z-10">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
              isDragging 
                ? 'border-slate-800 dark:border-white bg-white/60 dark:bg-zinc-900/60' 
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700 bg-white/30 dark:bg-black/10'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pass,.enc" 
              className="hidden" 
              onChange={handleFileSelect}
            />

            <UploadCloud className="w-6 h-6 text-zinc-400 dark:text-zinc-550 group-hover:scale-105 transition-transform duration-300 mb-2" />

            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              Attach Backup File (.pass / .enc)
            </p>
          </div>

          {/* Validation Error */}
          {error && (
            <div className="flex items-start gap-2 bg-rose-50/10 text-rose-600 dark:text-rose-400 px-3 py-2.5 rounded-xl border border-rose-200/50 dark:border-rose-950/50 text-[11px] font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Verified File Preview */}
          {attachedFile && preview && (
            <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-3 space-y-2 bg-white/50 dark:bg-zinc-950/40">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                <span className="text-[10px] font-bold uppercase text-zinc-450">
                  VERIFIED BACKUP
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Valid
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-800 dark:text-zinc-200 shrink-0" />
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {preview.title}
                  </h4>
                  <p className="text-[10px] text-zinc-450 font-mono font-medium">
                    {preview.id}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons with sliding effects */}
        <div className="p-4 bg-white/40 dark:bg-zinc-900/40 border-t border-white/30 dark:border-zinc-800/40 flex items-center justify-end gap-2.5 relative z-10">
          <button 
            onClick={onClose}
            className="relative overflow-hidden group px-4 py-2 border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-200 rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 cursor-pointer"
          >
            <span className="absolute inset-0 w-full h-full bg-slate-900 dark:bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
            <span className="relative z-10 group-hover:text-white dark:group-hover:text-black transition-colors duration-300">
              Cancel
            </span>
          </button>

          <button 
            disabled={!attachedFile}
            onClick={handleExecuteRestore}
            className="relative overflow-hidden group px-4.5 py-2 border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-200 rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
          >
            <span className="absolute inset-0 w-full h-full bg-slate-900 dark:bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
            <span className="relative z-10 group-hover:text-white dark:group-hover:text-black transition-colors duration-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>OK</span>
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
