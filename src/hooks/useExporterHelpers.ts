import { useState } from 'react';
import { PassportData, UndertakingFormData } from '../types';
import { generateDataText } from '../utils/addressUtils';
import { generatePDF, generateUndertakingPDF } from '../utils/pdfGenerator';

interface UseExporterHelpersProps {
  data: PassportData | null;
  undertakingData: UndertakingFormData | null;
  setToast: (toast: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
}

export function useExporterHelpers({ data, undertakingData, setToast }: UseExporterHelpersProps) {
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
    } catch (err: any) {
      setToast({ message: "Error generating the document.", type: "error" });
    }
  };

  return {
    isCopied,
    handleCopyAll,
    handleDownloadText,
    handleDownloadPDF,
    handleDownloadUndertaking
  };
}
