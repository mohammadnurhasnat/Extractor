import React from 'react';
import { UploadCloud, Loader2, ZapOff, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UndertakingOptions } from './UndertakingOptions';
import { SessionQueue } from './SessionQueue';
import { HistorySidebar } from './HistorySidebar';
import { PassportData, HistoryItem, QueueItem, UndertakingFormData } from '../types';

interface UploadSectionProps {
  preview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Undertaking props
  utPurpose: string; setUtPurpose: (val: string) => void;
  utHospitalName: string; setUtHospitalName: (val: string) => void;
  utDoctorName: string; setUtDoctorName: (val: string) => void;
  utEmbassyCity: string; setUtEmbassyCity: (val: string) => void;
  utEmbassyDate: string; setUtEmbassyDate: (val: string) => void;
  utFromDate: string; setUtFromDate: (val: string) => void;
  utToDate: string; setUtToDate: (val: string) => void;
  utReturnCountry: string; setUtReturnCountry: (val: string) => void;
  isUndertakingConfigured: boolean;
  undertakingData: UndertakingFormData | null;
  setUndertakingData: (data: UndertakingFormData | null) => void;
  savedHospitals: string[]; handleAddHospitalSuggestion: (name: string) => void;
  savedDepartments: string[]; handleAddDepartmentSuggestion: (name: string) => void;
  
  clearAll: () => void;
  extractData: () => void;
  data: PassportData | null;
  loading: boolean;
  isOnline: boolean;
  isBatchProcessing: boolean;

  queue: QueueItem[];
  activeQueueId: string | null;
  isZipping: boolean;
  processEntireQueue: () => void;
  handleDownloadAllZIP: () => void;
  selectQueueItem: (item: QueueItem) => void;
  removeFromQueue: (e: React.MouseEvent, itemId: string) => void;
  extractSingleItem: (itemId: string) => Promise<PassportData | null>;

  error: string | null;
  history: HistoryItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setHistory: (history: HistoryItem[]) => void;
  loadFromHistory: (item: HistoryItem) => void;
  confirmDelete: (e: React.MouseEvent, id: string) => void;
}

export function UploadSection(props: UploadSectionProps) {
  return (
    <div className="lg:col-span-5 flex flex-col gap-6 print:hidden">
      <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-zinc-800/60 transition-colors">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2 dark:text-zinc-100">
          <FileText className="w-5 h-5 text-blue-500" />
          Upload Documents
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 font-medium">Select one or multiple passport images to process in a session.</p>
        
        {!props.preview ? (
          <div className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-black/50 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors group flex flex-col items-center justify-center text-center h-64 relative">
            <input 
              type="file" 
              ref={props.fileInputRef} 
              className="hidden" 
              accept="image/jpeg, image/png, image/webp" 
              onChange={props.handleFileChange}
              multiple
            />
            <div className="flex flex-col items-center justify-center cursor-pointer p-6 w-full h-full" onClick={() => props.fileInputRef.current?.click()}>
              <div className="w-14 h-14 bg-white dark:bg-zinc-900 rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7 text-blue-500 dark:text-blue-400" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-zinc-200">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">JPEG, PNG, WEBP (Supports multiple files)</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div 
              className="border border-dashed border-slate-300 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-black/30 hover:bg-slate-100 dark:hover:bg-zinc-800/40 transition-colors group flex items-center gap-3 p-3.5 cursor-pointer"
              onClick={() => props.fileInputRef.current?.click()}
            >
              <input type="file" ref={props.fileInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={props.handleFileChange} multiple />
              <div className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-lg shadow-sm flex items-center justify-center shrink-0">
                <UploadCloud className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200">Add more passport images...</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Select multiple images to append to the queue</p>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-black aspect-[4/3] flex items-center justify-center">
              {props.preview ? (
                <img src={props.preview} alt="Passport Preview" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="text-slate-400 text-xs">No preview available</div>
              )}
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-xl" />
            </div>
            
            <UndertakingOptions
              utPurpose={props.utPurpose}
              setUtPurpose={props.setUtPurpose}
              utHospitalName={props.utHospitalName}
              setUtHospitalName={props.setUtHospitalName}
              utDoctorName={props.utDoctorName}
              setUtDoctorName={props.setUtDoctorName}
              utEmbassyCity={props.utEmbassyCity}
              setUtEmbassyCity={props.setUtEmbassyCity}
              utEmbassyDate={props.utEmbassyDate}
              setUtEmbassyDate={props.setUtEmbassyDate}
              utFromDate={props.utFromDate}
              setUtFromDate={props.setUtFromDate}
              utToDate={props.utToDate}
              setUtToDate={props.setUtToDate}
              utReturnCountry={props.utReturnCountry}
              isUndertakingConfigured={props.isUndertakingConfigured}
              undertakingData={props.undertakingData}
              setUndertakingData={props.setUndertakingData}
              savedHospitals={props.savedHospitals}
              handleAddHospitalSuggestion={props.handleAddHospitalSuggestion}
              savedDepartments={props.savedDepartments}
              handleAddDepartmentSuggestion={props.handleAddDepartmentSuggestion}
            />

            <div className="flex gap-3">
              <button 
                onClick={props.clearAll}
                disabled={props.loading || props.isBatchProcessing}
                className="flex-1 py-2.5 px-4 rounded-lg font-medium text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Clear All
              </button>
              {!props.data && (
                <div className="flex-[2] flex flex-col gap-2">
                  <button 
                    onClick={props.extractData}
                    disabled={props.loading || !props.isOnline || props.isBatchProcessing}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 shadow-sm border border-transparent ${
                      !props.isOnline 
                        ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-70 cursor-pointer'
                    }`}
                  >
                    {props.loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Extracting...</>
                    ) : !props.isOnline ? (
                      <><ZapOff className="w-5 h-5 text-red-500" /> Offline: Disabled</>
                    ) : (
                      'Extract Active'
                    )}
                  </button>
                  {!props.isOnline && (
                    <span className="text-[10px] text-red-500 font-semibold text-center animate-pulse">
                      Internet connection required
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <SessionQueue
          queue={props.queue}
          activeQueueId={props.activeQueueId}
          isBatchProcessing={props.isBatchProcessing}
          isOnline={props.isOnline}
          isZipping={props.isZipping}
          processEntireQueue={props.processEntireQueue}
          handleDownloadAllZIP={props.handleDownloadAllZIP}
          selectQueueItem={props.selectQueueItem}
          removeFromQueue={props.removeFromQueue}
          extractSingleItem={props.extractSingleItem}
        />

        <AnimatePresence>
          {props.error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm flex items-start gap-3 border border-red-100"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{props.error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <HistorySidebar
        history={props.history}
        searchTerm={props.searchTerm}
        onSearchTermChange={props.setSearchTerm}
        onLoadItem={props.loadFromHistory}
        onConfirmDelete={props.confirmDelete}
      />
    </div>
  );
}
