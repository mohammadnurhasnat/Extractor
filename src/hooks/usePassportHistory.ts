import { useState, useCallback, useEffect } from 'react';
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

  // Fallback to local storage if no user
  useEffect(() => {
    if (!userId) {
      try {
        const saved = localStorage.getItem('passport_core_history');
        if (saved && saved !== 'undefined' && saved.trim() !== '') {
          const decrypted = decryptData(saved);
          setInternalHistory(Array.isArray(decrypted) ? decrypted : []);
        } else {
          setInternalHistory([]);
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
        // Data might be encrypted if we want to store securely, but let's just store as-is or encrypt before save.
        // Actually, to keep it simple and searchable (partially), we could store raw. 
        // But for privacy, maybe encrypt? Let's assume raw or parsed.
        // The previous code encrypted it in local storage. Let's keep it raw in Firestore, protected by security rules.
        const data = doc.data() as HistoryItem;
        fetchedHistory.push(data);
      });
      setInternalHistory(fetchedHistory);
    }, (error) => {
      console.error("Error fetching history from Firestore:", error);
    });

    return () => unsubscribe();
  }, [userId]);

  const saveHistory = useCallback(async (newHistory: HistoryItem[]) => {
    setInternalHistory(newHistory);
    if (!userId) {
      localStorage.setItem('passport_core_history', encryptData(newHistory));
      return;
    }
    
    // We should probably handle this better, but this is a direct replacement for setHistory
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

  const addToHistory = useCallback(async (data: PassportData): Promise<PassportData> => {
    let returnData: PassportData = data;
    
    // We update local state optimistically, then write to Firebase (or localStorage)
    const updateLogic = (prev: HistoryItem[]) => {
      const existingItemIndex = prev.findIndex(item => {
        const hasSamePassport = item.data.passportNumber && data.passportNumber && item.data.passportNumber.toUpperCase() === data.passportNumber.toUpperCase();
        
        // Normalize names for comparison
        const itemGivenName = (item.data.givenName || '').trim().toUpperCase();
        const dataGivenName = (data.givenName || '').trim().toUpperCase();
        const itemSurname = (item.data.surname || '').trim().toUpperCase();
        const dataSurname = (data.surname || '').trim().toUpperCase();
        
        const hasSameName = itemGivenName === dataGivenName && itemSurname === dataSurname;
        
        return hasSamePassport && hasSameName;
      });

      let newHistory: HistoryItem[];
      let updatedOldItem: HistoryItem | null = null;
      let newItem: HistoryItem | null = null;

      if (existingItemIndex >= 0) {
        const existingItem = prev[existingItemIndex];
        
        const updatedData = {
          ...existingItem.data,
          ...data,
          extractionTime: data.extractionTime || existingItem.data.extractionTime || existingItem.extractionTime
        };

        updatedOldItem = {
          ...existingItem,
          timestamp: Date.now(),
          data: updatedData,
          extractionTime: data.extractionTime || existingItem.extractionTime
        };
        returnData = updatedData;

        const filtered = prev.filter((_, idx) => idx !== existingItemIndex);
        newHistory = [updatedOldItem, ...filtered];
      } else {
        const id = Date.now().toString();
        const timestamp = Date.now();
        newItem = { 
          id, 
          timestamp, 
          data, 
          extractionTime: data.extractionTime 
        };
        
        newHistory = [newItem, ...prev];
      }
      
      return { newHistory, updatedOldItem, newItem };
    };

    setInternalHistory(prev => {
      const { newHistory, updatedOldItem, newItem } = updateLogic(prev);
      
      // Handle side effects outside state update, but for now we do it here or immediately after.
      // Since setInternalHistory doesn't allow async inside easily without messy closures,
      // we'll just run it synchronously for UI, and fire the DB write.
      
      if (!userId) {
        localStorage.setItem('passport_core_history', encryptData(newHistory));
      } else {
        // Fire and forget DB write
        const itemToSave = updatedOldItem || newItem;
        if (itemToSave) {
          const docRef = doc(db, `users/${userId}/history`, itemToSave.id);
          setDoc(docRef, itemToSave).catch(console.error);
        }
      }

      if (updatedOldItem && options?.onItemAdded) options.onItemAdded(updatedOldItem);
      if (newItem && options?.onItemAdded) options.onItemAdded(newItem);

      return newHistory;
    });

    return returnData;
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
