import React, { useState } from 'react';
import { PassportData, QueueItem, HistoryItem } from '../types';

interface UseAddressGenerationProps {
  data: PassportData | null;
  setData: (data: PassportData) => void;
  userApiKey: string;
  activeQueueId: string | null;
  setQueue: React.Dispatch<React.SetStateAction<QueueItem[]>>;
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  setToast: (toast: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
}

export function useAddressGeneration({
  data, setData, userApiKey, activeQueueId, setQueue, setHistory, setToast
}: UseAddressGenerationProps) {
  const [isGeneratingAddresses, setIsGeneratingAddresses] = useState(false);

  const handleGenerateAddresses = async () => {
    if (!data || !data.permanentAddress) return;
    setIsGeneratingAddresses(true);
    setToast({ message: "Generating realistic addresses with Gemini...", type: "info" });
    try {
      const response = await fetch('/api/generate-addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': userApiKey || '',
        },
        body: JSON.stringify({ permanentAddress: data.permanentAddress }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate addresses');
      }
      const addresses = await response.json();
      
      const updated = {
        ...data,
        presentAddress: addresses.presentAddress || '',
        businessAddressDhaka: addresses.businessAddressDhaka || '',
        businessAddressLocal: addresses.businessAddressLocal || '',
        officeAddressDhaka: addresses.officeAddressDhaka || '',
        officeAddressLocal: addresses.officeAddressLocal || '',
      };
      
      setData(updated);
      if (activeQueueId) {
        setQueue(prev => prev.map(q => q.id === activeQueueId ? { ...q, data: updated } : q));
      }
      setHistory(prev => prev.map(item => {
        if (item.data.passportNumber === data.passportNumber) return { ...item, data: updated };
        return item;
      }));
      setToast({ message: "Addresses generated successfully with Gemini!", type: "success" });
    } catch (e) {
      console.error(e);
      setToast({ message: "Error auto-generating addresses.", type: "error" });
    } finally {
      setIsGeneratingAddresses(false);
    }
  };

  return {
    isGeneratingAddresses,
    handleGenerateAddresses
  };
}
