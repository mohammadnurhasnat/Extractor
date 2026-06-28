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

// 📱 Original official high-fidelity WhatsApp SVG Icon
const WhatsAppIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-4 h-4 shrink-0 transition-all duration-300 group-hover:scale-110"
    {...props}
  >
    <path d="M12.031 6.172c-2.656 0-4.817 2.16-4.817 4.817 0 .852.224 1.652.615 2.347l-.653 2.392 2.447-.642c.67.365 1.433.573 2.247.573 2.656 0 4.817-2.16 4.817-4.817s-2.16-4.817-4.817-4.817zm2.648 7.102c-.12.339-.597.625-.916.696-.248.055-.572.089-1.571-.327-1.28-.533-2.105-1.832-2.169-1.917-.064-.085-.516-.685-.516-1.306 0-.622.326-.928.443-1.048.117-.12.254-.15.339-.15.085 0 .17 0 .243.004.081.004.19-.032.29.21.104.252.357.868.389.933.032.065.052.14.01.225-.042.085-.064.138-.127.213-.064.074-.134.166-.191.223-.065.065-.132.134-.057.263.075.129.335.553.72.896.496.442.914.58 1.043.645.129.065.203.054.279-.032.075-.085.322-.375.408-.503.086-.129.17-.107.288-.064.118.043.747.352.875.416.128.064.214.096.246.15.032.054.032.31-.089.65zm-2.671-13.264C5.397.01.06 5.348.06 11.957c.001 2.112.548 4.17 1.587 5.974L0 24l6.335-1.662c1.746.953 3.71 1.455 5.673 1.456 6.613 0 11.95-5.341 11.95-11.953 0-3.204-1.245-6.216-3.513-8.484C18.22.135 15.21.01 12.008.01zm5.513 14.29c-.324-.162-1.917-.946-2.21-1.053-.293-.108-.507-.162-.72.162-.213.324-.827 1.053-1.013 1.267-.187.213-.373.24-.697.078-.324-.162-1.37-.505-2.61-1.611-.965-.86-1.617-1.923-1.806-2.247-.189-.324-.02-.5-.182-.661-.147-.146-.324-.378-.487-.568-.162-.189-.217-.324-.324-.54-.108-.217-.053-.405-.027-.567.027-.162.213-.513.32-.675.107-.162.143-.27.213-.405.071-.135.035-.253-.018-.36-.053-.107-.507-1.222-.693-1.67-.182-.438-.363-.378-.507-.385-.13-.006-.28-.008-.43-.008-.15 0-.394.056-.6.281-.206.225-.788.77-.788 1.877s.804 2.17 1.916 2.32c.112.015 1.8 2.75 4.362 3.855.61.264 1.086.42 1.457.538.613.195 1.172.167 1.613.101.492-.074 1.517-.619 1.73-1.217.213-.598.213-1.11.15-1.217-.063-.108-.231-.162-.555-.324z" />
  </svg>
);

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

  // 👥 Admin Users Management States
  const [isAdminUsersOpen, setIsAdminUsersOpen] = useState(false);
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);
  const [isAdminAddingUser, setIsAdminAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserMobileNumber, setNewUserMobileNumber] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // 📝 User Details / Edit Modal States
  const [selectedUserForModal, setSelectedUserForModal] = useState<any | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserMobileNumber, setEditUserMobileNumber] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserDailyLimit, setEditUserDailyLimit] = useState(5);
  const [isUpdatingUserDetail, setIsUpdatingUserDetail] = useState(false);
  const [isEditingSelectedUser, setIsEditingSelectedUser] = useState(false);

  const handleOpenUserDetailModal = (user: any) => {
    setSelectedUserForModal(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email || '');
    setEditUserMobileNumber(user.mobileNumber);
    setEditUserPassword(user.password);
    setEditUserDailyLimit(user.dailyLimit ?? 5);
    setIsEditingSelectedUser(false);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedUserForModal) return;
    if (!editUserName || !editUserMobileNumber || !editUserPassword) {
      setToast({ message: 'Name, Mobile Number, and Password are required.', type: 'error' });
      return;
    }
    setIsUpdatingUserDetail(true);
    try {
      const response = await fetch('/api/admin/edit-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          userId: selectedUserForModal.id,
          name: editUserName,
          email: editUserEmail,
          mobileNumber: editUserMobileNumber,
          password: editUserPassword,
          dailyLimit: editUserDailyLimit
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setToast({ message: 'ব্যবহারকারীর তথ্য সফলভাবে আপডেট করা হয়েছে! (User updated successfully!)', type: 'success' });
        setSelectedUserForModal({
          ...selectedUserForModal,
          name: editUserName,
          email: editUserEmail,
          mobileNumber: editUserMobileNumber,
          password: editUserPassword,
          dailyLimit: editUserDailyLimit
        });
        setIsEditingSelectedUser(false);
        fetchAdminUsers();
      } else {
        setToast({ message: result.error || 'Failed to update user.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setIsUpdatingUserDetail(false);
    }
  };

  const handleDeleteFromPopup = async () => {
    if (!currentUser || !selectedUserForModal) return;
    const userId = selectedUserForModal.id;
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ব্যবহারকারীকে মুছে ফেলতে চান? (Are you sure you want to delete this user?)')) {
      return;
    }
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ userId })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAdminUsersList(prev => prev.filter(u => u.id !== userId));
        setToast({ message: 'ব্যবহারকারীকে সফলভাবে মুছে ফেলা হয়েছে! (User deleted successfully!)', type: 'success' });
        setSelectedUserForModal(null);
      } else {
        setToast({ message: result.error || 'Failed to delete user.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
  };

  const handleToggleSuspendFromPopup = async () => {
    if (!currentUser || !selectedUserForModal) return;
    const userId = selectedUserForModal.id;
    const currentStatus = !!selectedUserForModal.isSuspended;
    try {
      const response = await fetch('/api/admin/toggle-suspend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ userId, isSuspended: !currentStatus })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAdminUsersList(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: !currentStatus } : u));
        setSelectedUserForModal(prev => prev ? { ...prev, isSuspended: !currentStatus } : null);
        setToast({ 
          message: !currentStatus 
            ? 'ব্যবহারকারীকে সাময়িকভাবে স্থগিত করা হয়েছে! (User suspended successfully!)' 
            : 'ব্যবহারকারীর স্থগিতাদেশ প্রত্যাহার করা হয়েছে! (User unsuspended successfully!)', 
          type: 'success' 
        });
      } else {
        setToast({ message: result.error || 'Failed to toggle suspension.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
  };

  const fetchAdminUsers = async () => {
    if (!currentUser) return;
    setIsLoadingUsers(true);
    setAdminUsersError(null);
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'x-user-id': currentUser.id
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAdminUsersList(result.users);
      } else {
        setAdminUsersError(result.error || 'Failed to fetch registered users.');
      }
    } catch (err) {
      setAdminUsersError('Network error while fetching registered users.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newUserName || !newUserMobileNumber || !newUserPassword) {
      setToast({ message: 'Name, Mobile Number, and Password are required.', type: 'error' });
      return;
    }
    setIsSavingUser(true);
    try {
      const response = await fetch('/api/admin/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          mobileNumber: newUserMobileNumber,
          password: newUserPassword
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setToast({ message: `User ${newUserName} added successfully!`, type: 'success' });
        // Clear form fields
        setNewUserName('');
        setNewUserEmail('');
        setNewUserMobileNumber('');
        setNewUserPassword('');
        setIsAdminAddingUser(false);
        // Refresh list
        fetchAdminUsers();
      } else {
        setToast({ message: result.error || 'Failed to add user.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleUpdateUserLimit = async (userId: string, newLimit: number) => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/admin/update-user-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ userId, newLimit })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAdminUsersList(prev => prev.map(u => u.id === userId ? { ...u, dailyLimit: newLimit } : u));
        setToast({ message: 'ব্যবহারকারীর লিমিট সফলভাবে পরিবর্তন করা হয়েছে! (User limit updated successfully!)', type: 'success' });
      } else {
        setToast({ message: result.error || 'Failed to update limit.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
  };

  const handleToggleSuspendUser = async (userId: string, currentStatus: boolean) => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/admin/toggle-suspend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ userId, isSuspended: !currentStatus })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAdminUsersList(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: !currentStatus } : u));
        setToast({ 
          message: !currentStatus 
            ? 'ব্যবহারকারীকে সাময়িকভাবে স্থগিত করা হয়েছে! (User suspended successfully!)' 
            : 'ব্যবহারকারীর স্থগিতাদেশ প্রত্যাহার করা হয়েছে! (User unsuspended successfully!)', 
          type: 'success' 
        });
      } else {
        setToast({ message: result.error || 'Failed to toggle suspension.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser) return;
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ব্যবহারকারীকে মুছে ফেলতে চান? (Are you sure you want to delete this user?)')) {
      return;
    }
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ userId })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAdminUsersList(prev => prev.filter(u => u.id !== userId));
        setToast({ message: 'ব্যবহারকারীকে সফলভাবে মুছে ফেলা হয়েছে! (User deleted successfully!)', type: 'success' });
      } else {
        setToast({ message: result.error || 'Failed to delete user.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
  };


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

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const executeLogout = () => {
    localStorage.removeItem('passport_extractor_user');
    setCurrentUser(null);
    setLimitStatus(null);
    setIsLogoutConfirmOpen(false);
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
          onOpenAdminUsers={() => {
            setIsAdminUsersOpen(true);
            setIsAdminAddingUser(false);
            fetchAdminUsers();
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

      {/* 🔐 LOGIN POPUP WINDOW (Centered Overlay matching Backup Manager's elegant style) */}
      <AnimatePresence>
        {!currentUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 dark:bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="relative bg-white dark:bg-zinc-950 shadow-[0_32px_64px_rgba(15,23,42,0.18)] border border-slate-200/80 dark:border-zinc-800/80 flex flex-col overflow-hidden w-full max-w-[350px] sm:max-w-[420px] rounded-[12px] text-black dark:text-white transition-all duration-300"
            >
              {/* Top Accent line */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500" />

              {/* Header */}
              <div className="p-3.5 border-b border-slate-100 dark:border-zinc-900/60 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/40 relative z-10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span className="font-bold text-[10px] tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
                    SECURE PORTAL
                  </span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>

              {/* Title */}
              <div className="px-5 pt-6 text-center relative z-10">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-zinc-50 leading-tight">
                  Login Verification
                </h2>
              </div>

              {loginError && (
                <div className="mx-5 mt-3 p-2.5 bg-rose-500/5 border border-rose-500/15 rounded-[4px] flex items-start gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 relative z-10">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="p-6 space-y-4.5 relative z-10">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 px-0.5">
                    Email or Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. admin@example.com or 017xxxxxxxx"
                    className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-[5px] text-xs bg-slate-50/50 dark:bg-black/30 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500 text-black dark:text-white font-medium transition-all placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 px-0.5">
                    Security Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-[5px] text-xs bg-slate-50/50 dark:bg-black/30 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500 text-black dark:text-white font-medium transition-all placeholder-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  onMouseEnter={handleButtonMouseEnter}
                  className="relative overflow-hidden group w-full py-2.5 rounded-[5px] shadow-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 mt-3 border text-xs font-bold"
                  style={{
                    borderColor: hoverColor + '30',
                    backgroundColor: hoverColor + '08'
                  }}
                >
                  <span 
                    className="absolute inset-0 w-full h-full -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0" 
                    style={{ backgroundColor: hoverColor }}
                  />
                  <span className="relative z-10 transition-colors duration-300 flex items-center gap-1.5 text-slate-800 dark:text-zinc-200 group-hover:text-white dark:group-hover:text-white font-black text-xs uppercase tracking-wider">
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
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
                <div className="mt-5 text-center flex flex-col items-center justify-center gap-2.5 border-t border-slate-100 dark:border-zinc-900/60 pt-5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 leading-normal px-2">
                    Need an account? Click WhatsApp icon for Username & Passcode.
                  </span>
                  <a
                    href="https://wa.me/8801861186863"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative overflow-hidden group inline-flex items-center justify-center gap-2 px-5 py-2 border border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] rounded-[5px] shadow-sm transition-all duration-300 active:scale-95 cursor-pointer hover:shadow-emerald-500/10"
                  >
                    {/* Slide effect background fill */}
                    <span className="absolute inset-0 w-full h-full bg-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
                    
                    {/* Content container */}
                    <span className="relative z-10 flex items-center gap-1.5 transition-colors duration-300 group-hover:text-white uppercase tracking-wider">
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </span>
                  </a>
                </div>
              </form>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-slate-100 dark:border-zinc-900/80 bg-white/60 dark:bg-zinc-950/60 relative z-10 flex items-center justify-between text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>SECURE CONNECTION</span>
                </div>
                <div>
                  <span>AUTHORIZED ONLY</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔐 LOGOUT CONFIRMATION MODAL (Matching Backup Manager's elegant style) */}
      <AnimatePresence>
        {isLogoutConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="relative bg-white dark:bg-zinc-950 shadow-[0_32px_64px_rgba(30,41,59,0.25)] border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden w-full max-w-xs rounded-[5px] text-black dark:text-white"
            >
              {/* Top Accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />

              {/* Header */}
              <div className="p-3 border-b border-slate-100 dark:border-zinc-900/80 flex items-center gap-2 bg-white/60 dark:bg-zinc-950/60 relative z-10">
                <div className="p-1.5 bg-rose-500/10 rounded-[3px] text-rose-600 dark:text-rose-400">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-extrabold text-xs tracking-tight text-black dark:text-white uppercase">
                  Confirm Logout
                </h3>
              </div>

              {/* Content */}
              <div className="p-4 text-center relative z-10">
                <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                  Do you want to log out?
                </p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                  You will need to sign in again to access the portal.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex border-t border-slate-100 dark:border-zinc-900/80">
                <button
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900/50 transition-colors border-r border-slate-100 dark:border-zinc-900/80 uppercase tracking-wider cursor-pointer"
                >
                  No
                </button>
                <button
                  onClick={executeLogout}
                  className="flex-1 py-2.5 text-xs font-extrabold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 👥 ADMIN USERS MANAGEMENT MODAL */}
      <AnimatePresence>
        {isAdminUsersOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="relative bg-white dark:bg-zinc-950 shadow-[0_32px_64px_rgba(30,41,59,0.25)] border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden w-full max-w-2xl rounded-[5px] text-black dark:text-white"
            >
              {/* Top Accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

              {/* Header */}
              <div className="p-3 border-b border-slate-100 dark:border-zinc-900/80 flex items-center justify-between bg-white/60 dark:bg-zinc-950/60 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 rounded-[3px] text-blue-600 dark:text-blue-400">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-extrabold text-xs tracking-tight text-black dark:text-white uppercase">
                    System User Directory
                  </h3>
                </div>
                <button
                  onClick={() => setIsAdminUsersOpen(false)}
                  className="p-1 rounded-[3px] hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content body */}
              <div className="p-4 max-h-[60vh] overflow-y-auto relative z-10">
                {isAdminAddingUser ? (
                  /* Form to Create User */
                  <form onSubmit={handleAddUserSubmit} className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-900/50 pb-1 mb-2">
                      Create New Portal User
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="MOHAMMAD NUR HASNAT"
                          className="block w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-[5px] text-xs bg-white dark:bg-black/40 focus:outline-none focus:ring-1 focus:ring-blue-500 text-black dark:text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
                          Mobile Number
                        </label>
                        <input
                          type="text"
                          required
                          value={newUserMobileNumber}
                          onChange={(e) => setNewUserMobileNumber(e.target.value)}
                          placeholder="e.g. 017xxxxxxxx"
                          className="block w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-[5px] text-xs bg-white dark:bg-black/40 focus:outline-none focus:ring-1 focus:ring-blue-500 text-black dark:text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
                          Email Address (Optional)
                        </label>
                        <input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="e.g. user@example.com"
                          className="block w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-[5px] text-xs bg-white dark:bg-black/40 focus:outline-none focus:ring-1 focus:ring-blue-500 text-black dark:text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
                          Portal Passcode
                        </label>
                        <input
                          type="password"
                          required
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="Create secure passcode"
                          className="block w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-[5px] text-xs bg-white dark:bg-black/40 focus:outline-none focus:ring-1 focus:ring-blue-500 text-black dark:text-white font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-zinc-900/50 pt-3 mt-4">
                      <button
                        type="button"
                        onClick={() => setIsAdminAddingUser(false)}
                        className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900 rounded-[5px] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingUser}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-[5px] shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSavingUser ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Save User</span>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Display Directory list */
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-900/50">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                        Active registered user accounts
                      </p>
                      <button
                        onClick={() => setIsAdminAddingUser(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] rounded-[5px] shadow-sm transition-all duration-200 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add User</span>
                      </button>
                    </div>

                    {isLoadingUsers ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="text-xs text-slate-400 font-medium">Fetching active users...</span>
                      </div>
                    ) : adminUsersError ? (
                      <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-[5px] text-xs font-bold text-rose-600 dark:text-rose-400 text-center">
                        {adminUsersError}
                      </div>
                    ) : adminUsersList.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs font-medium">
                        No registered users found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-100 dark:border-zinc-900 rounded-[5px]">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-900 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                              <th className="p-2.5">Profile Name</th>
                              <th className="p-2.5">Mobile Number</th>
                              <th className="p-2.5">Email</th>
                              <th className="p-2.5">Passcode</th>
                              <th className="p-2.5">Daily Limit</th>
                              <th className="p-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                            {adminUsersList.map((user) => {
                              const isUserAdmin = user.email && user.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
                              return (
                                <tr 
                                  key={user.id} 
                                  onClick={() => handleOpenUserDetailModal(user)}
                                  className="text-xs text-slate-700 dark:text-zinc-300 font-medium hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer"
                                >
                                  <td className="p-2.5 font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                                    <span>{user.name}</span>
                                    {user.isSuspended && (
                                      <span className="text-[8px] font-black tracking-wider px-1 py-0.2 bg-rose-500/10 text-rose-600 dark:text-rose-400 uppercase rounded">
                                        Suspended
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5 font-mono">{user.mobileNumber}</td>
                                  <td className="p-2.5">{user.email || <span className="text-slate-400 italic">none</span>}</td>
                                  <td className="p-2.5 font-mono text-blue-600 dark:text-blue-400 font-bold">{user.password}</td>
                                  <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                                    {isUserAdmin ? (
                                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded">
                                        No Limit
                                      </span>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateUserLimit(user.id, Math.max(0, (user.dailyLimit ?? 5) - 1))}
                                          className="w-5 h-5 flex items-center justify-center border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer font-bold select-none"
                                          title="Decrease Limit"
                                        >
                                          -
                                        </button>
                                        <span className="w-5 text-center font-bold font-mono text-slate-800 dark:text-zinc-200">
                                          {user.dailyLimit ?? 5}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateUserLimit(user.id, (user.dailyLimit ?? 5) + 1)}
                                          className="w-5 h-5 flex items-center justify-center border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer font-bold select-none"
                                          title="Increase Limit"
                                        >
                                          +
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                                    {isUserAdmin ? (
                                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                                        Protected
                                      </span>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleSuspendUser(user.id, !!user.isSuspended)}
                                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
                                            user.isSuspended
                                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                                          }`}
                                        >
                                          {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteUser(user.id)}
                                          className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded transition-all cursor-pointer"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer status */}
              <div className="px-4 py-2.5 border-t border-slate-100 dark:border-zinc-900/80 bg-white/60 dark:bg-zinc-950/60 relative z-10 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase">
                <span>Secure User DB Portal</span>
                <span>Active count: {adminUsersList.length}</span>
              </div>
            </motion.div>
          </div>
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

      {/* 👤 SELECTED USER DETAIL & EDIT MODAL */}
      <AnimatePresence>
        {selectedUserForModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative bg-white dark:bg-zinc-950 shadow-[0_32px_64px_rgba(30,41,59,0.3)] border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden w-full max-w-md rounded-[5px] text-black dark:text-white font-sans"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

              {/* Header */}
              <div className="p-3.5 border-b border-slate-100 dark:border-zinc-900/80 flex items-center justify-between bg-white/60 dark:bg-zinc-950/60 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/10 rounded-[3px] text-emerald-600 dark:text-emerald-400">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-extrabold text-xs tracking-tight uppercase">
                    {isEditingSelectedUser ? 'Edit User Profile' : 'User Information'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserForModal(null)}
                  className="p-1 rounded-[3px] hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 max-h-[70vh] overflow-y-auto">
                {isEditingSelectedUser ? (
                  /* EDIT MODE FORM */
                  <form onSubmit={handleEditUserSubmit} className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={editUserName}
                          onChange={(e) => setEditUserName(e.target.value)}
                          className="block w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-[5px] text-xs bg-white dark:bg-black/40 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-black dark:text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                          Mobile Number
                        </label>
                        <input
                          type="text"
                          required
                          value={editUserMobileNumber}
                          onChange={(e) => setEditUserMobileNumber(e.target.value)}
                          className="block w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-[5px] text-xs bg-white dark:bg-black/40 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-black dark:text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={editUserEmail}
                          onChange={(e) => setEditUserEmail(e.target.value)}
                          placeholder="e.g. user@example.com"
                          className="block w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-[5px] text-xs bg-white dark:bg-black/40 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-black dark:text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                          Passcode / Password
                        </label>
                        <input
                          type="text"
                          required
                          value={editUserPassword}
                          onChange={(e) => setEditUserPassword(e.target.value)}
                          className="block w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-[5px] text-xs bg-white dark:bg-black/40 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-black dark:text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                          Daily Extraction Limit
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setEditUserDailyLimit(prev => Math.max(0, prev - 1))}
                            className="w-8 h-8 flex items-center justify-center border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer font-bold select-none text-sm"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-bold font-mono text-sm text-slate-800 dark:text-zinc-200">
                            {editUserDailyLimit}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditUserDailyLimit(prev => prev + 1)}
                            className="w-8 h-8 flex items-center justify-center border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer font-bold select-none text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-zinc-900/50 pt-4 mt-4">
                      <button
                        type="button"
                        onClick={() => setIsEditingSelectedUser(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900 rounded-[5px] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingUserDetail}
                        className="px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[5px] shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        {isUpdatingUserDetail && <Loader2 className="w-3 h-3 animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  /* VIEW MODE */
                  <div className="space-y-5">
                    <div className="flex items-center gap-4 border-b border-slate-100 dark:border-zinc-900 pb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-600 dark:text-zinc-400 font-black text-lg shadow-inner">
                        {selectedUserForModal.name ? selectedUserForModal.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100 leading-tight">
                          {selectedUserForModal.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5 uppercase tracking-wider">
                          ID: {selectedUserForModal.id}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                          Mobile Number
                        </span>
                        <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                          {selectedUserForModal.mobileNumber}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                          Email Address
                        </span>
                        <span className="text-slate-800 dark:text-zinc-200 truncate block">
                          {selectedUserForModal.email || <span className="text-slate-400 italic font-normal">None</span>}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                          Passcode / PIN
                        </span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {selectedUserForModal.password}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                          Daily Extraction Limit
                        </span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200 font-mono">
                          {selectedUserForModal.dailyLimit ?? 5} extractions
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                          Account Status
                        </span>
                        {selectedUserForModal.isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            Suspended (স্থগিত করা হয়েছে)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active (সক্রিয়)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Three Action Buttons: Delete, Suspend, Edit */}
                    <div className="border-t border-slate-100 dark:border-zinc-900/50 pt-4 mt-6 flex gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteFromPopup}
                        className="flex-1 py-2 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 dark:border-rose-900/50 rounded-[4px] transition-all cursor-pointer"
                      >
                        Delete
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleToggleSuspendFromPopup}
                        className={`flex-1 py-2 text-xs font-bold border rounded-[4px] transition-all cursor-pointer ${
                          selectedUserForModal.isSuspended
                            ? 'text-emerald-600 hover:text-white hover:bg-emerald-600 border-emerald-200 dark:border-emerald-900/50'
                            : 'text-amber-600 hover:text-white hover:bg-amber-600 border-amber-200 dark:border-amber-900/50'
                        }`}
                      >
                        {selectedUserForModal.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsEditingSelectedUser(true)}
                        className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-[4px] shadow-sm transition-all cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

