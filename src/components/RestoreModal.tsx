import React, { useState, useRef } from 'react';
import { 
  X, UploadCloud, ShieldCheck, AlertCircle, CheckCircle2, FileText, Database
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* High contrast, compact black-and-white pop-up window */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative bg-white dark:bg-zinc-950 w-full max-w-sm rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] border-2 border-black dark:border-zinc-800 flex flex-col overflow-hidden text-black dark:text-white"
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-black dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-black dark:text-white" />
            <h3 className="font-extrabold text-sm tracking-tight">
              Restore Backup
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-lg transition-colors cursor-pointer border border-black dark:border-zinc-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dropzone */}
        <div className="p-4 space-y-3.5">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
              isDragging 
                ? 'border-black dark:border-white bg-zinc-50 dark:bg-zinc-900' 
                : 'border-zinc-300 dark:border-zinc-800 hover:border-black dark:hover:border-white bg-white dark:bg-black/20'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pass,.enc" 
              className="hidden" 
              onChange={handleFileSelect}
            />

            <UploadCloud className="w-5 h-5 text-zinc-500 group-hover:scale-105 transition-transform duration-300 mb-2" />

            <p className="text-xs font-extrabold">
              Attach Backup File
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 font-medium">
              Select <span className="font-mono bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded">.pass</span> or <span className="font-mono bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded">.enc</span>
            </p>
          </div>

          {/* Validation Error */}
          {error && (
            <div className="flex items-start gap-2 bg-rose-50/10 text-rose-600 dark:text-rose-400 px-3 py-2.5 rounded-lg border border-rose-200 dark:border-rose-950 text-[11px] font-bold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success File Preview */}
          {attachedFile && preview && (
            <div className="border border-black dark:border-zinc-800 rounded-xl p-3 space-y-2 bg-zinc-50 dark:bg-zinc-900/40">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                <span className="text-[9px] font-extrabold uppercase text-zinc-500">
                  Verified Backup File
                </span>
                <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-650 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> Valid
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-black dark:text-white shrink-0" />
                <div className="overflow-hidden">
                  <h4 className="text-xs font-extrabold truncate">
                    {preview.title}
                  </h4>
                  <p className="text-[9px] text-zinc-500 font-mono">
                    {preview.id}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions with beautiful slide effect buttons */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
          {/* Cancel Button */}
          <button 
            onClick={onClose}
            className="relative overflow-hidden group px-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 cursor-pointer"
          >
            <span className="absolute inset-0 w-full h-full bg-black dark:bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
            <span className="relative z-10 group-hover:text-white dark:group-hover:text-black transition-colors duration-300">
              Cancel
            </span>
          </button>

          {/* OK Button */}
          <button 
            disabled={!attachedFile}
            onClick={handleExecuteRestore}
            className="relative overflow-hidden group px-5 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
          >
            <span className="absolute inset-0 w-full h-full bg-black dark:bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
            <span className="relative z-10 group-hover:text-white dark:group-hover:text-black transition-colors duration-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>OK</span>
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
