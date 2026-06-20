import { useState, useCallback } from 'react';
import { HistoryItem, PassportData } from '../types';

export function usePassportHistory(options?: {
  onItemAdded?: (item: HistoryItem) => void;
  onItemDeleted?: (id: string) => void;
}) {
  const [history, setInternalHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('passport_core_history');
      if (saved && saved !== 'undefined' && saved.trim() !== '') {
        return JSON.parse(saved);
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
    localStorage.setItem('passport_core_history', JSON.stringify(newHistory));
  }, []);

  const addToHistory = useCallback((data: PassportData) => {
    const id = Date.now().toString();
    const timestamp = Date.now();
    const newItem: HistoryItem = { id, timestamp, data };
    
    const newHistory = [newItem, ...history];
    setInternalHistory(newHistory);
    localStorage.setItem('passport_core_history', JSON.stringify(newHistory));

    if (options?.onItemAdded) {
      options.onItemAdded(newItem);
    }
  }, [history, options]);

  const deleteHistoryItem = useCallback((id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setInternalHistory(newHistory);
    localStorage.setItem('passport_core_history', JSON.stringify(newHistory));

    if (options?.onItemDeleted) {
      options.onItemDeleted(id);
    }
  }, [history, options]);

  const clearHistory = useCallback(() => {
    setInternalHistory([]);
    localStorage.setItem('passport_core_history', JSON.stringify([]));
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
