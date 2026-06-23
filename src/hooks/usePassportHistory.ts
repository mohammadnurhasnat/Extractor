import { useState, useCallback } from 'react';
import { HistoryItem, PassportData } from '../types';
import { encryptData, decryptData } from '../utils/crypto';

export function usePassportHistory(options?: {
  onItemAdded?: (item: HistoryItem) => void;
  onItemDeleted?: (id: string) => void;
}) {
  const [history, setInternalHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('passport_core_history');
      if (saved && saved !== 'undefined' && saved.trim() !== '') {
        const decrypted = decryptData(saved);
        return Array.isArray(decrypted) ? decrypted : [];
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
    return [];
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const saveHistory = useCallback((newHistory: HistoryItem[]) => {
    setInternalHistory(newHistory);
    localStorage.setItem('passport_core_history', encryptData(newHistory));
  }, []);

  const addToHistory = useCallback((data: PassportData): PassportData => {
    let returnData: PassportData = data;
    setInternalHistory(prev => {
      const existingItemIndex = prev.findIndex(item => 
         item.data.passportNumber && 
         data.passportNumber && 
         item.data.passportNumber.toUpperCase() === data.passportNumber.toUpperCase()
      );

      let newHistory: HistoryItem[];

      if (existingItemIndex >= 0) {
        const existingItem = prev[existingItemIndex];
        
        const updatedOldItem = {
          ...existingItem,
          timestamp: Date.now()
        };
        returnData = existingItem.data; // Use the OLD data

        const filtered = prev.filter((_, idx) => idx !== existingItemIndex);
        newHistory = [updatedOldItem, ...filtered];

        if (options?.onItemAdded) {
          options.onItemAdded(updatedOldItem);
        }
      } else {
        const id = Date.now().toString();
        const timestamp = Date.now();
        const newItem: HistoryItem = { id, timestamp, data };
        
        newHistory = [newItem, ...prev];

        if (options?.onItemAdded) {
          options.onItemAdded(newItem);
        }
      }

      localStorage.setItem('passport_core_history', encryptData(newHistory));
      return newHistory;
    });
    return returnData;
  }, [options]);

  const deleteHistoryItem = useCallback((id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setInternalHistory(newHistory);
    localStorage.setItem('passport_core_history', encryptData(newHistory));

    if (options?.onItemDeleted) {
      options.onItemDeleted(id);
    }
  }, [history, options]);

  const clearHistory = useCallback(() => {
    setInternalHistory([]);
    localStorage.setItem('passport_core_history', encryptData([]));
  }, []);

  return {
    history, setHistory: saveHistory,
    addToHistory,
    deleteHistoryItem,
    clearHistory,
    searchTerm, setSearchTerm,
    itemToDelete, setItemToDelete
  };
}
