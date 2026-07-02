import React, { RefObject } from 'react';
import { QueueItem, HistoryItem, PassportData } from '../types';

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

interface UseQueueHandlersProps {
  queue: QueueItem[];
  setQueue: React.Dispatch<React.SetStateAction<QueueItem[]>>;
  activeQueueId: string | null;
  setActiveQueueId: React.Dispatch<React.SetStateAction<string | null>>;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  setPreview: React.Dispatch<React.SetStateAction<string | null>>;
  setData: React.Dispatch<React.SetStateAction<PassportData | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

export function useQueueHandlers({
  queue, setQueue, activeQueueId, setActiveQueueId,
  setFile, setPreview, setData, setError, fileInputRef
}: UseQueueHandlersProps) {

  const processFiles = (fileList: FileList | File[], isVisaApplication: boolean = false) => {
    const filesArray = Array.from(fileList);
    
    // Check if any visa application PDF is 1MB or larger
    if (isVisaApplication) {
      const oversizedFiles = filesArray.filter(f => f.type === 'application/pdf' && f.size >= 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setError('দয়া করে ১ মেগাবাইট (1MB) এর নিচের সাইজের ইন্ডিয়ান ভিসা অ্যাপ্লিকেশন PDF ফাইল আপলোড করুন।');
        return;
      }
    }

    const validFiles = filesArray.filter(f => 
      isVisaApplication 
        ? f.type === 'application/pdf'
        : (f.type.startsWith('image/') || f.type === 'application/pdf')
    );
    
    if (validFiles.length === 0) {
      if (isVisaApplication) {
        setError('দয়া করে একটি ইন্ডিয়ান ভিসা অ্যাপ্লিকেশন PDF ফাইল আপলোড করুন।');
      } else {
        setError('Please upload at least one valid image file (JPEG, PNG) or PDF.');
      }
      return;
    }

    const newQueueItems: QueueItem[] = validFiles.map(file => {
      const id = 'q_' + Date.now().toString() + Math.random().toString(36).substring(2);
      const isPdf = file.type === 'application/pdf';
      const docType = (isVisaApplication || isPdf) ? 'visa_application' : 'passport';
      
      return {
        id,
        file,
        preview: isPdf ? '' : URL.createObjectURL(file),
        loading: false,
        error: null,
        status: 'queued',
        documentType: docType
      };
    });

    setQueue(prev => {
      const updated = [...prev, ...newQueueItems];
      if (newQueueItems.length > 0) {
        const activeItem = newQueueItems[0];
        setActiveQueueId(activeItem.id);
        setFile(activeItem.file);
        setPreview(activeItem.preview || null);
        setData(null);
        setError(null);
      }
      return updated;
    });
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleVisaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files, true);
    }
  };

  const handleVisaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files, true);
    }
  };

  const selectQueueItem = (item: QueueItem) => {
    setActiveQueueId(item.id);
    setFile(item.file);
    setPreview(item.preview);
    setData(item.data || null);
    setError(item.error);
  };

  const removeFromQueue = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setQueue(prev => {
      const updated = prev.filter(q => q.id !== itemId);
      if (activeQueueId === itemId) {
        if (updated.length > 0) {
          setTimeout(() => selectQueueItem(updated[0]), 0);
        } else {
          setFile(null);
          setPreview(null);
          setData(null);
          setError(null);
          setActiveQueueId(null);
        }
      }
      return updated;
    });
  };

  const loadFromHistory = (item: HistoryItem) => {
    setData(item.data);
    
    const hasImage = item.imageBase64 && item.imageBase64.startsWith('data:');
    const previewUrl = hasImage ? item.imageBase64! : '';
    
    let fileObj: File;
    if (hasImage) {
      try {
        fileObj = dataURLtoFile(item.imageBase64!, `Scanned_${item.data.passportNumber || 'Passport'}.jpg`);
      } catch (e) {
        console.error("Failed to convert base64 to File", e);
        fileObj = new File([], `Scanned_${item.data.passportNumber || 'Passport'}.jpg`, { type: 'image/jpeg' });
      }
    } else {
      fileObj = new File([], `Scanned_${item.data.passportNumber || 'Passport'}.jpg`, { type: 'image/jpeg' });
    }

    setPreview(previewUrl || null);
    setFile(fileObj.size > 0 ? fileObj : null);
    setError(null);
    
    const id = 'hist_' + Date.now();
    const mockQueueItem: QueueItem = {
      id, 
      file: fileObj, 
      preview: previewUrl, 
      loading: false, 
      error: null, 
      status: 'completed', 
      data: item.data
    };
    setQueue([mockQueueItem]);
    setActiveQueueId(id);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearAll = () => {
    setFile(null);
    setPreview(null);
    setData(null);
    setError(null);
    setQueue([]);
    setActiveQueueId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return {
    handleDragOver,
    handleDrop,
    handleFileChange,
    handleVisaFileChange,
    handleVisaDrop,
    selectQueueItem,
    removeFromQueue,
    loadFromHistory,
    clearAll
  };
}
