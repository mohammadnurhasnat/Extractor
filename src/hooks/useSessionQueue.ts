import { useState, useRef, useEffect, useCallback } from 'react';
import { QueueItem, PassportData } from '../types';
import imageCompression from 'browser-image-compression';
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

  const abortControllersRef = useRef<Set<AbortController>>(new Set());
  const isCancelledRef = useRef<boolean>(false);
  const queueRef = useRef<QueueItem[]>(queue);

  // Sync queue to queueRef.current to prevent stale closure bugs in asynchronous operations
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const cancelExtraction = useCallback(() => {
    isCancelledRef.current = true;
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current.clear();
    setIsBatchProcessing(false);
    setLoading(false);
  }, []);

  const extractSingleItem = useCallback(async (itemId: string): Promise<PassportData | null> => {
    // Retrieve current item using queueRef to guarantee synchronous availability
    const currentItem = queueRef.current.find(q => q.id === itemId);

    if (!currentItem) return null;

    setQueue(prev => {
      return prev.map(q => q.id === itemId ? { ...q, loading: true, status: 'extracting', error: null } : q);
    });

    if (activeQueueId === itemId) {
      setLoading(true);
      onError(null);
    }

    const startTime = Date.now();
    try {
      let compressedFile = currentItem.file;
      
      // If original file is already under 400 KB, skip compression entirely to reduce client CPU wait time.
      // Else, compress aggressively to max 0.35MB and max 1200px width/height for fast upload and fast Gemini processing.
      if (currentItem.file.size > 400 * 1024) {
        const options = {
          maxSizeMB: 0.35,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          initialQuality: 0.85
        };
        try {
          compressedFile = await imageCompression(currentItem.file, options);
          const originalMB = currentItem.file.size / (1024 * 1024);
          const compressedMB = compressedFile.size / (1024 * 1024);
          const reduction = Math.round((1 - compressedMB / originalMB) * 100);
          const compressionRatio = `-${reduction}% (${compressedMB.toFixed(2)}MB)`;
          
          setQueue(prev => prev.map(q => q.id === itemId ? { ...q, compressionRatio } : q));
        } catch (compressErr) {
          console.warn('Image compression failed, falling back to original:', compressErr);
          compressedFile = currentItem.file;
        }
      }

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
      try {
        const stored = localStorage.getItem('passport_extractor_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            headers['x-user-id'] = parsed.id;
          }
        }
      } catch (e) {
        console.error('Failed to parse user session', e);
      }

      const controller = new AbortController();
      abortControllersRef.current.add(controller);

      const res = await fetch('/api/extract-passport', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageBase64: base64String,
          mimeType: currentItem.file.type
        }),
        signal: controller.signal,
      });
      
      abortControllersRef.current.delete(controller);
      
      const result = await res.json();
      const durationSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
      
      if (res.ok && result.success) {
        if (result.data) {
          if (result.data.gender) {
            result.data.gender = normalizeGender(result.data.gender);
          }
          result.data.extractionTime = durationSeconds;
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
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const errMsg = 'Extraction cancelled.';
        setQueue(prev => prev.map(q => q.id === itemId ? { ...q, loading: false, status: 'failed', error: errMsg } : q));
        if (activeQueueId === itemId) {
          onError(errMsg);
          setLoading(false);
        }
        return null;
      }
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
    
    isCancelledRef.current = false;
    abortControllersRef.current.clear();
    
    setIsBatchProcessing(true);
    const pendingItems = queueRef.current.filter(q => q.status === 'queued' || q.status === 'failed');
    
    // Process in parallel, e.g., 3 at a time.
    const concurrency = 3;
    for (let i = 0; i < pendingItems.length; i += concurrency) {
      if (isCancelledRef.current) break;
      const chunk = pendingItems.slice(i, i + concurrency);
      await Promise.all(chunk.map(item => {
         if (isCancelledRef.current) return Promise.resolve(null);
         return extractSingleItem(item.id);
      }));
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
    cancelExtraction,
    handleDownloadAllZIP
  };
}
