import React from 'react';
import { FileText, Eye, Settings, Download } from 'lucide-react';

interface UndertakingHeaderProps {
  isUndertakingEditable: boolean;
  setIsUndertakingEditable: (editable: boolean) => void;
  handleDownloadUndertaking: () => void;
}

export function UndertakingHeader({
  isUndertakingEditable,
  setIsUndertakingEditable,
  handleDownloadUndertaking
}: UndertakingHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 print:hidden">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
          <FileText className="w-5 h-5 text-teal-600" />
          {isUndertakingEditable ? "Edit Undertaking Document" : "Preview Undertaking Document"}
        </h2>
        <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium font-sans">
          {isUndertakingEditable 
            ? "Click on any text or blank line below to edit before downloading." 
            : "This is an elegant read-only live preview of your final undertaking document."
          }
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-nowrap shrink-0">
        <div className="bg-slate-100 dark:bg-zinc-800/50 p-1 rounded-lg flex items-center gap-1 text-xs border border-slate-200 dark:border-zinc-700/60 print:hidden shrink-0">
          <button
             onClick={() => setIsUndertakingEditable(false)}
             className={`slide-btn slide-btn-purple flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold cursor-pointer border ripple-btn ${
               !isUndertakingEditable
                ? 'active shadow-sm font-extrabold border-[#2DD4BF]/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-350 bg-transparent!'
             }`}
          >
            <Eye className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">Preview</span>
          </button>
          <button
             onClick={() => setIsUndertakingEditable(true)}
             className={`slide-btn slide-btn-purple flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold cursor-pointer border ripple-btn ${
               isUndertakingEditable
                ? 'active shadow-sm font-extrabold border-[#2DD4BF]/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-350 bg-transparent!'
             }`}
          >
            <Settings className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">Edit</span>
          </button>
        </div>

        <button
          onClick={handleDownloadUndertaking}
          className="slide-btn slide-btn-orange flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg cursor-pointer print:hidden shrink-0 ripple-btn"
        >
          <Download className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Download</span>
        </button>
      </div>
    </div>
  );
}
