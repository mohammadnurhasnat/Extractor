import { Router } from 'express';
import { 
  getUsersStore, 
  getLocalHistory, 
  saveLocalHistory, 
  deleteLocalHistoryItem, 
  clearLocalHistory, 
  getLimitStatus, 
  getDb 
} from './db';

export const historyRouter = Router();

historyRouter.get('/limit-status/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const status = getLimitStatus(userId);
    res.json({ success: true, ...status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch limit status' });
  }
});

historyRouter.get('/history', async (req, res) => {
  try {
    const userId = req.query.userId?.toString();
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    const requesterId = req.headers['x-user-id']?.toString();
    if (!requesterId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    
    const users = getUsersStore();
    const adminUser = users.find(u => u.id === requesterId);
    const isAdmin = adminUser && adminUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
    
    if (requesterId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    const db = getDb();
    if (!db) {
      const historyItems = getLocalHistory(userId);
      return res.json({ success: true, history: historyItems });
    }

    try {
      const snapshot = await db.collection('users').doc(userId).collection('history').orderBy('timestamp', 'desc').get();
      const historyItems: any[] = [];
      snapshot.forEach((doc: any) => {
        historyItems.push(doc.data());
      });
      return res.json({ success: true, history: historyItems });
    } catch (firestoreError: any) {
      console.warn('Firestore fetch failed, falling back to local history storage:', firestoreError.message || firestoreError);
      // We can't easily mutate the main file's db to null here, but we can fall back
      const historyItems = getLocalHistory(userId);
      return res.json({ success: true, history: historyItems });
    }
  } catch (error: any) {
    console.error('Failed to fetch history:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch history.' });
  }
});

historyRouter.post('/history', async (req, res) => {
  try {
    const { userId, item } = req.body;
    if (!userId || !item || !item.id) {
      return res.status(400).json({ success: false, error: 'User ID and history item with ID are required.' });
    }

    const requesterId = req.headers['x-user-id']?.toString();
    if (!requesterId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    
    const users = getUsersStore();
    const adminUser = users.find(u => u.id === requesterId);
    const isAdmin = adminUser && adminUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
    
    if (requesterId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    const db = getDb();
    if (!db) {
      saveLocalHistory(userId, item);
      return res.json({ success: true });
    }

    try {
      await db.collection('users').doc(userId).collection('history').doc(item.id).set(item);
      return res.json({ success: true });
    } catch (firestoreError: any) {
      console.warn('Firestore write failed, falling back to local history storage:', firestoreError.message || firestoreError);
      saveLocalHistory(userId, item);
      return res.json({ success: true });
    }
  } catch (error: any) {
    console.error('Failed to save history:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to save history.' });
  }
});

historyRouter.delete('/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId?.toString();
    if (!id || !userId) {
      return res.status(400).json({ success: false, error: 'History item ID and User ID are required.' });
    }

    const requesterId = req.headers['x-user-id']?.toString();
    if (!requesterId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    
    const users = getUsersStore();
    const adminUser = users.find(u => u.id === requesterId);
    const isAdmin = adminUser && adminUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
    
    if (requesterId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    const db = getDb();
    if (!db) {
      deleteLocalHistoryItem(userId, id);
      return res.json({ success: true });
    }

    try {
      await db.collection('users').doc(userId).collection('history').doc(id).delete();
      return res.json({ success: true });
    } catch (firestoreError: any) {
      console.warn('Firestore delete failed, falling back to local history storage:', firestoreError.message || firestoreError);
      deleteLocalHistoryItem(userId, id);
      return res.json({ success: true });
    }
  } catch (error: any) {
    console.error('Failed to delete history item:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete history item.' });
  }
});

historyRouter.post('/history/clear', async (req, res) => {
  try {
    const userId = req.query.userId?.toString();
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    const requesterId = req.headers['x-user-id']?.toString();
    if (!requesterId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    
    const users = getUsersStore();
    const adminUser = users.find(u => u.id === requesterId);
    const isAdmin = adminUser && adminUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
    
    if (requesterId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    const db = getDb();
    if (!db) {
      clearLocalHistory(userId);
      return res.json({ success: true });
    }

    try {
      const snapshot = await db.collection('users').doc(userId).collection('history').get();
      const batch = db.batch();
      snapshot.forEach((doc: any) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      return res.json({ success: true });
    } catch (firestoreError: any) {
      console.warn('Firestore clear failed, falling back to local history storage:', firestoreError.message || firestoreError);
      clearLocalHistory(userId);
      return res.json({ success: true });
    }
  } catch (error: any) {
    console.error('Failed to clear history:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to clear history.' });
  }
});
