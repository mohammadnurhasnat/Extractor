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
import { WelcomeModal } from './components/WelcomeModal';
import { GlobalProgress } from './components/GlobalProgress';

// Utilities
import { generateDataText } from './utils/addressUtils';
import { generatePDF, getPDFDocument, generateUndertakingPDF } from './utils/pdfGenerator';

import { useUndertakingState } from './hooks/useUndertakingState';
import { useSessionQueue } from './hooks/useSessionQueue';
import { useAppSettings } from './hooks/useAppSettings';
import { usePassportHistory } from './hooks/usePassportHistory';
import { useSupabase } from './hooks/useSupabase';
import { useAuth } from './lib/AuthContext';
import { useExporterHelpers } from './hooks/useExporterHelpers';
import { useAddressGeneration } from './hooks/useAddressGeneration';
import { useSavedOptions } from './hooks/useSavedOptions';
import { useSupabaseCloudSync } from './hooks/useSupabaseCloudSync';
import { useQueueHandlers } from './hooks/useQueueHandlers';

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

  const {
    isSyncingCloud,
    cloudSyncStatusText,
    handleFetchFromCloud,
    handleSyncToCloud
  } = useSupabaseCloudSync({ supabase, history, setHistory });

  const [resultsTab, setResultsTab] = useState<'profile' | 'undertaking' | 'passport-pdf'>(() => {
    return (localStorage.getItem('passport_active_results_tab') as 'profile' | 'undertaking' | 'passport-pdf') || 'profile';
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

  const { isGeneratingAddresses, handleGenerateAddresses } = useAddressGeneration({
    data, setData, userApiKey, activeQueueId, setQueue, setHistory, setToast
  });

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
  const executeDelete = (e: React.MouseEvent) => { e.stopPropagation(); if (itemToDelete) deleteHistoryItem(itemToDelete); setItemToDelete(null); };
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
      <GlobalProgress loading={loading} />

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

      {!user && <WelcomeModal signInWithGoogle={signInWithGoogle} />}

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

