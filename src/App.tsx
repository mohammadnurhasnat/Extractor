import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2, ShieldCheck, 
  History, Trash2, ZapOff, Search, Sun, Moon, Copy, Download, Check, 
  AlertTriangle, Printer, Play, X, Clock, Settings, Key, Eye, EyeOff, Heart,
  MessageCircle, LogOut, Plus, Users, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';

// Types
import { User, PassportData, HistoryItem, QueueItem, UndertakingFormData } from './types';
import { safeFetchJson } from './utils/api';

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
import { BroadcastBanner } from './components/BroadcastBanner';
import { PadGenWorkspace } from './components/PadGenWorkspace';

// Utilities
import { generateDataText, getKolkataHotelForPassport, getDelhiHotelForPassport, getKolkataBusinessForPassport, formatIndianVisaAddress } from './utils/addressUtils';
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
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('passport_extractor_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // SSO & Subdomain Check (checks if we are on padgen.extractor.fun or localhost testing)
  const isSubdomainPadgen = window.location.hostname.includes('padgen') || new URLSearchParams(window.location.search).get('app') === 'padgen';
  const [isSsoChecking, setIsSsoChecking] = useState(isSubdomainPadgen);

  useEffect(() => {
    const checkSSO = async () => {
      try {
        const response = await fetch('/api/sso/verify');
        const resData = await response.json();
        if (response.ok && resData.success && resData.authenticated) {
          setCurrentUser(resData.user);
          localStorage.setItem('passport_extractor_user', JSON.stringify(resData.user));
          setIsSsoChecking(false);
        } else {
          // If we are on PadGen subdomain and not authenticated, we MUST redirect to Extractor login
          if (isSubdomainPadgen) {
            setToast({ message: 'Authorization required. Redirecting to Extractor for login...', type: 'error' });
            setTimeout(() => {
              window.location.href = 'https://extractor.fun/';
            }, 2000);
          } else {
            setIsSsoChecking(false);
          }
        }
      } catch (err) {
        console.error('SSO verification failed:', err);
        if (isSubdomainPadgen) {
          window.location.href = 'https://extractor.fun/';
        } else {
          setIsSsoChecking(false);
        }
      }
    };
    
    checkSSO();
  }, [isSubdomainPadgen]);

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
      setProfilePicture(saved || currentUser.profilePicture || null);
    } else {
      setProfilePicture(null);
    }
  }, [currentUser]);

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    if (updatedUser.profilePicture) {
      setProfilePicture(updatedUser.profilePicture);
      localStorage.setItem(`passport_extractor_avatar_${updatedUser.id}`, updatedUser.profilePicture);
    } else {
      setProfilePicture(null);
      localStorage.removeItem(`passport_extractor_avatar_${updatedUser.id}`);
    }
  };

  const handleSaveProfilePicture = (dataUrl: string) => {
    if (currentUser) {
      localStorage.setItem(`passport_extractor_avatar_${currentUser.id}`, dataUrl);
      setProfilePicture(dataUrl);
      setToast({ message: 'Profile picture updated successfully!', type: 'success' });
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
      const { ok, data: result } = await safeFetchJson(`/api/limit-status/${userId}`);
      if (ok && result && result.success) {
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
      const trimmedIdentifier = loginIdentifier.trim();
      const password = loginPassword;

      if (!trimmedIdentifier || !password) {
        setLoginError('Email/Mobile and Password are required.');
        setIsLoggingIn(false);
        return;
      }

      let matchedUser: any = null;
      let errorMsg = 'Incorrect email/mobile number or password.';

      // Step 1: Call server-side /api/login backend endpoint first
      try {
        const { ok, data: result, error } = await safeFetchJson('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginIdentifier: trimmedIdentifier, password })
        });
        if (ok && result && result.success) {
          matchedUser = result.user;
        } else {
          errorMsg = result?.error || error || errorMsg;
        }
      } catch (serverErr) {
        console.warn('Backend login endpoint failed, falling back to direct Firestore query:', serverErr);
      }

      if (!matchedUser) {
        setLoginError(errorMsg);
        setIsLoggingIn(false);
        return;
      }

      if (matchedUser.isSuspended) {
        setLoginError('Your account has been suspended. Please contact support.');
        setIsLoggingIn(false);
        return;
      }

      const userEmail = matchedUser.email;

      // Append login audit log via server proxy (non-blocking)
      fetch('/api/log-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: matchedUser.id, 
          action: 'LOGIN', 
          details: 'User logged in successfully' 
        })
      }).catch((logErr) => {
        console.error('Failed to append login audit log:', logErr);
      });

      localStorage.setItem('passport_extractor_user', JSON.stringify(matchedUser));
      setCurrentUser(matchedUser);
      setShowLoginGreeting(true);
      setToast({ message: 'Logged in successfully!', type: 'success' });
    } catch (err: any) {
      console.error('Login process error:', err);
      setLoginError('Authentication process failed. Please try again.');
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
      await fetch('/api/sso/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setToast({ message: 'Logged out successfully.', type: 'info' });
    if (isSubdomainPadgen) {
      window.location.href = 'https://extractor.fun/';
    }
  };

  // 1. Disable mouse right click and developer tools prevention
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

  // Real-time limit status sync without periodic polling reloads
  useEffect(() => {
    if (!currentUser?.id) return;

    loadLimitStatus(currentUser.id);

    const handleFocus = () => {
      loadLimitStatus(currentUser.id);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('app_limit_updated', handleFocus);
    window.addEventListener('app_action_logged', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('app_limit_updated', handleFocus);
      window.removeEventListener('app_action_logged', handleFocus);
    };
  }, [currentUser?.id]);
  // 🕒 Auto-logout on 30 min inactivity
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
          message: 'Logged out due to 30 minutes of inactivity for security.', 
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



  const [resultsTab, setResultsTab] = useState<'profile' | 'undertaking' | 'passport-pdf'>(() => {
    const hash = window.location.hash.replace('#', '');
    if (['undertaking', 'passport-pdf'].includes(hash)) {
      return hash as any;
    }
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
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    localStorage.setItem('passport_active_results_tab', resultsTab);
    
    // Manage browser history for back button support and clean URL on default tab
    const currentHash = window.location.hash.replace('#', '');
    if (resultsTab === 'profile') {
      if (currentHash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } else {
      if (currentHash !== resultsTab) {
        window.history.pushState(null, '', `#${resultsTab}`);
      }
    }
  }, [resultsTab]);

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      if (['profile', 'undertaking', 'passport-pdf'].includes(hash)) {
        setResultsTab(hash as any);
      } else {
        setResultsTab('profile'); // Default fallback
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');
    if (shareId) {
      const loadSharedCard = async () => {
        setToast({ message: 'Loading shared data...', type: 'info' });
        try {
          const res = await fetch(`/api/share-card/${shareId}`);
          const resData = await res.json();
          if (res.ok && resData.success && resData.card) {
            const sharedData = resData.card;
            if (sharedData.passportData) {
              setData(sharedData.passportData);
              if (sharedData.undertakingData) {
                setUndertakingData(sharedData.undertakingData);
              }
              setToast({ message: 'Shared data loaded successfully!', type: 'success' });
            } else {
              setToast({ message: 'Shared data not found.', type: 'error' });
            }
          } else {
            setToast({ message: 'Shared data not found.', type: 'error' });
          }
        } catch (err) {
          console.error('Error loading shared card:', err);
          setToast({ message: 'Failed to load shared data.', type: 'error' });
        }
      };
      loadSharedCard();
    }
  }, []);

  const handleShare = async () => {
    if (!data) return;
    setIsSharing(true);
    try {
      const res = await fetch('/api/share-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passportData: data,
          undertakingData: undertakingData,
          createdBy: currentUser?.id || 'anonymous'
        })
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to share');
      }
      
      const shareUrl = `${window.location.origin}/?share=${resData.id}`;
      
      const formattedText = `📋 PASSPORT DATA REPORT (SHARED CARD)
--------------------------------------
• Name: ${data.givenName || ''} ${data.surname || ''}
• Passport Number: ${data.passportNumber || ''}
• Date of Birth: ${data.dob || ''}
• Gender: ${data.gender || ''}
• Birth Place: ${data.birthPlace || ''}
• Issue Date: ${data.issueDate || ''}
• Expiry Date: ${data.expiryDate || ''}
• NID/Birth Cert No: ${data.nidOrBirthCertNumber || ''}

🔗 View Full Interactive Card Online:
${shareUrl}
--------------------------------------`;

      await navigator.clipboard.writeText(formattedText);
      window.dispatchEvent(new CustomEvent('app_action_logged'));
      setToast({
        message: 'Share link & card data copied!',
        type: 'success'
      });
    } catch (err) {
      console.error('Error sharing card:', err);
      setToast({
        message: 'Failed to share. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSharing(false);
    }
  };

  const isUndertakingConfigured = !!(
    (utPurpose && utPurpose !== 'Double Entry' && utPurpose !== 'Tourism') ||
    utFromDate ||
    utToDate
  );

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
    setFile, setPreview, setData, setError, setToast, fileInputRef
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

  if (isSubdomainPadgen) {
    if (isSsoChecking) {
      return (
        <div className="min-h-screen bg-[#FDFCF7] dark:bg-zinc-950 flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 font-sans">Verifying SSO Session...</p>
        </div>
      );
    }
    return (
      <PadGenWorkspace currentUser={currentUser} onLogout={executeLogout} />
    );
  }

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
        <BroadcastBanner />

        <OfflineBanner isOnline={isOnline} />

        <div className="w-full px-4 mt-6">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-slate-200/60 dark:border-zinc-800/60 shadow-sm relative">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              
              {/* Left Side: Features List */}
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-2.5 tracking-wide">
                  যেসব সুবিধা পাবেন:
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs text-slate-700 dark:text-zinc-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>পাসপোর্টের বিস্তারিত তথ্য স্বয়ংক্রিয়ভাবে এক্সট্রাক্ট।</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>আন্ডারটেকিং ফর্ম তৈরি ও এডিট করা।</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>পাসপোর্ট ছবি থেকে পিডিএফ তৈরি করা।</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>কোম্পানি/ব্যবসার লেটারহেড তৈরি করা।</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>বিজনেস ভিজিটিং কার্ড তৈরি করা।</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>কভার লেটার তৈরি ও এডিট করা।</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>NOC (অনাপত্তি সনদ) তৈরি ও এডিট করা।</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>অফিস আইডি কার্ড তৈরি করা।</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>কাস্টম স্ট্যাম্প ও সিল তৈরি করা।</span>
                  </li>
                </ul>
              </div>

              {/* Right Side Callout Card for PadGen (Desktop) / Bottom Bar (Mobile) */}
              <div className="lg:w-80 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-200/60 dark:border-zinc-800/60 lg:pl-5 flex flex-row lg:flex-col items-center lg:items-start justify-between gap-3 bg-slate-50/50 dark:bg-zinc-800/30 lg:bg-transparent lg:dark:bg-transparent p-3 lg:p-0 rounded-xl lg:rounded-none">
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm text-slate-800 dark:text-zinc-200 font-bold">
                    লেটারহেড, ভিজিটিং কার্ড, NOC, আইডি কার্ড, কভার লেটার, স্ট্যাম্প:
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 hidden lg:block mt-0.5">
                    PadGen এর সাহায্যে সহজেই প্রফেশনাল লেটারহেড, ভিজিটিং কার্ড, NOC, আইডি কার্ড, কভার লেটার এবং স্ট্যাম্প তৈরি করুন।
                  </span>
                </div>
                
                <a
                  href="https://padgen.extractor.fun/"
                  target="_self"
                  className="relative inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-[11px] sm:text-xs border-b-[3px] sm:border-b-4 border-indigo-950/80 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all duration-150 group cursor-pointer shrink-0 mt-0 lg:mt-2"
                  title="Go to PadGen Website"
                >
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
                  <span>PadGen</span>
                </a>
              </div>

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
              activeData={data}
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
              utDoctorName={utDoctorName}
              onOpenRefHelper={() => setIsRefHelperOpen(true)}
              currentUser={currentUser}
              onShare={handleShare}
              isSharing={isSharing}
            />
          </div>
        </main>
      </div>

      {/* Footer Section */}
      <footer className="w-full border-t border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 mt-6 py-2.5 print:hidden">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 flex-wrap justify-center sm:justify-start">
            <span>Built with</span> <Heart className="w-3 h-3 text-red-500 fill-current" /> <span>by</span>
            <span className="font-extrabold text-orange-500 ml-0.5">MOHAMMAD</span>
            <span className="font-extrabold text-emerald-500 ml-0.5">NUR</span>
            <span className="font-extrabold text-amber-500 dark:text-amber-400 ml-0.5">HASNAT</span>
            
            {/* Animated Eye-Catching Official WhatsApp Icon Only */}
            <motion.a
              href="https://wa.me/8801861186863"
              target="_blank"
              rel="noopener noreferrer"
              animate={{ 
                scale: [1, 1.2, 1, 1.2, 1],
                rotate: [0, -5, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="inline-flex items-center justify-center ml-1 p-1 rounded-[5px] bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-[0_2px_10px_rgba(37,211,102,0.4)] hover:shadow-[0_4px_15px_rgba(37,211,102,0.6)] transition-colors cursor-pointer border border-emerald-300/40 shrink-0"
              title="Chat on WhatsApp (+8801861186863)"
            >
              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12.011 0C5.385 0 0 5.385 0 12.011c0 2.116.553 4.184 1.605 6.002L.057 24l6.163-1.605A11.968 11.968 0 0 0 12.011 24c6.626 0 12.011-5.385 12.011-12.011S18.637 0 12.011 0zm0 21.986c-1.802 0-3.568-.485-5.112-1.402l-.367-.218-3.797.989.989-3.797-.218-.367A9.957 9.957 0 0 1 2.025 12.011C2.025 6.495 6.495 2.025 12.011 2.025c5.516 0 9.986 4.47 9.986 9.986 0 5.516-4.47 9.975-9.986 9.975zm5.461-7.604c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </motion.a>
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
        onUpdateUser={handleUpdateUser}
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

