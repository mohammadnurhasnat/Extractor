import { useState, useCallback, useEffect, useRef } from 'react';
import { HistoryItem, PassportData } from '../types';
import { encryptData, decryptData } from '../utils/crypto';
import { safeFetchJson } from '../utils/api';

export function usePassportHistory(userId: string | null, options?: {
  onItemAdded?: (item: HistoryItem) => void;
  onItemDeleted?: (id: string) => void;
}) {
  const [history, setInternalHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const latestHistoryRef = useRef<HistoryItem[]>([]);
  const syncTimeoutRef = useRef<any>(null);
  const lastFetchTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    latestHistoryRef.current = history;
  }, [history]);

  // Fallback to local storage if no user, or fetch from custom API if user exists
  useEffect(() => {
    if (!userId) {
      try {
        const saved = localStorage.getItem('passport_core_history');
        if (saved && saved !== 'undefined' && saved.trim() !== '') {
          const decrypted = decryptData(saved);
          const historyArr = Array.isArray(decrypted) ? decrypted : [];
          setInternalHistory(historyArr);
          latestHistoryRef.current = historyArr;
        } else {
          setInternalHistory([]);
          latestHistoryRef.current = [];
        }
      } catch (e) {
        console.error("Failed to load history from local storage", e);
      }
      return;
    }

    const isSameHistory = (a: HistoryItem[], b: HistoryItem[]) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i].id !== b[i].id || a[i].timestamp !== b[i].timestamp) return false;
      }
      return true;
    };

    // Load from Express Proxy API (Neon PostgreSQL / Firestore)
    const fetchHistory = async (force: boolean = false) => {
      const now = Date.now();
      if (!force && now - lastFetchTimeRef.current < 5000) {
        return; // Throttle frequent focus event calls
      }
      lastFetchTimeRef.current = now;

      try {
        const { ok, data: resData } = await safeFetchJson(`/api/history?userId=${encodeURIComponent(userId)}`, {
          headers: {
            'x-user-id': userId
          }
        });
        if (ok && resData && resData.success && Array.isArray(resData.history)) {
          const fetchedHistory = resData.history.map((item: any) => {
            let cachedImage = '';
            try {
              const stored = localStorage.getItem(`passport_img_${item.id}`);
              if (stored) {
                cachedImage = decryptData(stored) || '';
              }
            } catch (e) {
              console.error("Failed to load cached image:", e);
            }
            return {
              ...item,
              imageBase64: cachedImage || item.imageBase64 || ''
            };
          });
          
          if (!isSameHistory(fetchedHistory, latestHistoryRef.current)) {
            setInternalHistory(fetchedHistory);
            latestHistoryRef.current = fetchedHistory;
          }
        }
      } catch (err) {
        console.error("Error fetching history from API:", err);
      }
    };

    // Load initial history with force=true
    fetchHistory(true);

    const handleFocus = () => {
      fetchHistory(false);
    };

    const handleCustomUpdate = () => {
      fetchHistory(true);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('app_history_updated', handleCustomUpdate);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('app_history_updated', handleCustomUpdate);
    };
  }, [userId]);

  const saveHistory = useCallback((newHistoryOrUpdater: HistoryItem[] | ((prev: HistoryItem[]) => HistoryItem[])) => {
    let resolvedHistory: HistoryItem[];
    if (typeof newHistoryOrUpdater === 'function') {
      resolvedHistory = newHistoryOrUpdater(latestHistoryRef.current);
    } else {
      resolvedHistory = newHistoryOrUpdater;
    }

    setInternalHistory(resolvedHistory);
    latestHistoryRef.current = resolvedHistory;

    if (!userId) {
      localStorage.setItem('passport_core_history', encryptData(resolvedHistory));
      return;
    }

    // Cache images locally if present
    for (const item of resolvedHistory) {
      if (item.imageBase64) {
        try {
          localStorage.setItem(`passport_img_${item.id}`, encryptData(item.imageBase64));
        } catch (e) {}
      }
    }

    // Debounce backend sync on repeated edits (e.g. typing)
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const itemsToSync = resolvedHistory.map(item => {
          const { imageBase64: _, ...firestoreData } = item;
          return firestoreData;
        });

        await safeFetchJson('/api/history/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
          },
          body: JSON.stringify({
            userId,
            items: itemsToSync
          })
        });
      } catch (e) {
        console.error("Error saving history batch:", e);
      }
    }, 1000); // 1 second debounce
  }, [userId]);

  const addToHistory = useCallback(async (data: PassportData, imageBase64?: string): Promise<PassportData> => {
    const prevHistory = latestHistoryRef.current;
    
    // Find if passport already exists using passport number as primary identifier
    const existingItemIndex = prevHistory.findIndex(item => {
      const itemPass = (item.data.passportNumber || '').trim().toUpperCase();
      const dataPass = (data.passportNumber || '').trim().toUpperCase();
      
      const hasSamePassport = itemPass && dataPass && itemPass === dataPass;
      
      const itemGivenName = (item.data.givenName || '').trim().toUpperCase();
      const dataGivenName = (data.givenName || '').trim().toUpperCase();
      const itemSurname = (item.data.surname || '').trim().toUpperCase();
      const dataSurname = (data.surname || '').trim().toUpperCase();
      
      const hasSameName = itemGivenName && dataGivenName && itemGivenName === dataGivenName && itemSurname === dataSurname;
      
      if (itemPass && dataPass) {
        return hasSamePassport; // Unique identifier is the passport number!
      }
      return hasSameName; // Fallback to name match if passport number is missing
    });

    const timestamp = Date.now();
    let itemToSave: HistoryItem;
    let updatedHistory: HistoryItem[];

    if (existingItemIndex >= 0) {
      const existingItem = prevHistory[existingItemIndex];
      const updatedData = {
        ...existingItem.data,
        ...data,
        extractionTime: data.extractionTime || existingItem.data.extractionTime || existingItem.extractionTime
      };

      itemToSave = {
        ...existingItem,
        timestamp,
        data: updatedData,
        extractionTime: data.extractionTime || existingItem.extractionTime,
        imageBase64: imageBase64 || existingItem.imageBase64
      };

      const filtered = prevHistory.filter((_, idx) => idx !== existingItemIndex);
      updatedHistory = [itemToSave, ...filtered];
    } else {
      itemToSave = {
        id: 'hist_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp,
        data,
        extractionTime: data.extractionTime,
        imageBase64: imageBase64
      };
      updatedHistory = [itemToSave, ...prevHistory];
    }

    // Cache the image locally to stay under 1MB Firestore document limit
    if (itemToSave.imageBase64) {
      try {
        localStorage.setItem(`passport_img_${itemToSave.id}`, encryptData(itemToSave.imageBase64));
      } catch (err) {
        console.warn("Local storage quota exceeded, cannot cache image locally:", err);
      }
    }

    // Update state and local storage immediately
    setInternalHistory(updatedHistory);
    latestHistoryRef.current = updatedHistory;

    if (!userId) {
      localStorage.setItem('passport_core_history', encryptData(updatedHistory));
    } else {
      try {
        // Strip imageBase64 from Firestore payload
        const { imageBase64: _, ...firestoreData } = itemToSave;
        await safeFetchJson('/api/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
          },
          body: JSON.stringify({
            userId,
            item: firestoreData
          })
        });
      } catch (err) {
        console.error("Failed to save history to database:", err);
      }
    }

    if (options?.onItemAdded) {
      options.onItemAdded(itemToSave);
    }

    return itemToSave.data;
  }, [userId, options]);

  const deleteHistoryItem = useCallback(async (id: string) => {
    // Delete local cached image
    try {
      localStorage.removeItem(`passport_img_${id}`);
    } catch (e) {}

    setInternalHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      if (!userId) {
        localStorage.setItem('passport_core_history', encryptData(newHistory));
      }
      return newHistory;
    });

    if (userId) {
      try {
        await safeFetchJson(`/api/history/${id}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': userId
          }
        });
      } catch (e) {
        console.error("Error deleting document:", e);
      }
    }

    if (options?.onItemDeleted) {
      options.onItemDeleted(id);
    }
  }, [userId, options]);

  const clearHistory = useCallback(async () => {
    // Clear all locally cached passport images
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('passport_img_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {}

    // Delete all from firestore
    if (userId) {
      try {
        await safeFetchJson(`/api/history/clear?userId=${encodeURIComponent(userId)}`, {
          method: 'POST',
          headers: {
            'x-user-id': userId
          }
        });
      } catch (e) {
        console.error("Error clearing history:", e);
      }
    } else {
      localStorage.setItem('passport_core_history', encryptData([]));
    }
    setInternalHistory([]);
  }, [userId]);

  return {
    history, setHistory: saveHistory,
    addToHistory,
    deleteHistoryItem,
    clearHistory,
    searchTerm, setSearchTerm,
    itemToDelete, setItemToDelete
  };
}
