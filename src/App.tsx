import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2, ShieldCheck, 
  History, Trash2, ZapOff, Search, Sun, Moon, Copy, Download, Check, 
  AlertTriangle, Printer, Play, X, Clock, Settings, Key, Eye, EyeOff, Heart,
  MessageCircle, LogOut, Plus, Users
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
import { LoginModal } from './components/LoginModal';
import { LoginGreeting } from './components/LoginGreeting';
import { BackgroundElements } from './components/layout/BackgroundElements';
import { AppModals } from './components/AppModals';

// Utilities
import { generateDataText, getKolkataHotelForPassport, getDelhiHotelForPassport, getKolkataBusinessForPassport, formatIndianVisaAddress } from './utils/addressUtils';
import { generatePDF, getPDFDocument, generateUndertakingPDF } from './utils/pdfGenerator';
import { logoutGoogle } from './lib/firebase';

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
  const [showLoginGreeting, setShowLoginGreeting] = useState(false);

  // 🛡️ Safety effect to clear any stuck body scroll lock on login/logout
  useEffect(() => {
    if (currentUser) {
      // Force unlock if we are now logged in
      document.body.style.overflow = '';
    }
  }, [currentUser]);

  const [limitStatus, setLimitStatus] = useState<{ count: number; remaining: number; limit: number } | null>(null);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hoverColor, setHoverColor] = useState('#2563eb');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // 👤 User Profile Picture & Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem(`passport_extractor_avatar_${currentUser.id}`);
      setProfilePicture(saved);
    } else {
      setProfilePicture(null);
    }
  }, [currentUser]);

  const handleSaveProfilePicture = (dataUrl: string) => {
    if (currentUser) {
      localStorage.setItem(`passport_extractor_avatar_${currentUser.id}`, dataUrl);
      setProfilePicture(dataUrl);
      setToast({ message: 'আপনার প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে! (Profile picture updated successfully!)', type: 'success' });
    }
  };

  const [isAdminUsersOpen, setIsAdminUsersOpen] = useState(false);

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
        setShowLoginGreeting(true);
      } else {
        setLoginError(result.error || 'Login failed. Please provide correct credentials.');
      }
    } catch (err) {
      setLoginError('Could not connect to the server. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const executeLogout = async () => {
    localStorage.removeItem('passport_extractor_user');
    setCurrentUser(null);
    setLimitStatus(null);
    setIsLogoutConfirmOpen(false);
    try {
      await logoutGoogle();
    } catch (e) {
      console.error(e);
    }
    setToast({ message: 'Logged out successfully.', type: 'info' });
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

  // 🕒 ৩০ মিনিট নিষ্ক্রিয় থাকার পর অটো-লগআউট করা (Auto-logout on 30 min inactivity)
  useEffect(() => {
    if (!currentUser) return;

    let lastActivity = Date.now();

    const resetTimer = () => {
      lastActivity = Date.now();
    };

    // Activity triggers
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    // Check interval every 15 seconds
    const interval = setInterval(() => {
      const inactiveMs = Date.now() - lastActivity;
      const limitMs = 30 * 60 * 1000; // 30 minutes

      if (inactiveMs >= limitMs) {
        localStorage.removeItem('passport_extractor_user');
        setCurrentUser(null);
        setLimitStatus(null);
        setToast({ 
          message: 'নিরাপত্তার স্বার্থে ৩০ মিনিট নিষ্ক্রিয় থাকার কারণে আপনাকে অটো-লগআউট করা হয়েছে। (Logged out due to 30 minutes of inactivity for security.)', 
          type: 'info' 
        });
      }
    }, 15000);

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      clearInterval(interval);
    };
  }, [currentUser]);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [data, setData] = useState<PassportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  
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
  } = usePassportHistory(currentUser?.id || null);



  const [resultsTab, setResultsTab] = useState<'profile' | 'undertaking' | 'passport-pdf' | 'padgen'>(() => {
    const saved = localStorage.getItem('passport_active_results_tab');
    if (saved === 'undertaking') return 'undertaking';
    if (saved === 'passport-pdf') return 'passport-pdf';
    if (saved === 'padgen') return 'padgen';
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
  const [isRefHelperOpen, setIsRefHelperOpen] = useState(false);

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
  const visaFileInputRef = useRef<HTMLInputElement>(null);

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
    handleVisaFileChange,
    handleVisaDrop,
    selectQueueItem,
    removeFromQueue,
    loadFromHistory,
    clearAll
  } = useQueueHandlers({
    queue, setQueue, activeQueueId, setActiveQueueId,
    setFile, setPreview, setData, setError, fileInputRef
  });

  const activeItem = queue.find(q => q.id === activeQueueId) || null;

  useEffect(() => {
    if (activeItem?.documentType === 'visa_application' && resultsTab !== 'profile') {
      setResultsTab('profile');
    }
  }, [activeItem?.documentType, resultsTab]);

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

    let val = newValue;
    let extraFields = {};
    if (field === 'hotelAddress') {
      val = formatIndianVisaAddress(newValue);
      const pinMatch = val.match(/\b\d{6}\b/);
      if (pinMatch) {
        extraFields = { hotelPinCode: pinMatch[0] };
      }
    }
    const updated = { ...data, [field]: val, ...extraFields };
    setData(updated);
    if (activeQueueId) {
      setQueue(prev => prev.map(q => q.id === activeQueueId ? { ...q, data: updated } : q));
    }
    setHistory(history.map(item => {
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
  const executeDelete = (e: React.MouseEvent, id?: string) => { 
    e.stopPropagation(); 
    const finalId = id || itemToDelete;
    if (finalId === 'ALL') {
      clearHistory();
    } else if (finalId) {
      deleteHistoryItem(finalId); 
    }
    
    // Only close the whole modal if we are NOT in ALL mode OR if the item deleted was the ALL target
    if (itemToDelete !== 'ALL' || finalId === 'ALL') {
      setItemToDelete(null); 
    }
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
    handleDownloadUndertaking,
    handleDownloadJSON
  } = useExporterHelpers({ data, undertakingData, setToast, currentUser });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-50 pb-4 selection:bg-red-200 dark:selection:bg-red-900/50 selection:text-red-900 dark:selection:text-red-100 transition-colors relative overflow-x-hidden">
      <BackgroundElements />

      {/* Global Progress Bar */}
      <GlobalProgress loading={loading} />

      <div className={`transition-all duration-500 ${!currentUser ? 'blur-2xl opacity-30 select-none pointer-events-none' : ''}`}>
        <Header
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          currentUser={currentUser}
          onLogout={handleLogout}
          limitStatus={limitStatus}
          onOpenAdminUsers={() => {
            setIsAdminUsersOpen(true);
          }}
          profilePicture={profilePicture}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        <OfflineBanner isOnline={isOnline} />

        <div className="w-full px-4 mt-6">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-4 tracking-wide">
              কি কি কাজ করতে পারবেন:
            </h2>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-400 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                পাসপোর্ট থেকে তথ্য অটোমেটিক এক্সট্রাক্ট করা।
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                আন্ডারটেকিং ফর্ম তৈরি ও এডিট করা।
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                পাসপোর্ট ইমেজ থেকে পিডিএফ তৈরি করা।
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                NOC ও ভিজিটিং কার্ড তৈরি করা।
              </li>
            </ul>
            <div className="flex justify-center w-full mt-2">
              <button
                onClick={() => {
                  setResultsTab('padgen');
                  setTimeout(() => {
                    const resultsSection = document.getElementById('printable-results-card');
                    if (resultsSection) {
                      resultsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="w-fit text-white font-extrabold py-2 px-6 rounded-full shadow-lg flex items-center justify-center gap-2 text-sm slide-btn slide-btn-blue cursor-pointer transition-transform hover:scale-105"
              >
                <FileText className="w-5 h-5" />
                NOC & Card Create
              </button>
            </div>
          </div>
        </div>

        <main className="w-full px-4 mt-10 print:mt-2 print:w-full print:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
            
            {/* UPLOAD & HISTORY SECTION (Left side) */}
            <UploadSection
              preview={preview}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              visaFileInputRef={visaFileInputRef}
              handleVisaFileChange={handleVisaFileChange}
              handleVisaDrop={handleVisaDrop}
              handleDrop={handleDrop}
              handleDragOver={handleDragOver}
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
              handleDownloadJSON={handleDownloadJSON}
              isGeneratingAddresses={isGeneratingAddresses}
              onGenerateAddresses={handleGenerateAddresses}
              utPurpose={utPurpose}
              onOpenRefHelper={() => setIsRefHelperOpen(true)}
              currentUser={currentUser}
            />
          </div>
        </main>
      </div>

      {/* Footer Section */}
      <footer className="w-full border-t border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 mt-6 py-2.5 print:hidden">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
            Built with <Heart className="w-3 h-3 text-red-500 fill-current" /> by <span className="text-slate-700 dark:text-zinc-200 font-bold tracking-wide ml-0.5">MOHAMMAD NUR HASNAT</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} Extractor. All rights reserved.
          </p>
        </div>
      </footer>

      {/* App Modals (Backup, Restore, Profile, Logout, Admin, Login, Toast, Greeting) */}
      <AppModals
        isAdminOpen={isAdminUsersOpen}
        setIsAdminOpen={setIsAdminUsersOpen}
        isProfileOpen={isProfileModalOpen}
        setIsProfileOpen={setIsProfileModalOpen}
        isBackupOpen={isBackupOpen}
        setIsBackupOpen={setIsBackupOpen}
        isRestoreOpen={isRestoreOpen}
        setIsRestoreOpen={setIsRestoreOpen}
        isLogoutConfirmOpen={isLogoutConfirmOpen}
        setIsLogoutConfirmOpen={setIsLogoutConfirmOpen}
        currentUser={currentUser}
        history={history}
        setHistory={setHistory}
        handleLogout={executeLogout}
        profilePicture={profilePicture}
        onSaveProfilePicture={handleSaveProfilePicture}
        toast={toast}
        setToast={setToast}
        itemToDelete={itemToDelete}
        cancelDelete={cancelDelete}
        executeDelete={executeDelete}
        loginIdentifier={loginIdentifier}
        setLoginIdentifier={setLoginIdentifier}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
        handleLogin={handleLogin}
        showLoginGreeting={showLoginGreeting}
        setShowLoginGreeting={setShowLoginGreeting}
        isRefHelperOpen={isRefHelperOpen}
        setIsRefHelperOpen={setIsRefHelperOpen}
        utPurpose={utPurpose}
        selectedHospital={undertakingData?.hospitalName || data?.hospitalName || utHospitalName || ''}
      />
    </div>
  );
}

