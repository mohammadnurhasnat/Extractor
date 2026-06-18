import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2, ShieldCheck, 
  History, Trash2, ZapOff, Search, Sun, Moon, Copy, Download, Check, 
  AlertTriangle, Printer, Play, X, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';

// Types
import { PassportData, HistoryItem, QueueItem } from './types';

// Components
import { DataField } from './components/DataField';

// Utilities
import {
  getPresentAddress,
  getDistrictFromAddress,
  getGeneratedEmail,
  getProprietorBusinessName,
  getJobCompanyName,
  getJobRole,
  getBusinessAddressDhaka,
  getOfficeAddressDhaka,
  getBusinessAddressLocal,
  generateDataText
} from './utils/addressUtils';
import { generatePDF, getPDFDocument } from './utils/pdfGenerator';

// @ts-ignore
import ExtractorLogo from './assets/images/extractor_logo_1779343193402.png';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PassportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Batch queue states
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  
  // History state initialize from localStorage
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('passport_core_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load history", e);
    }
    return [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('passport_app_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('passport_app_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('passport_app_theme', 'light');
    }
  }, [isDarkMode]);

  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem('passport_core_history', JSON.stringify(history));
  }, [history]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    const validImageFiles = filesArray.filter(f => f.type.startsWith('image/'));
    
    if (validImageFiles.length === 0) {
      setError('Please upload at least one valid image file (JPEG, PNG).');
      return;
    }

    const newQueueItems: QueueItem[] = validImageFiles.map(file => {
      const id = 'q_' + Date.now().toString() + Math.random().toString(36).substring(2);
      return {
        id,
        file,
        preview: URL.createObjectURL(file),
        loading: false,
        error: null,
        status: 'queued'
      };
    });

    setQueue(prev => {
      const updated = [...prev, ...newQueueItems];
      if (prev.length === 0) {
        const activeItem = newQueueItems[0];
        setActiveQueueId(activeItem.id);
        setFile(activeItem.file);
        setPreview(activeItem.preview);
        setData(null);
        setError(null);
      }
      return updated;
    });
    setError(null);
  };

  const selectQueueItem = (item: QueueItem) => {
    setActiveQueueId(item.id);
    setFile(item.file);
    setPreview(item.preview);
    setData(item.data || null);
    setError(item.error);
    setLoading(item.loading || item.status === 'extracting');
  };

  const removeFromQueue = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setQueue(prev => {
      const updated = prev.filter(q => q.id !== itemId);
      if (activeQueueId === itemId) {
        if (updated.length > 0) {
          setTimeout(() => {
            selectQueueItem(updated[0]);
          }, 0);
        } else {
          setFile(null);
          setPreview(null);
          setData(null);
          setError(null);
          setActiveQueueId(null);
        }
      }
      return updated;
    });
  };

  const addToHistory = (newData: PassportData) => {
    setHistory(prev => {
      // Prevent duplicates: filter out existing entry with the same passport number
      const filtered = prev.filter(item => item.data.passportNumber !== newData.passportNumber);
      const uniqueId = Date.now().toString() + Math.random().toString(36).substring(2);
      return [{ id: uniqueId, timestamp: Date.now(), data: newData }, ...filtered];
    });
  };

  const loadFromHistory = (item: HistoryItem) => {
    setData(item.data);
    setPreview(null);
    setFile(null);
    setError(null);
    // Create a temporary single queue item if history loaded
    const id = 'hist_' + Date.now();
    const mockFileObj = new File([], `Scanned_${item.data.passportNumber || 'Passport'}.jpg`, { type: 'image/jpeg' });
    const mockQueueItem: QueueItem = {
      id,
      file: mockFileObj,
      preview: '',
      loading: false,
      error: null,
      status: 'completed',
      data: item.data
    };
    setQueue([mockQueueItem]);
    setActiveQueueId(id);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateDataField = (field: keyof PassportData, newValue: string) => {
    if (!data) return;
    const updated = { ...data, [field]: newValue };
    setData(updated);
    
    // Also update in the browser-side batch storage queue
    if (activeQueueId) {
      setQueue(prev => prev.map(q => q.id === activeQueueId ? { ...q, data: updated } : q));
    }
    
    // Also sync to active history item (if exists) so corrections persist in local database
    setHistory(prev => prev.map(item => {
      if (item.data.passportNumber === data.passportNumber) {
        return { ...item, data: updated };
      }
      return item;
    }));
  };

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setItemToDelete(id);
  };

  const executeDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (itemToDelete) {
      setHistory(prev => prev.filter(h => h.id !== itemToDelete));
      setItemToDelete(null);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(null);
  };

  const extractSingleItem = async (itemId: string): Promise<PassportData | null> => {
    const item = queue.find(q => q.id === itemId);
    if (!item) return null;

    setQueue(prev => prev.map(q => q.id === itemId ? { ...q, loading: true, status: 'extracting', error: null } : q));
    if (activeQueueId === itemId) {
      setLoading(true);
      setError(null);
    }

    try {
      const options = {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(item.file, options);

      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
      });

      const res = await fetch('/api/extract-passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64String,
          mimeType: item.file.type
        }),
      });
      
      const result = await res.json();
      
      if (res.ok && result.success) {
        setQueue(prev => prev.map(q => q.id === itemId ? { ...q, loading: false, status: 'completed', error: null, data: result.data } : q));
        addToHistory(result.data);
        
        if (activeQueueId === itemId) {
          setData(result.data);
          setLoading(false);
        }
        return result.data;
      } else {
        const errMsg = result.error || 'Failed to extract data.';
        setQueue(prev => prev.map(q => q.id === itemId ? { ...q, loading: false, status: 'failed', error: errMsg } : q));
        if (activeQueueId === itemId) {
          setError(errMsg);
          setLoading(false);
        }
        return null;
      }
    } catch (err) {
      const errMsg = 'Network error: Could not reach the server.';
      setQueue(prev => prev.map(q => q.id === itemId ? { ...q, loading: false, status: 'failed', error: errMsg } : q));
      if (activeQueueId === itemId) {
        setError(errMsg);
        setLoading(false);
      }
      return null;
    }
  };

  const extractData = async () => {
    if (!isOnline) {
      setError("Cannot extract data while offline. Please restore your internet connection and try again.");
      return;
    }
    if (!activeQueueId) return;
    await extractSingleItem(activeQueueId);
  };

  const processEntireQueue = async () => {
    if (!isOnline) {
      setError("Cannot extract data while offline. Please restore your internet connection and try again.");
      return;
    }
    setIsBatchProcessing(true);
    const pendingItems = queue.filter(q => q.status === 'queued' || q.status === 'failed');
    for (const item of pendingItems) {
      await extractSingleItem(item.id);
    }
    setIsBatchProcessing(false);
  };

  const clearAll = () => {
    setFile(null);
    setPreview(null);
    setData(null);
    setError(null);
    setQueue([]);
    setActiveQueueId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadAllZIP = async () => {
    const completedItems = queue.filter(q => q.status === 'completed' && q.data);
    if (completedItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < completedItems.length; i++) {
        const item = completedItems[i];
        const itemData = item.data!;
        
        // Clean up the name to generate safe filename
        const safeGivenName = (itemData.givenName || 'Extracted').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        const safeSurname = (itemData.surname || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        const passportNum = (itemData.passportNumber || `Doc_${i + 1}`).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        
        const baseFileName = `${i + 1}_${safeGivenName}_${safeSurname}_${passportNum}`;
        
        // 1. Add Text Report
        const textContent = generateDataText(itemData);
        zip.file(`${baseFileName}.txt`, textContent);
        
        // 2. Add PDF Report using our refactored getPDFDocument
        const doc = getPDFDocument(itemData);
        const pdfArrayBuffer = doc.output('arraybuffer');
        zip.file(`${baseFileName}.pdf`, pdfArrayBuffer);
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Batch_Extracted_Passports_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP Generation failed:", err);
      setError("Failed to create ZIP file. Please try again.");
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyAll = async () => {
    if (!data) return;
    const text = generateDataText(data);
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDownloadText = () => {
    if (!data) return;
    const text = generateDataText(data);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Passport_Data_${data.givenName || 'Extracted'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (!data) return;
    generatePDF(data);
  };

  const filteredHistory = history.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${item.data.givenName || ''} ${item.data.surname || ''}`.toLowerCase();
    const passportNumber = (item.data.passportNumber || '').toLowerCase();
    const email = getGeneratedEmail(item.data).toLowerCase();
    
    return fullName.includes(searchLower) || 
           passportNumber.includes(searchLower) || 
           email.includes(searchLower);
  });

  const presentAddr = getPresentAddress(data);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-50 pb-12 selection:bg-blue-100 dark:selection:bg-blue-900/50 transition-colors">
      {/* Header */}
      <header className="bg-white/60 dark:bg-black/60 backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-800/50 px-6 py-4 shadow-sm sticky top-0 z-10 flex justify-between items-start transition-colors print:hidden">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-2">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-inner border border-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <img src={ExtractorLogo} alt="Extractor Logo" className="w-8 h-8 rounded shadow-sm object-cover" />
          </div>
          <div className="pt-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-zinc-100">Extractor</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Smart Identity Extraction System</p>
          </div>
        </div>
        <div className="flex items-center gap-4 pt-1">
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4" /> Secure & In-Memory Processing
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Offline Warning Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-400 font-medium text-sm overflow-hidden sticky top-[73px] z-10 print:hidden shadow-inner backdrop-blur-md"
          >
            <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-bold tracking-tight">Offline Mode:</span>
                <span className="text-xs opacity-90 leading-tight">
                  You have lost your network connection. Data extraction is temporarily disabled.
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                Waiting for link
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-6 mt-10 print:mt-2 print:max-w-full print:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
          
          {/* UPLOAD & HISTORY SECTION (Left side) */}
          <div className="lg:col-span-5 flex flex-col gap-6 print:hidden">
            <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-zinc-800/60 transition-colors">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2 dark:text-zinc-100">
                <FileText className="w-5 h-5 text-blue-500" />
                Upload Documents
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 font-medium">Select one or multiple passport images to process in a session.</p>
              
              {!preview ? (
                <div 
                  className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-black/50 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors group flex flex-col items-center justify-center text-center h-64 relative"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/jpeg, image/png, image/webp" 
                    onChange={handleFileChange}
                    multiple
                  />
                  <div className="flex flex-col items-center justify-center cursor-pointer p-6 w-full h-full" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-14 h-14 bg-white dark:bg-zinc-900 rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-7 h-7 text-blue-500 dark:text-blue-400" />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-zinc-200">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">JPEG, PNG, WEBP (Supports multiple files)</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Compact additive uploader for queuing more images */}
                  <div 
                    className="border border-dashed border-slate-300 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-black/30 hover:bg-slate-100 dark:hover:bg-zinc-800/40 transition-colors group flex items-center gap-3 p-3.5 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/jpeg, image/png, image/webp" 
                      onChange={handleFileChange}
                      multiple
                    />
                    <div className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-lg shadow-sm flex items-center justify-center shrink-0">
                      <UploadCloud className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200">Add more passport images...</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Select multiple images to append to the queue</p>
                    </div>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-black aspect-[4/3] flex items-center justify-center">
                    {preview ? (
                      <img src={preview} alt="Passport Preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="text-slate-400 text-xs">No preview available</div>
                    )}
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-xl" />
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={clearAll}
                      disabled={loading || isBatchProcessing}
                      className="flex-1 py-2.5 px-4 rounded-lg font-medium text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      Clear All
                    </button>
                    {!data && (
                      <div className="flex-[2] flex flex-col gap-2">
                        <button 
                          onClick={extractData}
                          disabled={loading || !isOnline || isBatchProcessing}
                          className={`w-full py-2.5 px-4 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 shadow-sm border border-transparent ${
                            !isOnline 
                              ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-70 cursor-pointer'
                          }`}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" /> Extracting...
                            </>
                          ) : !isOnline ? (
                            <>
                              <ZapOff className="w-5 h-5 text-red-500" /> Offline: Disabled
                            </>
                          ) : (
                            'Extract Active'
                          )}
                        </button>
                        {!isOnline && (
                          <span className="text-[10px] text-red-500 font-semibold text-center animate-pulse">
                            Internet connection required
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BATCH QUEUE SECTION */}
              {queue.length > 0 && (
                <div className="mt-6 border-t border-slate-200/50 dark:border-zinc-800/50 pt-5">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">
                        Session Queue ({queue.length})
                      </h3>
                      {queue.some(q => q.status === 'extracting') && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {queue.some(q => q.status === 'queued' || q.status === 'failed') && (
                        <button
                          onClick={processEntireQueue}
                          disabled={isBatchProcessing || !isOnline}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/10 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Extract All
                        </button>
                      )}

                      {queue.some(q => q.status === 'completed' && q.data) && (
                        <button
                          onClick={handleDownloadAllZIP}
                          disabled={isZipping}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/10 px-2.5 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          {isZipping ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Zipping...
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              Download All
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Batch Process Progress Bar */}
                  {(() => {
                    const totalItemsAvailable = queue.length;
                    const completedCount = queue.filter(q => q.status === 'completed').length;
                    const failedCount = queue.filter(q => q.status === 'failed').length;
                    const processedCount = completedCount + failedCount;
                    const progressPercentage = totalItemsAvailable > 0 ? Math.round((processedCount / totalItemsAvailable) * 100) : 0;

                    return (
                      <div className="bg-slate-50/80 dark:bg-black/40 border border-slate-200/50 dark:border-zinc-800/60 rounded-xl p-3 mb-4 transition-colors">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-600 dark:text-zinc-400">
                            {isBatchProcessing ? (
                              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Batch extracting...
                              </span>
                            ) : progressPercentage === 100 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> All processed!
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-zinc-500 font-medium">Batch Progress</span>
                            )}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                            {progressPercentage}% ({processedCount}/{totalItemsAvailable})
                          </span>
                        </div>
                        
                        <div className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                          <motion.div 
                            className={`h-full rounded-full ${
                              failedCount > 0 
                                ? 'bg-amber-500' 
                                : 'bg-gradient-to-r from-blue-500 to-emerald-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                          />
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Queued: {queue.filter(q => q.status === 'queued').length}
                          </span>
                          {queue.some(q => q.status === 'extracting') && (
                            <span className="flex items-center gap-1 text-blue-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              Extracting: {queue.filter(q => q.status === 'extracting').length}
                            </span>
                          )}
                          {completedCount > 0 && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Success: {completedCount}
                            </span>
                          )}
                          {failedCount > 0 && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Failed: {failedCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                    {queue.map((item, index) => {
                      const isActive = item.id === activeQueueId;
                      const isPending = item.status === 'queued';
                      const isExtracting = item.status === 'extracting';
                      const isCompleted = item.status === 'completed';
                      const isFailed = item.status === 'failed';
                      
                      return (
                        <div
                          key={item.id}
                          onClick={() => !isBatchProcessing && selectQueueItem(item)}
                          className={`group/item flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            isBatchProcessing ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                          } ${
                            isActive
                              ? 'bg-blue-50/50 dark:bg-zinc-800/40 border-blue-300 dark:border-zinc-700 ring-1 ring-blue-200 dark:ring-zinc-800/30'
                              : 'bg-white dark:bg-black border-slate-200/60 dark:border-zinc-800/60 hover:border-slate-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-[11px] font-bold font-mono text-slate-400 min-w-[16px] text-center shrink-0">
                              #{index + 1}
                            </span>
                            
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-center overflow-hidden shrink-0">
                              {item.preview ? (
                                <img src={item.preview} className="w-full h-full object-cover" alt="Thumb" />
                              ) : (
                                <FileText className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate pr-2">
                                {item.file.name}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
                                {item.file.size > 0 ? `${(item.file.size / (1024 * 1024)).toFixed(2)} MB` : 'History scan'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {isPending && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider bg-slate-50 dark:bg-zinc-900/50 px-2 py-0.5 rounded border border-slate-200/50 dark:border-zinc-800/50">
                                <Clock className="w-3 h-3" /> Queued
                              </span>
                            )}
                            {isExtracting && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/10 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/20">
                                <Loader2 className="w-3 h-3 animate-spin" /> Processing
                              </span>
                            )}
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/15 px-2 py-0.5 rounded border border-emerald-100/50 dark:border-emerald-900/30">
                                <Check className="w-3 h-3 text-emerald-500" /> Extracted
                              </span>
                            )}
                            {isFailed && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/30" title={item.error || 'Extraction Failed'}>
                                <AlertCircle className="w-3 h-3 text-red-500" /> Fail
                              </span>
                            )}

                            {(isPending || isFailed) && !isBatchProcessing && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  extractSingleItem(item.id);
                                }}
                                disabled={!isOnline}
                                className="p-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition cursor-pointer"
                                title="Extract Data"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              onClick={(e) => removeFromQueue(e, item.id)}
                              disabled={isExtracting || isBatchProcessing}
                              className="p-1 rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-rose-50 dark:hover:bg-zinc-800 transition disabled:opacity-30 cursor-pointer"
                              title="Remove from queue"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm flex items-start gap-3 border border-red-100"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* HISTORY SECTION */}
            <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/60 dark:border-zinc-800/60 min-h-[300px] flex flex-col transition-colors">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4">
                <div>
                  <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800 dark:text-zinc-100">
                    <History className="w-6 h-6 text-blue-500" /> Recent Extractions
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Access scanned passports.</p>
                </div>
                
                <div className="flex z-10 items-center justify-between xl:justify-end gap-3 w-full xl:w-auto">
                  <div className="relative flex-1 xl:w-[150px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-slate-50 dark:bg-black/50 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-zinc-100 transition-colors placeholder-slate-400 dark:placeholder-zinc-500"
                    />
                  </div>

                  {history.length > 0 && (
                    <button 
                      onClick={() => setHistory([])}
                      className="text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-semibold px-2 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shrink-0 border border-transparent whitespace-nowrap"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center opacity-50 flex-1 py-8">
                  <History className="w-10 h-10 text-slate-300 dark:text-zinc-600 mb-4" />
                  <p className="text-base font-medium text-slate-600 dark:text-zinc-300">No history yet</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center opacity-50 flex-1 py-8">
                  <Search className="w-10 h-10 text-slate-300 dark:text-zinc-600 mb-4" />
                  <p className="text-base font-medium text-slate-600 dark:text-zinc-300">No matching results</p>
                </div>
              ) : (
                <div className="overflow-y-auto pr-2 space-y-3 pb-2 scrollbar-thin max-h-[300px]">
                  {filteredHistory.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => loadFromHistory(item)}
                      className="cursor-pointer group relative flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50 bg-slate-50 dark:bg-black/50 hover:bg-blue-50 dark:hover:bg-zinc-800/50 hover:border-blue-200 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex flex-col mr-6 overflow-hidden">
                        <span className="font-bold text-[15px] leading-tight text-slate-800 dark:text-zinc-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate">
                          {item.data.givenName} {item.data.surname}
                        </span>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[11px] font-semibold px-2 py-0.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded">
                            {item.data.passportNumber || "Unknown ID"}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded truncate max-w-[150px]">
                            {getGeneratedEmail(item.data)}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => confirmDelete(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 absolute right-4 p-2 text-slate-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 shrink-0"
                        title="Delete from history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RESULTS SECTION (Right side on large screens) */}
          <div className="lg:col-span-7 print:w-full print:col-span-12">
            {data ? (
              <div id="printable-results-card" className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-zinc-800/60 transition-all sticky top-6 print:relative print:top-0 print:border-none print:shadow-none print:bg-transparent print:p-0 print:m-0 w-full">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* PRINT-ONLY PROFESSIONAL HEADER/LETTERHEAD */}
                  <div className="hidden print:block mb-8 border-b-2 border-[#0C8493] pb-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <h1 className="text-2xl font-black text-[#0C8493]">PASSPORT DATA EXTRACTION REPORT</h1>
                        <p className="text-xs text-[#FF8006] font-bold mt-1 uppercase tracking-wider">Smart Automated Identity Processor</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 font-medium">Date Printed: {new Date().toLocaleDateString('en-GB')}</p>
                        <p className="text-xs text-slate-500 font-medium">Status: <span className="text-emerald-600 font-semibold">Verified Extract</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 print:hidden">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        Passport Data
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
                      <button 
                        onClick={handleCopyAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs sm:text-sm font-medium rounded-lg transition-colors border border-transparent dark:border-zinc-700 cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? "Copied" : "Copy All"}
                      </button>
                      <button 
                        onClick={handleDownloadText}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs sm:text-sm font-medium rounded-lg transition-colors border border-blue-200 dark:border-blue-800/50 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download TXT
                      </button>
                      <button 
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF8006] hover:bg-[#FF8006]/90 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95 duration-100 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Download PDF Summary
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0C8493] hover:bg-[#0C8493]/90 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95 duration-100 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Report
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                    <DataField label="EMAIL" value={getGeneratedEmail(data)} highlight onValueChange={(val) => updateDataField('email', val)} />
                    <DataField label="DOB" value={data.dob} onValueChange={(val) => updateDataField('dob', val)} />
                    <DataField label="Surname" value={data.surname} onValueChange={(val) => updateDataField('surname', val)} />
                    <DataField label="Given Name" value={data.givenName} onValueChange={(val) => updateDataField('givenName', val)} />
                    <DataField label="Town/City of birth/BIRTH PLACE" value={data.birthPlace} onValueChange={(val) => updateDataField('birthPlace', val)} />
                    <DataField label="National Id No/BIRTH CERTIFICATE NO" value={data.nidOrBirthCertNumber} onValueChange={(val) => updateDataField('nidOrBirthCertNumber', val)} />
                    <DataField label="Passport Number" value={data.passportNumber} highlight onValueChange={(val) => updateDataField('passportNumber', val)} />
                    <DataField label="Place of Issue" value={data.placeOfIssue || "DHAKA"} onValueChange={(val) => updateDataField('placeOfIssue', val)} />
                    <DataField label="Date of Issue" value={data.issueDate} onValueChange={(val) => updateDataField('issueDate', val)} />
                    <DataField label="Date of Expiry" value={data.expiryDate} onValueChange={(val) => updateDataField('expiryDate', val)} />
                    
                    <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-zinc-800/50"></div>
                    
                    <div className="col-span-2">
                       <DataField label="PRESENT ADDRESS" value={presentAddr} onValueChange={(val) => updateDataField('presentAddress', val)} />
                    </div>
                    <div className="col-span-2">
                       <DataField label="PERMANENT ADDRESS" value={data.permanentAddress} onValueChange={(val) => updateDataField('permanentAddress', val)} />
                    </div>

                    <div className="col-span-2 pt-3 border-t border-slate-100 dark:border-zinc-800/50 mt-2">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">Additional Information</h4>
                    </div>
                    
                    <DataField label="Father's Name" value={data.fatherName} onValueChange={(val) => updateDataField('fatherName', val)} />
                    <DataField label="Mother's Name" value={data.motherName} onValueChange={(val) => updateDataField('motherName', val)} />
                    <DataField label="Spouse's Name" value={data.spouseName || "N/A"} onValueChange={(val) => updateDataField('spouseName', val)} />
                    <DataField label="Mobile Number" value={data.mobileNumber ? data.mobileNumber.replace(/^\+88\s*/, '') : ''} onValueChange={(val) => updateDataField('mobileNumber', val)} />
                    <DataField label="Town/City of birth/BIRTH PLACE" value={getDistrictFromAddress(data.permanentAddress, data)} onValueChange={(val) => updateDataField('birthPlaceDistrict', val)} />

                    <div className="col-span-2 pt-3 border-t border-slate-100 dark:border-zinc-800/50 mt-2">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">Business & Profession Details</h4>
                    </div>
                    
                    <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {/* Proprietorship */}
                      <div className="space-y-3 bg-slate-50/50 dark:bg-black/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                        <h5 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-800/50 pb-2 mb-1">Business (Proprietorship)</h5>
                        <DataField label="Business Name" value={getProprietorBusinessName(data)} onValueChange={(val) => updateDataField('proprietorBusinessName', val)} />
                        <DataField label="Designation" value="Proprietor" />
                        <div className="pt-2">
                          <DataField label="Business Address (Present)" value={getBusinessAddressDhaka(presentAddr, data)} onValueChange={(val) => updateDataField('businessAddressDhaka', val)} />
                        </div>
                        <div className="pt-2">
                          <DataField label="Business Address (Permanent)" value={getBusinessAddressLocal(data.permanentAddress, data)} onValueChange={(val) => updateDataField('businessAddressLocal', val)} />
                        </div>
                      </div>

                      {/* Private Service / Job */}
                      <div className="space-y-3 bg-slate-50/50 dark:bg-black/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                        <h5 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-800/50 pb-2 mb-1">Private Service / Job</h5>
                        <DataField label="Company Name" value={getJobCompanyName(data)} onValueChange={(val) => updateDataField('jobCompanyName', val)} />
                        <DataField label="Designation" value={getJobRole(data)} onValueChange={(val) => updateDataField('jobRole', val)} />
                        <div className="pt-2">
                          <DataField label="Office Address (Present)" value={getOfficeAddressDhaka(presentAddr, data)} onValueChange={(val) => updateDataField('officeAddressDhaka', val)} />
                        </div>
                        <div className="pt-2">
                          <DataField label="Office Address (Permanent)" value={getBusinessAddressLocal(data.permanentAddress, data)} onValueChange={(val) => updateDataField('businessAddressLocal', val)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 border-dashed rounded-2xl h-[500px] flex flex-col items-center justify-center text-center p-8 sticky top-6">
                <FileText className="w-16 h-16 text-slate-200 dark:text-zinc-700 mb-4" />
                <p className="text-lg font-medium text-slate-500 dark:text-zinc-400">No Data Extracted Yet</p>
                <p className="text-sm text-slate-400 dark:text-zinc-500 mt-2 max-w-sm">Upload a passport image on the left and click "Extract Data" to see the extracted fields here.</p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50"
              onClick={cancelDelete}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-2">Delete History Item?</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Are you sure you want to delete this extracted passport from your history? This action cannot be undone.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-900/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
