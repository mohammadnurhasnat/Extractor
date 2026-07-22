import React, { useState, useEffect, useRef } from 'react';
import { 
  History, Search, Trash2, Database, Download, 
  ChevronDown, ChevronUp, User, Eye, X, Copy, Check, 
  Sparkles, Clock, UserCheck, ShieldCheck, Mail, Calendar, 
  MapPin, Globe, FileText
} from 'lucide-react';
import { HistoryItem, PassportData } from '../types';
import { getGeneratedEmail } from '../utils/addressUtils';

interface HistorySidebarProps {
  history: HistoryItem[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onLoadItem: (item: HistoryItem) => void;
  activeData?: PassportData | null;
  onConfirmDelete: (e: React.MouseEvent, id: string) => void;
  onOpenBackup: () => void;
  onOpenRestore: () => void;
}

export function HistorySidebar({
  history,
  searchTerm,
  onSearchTermChange,
  onLoadItem,
  activeData,
  onConfirmDelete,
  onOpenBackup,
  onOpenRestore
}: HistorySidebarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [modalItem, setModalItem] = useState<HistoryItem | null>(null);
  const [lastUsedId, setLastUsedId] = useState<string | null>(() => {
    return localStorage.getItem('last_used_profile_id') || null;
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      setLocalSearchQuery('');
    }
    setIsDropdownOpen(prev => !prev);
  };

  // Filter list based on local search input
  const filteredHistory = history.filter(item => {
    const fullName = `${item.data.givenName || ''} ${item.data.surname || ''}`.toLowerCase();
    const passportNo = (item.data.passportNumber || '').toLowerCase();
    const queryWords = localSearchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (queryWords.length === 0) return true;
    return queryWords.every(word => fullName.includes(word) || passportNo.includes(word));
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const todayCount = history.filter(item => item.timestamp >= startOfToday).length;
  const monthCount = history.filter(item => item.timestamp >= startOfThisMonth).length;
  const totalCount = history.length;

  // Identify Recent, Active, and Last Used items
  const recentItem = history.length > 0 ? history[0] : null;
  const activeItemInHistory = activeData?.passportNumber 
    ? history.find(h => h.data.passportNumber === activeData.passportNumber) || null
    : null;
  
  // Currently displayed label on the dropdown trigger button
  const currentDisplayedProfile = activeItemInHistory || history.find(h => h.id === lastUsedId) || recentItem;

  const handleSelectProfile = (item: HistoryItem, openModal: boolean = true) => {
    onLoadItem(item);
    setLastUsedId(item.id);
    localStorage.setItem('last_used_profile_id', item.id);
    if (openModal) {
      setModalItem(item);
    }
    setIsDropdownOpen(false);
  };

  const handleCopyText = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="shrink-0 bg-gradient-to-br from-white/95 to-violet-50/40 dark:from-zinc-900/95 dark:to-zinc-950/40 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-[0_12px_40px_rgba(139,92,246,0.04)] border-t-[3px] border-t-violet-500 border-x border-b border-slate-200/80 dark:border-zinc-800/80 flex flex-col transition-all duration-300 relative">
      
      {/* Header section with title and Backup/Restore buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-zinc-800/50 gap-3">
        <div>
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-slate-800 dark:text-zinc-100">
            <History className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /> Recent Extractions
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-sans font-medium">Select passport profile from dropdown.</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 w-full xl:w-auto z-10">
          {history.length > 0 && (
            <button 
              onClick={(e) => onConfirmDelete(e, "ALL")}
              className="slide-btn slide-btn-slate w-full sm:w-auto px-3.5 py-1.5 rounded-full font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 uppercase ripple-btn cursor-pointer"
              title="Delete All Profiles"
            >
              <span className="relative z-10 flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" />
                <span className="inline">Delete</span>
              </span>
            </button>
          )}
          <div className="flex gap-2 w-full sm:w-auto col-span-2 sm:col-span-1">
            <button 
              onClick={onOpenBackup}
              className="slide-btn slide-btn-purple w-full sm:w-auto px-3.5 py-1.5 rounded-full font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 uppercase ripple-btn cursor-pointer"
              title="Open Cryptographic Profile Backup"
            >
              <span className="relative z-10 flex items-center gap-1">
                <Database className="w-3.5 h-3.5" />
                <span>Backup</span>
              </span>
            </button>
            <button 
              onClick={onOpenRestore}
              className="slide-btn slide-btn-emerald w-full sm:w-auto px-3.5 py-1.5 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 uppercase ripple-btn cursor-pointer"
              title="Open Secure Data Restore"
            >
              <span className="relative z-10 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                <span>Restore</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Counter Badges (TODAY, THIS MONTH, TOTAL SCANS - UNCHANGED) */}
      <div className="grid grid-cols-3 gap-1.5 mb-3.5 font-sans">
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/40 dark:border-blue-900/30 rounded-xl p-1.5 flex flex-col items-center justify-center text-center transition-transform hover:scale-102">
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-450">Today</span>
          <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300 leading-none mt-1">{todayCount}</span>
        </div>
        <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/40 dark:border-purple-900/30 rounded-xl p-1.5 flex flex-col items-center justify-center text-center transition-transform hover:scale-102">
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-450">This Month</span>
          <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300 leading-none mt-1">{monthCount}</span>
        </div>
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/40 dark:border-emerald-900/30 rounded-xl p-1.5 flex flex-col items-center justify-center text-center transition-transform hover:scale-102">
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-450">Total Scans</span>
          <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 leading-none mt-1">{totalCount}</span>
        </div>
      </div>

      {/* DROPDOWN PROFILE SELECTOR SECTION */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <label className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-500" /> Choose Profile
          </label>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
            {history.length} Saved
          </span>
        </div>

        {/* Dropdown Trigger Button */}
        <button
          onClick={toggleDropdown}
          type="button"
          className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm ${
            isDropdownOpen 
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-zinc-900' 
              : 'border-slate-200/90 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/60 hover:bg-white dark:hover:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-sm">
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              {currentDisplayedProfile ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-800 dark:text-zinc-100 truncate">
                      {currentDisplayedProfile.data.givenName} {currentDisplayedProfile.data.surname}
                    </span>
                    {activeItemInHistory?.id === currentDisplayedProfile.id && (
                      <span className="text-[8px] font-extrabold px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                    {currentDisplayedProfile.data.passportNumber || 'No Passport No'}
                  </span>
                </>
              ) : (
                <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
                  No profiles available...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md hidden sm:inline">
              {isDropdownOpen ? 'Close Menu' : 'Open List'}
            </span>
            {isDropdownOpen ? (
              <ChevronUp className="w-4 h-4 text-blue-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            )}
          </div>
        </button>

        {/* Inline Expandable Dropdown List Panel (No Overflow Clipping) */}
        {isDropdownOpen && (
          <div className="mt-2 w-full bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-lg p-2.5 sm:p-3 transition-all animate-in fade-in duration-150">
            
            {/* Search Input inside Dropdown */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search profile name or passport..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-black/40 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              {localSearchQuery && (
                <button
                  onClick={() => setLocalSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Profile Items Scroll List */}
            <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 dark:text-zinc-500">
                  {localSearchQuery ? 'No matching profiles found' : 'No saved profiles'}
                </div>
              ) : (
                filteredHistory.map((item, idx) => {
                  const isActive = activeData?.passportNumber && item.data.passportNumber === activeData.passportNumber;
                  const isLastUsed = lastUsedId === item.id;
                  const isRecent = recentItem?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectProfile(item, true)}
                      className={`group flex items-center justify-between p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800/80 shadow-xs'
                          : 'bg-slate-50/70 dark:bg-zinc-950/40 border-slate-200/50 dark:border-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                        <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-zinc-800 text-[10px] font-bold flex items-center justify-center text-slate-600 dark:text-zinc-400 shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {item.data.givenName} {item.data.surname}
                            </span>
                            
                            {/* Badges */}
                            {isActive && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-blue-500 text-white shadow-xs shrink-0">
                                <UserCheck className="w-2.5 h-2.5" /> Active
                              </span>
                            )}
                            {isLastUsed && !isActive && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-purple-500 text-white shadow-xs shrink-0">
                                <Clock className="w-2.5 h-2.5" /> Last Used
                              </span>
                            )}
                            {isRecent && !isActive && !isLastUsed && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500 text-white shadow-xs shrink-0">
                                <Sparkles className="w-2.5 h-2.5" /> Recent
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                            {item.data.passportNumber || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Eye Button to open full profile modal */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalItem(item);
                            setIsDropdownOpen(false);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                          title="View Full Profile Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {/* Trash Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onConfirmDelete(e, item.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* FULL PROFILE POP-UP WINDOW / MODAL */}
      {modalItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setModalItem(null)}
        >
          <div 
            className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg shadow-inner shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-extrabold text-base sm:text-xl leading-snug truncate">
                    {modalItem.data.givenName} {modalItem.data.surname}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[11px] sm:text-xs bg-white/20 font-mono px-2 py-0.5 rounded-full text-white/90">
                      Passport: {modalItem.data.passportNumber || 'N/A'}
                    </span>
                    {activeData?.passportNumber === modalItem.data.passportNumber && (
                      <span className="text-[9px] sm:text-[10px] font-extrabold bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Active Profile
                      </span>
                    )}
                    {lastUsedId === modalItem.id && activeData?.passportNumber !== modalItem.data.passportNumber && (
                      <span className="text-[9px] sm:text-[10px] font-extrabold bg-purple-300 text-purple-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Last Used
                      </span>
                    )}
                    {recentItem?.id === modalItem.id && (
                      <span className="text-[9px] sm:text-[10px] font-extrabold bg-amber-300 text-amber-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Recently Added
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setModalItem(null)}
                className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0 ml-2"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Full Profile Fields */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-slate-800 dark:text-zinc-100">
              
              {/* Photo & Primary Quick Info */}
              {modalItem.imageBase64 && (
                <div className="flex justify-center mb-2">
                  <div className="relative group">
                    <img 
                      src={modalItem.imageBase64} 
                      alt="Scanned Passport" 
                      className="max-h-36 sm:max-h-44 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-md object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Grid of Profile Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                
                {/* Given Name */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-500" /> Given Name
                  </div>
                  <div className="font-bold text-sm text-slate-800 dark:text-zinc-100">
                    {modalItem.data.givenName || 'N/A'}
                  </div>
                </div>

                {/* Surname */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-indigo-500" /> Surname
                  </div>
                  <div className="font-bold text-sm text-slate-800 dark:text-zinc-100">
                    {modalItem.data.surname || 'N/A'}
                  </div>
                </div>

                {/* Passport Number */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-emerald-500" /> Passport Number</span>
                    {modalItem.data.passportNumber && (
                      <button
                        onClick={() => handleCopyText(modalItem.data.passportNumber || '', 'passport')}
                        className="text-blue-500 hover:text-blue-600 flex items-center gap-0.5 font-bold cursor-pointer"
                      >
                        {copiedField === 'passport' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copiedField === 'passport' ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <div className="font-extrabold text-sm font-mono text-blue-600 dark:text-blue-400">
                    {modalItem.data.passportNumber || 'N/A'}
                  </div>
                </div>

                {/* DOB */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-purple-500" /> Date of Birth
                  </div>
                  <div className="font-bold text-sm text-slate-800 dark:text-zinc-100">
                    {modalItem.data.dob || 'N/A'}
                  </div>
                </div>

                {/* Gender */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-pink-500" /> Gender
                  </div>
                  <div className="font-bold text-sm text-slate-800 dark:text-zinc-100">
                    {modalItem.data.gender || 'N/A'}
                  </div>
                </div>

                {/* Place of Birth */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-500" /> Birth Place
                  </div>
                  <div className="font-bold text-sm text-slate-800 dark:text-zinc-100">
                    {modalItem.data.birthPlace || 'N/A'}
                  </div>
                </div>

                {/* Issue Date */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-teal-500" /> Issue Date
                  </div>
                  <div className="font-bold text-sm text-slate-800 dark:text-zinc-100">
                    {modalItem.data.issueDate || 'N/A'}
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-500" /> Expiry Date
                  </div>
                  <div className="font-bold text-sm text-slate-800 dark:text-zinc-100">
                    {modalItem.data.expiryDate || 'N/A'}
                  </div>
                </div>

                {/* Generated Email */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800 sm:col-span-2">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-cyan-500" /> Generated Email</span>
                    <button
                      onClick={() => handleCopyText(getGeneratedEmail(modalItem.data), 'email')}
                      className="text-blue-500 hover:text-blue-600 flex items-center gap-0.5 font-bold cursor-pointer"
                    >
                      {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedField === 'email' ? 'Copied' : 'Copy Email'}
                    </button>
                  </div>
                  <div className="font-bold text-xs sm:text-sm font-mono text-slate-800 dark:text-zinc-100 break-all">
                    {getGeneratedEmail(modalItem.data)}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer / Action Buttons */}
            <div className="p-3.5 sm:p-5 bg-slate-50 dark:bg-zinc-950/80 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2.5 shrink-0">
              <button
                onClick={(e) => {
                  onConfirmDelete(e, modalItem.id);
                  setModalItem(null);
                }}
                className="px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Profile
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalItem(null)}
                  className="px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleSelectProfile(modalItem, false);
                    setModalItem(null);
                  }}
                  className="px-4 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" /> Load Profile
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
