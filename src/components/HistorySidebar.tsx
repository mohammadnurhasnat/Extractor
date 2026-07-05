import React from 'react';
import { History, Search, Trash2, Database, UploadCloud, Download } from 'lucide-react';
import { HistoryItem } from '../types';
import { getGeneratedEmail } from '../utils/addressUtils';

interface HistorySidebarProps {
  history: HistoryItem[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onLoadItem: (item: HistoryItem) => void;
  onConfirmDelete: (e: React.MouseEvent, id: string) => void;
  onOpenBackup: () => void;
  onOpenRestore: () => void;
}

export function HistorySidebar({
  history,
  searchTerm,
  onSearchTermChange,
  onLoadItem,
  onConfirmDelete,
  onOpenBackup,
  onOpenRestore
}: HistorySidebarProps) {
  const filteredHistory = history.filter(item => {
    const fullName = `${item.data.givenName || ''} ${item.data.surname || ''}`.toLowerCase();
    const passportNo = (item.data.passportNumber || '').toLowerCase();
    const queryWords = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (queryWords.length === 0) return true;
    return queryWords.every(word => fullName.includes(word) || passportNo.includes(word));
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const todayCount = history.filter(item => item.timestamp >= startOfToday).length;
  const monthCount = history.filter(item => item.timestamp >= startOfThisMonth).length;
  const totalCount = history.length;

  const exportToZip = async () => {
    if (history.length === 0) return;
    
    // Dynamically import JSZip
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    for (const item of history) {
      const fileName = `${item.data.givenName || 'Unnamed'}_${item.data.passportNumber || 'NoPassport'}_${item.id}.txt`;
      const content = `
Given Name: ${item.data.givenName || ''}
Surname: ${item.data.surname || ''}
Passport Number: ${item.data.passportNumber || ''}
Email: ${getGeneratedEmail(item.data)}
DOB: ${item.data.dob || ''}
Gender: ${item.data.gender || ''}
Birth Place: ${item.data.birthPlace || ''}
Issue Date: ${item.data.issueDate || ''}
Expiry Date: ${item.data.expiryDate || ''}
      `.trim();
      
      zip.file(fileName, content);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `passport_history_${new Date().toISOString().split('T')[0]}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="shrink-0 bg-gradient-to-br from-white/95 to-violet-50/40 dark:from-zinc-900/95 dark:to-zinc-950/40 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-[0_12px_40px_rgba(139,92,246,0.04)] border-t-[3px] border-t-violet-500 border-x border-b border-slate-200/80 dark:border-zinc-805/80 min-h-[300px] flex flex-col transition-all duration-350">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-zinc-100">
            <History className="w-5 h-5 text-blue-500" /> Recent Extractions
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-sans font-medium">List of recently processed passport scans.</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 w-full xl:w-auto z-10">
          {history.length > 0 && (
            <button 
              onClick={(e) => onConfirmDelete(e, "ALL")}
              className="slide-btn slide-btn-slate w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 uppercase ripple-btn"
              title="Delete All Profiles"
            >
              <span className="relative z-10 flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" />
                <span className="inline">Delete</span>
              </span>
            </button>
          )}
          <div className="flex gap-2.5 w-full sm:w-auto col-span-2 sm:col-span-1">
            <button 
              onClick={onOpenBackup}
              className="slide-btn slide-btn-purple w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 uppercase ripple-btn"
              title="Open Cryptographic Profile Backup"
            >
              <span className="relative z-10 flex items-center gap-1">
                <Database className="w-3.5 h-3.5" />
                <span>Backup</span>
              </span>
            </button>
            <button 
              onClick={onOpenRestore}
              className="slide-btn slide-btn-teal w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 uppercase ripple-btn"
              title="Open Secure Data Restore"
            >
              <span className="relative z-10 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                <span>Restore</span>
              </span>
            </button>
          </div>

          <div className="relative flex-1 min-w-0 sm:min-w-[150px] sm:max-w-[260px] w-full h-full sm:h-auto">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-550" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="block w-full pl-8 pr-2.5 py-2 sm:py-1.5 border border-slate-200 dark:border-zinc-805 rounded-[5px] text-xs bg-slate-50/50 dark:bg-black/30 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white text-slate-850 dark:text-zinc-100 transition-colors placeholder-slate-400 dark:placeholder-zinc-550 font-medium h-full"
            />
          </div>
        </div>
      </div>

      {/* Extraction Counter Badges */}
      <div className="grid grid-cols-3 gap-1.5 mb-3 font-sans">
        <div className="bg-blue-50/40 dark:bg-blue-950/15 border border-blue-100/30 dark:border-blue-900/20 rounded-xl p-1.5 flex flex-col items-center justify-center text-center transition-transform hover:scale-102">
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-450">Today</span>
          <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300 leading-none mt-1">{todayCount}</span>
        </div>
        <div className="bg-purple-50/40 dark:bg-purple-950/15 border border-purple-100/30 dark:border-purple-900/20 rounded-xl p-1.5 flex flex-col items-center justify-center text-center transition-transform hover:scale-102">
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-450">This Month</span>
          <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300 leading-none mt-1">{monthCount}</span>
        </div>
        <div className="bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100/30 dark:border-emerald-900/20 rounded-xl p-1.5 flex flex-col items-center justify-center text-center transition-transform hover:scale-102">
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-450">Total Scans</span>
          <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 leading-none mt-1">{totalCount}</span>
        </div>
      </div>
      
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center flex-1 py-12 relative overflow-hidden rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100/80 dark:border-zinc-800/50 mt-2 group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/30 dark:to-blue-900/10 pointer-events-none"></div>
          <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-700 mb-5 relative z-10 transform group-hover:scale-105 transition-transform duration-300 rotate-3 group-hover:-rotate-3">
            <History className="w-7 h-7 text-blue-500/80 dark:text-blue-400/80" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm animate-pulse"></div>
          </div>
          <p className="text-[14px] font-bold text-slate-700 dark:text-zinc-200 font-sans mb-1.5 relative z-10 tracking-tight">Your Archive is Empty</p>
          <p className="text-[12px] text-slate-500 dark:text-zinc-450 max-w-[200px] relative z-10 leading-relaxed font-medium">Processed passports will be securely saved here for quick access later.</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center flex-1 py-12 relative overflow-hidden rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100/80 dark:border-zinc-800/50 mt-2">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-100/50 dark:to-zinc-800/20 pointer-events-none"></div>
          <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-700 mb-5 relative z-10 transform transition-transform duration-300 -rotate-3">
             <Search className="w-7 h-7 text-slate-400 dark:text-zinc-500" />
          </div>
          <p className="text-[14px] font-bold text-slate-700 dark:text-zinc-200 font-sans mb-1.5 relative z-10 tracking-tight">No matching records</p>
          <p className="text-[12px] text-slate-500 dark:text-zinc-450 max-w-[200px] relative z-10 leading-relaxed font-medium">Try adjusting your search terms or clearing the filter.</p>
        </div>
      ) : (
        <div className="overflow-y-auto overscroll-contain scroll-smooth pr-1 space-y-2 pb-2 scrollbar-thin max-h-[300px]">
          {filteredHistory.map((item, idx) => (
            <div 
              key={item.id} 
              onClick={() => onLoadItem(item)}
              className="cursor-pointer group relative flex items-center justify-between py-2 px-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/40 hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-transparent dark:hover:from-zinc-850/35 dark:hover:to-transparent hover:border-blue-200 dark:hover:border-zinc-700 transition-all duration-300 shadow-sm min-h-[40px]"
            >
              <div className="flex items-center gap-3 mr-6 overflow-hidden flex-1 min-w-0">
                {/* Stylish Index */}
                <span className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-black flex items-center justify-center text-slate-500 dark:text-zinc-400 shrink-0 group-hover:bg-blue-500/10 group-hover:text-blue-600 group-hover:border-blue-500/20 transition-all">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-[13px] leading-tight text-slate-850 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-450 transition-colors truncate font-sans">
                    {item.data.givenName} {item.data.surname}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.data.passportNumber && (
                      <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-500 font-mono truncate">
                        {item.data.passportNumber}
                      </span>
                    )}
                    {(item.extractionTime || item.data.extractionTime) && (
                      <span className="text-[9px] font-bold text-blue-500/80 dark:text-blue-400/80 font-mono shrink-0">
                        • {((item.extractionTime || item.data.extractionTime)!).toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => onConfirmDelete(e, item.id)}
                className="p-1.5 text-slate-400 dark:text-zinc-550 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-all shadow-sm shrink-0 cursor-pointer"
                title="Delete from history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
