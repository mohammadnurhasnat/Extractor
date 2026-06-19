import { useState, useCallback, useEffect } from 'react';
import { HistoryItem, PassportData } from '../types';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export function usePassportHistory() {
  const { user } = useAuth();
  const [history, setInternalHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('passport_core_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load history", e);
    }
    return [];
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Sync from firestore when user changes
  useEffect(() => {
    async function fetchHistory() {
      if (user) {
        try {
          const q = query(collection(db, 'histories'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const userHistory: HistoryItem[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            userHistory.push({
              id: doc.id,
              timestamp: data.timestamp,
              data: data.data,
            });
          });
          // sort by timestamp descending
          userHistory.sort((a, b) => b.timestamp - a.timestamp);
          setInternalHistory(userHistory);
          localStorage.setItem('passport_core_history', JSON.stringify(userHistory));
        } catch (error) {
          console.error("Error fetching history from Firestore", error);
        }
      }
    }
    fetchHistory();
  }, [user]);

  const saveHistory = useCallback(async (newHistory: HistoryItem[]) => {
    setInternalHistory(newHistory);
    localStorage.setItem('passport_core_history', JSON.stringify(newHistory));
  }, []);

  const addToHistory = useCallback(async (data: PassportData) => {
    const id = Date.now().toString();
    const timestamp = Date.now();
    const newItem: HistoryItem = { id, timestamp, data };
    
    const newHistory = [newItem, ...history];
    setInternalHistory(newHistory);
    localStorage.setItem('passport_core_history', JSON.stringify(newHistory));

    if (user) {
      try {
        await setDoc(doc(collection(db, 'histories'), id), {
          userId: user.uid,
          timestamp,
          data
        });
      } catch (e) {
        console.error("Error saving to Firestore", e);
      }
    }
  }, [history, user]);

  const deleteHistoryItem = useCallback(async (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setInternalHistory(newHistory);
    localStorage.setItem('passport_core_history', JSON.stringify(newHistory));

    if (user) {
      try {
        await deleteDoc(doc(db, 'histories', id));
      } catch (e) {
        console.error("Error deleting from Firestore", e);
      }
    }
  }, [history, user]);

  const clearHistory = useCallback(async () => {
    const ids = history.map(h => h.id);
    setInternalHistory([]);
    localStorage.setItem('passport_core_history', JSON.stringify([]));

    if (user && ids.length > 0) {
      try {
        const batch = writeBatch(db);
        ids.forEach(id => {
          batch.delete(doc(db, 'histories', id));
        });
        await batch.commit();
      } catch (e) {
        console.error("Error clearing history in Firestore", e);
      }
    }
  }, [history, user]);

  return {
    history, setHistory: saveHistory,
    addToHistory,
    deleteHistoryItem,
    clearHistory,
    searchTerm, setSearchTerm,
    itemToDelete, setItemToDelete
  };
}
