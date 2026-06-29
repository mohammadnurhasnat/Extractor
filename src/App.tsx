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
import { BackupModal } from './components/BackupModal';
import { RestoreModal } from './components/RestoreModal';
import { ProfileCustomizationModal } from './components/ProfileCustomizationModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { LoginModal } from './components/LoginModal';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';

// Utilities
import { generateDataText } from './utils/addressUtils';
import { generatePDF, getPDFDocument, generateUndertakingPDF } from './utils/pdfGenerator';
import { signInWithGooglePopup, logoutGoogle } from './lib/firebase';

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
        setToast({ message: `Welcome ${result.user.name}! Login was successful.`, type: 'success' });
      } else {
        setLoginError(result.error || 'Login failed. Please provide correct credentials.');
      }
    } catch (err) {
      setLoginError('Could not connect to the server. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const result = await signInWithGooglePopup();
      if (!result?.user) throw new Error('Google authentication failed.');
      
      const response = await fetch('/api/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: result.user.email,
          name: result.user.displayName,
          photoURL: result.user.photoURL,
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem('passport_extractor_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setToast({ message: `Welcome ${data.user.name}! Google Login successful.`, type: 'success' });
      } else {
        setLoginError(data.error || 'Google login failed.');
      }
    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || 'Could not connect to Google or the server. Please try again.');
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

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

  const [file, setFile] = useState<File | null>(() => {
    try {
      const savedPreview = localStorage.getItem('passport_active_preview');
      const savedDataStr = localStorage.getItem('passport_active_data');
      if (savedPreview && savedPreview.startsWith('data:')) {
        let name = 'Passport.jpg';
        if (savedDataStr) {
          const decoded = decryptData(savedDataStr);
          if (decoded && decoded.passportNumber) {
            name = `Passport_${decoded.passportNumber}.jpg`;
          }
        }
        return dataURLtoFile(savedPreview, name);
      }
    } catch (e) {
      console.error("Failed to reconstruct file on load", e);
    }
    return null;
  });
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
      if (preview.startsWith('blob:') && file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            localStorage.setItem('passport_active_preview', reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        localStorage.setItem('passport_active_preview', preview);
      }
    } else {
      localStorage.removeItem('passport_active_preview');
    }
  }, [preview, file]);
  
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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-50 pb-12 selection:bg-blue-100/50 dark:selection:bg-blue-900/50 transition-colors relative">
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

      {/* 🔐 LOGIN POPUP WINDOW */}
      <AnimatePresence>
        {!currentUser && (
          <LoginModal
            loginIdentifier={loginIdentifier}
            setLoginIdentifier={setLoginIdentifier}
            loginPassword={loginPassword}
            setLoginPassword={setLoginPassword}
            loginError={loginError}
            isLoggingIn={isLoggingIn}
            handleLogin={handleLogin}
            onGoogleLogin={handleGoogleLogin}
          />
        )}
      </AnimatePresence>

      {/* 🔐 LOGOUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {isLogoutConfirmOpen && (
          <LogoutConfirmModal
            isOpen={isLogoutConfirmOpen}
            onClose={() => setIsLogoutConfirmOpen(false)}
            onConfirm={executeLogout}
          />
        )}
      </AnimatePresence>





      {/* Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* User Profile Customization Modal */}
      <ProfileCustomizationModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        profilePicture={profilePicture}
        onSaveProfilePicture={handleSaveProfilePicture}
      />

      <AdminDashboardModal 
        isOpen={isAdminUsersOpen}
        onClose={() => setIsAdminUsersOpen(false)}
        currentUser={currentUser}
        setToast={setToast}
      />
    </div>
  );
}

