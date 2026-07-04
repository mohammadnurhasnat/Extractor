import React from 'react';
import { UploadCloud, Loader2, ZapOff, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UndertakingOptions } from './UndertakingOptions';
import { SessionQueue } from './SessionQueue';
import { HistorySidebar } from './HistorySidebar';
import { PassportData, HistoryItem, QueueItem, UndertakingFormData } from '../types';

interface UploadSectionProps {
  preview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  visaFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleVisaFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleVisaDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  
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
  cancelExtraction: () => void;

  error: string | null;
  history: HistoryItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setHistory: (history: HistoryItem[]) => void;
  loadFromHistory: (item: HistoryItem) => void;
  confirmDelete: (e: React.MouseEvent, id: string) => void;
  onOpenBackup: () => void;
  onOpenRestore: () => void;
}

export function UploadSection(props: UploadSectionProps) {
  const activeItem = props.queue.find(q => q.id === props.activeQueueId) || null;
  const isPdf = activeItem?.file?.type === 'application/pdf' || activeItem?.documentType === 'visa_application';
  const [hoveredSection, setHoveredSection] = React.useState<'passport' | 'pdf' | null>(null);

  return (
    <div className="lg:col-span-5 flex flex-col gap-6 print:hidden lg:max-h-[calc(100vh-130px)] lg:overflow-y-auto overscroll-contain pr-2.5 scrollbar-thin">
      <div className="shrink-0 bg-gradient-to-br from-white/95 to-blue-50/40 dark:from-zinc-900/95 dark:to-zinc-950/40 backdrop-blur-xl p-6 rounded-2xl shadow-[0_12px_40px_rgba(59,130,246,0.04)] border-t-[3px] border-t-blue-500 border-x border-b border-slate-200/80 dark:border-zinc-800/80 transition-all duration-300">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
              <FileText className="w-5 h-5 text-blue-500" />
              Upload Documents
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">Select passport image or submitted Indian Visa application PDF.</p>
          </div>
        </div>
        
        {!props.preview && !isPdf ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
              {/* Passport Dropzone (Blue) */}
              <motion.div 
                layout
                onMouseEnter={() => setHoveredSection('passport')}
                onMouseLeave={() => setHoveredSection(null)}
                animate={{
                  scale: hoveredSection === 'passport' ? 1.025 : hoveredSection === 'pdf' ? 0.97 : 1,
                  filter: hoveredSection === 'pdf' ? 'blur(1px)' : 'blur(0px)',
                  opacity: hoveredSection === 'pdf' ? 0.6 : 1,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                className="relative border-2 border-dashed border-slate-300 dark:border-zinc-700/80 rounded-2xl bg-slate-50/50 dark:bg-black/40 hover:border-blue-400 dark:hover:border-blue-500/50 transition-colors duration-300 group flex flex-col items-center justify-center text-center min-h-[220px] p-6 overflow-hidden cursor-pointer shadow-inner" 
                onClick={() => props.fileInputRef.current?.click()}
              >
                <input 
                   type="file" 
                   ref={props.fileInputRef} 
                   className="hidden" 
                   accept="image/jpeg, image/png, image/webp" 
                   onChange={props.handleFileChange}
                   multiple
                />
                
                {/* Dynamic Glassmorphic Sliding Glow Layer */}
                {hoveredSection === 'passport' && (
                  <motion.div 
                    layoutId="glass-active-panel"
                    className="absolute inset-0 bg-white/35 dark:bg-zinc-900/35 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-zinc-800/50 shadow-[0_12px_36px_rgba(59,130,246,0.1)] pointer-events-none z-0"
                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                  />
                )}
                
                <div className="absolute w-32 h-32 bg-blue-400/5 dark:bg-blue-500/5 rounded-full blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                
                <div className="flex flex-col items-center justify-center p-4 w-full h-full relative z-10">
                  <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-slate-100 dark:border-zinc-800">
                    <UploadCloud className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                  </div>
                  <p className="font-bold text-slate-705 dark:text-zinc-200 text-sm">Upload Passport Photo</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium mt-1">Tap or drag passport image</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-4 bg-slate-150/50 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800 px-3 py-1 rounded-full font-mono">
                    JPEG, PNG, WEBP
                  </p>
                </div>
              </motion.div>

              {/* Visa Application PDF Dropzone (Emerald) */}
              <motion.div 
                layout
                onMouseEnter={() => setHoveredSection('pdf')}
                onMouseLeave={() => setHoveredSection(null)}
                animate={{
                  scale: hoveredSection === 'pdf' ? 1.025 : hoveredSection === 'passport' ? 0.97 : 1,
                  filter: hoveredSection === 'passport' ? 'blur(1px)' : 'blur(0px)',
                  opacity: hoveredSection === 'passport' ? 0.6 : 1,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                className="relative border-2 border-dashed border-slate-300 dark:border-zinc-700/80 rounded-2xl bg-slate-50/50 dark:bg-black/40 hover:border-emerald-450 dark:hover:border-emerald-500/50 transition-colors duration-300 group flex flex-col items-center justify-center text-center min-h-[220px] p-6 overflow-hidden cursor-pointer shadow-inner" 
                onClick={() => props.visaFileInputRef.current?.click()}
                onDragOver={props.handleDragOver}
                onDrop={props.handleVisaDrop}
              >
                <input 
                   type="file" 
                   ref={props.visaFileInputRef} 
                   className="hidden" 
                   accept="application/pdf" 
                   onChange={props.handleVisaFileChange}
                />
                
                {/* Dynamic Glassmorphic Sliding Glow Layer */}
                {hoveredSection === 'pdf' && (
                  <motion.div 
                    layoutId="glass-active-panel"
                    className="absolute inset-0 bg-white/35 dark:bg-zinc-900/35 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-zinc-800/50 shadow-[0_12px_36px_rgba(16,185,129,0.1)] pointer-events-none z-0"
                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                  />
                )}
                
                <div className="absolute w-32 h-32 bg-emerald-400/5 dark:bg-emerald-500/5 rounded-full blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                
                <div className="flex flex-col items-center justify-center p-4 w-full h-full relative z-10">
                  <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-slate-100 dark:border-zinc-800">
                    <FileText className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <p className="font-bold text-slate-705 dark:text-zinc-200 text-sm">Upload BGD Form</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium mt-1">Tap or drag submitted PDF</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-4 bg-emerald-150/50 dark:bg-zinc-900/80 border border-emerald-200/50 dark:border-emerald-800 px-3 py-1 rounded-full font-mono">
                    application/pdf only
                  </p>
                </div>
              </motion.div>
            </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Add more passports button */}
              <div 
                className="border border-dashed border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50/55 dark:bg-black/25 hover:bg-slate-100/60 dark:hover:bg-zinc-850/40 hover:border-blue-405 dark:hover:border-blue-500/30 transition-all duration-300 group flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => props.fileInputRef.current?.click()}
              >
                <input type="file" ref={props.fileInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={props.handleFileChange} multiple />
                <div className="w-9 h-9 bg-white dark:bg-zinc-900 rounded-xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-zinc-800 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">Add passports...</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Select passport image files</p>
                </div>
              </div>

              {/* Add more visa applications button */}
              <div 
                className="border border-dashed border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50/55 dark:bg-black/25 hover:bg-slate-100/60 dark:hover:bg-zinc-850/40 hover:border-emerald-405 dark:hover:border-emerald-500/30 transition-all duration-300 group flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => props.visaFileInputRef.current?.click()}
              >
                <input type="file" ref={props.visaFileInputRef} className="hidden" accept="application/pdf" onChange={props.handleVisaFileChange} />
                <div className="w-9 h-9 bg-white dark:bg-zinc-900 rounded-xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-zinc-800 group-hover:scale-105 transition-transform">
                  <FileText className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">Add visa application PDF...</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Select Indian Visa PDF files</p>
                </div>
              </div>
            </div>

            {/* 2-Column Responsive Layout for Passport Preview and Undertaking Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {/* Left Column: Passport Preview or PDF layout */}
              {isPdf ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-205 dark:border-zinc-800 bg-slate-100 dark:bg-black w-full min-h-[220px] md:h-auto flex flex-col items-center justify-center p-6 shadow-inner text-center">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                    <FileText className="w-10 h-10 text-emerald-500 animate-pulse" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">Indian Visa Application PDF</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs break-all font-mono">
                    {activeItem?.file?.name || 'Submitted_Application.pdf'}
                  </p>
                  <div className="text-[10px] text-emerald-600 dark:text-teal-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 rounded-full font-semibold mt-3">
                    {activeItem?.file?.size ? (activeItem.file.size / (1024 * 1024)).toFixed(2) : '0.00'} MB • PDF Document
                  </div>
                  
                  {props.loading && (
                    <>
                      <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-950/10 pointer-events-none animate-pulse" />
                      <motion.div
                        initial={{ top: 0 }}
                        animate={{ top: "100%" }}
                        transition={{
                          duration: 2.2,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                        className="absolute left-0 right-0 w-full bg-gradient-to-r from-transparent via-emerald-500 via-[50%] to-transparent h-[4px] shadow-[0_0_15px_rgba(16,185,129,0.9)] z-10 opacity-90 pointer-events-none"
                      />
                    </>
                  )}
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 rounded-2xl" />
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-205 dark:border-zinc-800 bg-slate-100 dark:bg-black w-full min-h-[220px] md:h-auto flex items-center justify-center shadow-inner group/preview">
                  {props.preview ? (
                    <img src={props.preview} alt="Passport Preview" className="max-w-full max-h-[350px] md:max-h-[420px] object-contain transition-transform duration-500 group-hover/preview:scale-[1.02]" />
                  ) : (
                    <div className="text-slate-400 text-xs">No preview available</div>
                  )}
                  
                  {props.preview && props.loading && (
                    <>
                      <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-950/10 pointer-events-none animate-pulse" />
                      <motion.div
                        initial={{ top: 0 }}
                        animate={{ top: "100%" }}
                        transition={{
                          duration: 2.2,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                        className="absolute left-0 right-0 w-full bg-gradient-to-r from-transparent via-blue-500 via-[50%] to-transparent h-[4px] shadow-[0_0_15px_rgba(59,130,246,0.9)] z-10 opacity-90 pointer-events-none"
                      />
                    </>
                  )}
                  
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 rounded-2xl" />
                </div>
              )}
              
              {/* Right Column: Undertaking Options */}
              <div className="flex flex-col h-full justify-between">
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
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={props.clearAll}
                disabled={props.loading || props.isBatchProcessing}
                className="slide-btn slide-btn-purple w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-50 min-h-[48px]"
              >
                <span className="relative z-10">Clear All</span>
              </button>
              {!props.data && (
                <div className="w-full sm:flex-[2] flex flex-col gap-2">
                  <button 
                    onClick={props.loading || props.isBatchProcessing ? props.cancelExtraction : props.extractData}
                    disabled={!props.isOnline && !props.loading && !props.isBatchProcessing}
                    className={`slide-btn w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[48px] ${
                      props.loading || props.isBatchProcessing
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40' 
                        : !props.isOnline 
                        ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed border-transparent' 
                        : 'slide-btn-teal'
                    }`}
                  >
                    {props.loading || props.isBatchProcessing ? (
                      <><div className="w-2 h-2 rounded-sm bg-red-600 dark:bg-red-400 relative z-10" /><span className="relative z-10">STOP EXTRACTION</span></>
                    ) : !props.isOnline ? (
                      <><ZapOff className="w-4 h-4 text-red-500 relative z-10" /><span className="relative z-10">Offline: Disabled</span></>
                    ) : (
                      <span className="relative z-10">Extract Active</span>
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
      </div>

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
        cancelExtraction={props.cancelExtraction}
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
      
      <HistorySidebar
        history={props.history}
        searchTerm={props.searchTerm}
        onSearchTermChange={props.setSearchTerm}
        onLoadItem={props.loadFromHistory}
        onConfirmDelete={props.confirmDelete}
        onOpenBackup={props.onOpenBackup}
        onOpenRestore={props.onOpenRestore}
      />
    </div>
  );
}
