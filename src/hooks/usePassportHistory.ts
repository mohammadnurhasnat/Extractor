import { useState, useCallback, useEffect, useRef } from 'react';
import { HistoryItem, PassportData } from '../types';
import { encryptData, decryptData } from '../utils/crypto';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, writeBatch, query, orderBy, onSnapshot } from 'firebase/firestore';

export function usePassportHistory(userId: string | null, options?: {
  onItemAdded?: (item: HistoryItem) => void;
  onItemDeleted?: (id: string) => void;
}) {
  const [history, setInternalHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const latestHistoryRef = useRef<HistoryItem[]>([]);

  useEffect(() => {
    latestHistoryRef.current = history;
  }, [history]);

  // Fallback to local storage if no user
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

    // Load from Firestore if user exists
    const historyRef = collection(db, `users/${userId}/history`);
    const q = query(historyRef, orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedHistory: HistoryItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as HistoryItem;
        fetchedHistory.push(data);
      });
      setInternalHistory(fetchedHistory);
      latestHistoryRef.current = fetchedHistory;
    }, (error) => {
      console.error("Error fetching history from Firestore:", error);
    });

    return () => unsubscribe();
  }, [userId]);

  const saveHistory = useCallback(async (newHistory: HistoryItem[]) => {
    setInternalHistory(newHistory);
    latestHistoryRef.current = newHistory;
    if (!userId) {
      localStorage.setItem('passport_core_history', encryptData(newHistory));
      return;
    }
    
    const batch = writeBatch(db);
    const historyRef = collection(db, `users/${userId}/history`);
    
    newHistory.forEach(item => {
      const docRef = doc(historyRef, item.id);
      batch.set(docRef, item);
    });
    
    try {
      await batch.commit();
    } catch (e) {
      console.error("Error saving history batch:", e);
    }
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

    // Update state and local storage immediately
    setInternalHistory(updatedHistory);
    latestHistoryRef.current = updatedHistory;

    if (!userId) {
      localStorage.setItem('passport_core_history', encryptData(updatedHistory));
    } else {
      try {
        const docRef = doc(db, `users/${userId}/history`, itemToSave.id);
        await setDoc(docRef, itemToSave);
      } catch (err) {
        console.error("Failed to save history to Firestore:", err);
      }
    }

    if (options?.onItemAdded) {
      options.onItemAdded(itemToSave);
    }

    return itemToSave.data;
  }, [userId, options]);

  const deleteHistoryItem = useCallback(async (id: string) => {
    setInternalHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      if (!userId) {
        localStorage.setItem('passport_core_history', encryptData(newHistory));
      }
      return newHistory;
    });

    if (userId) {
      try {
        await deleteDoc(doc(db, `users/${userId}/history`, id));
      } catch (e) {
        console.error("Error deleting document:", e);
      }
    }

    if (options?.onItemDeleted) {
      options.onItemDeleted(id);
    }
  }, [userId, options]);

  const clearHistory = useCallback(async () => {
    // Delete all from firestore
    if (userId) {
      try {
        const historyRef = collection(db, `users/${userId}/history`);
        const snapshot = await getDocs(historyRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
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
