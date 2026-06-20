import { useState, useRef, useEffect, useCallback } from 'react';
import { QueueItem, PassportData } from '../types';
import imageCompression from 'browser-image-compression';
import { applyOcrCorrections } from '../utils/ocrCorrection';
import JSZip from 'jszip';
import { generateDataText, normalizeGender } from '../utils/addressUtils';
import { getPDFDocument } from '../utils/pdfGenerator';

interface QueueStateProps {
  isOnline: boolean;
  userApiKey: string;
  addToHistory: (data: PassportData) => PassportData | void;
  onSelectData: (data: PassportData | null) => void;
  onError: (error: string | null) => void;
}

export function useSessionQueue({ isOnline, userApiKey, addToHistory, onSelectData, onError }: QueueStateProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [loading, setLoading] = useState(false);

  const extractSingleItem = useCallback(async (itemId: string): Promise<PassportData | null> => {
    // Current queue state needs to be accessed
    let currentItem: QueueItem | undefined;
    setQueue(prev => {
      currentItem = prev.find(q => q.id === itemId);
      return prev.map(q => q.id === itemId ? { ...q, loading: true, status: 'extracting', error: null } : q);
    });

    if (activeQueueId === itemId) {
      setLoading(true);
      onError(null);
    }

    if (!currentItem) return null;

    try {
      const options = {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(currentItem.file, options);

      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
      });

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userApiKey) {
        headers['x-api-key'] = userApiKey;
      }

      const res = await fetch('/api/extract-passport', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageBase64: base64String,
          mimeType: currentItem.file.type
        }),
      });
      
      const result = await res.json();
      
      if (res.ok && result.success) {
        if (result.data) {
          result.data = applyOcrCorrections(result.data);
          if (result.data.gender) {
            result.data.gender = normalizeGender(result.data.gender);
          }
        }
        
        const deduplicatedData = addToHistory(result.data) || result.data;
        
        setQueue(prev => prev.map(q => q.id === itemId ? { ...q, loading: false, status: 'completed', error: null, data: deduplicatedData } : q));
        
        if (activeQueueId === itemId) {
          onSelectData(deduplicatedData);
          setLoading(false);
        }
        return deduplicatedData;
      } else {
        const errMsg = result.error || 'Failed to extract data.';
        setQueue(prev => prev.map(q => q.id === itemId ? { ...q, loading: false, status: 'failed', error: errMsg } : q));
        if (activeQueueId === itemId) {
          onError(errMsg);
          setLoading(false);
        }
        return null;
      }
    } catch (err) {
      const errMsg = 'Network error: Could not reach the server.';
      setQueue(prev => prev.map(q => q.id === itemId ? { ...q, loading: false, status: 'failed', error: errMsg } : q));
      if (activeQueueId === itemId) {
        onError(errMsg);
        setLoading(false);
      }
      return null;
    }
  }, [activeQueueId, userApiKey, addToHistory, onSelectData, onError]);

  useEffect(() => {
    // If active queue id changes, ensure loading state syncs
    if (activeQueueId) {
      const activeItem = queue.find(q => q.id === activeQueueId);
      if (activeItem) {
        setLoading(activeItem.loading || activeItem.status === 'extracting');
      }
    }
  }, [activeQueueId, queue]);

  const processEntireQueue = async () => {
    if (!isOnline) {
      onError("Cannot extract data while offline. Please restore your internet connection and try again.");
      return;
    }
    setIsBatchProcessing(true);
    const pendingItems = queue.filter(q => q.status === 'queued' || q.status === 'failed');
    
    // Process in parallel, e.g., 3 at a time.
    const concurrency = 3;
    for (let i = 0; i < pendingItems.length; i += concurrency) {
      const chunk = pendingItems.slice(i, i + concurrency);
      await Promise.all(chunk.map(item => extractSingleItem(item.id)));
    }
    
    setIsBatchProcessing(false);
  };

  const handleDownloadAllZIP = async () => {
    const completedItems = queue.filter(q => q.status === 'completed' && q.data);
    if (completedItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < completedItems.length; i++) {
        const item = completedItems[i];
        const itemData = item.data!;
        
        const safeGivenName = (itemData.givenName || 'Extracted').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        const safeSurname = (itemData.surname || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        const passportNum = (itemData.passportNumber || `Doc_${i + 1}`).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        
        const baseFileName = `${i + 1}_${safeGivenName}_${safeSurname}_${passportNum}`;
        
        const textContent = generateDataText(itemData);
        zip.file(`${baseFileName}.txt`, textContent);
        
        const doc = getPDFDocument(itemData);
        const pdfArrayBuffer = doc.output('arraybuffer');
        zip.file(`${baseFileName}.pdf`, pdfArrayBuffer);
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Batch_Extracted_Passports_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP Generation failed:", err);
      onError("Failed to create ZIP file. Please try again.");
    } finally {
      setIsZipping(false);
    }
  };

  return {
    queue, setQueue,
    activeQueueId, setActiveQueueId,
    isBatchProcessing,
    isZipping,
    loading, setLoading,
    extractSingleItem,
    processEntireQueue,
    handleDownloadAllZIP
  };
}
