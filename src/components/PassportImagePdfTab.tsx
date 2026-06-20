import React, { useState } from 'react';
import { FileDown, FileImage, Loader2 } from 'lucide-react';
import { PassportData, QueueItem } from '../types';
import { generatePassportImagePDF } from '../utils/pdfGenerator';

interface PassportImagePdfTabProps {
  activeItem: QueueItem | null;
}

export function PassportImagePdfTab({ activeItem }: PassportImagePdfTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!activeItem || (!activeItem.file && !activeItem.preview)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-zinc-500">
        <FileImage className="w-12 h-12 mb-4 opacity-50" />
        <p>No passport image selected</p>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!activeItem.file) return;
    setIsGenerating(true);
    try {
      await generatePassportImagePDF(activeItem.file, activeItem.data);
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto py-8 text-center space-y-6">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
        <FileDown className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Passport Image PDF</h2>
        <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm leading-relaxed max-w-md mx-auto">
          Convert the uploaded passport image directly into a standard PDF format. The system automatically optimizes the file size (200KB - 350KB) and names it correctly.
        </p>
      </div>

      <div className="w-48 h-64 border-2 border-slate-200 dark:border-zinc-800 border-dashed rounded-xl overflow-hidden bg-slate-50 dark:bg-zinc-900 flex items-center justify-center p-2 mt-4 relative group">
        {activeItem.preview && (
          <img src={activeItem.preview} alt="Passport Preview" className="w-full h-full object-contain rounded-lg" />
        )}
      </div>

      {activeItem.file ? (
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Optimizing & Generating...</span>
            </>
          ) : (
            <>
              <FileDown className="w-5 h-5" />
              <span>Download Optimized PDF</span>
            </>
          )}
        </button>
      ) : (
        <p className="text-sm text-amber-500 font-medium">Image file is not available for direct download.</p>
      )}
    </div>
  );
}
