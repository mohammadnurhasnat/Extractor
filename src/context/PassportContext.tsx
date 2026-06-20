import React, { createContext, useContext, useState, useEffect } from 'react';
import { PassportData, QueueItem, HistoryItem, UndertakingFormData } from '../types';

interface PassportContextType {
  data: PassportData | null;
  setData: React.Dispatch<React.SetStateAction<PassportData | null>>;
  queue: QueueItem[];
  setQueue: React.Dispatch<React.SetStateAction<QueueItem[]>>;
  activeQueueId: string | null;
  setActiveQueueId: React.Dispatch<React.SetStateAction<string | null>>;
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  preview: string | null;
  setPreview: React.Dispatch<React.SetStateAction<string | null>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const PassportContext = createContext<PassportContextType | undefined>(undefined);

export const PassportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(() => localStorage.getItem('passport_active_preview') || null);
  const [data, setData] = useState<PassportData | null>(() => {
    try {
      const saved = localStorage.getItem('passport_active_data');
      if (saved && saved !== 'undefined' && saved.trim() !== '') return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);

  useEffect(() => {
    if (data) localStorage.setItem('passport_active_data', JSON.stringify(data));
    else localStorage.removeItem('passport_active_data');
  }, [data]);

  useEffect(() => {
    if (preview) localStorage.setItem('passport_active_preview', preview);
    else localStorage.removeItem('passport_active_preview');
  }, [preview]);

  return (
    <PassportContext.Provider value={{
      data, setData, queue, setQueue, activeQueueId, setActiveQueueId, file, setFile, preview, setPreview, error, setError
    }}>
      {children}
    </PassportContext.Provider>
  );
};

export const usePassportContext = () => {
  const context = useContext(PassportContext);
  if (!context) throw new Error('usePassportContext must be used within a PassportProvider');
  return context;
};
