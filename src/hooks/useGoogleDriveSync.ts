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
  const [backupSize, setBackupSize] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Use refs to avoid closure stale values
  const historyRef = useRef<HistoryItem[]>(history);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  // Dynamic byte size calculator for exact telemetry
  const calculateContentSize = (content: any): number => {
    try {
      const str = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      return new TextEncoder().encode(str).length;
    } catch (e) {
      return 0;
    }
  };

  // Find the backup file on Google Drive (priority .txt, fallback to .json)
  const findBackupFile = useCallback(async (token: string): Promise<{ id: string; size: number; name: string } | null> => {
    try {
      // 1. First seek the passport_records_backup.txt file
      const qTxt = encodeURIComponent("name = 'passport_records_backup.txt' and trashed = false");
      const urlTxt = `https://www.googleapis.com/drive/v3/files?q=${qTxt}&fields=files(id,name,size)`;
      
      const resTxt = await fetch(urlTxt, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (resTxt.ok) {
        const dataTxt = await resTxt.json();
        if (dataTxt.files && dataTxt.files.length > 0) {
          const file = dataTxt.files[0];
          return {
            id: file.id,
            size: Number(file.size || 0),
            name: file.name
          };
        }
      }
      
      // 2. Backward compatibility fallback: seek passport_records_backup.json
      const qJson = encodeURIComponent("name = 'passport_records_backup.json' and trashed = false");
      const urlJson = `https://www.googleapis.com/drive/v3/files?q=${qJson}&fields=files(id,name,size)`;
      
      const resJson = await fetch(urlJson, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (resJson.ok) {
        const dataJson = await resJson.json();
        if (dataJson.files && dataJson.files.length > 0) {
          const file = dataJson.files[0];
          return {
            id: file.id,
            size: Number(file.size || 0),
            name: file.name
          };
        }
      }
      
      return null;
    } catch (e) {
      console.error("Error finding backup file on Google Drive:", e);
      return null;
    }
  }, []);

  const createBackupFile = useCallback(async (token: string, content: HistoryItem[]): Promise<string | null> => {
    try {
      const bodyString = JSON.stringify(content, null, 2);
      const calculatedBytes = calculateContentSize(bodyString);

      // Step 1: Create metadata for .txt file
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'passport_records_backup.txt',
          mimeType: 'text/plain',
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
          'Content-Type': 'text/plain',
        },
        body: bodyString,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload content to Google Drive');
      }

      setBackupSize(calculatedBytes);
      setLastSyncTime(new Date());
      return fileId;
    } catch (e) {
      console.error("Error creating backup file on Google Drive:", e);
      return null;
    }
  }, []);

  const updateBackupFile = useCallback(async (token: string, fileId: string, content: HistoryItem[]) => {
    try {
      const bodyString = JSON.stringify(content, null, 2);
      const calculatedBytes = calculateContentSize(bodyString);

      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
        body: bodyString,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to update content on Google Drive');
      }

      setBackupSize(calculatedBytes);
      setLastSyncTime(new Date());
    } catch (e) {
      console.error("Error updating backup file on Google Drive:", e);
    }
  }, []);

  // Fetch / restore backup from Google Drive
  const handleRestore = useCallback(async () => {
    if (!user || !accessToken) return;
    setIsSyncing(true);
    setSyncStatus('গুগল ড্রাইভ থেকে ব্রাউজারের হিস্টোরি রিস্টোর বা সিঙ্ক খোঁজ করা হচ্ছে...');

    try {
      const fileInfo = await findBackupFile(accessToken);
      if (fileInfo) {
        setDriveFileId(fileInfo.id);
        setBackupSize(fileInfo.size);
        setSyncStatus('ব্যাকআপ ফাইল ডাউনলোড করা হচ্ছে...');
        
        const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileInfo.id}?alt=media`, {
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
            
            // Recalculate size
            const finalSize = calculateContentSize(mergedList);
            setBackupSize(finalSize);
            setLastSyncTime(new Date());

            setSyncStatus('সফলভাবে গুগল ড্রাইভ ব্যাকআপ থেকে হিস্টোরি রিস্টোর করা হয়েছে!');
          } else {
            setSyncStatus('কোনো বৈধ পাসপোর্ট ব্যাকআপ ডাটা পাওয়া যায়নি।');
          }
        } else {
          setSyncStatus('ব্যাকআপ ডেটা ডাউনলোড করতে ব্যর্থ হয়েছে।');
        }
      } else {
        setSyncStatus('গুগল ড্রাইভে কোনো পূর্ববর্তী পাসপোর্ট ব্যাকআপ ফাইল (.txt) পাওয়া যায়নি। প্রথম টাস্ক সম্পন্নের সময় স্বয়ংক্রিয়ভাবে ব্যাকআপ তৈরি হবে।');
      }
    } catch (error) {
      console.error("Restore error", error);
      setSyncStatus('রিস্টোর করতে সাময়িক বিভ্রান্তি ঘটেছে।');
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
      setBackupSize(null);
      setLastSyncTime(null);
    }
  }, [user, accessToken, hasCheckedCloud, handleRestore]);

  // Auto upload to Google Drive when local state changes (ONLY AFTER initial check is completed)
  useEffect(() => {
    if (!user || !accessToken || !hasCheckedCloud) return;

    const delayDebounce = setTimeout(async () => {
      setIsSyncing(true);
      setSyncStatus('গুগল ড্রাইভ টেক্সট ফাইলে ব্যাকআপ আপলোড হচ্ছে...');

      try {
        let currentFileId = driveFileId;
        if (!currentFileId) {
          const fileInfo = await findBackupFile(accessToken);
          if (fileInfo) {
            currentFileId = fileInfo.id;
          }
        }

        if (currentFileId) {
          setDriveFileId(currentFileId);
          await updateBackupFile(accessToken, currentFileId, history);
          setSyncStatus('ব্যাকআপ সফলভাবে সিঙ্ক্রোনাইজ সম্পন্ন হয়েছে!');
        } else {
          const newFileId = await createBackupFile(accessToken, history);
          if (newFileId) {
            setDriveFileId(newFileId);
            setSyncStatus('নতুন পাসপোর্ট ব্যাকআপ টেক্সট ফাইল তৈরি ও গুগল ড্রাইভে আপলোড সম্পন্ন হয়েছে!');
          } else {
            setSyncStatus('ব্যাকআপ ফাইল তৈরি করা সম্ভব হয়নি।');
          }
        }
      } catch (error) {
        console.error("Auto backup error", error);
        setSyncStatus('গুগল ড্রাইভ ব্যাকআপ সম্পন্ন হতে ব্যর্থ হয়েছে।');
      } finally {
        setIsSyncing(false);
      }
    }, 1500); // 1.5 seconds debounce to avoid duplicate API calls during bulk edits

    return () => clearTimeout(delayDebounce);
  }, [history, user, accessToken, hasCheckedCloud, driveFileId, findBackupFile, createBackupFile, updateBackupFile]);

  // Manual trigger for instant push/backup
  const forceManualBackup = useCallback(async () => {
    if (!user || !accessToken) return;
    setIsSyncing(true);
    setSyncStatus('ইনস্ট্যান্ট টেক্সট ফাইল ব্যাকআপ সিঙ্ক্রোনাইজেশন হচ্ছে...');
    try {
      let currentFileId = driveFileId;
      if (!currentFileId) {
        const fileInfo = await findBackupFile(accessToken);
        if (fileInfo) {
          currentFileId = fileInfo.id;
        }
      }

      if (currentFileId) {
        await updateBackupFile(accessToken, currentFileId, historyRef.current);
        setSyncStatus('ম্যানুয়াল ক্লাউড ব্যাকআপ সফলভাবে সম্পন্ন!');
      } else {
        const newFileId = await createBackupFile(accessToken, historyRef.current);
        if (newFileId) {
          setDriveFileId(newFileId);
          setSyncStatus('নতুন টেক্সট ফাইলসহ ম্যানুয়াল ব্যাকআপ সম্পূর্ণ!');
        } else {
          setSyncStatus('ব্যাকআপ ফাইল তৈরি করতে ব্যর্থ হয়েছে।');
        }
      }
    } catch (e) {
      console.error(e);
      setSyncStatus('ফাইল ক্লাউডে আপলোড অথবা সিঙ্ক করতে ত্রুটি বা সমস্যা হয়েছে।');
    } finally {
      setIsSyncing(false);
    }
  }, [user, accessToken, driveFileId, findBackupFile, updateBackupFile, createBackupFile]);

  return {
    isSyncing,
    syncStatus,
    backupSize,
    lastSyncTime,
    handleRestore,
    forceManualBackup
  };
}
