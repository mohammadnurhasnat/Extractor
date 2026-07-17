import React from 'react';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';
import { PassportDataTab } from './PassportDataTab';
import { UndertakingFormTab } from './UndertakingFormTab';
import { PassportImagePdfTab } from './PassportImagePdfTab';
import { PadgenApp } from '../padgen/PadgenApp';
import { PassportData, UndertakingFormData, QueueItem } from '../types';

interface ResultsSectionProps {
  data: PassportData | null;
  activeItem: QueueItem | null;
  resultsTab: 'profile' | 'undertaking' | 'passport-pdf' | 'padgen';
  setResultsTab: (tab: 'profile' | 'undertaking' | 'passport-pdf' | 'padgen') => void;
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
  currentUser
}: ResultsSectionProps) {
  // If there's data, active item, or active padgen tab, show the results card
  const hasContent = !!data || !!activeItem || resultsTab === 'padgen';

  return (
    <div className="lg:col-span-7 print:w-full print:col-span-12 lg:max-h-[calc(100vh-130px)] lg:overflow-y-auto overscroll-contain pr-1.5 scrollbar-thin">
      {hasContent ? (
        <div id="printable-results-card" className="bg-gradient-to-br from-white/95 to-emerald-50/40 dark:from-zinc-900/95 dark:to-zinc-950/40 backdrop-blur-md p-3 sm:p-6 rounded-2xl shadow-[0_12px_40px_rgba(16,185,129,0.04)] border-t-[3px] border-t-emerald-500 border-x border-b border-slate-200/80 dark:border-zinc-800/60 transition-all sticky top-6 print:relative print:top-0 print:border-none print:shadow-none print:bg-transparent print:p-0 print:m-0 w-full min-h-[500px]">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* PRINT-ONLY PROFESSIONAL HEADER/LETTERHEAD */}
            {resultsTab === 'profile' && data && (
              <div className="hidden print:block mb-8 border-b-2 border-[#0C8493] pb-4">
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

            {/* TABS SELECTOR */}
            {(data && isUndertakingConfigured && undertakingData) || activeItem || resultsTab === 'padgen' ? (
              <div className="flex flex-col sm:flex-row bg-slate-100/60 dark:bg-zinc-950/65 p-2 rounded-2xl mb-3 print:hidden gap-2 w-full text-center items-stretch">
                {data && (
                  <button
                    onClick={() => setResultsTab('profile')}
                    className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-extrabold cursor-pointer transition-colors border min-h-[40px] ${
                      resultsTab === 'profile'
                        ? 'bg-[#FFD700] text-black shadow-lg font-black border-[#FFD700]'
                        : 'bg-[#00FA9A] text-black border-transparent hover:bg-[#00e08a]'
                     }`}
                  >
                    <span className="relative z-10">Passport Profile</span>
                  </button>
                )}
                {data && isUndertakingConfigured && undertakingData && activeItem?.documentType !== 'visa_application' && (
                  <button
                    onClick={() => setResultsTab('undertaking')}
                    className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-extrabold cursor-pointer transition-colors border min-h-[40px] ${
                      resultsTab === 'undertaking'
                        ? 'bg-[#FFD700] text-black shadow-lg font-black border-[#FFD700]'
                        : 'bg-[#00FA9A] text-black border-transparent hover:bg-[#00e08a]'
                     }`}
                  >
                    <span className="relative z-10">Undertaking Form</span>
                  </button>
                )}
                {activeItem && activeItem?.documentType !== 'visa_application' && (
                  <button
                    onClick={() => setResultsTab('passport-pdf')}
                    className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-extrabold cursor-pointer transition-colors border min-h-[40px] ${
                      resultsTab === 'passport-pdf'
                        ? 'bg-[#FFD700] text-black shadow-lg font-black border-[#FFD700]'
                        : 'bg-[#00FA9A] text-black border-transparent hover:bg-[#00e08a]'
                     }`}
                  >
                    <span className="relative z-10">Image to PDF</span>
                  </button>
                )}
                {(data || resultsTab === 'padgen') && (
                  <button
                    onClick={() => setResultsTab('padgen')}
                    className={`flex-[1.4] text-center py-2 px-6 sm:px-8 rounded-lg text-xs font-black cursor-pointer transition-all border min-h-[40px] ${
                      resultsTab === 'padgen'
                        ? 'slide-btn slide-btn-coral text-white shadow-lg font-black scale-102 border-rose-600'
                        : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 hover:bg-rose-200/80 transition-colors duration-150'
                     }`}
                  >
                    <span className="relative z-10">Card & Letter Head</span>
                  </button>
                )}
              </div>
            ) : null}

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
            ) : null}
          </motion.div>
        </div>
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
