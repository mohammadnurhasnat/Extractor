import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2, ShieldCheck, 
  History, Trash2, ZapOff, Search, Sun, Moon, Copy, Download, Check, 
  AlertTriangle, Printer, Play, X, Clock, Settings, Key, Eye, EyeOff, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';

// Types
import { PassportData, HistoryItem, QueueItem, UndertakingFormData } from './types';

// Components
import { Header } from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';
import { ToastNotification } from './components/ToastNotification';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { HistorySidebar } from './components/HistorySidebar';
import { PassportDataTab } from './components/PassportDataTab';
import { UndertakingFormTab } from './components/UndertakingFormTab';
import { UndertakingOptions } from './components/UndertakingOptions';
import { SessionQueue } from './components/SessionQueue';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { UploadSection } from './components/UploadSection';
import { ResultsSection } from './components/ResultsSection';

// Utilities
import { generateDataText } from './utils/addressUtils';
import { generatePDF, getPDFDocument, generateUndertakingPDF } from './utils/pdfGenerator';

import { useUndertakingState } from './hooks/useUndertakingState';
import { useSessionQueue } from './hooks/useSessionQueue';
import { useAppSettings } from './hooks/useAppSettings';
import { usePassportHistory } from './hooks/usePassportHistory';
import { useSupabase } from './hooks/useSupabase';
import { useAuth } from './lib/AuthContext';

// App main component

export default function App() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(() => {
    return localStorage.getItem('passport_active_preview') || null;
  });
  const [data, setData] = useState<PassportData | null>(() => {
    try {
      const saved = localStorage.getItem('passport_active_data');
      if (saved && saved !== 'undefined' && saved.trim() !== '') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load active data", e);
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      localStorage.setItem('passport_active_data', JSON.stringify(data));
    } else {
      localStorage.removeItem('passport_active_data');
    }
  }, [data]);

  useEffect(() => {
    if (preview) {
      localStorage.setItem('passport_active_preview', preview);
    } else {
      localStorage.removeItem('passport_active_preview');
    }
  }, [preview]);
  
  const {
    isDarkMode, setIsDarkMode,
    isOnline,
    userApiKey, setUserApiKey,
    showApiSettings, setShowApiSettings,
    tempApiKey, setTempApiKey,
    showApiKeyChars, setShowApiKeyChars
  } = useAppSettings();

  const supabase = useSupabase();
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncStatusText, setCloudSyncStatusText] = useState('');

  const {
    history, setHistory,
    addToHistory,
    deleteHistoryItem,
    clearHistory,
    searchTerm, setSearchTerm,
    itemToDelete, setItemToDelete
  } = usePassportHistory({
    onItemAdded: (item) => {
      if (supabase.isConfigured) {
        supabase.upsertToCloud(item);
      }
    },
    onItemDeleted: (id) => {
      if (supabase.isConfigured) {
        supabase.deleteFromCloud(id);
      }
    }
  });

  const handleFetchFromCloud = async () => {
    if (!supabase.isConfigured) return;
    setIsSyncingCloud(true);
    setCloudSyncStatusText('ক্লাউড থেকে ডেটা নামানো হচ্ছে...');
    try {
      const cloudItems = await supabase.fetchFromCloud();
      if (cloudItems) {
        if (cloudItems.length === 0) {
          setCloudSyncStatusText('ক্লাউডে কোনো সেভ করা পাসপোর্ট পাওয়া যায়নি!');
          setTimeout(() => setCloudSyncStatusText(''), 4000);
          return;
        }
        
        // Merge strategy: prevent duplicate IDs
        const localMap = new Map<string, typeof history[0]>(history.map(item => [item.id, item]));
        cloudItems.forEach(item => {
          localMap.set(item.id, item);
        });
        const mergedHistory = Array.from(localMap.values()).sort((a, b) => b.timestamp - a.timestamp);
        
        setHistory(mergedHistory);
        setCloudSyncStatusText(`ক্লাউড থেকে ${cloudItems.length} টি পাসপোর্ট রেকর্ড সিনক্রোনাইজ করা হয়েছে!`);
        setTimeout(() => setCloudSyncStatusText(''), 5000);
      } else {
        setCloudSyncStatusText('ক্লাউড থেকে তথ্য রিট্রিভ করা সম্ভব হয়নি। Credentials চেক করুন বা টেবিল তৈরি করুন।');
        setTimeout(() => setCloudSyncStatusText(''), 5000);
      }
    } catch (e: any) {
      setCloudSyncStatusText(`ত্রুটি: ${e.message || 'Error occurred'}`);
      setTimeout(() => setCloudSyncStatusText(''), 5500);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleSyncToCloud = async () => {
    if (!supabase.isConfigured) return;
    if (history.length === 0) {
      setCloudSyncStatusText('আপলোড করার জন্য কোনো লোকাল হিস্টরি নেই!');
      setTimeout(() => setCloudSyncStatusText(''), 4000);
      return;
    }
    setIsSyncingCloud(true);
    try {
      const result = await supabase.syncLocalHistoryToCloud(history, (msg) => {
        setCloudSyncStatusText(msg);
      });
      setCloudSyncStatusText(`সিনক্রোনাইজেশন সফল! সম্পূর্ণ হয়েছে: ${result.successCount}, ব্যর্থ: ${result.failCount}`);
      setTimeout(() => setCloudSyncStatusText(''), 6000);
    } catch (e: any) {
      setCloudSyncStatusText(`ত্রুটি: ${e.message || 'Error occurred'}`);
      setTimeout(() => setCloudSyncStatusText(''), 5000);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const [resultsTab, setResultsTab] = useState<'profile' | 'undertaking'>(() => {
    return (localStorage.getItem('passport_active_results_tab') as 'profile' | 'undertaking') || 'profile';
  });

  const {
    utPurpose, setUtPurpose,
    utFromDate, setUtFromDate,
    utToDate, setUtToDate,
    utReturnCountry, setUtReturnCountry,
    utHospitalName, setUtHospitalName,
    utDoctorName, setUtDoctorName,
    utEmbassyCity, setUtEmbassyCity,
    utEmbassyDate, setUtEmbassyDate,
    isUndertakingEditable, setIsUndertakingEditable,
    undertakingData, setUndertakingData
  } = useUndertakingState(data);

  const [savedHospitals, setSavedHospitals] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('saved_hospital_names');
      if (saved && saved !== 'undefined' && saved.trim() !== '') return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      'Apollo Hospital, Chennai',
      'Fortis Hospital, Kolkata',
      'Medanta Hospital, Gurgaon',
      'Narayana Health, Bangalore',
      'Christian Medical College, Vellore',
      'Tata Memorial Hospital, Mumbai'
    ];
  });

  const [savedDepartments, setSavedDepartments] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('saved_department_names');
      if (saved && saved !== 'undefined' && saved.trim() !== '') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((d: string) => d !== 'Dr. K. S. Murthy');
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [
      'Cardiology',
      'Neurology',
      'Oncology',
      'Orthopedics',
      'Nephrology',
      'Gastroenterology',
      'Urology',
      'Internal Medicine',
      'General Surgery',
      'Pediatrics',
      'Gynecology'
    ];
  });

  const handleAddHospitalSuggestion = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !savedHospitals.some(h => h.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...savedHospitals, trimmed];
      setSavedHospitals(updated);
      localStorage.setItem('saved_hospital_names', JSON.stringify(updated));
    }
  };

  const handleAddDepartmentSuggestion = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !savedDepartments.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...savedDepartments, trimmed];
      setSavedDepartments(updated);
      localStorage.setItem('saved_department_names', JSON.stringify(updated));
    }
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    localStorage.setItem('passport_active_results_tab', resultsTab);
  }, [resultsTab]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const isUndertakingConfigured = !!(utPurpose || utFromDate || utToDate);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingAddresses, setIsGeneratingAddresses] = useState(false);

  const handleGenerateAddresses = async () => {
    if (!data || !data.permanentAddress) return;
    setIsGeneratingAddresses(true);
    setToast({ message: "Generating realistic addresses with Gemini...", type: "info" });
    try {
      const response = await fetch('/api/generate-addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': userApiKey || '',
        },
        body: JSON.stringify({ permanentAddress: data.permanentAddress }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate addresses');
      }
      const addresses = await response.json();
      
      const updated = {
        ...data,
        presentAddress: addresses.presentAddress || '',
        businessAddressDhaka: addresses.businessAddressDhaka || '',
        businessAddressLocal: addresses.businessAddressLocal || '',
        officeAddressDhaka: addresses.officeAddressDhaka || '',
        officeAddressLocal: addresses.officeAddressLocal || '',
      };
      
      setData(updated);
      if (activeQueueId) {
        setQueue(prev => prev.map(q => q.id === activeQueueId ? { ...q, data: updated } : q));
      }
      setHistory(prev => prev.map(item => {
        if (item.data.passportNumber === data.passportNumber) return { ...item, data: updated };
        return item;
      }));
      setToast({ message: "Addresses generated successfully with Gemini!", type: "success" });
    } catch (e) {
      console.error(e);
      setToast({ message: "Error auto-generating addresses.", type: "error" });
    } finally {
      setIsGeneratingAddresses(false);
    }
  };

  const {
    queue, setQueue,
    activeQueueId, setActiveQueueId,
    isBatchProcessing,
    isZipping,
    loading, setLoading,
    extractSingleItem,
    processEntireQueue,
    handleDownloadAllZIP
  } = useSessionQueue({
    isOnline,
    userApiKey,
    addToHistory,
    onSelectData: setData,
    onError: setError
  });

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
      const updated = [...newQueueItems, ...prev];
      if (prev.length === 0 && newQueueItems.length > 0) {
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
  };

  const removeFromQueue = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setQueue(prev => {
      const updated = prev.filter(q => q.id !== itemId);
      if (activeQueueId === itemId) {
        if (updated.length > 0) {
          setTimeout(() => selectQueueItem(updated[0]), 0);
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

  const loadFromHistory = (item: HistoryItem) => {
    setData(item.data);
    setPreview(null);
    setFile(null);
    setError(null);
    const id = 'hist_' + Date.now();
    const mockFileObj = new File([], `Scanned_${item.data.passportNumber || 'Passport'}.jpg`, { type: 'image/jpeg' });
    const mockQueueItem: QueueItem = {
      id, file: mockFileObj, preview: '', loading: false, error: null, status: 'completed', data: item.data
    };
    setQueue([mockQueueItem]);
    setActiveQueueId(id);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateDataField = (field: keyof PassportData, newValue: string) => {
    if (!data) return;
    const updated = { ...data, [field]: newValue };
    setData(updated);
    if (activeQueueId) {
      setQueue(prev => prev.map(q => q.id === activeQueueId ? { ...q, data: updated } : q));
    }
    setHistory(prev => prev.map(item => {
      if (item.data.passportNumber === data.passportNumber) return { ...item, data: updated };
      return item;
    }));
  };

  const handleUpdateUndertakingField = (field: keyof UndertakingFormData, value: string) => {
    if (undertakingData) {
      setUndertakingData(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleDownloadUndertaking = async () => {
    if (!undertakingData) {
      setToast({ message: "No data available.", type: "error" });
      return;
    }
    setToast({ message: "Generating PDF...", type: "info" });
    await new Promise(resolve => setTimeout(resolve, 850));
    try {
      generateUndertakingPDF(undertakingData);
      setToast({ message: "Success!", type: "success" });
    } catch (err: any) {
      setToast({ message: "Error generating the document.", type: "error" });
    }
  };

  const confirmDelete = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setItemToDelete(id); };
  const executeDelete = (e: React.MouseEvent) => { e.stopPropagation(); if (itemToDelete) deleteHistoryItem(itemToDelete); setItemToDelete(null); };
  const cancelDelete = (e: React.MouseEvent) => { e.stopPropagation(); setItemToDelete(null); };

  const clearAll = () => {
    setFile(null); setPreview(null); setData(null); setError(null); setQueue([]); setActiveQueueId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const extractData = async () => {
    if (!isOnline) {
      setError("Cannot extract data while offline.");
      return;
    }
    if (!activeQueueId) return;
    await extractSingleItem(activeQueueId);
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-50 pb-12 selection:bg-blue-100 dark:selection:bg-blue-900/50 transition-colors relative">
      {/* Global Progress Bar */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 h-1 bg-blue-100 dark:bg-blue-900/30 z-[100] overflow-hidden"
          >
            <motion.div
              className="absolute top-0 bottom-0 bg-blue-600 dark:bg-blue-500"
              initial={{ left: '-10%', width: '30%' }}
              animate={{ left: '110%' }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`transition-all duration-500 ${!user ? 'blur-md pointer-events-none' : ''}`}>
        <Header
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          userApiKey={userApiKey}
          onOpenApiSettings={() => {
            setTempApiKey(userApiKey);
            setShowApiSettings(true);
          }}
        />

        <OfflineBanner isOnline={isOnline} />

        <main className="w-full px-4 mt-10 print:mt-2 print:w-full print:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
            
            {/* UPLOAD & HISTORY SECTION (Left side) */}
            <UploadSection
              preview={preview}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              utPurpose={utPurpose}
              setUtPurpose={setUtPurpose}
              utHospitalName={utHospitalName}
              setUtHospitalName={setUtHospitalName}
              utDoctorName={utDoctorName}
              setUtDoctorName={setUtDoctorName}
              utEmbassyCity={utEmbassyCity}
              setUtEmbassyCity={setUtEmbassyCity}
              utEmbassyDate={utEmbassyDate}
              setUtEmbassyDate={setUtEmbassyDate}
              utFromDate={utFromDate}
              setUtFromDate={setUtFromDate}
              utToDate={utToDate}
              setUtToDate={setUtToDate}
              utReturnCountry={utReturnCountry}
              setUtReturnCountry={setUtReturnCountry}
              isUndertakingConfigured={isUndertakingConfigured}
              undertakingData={undertakingData}
              setUndertakingData={setUndertakingData}
              savedHospitals={savedHospitals}
              handleAddHospitalSuggestion={handleAddHospitalSuggestion}
              savedDepartments={savedDepartments}
              handleAddDepartmentSuggestion={handleAddDepartmentSuggestion}
              clearAll={clearAll}
              extractData={extractData}
              data={data}
              loading={loading}
              isOnline={isOnline}
              isBatchProcessing={isBatchProcessing}
              queue={queue}
              activeQueueId={activeQueueId}
              isZipping={isZipping}
              processEntireQueue={processEntireQueue}
              handleDownloadAllZIP={handleDownloadAllZIP}
              selectQueueItem={selectQueueItem}
              removeFromQueue={removeFromQueue}
              extractSingleItem={extractSingleItem}
              error={error}
              history={history}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setHistory={setHistory}
              loadFromHistory={loadFromHistory}
              confirmDelete={confirmDelete}
              isSupabaseConfigured={supabase.isConfigured}
              onFetchHistoryFromCloud={handleFetchFromCloud}
              onSyncHistoryToCloud={handleSyncToCloud}
              isSyncingCloud={isSyncingCloud}
              cloudSyncStatusText={cloudSyncStatusText}
            />

            {/* RESULTS SECTION (Right side on large screens) */}
            <ResultsSection
              data={data}
              resultsTab={resultsTab}
              setResultsTab={setResultsTab}
              isUndertakingConfigured={isUndertakingConfigured}
              undertakingData={undertakingData}
              updateDataField={updateDataField}
              handleCopyAll={handleCopyAll}
              handleDownloadText={handleDownloadText}
              handleDownloadPDF={handleDownloadPDF}
              isCopied={isCopied}
              isUndertakingEditable={isUndertakingEditable}
              setIsUndertakingEditable={setIsUndertakingEditable}
              handleUpdateUndertakingField={handleUpdateUndertakingField}
              handleDownloadUndertaking={handleDownloadUndertaking}
              isGeneratingAddresses={isGeneratingAddresses}
              onGenerateAddresses={handleGenerateAddresses}
            />
          </div>
        </main>
      </div>

      {!user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md p-8 text-center"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 mb-2">Welcome to Extractor</h2>
            <p className="text-slate-500 dark:text-zinc-400 mb-8 text-sm">
              Please sign in securely with your Google account to access your passport data processing tools and saved history.
            </p>

            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 rounded-xl text-slate-700 dark:text-zinc-200 font-medium shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure, simplified authentication</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-2 right-2 z-40">
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-zinc-800/50 shadow-sm flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400 transition-all duration-300 animate-glow-black dark:animate-glow-white">
          Built with <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /> by <span className="text-slate-700 dark:text-zinc-200 font-semibold tracking-wide ml-0.5">MOHAMMAD NUR HASNAT</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        itemToDelete={itemToDelete}
        cancelDelete={cancelDelete}
        executeDelete={executeDelete}
      />

      {/* Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* Gemini API Key Settings Modal */}
      <ApiSettingsModal
        isOpen={showApiSettings}
        userApiKey={userApiKey}
        onClose={() => setShowApiSettings(false)}
        onSave={(key) => {
          localStorage.setItem('gemini_api_key', key);
          setUserApiKey(key);
        }}
        onClear={() => {
          localStorage.removeItem('gemini_api_key');
          setUserApiKey('');
        }}
        supabaseUrl={supabase.supabaseUrl}
        supabaseAnonKey={supabase.supabaseAnonKey}
        onSaveSupabase={supabase.saveConfig}
        onClearSupabase={supabase.clearConfig}
        testConnection={supabase.testConnection}
        isTestLoading={supabase.isTestLoading}
        testResult={supabase.testResult}
        clearTestResult={() => supabase.setTestResult(null)}
      />
    </div>
  );
}

