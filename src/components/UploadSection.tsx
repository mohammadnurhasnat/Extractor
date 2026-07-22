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
  handleDrop: (e: React.DragEvent) => void;
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
  activeData?: PassportData | null;
  confirmDelete: (e: React.MouseEvent, id: string) => void;
  onOpenBackup: () => void;
  onOpenRestore: () => void;
}

export function UploadSection(props: UploadSectionProps) {
  const activeItem = props.queue.find(q => q.id === props.activeQueueId) || null;
  const isPdf = activeItem?.file?.type === 'application/pdf' || activeItem?.documentType === 'visa_application';
  const [hoveredSection, setHoveredSection] = React.useState<'passport' | 'pdf' | null>(null);

  // States to handle responsive drag-over animations and highlight styles
  const [dragActivePassport, setDragActivePassport] = React.useState(false);
  const [dragActivePdf, setDragActivePdf] = React.useState(false);
  const [dragActiveAddPassport, setDragActiveAddPassport] = React.useState(false);
  const [dragActiveAddPdf, setDragActiveAddPdf] = React.useState(false);
  const [dragActivePreview, setDragActivePreview] = React.useState(false);

  return (
    <div className="lg:col-span-5 flex flex-col gap-6 print:hidden lg:max-h-[calc(100vh-130px)] lg:overflow-y-auto overscroll-contain pr-2.5 scrollbar-thin">
      <div className="shrink-0 bg-gradient-to-br from-white/95 to-blue-50/40 dark:from-zinc-900/95 dark:to-zinc-950/40 backdrop-blur-xl p-3.5 sm:p-6 rounded-2xl shadow-[0_12px_40px_rgba(59,130,246,0.04)] border-t-[3px] border-t-blue-500 border-x border-b border-slate-200/80 dark:border-zinc-800/80 transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              Upload Documents
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">Select passport image or submitted Indian Visa application PDF.</p>
          </div>
        </div>
        
        {!props.preview && !isPdf ? (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 relative">
              {/* Passport Dropzone (Matte Slate) */}
              <motion.div 
                layout
                onMouseEnter={() => setHoveredSection('passport')}
                onMouseLeave={() => setHoveredSection(null)}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActivePassport(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActivePassport(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActivePassport(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActivePassport(false);
                  props.handleDrop(e);
                }}
                animate={{
                  scale: dragActivePassport ? 1.04 : hoveredSection === 'passport' ? 1.025 : hoveredSection === 'pdf' ? 0.98 : 1,
                  borderColor: dragActivePassport ? '#3b82f6' : '#93c5fd',
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                className={`retro-dropzone group flex flex-col items-center justify-center text-center min-h-[135px] sm:min-h-[190px] p-2.5 sm:p-5 cursor-pointer relative bg-gradient-to-br from-blue-50/85 to-indigo-50/40 dark:from-blue-950/20 dark:to-slate-900/40 border-2 border-blue-200 dark:border-blue-800/60 rounded-2xl sm:rounded-3xl shadow-[0_10px_25px_rgba(59,130,246,0.08)] dark:shadow-[0_10px_30px_rgba(29,78,216,0.15)] hover:shadow-[0_15px_35px_rgba(59,130,246,0.18)] dark:hover:shadow-[0_15px_40px_rgba(29,78,216,0.25)] transition-all duration-300 ${
                  dragActivePassport ? 'ring-4 ring-blue-400/20 border-blue-500 shadow-[0_15px_35px_rgba(59,130,246,0.25)]' : ''
                }`} 
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
                
                {/* Premium Glassmorphic Overlay triggered when the adjacent section is hovered */}
                <div className={`glass-overlay-shield ${hoveredSection === 'pdf' ? 'active' : ''}`} />
                
                <div className="flex flex-col items-center justify-center p-1 sm:p-3 w-full h-full relative z-10">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-blue-100 dark:border-blue-800/80 shadow-[0_4px_12px_rgba(59,130,246,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                    <UploadCloud className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="font-extrabold text-blue-950 dark:text-blue-50 text-xs sm:text-sm leading-tight">Upload Passport</p>
                  <p className="text-[10px] sm:text-xs text-blue-700/70 dark:text-blue-300/70 font-bold mt-1 hidden sm:block">Tap or drag passport image</p>
                  <p className="text-[9px] sm:text-[10px] text-blue-700 dark:text-blue-300 mt-2 sm:mt-3 bg-blue-100/60 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full font-mono font-bold shadow-sm">
                    JPEG, PNG, WEBP
                  </p>
                </div>

                {/* Drag Active Beautiful Overlay */}
                <AnimatePresence>
                  {dragActivePassport && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 bg-slate-200/95 dark:bg-zinc-900/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-2 rounded-[14px] border-2 border-dashed border-slate-500"
                    >
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-12 h-12 bg-slate-600 text-white rounded-full flex items-center justify-center shadow-lg mb-2"
                      >
                        <UploadCloud className="w-6 h-6" />
                      </motion.div>
                      <p className="font-black text-slate-700 dark:text-slate-300 text-xs sm:text-base">এখানে ছেড়ে দিন!</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-300 font-bold mt-0.5">পাসপোর্ট ফটো ড্রপ করুন</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Visa Application PDF Dropzone (Matte Zinc) */}
              <motion.div 
                layout
                onMouseEnter={() => setHoveredSection('pdf')}
                onMouseLeave={() => setHoveredSection(null)}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActivePdf(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActivePdf(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActivePdf(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActivePdf(false);
                  props.handleVisaDrop(e);
                }}
                animate={{
                  scale: dragActivePdf ? 1.04 : hoveredSection === 'pdf' ? 1.025 : hoveredSection === 'passport' ? 0.98 : 1,
                  borderColor: dragActivePdf ? '#10b981' : '#a7f3d0',
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                className={`retro-dropzone group flex flex-col items-center justify-center text-center min-h-[135px] sm:min-h-[190px] p-2.5 sm:p-5 cursor-pointer relative bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/20 dark:to-zinc-900/40 border-2 border-emerald-200 dark:border-emerald-800/60 rounded-2xl sm:rounded-3xl shadow-[0_10px_25px_rgba(16,185,129,0.08)] dark:shadow-[0_10px_30px_rgba(4,120,87,0.15)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.18)] dark:hover:shadow-[0_15px_40px_rgba(4,120,87,0.25)] transition-all duration-300 ${
                  dragActivePdf ? 'ring-4 ring-emerald-400/20 border-emerald-500 shadow-[0_15px_35px_rgba(16,185,129,0.25)]' : ''
                }`} 
                onClick={() => props.visaFileInputRef.current?.click()}
              >
                <input 
                   type="file" 
                   ref={props.visaFileInputRef} 
                   className="hidden" 
                   accept="application/pdf" 
                   onChange={props.handleVisaFileChange}
                />
                
                {/* Premium Glassmorphic Overlay triggered when the adjacent section is hovered */}
                <div className={`glass-overlay-shield ${hoveredSection === 'passport' ? 'active' : ''}`} />
                
                <div className="flex flex-col items-center justify-center p-1 sm:p-3 w-full h-full relative z-10">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-emerald-100 dark:border-emerald-800/80 shadow-[0_4px_12px_rgba(16,185,129,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                    <FileText className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="font-extrabold text-emerald-950 dark:text-emerald-50 text-xs sm:text-sm leading-tight">Upload BGD Form</p>
                  <p className="text-[10px] sm:text-xs text-emerald-700/70 dark:text-emerald-300/70 font-bold mt-1 hidden sm:block">Tap or drag submitted PDF</p>
                  <p className="text-[9px] sm:text-[10px] text-emerald-700 dark:text-emerald-300 mt-2 sm:mt-3 bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full font-mono font-bold shadow-sm">
                    PDF format only
                  </p>
                </div>

                {/* Drag Active Beautiful Overlay */}
                <AnimatePresence>
                  {dragActivePdf && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 bg-zinc-200/95 dark:bg-zinc-900/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-2 rounded-[14px] border-2 border-dashed border-zinc-500"
                    >
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-12 h-12 bg-zinc-600 text-white rounded-full flex items-center justify-center shadow-lg mb-2"
                      >
                        <FileText className="w-6 h-6" />
                      </motion.div>
                      <p className="font-black text-zinc-700 dark:text-zinc-300 text-xs sm:text-base">এখানে ছেড়ে দিন!</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-300 font-bold mt-0.5">BGD ফর্ম পিডিএফ ড্রপ করুন</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Add more passports button */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`border border-dashed rounded-xl transition-all duration-300 group flex items-center gap-3 p-3 cursor-pointer relative ${
                  dragActiveAddPassport 
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-sm' 
                    : 'border-slate-205 dark:border-zinc-800 bg-slate-50/55 dark:bg-black/25 hover:bg-slate-100/60 dark:hover:bg-zinc-850/40 hover:border-blue-405 dark:hover:border-blue-500/30'
                }`}
                onClick={() => props.fileInputRef.current?.click()}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveAddPassport(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveAddPassport(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveAddPassport(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActiveAddPassport(false);
                  props.handleDrop(e);
                }}
              >
                <input type="file" ref={props.fileInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={props.handleFileChange} multiple />
                <div className="w-9 h-9 bg-white dark:bg-zinc-900 rounded-xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-zinc-800 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">Add passports...</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Select passport image files</p>
                </div>
                
                {/* Micro drag overlay */}
                {dragActiveAddPassport && (
                  <div className="absolute inset-0 bg-blue-50/90 dark:bg-zinc-900/90 backdrop-blur-xs rounded-xl flex items-center justify-center z-20">
                    <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 animate-pulse flex items-center gap-1">
                      <UploadCloud className="w-3.5 h-3.5" /> পাসপোর্ট এখানে ড্রপ করুন
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Add more visa applications button */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`border border-dashed rounded-xl transition-all duration-300 group flex items-center gap-3 p-3 cursor-pointer relative ${
                  dragActiveAddPdf 
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 shadow-sm' 
                    : 'border-slate-205 dark:border-zinc-800 bg-slate-50/55 dark:bg-black/25 hover:bg-slate-100/60 dark:hover:bg-zinc-850/40 hover:border-emerald-405 dark:hover:border-emerald-500/30'
                }`}
                onClick={() => props.visaFileInputRef.current?.click()}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveAddPdf(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveAddPdf(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveAddPdf(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActiveAddPdf(false);
                  props.handleVisaDrop(e);
                }}
              >
                <input type="file" ref={props.visaFileInputRef} className="hidden" accept="application/pdf" onChange={props.handleVisaFileChange} />
                <div className="w-9 h-9 bg-white dark:bg-zinc-900 rounded-xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-zinc-800 group-hover:scale-105 transition-transform">
                  <FileText className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">Add visa application PDF...</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Select Indian Visa PDF files</p>
                </div>

                {/* Micro drag overlay */}
                {dragActiveAddPdf && (
                  <div className="absolute inset-0 bg-emerald-50/90 dark:bg-zinc-900/90 backdrop-blur-xs rounded-xl flex items-center justify-center z-20">
                    <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 animate-pulse flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> PDF এখানে ড্রপ করুন
                    </p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* 2-Column Responsive Layout for Passport Preview and Undertaking Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {/* Left Column: Passport Preview or PDF layout */}
              {isPdf ? (
                <div 
                  className={`relative rounded-2xl overflow-hidden border bg-slate-100 dark:bg-black w-full min-h-[220px] md:h-auto flex flex-col items-center justify-center p-6 shadow-inner text-center cursor-pointer transition-all duration-300 ${
                    dragActivePreview 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 scale-[1.01]' 
                      : 'border-slate-205 dark:border-zinc-800'
                  }`}
                  onClick={() => props.visaFileInputRef.current?.click()}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActivePreview(true); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActivePreview(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActivePreview(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActivePreview(false);
                    props.handleVisaDrop(e);
                  }}
                >
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

                  {/* Drag drop preview replace overlay */}
                  <AnimatePresence>
                    {dragActivePreview && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-emerald-50/95 dark:bg-zinc-950/95 backdrop-blur-xs z-20 flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-emerald-500"
                      >
                        <FileText className="w-12 h-12 text-emerald-500 animate-bounce mb-2" />
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">নতুন PDF এখানে ড্রপ করুন</p>
                        <p className="text-[10px] text-emerald-500/80 font-bold mt-1">ফাইলটি পরিবর্তন করতে ছেড়ে দিন</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div 
                  className={`relative rounded-2xl overflow-hidden border bg-slate-100 dark:bg-black w-full min-h-[220px] md:h-auto flex items-center justify-center shadow-inner group/preview cursor-pointer transition-all duration-300 ${
                    dragActivePreview 
                      ? 'border-blue-500 ring-2 ring-blue-500/20 scale-[1.01]' 
                      : 'border-slate-205 dark:border-zinc-800'
                  }`}
                  onClick={() => props.fileInputRef.current?.click()}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActivePreview(true); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActivePreview(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActivePreview(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActivePreview(false);
                    props.handleDrop(e);
                  }}
                >
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

                  {/* Drag drop preview replace overlay */}
                  <AnimatePresence>
                    {dragActivePreview && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-blue-50/95 dark:bg-zinc-950/95 backdrop-blur-xs z-20 flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-blue-500"
                      >
                        <UploadCloud className="w-12 h-12 text-blue-500 animate-bounce mb-2" />
                        <p className="text-sm font-black text-blue-600 dark:text-blue-400">নতুন পাসপোর্ট ফটো এখানে ড্রপ করুন</p>
                        <p className="text-[10px] text-blue-500/80 font-bold mt-1">ফাইলটি পরিবর্তন করতে ছেড়ে দিন</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 rounded-2xl" />
                </div>
              )}
              
              {/* Right Column: Undertaking Options */}
              <div className="flex flex-col h-full justify-between">
                {!isPdf && (
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
                )}
              </div>

            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={props.clearAll}
                disabled={props.loading || props.isBatchProcessing}
                className="slide-btn slide-btn-purple w-full sm:flex-1 py-3 px-4 rounded-full font-bold text-sm cursor-pointer disabled:opacity-50 min-h-[48px]"
              >
                <span className="relative z-10">Clear All</span>
              </button>
              {!props.data && (
                <div className="w-full sm:flex-[2] flex flex-col gap-2">
                  <button 
                    onClick={props.loading || props.isBatchProcessing ? props.cancelExtraction : props.extractData}
                    disabled={!props.isOnline && !props.loading && !props.isBatchProcessing}
                    className={`slide-btn w-full py-3 px-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[48px] ${
                      props.loading || props.isBatchProcessing
                        ? 'bg-red-500 hover:bg-red-600 text-white border-red-700 shadow-[0_4.5px_0_0_#991b1b]' 
                        : !props.isOnline 
                        ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed border-transparent shadow-none' 
                        : 'slide-btn-orange'
                    }`}
                  >
                    {props.loading || props.isBatchProcessing ? (
                      <><div className="w-2.5 h-2.5 rounded-full bg-white relative z-10 animate-ping" /><span className="relative z-10 font-extrabold">STOP EXTRACTION</span></>
                    ) : !props.isOnline ? (
                      <><ZapOff className="w-4 h-4 text-red-500 relative z-10" /><span className="relative z-10">Offline: Disabled</span></>
                    ) : (
                      <span className="relative z-10 font-extrabold text-white">Extract Active</span>
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
        activeData={props.activeData}
        onConfirmDelete={props.confirmDelete}
        onOpenBackup={props.onOpenBackup}
        onOpenRestore={props.onOpenRestore}
      />
    </div>
  );
}
