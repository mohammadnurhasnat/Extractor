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
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-205 dark:border-zinc-805/80 min-h-[300px] flex flex-col transition-all duration-350">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-zinc-100">
            <History className="w-5 h-5 text-blue-500" /> Recent Extractions
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-sans font-medium">List of recently processed passport scans.</p>
        </div>
        
        <div className="flex z-10 items-center justify-end gap-2 w-full xl:w-auto max-w-full overflow-hidden">
          <button 
            onClick={exportToZip}
            className="p-2 text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all border border-slate-200 dark:border-zinc-800 cursor-pointer shadow-sm active:scale-95"
            title="Export History to ZIP"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="relative flex-1 max-w-[200px] sm:max-w-[240px] xl:w-[160px]">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-550" />
            </div>
            <input
              type="text"
              placeholder="Search passports..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="block w-full pl-8.5 pr-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-slate-50/50 dark:bg-black/30 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 dark:text-zinc-100 transition-colors placeholder-slate-400 dark:placeholder-zinc-550 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Extraction Counter Badges */}
      <div className="grid grid-cols-3 gap-2.5 mb-5 font-sans">
        <div className="bg-blue-50/40 dark:bg-blue-950/15 border border-blue-100/30 dark:border-blue-900/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-transform hover:scale-102">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-450">Today</span>
          <span className="text-xl font-extrabold text-blue-700 dark:text-blue-300 leading-none mt-1.5">{todayCount}</span>
        </div>
        <div className="bg-purple-50/40 dark:bg-purple-950/15 border border-purple-100/30 dark:border-purple-900/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-transform hover:scale-102">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-450">This Month</span>
          <span className="text-xl font-extrabold text-purple-700 dark:text-purple-300 leading-none mt-1.5">{monthCount}</span>
        </div>
        <div className="bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100/30 dark:border-emerald-900/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-transform hover:scale-102">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-450">Total Scans</span>
          <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 leading-none mt-1.5">{totalCount}</span>
        </div>
      </div>
      
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center opacity-50 flex-1 py-8">
          <History className="w-10 h-10 text-slate-300 dark:text-zinc-650 mb-4 animate-pulse" />
          <p className="text-sm font-semibold text-slate-600 dark:text-zinc-355 font-sans">No history yet</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center opacity-50 flex-1 py-8">
          <Search className="w-10 h-10 text-slate-300 dark:text-zinc-650 mb-4" />
          <p className="text-sm font-semibold text-slate-600 dark:text-zinc-355 font-sans">No matching results</p>
        </div>
      ) : (
        <div className="overflow-y-auto pr-1 space-y-2.5 pb-2 scrollbar-thin max-h-[300px]">
          {filteredHistory.map(item => (
            <div 
              key={item.id} 
              onClick={() => onLoadItem(item)}
              className="cursor-pointer group relative flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/40 hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-transparent dark:hover:from-zinc-850/35 dark:hover:to-transparent hover:border-blue-200 dark:hover:border-zinc-700 transition-all duration-300 shadow-sm"
            >
              <div className="flex flex-col mr-6 overflow-hidden">
                <span className="font-bold text-[14px] leading-tight text-slate-850 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-450 transition-colors truncate font-sans flex items-center gap-2">
                  {item.data.givenName} {item.data.surname}
                  {history.length > 0 && item.id === history[0].id && (
                    <span className="text-[8px] bg-emerald-100/50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-emerald-200/40 dark:border-emerald-800/20 whitespace-nowrap">
                      Last Used
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 rounded-md font-mono">
                    {item.data.passportNumber || "Unknown ID"}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-450 font-medium bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-1.5 py-0.5 rounded-md truncate max-w-[150px] font-mono">
                    {getGeneratedEmail(item.data)}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => onConfirmDelete(e, item.id)}
                className="opacity-0 group-hover:opacity-100 absolute right-3 p-1.5 text-slate-400 dark:text-zinc-550 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-all shadow-sm shrink-0 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
                title="Delete from history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isSupabaseConfigured && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-col gap-2 bg-blue-50/20 dark:bg-zinc-950/40 rounded-2xl p-4 border border-blue-200/20 dark:border-zinc-850/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-705 dark:text-zinc-200">
              <Database className="w-4 h-4 text-blue-500 animate-pulse" />
              Supabase Cloud Storage
            </div>
            <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider border border-emerald-500/10">
              Connected
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed font-sans font-medium">
            {cloudSyncStatusText || "অফলাইন হিস্টরি ক্লাউড ডেটাবেজের সাথে সিনক্রোনাইজ করে রাখুন।"}
          </p>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              disabled={isSyncingCloud}
              onClick={onFetchHistoryFromCloud}
              className="flex-1 py-1.5 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 border border-slate-205 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50 active:scale-95 shadow-sm"
              title="Pull all items from clouds"
            >
              <Download className="w-3 h-3 text-blue-500" /> Pull Cloud
            </button>
            <button
              type="button"
              disabled={isSyncingCloud}
              onClick={onSyncHistoryToCloud}
              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50 active:scale-95 shadow-sm"
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
