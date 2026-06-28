import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2, ShieldCheck, 
  History, Trash2, ZapOff, Search, Sun, Moon, Copy, Download, Check, 
  AlertTriangle, Printer, Play, X, Clock, Settings, Key, Eye, EyeOff, Heart,
  MessageCircle
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
import { HistorySidebar } from './components/HistorySidebar';
import { PassportDataTab } from './components/PassportDataTab';
import { UndertakingFormTab } from './components/UndertakingFormTab';
import { UndertakingOptions } from './components/UndertakingOptions';
import { SessionQueue } from './components/SessionQueue';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { UploadSection } from './components/UploadSection';
import { ResultsSection } from './components/ResultsSection';
import { GlobalProgress } from './components/GlobalProgress';
import { BackupModal } from './components/BackupModal';
import { RestoreModal } from './components/RestoreModal';

// Utilities
import { generateDataText } from './utils/addressUtils';
import { generatePDF, getPDFDocument, generateUndertakingPDF } from './utils/pdfGenerator';

import { useUndertakingState } from './hooks/useUndertakingState';
import { useSessionQueue } from './hooks/useSessionQueue';
import { useAppSettings } from './hooks/useAppSettings';
import { usePassportHistory } from './hooks/usePassportHistory';
import { useExporterHelpers } from './hooks/useExporterHelpers';
import { useAddressGeneration } from './hooks/useAddressGeneration';
import { useSavedOptions } from './hooks/useSavedOptions';
import { useQueueHandlers } from './hooks/useQueueHandlers';

import { encryptData, decryptData } from './utils/crypto';

// App main component

export default function App() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; mobileNumber: string } | null>(() => {
    try {
      const saved = localStorage.getItem('passport_extractor_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [limitStatus, setLimitStatus] = useState<{ count: number; remaining: number; limit: number } | null>(null);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hoverColor, setHoverColor] = useState('#2563eb');

  const handleButtonMouseEnter = () => {
    const colors = [
      '#2563eb', // blue
      '#16a34a', // green
      '#db2777', // pink
      '#9333ea', // purple
      '#ea580c', // orange
      '#0d9488', // teal
      '#4f46e5', // indigo
      '#e11d48', // rose
      '#0891b2', // cyan
      '#ca8a04', // amber/gold
    ];
    let newColor = hoverColor;
    while (newColor === hoverColor) {
      newColor = colors[Math.floor(Math.random() * colors.length)];
    }
    setHoverColor(newColor);
  };

  // Load and update daily extraction limit status
  const loadLimitStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/limit-status/${userId}`);
      const result = await res.json();
      if (result.success) {
        setLimitStatus({ count: result.count, remaining: result.remaining, limit: result.limit });
      }
    } catch (err) {
      console.error('Failed to load limit status', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdentifier, password: loginPassword })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        localStorage.setItem('passport_extractor_user', JSON.stringify(result.user));
        setCurrentUser(result.user);
        setToast({ message: `স্বাগতম ${result.user.name}! লগইন সফল হয়েছে।`, type: 'success' });
      } else {
        setLoginError(result.error || 'লগইন ব্যর্থ হয়েছে। সঠিক তথ্য প্রদান করুন।');
      }
    } catch (err) {
      setLoginError('সার্ভারে যোগাযোগ করা যাচ্ছে না। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('passport_extractor_user');
    setCurrentUser(null);
    setLimitStatus(null);
    setToast({ message: 'লগআউট করা হয়েছে।', type: 'info' });
  };

  // ১. মাউসের রাইট ক্লিক নিষ্ক্রিয় করা এবং ডেভেলপার টুলস প্রতিরোধ করা (Disable copying & inspection)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(() => {
    return localStorage.getItem('passport_active_preview') || null;
  });
  const [data, setData] = useState<PassportData | null>(() => {
    try {
      const saved = localStorage.getItem('passport_active_data');
      if (saved && saved !== 'undefined' && saved.trim() !== '') {
        return decryptData(saved);
      }
    } catch (e) {
      console.error("Failed to load active data", e);
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      localStorage.setItem('passport_active_data', encryptData(data));
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

  const {
    history, setHistory,
    addToHistory,
    deleteHistoryItem,
    clearHistory,
    searchTerm, setSearchTerm,
    itemToDelete, setItemToDelete
  } = usePassportHistory();



  const [resultsTab, setResultsTab] = useState<'profile' | 'undertaking' | 'passport-pdf'>(() => {
    const saved = localStorage.getItem('passport_active_results_tab');
    if (saved === 'undertaking') return 'undertaking';
    if (saved === 'passport-pdf') return 'passport-pdf';
    return 'profile';
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

  const {
    savedHospitals,
    savedDepartments,
    handleAddHospitalSuggestion,
    handleAddDepartmentSuggestion
  } = useSavedOptions();

  // toast state is declared at the top of App()
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);

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

  const {
    queue, setQueue,
    activeQueueId, setActiveQueueId,
    isBatchProcessing,
    isZipping,
    loading, setLoading,
    extractSingleItem,
    processEntireQueue,
    cancelExtraction,
    handleDownloadAllZIP
  } = useSessionQueue({
    isOnline,
    userApiKey,
    addToHistory,
    onSelectData: setData,
    onError: setError
  });

  const { isGeneratingAddresses, handleGenerateAddresses } = useAddressGeneration({
    data, setData, userApiKey, activeQueueId, setQueue, setHistory, setToast
  });

  const {
    handleDragOver,
    handleDrop,
    handleFileChange,
    selectQueueItem,
    removeFromQueue,
    loadFromHistory,
    clearAll
  } = useQueueHandlers({
    queue, setQueue, activeQueueId, setActiveQueueId,
    setFile, setPreview, setData, setError, fileInputRef
  });

  useEffect(() => {
    if (currentUser) {
      loadLimitStatus(currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && !loading) {
      loadLimitStatus(currentUser.id);
    }
  }, [loading]);

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

  const confirmDelete = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setItemToDelete(id); };
  const executeDelete = (e: React.MouseEvent) => { 
    e.stopPropagation(); 
    if (itemToDelete === 'ALL') {
      clearHistory();
    } else if (itemToDelete) {
      deleteHistoryItem(itemToDelete); 
    }
    setItemToDelete(null); 
  };
  const cancelDelete = (e: React.MouseEvent) => { e.stopPropagation(); setItemToDelete(null); };

  const extractData = async () => {
    if (!isOnline) {
      setError("Cannot extract data while offline.");
      return;
    }
    if (!activeQueueId) return;
    await extractSingleItem(activeQueueId);
  };

  const {
    isCopied,
    handleCopyAll,
    handleDownloadText,
    handleDownloadPDF,
    handleDownloadUndertaking
  } = useExporterHelpers({ data, undertakingData, setToast });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-50 pb-12 selection:bg-blue-100/50 dark:selection:bg-blue-900/50 transition-colors relative select-none">
      {/* Global Progress Bar */}
      <GlobalProgress loading={loading} />

      <div className={`transition-all duration-500 ${!currentUser ? 'blur-2xl opacity-30 select-none pointer-events-none' : ''}`}>
        <Header
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          currentUser={currentUser}
          onLogout={handleLogout}
          limitStatus={limitStatus}
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
              cancelExtraction={cancelExtraction}
              error={error}
              history={history}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setHistory={setHistory}
              loadFromHistory={loadFromHistory}
              confirmDelete={confirmDelete}
              onOpenBackup={() => setIsBackupOpen(true)}
              onOpenRestore={() => setIsRestoreOpen(true)}
            />

            {/* RESULTS SECTION (Right side on large screens) */}
            <ResultsSection
              data={data}
              activeItem={queue.find(q => q.id === activeQueueId) || null}
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

      {/* Footer Section */}
      <footer className="w-full border-t border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 mt-12 py-6 print:hidden">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-zinc-400">
            Built with <Heart className="w-4 h-4 text-red-500 fill-current" /> by <span className="text-slate-700 dark:text-zinc-200 font-bold tracking-wide ml-0.5">MOHAMMAD NUR HASNAT</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} Passport Extractor. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Backup & Restore Modals */}
      <AnimatePresence>
        {isBackupOpen && (
          <BackupModal
            isOpen={isBackupOpen}
            onClose={() => setIsBackupOpen(false)}
            history={history}
            setToast={setToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRestoreOpen && (
          <RestoreModal
            isOpen={isRestoreOpen}
            onClose={() => setIsRestoreOpen(false)}
            history={history}
            setHistory={setHistory}
            setToast={setToast}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        itemToDelete={itemToDelete}
        cancelDelete={cancelDelete}
        executeDelete={executeDelete}
      />

      {/* 🔐 LOGIN POPUP WINDOW (Centered Overlay matching Backup Manager's elegant style) */}
      <AnimatePresence>
        {!currentUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-white/95 dark:bg-zinc-950/95 shadow-[0_32px_64px_rgba(30,41,59,0.25)] border border-slate-200/80 dark:border-zinc-800/80 flex flex-col overflow-hidden w-full max-w-sm rounded-[5px] text-black dark:text-white"
            >
              {/* Glossy top-light reflection lines */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent pointer-events-none" />
              
              {/* Colorful Gradient Blur Circles for a modern vibrant touch */}
              <div className="absolute -top-16 -left-16 w-36 h-36 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-gradient-to-tr from-indigo-500/10 to-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header */}
              <div className="p-3 border-b border-slate-100 dark:border-zinc-900/80 flex items-center justify-between bg-white/60 dark:bg-zinc-950/60 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 rounded-[5px] text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <h3 className="font-extrabold text-xs tracking-tight text-black dark:text-white">
                    System Security Access
                  </h3>
                </div>
              </div>

              {/* Title and Subtitle */}
              <div className="px-4 pt-4 text-center relative z-10">
                <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-50">
                  Login Verification
                </h2>
                <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                  Enter your registered Email/Mobile and Password
                </p>
              </div>

              {loginError && (
                <div className="mx-4 mt-3 p-2.5 bg-rose-500/5 border border-rose-500/20 rounded-[5px] flex items-start gap-2 text-[11px] font-bold text-rose-600 dark:text-rose-400 relative z-10">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="p-4 space-y-3.5 relative z-10">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
                    Email or Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. admin@example.com or 017xxxxxxxx"
                    className="block w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-[5px] text-xs bg-white dark:bg-black/40 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500 text-black dark:text-white font-medium transition-colors placeholder-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
                    Security Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-[5px] text-xs bg-white dark:bg-black/40 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500 text-black dark:text-white font-medium transition-colors placeholder-zinc-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  onMouseEnter={handleButtonMouseEnter}
                  className="relative overflow-hidden group w-full py-2.5 rounded-[5px] shadow-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2 border"
                  style={{
                    borderColor: hoverColor + '50',
                    backgroundColor: hoverColor + '10'
                  }}
                >
                  <span 
                    className="absolute inset-0 w-full h-full -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0" 
                    style={{ backgroundColor: hoverColor }}
                  />
                  <span className="relative z-10 transition-colors duration-300 flex items-center gap-1.5 text-black dark:text-zinc-200 group-hover:text-white dark:group-hover:text-white font-bold text-xs">
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5" />
                        <span>Login</span>
                      </>
                    )}
                  </span>
                </button>

                {/* WhatsApp Support Section */}
                <div className="mt-4 text-center flex flex-col items-center justify-center gap-2 border-t border-slate-100 dark:border-zinc-900/65 pt-3">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 leading-normal px-1">
                    Click on WhatsApp icon to create Username & Passcode
                  </span>
                  <a
                    href="https://wa.me/8801861186863"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-[5px] shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer hover:shadow-emerald-500/25"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-emerald-600 dark:text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span>WhatsApp Support</span>
                  </a>
                </div>
              </form>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-slate-100 dark:border-zinc-900/80 bg-white/60 dark:bg-zinc-950/60 relative z-10 flex items-center justify-between text-[9px] sm:text-[10px] text-black dark:text-zinc-400 font-bold">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 animate-pulse" />
                  <span>SECURE PORTAL SYSTEM</span>
                </div>
                <div>
                  <span>AUTHORIZED ACCESS</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

