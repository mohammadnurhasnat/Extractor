import React from 'react';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';
import { PassportDataTab } from './PassportDataTab';
import { UndertakingFormTab } from './UndertakingFormTab';
import { PassportImagePdfTab } from './PassportImagePdfTab';
import { PassportData, UndertakingFormData, QueueItem } from '../types';

interface ResultsSectionProps {
  data: PassportData | null;
  activeItem: QueueItem | null;
  resultsTab: 'profile' | 'undertaking' | 'passport-pdf';
  setResultsTab: (tab: 'profile' | 'undertaking' | 'passport-pdf') => void;
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
  isGeneratingAddresses?: boolean;
  onGenerateAddresses?: () => void;
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
  isGeneratingAddresses,
  onGenerateAddresses
}: ResultsSectionProps) {
  // If there's an active item but no data yet, user might want to just download PDF
  const hasContent = !!data || !!activeItem;

  return (
    <div className="lg:col-span-7 print:w-full print:col-span-12">
      {hasContent ? (
        <div id="printable-results-card" className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-zinc-800/60 transition-all sticky top-6 print:relative print:top-0 print:border-none print:shadow-none print:bg-transparent print:p-0 print:m-0 w-full min-h-[500px]">
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
                    <p className="text-xs text-[#FF8006] font-bold mt-1 uppercase tracking-wider">Smart Automated Identity Processor</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">Date Printed: {new Date().toLocaleDateString('en-GB')}</p>
                    <p className="text-xs text-slate-500 font-medium">Status: <span className="text-emerald-600 font-semibold">Verified Extract</span></p>
                  </div>
                </div>
              </div>
            )}

            {/* TABS SELECTOR */}
            {(data && isUndertakingConfigured && undertakingData) || activeItem ? (
              <div className="flex border-b border-slate-100 dark:border-zinc-800/50 mb-6 print:hidden overflow-x-auto whitespace-nowrap">
                {data && (
                  <button
                    onClick={() => setResultsTab('profile')}
                    className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                      resultsTab === 'profile'
                        ? 'border-[#0C8493] text-[#0C8493]'
                        : 'border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-400'
                    }`}
                  >
                    Passport Profile
                  </button>
                )}
                {data && isUndertakingConfigured && undertakingData && (
                  <button
                    onClick={() => setResultsTab('undertaking')}
                    className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                      resultsTab === 'undertaking'
                        ? 'border-[#0C8493] text-[#0C8493]'
                        : 'border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-400'
                    }`}
                  >
                    Undertaking Form
                  </button>
                )}
                {activeItem && activeItem.file && activeItem.file.size > 0 && (
                  <button
                    onClick={() => setResultsTab('passport-pdf')}
                    className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                      resultsTab === 'passport-pdf' || (!data && resultsTab !== 'passport-pdf')
                        ? 'border-[#0C8493] text-[#0C8493]'
                        : 'border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-400'
                    }`}
                  >
                    Passport PDF
                  </button>
                )}
              </div>
            ) : null}

            {!data && activeItem && activeItem.file && activeItem.file.size > 0 ? (
              <PassportImagePdfTab activeItem={activeItem} />
            ) : resultsTab === 'profile' && data ? (
              <PassportDataTab
                data={data}
                updateDataField={updateDataField}
                handleCopyAll={handleCopyAll}
                handleDownloadText={handleDownloadText}
                handleDownloadPDF={handleDownloadPDF}
                isCopied={isCopied}
                isGeneratingAddresses={isGeneratingAddresses}
                onGenerateAddresses={onGenerateAddresses}
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
              <PassportImagePdfTab activeItem={activeItem} />
            ) : null}
          </motion.div>
        </div>
      ) : (
        <div className="bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 border-dashed rounded-2xl h-[500px] flex flex-col items-center justify-center text-center p-8 sticky top-6">
          <FileText className="w-16 h-16 text-slate-200 dark:text-zinc-700 mb-4" />
          <p className="text-lg font-medium text-slate-500 dark:text-zinc-400">No Data Extracted Yet</p>
          <p className="text-sm text-slate-400 dark:text-zinc-500 mt-2 max-w-sm">Upload a passport image on the left and click "Extract Data" to see the extracted fields here.</p>
        </div>
      )}
    </div>
  );
}
