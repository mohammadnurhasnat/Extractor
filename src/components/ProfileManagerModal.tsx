import React, { useState, useRef } from 'react';
import { 
  X, Download, UploadCloud, Search, ShieldCheck, Database, FileText, CheckCircle2,
  FileCheck, FileSpreadsheet, Key, AlertCircle, Trash2, ArrowRightLeft, FileArchive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HistoryItem, PassportData } from '../types';
import { encryptData, decryptData } from '../utils/crypto';
import { generateDataText } from '../utils/addressUtils';
import { generatePDF } from '../utils/pdfGenerator';
import JSZip from 'jszip';

interface ProfileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  setHistory: (history: HistoryItem[]) => void;
  onLoadItem: (item: HistoryItem) => void;
  setToast: (toast: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
}

export function ProfileManagerModal({
  isOpen,
  onClose,
  history,
  setHistory,
  onLoadItem,
  setToast
}: ProfileManagerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter profiles based on search term
  const filteredProfiles = history.filter(item => {
    const fullName = `${item.data.givenName || ''} ${item.data.surname || ''}`.toLowerCase();
    const passportNo = (item.data.passportNumber || '').toLowerCase();
    const query = searchTerm.toLowerCase().trim();
    return fullName.includes(query) || passportNo.includes(query);
  });

  // --- EXPORT FUNCTIONALITIES ---

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

  // Export an individual profile's documents as a single ZIP
  const handleExportIndividualZIP = async (item: HistoryItem) => {
    try {
      setToast({ message: 'Generating ZIP archive...', type: 'info' });
      const zip = new JSZip();
      
      // Add plain text document
      const plainTextContent = generateDataText(item.data);
      zip.file(`Passport_Data_${item.data.passportNumber || 'Extracted'}.txt`, plainTextContent);

      // Add encrypted raw backup inside
      const encryptedProfileData = encryptData({
        type: 'single_passport_profile',
        version: '1.0',
        data: item.data
      });
      zip.file(`SECURE_PROFILE_BACKUP.pass`, encryptedProfileData);

      // Generate ZIP and download
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      
      const safeName = `${item.data.givenName || 'Profile'}_${item.data.surname || ''}`.replace(/\s+/g, '_');
      link.download = `DOCUMENTS_ARCHIVE_${safeName}.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToast({ message: 'All documents zipped successfully!', type: 'success' });
    } catch (err) {
      console.error('ZIP generation failed:', err);
      setToast({ message: 'ZIP creation failed.', type: 'error' });
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

  // --- IMPORT / RESTORE FUNCTIONALITIES ---

  const processImportedText = (encryptedText: string) => {
    setImportError(null);
    try {
      const decrypted = decryptData(encryptedText);
      if (!decrypted || typeof decrypted !== 'object') {
        throw new Error('Could not decrypt or parse backup payload.');
      }

      // Check if it's a single profile
      if (decrypted.type === 'single_passport_profile' && decrypted.data) {
        const singleData = decrypted.data as PassportData;
        if (!singleData.passportNumber) {
          throw new Error('Invalid profile data structure: Missing Passport Number.');
        }

        // Add to history list, merging by passport number
        const duplicateIndex = history.findIndex(
          item => item.data.passportNumber?.toUpperCase() === singleData.passportNumber?.toUpperCase()
        );

        let updatedHistory: HistoryItem[];
        if (duplicateIndex >= 0) {
          // Update existing
          const existing = history[duplicateIndex];
          const updatedItem: HistoryItem = {
            ...existing,
            timestamp: Date.now(),
            data: { ...existing.data, ...singleData }
          };
          updatedHistory = [updatedItem, ...history.filter((_, idx) => idx !== duplicateIndex)];
        } else {
          // Create new
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
        return;
      }

      // Check if it's a full master backup
      if (decrypted.type === 'passport_history_backup' && Array.isArray(decrypted.data)) {
        const restoredList = decrypted.data as HistoryItem[];
        
        // Merge lists carefully to prevent losing existing profiles
        const merged = [...history];
        let importedCount = 0;
        let updatedCount = 0;

        restoredList.forEach(restoredItem => {
          if (!restoredItem.data?.passportNumber) return;

          const existingIndex = merged.findIndex(
            item => item.data.passportNumber?.toUpperCase() === restoredItem.data.passportNumber?.toUpperCase()
          );

          if (existingIndex >= 0) {
            // Update existing item with restored data
            merged[existingIndex] = {
              ...merged[existingIndex],
              timestamp: Math.max(merged[existingIndex].timestamp, restoredItem.timestamp),
              data: { ...merged[existingIndex].data, ...restoredItem.data }
            };
            updatedCount++;
          } else {
            // Add as new
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
          message: `Backup Restored! Imported ${importedCount} new & updated ${updatedCount} existing profiles.`,
          type: 'success'
        });
        return;
      }

      throw new Error('Unrecognized secure backup signature.');
    } catch (err: any) {
      console.error('Import failed:', err);
      setImportError(err.message || 'Decrypt failure. Please ensure the file is a valid encrypted backup.');
      setToast({ message: 'Secure import failed.', type: 'error' });
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readAndProcessBackupFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readAndProcessBackupFile(e.target.files[0]);
    }
  };

  const readAndProcessBackupFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        processImportedText(event.target.result as string);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read backup file.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-zinc-100">
                Secure Profile Manager
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Manage, export individual encrypted profiles, download zips, and restore database archives.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Actions: Restore Dropzone & Master Backup Export */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Encrypted Backup Importer / Restore Area */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/10' 
                  : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/30 dark:bg-black/10'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pass,.enc" 
                className="hidden" 
                onChange={handleFileSelect}
              />
              <UploadCloud className={`w-8 h-8 mb-2.5 transition-colors ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                Drag & drop or Click to upload secure backup
              </p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                Supports encrypted profiles (<span className="font-mono">.pass</span>) or master backup (<span className="font-mono">.enc</span>)
              </p>
              
              {importError && (
                <div className="mt-3 flex items-center gap-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-3 py-1 rounded-lg border border-red-100/50 dark:border-red-900/10 text-[10px] font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{importError}</span>
                </div>
              )}
            </div>

            {/* Master Export Area */}
            <div className="border border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-black/10 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Complete Cryptographic Backup
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed font-medium">
                  Export your entire database history containing <span className="font-bold text-slate-700 dark:text-zinc-200">{history.length} profiles</span>. All passport visual inspection fields, MRZs, and manual updates are compiled into a securely encrypted AES backup file.
                </p>
              </div>
              
              <button
                onClick={handleExportAllBackup}
                disabled={history.length === 0}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Download Master Backup (All Profiles)
              </button>
            </div>

          </div>

          {/* Search bar & count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">
                Individual Extracted Profiles ({filteredProfiles.length})
              </h4>
            </div>
            
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search profiles by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-slate-50/50 dark:bg-black/20 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-zinc-150"
              />
            </div>
          </div>

          {/* Profile Cards Grid */}
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center p-4">
              <Database className="w-10 h-10 text-slate-300 dark:text-zinc-600 mb-2" />
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">No profile matches found.</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Adjust your search parameters or import an encrypted backup above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProfiles.map((item) => {
                const p = item.data;
                const displayName = `${p.givenName || 'Unnamed'} ${p.surname || ''}`.trim();
                
                return (
                  <div 
                    key={item.id} 
                    className="border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 rounded-2xl p-4.5 flex flex-col justify-between shadow-sm relative group hover:border-slate-200 dark:hover:border-zinc-700 transition-all duration-300 hover:shadow-md"
                  >
                    <div>
                      {/* Name & Badge */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="overflow-hidden">
                          <h5 className="font-extrabold text-sm text-slate-850 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {displayName || 'Anonymous Profile'}
                          </h5>
                          <span className="text-[10px] font-bold font-mono text-slate-400 mt-0.5 block">
                            {p.passportNumber || 'No Passport ID'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-450 font-mono">
                          {p.gender === 'F' || p.gender?.toLowerCase() === 'female' ? 'Female' : p.gender === 'M' || p.gender?.toLowerCase() === 'male' ? 'Male' : p.gender || 'Unknown'}
                        </div>
                      </div>

                      {/* Brief details grid */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10.5px] border-t border-slate-50 dark:border-zinc-900 pt-3 mb-4 font-sans text-slate-500 dark:text-zinc-400 font-medium">
                        <div className="truncate">
                          <span className="text-slate-400 dark:text-zinc-500 mr-1.5">DOB:</span>
                          <span className="font-semibold text-slate-700 dark:text-zinc-300">{p.dob || '—'}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-400 dark:text-zinc-500 mr-1.5">NID:</span>
                          <span className="font-semibold text-slate-700 dark:text-zinc-300 font-mono">{p.nidOrBirthCertNumber || '—'}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-400 dark:text-zinc-500 mr-1.5">Birth:</span>
                          <span className="font-semibold text-slate-700 dark:text-zinc-300">{p.birthPlace || '—'}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-400 dark:text-zinc-500 mr-1.5">Mobile:</span>
                          <span className="font-semibold text-slate-700 dark:text-zinc-300 font-mono">{p.mobileNumber || '—'}</span>
                        </div>
                        <div className="col-span-2 truncate">
                          <span className="text-slate-400 dark:text-zinc-500 mr-1.5">Father:</span>
                          <span className="font-semibold text-slate-700 dark:text-zinc-300">{p.fatherName || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons layout */}
                    <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-100 dark:border-zinc-900 mt-2">
                      <button
                        onClick={() => handleExportIndividualEncrypted(item)}
                        className="flex-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl py-1.5 text-[10px] font-bold text-slate-600 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1 shadow-sm active:scale-97 cursor-pointer"
                        title="Export this profile as a secure encrypted backup file"
                      >
                        <Key className="w-3 h-3 text-blue-500" />
                        <span>Secure Download</span>
                      </button>

                      <button
                        onClick={() => handleExportIndividualZIP(item)}
                        className="flex-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl py-1.5 text-[10px] font-bold text-slate-600 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1 shadow-sm active:scale-97 cursor-pointer"
                        title="Download plain-text and encrypted formats compiled into a ZIP"
                      >
                        <FileArchive className="w-3 h-3 text-emerald-500" />
                        <span>Download ZIP</span>
                      </button>

                      <button
                        onClick={() => {
                          onLoadItem(item);
                          onClose();
                          setToast({ message: `Loaded profile: ${displayName}`, type: 'success' });
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-1.5 text-[10px] font-bold transition-colors flex items-center justify-center gap-1 shadow-sm active:scale-97 cursor-pointer"
                        title="Load this profile's dataset into the live active editor"
                      >
                        <ArrowRightLeft className="w-3 h-3 text-white" />
                        <span>Load Profile</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-black/20 text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>End-to-End Client Side Encryption (CryptoJS AES-256) Active</span>
          </div>
          <div>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
