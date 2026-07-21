import React from 'react';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';
import { PassportDataTab } from './PassportDataTab';
import { UndertakingFormTab } from './UndertakingFormTab';
import { PassportImagePdfTab } from './PassportImagePdfTab';
import { PadgenApp } from '../padgen/PadgenApp';
import { CoverLetterTab } from './CoverLetterTab';
import { PassportData, UndertakingFormData, QueueItem } from '../types';

interface ResultsSectionProps {
  data: PassportData | null;
  activeItem: QueueItem | null;
  resultsTab: 'profile' | 'undertaking' | 'passport-pdf' | 'padgen' | 'cover-letter';
  setResultsTab: (tab: 'profile' | 'undertaking' | 'passport-pdf' | 'padgen' | 'cover-letter') => void;
  isUndertakingConfigured: boolean;
  undertakingData: UndertakingFormData | null;
  updateDataField: (field: keyof PassportData, value: string) => void;
  handleCopyAll: () => void;
  handleDownloadText: () => void;
  handleDownloadPDF: () => void;
  isCopied: boolean;
  isUndertakingEditable: boolean;
  setIsUndertakingEditable: (editable: boolean) => void;
  handleUpdateUndertakingField: (field: keyof UndertakingFormData, value: string) => void;
  handleDownloadUndertaking: () => void;
  handleDownloadJSON: () => void;
  isGeneratingAddresses?: boolean;
  onGenerateAddresses?: () => void;
  utPurpose?: string;
  onOpenRefHelper?: () => void;
  currentUser?: any;
  onShare?: () => void;
  isSharing?: boolean;
}

export function ResultsSection({
  data,
  activeItem,
  resultsTab,
  setResultsTab,
  isUndertakingConfigured,
  undertakingData,
  updateDataField,
  handleCopyAll,
  handleDownloadText,
  handleDownloadPDF,
  isCopied,
  isUndertakingEditable,
  setIsUndertakingEditable,
  handleUpdateUndertakingField,
  handleDownloadUndertaking,
  handleDownloadJSON,
  isGeneratingAddresses,
  onGenerateAddresses,
  utPurpose,
  onOpenRefHelper,
  currentUser,
  onShare,
  isSharing = false
}: ResultsSectionProps) {
  // If there's data, active item, or active padgen tab, show the results card
  const hasContent = !!data || !!activeItem || resultsTab === 'padgen';

  return (
    <div className="lg:col-span-7 print:w-full print:col-span-12 h-[calc(100vh-140px)] lg:h-[calc(100vh-130px)] flex flex-col pr-1.5 scrollbar-none">
      {hasContent ? (
        <motion.div 
          id="printable-results-card" 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="bg-gradient-to-br from-white/95 to-emerald-50/40 dark:from-zinc-900/95 dark:to-zinc-950/40 backdrop-blur-md p-3 sm:p-5 rounded-2xl shadow-[0_12px_40px_rgba(16,185,129,0.04)] border-t-[3px] border-t-emerald-500 border-x border-b border-slate-200/80 dark:border-zinc-800/60 sticky top-6 print:relative print:top-0 print:border-none print:shadow-none print:bg-transparent print:p-0 print:m-0 w-full h-full flex flex-col overflow-hidden min-h-[500px]"
        >
          <div className="w-full h-full flex flex-col overflow-hidden">
            {/* PRINT-ONLY PROFESSIONAL HEADER/LETTERHEAD */}
            {resultsTab === 'profile' && data && (
              <div className="hidden print:block mb-8 border-b-2 border-[#0C8493] pb-4 shrink-0">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-black text-[#0C8493]">PASSPORT DATA EXTRACTION REPORT</h1>
                    <p className="text-[#FF8006] text-xs font-bold mt-1 uppercase tracking-wider">Smart Automated Identity Processor</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">Date Printed: {new Date().toLocaleDateString('en-GB')}</p>
                    <p className="text-xs text-slate-500 font-medium">Status: <span className="text-emerald-600 font-semibold">Verified Extract</span></p>
                  </div>
                </div>
              </div>
            )}

            {/* TABS SELECTOR (STATIONARY AT THE TOP) */}
            {(data && isUndertakingConfigured && undertakingData) || activeItem || resultsTab === 'padgen' ? (
              <div className="flex flex-wrap md:flex-nowrap bg-slate-100/60 dark:bg-zinc-950/65 p-1.5 rounded-2xl mb-3 print:hidden gap-1.5 w-full items-center shrink-0">
                {data && (
                  <button
                    onClick={() => setResultsTab('profile')}
                    className={`flex-1 min-w-[45%] md:min-w-0 text-center py-2 px-3 rounded-lg text-xs font-extrabold cursor-pointer border min-h-[40px] transition-all duration-200 hover:bg-white/40 dark:hover:bg-white/25 hover:text-black dark:hover:text-black hover:backdrop-blur-md hover:border-slate-300/80 hover:shadow-md ${
                      resultsTab === 'profile'
                        ? 'bg-[#0C8493] text-white shadow-md border-[#0C8493]'
                        : 'bg-slate-200/40 dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-400 border-slate-300/30 dark:border-zinc-800/40'
                     }`}
                  >
                    <span className="relative z-10">Passport Profile</span>
                  </button>
                )}
                {data && isUndertakingConfigured && undertakingData && activeItem?.documentType !== 'visa_application' && (
                  <button
                    onClick={() => setResultsTab('undertaking')}
                    className={`flex-1 min-w-[45%] md:min-w-0 text-center py-2 px-3 rounded-lg text-xs font-extrabold cursor-pointer border min-h-[40px] transition-all duration-200 hover:bg-white/40 dark:hover:bg-white/25 hover:text-black dark:hover:text-black hover:backdrop-blur-md hover:border-slate-300/80 hover:shadow-md ${
                      resultsTab === 'undertaking'
                        ? 'bg-[#0C8493] text-white shadow-md border-[#0C8493]'
                        : 'bg-slate-200/40 dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-400 border-slate-300/30 dark:border-zinc-800/40'
                     }`}
                  >
                    <span className="relative z-10">Undertaking Form</span>
                  </button>
                )}
                {activeItem && activeItem?.documentType !== 'visa_application' && (
                  <button
                    onClick={() => setResultsTab('passport-pdf')}
                    className={`flex-1 min-w-[45%] md:min-w-0 text-center py-2 px-3 rounded-lg text-xs font-extrabold cursor-pointer border min-h-[40px] transition-all duration-200 hover:bg-white/40 dark:hover:bg-white/25 hover:text-black dark:hover:text-black hover:backdrop-blur-md hover:border-slate-300/80 hover:shadow-md ${
                      resultsTab === 'passport-pdf'
                        ? 'bg-[#0C8493] text-white shadow-md border-[#0C8493]'
                        : 'bg-slate-200/40 dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-400 border-slate-300/30 dark:border-zinc-800/40'
                     }`}
                  >
                    <span className="relative z-10">Image to PDF</span>
                  </button>
                )}
                {(data || resultsTab === 'padgen') && (
                  <button
                    onClick={() => setResultsTab('padgen')}
                    className={`flex-1 min-w-[45%] md:min-w-0 text-center py-2 px-3 rounded-lg text-xs font-extrabold cursor-pointer border min-h-[40px] transition-all duration-200 hover:bg-white/40 dark:hover:bg-white/25 hover:text-black dark:hover:text-black hover:backdrop-blur-md hover:border-slate-300/80 hover:shadow-md ${
                      resultsTab === 'padgen'
                        ? 'bg-[#0C8493] text-white shadow-md border-[#0C8493]'
                        : 'bg-slate-200/40 dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-400 border-slate-300/30 dark:border-zinc-800/40'
                     }`}
                  >
                    <span className="relative z-10">Pad & Card</span>
                  </button>
                )}
                {data && (
                  <button
                    onClick={() => setResultsTab('cover-letter')}
                    className={`flex-1 min-w-[45%] md:min-w-0 text-center py-2 px-3 rounded-lg text-xs font-extrabold cursor-pointer border min-h-[40px] transition-all duration-200 hover:bg-white/40 dark:hover:bg-white/25 hover:text-black dark:hover:text-black hover:backdrop-blur-md hover:border-slate-300/80 hover:shadow-md ${
                      resultsTab === 'cover-letter'
                        ? 'bg-[#0C8493] text-white shadow-md border-[#0C8493]'
                        : 'bg-slate-200/40 dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-400 border-slate-300/30 dark:border-zinc-800/40'
                     }`}
                  >
                    <span className="relative z-10">Cover Letter</span>
                  </button>
                )}
              </div>
            ) : null}

            {/* INDEPENDENTLY SCROLLABLE ACTIVE TAB CONTENT AREA */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700 hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-zinc-600 print:overflow-visible">
              {resultsTab === 'profile' && data ? (
                <PassportDataTab
                  data={data}
                  updateDataField={updateDataField}
                  handleCopyAll={handleCopyAll}
                  handleDownloadText={handleDownloadText}
                  handleDownloadPDF={handleDownloadPDF}
                  handleDownloadJSON={handleDownloadJSON}
                  isCopied={isCopied}
                  isGeneratingAddresses={isGeneratingAddresses}
                  onGenerateAddresses={onGenerateAddresses}
                  utPurpose={utPurpose}
                  onOpenRefHelper={onOpenRefHelper}
                  onShare={onShare}
                  isSharing={isSharing}
                />
              ) : resultsTab === 'undertaking' && data && undertakingData ? (
                <UndertakingFormTab
                  undertakingData={undertakingData}
                  isUndertakingEditable={isUndertakingEditable}
                  setIsUndertakingEditable={setIsUndertakingEditable}
                  handleUpdateUndertakingField={handleUpdateUndertakingField}
                  handleDownloadUndertaking={handleDownloadUndertaking}
                />
              ) : resultsTab === 'passport-pdf' && activeItem ? (
                <PassportImagePdfTab activeItem={activeItem} currentUser={currentUser} />
              ) : resultsTab === 'padgen' ? (
                <PadgenApp />
              ) : resultsTab === 'cover-letter' && data ? (
                <CoverLetterTab data={data} utPurpose={utPurpose} updateDataField={updateDataField} />
              ) : null}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800/80 border-dashed rounded-2xl h-[500px] flex flex-col items-center justify-center text-center p-8 sticky top-6 shadow-sm overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent opacity-50 z-0"></div>
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="z-10 flex flex-col items-center"
          >
            <div className="relative mb-8 group-hover:scale-105 transition-transform duration-500">
              <div className="absolute -inset-4 bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-800/40 rounded-2xl transform rotate-6 scale-105 shadow-inner"></div>
              <div className="w-24 h-24 bg-white dark:bg-zinc-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center border border-slate-100 dark:border-zinc-700 relative z-10 transform -rotate-3 transition-transform duration-500 group-hover:-rotate-6">
                <FileText className="w-10 h-10 text-blue-500 dark:text-blue-400 drop-shadow-sm" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-2.5 font-sans tracking-tight">Ready for Extraction</h3>
            
            <p className="text-[13px] text-slate-500 dark:text-zinc-400 max-w-[280px] leading-relaxed font-medium">
              Upload a passport image on the left and click <span className="inline-flex items-center justify-center font-black text-white bg-[#e05e38] dark:bg-[#d95c37] px-2 py-0.5 rounded-[6px] border border-[#c24622] dark:border-[#9a3412] shadow-[0_2.5px_0_0_#9a3412] dark:shadow-[0_2.5px_0_0_#5f1a04] mx-1 text-[11px] transform -translate-y-[1px]">Process</span> to see the magically extracted data appear right here.
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
