import React, { useState } from 'react';
import { FileDown, FileImage, Loader2 } from 'lucide-react';
import { PassportData, QueueItem } from '../types';
import { generatePassportImagePDF } from '../utils/pdfGenerator';

interface PassportImagePdfTabProps {
  activeItem: QueueItem | null;
  currentUser?: any;
}

export function PassportImagePdfTab({ activeItem, currentUser }: PassportImagePdfTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const isHistoryMock = activeItem?.file && activeItem.file.size === 0 && !activeItem.preview;

  if (!activeItem || (!activeItem.file && !activeItem.preview) || isHistoryMock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 dark:text-zinc-500 max-w-sm mx-auto text-center p-6">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-2xl flex items-center justify-center mb-4">
          <FileImage className="w-8 h-8 text-amber-500 opacity-80" />
        </div>
        <h3 className="font-extrabold text-slate-800 dark:text-zinc-200 text-lg">Image Not in History</h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
          Since this passport record was loaded from your History/Backup, the original passport image is not stored on our server or browser cache. 
        </p>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed font-semibold text-teal-600 dark:text-teal-400">
          You can still download the optimized text report or professional PDF report from the Passport Profile tab!
        </p>
      </div>
    );
  }

  const handleDownload = async () => {
    const source = activeItem.file || activeItem.preview;
    if (!source) return;
    setIsGenerating(true);
    try {
      await generatePassportImagePDF(source, activeItem.data);
      
      // Log Image to PDF action to server
      if (currentUser?.id) {
        fetch('/api/log-action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser.id,
            action: 'IMAGE_TO_PDF',
            details: `Converted passport image to PDF for ${activeItem.data?.givenName || ''} ${activeItem.data?.surname || ''}`
          })
        }).catch(err => console.error("Error logging image-to-pdf:", err));
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto py-4 text-center space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Image to PDF</h2>
        <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm leading-relaxed max-w-sm mx-auto">
          Convert the uploaded passport image directly into a standard PDF format. The system automatically optimizes the file size (200KB - 350KB) and names it correctly.
        </p>
      </div>

      <div className="w-48 h-64 border-2 border-slate-200 dark:border-zinc-800 border-dashed rounded-xl overflow-hidden bg-slate-50 dark:bg-zinc-900 flex items-center justify-center p-2 mt-4 relative group">
        {activeItem.preview && (
          <img src={activeItem.preview} alt="Passport Preview" className="w-full h-full object-contain rounded-lg" />
        )}
      </div>

      {activeItem.file || activeItem.preview ? (
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="slide-btn slide-btn-teal flex items-center gap-2 px-6 py-3 font-medium rounded-xl disabled:opacity-70 disabled:cursor-not-allowed border border-transparent shadow-sm shadow-blue-500/10 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin relative z-10" />
              <span className="relative z-10">Optimizing & Generating...</span>
            </>
          ) : (
            <>
              <FileDown className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Download Optimized PDF</span>
            </>
          )}
        </button>
      ) : (
        <p className="text-sm text-amber-500 font-medium">Image file is not available for direct download.</p>
      )}
    </div>
  );
}
