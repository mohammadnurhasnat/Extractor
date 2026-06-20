import { RefObject } from 'react';
import { QueueItem, HistoryItem, PassportData } from '../types';

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

  const processFiles = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    const validImageFiles = filesArray.filter(f => f.type.startsWith('image/'));
    
    if (validImageFiles.length === 0) {
      setError('Please upload at least one valid image file (JPEG, PNG).');
      return;
    }

    const newQueueItems: QueueItem[] = validImageFiles.map(file => {
      const id = 'q_' + Date.now().toString() + Math.random().toString(36).substring(2);
      return {
        id,
        file,
        preview: URL.createObjectURL(file),
        loading: false,
        error: null,
        status: 'queued'
      };
    });

    setQueue(prev => {
      const updated = [...newQueueItems, ...prev];
      if (prev.length === 0 && newQueueItems.length > 0) {
        const activeItem = newQueueItems[0];
        setActiveQueueId(activeItem.id);
        setFile(activeItem.file);
        setPreview(activeItem.preview);
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
    setPreview(null);
    setFile(null);
    setError(null);
    const id = 'hist_' + Date.now();
    const mockFileObj = new File([], `Scanned_${item.data.passportNumber || 'Passport'}.jpg`, { type: 'image/jpeg' });
    const mockQueueItem: QueueItem = {
      id, file: mockFileObj, preview: '', loading: false, error: null, status: 'completed', data: item.data
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
    selectQueueItem,
    removeFromQueue,
    loadFromHistory,
    clearAll
  };
}
