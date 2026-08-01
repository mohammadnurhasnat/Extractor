import React, { useEffect, useState } from 'react';
import { Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { renderAllPdfPages, dataURLtoFile } from '../utils/pdfGenerator';
import { QueueItem, PdfPageItem } from '../types';

interface PdfPageSelectorProps {
  file: File;
  activeItem: QueueItem | null;
  onSelectPage: (pageIndex: number, pageDataUrl: string, pageFile: File, allPages: PdfPageItem[]) => void;
}

export function PdfPageSelector({ file, activeItem, onSelectPage }: PdfPageSelectorProps) {
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // If activeItem already has rendered pdfPages for this file, use them
    if (activeItem?.pdfPages && activeItem.pdfPages.length > 0) {
      setPages(activeItem.pdfPages);
      const initialIdx = activeItem.selectedPageIndex ?? 0;
      setSelectedIdx(initialIdx);
      setLoading(false);
      return;
    }

    renderAllPdfPages(file)
      .then((renderedPages) => {
        if (!isMounted) return;
        setPages(renderedPages);
        setLoading(false);
        const initialIdx = 0;
        setSelectedIdx(initialIdx);
        
        if (renderedPages.length > 0) {
          const firstPage = renderedPages[0];
          const pageFile = dataURLtoFile(firstPage.dataUrl, `${file.name.replace(/\.pdf$/i, '')}_page_1.jpg`);
          onSelectPage(0, firstPage.dataUrl, pageFile, renderedPages);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error rendering PDF pages:", err);
        setError("PDF পেজগুলো প্রসেস করতে ব্যর্থ হয়েছে।");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [file, activeItem?.id]);

  const handlePageClick = (idx: number) => {
    if (idx === selectedIdx || !pages[idx]) return;
    setSelectedIdx(idx);
    const targetPage = pages[idx];
    const pageFile = dataURLtoFile(targetPage.dataUrl, `${file.name.replace(/\.pdf$/i, '')}_page_${idx + 1}.jpg`);
    onSelectPage(idx, targetPage.dataUrl, pageFile, pages);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-3 bg-blue-50/80 dark:bg-zinc-900/80 rounded-xl border border-blue-200 dark:border-zinc-800 text-blue-600 dark:text-blue-400 text-xs font-bold my-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>PDF পেজসমূহ স্ক্যান হচ্ছে ({file.name})...</span>
      </div>
    );
  }

  if (error || pages.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-slate-100/90 dark:bg-zinc-900/90 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 my-2 shadow-sm">
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-zinc-200">
          <FileText className="w-3.5 h-3.5 text-blue-500" />
          <span>All Pages (TOTAL: {pages.length})</span>
        </div>
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-full">
          Select pdf for Extraction
        </span>
      </div>

      {/* Pages Container */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin pt-1">
        {pages.map((p, idx) => {
          const isSelected = idx === selectedIdx;
          return (
            <button
              key={p.pageNumber}
              type="button"
              onClick={() => handlePageClick(idx)}
              className={`relative group shrink-0 w-20 sm:w-24 rounded-lg overflow-hidden border-2 transition-all duration-200 text-left cursor-pointer ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/40 scale-[1.03] shadow-md bg-blue-50/50 dark:bg-blue-950/50'
                  : 'border-slate-300 dark:border-zinc-700 hover:border-blue-400 opacity-80 hover:opacity-100 bg-white dark:bg-zinc-950'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="h-24 sm:h-28 w-full relative bg-slate-200 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                <img
                  src={p.thumbnailDataUrl}
                  alt={`Page ${p.pageNumber}`}
                  className="w-full h-full object-cover"
                />

                {isSelected && (
                  <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Footer Label */}
              <div className={`py-1 px-1.5 text-center text-[10px] font-extrabold truncate ${
                isSelected 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
              }`}>
                Page {p.pageNumber} {isSelected ? '(Active)' : ''}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
