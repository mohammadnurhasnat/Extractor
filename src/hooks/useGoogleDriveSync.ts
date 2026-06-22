import { useEffect, useState, useRef, useCallback } from 'react';
import { HistoryItem } from '../types';

interface UseGoogleDriveSyncProps {
  user: any;
  accessToken: string | null;
  history: HistoryItem[];
  setHistory: (newHistory: HistoryItem[]) => void;
}

export function useGoogleDriveSync({ user, accessToken, history, setHistory }: UseGoogleDriveSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [hasCheckedCloud, setHasCheckedCloud] = useState(false);
  const [driveFileId, setDriveFileId] = useState<string | null>(null);

  // Use refs to avoid closure stale values
  const historyRef = useRef<HistoryItem[]>(history);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  // Find or create the backup file on Google Drive
  const findBackupFile = useCallback(async (token: string): Promise<string | null> => {
    try {
      const q = encodeURIComponent("name = 'passport_records_backup.json' and trashed = false");
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to query Google Drive (status ${res.status})`);
      }
      
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
      return null;
    } catch (e) {
      console.error("Error finding backup file on Google Drive:", e);
      return null;
    }
  }, []);

  const createBackupFile = useCallback(async (token: string, content: HistoryItem[]): Promise<string | null> => {
    try {
      // Step 1: Create metadata
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'passport_records_backup.json',
          mimeType: 'application/json',
        }),
      });

      if (!createRes.ok) {
        throw new Error('Failed to create backup file metadata');
      }

      const fileMetadata = await createRes.json();
      const fileId = fileMetadata.id;

      // Step 2: Upload media content to created fileId
      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload content to Google Drive');
      }

      return fileId;
    } catch (e) {
      console.error("Error creating backup file on Google Drive:", e);
      return null;
    }
  }, []);

  const updateBackupFile = useCallback(async (token: string, fileId: string, content: HistoryItem[]) => {
    try {
      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to update content on Google Drive');
      }
    } catch (e) {
      console.error("Error updating backup file on Google Drive:", e);
    }
  }, []);

  // Fetch / restore backup from Google Drive
  const handleRestore = useCallback(async () => {
    if (!user || !accessToken) return;
    setIsSyncing(true);
    setSyncStatus('গুগল ড্রাইভ থেকে ব্যাকআপ খোঁজা হচ্ছে...');

    try {
      const fileId = await findBackupFile(accessToken);
      if (fileId) {
        setDriveFileId(fileId);
        setSyncStatus('ব্যাকআপ ডেটা ডাউনলোড হচ্ছে...');
        
        const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (downloadRes.ok) {
          const cloudHistory = await downloadRes.json();
          if (Array.isArray(cloudHistory)) {
            // Overwrite or merge
            // We can do a smart timestamp-based merge to prevent any data loss
            const localHistory = historyRef.current;
            const mergedMap = new Map<string, HistoryItem>();
            
            // Add local first
            localHistory.forEach(item => mergedMap.set(item.id || item.timestamp.toString(), item));
            
            // Overwrite or add with cloud items if cloud is newer or doesn't exist locally
            cloudHistory.forEach(item => {
              const key = item.id || item.timestamp.toString();
              const existing = mergedMap.get(key);
              if (!existing || (item.timestamp > existing.timestamp)) {
                mergedMap.set(key, item);
              }
            });

            const mergedList = Array.from(mergedMap.values()).sort((a,b) => b.timestamp - a.timestamp);
            setHistory(mergedList);
            setSyncStatus('সফলভাবে ব্যাকআপ থেকে হিস্টোরি রিস্টোর করা হয়েছে!');
          } else {
            setSyncStatus('কোনো বৈধ ব্যাকআপ পাওয়া যায়নি।');
          }
        } else {
          setSyncStatus('ব্যাকআপ ডেটা ডাউনলোড ব্যর্থ হয়েছে।');
        }
      } else {
        setSyncStatus('গুগল ড্রাইভে কোনো পূর্ববর্তী ব্যাকআপ পাওয়া যায়নি। নতুন ব্যাকআপ ফাইল তৈরি করা হবে।');
      }
    } catch (error) {
      console.error("Restore error", error);
      setSyncStatus('রিস্টোর করতে ত্রুটি ঘটেছে।');
    } finally {
      setIsSyncing(false);
      setHasCheckedCloud(true);
    }
  }, [user, accessToken, findBackupFile, setHistory]);

  // Initial load check when user authenticates
  useEffect(() => {
    if (user && accessToken && !hasCheckedCloud) {
      handleRestore();
    } else if (!user) {
      setHasCheckedCloud(false);
      setDriveFileId(null);
    }
  }, [user, accessToken, hasCheckedCloud, handleRestore]);

  // Auto upload to Google Drive when local state changes (ONLY AFTER initial check is completed)
  useEffect(() => {
    if (!user || !accessToken || !hasCheckedCloud) return;

    const delayDebounce = setTimeout(async () => {
      setIsSyncing(true);
      setSyncStatus('গুগল ড্রাইভে স্বয়ংক্রিয় ব্যাকআপ হচ্ছে...');

      try {
        let currentFileId = driveFileId;
        if (!currentFileId) {
          currentFileId = await findBackupFile(accessToken);
        }

        if (currentFileId) {
          setDriveFileId(currentFileId);
          await updateBackupFile(accessToken, currentFileId, history);
          setSyncStatus('ব্যাকআপ সম্পন্ন হয়েছে!');
        } else {
          const newFileId = await createBackupFile(accessToken, history);
          if (newFileId) {
            setDriveFileId(newFileId);
            setSyncStatus('নতুন ব্যাকআপ ফাইল তৈরি ও ব্যাকআপ সম্পন্ন হয়েছে!');
          } else {
            setSyncStatus('ব্যাকআপ ফাইল তৈরি করা যায়নি।');
          }
        }
      } catch (error) {
        console.error("Auto backup error", error);
        setSyncStatus('স্বয়ংক্রিয় ব্যাকআপ ব্যর্থ হয়েছে।');
      } finally {
        setIsSyncing(false);
      }
    }, 1500); // Debounce to avoid excessive API requests during heavy edits

    return () => clearTimeout(delayDebounce);
  }, [history, user, accessToken, hasCheckedCloud, driveFileId, findBackupFile, createBackupFile, updateBackupFile]);

  // Manual Trigger
  const forceManualBackup = useCallback(async () => {
    if (!user || !accessToken) return;
    setIsSyncing(true);
    setSyncStatus('ব্যাকআপ ফাইল সিঙ্ক্রোনাইজ হচ্ছে...');
    try {
      let currentFileId = driveFileId;
      if (!currentFileId) {
        currentFileId = await findBackupFile(accessToken);
      }

      if (currentFileId) {
        await updateBackupFile(accessToken, currentFileId, historyRef.current);
        setSyncStatus('ম্যানুয়াল ব্যাকআপ সম্পূর্ণ!');
      } else {
        const newFileId = await createBackupFile(accessToken, historyRef.current);
        if (newFileId) {
          setDriveFileId(newFileId);
          setSyncStatus('ম্যানুয়াল ব্যাকআপ সম্পূর্ণ!');
        } else {
          setSyncStatus('ব্যাকআপ ফাইল তৈরি করতে ব্যর্থ।');
        }
      }
    } catch (e) {
      console.error(e);
      setSyncStatus('সিঙ্ক করতে সমস্যা হয়েছে।');
    } finally {
      setIsSyncing(false);
    }
  }, [user, accessToken, driveFileId, findBackupFile, updateBackupFile, createBackupFile]);

  return {
    isSyncing,
    syncStatus,
    handleRestore,
    forceManualBackup
  };
}
