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
import { BroadcastBanner } from './components/BroadcastBanner';

// Utilities
import { generateDataText, getKolkataHotelForPassport, getDelhiHotelForPassport, getKolkataBusinessForPassport, formatIndianVisaAddress } from './utils/addressUtils';
import { generatePDF, getPDFDocument, generateUndertakingPDF } from './utils/pdfGenerator';
import { logoutGoogle, auth, db } from './lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';

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
      const trimmedIdentifier = loginIdentifier.trim();
      const password = loginPassword;

      if (!trimmedIdentifier || !password) {
        setLoginError('Email/Mobile and Password are required.');
        setIsLoggingIn(false);
        return;
      }

      let matchedUser: any = null;
      let errorMsg = 'ভুল ইমেইল/মোবাইল নাম্বার অথবা পাসওয়ার্ড দিয়েছেন।';

      // Step 1: Call server-side /api/login backend endpoint first
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginIdentifier: trimmedIdentifier, password })
        });
        const result = await res.json();
        if (result.success) {
          matchedUser = result.user;
        } else {
          errorMsg = result.error || errorMsg;
        }
      } catch (serverErr) {
        console.warn('Backend login endpoint failed, falling back to direct Firestore query:', serverErr);
      }

      // Step 1.5: Client-side Firestore fallback if server-side login was not reachable
      if (!matchedUser) {
        try {
          const usersCol = collection(db, 'registered_users');
          const qEmail = query(usersCol, where('email', '==', trimmedIdentifier));
          const snapEmail = await getDocs(qEmail);
          if (!snapEmail.empty) {
            const potentialUser = snapEmail.docs[0].data();
            if (potentialUser.password === password) {
              matchedUser = potentialUser;
            }
          } else {
            const qMobile = query(usersCol, where('mobileNumber', '==', trimmedIdentifier));
            const snapMobile = await getDocs(qMobile);
            if (!snapMobile.empty) {
              const potentialUser = snapMobile.docs[0].data();
              if (potentialUser.password === password) {
                matchedUser = potentialUser;
              }
            }
          }

          if (matchedUser && matchedUser.isSuspended) {
            setLoginError('আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। Users have been suspended. Now, contact support.');
            setIsLoggingIn(false);
            return;
          }
        } catch (dbErr) {
          console.error('Firestore direct query fallback failed:', dbErr);
        }
      }

      if (!matchedUser) {
        setLoginError(errorMsg);
        setIsLoggingIn(false);
        return;
      }

      if (matchedUser.isSuspended) {
        setLoginError('আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। Users have been suspended. Now, contact support.');
        setIsLoggingIn(false);
        return;
      }

      const userEmail = matchedUser.email;

      // Step 2: Try to use Firebase Authentication SDK to authenticate properly (optional/non-blocking)
      try {
        await signInWithEmailAndPassword(auth, userEmail, password);
      } catch (authErr: any) {
        // Fallback: If user is validated but auth account is missing in Firebase Auth, register on-the-fly
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, userEmail, password);
          } catch (createErr) {
            console.warn('Failed to create user on-the-fly in Firebase Auth (safe to ignore if Email/Password provider is disabled):', createErr);
          }
        } else {
          console.warn('Firebase Auth SDK authentication skipped (safe to ignore if Email/Password provider is disabled):', authErr);
        }
      }

      // Append login audit log via server proxy
      try {
        await fetch('/api/log-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: matchedUser.id, 
            action: 'LOGIN', 
            details: 'User logged in successfully' 
          })
        });
      } catch (logErr) {
        console.error('Failed to append login audit log:', logErr);
      }

      localStorage.setItem('passport_extractor_user', JSON.stringify(matchedUser));
      setCurrentUser(matchedUser);
      setShowLoginGreeting(true);
      setToast({ message: 'সফলভাবে লগইন করা হয়েছে! (Logged in successfully!)', type: 'success' });
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

  // Real-time limit status sync without periodic polling reloads
  useEffect(() => {
    if (!currentUser?.id) return;

    loadLimitStatus(currentUser.id);

    // Firestore real-time listener on current user doc for instant zero-reload limit sync
    let unsubscribe: (() => void) | null = null;
    try {
      const userDocRef = doc(db, 'registered_users', currentUser.id);
      unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          loadLimitStatus(currentUser.id);
        }
      }, (err) => {
        console.warn("User limit snapshot listener error:", err);
      });
    } catch (e) {
      console.warn("Could not set up user limit snapshot listener:", e);
    }

    const handleFocus = () => {
      loadLimitStatus(currentUser.id);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('app_limit_updated', handleFocus);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('app_limit_updated', handleFocus);
    };
  }, [currentUser?.id]);
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



  const [resultsTab, setResultsTab] = useState<'profile' | 'undertaking' | 'passport-pdf'>(() => {
    const hash = window.location.hash.replace('#', '');
    if (['profile', 'undertaking', 'passport-pdf'].includes(hash)) {
      return hash as any;
    }
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
  const [isRefHelperOpen, setIsRefHelperOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    localStorage.setItem('passport_active_results_tab', resultsTab);
    
    // Manage browser history for back button support
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash !== resultsTab) {
      if (!currentHash && resultsTab === 'profile') {
        window.history.replaceState(null, '', `#${resultsTab}`);
      } else {
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
        setToast({ message: 'শেয়ার করা ডাটা লোড করা হচ্ছে... (Loading shared data...)', type: 'info' });
        try {
          const docRef = doc(db, 'shared_cards', shareId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const sharedData = docSnap.data();
            if (sharedData && sharedData.passportData) {
              setData(sharedData.passportData);
              if (sharedData.undertakingData) {
                setUndertakingData(sharedData.undertakingData);
              }
              setToast({ message: 'শেয়ার করা ডাটা সফলভাবে লোড হয়েছে! (Shared data loaded successfully!)', type: 'success' });
            } else {
              setToast({ message: 'শেয়ার করা ডাটা পাওয়া যায়নি। (Shared data not found.)', type: 'error' });
            }
          } else {
            setToast({ message: 'শেয়ার করা ডাটা পাওয়া যায়নি। (Shared data not found.)', type: 'error' });
          }
        } catch (err) {
          console.error('Error loading shared card:', err);
          setToast({ message: 'শেয়ার করা ডাটা লোড করতে ব্যর্থ হয়েছে। (Failed to load shared data.)', type: 'error' });
        }
      };
      loadSharedCard();
    }
  }, []);

  const handleShare = async () => {
    if (!data) return;
    setIsSharing(true);
    try {
      const docRef = await addDoc(collection(db, 'shared_cards'), {
        passportData: data,
        undertakingData: undertakingData,
        timestamp: Date.now(),
        createdBy: currentUser?.id || 'anonymous'
      });
      
      const shareUrl = `${window.location.origin}/?share=${docRef.id}`;
      
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
      setToast({
        message: 'শেয়ার লিংক এবং কার্ডের ডাটা কপি করা হয়েছে! (Share link & card data copied!)',
        type: 'success'
      });
    } catch (err) {
      console.error('Error sharing card:', err);
      setToast({
        message: 'শেয়ার করতে সমস্যা হয়েছে। (Failed to share. Please try again.)',
        type: 'error'
      });
    } finally {
      setIsSharing(false);
    }
  };

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
        <BroadcastBanner />

        <OfflineBanner isOnline={isOnline} />

        <div className="w-full px-4 mt-6">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 dark:border-zinc-800/60 shadow-sm relative">
            <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-4 tracking-wide">
              কি কি কাজ করতে পারবেন:
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-zinc-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>পাসপোর্ট থেকে তথ্য অটোমেটিক এক্সট্রাক্ট করা।</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>আন্ডারটেকিং ফর্ম তৈরি ও এডিট করা।</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>পাসপোর্ট ইমেজ থেকে পিডিএফ তৈরি করা।</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>কোম্পানি / বিজনেস প্যাড তৈরি করা।</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>কোম্পানি / বিজনেস / এমপ্লয়ী ভিজিটিং কার্ড তৈরি করা।</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>কভার লেটার তৈরি করা।</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>NOC তৈরি করা।</span>
              </li>
            </ul>

            {/* Right + Down side button for PadGen */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between sm:justify-end gap-3">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium sm:hidden">
                প্যাড/ভিজিটিং কার্ড/NOC সার্ভিস:
              </span>
              <a
                href="https://padgen.extractor.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 group border border-white/20 cursor-pointer"
                title="PadGen ওয়েবসাইটে যান"
              >
                <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>PadGen</span>
              </a>
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

