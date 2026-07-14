import { useState } from 'react';
import { PassportData, UndertakingFormData } from '../types';
import { generateDataText } from '../utils/addressUtils';
import { generatePDF, generateUndertakingPDF } from '../utils/pdfGenerator';

interface UseExporterHelpersProps {
  data: PassportData | null;
  undertakingData: UndertakingFormData | null;
  setToast: (toast: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
  currentUser?: any;
}

export function useExporterHelpers({ data, undertakingData, setToast, currentUser }: UseExporterHelpersProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyAll = async () => {
    if (!data) return;
    const text = generateDataText(data);
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDownloadText = () => {
    if (!data) return;
    const text = generateDataText(data);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Passport_Data_${data.givenName || 'Extracted'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (!data) return;
    generatePDF(data);
    
    // Log Download Action to server
    if (currentUser?.id) {
      fetch('/api/log-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          action: 'PDF_DOWNLOAD',
          details: `Downloaded PDF report for ${data.givenName || ''} ${data.surname || ''}`
        })
      }).catch(err => console.error("Error logging PDF download:", err));
    }
  };

  const handleDownloadUndertaking = async () => {
    if (!undertakingData) {
      setToast({ message: "No data available.", type: "error" });
      return;
    }
    setToast({ message: "Generating PDF...", type: "info" });
    await new Promise(resolve => setTimeout(resolve, 850));
    try {
      generateUndertakingPDF(undertakingData);
      setToast({ message: "Success!", type: "success" });
      
      // Log Download Action to server
      if (currentUser?.id) {
        fetch('/api/log-action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser.id,
            action: 'UNDERTAKING_DOWNLOAD',
            details: `Downloaded undertaking PDF for ${undertakingData.fullName || 'unknown'}`
          })
        }).catch(err => console.error("Error logging undertaking download:", err));
      }
    } catch (err: any) {
      setToast({ message: "Error generating the document.", type: "error" });
    }
  };

  const handleDownloadJSON = () => {
    if (!data) return;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Passport_Data_${data.givenName || 'Extracted'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    isCopied,
    handleCopyAll,
    handleDownloadText,
    handleDownloadPDF,
    handleDownloadUndertaking,
    handleDownloadJSON
  };
}
