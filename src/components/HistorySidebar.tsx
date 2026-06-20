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
  
  // Supabase Integration Props
  isSupabaseConfigured: boolean;
  onFetchHistoryFromCloud: () => void;
  onSyncHistoryToCloud: () => void;
  isSyncingCloud: boolean;
  cloudSyncStatusText: string;
}

export function HistorySidebar({
  history,
  searchTerm,
  onSearchTermChange,
  onLoadItem,
  onConfirmDelete,
  isSupabaseConfigured,
  onFetchHistoryFromCloud,
  onSyncHistoryToCloud,
  isSyncingCloud,
  cloudSyncStatusText
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
    <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-zinc-800/60 min-h-[300px] flex flex-col transition-colors">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4">
        <div>
          <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800 dark:text-zinc-100">
            <History className="w-6 h-6 text-blue-500" /> Recent Extractions
          </h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 font-sans">Access scanned passports.</p>
        </div>
        
        <div className="flex z-10 items-center justify-end gap-2 w-full xl:w-auto max-w-full overflow-hidden">
          <button 
            onClick={exportToZip}
            className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-slate-200 dark:border-zinc-700"
            title="Export History to ZIP"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="relative flex-1 max-w-[200px] sm:max-w-[240px] xl:w-[160px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="block w-full pl-9 pr-2.5 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs bg-slate-50 dark:bg-black/50 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-zinc-100 transition-colors placeholder-slate-400 dark:placeholder-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* Extraction Counter Badges */}
      <div className="grid grid-cols-3 gap-2.5 mb-5 font-sans">
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Today</span>
          <span className="text-lg font-extrabold text-blue-700 dark:text-blue-300 leading-none mt-1">{todayCount}</span>
        </div>
        <div className="bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100/50 dark:border-violet-900/30 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">This Month</span>
          <span className="text-lg font-extrabold text-violet-700 dark:text-violet-300 leading-none mt-1">{monthCount}</span>
        </div>
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Scans</span>
          <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 leading-none mt-1">{totalCount}</span>
        </div>
      </div>
      
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center opacity-50 flex-1 py-8">
          <History className="w-10 h-10 text-slate-300 dark:text-zinc-600 mb-4" />
          <p className="text-base font-medium text-slate-600 dark:text-zinc-300 font-sans">No history yet</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center opacity-50 flex-1 py-8">
          <Search className="w-10 h-10 text-slate-300 dark:text-zinc-600 mb-4" />
          <p className="text-base font-medium text-slate-600 dark:text-zinc-300 font-sans">No matching results</p>
        </div>
      ) : (
        <div className="overflow-y-auto pr-2 space-y-3 pb-2 scrollbar-thin max-h-[300px]">
          {filteredHistory.map(item => (
            <div 
              key={item.id} 
              onClick={() => onLoadItem(item)}
              className="cursor-pointer group relative flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50 bg-slate-50 dark:bg-black/50 hover:bg-blue-50 dark:hover:bg-zinc-800/50 hover:border-blue-200 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex flex-col mr-6 overflow-hidden">
                <span className="font-bold text-[15px] leading-tight text-slate-800 dark:text-zinc-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate font-sans">
                  {item.data.givenName} {item.data.surname}
                </span>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded font-mono">
                    {item.data.passportNumber || "Unknown ID"}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded truncate max-w-[150px] font-mono">
                    {getGeneratedEmail(item.data)}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => onConfirmDelete(e, item.id)}
                className="opacity-0 group-hover:opacity-100 absolute right-4 p-2 text-slate-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 shrink-0 cursor-pointer"
                title="Delete from history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isSupabaseConfigured && (
        <div className="mt-4 pt-4 border-t border-slate-150 dark:border-zinc-800 flex flex-col gap-2 bg-blue-55/15 dark:bg-zinc-900/50 rounded-xl p-3.5 border border-blue-500/15 dark:border-zinc-850">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              Supabase Cloud
            </div>
            <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Connected
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed font-sans">
            {cloudSyncStatusText || "অফলাইন হিস্টরি ক্লাউড ডেটাবেজের সাথে সিনক্রোনাইজ করে রাখুন।"}
          </p>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              disabled={isSyncingCloud}
              onClick={onFetchHistoryFromCloud}
              className="flex-1 py-1.5 bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-350 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
              title="Pull all items from clouds"
            >
              <Download className="w-3 h-3 text-blue-500" /> Pull Cloud
            </button>
            <button
              type="button"
              disabled={isSyncingCloud}
              onClick={onSyncHistoryToCloud}
              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
              title="Push all items from local to cloud"
            >
              <UploadCloud className="w-3 h-3" /> Push Local
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
