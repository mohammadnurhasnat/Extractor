import React, { RefObject } from 'react';
import { QueueItem, HistoryItem, PassportData } from '../types';
import { getPdfInfo } from '../utils/pdfInfoHelper';

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
  setToast?: (toast: { message: string; type: 'success' | 'error' | 'info' } | null) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

export function useQueueHandlers({
  queue, setQueue, activeQueueId, setActiveQueueId,
  setFile, setPreview, setData, setError, setToast, fileInputRef
}: UseQueueHandlersProps) {

  const processFiles = (fileList: FileList | File[], isVisaApplication: boolean = false) => {
    const filesArray = Array.from(fileList);
    
    // Check if any file format is unsupported
    const invalidFiles = filesArray.filter(f => {
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
      const isImage = f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name);
      return isVisaApplication ? !isPdf : (!isPdf && !isImage);
    });

    if (invalidFiles.length > 0) {
      const msg = isVisaApplication
        ? 'Unsupported file format! Only Indian Visa Application PDF files are supported.'
        : 'Unsupported file format! Only JPEG, PNG, WEBP, and PDF files are supported.';
      setError(msg);
      if (setToast) {
        setToast({ message: msg, type: 'error' });
      }
    }

    // Check if any visa application PDF is 1MB or larger
    if (isVisaApplication) {
      const oversizedFiles = filesArray.filter(f => (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) && f.size >= 1024 * 1024);
      if (oversizedFiles.length > 0) {
        const errorMsg = 'Please upload an Indian Visa Application PDF file smaller than 1MB.';
        setError(errorMsg);
        if (setToast) {
          setToast({ message: errorMsg, type: 'error' });
        }
        return;
      }
    }

    const validFiles = filesArray.filter(f => {
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
      const isImage = f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name);
      return isVisaApplication ? isPdf : (isPdf || isImage);
    });
    
    if (validFiles.length === 0) {
      if (isVisaApplication) {
        setError('Please upload an Indian Visa Application PDF file.');
      } else {
        setError('Unsupported file format! Only JPEG, PNG, WEBP, and PDF files are acceptable.');
      }
      return;
    }

    const newQueueItems: QueueItem[] = validFiles.map(file => {
      const id = 'q_' + Date.now().toString() + Math.random().toString(36).substring(2);
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const docType = isVisaApplication ? 'visa_application' : 'passport';
      
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

    // Extract PDF info asynchronously for validation helper
    newQueueItems.forEach(async (item) => {
      if (item.file.type === 'application/pdf' || item.file.name.toLowerCase().endsWith('.pdf')) {
        const info = await getPdfInfo(item.file);
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, pdfInfo: info } : q));
      }
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
